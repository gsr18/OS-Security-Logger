#!/usr/bin/env python3
"""Entry point for running the security logger with API server."""

import sys
import threading
from security_logger.main import SecurityLogger
from security_logger.api import run_api_server
from security_logger.config import load_config
from security_logger.logging_utils import setup_logging

def main():
    """Main entry point."""
    
    # Load config
    config = load_config("config.yaml")
    
    # Setup logging
    setup_logging(config.get('logging.level', 'INFO'))
    
    # Create main security logger instance
    security_logger = SecurityLogger("config.yaml")
    
    # Start the security logger in the main thread
    security_logger.start()
    
    # Start API server in a separate thread
    api_host = config.get('api.host', '0.0.0.0')
    api_port = config.get('api.port', 5000)
    api_debug = config.get('api.debug', False)
    
    api_thread = threading.Thread(
        target=run_api_server,
        args=(security_logger.database, api_host, api_port, api_debug),
        daemon=True
    )
    api_thread.start()
    
    # Run forever (until Ctrl+C)
    try:
        security_logger.run_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        security_logger.stop()
        sys.exit(0)

if __name__ == '__main__':
    main()
