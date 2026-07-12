from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status

from app.core.config import TRUST_PROXY

_requests: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_lock = Lock()


def _client_ip(request: Request) -> str:
    # Only honour X-Forwarded-For when explicitly told we sit behind a trusted
    # proxy; otherwise clients could spoof the header to evade limits.
    if TRUST_PROXY:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def client_ip(request: Request) -> str:
    """Public accessor for the proxy-aware client IP (also used for session metadata)."""
    return _client_ip(request)


def enforce_rate_limit(
    request: Request,
    action: str,
    limit: int,
    window_seconds: int = 60,
    identity: str | None = None,
) -> None:
    # By default limits are keyed to the client IP. Pass `identity` (e.g. a
    # normalized email) to throttle a single account across rotating IPs — the
    # defense against distributed brute force at one target.
    client = identity if identity is not None else _client_ip(request)
    key = (action, client)
    now = monotonic()
    with _lock:
        bucket = _requests[key]
        while bucket and now - bucket[0] >= window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(window_seconds)},
            )
        bucket.append(now)
