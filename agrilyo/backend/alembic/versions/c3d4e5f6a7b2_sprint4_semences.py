"""sprint4_semences_fournisseurs_produits_photos_certifications_avis

Revision ID: c3d4e5f6a7b2
Revises: b2c3d4e5f6a1
Create Date: 2026-06-09

Crée les tables du Sprint 4 — Module M2 Semences & Plants :
  - fournisseurs_semences
  - produits_semences
  - photos_produits
  - certifications_produits
  - avis_produits
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision      = "c3d4e5f6a7b2"
down_revision = "b2c3d4e5f6a1"
branch_labels = None
depends_on    = None


def upgrade() -> None:

    # ── Enums ─────────────────────────────────────────────────────────────────
    statut_fournisseur_enum = postgresql.ENUM(
        "EN_ATTENTE", "VERIFIE", "SUSPENDU", "REJETE",
        name="statut_fournisseur_enum", create_type=True,
    )
    niveau_label_enum = postgresql.ENUM(
        "BRONZE", "ARGENT", "OR",
        name="niveau_label_enum", create_type=True,
    )
    type_produit_enum = postgresql.ENUM(
        "SEMENCE", "PLANT", "BOUTURE", "TUBERCULE",
        name="type_produit_enum", create_type=True,
    )
    statut_produit_enum = postgresql.ENUM(
        "ACTIF", "RUPTURE", "INACTIF", "EN_ATTENTE",
        name="statut_produit_enum", create_type=True,
    )
    unite_stock_enum = postgresql.ENUM(
        "KG", "TONNE", "UNITE", "SACHET", "BOTTE",
        name="unite_stock_enum", create_type=True,
    )
    type_certification_enum = postgresql.ENUM(
        "ANADER", "FIRCA", "MINAGRI", "ISO", "BIO", "AUTRE",
        name="type_certification_enum", create_type=True,
    )

    # ── fournisseurs_semences ─────────────────────────────────────────────────
    op.create_table(
        "fournisseurs_semences",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        # Identité commerciale
        sa.Column("nom_commercial", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("logo_url", sa.String(512), nullable=True),
        # Localisation
        sa.Column("region", sa.String(100), nullable=False),
        sa.Column("ville", sa.String(100), nullable=True),
        sa.Column("adresse_complete", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        # Contact professionnel
        sa.Column("telephone_pro", sa.String(20), nullable=True),
        sa.Column("email_pro", sa.String(255), nullable=True),
        sa.Column("site_web", sa.String(512), nullable=True),
        # Statut & vérification
        sa.Column("statut", statut_fournisseur_enum, nullable=False,
                  server_default="EN_ATTENTE"),
        sa.Column("note_admin", sa.Text(), nullable=True),
        sa.Column("verifie_le", sa.DateTime(timezone=True), nullable=True),
        # Label Ivoire Semences
        sa.Column("label_ivoire", niveau_label_enum, nullable=True),
        sa.Column("label_attribue_le", sa.DateTime(timezone=True), nullable=True),
        sa.Column("label_expire_le", sa.DateTime(timezone=True), nullable=True),
        # Stats agrégées
        sa.Column("note_moyenne", sa.Float(), nullable=False, server_default="0"),
        sa.Column("nombre_avis", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("nombre_produits_actifs", sa.Integer(), nullable=False,
                  server_default="0"),
        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_fournisseur_user_id"),
    )
    op.create_index("ix_fournisseurs_user_id",
                    "fournisseurs_semences", ["user_id"])
    op.create_index("ix_fournisseurs_region",
                    "fournisseurs_semences", ["region"])
    op.create_index("ix_fournisseurs_nom_commercial",
                    "fournisseurs_semences", ["nom_commercial"])

    # ── produits_semences ─────────────────────────────────────────────────────
    op.create_table(
        "produits_semences",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("fournisseur_id", postgresql.UUID(as_uuid=True), nullable=False),
        # Identification
        sa.Column("nom", sa.String(200), nullable=False),
        sa.Column("type_produit", type_produit_enum, nullable=False),
        sa.Column("variete", sa.String(200), nullable=True),
        sa.Column("culture", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        # Caractéristiques agronomiques
        sa.Column("duree_germination_jours", sa.Integer(), nullable=True),
        sa.Column("rendement_potentiel", sa.String(100), nullable=True),
        sa.Column("zones_adaptation", sa.Text(), nullable=True),
        sa.Column("saison_semis", sa.String(200), nullable=True),
        # Prix & stock
        sa.Column("prix_unitaire", sa.Float(), nullable=False),
        sa.Column("unite_stock", unite_stock_enum, nullable=False,
                  server_default="KG"),
        sa.Column("stock_disponible", sa.Float(), nullable=False,
                  server_default="0"),
        sa.Column("stock_minimum_commande", sa.Float(), nullable=False,
                  server_default="1"),
        # Statut
        sa.Column("statut", statut_produit_enum, nullable=False,
                  server_default="EN_ATTENTE"),
        # Stats agrégées
        sa.Column("note_moyenne", sa.Float(), nullable=False, server_default="0"),
        sa.Column("nombre_avis", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("nombre_vues", sa.Integer(), nullable=False, server_default="0"),
        # Timestamps
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(
            ["fournisseur_id"], ["fournisseurs_semences.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("prix_unitaire >= 0",
                           name="ck_produit_prix_positif"),
        sa.CheckConstraint("stock_disponible >= 0",
                           name="ck_produit_stock_positif"),
        sa.CheckConstraint("stock_minimum_commande > 0",
                           name="ck_produit_minimum_positif"),
        sa.CheckConstraint("note_moyenne >= 0 AND note_moyenne <= 5",
                           name="ck_produit_note_range"),
    )
    op.create_index("ix_produits_fournisseur_id",
                    "produits_semences", ["fournisseur_id"])
    op.create_index("ix_produits_type_produit",
                    "produits_semences", ["type_produit"])
    op.create_index("ix_produits_culture",
                    "produits_semences", ["culture"])
    op.create_index("ix_produits_nom",
                    "produits_semences", ["nom"])

    # ── photos_produits ───────────────────────────────────────────────────────
    op.create_table(
        "photos_produits",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("url_stockage", sa.String(512), nullable=False),
        sa.Column("url_miniature", sa.String(512), nullable=True),
        sa.Column("nom_fichier", sa.String(255), nullable=False),
        sa.Column("taille_bytes", sa.Integer(), nullable=True),
        sa.Column("ordre", sa.SmallInteger(), nullable=False, server_default="0"),
        sa.Column("est_principale", sa.Boolean(), nullable=False,
                  server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(
            ["produit_id"], ["produits_semences.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_photos_produit_id",
                    "photos_produits", ["produit_id"])

    # ── certifications_produits ───────────────────────────────────────────────
    op.create_table(
        "certifications_produits",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type_certification", type_certification_enum, nullable=False),
        sa.Column("numero_certificat", sa.String(100), nullable=True),
        sa.Column("organisme_delivreur", sa.String(200), nullable=True),
        sa.Column("date_delivrance", sa.DateTime(timezone=True), nullable=True),
        sa.Column("date_expiration", sa.DateTime(timezone=True), nullable=True),
        sa.Column("url_document", sa.String(512), nullable=True),
        sa.Column("est_verifie", sa.Boolean(), nullable=False,
                  server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(
            ["produit_id"], ["produits_semences.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_certifications_produit_id",
                    "certifications_produits", ["produit_id"])

    # ── avis_produits ─────────────────────────────────────────────────────────
    op.create_table(
        "avis_produits",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("auteur_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("note", sa.SmallInteger(), nullable=False),
        sa.Column("commentaire", sa.Text(), nullable=True),
        sa.Column("est_publie", sa.Boolean(), nullable=False,
                  server_default="true"),
        sa.Column("est_verifie_achat", sa.Boolean(), nullable=False,
                  server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(
            ["produit_id"], ["produits_semences.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["auteur_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("note >= 1 AND note <= 5",
                           name="ck_avis_note_range"),
    )
    op.create_index("ix_avis_produit_id",
                    "avis_produits", ["produit_id"])
    op.create_index("ix_avis_auteur_id",
                    "avis_produits", ["auteur_id"])


def downgrade() -> None:
    # Ordre inverse des FK : enfants d'abord

    op.drop_index("ix_avis_auteur_id",     table_name="avis_produits")
    op.drop_index("ix_avis_produit_id",    table_name="avis_produits")
    op.drop_table("avis_produits")

    op.drop_index("ix_certifications_produit_id",
                  table_name="certifications_produits")
    op.drop_table("certifications_produits")

    op.drop_index("ix_photos_produit_id",  table_name="photos_produits")
    op.drop_table("photos_produits")

    op.drop_index("ix_produits_nom",         table_name="produits_semences")
    op.drop_index("ix_produits_culture",     table_name="produits_semences")
    op.drop_index("ix_produits_type_produit",table_name="produits_semences")
    op.drop_index("ix_produits_fournisseur_id",
                  table_name="produits_semences")
    op.drop_table("produits_semences")

    op.drop_index("ix_fournisseurs_nom_commercial",
                  table_name="fournisseurs_semences")
    op.drop_index("ix_fournisseurs_region",  table_name="fournisseurs_semences")
    op.drop_index("ix_fournisseurs_user_id", table_name="fournisseurs_semences")
    op.drop_table("fournisseurs_semences")

    # Supprimer les types ENUM dans l'ordre inverse de création
    op.execute("DROP TYPE IF EXISTS type_certification_enum")
    op.execute("DROP TYPE IF EXISTS unite_stock_enum")
    op.execute("DROP TYPE IF EXISTS statut_produit_enum")
    op.execute("DROP TYPE IF EXISTS type_produit_enum")
    op.execute("DROP TYPE IF EXISTS niveau_label_enum")
    op.execute("DROP TYPE IF EXISTS statut_fournisseur_enum")