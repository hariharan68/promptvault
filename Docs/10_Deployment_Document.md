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

The backend creates all tables automatically on first start via `Base.metadata.create_all(engine)` (or equivalent model imports in `models/__init__.py`).

**Connection string (backend/.env):**
```
DATABASE_URL=postgresql://postgres:admin@localhost:5432/promptnest
```

Update `postgres:admin` to match your PostgreSQL username and password.

### 2.3 Backend Setup

```bash
# Navigate to backend directory
cd PromptNest/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "DATABASE_URL=postgresql://postgres:admin@localhost:5432/promptnest" > .env

# Start the server
uvicorn app.main:app --reload --port 8000
```

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
# Backend must be running on port 8000
# From backend directory (with venv activated)
python test_api.py
```

Expected output:
```
Results: 73 passed | 0 failed | 73 total
All tests passed. PromptNest backend is working correctly.
```

---

## 3. Backend Requirements

**File:** `backend/requirements.txt`
```
fastapi
uvicorn
sqlalchemy
psycopg2-binary
python-dotenv
pydantic
pydantic-settings
email-validator
passlib[bcrypt]
python-jose[cryptography]
```

**Key package purposes:**
| Package | Purpose |
|---|---|
| fastapi | Web framework and automatic OpenAPI docs |
| uvicorn | ASGI server to run FastAPI |
| sqlalchemy | ORM for database operations |
| psycopg2-binary | PostgreSQL driver for Python |
| python-dotenv | Load `.env` file into environment |
| pydantic | Request/response validation and serialization |
| email-validator | Email format validation in Pydantic |
| passlib[bcrypt] | Password hashing with bcrypt |
| python-jose[cryptography] | JWT encode/decode |

---

## 4. Frontend Dependencies

**File:** `frontend/package.json`

**Runtime:**
| Package | Version | Purpose |
|---|---|---|
| react | ^18.3.1 | UI library |
| react-dom | ^18.3.1 | React DOM renderer |
| react-router-dom | ^6.24.0 | Client-side routing |
| axios | ^1.7.2 | HTTP client |

**Dev:**
| Package | Version | Purpose |
|---|---|---|
| vite | ^5.3.1 | Build tool and dev server |
| @vitejs/plugin-react | ^4.3.1 | React JSX transform for Vite |

---

## 5. Environment Variables

### 5.1 Backend (`backend/.env`)
```env
# Required
DATABASE_URL=postgresql://postgres:admin@localhost:5432/promptnest
```

**Missing (must add before production):**
```env
SECRET_KEY=<random-256-bit-hex-string>
```

Generate a secret key:
```python
import secrets
print(secrets.token_hex(32))
```

### 5.2 Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

For production, change to:
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

---

## 6. Production Deployment Blueprint

### 6.1 Pre-Deployment Checklist

**Security (REQUIRED before going live):**
- [ ] Move `SECRET_KEY` from `security.py` hardcode to environment variable
- [ ] Set a strong, random `SECRET_KEY` (32+ bytes of entropy)
- [ ] Remove test credentials from `.env` files
- [ ] Add `CORSMiddleware` to `main.py` with specific allowed origins
- [ ] Set `DATABASE_URL` password to a strong credential
- [ ] Enable HTTPS (TLS certificate via Let's Encrypt or cloud provider)

**Code fixes (REQUIRED):**
- [ ] Remove duplicate `app.include_router(auth_router)` from `main.py`
- [ ] Set `DESCRIPTION` → `description` in FastAPI constructor (lowercase key)

**Database:**
- [ ] Set up production PostgreSQL instance
- [ ] Configure automated backups
- [ ] Add database indexes (see Database Design Document §6)
- [ ] Set up Alembic for migrations

### 6.2 Backend Production Start
```bash
# Production: no --reload, explicit workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Or with gunicorn:
```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
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

There is no migration tool configured in v1. Tables are created via SQLAlchemy's `create_all` triggered by model imports.

**To initialize the database on first deploy:**
```python
# Run this once, or add to main.py startup event
from app.database import Base, engine
from app.models import *  # imports all models
Base.metadata.create_all(bind=engine)
```

**For production (recommended):** Set up Alembic:
```bash
pip install alembic
alembic init alembic
# Configure alembic.ini with DATABASE_URL
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
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
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
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
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
# Expected: HTTP 201

# Frontend
curl https://yourdomain.com
# Expected: HTML page with <title>PromptNest</title>
```
