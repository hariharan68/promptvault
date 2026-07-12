"""Refresh-token families, reuse detection, and session policy."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260715_refresh_families"
down_revision = "20260714_token_version"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- refresh_tokens: family / rotation / policy columns -----------------
    op.add_column("refresh_tokens", sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("refresh_tokens", sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column(
        "refresh_tokens",
        sa.Column("session_policy", sa.Text(), server_default="persistent", nullable=False),
    )
    op.add_column(
        "refresh_tokens",
        sa.Column("last_used_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
    )
    op.add_column("refresh_tokens", sa.Column("replaced_at", sa.DateTime(), nullable=True))
    op.add_column("refresh_tokens", sa.Column("revoke_reason", sa.Text(), nullable=True))

    # Backfill existing rows: each becomes its own single-token family, and
    # last_used_at inherits created_at. Then lock family_id NOT NULL.
    op.execute("UPDATE refresh_tokens SET family_id = id WHERE family_id IS NULL")
    op.execute("UPDATE refresh_tokens SET last_used_at = created_at")
    op.alter_column("refresh_tokens", "family_id", existing_type=postgresql.UUID(as_uuid=True), nullable=False)

    op.create_foreign_key(
        "fk_refresh_tokens_parent",
        "refresh_tokens",
        "refresh_tokens",
        ["parent_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_rt_family", "refresh_tokens", ["family_id"])
    op.create_index(
        "ix_rt_user_active",
        "refresh_tokens",
        ["user_id"],
        postgresql_where=sa.text("revoked_at IS NULL AND replaced_at IS NULL"),
    )

    # --- security_events: audit trail for reuse detection ------------------
    op.create_table(
        "security_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("event_type", sa.Text(), nullable=False),
        sa.Column("detail", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_security_events_family_id", "security_events", ["family_id"])


def downgrade() -> None:
    op.drop_index("ix_security_events_family_id", table_name="security_events")
    op.drop_table("security_events")

    op.drop_index("ix_rt_user_active", table_name="refresh_tokens")
    op.drop_index("ix_rt_family", table_name="refresh_tokens")
    op.drop_constraint("fk_refresh_tokens_parent", "refresh_tokens", type_="foreignkey")
    op.drop_column("refresh_tokens", "revoke_reason")
    op.drop_column("refresh_tokens", "replaced_at")
    op.drop_column("refresh_tokens", "last_used_at")
    op.drop_column("refresh_tokens", "session_policy")
    op.drop_column("refresh_tokens", "parent_id")
    op.drop_column("refresh_tokens", "family_id")
