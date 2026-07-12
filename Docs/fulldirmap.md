PromptNest/
│
├── backend/
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 FastAPI app, middleware, security headers, exception handlers
│   │   ├── database.py             SQLAlchemy engine & session
│   │   │
│   │   ├── core/
│   │   │   ├── config.py           env-driven settings (loads .env, prod guards)
│   │   │   ├── security.py         bcrypt hashing, JWT create/verify
│   │   │   ├── dependencies.py     get_current_user (JWT + token_version check)
│   │   │   └── rate_limit.py       sliding-window rate limiter
│   │   │
│   │   ├── models/
│   │   │   ├── user.py             includes token_version
│   │   │   ├── group.py
│   │   │   ├── prompt.py
│   │   │   ├── tag.py
│   │   │   ├── prompt_tag.py
│   │   │   ├── prompt_version.py
│   │   │   ├── refresh_token.py
│   │   │   └── oauth_account.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── user.py             password/username validation
│   │   │   ├── group.py
│   │   │   ├── prompt.py
│   │   │   ├── tag.py
│   │   │   ├── search.py
│   │   │   ├── common.py
│   │   │   └── product.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py             login, register, refresh, OAuth, sessions, account
│   │   │   ├── groups.py
│   │   │   ├── prompts.py          CRUD, versions, trash, import/export, discover, bulk
│   │   │   ├── tags.py
│   │   │   └── dashboard.py
│   │   │
│   │   └── services/
│   │       ├── auth_service.py
│   │       ├── group_service.py
│   │       ├── prompt_service.py
│   │       ├── tag_service.py
│   │       ├── dashboard_service.py
│   │       └── oauth_service.py    Google (PKCE) + GitHub authorization-code flow
│   │
│   ├── alembic/                    migrations (versions/*.py)
│   ├── alembic.ini
│   ├── app.py                      uv entry point (uvicorn runner)
│   ├── pyproject.toml              dependencies (uv)
│   ├── uv.lock                     locked dependency versions
│   ├── requirements.txt            pip fallback
│   ├── test_api.py
│   ├── .env / .env.example
│   └── .venv/                      uv-managed environment (gitignored)
│
├── frontend/
│   │
│   ├── index.html                  SEO meta tags
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                 routes: /, /docs, /login, /register, /oauth/callback, app
│   │   │
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     public marketing page
│   │   │   ├── DocsPage.jsx        public product documentation
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── OAuthCallbackPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── PromptsPage.jsx
│   │   │   ├── GroupsPage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   └── TrashPage.jsx
│   │   │
│   │   ├── components/             common, auth, prompts, groups
│   │   ├── layouts/                AppLayout
│   │   ├── context/                AuthContext, ThemeContext
│   │   ├── api/                    client (Axios), authApi, groupApi, tagApi
│   │   └── styles/                 index.css (Tailwind v4, plum tokens)
│   │
│   ├── package.json
│   ├── vite.config.js              port 3000, proxy /api → :8000
│   └── .env / .env.example
│
├── Docs/                           this documentation set
└── .gitignore
