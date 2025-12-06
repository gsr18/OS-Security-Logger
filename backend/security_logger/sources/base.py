"""Base class for OS-specific event sources."""

from abc import ABC, abstractmethod
from typing import Callable, Optional
import logging

logger = logging.getLogger("security_logger.sources")


class EventSource(ABC):
    """Abstract base class for event sources."""
    
    def __init__(self, callback: Callable):
        """
        Initialize event source.
        
        Args:
            callback: Function to call with each detected SecurityEvent
        """
        self.callback = callback
        self.running = False
        self.logger = logger
    
    @abstractmethod
    def start(self):
        """Start monitoring for events."""
        pass
    
    @abstractmethod
    def stop(self):
        """Stop monitoring."""
        pass
    
    @abstractmethod
    def run_loop(self):
        """Main event loop (can be called in a thread)."""
        pass
