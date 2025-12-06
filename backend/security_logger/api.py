"""Flask API for web dashboard."""

import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
from .storage.db import Database

logger = logging.getLogger("security_logger.api")


def create_app(database: Database):
    """Create Flask application."""
    
    app = Flask(__name__)
    CORS(app)  # Enable CORS for Next.js frontend
    
    @app.route('/api/health', methods=['GET'])
    def health():
        """Health check endpoint."""
        return jsonify({'status': 'ok', 'timestamp': datetime.now().isoformat()})
    
    @app.route('/api/events', methods=['GET'])
    def get_events():
        """Get security events with optional filters."""
        
        try:
            # Parse query parameters
            limit = int(request.args.get('limit', 100))
            event_type = request.args.get('type')
            os_name = request.args.get('os')
            since_minutes = request.args.get('since_minutes')
            
            if since_minutes:
                since_minutes = int(since_minutes)
            
            # Query database
            events = database.query_events(
                limit=limit,
                event_type=event_type,
                os_name=os_name,
                since_minutes=since_minutes
            )
            
            # Convert to dict
            events_data = [event.to_dict() for event in events]
            
            return jsonify({
                'events': events_data,
                'count': len(events_data)
            })
        
        except Exception as e:
            logger.error(f"Error in get_events: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/alerts', methods=['GET'])
    def get_alerts():
        """Get alerts with optional filters."""
        
        try:
            # Parse query parameters
            limit = int(request.args.get('limit', 100))
            severity = request.args.get('severity')
            since_minutes = request.args.get('since_minutes')
            
            if since_minutes:
                since_minutes = int(since_minutes)
            
            # Query database
            alerts = database.query_alerts(
                limit=limit,
                severity=severity,
                since_minutes=since_minutes
            )
            
            # Convert to dict
            alerts_data = [alert.to_dict() for alert in alerts]
            
            return jsonify({
                'alerts': alerts_data,
                'count': len(alerts_data)
            })
        
        except Exception as e:
            logger.error(f"Error in get_alerts: {e}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/stats', methods=['GET'])
    def get_stats():
        """Get statistics."""
        
        try:
            stats = database.get_stats()
            return jsonify(stats)
        
        except Exception as e:
            logger.error(f"Error in get_stats: {e}")
            return jsonify({'error': str(e)}), 500
    
    return app


def run_api_server(database: Database, host: str = '0.0.0.0', port: int = 5000, debug: bool = False):
    """Run the Flask API server."""
    
    app = create_app(database)
    logger.info(f"Starting API server on {host}:{port}")
    app.run(host=host, port=port, debug=debug, threaded=True)
