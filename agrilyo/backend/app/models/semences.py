"""
Modèles SQLAlchemy — Module M2 Semences & Plants AGRILYO
Tables : fournisseurs_semences, produits_semences, certifications_produit,
         photos_produit, avis_produit
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean, CheckConstraint, DateTime, Enum, Float,
    ForeignKey, Index, Integer, SmallInteger, String, Text,
    UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ═══════════════════════════════════════════════════════════════════════════════
# Enums
# ═══════════════════════════════════════════════════════════════════════════════

class TypeProduit(str, PyEnum):
    SEMENCE  = "SEMENCE"   # Graines certifiées (riz, maïs, arachide…)
    PLANT    = "PLANT"     # Plants (palmier, hévéa, cacao, café…)
    BOUTURE  = "BOUTURE"   # Boutures (manioc, igname…)
    TUBERCULE = "TUBERCULE"  # Semenceaux (igname, taro…)


class StatutFournisseur(str, PyEnum):
    EN_ATTENTE  = "EN_ATTENTE"   # En cours de vérification admin
    VERIFIE     = "VERIFIE"      # Documents validés par l'admin
    SUSPENDU    = "SUSPENDU"     # Suspendu (fraude, non-conformité)
    REJETE      = "REJETE"       # Dossier rejeté définitivement


class NiveauLabel(str, PyEnum):
    """Label Ivoire Semences — système de certification à 3 niveaux."""
    BRONZE  = "BRONZE"   # Fournisseur vérifié, stock confirmé
    ARGENT  = "ARGENT"   # + Certifications officielles (ANADER/FIRCA)
    OR      = "OR"       # + Ancienneté ≥ 2 ans, note ≥ 4.5, audité


class StatutProduit(str, PyEnum):
    ACTIF       = "ACTIF"       # En vente, stock > 0
    RUPTURE     = "RUPTURE"     # Stock = 0, visible mais non commandable
    INACTIF     = "INACTIF"     # Masqué par le fournisseur
    EN_ATTENTE  = "EN_ATTENTE"  # En cours de validation admin


class UniteStock(str, PyEnum):
    KG       = "KG"        # Kilogramme (semences)
    TONNE    = "TONNE"     # Tonne (grossistes)
    UNITE    = "UNITE"     # Unité (plants à l'unité)
    SACHET   = "SACHET"    # Sachet pré-conditionné
    BOTTE    = "BOTTE"     # Botte (plants)


class TypeCertification(str, PyEnum):
    ANADER   = "ANADER"    # Agence Nationale d'Appui au Développement Rural
    FIRCA    = "FIRCA"     # Fonds Interprofessionnel pour la Recherche et le Conseil Agricoles
    MINAGRI  = "MINAGRI"   # Ministère de l'Agriculture — étiquette officielle
    ISO      = "ISO"       # Certification ISO (qualité)
    BIO      = "BIO"       # Agriculture biologique certifiée
    AUTRE    = "AUTRE"


class StatutCommandeSemences(str, PyEnum):
    BROUILLON = "BROUILLON"                  # Panier transforme en commande, non paye
    CONFIRMEE = "CONFIRMEE"                  # Commande confirmee hors paiement MVP
    EN_ATTENTE_PAIEMENT = "EN_ATTENTE_PAIEMENT"
    PAYEE = "PAYEE"                          # Paiement Stripe confirme
    ANNULEE = "ANNULEE"
    ECHEC_PAIEMENT = "ECHEC_PAIEMENT"
    EN_PREPARATION = "EN_PREPARATION"
    LIVREE = "LIVREE"


class StatutPaiementSemences(str, PyEnum):
    INITIE = "INITIE"
    EN_ATTENTE = "EN_ATTENTE"
    REUSSI = "REUSSI"
    ECHOUE = "ECHOUE"
    ANNULE = "ANNULE"
    REMBOURSE = "REMBOURSE"


class ProviderPaiement(str, PyEnum):
    STRIPE = "STRIPE"


class TypeTransactionStripe(str, PyEnum):
    CHECKOUT_SESSION = "CHECKOUT_SESSION"
    PAYMENT_INTENT = "PAYMENT_INTENT"
    WEBHOOK_EVENT = "WEBHOOK_EVENT"


# ═══════════════════════════════════════════════════════════════════════════════
# Fournisseur
# ═══════════════════════════════════════════════════════════════════════════════

class FournisseurSemences(Base):
    __tablename__ = "fournisseurs_semences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,    # 1 user → au plus 1 profil fournisseur
        index=True,
    )

    # ── Identité commerciale ──────────────────────────────────────────────────
    nom_commercial: Mapped[str] = mapped_column(
        String(200), nullable=False, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(
        String(512), nullable=True,
        comment="URL Cloudflare R2 du logo"
    )

    # ── Localisation ──────────────────────────────────────────────────────────
    region: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    ville: Mapped[str | None] = mapped_column(String(100), nullable=True)
    adresse_complete: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Contact professionnel ─────────────────────────────────────────────────
    telephone_pro: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email_pro: Mapped[str | None] = mapped_column(String(255), nullable=True)
    site_web: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # ── Statut & vérification admin ───────────────────────────────────────────
    statut: Mapped[StatutFournisseur] = mapped_column(
        Enum(StatutFournisseur, name="statut_fournisseur_enum"),
        nullable=False,
        default=StatutFournisseur.EN_ATTENTE,
    )
    note_admin: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Motif de suspension/rejet ou observations admin"
    )
    verifie_le: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment="Date de validation par l'admin"
    )

    # ── Label Ivoire Semences ─────────────────────────────────────────────────
    label_ivoire: Mapped[NiveauLabel | None] = mapped_column(
        Enum(NiveauLabel, name="niveau_label_enum"),
        nullable=True,
        default=None,
        comment="NULL = pas encore labellisé"
    )
    label_attribue_le: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    label_expire_le: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment="Le label doit être renouvelé annuellement"
    )

    # ── Statistiques agrégées (dénormalisées pour perf mobile 3G) ────────────
    note_moyenne: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0,
        comment="Moyenne des avis produits — mise à jour par trigger service"
    )
    nombre_avis: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nombre_produits_actifs: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    user = relationship("User", foreign_keys=[user_id])
    produits = relationship(
        "ProduitSemences", back_populates="fournisseur",
        cascade="all, delete-orphan",
    )
    lignes_commande = relationship(
        "LigneCommandeSemences", back_populates="fournisseur"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# ProduitSemences
# ═══════════════════════════════════════════════════════════════════════════════

class ProduitSemences(Base):
    __tablename__ = "produits_semences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    fournisseur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("fournisseurs_semences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Identification du produit ─────────────────────────────────────────────
    nom: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    type_produit: Mapped[TypeProduit] = mapped_column(
        Enum(TypeProduit, name="type_produit_enum"),
        nullable=False,
        index=True,
    )
    variete: Mapped[str | None] = mapped_column(
        String(200), nullable=True,
        comment="Ex: WARDA (riz), CMS-8704 (maïs), Mercedes (hévéa)"
    )
    culture: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True,
        comment="Nom de la culture principale: riz, maïs, cacao, palmier…"
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Caractéristiques agronomiques ─────────────────────────────────────────
    duree_germination_jours: Mapped[int | None] = mapped_column(
        Integer, nullable=True,
        comment="Délai de germination en jours"
    )
    rendement_potentiel: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
        comment="Ex: 4–6 t/ha, libre pour s'adapter à l'unité"
    )
    zones_adaptation: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Régions de Côte d'Ivoire recommandées, séparées par virgule"
    )
    saison_semis: Mapped[str | None] = mapped_column(
        String(200), nullable=True,
        comment="Ex: Grande saison (avr–juil), Petite saison (sep–oct)"
    )

    # ── Prix & stock ──────────────────────────────────────────────────────────
    prix_unitaire: Mapped[float] = mapped_column(
        Float, nullable=False,
        comment="Prix en FCFA par unité de stock"
    )
    unite_stock: Mapped[UniteStock] = mapped_column(
        Enum(UniteStock, name="unite_stock_enum"),
        nullable=False,
        default=UniteStock.KG,
    )
    stock_disponible: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0,
        comment="Quantité disponible dans l'unité choisie"
    )
    stock_minimum_commande: Mapped[float] = mapped_column(
        Float, nullable=False, default=1.0,
        comment="Quantité minimale par commande"
    )

    # ── Statut ────────────────────────────────────────────────────────────────
    statut: Mapped[StatutProduit] = mapped_column(
        Enum(StatutProduit, name="statut_produit_enum"),
        nullable=False,
        default=StatutProduit.EN_ATTENTE,
    )

    # ── Statistiques agrégées ─────────────────────────────────────────────────
    note_moyenne: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0
    )
    nombre_avis: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nombre_vues: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    # ── Contraintes ───────────────────────────────────────────────────────────
    __table_args__ = (
        CheckConstraint("prix_unitaire >= 0", name="ck_produit_prix_positif"),
        CheckConstraint("stock_disponible >= 0", name="ck_produit_stock_positif"),
        CheckConstraint("stock_minimum_commande > 0", name="ck_produit_minimum_positif"),
        CheckConstraint("note_moyenne >= 0 AND note_moyenne <= 5", name="ck_produit_note_range"),
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    fournisseur = relationship("FournisseurSemences", back_populates="produits")
    photos = relationship(
        "PhotoProduit", back_populates="produit",
        cascade="all, delete-orphan",
        order_by="PhotoProduit.ordre",
    )
    certifications = relationship(
        "CertificationProduit", back_populates="produit",
        cascade="all, delete-orphan",
    )
    avis = relationship(
        "AvisProduit", back_populates="produit",
        cascade="all, delete-orphan",
        order_by="AvisProduit.created_at.desc()",
    )
    panier_items = relationship(
        "PanierItemSemences", back_populates="produit",
        cascade="all, delete-orphan",
    )
    lignes_commande = relationship(
        "LigneCommandeSemences", back_populates="produit"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# PhotoProduit
# ═══════════════════════════════════════════════════════════════════════════════

class PhotoProduit(Base):
    __tablename__ = "photos_produits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    produit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("produits_semences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    url_stockage: Mapped[str] = mapped_column(
        String(512), nullable=False,
        comment="URL Cloudflare R2 — image compressée WebP"
    )
    url_miniature: Mapped[str | None] = mapped_column(
        String(512), nullable=True,
        comment="Miniature 200×200 pour les listes (3G-friendly)"
    )
    nom_fichier: Mapped[str] = mapped_column(String(255), nullable=False)
    taille_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ordre: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=0,
        comment="0 = photo principale"
    )
    est_principale: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False,
        comment="True pour la photo de couverture du produit"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    produit = relationship("ProduitSemences", back_populates="photos")


# ═══════════════════════════════════════════════════════════════════════════════
# CertificationProduit
# ═══════════════════════════════════════════════════════════════════════════════

class CertificationProduit(Base):
    __tablename__ = "certifications_produits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    produit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("produits_semences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type_certification: Mapped[TypeCertification] = mapped_column(
        Enum(TypeCertification, name="type_certification_enum"),
        nullable=False,
    )
    numero_certificat: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
        comment="Numéro de certificat officiel"
    )
    organisme_delivreur: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    date_delivrance: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    date_expiration: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    url_document: Mapped[str | None] = mapped_column(
        String(512), nullable=True,
        comment="URL R2 du scan du certificat"
    )
    est_verifie: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False,
        comment="Validé par un admin AGRILYO"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    produit = relationship("ProduitSemences", back_populates="certifications")


# ═══════════════════════════════════════════════════════════════════════════════
# AvisProduit
# ═══════════════════════════════════════════════════════════════════════════════

class AvisProduit(Base):
    __tablename__ = "avis_produits"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    produit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("produits_semences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    auteur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Contenu de l'avis ────────────────────────────────────────────────────
    note: Mapped[int] = mapped_column(
        SmallInteger, nullable=False,
        comment="Note de 1 à 5"
    )
    commentaire: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Commentaire libre (optionnel)"
    )

    # ── Modération ───────────────────────────────────────────────────────────
    est_publie: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True,
        comment="False si masqué par l'admin"
    )
    est_verifie_achat: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False,
        comment="True si l'auteur a commandé ce produit — préparation Sprint 5"
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    # ── Contraintes ───────────────────────────────────────────────────────────
    __table_args__ = (
        CheckConstraint("note >= 1 AND note <= 5", name="ck_avis_note_range"),
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    produit = relationship("ProduitSemences", back_populates="avis")
    auteur  = relationship("User", foreign_keys=[auteur_id])


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PanierItemSemences
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class PanierItemSemences(Base):
    __tablename__ = "panier_items_semences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    produit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("produits_semences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    quantite: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("user_id", "produit_id", name="uq_panier_user_produit"),
        CheckConstraint("quantite > 0", name="ck_panier_quantite_positive"),
    )

    user = relationship("User", foreign_keys=[user_id])
    produit = relationship("ProduitSemences", back_populates="panier_items")


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# CommandeSemences
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class CommandeSemences(Base):
    __tablename__ = "commandes_semences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    acheteur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    reference: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
        unique=True,
        index=True,
        comment="Reference courte affichee au client: AGR-S5-...",
    )
    statut: Mapped[StatutCommandeSemences] = mapped_column(
        Enum(StatutCommandeSemences, name="statut_commande_semences_enum"),
        nullable=False,
        default=StatutCommandeSemences.BROUILLON,
        index=True,
    )

    devise: Mapped[str] = mapped_column(String(3), nullable=False, default="XOF")
    montant_total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    nombre_lignes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Coordonnees de livraison/contact snapshottees au moment de la commande.
    nom_contact: Mapped[str | None] = mapped_column(String(200), nullable=True)
    telephone_contact: Mapped[str | None] = mapped_column(String(20), nullable=True)
    region_livraison: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ville_livraison: Mapped[str | None] = mapped_column(String(100), nullable=True)
    adresse_livraison: Mapped[str | None] = mapped_column(Text, nullable=True)
    note_client: Mapped[str | None] = mapped_column(Text, nullable=True)

    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint("montant_total >= 0", name="ck_commande_montant_total_positif"),
        CheckConstraint("nombre_lignes >= 0", name="ck_commande_nombre_lignes_positif"),
    )

    acheteur = relationship("User", foreign_keys=[acheteur_id])
    lignes = relationship(
        "LigneCommandeSemences", back_populates="commande",
        cascade="all, delete-orphan",
        order_by="LigneCommandeSemences.created_at",
    )
    paiements = relationship(
        "PaiementSemences", back_populates="commande",
        cascade="all, delete-orphan",
        order_by="PaiementSemences.created_at.desc()",
    )
    transactions_stripe = relationship(
        "TransactionStripe", back_populates="commande",
        cascade="all, delete-orphan",
        order_by="TransactionStripe.created_at.desc()",
    )


class LigneCommandeSemences(Base):
    __tablename__ = "lignes_commandes_semences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    commande_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commandes_semences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    produit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("produits_semences.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    fournisseur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("fournisseurs_semences.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    quantite: Mapped[float] = mapped_column(Float, nullable=False)
    prix_unitaire_snapshot: Mapped[float] = mapped_column(Float, nullable=False)
    montant_ligne: Mapped[float] = mapped_column(Float, nullable=False)

    # Snapshot catalogue pour tickets, webhooks et historique 3G/offline.
    produit_nom_snapshot: Mapped[str] = mapped_column(String(200), nullable=False)
    produit_variete_snapshot: Mapped[str | None] = mapped_column(String(200), nullable=True)
    culture_snapshot: Mapped[str] = mapped_column(String(100), nullable=False)
    unite_stock_snapshot: Mapped[UniteStock] = mapped_column(
        Enum(UniteStock, name="unite_stock_enum"),
        nullable=False,
    )
    fournisseur_nom_snapshot: Mapped[str] = mapped_column(String(200), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        CheckConstraint("quantite > 0", name="ck_ligne_commande_quantite_positive"),
        CheckConstraint("prix_unitaire_snapshot >= 0", name="ck_ligne_commande_prix_positif"),
        CheckConstraint("montant_ligne >= 0", name="ck_ligne_commande_montant_positif"),
    )

    commande = relationship("CommandeSemences", back_populates="lignes")
    produit = relationship("ProduitSemences", back_populates="lignes_commande")
    fournisseur = relationship("FournisseurSemences", back_populates="lignes_commande")


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# PaiementSemences & TransactionStripe
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class PaiementSemences(Base):
    __tablename__ = "paiements_semences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    commande_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commandes_semences.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    provider: Mapped[ProviderPaiement] = mapped_column(
        Enum(ProviderPaiement, name="provider_paiement_enum"),
        nullable=False,
        default=ProviderPaiement.STRIPE,
    )
    statut: Mapped[StatutPaiementSemences] = mapped_column(
        Enum(StatutPaiementSemences, name="statut_paiement_semences_enum"),
        nullable=False,
        default=StatutPaiementSemences.INITIE,
        index=True,
    )
    devise: Mapped[str] = mapped_column(String(3), nullable=False, default="XOF")
    montant: Mapped[float] = mapped_column(Float, nullable=False)

    stripe_checkout_session_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, unique=True, index=True
    )
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    checkout_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Dans PaiementSemences, ajouter expires_at pour alimenter StripeCheckoutResponse
    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment="Expiration de la Checkout Session Stripe (~30 min après création)"
    )

    initiated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_code: Mapped[str | None] = mapped_column(String(100), nullable=True)
    failure_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint("montant >= 0", name="ck_paiement_semences_montant_positif"),
    )

    commande = relationship("CommandeSemences", back_populates="paiements")
    transactions_stripe = relationship(
        "TransactionStripe", back_populates="paiement",
        cascade="all, delete-orphan",
        order_by="TransactionStripe.created_at.desc()",
    )


class TransactionStripe(Base):
    __tablename__ = "transactions_stripe"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    commande_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("commandes_semences.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    paiement_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("paiements_semences.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    type_transaction: Mapped[TypeTransactionStripe] = mapped_column(
        Enum(TypeTransactionStripe, name="type_transaction_stripe_enum"),
        nullable=False,
        index=True,
    )
    stripe_event_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
        index=True,
        comment="Idempotence webhook Stripe",
    )
    stripe_checkout_session_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True, index=True
    )
    stripe_event_type: Mapped[str | None] = mapped_column(String(120), nullable=True)

    montant: Mapped[float | None] = mapped_column(Float, nullable=True)
    devise: Mapped[str | None] = mapped_column(String(3), nullable=True)
    statut_stripe: Mapped[str | None] = mapped_column(String(100), nullable=True)
    payload: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
        comment="Payload Stripe reduit ou evenement brut utile au debug",
    )
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "montant IS NULL OR montant >= 0",
            name="ck_transaction_stripe_montant_positif",
        ),
        Index("ix_transactions_stripe_event_type", "stripe_event_type"),
    )

    commande = relationship("CommandeSemences", back_populates="transactions_stripe")
    paiement = relationship("PaiementSemences", back_populates="transactions_stripe")
