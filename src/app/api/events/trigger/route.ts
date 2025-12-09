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
  os: string;
}

const eventConfigs: Record<string, EventConfig> = {
  // === LINUX EVENTS ===
  "linux-ssh-brute-force": {
    hosts: ["prod-web-01", "db-master", "prod-api-02"],
    users: ["admin", "root", "ubuntu", "ec2-user", "oracle"],
    ips: ["218.92.0.107", "61.177.173.13", "45.155.205.233", "185.220.101.34"],
    processes: ["sshd"],
    os: "Linux"
  },
  "linux-ssh-success": {
    hosts: ["prod-web-01", "db-master", "prod-api-02", "bastion-01"],
    users: ["devops", "admin.john", "developer", "jenkins"],
    ips: ["10.0.0.5", "192.168.1.100", "172.16.0.50"],
    processes: ["sshd"],
    os: "Linux"
  },
  "linux-sudo-failure": {
    hosts: ["prod-web-01", "prod-api-02", "worker-01"],
    users: ["www-data", "nobody", "guest", "apache"],
    ips: [],
    processes: ["sudo"],
    os: "Linux"
  },
  "linux-sudo-success": {
    hosts: ["prod-web-01", "db-master", "prod-api-02"],
    users: ["devops", "developer", "admin.john", "dba_admin"],
    ips: [],
    processes: ["sudo"],
    os: "Linux"
  },
  "linux-firewall-block": {
    hosts: ["fw-edge-01", "fw-internal-01"],
    users: [],
    ips: ["185.220.101.34", "45.155.205.233", "89.248.167.131", "162.142.125.100"],
    processes: ["ufw", "iptables"],
    os: "Linux"
  },
  "linux-port-scan": {
    hosts: ["fw-edge-01", "fw-internal-01"],
    users: [],
    ips: ["45.155.205.233", "185.220.101.34", "92.118.160.1", "71.6.135.131"],
    processes: ["ufw"],
    os: "Linux"
  },
  "linux-service-start": {
    hosts: ["prod-web-01", "prod-api-02", "db-master"],
    users: [],
    ips: [],
    processes: ["systemd", "nginx", "postgresql", "redis-server"],
    os: "Linux"
  },
  "linux-service-failure": {
    hosts: ["prod-web-01", "prod-api-02", "worker-01"],
    users: [],
    ips: [],
    processes: ["systemd", "nginx", "mysql", "docker"],
    os: "Linux"
  },
  "linux-kernel-oom": {
    hosts: ["prod-api-02", "worker-01", "ml-server-01"],
    users: [],
    ips: [],
    processes: ["kernel"],
    os: "Linux"
  },
  "linux-usb-device": {
    hosts: ["workstation-01", "dev-server-02"],
    users: [],
    ips: [],
    processes: ["kernel"],
    os: "Linux"
  },
  "linux-user-created": {
    hosts: ["prod-web-01", "bastion-01", "jump-server"],
    users: ["newuser", "backdoor", "testaccount", "svc_account"],
    ips: [],
    processes: ["useradd", "adduser"],
    os: "Linux"
  },
  "linux-selinux-denial": {
    hosts: ["prod-web-01", "db-master", "prod-api-02"],
    users: ["apache", "nginx", "www-data"],
    ips: [],
    processes: ["audit"],
    os: "Linux"
  },
  "linux-cron-failed": {
    hosts: ["prod-web-01", "db-master", "backup-server"],
    users: ["root", "backup", "cron"],
    ips: [],
    processes: ["CRON"],
    os: "Linux"
  },
  "linux-disk-full": {
    hosts: ["prod-db-01", "log-server", "backup-server"],
    users: [],
    ips: [],
    processes: ["systemd"],
    os: "Linux"
  },
  "linux-package-install": {
    hosts: ["prod-web-01", "prod-api-02", "dev-server"],
    users: ["root", "admin"],
    ips: [],
    processes: ["apt", "yum", "dnf"],
    os: "Linux"
  },
  "linux-file-integrity": {
    hosts: ["prod-web-01", "db-master", "bastion-01"],
    users: [],
    ips: [],
    processes: ["aide", "tripwire"],
    os: "Linux"
  },
  // === WINDOWS EVENTS ===
  "windows-login-failure": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-WEB01"],
    users: ["Administrator", "admin", "svc_account", "user1"],
    ips: ["218.92.0.107", "61.177.173.13", "45.155.205.233"],
    processes: ["winlogon"],
    os: "Windows"
  },
  "windows-login-success": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-WEB01"],
    users: ["Administrator", "john.doe", "svc_backup"],
    ips: ["10.0.0.5", "192.168.1.100"],
    processes: ["winlogon"],
    os: "Windows"
  },
  "windows-rdp-failure": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-WEB01", "WIN-TERM01"],
    users: ["admin", "Administrator", "rdpuser"],
    ips: ["218.92.0.107", "61.177.173.13", "185.220.101.34"],
    processes: ["svchost"],
    os: "Windows"
  },
  "windows-rdp-success": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-TERM01"],
    users: ["john.doe", "admin.smith", "devops"],
    ips: ["10.0.0.5", "192.168.1.50", "172.16.0.25"],
    processes: ["svchost"],
    os: "Windows"
  },
  "windows-privilege-escalation": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-WEB01"],
    users: ["john.doe", "admin", "svc_account"],
    ips: [],
    processes: ["consent", "winlogon"],
    os: "Windows"
  },
  "windows-service-install": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-WEB01"],
    users: ["SYSTEM", "Administrator"],
    ips: [],
    processes: ["services"],
    os: "Windows"
  },
  "windows-powershell-exec": {
    hosts: ["WIN-DC01", "WIN-WEB01", "WIN-DEV01"],
    users: ["admin", "devops", "john.doe"],
    ips: [],
    processes: ["powershell"],
    os: "Windows"
  },
  "windows-suspicious-powershell": {
    hosts: ["WIN-DC01", "WIN-WEB01", "WIN-SQL01"],
    users: ["admin", "SYSTEM", "unknown"],
    ips: ["218.92.0.107"],
    processes: ["powershell"],
    os: "Windows"
  },
  "windows-firewall-change": {
    hosts: ["WIN-DC01", "WIN-FW01", "WIN-WEB01"],
    users: ["Administrator", "admin"],
    ips: [],
    processes: ["netsh"],
    os: "Windows"
  },
  "windows-defender-alert": {
    hosts: ["WIN-DC01", "WIN-WEB01", "WIN-DEV01"],
    users: [],
    ips: [],
    processes: ["MsMpEng"],
    os: "Windows"
  },
  "windows-audit-log-clear": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-WEB01"],
    users: ["Administrator", "admin", "attacker"],
    ips: [],
    processes: ["wevtutil"],
    os: "Windows"
  },
  "windows-scheduled-task": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-WEB01"],
    users: ["SYSTEM", "Administrator", "admin"],
    ips: [],
    processes: ["schtasks"],
    os: "Windows"
  },
  "windows-user-created": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-WEB01"],
    users: ["backdoor", "newadmin", "svc_hack"],
    ips: [],
    processes: ["net"],
    os: "Windows"
  },
  "windows-admin-added": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-WEB01"],
    users: ["backdoor", "attacker", "newadmin"],
    ips: [],
    processes: ["net"],
    os: "Windows"
  },
  "windows-process-injection": {
    hosts: ["WIN-DC01", "WIN-SQL01", "WIN-WEB01"],
    users: ["attacker", "SYSTEM"],
    ips: [],
    processes: ["mimikatz", "cobalt"],
    os: "Windows"
  },
  "windows-registry-persist": {
    hosts: ["WIN-DC01", "WIN-WEB01", "WIN-DEV01"],
    users: ["SYSTEM", "admin", "attacker"],
    ips: [],
    processes: ["reg"],
    os: "Windows"
  },
  // === MACOS EVENTS ===
  "mac-login-failure": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: ["admin", "developer", "guest"],
    ips: [],
    processes: ["authorizationhost"],
    os: "Darwin"
  },
  "mac-login-success": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: ["admin", "developer", "john"],
    ips: [],
    processes: ["authorizationhost"],
    os: "Darwin"
  },
  "mac-ssh-failure": {
    hosts: ["MacBook-Pro", "Mac-Mini-Server", "Mac-Studio"],
    users: ["admin", "root", "invalid"],
    ips: ["218.92.0.107", "61.177.173.13", "45.155.205.233"],
    processes: ["sshd"],
    os: "Darwin"
  },
  "mac-sudo-failure": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: ["developer", "guest", "user"],
    ips: [],
    processes: ["sudo"],
    os: "Darwin"
  },
  "mac-sudo-success": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: ["admin", "developer", "devops"],
    ips: [],
    processes: ["sudo"],
    os: "Darwin"
  },
  "mac-gatekeeper-block": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: [],
    ips: [],
    processes: ["kernel"],
    os: "Darwin"
  },
  "mac-xprotect-alert": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Mini"],
    users: ["admin", "developer"],
    ips: [],
    processes: ["XProtect"],
    os: "Darwin"
  },
  "mac-firewall-block": {
    hosts: ["MacBook-Pro", "Mac-Mini-Server", "Mac-Studio"],
    users: [],
    ips: ["185.220.101.34", "45.155.205.233"],
    processes: ["socketfilterfw"],
    os: "Darwin"
  },
  "mac-screen-sharing": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: ["admin", "developer", "john"],
    ips: ["10.0.0.5", "192.168.1.100"],
    processes: ["screensharingd"],
    os: "Darwin"
  },
  "mac-keychain-access": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: ["admin", "developer"],
    ips: [],
    processes: ["securityd"],
    os: "Darwin"
  },
  "mac-tcc-request": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: [],
    ips: [],
    processes: ["tccd"],
    os: "Darwin"
  },
  "mac-disk-mount": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: [],
    ips: [],
    processes: ["diskarbitrationd"],
    os: "Darwin"
  },
  "mac-launch-daemon": {
    hosts: ["MacBook-Pro", "Mac-Mini-Server", "Mac-Studio"],
    users: ["root"],
    ips: [],
    processes: ["launchd"],
    os: "Darwin"
  },
  "mac-user-created": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: ["backdoor", "newuser", "admin2"],
    ips: [],
    processes: ["sysadminctl"],
    os: "Darwin"
  },
  "mac-admin-added": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: ["backdoor", "attacker", "newadmin"],
    ips: [],
    processes: ["opendirectoryd"],
    os: "Darwin"
  },
  "mac-filevault-disabled": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: ["admin"],
    ips: [],
    processes: ["fdesetup"],
    os: "Darwin"
  },
  "mac-wifi-connect": {
    hosts: ["MacBook-Pro", "MacBook-Air", "iMac"],
    users: [],
    ips: [],
    processes: ["airportd"],
    os: "Darwin"
  },
  "mac-sip-status": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: [],
    ips: [],
    processes: ["kernel"],
    os: "Darwin"
  },
  "mac-app-crash": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: ["admin", "developer"],
    ips: [],
    processes: ["ReportCrash"],
    os: "Darwin"
  },
  "mac-touchid-failure": {
    hosts: ["MacBook-Pro", "MacBook-Air"],
    users: ["admin", "developer", "user"],
    ips: [],
    processes: ["biometrickitd"],
    os: "Darwin"
  },
  "mac-kernel-panic": {
    hosts: ["MacBook-Pro", "iMac-Pro", "Mac-Studio"],
    users: [],
    ips: [],
    processes: ["kernel"],
    os: "Darwin"
  }
};

const logTemplates: Record<string, (host: string, user: string, ip: string, process: string) => string> = {
  // Linux templates
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
    `new user: name=${user}, UID=${Math.floor(Math.random() * 1000) + 1000}, GID=${Math.floor(Math.random() * 1000) + 1000}, home=/home/${user}`,
  "SELINUX_DENIAL": (_host, user) =>
    `type=AVC msg=audit(${Date.now() / 1000}:${Math.floor(Math.random() * 1000)}): avc: denied { read } for pid=${Math.floor(Math.random() * 10000)} comm="${user || 'httpd'}" name="index.html"`,
  "CRON_FAILURE": (_host, user) =>
    `(${user || 'root'}) CMD (/usr/local/bin/backup.sh) FAILED exit code 1`,
  "DISK_FULL": () =>
    `/dev/sda1: filesystem is ${Math.floor(Math.random() * 6) + 95}% full`,
  "PACKAGE_INSTALL": (_host, _user, _ip, process) =>
    `Installed: ${['nginx', 'docker', 'postgresql', 'redis'][Math.floor(Math.random() * 4)]} via ${process || 'apt'}`,
  "FILE_INTEGRITY_VIOLATION": () =>
    `AIDE found differences between database and filesystem!! File: ${['/etc/passwd', '/etc/shadow', '/etc/sudoers', '/usr/bin/sudo'][Math.floor(Math.random() * 4)]}`,
  
  // Windows templates
  "WIN_LOGIN_FAILURE": (_host, user, ip) =>
    `Event ID 4625: An account failed to log on. Subject: Security ID: NULL SID Account Name: ${user} Source Network Address: ${ip || '127.0.0.1'} Logon Type: 10`,
  "WIN_LOGIN_SUCCESS": (_host, user, ip) =>
    `Event ID 4624: An account was successfully logged on. Subject: Security ID: SYSTEM Account Name: ${user} Source Network Address: ${ip || '127.0.0.1'} Logon Type: 2`,
  "RDP_FAILURE": (_host, user, ip) =>
    `Event ID 4625: An account failed to log on. Logon Type: 10 (RemoteInteractive) Account Name: ${user} Source Network Address: ${ip}`,
  "RDP_SUCCESS": (_host, user, ip) =>
    `Event ID 4624: An account was successfully logged on. Logon Type: 10 (RemoteInteractive) Account Name: ${user} Source Network Address: ${ip}`,
  "WIN_PRIVILEGE_USE": (_host, user) =>
    `Event ID 4672: Special privileges assigned to new logon. Subject: Security ID: DOMAIN\\${user} Privileges: SeDebugPrivilege, SeBackupPrivilege, SeTakeOwnershipPrivilege`,
  "WIN_SERVICE_INSTALL": (_host, _user, _ip, process) =>
    `Event ID 7045: A service was installed in the system. Service Name: ${process || 'SuspiciousService'} Service File Name: C:\\Windows\\Temp\\${['malware', 'backdoor', 'payload'][Math.floor(Math.random() * 3)]}.exe`,
  "WIN_POWERSHELL_EXEC": (_host, user) =>
    `Event ID 4104: Script block logging. User: ${user} Creating Scriptblock text (1 of 1): ${['Get-Process', 'Invoke-WebRequest', 'Get-ADUser'][Math.floor(Math.random() * 3)]}`,
  "WIN_SUSPICIOUS_PS": (_host, user) =>
    `Event ID 4688: A new process has been created. User: ${user} Process Name: powershell.exe Command Line: -nop -w hidden -encodedcommand ${btoa('malicious command').substring(0, 20)}...`,
  "WIN_FIREWALL_CHANGE": (_host, user) =>
    `Event ID 4946: A change has been made to Windows Firewall exception list. User: ${user} Rule Added: Allow All Direction: Inbound Protocol: TCP`,
  "WIN_DEFENDER_ALERT": () =>
    `Event ID 1116: Windows Defender detected malware. Threat Name: ${['Trojan:Win32/Emotet', 'Ransomware:Win32/WannaCry', 'Backdoor:Win32/Cobalt'][Math.floor(Math.random() * 3)]} Action: Quarantine Status: Success`,
  "WIN_LOG_CLEARED": (_host, user) =>
    `Event ID 1102: The audit log was cleared. Subject: Security ID: DOMAIN\\${user} Account Name: ${user}`,
  "WIN_TASK_CREATED": (_host, user) =>
    `Event ID 4698: A scheduled task was created by ${user}. Task Name: \\Microsoft\\Windows\\${['Maintenance', 'Update', 'Backup'][Math.floor(Math.random() * 3)]}\\SuspiciousTask`,
  "WIN_USER_CREATED": (_host, user) =>
    `Event ID 4720: A user account was created. Subject: Security ID: DOMAIN\\admin New Account: Account Name: ${user}`,
  "WIN_ADMIN_ADDED": (_host, user) =>
    `Event ID 4732: A member was added to a security-enabled local group. Group Name: Administrators Member: ${user}`,
  "WIN_PROCESS_INJECTION": (_host, _user, _ip, process) =>
    `Event ID 10: Process accessed. SourceImage: C:\\${process || 'mimikatz'}.exe TargetImage: C:\\Windows\\System32\\lsass.exe GrantedAccess: 0x1010`,
  "WIN_REGISTRY_PERSIST": (_host, user) =>
    `Event ID 13: Registry value set by ${user}. EventType: SetValue TargetObject: HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\Malware Details: C:\\malware.exe`,
  
  // macOS templates
  "MAC_LOGIN_FAILURE": (_host, user) =>
    `PAM: authentication error for login from ${user || 'invalid'}`,
  "MAC_LOGIN_SUCCESS": (_host, user) =>
    `authenticated successfully for user ${user}`,
  "MAC_SSH_FAILURE": (_host, user, ip) =>
    `Failed password for ${user || 'invalid'} from ${ip} port ${Math.floor(Math.random() * 60000) + 1024} ssh2`,
  "MAC_SUDO_FAILURE": (_host, user) =>
    `${user} : 3 incorrect password attempts ; TTY=ttys000 ; PWD=/Users/${user} ; USER=root ; COMMAND=/usr/bin/id`,
  "MAC_SUDO_SUCCESS": (_host, user) =>
    `${user} : TTY=ttys000 ; PWD=/Users/${user} ; USER=root ; COMMAND=/usr/bin/whoami`,
  "MAC_GATEKEEPER_BLOCK": () =>
    `AMFI: code signature validation failed for '/Applications/${['unsigned', 'malware', 'suspicious'][Math.floor(Math.random() * 3)]}.app/Contents/MacOS/binary'`,
  "MAC_XPROTECT_ALERT": (_host, user) =>
    `Malware detected: ${['OSX.MacOffers.A', 'OSX.Shlayer', 'OSX.Bundlore'][Math.floor(Math.random() * 3)]} Path: /Users/${user}/Downloads/malware.dmg Action: Quarantine`,
  "MAC_FIREWALL_BLOCK": (_host, _user, ip) =>
    `Deny connection from ${ip} connecting from port 443 to port ${Math.floor(Math.random() * 60000) + 1024} proto=6`,
  "MAC_SCREEN_SHARING": (_host, user, ip) =>
    `Authentication succeeded for user '${user}' from ${ip}`,
  "MAC_KEYCHAIN_ACCESS": (_host, _user, _ip, process) =>
    `SecKeychain: com.apple.security.keychain-access-groups denied for /Applications/${process || 'SuspiciousApp'}.app`,
  "MAC_TCC_REQUEST": () =>
    `Request: com.example.app for ${['kTCCServiceCamera', 'kTCCServiceMicrophone', 'kTCCServiceScreenCapture'][Math.floor(Math.random() * 3)]} Decision: Denied`,
  "MAC_DISK_MOUNT": () =>
    `disk${Math.floor(Math.random() * 4) + 1}s1 mounted at /Volumes/${['USB_DRIVE', 'External_HDD', 'BACKUP'][Math.floor(Math.random() * 3)]}`,
  "MAC_LAUNCH_DAEMON": () =>
    `Loaded: /Library/LaunchDaemons/com.${['malware', 'backdoor', 'suspicious'][Math.floor(Math.random() * 3)]}.agent.plist`,
  "MAC_USER_CREATED": (_host, user) =>
    `New user '${user}' created with UID ${Math.floor(Math.random() * 100) + 501}`,
  "MAC_ADMIN_ADDED": (_host, user) =>
    `User '${user}' added to group 'admin'`,
  "MAC_FILEVAULT_DISABLED": () =>
    `FileVault has been disabled on disk0s2`,
  "MAC_WIFI_CONNECT": () =>
    `Associated with '${['CoffeeShop_WiFi', 'Airport_Free', 'Hotel_Guest'][Math.floor(Math.random() * 3)]}' BSSID: ${Array(6).fill(0).map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':')}`,
  "MAC_SIP_CHANGED": () =>
    `System Integrity Protection status: ${['disabled', 'partially disabled'][Math.floor(Math.random() * 2)]}`,
  "MAC_APP_CRASH": (_host, user) =>
    `Saved crash report for ${['Safari', 'Chrome', 'Xcode', 'Finder'][Math.floor(Math.random() * 4)]}[${Math.floor(Math.random() * 10000) + 1000}] to /Users/${user}/Library/Logs/DiagnosticReports/`,
  "MAC_TOUCHID_FAILURE": (_host, user) =>
    `Fingerprint match failed after 3 attempts for user '${user}'`,
  "MAC_KERNEL_PANIC": () =>
    `Kernel panic - not syncing: ${['Fatal exception in interrupt', 'VFS: Unable to mount root fs', 'Kernel stack overflow'][Math.floor(Math.random() * 3)]}`
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

function getLogSource(eventTypeId: string, eventType: string): string {
  if (eventType.startsWith("WIN_") || eventType.startsWith("RDP")) return "windows_event_log";
  if (eventType.startsWith("MAC_")) return "macos_unified_log";
  if (eventTypeId.includes("firewall") || eventTypeId.includes("port-scan")) return "firewall";
  if (eventTypeId.includes("kernel") || eventTypeId.includes("usb")) return "kernel";
  if (eventTypeId.includes("service")) return "syslog";
  return "auth";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventTypeId, eventType, severity, detectsAlert, os } = body;
    
    const config = eventConfigs[eventTypeId] || { hosts: ["localhost"], users: [], ips: [], processes: ["system"], os: "Linux" };
    const { message, host, user, ip, process } = generateLogMessage(eventTypeId, eventType, config);
    
    const now = new Date();
    const timestamp = now.toISOString();
    const syslogTimestamp = now.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '');
    
    const rawMessage = `${syslogTimestamp} ${host} ${process}[${Math.floor(Math.random() * 30000) + 1000}]: ${message}`;
    
    const osName = config.os || (os === "windows" ? "Windows" : os === "mac" ? "Darwin" : "Linux");
    
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
      log_source: getLogSource(eventTypeId, eventType),
      os_name: osName
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
        description: `${detectsAlert} detected from ${ip || user || host} (${osName})`,
        timestamp: timestamp,
        status: "new",
        related_event_ids: JSON.stringify([eventData.id])
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
          process: process,
          os: osName
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