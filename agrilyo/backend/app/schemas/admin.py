"""
Schémas Pydantic — Back-office Admin AGRILYO.
Liste des utilisateurs et tableau de bord KPI, consommés par le back-office web.
"""

from datetime import datetime
from typing import Dict, List, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserAdminResume(BaseModel):
    """Résumé d'un utilisateur pour la liste admin (pas de données sensibles)."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone_number: str
    first_name: str | None
    last_name: str | None
    display_name: str | None
    region: str | None
    roles: List[str]
    status: str
    phone_verified: bool
    created_at: datetime
    last_login_at: datetime | None


class UserAdminListResponse(BaseModel):
    items: List[UserAdminResume]
    total: int
    page: int
    size: int
    pages: int


class KPIResponse(BaseModel):
    """Chiffres clés pour le tableau de bord admin."""
    total_users: int
    users_par_role: Dict[str, int]
    agronomes_en_attente: int
    agronomes_verifies: int
    fournisseurs_en_attente: int
    fournisseurs_verifies: int
    annonces_actives: int
    litiges_ouverts: int
    demandes_conseil_par_statut: Dict[str, int]


class AgronomeValidateRequest(BaseModel):
    """[Admin] Décision sur un profil agronome EN_ATTENTE."""
    decision: Literal["VERIFIE", "REJETE"]
    motif: str | None = Field(default=None, max_length=1000)


class FournisseurValidateRequest(BaseModel):
    """[Admin] Décision sur un profil fournisseur EN_ATTENTE."""
    decision: Literal["VERIFIE", "REJETE"]
    motif: str | None = Field(default=None, max_length=1000)


class UserStatusUpdateRequest(BaseModel):
    """
    [Admin] Modération d'un compte — pas de suppression hard, pas de bannissement
    via cette route (ACTIVE/SUSPENDED uniquement ; BANNED reste une action distincte
    et volontairement non exposée ici pour éviter les bannissements accidentels).
    """
    status: Literal["ACTIVE", "SUSPENDED"]
    motif: str | None = Field(default=None, max_length=1000)