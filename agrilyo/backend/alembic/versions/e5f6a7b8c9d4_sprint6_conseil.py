"""sprint6_conseil_models

Revision ID: e5f6a7b8c9d4
Revises: d4e5f6a7b8c3
Create Date: 2026-07-21

Ajoute les tables Sprint 6 - M3 Conseil :
  - agronomes
  - demandes_conseil
  - sessions_conseil
  - plannings_culturaux
  - operations_planning
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "e5f6a7b8c9d4"
down_revision = "d4e5f6a7b8c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    statut_agronome_enum = postgresql.ENUM(
        "EN_ATTENTE", "VERIFIE", "SUSPENDU", "REJETE",
        name="statut_agronome_enum",
        create_type=True,
    )
    type_conseil_enum = postgresql.ENUM(
        "DIAGNOSTIC", "PLANNING_CULTURAL", "SUIVI_CULTURE",
        "URGENCE_PHYTOSANITAIRE", "AUTRE",
        name="type_conseil_enum",
        create_type=True,
    )
    statut_demande_conseil_enum = postgresql.ENUM(
        "NOUVELLE", "ASSIGNEE", "EN_COURS", "TERMINEE", "ANNULEE",
        name="statut_demande_conseil_enum",
        create_type=True,
    )
    canal_session_conseil_enum = postgresql.ENUM(
        "CHAT", "AUDIO", "VIDEO", "TERRAIN",
        name="canal_session_conseil_enum",
        create_type=True,
    )
    statut_session_conseil_enum = postgresql.ENUM(
        "PLANIFIEE", "EN_COURS", "TERMINEE", "ANNULEE",
        name="statut_session_conseil_enum",
        create_type=True,
    )
    statut_operation_planning_enum = postgresql.ENUM(
        "A_FAIRE", "EN_COURS", "TERMINEE", "REPORTEE",
        name="statut_operation_planning_enum",
        create_type=True,
    )

    op.create_table(
        "agronomes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("titre", sa.String(length=200), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("numero_agrement", sa.String(length=120), nullable=True),
        sa.Column("organisation", sa.String(length=200), nullable=True),
        sa.Column("telephone_pro", sa.String(length=20), nullable=True),
        sa.Column("email_pro", sa.String(length=255), nullable=True),
        sa.Column("specialites", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("cultures", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("regions_couvertes", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("langues", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("annees_experience", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tarif_session", sa.Float(), nullable=True),
        sa.Column("note_moyenne", sa.Float(), nullable=False, server_default="0"),
        sa.Column("nombre_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("statut", statut_agronome_enum, nullable=False, server_default="EN_ATTENTE"),
        sa.Column("verifie_le", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note_admin", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint("annees_experience >= 0", name="ck_agronome_experience_positive"),
        sa.CheckConstraint(
            "tarif_session IS NULL OR tarif_session >= 0",
            name="ck_agronome_tarif_positive",
        ),
        sa.CheckConstraint("note_moyenne >= 0 AND note_moyenne <= 5", name="ck_agronome_note_range"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_agronomes_user_id", "agronomes", ["user_id"])
    op.create_index("ix_agronomes_statut", "agronomes", ["statut"])

    op.create_table(
        "demandes_conseil",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agriculteur_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agronome_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("type_conseil", type_conseil_enum, nullable=False, server_default="DIAGNOSTIC"),
        sa.Column("statut", statut_demande_conseil_enum, nullable=False, server_default="NOUVELLE"),
        sa.Column("culture", sa.String(length=100), nullable=False),
        sa.Column("variete", sa.String(length=100), nullable=True),
        sa.Column("region", sa.String(length=100), nullable=False),
        sa.Column("ville", sa.String(length=100), nullable=True),
        sa.Column("titre", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("urgence", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("photos_urls", postgresql.JSONB(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(), nullable=True),
        sa.Column("score_matching", sa.Float(), nullable=True),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "score_matching IS NULL OR (score_matching >= 0 AND score_matching <= 100)",
            name="ck_demande_conseil_score_range",
        ),
        sa.ForeignKeyConstraint(["agriculteur_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["agronome_id"], ["agronomes.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_demandes_conseil_agriculteur_id", "demandes_conseil", ["agriculteur_id"])
    op.create_index("ix_demandes_conseil_agronome_id", "demandes_conseil", ["agronome_id"])
    op.create_index("ix_demandes_conseil_type_conseil", "demandes_conseil", ["type_conseil"])
    op.create_index("ix_demandes_conseil_statut", "demandes_conseil", ["statut"])
    op.create_index("ix_demandes_conseil_culture", "demandes_conseil", ["culture"])
    op.create_index("ix_demandes_conseil_region", "demandes_conseil", ["region"])
    op.create_index("ix_demandes_conseil_urgence", "demandes_conseil", ["urgence"])
    op.create_index("ix_demandes_conseil_culture_region", "demandes_conseil", ["culture", "region"])

    op.create_table(
        "sessions_conseil",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("demande_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agronome_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agriculteur_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("canal", canal_session_conseil_enum, nullable=False, server_default="CHAT"),
        sa.Column("statut", statut_session_conseil_enum, nullable=False, server_default="PLANIFIEE"),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("duree_minutes", sa.Integer(), nullable=True),
        sa.Column("notes_agronome", sa.Text(), nullable=True),
        sa.Column("compte_rendu", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "duree_minutes IS NULL OR duree_minutes >= 0",
            name="ck_session_conseil_duree_positive",
        ),
        sa.ForeignKeyConstraint(["demande_id"], ["demandes_conseil.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["agronome_id"], ["agronomes.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["agriculteur_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sessions_conseil_demande_id", "sessions_conseil", ["demande_id"])
    op.create_index("ix_sessions_conseil_agronome_id", "sessions_conseil", ["agronome_id"])
    op.create_index("ix_sessions_conseil_agriculteur_id", "sessions_conseil", ["agriculteur_id"])
    op.create_index("ix_sessions_conseil_statut", "sessions_conseil", ["statut"])

    op.create_table(
        "plannings_culturaux",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agriculteur_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("agronome_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("demande_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("titre", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("culture", sa.String(length=100), nullable=False),
        sa.Column("variete", sa.String(length=100), nullable=True),
        sa.Column("region", sa.String(length=100), nullable=False),
        sa.Column("superficie_ha", sa.Float(), nullable=True),
        sa.Column("date_debut", sa.Date(), nullable=True),
        sa.Column("date_fin", sa.Date(), nullable=True),
        sa.Column("actif", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "superficie_ha IS NULL OR superficie_ha > 0",
            name="ck_planning_superficie_positive",
        ),
        sa.ForeignKeyConstraint(["agriculteur_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["agronome_id"], ["agronomes.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["demande_id"], ["demandes_conseil.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_plannings_culturaux_agriculteur_id", "plannings_culturaux", ["agriculteur_id"])
    op.create_index("ix_plannings_culturaux_agronome_id", "plannings_culturaux", ["agronome_id"])
    op.create_index("ix_plannings_culturaux_demande_id", "plannings_culturaux", ["demande_id"])
    op.create_index("ix_plannings_culturaux_culture", "plannings_culturaux", ["culture"])
    op.create_index("ix_plannings_culturaux_region", "plannings_culturaux", ["region"])
    op.create_index("ix_plannings_culturaux_actif", "plannings_culturaux", ["actif"])

    op.create_table(
        "operations_planning",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("planning_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("titre", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("date_prevue", sa.Date(), nullable=True),
        sa.Column("date_realisee", sa.Date(), nullable=True),
        sa.Column("statut", statut_operation_planning_enum, nullable=False, server_default="A_FAIRE"),
        sa.Column("rappel_sms", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("rappel_envoye_le", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ordre", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["planning_id"], ["plannings_culturaux.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("planning_id", "ordre", name="uq_operation_planning_ordre"),
    )
    op.create_index("ix_operations_planning_planning_id", "operations_planning", ["planning_id"])
    op.create_index("ix_operations_planning_date_prevue", "operations_planning", ["date_prevue"])
    op.create_index("ix_operations_planning_statut", "operations_planning", ["statut"])


def downgrade() -> None:
    op.drop_index("ix_operations_planning_statut", table_name="operations_planning")
    op.drop_index("ix_operations_planning_date_prevue", table_name="operations_planning")
    op.drop_index("ix_operations_planning_planning_id", table_name="operations_planning")
    op.drop_table("operations_planning")

    op.drop_index("ix_plannings_culturaux_actif", table_name="plannings_culturaux")
    op.drop_index("ix_plannings_culturaux_region", table_name="plannings_culturaux")
    op.drop_index("ix_plannings_culturaux_culture", table_name="plannings_culturaux")
    op.drop_index("ix_plannings_culturaux_demande_id", table_name="plannings_culturaux")
    op.drop_index("ix_plannings_culturaux_agronome_id", table_name="plannings_culturaux")
    op.drop_index("ix_plannings_culturaux_agriculteur_id", table_name="plannings_culturaux")
    op.drop_table("plannings_culturaux")

    op.drop_index("ix_sessions_conseil_statut", table_name="sessions_conseil")
    op.drop_index("ix_sessions_conseil_agriculteur_id", table_name="sessions_conseil")
    op.drop_index("ix_sessions_conseil_agronome_id", table_name="sessions_conseil")
    op.drop_index("ix_sessions_conseil_demande_id", table_name="sessions_conseil")
    op.drop_table("sessions_conseil")

    op.drop_index("ix_demandes_conseil_culture_region", table_name="demandes_conseil")
    op.drop_index("ix_demandes_conseil_urgence", table_name="demandes_conseil")
    op.drop_index("ix_demandes_conseil_region", table_name="demandes_conseil")
    op.drop_index("ix_demandes_conseil_culture", table_name="demandes_conseil")
    op.drop_index("ix_demandes_conseil_statut", table_name="demandes_conseil")
    op.drop_index("ix_demandes_conseil_type_conseil", table_name="demandes_conseil")
    op.drop_index("ix_demandes_conseil_agronome_id", table_name="demandes_conseil")
    op.drop_index("ix_demandes_conseil_agriculteur_id", table_name="demandes_conseil")
    op.drop_table("demandes_conseil")

    op.drop_index("ix_agronomes_statut", table_name="agronomes")
    op.drop_index("ix_agronomes_user_id", table_name="agronomes")
    op.drop_table("agronomes")

    op.execute("DROP TYPE IF EXISTS statut_operation_planning_enum")
    op.execute("DROP TYPE IF EXISTS statut_session_conseil_enum")
    op.execute("DROP TYPE IF EXISTS canal_session_conseil_enum")
    op.execute("DROP TYPE IF EXISTS statut_demande_conseil_enum")
    op.execute("DROP TYPE IF EXISTS type_conseil_enum")
    op.execute("DROP TYPE IF EXISTS statut_agronome_enum")
