# Complete NestJS RBAC Guide for Beginners

This guide explains the RBAC implementation in this repository as if you are preparing for backend interviews. The codebase is a NestJS API using PostgreSQL, TypeORM, Passport JWT, and a password hasher.

> Note: the existing project already used Argon2 for password hashing. I attempted to install `bcrypt`, but the registry returned `403 Forbidden`, so the runnable implementation keeps Argon2. The RBAC architecture is the same; if your environment allows bcrypt, replace the hashing functions with `bcrypt.hash()` and `bcrypt.compare()`.

## 1. Project initialization

A new NestJS project is normally created like this:

```bash
# Create a new NestJS API project from the official CLI starter.
nest new publishing-api

# Install PostgreSQL, TypeORM, JWT, Passport, validation, and bcrypt packages.
npm install @nestjs/typeorm typeorm pg @nestjs/jwt @nestjs/passport passport passport-jwt class-validator class-transformer bcrypt

# Install TypeScript types for Passport JWT and bcrypt.
npm install -D @types/passport-jwt @types/bcrypt
```

### Theory

NestJS organizes backend code into modules, controllers, providers, guards, decorators, and entities. PostgreSQL stores durable data. TypeORM maps TypeScript classes to database tables. JWT carries authenticated user identity between requests.

### Execution flow

```text
# High-level request flow.
Client -> Nest application -> Module graph -> Controller route -> Service -> TypeORM -> PostgreSQL
```

### How data moves

DTOs validate incoming request bodies. Services apply business rules. Entities describe how data is stored. Responses return safe user data, never password hashes.

### Why this approach

This keeps HTTP logic, business logic, and database logic separated, which is easier to test and easier to explain in interviews.

## 2. Professional folder structure

```text
# Professional folder structure.
src/
  auth/
    decorators/roles.decorator.ts  # Stores required roles as route metadata.
    guards/roles.guard.ts          # Reads metadata and authorizes the current user.
  common/
    role.enum.ts                   # Single source of truth for valid roles.
  rbac/
    rbac.controller.ts             # Demo routes for public, logged-in, admin, and moderator access.
    rbac.module.ts                 # Groups the RBAC demo API.
  user/
    dto/                           # Request validation classes.
    user.entity.ts                 # TypeORM user table definition.
    jwt.strategy.ts                # Validates JWTs and attaches request.user.
    jwt-auth.guard.ts              # Runs Passport JWT authentication.
    user.service.ts                # Register, login lookup, password hashing, JWT creation.
    user.controller.ts             # User HTTP endpoints.
```

### Theory

A module is a boundary. A controller receives HTTP requests. A service contains business logic. A guard decides whether a request may continue.

### Execution flow

```text
# Module and guard execution relationships.
AppModule imports UserModule and RbacModule
RbacModule imports UserModule
RbacController uses JwtAuthGuard and RolesGuard
RolesGuard uses metadata from @Roles(...)
```

### How data moves

The user module creates and validates users. The RBAC module consumes the authenticated user object from the request and checks its `role`.

### Why this approach

Authorization code is reusable. You do not copy role checks into every controller method.

## 3. User entity and roles

The user table contains identity fields and a `role` column. The roles are `admin`, `user`, and `moderator`.

```ts
// The enum prevents random role strings such as "super-person".
export enum Role {
  ADMIN = "admin",
  USER = "user",
  MODERATOR = "moderator",
}
```

### Theory

RBAC means users receive roles, and roles decide what actions are allowed.

### Execution flow

```text
# Registration data flow.
Register request -> UserService creates UserEntity -> role defaults to USER -> PostgreSQL stores role
```

### How data moves

Public registration always creates a `USER` in this implementation. To test admin or moderator routes locally, update the role in the database or add a separate admin-only role-management endpoint later.

### Why this approach

Enums make authorization safer because the compiler and validators know the allowed values.

## 4. Authentication: register and login

Authentication answers: **Who are you?**

```ts
// Registration hashes the password before saving the user.
const user = repository.create({ email, password: await hashPassword(password), role: Role.USER });

// Login verifies the plain password against the stored hash.
const isValid = await verifyPassword(storedHash, plainPassword);

// A valid login receives a signed JWT access token.
const token = jwtService.sign({ id: user.id, email: user.email, role: user.role });
```

### Theory

Never store plain passwords. Store only a password hash. JWTs are signed tokens; clients send them in the `Authorization: Bearer <token>` header.

### Execution flow

```text
# Register and login execution flow.
POST /users
  -> validate DTO
  -> hash password
  -> save user
  -> return token

POST /users/login
  -> find user with password selected
  -> verify password
  -> sign JWT
  -> return token
```

### How data moves

The password enters the service as plain text only once, becomes a hash, and the hash is stored in PostgreSQL. The JWT contains non-secret identity claims such as `id`, `email`, and `role`.

### Why this approach

Hashing protects users if a database dump leaks. JWTs allow stateless authentication without a server-side session table.

## 5. JWT validation flow

```text
# JWT validation pipeline.
Client request
  |
  | Authorization: Bearer eyJ...
  v
JwtAuthGuard
  |
  v
Passport JWT Strategy
  |
  | verify signature + expiration
  v
validate(payload)
  |
  | load user by payload.id
  v
request.user = { id, email, username, role, bio, image }
  |
  v
Controller or next guard
```

### Theory

`JwtAuthGuard` is an authentication guard. It delegates token parsing and verification to Passport and `JwtStrategy`.

### Execution flow

If the token is missing, invalid, expired, or points to a deleted user, the request stops with `401 Unauthorized`.

### How data moves

The JWT payload is decoded only after signature validation. The strategy then loads fresh user data from the database and attaches it to the request.

### Why this approach

Loading the user from the database lets the app notice deleted users or changed roles instead of blindly trusting old token claims.

## 6. Authorization: Roles decorator and RolesGuard

Authorization answers: **Are you allowed to do this?**

```ts
// The decorator stores metadata on the route handler.
@Roles(Role.ADMIN)

// The guard reads that metadata and compares it with request.user.role.
@UseGuards(JwtAuthGuard, RolesGuard)
```

### Theory

Decorators attach metadata. Metadata is extra information about a class or method. The `Reflector` reads that metadata at runtime. `ExecutionContext` gives a guard access to the current route handler, controller class, and HTTP request.

### Execution flow

```text
# Admin route authorization flow.
GET /rbac/admin
  -> JwtAuthGuard authenticates the token
  -> JwtStrategy attaches request.user
  -> RolesGuard reads @Roles(Role.ADMIN)
  -> RolesGuard checks request.user.role
  -> Controller runs only if role matches
```

### How data moves

`@Roles(Role.ADMIN)` does not execute business logic. It stores `['admin']` as metadata. `RolesGuard` later reads the metadata and compares it with `request.user.role`.

### Why this approach

Guards centralize access control. Controllers stay clean and focused on HTTP responses.

## 7. Request lifecycle diagram

```text
# NestJS request lifecycle.
Incoming HTTP request
  |
  v
Middleware
  |
  v
Guards: JwtAuthGuard -> RolesGuard
  |
  v
Interceptors before controller
  |
  v
Pipes validate and transform params/body
  |
  v
Controller method
  |
  v
Service method
  |
  v
Repository / Database
  |
  v
Interceptors after controller
  |
  v
Exception filters if an error was thrown
  |
  v
HTTP response
```

### Theory

NestJS uses a pipeline. Guards run before route handlers and before most business logic, which makes them perfect for security.

### Execution flow

Guards execute in the order listed in `@UseGuards(JwtAuthGuard, RolesGuard)`. Authentication must run before role authorization because `RolesGuard` needs `request.user`.

### How data moves

Each pipeline step can add information or stop the request. Authentication adds `request.user`. Authorization either allows the request to continue or stops it.

### Why this approach

Security checks happen early, consistently, and outside controller business logic.

## 8. Protected API examples

```http
# Public route needs no token.
GET /rbac/public

# Logged-in route needs any valid token.
GET /rbac/profile
Authorization: Bearer <access-token>

# Admin route needs a valid token and role=admin.
GET /rbac/admin
Authorization: Bearer <admin-token>

# Moderator route needs a valid token and role=moderator.
GET /rbac/moderator
Authorization: Bearer <moderator-token>
```

### Theory

Public, authenticated, and role-protected routes are different access levels.

### Execution flow

Public routes skip auth guards. Logged-in routes use only `JwtAuthGuard`. Role routes use `JwtAuthGuard` plus `RolesGuard`.

### How data moves

The token is sent in an HTTP header. Guards read it, validate it, attach a user, and then compare the user role.

### Why this approach

It is explicit and readable. Interviewers like seeing `@UseGuards(JwtAuthGuard, RolesGuard)` because the security model is visible at the route.

## 9. Common beginner mistakes

- Checking roles manually inside every controller method.
- Putting passwords inside JWT payloads.
- Trusting JWT role claims without considering stale tokens.
- Running `RolesGuard` before `JwtAuthGuard`.
- Forgetting `@Column({ select: false })` for passwords.
- Returning password hashes in API responses.
- Allowing public registration to create admins in production.
- Using `synchronize: true` in production.

## 10. Interview questions

1. What is the difference between authentication and authorization?
2. Why should guards run before controllers?
3. What is `ExecutionContext` in NestJS?
4. What does the `Reflector` read?
5. Why is role metadata stored with decorators?
6. Why should passwords be hashed instead of encrypted?
7. What happens when a JWT expires?
8. How would you revoke a JWT before it expires?
9. How do you prevent a normal user from assigning themselves `admin`?
10. How would you model many roles per user?

## 11. Production issues and scaling RBAC

In production, companies usually add more structure:

```text
# Enterprise RBAC table relationship.
User -> UserRole -> Role -> RolePermission -> Permission
```

Common enterprise patterns include admin approval workflows, audit logs, permission caches, short-lived access tokens, refresh-token rotation, and policy engines.

For microservices, companies usually validate JWTs at the API gateway and again inside sensitive services. The gateway can reject obvious unauthorized traffic, while each service still owns final authorization for its domain.

## 12. RBAC vs permission-based access control

RBAC checks a broad role such as `admin`. Permission-based access control checks a fine-grained action such as `article.delete`.

```text
# Compare broad role checks with fine-grained permission checks.
RBAC: user.role == admin
Permission-based: user.permissions contains article.delete
```

RBAC is simple and great for small systems. Permission-based authorization is better when large companies need precise access rules.
