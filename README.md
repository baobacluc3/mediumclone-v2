# Publishing API

REST API built with NestJS, TypeORM, PostgreSQL, JWT authentication, Swagger, and migrations.

## Stack

- NestJS 10
- TypeScript
- PostgreSQL
- TypeORM
- JWT
- argon2
- Swagger
- Jest

## Features

- User registration, login, and profile update
- JWT-protected routes
- Articles, comments, favorites, and personalized feed
- Tags with pagination and soft delete
- Swagger docs
- Health check endpoint

## Setup

### Install dependencies

```bash
npm install
```

### Create environment file

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

### Create database

```bash
psql -U postgres -c "CREATE DATABASE publishing_api;"
```

### Run migrations

```bash
npm run migration:run
```

### Start development server

```bash
npm run start:dev
```

## Endpoints

- API base: `http://localhost:3000/api/v1`
- Swagger docs: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/api/v1/health`

## Scripts

```bash
npm run build
npm run start:dev
npm run migration:run
npm run migration:revert
npm run test
npm run test:cov
```

## Example Environment

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=your-postgres-password
DB_NAME=publishing_api
JWT_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```
