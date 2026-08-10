"""sprint7_password

Revision ID: f6a7b8c9d0e5
Revises: e5f6a7b8c9d4
Create Date: 2026-08-05

Ajoute la colonne password_hash sur users :
  - Flow : inscription/connexion par OTP SMS, puis création d'un mot de passe
    (une seule fois). Les connexions suivantes se font par numéro + mot de passe.
  - Nullable : les comptes qui n'ont pas encore défini de mot de passe continuent
    à passer par l'OTP (requires_password_setup=true dans la réponse verify-otp).
"""

from alembic import op
import sqlalchemy as sa


revision = "f6a7b8c9d0e5"
down_revision = "e5f6a7b8c9d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "password_hash")