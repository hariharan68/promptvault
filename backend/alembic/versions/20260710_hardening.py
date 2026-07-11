"""Add hardening constraints, indexes, and refresh-token storage."""
from alembic import op

revision = "20260710_hardening"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            revoked_at TIMESTAMP NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_groups_user_name ON groups (user_id, name)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_user_name ON tags (user_id, name)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prompts_user_created ON prompts (user_id, created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prompts_user_deleted ON prompts (user_id, deleted_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prompts_user_favorite ON prompts (user_id, is_favorite)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prompts_group ON prompts (group_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user ON refresh_tokens (user_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_refresh_tokens_user")
    op.execute("DROP INDEX IF EXISTS ix_prompts_group")
    op.execute("DROP INDEX IF EXISTS ix_prompts_user_favorite")
    op.execute("DROP INDEX IF EXISTS ix_prompts_user_deleted")
    op.execute("DROP INDEX IF EXISTS ix_prompts_user_created")
    op.execute("DROP INDEX IF EXISTS uq_tags_user_name")
    op.execute("DROP INDEX IF EXISTS uq_groups_user_name")
