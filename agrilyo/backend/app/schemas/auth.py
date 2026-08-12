"""
Schémas Pydantic v2 — Authentification AGRILYO.
Validation de toutes les données entrantes et sortantes de l'API auth.
"""

import re
from datetime import datetime
from typing import List
from uuid import UUID
from app.utils.phone import normalize_ci_phone
from pydantic import BaseModel, ConfigDict, field_validator, model_validator, Field


# ── Validators réutilisables ───────────────────────────────────────────────────


def validate_ci_phone(v: str) -> str:
    """Valide un numéro de téléphone ivoirien au format E.164 (+225XXXXXXXXXX)."""
    try:
        return normalize_ci_phone(v)
    except ValueError as exc:
        raise ValueError(str(exc)) from exc


# ═══════════════════════════════════════════════════════════════════════════════
# Requêtes (inputs)
# ═══════════════════════════════════════════════════════════════════════════════

class SendOTPRequest(BaseModel):
    """Demande d'envoi d'un OTP par SMS."""
    phone_number: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return validate_ci_phone(v)


class VerifyOTPRequest(BaseModel):
    """Vérification d'un OTP reçu par SMS."""
    phone_number: str
    code: str
    # Données optionnelles pour compléter le profil à la première connexion
    first_name: str | None = None
    last_name: str | None = None
    region: str | None = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return validate_ci_phone(v)

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        v = v.strip()
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Le code OTP doit être composé de 6 chiffres")
        return v


class RefreshTokenRequest(BaseModel):
    """Renouvellement du access token via refresh token."""
    refresh_token: str


class SetPasswordRequest(BaseModel):
    """Définition du mot de passe — appelé une fois, juste après la 1ère vérification OTP."""
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Le mot de passe doit contenir au moins 6 caractères.")
        return v


class PasswordLoginRequest(BaseModel):
    """Connexion par numéro + mot de passe (utilisée après la 1ère création de mot de passe)."""
    phone_number: str
    password: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return validate_ci_phone(v)


# Rôles sélectionnables par l'utilisateur lui-même à l'inscription — ADMIN est
# volontairement exclu, il ne peut être attribué que manuellement en base.
SELECTABLE_ROLES = {"AGRICULTEUR", "BAILLEUR", "SEMENCIER", "AGRONOME"}


class CompleteProfileRequest(BaseModel):
    """
    Complète le profil d'un nouvel utilisateur juste après la 1ère vérification OTP :
    choix du/des rôle(s) + identité de base. Appelée une seule fois (endpoint protégé).
    """
    roles: List[str] = Field(min_length=1)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    region: str = Field(min_length=1, max_length=100)

    @field_validator("roles")
    @classmethod
    def validate_roles(cls, v: List[str]) -> List[str]:
        invalid = set(v) - SELECTABLE_ROLES
        if invalid:
            raise ValueError(
                f"Rôle(s) invalide(s) : {', '.join(sorted(invalid))}. "
                f"Autorisés : {', '.join(sorted(SELECTABLE_ROLES))}."
            )
        # Dédoublonne en conservant l'ordre de sélection de l'utilisateur
        return list(dict.fromkeys(v))


class UpdateProfileRequest(BaseModel):
    """Mise à jour partielle du profil — tous les champs sont optionnels (PATCH)."""
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    display_name: str | None = Field(default=None, max_length=200)
    region: str | None = Field(default=None, max_length=100)
    language: str | None = Field(default=None, max_length=5)
    bio: str | None = Field(default=None, max_length=2000)


# ═══════════════════════════════════════════════════════════════════════════════
# Réponses (outputs)
# ═══════════════════════════════════════════════════════════════════════════════

class SendOTPResponse(BaseModel):
    """Confirmation d'envoi de l'OTP."""
    success: bool
    message: str
    # En dev uniquement : expose le code pour faciliter les tests
    debug_code: str | None = None


class UserPublicSchema(BaseModel):
    """Profil utilisateur retourné dans les réponses API."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone_number: str
    email: str | None
    first_name: str | None
    last_name: str | None
    display_name: str | None
    avatar_url: str | None
    region: str | None
    bio: str | None
    roles: List[str]
    status: str
    phone_verified: bool
    language: str
    created_at: datetime


class TokenPairSchema(BaseModel):
    """Paire de tokens retournée après authentification réussie."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # secondes


class AuthResponse(BaseModel):
    """Réponse complète après vérification OTP ou connexion par mot de passe réussie."""
    tokens: TokenPairSchema
    user: UserPublicSchema
    is_new_user: bool  # True si premier login — le front affiche l'onboarding
    requires_password_setup: bool = False  # True → le front doit rediriger vers l'écran de création de mot de passe
    requires_role_setup: bool = False  # True → le front doit rediriger vers l'écran de choix de rôle(s)


class SetPasswordResponse(BaseModel):
    """Confirmation de création du mot de passe."""
    success: bool
    message: str