# GPS Tracker

A self-hosted, open-source web application for real-time GPS tracking of IoT devices via cellular connectivity (ESP32 + SIM7080G). Target audience: hobbyists, small businesses, and developers who want full control over their tracking data.

## Architecture

```
iot/              →  api/       →  db/
(ESP32 + SIM7080G)    (Go)          (PostgreSQL)
                         ↑
                    frontend/
                    (Astro + React)
```

### IoT Layer
- **ESP32** microcontrollers with **SIM7080G** LTE/NB-IoT modules report GPS coordinates over the cellular network.

### Backend (`backend/`)
- **Go** API built with **Fiber v3**, following **Hexagonal Architecture** (Ports & Adapters).
- Domain-driven layering: `domain/` → `app/` → `infra/postgres/` + `transport/http/`.
- **PostgreSQL 16** with time-series location data partitioned monthly (pg_partman), append-only, 12-month retention.
- Role-based access control: `owner`, `editor`, `viewer`, `super_admin`.
- Soft deletes on users, devices, and API keys.

### Frontend (`frontend/`)
- **Astro 6** + **React 19** (Islands Architecture).
- Pure CSS design system (no Tailwind, no CSS-in-JS).
- `better-auth` for authentication, Nano Stores for shared client state.
- Multi-language support (English / Spanish).
- i18n routing (`/[lan]/`).

### Infrastructure
- **Docker Compose** for local development: PostgreSQL, migrations, and API service.
- Real-time location updates via SSE (planned).

## Tech Stack

| Layer | Technology |
|---|---|
| IoT | ESP32, SIM7080G (LTE/NB-IoT) |
| Backend | Go 1.26, Fiber v3, pgx/v5, sqlc |
| Frontend | Astro 6.4, React 19, TypeScript |
| Database | PostgreSQL 16, pg_partman, pg_cron |
| Auth | JWT + JWKS (Authula), better-auth |
| Infrastructure | Docker Compose |

## Data Model

- **Users** own or are granted access to **Devices**
- **Devices** report GPS **Locations** (immutable, append-only time-series)
- **API Keys** per device (bcrypt-hashed) for IoT ingestion
- Locations partitioned by month, automatically dropped after 12 months

## Getting Started

```bash
cp .env.example .env
docker compose up -d
```

The API runs on `http://localhost:8080`. See `backend/README.md` and `frontend/README.md` for detailed setup.
