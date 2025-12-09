#!/usr/bin/env python3
"""
Real-Time OS Security Event Ingestor

This script monitors OS log files and pushes parsed security events to Supabase.
Supports Linux, Windows, and macOS with cross-platform detection.

Usage:
    python os_ingestor.py [--mock]
    
Environment Variables:
    SUPABASE_URL - Your Supabase project URL
    SUPABASE_SERVICE_KEY - Your Supabase service role key
    USE_MOCK_DATA - Set to 'true' to enable mock data mode
"""

import os
import sys
import time
import platform
import signal
import logging
import argparse
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from collections import defaultdict
import json
import re

try:
    from supabase import create_client, Client
except ImportError:
    print("ERROR: supabase package not installed. Run: pip install supabase")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("os_ingestor")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://qsqxwpkjmvriukmbbtex.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcXh3cGtqbXZyaXVrbWJidGV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5ODUxOCwiZXhwIjoyMDgwODc0NTE4fQ.YmxjNmmlMNxsupCRK56iL5x54yLej0yL5VL81iHjngw")
USE_MOCK_DATA = os.environ.get("USE_MOCK_DATA", "false").lower() == "true"


@dataclass
class SecurityEvent:
    event_time: datetime
    event_type: str
    severity: str
    raw_message: str
    host: Optional[str] = None
    process: Optional[str] = None
    pid: Optional[int] = None
    user: Optional[str] = None
    src_ip: Optional[str] = None
    dst_ip: Optional[str] = None
    log_source: Optional[str] = None
    platform: str = "linux"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_time": self.event_time.isoformat(),
            "timestamp": self.event_time.isoformat(),
            "event_type": self.event_type,
            "severity": self.severity,
            "raw_message": self.raw_message,
            "host": self.host,
            "process": self.process,
            "pid": self.pid,
            "user": self.user,
            "src_ip": self.src_ip,
            "dst_ip": self.dst_ip,
            "log_source": self.log_source,
            "platform": self.platform,
        }


@dataclass
class Alert:
    alert_type: str
    severity: str
    description: str
    related_event_ids: Optional[str] = None
    status: str = "active"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "alert_type": self.alert_type,
            "severity": self.severity,
            "description": self.description,
            "related_event_ids": self.related_event_ids,
            "status": self.status,
        }


class LinuxLogParser:
    CURRENT_YEAR = datetime.now().year
    
    SYSLOG_PATTERN = re.compile(
        r'^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})\s+(\S+)\s+(\S+?)(?:\[(\d+)\])?:\s+(.*)$'
    )
    
    FAILED_PASSWORD = re.compile(r'Failed password for (?:invalid user )?(\S+) from ([\d.]+)')
    ACCEPTED_PASSWORD = re.compile(r'Accepted password for (\S+) from ([\d.]+)')
    ACCEPTED_PUBLICKEY = re.compile(r'Accepted publickey for (\S+) from ([\d.]+)')
    INVALID_USER = re.compile(r'Invalid user (\S+) from ([\d.]+)')
    SUDO_COMMAND = re.compile(r'(\S+)\s*:\s*TTY=(\S+)\s*;\s*PWD=(\S+)\s*;\s*USER=(\S+)\s*;\s*COMMAND=(.+)')
    SUDO_FAILURE = re.compile(r'(\S+)\s*:\s*(\d+) incorrect password attempts')
    SUDO_AUTH_FAILURE = re.compile(r'pam_unix\(sudo:auth\):\s*authentication failure.*user=(\S+)')
    SESSION_OPENED = re.compile(r'pam_unix\(\S+:session\):\s*session opened for user (\S+)')
    SESSION_CLOSED = re.compile(r'pam_unix\(\S+:session\):\s*session closed for user (\S+)')
    UFW_PATTERN = re.compile(r'\[UFW\s+(\w+)\].*SRC=([\d.]+)\s+DST=([\d.]+).*PROTO=(\w+)')
    
    @classmethod
    def parse_timestamp(cls, ts_str: str) -> datetime:
        try:
            ts = datetime.strptime(f"{cls.CURRENT_YEAR} {ts_str}", "%Y %b %d %H:%M:%S")
            if ts > datetime.now():
                ts = ts.replace(year=cls.CURRENT_YEAR - 1)
            return ts
        except ValueError:
            return datetime.now()
    
    @classmethod
    def parse_auth_log(cls, line: str) -> Optional[SecurityEvent]:
        match = cls.SYSLOG_PATTERN.match(line)
        if not match:
            return None
        
        ts_str, host, process, pid, message = match.groups()
        event_time = cls.parse_timestamp(ts_str)
        
        event = SecurityEvent(
            event_time=event_time,
            event_type="UNKNOWN",
            severity="info",
            raw_message=line,
            host=host,
            process=process.split('/')[0],
            pid=int(pid) if pid else None,
            log_source="auth",
            platform="linux"
        )
        
        m = cls.FAILED_PASSWORD.search(message)
        if m:
            event.event_type = "AUTH_FAILURE"
            event.user = m.group(1)
            event.src_ip = m.group(2)
            event.severity = "warning"
            return event
        
        m = cls.ACCEPTED_PASSWORD.search(message) or cls.ACCEPTED_PUBLICKEY.search(message)
        if m:
            event.event_type = "AUTH_SUCCESS"
            event.user = m.group(1)
            event.src_ip = m.group(2)
            event.severity = "info"
            return event
        
        m = cls.INVALID_USER.search(message)
        if m:
            event.event_type = "AUTH_FAILURE"
            event.user = m.group(1)
            event.src_ip = m.group(2)
            event.severity = "warning"
            return event
        
        m = cls.SUDO_COMMAND.search(message)
        if m:
            event.event_type = "SUDO_SUCCESS"
            event.user = m.group(1)
            event.severity = "info"
            return event
        
        m = cls.SUDO_FAILURE.search(message) or cls.SUDO_AUTH_FAILURE.search(message)
        if m:
            event.event_type = "SUDO_FAILURE"
            event.user = m.group(1)
            event.severity = "warning"
            return event
        
        m = cls.SESSION_OPENED.search(message)
        if m:
            event.event_type = "SESSION_START"
            event.user = m.group(1)
            event.severity = "info"
            return event
        
        m = cls.SESSION_CLOSED.search(message)
        if m:
            event.event_type = "SESSION_END"
            event.user = m.group(1)
            event.severity = "info"
            return event
        
        return None
    
    @classmethod
    def parse_kernel_log(cls, line: str) -> Optional[SecurityEvent]:
        match = cls.SYSLOG_PATTERN.match(line)
        if not match:
            return None
        
        ts_str, host, _, _, message = match.groups()
        event_time = cls.parse_timestamp(ts_str)
        
        event = SecurityEvent(
            event_time=event_time,
            event_type="KERNEL_EVENT",
            severity="info",
            raw_message=line,
            host=host,
            process="kernel",
            log_source="kernel",
            platform="linux"
        )
        
        lower_msg = message.lower()
        if 'segfault' in lower_msg:
            event.event_type = "KERNEL_SEGFAULT"
            event.severity = "error"
        elif 'out of memory' in lower_msg or 'oom' in lower_msg:
            event.event_type = "KERNEL_OOM"
            event.severity = "critical"
        elif 'error' in lower_msg:
            event.event_type = "KERNEL_ERROR"
            event.severity = "error"
        elif 'warning' in lower_msg or 'warn' in lower_msg:
            event.event_type = "KERNEL_WARNING"
            event.severity = "warning"
        else:
            return None
        
        return event
    
    @classmethod
    def parse_firewall_log(cls, line: str) -> Optional[SecurityEvent]:
        event = SecurityEvent(
            event_time=datetime.now(),
            event_type="FIREWALL_EVENT",
            severity="info",
            raw_message=line,
            process="firewall",
            log_source="firewall",
            platform="linux"
        )
        
        m = cls.UFW_PATTERN.search(line)
        if m:
            action = m.group(1)
            event.src_ip = m.group(2)
            event.dst_ip = m.group(3)
            
            if action == "BLOCK":
                event.event_type = "FIREWALL_BLOCK"
                event.severity = "warning"
            elif action == "ALLOW":
                event.event_type = "FIREWALL_ALLOW"
                event.severity = "info"
            return event
        
        if 'BLOCK' in line or 'DROP' in line or 'REJECT' in line:
            event.event_type = "FIREWALL_BLOCK"
            event.severity = "warning"
            ip_match = re.search(r'SRC=([\d.]+)', line)
            if ip_match:
                event.src_ip = ip_match.group(1)
            return event
        
        return None
    
    @classmethod
    def parse_syslog(cls, line: str) -> Optional[SecurityEvent]:
        match = cls.SYSLOG_PATTERN.match(line)
        if not match:
            return None
        
        ts_str, host, process, pid, message = match.groups()
        event_time = cls.parse_timestamp(ts_str)
        
        lower_msg = message.lower()
        
        if 'failed' in lower_msg or 'error' in lower_msg:
            return SecurityEvent(
                event_time=event_time,
                event_type="SERVICE_FAILURE",
                severity="error",
                raw_message=line,
                host=host,
                process=process.split('/')[0],
                pid=int(pid) if pid else None,
                log_source="syslog",
                platform="linux"
            )
        
        if 'started' in lower_msg or 'starting' in lower_msg:
            return SecurityEvent(
                event_time=event_time,
                event_type="SERVICE_START",
                severity="info",
                raw_message=line,
                host=host,
                process=process.split('/')[0],
                pid=int(pid) if pid else None,
                log_source="syslog",
                platform="linux"
            )
        
        if 'stopped' in lower_msg or 'stopping' in lower_msg:
            return SecurityEvent(
                event_time=event_time,
                event_type="SERVICE_STOP",
                severity="info",
                raw_message=line,
                host=host,
                process=process.split('/')[0],
                pid=int(pid) if pid else None,
                log_source="syslog",
                platform="linux"
            )
        
        return None


class AlertEngine:
    def __init__(self):
        self.failed_logins: Dict[str, List[datetime]] = defaultdict(list)
        self.firewall_blocks: Dict[str, List[datetime]] = defaultdict(list)
        self.sudo_failures: Dict[str, List[datetime]] = defaultdict(list)
        self.kernel_errors: List[datetime] = []
        
        self.brute_force_threshold = 5
        self.brute_force_window = timedelta(minutes=3)
        self.port_scan_threshold = 10
        self.port_scan_window = timedelta(minutes=5)
        self.sudo_failure_threshold = 3
        self.sudo_failure_window = timedelta(minutes=5)
        self.kernel_error_threshold = 5
        self.kernel_error_window = timedelta(minutes=10)
    
    def _cleanup_old_entries(self, entries: List[datetime], window: timedelta) -> List[datetime]:
        cutoff = datetime.now() - window
        return [e for e in entries if e > cutoff]
    
    def check_event(self, event: SecurityEvent) -> Optional[Alert]:
        now = datetime.now()
        
        if event.event_type == "AUTH_FAILURE" and event.src_ip:
            self.failed_logins[event.src_ip].append(now)
            self.failed_logins[event.src_ip] = self._cleanup_old_entries(
                self.failed_logins[event.src_ip], self.brute_force_window
            )
            
            if len(self.failed_logins[event.src_ip]) >= self.brute_force_threshold:
                count = len(self.failed_logins[event.src_ip])
                self.failed_logins[event.src_ip] = []
                return Alert(
                    alert_type="BRUTE_FORCE",
                    severity="critical",
                    description=f"Brute force attack detected: {count} failed login attempts from IP {event.src_ip} within {int(self.brute_force_window.total_seconds() / 60)} minutes"
                )
        
        if event.event_type == "FIREWALL_BLOCK" and event.src_ip:
            self.firewall_blocks[event.src_ip].append(now)
            self.firewall_blocks[event.src_ip] = self._cleanup_old_entries(
                self.firewall_blocks[event.src_ip], self.port_scan_window
            )
            
            if len(self.firewall_blocks[event.src_ip]) >= self.port_scan_threshold:
                count = len(self.firewall_blocks[event.src_ip])
                self.firewall_blocks[event.src_ip] = []
                return Alert(
                    alert_type="PORT_SCAN",
                    severity="warning",
                    description=f"Possible port scan detected: {count} blocked connections from IP {event.src_ip} within {int(self.port_scan_window.total_seconds() / 60)} minutes"
                )
        
        if event.event_type == "SUDO_FAILURE" and event.user:
            self.sudo_failures[event.user].append(now)
            self.sudo_failures[event.user] = self._cleanup_old_entries(
                self.sudo_failures[event.user], self.sudo_failure_window
            )
            
            if len(self.sudo_failures[event.user]) >= self.sudo_failure_threshold:
                count = len(self.sudo_failures[event.user])
                self.sudo_failures[event.user] = []
                return Alert(
                    alert_type="PRIVILEGE_ESCALATION",
                    severity="critical",
                    description=f"Possible privilege escalation attempt: {count} failed sudo attempts by user '{event.user}' within {int(self.sudo_failure_window.total_seconds() / 60)} minutes"
                )
        
        if event.event_type in ("KERNEL_ERROR", "KERNEL_WARNING", "KERNEL_SEGFAULT", "KERNEL_OOM"):
            self.kernel_errors.append(now)
            self.kernel_errors = self._cleanup_old_entries(
                self.kernel_errors, self.kernel_error_window
            )
            
            if len(self.kernel_errors) >= self.kernel_error_threshold:
                count = len(self.kernel_errors)
                self.kernel_errors = []
                return Alert(
                    alert_type="KERNEL_INSTABILITY",
                    severity="warning",
                    description=f"Kernel instability detected: {count} kernel errors/warnings within {int(self.kernel_error_window.total_seconds() / 60)} minutes"
                )
        
        return None


class LogFileTailer:
    def __init__(self, filepath: str, parser_func, log_source: str):
        self.filepath = filepath
        self.parser_func = parser_func
        self.log_source = log_source
        self.file = None
        self.inode = None
        self.position = 0
    
    def open(self, seek_end: bool = True) -> bool:
        try:
            if self.file:
                self.file.close()
            
            if not os.path.exists(self.filepath):
                logger.warning(f"File not found: {self.filepath}")
                return False
            
            if not os.access(self.filepath, os.R_OK):
                logger.warning(f"Cannot read file: {self.filepath}")
                return False
            
            self.file = open(self.filepath, 'r', encoding='utf-8', errors='replace')
            self.inode = os.stat(self.filepath).st_ino
            
            if seek_end:
                self.file.seek(0, 2)
                self.position = self.file.tell()
            
            logger.info(f"Opened log file: {self.filepath}")
            return True
        except Exception as e:
            logger.error(f"Error opening {self.filepath}: {e}")
            return False
    
    def check_rotation(self) -> bool:
        try:
            current_inode = os.stat(self.filepath).st_ino
            if current_inode != self.inode:
                return True
            if os.path.getsize(self.filepath) < self.position:
                return True
        except:
            return True
        return False
    
    def read_new_lines(self) -> List[str]:
        if not self.file:
            return []
        
        try:
            if self.check_rotation():
                logger.info(f"Log rotation detected: {self.filepath}")
                self.open(seek_end=False)
                if not self.file:
                    return []
            
            lines = []
            while True:
                line = self.file.readline()
                if not line:
                    break
                line = line.strip()
                if line:
                    lines.append(line)
                    self.position = self.file.tell()
            
            return lines
        except Exception as e:
            logger.error(f"Error reading {self.filepath}: {e}")
            return []
    
    def close(self):
        if self.file:
            try:
                self.file.close()
            except:
                pass


class OSIngestor:
    LOG_FILES = {
        '/var/log/auth.log': ('auth', LinuxLogParser.parse_auth_log),
        '/var/log/secure': ('auth', LinuxLogParser.parse_auth_log),
        '/var/log/syslog': ('syslog', LinuxLogParser.parse_syslog),
        '/var/log/messages': ('syslog', LinuxLogParser.parse_syslog),
        '/var/log/kern.log': ('kernel', LinuxLogParser.parse_kernel_log),
        '/var/log/ufw.log': ('firewall', LinuxLogParser.parse_firewall_log),
    }
    
    def __init__(self, mock_mode: bool = False):
        self.mock_mode = mock_mode or USE_MOCK_DATA
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.tailers: List[LogFileTailer] = []
        self.alert_engine = AlertEngine()
        self.running = False
        self.events_count = 0
        self.alerts_count = 0
        
        if not self.mock_mode:
            self._init_log_sources()
    
    def _init_log_sources(self):
        os_name = platform.system()
        logger.info(f"Detected OS: {os_name}")
        
        if os_name == "Linux":
            for filepath, (log_source, parser) in self.LOG_FILES.items():
                if os.path.exists(filepath) and os.access(filepath, os.R_OK):
                    tailer = LogFileTailer(filepath, parser, log_source)
                    if tailer.open(seek_end=True):
                        self.tailers.append(tailer)
                        logger.info(f"Monitoring: {filepath} ({log_source})")
            
            if not self.tailers:
                logger.warning("No log files could be monitored.")
                logger.warning("Try running with sudo or check file permissions.")
        elif os_name == "Windows":
            logger.info("Windows Event Log monitoring - use mock mode for demo")
        elif os_name == "Darwin":
            logger.info("macOS unified logging - use mock mode for demo")
    
    def insert_event(self, event: SecurityEvent) -> Optional[int]:
        try:
            result = self.supabase.table("security_events").insert(event.to_dict()).execute()
            if result.data:
                self.events_count += 1
                return result.data[0].get('id')
        except Exception as e:
            logger.error(f"Error inserting event: {e}")
        return None
    
    def insert_alert(self, alert: Alert) -> Optional[int]:
        try:
            result = self.supabase.table("alerts").insert(alert.to_dict()).execute()
            if result.data:
                self.alerts_count += 1
                return result.data[0].get('id')
        except Exception as e:
            logger.error(f"Error inserting alert: {e}")
        return None
    
    def process_line(self, line: str, tailer: LogFileTailer):
        event = tailer.parser_func(line)
        if event:
            event_id = self.insert_event(event)
            if event_id:
                logger.debug(f"Event {event_id}: {event.event_type} - {event.user}")
                
                alert = self.alert_engine.check_event(event)
                if alert:
                    alert_id = self.insert_alert(alert)
                    logger.warning(f"ALERT {alert_id}: {alert.description}")
    
    def generate_mock_event(self):
        import random
        
        event_templates = [
            {"event_type": "AUTH_FAILURE", "severity": "warning", "user": "admin", "src_ip": f"192.168.1.{random.randint(1,254)}"},
            {"event_type": "AUTH_SUCCESS", "severity": "info", "user": "admin", "src_ip": "10.0.0.5"},
            {"event_type": "SUDO_SUCCESS", "severity": "info", "user": "developer"},
            {"event_type": "SUDO_FAILURE", "severity": "warning", "user": "www-data"},
            {"event_type": "FIREWALL_BLOCK", "severity": "warning", "src_ip": f"203.0.113.{random.randint(1,254)}"},
            {"event_type": "SERVICE_START", "severity": "info", "process": "nginx"},
            {"event_type": "SERVICE_STOP", "severity": "info", "process": "apache2"},
            {"event_type": "KERNEL_WARNING", "severity": "warning", "process": "kernel"},
            {"event_type": "SESSION_START", "severity": "info", "user": "root"},
        ]
        
        template = random.choice(event_templates)
        event = SecurityEvent(
            event_time=datetime.now(),
            event_type=template["event_type"],
            severity=template["severity"],
            raw_message=f"[MOCK] {template['event_type']} event generated at {datetime.now().isoformat()}",
            host="mock-host",
            process=template.get("process", "sshd"),
            user=template.get("user"),
            src_ip=template.get("src_ip"),
            log_source="mock",
            platform=platform.system().lower()
        )
        
        event_id = self.insert_event(event)
        if event_id:
            logger.info(f"[MOCK] Event {event_id}: {event.event_type}")
            
            alert = self.alert_engine.check_event(event)
            if alert:
                alert_id = self.insert_alert(alert)
                logger.warning(f"[MOCK] ALERT {alert_id}: {alert.description}")
    
    def run(self, poll_interval: float = 1.0, mock_interval: float = 10.0):
        self.running = True
        
        logger.info("=" * 60)
        if self.mock_mode:
            logger.info("OS INGESTOR STARTED - MOCK MODE")
            logger.info("Generating simulated events every %.1f seconds" % mock_interval)
        else:
            logger.info("OS INGESTOR STARTED - REAL MODE")
            logger.info(f"Monitoring {len(self.tailers)} log files")
        logger.info("=" * 60)
        logger.info("Press Ctrl+C to stop")
        
        last_mock_time = time.time()
        
        try:
            while self.running:
                if self.mock_mode:
                    if time.time() - last_mock_time >= mock_interval:
                        self.generate_mock_event()
                        last_mock_time = time.time()
                else:
                    for tailer in self.tailers:
                        lines = tailer.read_new_lines()
                        for line in lines:
                            self.process_line(line, tailer)
                
                time.sleep(poll_interval)
        except KeyboardInterrupt:
            logger.info("\nShutdown requested...")
        finally:
            self.stop()
    
    def stop(self):
        self.running = False
        for tailer in self.tailers:
            tailer.close()
        
        logger.info("=" * 60)
        logger.info("OS INGESTOR STOPPED")
        logger.info(f"Total events processed: {self.events_count}")
        logger.info(f"Total alerts generated: {self.alerts_count}")
        logger.info("=" * 60)


def main():
    parser = argparse.ArgumentParser(description="Real-Time OS Security Event Ingestor")
    parser.add_argument("--mock", action="store_true", help="Run in mock data mode")
    parser.add_argument("--interval", type=float, default=1.0, help="Poll interval in seconds")
    parser.add_argument("--mock-interval", type=float, default=10.0, help="Mock event interval in seconds")
    args = parser.parse_args()
    
    mock_mode = args.mock or USE_MOCK_DATA
    
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║          SecLogger - OS Security Event Ingestor              ║
╠══════════════════════════════════════════════════════════════╣
║  Mode: {"MOCK DATA" if mock_mode else "REAL OS LOGS":^52} ║
║  Supabase URL: {SUPABASE_URL[:45]:45}... ║
╚══════════════════════════════════════════════════════════════╝
""")
    
    ingestor = OSIngestor(mock_mode=mock_mode)
    
    def signal_handler(sig, frame):
        ingestor.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    ingestor.run(poll_interval=args.interval, mock_interval=args.mock_interval)


if __name__ == "__main__":
    main()
