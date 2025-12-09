"""SQLite database storage layer with enhanced schema."""

import sqlite3
import logging
import threading
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple

from ..events import SecurityEvent, Alert

logger = logging.getLogger("security_logger.storage")


class Database:
    """SQLite database handler for events and alerts with thread safety."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._local = threading.local()
        self._init_db()
    
    def _get_conn(self) -> sqlite3.Connection:
        """Get thread-local database connection."""
        if not hasattr(self._local, 'conn') or self._local.conn is None:
            self._local.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self._local.conn.row_factory = sqlite3.Row
        return self._local.conn
    
    def _init_db(self):
        """Initialize database and create tables."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                event_time TEXT NOT NULL,
                host TEXT,
                process TEXT,
                pid INTEGER,
                event_type TEXT NOT NULL,
                user TEXT,
                src_ip TEXT,
                dst_ip TEXT,
                severity TEXT DEFAULT 'info',
                log_source TEXT,
                raw_message TEXT,
                os_name TEXT DEFAULT 'Linux'
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                alert_type TEXT NOT NULL,
                description TEXT,
                severity TEXT DEFAULT 'medium',
                related_event_ids TEXT,
                status TEXT DEFAULT 'active'
            )
        """)
        
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_event_time ON events(event_time)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_user ON events(user)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_src_ip ON events(src_ip)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_log_source ON events(log_source)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)")
        
        conn.commit()
        logger.info(f"Database initialized at {self.db_path}")
    
    def insert_event(self, event: SecurityEvent) -> int:
        """Insert a security event."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        now = datetime.now()
        event_time = event.event_time or now
        
        cursor.execute("""
            INSERT INTO events (created_at, event_time, host, process, pid, event_type, 
                              user, src_ip, dst_ip, severity, log_source, raw_message, os_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            now.isoformat(),
            event_time.isoformat(),
            event.host,
            event.process,
            event.pid,
            event.event_type,
            event.user,
            event.src_ip,
            event.dst_ip,
            event.severity or 'info',
            event.log_source,
            event.raw_message,
            event.os_name or 'Linux'
        ))
        conn.commit()
        return cursor.lastrowid
    
    def insert_alert(self, alert: Alert) -> int:
        """Insert an alert."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        now = datetime.now()
        
        cursor.execute("""
            INSERT INTO alerts (created_at, alert_type, description, severity, related_event_ids, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            now.isoformat(),
            alert.alert_type,
            alert.description,
            alert.severity or 'medium',
            alert.related_event_ids,
            alert.status or 'active'
        ))
        conn.commit()
        return cursor.lastrowid
    
    def query_events(
        self,
        limit: int = 100,
        offset: int = 0,
        event_type: Optional[str] = None,
        os_name: Optional[str] = None,
        user: Optional[str] = None,
        src_ip: Optional[str] = None,
        severity: Optional[str] = None,
        log_source: Optional[str] = None,
        search: Optional[str] = None,
        since_minutes: Optional[int] = None,
        from_time: Optional[str] = None,
        to_time: Optional[str] = None
    ) -> Tuple[List[SecurityEvent], int]:
        """Query events with filters and pagination. Returns (events, total_count)."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        where_clauses = ["1=1"]
        params = []
        
        if event_type:
            where_clauses.append("event_type = ?")
            params.append(event_type)
        
        if os_name:
            where_clauses.append("os_name = ?")
            params.append(os_name)
        
        if user:
            where_clauses.append("user LIKE ?")
            params.append(f"%{user}%")
        
        if src_ip:
            where_clauses.append("src_ip LIKE ?")
            params.append(f"%{src_ip}%")
        
        if severity:
            where_clauses.append("severity = ?")
            params.append(severity)
        
        if log_source:
            where_clauses.append("log_source = ?")
            params.append(log_source)
        
        if search:
            where_clauses.append("(raw_message LIKE ? OR user LIKE ? OR src_ip LIKE ? OR process LIKE ?)")
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param, search_param])
        
        if since_minutes:
            since_time = datetime.now() - timedelta(minutes=since_minutes)
            where_clauses.append("event_time >= ?")
            params.append(since_time.isoformat())
        
        if from_time:
            where_clauses.append("event_time >= ?")
            params.append(from_time)
        
        if to_time:
            where_clauses.append("event_time <= ?")
            params.append(to_time)
        
        where_sql = " AND ".join(where_clauses)
        
        count_query = f"SELECT COUNT(*) as count FROM events WHERE {where_sql}"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()['count']
        
        query = f"SELECT * FROM events WHERE {where_sql} ORDER BY event_time DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        
        events = []
        for row in cursor.fetchall():
            events.append(SecurityEvent(
                id=row['id'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
                event_time=datetime.fromisoformat(row['event_time']) if row['event_time'] else None,
                host=row['host'],
                process=row['process'],
                pid=row['pid'],
                event_type=row['event_type'],
                user=row['user'],
                src_ip=row['src_ip'],
                dst_ip=row['dst_ip'],
                severity=row['severity'],
                log_source=row['log_source'],
                raw_message=row['raw_message'],
                os_name=row['os_name']
            ))
        
        return events, total_count
    
    def query_alerts(
        self,
        limit: int = 100,
        offset: int = 0,
        alert_type: Optional[str] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        since_minutes: Optional[int] = None,
        from_time: Optional[str] = None,
        to_time: Optional[str] = None
    ) -> Tuple[List[Alert], int]:
        """Query alerts with filters and pagination. Returns (alerts, total_count)."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        where_clauses = ["1=1"]
        params = []
        
        if alert_type:
            where_clauses.append("alert_type = ?")
            params.append(alert_type)
        
        if severity:
            where_clauses.append("severity = ?")
            params.append(severity)
        
        if status:
            where_clauses.append("status = ?")
            params.append(status)
        
        if since_minutes:
            since_time = datetime.now() - timedelta(minutes=since_minutes)
            where_clauses.append("created_at >= ?")
            params.append(since_time.isoformat())
        
        if from_time:
            where_clauses.append("created_at >= ?")
            params.append(from_time)
        
        if to_time:
            where_clauses.append("created_at <= ?")
            params.append(to_time)
        
        where_sql = " AND ".join(where_clauses)
        
        count_query = f"SELECT COUNT(*) as count FROM alerts WHERE {where_sql}"
        cursor.execute(count_query, params)
        total_count = cursor.fetchone()['count']
        
        query = f"SELECT * FROM alerts WHERE {where_sql} ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        
        alerts = []
        for row in cursor.fetchall():
            alerts.append(Alert(
                id=row['id'],
                created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else None,
                alert_type=row['alert_type'],
                description=row['description'],
                severity=row['severity'],
                related_event_ids=row['related_event_ids'],
                status=row['status']
            ))
        
        return alerts, total_count
    
    def update_alert_status(self, alert_id: int, status: str) -> bool:
        """Update alert status."""
        conn = self._get_conn()
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET status = ? WHERE id = ?", (status, alert_id))
        conn.commit()
        return cursor.rowcount > 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive database statistics."""
        conn = self._get_conn()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as count FROM events")
        total_events = cursor.fetchone()['count']
        
        cursor.execute("SELECT event_type, COUNT(*) as count FROM events GROUP BY event_type ORDER BY count DESC")
        events_by_type = {row['event_type']: row['count'] for row in cursor.fetchall() if row['event_type']}
        
        cursor.execute("SELECT os_name, COUNT(*) as count FROM events GROUP BY os_name ORDER BY count DESC")
        events_by_os = {row['os_name']: row['count'] for row in cursor.fetchall() if row['os_name']}
        
        cursor.execute("SELECT severity, COUNT(*) as count FROM events GROUP BY severity ORDER BY count DESC")
        events_by_severity = {row['severity']: row['count'] for row in cursor.fetchall() if row['severity']}
        
        cursor.execute("SELECT COUNT(*) as count FROM alerts")
        total_alerts = cursor.fetchone()['count']
        
        cursor.execute("SELECT severity, COUNT(*) as count FROM alerts GROUP BY severity ORDER BY count DESC")
        alerts_by_severity = {row['severity']: row['count'] for row in cursor.fetchall() if row['severity']}
        
        cursor.execute("SELECT status, COUNT(*) as count FROM alerts GROUP BY status")
        alerts_by_status = {row['status']: row['count'] for row in cursor.fetchall() if row['status']}
        
        cursor.execute("""
            SELECT src_ip, COUNT(*) as count 
            FROM events 
            WHERE src_ip IS NOT NULL AND src_ip != ''
            GROUP BY src_ip 
            ORDER BY count DESC 
            LIMIT 10
        """)
        top_ips = [{'ip': row['src_ip'], 'count': row['count']} for row in cursor.fetchall()]
        
        cursor.execute("""
            SELECT user, COUNT(*) as count 
            FROM events 
            WHERE user IS NOT NULL AND user != ''
            GROUP BY user 
            ORDER BY count DESC 
            LIMIT 10
        """)
        top_users = [{'user': row['user'], 'count': row['count']} for row in cursor.fetchall()]
        
        cursor.execute("""
            SELECT strftime('%Y-%m-%d %H:00:00', event_time) as hour, COUNT(*) as count
            FROM events
            WHERE event_time >= datetime('now', '-24 hours')
            GROUP BY hour
            ORDER BY hour
        """)
        hourly_events = [{'hour': row['hour'], 'count': row['count']} for row in cursor.fetchall()]
        
        cursor.execute("""
            SELECT event_type, COUNT(*) as count 
            FROM events 
            WHERE event_type IN ('AUTH_FAILURE', 'AUTH_SUCCESS', 'FAILED_LOGIN', 'SUCCESS_LOGIN')
            GROUP BY event_type
        """)
        auth_stats = {row['event_type']: row['count'] for row in cursor.fetchall()}
        failed_logins = auth_stats.get('AUTH_FAILURE', 0) + auth_stats.get('FAILED_LOGIN', 0)
        successful_logins = auth_stats.get('AUTH_SUCCESS', 0) + auth_stats.get('SUCCESS_LOGIN', 0)
        
        cursor.execute("SELECT COUNT(DISTINCT src_ip) as count FROM events WHERE src_ip IS NOT NULL")
        unique_ips = cursor.fetchone()['count']
        
        return {
            'total_events': total_events,
            'total_alerts': total_alerts,
            'events_by_type': events_by_type,
            'events_by_os': events_by_os,
            'events_by_severity': events_by_severity,
            'alerts_by_severity': alerts_by_severity,
            'alerts_by_status': alerts_by_status,
            'top_source_ips': top_ips,
            'top_users': top_users,
            'hourly_events': hourly_events,
            'failed_logins': failed_logins,
            'successful_logins': successful_logins,
            'unique_ips': unique_ips
        }
    
    def get_recent_events_for_analysis(self, minutes: int = 15, limit: int = 1000) -> List[SecurityEvent]:
        """Get recent events for rule analysis."""
        events, _ = self.query_events(limit=limit, since_minutes=minutes)
        return events
    
    def close(self):
        """Close database connection."""
        if hasattr(self._local, 'conn') and self._local.conn:
            self._local.conn.close()
            self._local.conn = None
