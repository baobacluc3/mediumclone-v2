# Medium Clone API

NestJS REST API for a small Medium-style publishing app. It includes local email/password auth, JWT access tokens, refresh token rotation, posts, profiles, follows, favorites, tags, and Redis-backed read caching.

## Stack

- NestJS and TypeScript
- TypeORM with PostgreSQL
- Redis cache
- JWT auth with refresh token rotation
- Role and permission checks

## Getting Started

```bash
npm install
cp .env.example .env
docker run --name mediumclone-redis -p 6379:6379 -d redis:7-alpine
npm run start:dev
```

The API is served under `http://localhost:3000/api`.

For local development, `TYPEORM_SYNC=true` lets TypeORM create and update tables automatically. Set `TYPEORM_SYNC=false` for production-like runs and use migrations instead.

Redis is optional during development. If Redis is not available, cache reads and writes are skipped and the API continues to use PostgreSQL directly.

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

THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=100

CACHE_ENABLED=true
REDIS_URL=redis://localhost:6379
```

## Scripts

```bash
npm run build
npm run start:dev
npm run lint
npm run format
```

## Main Routes

| Method | Route | Notes |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account and issue tokens |
| `POST` | `/auth/login` | Issue tokens for an existing account |
| `POST` | `/auth/refresh` | Rotate a refresh token |
| `POST` | `/auth/logout` | Revoke the current refresh token |
| `GET` | `/user` | Read the current user |
| `PUT` | `/user` | Update the current user |
| `GET` | `/posts` | List posts |
| `GET` | `/posts/feed` | List posts from followed authors |
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
| `POST` | `/tags` | Create a tag |
| `PUT` | `/tags/:id` | Update a tag |
| `DELETE` | `/tags/:id` | Delete a tag |
