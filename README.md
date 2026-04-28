# API — NestJS

A production-ready REST API built with **NestJS**, **TypeORM**, and **PostgreSQL**. Features JWT authentication, Swagger docs, argon2 password hashing, and full CRUD for articles, comments, tags, and user profiles.

---

## Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Framework  | NestJS 10                           |
| Language   | TypeScript                          |
| Database   | PostgreSQL                          |
| ORM        | TypeORM                             |
| Auth       | JWT + argon2                        |
| Validation | class-validator / class-transformer |
| Docs       | Swagger / OpenAPI                   |
| Testing    | Jest                                |

---

## Features

- **User auth** — register, login, JWT-protected routes
- **Articles** — full CRUD, slug-based lookup, tag filtering, pagination
- **Comments** — add and delete comments per article
- **Favorites** — favorite / unfavorite articles with count tracking
- **Follow system** — follow / unfollow users, personalized feed
- **Tags** — paginated tag management with soft delete
- **Profiles** — public profile with follow status
- **Swagger UI** — interactive API docs at `/docs`

---

## Project Structure

```
src/
├── article/          # Articles, comments, favorites
│   ├── dto/
│   ├── entities/
│   ├── article.controller.ts
│   ├── article.service.ts
│   └── article.module.ts
├── profile/          # Follow/unfollow, profile view
├── tag/              # Tag CRUD with pagination
├── user/             # Auth, registration, user update
│   ├── dto/
│   ├── auth.middleware.ts
│   ├── user.decorator.ts
│   └── user.service.ts
├── shared/
│   └── pipes/        # Custom validation pipe
├── app.module.ts
└── main.ts
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

````

### 2. Install dependencies

```bash
npm install
````

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash

```

| Variable          | Description                  | Default         |
| ----------------- | ---------------------------- | --------------- |
| `PORT`            | Port the server listens on   | `3000`          |
| `NODE_ENV`        | `development` / `production` | `development`   |
| `DB_HOST`         | PostgreSQL host              | `localhost`     |
| `DB_PORT`         | PostgreSQL port              | `5432`          |
| `DB_USER`         | PostgreSQL username          | `postgres`      |
| `DB_PASS`         | PostgreSQL password          | _(required)_    |
| `DB_NAME`         | Database name                | `mediumclonev2` |
| `JWT_SECRET`      | Secret key for signing JWTs  | _(required)_    |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `*`             |

### 4. Create the database

```bash
psql -U postgres -c "CREATE DATABASE mediumclonev2;"
```

### 5. Run the application

```bash
# Development (hot reload)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`.
Swagger UI is at `http://localhost:3000/docs`.

---

## API Overview

All routes are prefixed with `/api/v1`.

### Auth

| Method | Endpoint       | Auth | Description         |
| ------ | -------------- | ---- | ------------------- |
| POST   | `/users`       | ❌   | Register a new user |
| POST   | `/users/login` | ❌   | Login, returns JWT  |
| GET    | `/user`        | ✅   | Get current user    |
| PUT    | `/user`        | ✅   | Update current user |

### Articles

| Method | Endpoint          | Auth | Description                                      |
| ------ | ----------------- | ---- | ------------------------------------------------ |
| GET    | `/articles`       | ❌   | List articles (filter by tag, author, favorited) |
| GET    | `/articles/feed`  | ✅   | Feed from followed users                         |
| GET    | `/articles/:slug` | ❌   | Get single article                               |
| POST   | `/articles`       | ✅   | Create article                                   |
| PUT    | `/articles/:slug` | ✅   | Update article                                   |
| DELETE | `/articles/:slug` | ✅   | Delete article                                   |

### Comments

| Method | Endpoint                       | Auth | Description    |
| ------ | ------------------------------ | ---- | -------------- |
| GET    | `/articles/:slug/comments`     | ❌   | Get comments   |
| POST   | `/articles/:slug/comments`     | ✅   | Add comment    |
| DELETE | `/articles/:slug/comments/:id` | ✅   | Delete comment |

### Favorites & Profiles

| Method | Endpoint                     | Auth | Description        |
| ------ | ---------------------------- | ---- | ------------------ |
| POST   | `/articles/:slug/favorite`   | ✅   | Favorite article   |
| DELETE | `/articles/:slug/favorite`   | ✅   | Unfavorite article |
| GET    | `/profiles/:username`        | ❌   | Get profile        |
| POST   | `/profiles/:username/follow` | ✅   | Follow user        |
| DELETE | `/profiles/:username/follow` | ✅   | Unfollow user      |

### Tags

| Method | Endpoint    | Auth | Description                       |
| ------ | ----------- | ---- | --------------------------------- |
| GET    | `/tags`     | ❌   | List tags (paginated, searchable) |
| GET    | `/tags/:id` | ❌   | Get tag by ID                     |
| POST   | `/tags`     | ✅   | Create tag                        |
| PUT    | `/tags/:id` | ✅   | Update tag                        |
| DELETE | `/tags/:id` | ✅   | Soft-delete tag                   |

---

## Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

---

## Security Highlights

- Passwords hashed with **argon2** (not bcrypt)
- JWT tokens expire after **7 days**
- Password column excluded from all queries by default (`select: false`)
- Generic login error message prevents **email enumeration**
- CORS configured via environment variable
- Input validation with **whitelist** mode — unknown fields are stripped and rejected

---

## Example `.env`

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=yourpassword
DB_NAME=mediumclonev2

JWT_SECRET=secret

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## Health Check

```bash
curl http://localhost:3000/api/health
# {"status":"ok","timestamp":"2026-04-28T10:00:00.000Z","uptime":42}
```

---

## License

MIT
