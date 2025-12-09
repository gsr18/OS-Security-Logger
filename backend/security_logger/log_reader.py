"""Real-time log file reader with rotation handling and multi-file support."""

import os
import time
import logging
import threading
from typing import Callable, Dict, Optional, List
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger("security_logger.log_reader")


@dataclass
class LogFileState:
    """Tracks state of a monitored log file."""
    path: str
    inode: int
    position: int
    last_read: datetime


class LogFileTailer:
    """Tails a single log file with rotation detection."""
    
    def __init__(self, file_path: str, callback: Callable[[str, str], None], log_source: str):
        self.file_path = file_path
        self.callback = callback
        self.log_source = log_source
        self.running = False
        self._file = None
        self._inode = None
        self._position = 0
    
    def _get_inode(self) -> Optional[int]:
        """Get file inode for rotation detection."""
        try:
            return os.stat(self.file_path).st_ino
        except (OSError, FileNotFoundError):
            return None
    
    def _open_file(self, seek_end: bool = True) -> bool:
        """Open the log file."""
        try:
            if self._file:
                self._file.close()
            
            self._file = open(self.file_path, 'r', encoding='utf-8', errors='replace')
            self._inode = self._get_inode()
            
            if seek_end:
                self._file.seek(0, 2)
                self._position = self._file.tell()
            else:
                self._position = 0
            
            logger.info(f"Opened log file: {self.file_path} (inode: {self._inode})")
            return True
            
        except PermissionError:
            logger.error(f"Permission denied: {self.file_path}")
            return False
        except FileNotFoundError:
            logger.warning(f"File not found: {self.file_path}")
            return False
        except Exception as e:
            logger.error(f"Error opening {self.file_path}: {e}")
            return False
    
    def _check_rotation(self) -> bool:
        """Check if log file was rotated."""
        current_inode = self._get_inode()
        
        if current_inode is None:
            return True
        
        if current_inode != self._inode:
            logger.info(f"Log rotation detected for {self.file_path}")
            return True
        
        try:
            current_size = os.path.getsize(self.file_path)
            if current_size < self._position:
                logger.info(f"Log truncation detected for {self.file_path}")
                return True
        except OSError:
            return True
        
        return False
    
    def read_new_lines(self) -> List[str]:
        """Read new lines from the file."""
        lines = []
        
        if not self._file:
            return lines
        
        try:
            if self._check_rotation():
                self._open_file(seek_end=False)
                if not self._file:
                    return lines
            
            while True:
                line = self._file.readline()
                if not line:
                    break
                
                line = line.strip()
                if line:
                    lines.append(line)
                    self._position = self._file.tell()
        
        except Exception as e:
            logger.error(f"Error reading {self.file_path}: {e}")
        
        return lines
    
    def close(self):
        """Close the file handle."""
        if self._file:
            try:
                self._file.close()
            except Exception:
                pass
            self._file = None


class MultiLogReader:
    """Monitors multiple log files concurrently."""
    
    def __init__(self, callback: Callable[[str, str], None]):
        self.callback = callback
        self.tailers: Dict[str, LogFileTailer] = {}
        self.running = False
        self._thread = None
        self._lock = threading.Lock()
        self.poll_interval = 0.5
        self.file_check_interval = 30
        self._last_file_check = 0
    
    def add_log_file(self, file_path: str, log_source: str) -> bool:
        """Add a log file to monitor."""
        if not os.path.exists(file_path):
            logger.warning(f"Log file does not exist: {file_path}")
            return False
        
        if not os.access(file_path, os.R_OK):
            logger.warning(f"Cannot read log file: {file_path}")
            return False
        
        with self._lock:
            if file_path in self.tailers:
                logger.info(f"Already monitoring: {file_path}")
                return True
            
            tailer = LogFileTailer(file_path, self.callback, log_source)
            if tailer._open_file(seek_end=True):
                self.tailers[file_path] = tailer
                logger.info(f"Added log file: {file_path} as {log_source}")
                return True
            else:
                logger.error(f"Failed to open: {file_path}")
                return False
    
    def remove_log_file(self, file_path: str):
        """Remove a log file from monitoring."""
        with self._lock:
            if file_path in self.tailers:
                self.tailers[file_path].close()
                del self.tailers[file_path]
                logger.info(f"Removed log file: {file_path}")
    
    def start(self):
        """Start the log reader thread."""
        if self.running:
            logger.warning("Log reader already running")
            return
        
        self.running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        logger.info(f"Log reader started, monitoring {len(self.tailers)} files")
    
    def stop(self):
        """Stop the log reader."""
        self.running = False
        if self._thread:
            self._thread.join(timeout=2)
        
        with self._lock:
            for tailer in self.tailers.values():
                tailer.close()
        
        logger.info("Log reader stopped")
    
    def _run_loop(self):
        """Main reading loop."""
        while self.running:
            try:
                with self._lock:
                    for file_path, tailer in list(self.tailers.items()):
                        try:
                            lines = tailer.read_new_lines()
                            for line in lines:
                                try:
                                    self.callback(line, tailer.log_source)
                                except Exception as e:
                                    logger.error(f"Callback error for {file_path}: {e}")
                        except Exception as e:
                            logger.error(f"Error reading {file_path}: {e}")
                
                time.sleep(self.poll_interval)
                
            except Exception as e:
                logger.error(f"Error in log reader loop: {e}")
                time.sleep(1)
    
    def get_status(self) -> Dict[str, dict]:
        """Get status of all monitored files."""
        status = {}
        with self._lock:
            for path, tailer in self.tailers.items():
                status[path] = {
                    'log_source': tailer.log_source,
                    'position': tailer._position,
                    'inode': tailer._inode,
                    'readable': os.access(path, os.R_OK) if os.path.exists(path) else False
                }
        return status


def get_available_log_files() -> Dict[str, str]:
    """Detect available log files on the system."""
    log_files = {}
    
    linux_logs = {
        '/var/log/auth.log': 'auth',
        '/var/log/secure': 'auth',
        '/var/log/syslog': 'syslog',
        '/var/log/messages': 'syslog',
        '/var/log/kern.log': 'kernel',
        '/var/log/ufw.log': 'firewall',
        '/var/log/firewalld': 'firewall',
        '/var/log/audit/audit.log': 'audit',
        '/var/log/fail2ban.log': 'fail2ban',
        '/var/log/apache2/access.log': 'apache_access',
        '/var/log/apache2/error.log': 'apache_error',
        '/var/log/nginx/access.log': 'nginx_access',
        '/var/log/nginx/error.log': 'nginx_error',
    }
    
    for path, source in linux_logs.items():
        if os.path.exists(path) and os.access(path, os.R_OK):
            log_files[path] = source
    
    return log_files
