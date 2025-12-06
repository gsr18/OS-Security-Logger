"""macOS event source using unified logging."""

import subprocess
import threading
from typing import Callable
from .base import EventSource
from ..parsing.macos_parser import MacOSParser


class MacOSEventSource(EventSource):
    """Monitor macOS unified log for security events."""
    
    def __init__(self, callback: Callable):
        super().__init__(callback)
        self.thread = None
        self.process = None
        self.parser = MacOSParser()
    
    def start(self):
        """Start monitoring in a background thread."""
        if self.running:
            self.logger.warning("macOS source already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self.run_loop, daemon=True)
        self.thread.start()
        self.logger.info("macOS event source started")
    
    def stop(self):
        """Stop monitoring."""
        self.running = False
        if self.process:
            self.process.terminate()
        if self.thread:
            self.thread.join(timeout=2)
        self.logger.info("macOS event source stopped")
    
    def run_loop(self):
        """Monitor macOS log stream."""
        
        try:
            # Use log stream to follow security-related logs
            cmd = [
                'log', 'stream',
                '--predicate', 'process == "sudo" OR process == "login" OR process == "authd"',
                '--style', 'syslog'
            ]
            
            self.process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1
            )
            
            for line in self.process.stdout:
                if not self.running:
                    break
                
                event = self.parser.parse_line(line)
                if event:
                    self.callback(event)
        
        except FileNotFoundError:
            self.logger.error("'log' command not found. Are you on macOS?")
        except PermissionError:
            self.logger.error("Permission denied. You may need to run with elevated privileges")
        except Exception as e:
            self.logger.error(f"Error in macOS event source: {e}")
