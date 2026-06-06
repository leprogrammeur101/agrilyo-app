"""
Sécurité AGRILYO — JWT, OTP, hachage
"""

import base64
import hashlib
import hmac
import os
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.core.config import settings


# ═══════════════════════════════════════════════════════════════════════════════
# JWT
# ═══════════════════════════════════════════════════════════════════════════════

def create_access_token(subject: str | Any) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "access",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str | Any) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


def verify_token(token: str, token_type: str = "access") -> str | None:
    try:
        payload = decode_token(token)
        if payload.get("type") != token_type:
            return None
        return payload.get("sub")
    except JWTError:
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# OTP
# ═══════════════════════════════════════════════════════════════════════════════

def generate_otp() -> str:
    if settings.OTP_DEV_BYPASS and settings.is_development:
        return settings.OTP_DEV_CODE
    return "".join(random.choices(string.digits, k=settings.OTP_LENGTH))


def get_otp_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)


# ═══════════════════════════════════════════════════════════════════════════════
# Hachage — PBKDF2-HMAC-SHA256 (stdlib Python, aucune dépendance externe)
# Remplace passlib+bcrypt qui est incompatible avec bcrypt 4.x sur Python 3.13
# ═══════════════════════════════════════════════════════════════════════════════

_ITERATIONS = 260_000   # OWASP 2023 recommandation pour PBKDF2-SHA256
_SALT_SIZE  = 16        # 128 bits


def hash_value(value: str) -> str:
    """
    Hache une valeur (OTP ou refresh token) avec PBKDF2-HMAC-SHA256.
    Format stocké en base : base64(salt + hash), tout en un seul string.
    Aucune limite de taille, aucune dépendance externe.
    """
    salt = os.urandom(_SALT_SIZE)
    key  = hashlib.pbkdf2_hmac(
        "sha256",
        value.encode("utf-8"),
        salt,
        _ITERATIONS,
    )
    # On préfixe le salt pour pouvoir le récupérer lors de la vérification
    return base64.b64encode(salt + key).decode("utf-8")


def verify_hash(plain: str, stored_hash: str) -> bool:
    """
    Vérifie qu'une valeur correspond à son hash PBKDF2.
    Utilise hmac.compare_digest pour éviter les timing attacks.
    """
    try:
        decoded     = base64.b64decode(stored_hash.encode("utf-8"))
        salt        = decoded[:_SALT_SIZE]
        stored_key  = decoded[_SALT_SIZE:]
        key = hashlib.pbkdf2_hmac(
            "sha256",
            plain.encode("utf-8"),
            salt,
            _ITERATIONS,
        )
        return hmac.compare_digest(stored_key, key)
    except Exception:
        return False