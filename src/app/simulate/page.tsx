"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Loader2
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
}

const securityEvents: SecurityEventType[] = [
  {
    id: "ssh-brute-force",
    name: "SSH Brute Force Attack",
    description: "Simulate multiple failed SSH login attempts from a malicious IP",
    severity: "critical",
    icon: KeyRound,
    category: "Authentication",
    eventType: "AUTH_FAILURE",
    triggerCode: "for i in {1..6}; do ssh -o ConnectTimeout=2 invalid_user@localhost; done",
    rawLogExample: "Jan 15 14:32:01 prod-web-01 sshd[12345]: Failed password for invalid user hacker from 218.92.0.107 port 54321 ssh2",
    detectsAlert: "Brute Force Attack"
  },
  {
    id: "ssh-success",
    name: "Successful SSH Login",
    description: "Simulate a successful SSH authentication",
    severity: "info",
    icon: CheckCircle,
    category: "Authentication",
    eventType: "AUTH_SUCCESS",
    triggerCode: "ssh user@server",
    rawLogExample: "Jan 15 14:35:22 prod-web-01 sshd[12346]: Accepted password for admin from 10.0.0.5 port 22 ssh2"
  },
  {
    id: "sudo-failure",
    name: "Failed Sudo Attempt",
    description: "Simulate unauthorized privilege escalation attempt",
    severity: "warning",
    icon: Lock,
    category: "Privilege Escalation",
    eventType: "SUDO_FAILURE",
    triggerCode: "sudo -u root id # Enter wrong password 3 times",
    rawLogExample: "Jan 15 14:40:15 prod-web-01 sudo: pam_unix(sudo:auth): authentication failure; logname=www-data uid=33",
    detectsAlert: "Privilege Escalation Attempt"
  },
  {
    id: "sudo-success",
    name: "Successful Sudo Command",
    description: "Execute a privileged command successfully",
    severity: "info",
    icon: Terminal,
    category: "Privilege Escalation",
    eventType: "SUDO_SUCCESS",
    triggerCode: "sudo whoami",
    rawLogExample: "Jan 15 14:42:30 prod-web-01 sudo: developer : TTY=pts/0 ; PWD=/home/developer ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx"
  },
  {
    id: "firewall-block",
    name: "Firewall Block",
    description: "Blocked incoming connection attempt",
    severity: "warning",
    icon: Flame,
    category: "Network",
    eventType: "FIREWALL_BLOCK",
    triggerCode: "nc -zv target_ip 23",
    rawLogExample: "Jan 15 14:45:00 fw-edge-01 kernel: [UFW BLOCK] IN=eth0 SRC=185.220.101.34 DST=10.0.0.1 PROTO=TCP DPT=22",
    detectsAlert: "Port Scan Detected"
  },
  {
    id: "port-scan",
    name: "Port Scan Attack",
    description: "Rapid scanning of multiple ports from same IP",
    severity: "critical",
    icon: Network,
    category: "Network",
    eventType: "FIREWALL_BLOCK",
    triggerCode: "nmap -sS -p 1-1000 target_ip",
    rawLogExample: "Jan 15 14:50:00 fw-edge-01 kernel: [UFW BLOCK] IN=eth0 SRC=45.155.205.233 DST=10.0.0.1 PROTO=TCP DPT=443",
    detectsAlert: "Port Scan Detected"
  },
  {
    id: "service-start",
    name: "Service Started",
    description: "System service was started",
    severity: "info",
    icon: Server,
    category: "System",
    eventType: "SERVICE_START",
    triggerCode: "sudo systemctl start nginx",
    rawLogExample: "Jan 15 14:55:00 prod-web-01 systemd[1]: Started The NGINX HTTP and reverse proxy server."
  },
  {
    id: "service-failure",
    name: "Service Failure",
    description: "Critical service failed to start or crashed",
    severity: "error",
    icon: AlertTriangle,
    category: "System",
    eventType: "SERVICE_FAILURE",
    triggerCode: "sudo systemctl start nginx # with invalid config",
    rawLogExample: "Jan 15 15:00:00 prod-web-01 systemd[1]: Failed to start The NGINX HTTP and reverse proxy server.",
    detectsAlert: "Service Failure"
  },
  {
    id: "kernel-oom",
    name: "Out of Memory Kill",
    description: "Kernel killed a process due to memory exhaustion",
    severity: "critical",
    icon: Cpu,
    category: "Kernel",
    eventType: "KERNEL_OOM",
    triggerCode: "stress --vm 1 --vm-bytes $(awk '/MemFree/{print $2}' /proc/meminfo)k",
    rawLogExample: "Jan 15 15:05:00 prod-api-02 kernel: Out of memory: Kill process 4567 (java) score 950",
    detectsAlert: "System Instability"
  },
  {
    id: "usb-device",
    name: "USB Device Connected",
    description: "New USB device was connected to the system",
    severity: "info",
    icon: Usb,
    category: "Hardware",
    eventType: "USB_DEVICE_CONNECTED",
    triggerCode: "# Physical: Plug in a USB device",
    rawLogExample: "Jan 15 15:10:00 workstation kernel: usb 1-1: new high-speed USB device number 5 using xhci_hcd"
  },
  {
    id: "user-created",
    name: "New User Created",
    description: "A new user account was created on the system",
    severity: "warning",
    icon: UserX,
    category: "User Management",
    eventType: "USER_CREATED",
    triggerCode: "sudo useradd -m newuser",
    rawLogExample: "Jan 15 15:15:00 prod-web-01 useradd[5678]: new user: name=backdoor, UID=1001, GID=1001"
  },
  {
    id: "rapid-login",
    name: "Rapid Login Attempts",
    description: "Multiple successful logins in short time (potential credential stuffing)",
    severity: "warning",
    icon: ShieldAlert,
    category: "Authentication",
    eventType: "AUTH_SUCCESS",
    triggerCode: "for user in users.txt; do ssh $user@server; done",
    rawLogExample: "Jan 15 15:20:00 prod-web-01 sshd[6789]: Accepted password for admin from 192.168.1.100 port 22 ssh2",
    detectsAlert: "Rapid Login Activity"
  }
];

const severityColors = {
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  error: "bg-red-500/10 text-red-400 border-red-500/30",
  critical: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30"
};

const categoryColors: Record<string, string> = {
  "Authentication": "bg-cyan-500/10 text-cyan-400",
  "Privilege Escalation": "bg-orange-500/10 text-orange-400",
  "Network": "bg-violet-500/10 text-violet-400",
  "System": "bg-emerald-500/10 text-emerald-400",
  "Kernel": "bg-rose-500/10 text-rose-400",
  "Hardware": "bg-slate-500/10 text-slate-400",
  "User Management": "bg-yellow-500/10 text-yellow-400"
};

export default function SimulatePage() {
  const router = useRouter();
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);
  const [lastTriggered, setLastTriggered] = useState<{id: string; eventId: string} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(securityEvents.map(e => e.category)))];

  const filteredEvents = selectedCategory === "all" 
    ? securityEvents 
    : securityEvents.filter(e => e.category === selectedCategory);

  const triggerEvent = async (event: SecurityEventType) => {
    setLoadingEvent(event.id);
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
        setLastTriggered({ id: event.id, eventId: data.event.id });
        setTimeout(() => setLastTriggered(null), 3000);
      }
    } catch (error) {
      console.error("Failed to trigger event:", error);
    } finally {
      setLoadingEvent(null);
    }
  };

  const viewEventDetails = (event: SecurityEventType) => {
    router.push(`/simulate/${event.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Security Event Simulator</h1>
          </div>
          <p className="text-muted-foreground">
            Click to trigger security events. Each event flows through: Log → Parse → Analyze → Alert
          </p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="capitalize"
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const Icon = event.icon;
            const isLoading = loadingEvent === event.id;
            const wasTriggered = lastTriggered?.id === event.id;

            return (
              <div
                key={event.id}
                className={`relative p-5 rounded-xl border bg-card transition-all duration-300 ${
                  wasTriggered ? "ring-2 ring-green-500 border-green-500" : "border-border hover:border-primary/50"
                }`}
              >
                {wasTriggered && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-green-500 animate-pulse">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Triggered!
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2.5 rounded-lg ${severityColors[event.severity]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 truncate">{event.name}</h3>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${categoryColors[event.category]}`}>
                      {event.category}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                  <span className={`px-2 py-0.5 rounded border ${severityColors[event.severity]}`}>
                    {event.severity}
                  </span>
                  <span className="font-mono bg-muted px-2 py-0.5 rounded">
                    {event.eventType}
                  </span>
                </div>

                {event.detectsAlert && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-500 mb-4">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Triggers: {event.detectsAlert}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => triggerEvent(event)}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Play className="h-4 w-4 mr-1" />
                    )}
                    Trigger
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewEventDetails(event)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
