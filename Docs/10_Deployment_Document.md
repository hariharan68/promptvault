# Deployment Document
# PromptNest

**Version:** 1.0  
**Date:** 2026-07-09

---

## 1. Deployment Environments

| Environment | Purpose | Status |
|---|---|---|
| Local Development | Developer machine | Active (current) |
| Staging | Pre-production testing | Not configured |
| Production | Live user-facing deployment | Not configured |

This document covers **Local Development** in detail and provides a blueprint for production deployment.

---

## 2. Local Development Setup

### 2.1 Prerequisites

| Software | Version | Required For |
|---|---|---|
| Python | 3.11+ | Backend |
| uv | latest | Backend package/venv manager |
| Node.js | 18+ | Frontend |
| npm | 9+ | Frontend dependencies |
| PostgreSQL | 14+ | Database |
| Git | any | Version control |

### 2.2 Database Setup

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create the database
CREATE DATABASE promptnest;

-- Verify
\l
```

The schema is managed with **Alembic migrations**. After creating the empty database, apply the schema with `uv run alembic upgrade head` (see §2.3).

**Connection string (backend/.env):**
```
DATABASE_URL=postgresql://postgres:admin@localhost:5432/promptnest
```

Update `postgres:admin` to match your PostgreSQL username and password.

### 2.3 Backend Setup

The backend uses **uv** for dependency and environment management (declared in `pyproject.toml`). `uv run` auto-creates the `.venv` and installs everything on first use — no manual venv activation needed.

```bash
# Navigate to backend directory
cd PromptNest/backend

# Create backend/.env (minimum two required values)
#   DATABASE_URL=postgresql://postgres:admin@localhost:5432/promptnest
#   SECRET_KEY=<a long random secret>

# Install dependencies + apply database migrations
uv sync
uv run alembic upgrade head

# Start the server (port 8000, autoreload)
uv run app.py
```

`app.py` is the entry point; it reads `HOST`, `PORT`, and `RELOAD` from the environment (defaults `127.0.0.1`, `8000`, `true`).

**Verify:**
- `http://127.0.0.1:8000/` → `{"message": "PromptNest backend is running"}`
- `http://127.0.0.1:8000/health` → `{"status": "healthy"}`
- `http://127.0.0.1:8000/db-test` → `{"message": "Database connection successful"}`
- `http://127.0.0.1:8000/docs` → Swagger UI

### 2.4 Frontend Setup

```bash
# Navigate to frontend directory
cd PromptNest/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Verify:**
- `http://localhost:3000` → PromptNest login page

### 2.5 Running Tests

```bash
# Backend must be running on port 8000, then from the backend directory:
uv run python test_api.py

# Unit / integration tests:
uv run pytest
```

Expected output:
```
Results: 73 passed | 0 failed | 73 total
All tests passed. PromptNest backend is working correctly.
```

---

## 3. Backend Requirements

Dependencies are declared in **`backend/pyproject.toml`** and locked in **`backend/uv.lock`** (a `requirements.txt` is also kept for pip-only environments).

```toml
dependencies = [
    "fastapi",
    "uvicorn[standard]",
    "sqlalchemy",
    "psycopg2-binary",
    "python-dotenv",
    "pydantic",
    "pydantic-settings",
    "alembic",
    "email-validator",
    "passlib[bcrypt]",
    "bcrypt<4.1",
    "python-jose[cryptography]",
    "httpx",
]
```

**Key package purposes:**
| Package | Purpose |
|---|---|
| fastapi | Web framework and automatic OpenAPI docs |
| uvicorn[standard] | ASGI server (with websockets + watchfiles reload) |
| sqlalchemy | ORM for database operations |
| alembic | Database schema migrations |
| psycopg2-binary | PostgreSQL driver for Python |
| python-dotenv | Load `.env` file into environment |
| pydantic | Request/response validation and serialization |
| email-validator | Email format validation in Pydantic |
| passlib[bcrypt] + bcrypt<4.1 | Password hashing (bcrypt pinned for passlib compatibility) |
| python-jose[cryptography] | JWT encode/decode |
| httpx | OAuth token/profile exchange (Google, GitHub) |

---

## 4. Frontend Dependencies

**File:** `frontend/package.json`

**Runtime:**
| Package | Purpose |
|---|---|
| react / react-dom (18) | UI library |
| react-router-dom (6) | Client-side routing |
| axios | HTTP client |
| swr | Data fetching / caching |
| motion | Animation (Framer Motion) |
| @phosphor-icons/react | Icons |
| @fontsource-variable/inter, source-serif-4 | Fonts |

**Dev:**
| Package | Purpose |
|---|---|
| vite (8) | Build tool and dev server (port 3000) |
| @vitejs/plugin-react | React JSX transform for Vite |
| @tailwindcss/vite (Tailwind v4) | Styling |

---

## 5. Environment Variables

### 5.1 Backend (`backend/.env`)
```env
# Required
DATABASE_URL=postgresql://postgres:admin@localhost:5432/promptnest
SECRET_KEY=<a long random secret>

# Optional (defaults shown)
ENVIRONMENT=development        # set "production" to enforce prod safety checks
COOKIE_SECURE=false            # MUST be true in production (HTTPS)
TRUST_PROXY=false              # true only when behind a reverse proxy you control
ENABLE_DOCS=true               # Swagger/ReDoc; auto-off in production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
FRONTEND_URL=http://127.0.0.1:3000
OAUTH_FRONTEND_CALLBACK_URL=http://127.0.0.1:3000/oauth/callback

# OAuth (optional — leave blank to disable a provider)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Generate a secret key:
```python
import secrets
print(secrets.token_hex(32))
```

> In `ENVIRONMENT=production`, the backend refuses to start if `SECRET_KEY` is a
> known placeholder or shorter than 32 characters.

### 5.2 Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=/api/v1
VITE_OAUTH_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

For production, point these at your API domain (HTTPS).

---

## 6. Production Deployment Blueprint

### 6.1 Pre-Deployment Checklist

**Already implemented (verify configured for prod):**
- [x] `SECRET_KEY` loaded from environment (not hardcoded)
- [x] `CORSMiddleware` configured with explicit allowed origins
- [x] Security headers + strict CSP on all routes
- [x] Rate limiting on auth endpoints
- [x] Alembic migrations configured

**Security (set before going live):**
- [ ] `ENVIRONMENT=production` (activates the weak-secret startup guard)
- [ ] Strong, random `SECRET_KEY` (32+ chars) from a secret manager
- [ ] `COOKIE_SECURE=true` and HTTPS everywhere (TLS via Let's Encrypt / cloud)
- [ ] `CORS_ORIGINS` restricted to your real frontend origin
- [ ] `TRUST_PROXY=true` only if behind a proxy you control
- [ ] `ENABLE_DOCS=false` (Swagger/ReDoc off in production — the default)
- [ ] Strong `DATABASE_URL` credentials
- [ ] Separate production OAuth clients with HTTPS callback URLs

**Database:**
- [ ] Set up production PostgreSQL instance
- [ ] Configure automated backups
- [ ] Run `uv run alembic upgrade head` on deploy

### 6.2 Backend Production Start
```bash
# Production: no reload, explicit workers, bind all interfaces
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Or with gunicorn (add it to the project first via `uv add gunicorn`):
```bash
uv run gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 6.3 Frontend Production Build
```bash
cd frontend
npm run build
# Output: frontend/dist/ (static files)
```

Serve `dist/` with any static file host (Nginx, Vercel, Netlify, S3+CloudFront).

### 6.4 Nginx Configuration Example
```nginx
# Serve frontend static files
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/promptnest/dist;
    index index.html;

    # SPA fallback — all routes return index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to FastAPI backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6.5 Adding CORSMiddleware to `main.py`
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # or ["*"] for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 7. Database Initialization

The schema is managed by **Alembic** (migrations live in `backend/alembic/versions/`). After creating an empty `promptnest` database, apply all migrations:

```bash
cd backend
uv run alembic upgrade head
```

To create a new migration after changing a model:
```bash
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
```

---

## 8. Deployment Platforms

### Option A: VPS (DigitalOcean, AWS EC2, Linode)
- Install Python 3.11, Node 18, PostgreSQL
- Run backend with gunicorn + uvicorn workers
- Run frontend as static build served by Nginx
- Use systemd for process management
- Use Let's Encrypt for SSL

### Option B: Platform-as-a-Service
| Component | Service |
|---|---|
| Backend | Railway, Render, Heroku (Python) |
| Frontend | Vercel, Netlify, Cloudflare Pages |
| Database | Railway PostgreSQL, Supabase, Neon, ElephantSQL |

### Option C: Docker (recommended for consistency)
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY . .
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: promptnest
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - pg_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:secret@db:5432/promptnest
      SECRET_KEY: <your-secret-key>
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"

volumes:
  pg_data:
```

---

## 9. Post-Deployment Verification

```bash
# Backend health
curl https://api.yourdomain.com/health
# Expected: {"status":"healthy"}

# Database check
curl https://api.yourdomain.com/db-test
# Expected: {"message":"Database connection successful"}

# Register a test user
curl -X POST https://api.yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","email":"test@test.com","password":"testpass123"}'
# Expected: HTTP 201  (password must be 8-72 chars; username 3-50, [A-Za-z0-9_])

# Frontend
curl https://yourdomain.com
# Expected: HTML page with <title>PromptNest</title>
```
