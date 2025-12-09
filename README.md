# SecLogger - Real-Time OS Security Event Logger

A cross-platform security monitoring system that ingests real OS logs, parses security events, and generates alerts for potential threats.

## Features

- **Real-Time Log Ingestion**: Monitors OS log files (auth.log, syslog, kern.log, ufw.log) in real-time
- **Cross-Platform Support**: Linux, Windows, and macOS
- **Event Parsing**: Extracts structured data from SSH logins, sudo usage, firewall blocks, kernel events
- **Alert Engine**: Rule-based threat detection (brute force, port scans, privilege escalation, kernel instability)
- **Role-Based Access**: Admin users can simulate events and configure thresholds
- **Live Dashboard**: Real-time stats, events, and alerts with 5-second refresh

## Architecture

```
┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
│   OS Log Files      │      │  Python Ingestor    │      │     Supabase        │
│  /var/log/auth.log  │ ───► │  os_ingestor.py     │ ───► │  security_events    │
│  /var/log/syslog    │      │  + Alert Engine     │      │  alerts             │
│  /var/log/kern.log  │      │                     │      │  users              │
│  /var/log/ufw.log   │      └─────────────────────┘      └──────────┬──────────┘
└─────────────────────┘                                              │
                                                                     │
                                                                     ▼
                       ┌─────────────────────────────────────────────────────────┐
                       │                    Next.js Frontend                      │
                       │  Dashboard │ Events │ Alerts │ Statistics                │
                       │  Real-time updates • Role-based UI • CSV export          │
                       └─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Start the Frontend

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`

### 2. Start the Python Log Ingestor

```bash
cd backend
pip install -r requirements.txt

# Real mode (monitors actual OS logs - requires sudo on Linux)
sudo python os_ingestor.py

# Mock mode (generates simulated events)
python os_ingestor.py --mock
```

### 3. Create an Account

1. Go to `/signup` and create an account
2. First user created gets `admin` role by default
3. Login at `/login`

## Usage

### Real Mode (Production)

Run the ingestor with root privileges to monitor actual OS logs:

```bash
sudo SUPABASE_URL=https://your-project.supabase.co \
     SUPABASE_SERVICE_KEY=your-key \
     python os_ingestor.py
```

The ingestor will:
- Monitor `/var/log/auth.log`, `/var/log/syslog`, `/var/log/kern.log`, `/var/log/ufw.log`
- Parse events (SSH logins, sudo usage, firewall blocks, kernel warnings)
- Push events to Supabase
- Generate alerts when thresholds are exceeded

### Mock Mode (Demo/Development)

```bash
python os_ingestor.py --mock --mock-interval 5
```

Generates simulated events every 5 seconds for testing.

## Generating Test Events

To see the system in action, trigger real OS events:

### Failed SSH Login
```bash
ssh invalid_user@localhost
```

### Failed Sudo
```bash
sudo -u root ls
# Enter wrong password 3+ times
```

### Service Restart
```bash
sudo systemctl restart nginx
```

### Firewall Block (if UFW is enabled)
```bash
# From another machine, attempt connection to blocked port
nmap -p 22,80,443 your-server-ip
```

## Alert Detection Rules

| Rule | Trigger | Severity |
|------|---------|----------|
| **Brute Force** | 5+ failed logins from same IP in 3 minutes | Critical |
| **Port Scan** | 10+ firewall blocks from same IP in 5 minutes | Warning |
| **Privilege Escalation** | 3+ failed sudo attempts in 5 minutes | Critical |
| **Kernel Instability** | 5+ kernel errors/warnings in 10 minutes | Warning |

## Role-Based Access

| Feature | Admin | Viewer |
|---------|-------|--------|
| View Dashboard | Yes | Yes |
| View Events | Yes | Yes |
| View Alerts | Yes | Yes |
| View Statistics | Yes | Yes |
| Simulate Events | Yes | No |
| Configure Thresholds | Yes | No |

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
USE_MOCK_DATA=false
```

### Backend
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
USE_MOCK_DATA=false
```

## Database Schema

### security_events
- `id`, `created_at`, `event_time`, `timestamp`
- `event_type` (AUTH_FAILURE, AUTH_SUCCESS, SUDO_SUCCESS, SUDO_FAILURE, FIREWALL_BLOCK, etc.)
- `severity` (info, warning, error, critical)
- `user`, `src_ip`, `dst_ip`, `host`, `process`, `pid`
- `log_source`, `platform`, `raw_message`

### alerts
- `id`, `created_at`
- `alert_type` (BRUTE_FORCE, PORT_SCAN, PRIVILEGE_ESCALATION, KERNEL_INSTABILITY)
- `severity`, `description`, `related_event_ids`, `status`

### users
- `id`, `created_at`, `email`, `password_hash`, `full_name`, `role`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET | List events with filters |
| `/api/events/simulate` | POST | Generate test event (admin only) |
| `/api/alerts` | GET | List alerts |
| `/api/stats` | GET | Get statistics |
| `/api/config` | GET | Get system mode (real/mock) |
| `/api/health` | GET | Health check |
| `/api/auth/login` | POST | User login |
| `/api/auth/signup` | POST | User registration |
| `/api/auth/me` | GET | Current user info |

## Event Types

| Type | Description |
|------|-------------|
| AUTH_SUCCESS | Successful login (SSH, PAM) |
| AUTH_FAILURE | Failed login attempt |
| SUDO_SUCCESS | Successful sudo command |
| SUDO_FAILURE | Failed sudo attempt |
| SESSION_START | User session opened |
| SESSION_END | User session closed |
| FIREWALL_BLOCK | Connection blocked by firewall |
| FIREWALL_ALLOW | Connection allowed by firewall |
| SERVICE_START | Service started |
| SERVICE_STOP | Service stopped |
| SERVICE_FAILURE | Service failed to start |
| KERNEL_ERROR | Kernel error |
| KERNEL_WARNING | Kernel warning |
| KERNEL_OOM | Out of memory event |
| KERNEL_SEGFAULT | Segmentation fault |

## License

MIT
