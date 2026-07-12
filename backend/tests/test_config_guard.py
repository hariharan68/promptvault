"""§8 #10 — production config guard refuses to boot on an insecure setup.

Runs in a subprocess so the guard's import-time RuntimeError is observed cleanly
without polluting the test process's already-imported config module.
"""
import os
import subprocess
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]


def test_production_refuses_insecure_cookie():
    env = dict(os.environ)
    env["ENVIRONMENT"] = "production"
    env["COOKIE_SECURE"] = "false"
    env["SECRET_KEY"] = "x" * 48                      # strong, so it fails on COOKIE_SECURE
    env.setdefault("DATABASE_URL", "postgresql://localhost:5432/placeholder")
    # Ensure OAuth isn't what trips the guard.
    for var in ("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"):
        env.pop(var, None)

    proc = subprocess.run(
        [sys.executable, "-c", "import app.core.config"],
        cwd=str(BACKEND_ROOT),
        env=env,
        capture_output=True,
        text=True,
    )

    assert proc.returncode != 0
    assert "COOKIE_SECURE" in proc.stderr
