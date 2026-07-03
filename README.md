# Medium Clone API

NestJS REST API for a small Medium-style publishing app. It includes local email/password auth, JWT access tokens, refresh token rotation, posts, profiles, follows, favorites, and tags.

## Stack

- NestJS and TypeScript
- TypeORM with PostgreSQL
- JWT auth with refresh token rotation
- Database-backed RBAC with CASL policy-based authorization

## Getting Started

```bash
npm install
cp .env.example .env
npm run start:dev
```

The API is served under `http://localhost:3000/api`.

For local development, `TYPEORM_SYNC=true` lets TypeORM create and update tables automatically. Set `TYPEORM_SYNC=false` for production-like runs and use migrations instead.

## Environment

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=password
DB_NAME=mediumclone
TYPEORM_SYNC=true

JWT_SECRET=change-me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-too
JWT_REFRESH_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

RBAC_BOOTSTRAP_ADMIN_EMAIL=

THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=100
```

See [`.env.example`](.env.example) for the full set.

## Scripts

```bash
npm run build
npm run start:dev
npm run lint
npm run format
npm test
```

## Authorization (RBAC)

Authorization is database-backed and policy-based.

- **Roles and permissions are data.** Roles (`role`), permissions (`permission`,
  an `action` + `subject` pair such as `create` + `Article`) and their links
  (`role_permissions`, `user_roles`) live in the database. A seeder upserts the
  default catalog on every boot, so `user`, `moderator` and `admin` always exist
  with their expected permissions. New roles can be created at runtime — no
  redeploy required.
- **CASL abilities.** On each request the caller's roles are resolved to a
  deduplicated permission set and compiled into a
  CASL ability. Role permissions are granted unconditionally; ownership rules
  ("edit your own article", "delete your own account") are added as conditional
  rules for every authenticated user, so ownership and privilege are evaluated
  uniformly.
- **Global guards + decorators.** A global `JwtAuthGuard` authenticates every
  request except those marked `@Public()`; a global `PoliciesGuard` then enforces
  `@RequirePermissions({ action, subject })` and `@CheckPolicies(...)` metadata.
  Instance-level checks (own-vs-any) run in services via the `CaslAbilityFactory`.
- **First admin.** Set `RBAC_BOOTSTRAP_ADMIN_EMAIL` to an existing user's email
  to have the seeder grant them the `admin` role on boot.

Defaults: `user` can create articles (and manage their own); `moderator` adds
tag management; `admin` holds every permission, including role administration.

## Main Routes

| Method | Route | Notes |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account and issue tokens |
| `POST` | `/auth/login` | Issue tokens for an existing account |
| `POST` | `/auth/refresh` | Rotate a refresh token |
| `POST` | `/auth/logout` | Revoke the current refresh token |
| `GET` | `/user` | Read the current user |
| `PUT` | `/user` | Update the current user |
| `GET` | `/user/permissions` | Read the caller's effective roles and abilities |
| `GET` | `/posts` | List posts |
| `POST` | `/posts` | Create a post |
| `GET` | `/posts/:slug` | Read a post |
| `PUT` | `/posts/:slug` | Update a post |
| `DELETE` | `/posts/:slug` | Delete a post |
| `POST` | `/posts/:slug/favorite` | Favorite a post |
| `DELETE` | `/posts/:slug/favorite` | Remove a favorite |
| `GET` | `/profiles/:username` | Read an author profile |
| `POST` | `/profiles/:username/follow` | Follow an author |
| `DELETE` | `/profiles/:username/follow` | Unfollow an author |
| `GET` | `/tags` | List tags |
| `POST` | `/tags` | Create a tag (requires `manage:Tag`) |
| `PUT` | `/tags/:id` | Update a tag (requires `manage:Tag`) |
| `DELETE` | `/tags/:id` | Delete a tag (requires `manage:Tag`) |
| `PATCH` | `/users/:id/roles` | Set a user's roles (requires `manage:Role`) |
| `GET` | `/admin/permissions` | List the permission catalog (requires `read:Role`) |
| `GET` | `/admin/roles` | List roles (requires `read:Role`) |
| `POST` | `/admin/roles` | Create a role (requires `manage:Role`) |
| `GET` | `/admin/roles/:id` | Read a role (requires `read:Role`) |
| `PATCH` | `/admin/roles/:id` | Update role metadata (requires `manage:Role`) |
| `PUT` | `/admin/roles/:id/permissions` | Replace a role's permissions (requires `manage:Role`) |
| `DELETE` | `/admin/roles/:id` | Delete a non-system role (requires `manage:Role`) |
