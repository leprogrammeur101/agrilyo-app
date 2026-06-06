"""
Modèle OTPCode — Codes de vérification par SMS.
Un seul OTP actif par utilisateur à la fois.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OTPPurpose(str, PyEnum):
    REGISTRATION = "REGISTRATION"   # Première inscription
    LOGIN = "LOGIN"                 # Connexion
    PHONE_CHANGE = "PHONE_CHANGE"   # Changement de numéro
    DOCUMENT_SIGN = "DOCUMENT_SIGN" # Signature de contrat foncier


class OTPCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Le code est haché en base (sécurité)
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    purpose: Mapped[OTPPurpose] = mapped_column(
        Enum(OTPPurpose, name="otp_purpose_enum"),
        nullable=False,
        default=OTPPurpose.LOGIN,
    )

    # Expiration et tentatives
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # ── Relation ──────────────────────────────────────────────────────────────
    user = relationship("User", back_populates="otp_codes")

    # ── Helpers ───────────────────────────────────────────────────────────────
    @property
    def is_expired(self) -> bool:
        from datetime import timezone
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)

    @property
    def is_valid(self) -> bool:
        from app.core.config import settings
        return (
            not self.is_used
            and not self.is_expired
            and self.attempts < settings.OTP_MAX_ATTEMPTS
        )