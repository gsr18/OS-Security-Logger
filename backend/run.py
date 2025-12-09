#!/usr/bin/env python3
"""Entry point for running the security logger with API server."""

import sys
import os
import threading
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from security_logger.main import SecurityLogger
from security_logger.api import run_api_server
from security_logger.config import load_config
from security_logger.logging_utils import setup_logging


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Real-Time OS Security Event Logger')
    parser.add_argument('--config', '-c', default='config.yaml', help='Path to config file')
    parser.add_argument('--mock', '-m', action='store_true', help='Enable mock data mode')
    parser.add_argument('--host', default=None, help='API server host')
    parser.add_argument('--port', '-p', type=int, default=None, help='API server port')
    parser.add_argument('--debug', '-d', action='store_true', help='Enable debug mode')
    args = parser.parse_args()
    
    config = load_config(args.config)
    
    if args.mock:
        config.data['use_mock_data'] = True
    
    setup_logging(config.get('logging.level', 'INFO'))
    
    security_logger = SecurityLogger(args.config)
    
    if args.mock:
        security_logger.use_mock_data = True
    
    security_logger.start()
    
    api_host = args.host or config.get('api.host', '0.0.0.0')
    api_port = args.port or config.get('api.port', 5000)
    api_debug = args.debug or config.get('api.debug', False)
    
    api_thread = threading.Thread(
        target=run_api_server,
        args=(security_logger.database, api_host, api_port, api_debug, config.data),
        daemon=True
    )
    api_thread.start()
    
    print(f"\n{'='*60}")
    print(f"Security Logger API running at http://{api_host}:{api_port}")
    print(f"Mode: {'MOCK DATA' if security_logger.use_mock_data else 'REAL OS LOGS'}")
    print(f"{'='*60}\n")
    
    try:
        security_logger.run_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        security_logger.stop()
        sys.exit(0)


if __name__ == '__main__':
    main()
