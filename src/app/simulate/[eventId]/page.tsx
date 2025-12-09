"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldAlert, 
  KeyRound, 
  Terminal, 
  Flame, 
  Server, 
  Cpu, 
  Usb, 
  UserX, 
  Network, 
  Lock,
  Play,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Copy,
  FileCode,
  Database,
  GitBranch,
  Bell
} from "lucide-react";

interface SecurityEventType {
  id: string;
  name: string;
  description: string;
  severity: "info" | "warning" | "error" | "critical";
  icon: React.ElementType;
  category: string;
  eventType: string;
  triggerCode: string;
  rawLogExample: string;
  detectsAlert?: string;
  logFile: string;
  parserUsed: string;
  alertRule?: string;
}

const securityEvents: Record<string, SecurityEventType> = {
  "ssh-brute-force": {
    id: "ssh-brute-force",
    name: "SSH Brute Force Attack",
    description: "Simulate multiple failed SSH login attempts from a malicious IP. This is one of the most common attack vectors where attackers try many username/password combinations to gain unauthorized access.",
    severity: "critical",
    icon: KeyRound,
    category: "Authentication",
    eventType: "AUTH_FAILURE",
    triggerCode: `# Real commands to generate SSH auth failures:

# Method 1: Multiple failed SSH attempts
for i in {1..6}; do
  ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no invalid_user@localhost 2>/dev/null
  sleep 1
done

# Method 2: Using hydra (penetration testing tool)
hydra -l admin -P /usr/share/wordlists/rockyou.txt ssh://target

# Method 3: Using medusa
medusa -h target -u admin -P passwords.txt -M ssh`,
    rawLogExample: `Jan 15 14:32:01 prod-web-01 sshd[12345]: Failed password for invalid user hacker from 218.92.0.107 port 54321 ssh2
Jan 15 14:32:03 prod-web-01 sshd[12346]: Failed password for root from 218.92.0.107 port 54322 ssh2
Jan 15 14:32:05 prod-web-01 sshd[12347]: Failed password for admin from 218.92.0.107 port 54323 ssh2
Jan 15 14:32:07 prod-web-01 sshd[12348]: Failed password for ubuntu from 218.92.0.107 port 54324 ssh2
Jan 15 14:32:09 prod-web-01 sshd[12349]: Failed password for invalid user oracle from 218.92.0.107 port 54325 ssh2`,
    detectsAlert: "Brute Force Attack",
    logFile: "/var/log/auth.log",
    parserUsed: "AuthLogParser",
    alertRule: "BruteForceRule - Triggers when 5+ failed logins from same IP within 10 minutes"
  },
  "ssh-success": {
    id: "ssh-success",
    name: "Successful SSH Login",
    description: "Records a successful SSH authentication event. This is logged when a user successfully authenticates via password or public key.",
    severity: "info",
    icon: CheckCircle,
    category: "Authentication",
    eventType: "AUTH_SUCCESS",
    triggerCode: `# Successful SSH login via password
ssh user@server

# Successful SSH login via public key
ssh -i ~/.ssh/id_rsa user@server

# SSH with specific port
ssh -p 2222 user@server`,
    rawLogExample: `Jan 15 14:35:22 prod-web-01 sshd[12346]: Accepted password for admin from 10.0.0.5 port 22 ssh2
Jan 15 14:35:22 prod-web-01 sshd[12346]: pam_unix(sshd:session): session opened for user admin(uid=1000) by (uid=0)`,
    logFile: "/var/log/auth.log",
    parserUsed: "AuthLogParser"
  },
  "sudo-failure": {
    id: "sudo-failure",
    name: "Failed Sudo Attempt",
    description: "Records failed privilege escalation attempts. This could indicate an attacker trying to gain root access or a misconfigured application.",
    severity: "warning",
    icon: Lock,
    category: "Privilege Escalation",
    eventType: "SUDO_FAILURE",
    triggerCode: `# Trigger sudo failure (enter wrong password)
sudo -u root id
# Enter wrong password 3 times

# Sudo from unauthorized user
su - www-data
sudo apt update  # Will fail for www-data`,
    rawLogExample: `Jan 15 14:40:15 prod-web-01 sudo: pam_unix(sudo:auth): authentication failure; logname=www-data uid=33 euid=0 tty=/dev/pts/0 ruser=www-data rhost=  user=www-data
Jan 15 14:40:18 prod-web-01 sudo:   www-data : 3 incorrect password attempts ; TTY=pts/0 ; PWD=/var/www ; USER=root ; COMMAND=/usr/bin/cat /etc/shadow`,
    detectsAlert: "Privilege Escalation Attempt",
    logFile: "/var/log/auth.log",
    parserUsed: "AuthLogParser",
    alertRule: "PrivilegeEscalationRule - Detects unusual sudo attempts from service accounts"
  },
  "sudo-success": {
    id: "sudo-success",
    name: "Successful Sudo Command",
    description: "Records successful privilege escalation events. Tracks when users execute commands with elevated privileges.",
    severity: "info",
    icon: Terminal,
    category: "Privilege Escalation",
    eventType: "SUDO_SUCCESS",
    triggerCode: `# Execute command as root
sudo whoami
sudo systemctl restart nginx
sudo cat /etc/shadow

# Execute command as another user
sudo -u postgres psql`,
    rawLogExample: `Jan 15 14:42:30 prod-web-01 sudo: developer : TTY=pts/0 ; PWD=/home/developer ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx`,
    logFile: "/var/log/auth.log",
    parserUsed: "AuthLogParser"
  },
  "firewall-block": {
    id: "firewall-block",
    name: "Firewall Block",
    description: "Records blocked incoming connection attempts. The firewall (UFW/iptables) dropped a packet that violated security rules.",
    severity: "warning",
    icon: Flame,
    category: "Network",
    eventType: "FIREWALL_BLOCK",
    triggerCode: `# From external system, try connecting to blocked ports:
nc -zv target_ip 23    # Telnet port (usually blocked)
nc -zv target_ip 3389  # RDP port
nc -zv target_ip 5900  # VNC port

# Multiple connection attempts
for port in 21 22 23 25 110 143 445 3306 5432; do
  nc -zv target_ip $port 2>&1
done`,
    rawLogExample: `Jan 15 14:45:00 fw-edge-01 kernel: [UFW BLOCK] IN=eth0 OUT= MAC=00:16:3e:xx:xx:xx SRC=185.220.101.34 DST=10.0.0.1 LEN=60 TOS=0x00 PREC=0x00 TTL=49 ID=12345 DF PROTO=TCP SPT=54321 DPT=22 WINDOW=65535 RES=0x00 SYN URGP=0`,
    detectsAlert: "Firewall Attack",
    logFile: "/var/log/ufw.log",
    parserUsed: "UFWLogParser",
    alertRule: "FirewallAttackRule - Triggers when 20+ blocks from same IP in 5 minutes"
  },
  "port-scan": {
    id: "port-scan",
    name: "Port Scan Attack",
    description: "Detects rapid scanning of multiple ports from the same source IP. This is reconnaissance activity used by attackers to discover open services.",
    severity: "critical",
    icon: Network,
    category: "Network",
    eventType: "FIREWALL_BLOCK",
    triggerCode: `# Port scan using nmap (from attacker's perspective)
nmap -sS target_ip                  # SYN scan
nmap -sS -p 1-1000 target_ip        # Scan ports 1-1000
nmap -sV target_ip                  # Service version detection
nmap -A target_ip                   # Aggressive scan

# Using masscan for faster scanning
masscan -p1-65535 target_ip --rate=1000`,
    rawLogExample: `Jan 15 14:50:00 fw-edge-01 kernel: [UFW BLOCK] IN=eth0 SRC=45.155.205.233 DST=10.0.0.1 PROTO=TCP DPT=22
Jan 15 14:50:00 fw-edge-01 kernel: [UFW BLOCK] IN=eth0 SRC=45.155.205.233 DST=10.0.0.1 PROTO=TCP DPT=23
Jan 15 14:50:00 fw-edge-01 kernel: [UFW BLOCK] IN=eth0 SRC=45.155.205.233 DST=10.0.0.1 PROTO=TCP DPT=80
Jan 15 14:50:01 fw-edge-01 kernel: [UFW BLOCK] IN=eth0 SRC=45.155.205.233 DST=10.0.0.1 PROTO=TCP DPT=443
Jan 15 14:50:01 fw-edge-01 kernel: [UFW BLOCK] IN=eth0 SRC=45.155.205.233 DST=10.0.0.1 PROTO=TCP DPT=3306`,
    detectsAlert: "Port Scan Detected",
    logFile: "/var/log/ufw.log",
    parserUsed: "UFWLogParser",
    alertRule: "PortScanRule - Triggers when 10+ different ports hit from same IP in 5 minutes"
  },
  "service-start": {
    id: "service-start",
    name: "Service Started",
    description: "Records when a system service is started. Useful for tracking service availability and detecting unauthorized service starts.",
    severity: "info",
    icon: Server,
    category: "System",
    eventType: "SERVICE_START",
    triggerCode: `# Start services using systemctl
sudo systemctl start nginx
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo systemctl start docker

# Start services using service command
sudo service apache2 start
sudo service mysql start`,
    rawLogExample: `Jan 15 14:55:00 prod-web-01 systemd[1]: Starting The NGINX HTTP and reverse proxy server...
Jan 15 14:55:01 prod-web-01 systemd[1]: Started The NGINX HTTP and reverse proxy server.`,
    logFile: "/var/log/syslog",
    parserUsed: "SyslogParser"
  },
  "service-failure": {
    id: "service-failure",
    name: "Service Failure",
    description: "Records when a critical service fails to start or crashes. This requires immediate attention as it may indicate system issues or attacks.",
    severity: "error",
    icon: AlertTriangle,
    category: "System",
    eventType: "SERVICE_FAILURE",
    triggerCode: `# Cause service failure (with invalid config)
# Edit nginx.conf with syntax error, then:
sudo systemctl restart nginx

# Or stop a dependency:
sudo systemctl stop mysql
sudo systemctl restart wordpress  # Will fail without DB

# Or exhaust resources:
stress --cpu 8 --timeout 60`,
    rawLogExample: `Jan 15 15:00:00 prod-web-01 systemd[1]: Starting The NGINX HTTP and reverse proxy server...
Jan 15 15:00:01 prod-web-01 nginx[5678]: nginx: [emerg] unknown directive "invalid" in /etc/nginx/nginx.conf:10
Jan 15 15:00:01 prod-web-01 systemd[1]: nginx.service: Control process exited, code=exited, status=1/FAILURE
Jan 15 15:00:01 prod-web-01 systemd[1]: nginx.service: Failed with result 'exit-code'.
Jan 15 15:00:01 prod-web-01 systemd[1]: Failed to start The NGINX HTTP and reverse proxy server.`,
    detectsAlert: "Service Failure",
    logFile: "/var/log/syslog",
    parserUsed: "SyslogParser",
    alertRule: "ServiceFailureRule - Triggers when 3+ service failures in 15 minutes"
  },
  "kernel-oom": {
    id: "kernel-oom",
    name: "Out of Memory Kill",
    description: "The Linux kernel OOM killer terminated a process due to memory exhaustion. This is a critical event indicating resource constraints.",
    severity: "critical",
    icon: Cpu,
    category: "Kernel",
    eventType: "KERNEL_OOM",
    triggerCode: `# WARNING: These commands can crash your system!
# Only run in test environments.

# Method 1: Using stress tool
stress --vm 1 --vm-bytes $(awk '/MemFree/{print $2}' /proc/meminfo)k

# Method 2: Memory bomb (fork bomb variant)
python3 -c "x = ' ' * (10**10)"

# Method 3: Allocate memory in loop
python3 -c "a = []; [a.append(' ' * 10**6) for _ in range(10**6)]"`,
    rawLogExample: `Jan 15 15:05:00 prod-api-02 kernel: [12345.678901] java invoked oom-killer: gfp_mask=0x24200ca(GFP_HIGHUSER_MOVABLE), order=0, oom_score_adj=0
Jan 15 15:05:00 prod-api-02 kernel: [12345.678902] Out of memory: Kill process 4567 (java) score 950 or sacrifice child
Jan 15 15:05:00 prod-api-02 kernel: [12345.678903] Killed process 4567 (java) total-vm:8388608kB, anon-rss:7340032kB, file-rss:0kB, shmem-rss:0kB
Jan 15 15:05:00 prod-api-02 kernel: [12345.678904] oom_reaper: reaped process 4567 (java), now anon-rss:0kB, file-rss:0kB, shmem-rss:0kB`,
    detectsAlert: "System Instability",
    logFile: "/var/log/kern.log",
    parserUsed: "KernelLogParser",
    alertRule: "SystemInstabilityRule - Triggers on OOM events or 10+ kernel errors in 10 minutes"
  },
  "usb-device": {
    id: "usb-device",
    name: "USB Device Connected",
    description: "A new USB device was connected to the system. This can be a security concern in controlled environments where removable media is restricted.",
    severity: "info",
    icon: Usb,
    category: "Hardware",
    eventType: "USB_DEVICE_CONNECTED",
    triggerCode: `# Physical action required:
# Plug in a USB device (flash drive, keyboard, etc.)

# To monitor USB events in real-time:
sudo dmesg -w | grep -i usb

# Or watch the kernel log:
tail -f /var/log/kern.log | grep -i usb`,
    rawLogExample: `Jan 15 15:10:00 workstation kernel: [23456.789012] usb 1-1: new high-speed USB device number 5 using xhci_hcd
Jan 15 15:10:00 workstation kernel: [23456.890123] usb 1-1: New USB device found, idVendor=0781, idProduct=5567, bcdDevice= 1.00
Jan 15 15:10:00 workstation kernel: [23456.890124] usb 1-1: New USB device strings: Mfr=1, Product=2, SerialNumber=3
Jan 15 15:10:00 workstation kernel: [23456.890125] usb 1-1: Product: Cruzer Blade
Jan 15 15:10:00 workstation kernel: [23456.890126] usb 1-1: Manufacturer: SanDisk`,
    logFile: "/var/log/kern.log",
    parserUsed: "KernelLogParser"
  },
  "user-created": {
    id: "user-created",
    name: "New User Created",
    description: "A new user account was created on the system. Unauthorized user creation can indicate a backdoor being installed.",
    severity: "warning",
    icon: UserX,
    category: "User Management",
    eventType: "USER_CREATED",
    triggerCode: `# Create a new user
sudo useradd -m newuser
sudo useradd -m -s /bin/bash -G sudo adminuser

# Create user with specific UID
sudo useradd -u 1500 -m serviceaccount

# Using adduser (interactive)
sudo adduser newuser`,
    rawLogExample: `Jan 15 15:15:00 prod-web-01 useradd[5678]: new user: name=backdoor, UID=1001, GID=1001, home=/home/backdoor, shell=/bin/bash
Jan 15 15:15:00 prod-web-01 useradd[5678]: add 'backdoor' to group 'backdoor'
Jan 15 15:15:00 prod-web-01 useradd[5678]: add 'backdoor' to shadow group 'backdoor'`,
    logFile: "/var/log/auth.log",
    parserUsed: "AuthLogParser"
  },
  "rapid-login": {
    id: "rapid-login",
    name: "Rapid Login Attempts",
    description: "Multiple successful logins in a very short time period. Could indicate credential stuffing attacks or automated scripts using stolen credentials.",
    severity: "warning",
    icon: ShieldAlert,
    category: "Authentication",
    eventType: "AUTH_SUCCESS",
    triggerCode: `# Script to test multiple logins
for user in user1 user2 user3 user4 user5; do
  ssh $user@server -o BatchMode=yes "echo logged in"
done

# Using parallel SSH
parallel-ssh -h hosts.txt -l admin "hostname"`,
    rawLogExample: `Jan 15 15:20:00 prod-web-01 sshd[6789]: Accepted password for admin from 192.168.1.100 port 22 ssh2
Jan 15 15:20:01 prod-web-01 sshd[6790]: Accepted password for devops from 192.168.1.100 port 22 ssh2
Jan 15 15:20:02 prod-web-01 sshd[6791]: Accepted password for jenkins from 192.168.1.100 port 22 ssh2
Jan 15 15:20:03 prod-web-01 sshd[6792]: Accepted password for deploy from 192.168.1.100 port 22 ssh2
Jan 15 15:20:04 prod-web-01 sshd[6793]: Accepted password for root from 192.168.1.100 port 22 ssh2`,
    detectsAlert: "Rapid Login Activity",
    logFile: "/var/log/auth.log",
    parserUsed: "AuthLogParser",
    alertRule: "RapidLoginRule - Triggers when 5+ logins from same IP in 2 minutes"
  }
};

const severityColors = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  error: "bg-red-500/10 text-red-400 border-red-500/30",
  critical: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30"
};

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<Record<string, unknown> | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const event = securityEvents[resolvedParams.eventId];

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <Button asChild>
              <Link href="/simulate">Back to Simulator</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const Icon = event.icon;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const triggerEvent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/events/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId: event.id,
          eventType: event.eventType,
          severity: event.severity,
          rawLogExample: event.rawLogExample,
          detectsAlert: event.detectsAlert
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTriggered(true);
        setPipelineResult(data.pipeline);
        setTimeout(() => setTriggered(false), 5000);
      }
    } catch (error) {
      console.error("Failed to trigger event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8 max-w-5xl">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Simulator
        </Button>

        <div className="flex items-start gap-4 mb-8">
          <div className={`p-4 rounded-xl ${severityColors[event.severity]}`}>
            <Icon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{event.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm ${severityColors[event.severity]}`}>
                {event.severity}
              </span>
            </div>
            <p className="text-muted-foreground">{event.description}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <Button onClick={triggerEvent} disabled={isLoading} size="lg">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : triggered ? (
              <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
            ) : (
              <Play className="h-5 w-5 mr-2" />
            )}
            {triggered ? "Event Triggered!" : "Trigger This Event"}
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/events">View Events Log</Link>
          </Button>
          {event.detectsAlert && (
            <Button variant="outline" size="lg" asChild>
              <Link href="/alerts">View Alerts</Link>
            </Button>
          )}
        </div>

        {pipelineResult && (
          <div className="mb-8 p-6 rounded-xl border border-green-500/30 bg-green-500/5">
            <h3 className="font-semibold text-green-400 mb-4 flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Pipeline Execution Result
            </h3>
            <div className="space-y-3 text-sm font-mono">
              <div className="flex gap-3">
                <span className="text-muted-foreground w-32">1. Raw Log:</span>
                <span className="text-green-400 flex-1 break-all">{String(pipelineResult.step1_log)}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted-foreground w-32">2. Parsed:</span>
                <span className="text-green-400">{JSON.stringify(pipelineResult.step2_parsed)}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted-foreground w-32">3. Analyzed:</span>
                <span className="text-green-400">{String(pipelineResult.step3_analyzed)}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted-foreground w-32">4. Stored:</span>
                <span className="text-green-400">{String(pipelineResult.step4_stored)}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-muted-foreground w-32">5. Alert:</span>
                <span className="text-green-400">{String(pipelineResult.step5_alert)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                How to Trigger (Real Commands)
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(event.triggerCode, "trigger")}
              >
                {copiedSection === "trigger" ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="bg-zinc-950 p-4 rounded-lg overflow-x-auto text-sm text-zinc-300 font-mono whitespace-pre-wrap">
              {event.triggerCode}
            </pre>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileCode className="h-5 w-5 text-primary" />
                Raw Log Example
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(event.rawLogExample, "log")}
              >
                {copiedSection === "log" ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <pre className="bg-zinc-950 p-4 rounded-lg overflow-x-auto text-sm text-emerald-400 font-mono whitespace-pre-wrap">
              {event.rawLogExample}
            </pre>
            <div className="mt-3 text-sm text-muted-foreground">
              Log file: <code className="bg-muted px-2 py-0.5 rounded">{event.logFile}</code>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-border bg-card">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Database className="h-5 w-5 text-primary" />
                Parser Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Parser Used:</span>
                  <code className="bg-muted px-2 py-0.5 rounded">{event.parserUsed}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Type:</span>
                  <code className="bg-muted px-2 py-0.5 rounded">{event.eventType}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{event.category}</span>
                </div>
              </div>
            </div>

            {event.detectsAlert && (
              <div className="p-6 rounded-xl border border-amber-500/30 bg-amber-500/5">
                <h3 className="font-semibold flex items-center gap-2 mb-4 text-amber-400">
                  <Bell className="h-5 w-5" />
                  Alert Configuration
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alert Type:</span>
                    <span className="text-amber-400">{event.detectsAlert}</span>
                  </div>
                  {event.alertRule && (
                    <div className="mt-3 p-3 bg-amber-500/10 rounded-lg text-amber-300 text-xs">
                      {event.alertRule}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
