"""Brute force detection rule."""

from datetime import datetime, timedelta
from typing import List, Dict
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
        
        # Filter failed login events
        failed_logins = [e for e in events if e.event_type == "FAILED_LOGIN"]
        
        if not failed_logins:
            return []
        
        # Group by username
        by_username: Dict[str, List[SecurityEvent]] = {}
        for event in failed_logins:
            if event.username:
                by_username.setdefault(event.username, []).append(event)
        
        # Group by source IP
        by_ip: Dict[str, List[SecurityEvent]] = {}
        for event in failed_logins:
            if event.source_ip:
                by_ip.setdefault(event.source_ip, []).append(event)
        
        # Check username-based attempts
        for username, user_events in by_username.items():
            if len(user_events) >= self.max_attempts:
                event_ids = ",".join(str(e.id) for e in user_events if e.id)
                alerts.append(Alert(
                    timestamp=datetime.now(),
                    alert_type="BRUTE_FORCE_SUSPECTED",
                    severity="CRITICAL",
                    description=f"Brute force suspected: {len(user_events)} failed login attempts for user '{username}' in {self.window_minutes} minutes",
                    related_event_ids=event_ids
                ))
        
        # Check IP-based attempts
        for source_ip, ip_events in by_ip.items():
            if len(ip_events) >= self.max_attempts:
                event_ids = ",".join(str(e.id) for e in ip_events if e.id)
                alerts.append(Alert(
                    timestamp=datetime.now(),
                    alert_type="BRUTE_FORCE_SUSPECTED",
                    severity="CRITICAL",
                    description=f"Brute force suspected: {len(ip_events)} failed login attempts from IP '{source_ip}' in {self.window_minutes} minutes",
                    related_event_ids=event_ids
                ))
        
        return alerts
