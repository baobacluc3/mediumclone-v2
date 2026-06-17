# Medium Clone API

A REST API for a Medium-style publishing platform, built with NestJS, TypeORM, PostgreSQL, Redis caching, JWT access tokens, and refresh token rotation.

## Main Features

- Register, login, refresh tokens, and logout
- Update the current user
- Admin user deletion and role management
- Create, edit, delete, list, and read posts
- Add and delete comments
- Favorite and unfavorite posts
- Follow author profiles
- Manage post tags with role-based access control
- Redis caching for frequently read resources

## Tech Stack

- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- Redis
- JWT authentication
- Refresh token rotation
- Role-based access control

## API Endpoints

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register and receive access/refresh tokens |
| `POST` | `/auth/login` | Login and receive access/refresh tokens |
| `POST` | `/auth/refresh` | Rotate refresh token and receive new tokens |
| `POST` | `/auth/logout` | Revoke the current user's refresh token |
| `GET` | `/auth/profile` | Current auth profile |
| `GET` | `/user` | Current user |
| `PUT` | `/user` | Update current user |
| `DELETE` | `/users/:id` | Delete user |
| `PATCH` | `/users/:id/roles` | Update user roles |
| `GET` | `/posts` | List posts |
| `GET` | `/posts/feed` | Posts from followed authors |
| `POST` | `/posts` | Create post |
| `GET` | `/posts/:slug` | Read post |
| `PUT` | `/posts/:slug` | Update post |
| `DELETE` | `/posts/:slug` | Delete post |
| `POST` | `/posts/:slug/comments` | Add comment |
| `DELETE` | `/posts/:slug/comments/:id` | Delete comment |
| `POST` | `/posts/:slug/favorite` | Favorite post |
| `DELETE` | `/posts/:slug/favorite` | Unfavorite post |
| `GET` | `/profiles/:username` | Read profile |
| `POST` | `/profiles/:username/follow` | Follow profile |
| `DELETE` | `/profiles/:username/follow` | Unfollow profile |
| `GET` | `/tags` | List tags |
| `POST` | `/tags` | Create tag |
| `PUT` | `/tags/:id` | Update tag |
| `DELETE` | `/tags/:id` | Delete tag |

## Project Structure

```text
src/
auth/        # JWT strategy, auth endpoints, roles, and permissions
cache/       # Redis cache integration
comment/     # Comment entities, policies, and routes
common/      # Shared decorators, guards, interceptors, and pipes
database/    # TypeORM configuration
posts/       # Article entities, DTOs, service, and routes
profile/     # Author profile and follow routes
tag/         # Tag entities, DTOs, service, and routes
user/        # Current-user, admin user, and role-management routes
app.module.ts
main.ts
```

Feature code is grouped by domain under `src`, while cross-cutting authentication and request helpers live in `src/auth` and `src/common`.

## Setup

```bash
npm install
cp .env.example .env
docker run --name mediumclone-redis -p 6379:6379 -d redis:7-alpine
npm run start:dev
```

The project uses TypeORM `synchronize: true` by default for local development, so database tables are created automatically while developing.

Redis is used as a cache for frequently read post and tag endpoints. If Redis is not running, the API logs a warning and continues by reading directly from PostgreSQL.

## Environment Variables

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=password
DB_NAME=mediumclone
JWT_SECRET=change-me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-too
JWT_REFRESH_EXPIRES_IN=7d
CACHE_ENABLED=true
REDIS_URL=redis://localhost:6379
```

Set `CACHE_ENABLED=false` if you want to temporarily bypass Redis while debugging.

## Scripts

```bash
npm run build
npm run start:dev
npm run lint
npm run format
```
