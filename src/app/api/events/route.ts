import { NextRequest, NextResponse } from "next/server";
import { supabase, DbSecurityEvent } from "@/lib/supabase";

const EVENT_TYPES = [
  "AUTH_FAILURE", "AUTH_SUCCESS", "SUDO_SUCCESS", "SUDO_FAILURE",
  "SESSION_START", "SESSION_END", "FIREWALL_BLOCK", "FIREWALL_ALLOW",
  "SERVICE_START", "SERVICE_STOP", "SERVICE_FAILURE", "KERNEL_WARNING", "KERNEL_ERROR"
];

const OS_NAMES = ["Linux", "Windows", "macOS"];
const USERNAMES = ["root", "admin", "john.doe", "alice", "bob", "guest", "www-data", "mysql", "postgres", "ubuntu"];
const HOSTS = ["server-01", "web-prod-1", "db-master", "app-server", "localhost"];
const PROCESSES = ["sshd", "sudo", "login", "su", "systemd", "kernel", "ufw", "pam_unix", "cron", "nginx"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp(): string {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`;
}

function getEventSeverity(eventType: string): string {
  const severityMap: Record<string, string> = {
    AUTH_FAILURE: "warning", AUTH_SUCCESS: "info", SUDO_SUCCESS: "info", SUDO_FAILURE: "warning",
    SESSION_START: "info", SESSION_END: "info", FIREWALL_BLOCK: "warning", FIREWALL_ALLOW: "info",
    SERVICE_START: "info", SERVICE_STOP: "info", SERVICE_FAILURE: "error",
    KERNEL_WARNING: "warning", KERNEL_ERROR: "error",
  };
  return severityMap[eventType] || "info";
}

function generateMessage(eventType: string, user: string, ip: string): string {
  const messages: Record<string, string[]> = {
    AUTH_FAILURE: [`Failed password for ${user} from ${ip} port 22 ssh2`, `pam_unix(sshd:auth): authentication failure; rhost=${ip} user=${user}`],
    AUTH_SUCCESS: [`Accepted password for ${user} from ${ip} port 22 ssh2`, `Accepted publickey for ${user} from ${ip} port 49521 ssh2`],
    SUDO_SUCCESS: [`${user} : TTY=pts/0 ; PWD=/home/${user} ; USER=root ; COMMAND=/bin/bash`],
    SUDO_FAILURE: [`pam_unix(sudo:auth): authentication failure; logname=${user} uid=1000 euid=0`],
    SESSION_START: [`pam_unix(sshd:session): session opened for user ${user}`],
    SESSION_END: [`pam_unix(sshd:session): session closed for user ${user}`],
    FIREWALL_BLOCK: [`[UFW BLOCK] IN=eth0 SRC=${ip} DST=192.168.1.1 PROTO=TCP DPT=22`],
    FIREWALL_ALLOW: [`[UFW ALLOW] IN=eth0 SRC=${ip} DST=192.168.1.1 PROTO=TCP DPT=443`],
    SERVICE_START: [`Started nginx.service - A high performance web server`],
    SERVICE_STOP: [`Stopped nginx.service - A high performance web server`],
    SERVICE_FAILURE: [`Failed to start nginx.service - A high performance web server`],
    KERNEL_WARNING: [`WARNING: CPU: 0 PID: 1234 at drivers/net/ethernet/intel/igb/igb_main.c:1234`],
    KERNEL_ERROR: [`Out of memory: Killed process 1234 (mysqld) total-vm:2048MB`],
  };
  const templates = messages[eventType] || messages.AUTH_FAILURE;
  return randomItem(templates);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : pageSize;
  const type = searchParams.get("type") || searchParams.get("eventType") || undefined;
  const os = searchParams.get("os") || undefined;
  const user = searchParams.get("user") || undefined;
  const srcIp = searchParams.get("srcIp") || searchParams.get("src_ip") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const search = searchParams.get("search") || undefined;

  let query = supabase
    .from('security_events')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false });

  if (type) query = query.eq('event_type', type);
  if (os) query = query.eq('os_name', os);
  if (user) query = query.ilike('username', `%${user}%`);
  if (srcIp) query = query.ilike('source_ip', `%${srcIp}%`);
  if (severity) query = query.eq('severity', severity);
  if (search) query = query.or(`raw_message.ilike.%${search}%,username.ilike.%${search}%,source_ip.ilike.%${search}%`);

  const offset = (page - 1) * pageSize;
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const events = (data || []).map((e: DbSecurityEvent) => ({
    id: e.id,
    created_at: e.created_at,
    event_time: e.event_time,
    timestamp: e.timestamp,
    host: e.host,
    process: e.process_name,
    process_name: e.process_name,
    pid: e.pid,
    event_type: e.event_type,
    user: e.username,
    username: e.username,
    src_ip: e.source_ip,
    source_ip: e.source_ip,
    dst_ip: e.dst_ip,
    severity: e.severity,
    log_source: e.log_source,
    raw_message: e.raw_message,
    os_name: e.os_name,
  }));

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    events,
    total,
    count: events.length,
    page,
    pageSize,
    totalPages
  });
}

export async function POST() {
  const eventType = randomItem(EVENT_TYPES);
  const osName = randomItem(OS_NAMES);
  const username = randomItem(USERNAMES);
  const sourceIp = eventType.includes("FIREWALL") || eventType.includes("AUTH") ? randomIp() : null;
  const processName = randomItem(PROCESSES);
  const host = randomItem(HOSTS);

  const now = new Date().toISOString();
  const newEvent = {
    created_at: now,
    event_time: now,
    timestamp: now,
    host,
    process_name: processName,
    pid: Math.floor(Math.random() * 65000) + 1000,
    event_type: eventType,
    username,
    source_ip: sourceIp,
    dst_ip: eventType.includes("FIREWALL") ? randomIp() : null,
    severity: getEventSeverity(eventType),
    log_source: eventType.includes("AUTH") ? "auth" : eventType.includes("FIREWALL") ? "firewall" : "syslog",
    raw_message: generateMessage(eventType, username, sourceIp || randomIp()),
    os_name: osName,
  };

  const { data, error } = await supabase
    .from('security_events')
    .insert(newEvent)
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if ((eventType === "AUTH_FAILURE" && Math.random() < 0.3) ||
      (eventType === "FIREWALL_BLOCK" && Math.random() < 0.2) ||
      (eventType === "SUDO_FAILURE" && Math.random() < 0.4)) {
    const alertType = eventType === "AUTH_FAILURE" ? "BRUTE_FORCE" : 
                      eventType === "FIREWALL_BLOCK" ? "FIREWALL_ATTACK" : "SUDO_ABUSE";
    const alertSeverity = eventType === "AUTH_FAILURE" ? "CRITICAL" : "WARNING";
    
    await supabase.from('alerts').insert({
      created_at: now,
      timestamp: now,
      alert_type: alertType,
      severity: alertSeverity,
      description: `${alertType.replace('_', ' ')} detected: Multiple ${eventType.toLowerCase().replace('_', ' ')} events from ${sourceIp || username}`,
      related_event_ids: String(data.id),
      status: 'active',
    });
  }

  return NextResponse.json({ success: true, event: data });
}
