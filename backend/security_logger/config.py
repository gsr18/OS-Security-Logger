"""Configuration loading and management."""

import os
import yaml
from typing import Any, Dict
from pathlib import Path


DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./security_events.db")


class Config:
    """Application configuration."""
    
    def __init__(self, config_dict: Dict[str, Any]):
        self.data = config_dict
        
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value using dot notation."""
        keys = key.split('.')
        value = self.data
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k, default)
            else:
                return default
        return value


def load_config(config_path: str = "config.yaml") -> Config:
    """Load configuration from YAML file."""
    
    default_config = {
        "database": {
            "url": DATABASE_URL,
            "path": "./security_events.db"
        },
        "logging": {
            "level": "INFO"
        },
        "sources": {
            "linux": {"enabled": True, "auth_log_path": "/var/log/auth.log"},
            "windows": {"enabled": True},
            "macos": {"enabled": True}
        },
        "rules": {
            "brute_force": {
                "enabled": True,
                "max_failed_attempts": 5,
                "window_minutes": 10
            },
            "sudo_suspicious": {
                "enabled": True,
                "unusual_users": ["www-data", "nobody", "guest"]
            },
            "rapid_login": {
                "enabled": True,
                "max_attempts": 10,
                "window_minutes": 5
            }
        },
        "api": {
            "host": "0.0.0.0",
            "port": 5000,
            "debug": False
        }
    }
    
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                file_config = yaml.safe_load(f) or {}
                default_config.update(file_config)
        except Exception as e:
            print(f"Warning: Could not load config file: {e}")
    
    return Config(default_config)