"""Main application orchestration with all components."""

import platform
import signal
import sys
import logging
import os
from typing import Optional, List
from .config import load_config
from .logging_utils import setup_logging
from .storage.db import Database
from .analysis.engine import RuleEngine
from .events import SecurityEvent
from .log_reader import MultiLogReader, get_available_log_files
from .parsing.linux_parser import LinuxParser

logger = logging.getLogger("security_logger.main")


class SecurityLogger:
    """Main application orchestrator with real-time log monitoring."""
    
    def __init__(self, config_path: str = "config.yaml"):
        self.config = load_config(config_path)
        
        log_level = self.config.get('logging.level', 'INFO')
        setup_logging(log_level)
        
        db_path = self.config.get('database.path', './security_events.db')
        self.database = Database(db_path)
        
        self.rule_engine = RuleEngine(self.database, self.config.data)
        
        self.log_reader = MultiLogReader(self._handle_log_line)
        
        self.use_mock_data = self.config.get('use_mock_data', False)
        
        self._init_log_sources()
    
    def _init_log_sources(self):
        """Initialize log sources based on configuration."""
        os_name = platform.system()
        logger.info(f"Detected OS: {os_name}")
        
        if self.use_mock_data:
            logger.info("Mock data mode enabled - not monitoring real log files")
            return
        
        if os_name == "Linux":
            self._init_linux_sources()
        elif os_name == "Windows":
            logger.info("Windows log monitoring not yet implemented")
        elif os_name == "Darwin":
            logger.info("macOS log monitoring not yet implemented")
        else:
            logger.warning(f"Unsupported OS: {os_name}")
    
    def _init_linux_sources(self):
        """Initialize Linux log sources."""
        linux_config = self.config.get('log_sources.linux', {})
        
        if not linux_config.get('enabled', True):
            logger.info("Linux log sources disabled in config")
            return
        
        configured_files = linux_config.get('files', [])
        
        if configured_files:
            for file_config in configured_files:
                path = file_config.get('path')
                log_type = file_config.get('type', 'auth')
                
                if path and os.path.exists(path):
                    if self.log_reader.add_log_file(path, log_type):
                        logger.info(f"Added configured log source: {path} ({log_type})")
                    else:
                        logger.warning(f"Could not add log source: {path}")
                elif path:
                    logger.warning(f"Configured log file not found: {path}")
        
        available = get_available_log_files()
        configured_paths = {f.get('path') for f in configured_files if f.get('path')}
        
        for path, log_type in available.items():
            if path not in configured_paths:
                if self.log_reader.add_log_file(path, log_type):
                    logger.info(f"Auto-discovered log source: {path} ({log_type})")
        
        status = self.log_reader.get_status()
        if not status:
            logger.warning("No log files could be monitored. Check file permissions.")
            logger.warning("Try running with sudo or adjust log file permissions.")
    
    def _handle_log_line(self, line: str, log_source: str):
        """Handle a new log line from any source."""
        try:
            event = LinuxParser.parse_line(line, log_source)
            
            if event:
                event_id = self.database.insert_event(event)
                event.id = event_id
                logger.debug(f"Event stored: {event.event_type} - {event.user} (ID: {event_id})")
            
        except Exception as e:
            logger.error(f"Error handling log line: {e}")
    
    def start(self):
        """Start all components."""
        logger.info("=" * 60)
        logger.info("Starting Real-Time OS Security Event Logger")
        logger.info("=" * 60)
        
        if self.use_mock_data:
            logger.info("Running in MOCK DATA mode")
            self._seed_mock_data()
        else:
            self.log_reader.start()
            logger.info(f"Log reader started, monitoring {len(self.log_reader.tailers)} files")
        
        interval = self.config.get('analysis.interval_seconds', 60)
        self.rule_engine.start(interval_seconds=interval)
        
        logger.info("All components started successfully")
        logger.info("Press Ctrl+C to stop")
    
    def _seed_mock_data(self):
        """Seed database with mock data for demo mode."""
        from .mock_generator import seed_database_with_mock_data
        
        stats = self.database.get_stats()
        if stats.get('total_events', 0) < 50:
            events, alerts = seed_database_with_mock_data(self.database, 100, 15)
            logger.info(f"Seeded database with {events} mock events and {alerts} mock alerts")
    
    def stop(self):
        """Stop all components."""
        logger.info("Shutting down...")
        
        self.log_reader.stop()
        self.rule_engine.stop()
        self.database.close()
        
        logger.info("Shutdown complete")
    
    def run_forever(self):
        """Run until interrupted."""
        def signal_handler(sig, frame):
            print()
            self.stop()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        self.start()
        
        try:
            signal.pause()
        except AttributeError:
            import time
            while True:
                time.sleep(1)
    
    def get_status(self) -> dict:
        """Get current system status."""
        return {
            'log_sources': self.log_reader.get_status(),
            'rules': self.rule_engine.get_rule_status(),
            'stats': self.database.get_stats(),
            'mode': 'mock' if self.use_mock_data else 'real'
        }
