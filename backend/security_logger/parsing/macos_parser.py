"""macOS unified log parser."""

import re
from datetime import datetime
from typing import Optional
from ..events import SecurityEvent


class MacOSParser:
    """Parse macOS unified log entries."""
    
    # Regex patterns for macOS logs
    LOGIN_PATTERN = re.compile(r'login.*user\s+(\S+)', re.IGNORECASE)
    SUDO_PATTERN = re.compile(r'sudo.*USER=(\S+).*COMMAND=(.+)', re.IGNORECASE)
    
    @staticmethod
    def parse_line(line: str) -> Optional[SecurityEvent]:
        """Parse a single macOS log line into SecurityEvent."""
        
        # Login events
        match = MacOSParser.LOGIN_PATTERN.search(line)
        if match:
            username = match.group(1)
            event_type = "SUCCESS_LOGIN" if "success" in line.lower() else "FAILED_LOGIN"
            
            return SecurityEvent(
                timestamp=datetime.now(),
                os_name="Darwin",
                event_type=event_type,
                username=username,
                source_ip=None,
                process_name="login",
                raw_message=line.strip()
            )
        
        # Sudo commands
        match = MacOSParser.SUDO_PATTERN.search(line)
        if match:
            username, command = match.groups()
            return SecurityEvent(
                timestamp=datetime.now(),
                os_name="Darwin",
                event_type="SUDO_COMMAND",
                username=username,
                source_ip=None,
                process_name="sudo",
                raw_message=line.strip()
            )
        
        return None
