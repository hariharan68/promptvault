# 14 — Redesign & Auth Fix Changes

All changes made during the OAuth fix and landing page redesign session.

---

## 1. OAuth 2.0 Fix — GitHub PKCE Removed

**File:** `backend/app/services/oauth_service.py`

GitHub OAuth Apps do not support PKCE. The old code was sending `code_challenge` and `code_challenge_method` in the authorization URL and `code_verifier` in the token exchange — GitHub silently rejected this and returned `{"error":"bad_verification_code"}` with HTTP 200, so `raise_for_status()` never caught it, causing every GitHub login to fail.

- Removed `code_challenge` and `code_challenge_method` from GitHub's authorization URL params
- Removed `code_verifier` from GitHub's token exchange POST body
- Google PKCE left intact (Google supports it correctly)

---

## 2. OAuth Promise Singleton Fix

**File:** `frontend/src/api/authApi.js`

The `oauthCompletionPromise` module-level singleton only reset to `null` in `.catch()` (on failure). After a successful OAuth login the promise stayed resolved forever, so any subsequent OAuth attempt in the same session would return the stale result.

- Changed `.catch` reset to `.finally` reset so the singleton clears after both success and failure

---

## 3. AuthContext Session Restoration Fix

**File:** `frontend/src/context/AuthContext.jsx`

`AuthContext` was calling `completeOAuthSession()` on every app boot for session restoration — coupling general refresh logic to the OAuth-specific singleton.

- Replaced `completeOAuthSession()` with a direct `refresh().then(...)` chain for boot-time session restoration
- `completeOAuthSession` is now only called by `OAuthCallbackPage`

---

## 4. Landing Page — New File

**File:** `frontend/src/pages/LandingPage.jsx` *(created)*

Full marketing page built from scratch using the existing design system (plum `#714B67`, Inter + Source Serif 4, Phosphor icons, Tailwind CSS v4). No new npm packages added. Sections:

- **Sticky dark nav** — logo, Features / How it works / Pricing anchor links, Sign in + Get started CTA, mobile hamburger drawer
- **Hero** — dark `#1A1B22` background, animated headline + subtext + CTA buttons, static product mockup (browser chrome with 3 mock prompt cards that animate in)
- **Problem section** — 3 pain point cards: "Lost in chat history", "Rebuilt from memory", "No version control"
- **Features grid** — 6 cards: Instant ⌘K search, Version history, Template variables, Usage analytics, Groups & tags, Import/Export
- **Use cases** — 3 scenario cards: Agent development, Prompt engineering, LLM app development (each with a tool stack badge row)
- **How it works** — 3-step strip with a connecting gradient line on desktop
- **Pricing** — Free beta (highlighted, active) + Pro $7/month (grayed out, "Coming soon" disabled button)
- **CTA banner** — dark background, repeat sign-up push
- **Footer** — logo, nav links, copyright

All sections use scroll-triggered `whileInView` fade-in animations via `motion/react`.

---

## 5. Routing Restructure

**File:** `frontend/src/App.jsx`

- Added `HomeGate` component: shows a dark spinner while auth loads, redirects logged-in users to `/dashboard`, shows `LandingPage` for guests
- Changed `/` from a `ProtectedRoute` wrapper to `<Route path="/" element={<HomeGate />} />`
- Converted the app layout route to a **pathless layout route** — child paths `dashboard`, `prompts`, `groups`, `settings`, `trash` still resolve to their absolute URLs correctly
- Removed the old `<Route index element={<Navigate to="/dashboard" replace />} />` (now handled by `HomeGate`)
- Added `LandingPage` import

**New routing flow:**

```
/                → HomeGate
                    ├── loading  → dark spinner
                    ├── guest    → LandingPage
                    └── authed   → /dashboard (redirect)

/login           → LoginPage
/register        → RegisterPage
/oauth/callback  → OAuthCallbackPage

(pathless layout: ProtectedRoute → AppLayout)
  /dashboard     → DashboardPage
  /prompts       → PromptsPage
  /groups        → GroupsPage
  /settings      → SettingsPage
  /trash         → TrashPage
```

---

## 6. Logout Redirect Fix

**File:** `frontend/src/components/common/Navbar.jsx`

- `handleLogout` now calls `navigate("/")` instead of `navigate("/login")` — after signing out, users land on the landing page

---

## 7. Back-to-Home Links on Auth Pages

**Files:** `frontend/src/pages/LoginPage.jsx`, `frontend/src/pages/RegisterPage.jsx`

- Added a small `← Back to home` link (React Router `<Link to="/">`) above the page heading in the right-hand form panel on both pages

---

## 8. SEO Meta Tags

**File:** `frontend/index.html`

- Updated `<title>` to `PromptNest — AI Prompt Library for Developers`
- Added `<meta name="description">`
- Added Open Graph tags: `og:type`, `og:title`, `og:description`, `og:site_name`
- Added Twitter Card tags: `twitter:card`, `twitter:title`, `twitter:description`

---

## 9. Icon Fix

**File:** `frontend/src/pages/LandingPage.jsx`

- `CurlyBraces` does not exist in `@phosphor-icons/react` v2.1.10 — replaced with the correct export name `BracketsCurly`

---

## 10. Port Change — Frontend 5173 → 3000, Backend 8002 → 8080

| File | Change |
|---|---|
| `frontend/vite.config.js` | `port: 5173 → 3000`, proxy target `8002 → 8080` |
| `frontend/.env` | Added `VITE_OAUTH_API_BASE_URL=http://127.0.0.1:8080/api/v1` |
| `frontend/.env.example` | Updated `VITE_OAUTH_API_BASE_URL` port |
| `backend/.env` | Added `CORS_ORIGINS`, `FRONTEND_URL`, `OAUTH_FRONTEND_CALLBACK_URL`, all OAuth redirect URIs with new ports |
| `backend/.env.example` | All port references updated |
| `Docs/13_OAuth_Setup.md` | All port references updated |

**New access URLs:**

| Service | URL |
|---|---|
| Frontend | `http://127.0.0.1:3000` |
| Backend API | `http://127.0.0.1:8080` |
| Google OAuth callback | `http://127.0.0.1:8080/api/v1/auth/oauth/google/callback` |
| GitHub OAuth callback | `http://127.0.0.1:8080/api/v1/auth/oauth/github/callback` |

> If using OAuth, update the redirect URIs in Google Cloud Console and GitHub OAuth App settings to match the new port `8080`.
