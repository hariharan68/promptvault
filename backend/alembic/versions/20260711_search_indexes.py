"""Add full-text search and collection indexes."""
from alembic import op

revision = "20260711_search_indexes"
down_revision = "20260710_hardening"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("""
        ALTER TABLE prompts
        ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
            to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(prompt_content, ''))
        ) STORED
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_prompts_search_vector ON prompts USING gin (search_vector)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prompt_tags_prompt_tag ON prompt_tags (prompt_id, tag_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_prompt_tags_prompt_tag")
    op.execute("DROP INDEX IF EXISTS ix_prompts_search_vector")
    op.execute("ALTER TABLE prompts DROP COLUMN IF EXISTS search_vector")
