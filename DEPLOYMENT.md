# Deployment (Render + Neon + Vercel)

Everything deploys from this GitHub repo — no CLI needed. All three services
have a free tier.

## 1. Database — Neon

1. Sign up at https://neon.tech (GitHub login works).
2. Create a project (name it `mediumclone`, pick a region near your users).
3. Copy the **connection string** from the dashboard
   (`postgres://...@...neon.tech/neondb?sslmode=require`).

## 2. Backend — Render

1. Sign up at https://render.com and connect your GitHub account.
2. **New → Blueprint**, pick `baobacluc3/mediumclone-v2`. Render reads
   [render.yaml](render.yaml) and proposes the `mediumclone-api` web service.
3. When prompted for env vars:
   - `DATABASE_URL` → the Neon connection string
   - `ALLOWED_ORIGINS` → leave blank for now; set after step 3
4. Deploy. Migrations run automatically on boot (`MIGRATIONS_RUN=true`).
5. Note the service URL, e.g. `https://mediumclone-api.onrender.com`.
   Verify: `https://mediumclone-api.onrender.com/api/health`.

## 3. Frontend — Vercel

1. Sign up at https://vercel.com and import `baobacluc3/mediumclone-v2`.
2. Set **Root Directory** to `frontend` (framework auto-detects as Vite).
3. Add env var `VITE_API_URL` = the Render URL (no `/api` suffix, no
   trailing slash), e.g. `https://mediumclone-api.onrender.com`.
4. Deploy and note the URL, e.g. `https://mediumclone.vercel.app`.

## 4. Connect them

Back in Render → `mediumclone-api` → Environment, set:

```
ALLOWED_ORIGINS=https://<your-app>.vercel.app
```

Save; Render redeploys. Done.

## Notes

- The free Render service sleeps after ~15 min idle; the first request
  afterwards takes ~50 s to cold-start.
- New commits to `master` auto-deploy on both Render and Vercel.
- First admin: set `RBAC_BOOTSTRAP_ADMIN_EMAIL` on Render to the email of a
  registered user to grant it the admin role on next boot.
