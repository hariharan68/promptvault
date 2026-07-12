# Google and GitHub OAuth setup

PromptNest now supports Google and GitHub login through the backend OAuth
authorization-code flow. Provider access tokens are used only to read the verified
identity and are not stored. PromptNest creates its normal rotating refresh-cookie
session after the callback succeeds.

## 1. Local URLs

Use these exact development URLs:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8000`
- Google callback: `http://127.0.0.1:8000/api/v1/auth/oauth/google/callback`
- GitHub callback: `http://127.0.0.1:8000/api/v1/auth/oauth/github/callback`

Do not mix `localhost` and `127.0.0.1` in OAuth configuration. Cookies are
host-scoped, so every configured local URL should use the same hostname.

## 2. Create Google credentials

1. Open Google Cloud Console and select or create a project.
2. Open **Google Auth Platform** and configure the consent screen.
3. Choose the appropriate audience. While the app is in testing, add your Google
   account as a test user.
4. Open **Clients**, create a client, and choose **Web application**.
5. Add this authorized redirect URI exactly:
   `http://127.0.0.1:8000/api/v1/auth/oauth/google/callback`
6. Copy the client ID and client secret into `backend/.env`.

PromptNest requests only `openid`, `email`, and `profile`.

## 3. Create GitHub credentials

1. In GitHub, open **Settings**.
2. Open **Developer settings** > **OAuth Apps**.
3. Select **New OAuth App**.
4. Set **Homepage URL** to `http://127.0.0.1:3000`.
5. Set **Authorization callback URL** exactly to:
   `http://127.0.0.1:8000/api/v1/auth/oauth/github/callback`
6. Register the app, generate a client secret, and copy the client ID and secret
   into `backend/.env`.

PromptNest requests only `read:user` and `user:email`. A verified GitHub email is
required.

## 4. Configure environment files

Add these values to `backend/.env`:

```env
FRONTEND_URL=http://127.0.0.1:3000
OAUTH_FRONTEND_CALLBACK_URL=http://127.0.0.1:3000/oauth/callback

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/api/v1/auth/oauth/google/callback

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://127.0.0.1:8000/api/v1/auth/oauth/github/callback
```

Set these values in `frontend/.env`:

```env
VITE_API_BASE_URL=/api/v1
VITE_OAUTH_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Never commit real client secrets. Restart both servers after changing environment
files because the settings are loaded at startup.

## 5. Apply and run

From `backend`:

```powershell
uv sync
uv run alembic upgrade head
uv run app.py
```

From `frontend` in another terminal:

```powershell
npm run dev
```

Open `http://127.0.0.1:3000/login`, then test both provider buttons.

## 6. Production checklist

- Create separate production OAuth clients instead of reusing development clients.
- Configure exact HTTPS callback URLs in Google and GitHub.
- Set `COOKIE_SECURE=true`.
- Set `FRONTEND_URL`, `OAUTH_FRONTEND_CALLBACK_URL`, `CORS_ORIGINS`,
  `VITE_API_BASE_URL`, and `VITE_OAUTH_API_BASE_URL` to production HTTPS URLs.
- Keep the frontend and API under the same registrable domain when possible, for
  example `app.example.com` and `api.example.com`.
- Store provider client secrets in the hosting platform's secret manager.
- Publish the Google consent screen when the app is ready for users outside the test list.
