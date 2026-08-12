"""
Schémas Pydantic — Back-office Admin AGRILYO.
Liste des utilisateurs et tableau de bord KPI, consommés par le back-office web.
"""

from datetime import datetime
from typing import Dict, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict


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