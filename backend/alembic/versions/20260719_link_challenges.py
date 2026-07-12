"""OAuth account-linking challenges (confirm before linking to a password account)."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260719_link_challenges"
down_revision = "20260718_session_metadata"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "link_challenges",
        sa.Column("challenge_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("provider_user_id", sa.String(length=255), nullable=False),
        sa.Column("email_at_link", sa.String(length=255), nullable=False),
        sa.Column("remember_me", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("provider IN ('google', 'github')", name="ck_link_challenge_provider"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("challenge_id"),
    )
    op.create_index("ix_link_challenges_expires_at", "link_challenges", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_link_challenges_expires_at", table_name="link_challenges")
    op.drop_table("link_challenges")
