"""Main application orchestration."""

import platform
import signal
import sys
import logging
from typing import Optional
from .config import load_config
from .logging_utils import setup_logging
from .storage.db import Database
from .analysis.engine import RuleEngine
from .events import SecurityEvent
from .sources.base import EventSource

logger = logging.getLogger("security_logger.main")


class SecurityLogger:
    """Main application orchestrator."""
    
    def __init__(self, config_path: str = "config.yaml"):
        # Load configuration
        self.config = load_config(config_path)
        
        # Setup logging
        log_level = self.config.get('logging.level', 'INFO')
        setup_logging(log_level)
        
        # Initialize database
        db_path = self.config.get('database.path', './security_events.db')
        self.database = Database(db_path)
        
        # Initialize rule engine
        self.rule_engine = RuleEngine(self.database, self.config.data)
        
        # Event sources
        self.event_sources = []
        
        # Detect OS and initialize appropriate source
        self._init_event_sources()
    
    def _init_event_sources(self):
        """Initialize OS-specific event sources."""
        
        os_name = platform.system()
        logger.info(f"Detected OS: {os_name}")
        
        if os_name == "Linux":
            from .sources.linux_source import LinuxEventSource
            
            if self.config.get('sources.linux.enabled', True):
                log_path = self.config.get('sources.linux.auth_log_path', '/var/log/auth.log')
                source = LinuxEventSource(self._handle_event, log_path)
                self.event_sources.append(source)
                logger.info("Linux event source initialized")
        
        elif os_name == "Windows":
            from .sources.windows_source import WindowsEventSource
            
            if self.config.get('sources.windows.enabled', True):
                source = WindowsEventSource(self._handle_event)
                self.event_sources.append(source)
                logger.info("Windows event source initialized")
        
        elif os_name == "Darwin":
            from .sources.macos_source import MacOSEventSource
            
            if self.config.get('sources.macos.enabled', True):
                source = MacOSEventSource(self._handle_event)
                self.event_sources.append(source)
                logger.info("macOS event source initialized")
        
        else:
            logger.warning(f"Unsupported OS: {os_name}")
    
    def _handle_event(self, event: SecurityEvent):
        """Handle incoming events from sources."""
        
        try:
            # Store in database
            event_id = self.database.insert_event(event)
            event.id = event_id
            
            logger.info(f"Event stored: {event.event_type} - {event.username} (ID: {event_id})")
        
        except Exception as e:
            logger.error(f"Error handling event: {e}")
    
    def start(self):
        """Start all components."""
        
        logger.info("=" * 60)
        logger.info("Starting Real-Time OS Security Event Logger")
        logger.info("=" * 60)
        
        # Start event sources
        for source in self.event_sources:
            source.start()
        
        # Start rule engine
        self.rule_engine.start(interval_seconds=60)
        
        logger.info("All components started successfully")
        logger.info("Press Ctrl+C to stop")
    
    def stop(self):
        """Stop all components."""
        
        logger.info("Shutting down...")
        
        # Stop event sources
        for source in self.event_sources:
            source.stop()
        
        # Stop rule engine
        self.rule_engine.stop()
        
        # Close database
        self.database.close()
        
        logger.info("Shutdown complete")
    
    def run_forever(self):
        """Run until interrupted."""
        
        # Setup signal handlers
        def signal_handler(sig, frame):
            print()  # New line after ^C
            self.stop()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Start and wait
        self.start()
        
        # Keep main thread alive
        try:
            signal.pause()
        except AttributeError:
            # Windows doesn't have signal.pause()
            import time
            while True:
                time.sleep(1)
