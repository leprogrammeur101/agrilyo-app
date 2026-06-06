"""
Schémas Pydantic v2 — Module M1 Foncier AGRILYO
Validation de toutes les données entrantes et sortantes des endpoints foncier.
"""

from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.foncier import (
    BadgeSecurite,
    StatutAnnonce,
    StatutJuridique,
    TypeAcces,
)


# ═══════════════════════════════════════════════════════════════════════════════
# Sous-schémas
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentFoncierSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type_document: str
    nom_fichier: str
    url_stockage: str
    est_public: bool
    created_at: datetime


class BailleurResume(BaseModel):
    """Profil bailleur résumé — affiché sur la fiche annonce."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_name: str | None
    first_name: str | None
    last_name: str | None
    phone_number: str
    region: str | None


# ═══════════════════════════════════════════════════════════════════════════════
# Annonce — Création
# ═══════════════════════════════════════════════════════════════════════════════

class AnnonceCreate(BaseModel):
    """Corps de la requête POST /foncier/annonces."""

    type_acces: TypeAcces
    superficie_ha: float = Field(gt=0, description="Superficie en hectares, doit être > 0")
    prix_indicatif: float | None = Field(
        default=None, ge=0,
        description="En FCFA/ha/an pour location, FCFA total pour vente"
    )
    region: str = Field(min_length=2, max_length=100)
    sous_prefecture: str | None = Field(default=None, max_length=100)
    village: str | None = Field(default=None, max_length=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    statut_juridique: StatutJuridique = StatutJuridique.INCONNU
    description: str | None = Field(default=None, max_length=2000)
    culture_anterieure: str | None = Field(default=None, max_length=200)
    equipements: str | None = Field(default=None, max_length=500)

    @field_validator("superficie_ha")
    @classmethod
    def validate_superficie(cls, v: float) -> float:
        if v > 100_000:
            raise ValueError("Superficie trop grande (max 100 000 ha)")
        return round(v, 2)

    @field_validator("prix_indicatif")
    @classmethod
    def validate_prix(cls, v: float | None) -> float | None:
        if v is not None and v > 1_000_000_000:
            raise ValueError("Prix indicatif trop élevé")
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Annonce — Mise à jour
# ═══════════════════════════════════════════════════════════════════════════════

class AnnonceUpdate(BaseModel):
    """Corps de la requête PATCH /foncier/annonces/{id} — tous les champs optionnels."""

    type_acces: TypeAcces | None = None
    superficie_ha: float | None = Field(default=None, gt=0)
    prix_indicatif: float | None = Field(default=None, ge=0)
    region: str | None = Field(default=None, min_length=2, max_length=100)
    sous_prefecture: str | None = None
    village: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    statut_juridique: StatutJuridique | None = None
    description: str | None = Field(default=None, max_length=2000)
    culture_anterieure: str | None = None
    equipements: str | None = None
    statut: StatutAnnonce | None = None


# ═══════════════════════════════════════════════════════════════════════════════
# Annonce — Réponses
# ═══════════════════════════════════════════════════════════════════════════════

class AnnonceResponse(BaseModel):
    """Fiche complète d'une annonce — GET /foncier/annonces/{id}."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type_acces: TypeAcces
    superficie_ha: float
    prix_indicatif: float | None
    region: str
    sous_prefecture: str | None
    village: str | None
    latitude: float | None
    longitude: float | None
    statut_juridique: StatutJuridique
    badge: BadgeSecurite
    badge_note: str | None
    description: str | None
    culture_anterieure: str | None
    equipements: str | None
    statut: StatutAnnonce
    vues: int
    created_at: datetime
    updated_at: datetime
    bailleur: BailleurResume
    documents: List[DocumentFoncierSchema]


class AnnonceResume(BaseModel):
    """Résumé d'une annonce — dans la liste GET /foncier/annonces."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type_acces: TypeAcces
    superficie_ha: float
    prix_indicatif: float | None
    region: str
    sous_prefecture: str | None
    badge: BadgeSecurite
    statut_juridique: StatutJuridique
    statut: StatutAnnonce
    vues: int
    created_at: datetime
    # Photo principale (première photo publique)
    photo_url: str | None = None


class AnnonceListResponse(BaseModel):
    """Réponse paginée pour GET /foncier/annonces."""
    items: List[AnnonceResume]
    total: int
    page: int
    size: int
    pages: int


# ═══════════════════════════════════════════════════════════════════════════════
# Badge — Mise à jour (admin uniquement)
# ═══════════════════════════════════════════════════════════════════════════════

class BadgeUpdate(BaseModel):
    """Corps de la requête PATCH /foncier/annonces/{id}/badge."""
    badge: BadgeSecurite
    note: str | None = Field(
        default=None, max_length=500,
        description="Motif de rejet ou commentaire admin"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Filtres — Query params pour la liste
# ═══════════════════════════════════════════════════════════════════════════════

class AnnonceFiltres(BaseModel):
    """Paramètres de filtrage et pagination pour GET /foncier/annonces."""

    region: str | None = None
    type_acces: TypeAcces | None = None
    badge: BadgeSecurite | None = None
    statut_juridique: StatutJuridique | None = None
    superficie_min: float | None = Field(default=None, gt=0)
    superficie_max: float | None = Field(default=None, gt=0)
    prix_max: float | None = Field(default=None, ge=0)
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)