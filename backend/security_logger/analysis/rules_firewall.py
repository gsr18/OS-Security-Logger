"""Firewall attack detection rules."""

from datetime import datetime
from typing import List, Dict
from collections import defaultdict
from .rules_base import Rule
from ..events import SecurityEvent, Alert


class FirewallAttackRule(Rule):
    """Detect potential firewall attacks / port scans."""
    
    def __init__(self, max_blocks: int = 20, window_minutes: int = 5, enabled: bool = True):
        super().__init__(enabled)
        self.max_blocks = max_blocks
        self.window_minutes = window_minutes
    
    @property
    def rule_name(self) -> str:
        return "Firewall Attack Detection"
    
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        if not self.enabled:
            return []
        
        alerts = []
        
        firewall_blocks = [e for e in events if e.event_type == 'FIREWALL_BLOCK']
        
        if not firewall_blocks:
            return []
        
        by_src_ip: Dict[str, List[SecurityEvent]] = defaultdict(list)
        for event in firewall_blocks:
            if event.src_ip:
                by_src_ip[event.src_ip].append(event)
        
        for src_ip, ip_events in by_src_ip.items():
            if len(ip_events) >= self.max_blocks:
                dst_ports = set()
                for e in ip_events:
                    if 'DPT=' in (e.raw_message or ''):
                        import re
                        match = re.search(r'DPT=(\d+)', e.raw_message)
                        if match:
                            dst_ports.add(match.group(1))
                
                event_ids = ",".join(str(e.id) for e in ip_events if e.id)
                
                if len(dst_ports) > 10:
                    alerts.append(Alert(
                        created_at=datetime.now(),
                        alert_type="PORT_SCAN",
                        severity="critical",
                        description=f"Port scan detected: {len(ip_events)} blocked connections from {src_ip} to {len(dst_ports)} different ports",
                        related_event_ids=event_ids
                    ))
                else:
                    alerts.append(Alert(
                        created_at=datetime.now(),
                        alert_type="FIREWALL_ATTACK",
                        severity="high",
                        description=f"Firewall attack detected: {len(ip_events)} blocked connections from {src_ip} in {self.window_minutes} minutes",
                        related_event_ids=event_ids
                    ))
        
        return alerts


class PortScanRule(Rule):
    """Detect port scanning activity."""
    
    def __init__(self, min_ports: int = 10, window_minutes: int = 5, enabled: bool = True):
        super().__init__(enabled)
        self.min_ports = min_ports
        self.window_minutes = window_minutes
    
    @property
    def rule_name(self) -> str:
        return "Port Scan Detection"
    
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        if not self.enabled:
            return []
        
        alerts = []
        
        firewall_events = [e for e in events if e.event_type in ('FIREWALL_BLOCK', 'FIREWALL_EVENT')]
        
        if not firewall_events:
            return []
        
        by_src_ip: Dict[str, Dict[str, set]] = defaultdict(lambda: {'ports': set(), 'events': []})
        
        for event in firewall_events:
            if event.src_ip and event.raw_message:
                import re
                port_match = re.search(r'DPT=(\d+)', event.raw_message)
                if port_match:
                    by_src_ip[event.src_ip]['ports'].add(port_match.group(1))
                    by_src_ip[event.src_ip]['events'].append(event)
        
        for src_ip, data in by_src_ip.items():
            if len(data['ports']) >= self.min_ports:
                event_ids = ",".join(str(e.id) for e in data['events'] if e.id)
                alerts.append(Alert(
                    created_at=datetime.now(),
                    alert_type="PORT_SCAN",
                    severity="critical",
                    description=f"Port scan detected: {src_ip} probed {len(data['ports'])} different ports",
                    related_event_ids=event_ids
                ))
        
        return alerts
