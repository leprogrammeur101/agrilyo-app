"""sprint2_foncier_annonces_documents_contrats

Revision ID: b2c3d4e5f6a1
Revises: a1b2c3d4e5f6
Create Date: 2026-06-03

Crée les tables du Sprint 2 — Module M1 Foncier :
  - annonces_foncieres
  - documents_fonciers
  - threads_fonciers
  - messages_fonciers
  - contrats_fonciers
  - litiges_fonciers
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision      = "b2c3d4e5f6a1"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on    = None


def upgrade() -> None:

    # ── Enums ─────────────────────────────────────────────────────────────────
    type_acces_enum = postgresql.ENUM(
        "LOCATION", "VENTE", "METAYAGE", "AMODIATION",
        name="type_acces_enum", create_type=True,
    )
    statut_juridique_enum = postgresql.ENUM(
        "COUTUMIER", "CF", "TF", "INCONNU",
        name="statut_juridique_enum", create_type=True,
    )
    badge_securite_enum = postgresql.ENUM(
        "NON_VERIFIE", "COUTUMIER_DECLARE", "CF_VERIFIE", "TF_VERIFIE",
        name="badge_securite_enum", create_type=True,
    )
    statut_annonce_enum = postgresql.ENUM(
        "ACTIVE", "INACTIVE", "EN_ATTENTE", "LOUE",
        name="statut_annonce_enum", create_type=True,
    )
    statut_contrat_enum = postgresql.ENUM(
        "BROUILLON", "SIGNE", "EXPIRE", "RESILIE",
        name="statut_contrat_enum", create_type=True,
    )
    statut_litige_enum = postgresql.ENUM(
        "OUVERT", "MEDIATION", "RESOLU", "ESCALADE",
        name="statut_litige_enum", create_type=True,
    )

    # ── annonces_foncieres ────────────────────────────────────────────────────
    op.create_table(
        "annonces_foncieres",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("bailleur_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type_acces", type_acces_enum, nullable=False),
        sa.Column("superficie_ha", sa.Float(), nullable=False),
        sa.Column("prix_indicatif", sa.Float(), nullable=True),
        sa.Column("region", sa.String(100), nullable=False),
        sa.Column("sous_prefecture", sa.String(100), nullable=True),
        sa.Column("village", sa.String(100), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("statut_juridique", statut_juridique_enum, nullable=False,
                  server_default="INCONNU"),
        sa.Column("badge", badge_securite_enum, nullable=False,
                  server_default="NON_VERIFIE"),
        sa.Column("badge_note", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("culture_anterieure", sa.String(200), nullable=True),
        sa.Column("equipements", sa.Text(), nullable=True),
        sa.Column("statut", statut_annonce_enum, nullable=False,
                  server_default="EN_ATTENTE"),
        sa.Column("vues", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["bailleur_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_annonces_bailleur_id", "annonces_foncieres", ["bailleur_id"])
    op.create_index("ix_annonces_region", "annonces_foncieres", ["region"])

    # ── documents_fonciers ────────────────────────────────────────────────────
    op.create_table(
        "documents_fonciers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("annonce_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type_document", sa.String(50), nullable=False),
        sa.Column("nom_fichier", sa.String(255), nullable=False),
        sa.Column("url_stockage", sa.String(512), nullable=False),
        sa.Column("taille_bytes", sa.Integer(), nullable=True),
        sa.Column("est_public", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["annonce_id"], ["annonces_foncieres.id"],
                                ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_documents_annonce_id", "documents_fonciers", ["annonce_id"])

    # ── threads_fonciers ──────────────────────────────────────────────────────
    op.create_table(
        "threads_fonciers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("annonce_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("demandeur_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("est_actif", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["annonce_id"], ["annonces_foncieres.id"],
                                ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["demandeur_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_threads_annonce_id", "threads_fonciers", ["annonce_id"])
    op.create_index("ix_threads_demandeur_id", "threads_fonciers", ["demandeur_id"])

    # ── messages_fonciers ─────────────────────────────────────────────────────
    op.create_table(
        "messages_fonciers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("thread_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("auteur_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contenu", sa.Text(), nullable=False),
        sa.Column("lu", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["thread_id"], ["threads_fonciers.id"],
                                ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["auteur_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_messages_thread_id", "messages_fonciers", ["thread_id"])

    # ── contrats_fonciers ─────────────────────────────────────────────────────
    op.create_table(
        "contrats_fonciers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("annonce_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("locataire_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("bailleur_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type_contrat", sa.String(50), nullable=False),
        sa.Column("date_debut", sa.DateTime(timezone=True), nullable=True),
        sa.Column("date_fin", sa.DateTime(timezone=True), nullable=True),
        sa.Column("montant_fcfa", sa.Float(), nullable=True),
        sa.Column("statut", statut_contrat_enum, nullable=False,
                  server_default="BROUILLON"),
        sa.Column("signe_bailleur", sa.Boolean(), nullable=False,
                  server_default="false"),
        sa.Column("signe_locataire", sa.Boolean(), nullable=False,
                  server_default="false"),
        sa.Column("hash_sha256", sa.String(64), nullable=True),
        sa.Column("horodatage", sa.DateTime(timezone=True), nullable=True),
        sa.Column("url_pdf", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["annonce_id"], ["annonces_foncieres.id"],
                                ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["locataire_id"], ["users.id"],
                                ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["bailleur_id"], ["users.id"],
                                ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("annonce_id"),
    )
    op.create_index("ix_contrats_annonce_id", "contrats_fonciers", ["annonce_id"])

    # ── litiges_fonciers ──────────────────────────────────────────────────────
    op.create_table(
        "litiges_fonciers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("contrat_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("declarant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("admin_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("statut", statut_litige_enum, nullable=False,
                  server_default="OUVERT"),
        sa.Column("resolution", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["contrat_id"], ["contrats_fonciers.id"],
                                ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["declarant_id"], ["users.id"],
                                ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["admin_id"], ["users.id"],
                                ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("contrat_id"),
    )
    op.create_index("ix_litiges_contrat_id", "litiges_fonciers", ["contrat_id"])


def downgrade() -> None:
    op.drop_index("ix_litiges_contrat_id",   table_name="litiges_fonciers")
    op.drop_table("litiges_fonciers")

    op.drop_index("ix_contrats_annonce_id",  table_name="contrats_fonciers")
    op.drop_table("contrats_fonciers")

    op.drop_index("ix_messages_thread_id",   table_name="messages_fonciers")
    op.drop_table("messages_fonciers")

    op.drop_index("ix_threads_demandeur_id", table_name="threads_fonciers")
    op.drop_index("ix_threads_annonce_id",   table_name="threads_fonciers")
    op.drop_table("threads_fonciers")

    op.drop_index("ix_documents_annonce_id", table_name="documents_fonciers")
    op.drop_table("documents_fonciers")

    op.drop_index("ix_annonces_region",      table_name="annonces_foncieres")
    op.drop_index("ix_annonces_bailleur_id", table_name="annonces_foncieres")
    op.drop_table("annonces_foncieres")

    op.execute("DROP TYPE IF EXISTS statut_litige_enum")
    op.execute("DROP TYPE IF EXISTS statut_contrat_enum")
    op.execute("DROP TYPE IF EXISTS statut_annonce_enum")
    op.execute("DROP TYPE IF EXISTS badge_securite_enum")
    op.execute("DROP TYPE IF EXISTS statut_juridique_enum")
    op.execute("DROP TYPE IF EXISTS type_acces_enum")