"""Linux log parsers for auth.log, syslog, kern.log, ufw.log, audit.log."""

import re
import socket
from datetime import datetime
from typing import Optional, Tuple
from ..events import SecurityEvent

CURRENT_YEAR = datetime.now().year


def parse_syslog_timestamp(timestamp_str: str) -> Optional[datetime]:
    """Parse syslog timestamp format (e.g., 'Jan  5 14:32:01')."""
    try:
        ts = datetime.strptime(f"{CURRENT_YEAR} {timestamp_str}", "%Y %b %d %H:%M:%S")
        if ts > datetime.now():
            ts = ts.replace(year=CURRENT_YEAR - 1)
        return ts
    except ValueError:
        return None


def get_hostname() -> str:
    """Get current hostname."""
    try:
        return socket.gethostname()
    except Exception:
        return "localhost"


class AuthLogParser:
    """Parser for /var/log/auth.log and /var/log/secure."""
    
    SYSLOG_PATTERN = re.compile(
        r'^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+?)(?:\[(\d+)\])?:\s+(.*)$'
    )
    
    FAILED_PASSWORD = re.compile(
        r'Failed password for (?:invalid user )?(\S+) from ([\d.]+)(?: port \d+)?'
    )
    ACCEPTED_PASSWORD = re.compile(
        r'Accepted password for (\S+) from ([\d.]+)(?: port \d+)?'
    )
    ACCEPTED_PUBLICKEY = re.compile(
        r'Accepted publickey for (\S+) from ([\d.]+)(?: port \d+)?'
    )
    INVALID_USER = re.compile(
        r'Invalid user (\S+) from ([\d.]+)'
    )
    CONNECTION_CLOSED = re.compile(
        r'Connection closed by (?:authenticating user )?(\S+)?\s*([\d.]+)'
    )
    SUDO_COMMAND = re.compile(
        r'(\S+)\s*:\s*TTY=(\S+)\s*;\s*PWD=(\S+)\s*;\s*USER=(\S+)\s*;\s*COMMAND=(.+)'
    )
    SUDO_FAILURE = re.compile(
        r'(\S+)\s*:\s*(\d+) incorrect password attempts'
    )
    SUDO_AUTH_FAILURE = re.compile(
        r'pam_unix\(sudo:auth\):\s*authentication failure.*user=(\S+)'
    )
    SESSION_OPENED = re.compile(
        r'pam_unix\(\S+:session\):\s*session opened for user (\S+)'
    )
    SESSION_CLOSED = re.compile(
        r'pam_unix\(\S+:session\):\s*session closed for user (\S+)'
    )
    NEW_USER = re.compile(
        r'new user: name=(\S+)'
    )
    NEW_GROUP = re.compile(
        r'new group: name=(\S+)'
    )
    PASSWORD_CHANGED = re.compile(
        r'password changed for (\S+)'
    )
    USER_ADDED_TO_GROUP = re.compile(
        r'add \'(\S+)\' to group \'(\S+)\''
    )
    
    @classmethod
    def parse(cls, line: str) -> Optional[SecurityEvent]:
        """Parse an auth.log line."""
        match = cls.SYSLOG_PATTERN.match(line)
        if not match:
            return None
        
        timestamp_str, host, process, pid, message = match.groups()
        event_time = parse_syslog_timestamp(timestamp_str)
        pid_int = int(pid) if pid else None
        
        event = SecurityEvent(
            event_time=event_time,
            host=host,
            process=process.split('/')[0],
            pid=pid_int,
            log_source='auth',
            raw_message=line,
            os_name='Linux'
        )
        
        m = cls.FAILED_PASSWORD.search(message)
        if m:
            event.event_type = 'AUTH_FAILURE'
            event.user = m.group(1)
            event.src_ip = m.group(2)
            event.severity = 'warning'
            return event
        
        m = cls.ACCEPTED_PASSWORD.search(message)
        if m:
            event.event_type = 'AUTH_SUCCESS'
            event.user = m.group(1)
            event.src_ip = m.group(2)
            event.severity = 'info'
            return event
        
        m = cls.ACCEPTED_PUBLICKEY.search(message)
        if m:
            event.event_type = 'AUTH_SUCCESS'
            event.user = m.group(1)
            event.src_ip = m.group(2)
            event.severity = 'info'
            return event
        
        m = cls.INVALID_USER.search(message)
        if m:
            event.event_type = 'AUTH_FAILURE'
            event.user = m.group(1)
            event.src_ip = m.group(2)
            event.severity = 'warning'
            return event
        
        m = cls.SUDO_COMMAND.search(message)
        if m:
            event.event_type = 'SUDO_SUCCESS'
            event.user = m.group(1)
            event.severity = 'info'
            return event
        
        m = cls.SUDO_FAILURE.search(message)
        if m:
            event.event_type = 'SUDO_FAILURE'
            event.user = m.group(1)
            event.severity = 'warning'
            return event
        
        m = cls.SUDO_AUTH_FAILURE.search(message)
        if m:
            event.event_type = 'SUDO_FAILURE'
            event.user = m.group(1)
            event.severity = 'warning'
            return event
        
        m = cls.SESSION_OPENED.search(message)
        if m:
            event.event_type = 'SESSION_START'
            event.user = m.group(1)
            event.severity = 'info'
            return event
        
        m = cls.SESSION_CLOSED.search(message)
        if m:
            event.event_type = 'SESSION_END'
            event.user = m.group(1)
            event.severity = 'info'
            return event
        
        m = cls.NEW_USER.search(message)
        if m:
            event.event_type = 'USER_CREATED'
            event.user = m.group(1)
            event.severity = 'warning'
            return event
        
        m = cls.PASSWORD_CHANGED.search(message)
        if m:
            event.event_type = 'PASSWORD_CHANGE'
            event.user = m.group(1)
            event.severity = 'info'
            return event
        
        m = cls.USER_ADDED_TO_GROUP.search(message)
        if m:
            event.event_type = 'GROUP_MEMBERSHIP_CHANGE'
            event.user = m.group(1)
            event.severity = 'warning'
            return event
        
        if 'sshd' in process:
            if 'Disconnected' in message or 'Connection closed' in message:
                event.event_type = 'CONNECTION_CLOSED'
                event.severity = 'info'
                ip_match = re.search(r'from ([\d.]+)', message)
                if ip_match:
                    event.src_ip = ip_match.group(1)
                return event
        
        return None


class SyslogParser:
    """Parser for /var/log/syslog and /var/log/messages."""
    
    SYSLOG_PATTERN = re.compile(
        r'^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+?)(?:\[(\d+)\])?:\s+(.*)$'
    )
    
    SERVICE_START = re.compile(r'Started (.+)\.')
    SERVICE_STOP = re.compile(r'Stopped (.+)\.')
    SERVICE_FAILED = re.compile(r'Failed to start (.+)\.')
    SYSTEMD_USER_SLICE = re.compile(r'Created slice (.+)\.')
    
    @classmethod
    def parse(cls, line: str) -> Optional[SecurityEvent]:
        """Parse a syslog line."""
        match = cls.SYSLOG_PATTERN.match(line)
        if not match:
            return None
        
        timestamp_str, host, process, pid, message = match.groups()
        event_time = parse_syslog_timestamp(timestamp_str)
        pid_int = int(pid) if pid else None
        
        event = SecurityEvent(
            event_time=event_time,
            host=host,
            process=process.split('/')[0],
            pid=pid_int,
            log_source='syslog',
            raw_message=line,
            os_name='Linux'
        )
        
        if cls.SERVICE_FAILED.search(message):
            event.event_type = 'SERVICE_FAILURE'
            event.severity = 'error'
            return event
        
        if cls.SERVICE_START.search(message):
            event.event_type = 'SERVICE_START'
            event.severity = 'info'
            return event
        
        if cls.SERVICE_STOP.search(message):
            event.event_type = 'SERVICE_STOP'
            event.severity = 'info'
            return event
        
        lower_msg = message.lower()
        if 'error' in lower_msg or 'failed' in lower_msg:
            event.event_type = 'SYSTEM_ERROR'
            event.severity = 'error'
            return event
        
        if 'warning' in lower_msg or 'warn' in lower_msg:
            event.event_type = 'SYSTEM_WARNING'
            event.severity = 'warning'
            return event
        
        return None


class KernelLogParser:
    """Parser for /var/log/kern.log."""
    
    KERN_PATTERN = re.compile(
        r'^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+kernel:\s+(?:\[\s*[\d.]+\]\s+)?(.*)$'
    )
    
    SEGFAULT = re.compile(r'(\S+)\[(\d+)\].*segfault')
    OOM_KILLER = re.compile(r'Out of memory: Kill(ed)? process (\d+)')
    USB_DEVICE = re.compile(r'usb \d+-[\d.]+: new .+ speed .+ USB device')
    AUDIT = re.compile(r'audit: .+')
    
    @classmethod
    def parse(cls, line: str) -> Optional[SecurityEvent]:
        """Parse a kernel log line."""
        match = cls.KERN_PATTERN.match(line)
        if not match:
            return None
        
        timestamp_str, host, message = match.groups()
        event_time = parse_syslog_timestamp(timestamp_str)
        
        event = SecurityEvent(
            event_time=event_time,
            host=host,
            process='kernel',
            log_source='kernel',
            raw_message=line,
            os_name='Linux'
        )
        
        m = cls.SEGFAULT.search(message)
        if m:
            event.event_type = 'KERNEL_SEGFAULT'
            event.severity = 'error'
            return event
        
        m = cls.OOM_KILLER.search(message)
        if m:
            event.event_type = 'KERNEL_OOM'
            event.severity = 'critical'
            return event
        
        if cls.USB_DEVICE.search(message):
            event.event_type = 'USB_DEVICE_CONNECTED'
            event.severity = 'info'
            return event
        
        lower_msg = message.lower()
        if 'error' in lower_msg:
            event.event_type = 'KERNEL_ERROR'
            event.severity = 'error'
            return event
        
        if 'warning' in lower_msg or 'warn' in lower_msg:
            event.event_type = 'KERNEL_WARNING'
            event.severity = 'warning'
            return event
        
        return None


class UFWLogParser:
    """Parser for UFW/iptables firewall logs."""
    
    UFW_PATTERN = re.compile(
        r'^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+kernel:\s+\[\s*[\d.]+\]\s+\[UFW\s+(\w+)\]\s+(.*)$'
    )
    
    IP_FIELDS = re.compile(
        r'SRC=([\d.]+)\s+DST=([\d.]+).*?PROTO=(\w+)(?:.*?SPT=(\d+))?(?:.*?DPT=(\d+))?'
    )
    
    @classmethod
    def parse(cls, line: str) -> Optional[SecurityEvent]:
        """Parse a UFW firewall log line."""
        match = cls.UFW_PATTERN.match(line)
        if not match:
            if '[UFW' in line or 'iptables' in line.lower():
                return cls._parse_generic_firewall(line)
            return None
        
        timestamp_str, host, action, details = match.groups()
        event_time = parse_syslog_timestamp(timestamp_str)
        
        event = SecurityEvent(
            event_time=event_time,
            host=host,
            process='ufw',
            log_source='firewall',
            raw_message=line,
            os_name='Linux'
        )
        
        ip_match = cls.IP_FIELDS.search(details)
        if ip_match:
            event.src_ip = ip_match.group(1)
            event.dst_ip = ip_match.group(2)
        
        if action == 'BLOCK':
            event.event_type = 'FIREWALL_BLOCK'
            event.severity = 'warning'
        elif action == 'ALLOW':
            event.event_type = 'FIREWALL_ALLOW'
            event.severity = 'info'
        elif action == 'AUDIT':
            event.event_type = 'FIREWALL_AUDIT'
            event.severity = 'info'
        else:
            event.event_type = 'FIREWALL_EVENT'
            event.severity = 'info'
        
        return event
    
    @classmethod
    def _parse_generic_firewall(cls, line: str) -> Optional[SecurityEvent]:
        """Parse generic firewall log lines."""
        event = SecurityEvent(
            event_time=datetime.now(),
            process='firewall',
            log_source='firewall',
            raw_message=line,
            os_name='Linux'
        )
        
        ip_match = cls.IP_FIELDS.search(line)
        if ip_match:
            event.src_ip = ip_match.group(1)
            event.dst_ip = ip_match.group(2)
        
        if 'BLOCK' in line or 'DROP' in line or 'REJECT' in line:
            event.event_type = 'FIREWALL_BLOCK'
            event.severity = 'warning'
        elif 'ALLOW' in line or 'ACCEPT' in line:
            event.event_type = 'FIREWALL_ALLOW'
            event.severity = 'info'
        else:
            event.event_type = 'FIREWALL_EVENT'
            event.severity = 'info'
        
        return event


class AuditLogParser:
    """Parser for Linux audit logs (/var/log/audit/audit.log)."""
    
    AUDIT_PATTERN = re.compile(
        r'^type=(\w+)\s+msg=audit\((\d+\.\d+):(\d+)\):\s*(.*)$'
    )
    
    SYSCALL_INFO = re.compile(r'syscall=(\d+).*exe="([^"]+)".*key="([^"]*)"')
    USER_INFO = re.compile(r'(?:uid|auid)=(\d+)')
    
    @classmethod
    def parse(cls, line: str) -> Optional[SecurityEvent]:
        """Parse an audit log line."""
        match = cls.AUDIT_PATTERN.match(line)
        if not match:
            return None
        
        audit_type, timestamp, audit_id, details = match.groups()
        
        try:
            event_time = datetime.fromtimestamp(float(timestamp))
        except (ValueError, OSError):
            event_time = datetime.now()
        
        event = SecurityEvent(
            event_time=event_time,
            host=get_hostname(),
            process='auditd',
            log_source='audit',
            raw_message=line,
            os_name='Linux'
        )
        
        user_match = cls.USER_INFO.search(details)
        if user_match:
            uid = user_match.group(1)
            if uid != '4294967295':
                event.user = f"uid:{uid}"
        
        if audit_type == 'USER_AUTH':
            if 'res=success' in details:
                event.event_type = 'AUDIT_AUTH_SUCCESS'
                event.severity = 'info'
            else:
                event.event_type = 'AUDIT_AUTH_FAILURE'
                event.severity = 'warning'
        elif audit_type == 'USER_LOGIN':
            event.event_type = 'AUDIT_LOGIN'
            event.severity = 'info'
        elif audit_type == 'USER_CMD':
            event.event_type = 'AUDIT_COMMAND'
            event.severity = 'info'
        elif audit_type == 'EXECVE':
            event.event_type = 'AUDIT_EXEC'
            event.severity = 'info'
        elif audit_type in ('ADD_USER', 'DEL_USER', 'ADD_GROUP', 'DEL_GROUP'):
            event.event_type = f'AUDIT_{audit_type}'
            event.severity = 'warning'
        elif audit_type == 'ANOM_ABEND':
            event.event_type = 'AUDIT_CRASH'
            event.severity = 'error'
        elif audit_type == 'AVC':
            event.event_type = 'AUDIT_SELINUX_DENIAL'
            event.severity = 'warning'
        else:
            event.event_type = f'AUDIT_{audit_type}'
            event.severity = 'info'
        
        return event


class LinuxParser:
    """Unified Linux log parser that routes to appropriate specialized parser."""
    
    PARSERS = {
        'auth': AuthLogParser,
        'syslog': SyslogParser,
        'kernel': KernelLogParser,
        'firewall': UFWLogParser,
        'audit': AuditLogParser,
    }
    
    @classmethod
    def parse_line(cls, line: str, log_source: str = 'auth', os_name: str = 'Linux') -> Optional[SecurityEvent]:
        """Parse a log line using the appropriate parser."""
        parser_class = cls.PARSERS.get(log_source, AuthLogParser)
        event = parser_class.parse(line)
        
        if event is None and log_source not in ('auth', 'firewall'):
            event = AuthLogParser.parse(line)
        
        if event and os_name:
            event.os_name = os_name
        
        return event
    
    @classmethod
    def parse_auto_detect(cls, line: str) -> Optional[SecurityEvent]:
        """Auto-detect log type and parse."""
        if '[UFW' in line:
            return UFWLogParser.parse(line)
        
        if 'type=' in line and 'msg=audit' in line:
            return AuditLogParser.parse(line)
        
        if 'kernel:' in line:
            return KernelLogParser.parse(line)
        
        if any(x in line for x in ['sshd', 'sudo', 'pam_unix', 'passwd', 'useradd']):
            return AuthLogParser.parse(line)
        
        return SyslogParser.parse(line)
