"""Case-insensitive email uniqueness (lower(email) unique index) + normalize existing rows."""

from alembic import op
import sqlalchemy as sa


revision = "20260716_email_lower_unique"
down_revision = "20260715_refresh_families"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()

    # Pre-flight: refuse to migrate if any emails collide case-insensitively.
    # Creating the unique index would fail mid-migration; failing here with a
    # readable list lets an operator resolve the duplicates by hand first.
    duplicates = conn.execute(
        sa.text(
            "SELECT lower(btrim(email)) AS e, count(*) AS c "
            "FROM users GROUP BY lower(btrim(email)) HAVING count(*) > 1"
        )
    ).fetchall()
    if duplicates:
        listed = ", ".join(f"{row.e} (x{row.c})" for row in duplicates)
        raise RuntimeError(
            "Refusing to add ux_users_email_lower: case-insensitive duplicate "
            f"emails exist and must be resolved manually first: {listed}"
        )

    # Canonicalize stored rows so they match what registration/login now write.
    op.execute("UPDATE users SET email = lower(btrim(email)) WHERE email <> lower(btrim(email))")

    # Drop the old case-sensitive UNIQUE constraint (auto-named users_email_key);
    # the functional index below becomes the sole authority on email uniqueness.
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key")

    op.create_index(
        "ux_users_email_lower",
        "users",
        [sa.text("lower(email)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ux_users_email_lower", table_name="users")
    op.create_unique_constraint("users_email_key", "users", ["email"])
