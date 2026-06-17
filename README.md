# Medium Clone API

A simple REST API for a Medium-style blog, built with NestJS, TypeORM, PostgreSQL, Redis caching, and JWT authentication.

## Main Features

- Register, login, and update the current user
- Create, edit, delete, list, and read posts
- Add comments to posts
- Favorite posts
- Follow author profiles
- Manage post tags

## Tech Stack

- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- Redis
- JWT authentication

## API Endpoints

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/users` | Register |
| `POST` | `/users/login` | Login |
| `GET` | `/user` | Current user |
| `PUT` | `/user` | Update current user |
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
├── auth/                  # JWT strategy and auth payload types
├── common/                # Shared decorators and guards
├── database/              # Database configuration
├── modules/               # Feature modules grouped by domain
│   ├── post/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── interfaces/
│   │   └── services/
│   ├── profile/
│   ├── tag/
│   └── user/
├── app.module.ts
└── main.ts
```

Feature code is grouped by domain under `src/modules`, while cross-cutting authentication and request helpers live in `src/auth` and `src/common`.

## Setup

```bash
npm install
cp .env.example .env
docker run --name mediumclone-redis -p 6379:6379 -d redis:7-alpine
npm run start:dev
```

The project uses TypeORM `synchronize: true`, so database tables are created automatically while developing.

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
