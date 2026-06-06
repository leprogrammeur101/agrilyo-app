"""
Configuration centralisée AGRILYO — Pydantic Settings v2
Toutes les variables d'environnement sont typées et validées au démarrage.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, field_validator
from typing import List
import secrets


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────────────────────────
    APP_NAME: str = "AGRILYO API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = True
    SECRET_KEY: str = secrets.token_urlsafe(32)

    # ── Base de données PostgreSQL ─────────────────────────────────────────────
    DATABASE_URL: str  # postgresql+asyncpg://user:pass@host:5432/db

    # ── Sécurité JWT ──────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = secrets.token_urlsafe(64)
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── OTP ───────────────────────────────────────────────────────────────────
    OTP_EXPIRE_MINUTES: int = 10
    OTP_LENGTH: int = 6
    OTP_MAX_ATTEMPTS: int = 3
    # En développement : OTP fixe pour éviter de consommer du crédit SMS
    OTP_DEV_BYPASS: bool = True
    OTP_DEV_CODE: str = "123456"

    # ── Africa's Talking (SMS / OTP / USSD) ───────────────────────────────────
    AT_USERNAME: str = "sandbox"
    AT_API_KEY: str = ""
    AT_SENDER_ID: str = "AGRILYO"
    AT_USSD_CODE: str = "*713#"

    # ── CinetPay (paiement mobile money) ──────────────────────────────────────
    CINETPAY_API_KEY: str = ""
    CINETPAY_SITE_ID: str = ""
    CINETPAY_BASE_URL: str = "https://api-checkout.cinetpay.com/v2"
    CINETPAY_NOTIFY_URL: str = ""  # webhook callback

    # ── Firebase FCM (notifications push) ────────────────────────────────────
    FIREBASE_CREDENTIALS_PATH: str = "firebase-credentials.json"

    # ── Cloudflare R2 / AWS S3 (stockage fichiers) ────────────────────────────
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "agrilyo-files"
    R2_ENDPOINT_URL: str = ""  # https://<account>.r2.cloudflarestorage.com
    R2_PUBLIC_URL: str = ""    # URL publique CDN

    # ── Redis (cache + Celery) ────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # ── CORS ──────────────────────────────────────────────────────────────────
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:8081",   # Expo dev
        "http://localhost:3000",   # Web local
        "exp://localhost:8081",    # Expo Go
    ]

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_OTP_PER_HOUR: int = 5       # max OTP par téléphone/heure
    RATE_LIMIT_API_PER_MINUTE: int = 60    # max requêtes par IP/minute

    # ── Pagination ────────────────────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # ── Fichiers ──────────────────────────────────────────────────────────────
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    ALLOWED_DOC_TYPES: List[str] = ["application/pdf"]

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        if v not in {"development", "staging", "production"}:
            raise ValueError("ENVIRONMENT doit être development, staging ou production")
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def database_url_sync(self) -> str:
        """URL synchrone pour Alembic (psycopg2)."""
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")


# Instance globale — importée partout dans l'app
settings = Settings()