import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qsqxwpkjmvriukmbbtex.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcXh3cGtqbXZyaXVrbWJidGV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5ODUxOCwiZXhwIjoyMDgwODc0NTE4fQ.YmxjNmmlMNxsupCRK56iL5x54yLej0yL5VL81iHjngw';
const supabase = createClient(supabaseUrl, supabaseKey);

interface EventConfig {
  hosts: string[];
  users: string[];
  ips: string[];
  processes: string[];
}

const eventConfigs: Record<string, EventConfig> = {
  "ssh-brute-force": {
    hosts: ["prod-web-01", "db-master", "prod-api-02"],
    users: ["admin", "root", "ubuntu", "ec2-user", "oracle"],
    ips: ["218.92.0.107", "61.177.173.13", "45.155.205.233", "185.220.101.34"],
    processes: ["sshd"]
  },
  "ssh-success": {
    hosts: ["prod-web-01", "db-master", "prod-api-02", "bastion-01"],
    users: ["devops", "admin.john", "developer", "jenkins"],
    ips: ["10.0.0.5", "192.168.1.100", "172.16.0.50"],
    processes: ["sshd"]
  },
  "sudo-failure": {
    hosts: ["prod-web-01", "prod-api-02", "worker-01"],
    users: ["www-data", "nobody", "guest", "apache"],
    ips: [],
    processes: ["sudo"]
  },
  "sudo-success": {
    hosts: ["prod-web-01", "db-master", "prod-api-02"],
    users: ["devops", "developer", "admin.john", "dba_admin"],
    ips: [],
    processes: ["sudo"]
  },
  "firewall-block": {
    hosts: ["fw-edge-01", "fw-internal-01"],
    users: [],
    ips: ["185.220.101.34", "45.155.205.233", "89.248.167.131", "162.142.125.100"],
    processes: ["ufw", "iptables"]
  },
  "port-scan": {
    hosts: ["fw-edge-01", "fw-internal-01"],
    users: [],
    ips: ["45.155.205.233", "185.220.101.34", "92.118.160.1", "71.6.135.131"],
    processes: ["ufw"]
  },
  "service-start": {
    hosts: ["prod-web-01", "prod-api-02", "db-master"],
    users: [],
    ips: [],
    processes: ["systemd", "nginx", "postgresql", "redis-server"]
  },
  "service-failure": {
    hosts: ["prod-web-01", "prod-api-02", "worker-01"],
    users: [],
    ips: [],
    processes: ["systemd", "nginx", "mysql", "docker"]
  },
  "kernel-oom": {
    hosts: ["prod-api-02", "worker-01", "ml-server-01"],
    users: [],
    ips: [],
    processes: ["kernel"]
  },
  "usb-device": {
    hosts: ["workstation-01", "mac-dev-01", "WIN-DC01"],
    users: [],
    ips: [],
    processes: ["kernel"]
  },
  "user-created": {
    hosts: ["prod-web-01", "bastion-01", "jump-server"],
    users: ["newuser", "backdoor", "testaccount", "svc_account"],
    ips: [],
    processes: ["useradd", "adduser"]
  },
  "rapid-login": {
    hosts: ["prod-web-01", "bastion-01"],
    users: ["admin", "devops", "jenkins", "deploy"],
    ips: ["192.168.1.100", "10.0.0.50", "172.16.0.25"],
    processes: ["sshd"]
  }
};

const logTemplates: Record<string, (host: string, user: string, ip: string, process: string) => string> = {
  "AUTH_FAILURE": (host, user, ip) => 
    `Failed password for ${user ? user : 'invalid user hacker'} from ${ip} port ${Math.floor(Math.random() * 60000) + 1024} ssh2`,
  "AUTH_SUCCESS": (host, user, ip) => 
    `Accepted password for ${user} from ${ip} port ${Math.floor(Math.random() * 60000) + 1024} ssh2`,
  "SUDO_FAILURE": (host, user) => 
    `pam_unix(sudo:auth): authentication failure; logname=${user} uid=${Math.floor(Math.random() * 1000) + 1000} euid=0 tty=/dev/pts/0 ruser=${user} rhost=  user=${user}`,
  "SUDO_SUCCESS": (host, user) => 
    `${user} : TTY=pts/0 ; PWD=/home/${user} ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx`,
  "FIREWALL_BLOCK": (host, _user, ip) => 
    `[UFW BLOCK] IN=eth0 OUT= MAC=00:16:3e:xx:xx:xx SRC=${ip} DST=10.0.0.1 PROTO=TCP SPT=${Math.floor(Math.random() * 60000) + 1024} DPT=${[22, 23, 80, 443, 3306, 5432, 6379, 27017][Math.floor(Math.random() * 8)]}`,
  "SERVICE_START": (_host, _user, _ip, process) => 
    `Started ${process === 'nginx' ? 'The NGINX HTTP and reverse proxy server' : process === 'postgresql' ? 'PostgreSQL RDBMS' : `${process} service`}.`,
  "SERVICE_FAILURE": (_host, _user, _ip, process) => 
    `Failed to start ${process === 'nginx' ? 'The NGINX HTTP and reverse proxy server' : process === 'mysql' ? 'MySQL Community Server' : `${process} service`}.`,
  "KERNEL_OOM": () => 
    `Out of memory: Kill process ${Math.floor(Math.random() * 10000) + 1000} (${['java', 'python', 'node', 'chrome'][Math.floor(Math.random() * 4)]}) score ${Math.floor(Math.random() * 500) + 500} or sacrifice child`,
  "USB_DEVICE_CONNECTED": () => 
    `usb 1-${Math.floor(Math.random() * 4) + 1}: new high-speed USB device number ${Math.floor(Math.random() * 10) + 1} using xhci_hcd`,
  "USER_CREATED": (_host, user) => 
    `new user: name=${user}, UID=${Math.floor(Math.random() * 1000) + 1000}, GID=${Math.floor(Math.random() * 1000) + 1000}, home=/home/${user}`
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateLogMessage(eventTypeId: string, eventType: string, config: EventConfig): { message: string; host: string; user: string | null; ip: string | null; process: string } {
  const host = config.hosts.length > 0 ? pick(config.hosts) : "localhost";
  const user = config.users.length > 0 ? pick(config.users) : "";
  const ip = config.ips.length > 0 ? pick(config.ips) : "";
  const process = config.processes.length > 0 ? pick(config.processes) : "sshd";
  
  const template = logTemplates[eventType];
  const message = template ? template(host, user, ip, process) : `${eventType} event occurred`;
  
  return { message, host, user: user || null, ip: ip || null, process };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventTypeId, eventType, severity, detectsAlert } = body;
    
    const config = eventConfigs[eventTypeId] || eventConfigs["ssh-success"];
    const { message, host, user, ip, process } = generateLogMessage(eventTypeId, eventType, config);
    
    const now = new Date();
    const timestamp = now.toISOString();
    const syslogTimestamp = now.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '');
    
    const rawMessage = `${syslogTimestamp} ${host} ${process}[${Math.floor(Math.random() * 30000) + 1000}]: ${message}`;
    
    const event = {
      event_time: timestamp,
      timestamp: timestamp,
      event_type: eventType,
      severity: severity,
      raw_message: rawMessage,
      host: host,
      process_name: process,
      username: user,
      source_ip: ip,
      log_source: eventTypeId.includes("firewall") || eventTypeId.includes("port-scan") ? "firewall" : 
                  eventTypeId.includes("kernel") || eventTypeId.includes("usb") ? "kernel" : 
                  eventTypeId.includes("service") ? "syslog" : "auth",
      os_name: host.startsWith("WIN") ? "Windows" : host.includes("mac") ? "Darwin" : "Linux"
    };

    const { data: eventData, error: eventError } = await supabase
      .from("security_events")
      .insert(event)
      .select()
      .single();

    if (eventError) throw eventError;

    let alertData = null;
    if (detectsAlert) {
      const alertSeverity = severity === "critical" ? "critical" : severity === "error" ? "high" : "medium";
      
      const alert = {
        alert_type: detectsAlert.toUpperCase().replace(/ /g, "_"),
        severity: alertSeverity,
        description: `${detectsAlert} detected from ${ip || user || host}`,
        source_ip: ip,
        username: user,
        triggered_at: timestamp,
        acknowledged: false,
        related_events: [eventData.id]
      };

      const { data: createdAlert, error: alertError } = await supabase
        .from("alerts")
        .insert(alert)
        .select()
        .single();

      if (!alertError) {
        alertData = createdAlert;
      }
    }

    return NextResponse.json({
      success: true,
      event: eventData,
      alert: alertData,
      pipeline: {
        step1_log: rawMessage,
        step2_parsed: {
          event_type: eventType,
          user: user,
          source_ip: ip,
          host: host,
          process: process
        },
        step3_analyzed: detectsAlert ? `Rule triggered: ${detectsAlert}` : "No alert rules matched",
        step4_stored: `Event ID: ${eventData.id}`,
        step5_alert: alertData ? `Alert ID: ${alertData.id}` : "No alert generated"
      }
    });
  } catch (err) {
    console.error("Error triggering event:", err);
    return NextResponse.json(
      { error: "Failed to trigger event", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
