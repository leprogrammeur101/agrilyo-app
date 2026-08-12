"""
Schémas Pydantic v2 — Sprint 3 : Contrats, Messagerie, Litiges AGRILYO
"""

from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ═══════════════════════════════════════════════════════════════════════════════
# Thread & Messages
# ═══════════════════════════════════════════════════════════════════════════════

class MessageCreate(BaseModel):
    contenu: str = Field(min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    thread_id: UUID
    auteur_id: UUID
    contenu: str
    lu: bool
    created_at: datetime
    # Nom affiché de l'auteur — calculé dans le service
    auteur_nom: str | None = None


class ThreadCreate(BaseModel):
    annonce_id: UUID
    message_initial: str = Field(
        min_length=1, max_length=2000,
        description="Premier message envoyé au bailleur"
    )


class ThreadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    annonce_id: UUID
    demandeur_id: UUID
    est_actif: bool
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    # Infos de l'annonce
    annonce_region: str | None = None
    annonce_superficie: float | None = None


class ThreadResume(BaseModel):
    """Résumé pour la liste des threads d'un utilisateur."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    annonce_id: UUID
    est_actif: bool
    updated_at: datetime
    dernier_message: str | None = None
    messages_non_lus: int = 0
    annonce_region: str | None = None
    annonce_superficie: float | None = None


# ═══════════════════════════════════════════════════════════════════════════════
# Contrats
# ═══════════════════════════════════════════════════════════════════════════════

class ContratCreate(BaseModel):
    annonce_id: UUID
    locataire_id: UUID
    type_contrat: str = Field(
        description="BAIL_RURAL | METAYAGE | AMODIATION | PROMESSE_VENTE"
    )
    date_debut: datetime | None = None
    date_fin: datetime | None = None
    montant_fcfa: float | None = Field(default=None, ge=0)


class ContratResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    annonce_id: UUID
    locataire_id: UUID
    bailleur_id: UUID
    type_contrat: str
    date_debut: datetime | None
    date_fin: datetime | None
    montant_fcfa: float | None
    statut: str
    signe_bailleur: bool
    signe_locataire: bool
    hash_sha256: str | None
    horodatage: datetime | None
    url_pdf: str | None
    created_at: datetime


class SignatureRequest(BaseModel):
    """Requête de signature OTP d'un contrat."""
    code_otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class SignatureResponse(BaseModel):
    """Réponse après signature réussie."""
    contrat: ContratResponse
    hash_sha256: str
    horodatage: datetime
    est_completement_signe: bool
    message: str


# ═══════════════════════════════════════════════════════════════════════════════
# Litiges
# ═══════════════════════════════════════════════════════════════════════════════

class LitigeCreate(BaseModel):
    contrat_id: UUID
    description: str = Field(min_length=10, max_length=2000)


class LitigeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    contrat_id: UUID
    declarant_id: UUID
    admin_id: UUID | None
    description: str
    statut: str
    resolution: str | None
    created_at: datetime
    updated_at: datetime


class LitigeResoudreRequest(BaseModel):
    """[Admin] Fait avancer ou clôture un litige."""
    statut: str = Field(description="MEDIATION | RESOLU | ESCALADE")
    resolution: str | None = Field(default=None, max_length=2000)

    @field_validator("statut")
    @classmethod
    def validate_statut(cls, v: str) -> str:
        allowed = {"MEDIATION", "RESOLU", "ESCALADE"}
        if v not in allowed:
            raise ValueError(f"Statut invalide. Autorisés : {', '.join(sorted(allowed))}")
        return v


class LitigeListResponse(BaseModel):
    items: List[LitigeResponse]
    total: int
    page: int
    size: int
    pages: int