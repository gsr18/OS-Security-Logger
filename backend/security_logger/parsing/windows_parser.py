"""Windows Event Log parser."""

import re
from datetime import datetime
from typing import Optional, Dict, Any
from ..events import SecurityEvent


class WindowsParser:
    """Parse Windows Security Event Log entries."""
    
    # Common Windows Security Event IDs
    EVENT_IDS = {
        4624: "SUCCESS_LOGIN",      # Successful logon
        4625: "FAILED_LOGIN",        # Failed logon
        4648: "SUCCESS_LOGIN",       # Logon with explicit credentials
        4672: "PRIV_ESCALATION",     # Special privileges assigned
    }
    
    @staticmethod
    def parse_event(event_dict: Dict[str, Any]) -> Optional[SecurityEvent]:
        """Parse a Windows event record into SecurityEvent."""
        
        try:
            event_id = event_dict.get('EventID', 0)
            event_type = WindowsParser.EVENT_IDS.get(event_id)
            
            if not event_type:
                return None
            
            # Extract username
            username = None
            if 'TargetUserName' in event_dict:
                username = event_dict['TargetUserName']
            elif 'SubjectUserName' in event_dict:
                username = event_dict['SubjectUserName']
            
            # Extract source IP
            source_ip = event_dict.get('IpAddress') or event_dict.get('WorkstationName')
            
            return SecurityEvent(
                timestamp=datetime.now(),
                os_name="Windows",
                event_type=event_type,
                username=username,
                source_ip=source_ip,
                process_name="Security",
                raw_message=str(event_dict)
            )
        
        except Exception:
            return None
