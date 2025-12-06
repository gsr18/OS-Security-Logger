"""SQLite database storage layer."""

import sqlite3
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from ..events import SecurityEvent, Alert

logger = logging.getLogger("security_logger.storage")


class Database:
    """SQLite database handler for events and alerts."""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = None
        self._init_db()
    
    def _init_db(self):
        """Initialize database and create tables."""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
        cursor = self.conn.cursor()
        
        # Events table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                os_name TEXT,
                event_type TEXT,
                username TEXT,
                source_ip TEXT,
                process_name TEXT,
                raw_message TEXT
            )
        """)
        
        # Alerts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                alert_type TEXT,
                severity TEXT,
                description TEXT,
                related_event_ids TEXT
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp)")
        
        self.conn.commit()
        logger.info(f"Database initialized at {self.db_path}")
    
    def insert_event(self, event: SecurityEvent) -> int:
        """Insert a security event."""
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO events (timestamp, os_name, event_type, username, source_ip, process_name, raw_message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            event.timestamp.isoformat() if event.timestamp else datetime.now().isoformat(),
            event.os_name,
            event.event_type,
            event.username,
            event.source_ip,
            event.process_name,
            event.raw_message
        ))
        self.conn.commit()
        return cursor.lastrowid
    
    def insert_alert(self, alert: Alert) -> int:
        """Insert an alert."""
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO alerts (timestamp, alert_type, severity, description, related_event_ids)
            VALUES (?, ?, ?, ?, ?)
        """, (
            alert.timestamp.isoformat() if alert.timestamp else datetime.now().isoformat(),
            alert.alert_type,
            alert.severity,
            alert.description,
            alert.related_event_ids
        ))
        self.conn.commit()
        return cursor.lastrowid
    
    def query_events(self, limit: int = 100, event_type: Optional[str] = None, 
                    os_name: Optional[str] = None, since_minutes: Optional[int] = None) -> List[SecurityEvent]:
        """Query events with filters."""
        query = "SELECT * FROM events WHERE 1=1"
        params = []
        
        if event_type:
            query += " AND event_type = ?"
            params.append(event_type)
        
        if os_name:
            query += " AND os_name = ?"
            params.append(os_name)
        
        if since_minutes:
            since_time = datetime.now() - timedelta(minutes=since_minutes)
            query += " AND timestamp >= ?"
            params.append(since_time.isoformat())
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        
        events = []
        for row in cursor.fetchall():
            events.append(SecurityEvent(
                id=row['id'],
                timestamp=datetime.fromisoformat(row['timestamp']),
                os_name=row['os_name'],
                event_type=row['event_type'],
                username=row['username'],
                source_ip=row['source_ip'],
                process_name=row['process_name'],
                raw_message=row['raw_message']
            ))
        
        return events
    
    def query_alerts(self, limit: int = 100, severity: Optional[str] = None, 
                    since_minutes: Optional[int] = None) -> List[Alert]:
        """Query alerts with filters."""
        query = "SELECT * FROM alerts WHERE 1=1"
        params = []
        
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        
        if since_minutes:
            since_time = datetime.now() - timedelta(minutes=since_minutes)
            query += " AND timestamp >= ?"
            params.append(since_time.isoformat())
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        
        alerts = []
        for row in cursor.fetchall():
            alerts.append(Alert(
                id=row['id'],
                timestamp=datetime.fromisoformat(row['timestamp']),
                alert_type=row['alert_type'],
                severity=row['severity'],
                description=row['description'],
                related_event_ids=row['related_event_ids']
            ))
        
        return alerts
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        cursor = self.conn.cursor()
        
        # Total events
        cursor.execute("SELECT COUNT(*) as count FROM events")
        total_events = cursor.fetchone()['count']
        
        # Events by type
        cursor.execute("SELECT event_type, COUNT(*) as count FROM events GROUP BY event_type")
        events_by_type = {row['event_type']: row['count'] for row in cursor.fetchall()}
        
        # Events by OS
        cursor.execute("SELECT os_name, COUNT(*) as count FROM events GROUP BY os_name")
        events_by_os = {row['os_name']: row['count'] for row in cursor.fetchall()}
        
        # Total alerts
        cursor.execute("SELECT COUNT(*) as count FROM alerts")
        total_alerts = cursor.fetchone()['count']
        
        # Alerts by severity
        cursor.execute("SELECT severity, COUNT(*) as count FROM alerts GROUP BY severity")
        alerts_by_severity = {row['severity']: row['count'] for row in cursor.fetchall()}
        
        # Top source IPs
        cursor.execute("""
            SELECT source_ip, COUNT(*) as count 
            FROM events 
            WHERE source_ip IS NOT NULL 
            GROUP BY source_ip 
            ORDER BY count DESC 
            LIMIT 10
        """)
        top_ips = [{'ip': row['source_ip'], 'count': row['count']} for row in cursor.fetchall()]
        
        return {
            'total_events': total_events,
            'total_alerts': total_alerts,
            'events_by_type': events_by_type,
            'events_by_os': events_by_os,
            'alerts_by_severity': alerts_by_severity,
            'top_source_ips': top_ips
        }
    
    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
