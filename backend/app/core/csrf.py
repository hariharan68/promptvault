from urllib.parse import urlparse

from fastapi import HTTPException, Request, status

from app.core.config import TRUSTED_ORIGINS


def _origin_of(value: str) -> str | None:
    """Reduce an Origin or Referer header to its ``scheme://host[:port]`` form.

    Referer carries a path (and maybe query); Origin does not. Comparing only the
    scheme+netloc lets one check cover both headers. Returns None for values that
    don't parse to an absolute origin (e.g. the literal "null").
    """
    parsed = urlparse(value)
    if not parsed.scheme or not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"


def require_trusted_origin(request: Request) -> None:
    """Reject cross-site requests to cookie-authenticated, state-changing routes.

    The refresh cookie is sent automatically by the browser, so `SameSite=Lax`
    is the first CSRF line of defense — but SameSite semantics can shift with a
    future deployment change (a shared parent domain, a proxy). An explicit
    Origin check is ~10 lines and removes that dependency entirely.

    Matched exactly against TRUSTED_ORIGINS (not `startswith`) so a lookalike
    like ``http://localhost:3000.evil.com`` cannot slip through. A missing Origin
    *and* Referer is treated as untrusted: real browser fetch/XHR POSTs always
    send at least one.
    """
    raw = request.headers.get("origin") or request.headers.get("referer")
    origin = _origin_of(raw) if raw else None
    if origin is None or origin not in TRUSTED_ORIGINS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Untrusted origin")
