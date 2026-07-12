"""Server-side OAuth transactions (replay protection + multi-tab)."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260717_oauth_transactions"
down_revision = "20260716_email_lower_unique"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "oauth_transactions",
        sa.Column("txn_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("state", sa.Text(), nullable=False),
        sa.Column("pkce_verifier", sa.Text(), nullable=False),
        sa.Column("remember_me", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint("provider IN ('google', 'github')", name="ck_oauth_txn_provider"),
        sa.PrimaryKeyConstraint("txn_id"),
        sa.UniqueConstraint("state", name="uq_oauth_txn_state"),
    )
    # Cleanup job / expiry sweeps filter on expires_at.
    op.create_index("ix_oauth_txn_expires_at", "oauth_transactions", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_oauth_txn_expires_at", table_name="oauth_transactions")
    op.drop_table("oauth_transactions")
