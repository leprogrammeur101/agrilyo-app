"""
Modèle Utilisateur — Entité centrale polymorphe AGRILYO.
Un compte unique peut porter plusieurs rôles (BAILLEUR, AGRICULTEUR, SEMENCIER, AGRONOME).
L'authentification est par numéro de téléphone + OTP (pas de mot de passe).
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import List

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, PyEnum):
    AGRICULTEUR = "AGRICULTEUR"
    BAILLEUR = "BAILLEUR"
    SEMENCIER = "SEMENCIER"
    AGRONOME = "AGRONOME"
    ADMIN = "ADMIN"


class UserStatus(str, PyEnum):
    PENDING = "PENDING"       # En attente de vérification OTP
    ACTIVE = "ACTIVE"         # Compte actif et vérifié
    SUSPENDED = "SUSPENDED"   # Compte suspendu par un admin
    BANNED = "BANNED"         # Compte banni définitivement


class User(Base):
    __tablename__ = "users"

    # ── Identifiant ───────────────────────────────────────────────────────────
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # ── Contact (clé d'authentification) ──────────────────────────────────────
    phone_number: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
        comment="Format E.164 : +2250700000000",
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
    )

    # ── Profil ────────────────────────────────────────────────────────────────
    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    region: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Région administrative de Côte d'Ivoire",
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Rôles (multi-rôles possibles) ─────────────────────────────────────────
    # Un utilisateur peut être à la fois BAILLEUR et AGRICULTEUR par exemple.
    # Stocké comme tableau PostgreSQL natif.
    roles: Mapped[List[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
        comment="Liste de rôles : AGRICULTEUR, BAILLEUR, SEMENCIER, AGRONOME, ADMIN",
    )

    # ── Statut ────────────────────────────────────────────────────────────────
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status_enum"),
        nullable=False,
        default=UserStatus.PENDING,
    )
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # ── Token de refresh (révocation possible) ────────────────────────────────
    refresh_token_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Mot de passe (optionnel — défini après la première vérification OTP) ──
    # NULL tant que l'utilisateur ne l'a pas encore créé (flow : OTP puis mot de passe).
    # Une fois défini, les connexions suivantes se font par numéro + mot de passe.
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # ── Langue préférée ───────────────────────────────────────────────────────
    language: Mapped[str] = mapped_column(
        String(5),
        nullable=False,
        default="fr",
        comment="Code BCP47 : fr, dioula, baoulé…",
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ── Relations (définies dans les modules respectifs) ──────────────────────
    # Les relations sont déclarées ici pour la cohérence de l'ORM.
    # Chaque module (foncier, semences, conseil) importe et référence User.
    otp_codes = relationship("OTPCode", back_populates="user", cascade="all, delete-orphan")

    # ── Propriétés helper ─────────────────────────────────────────────────────
    @property
    def full_name(self) -> str:
        parts = filter(None, [self.first_name, self.last_name])
        return " ".join(parts) or self.display_name or self.phone_number

    def has_role(self, role: UserRole) -> bool:
        return role.value in self.roles

    def add_role(self, role: UserRole) -> None:
        if role.value not in self.roles:
            self.roles = [*self.roles, role.value]

    def remove_role(self, role: UserRole) -> None:
        self.roles = [r for r in self.roles if r != role.value]