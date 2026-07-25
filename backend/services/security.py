import hashlib
from typing import Optional

# Default initial PIN for testing: '1234'
_stored_pin_hash = hashlib.sha256("1234".encode('utf-8')).hexdigest()

SENSITIVE_CATEGORIES = ["Identity", "Tax", "Financial"]

class SecurityService:
    """
    Manages Security PIN verification for sensitive documents.
    Protects Identity & Financial documents against unauthorized viewing or downloading.
    """

    @staticmethod
    def verify_pin(pin_provided: Optional[str]) -> bool:
        """Verifies provided 4-digit PIN against stored SHA-256 PIN hash."""
        if not pin_provided:
            return False
        clean_pin = pin_provided.strip()
        computed = hashlib.sha256(clean_pin.encode('utf-8')).hexdigest()
        return computed == _stored_pin_hash

    @staticmethod
    def is_sensitive(category: str) -> bool:
        """Checks if a document category requires step-up PIN authentication."""
        return category in SENSITIVE_CATEGORIES

    @staticmethod
    def set_pin(new_pin: str) -> bool:
        """Updates stored security PIN."""
        global _stored_pin_hash
        if len(new_pin.strip()) >= 4 and new_pin.strip().isdigit():
            _stored_pin_hash = hashlib.sha256(new_pin.strip().encode('utf-8')).hexdigest()
            return True
        return False
