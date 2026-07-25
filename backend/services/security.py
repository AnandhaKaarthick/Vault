import hashlib
import hmac
from typing import Optional

_SALT = b"docvault_secure_salt_2026_v1"

def _hash_pin(pin: str) -> str:
    """Computes PBKDF2-HMAC-SHA256 hash with 100,000 iterations matching OWASP standards."""
    return hashlib.pbkdf2_hmac('sha256', pin.encode('utf-8'), _SALT, 100000).hex()

# Default initial PIN for testing: '1234'
_stored_pin_hash = _hash_pin("1234")

SENSITIVE_CATEGORIES = [
    "Identity & Official",
    "Identity",
    "Tax",
    "Financial & Bank",
    "Financial"
]

class SecurityService:
    """
    Manages Security PIN verification using PBKDF2-HMAC-SHA256 (100k iterations).
    Protects Identity & Financial documents against unauthorized viewing or downloading.
    """

    @staticmethod
    def verify_pin(pin_provided: Optional[str]) -> bool:
        """Verifies provided 4-digit PIN against stored PBKDF2 PIN hash in constant time."""
        if not pin_provided:
            return False
        clean_pin = pin_provided.strip()
        computed = _hash_pin(clean_pin)
        return hmac.compare_digest(computed, _stored_pin_hash)

    @staticmethod
    def is_sensitive(category: str) -> bool:
        """Checks if a document category requires step-up PIN authentication."""
        if not category:
            return False
        return any(c.lower() in category.lower() for c in ["identity", "tax", "financial"])

    @staticmethod
    def set_pin(new_pin: str) -> bool:
        """Updates stored security PIN."""
        global _stored_pin_hash
        if len(new_pin.strip()) >= 4 and new_pin.strip().isdigit():
            _stored_pin_hash = _hash_pin(new_pin.strip())
            return True
        return False
