"""Windows event source using Event Log API."""

import time
import threading
from typing import Callable
from .base import EventSource
from ..parsing.windows_parser import WindowsParser

# Try to import Windows-specific modules
try:
    import win32evtlog
    import win32con
    WINDOWS_AVAILABLE = True
except ImportError:
    WINDOWS_AVAILABLE = False


class WindowsEventSource(EventSource):
    """Monitor Windows Security Event Log."""
    
    def __init__(self, callback: Callable):
        super().__init__(callback)
        self.thread = None
        self.parser = WindowsParser()
        
        if not WINDOWS_AVAILABLE:
            self.logger.warning("pywin32 not available, Windows event monitoring disabled")
    
    def start(self):
        """Start monitoring in a background thread."""
        if not WINDOWS_AVAILABLE:
            self.logger.error("Cannot start Windows source: pywin32 not installed")
            return
        
        if self.running:
            self.logger.warning("Windows source already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self.run_loop, daemon=True)
        self.thread.start()
        self.logger.info("Windows event source started")
    
    def stop(self):
        """Stop monitoring."""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
        self.logger.info("Windows event source stopped")
    
    def run_loop(self):
        """Monitor Windows Security Event Log."""
        
        if not WINDOWS_AVAILABLE:
            return
        
        try:
            # Open Security log
            hand = win32evtlog.OpenEventLog(None, "Security")
            flags = win32evtlog.EVENTLOG_FORWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            
            # Move to end
            total = win32evtlog.GetNumberOfEventLogRecords(hand)
            
            while self.running:
                events = win32evtlog.ReadEventLog(hand, flags, 0)
                
                if events:
                    for event in events:
                        # Convert to dict and parse
                        event_dict = {
                            'EventID': event.EventID & 0xFFFF,
                            'TimeGenerated': event.TimeGenerated,
                        }
                        
                        # Try to extract additional data
                        if event.StringInserts:
                            if len(event.StringInserts) > 5:
                                event_dict['TargetUserName'] = event.StringInserts[5]
                            if len(event.StringInserts) > 18:
                                event_dict['IpAddress'] = event.StringInserts[18]
                        
                        parsed_event = self.parser.parse_event(event_dict)
                        if parsed_event:
                            self.callback(parsed_event)
                else:
                    time.sleep(1)
            
            win32evtlog.CloseEventLog(hand)
        
        except Exception as e:
            self.logger.error(f"Error in Windows event source: {e}")
            self.logger.error("You may need to run as Administrator")
