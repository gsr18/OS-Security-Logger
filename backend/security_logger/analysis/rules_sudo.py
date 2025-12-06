"""Suspicious sudo usage detection rule."""

from datetime import datetime
from typing import List
from .rules_base import Rule
from ..events import SecurityEvent, Alert


class SuspiciousSudoRule(Rule):
    """Detect suspicious sudo commands from unusual users."""
    
    def __init__(self, unusual_users: List[str] = None, enabled: bool = True):
        super().__init__(enabled)
        self.unusual_users = unusual_users or ["www-data", "nobody", "guest"]
    
    @property
    def rule_name(self) -> str:
        return "Suspicious Sudo Usage"
    
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        """Check for sudo commands from unusual users."""
        
        if not self.enabled:
            return []
        
        alerts = []
        
        # Filter sudo events
        sudo_events = [e for e in events if e.event_type == "SUDO_COMMAND"]
        
        for event in sudo_events:
            if event.username and event.username in self.unusual_users:
                alerts.append(Alert(
                    timestamp=datetime.now(),
                    alert_type="SUSPICIOUS_SUDO",
                    severity="WARNING",
                    description=f"Suspicious sudo usage by user '{event.username}' (unusual account)",
                    related_event_ids=str(event.id) if event.id else None
                ))
        
        return alerts
