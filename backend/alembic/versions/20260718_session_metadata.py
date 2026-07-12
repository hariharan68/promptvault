"""Session metadata on refresh tokens (device label, ip, user agent)."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260718_session_metadata"
down_revision = "20260717_oauth_transactions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("refresh_tokens", sa.Column("device_label", sa.Text(), nullable=True))
    op.add_column("refresh_tokens", sa.Column("ip_created", postgresql.INET(), nullable=True))
    op.add_column("refresh_tokens", sa.Column("user_agent", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("refresh_tokens", "user_agent")
    op.drop_column("refresh_tokens", "ip_created")
    op.drop_column("refresh_tokens", "device_label")
