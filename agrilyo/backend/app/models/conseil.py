"""
Modeles SQLAlchemy - Module M3 Conseil AGRILYO.
"""

import uuid
from datetime import date, datetime
from enum import Enum as PyEnum

from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StatutAgronome(str, PyEnum):
    EN_ATTENTE = "EN_ATTENTE"
    VERIFIE = "VERIFIE"
    SUSPENDU = "SUSPENDU"
    REJETE = "REJETE"


class TypeConseil(str, PyEnum):
    DIAGNOSTIC = "DIAGNOSTIC"
    PLANNING_CULTURAL = "PLANNING_CULTURAL"
    SUIVI_CULTURE = "SUIVI_CULTURE"
    URGENCE_PHYTOSANITAIRE = "URGENCE_PHYTOSANITAIRE"
    AUTRE = "AUTRE"


class StatutDemandeConseil(str, PyEnum):
    NOUVELLE = "NOUVELLE"
    ASSIGNEE = "ASSIGNEE"
    EN_COURS = "EN_COURS"
    TERMINEE = "TERMINEE"
    ANNULEE = "ANNULEE"


class CanalSessionConseil(str, PyEnum):
    CHAT = "CHAT"
    AUDIO = "AUDIO"
    VIDEO = "VIDEO"
    TERRAIN = "TERRAIN"


class StatutSessionConseil(str, PyEnum):
    PLANIFIEE = "PLANIFIEE"
    EN_COURS = "EN_COURS"
    TERMINEE = "TERMINEE"
    ANNULEE = "ANNULEE"


class StatutOperationPlanning(str, PyEnum):
    A_FAIRE = "A_FAIRE"
    EN_COURS = "EN_COURS"
    TERMINEE = "TERMINEE"
    REPORTEE = "REPORTEE"


class Agronome(Base):
    __tablename__ = "agronomes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    titre: Mapped[str] = mapped_column(String(200), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    numero_agrement: Mapped[str | None] = mapped_column(String(120), nullable=True)
    organisation: Mapped[str | None] = mapped_column(String(200), nullable=True)
    telephone_pro: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email_pro: Mapped[str | None] = mapped_column(String(255), nullable=True)

    specialites: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    cultures: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    regions_couvertes: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    langues: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    annees_experience: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tarif_session: Mapped[float | None] = mapped_column(Float, nullable=True)
    note_moyenne: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    nombre_sessions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    statut: Mapped[StatutAgronome] = mapped_column(
        Enum(StatutAgronome, name="statut_agronome_enum"),
        nullable=False,
        default=StatutAgronome.EN_ATTENTE,
        index=True,
    )
    verifie_le: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    note_admin: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint("annees_experience >= 0", name="ck_agronome_experience_positive"),
        CheckConstraint(
            "tarif_session IS NULL OR tarif_session >= 0",
            name="ck_agronome_tarif_positive",
        ),
        CheckConstraint("note_moyenne >= 0 AND note_moyenne <= 5", name="ck_agronome_note_range"),
    )

    user = relationship("User", foreign_keys=[user_id])
    demandes = relationship("DemandeConseil", back_populates="agronome")
    sessions = relationship("SessionConseil", back_populates="agronome")
    plannings = relationship("PlanningCultural", back_populates="agronome")


class DemandeConseil(Base):
    __tablename__ = "demandes_conseil"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    agriculteur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agronome_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agronomes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    type_conseil: Mapped[TypeConseil] = mapped_column(
        Enum(TypeConseil, name="type_conseil_enum"),
        nullable=False,
        default=TypeConseil.DIAGNOSTIC,
        index=True,
    )
    statut: Mapped[StatutDemandeConseil] = mapped_column(
        Enum(StatutDemandeConseil, name="statut_demande_conseil_enum"),
        nullable=False,
        default=StatutDemandeConseil.NOUVELLE,
        index=True,
    )

    culture: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    variete: Mapped[str | None] = mapped_column(String(100), nullable=True)
    region: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    ville: Mapped[str | None] = mapped_column(String(100), nullable=True)
    titre: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    urgence: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    photos_urls: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    metadata_contexte: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    score_matching: Mapped[float | None] = mapped_column(Float, nullable=True)

    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "score_matching IS NULL OR (score_matching >= 0 AND score_matching <= 100)",
            name="ck_demande_conseil_score_range",
        ),
        Index("ix_demandes_conseil_culture_region", "culture", "region"),
    )

    agriculteur = relationship("User", foreign_keys=[agriculteur_id])
    agronome = relationship("Agronome", back_populates="demandes")
    sessions = relationship(
        "SessionConseil", back_populates="demande", cascade="all, delete-orphan"
    )
    plannings = relationship("PlanningCultural", back_populates="demande")


class SessionConseil(Base):
    __tablename__ = "sessions_conseil"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    demande_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("demandes_conseil.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agronome_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agronomes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    agriculteur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    canal: Mapped[CanalSessionConseil] = mapped_column(
        Enum(CanalSessionConseil, name="canal_session_conseil_enum"),
        nullable=False,
        default=CanalSessionConseil.CHAT,
    )
    statut: Mapped[StatutSessionConseil] = mapped_column(
        Enum(StatutSessionConseil, name="statut_session_conseil_enum"),
        nullable=False,
        default=StatutSessionConseil.PLANIFIEE,
        index=True,
    )
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    duree_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes_agronome: Mapped[str | None] = mapped_column(Text, nullable=True)
    compte_rendu: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "duree_minutes IS NULL OR duree_minutes >= 0",
            name="ck_session_conseil_duree_positive",
        ),
    )

    demande = relationship("DemandeConseil", back_populates="sessions")
    agronome = relationship("Agronome", back_populates="sessions")
    agriculteur = relationship("User", foreign_keys=[agriculteur_id])


class PlanningCultural(Base):
    __tablename__ = "plannings_culturaux"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    agriculteur_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agronome_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agronomes.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    demande_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("demandes_conseil.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    titre: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    culture: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    variete: Mapped[str | None] = mapped_column(String(100), nullable=True)
    region: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    superficie_ha: Mapped[float | None] = mapped_column(Float, nullable=True)
    date_debut: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_fin: Mapped[date | None] = mapped_column(Date, nullable=True)
    actif: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "superficie_ha IS NULL OR superficie_ha > 0",
            name="ck_planning_superficie_positive",
        ),
    )

    agriculteur = relationship("User", foreign_keys=[agriculteur_id])
    agronome = relationship("Agronome", back_populates="plannings")
    demande = relationship("DemandeConseil", back_populates="plannings")
    operations = relationship(
        "OperationPlanning",
        back_populates="planning",
        cascade="all, delete-orphan",
        order_by="OperationPlanning.ordre",
    )


class OperationPlanning(Base):
    __tablename__ = "operations_planning"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    planning_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plannings_culturaux.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    titre: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    date_prevue: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    date_realisee: Mapped[date | None] = mapped_column(Date, nullable=True)
    statut: Mapped[StatutOperationPlanning] = mapped_column(
        Enum(StatutOperationPlanning, name="statut_operation_planning_enum"),
        nullable=False,
        default=StatutOperationPlanning.A_FAIRE,
        index=True,
    )
    rappel_sms: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    rappel_envoye_le: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    __table_args__ = (
        UniqueConstraint("planning_id", "ordre", name="uq_operation_planning_ordre"),
    )

    planning = relationship("PlanningCultural", back_populates="operations")
