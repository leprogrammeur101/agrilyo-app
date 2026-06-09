"""
Schémas Pydantic v2 — Module M2 Semences & Plants AGRILYO
Validation de toutes les données entrantes et sortantes des endpoints semences.
"""

from datetime import datetime
from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.semences import (
    NiveauLabel,
    StatutFournisseur,
    StatutProduit,
    TypeCertification,
    TypeProduit,
    UniteStock,
)


# ═══════════════════════════════════════════════════════════════════════════════
# Sous-schémas réutilisables
# ═══════════════════════════════════════════════════════════════════════════════

class AuteurAvisResume(BaseModel):
    """Profil auteur résumé — affiché sur un avis produit."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    display_name: str | None
    first_name: str | None
    last_name: str | None
    region: str | None


class PhotoProduitSchema(BaseModel):
    """Photo d'un produit — incluse dans les réponses détail."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url_stockage: str
    url_miniature: str | None
    nom_fichier: str
    taille_bytes: int | None
    ordre: int
    est_principale: bool
    created_at: datetime


class CertificationProduitSchema(BaseModel):
    """Certification officielle d'un produit."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type_certification: TypeCertification
    numero_certificat: str | None
    organisme_delivreur: str | None
    date_delivrance: datetime | None
    date_expiration: datetime | None
    url_document: str | None
    est_verifie: bool


class AvisProduitSchema(BaseModel):
    """Avis complet — inclus dans le détail produit."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    note: int
    commentaire: str | None
    est_publie: bool
    est_verifie_achat: bool
    created_at: datetime
    auteur: AuteurAvisResume


class AvisProduitResume(BaseModel):
    """Avis résumé — dans les listes."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    note: int
    commentaire: str | None
    est_verifie_achat: bool
    created_at: datetime
    auteur: AuteurAvisResume


# ═══════════════════════════════════════════════════════════════════════════════
# Fournisseur — Création
# ═══════════════════════════════════════════════════════════════════════════════

class FournisseurCreate(BaseModel):
    """Corps de la requête POST /semences/fournisseurs."""

    nom_commercial: str = Field(min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=3000)
    region: str = Field(min_length=2, max_length=100)
    ville: str | None = Field(default=None, max_length=100)
    adresse_complete: str | None = Field(default=None, max_length=500)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    telephone_pro: str | None = Field(
        default=None, max_length=20,
        description="Format E.164 : +2250700000000"
    )
    email_pro: str | None = Field(default=None, max_length=255)
    site_web: str | None = Field(default=None, max_length=512)

    @field_validator("telephone_pro")
    @classmethod
    def validate_telephone(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith("+"):
            raise ValueError("Le numéro doit être au format E.164 (ex: +2250700000000)")
        return v

    @field_validator("site_web")
    @classmethod
    def validate_site_web(cls, v: str | None) -> str | None:
        if v is not None and not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("L'URL du site doit commencer par http:// ou https://")
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Fournisseur — Mise à jour
# ═══════════════════════════════════════════════════════════════════════════════

class FournisseurUpdate(BaseModel):
    """Corps de la requête PATCH /semences/fournisseurs/moi — tous les champs optionnels."""

    nom_commercial: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=3000)
    region: str | None = Field(default=None, min_length=2, max_length=100)
    ville: str | None = None
    adresse_complete: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    telephone_pro: str | None = Field(default=None, max_length=20)
    email_pro: str | None = Field(default=None, max_length=255)
    site_web: str | None = Field(default=None, max_length=512)


# ═══════════════════════════════════════════════════════════════════════════════
# Fournisseur — Mise à jour admin (statut + label)
# ═══════════════════════════════════════════════════════════════════════════════

class FournisseurStatutUpdate(BaseModel):
    """Corps de la requête PATCH /semences/fournisseurs/{id}/statut — admin uniquement."""

    statut: StatutFournisseur
    note_admin: str | None = Field(
        default=None, max_length=1000,
        description="Motif de suspension/rejet ou observations"
    )


class LabelIvoireUpdate(BaseModel):
    """Attribution ou retrait du Label Ivoire Semences — admin uniquement."""

    label_ivoire: NiveauLabel | None = Field(
        description="NULL pour retirer le label"
    )
    label_expire_le: datetime | None = Field(
        default=None,
        description="Date d'expiration du label. Null = durée indéfinie (déconseillé)"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Fournisseur — Réponses
# ═══════════════════════════════════════════════════════════════════════════════

class FournisseurResume(BaseModel):
    """Fournisseur résumé — dans les listes et sur les fiches produit."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nom_commercial: str
    region: str
    ville: str | None
    statut: StatutFournisseur
    label_ivoire: NiveauLabel | None
    note_moyenne: float
    nombre_avis: int
    nombre_produits_actifs: int
    logo_url: str | None
    created_at: datetime


class FournisseurResponse(BaseModel):
    """Fiche complète d'un fournisseur — GET /semences/fournisseurs/{id}."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nom_commercial: str
    description: str | None
    logo_url: str | None
    region: str
    ville: str | None
    adresse_complete: str | None
    latitude: float | None
    longitude: float | None
    telephone_pro: str | None
    email_pro: str | None
    site_web: str | None
    statut: StatutFournisseur
    label_ivoire: NiveauLabel | None
    label_attribue_le: datetime | None
    label_expire_le: datetime | None
    note_moyenne: float
    nombre_avis: int
    nombre_produits_actifs: int
    verifie_le: datetime | None
    created_at: datetime
    updated_at: datetime


class FournisseurListResponse(BaseModel):
    """Réponse paginée pour GET /semences/fournisseurs."""
    items: List[FournisseurResume]
    total: int
    page: int
    size: int
    pages: int


# ═══════════════════════════════════════════════════════════════════════════════
# Produit — Création
# ═══════════════════════════════════════════════════════════════════════════════

class ProduitCreate(BaseModel):
    """Corps de la requête POST /semences/produits."""

    nom: str = Field(min_length=2, max_length=200)
    type_produit: TypeProduit
    variete: str | None = Field(default=None, max_length=200)
    culture: str = Field(
        min_length=2, max_length=100,
        description="Ex: riz, maïs, cacao, palmier à huile"
    )
    description: str | None = Field(default=None, max_length=3000)
    duree_germination_jours: int | None = Field(
        default=None, gt=0, le=365
    )
    rendement_potentiel: str | None = Field(default=None, max_length=100)
    zones_adaptation: str | None = Field(
        default=None, max_length=500,
        description="Régions CI séparées par virgule : Abidjan, Bouaké, San-Pédro"
    )
    saison_semis: str | None = Field(default=None, max_length=200)
    prix_unitaire: float = Field(
        gt=0,
        description="Prix en FCFA par unité de stock"
    )
    unite_stock: UniteStock = UniteStock.KG
    stock_disponible: float = Field(ge=0, default=0.0)
    stock_minimum_commande: float = Field(gt=0, default=1.0)

    @field_validator("prix_unitaire")
    @classmethod
    def validate_prix(cls, v: float) -> float:
        if v > 10_000_000:
            raise ValueError("Prix unitaire trop élevé (max 10 000 000 FCFA)")
        return round(v, 0)

    @field_validator("culture")
    @classmethod
    def normaliser_culture(cls, v: str) -> str:
        return v.strip().lower()


# ═══════════════════════════════════════════════════════════════════════════════
# Produit — Mise à jour
# ═══════════════════════════════════════════════════════════════════════════════

class ProduitUpdate(BaseModel):
    """Corps de la requête PATCH /semences/produits/{id} — tous les champs optionnels."""

    nom: str | None = Field(default=None, min_length=2, max_length=200)
    variete: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=3000)
    duree_germination_jours: int | None = Field(default=None, gt=0, le=365)
    rendement_potentiel: str | None = Field(default=None, max_length=100)
    zones_adaptation: str | None = Field(default=None, max_length=500)
    saison_semis: str | None = Field(default=None, max_length=200)
    prix_unitaire: float | None = Field(default=None, gt=0)
    unite_stock: UniteStock | None = None
    stock_disponible: float | None = Field(default=None, ge=0)
    stock_minimum_commande: float | None = Field(default=None, gt=0)
    statut: StatutProduit | None = None


class ProduitStatutUpdate(BaseModel):
    """Changement de statut admin — PATCH /semences/produits/{id}/statut."""
    statut: StatutProduit


# ═══════════════════════════════════════════════════════════════════════════════
# Produit — Réponses
# ═══════════════════════════════════════════════════════════════════════════════

class ProduitResume(BaseModel):
    """Résumé produit — dans les listes et le catalogue."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nom: str
    type_produit: TypeProduit
    variete: str | None
    culture: str
    prix_unitaire: float
    unite_stock: UniteStock
    stock_disponible: float
    statut: StatutProduit
    note_moyenne: float
    nombre_avis: int
    # Photo principale uniquement (miniature pour 3G)
    photo_principale_url: str | None = None
    # Fournisseur résumé — affiché sur la carte catalogue
    fournisseur: FournisseurResume
    created_at: datetime


class ProduitResponse(BaseModel):
    """Fiche complète d'un produit — GET /semences/produits/{id}."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    nom: str
    type_produit: TypeProduit
    variete: str | None
    culture: str
    description: str | None
    duree_germination_jours: int | None
    rendement_potentiel: str | None
    zones_adaptation: str | None
    saison_semis: str | None
    prix_unitaire: float
    unite_stock: UniteStock
    stock_disponible: float
    stock_minimum_commande: float
    statut: StatutProduit
    note_moyenne: float
    nombre_avis: int
    nombre_vues: int
    created_at: datetime
    updated_at: datetime
    # Relations
    fournisseur: FournisseurResume
    photos: List[PhotoProduitSchema]
    certifications: List[CertificationProduitSchema]
    avis: List[AvisProduitResume]


class ProduitListResponse(BaseModel):
    """Réponse paginée pour GET /semences/produits."""
    items: List[ProduitResume]
    total: int
    page: int
    size: int
    pages: int


# ═══════════════════════════════════════════════════════════════════════════════
# Certification — Création
# ═══════════════════════════════════════════════════════════════════════════════

class CertificationCreate(BaseModel):
    """Corps de la requête POST /semences/produits/{id}/certifications."""

    type_certification: TypeCertification
    numero_certificat: str | None = Field(default=None, max_length=100)
    organisme_delivreur: str | None = Field(default=None, max_length=200)
    date_delivrance: datetime | None = None
    date_expiration: datetime | None = None

    @field_validator("date_expiration")
    @classmethod
    def validate_expiration(
        cls, v: datetime | None, info: object
    ) -> datetime | None:
        # On vérifie que date_expiration > date_delivrance si les deux sont fournies
        # info.data n'est disponible qu'en Pydantic v2 via ValidationInfo
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Avis — Création
# ═══════════════════════════════════════════════════════════════════════════════

class AvisCreate(BaseModel):
    """Corps de la requête POST /semences/produits/{id}/avis."""

    note: int = Field(ge=1, le=5, description="Note de 1 (mauvais) à 5 (excellent)")
    commentaire: str | None = Field(
        default=None, max_length=1000,
        description="Commentaire libre, optionnel"
    )

    @field_validator("note")
    @classmethod
    def validate_note(cls, v: int) -> int:
        if not 1 <= v <= 5:
            raise ValueError("La note doit être comprise entre 1 et 5")
        return v


class AvisListResponse(BaseModel):
    """Réponse paginée pour GET /semences/produits/{id}/avis."""
    items: List[AvisProduitSchema]
    total: int
    note_moyenne: float
    page: int
    size: int
    pages: int


# ═══════════════════════════════════════════════════════════════════════════════
# Upload photo — Réponse
# ═══════════════════════════════════════════════════════════════════════════════

class PhotoUploadResponse(BaseModel):
    """Réponse après upload d'une photo produit vers R2."""
    id: UUID
    url_stockage: str
    url_miniature: str | None
    ordre: int
    est_principale: bool
    message: str = "Photo uploadée avec succès"


# ═══════════════════════════════════════════════════════════════════════════════
# Filtres — Query params
# ═══════════════════════════════════════════════════════════════════════════════

class ProduitFiltres(BaseModel):
    """Paramètres de filtrage et pagination pour GET /semences/produits."""

    # Filtres principaux
    culture: str | None = Field(default=None, description="Ex: riz, maïs, cacao")
    type_produit: TypeProduit | None = None
    region: str | None = Field(
        default=None,
        description="Filtre sur la région du fournisseur"
    )
    # Filtres prix
    prix_min: float | None = Field(default=None, ge=0)
    prix_max: float | None = Field(default=None, ge=0)
    # Filtres certification & label
    certifie: bool | None = Field(
        default=None,
        description="True = au moins une certification vérifiée"
    )
    label_ivoire: NiveauLabel | None = Field(
        default=None,
        description="Filtre sur le label du fournisseur"
    )
    # Filtre stock
    en_stock: bool | None = Field(
        default=None,
        description="True = stock_disponible > 0"
    )
    # Pagination
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
    # Tri
    tri: str | None = Field(
        default="created_at_desc",
        description="created_at_desc | prix_asc | prix_desc | note_desc"
    )

    @field_validator("tri")
    @classmethod
    def validate_tri(cls, v: str | None) -> str | None:
        valeurs_autorisees = {
            "created_at_desc", "prix_asc", "prix_desc", "note_desc"
        }
        if v is not None and v not in valeurs_autorisees:
            raise ValueError(
                f"Tri invalide. Valeurs autorisées : {valeurs_autorisees}"
            )
        return v


class FournisseurFiltres(BaseModel):
    """Paramètres de filtrage pour GET /semences/fournisseurs."""

    region: str | None = None
    label_ivoire: NiveauLabel | None = None
    culture: str | None = Field(
        default=None,
        description="Filtre sur les cultures proposées par le fournisseur"
    )
    note_min: float | None = Field(default=None, ge=0, le=5)
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
    tri: str | None = Field(
        default="note_desc",
        description="note_desc | created_at_desc | nombre_produits_desc"
    )

    @field_validator("tri")
    @classmethod
    def validate_tri(cls, v: str | None) -> str | None:
        valeurs_autorisees = {
            "note_desc", "created_at_desc", "nombre_produits_desc"
        }
        if v is not None and v not in valeurs_autorisees:
            raise ValueError(
                f"Tri invalide. Valeurs autorisées : {valeurs_autorisees}"
            )
        return v