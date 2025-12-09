"""Suspicious sudo usage detection rule."""

from datetime import datetime
from typing import List
from .rules_base import Rule
from ..events import SecurityEvent, Alert


class SuspiciousSudoRule(Rule):
    """Detect suspicious sudo usage from unusual users."""
    
    def __init__(self, unusual_users: List[str] = None, enabled: bool = True):
        super().__init__(enabled)
        self.unusual_users = set(u.lower() for u in (unusual_users or ["www-data", "nobody", "guest"]))
    
    @property
    def rule_name(self) -> str:
        return "Suspicious Sudo Detection"
    
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        """Check for sudo usage from unusual users."""
        if not self.enabled:
            return []
        
        alerts = []
        
        for event in events:
            if event.event_type in ('SUDO_SUCCESS', 'SUDO_COMMAND', 'SUDO_FAILURE'):
                if event.user and event.user.lower() in self.unusual_users:
                    alerts.append(Alert(
                        created_at=datetime.now(),
                        alert_type="SUSPICIOUS_SUDO",
                        severity="critical",
                        description=f"Suspicious sudo: Service account '{event.user}' attempted sudo command",
                        related_event_ids=str(event.id) if event.id else None
                    ))
        
        sudo_failures = [
            e for e in events 
            if e.event_type == 'SUDO_FAILURE'
        ]
        
        user_failures = {}
        for event in sudo_failures:
            if event.user:
                user_failures[event.user] = user_failures.get(event.user, 0) + 1
        
        for user, count in user_failures.items():
            if count >= 3:
                related_events = [e for e in sudo_failures if e.user == user]
                event_ids = ",".join(str(e.id) for e in related_events if e.id)
                alerts.append(Alert(
                    created_at=datetime.now(),
                    alert_type="SUDO_ABUSE",
                    severity="high",
                    description=f"Repeated sudo failures: User '{user}' had {count} failed sudo attempts",
                    related_event_ids=event_ids
                ))
        
        return alerts
