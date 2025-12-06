# Real-Time OS Security Event Logger

A cross-platform security event monitoring system that captures, analyzes, and alerts on security-related events from Linux, Windows, and macOS operating systems.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Event Sources                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Linux   │  │ Windows  │  │  macOS   │              │
│  │ auth.log │  │Event Log │  │Unified   │              │
│  │          │  │          │  │Log       │              │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘              │
└────────┼────────────┼─────────────┼────────────────────┘
         │            │             │
         └────────────┼─────────────┘
                      ▼
         ┌────────────────────────┐
         │   Parser & Normalizer  │
         │  (SecurityEvent)       │
         └───────────┬────────────┘
                     ▼
         ┌────────────────────────┐
         │   SQLite Database      │
         │  - events              │
         │  - alerts              │
         └───────────┬────────────┘
                     ▼
         ┌────────────────────────┐
         │   Rule Engine          │
         │  - Brute Force         │
         │  - Suspicious Sudo     │
         │  - Rapid Login         │
         └───────────┬────────────┘
                     ▼
         ┌────────────────────────┐
         │   Flask API / Web UI   │
         │   Next.js Dashboard    │
         └────────────────────────┘
```

## 🚀 Features

- **Cross-Platform**: Works on Linux, Windows, and macOS
- **Real-Time Monitoring**: Near-instant event detection (< 1 second)
- **Intelligent Rules**: Brute force, privilege escalation, and suspicious activity detection
- **RESTful API**: Query events and alerts programmatically
- **Web Dashboard**: Modern React-based UI with real-time updates
- **Lightweight**: SQLite database, minimal dependencies
- **Extensible**: Easy to add new rules and event sources

## 📋 Prerequisites

- Python 3.10+
- Administrative/root privileges (to access system logs)
- Node.js 18+ (for web dashboard)

### OS-Specific Requirements

**Linux:**
- Access to `/var/log/auth.log` (run as root or add user to `adm` group)

**Windows:**
- Administrative privileges
- `pywin32` library (automatically installed)

**macOS:**
- Access to unified logging system
- May require running with elevated privileges

## 🔧 Installation

### Backend (Python)

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and edit configuration
cp config.yaml config.yaml
# Edit config.yaml as needed
```

### Frontend (Next.js)

```bash
# From project root
npm install
# or
bun install
```

## 🏃 Running

### Start Backend API Server

```bash
cd backend
source venv/bin/activate

# Run with API server (recommended for web dashboard)
python run.py

# The backend will:
# - Start monitoring OS security events
# - Start Flask API server on http://localhost:5000
# - Begin analyzing events with detection rules
```

### Start Frontend Dashboard

```bash
# From project root
npm run dev
# or
bun dev

# Access web dashboard at http://localhost:3000
```

## 📊 API Endpoints

The Flask backend exposes these REST endpoints:

### Events

```bash
# Get all events
GET http://localhost:5000/api/events

# Filter by event type
GET http://localhost:5000/api/events?type=FAILED_LOGIN

# Filter by OS
GET http://localhost:5000/api/events?os=Linux

# Recent events (last N minutes)
GET http://localhost:5000/api/events?since_minutes=10

# Limit results
GET http://localhost:5000/api/events?limit=50
```

### Alerts

```bash
# Get all alerts
GET http://localhost:5000/api/alerts

# Filter by severity
GET http://localhost:5000/api/alerts?severity=CRITICAL

# Recent alerts
GET http://localhost:5000/api/alerts?since_minutes=60
```

### Statistics

```bash
# Get comprehensive stats
GET http://localhost:5000/api/stats
```

## 🔍 Event Types

- `FAILED_LOGIN`: Failed authentication attempt
- `SUCCESS_LOGIN`: Successful authentication
- `SUDO_COMMAND`: Privilege elevation via sudo
- `PRIV_ESCALATION`: General privilege escalation

## 🚨 Detection Rules

### Brute Force Detection
Triggers when:
- 5+ failed login attempts from same IP within 10 minutes
- 5+ failed login attempts for same user within 10 minutes

### Suspicious Sudo Usage
Triggers when:
- Unusual system accounts (www-data, nobody, guest) execute sudo commands

### Rapid Login Attempts
Triggers when:
- 10+ login attempts across different users from same IP within 5 minutes

## ⚙️ Configuration

Edit `backend/config.yaml`:

```yaml
database:
  path: "./security_events.db"

logging:
  level: "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL

sources:
  linux:
    enabled: true
    auth_log_path: "/var/log/auth.log"
  windows:
    enabled: true
  macos:
    enabled: true

rules:
  brute_force:
    enabled: true
    max_failed_attempts: 5
    window_minutes: 10
  
  sudo_suspicious:
    enabled: true
    unusual_users: ["www-data", "nobody", "guest"]
  
  rapid_login:
    enabled: true
    max_attempts: 10
    window_minutes: 5

api:
  host: "0.0.0.0"
  port: 5000
  debug: false
```

## 🛠️ Development

### Project Structure

```
backend/
├── security_logger/
│   ├── __init__.py
│   ├── main.py              # Main orchestrator
│   ├── api.py               # Flask API
│   ├── config.py            # Configuration loader
│   ├── events.py            # Event/Alert dataclasses
│   ├── logging_utils.py     # Logging setup
│   ├── sources/             # OS-specific event sources
│   │   ├── base.py
│   │   ├── linux_source.py
│   │   ├── windows_source.py
│   │   └── macos_source.py
│   ├── parsing/             # Log parsers
│   │   ├── linux_parser.py
│   │   ├── windows_parser.py
│   │   └── macos_parser.py
│   ├── storage/             # Database layer
│   │   └── db.py
│   └── analysis/            # Rule engine
│       ├── rules_base.py
│       ├── rules_bruteforce.py
│       ├── rules_sudo.py
│       └── engine.py
├── run.py                   # Entry point
├── config.yaml              # Configuration
└── requirements.txt         # Python dependencies
```

## 🐛 Troubleshooting

### Permission Denied Errors

**Linux:**
```bash
# Option 1: Run as root
sudo python run.py

# Option 2: Add user to adm group
sudo usermod -a -G adm $USER
# Then log out and back in
```

**Windows:**
- Run Command Prompt or PowerShell as Administrator

**macOS:**
```bash
sudo python run.py
```

### No Events Captured

1. Check log file permissions
2. Verify correct log path in config.yaml
3. Ensure events are actually being generated (try failed SSH login)
4. Check backend logs for errors

### API Not Accessible

1. Verify Flask server started: Check console for "Starting API server"
2. Check firewall settings
3. Ensure port 5000 is not in use: `lsof -i :5000` (Linux/macOS) or `netstat -ano | findstr :5000` (Windows)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 🔗 Links

- Web Dashboard: http://localhost:3000
- API Server: http://localhost:5000
- Documentation: See this README

## 👥 Authors

SecLogger Team - Real-Time OS Security Event Logger
