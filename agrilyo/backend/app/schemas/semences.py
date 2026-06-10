"""
Schémas Pydantic v2 — Module M2 Semences & Plants AGRILYO
Validation de toutes les données entrantes et sortantes des endpoints semences.
"""

from datetime import datetime
from typing import Any, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.semences import (
    NiveauLabel,
    ProviderPaiement,
    StatutCommandeSemences,
    StatutFournisseur,
    StatutPaiementSemences,
    StatutProduit,
    TypeCertification,
    TypeProduit,
    TypeTransactionStripe,
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

class PanierItemCreate(BaseModel):
    """Ajout ou remplacement d'un produit dans le panier persistant."""

    produit_id: UUID
    quantite: float = Field(gt=0, description="Quantite dans l'unite du produit")


class PanierItemUpdate(BaseModel):
    """Mise a jour de quantite d'une ligne panier."""

    quantite: float = Field(gt=0)


class PanierItemResponse(BaseModel):
    """Ligne panier avec produit resume pour affichage mobile."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    produit_id: UUID
    quantite: float
    created_at: datetime
    updated_at: datetime
    produit: ProduitResume


class PanierResponse(BaseModel):
    """Panier persistant de l'utilisateur connecte."""

    items: List[PanierItemResponse]
    total_estime: float
    devise: str = "XOF"
    nombre_items: int


# ═══════════════════════════════════════════════════════════════════════════════
# Commandes — Création
# ═══════════════════════════════════════════════════════════════════════════════

class LigneCommandeCreate(BaseModel):
    """Un produit et sa quantité dans la liste de commande."""

    produit_id: UUID
    quantite: float = Field(gt=0, description="Dans l'unité de stock du produit")


class CommandeCreate(BaseModel):
    """
    Création d'une commande avec lignes explicites (ex: panier local mobile).

    Utiliser CommandeFromPanierCreate pour convertir le panier persistant
    sans avoir à renvoyer les lignes.
    """

    lignes: List[LigneCommandeCreate] = Field(
        min_length=1,
        max_length=50,
        description="1 à 50 lignes. Les doublons produit_id seront rejetés.",
    )
    nom_contact: str | None = Field(default=None, max_length=200)
    telephone_contact: str | None = Field(default=None, max_length=20)
    region_livraison: str | None = Field(default=None, max_length=100)
    ville_livraison: str | None = Field(default=None, max_length=100)
    adresse_livraison: str | None = Field(default=None, max_length=1000)
    note_client: str | None = Field(default=None, max_length=1000)

    @field_validator("telephone_contact")
    @classmethod
    def validate_telephone_contact(cls, v: str | None) -> str | None:
        if v is not None and v and not v.startswith("+"):
            raise ValueError("Le numero doit etre au format E.164 (ex: +2250700000000)")
        return v

    @model_validator(mode="after")
    def validate_pas_de_doublons_produit(self) -> "CommandeCreate":
        """Rejette les commandes avec deux lignes pour le même produit."""
        ids = [str(l.produit_id) for l in self.lignes]
        if len(ids) != len(set(ids)):
            raise ValueError(
                "Deux lignes ne peuvent pas référencer le même produit. "
                "Fusionnez les quantités côté client."
            )
        return self


class CommandeFromPanierCreate(BaseModel):
    """
    Conversion du panier persistant en commande — endpoint POST /semences/commandes/depuis-panier.

    Le service récupère les items du panier de l'utilisateur connecté.
    Pas besoin d'envoyer les lignes : elles sont déduites du panier.
    Le panier est vidé après création réussie.
    """

    nom_contact: str | None = Field(default=None, max_length=200)
    telephone_contact: str | None = Field(default=None, max_length=20)
    region_livraison: str | None = Field(default=None, max_length=100)
    ville_livraison: str | None = Field(default=None, max_length=100)
    adresse_livraison: str | None = Field(default=None, max_length=1000)
    note_client: str | None = Field(default=None, max_length=1000)

    @field_validator("telephone_contact")
    @classmethod
    def validate_telephone_contact(cls, v: str | None) -> str | None:
        if v is not None and v and not v.startswith("+"):
            raise ValueError("Le numero doit etre au format E.164 (ex: +2250700000000)")
        return v


# ═══════════════════════════════════════════════════════════════════════════════
# Commandes — Réponses
# ═══════════════════════════════════════════════════════════════════════════════

class LigneCommandeResponse(BaseModel):
    """
    Ligne commande snapshottée au moment de l'achat.

    Toutes les données prix/produit/fournisseur sont gelées au moment de la commande :
    même si le fournisseur modifie le prix ou supprime son produit,
    l'historique de commande reste cohérent.
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    commande_id: UUID
    produit_id: UUID
    fournisseur_id: UUID
    quantite: float
    # ── Snapshot prix ─────────────────────────────────────────────────────────
    prix_unitaire_snapshot: float
    """Prix FCFA au moment de la commande — immuable."""
    montant_ligne: float
    """quantite × prix_unitaire_snapshot — calculé à la création."""
    # ── Snapshot catalogue ────────────────────────────────────────────────────
    produit_nom_snapshot: str
    produit_variete_snapshot: str | None
    culture_snapshot: str
    unite_stock_snapshot: UniteStock
    fournisseur_nom_snapshot: str
    created_at: datetime


# Alias rétrocompatible — ne pas casser le service existant qui utilise LigneCommandeSchema
LigneCommandeSchema = LigneCommandeResponse


class PaiementActifResume(BaseModel):
    """
    Résumé du paiement actif (dernier en date) pour l'affichage mobile.

    N'expose pas les détails d'audit — utiliser PaiementSemencesSchema
    pour les vues admin ou les pages de détail paiement.
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: ProviderPaiement
    statut: StatutPaiementSemences
    montant: float
    devise: str
    checkout_url: str | None
    """URL Stripe Checkout — valide ~30 min après création de la session."""
    stripe_checkout_session_id: str | None
    paid_at: datetime | None
    created_at: datetime


class PaiementSemencesSchema(BaseModel):
    """Paiement complet associé à une commande — vue admin / détail."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    commande_id: UUID
    provider: ProviderPaiement
    statut: StatutPaiementSemences
    devise: str
    montant: float
    stripe_checkout_session_id: str | None
    stripe_payment_intent_id: str | None
    stripe_customer_id: str | None
    checkout_url: str | None
    initiated_at: datetime | None
    paid_at: datetime | None
    failed_at: datetime | None
    failure_code: str | None
    failure_message: str | None
    created_at: datetime
    updated_at: datetime


class CommandeResume(BaseModel):
    """
    Résumé commande pour les listes mobile — payload léger 3G.

    Pas de lignes, pas de paiements complets : juste l'essentiel
    pour afficher une carte commande dans l'historique.
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reference: str
    """Référence courte affichée au client : AGR-S5-XXXXXXXX"""
    statut: StatutCommandeSemences
    devise: str
    montant_total: float
    nombre_lignes: int
    paid_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CommandeResponse(CommandeResume):
    """
    Détail complet d'une commande — GET /semences/commandes/{id}.

    Inclut les lignes snapshottées et tous les paiements.
    Utiliser CommandeDetail pour une vue enrichie avec paiement actif résumé.
    """
    acheteur_id: UUID
    nom_contact: str | None
    telephone_contact: str | None
    region_livraison: str | None
    ville_livraison: str | None
    adresse_livraison: str | None
    note_client: str | None
    lignes: List[LigneCommandeResponse]
    paiements: List[PaiementSemencesSchema] = []


class CommandeDetail(CommandeResume):
    """
    Vue commande enrichie pour l'écran de suivi mobile.

    Différence avec CommandeResponse :
    - paiement_actif : résumé du dernier paiement (accès direct sans parcourir la liste)
    - lignes incluses mais sans l'acheteur_id (inutile côté mobile)
    - checkout_url remontée directement pour le bouton « Payer »

    Utilisé par : GET /semences/commandes/{id}/detail
    """
    model_config = ConfigDict(from_attributes=True)

    nom_contact: str | None
    telephone_contact: str | None
    region_livraison: str | None
    ville_livraison: str | None
    adresse_livraison: str | None
    note_client: str | None
    lignes: List[LigneCommandeResponse]
    paiement_actif: PaiementActifResume | None = None
    """Dernier paiement en date — None si aucun paiement initié."""

    @property
    def checkout_url(self) -> str | None:
        """Raccourci mobile : URL de paiement sans naviguer dans paiement_actif."""
        if self.paiement_actif:
            return self.paiement_actif.checkout_url
        return None


class CommandeListResponse(BaseModel):
    """Liste paginée des commandes de l'utilisateur."""

    items: List[CommandeResume]
    total: int
    page: int
    size: int
    pages: int


# ═══════════════════════════════════════════════════════════════════════════════
# Commande — Mise à jour admin
# ═══════════════════════════════════════════════════════════════════════════════

class CommandeStatutUpdate(BaseModel):
    """
    Changement de statut par l'admin ou le fournisseur — PATCH /semences/commandes/{id}/statut.

    Transitions autorisées côté service :
      PAYEE → EN_PREPARATION (fournisseur démarre la préparation)
      EN_PREPARATION → LIVREE (fournisseur confirme la livraison)
      PAYEE | EN_PREPARATION → ANNULEE (admin seulement)
    """

    statut: StatutCommandeSemences = Field(
        description="Nouveau statut. Seules certaines transitions sont autorisées."
    )
    note_admin: str | None = Field(
        default=None,
        max_length=1000,
        description="Motif optionnel (obligatoire si ANNULEE)",
    )

    @model_validator(mode="after")
    def validate_note_si_annulation(self) -> "CommandeStatutUpdate":
        if self.statut == StatutCommandeSemences.ANNULEE and not self.note_admin:
            raise ValueError(
                "Une note explicative est requise lors d'une annulation."
            )
        return self


# ═══════════════════════════════════════════════════════════════════════════════
# Stripe — Checkout
# ═══════════════════════════════════════════════════════════════════════════════

class StripeCheckoutCreate(BaseModel):
    """
    Initialisation Stripe Checkout pour une commande en statut BROUILLON
    ou EN_ATTENTE_PAIEMENT.

    success_url et cancel_url peuvent être des deep links Expo
    (agrilyo://commandes/{id}/succes) ou des URLs web classiques.
    Le service injectera {CHECKOUT_SESSION_ID} dans success_url si présent.
    """

    success_url: str = Field(
        max_length=1000,
        description="URL ou deep link après paiement réussi. "
                    "Peut contenir {CHECKOUT_SESSION_ID} pour récupérer la session.",
    )
    cancel_url: str = Field(
        max_length=1000,
        description="URL ou deep link si l'utilisateur abandonne le paiement.",
    )

    @field_validator("success_url", "cancel_url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        prefixes = ("http://", "https://", "agrilyo://")
        if not any(v.startswith(p) for p in prefixes):
            raise ValueError(
                "URL invalide. Formats acceptés : http://, https://, agrilyo://"
            )
        return v


class StripeCheckoutResponse(BaseModel):
    """
    Réponse mobile après création d'une session Stripe Checkout.

    Le mobile ouvre checkout_url dans un WebView ou via Linking.openURL().
    expires_at permet d'afficher un compte à rebours ou d'invalider le bouton.
    """

    paiement_id: UUID
    commande_id: UUID
    reference_commande: str
    """Référence humaine (AGR-S5-…) pour affichage dans l'UI."""
    checkout_session_id: str
    checkout_url: str
    expires_at: datetime
    """La session Stripe Checkout expire après ~30 min. Passé ce délai, en recréer une."""
    montant_xof: float
    """Montant total en FCFA — affiché avant redirection vers Stripe."""
    publishable_key: str | None = None
    """Clé publique Stripe — utile si on bascule vers Stripe Elements natif."""


# ═══════════════════════════════════════════════════════════════════════════════
# Stripe — Webhooks
# ═══════════════════════════════════════════════════════════════════════════════

class StripeWebhookAck(BaseModel):
    """
    Réponse courte renvoyée à Stripe après traitement du webhook.

    Stripe considère le webhook comme réussi si HTTP 200 est retourné
    dans les 30 secondes. Ce schéma assure la cohérence du payload de réponse.
    """

    received: bool = True
    event_id: str | None = None
    """stripe_event.id — permet le débogage dans le dashboard Stripe."""
    status: str = "ok"
    """'ok' | 'ignored' | 'already_processed' — utile pour les logs."""


# ═══════════════════════════════════════════════════════════════════════════════
# Stripe — Audit (admin)
# ═══════════════════════════════════════════════════════════════════════════════

class TransactionStripeSchema(BaseModel):
    """Trace Stripe complète — utile pour audit et debug admin."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    commande_id: UUID | None
    paiement_id: UUID | None
    type_transaction: TypeTransactionStripe
    stripe_event_id: str | None
    stripe_checkout_session_id: str | None
    stripe_payment_intent_id: str | None
    stripe_event_type: str | None
    montant: float | None
    devise: str | None
    statut_stripe: str | None
    payload: dict[str, Any] | None
    """Payload Stripe réduit stocké en JSONB — ne jamais logger en clair côté client."""
    processed_at: datetime | None
    created_at: datetime


# ═══════════════════════════════════════════════════════════════════════════════
# Filtres — Query params
# ═══════════════════════════════════════════════════════════════════════════════

class ProduitFiltres(BaseModel):
    """Paramètres de filtrage et pagination pour GET /semences/produits."""

    culture: str | None = Field(default=None, description="Ex: riz, maïs, cacao")
    type_produit: TypeProduit | None = None
    region: str | None = Field(
        default=None,
        description="Filtre sur la région du fournisseur"
    )
    prix_min: float | None = Field(default=None, ge=0)
    prix_max: float | None = Field(default=None, ge=0)
    certifie: bool | None = Field(
        default=None,
        description="True = au moins une certification vérifiée"
    )
    label_ivoire: NiveauLabel | None = Field(
        default=None,
        description="Filtre sur le label du fournisseur"
    )
    en_stock: bool | None = Field(
        default=None,
        description="True = stock_disponible > 0"
    )
    page: int = Field(default=1, ge=1)
    size: int = Field(default=20, ge=1, le=100)
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
        return 