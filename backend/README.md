# GPS Tracker API

A Web API for managing GPS-equipped IoT devices (e.g., ESP32 modules) and ingesting/querying their location data. Built with Go, Fiber v3, and PostgreSQL.

## Architecture

Hexagonal Architecture (Ports & Adapters):

```
transport/http/  →  app/  →  domain/
     ↓                    ↑
     +------ infra/postgres/
```

- **`domain/`** — Core types and sentinel errors, zero external dependencies.
- **`app/`** — Business logic services and port interfaces (Repository).
- **`infra/postgres/`** — PostgreSQL adapters implementing port interfaces via sqlc-generated code.
- **`transport/http/`** — Fiber v3 HTTP handlers, middleware, and routing.

## Tech Stack

| Component | Library |
|---|---|
| Web Framework | [Fiber v3](https://github.com/gofiber/fiber) |
| Database | PostgreSQL with pgx/v5 pool |
| SQL Codegen | [sqlc](https://sqlc.dev) v1.31.1 |
| Validation | go-playground/validator v10 |
| UUID | google/uuid |
| Environment | joho/godotenv |

## Prerequisites

- Go 1.26.4+
- PostgreSQL (with pg_partman extension for partitioned locations)
- [sqlc](https://sqlc.dev) installed at `~/go/bin/sqlc`

## Getting Started

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your DATABASE_URL
```

### 2. Run database migrations

Use your preferred migration tool with the files in `migrations/`.

### 3. Generate SQL code

```bash
~/go/bin/sqlc generate
```

This reads SQL queries from `queries/` and the schema from `migrations/`, then generates Go code into `internal/infra/postgres/`.

### 4. Run the API

```bash
go run ./cmd/api
```

## API Endpoints

```
GET  /health

GET    /api/v1/devices
GET    /api/v1/devices/:id
POST   /api/v1/devices
PUT    /api/v1/devices/:id       (requires editor role)
DELETE /api/v1/devices/:id       (requires owner role)
```

Authentication is currently via the `X-User-Id` header (dev middleware).

## Response Format

```json
{
  "status_code": 200,
  "message": "devices retrieved",
  "data": [ ... ]
}
```

## Database

9 migration files covering: extensions (`pgcrypto`, `pg_partman`, `pg_cron`), users, devices, user-device access (role-based: owner/editor/viewer), location time-series (monthly range partitions via pg_partman), device API keys (bcrypt-hashed), and protection triggers.

Key decisions:
- **Soft deletes** on users, devices, and API keys (`deleted_at`).
- **Append-only locations** — partitions dropped for retention, no deletes.
- **RESTRICT foreign keys** — no CASCADE.
- **Partial indexes** on hot query paths (`WHERE deleted_at IS NULL`).

## Docker

```bash
docker build -t gps-tracker-api .
docker run -p 8080:8080 -e DATABASE_URL=postgres://user:pass@host:5432/gps_tracker?sslmode=disable gps-tracker-api
```
