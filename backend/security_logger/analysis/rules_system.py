"""System instability and anomaly detection rules."""

from datetime import datetime
from typing import List, Dict
from collections import defaultdict
from .rules_base import Rule
from ..events import SecurityEvent, Alert


class SystemInstabilityRule(Rule):
    """Detect system instability from kernel warnings/errors."""
    
    def __init__(self, max_errors: int = 10, window_minutes: int = 10, enabled: bool = True):
        super().__init__(enabled)
        self.max_errors = max_errors
        self.window_minutes = window_minutes
    
    @property
    def rule_name(self) -> str:
        return "System Instability Detection"
    
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        if not self.enabled:
            return []
        
        alerts = []
        
        kernel_issues = [
            e for e in events 
            if e.event_type in ('KERNEL_ERROR', 'KERNEL_WARNING', 'KERNEL_SEGFAULT', 'KERNEL_OOM', 'SYSTEM_ERROR')
        ]
        
        if len(kernel_issues) >= self.max_errors:
            event_ids = ",".join(str(e.id) for e in kernel_issues if e.id)
            
            critical_count = sum(1 for e in kernel_issues if e.event_type in ('KERNEL_SEGFAULT', 'KERNEL_OOM'))
            
            if critical_count > 0:
                severity = "critical"
                desc = f"Critical system instability: {len(kernel_issues)} kernel issues including {critical_count} critical errors (segfault/OOM)"
            else:
                severity = "high"
                desc = f"System instability detected: {len(kernel_issues)} kernel warnings/errors in {self.window_minutes} minutes"
            
            alerts.append(Alert(
                created_at=datetime.now(),
                alert_type="SYSTEM_INSTABILITY",
                severity=severity,
                description=desc,
                related_event_ids=event_ids
            ))
        
        return alerts


class ServiceFailureRule(Rule):
    """Detect repeated service failures."""
    
    def __init__(self, max_failures: int = 3, window_minutes: int = 15, enabled: bool = True):
        super().__init__(enabled)
        self.max_failures = max_failures
        self.window_minutes = window_minutes
    
    @property
    def rule_name(self) -> str:
        return "Service Failure Detection"
    
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        if not self.enabled:
            return []
        
        alerts = []
        
        service_failures = [e for e in events if e.event_type == 'SERVICE_FAILURE']
        
        if len(service_failures) >= self.max_failures:
            event_ids = ",".join(str(e.id) for e in service_failures if e.id)
            alerts.append(Alert(
                created_at=datetime.now(),
                alert_type="SERVICE_FAILURES",
                severity="high",
                description=f"Multiple service failures: {len(service_failures)} services failed in {self.window_minutes} minutes",
                related_event_ids=event_ids
            ))
        
        return alerts


class PrivilegeEscalationRule(Rule):
    """Detect potential privilege escalation attempts."""
    
    def __init__(self, enabled: bool = True):
        super().__init__(enabled)
    
    @property
    def rule_name(self) -> str:
        return "Privilege Escalation Detection"
    
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        if not self.enabled:
            return []
        
        alerts = []
        
        suspicious_users = {'www-data', 'nobody', 'guest', 'daemon', 'apache', 'nginx', 'mysql', 'postgres'}
        
        for event in events:
            if event.event_type in ('SUDO_SUCCESS', 'SUDO_COMMAND'):
                if event.user and event.user.lower() in suspicious_users:
                    alerts.append(Alert(
                        created_at=datetime.now(),
                        alert_type="PRIVILEGE_ESCALATION",
                        severity="critical",
                        description=f"Suspicious sudo usage: service account '{event.user}' executed sudo command",
                        related_event_ids=str(event.id) if event.id else None
                    ))
            
            if event.event_type in ('USER_CREATED', 'GROUP_MEMBERSHIP_CHANGE'):
                if 'sudo' in (event.raw_message or '').lower() or 'wheel' in (event.raw_message or '').lower():
                    alerts.append(Alert(
                        created_at=datetime.now(),
                        alert_type="PRIVILEGE_ESCALATION",
                        severity="critical",
                        description=f"User privilege modification: {event.raw_message[:100]}",
                        related_event_ids=str(event.id) if event.id else None
                    ))
        
        return alerts


class AnomalousLoginTimeRule(Rule):
    """Detect logins at unusual times (e.g., late night/early morning)."""
    
    def __init__(self, start_hour: int = 0, end_hour: int = 5, enabled: bool = True):
        super().__init__(enabled)
        self.start_hour = start_hour
        self.end_hour = end_hour
    
    @property
    def rule_name(self) -> str:
        return "Anomalous Login Time Detection"
    
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        if not self.enabled:
            return []
        
        alerts = []
        
        for event in events:
            if event.event_type == 'AUTH_SUCCESS' and event.event_time:
                hour = event.event_time.hour
                if self.start_hour <= hour < self.end_hour:
                    alerts.append(Alert(
                        created_at=datetime.now(),
                        alert_type="ANOMALOUS_LOGIN",
                        severity="medium",
                        description=f"Off-hours login: User '{event.user}' logged in at {event.event_time.strftime('%H:%M')} from {event.src_ip or 'local'}",
                        related_event_ids=str(event.id) if event.id else None
                    ))
        
        return alerts


class RapidLoginRule(Rule):
    """Detect rapid successive logins from different IPs."""
    
    def __init__(self, max_logins: int = 5, window_minutes: int = 2, enabled: bool = True):
        super().__init__(enabled)
        self.max_logins = max_logins
        self.window_minutes = window_minutes
    
    @property
    def rule_name(self) -> str:
        return "Rapid Login Detection"
    
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        if not self.enabled:
            return []
        
        alerts = []
        
        successful_logins = [e for e in events if e.event_type == 'AUTH_SUCCESS']
        
        by_user: Dict[str, List[SecurityEvent]] = defaultdict(list)
        for event in successful_logins:
            if event.user:
                by_user[event.user].append(event)
        
        for user, user_events in by_user.items():
            if len(user_events) >= self.max_logins:
                unique_ips = set(e.src_ip for e in user_events if e.src_ip)
                if len(unique_ips) >= 2:
                    event_ids = ",".join(str(e.id) for e in user_events if e.id)
                    alerts.append(Alert(
                        created_at=datetime.now(),
                        alert_type="RAPID_LOGIN",
                        severity="high",
                        description=f"Rapid logins: User '{user}' logged in {len(user_events)} times from {len(unique_ips)} different IPs",
                        related_event_ids=event_ids
                    ))
        
        return alerts
