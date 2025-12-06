"""Linux log parser for auth.log and journalctl."""

import re
from datetime import datetime
from typing import Optional
from ..events import SecurityEvent


class LinuxParser:
    """Parse Linux authentication logs."""
    
    # Regex patterns for common auth.log entries
    FAILED_PASSWORD_PATTERN = re.compile(
        r'Failed password for (?:invalid user )?(\S+) from ([\d.]+)'
    )
    ACCEPTED_PASSWORD_PATTERN = re.compile(
        r'Accepted password for (\S+) from ([\d.]+)'
    )
    SUDO_COMMAND_PATTERN = re.compile(
        r'(\S+) : TTY=\S+ ; PWD=\S+ ; USER=(\S+) ; COMMAND=(.+)'
    )
    
    @staticmethod
    def parse_line(line: str, os_name: str = "Linux") -> Optional[SecurityEvent]:
        """Parse a single log line into a SecurityEvent."""
        
        # Failed login
        match = LinuxParser.FAILED_PASSWORD_PATTERN.search(line)
        if match:
            username, source_ip = match.groups()
            return SecurityEvent(
                timestamp=datetime.now(),
                os_name=os_name,
                event_type="FAILED_LOGIN",
                username=username,
                source_ip=source_ip,
                process_name="sshd",
                raw_message=line.strip()
            )
        
        # Successful login
        match = LinuxParser.ACCEPTED_PASSWORD_PATTERN.search(line)
        if match:
            username, source_ip = match.groups()
            return SecurityEvent(
                timestamp=datetime.now(),
                os_name=os_name,
                event_type="SUCCESS_LOGIN",
                username=username,
                source_ip=source_ip,
                process_name="sshd",
                raw_message=line.strip()
            )
        
        # Sudo command
        match = LinuxParser.SUDO_COMMAND_PATTERN.search(line)
        if match:
            username, target_user, command = match.groups()
            return SecurityEvent(
                timestamp=datetime.now(),
                os_name=os_name,
                event_type="SUDO_COMMAND",
                username=username,
                source_ip=None,
                process_name="sudo",
                raw_message=line.strip()
            )
        
        return None
