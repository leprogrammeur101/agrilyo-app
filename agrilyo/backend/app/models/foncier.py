"""
Modèles SQLAlchemy — Module M1 Foncier AGRILYO
Tables : annonces_foncieres, documents_fonciers, threads, messages, contrats, litiges
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean, DateTime, Enum, Float, ForeignKey,
    Integer, String, Text, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ═══════════════════════════════════════════════════════════════════════════════
# Enums
# ═══════════════════════════════════════════════════════════════════════════════

class TypeAcces(str, PyEnum):
    LOCATION   = "LOCATION"
    VENTE      = "VENTE"
    METAYAGE   = "METAYAGE"
    AMODIATION = "AMODIATION"


class StatutJuridique(str, PyEnum):
    COUTUMIER = "COUTUMIER"
    CF        = "CF"           # Certificat Foncier
    TF        = "TF"           # Titre Foncier
    INCONNU   = "INCONNU"


class BadgeSecurite(str, PyEnum):
    NON_VERIFIE       = "NON_VERIFIE"
    COUTUMIER_DECLARE = "COUTUMIER_DECLARE"
    CF_VERIFIE        = "CF_VERIFIE"
    TF_VERIFIE        = "TF_VERIFIE"


class StatutAnnonce(str, PyEnum):
    ACTIVE     = "ACTIVE"
    INACTIVE   = "INACTIVE"
    EN_ATTENTE = "EN_ATTENTE"
    LOUE       = "LOUE"


class StatutContrat(str, PyEnum):
    BROUILLON  = "BROUILLON"
    SIGNE      = "SIGNE"
    EXPIRE     = "EXPIRE"
    RESILIE    = "RESILIE"


class StatutLitige(str, PyEnum):
    OUVERT    = "OUVERT"
    MEDIATION = "MEDIATION"
    RESOLU    = "RESOLU"
    ESCALADE  = "ESCALADE"    # Transmis à l'AFOR


# ═══════════════════════════════════════════════════════════════════════════════
# AnnonceFonciere
# ═══════════════════════════════════════════════════════════════════════════════

class AnnonceFonciere(Base):
    __tablename__ = "annonces_foncieres"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    bailleur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Caractéristiques foncières ────────────────────────────────────────────
    type_acces: Mapped[TypeAcces] = mapped_column(
        Enum(TypeAcces, name="type_acces_enum"), nullable=False
    )
    superficie_ha: Mapped[float] = mapped_column(Float, nullable=False)
    prix_indicatif: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="En FCFA/ha/an pour location, FCFA total pour vente"
    )

    # ── Localisation ──────────────────────────────────────────────────────────
    region: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    sous_prefecture: Mapped[str | None] = mapped_column(String(100), nullable=True)
    village: Mapped[str | None] = mapped_column(String(100), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Statut juridique & badge ───────────────────────────────────────────────
    statut_juridique: Mapped[StatutJuridique] = mapped_column(
        Enum(StatutJuridique, name="statut_juridique_enum"),
        nullable=False,
        default=StatutJuridique.INCONNU,
    )
    badge: Mapped[BadgeSecurite] = mapped_column(
        Enum(BadgeSecurite, name="badge_securite_enum"),
        nullable=False,
        default=BadgeSecurite.NON_VERIFIE,
    )
    badge_note: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Motif de rejet ou commentaire admin sur le badge"
    )

    # ── Description ───────────────────────────────────────────────────────────
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    culture_anterieure: Mapped[str | None] = mapped_column(String(200), nullable=True)
    equipements: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Puits, hangar, clôture, etc."
    )

    # ── Statut annonce ────────────────────────────────────────────────────────
    statut: Mapped[StatutAnnonce] = mapped_column(
        Enum(StatutAnnonce, name="statut_annonce_enum"),
        nullable=False,
        default=StatutAnnonce.EN_ATTENTE,
    )
    vues: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # ── Timestamps ────────────────────────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    bailleur = relationship("User", foreign_keys=[bailleur_id])
    documents = relationship(
        "DocumentFoncier", back_populates="annonce",
        cascade="all, delete-orphan"
    )
    threads = relationship(
        "ThreadFoncier", back_populates="annonce",
        cascade="all, delete-orphan"
    )
    contrat = relationship(
        "ContratFoncier", back_populates="annonce",
        uselist=False
    )


# ═══════════════════════════════════════════════════════════════════════════════
# DocumentFoncier
# ═══════════════════════════════════════════════════════════════════════════════

class DocumentFoncier(Base):
    __tablename__ = "documents_fonciers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    annonce_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("annonces_foncieres.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    type_document: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="PHOTO | CF | TF | COUTUMIER | AUTRE"
    )
    nom_fichier: Mapped[str] = mapped_column(String(255), nullable=False)
    url_stockage: Mapped[str] = mapped_column(
        String(512), nullable=False,
        comment="URL Cloudflare R2"
    )
    taille_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    est_public: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False,
        comment="False pour les documents juridiques sensibles"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    annonce = relationship("AnnonceFonciere", back_populates="documents")


# ═══════════════════════════════════════════════════════════════════════════════
# Thread & Message (messagerie in-app)
# ═══════════════════════════════════════════════════════════════════════════════

class ThreadFoncier(Base):
    __tablename__ = "threads_fonciers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    annonce_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("annonces_foncieres.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    demandeur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    est_actif: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    annonce   = relationship("AnnonceFonciere", back_populates="threads")
    demandeur = relationship("User", foreign_keys=[demandeur_id])
    messages  = relationship(
        "MessageFoncier", back_populates="thread",
        cascade="all, delete-orphan",
        order_by="MessageFoncier.created_at",
    )


class MessageFoncier(Base):
    __tablename__ = "messages_fonciers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    thread_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("threads_fonciers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    auteur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    contenu: Mapped[str] = mapped_column(Text, nullable=False)
    lu: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    thread = relationship("ThreadFoncier", back_populates="messages")
    auteur = relationship("User", foreign_keys=[auteur_id])


# ═══════════════════════════════════════════════════════════════════════════════
# ContratFoncier
# ═══════════════════════════════════════════════════════════════════════════════

class ContratFoncier(Base):
    __tablename__ = "contrats_fonciers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    annonce_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("annonces_foncieres.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,    # une annonce → au plus un contrat
        index=True,
    )
    locataire_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    bailleur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )

    type_contrat: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="BAIL_RURAL | METAYAGE | AMODIATION | PROMESSE_VENTE"
    )
    date_debut: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    date_fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    montant_fcfa: Mapped[float | None] = mapped_column(Float, nullable=True)

    # ── Signature & horodatage ────────────────────────────────────────────────
    statut: Mapped[StatutContrat] = mapped_column(
        Enum(StatutContrat, name="statut_contrat_enum"),
        nullable=False,
        default=StatutContrat.BROUILLON,
    )
    signe_bailleur: Mapped[bool] = mapped_column(Boolean, default=False)
    signe_locataire: Mapped[bool] = mapped_column(Boolean, default=False)
    hash_sha256: Mapped[str | None] = mapped_column(
        String(64), nullable=True,
        comment="SHA-256 du contrat signé — preuve d'intégrité"
    )
    horodatage: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True,
        comment="Timestamp de la dernière signature"
    )
    url_pdf: Mapped[str | None] = mapped_column(String(512), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    annonce   = relationship("AnnonceFonciere", back_populates="contrat")
    locataire = relationship("User", foreign_keys=[locataire_id])
    bailleur  = relationship("User", foreign_keys=[bailleur_id])
    litige    = relationship("LitigeFoncier", back_populates="contrat", uselist=False)


# ═══════════════════════════════════════════════════════════════════════════════
# LitigeFoncier
# ═══════════════════════════════════════════════════════════════════════════════

class LitigeFoncier(Base):
    __tablename__ = "litiges_fonciers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    contrat_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contrats_fonciers.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,    # un contrat → au plus un litige
        index=True,
    )
    declarant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    admin_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    description: Mapped[str] = mapped_column(Text, nullable=False)
    statut: Mapped[StatutLitige] = mapped_column(
        Enum(StatutLitige, name="statut_litige_enum"),
        nullable=False,
        default=StatutLitige.OUVERT,
    )
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        server_default=func.now(), onupdate=func.now()
    )

    # ── Relations ─────────────────────────────────────────────────────────────
    contrat   = relationship("ContratFoncier", back_populates="litige")
    declarant = relationship("User", foreign_keys=[declarant_id])
    admin     = relationship("User", foreign_keys=[admin_id])