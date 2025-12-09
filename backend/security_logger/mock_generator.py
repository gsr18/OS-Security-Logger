"""Mock event generator for demo/testing purposes."""

import random
import socket
from datetime import datetime, timedelta
from typing import List
from .events import SecurityEvent, Alert


def get_hostname() -> str:
    try:
        return socket.gethostname()
    except Exception:
        return "localhost"


USERNAMES = ['root', 'admin', 'user', 'ubuntu', 'centos', 'deploy', 'www-data', 'nginx', 'apache', 'mysql', 'postgres', 'guest', 'test']
PROCESSES = ['sshd', 'sudo', 'login', 'pam_unix', 'systemd', 'kernel', 'ufw', 'cron', 'apache2', 'nginx']

EVENT_TYPES = [
    ('AUTH_FAILURE', 'warning', 'auth'),
    ('AUTH_SUCCESS', 'info', 'auth'),
    ('SUDO_SUCCESS', 'info', 'auth'),
    ('SUDO_FAILURE', 'warning', 'auth'),
    ('SESSION_START', 'info', 'auth'),
    ('SESSION_END', 'info', 'auth'),
    ('FIREWALL_BLOCK', 'warning', 'firewall'),
    ('FIREWALL_ALLOW', 'info', 'firewall'),
    ('SERVICE_START', 'info', 'syslog'),
    ('SERVICE_STOP', 'info', 'syslog'),
    ('SERVICE_FAILURE', 'error', 'syslog'),
    ('KERNEL_WARNING', 'warning', 'kernel'),
    ('KERNEL_ERROR', 'error', 'kernel'),
    ('CONNECTION_CLOSED', 'info', 'auth'),
]

OS_NAMES = ['Linux', 'Windows', 'macOS']


def random_ip() -> str:
    """Generate a random IP address."""
    if random.random() < 0.3:
        return f"192.168.{random.randint(1, 254)}.{random.randint(1, 254)}"
    elif random.random() < 0.5:
        return f"10.0.{random.randint(0, 255)}.{random.randint(1, 254)}"
    else:
        return f"{random.randint(1, 223)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(1, 254)}"


def generate_raw_message(event_type: str, user: str, src_ip: str, process: str) -> str:
    """Generate a realistic raw log message."""
    timestamp = datetime.now().strftime("%b %d %H:%M:%S")
    host = get_hostname()
    
    messages = {
        'AUTH_FAILURE': f"{timestamp} {host} {process}[{random.randint(1000, 65000)}]: Failed password for {'invalid user ' if random.random() < 0.3 else ''}{user} from {src_ip} port {random.randint(30000, 65000)} ssh2",
        'AUTH_SUCCESS': f"{timestamp} {host} {process}[{random.randint(1000, 65000)}]: Accepted password for {user} from {src_ip} port {random.randint(30000, 65000)} ssh2",
        'SUDO_SUCCESS': f"{timestamp} {host} sudo: {user} : TTY=pts/{random.randint(0, 9)} ; PWD=/home/{user} ; USER=root ; COMMAND=/bin/{random.choice(['ls', 'cat', 'systemctl', 'apt', 'yum'])}",
        'SUDO_FAILURE': f"{timestamp} {host} sudo: pam_unix(sudo:auth): authentication failure; logname={user} uid={random.randint(1000, 65000)} euid=0 tty=/dev/pts/{random.randint(0, 9)} ruser={user} rhost=",
        'SESSION_START': f"{timestamp} {host} {process}[{random.randint(1000, 65000)}]: pam_unix(sshd:session): session opened for user {user}",
        'SESSION_END': f"{timestamp} {host} {process}[{random.randint(1000, 65000)}]: pam_unix(sshd:session): session closed for user {user}",
        'FIREWALL_BLOCK': f"{timestamp} {host} kernel: [{random.randint(1000, 99999)}.{random.randint(100, 999)}] [UFW BLOCK] IN=eth0 OUT= MAC=00:00:00:00:00:00 SRC={src_ip} DST={random_ip()} LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID={random.randint(1, 65000)} DF PROTO=TCP SPT={random.randint(30000, 65000)} DPT={random.randint(1, 1024)} WINDOW=64240 RES=0x00 SYN URGP=0",
        'FIREWALL_ALLOW': f"{timestamp} {host} kernel: [{random.randint(1000, 99999)}.{random.randint(100, 999)}] [UFW ALLOW] IN=eth0 OUT= MAC=00:00:00:00:00:00 SRC={src_ip} DST={random_ip()} LEN=60 PROTO=TCP SPT={random.randint(30000, 65000)} DPT=443",
        'SERVICE_START': f"{timestamp} {host} systemd[1]: Started {random.choice(['nginx.service', 'apache2.service', 'sshd.service', 'mysql.service', 'postgresql.service'])}.",
        'SERVICE_STOP': f"{timestamp} {host} systemd[1]: Stopped {random.choice(['nginx.service', 'apache2.service', 'sshd.service', 'mysql.service', 'postgresql.service'])}.",
        'SERVICE_FAILURE': f"{timestamp} {host} systemd[1]: Failed to start {random.choice(['nginx.service', 'apache2.service', 'backup.service'])}.",
        'KERNEL_WARNING': f"{timestamp} {host} kernel: [{random.randint(1000, 99999)}.{random.randint(100, 999)}] WARNING: CPU: {random.randint(0, 7)} PID: {random.randint(1, 65000)} at {random.choice(['drivers/net', 'fs/ext4', 'mm/memory'])}",
        'KERNEL_ERROR': f"{timestamp} {host} kernel: [{random.randint(1000, 99999)}.{random.randint(100, 999)}] ERROR: {random.choice(['Out of memory', 'I/O error', 'soft lockup detected'])}",
        'CONNECTION_CLOSED': f"{timestamp} {host} sshd[{random.randint(1000, 65000)}]: Connection closed by {src_ip} port {random.randint(30000, 65000)}",
    }
    
    return messages.get(event_type, f"{timestamp} {host} {process}: {event_type} event for {user}")


def generate_mock_event() -> SecurityEvent:
    """Generate a single mock security event."""
    event_type, severity, log_source = random.choice(EVENT_TYPES)
    user = random.choice(USERNAMES)
    src_ip = random_ip() if event_type not in ('SERVICE_START', 'SERVICE_STOP', 'SERVICE_FAILURE', 'KERNEL_WARNING', 'KERNEL_ERROR') else None
    process = random.choice(PROCESSES)
    
    event_time = datetime.now() - timedelta(seconds=random.randint(0, 300))
    
    return SecurityEvent(
        event_time=event_time,
        host=get_hostname(),
        process=process,
        pid=random.randint(1000, 65000),
        event_type=event_type,
        user=user,
        src_ip=src_ip,
        dst_ip=random_ip() if event_type.startswith('FIREWALL') else None,
        severity=severity,
        log_source=log_source,
        raw_message=generate_raw_message(event_type, user, src_ip or '127.0.0.1', process),
        os_name=random.choices(OS_NAMES, weights=[0.7, 0.2, 0.1])[0]
    )


def generate_mock_events(count: int = 50) -> List[SecurityEvent]:
    """Generate multiple mock events."""
    events = []
    for i in range(count):
        event = generate_mock_event()
        event.event_time = datetime.now() - timedelta(seconds=i * random.randint(10, 60))
        events.append(event)
    return events


def generate_mock_alert() -> Alert:
    """Generate a mock alert."""
    alert_types = [
        ('BRUTE_FORCE', 'critical', 'Brute force attack detected: Multiple failed login attempts'),
        ('FIREWALL_ATTACK', 'high', 'Firewall attack detected: Rapid connection attempts blocked'),
        ('PORT_SCAN', 'critical', 'Port scan detected: Multiple ports probed from single IP'),
        ('SUSPICIOUS_SUDO', 'critical', 'Suspicious sudo usage detected from service account'),
        ('PRIVILEGE_ESCALATION', 'critical', 'Potential privilege escalation attempt detected'),
        ('SYSTEM_INSTABILITY', 'high', 'System instability: Multiple kernel errors detected'),
        ('SERVICE_FAILURES', 'high', 'Multiple service failures detected'),
        ('RAPID_LOGIN', 'high', 'Rapid logins from multiple IPs detected'),
    ]
    
    alert_type, severity, base_desc = random.choice(alert_types)
    
    details = {
        'BRUTE_FORCE': f" from IP {random_ip()} targeting user '{random.choice(USERNAMES)}'",
        'FIREWALL_ATTACK': f" from IP {random_ip()}",
        'PORT_SCAN': f" from IP {random_ip()} ({random.randint(10, 100)} ports scanned)",
        'SUSPICIOUS_SUDO': f" by user '{random.choice(['www-data', 'nobody', 'guest'])}'",
        'PRIVILEGE_ESCALATION': f" involving user '{random.choice(USERNAMES)}'",
        'SYSTEM_INSTABILITY': f" ({random.randint(5, 20)} errors in last 10 minutes)",
        'SERVICE_FAILURES': f" ({random.randint(3, 10)} services affected)",
        'RAPID_LOGIN': f" for user '{random.choice(USERNAMES)}' from {random.randint(2, 5)} IPs",
    }
    
    return Alert(
        created_at=datetime.now() - timedelta(minutes=random.randint(0, 60)),
        alert_type=alert_type,
        severity=severity,
        description=base_desc + details.get(alert_type, ''),
        related_event_ids=','.join(str(random.randint(1, 1000)) for _ in range(random.randint(1, 10))),
        status=random.choice(['active', 'active', 'active', 'acknowledged', 'resolved'])
    )


def generate_mock_alerts(count: int = 10) -> List[Alert]:
    """Generate multiple mock alerts."""
    return [generate_mock_alert() for _ in range(count)]


def seed_database_with_mock_data(database, event_count: int = 100, alert_count: int = 15):
    """Seed the database with mock data for testing."""
    events = generate_mock_events(event_count)
    for event in events:
        database.insert_event(event)
    
    alerts = generate_mock_alerts(alert_count)
    for alert in alerts:
        database.insert_alert(alert)
    
    return len(events), len(alerts)
