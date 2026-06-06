"""sprint1_auth_users_otp_codes

Revision ID: a1b2c3d4e5f6
Revises: 
Create Date: 2026-06-02

Crée les tables users et otp_codes (Sprint 1 Auth)
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "a1b2c3d4e5f6"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_status_enum = postgresql.ENUM(
        "PENDING", "ACTIVE", "SUSPENDED", "BANNED",
        name="user_status_enum",
        create_type=True,
    )
    otp_purpose_enum = postgresql.ENUM(
        "REGISTRATION", "LOGIN", "PHONE_CHANGE", "DOCUMENT_SIGN",
        name="otp_purpose_enum",
        create_type=True,
    )

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("phone_number", sa.String(20), nullable=False,
                  comment="Format E.164 : +2250700000000"),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("first_name", sa.String(100), nullable=True),
        sa.Column("last_name", sa.String(100), nullable=True),
        sa.Column("display_name", sa.String(200), nullable=True),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("region", sa.String(100), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("roles", postgresql.ARRAY(sa.String()), nullable=False),
        sa.Column("status", user_status_enum, nullable=False, server_default="PENDING"),
        sa.Column("phone_verified", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("refresh_token_hash", sa.String(255), nullable=True),
        sa.Column("language", sa.String(5), nullable=False, server_default="fr"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("phone_number"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_phone_number", "users", ["phone_number"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "otp_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("code_hash", sa.String(255), nullable=False),
        sa.Column("purpose", otp_purpose_enum, nullable=False, server_default="LOGIN"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_used", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_otp_codes_user_id", "otp_codes", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_otp_codes_user_id", table_name="otp_codes")
    op.drop_table("otp_codes")
    op.drop_index("ix_users_phone_number", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS otp_purpose_enum")
    op.execute("DROP TYPE IF EXISTS user_status_enum")