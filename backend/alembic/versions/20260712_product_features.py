"""Add prompt versions and reusable template variables."""
from alembic import op

revision = "20260712_product_features"
down_revision = "20260711_search_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE prompts ADD COLUMN IF NOT EXISTS variables JSONB NOT NULL DEFAULT '{}'::jsonb")
    op.execute("""
        CREATE TABLE IF NOT EXISTS prompt_versions (
            id UUID PRIMARY KEY,
            prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            version_number INTEGER NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT NULL,
            prompt_content TEXT NOT NULL,
            group_id UUID NULL,
            is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
            variables JSONB NOT NULL DEFAULT '{}'::jsonb,
            tags JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (prompt_id, version_number)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_prompt_versions_prompt ON prompt_versions (prompt_id, version_number DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prompt_versions_user ON prompt_versions (user_id, created_at DESC)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_prompt_versions_user")
    op.execute("DROP INDEX IF EXISTS ix_prompt_versions_prompt")
    op.execute("DROP TABLE IF EXISTS prompt_versions")
    op.execute("ALTER TABLE prompts DROP COLUMN IF EXISTS variables")
