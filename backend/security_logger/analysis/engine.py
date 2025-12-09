"""Rule engine orchestration with all detection rules."""

import logging
import threading
import time
from typing import List
from .rules_base import Rule
from .rules_bruteforce import BruteForceRule
from .rules_sudo import SuspiciousSudoRule
from .rules_firewall import FirewallAttackRule, PortScanRule
from .rules_system import (
    SystemInstabilityRule, 
    ServiceFailureRule, 
    PrivilegeEscalationRule,
    AnomalousLoginTimeRule,
    RapidLoginRule
)
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
        self._init_rules()
    
    def _init_rules(self):
        """Initialize all detection rules from configuration."""
        rules_config = self.config.get('rules', {})
        
        bf_config = rules_config.get('brute_force', {})
        if bf_config.get('enabled', True):
            self.rules.append(BruteForceRule(
                max_attempts=bf_config.get('max_failed_attempts', 5),
                window_minutes=bf_config.get('window_minutes', 10),
                enabled=True
            ))
            logger.info("Brute force detection rule enabled")
        
        sudo_config = rules_config.get('sudo_suspicious', {})
        if sudo_config.get('enabled', True):
            self.rules.append(SuspiciousSudoRule(
                unusual_users=sudo_config.get('unusual_users', ["www-data", "nobody", "guest"]),
                enabled=True
            ))
            logger.info("Suspicious sudo detection rule enabled")
        
        fw_config = rules_config.get('firewall_attack', {})
        if fw_config.get('enabled', True):
            self.rules.append(FirewallAttackRule(
                max_blocks=fw_config.get('max_blocks', 20),
                window_minutes=fw_config.get('window_minutes', 5),
                enabled=True
            ))
            logger.info("Firewall attack detection rule enabled")
        
        ps_config = rules_config.get('port_scan', {})
        if ps_config.get('enabled', True):
            self.rules.append(PortScanRule(
                min_ports=ps_config.get('min_ports', 10),
                window_minutes=ps_config.get('window_minutes', 5),
                enabled=True
            ))
            logger.info("Port scan detection rule enabled")
        
        si_config = rules_config.get('system_instability', {})
        if si_config.get('enabled', True):
            self.rules.append(SystemInstabilityRule(
                max_errors=si_config.get('max_errors', 10),
                window_minutes=si_config.get('window_minutes', 10),
                enabled=True
            ))
            logger.info("System instability detection rule enabled")
        
        sf_config = rules_config.get('service_failure', {})
        if sf_config.get('enabled', True):
            self.rules.append(ServiceFailureRule(
                max_failures=sf_config.get('max_failures', 3),
                window_minutes=sf_config.get('window_minutes', 15),
                enabled=True
            ))
            logger.info("Service failure detection rule enabled")
        
        pe_config = rules_config.get('privilege_escalation', {})
        if pe_config.get('enabled', True):
            self.rules.append(PrivilegeEscalationRule(enabled=True))
            logger.info("Privilege escalation detection rule enabled")
        
        al_config = rules_config.get('anomalous_login', {})
        if al_config.get('enabled', False):
            self.rules.append(AnomalousLoginTimeRule(
                start_hour=al_config.get('start_hour', 0),
                end_hour=al_config.get('end_hour', 5),
                enabled=True
            ))
            logger.info("Anomalous login time detection rule enabled")
        
        rl_config = rules_config.get('rapid_login', {})
        if rl_config.get('enabled', True):
            self.rules.append(RapidLoginRule(
                max_logins=rl_config.get('max_logins', 5),
                window_minutes=rl_config.get('window_minutes', 2),
                enabled=True
            ))
            logger.info("Rapid login detection rule enabled")
        
        logger.info(f"Initialized {len(self.rules)} detection rules")
    
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
            
            for _ in range(interval_seconds):
                if not self.running:
                    break
                time.sleep(1)
    
    def _evaluate_rules(self):
        """Run all rules against recent events."""
        events = self.database.get_recent_events_for_analysis(minutes=15, limit=1000)
        
        if not events:
            return
        
        for rule in self.rules:
            if not rule.enabled:
                continue
            
            try:
                alerts = rule.evaluate(events)
                
                for alert in alerts:
                    existing, _ = self.database.query_alerts(since_minutes=15, limit=100)
                    
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
    
    def evaluate_now(self):
        """Manually trigger rule evaluation."""
        self._evaluate_rules()
    
    def get_rule_status(self) -> List[dict]:
        """Get status of all rules."""
        return [
            {
                'name': rule.rule_name,
                'enabled': rule.enabled,
                'type': type(rule).__name__
            }
            for rule in self.rules
        ]
