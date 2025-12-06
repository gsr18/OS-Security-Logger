"""Rule engine orchestration."""

import logging
import threading
import time
from typing import List
from .rules_base import Rule
from .rules_bruteforce import BruteForceRule
from .rules_sudo import SuspiciousSudoRule
from ..storage.db import Database
from ..events import Alert

logger = logging.getLogger("security_logger.analysis")


class RuleEngine:
    """Orchestrates rule evaluation and alert generation."""
    
    def __init__(self, database: Database, config: dict):
        self.database = database
        self.config = config
        self.rules: List[Rule] = []
        self.running = False
        self.thread = None
        
        # Initialize rules from config
        self._init_rules()
    
    def _init_rules(self):
        """Initialize detection rules from configuration."""
        
        # Brute force rule
        bf_config = self.config.get('rules', {}).get('brute_force', {})
        if bf_config.get('enabled', True):
            self.rules.append(BruteForceRule(
                max_attempts=bf_config.get('max_failed_attempts', 5),
                window_minutes=bf_config.get('window_minutes', 10),
                enabled=True
            ))
            logger.info("Brute force detection rule enabled")
        
        # Suspicious sudo rule
        sudo_config = self.config.get('rules', {}).get('sudo_suspicious', {})
        if sudo_config.get('enabled', True):
            self.rules.append(SuspiciousSudoRule(
                unusual_users=sudo_config.get('unusual_users', ["www-data", "nobody", "guest"]),
                enabled=True
            ))
            logger.info("Suspicious sudo detection rule enabled")
    
    def start(self, interval_seconds: int = 60):
        """Start rule engine in background thread."""
        
        if self.running:
            logger.warning("Rule engine already running")
            return
        
        self.running = True
        self.thread = threading.Thread(
            target=self._run_loop,
            args=(interval_seconds,),
            daemon=True
        )
        self.thread.start()
        logger.info(f"Rule engine started (checking every {interval_seconds}s)")
    
    def stop(self):
        """Stop rule engine."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Rule engine stopped")
    
    def _run_loop(self, interval_seconds: int):
        """Main evaluation loop."""
        
        while self.running:
            try:
                self._evaluate_rules()
            except Exception as e:
                logger.error(f"Error in rule evaluation: {e}")
            
            # Sleep in small increments so we can stop quickly
            for _ in range(interval_seconds):
                if not self.running:
                    break
                time.sleep(1)
    
    def _evaluate_rules(self):
        """Run all rules against recent events."""
        
        # Get recent events (last 15 minutes)
        events = self.database.query_events(since_minutes=15, limit=1000)
        
        if not events:
            return
        
        # Run each rule
        for rule in self.rules:
            if not rule.enabled:
                continue
            
            try:
                alerts = rule.evaluate(events)
                
                for alert in alerts:
                    # Check if similar alert already exists (avoid duplicates)
                    existing = self.database.query_alerts(since_minutes=15, limit=100)
                    
                    is_duplicate = any(
                        a.alert_type == alert.alert_type and
                        a.description == alert.description
                        for a in existing
                    )
                    
                    if not is_duplicate:
                        alert_id = self.database.insert_alert(alert)
                        logger.warning(f"Alert generated: {alert.description} (ID: {alert_id})")
            
            except Exception as e:
                logger.error(f"Error in rule '{rule.rule_name}': {e}")
