"""Linux event source using file monitoring."""

import os
import time
import threading
from typing import Callable
from .base import EventSource
from ..parsing.linux_parser import LinuxParser


class LinuxEventSource(EventSource):
    """Monitor Linux auth.log for security events."""
    
    def __init__(self, callback: Callable, log_path: str = "/var/log/auth.log"):
        super().__init__(callback)
        self.log_path = log_path
        self.thread = None
        self.parser = LinuxParser()
    
    def start(self):
        """Start monitoring in a background thread."""
        if self.running:
            self.logger.warning("Linux source already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self.run_loop, daemon=True)
        self.thread.start()
        self.logger.info(f"Linux event source started, monitoring {self.log_path}")
    
    def stop(self):
        """Stop monitoring."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        self.logger.info("Linux event source stopped")
    
    def run_loop(self):
        """Monitor log file for new entries."""
        
        # Check if log file exists and is readable
        if not os.path.exists(self.log_path):
            self.logger.error(f"Log file not found: {self.log_path}")
            self.logger.error("Please run as root or adjust log file path")
            return
        
        try:
            # Open file and seek to end
            with open(self.log_path, 'r') as f:
                # Move to end of file
                f.seek(0, 2)
                
                while self.running:
                    line = f.readline()
                    
                    if line:
                        # Parse line
                        event = self.parser.parse_line(line)
                        if event:
                            self.callback(event)
                    else:
                        # No new data, sleep briefly
                        time.sleep(0.5)
        
        except PermissionError:
            self.logger.error(f"Permission denied reading {self.log_path}")
            self.logger.error("Please run as root or adjust permissions")
        except Exception as e:
            self.logger.error(f"Error in Linux event source: {e}")
