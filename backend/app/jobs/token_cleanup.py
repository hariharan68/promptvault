"""Token hygiene job (Codex #19).

Run on a schedule (cron / systemd timer / container job):

    uv run python -m app.jobs.token_cleanup

Deletes long-dead refresh tokens and spent OAuth transactions, and reports users
whose live-token count looks like a leak. Everything is idempotent and safe to
run repeatedly.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken
from app.models.oauth_transaction import OAuthTransaction
from app.models.link_challenge import LinkChallenge

logger = logging.getLogger(__name__)

# Keep dead rows around a while for incident forensics before purging.
RETENTION_DAYS = 30
# Live-token count above which a single account likely indicates token leakage.
LEAK_ALERT_THRESHOLD = 50


@dataclass
class CleanupResult:
    deleted_refresh_tokens: int
    deleted_oauth_transactions: int
    deleted_link_challenges: int
    leak_suspects: list[tuple[str, int]]  # (user_id, live_token_count)


def run_cleanup(db: Session, now: datetime | None = None) -> CleanupResult:
    now = now or datetime.utcnow()
    cutoff = now - timedelta(days=RETENTION_DAYS)

    # Refresh tokens that have been revoked or expired for longer than the
    # retention window are of no further forensic value.
    deleted_rt = (
        db.query(RefreshToken)
        .filter(
            or_(
                RefreshToken.revoked_at < cutoff,
                RefreshToken.expires_at < cutoff,
            )
        )
        .delete(synchronize_session=False)
    )

    # OAuth transactions are single-use and short-lived; anything already expired
    # can go immediately (consumed rows expire on their own TTL too).
    deleted_txn = (
        db.query(OAuthTransaction)
        .filter(OAuthTransaction.expires_at < now)
        .delete(synchronize_session=False)
    )

    # Link challenges are single-use and short-lived; drop anything past its TTL.
    deleted_challenges = (
        db.query(LinkChallenge)
        .filter(LinkChallenge.expires_at < now)
        .delete(synchronize_session=False)
    )

    # Leak indicator: an unusually large number of simultaneously live families
    # for one user (each live family = one active tip token).
    leak_suspects = [
        (str(user_id), count)
        for user_id, count in (
            db.query(RefreshToken.user_id, func.count(RefreshToken.id))
            .filter(
                RefreshToken.revoked_at.is_(None),
                RefreshToken.replaced_at.is_(None),
                RefreshToken.expires_at > now,
            )
            .group_by(RefreshToken.user_id)
            .having(func.count(RefreshToken.id) > LEAK_ALERT_THRESHOLD)
            .all()
        )
    ]

    db.commit()
    return CleanupResult(
        deleted_refresh_tokens=deleted_rt,
        deleted_oauth_transactions=deleted_txn,
        deleted_link_challenges=deleted_challenges,
        leak_suspects=leak_suspects,
    )


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        result = run_cleanup(db)
    finally:
        db.close()

    logger.info(
        "token cleanup: deleted %d refresh tokens, %d oauth transactions, %d link challenges",
        result.deleted_refresh_tokens,
        result.deleted_oauth_transactions,
        result.deleted_link_challenges,
    )
    for user_id, count in result.leak_suspects:
        logger.warning("LEAK ALERT: user %s has %d live sessions (> %d)", user_id, count, LEAK_ALERT_THRESHOLD)


if __name__ == "__main__":
    main()
