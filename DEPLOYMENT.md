# Deployment (Render + Neon)

Live URLs:

- **App**: https://mediumclone-frontend.onrender.com
- **API**: https://mediumclone-api.onrender.com/api (health: `/api/health`)

Both services deploy from this GitHub repo and auto-deploy on every push to
`master`. The database is a free-tier Postgres on [Neon](https://neon.tech).

## Architecture

| Piece    | Where  | What                                                        |
| -------- | ------ | ----------------------------------------------------------- |
| Frontend | Render static site (`mediumclone-frontend`) | `frontend/` built with Vite, SPA rewrite `/* → /index.html` |
| API      | Render web service (`mediumclone-api`)      | `npm ci --include=dev && npm run build`, `node dist/main`   |
| Database | Neon (ap-southeast-1)                       | wired via `DATABASE_URL`; migrations run on boot (`MIGRATIONS_RUN=true`) |

[render.yaml](render.yaml) mirrors this setup as a Blueprint, so the stack can
be recreated from scratch with **New → Blueprint** in the Render dashboard
(only `DATABASE_URL` needs pasting in).

## Environment variables (API service)

```
NODE_ENV=production
DATABASE_URL=<Neon connection string>
DB_SSL=true
MIGRATIONS_RUN=true
JWT_SECRET / JWT_REFRESH_SECRET  (generated)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://mediumclone-frontend.onrender.com
```

The frontend build gets `VITE_API_URL=https://mediumclone-api.onrender.com`.

## Notes

- The free API service sleeps after ~15 min idle; the first request afterwards
  takes ~50 s to cold-start.
- First admin: set `RBAC_BOOTSTRAP_ADMIN_EMAIL` on the API service to the email
  of a registered user to grant it the admin role on next boot.
- The frontend also deploys cleanly to Vercel/Netlify if ever needed
  (`frontend/vercel.json` carries the SPA rewrite for Vercel).
