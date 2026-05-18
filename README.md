# Medium Clone API

A simple REST API for a Medium-style blog, built with NestJS, TypeORM, PostgreSQL, and JWT authentication.

## Main Features

- Register, login, and update the current user
- Create, edit, delete, list, and read articles
- Add comments to articles
- Favorite articles
- Follow author profiles
- Manage article tags

## Tech Stack

- NestJS
- TypeScript
- TypeORM
- PostgreSQL
- JWT authentication

## API Endpoints

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/users` | Register |
| `POST` | `/users/login` | Login |
| `GET` | `/user` | Current user |
| `PUT` | `/user` | Update current user |
| `GET` | `/articles` | List articles |
| `GET` | `/articles/feed` | Articles from followed authors |
| `POST` | `/articles` | Create article |
| `GET` | `/articles/:slug` | Read article |
| `PUT` | `/articles/:slug` | Update article |
| `DELETE` | `/articles/:slug` | Delete article |
| `POST` | `/articles/:slug/comments` | Add comment |
| `DELETE` | `/articles/:slug/comments/:id` | Delete comment |
| `POST` | `/articles/:slug/favorite` | Favorite article |
| `DELETE` | `/articles/:slug/favorite` | Unfavorite article |
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
│   ├── article/
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
npm run start:dev
```

The project uses TypeORM `synchronize: true`, so database tables are created automatically while developing.

## Environment Variables

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=password
DB_NAME=mediumclone
JWT_SECRET=change-me
```

## Scripts

```bash
npm run build
npm run start:dev
npm run lint
npm run format
```
