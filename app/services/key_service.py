import secrets
import hashlib
from typing import Tuple

def generate_api_key() -> Tuple[str, str, str]:
    raw = "sk_" + secrets.token_urlsafe(32)
    prefix = raw[:8]
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return raw, prefix, hashed

def hash_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()