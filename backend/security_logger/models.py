"""SQLAlchemy ORM models for SecurityEvent, Alert, and User."""

from sqlalchemy import Column, Integer, String, DateTime, Text, Index
from sqlalchemy.sql import func
from .database import Base


class UserModel(Base):
    """ORM model for users."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(32), nullable=False, default="viewer", index=True)

    def to_dict(self):
        """Convert to dictionary for JSON serialization (excludes password_hash)."""
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'email': self.email,
            'fullName': self.full_name,
            'role': self.role,
        }


class SecurityEventModel(Base):
    """ORM model for security events."""
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    event_time = Column(DateTime(timezone=True), index=True, nullable=False)
    
    host = Column(String(128), index=True, nullable=True)
    process = Column(String(128), index=True, nullable=True)
    pid = Column(Integer, nullable=True)
    event_type = Column(String(64), index=True, nullable=False)
    
    user = Column(String(128), index=True, nullable=True)
    src_ip = Column(String(64), index=True, nullable=True)
    dst_ip = Column(String(64), index=True, nullable=True)
    
    severity = Column(String(32), index=True, nullable=True, default="info")
    log_source = Column(String(64), index=True, nullable=True)
    raw_message = Column(Text, nullable=False)
    platform = Column(String(32), nullable=True, index=True, default="linux")

    __table_args__ = (
        Index('idx_security_events_composite', 'event_type', 'event_time'),
        Index('idx_security_events_user_time', 'user', 'event_time'),
        Index('idx_security_events_ip_time', 'src_ip', 'event_time'),
    )

    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'event_time': self.event_time.isoformat() if self.event_time else None,
            'timestamp': self.event_time.isoformat() if self.event_time else None,
            'host': self.host,
            'process': self.process,
            'process_name': self.process,
            'pid': self.pid,
            'event_type': self.event_type,
            'user': self.user,
            'username': self.user,
            'src_ip': self.src_ip,
            'source_ip': self.src_ip,
            'dst_ip': self.dst_ip,
            'severity': self.severity,
            'log_source': self.log_source,
            'raw_message': self.raw_message,
            'platform': self.platform,
            'os_name': self.platform,
        }


class AlertModel(Base):
    """ORM model for security alerts."""
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    alert_type = Column(String(64), index=True, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(32), index=True, nullable=False, default="medium")
    
    related_event_ids = Column(Text, nullable=True)
    status = Column(String(32), index=True, nullable=True, default="active")

    __table_args__ = (
        Index('idx_alerts_severity_status', 'severity', 'status'),
        Index('idx_alerts_type_time', 'alert_type', 'created_at'),
    )

    def to_dict(self):
        """Convert to dictionary for JSON serialization."""
        return {
            'id': self.id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'timestamp': self.created_at.isoformat() if self.created_at else None,
            'alert_type': self.alert_type,
            'description': self.description,
            'severity': self.severity,
            'related_event_ids': self.related_event_ids,
            'status': self.status,
        }