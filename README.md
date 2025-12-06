# 🔐 Real-Time OS Security Event Logger

A comprehensive, cross-platform security event monitoring system that captures, analyzes, and alerts on OS-level security events in real-time. Features a modern web dashboard built with Next.js and a powerful Python backend.

![Security Dashboard](https://img.shields.io/badge/Platform-Linux%20%7C%20Windows%20%7C%20macOS-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)

## 🌟 Features

### Backend (Python)
- **Cross-Platform Monitoring**: Works on Linux, Windows, and macOS
- **Real-Time Detection**: Near-instant event capture (< 1 second)
- **Intelligent Rules Engine**: 
  - Brute force attack detection
  - Suspicious privilege escalation alerts
  - Rapid login attempt monitoring
- **SQLite Storage**: Lightweight, fast, and reliable
- **RESTful API**: Query events and alerts programmatically
- **Event Normalization**: Unified format across all platforms

### Frontend (Next.js)
- **Modern Dashboard**: Real-time monitoring with auto-refresh
- **Event Browser**: Advanced filtering, search, and pagination
- **Alert Management**: Severity-based alert tracking
- **Statistics & Analytics**: Comprehensive data visualization
- **CSV Export**: Download event logs for analysis
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Mode**: Built-in theme support

## 📋 Prerequisites

- **Python 3.10+**
- **Node.js 18+** (with npm or bun)
- **Administrative/Root Privileges** (to access system logs)

### OS-Specific Requirements

**Linux:**
- Access to `/var/log/auth.log` (run as root or add user to `adm` group)
- systemd-based system (for journalctl support)

**Windows:**
- Administrative privileges
- Python `pywin32` library (auto-installed)

**macOS:**
- Access to unified logging system
- May require elevated privileges

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd security-event-logger
```

### 2. Setup Backend (Python)

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
python run.py
```

The backend will:
- Start monitoring OS security events
- Launch Flask API server on `http://localhost:5000`
- Begin analyzing events with detection rules

### 3. Setup Frontend (Next.js)

```bash
# From project root
npm install
# or
bun install

# Start the development server
npm run dev
# or
bun dev
```

Access the web dashboard at **http://localhost:3000**

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 OS Event Sources                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Linux   │  │ Windows  │  │  macOS   │              │
│  │ auth.log │  │Event Log │  │Unified   │              │
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
         │   Flask REST API       │
         │   (port 5000)          │
         └───────────┬────────────┘
                     ▼
         ┌────────────────────────┐
         │   Next.js Dashboard    │
         │   (port 3000)          │
         └────────────────────────┘
```

## 🔍 Event Types

- `FAILED_LOGIN`: Failed authentication attempts
- `SUCCESS_LOGIN`: Successful authentication
- `SUDO_COMMAND`: Privilege elevation via sudo
- `PRIV_ESCALATION`: General privilege escalation

## 🚨 Detection Rules

### Brute Force Detection
**Triggers when:**
- 5+ failed login attempts from same IP within 10 minutes
- 5+ failed login attempts for same user within 10 minutes

### Suspicious Sudo Usage
**Triggers when:**
- Unusual system accounts (www-data, nobody, guest) execute sudo commands

### Rapid Login Attempts
**Triggers when:**
- 10+ login attempts across different users from same IP within 5 minutes

## 🌐 API Endpoints

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

## 🛠️ Project Structure

```
.
├── backend/                      # Python backend
│   ├── security_logger/
│   │   ├── sources/             # OS-specific event sources
│   │   │   ├── linux_source.py
│   │   │   ├── windows_source.py
│   │   │   └── macos_source.py
│   │   ├── parsing/             # Log parsers
│   │   ├── storage/             # Database layer
│   │   ├── analysis/            # Rule engine
│   │   ├── api.py              # Flask API
│   │   └── main.py             # Main orchestrator
│   ├── run.py                  # Entry point
│   ├── config.yaml             # Configuration
│   └── requirements.txt        # Python dependencies
│
├── src/                         # Next.js frontend
│   ├── app/                    # App router pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── events/             # Event browser
│   │   ├── alerts/             # Alert management
│   │   └── statistics/         # Analytics
│   ├── components/             # React components
│   └── lib/
│       └── api.ts             # API client
│
└── README.md                   # This file
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
2. Verify correct log path in `config.yaml`
3. Ensure events are actually being generated (try failed SSH login)
4. Check backend logs for errors

### API Connection Errors

1. Verify Flask server started: Check console for "Starting API server"
2. Check firewall settings
3. Ensure port 5000 is not in use:
   - Linux/macOS: `lsof -i :5000`
   - Windows: `netstat -ano | findstr :5000`
4. Set `NEXT_PUBLIC_API_URL` environment variable if needed

### Frontend Not Displaying Data

1. Ensure backend is running on `http://localhost:5000`
2. Check browser console for CORS errors
3. Verify API endpoints are accessible: `curl http://localhost:5000/api/health`

## 🧪 Testing

Generate test events on Linux:

```bash
# Generate failed login attempt
ssh invalid_user@localhost

# Generate successful login
ssh your_username@localhost

# Generate sudo event
sudo ls
```

## 📦 Deployment

### Backend

```bash
# Production setup
cd backend
python run.py
# Consider using systemd service or supervisor for production
```

### Frontend

```bash
# Build for production
npm run build
# or
bun run build

# Start production server
npm start
# or
bun start
```

## 🔒 Security Considerations

- **Root Privileges**: Required for accessing system logs
- **API Security**: Add authentication for production deployments
- **Database**: SQLite is suitable for single-instance deployments
- **CORS**: Configure appropriate CORS settings for production
- **Logs**: Sensitive information may be logged; secure storage accordingly

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## 👥 Authors

SecLogger Team - Real-Time OS Security Event Logger

## 🙏 Acknowledgments

- Built with Python, Flask, Next.js, and React
- Uses Shadcn/UI for component library
- Tailwind CSS for styling

---

**🌐 Links**
- Web Dashboard: http://localhost:3000
- API Server: http://localhost:5000
- Documentation: See this README