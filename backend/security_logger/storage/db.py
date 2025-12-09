"""SQLAlchemy-based database storage layer."""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple

from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session

from ..database import SessionLocal, init_db
from ..models import SecurityEventModel, AlertModel
from ..events import SecurityEvent, Alert

logger = logging.getLogger("security_logger.storage")


class Database:
    """SQLAlchemy database handler for events and alerts."""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path
        init_db()
        logger.info(f"Database initialized with SQLAlchemy ORM")
    
    def _get_session(self) -> Session:
        """Get a new database session."""
        return SessionLocal()
    
    def insert_event(self, event: SecurityEvent) -> int:
        """Insert a security event."""
        session = self._get_session()
        try:
            now = datetime.now()
            event_time = event.event_time or now
            
            db_event = SecurityEventModel(
                event_time=event_time,
                host=event.host,
                process=event.process,
                pid=event.pid,
                event_type=event.event_type,
                user=event.user,
                src_ip=event.src_ip,
                dst_ip=event.dst_ip,
                severity=event.severity or 'info',
                log_source=event.log_source,
                raw_message=event.raw_message or '',
                platform=event.os_name or 'linux'
            )
            session.add(db_event)
            session.commit()
            session.refresh(db_event)
            return db_event.id
        except Exception as e:
            session.rollback()
            logger.error(f"Error inserting event: {e}")
            raise
        finally:
            session.close()
    
    def insert_alert(self, alert: Alert) -> int:
        """Insert an alert."""
        session = self._get_session()
        try:
            db_alert = AlertModel(
                alert_type=alert.alert_type,
                description=alert.description or '',
                severity=alert.severity or 'medium',
                related_event_ids=alert.related_event_ids,
                status=alert.status or 'active'
            )
            session.add(db_alert)
            session.commit()
            session.refresh(db_alert)
            return db_alert.id
        except Exception as e:
            session.rollback()
            logger.error(f"Error inserting alert: {e}")
            raise
        finally:
            session.close()
    
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
        """Query events with filters and pagination."""
        session = self._get_session()
        try:
            query = session.query(SecurityEventModel)
            
            if event_type:
                query = query.filter(SecurityEventModel.event_type == event_type)
            
            if os_name:
                query = query.filter(SecurityEventModel.platform == os_name)
            
            if user:
                query = query.filter(SecurityEventModel.user.ilike(f"%{user}%"))
            
            if src_ip:
                query = query.filter(SecurityEventModel.src_ip.ilike(f"%{src_ip}%"))
            
            if severity:
                query = query.filter(SecurityEventModel.severity == severity)
            
            if log_source:
                query = query.filter(SecurityEventModel.log_source == log_source)
            
            if search:
                search_filter = or_(
                    SecurityEventModel.raw_message.ilike(f"%{search}%"),
                    SecurityEventModel.user.ilike(f"%{search}%"),
                    SecurityEventModel.src_ip.ilike(f"%{search}%"),
                    SecurityEventModel.process.ilike(f"%{search}%")
                )
                query = query.filter(search_filter)
            
            if since_minutes:
                since_time = datetime.now() - timedelta(minutes=since_minutes)
                query = query.filter(SecurityEventModel.event_time >= since_time)
            
            if from_time:
                try:
                    from_dt = datetime.fromisoformat(from_time.replace('Z', '+00:00'))
                    query = query.filter(SecurityEventModel.event_time >= from_dt)
                except ValueError:
                    pass
            
            if to_time:
                try:
                    to_dt = datetime.fromisoformat(to_time.replace('Z', '+00:00'))
                    query = query.filter(SecurityEventModel.event_time <= to_dt)
                except ValueError:
                    pass
            
            total_count = query.count()
            
            results = query.order_by(SecurityEventModel.event_time.desc())\
                          .limit(limit).offset(offset).all()
            
            events = []
            for row in results:
                events.append(SecurityEvent(
                    id=row.id,
                    created_at=row.created_at,
                    event_time=row.event_time,
                    host=row.host,
                    process=row.process,
                    pid=row.pid,
                    event_type=row.event_type,
                    user=row.user,
                    src_ip=row.src_ip,
                    dst_ip=row.dst_ip,
                    severity=row.severity,
                    log_source=row.log_source,
                    raw_message=row.raw_message,
                    os_name=row.platform
                ))
            
            return events, total_count
        finally:
            session.close()
    
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
        """Query alerts with filters and pagination."""
        session = self._get_session()
        try:
            query = session.query(AlertModel)
            
            if alert_type:
                query = query.filter(AlertModel.alert_type == alert_type)
            
            if severity:
                query = query.filter(AlertModel.severity == severity)
            
            if status:
                query = query.filter(AlertModel.status == status)
            
            if since_minutes:
                since_time = datetime.now() - timedelta(minutes=since_minutes)
                query = query.filter(AlertModel.created_at >= since_time)
            
            if from_time:
                try:
                    from_dt = datetime.fromisoformat(from_time.replace('Z', '+00:00'))
                    query = query.filter(AlertModel.created_at >= from_dt)
                except ValueError:
                    pass
            
            if to_time:
                try:
                    to_dt = datetime.fromisoformat(to_time.replace('Z', '+00:00'))
                    query = query.filter(AlertModel.created_at <= to_dt)
                except ValueError:
                    pass
            
            total_count = query.count()
            
            results = query.order_by(AlertModel.created_at.desc())\
                          .limit(limit).offset(offset).all()
            
            alerts = []
            for row in results:
                alerts.append(Alert(
                    id=row.id,
                    created_at=row.created_at,
                    alert_type=row.alert_type,
                    description=row.description,
                    severity=row.severity,
                    related_event_ids=row.related_event_ids,
                    status=row.status
                ))
            
            return alerts, total_count
        finally:
            session.close()
    
    def update_alert_status(self, alert_id: int, status: str) -> bool:
        """Update alert status."""
        session = self._get_session()
        try:
            alert = session.query(AlertModel).filter(AlertModel.id == alert_id).first()
            if alert:
                alert.status = status
                session.commit()
                return True
            return False
        except Exception as e:
            session.rollback()
            logger.error(f"Error updating alert status: {e}")
            return False
        finally:
            session.close()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive database statistics."""
        session = self._get_session()
        try:
            total_events = session.query(func.count(SecurityEventModel.id)).scalar() or 0
            
            events_by_type = {}
            for row in session.query(
                SecurityEventModel.event_type, 
                func.count(SecurityEventModel.id)
            ).group_by(SecurityEventModel.event_type).all():
                if row[0]:
                    events_by_type[row[0]] = row[1]
            
            events_by_os = {}
            for row in session.query(
                SecurityEventModel.platform, 
                func.count(SecurityEventModel.id)
            ).group_by(SecurityEventModel.platform).all():
                if row[0]:
                    events_by_os[row[0]] = row[1]
            
            events_by_severity = {}
            for row in session.query(
                SecurityEventModel.severity, 
                func.count(SecurityEventModel.id)
            ).group_by(SecurityEventModel.severity).all():
                if row[0]:
                    events_by_severity[row[0]] = row[1]
            
            total_alerts = session.query(func.count(AlertModel.id)).scalar() or 0
            
            alerts_by_severity = {}
            for row in session.query(
                AlertModel.severity, 
                func.count(AlertModel.id)
            ).group_by(AlertModel.severity).all():
                if row[0]:
                    alerts_by_severity[row[0]] = row[1]
            
            alerts_by_status = {}
            for row in session.query(
                AlertModel.status, 
                func.count(AlertModel.id)
            ).group_by(AlertModel.status).all():
                if row[0]:
                    alerts_by_status[row[0]] = row[1]
            
            top_ips = []
            for row in session.query(
                SecurityEventModel.src_ip, 
                func.count(SecurityEventModel.id).label('count')
            ).filter(
                SecurityEventModel.src_ip.isnot(None),
                SecurityEventModel.src_ip != ''
            ).group_by(SecurityEventModel.src_ip)\
             .order_by(func.count(SecurityEventModel.id).desc())\
             .limit(10).all():
                top_ips.append({'ip': row[0], 'count': row[1]})
            
            top_users = []
            for row in session.query(
                SecurityEventModel.user, 
                func.count(SecurityEventModel.id).label('count')
            ).filter(
                SecurityEventModel.user.isnot(None),
                SecurityEventModel.user != ''
            ).group_by(SecurityEventModel.user)\
             .order_by(func.count(SecurityEventModel.id).desc())\
             .limit(10).all():
                top_users.append({'user': row[0], 'count': row[1]})
            
            hourly_events = []
            cutoff = datetime.now() - timedelta(hours=24)
            for row in session.query(
                func.strftime('%Y-%m-%d %H:00:00', SecurityEventModel.event_time).label('hour'),
                func.count(SecurityEventModel.id).label('count')
            ).filter(SecurityEventModel.event_time >= cutoff)\
             .group_by('hour')\
             .order_by('hour').all():
                hourly_events.append({'hour': row[0], 'count': row[1]})
            
            auth_types = ['AUTH_FAILURE', 'AUTH_SUCCESS', 'FAILED_LOGIN', 'SUCCESS_LOGIN']
            auth_stats = {}
            for row in session.query(
                SecurityEventModel.event_type, 
                func.count(SecurityEventModel.id)
            ).filter(SecurityEventModel.event_type.in_(auth_types))\
             .group_by(SecurityEventModel.event_type).all():
                auth_stats[row[0]] = row[1]
            
            failed_logins = auth_stats.get('AUTH_FAILURE', 0) + auth_stats.get('FAILED_LOGIN', 0)
            successful_logins = auth_stats.get('AUTH_SUCCESS', 0) + auth_stats.get('SUCCESS_LOGIN', 0)
            
            unique_ips = session.query(func.count(func.distinct(SecurityEventModel.src_ip)))\
                               .filter(SecurityEventModel.src_ip.isnot(None)).scalar() or 0
            
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
        finally:
            session.close()
    
    def get_recent_events_for_analysis(self, minutes: int = 15, limit: int = 1000) -> List[SecurityEvent]:
        """Get recent events for rule analysis."""
        events, _ = self.query_events(limit=limit, since_minutes=minutes)
        return events
    
    def close(self):
        """Close database connections (no-op for SQLAlchemy with session management)."""
        pass
