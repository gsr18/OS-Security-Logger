"""Flask API for web dashboard with full REST endpoints."""

import logging
import os
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from datetime import datetime
from .storage.db import Database
from .auth import (
    auth_required, verify_password, create_access_token, decode_token,
    get_user_by_email, get_user_by_id, create_user, ensure_admin_exists,
    hash_password
)
from .database import SessionLocal
from .models import UserModel

logger = logging.getLogger("security_logger.api")


def create_app(database: Database, config: dict = None):
    """Create Flask application with all API endpoints."""
    
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    config = config or {}
    use_mock = config.get('use_mock_data', False)
    
    @app.route('/api/health', methods=['GET'])
    def health():
        """Health check endpoint."""
        try:
            stats = database.get_stats()
            db_status = "connected"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            db_status = "error"
        
        return jsonify({
            'status': 'ok',
            'backend': 'flask',
            'db': db_status,
            'mode': 'mock' if use_mock else 'real',
            'timestamp': datetime.now().isoformat()
        })
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        """Authenticate user and return JWT token."""
        try:
            data = request.get_json()
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            
            if not email or not password:
                return jsonify({'error': 'Email and password are required'}), 400
            
            db = SessionLocal()
            try:
                user = get_user_by_email(db, email)
                if not user or not verify_password(password, user.password_hash):
                    return jsonify({'error': 'Invalid email or password'}), 401
                
                token = create_access_token(user)
                return jsonify({
                    'accessToken': token,
                    'user': user.to_dict()
                })
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Login error: {e}")
            return jsonify({'error': 'Login failed'}), 500
    
    @app.route('/api/auth/me', methods=['GET'])
    @auth_required()
    def get_me():
        """Get current authenticated user."""
        try:
            user_id = int(g.user.get('sub'))
            db = SessionLocal()
            try:
                user = get_user_by_id(db, user_id)
                if not user:
                    return jsonify({'error': 'User not found'}), 404
                return jsonify(user.to_dict())
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Get user error: {e}")
            return jsonify({'error': 'Failed to get user'}), 500
    
    @app.route('/api/auth/register', methods=['POST'])
    @auth_required(allowed_roles=['admin'])
    def register():
        """Register a new user (admin only)."""
        try:
            data = request.get_json()
            email = data.get('email', '').strip().lower()
            password = data.get('password', '')
            full_name = data.get('fullName', '').strip()
            role = data.get('role', 'viewer')
            
            if not email or not password:
                return jsonify({'error': 'Email and password are required'}), 400
            
            if role not in ('admin', 'viewer'):
                return jsonify({'error': 'Invalid role'}), 400
            
            db = SessionLocal()
            try:
                existing = get_user_by_email(db, email)
                if existing:
                    return jsonify({'error': 'Email already registered'}), 409
                
                user = create_user(db, email, password, full_name, role)
                return jsonify({'success': True, 'user': user.to_dict()}), 201
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Register error: {e}")
            return jsonify({'error': 'Registration failed'}), 500
    
    @app.route('/api/events', methods=['GET'])
    @auth_required()
    def get_events():
        """Get security events with filters and pagination."""
        try:
            page = int(request.args.get('page', 1))
            page_size = int(request.args.get('pageSize', 50))
            limit = int(request.args.get('limit', page_size))
            offset = (page - 1) * page_size
            
            event_type = request.args.get('type') or request.args.get('eventType')
            os_name = request.args.get('os')
            user = request.args.get('user')
            src_ip = request.args.get('srcIp') or request.args.get('src_ip')
            severity = request.args.get('severity')
            log_source = request.args.get('log_source') or request.args.get('logSource')
            search = request.args.get('search')
            since_minutes = request.args.get('since_minutes')
            from_time = request.args.get('from')
            to_time = request.args.get('to')
            
            if since_minutes:
                since_minutes = int(since_minutes)
            
            events, total = database.query_events(
                limit=limit,
                offset=offset,
                event_type=event_type,
                os_name=os_name,
                user=user,
                src_ip=src_ip,
                severity=severity,
                log_source=log_source,
                search=search,
                since_minutes=since_minutes,
                from_time=from_time,
                to_time=to_time
            )
            
            events_data = [event.to_dict() for event in events]
            
            return jsonify({
                'events': events_data,
                'total': total,
                'count': len(events_data),
                'page': page,
                'pageSize': page_size,
                'totalPages': (total + page_size - 1) // page_size if page_size > 0 else 0
            })
        
        except Exception as e:
            logger.error(f"Error in get_events: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/events', methods=['POST'])
    @auth_required(allowed_roles=['admin'])
    def create_event():
        """Create a new event (admin only)."""
        try:
            from .events import SecurityEvent
            from .mock_generator import generate_mock_event
            
            event = generate_mock_event()
            event_id = database.insert_event(event)
            event.id = event_id
            
            return jsonify({
                'success': True,
                'event': event.to_dict()
            })
        except Exception as e:
            logger.error(f"Error creating event: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/alerts', methods=['GET'])
    @auth_required()
    def get_alerts():
        """Get alerts with filters and pagination."""
        try:
            page = int(request.args.get('page', 1))
            page_size = int(request.args.get('pageSize', 50))
            limit = int(request.args.get('limit', page_size))
            offset = (page - 1) * page_size
            
            alert_type = request.args.get('type') or request.args.get('alertType')
            severity = request.args.get('severity')
            status = request.args.get('status')
            since_minutes = request.args.get('since_minutes')
            from_time = request.args.get('from')
            to_time = request.args.get('to')
            
            if since_minutes:
                since_minutes = int(since_minutes)
            
            alerts, total = database.query_alerts(
                limit=limit,
                offset=offset,
                alert_type=alert_type,
                severity=severity,
                status=status,
                since_minutes=since_minutes,
                from_time=from_time,
                to_time=to_time
            )
            
            alerts_data = [alert.to_dict() for alert in alerts]
            
            return jsonify({
                'alerts': alerts_data,
                'total': total,
                'count': len(alerts_data),
                'page': page,
                'pageSize': page_size,
                'totalPages': (total + page_size - 1) // page_size if page_size > 0 else 0
            })
        
        except Exception as e:
            logger.error(f"Error in get_alerts: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/alerts/<int:alert_id>', methods=['PATCH'])
    @auth_required(allowed_roles=['admin'])
    def update_alert(alert_id: int):
        """Update alert status (admin only)."""
        try:
            data = request.get_json()
            status = data.get('status')
            
            if status not in ('active', 'acknowledged', 'resolved', 'dismissed'):
                return jsonify({'error': 'Invalid status'}), 400
            
            success = database.update_alert_status(alert_id, status)
            
            if success:
                return jsonify({'success': True, 'id': alert_id, 'status': status})
            else:
                return jsonify({'error': 'Alert not found'}), 404
        
        except Exception as e:
            logger.error(f"Error updating alert: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/stats', methods=['GET'])
    @auth_required()
    def get_stats():
        """Get comprehensive statistics."""
        try:
            stats = database.get_stats()
            return jsonify(stats)
        
        except Exception as e:
            logger.error(f"Error in get_stats: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/log-sources', methods=['GET'])
    @auth_required()
    def get_log_sources():
        """Get available log sources being monitored."""
        try:
            from .log_reader import get_available_log_files
            available = get_available_log_files()
            return jsonify({
                'sources': [
                    {'path': path, 'type': source_type}
                    for path, source_type in available.items()
                ]
            })
        except Exception as e:
            logger.error(f"Error getting log sources: {e}")
            return jsonify({'sources': []})
    
    @app.route('/api/rules', methods=['GET'])
    @auth_required()
    def get_rules():
        """Get detection rules status."""
        try:
            return jsonify({
                'rules': [
                    {'name': 'Brute Force Detection', 'enabled': True, 'type': 'BruteForceRule'},
                    {'name': 'Suspicious Sudo Detection', 'enabled': True, 'type': 'SuspiciousSudoRule'},
                    {'name': 'Firewall Attack Detection', 'enabled': True, 'type': 'FirewallAttackRule'},
                    {'name': 'Port Scan Detection', 'enabled': True, 'type': 'PortScanRule'},
                    {'name': 'System Instability Detection', 'enabled': True, 'type': 'SystemInstabilityRule'},
                    {'name': 'Service Failure Detection', 'enabled': True, 'type': 'ServiceFailureRule'},
                    {'name': 'Privilege Escalation Detection', 'enabled': True, 'type': 'PrivilegeEscalationRule'},
                    {'name': 'Rapid Login Detection', 'enabled': True, 'type': 'RapidLoginRule'},
                ]
            })
        except Exception as e:
            logger.error(f"Error getting rules: {e}")
            return jsonify({'rules': []})
    
    return app


def run_api_server(database: Database, host: str = '0.0.0.0', port: int = 5000, 
                   debug: bool = False, config: dict = None):
    """Run the Flask API server."""
    app = create_app(database, config)
    logger.info(f"Starting API server on {host}:{port}")
    app.run(host=host, port=port, debug=debug, threaded=True)