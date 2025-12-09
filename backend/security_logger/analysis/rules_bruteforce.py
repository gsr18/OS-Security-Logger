"""Brute force detection rule."""

from datetime import datetime
from typing import List, Dict
from collections import defaultdict
from .rules_base import Rule
from ..events import SecurityEvent, Alert


class BruteForceRule(Rule):
    """Detect brute force login attempts."""
    
    def __init__(self, max_attempts: int = 5, window_minutes: int = 10, enabled: bool = True):
        super().__init__(enabled)
        self.max_attempts = max_attempts
        self.window_minutes = window_minutes
    
    @property
    def rule_name(self) -> str:
        return "Brute Force Detection"
    
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        """Check for multiple failed login attempts."""
        if not self.enabled:
            return []
        
        alerts = []
        
        failed_logins = [
            e for e in events 
            if e.event_type in ('AUTH_FAILURE', 'FAILED_LOGIN')
        ]
        
        if not failed_logins:
            return []
        
        by_username: Dict[str, List[SecurityEvent]] = defaultdict(list)
        for event in failed_logins:
            if event.user:
                by_username[event.user].append(event)
        
        by_ip: Dict[str, List[SecurityEvent]] = defaultdict(list)
        for event in failed_logins:
            if event.src_ip:
                by_ip[event.src_ip].append(event)
        
        for username, user_events in by_username.items():
            if len(user_events) >= self.max_attempts:
                event_ids = ",".join(str(e.id) for e in user_events if e.id)
                alerts.append(Alert(
                    created_at=datetime.now(),
                    alert_type="BRUTE_FORCE",
                    severity="critical",
                    description=f"Brute force suspected: {len(user_events)} failed login attempts for user '{username}' in {self.window_minutes} minutes",
                    related_event_ids=event_ids
                ))
        
        for source_ip, ip_events in by_ip.items():
            if len(ip_events) >= self.max_attempts:
                event_ids = ",".join(str(e.id) for e in ip_events if e.id)
                alerts.append(Alert(
                    created_at=datetime.now(),
                    alert_type="BRUTE_FORCE",
                    severity="critical",
                    description=f"Brute force suspected: {len(ip_events)} failed login attempts from IP '{source_ip}' in {self.window_minutes} minutes",
                    related_event_ids=event_ids
                ))
        
        return alerts
