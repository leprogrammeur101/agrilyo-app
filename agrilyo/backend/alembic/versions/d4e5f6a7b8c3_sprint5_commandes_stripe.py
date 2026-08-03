"""sprint5_commandes_paiement_stripe

Revision ID: d4e5f6a7b8c3
Revises: c3d4e5f6a7b2
Create Date: 2026-06-09

Ajoute les tables Sprint 5 pour les commandes Semences et Stripe :
  - panier_items_semences
  - commandes_semences
  - lignes_commandes_semences
  - paiements_semences
  - transactions_stripe
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "d4e5f6a7b8c3"
down_revision = "c3d4e5f6a7b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    statut_commande_semences_enum = postgresql.ENUM(
        "BROUILLON",
        "CONFIRMEE",
        "EN_ATTENTE_PAIEMENT",
        "PAYEE",
        "ANNULEE",
        "ECHEC_PAIEMENT",
        "EN_PREPARATION",
        "LIVREE",
        name="statut_commande_semences_enum",
        create_type=True,
    )
    statut_paiement_semences_enum = postgresql.ENUM(
        "INITIE",
        "EN_ATTENTE",
        "REUSSI",
        "ECHOUE",
        "ANNULE",
        "REMBOURSE",
        name="statut_paiement_semences_enum",
        create_type=True,
    )
    provider_paiement_enum = postgresql.ENUM(
        "STRIPE",
        name="provider_paiement_enum",
        create_type=True,
    )
    type_transaction_stripe_enum = postgresql.ENUM(
        "CHECKOUT_SESSION",
        "PAYMENT_INTENT",
        "WEBHOOK_EVENT",
        name="type_transaction_stripe_enum",
        create_type=True,
    )
    unite_stock_enum = postgresql.ENUM(
        name="unite_stock_enum",
        create_type=False,
    )

    op.create_table(
        "panier_items_semences",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantite", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["produit_id"], ["produits_semences.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "produit_id", name="uq_panier_user_produit"),
        sa.CheckConstraint("quantite > 0", name="ck_panier_quantite_positive"),
    )
    op.create_index("ix_panier_items_semences_user_id", "panier_items_semences", ["user_id"])
    op.create_index("ix_panier_items_semences_produit_id", "panier_items_semences", ["produit_id"])

    op.create_table(
        "commandes_semences",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("acheteur_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reference", sa.String(length=40), nullable=False),
        sa.Column(
            "statut",
            statut_commande_semences_enum,
            nullable=False,
            server_default="BROUILLON",
        ),
        sa.Column("devise", sa.String(length=3), nullable=False, server_default="XOF"),
        sa.Column("montant_total", sa.Float(), nullable=False, server_default="0"),
        sa.Column("nombre_lignes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("nom_contact", sa.String(length=200), nullable=True),
        sa.Column("telephone_contact", sa.String(length=20), nullable=True),
        sa.Column("region_livraison", sa.String(length=100), nullable=True),
        sa.Column("ville_livraison", sa.String(length=100), nullable=True),
        sa.Column("adresse_livraison", sa.Text(), nullable=True),
        sa.Column("note_client", sa.Text(), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["acheteur_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reference", name="uq_commandes_semences_reference"),
        sa.CheckConstraint("montant_total >= 0", name="ck_commande_montant_total_positif"),
        sa.CheckConstraint("nombre_lignes >= 0", name="ck_commande_nombre_lignes_positif"),
    )
    op.create_index("ix_commandes_semences_acheteur_id", "commandes_semences", ["acheteur_id"])
    op.create_index("ix_commandes_semences_reference", "commandes_semences", ["reference"])
    op.create_index("ix_commandes_semences_statut", "commandes_semences", ["statut"])

    op.create_table(
        "lignes_commandes_semences",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("commande_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("produit_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("fournisseur_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantite", sa.Float(), nullable=False),
        sa.Column("prix_unitaire_snapshot", sa.Float(), nullable=False),
        sa.Column("montant_ligne", sa.Float(), nullable=False),
        sa.Column("produit_nom_snapshot", sa.String(length=200), nullable=False),
        sa.Column("produit_variete_snapshot", sa.String(length=200), nullable=True),
        sa.Column("culture_snapshot", sa.String(length=100), nullable=False),
        sa.Column("unite_stock_snapshot", unite_stock_enum, nullable=False),
        sa.Column("fournisseur_nom_snapshot", sa.String(length=200), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["commande_id"], ["commandes_semences.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["fournisseur_id"], ["fournisseurs_semences.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["produit_id"], ["produits_semences.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.CheckConstraint("quantite > 0", name="ck_ligne_commande_quantite_positive"),
        sa.CheckConstraint(
            "prix_unitaire_snapshot >= 0",
            name="ck_ligne_commande_prix_positif",
        ),
        sa.CheckConstraint("montant_ligne >= 0", name="ck_ligne_commande_montant_positif"),
    )
    op.create_index("ix_lignes_commandes_semences_commande_id", "lignes_commandes_semences", ["commande_id"])
    op.create_index("ix_lignes_commandes_semences_produit_id", "lignes_commandes_semences", ["produit_id"])
    op.create_index("ix_lignes_commandes_semences_fournisseur_id", "lignes_commandes_semences", ["fournisseur_id"])

    op.create_table(
        "paiements_semences",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("commande_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", provider_paiement_enum, nullable=False, server_default="STRIPE"),
        sa.Column("statut", statut_paiement_semences_enum, nullable=False, server_default="INITIE"),
        sa.Column("devise", sa.String(length=3), nullable=False, server_default="XOF"),
        sa.Column("montant", sa.Float(), nullable=False),
        sa.Column("stripe_checkout_session_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_payment_intent_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
        sa.Column("checkout_url", sa.Text(), nullable=True),
        sa.Column("initiated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failure_code", sa.String(length=100), nullable=True),
        sa.Column("failure_message", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["commande_id"], ["commandes_semences.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "stripe_checkout_session_id",
            name="uq_paiements_semences_stripe_checkout_session_id",
        ),
        sa.CheckConstraint("montant >= 0", name="ck_paiement_semences_montant_positif"),
    )
    op.create_index("ix_paiements_semences_commande_id", "paiements_semences", ["commande_id"])
    op.create_index("ix_paiements_semences_statut", "paiements_semences", ["statut"])
    op.create_index(
        "ix_paiements_semences_stripe_checkout_session_id",
        "paiements_semences",
        ["stripe_checkout_session_id"],
    )
    op.create_index(
        "ix_paiements_semences_stripe_payment_intent_id",
        "paiements_semences",
        ["stripe_payment_intent_id"],
    )

    op.create_table(
        "transactions_stripe",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("commande_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("paiement_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("type_transaction", type_transaction_stripe_enum, nullable=False),
        sa.Column("stripe_event_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_checkout_session_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_payment_intent_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_event_type", sa.String(length=120), nullable=True),
        sa.Column("montant", sa.Float(), nullable=True),
        sa.Column("devise", sa.String(length=3), nullable=True),
        sa.Column("statut_stripe", sa.String(length=100), nullable=True),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.ForeignKeyConstraint(["commande_id"], ["commandes_semences.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["paiement_id"], ["paiements_semences.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("stripe_event_id", name="uq_transactions_stripe_event_id"),
        sa.CheckConstraint(
            "montant IS NULL OR montant >= 0",
            name="ck_transaction_stripe_montant_positif",
        ),
    )
    op.create_index("ix_transactions_stripe_commande_id", "transactions_stripe", ["commande_id"])
    op.create_index("ix_transactions_stripe_paiement_id", "transactions_stripe", ["paiement_id"])
    op.create_index("ix_transactions_stripe_type_transaction", "transactions_stripe", ["type_transaction"])
    op.create_index("ix_transactions_stripe_stripe_event_id", "transactions_stripe", ["stripe_event_id"])
    op.create_index(
        "ix_transactions_stripe_stripe_checkout_session_id",
        "transactions_stripe",
        ["stripe_checkout_session_id"],
    )
    op.create_index(
        "ix_transactions_stripe_stripe_payment_intent_id",
        "transactions_stripe",
        ["stripe_payment_intent_id"],
    )
    op.create_index("ix_transactions_stripe_event_type", "transactions_stripe", ["stripe_event_type"])


def downgrade() -> None:
    op.drop_index("ix_transactions_stripe_event_type", table_name="transactions_stripe")
    op.drop_index("ix_transactions_stripe_stripe_payment_intent_id", table_name="transactions_stripe")
    op.drop_index("ix_transactions_stripe_stripe_checkout_session_id", table_name="transactions_stripe")
    op.drop_index("ix_transactions_stripe_stripe_event_id", table_name="transactions_stripe")
    op.drop_index("ix_transactions_stripe_type_transaction", table_name="transactions_stripe")
    op.drop_index("ix_transactions_stripe_paiement_id", table_name="transactions_stripe")
    op.drop_index("ix_transactions_stripe_commande_id", table_name="transactions_stripe")
    op.drop_table("transactions_stripe")

    op.drop_index("ix_paiements_semences_stripe_payment_intent_id", table_name="paiements_semences")
    op.drop_index("ix_paiements_semences_stripe_checkout_session_id", table_name="paiements_semences")
    op.drop_index("ix_paiements_semences_statut", table_name="paiements_semences")
    op.drop_index("ix_paiements_semences_commande_id", table_name="paiements_semences")
    op.drop_table("paiements_semences")

    op.drop_index("ix_lignes_commandes_semences_fournisseur_id", table_name="lignes_commandes_semences")
    op.drop_index("ix_lignes_commandes_semences_produit_id", table_name="lignes_commandes_semences")
    op.drop_index("ix_lignes_commandes_semences_commande_id", table_name="lignes_commandes_semences")
    op.drop_table("lignes_commandes_semences")

    op.drop_index("ix_commandes_semences_statut", table_name="commandes_semences")
    op.drop_index("ix_commandes_semences_reference", table_name="commandes_semences")
    op.drop_index("ix_commandes_semences_acheteur_id", table_name="commandes_semences")
    op.drop_table("commandes_semences")

    op.drop_index("ix_panier_items_semences_produit_id", table_name="panier_items_semences")
    op.drop_index("ix_panier_items_semences_user_id", table_name="panier_items_semences")
    op.drop_table("panier_items_semences")

    op.execute("DROP TYPE IF EXISTS type_transaction_stripe_enum")
    op.execute("DROP TYPE IF EXISTS provider_paiement_enum")
    op.execute("DROP TYPE IF EXISTS statut_paiement_semences_enum")
    op.execute("DROP TYPE IF EXISTS statut_commande_semences_enum")
