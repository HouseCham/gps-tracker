# Project Overview — GPS Tracker

> Instructions for an agent tasked with generating a `PROMPT.md` for **OpenDesign**, a specialized AI agent that generates UI artifacts (HTML+CSS). This document describes the fullstack project so the agent can craft an informed, context-aware prompt. Read everything before writing the prompt.

---

## 1. Project Identity

**GPS Tracker** is a self-hosted, open-source web application for real-time GPS tracking of IoT devices (ESP32 + SIM7080G with cellular connectivity). Target audience: hobbyists, small businesses, and developers who want full control over their tracking data.

**Core model:**

- **Users** can own or be granted access to **Devices**
- Each **Device** reports GPS **Locations** (append-only time-series, monthly partitions)
- **Roles:** `owner` (full CRUD), `editor` (update + read), `viewer` (read only), `super_admin` (manage everything)
- Locations are immutable, partitioned by month, 12-month retention

---

## 2. Fullstack Tech Stack

| Layer          | Technology                                               |
| -------------- | -------------------------------------------------------- |
| Frontend       | Astro 6.4.6 + React 19 (Islands Architecture)            |
| Styling        | CSS only — no Tailwind, no CSS-in-JS                     |
| HTTP client    | `@better-fetch/fetch` (wraps fetch)                      |
| Auth client    | `better-auth` 1.6.18                                     |
| Icons          | Lucide (`@lucide/astro` + `lucide-react`)                |
| State (shared) | Nano Stores (Astro-recommended)                          |
| Backend        | Go 1.26 + Fiber v3 (hexagonal architecture)              |
| Database       | PostgreSQL 16 with pg_partman + pg_cron                  |
| Real-time      | SSE (planned, not yet implemented)                       |
| Auth strategy  | JWT + JWKS via Authula (backend), better-auth (frontend) |
| Infrastructure | Docker Compose (db, migrate, api services)               |

---

## 3. Frontend Structure (Current State)

```
frontend/
├── src/
│   ├── components/
│   │   └── astro/
│   │       └── layout/
│   │           └── MainLayout.astro      ← only existing component
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                 ← createFetch instance (PUBLIC_API_URL)
│   │   │   ├── devices.service.ts        ← CRUD + access management
│   │   │   ├── users.service.ts          ← CRUD + pagination
│   │   │   └── helpers/
│   │   │       └── handle-api-error.ts
│   │   ├── auth/
│   │   │   └── client.ts                 ← betterAuth instance
│   │   └── user-utils.ts
│   ├── pages/
│   │   ├── index.astro                   ← language detection → /en/ or /es/
│   │   └── [lan]/
│   │       └── index.astro               ← dashboard page (imports Dashboard.astro)
│   ├── styles/
│   │   └── global.css                    ← 2941 lines: full design system (tokens, components, layout)
│   ├── types/
│   │   ├── api/
│   │   │   ├── index.ts
│   │   │   ├── devices.types.ts
│   │   │   └── users.types.ts
│   │   └── index.ts
│   └── i18n/
│       ├── index.ts
│       ├── en.ts                         ← empty objects (structure only)
│       └── es.ts
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── AGENTS.md                             ← code conventions (Astro, React, CSS, TS)
```

---

## 4. Expected Component Architecture

The OpenDesign prompt must prescribe the following directory structure. All generated UI components must be placed in:

```
src/components/
├── astro/                    ← Static / server-rendered components (.astro)
│   ├── layout/
│   │   ├── MainLayout.astro  ← already exists
│   │   └── Sidebar.astro
│   ├── features/
│   │   ├── Dashboard.astro   ← already imported by [lan]/index.astro, not yet created
│   │   ├── DeviceDetail.astro
│   │   └── ...
│   └── sections/
│       ├── KPIBar.astro
│       └── ActivityFeed.astro
├── react/                    ← Interactive islands (.tsx)
│   ├── map/
│   │   ├── DeviceMap.tsx
│   │   ├── MapMarker.tsx
│   │   ├── MapPopover.tsx
│   │   └── RoutePlayer.tsx
│   ├── devices/
│   │   ├── DeviceTable.tsx
│   │   ├── DeviceCard.tsx
│   │   └── DeviceForm.tsx
│   ├── ui/                   ← Interactive UI primitives
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   └── Dropdown.tsx
│   └── admin/
│       ├── UserTable.tsx
│       └── AdminStats.tsx
└── ui/                       ← Static UI primitives (.astro)
    ├── Button.astro
    ├── Input.astro
    ├── Badge.astro
    ├── KpiCard.astro
    ├── StatusIndicator.astro
    ├── BatteryIndicator.astro
    ├── SignalIndicator.astro
    ├── DataTable.astro
    └── EmptyState.astro
```

**Rule of thumb:** Anything that needs interactivity (map, table sorting, modals, toasts, forms with validation, search, etc.) is a React `.tsx` component. Everything else is an Astro `.astro` component.

---

## 5. CSS Convention

- **No Tailwind, no CSS-in-JS.** Pure CSS only.
- **Global styles** (design tokens, reset, typography, layout primitives) go in `src/styles/global.css`. This file already exists and contains ~2941 lines of a complete design system with CSS custom properties, dark/light theme (`[data-theme='dark']`), and component classes (`.btn`, `.card`, `.input`, `.table`, `.modal`, etc.).
- **Component-specific styles** must be in a **co-located `.css` file** and imported into the component. Example:

```
src/components/ui/Button.astro
src/components/ui/button.css       ← imported inside Button.astro
```

```
src/components/react/map/DeviceMap.tsx
src/components/react/map/device-map.css   ← imported inside DeviceMap.tsx
```

- **Naming:** Component CSS files use **kebab-case** matching the component file name. `DeviceMap.tsx` → `device-map.css`, `Button.astro` → `button.css`.
- **Tokens:** Components must consume design tokens via `var(--token-name)` from `global.css`. Never hardcode raw values.
- The OpenDesign agent should study `global.css` to understand available tokens before generating component CSS.

---

## 6. API Services — Data Context

The agent generating the PROMPT.md must read these files to understand the data that flows through the UI:

```
src/lib/api/client.ts               ← HTTP client config
src/lib/api/devices.service.ts      ← DeviceService class with methods
src/lib/api/users.service.ts        ← UsersService class with methods
src/types/api/devices.types.ts      ← Device, CreateDeviceDto, DeviceAccess, etc.
src/types/api/users.types.ts        ← User, UserWithDevices, CreateUserDto, etc.
```

**Key data shapes (summary):**

```typescript
interface Device {
    id: string;
    uuid_firmware: string;
    name: string;
    created_at: string;
    last_seen_at: string | null; // null = never seen
    access_role?: 'owner' | 'editor' | 'viewer';
}

interface User {
    id: string;
    email: string;
    name: string;
    lastname: string;
    role: 'user' | 'super_admin';
    created_at: string;
}

interface Envelope<T> {
    status_code: number;
    message: string;
    data: T;
}
```

**Available service methods:**

- `devicesService.getAll()`, `.getById(id)`, `.create(payload)`, `.update(id, payload)`, `.delete(id)`
- `devicesService.grantAccess(deviceId, userId)`, `.listAccess(deviceId)`, `.revokeAccess(deviceId, userId)`
- `usersService.getAll()`, `.getById(id, params?)`, `.create(payload)`, `.update(id, payload)`, `.delete(id)`

**Authentication:** Currently uses `X-User-Id` header (dev middleware). Planned: better-auth + JWT/JWKS. The UI must account for auth flows (login page, signup for first super admin, logout, session management).

**Real-time:** SSE streaming for live location updates (planned). UI design must anticipate live-updating data (device positions, status changes) without blocking the interface.

---

## 7. Pages & Routing

| Route            | Page                | Description                                               |
| ---------------- | ------------------- | --------------------------------------------------------- |
| `/`              | `index.astro`       | Language detection, redirects to `/[lan]/`                |
| `/[lan]/`        | `[lan]/index.astro` | Main dashboard — map + device list + KPIs                 |
| `/login`         | —                   | Login page (not yet created)                              |
| `/signup`        | —                   | First super admin signup (not yet created)                |
| `/devices`       | —                   | All devices list with table/grid (not yet created)        |
| `/devices/:id`   | —                   | Device detail with map, stats, timeline (not yet created) |
| `/profile`       | —                   | User profile/settings (not yet created)                   |
| `/admin`         | —                   | Admin overview dashboard (not yet created)                |
| `/admin/users`   | —                   | Users management (not yet created)                        |
| `/admin/devices` | —                   | All devices management (not yet created)                  |

Pages follow Astro file-based routing: `src/pages/[lan]/devices/index.astro`, `src/pages/[lan]/devices/[id].astro`, etc.

**Static generation:** `getStaticPaths()` generates pages for `['en', 'es']`. Pages use `MainLayout.astro` as the shell, passing `locale` and `translation` props.

---

## 8. Instructions for the Agent Generating the PROMPT.md

Your job is to produce a single `PROMPT.md` file at `~/dev/gps-tracker/frontend/PROMPT.md`.

### 8.1 What to include in the prompt

The prompt must instruct OpenDesign to produce the **full UI artifact** (HTML + CSS) for the GPS Tracker frontend. It must contain:

1. **Project context** — describe GPS Tracker as a fullstack IoT tracking app (target audience, core features, data model summary).
2. **Pages to generate** — list every page from Section 7 above. For each page, describe:
    - Layout structure
    - Components it contains (referencing the expected component tree from Section 4)
    - Data it displays (referencing API types from Section 6)
    - Empty, loading, and error states
    - Mobile and desktop variants
3. **Component library to generate** — list every reusable component from the `src/components/ui/` and `src/components/react/ui/` trees. For each, specify:
    - Props (as HTML data attributes or class variants)
    - Visual variants
    - States (default, hover, active, disabled, loading, error)
    - Accessibility requirements
4. **Design theme / template** — propose a concrete visual direction before instructing OpenDesign. Study the existing `global.css` design tokens and suggest:
    - Color palette (accent color, neutral scale, semantic colors)
    - Typography (font stack, sizes, weights)
    - Spacing scale
    - Border radius scale
    - Shadow scale
    - Dark/light theme strategy
    - _Be opinionated — pick specific values._
5. **CSS instructions** — state clearly:
    - Pure CSS, no framework
    - Component CSS files are co-located and imported (`.astro` imports `.css`, `.tsx` imports `.css`)
    - All tokens consumed via `var(--token-name)` from global.css
    - Global styles are NOT to be duplicated; only component-specific styles go in co-located files
6. **Mobile-first responsive** — all layouts must work from 320px up. Specify breakpoints if deviating from the global CSS conventions.

### 8.2 Relationship between this document and the Prompt.md

- This document (`project-overview.md`) is the **source of truth** about the codebase
- The PROMPT.md you generate must be a **transformation** of this information into the format OpenDesign expects (a single coherent design brief + technical instructions)
- Reference specific files and paths from this document in your PROMPT.md so OpenDesign's output maps cleanly onto the existing project structure

### 8.3 What NOT to do

- Do NOT instruct OpenDesign to generate i18n logic. Hardcode English text strings — i18n will be added later.
- Do NOT instruct OpenDesign to generate real API integration or business logic. Only HTML + CSS structure, with class names and data attributes that hint at the data binding (e.g. `data-device-id`, `data-status`).
- Do NOT instruct OpenDesign to generate JavaScript/TypeScript logic beyond what is needed for UI interactivity preview (e.g., a hardcoded device list for demonstration).
- Do NOT reference React state management, hooks, or event handlers in the design output — that is implementation detail for a later phase.

---

## 9. Deliverable Location

Write the generated PROMPT.md to:

```
~/dev/gps-tracker/frontend/PROMPT.md
```

The file should be a **complete, standalone design brief** that OpenDesign can ingest and produce a full-page HTML+CSS artifact for every page listed above.

---

## 10. Quick Reference

- **OpenDesign target:** `https://opencode.ai` (UI generation agent — consumes a design brief and outputs HTML+CSS)
- **This doc is for:** an intermediate agent that reads this overview and writes PROMPT.md for OpenDesign
- **Output directory:** `~/dev/gps-tracker/frontend/`
- **Component target:** `~/dev/gps-tracker/frontend/src/components/`
- **API services to study:** `~/dev/gps-tracker/frontend/src/lib/api/`
- **Global CSS to study:** `~/dev/gps-tracker/frontend/src/styles/global.css`
- **Existing pages to study:** `~/dev/gps-tracker/frontend/src/pages/`
- **Package for context:** `~/dev/gps-tracker/frontend/package.json`
