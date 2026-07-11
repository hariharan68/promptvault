"""Add users.token_version for access-token revocation."""

from alembic import op
import sqlalchemy as sa


revision = "20260714_token_version"
down_revision = "20260713_oauth_login"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("token_version", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("users", "token_version")
