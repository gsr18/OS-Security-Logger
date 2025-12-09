import { SecurityEvent, Alert, Stats } from "./api";

const EVENT_TYPES = ["FAILED_LOGIN", "SUCCESS_LOGIN", "SUDO_COMMAND", "PRIV_ESCALATION"] as const;
const OS_NAMES = ["Linux", "Windows", "Darwin"] as const;
const SEVERITIES = ["CRITICAL", "WARNING", "INFO"] as const;

const USERNAMES = ["root", "admin", "john.doe", "alice", "bob", "guest", "www-data", "mysql", "postgres", "ubuntu"];
const IPS = ["192.168.1.100", "10.0.0.15", "172.16.0.50", "203.0.113.42", "198.51.100.23", "192.168.2.55", "10.10.10.10", null];
const PROCESSES = ["sshd", "sudo", "login", "su", "systemd-logind", "gdm-password", "polkit-1", "pkexec", null];

const MESSAGES: Record<string, string[]> = {
  FAILED_LOGIN: [
    "Failed password for {user} from {ip} port 22 ssh2",
    "pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost={ip} user={user}",
    "Failed password for invalid user {user} from {ip} port 52431 ssh2",
    "Authentication failure for {user} from {ip}",
  ],
  SUCCESS_LOGIN: [
    "Accepted password for {user} from {ip} port 22 ssh2",
    "pam_unix(sshd:session): session opened for user {user}",
    "New session 1234 of user {user}",
    "User {user} logged in from {ip}",
  ],
  SUDO_COMMAND: [
    "{user} : TTY=pts/0 ; PWD=/home/{user} ; USER=root ; COMMAND=/bin/bash",
    "{user} : TTY=pts/1 ; PWD=/root ; USER=root ; COMMAND=/usr/bin/apt update",
    "pam_unix(sudo:session): session opened for user root by {user}(uid=0)",
    "{user} executed /bin/systemctl restart nginx",
  ],
  PRIV_ESCALATION: [
    "pkexec: {user}: Executing command [USER=root] [TTY=unknown]",
    "Successful su for root by {user}",
    "pam_unix(su:session): session opened for user root by {user}(uid=1000)",
    "{user} gained root privileges via sudo",
  ],
};

const ALERT_DESCRIPTIONS: Record<string, string[]> = {
  BRUTE_FORCE_SUSPECTED: [
    "Multiple failed login attempts detected for user '{user}' ({count} attempts in {window} minutes)",
    "Possible brute-force attack from IP {ip}: {count} failed attempts in {window} minutes",
    "Account '{user}' under attack: {count} authentication failures detected",
  ],
  SUSPICIOUS_SUDO: [
    "Unusual sudo activity detected for user '{user}'",
    "User '{user}' executed privileged command: {cmd}",
    "First-time sudo usage detected for user '{user}'",
  ],
  RAPID_LOGIN_ATTEMPTS: [
    "Rapid login attempts from multiple users at IP {ip}",
    "{count} login attempts for different accounts from {ip} in {window} seconds",
  ],
  PRIV_ESCALATION_DETECTED: [
    "Privilege escalation detected: user '{user}' gained elevated access",
    "Unauthorized privilege escalation attempt by '{user}'",
  ],
};

function randomItem<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMessage(eventType: string, user: string, ip: string | null): string {
  const templates = MESSAGES[eventType] || MESSAGES.FAILED_LOGIN;
  let msg = randomItem(templates);
  msg = msg.replace(/{user}/g, user);
  msg = msg.replace(/{ip}/g, ip || "unknown");
  return msg;
}

function generateAlertDescription(alertType: string, user: string, ip: string | null): string {
  const templates = ALERT_DESCRIPTIONS[alertType] || ALERT_DESCRIPTIONS.BRUTE_FORCE_SUSPECTED;
  let desc = randomItem(templates);
  desc = desc.replace(/{user}/g, user);
  desc = desc.replace(/{ip}/g, ip || "unknown");
  desc = desc.replace(/{count}/g, String(Math.floor(Math.random() * 20) + 5));
  desc = desc.replace(/{window}/g, String(Math.floor(Math.random() * 10) + 5));
  desc = desc.replace(/{cmd}/g, "/usr/bin/apt install -y");
  return desc;
}

let eventIdCounter = 1;
let alertIdCounter = 1;
const storedEvents: SecurityEvent[] = [];
const storedAlerts: Alert[] = [];

export function generateEvent(): SecurityEvent {
  const eventType = randomItem(EVENT_TYPES);
  const osName = randomItem(OS_NAMES);
  const username = randomItem(USERNAMES);
  const sourceIp = randomItem(IPS);
  const processName = randomItem(PROCESSES);

  const event: SecurityEvent = {
    id: eventIdCounter++,
    timestamp: new Date().toISOString(),
    os_name: osName,
    event_type: eventType,
    username: username,
    source_ip: sourceIp,
    process_name: processName,
    raw_message: generateMessage(eventType, username, sourceIp),
  };

  storedEvents.unshift(event);
  if (storedEvents.length > 1000) {
    storedEvents.pop();
  }

  if (eventType === "FAILED_LOGIN" && Math.random() < 0.3) {
    generateAlertFromEvent(event);
  }

  return event;
}

function generateAlertFromEvent(event: SecurityEvent): Alert {
  const alertTypes = ["BRUTE_FORCE_SUSPECTED", "SUSPICIOUS_SUDO", "RAPID_LOGIN_ATTEMPTS", "PRIV_ESCALATION_DETECTED"];
  const alertType = event.event_type === "FAILED_LOGIN" 
    ? "BRUTE_FORCE_SUSPECTED" 
    : event.event_type === "SUDO_COMMAND"
    ? "SUSPICIOUS_SUDO"
    : randomItem(alertTypes);

  const alert: Alert = {
    id: alertIdCounter++,
    timestamp: new Date().toISOString(),
    alert_type: alertType,
    severity: alertType === "BRUTE_FORCE_SUSPECTED" ? "CRITICAL" : randomItem(SEVERITIES),
    description: generateAlertDescription(alertType, event.username || "unknown", event.source_ip),
    related_event_ids: String(event.id),
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
  for (let i = 0; i < 50; i++) {
    const event = generateEvent();
    event.timestamp = new Date(now - Math.random() * 3600000).toISOString();
    event.id = i + 1;
  }
  eventIdCounter = 51;

  storedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  storedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getEvents(params?: {
  limit?: number;
  type?: string;
  os?: string;
  since_minutes?: number;
}): { events: SecurityEvent[]; count: number } {
  initializeMockData();

  let filtered = [...storedEvents];

  if (params?.type) {
    filtered = filtered.filter(e => e.event_type === params.type);
  }
  if (params?.os) {
    filtered = filtered.filter(e => e.os_name === params.os);
  }
  if (params?.since_minutes) {
    const cutoff = Date.now() - params.since_minutes * 60 * 1000;
    filtered = filtered.filter(e => new Date(e.timestamp).getTime() >= cutoff);
  }

  const limit = params?.limit || 100;
  filtered = filtered.slice(0, limit);

  return { events: filtered, count: filtered.length };
}

export function getAlerts(params?: {
  limit?: number;
  severity?: string;
  since_minutes?: number;
}): { alerts: Alert[]; count: number } {
  initializeMockData();

  let filtered = [...storedAlerts];

  if (params?.severity) {
    filtered = filtered.filter(a => a.severity === params.severity);
  }
  if (params?.since_minutes) {
    const cutoff = Date.now() - params.since_minutes * 60 * 1000;
    filtered = filtered.filter(a => new Date(a.timestamp).getTime() >= cutoff);
  }

  const limit = params?.limit || 100;
  filtered = filtered.slice(0, limit);

  return { alerts: filtered, count: filtered.length };
}

export function getStats(): Stats {
  initializeMockData();

  const events_by_type: Record<string, number> = {};
  const events_by_os: Record<string, number> = {};
  const ip_counts: Record<string, number> = {};

  for (const event of storedEvents) {
    events_by_type[event.event_type] = (events_by_type[event.event_type] || 0) + 1;
    events_by_os[event.os_name] = (events_by_os[event.os_name] || 0) + 1;
    if (event.source_ip) {
      ip_counts[event.source_ip] = (ip_counts[event.source_ip] || 0) + 1;
    }
  }

  const alerts_by_severity: Record<string, number> = {};
  for (const alert of storedAlerts) {
    alerts_by_severity[alert.severity] = (alerts_by_severity[alert.severity] || 0) + 1;
  }

  const top_source_ips = Object.entries(ip_counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));

  return {
    total_events: storedEvents.length,
    total_alerts: storedAlerts.length,
    events_by_type,
    events_by_os,
    alerts_by_severity,
    top_source_ips,
  };
}

let generationInterval: NodeJS.Timeout | null = null;

export function startEventGeneration(intervalMs: number = 3000): void {
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
