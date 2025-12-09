import { SecurityEvent, Alert, Stats } from "./api";

const EVENT_TYPES = [
  "FAILED_LOGIN", "SUCCESS_LOGIN", "SUDO_COMMAND", "PRIV_ESCALATION", 
  "AUTH_FAILURE", "AUTH_SUCCESS", "FIREWALL_BLOCK", "SESSION_START",
  "SESSION_END", "SUDO_SUCCESS", "SUDO_FAILURE", "CONNECTION_CLOSED",
  "SERVICE_START", "SERVICE_STOP", "SERVICE_FAILURE", "KERNEL_WARNING", "KERNEL_ERROR"
] as const;

const OS_NAMES = ["Linux", "Windows", "macOS"] as const;
const SEVERITIES = ["critical", "high", "medium", "low", "info", "warning", "error"] as const;
const LOG_SOURCES = ["auth", "syslog", "kernel", "firewall", "audit"] as const;

const USERNAMES = ["root", "admin", "john.doe", "alice", "bob", "guest", "www-data", "mysql", "postgres", "ubuntu", "deploy", "nginx"];
const IPS = ["192.168.1.100", "10.0.0.15", "172.16.0.50", "203.0.113.42", "198.51.100.23", "192.168.2.55", "10.10.10.10", "45.33.32.156", "104.16.249.249", null];
const PROCESSES = ["sshd", "sudo", "login", "su", "systemd", "kernel", "ufw", "pam_unix", "cron", "nginx", "apache2", null];
const HOSTS = ["server-01", "web-prod-1", "db-master", "app-server", "localhost"];

const MESSAGES: Record<string, string[]> = {
  AUTH_FAILURE: [
    "Failed password for {user} from {ip} port 22 ssh2",
    "pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost={ip} user={user}",
    "Failed password for invalid user {user} from {ip} port 52431 ssh2",
    "Invalid user {user} from {ip} port 33521",
  ],
  AUTH_SUCCESS: [
    "Accepted password for {user} from {ip} port 22 ssh2",
    "Accepted publickey for {user} from {ip} port 49521 ssh2",
    "pam_unix(sshd:session): session opened for user {user}",
  ],
  SUDO_SUCCESS: [
    "{user} : TTY=pts/0 ; PWD=/home/{user} ; USER=root ; COMMAND=/bin/bash",
    "{user} : TTY=pts/1 ; PWD=/root ; USER=root ; COMMAND=/usr/bin/apt update",
    "{user} : TTY=pts/2 ; PWD=/var/log ; USER=root ; COMMAND=/bin/cat auth.log",
  ],
  SUDO_FAILURE: [
    "pam_unix(sudo:auth): authentication failure; logname={user} uid=1000 euid=0",
    "{user} : 3 incorrect password attempts ; TTY=pts/0 ; PWD=/home/{user}",
  ],
  SESSION_START: [
    "pam_unix(sshd:session): session opened for user {user}",
    "New session 1234 of user {user}",
  ],
  SESSION_END: [
    "pam_unix(sshd:session): session closed for user {user}",
    "Removed session 1234",
  ],
  FIREWALL_BLOCK: [
    "[UFW BLOCK] IN=eth0 OUT= MAC=00:00:00:00:00:00 SRC={ip} DST=192.168.1.1 LEN=60 PROTO=TCP SPT=49521 DPT=22",
    "[UFW BLOCK] IN=eth0 SRC={ip} DST=10.0.0.1 PROTO=TCP DPT=3389 WINDOW=65535",
    "[UFW BLOCK] IN=eth0 SRC={ip} DST=172.16.0.1 PROTO=UDP DPT=53",
  ],
  FIREWALL_ALLOW: [
    "[UFW ALLOW] IN=eth0 SRC={ip} DST=192.168.1.1 PROTO=TCP DPT=443",
  ],
  SERVICE_START: [
    "Started nginx.service - A high performance web server",
    "Started sshd.service - OpenSSH server daemon",
    "Started mysql.service - MySQL Community Server",
  ],
  SERVICE_STOP: [
    "Stopped nginx.service - A high performance web server",
    "Stopped apache2.service - The Apache HTTP Server",
  ],
  SERVICE_FAILURE: [
    "Failed to start nginx.service - A high performance web server",
    "mysql.service: Main process exited, code=exited, status=1/FAILURE",
  ],
  KERNEL_WARNING: [
    "WARNING: CPU: 0 PID: 1234 at drivers/net/ethernet/intel/igb/igb_main.c:1234",
    "ACPI Warning: SystemIO range 0x0000-0x000F conflicts with OpRegion",
  ],
  KERNEL_ERROR: [
    "Out of memory: Killed process 1234 (mysqld) total-vm:2048MB",
    "EXT4-fs error (device sda1): ext4_find_entry:1234",
    "soft lockup - CPU#0 stuck for 22s!",
  ],
  CONNECTION_CLOSED: [
    "Connection closed by {ip} port 49521 [preauth]",
    "Disconnected from {ip} port 22",
  ],
};

const ALERT_TYPES = [
  { type: "BRUTE_FORCE", severity: "critical" },
  { type: "PORT_SCAN", severity: "critical" },
  { type: "FIREWALL_ATTACK", severity: "high" },
  { type: "SUSPICIOUS_SUDO", severity: "critical" },
  { type: "PRIVILEGE_ESCALATION", severity: "critical" },
  { type: "SYSTEM_INSTABILITY", severity: "high" },
  { type: "SERVICE_FAILURES", severity: "high" },
  { type: "RAPID_LOGIN", severity: "high" },
  { type: "SUDO_ABUSE", severity: "high" },
];

function randomItem<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp(): string {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`;
}

function generateMessage(eventType: string, user: string, ip: string | null): string {
  const templates = MESSAGES[eventType] || MESSAGES.AUTH_FAILURE;
  let msg = randomItem(templates);
  msg = msg.replace(/{user}/g, user);
  msg = msg.replace(/{ip}/g, ip || randomIp());
  return msg;
}

function getEventSeverity(eventType: string): string {
  const severityMap: Record<string, string> = {
    AUTH_FAILURE: "warning",
    AUTH_SUCCESS: "info",
    SUDO_SUCCESS: "info",
    SUDO_FAILURE: "warning",
    SESSION_START: "info",
    SESSION_END: "info",
    FIREWALL_BLOCK: "warning",
    FIREWALL_ALLOW: "info",
    SERVICE_START: "info",
    SERVICE_STOP: "info",
    SERVICE_FAILURE: "error",
    KERNEL_WARNING: "warning",
    KERNEL_ERROR: "error",
    CONNECTION_CLOSED: "info",
  };
  return severityMap[eventType] || "info";
}

function getLogSource(eventType: string): string {
  const sourceMap: Record<string, string> = {
    AUTH_FAILURE: "auth",
    AUTH_SUCCESS: "auth",
    SUDO_SUCCESS: "auth",
    SUDO_FAILURE: "auth",
    SESSION_START: "auth",
    SESSION_END: "auth",
    FIREWALL_BLOCK: "firewall",
    FIREWALL_ALLOW: "firewall",
    SERVICE_START: "syslog",
    SERVICE_STOP: "syslog",
    SERVICE_FAILURE: "syslog",
    KERNEL_WARNING: "kernel",
    KERNEL_ERROR: "kernel",
    CONNECTION_CLOSED: "auth",
  };
  return sourceMap[eventType] || "syslog";
}

let eventIdCounter = 1;
let alertIdCounter = 1;
export const storedEvents: SecurityEvent[] = [];
export const storedAlerts: Alert[] = [];

export function generateEvent(): SecurityEvent {
  const eventType = randomItem(EVENT_TYPES);
  const osName = randomItem(OS_NAMES);
  const username = randomItem(USERNAMES);
  const sourceIp = eventType.includes("FIREWALL") || eventType.includes("AUTH") || eventType === "CONNECTION_CLOSED"
    ? randomItem(IPS) || randomIp()
    : null;
  const processName = randomItem(PROCESSES);
  const host = randomItem(HOSTS);

  const now = new Date();
  const event: SecurityEvent = {
    id: eventIdCounter++,
    created_at: now.toISOString(),
    event_time: now.toISOString(),
    timestamp: now.toISOString(),
    host: host,
    process: processName ?? undefined,
    process_name: processName ?? undefined,
    pid: Math.floor(Math.random() * 65000) + 1000,
    event_type: eventType,
    user: username,
    username: username,
    src_ip: sourceIp ?? undefined,
    source_ip: sourceIp ?? undefined,
    dst_ip: eventType.includes("FIREWALL") ? randomIp() : undefined,
    severity: getEventSeverity(eventType),
    log_source: getLogSource(eventType),
    raw_message: generateMessage(eventType, username, sourceIp),
    os_name: osName,
  };

  storedEvents.unshift(event);
  if (storedEvents.length > 1000) {
    storedEvents.pop();
  }

  if ((eventType === "AUTH_FAILURE" && Math.random() < 0.2) ||
      (eventType === "FIREWALL_BLOCK" && Math.random() < 0.15) ||
      (eventType === "SUDO_FAILURE" && Math.random() < 0.3)) {
    generateAlertFromEvent(event);
  }

  return event;
}

function generateAlertFromEvent(event: SecurityEvent): Alert {
  const alertConfig = event.event_type === "AUTH_FAILURE" 
    ? { type: "BRUTE_FORCE", severity: "critical" }
    : event.event_type === "FIREWALL_BLOCK"
    ? { type: "FIREWALL_ATTACK", severity: "high" }
    : event.event_type === "SUDO_FAILURE"
    ? { type: "SUDO_ABUSE", severity: "high" }
    : randomItem(ALERT_TYPES);

  const descriptions: Record<string, string[]> = {
    BRUTE_FORCE: [
      `Brute force suspected: ${Math.floor(Math.random() * 10) + 5} failed login attempts for user '${event.user}' in 10 minutes`,
      `Brute force suspected: ${Math.floor(Math.random() * 15) + 5} failed login attempts from IP '${event.src_ip}' in 10 minutes`,
    ],
    FIREWALL_ATTACK: [
      `Firewall attack detected: ${Math.floor(Math.random() * 30) + 20} blocked connections from ${event.src_ip} in 5 minutes`,
    ],
    PORT_SCAN: [
      `Port scan detected: ${event.src_ip} probed ${Math.floor(Math.random() * 50) + 10} different ports`,
    ],
    SUSPICIOUS_SUDO: [
      `Suspicious sudo: Service account '${event.user}' attempted sudo command`,
    ],
    SUDO_ABUSE: [
      `Repeated sudo failures: User '${event.user}' had ${Math.floor(Math.random() * 5) + 3} failed sudo attempts`,
    ],
    PRIVILEGE_ESCALATION: [
      `Suspicious sudo usage: service account '${event.user}' executed sudo command`,
    ],
    SYSTEM_INSTABILITY: [
      `System instability detected: ${Math.floor(Math.random() * 15) + 10} kernel warnings/errors in 10 minutes`,
    ],
    SERVICE_FAILURES: [
      `Multiple service failures: ${Math.floor(Math.random() * 5) + 3} services failed in 15 minutes`,
    ],
    RAPID_LOGIN: [
      `Rapid logins: User '${event.user}' logged in ${Math.floor(Math.random() * 5) + 5} times from ${Math.floor(Math.random() * 3) + 2} different IPs`,
    ],
  };

  const now = new Date();
  const alert: Alert = {
    id: alertIdCounter++,
    created_at: now.toISOString(),
    timestamp: now.toISOString(),
    alert_type: alertConfig.type,
    severity: alertConfig.severity,
    description: randomItem(descriptions[alertConfig.type] || descriptions.BRUTE_FORCE),
    related_event_ids: String(event.id),
    status: randomItem(["active", "active", "active", "acknowledged"]),
  };

  storedAlerts.unshift(alert);
  if (storedAlerts.length > 200) {
    storedAlerts.pop();
  }

  return alert;
}

export function initializeMockData(): void {
  if (storedEvents.length > 0) return;

  const now = Date.now();
  for (let i = 0; i < 100; i++) {
    const event = generateEvent();
    event.timestamp = new Date(now - Math.random() * 3600000).toISOString();
    event.event_time = event.timestamp;
    event.created_at = event.timestamp;
    event.id = i + 1;
  }
  eventIdCounter = 101;

  storedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  storedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getEvents(params?: {
  page?: number;
  pageSize?: number;
  limit?: number;
  type?: string;
  os?: string;
  user?: string;
  srcIp?: string;
  severity?: string;
  search?: string;
  since_minutes?: number;
}): { events: SecurityEvent[]; total: number; count: number; page: number; pageSize: number; totalPages: number } {
  initializeMockData();

  let filtered = [...storedEvents];

  if (params?.type) {
    filtered = filtered.filter(e => e.event_type === params.type);
  }
  if (params?.os) {
    filtered = filtered.filter(e => e.os_name === params.os);
  }
  if (params?.user) {
    filtered = filtered.filter(e => e.user?.toLowerCase().includes(params.user!.toLowerCase()));
  }
  if (params?.srcIp) {
    filtered = filtered.filter(e => e.src_ip?.includes(params.srcIp!));
  }
  if (params?.severity) {
    filtered = filtered.filter(e => e.severity === params.severity);
  }
  if (params?.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(e => 
      e.raw_message.toLowerCase().includes(search) ||
      e.user?.toLowerCase().includes(search) ||
      e.src_ip?.includes(search) ||
      e.process?.toLowerCase().includes(search)
    );
  }
  if (params?.since_minutes) {
    const cutoff = Date.now() - params.since_minutes * 60 * 1000;
    filtered = filtered.filter(e => new Date(e.timestamp).getTime() >= cutoff);
  }

  const total = filtered.length;
  const page = params?.page || 1;
  const pageSize = params?.pageSize || params?.limit || 50;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    events: paged,
    total,
    count: paged.length,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function getAlerts(params?: {
  page?: number;
  pageSize?: number;
  limit?: number;
  severity?: string;
  status?: string;
  since_minutes?: number;
}): { alerts: Alert[]; total: number; count: number; page: number; pageSize: number; totalPages: number } {
  initializeMockData();

  let filtered = [...storedAlerts];

  if (params?.severity) {
    filtered = filtered.filter(a => a.severity === params.severity);
  }
  if (params?.status) {
    filtered = filtered.filter(a => a.status === params.status);
  }
  if (params?.since_minutes) {
    const cutoff = Date.now() - params.since_minutes * 60 * 1000;
    filtered = filtered.filter(a => new Date(a.timestamp).getTime() >= cutoff);
  }

  const total = filtered.length;
  const page = params?.page || 1;
  const pageSize = params?.pageSize || params?.limit || 50;
  const start = (page - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    alerts: paged,
    total,
    count: paged.length,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function getStats(): Stats {
  initializeMockData();

  const events_by_type: Record<string, number> = {};
  const events_by_os: Record<string, number> = {};
  const events_by_severity: Record<string, number> = {};
  const ip_counts: Record<string, number> = {};
  const user_counts: Record<string, number> = {};

  for (const event of storedEvents) {
    events_by_type[event.event_type] = (events_by_type[event.event_type] || 0) + 1;
    events_by_os[event.os_name] = (events_by_os[event.os_name] || 0) + 1;
    if (event.severity) {
      events_by_severity[event.severity] = (events_by_severity[event.severity] || 0) + 1;
    }
    if (event.src_ip) {
      ip_counts[event.src_ip] = (ip_counts[event.src_ip] || 0) + 1;
    }
    if (event.user) {
      user_counts[event.user] = (user_counts[event.user] || 0) + 1;
    }
  }

  const alerts_by_severity: Record<string, number> = {};
  const alerts_by_status: Record<string, number> = {};
  for (const alert of storedAlerts) {
    alerts_by_severity[alert.severity] = (alerts_by_severity[alert.severity] || 0) + 1;
    if (alert.status) {
      alerts_by_status[alert.status] = (alerts_by_status[alert.status] || 0) + 1;
    }
  }

  const top_source_ips = Object.entries(ip_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  const top_users = Object.entries(user_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([user, count]) => ({ user, count }));

  const now = new Date();
  const hourly_events = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    hour.setMinutes(0, 0, 0);
    const hourStr = hour.toISOString().slice(0, 13) + ":00:00";
    const count = storedEvents.filter(e => {
      const eventHour = new Date(e.timestamp);
      eventHour.setMinutes(0, 0, 0);
      return eventHour.toISOString().slice(0, 13) === hour.toISOString().slice(0, 13);
    }).length;
    hourly_events.push({ hour: hourStr, count });
  }

  const failed_logins = storedEvents.filter(e => e.event_type === "AUTH_FAILURE").length;
  const successful_logins = storedEvents.filter(e => e.event_type === "AUTH_SUCCESS").length;
  const unique_ips = Object.keys(ip_counts).length;

  return {
    total_events: storedEvents.length,
    total_alerts: storedAlerts.length,
    events_by_type,
    events_by_os,
    events_by_severity,
    alerts_by_severity,
    alerts_by_status,
    top_source_ips,
    top_users,
    hourly_events,
    failed_logins,
    successful_logins,
    unique_ips,
  };
}

let generationInterval: NodeJS.Timeout | null = null;

export function startEventGeneration(intervalMs: number = 5000): void {
  if (generationInterval) return;
  initializeMockData();
  generationInterval = setInterval(() => {
    generateEvent();
  }, intervalMs);
}

export function stopEventGeneration(): void {
  if (generationInterval) {
    clearInterval(generationInterval);
    generationInterval = null;
  }
}