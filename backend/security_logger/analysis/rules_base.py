"""Base class for detection rules."""

from abc import ABC, abstractmethod
from typing import List
from ..events import SecurityEvent, Alert


class Rule(ABC):
    """Abstract base class for security detection rules."""
    
    def __init__(self, enabled: bool = True):
        self.enabled = enabled
    
    @abstractmethod
    def evaluate(self, events: List[SecurityEvent]) -> List[Alert]:
        """
        Evaluate events and return any generated alerts.
        
        Args:
            events: List of recent security events
            
        Returns:
            List of alerts (may be empty)
        """
        pass
    
    @property
    @abstractmethod
    def rule_name(self) -> str:
        """Return the rule name."""
        pass
