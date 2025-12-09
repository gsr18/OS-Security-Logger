# Real-Time OS Security Event Logger

A cross-platform security event logger that monitors OS-level security events in real-time, stores them in SQLite using SQLAlchemy ORM, and provides intelligent rule-based threat detection.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OS Security Logs                            │
│  /var/log/auth.log  │  syslog  │  kern.log  │  ufw.log  │  audit   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Python Backend (Flask)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Log Reader  │─▶│   Parsers    │─▶│  SQLite + SQLAlchemy ORM │  │
│  │  (tail -f)   │  │  (per type)  │  │  (events + alerts)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                               │                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Rule-Based Detection Engine                      │  │
│  │  • Brute Force  • Port Scan  • Privilege Escalation          │  │
│  │  • Firewall Attack  • System Instability  • Suspicious Sudo  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                               │                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Flask REST API                             │  │
│  │  /api/events  /api/alerts  /api/stats  /api/health           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Next.js Frontend (React 19)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐   │
│  │  Dashboard │  │   Events   │  │   Alerts   │  │ Statistics │   │
│  │  (live)    │  │  (filter)  │  │  (manage)  │  │  (charts)  │   │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

## Features

### Log Sources (Linux)
- `/var/log/auth.log` - SSH, sudo, PAM authentication
- `/var/log/syslog` - System services, systemd
- `/var/log/kern.log` - Kernel messages
- `/var/log/ufw.log` - UFW firewall events
- `/var/log/audit/audit.log` - Linux audit events

### Detection Rules
- **Brute Force**: Multiple failed login attempts
- **Port Scan**: Multiple firewall blocks from same IP
- **Privilege Escalation**: Suspicious sudo from service accounts
- **System Instability**: Frequent kernel errors
- **Service Failures**: Multiple service crashes
- **Rapid Login**: Logins from multiple IPs

### Event Types
- `AUTH_SUCCESS` / `AUTH_FAILURE` - Login attempts
- `SUDO_SUCCESS` / `SUDO_FAILURE` - Sudo commands
- `FIREWALL_BLOCK` / `FIREWALL_ALLOW` - Firewall events
- `SERVICE_START` / `SERVICE_STOP` / `SERVICE_FAILURE`
- `KERNEL_WARNING` / `KERNEL_ERROR` / `KERNEL_OOM`
- `SESSION_START` / `SESSION_END`

## Quick Start

### 1. Start the Python Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run with real OS logs (requires sudo for log access)
sudo python run.py

# OR run with mock data (no sudo required)
python run.py --mock
```

The API server starts at `http://localhost:5000`

### 2. Start the Next.js Frontend

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

The frontend runs at `http://localhost:3000`

## Configuration

### Backend (`backend/config.yaml`)

```yaml
database:
  path: "./security_events.db"

use_mock_data: false  # Set to true for demo mode

log_sources:
  linux:
    enabled: true
    files:
      - path: "/var/log/auth.log"
        type: "auth"
      - path: "/var/log/syslog"
        type: "syslog"

rules:
  brute_force:
    enabled: true
    max_failed_attempts: 5
    window_minutes: 10

api:
  host: "0.0.0.0"
  port: 5000
```

### Frontend (`.env.local`)

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_USE_MOCK_DATA=false
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with backend status |
| `/api/events` | GET | List events with filtering and pagination |
| `/api/events` | POST | Generate a mock event (testing) |
| `/api/alerts` | GET | List alerts with filtering |
| `/api/alerts/:id` | PATCH | Update alert status |
| `/api/stats` | GET | Get statistics and aggregations |

### Query Parameters

**Events:**
- `page`, `pageSize` - Pagination
- `type` - Filter by event type
- `os` - Filter by OS
- `user` - Filter by username
- `srcIp` - Filter by source IP
- `severity` - Filter by severity
- `search` - Full-text search

**Alerts:**
- `severity` - Filter by severity
- `status` - Filter by status (active/acknowledged/resolved)

## Running Modes

### 1. Real Mode (Production)
Monitors actual OS log files. Requires appropriate permissions.

```bash
sudo python backend/run.py
```

### 2. Mock Mode (Demo/Development)
Uses generated mock data. No special permissions needed.

```bash
python backend/run.py --mock
```

### 3. Frontend-Only Mode
If Flask backend is unavailable, frontend automatically falls back to its own mock API routes.

## Log File Permissions

To monitor log files without sudo, add your user to the appropriate groups:

```bash
# For auth.log and syslog
sudo usermod -aG adm $USER

# For audit logs
sudo usermod -aG root $USER

# Log out and back in for changes to take effect
```

Or adjust file permissions:

```bash
sudo chmod 644 /var/log/auth.log
```

## SQLite Database

The application uses SQLite as the storage backend with SQLAlchemy ORM for data persistence.

### Database File

- **Location**: `security_events.db` (relative to backend root)
- **Tables**: `security_events` and `alerts`
- **Auto-created**: Tables are automatically created on first run via `Base.metadata.create_all()`

### Resetting the Database

To reset the database and start fresh:

```bash
cd backend
rm -f security_events.db
# Tables will be recreated on next run
python run.py --mock
```

### Database Schema

**security_events table:**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| created_at | DATETIME | When the event was ingested |
| event_time | DATETIME | When the event actually occurred |
| host | VARCHAR(128) | Host machine name |
| process | VARCHAR(128) | Process that generated the event |
| pid | INTEGER | Process ID |
| event_type | VARCHAR(64) | Event type (AUTH_FAILURE, etc.) |
| user | VARCHAR(128) | Username involved |
| src_ip | VARCHAR(64) | Source IP address |
| dst_ip | VARCHAR(64) | Destination IP address |
| severity | VARCHAR(32) | info/warning/error/critical |
| log_source | VARCHAR(64) | Log file source (auth, syslog, etc.) |
| raw_message | TEXT | Original log message |
| platform | VARCHAR(32) | OS platform (linux/windows/macos) |

**alerts table:**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| created_at | DATETIME | When the alert was generated |
| alert_type | VARCHAR(64) | Alert type (BRUTE_FORCE, etc.) |
| description | TEXT | Alert description |
| severity | VARCHAR(32) | low/medium/high/critical |
| related_event_ids | TEXT | Comma-separated related event IDs |
| status | VARCHAR(32) | active/acknowledged/resolved/dismissed |

### Configuration

Set `DATABASE_URL` environment variable to customize the database location:

```bash
export DATABASE_URL="sqlite:///./custom_path.db"
```

## Tech Stack

**Backend:**
- Python 3.8+
- Flask 3.0 with CORS
- SQLite with SQLAlchemy ORM
- YAML configuration

**Frontend:**
- Next.js 15 (App Router)
- React 19 with TypeScript
- Tailwind CSS 4
- shadcn/ui components
- Framer Motion animations

## Project Structure

```
├── backend/
│   ├── run.py                 # Entry point
│   ├── config.yaml            # Configuration
│   ├── requirements.txt
│   └── security_logger/
│       ├── api.py             # Flask REST API
│       ├── main.py            # Application orchestrator
│       ├── events.py          # Data classes
│       ├── log_reader.py      # Real-time log tailing
│       ├── mock_generator.py  # Mock data generator
│       ├── analysis/          # Detection rules
│       ├── parsing/           # Log parsers
│       └── storage/           # Database layer
│
├── src/
│   ├── app/                   # Next.js pages
│   │   ├── dashboard/
│   │   ├── events/
│   │   ├── alerts/
│   │   └── statistics/
│   ├── components/            # React components
│   └── lib/
│       └── api.ts             # API client
│
└── README.md
```

## License

MIT

