# OpenDesign Prompt — GPS-tracker Frontend UI

> **Purpose:** Prompt for an AI UI/UX design agent specialized in generating professional user interfaces. The agent will produce a complete UI design (wireframes + high-fidelity mockups) for the GPS-tracker web application described below.

---

## Prompt

You are a senior UI/UX designer specialized in building professional dashboards for IoT, real-time tracking, and fleet management web applications. Your task is to design the complete user interface of **GPS-tracker**, a fullstack open-source web application for real-time GPS tracking of IoT devices.

### 1. Project Context

**GPS-tracker** is a self-hosted, open-source web application that allows users to monitor the real-time location of IoT GPS devices (ESP32 + SIM7080G with cellular connectivity). The product is aimed at hobbyists, small businesses, and developers who want full control over their tracking data without depending on third-party services.

**Target users:**
- **Owners** of GPS devices (e.g., vehicle owners, asset managers, hobbyists) who want to see where their devices are in real time.
- **Administrators** (super admin role) who manage all users and devices in the system.

**Core product value:** give users a clear, fast, and professional interface to visualize device locations on a map, replay historical routes, configure devices, and manage access.

**Tech stack (informational, not part of the design deliverable):**
- Frontend: AstroJS + React (interactive components), CSS only (no Tailwind), mobile-first responsive.
- Backend: Go + Fiber + PostgreSQL.
- Auth: better-auth (TypeScript) on the frontend, Authula (Go) on the backend, JWT Strategy with JWKS.
- Real-time updates: SSE (Server-Sent Events).
- Internationalization: Spanish (default) and English.

---

### 2. Design Goals

Produce a **professional, clean, modern interface** that:

1. **Surfaces exceptions first** — a user managing many devices should immediately see what needs attention (offline devices, alerts, low battery). Normal state recedes.
2. **Prioritizes the map** — the map is the centerpiece of the product. It must be prominent, readable, and performant with many devices.
3. **Is honest about data freshness** — never present a stale GPS fix as live. Always show "last updated" timestamps and visually flag offline/stale devices.
4. **Is mobile-first and responsive** — design for mobile, then scale up to tablet and desktop. The interface must work flawlessly on a phone.
5. **Supports both languages** — every text string must be ready for ES/EN translation, with proper layout space (no truncation when switching languages).
6. **Supports dark and light themes** — both modes must be considered as first-class, not an afterthought.

---

### 3. Visual Design Direction

Apply a **modern, professional SaaS dashboard aesthetic** consistent with current best-in-class tracking and fleet management products (e.g., Linear, Vercel, Stripe Dashboard, modern logistics platforms).

- **Style:** Minimal, clean, data-dense but breathable, with strong typographic hierarchy.
- **Color palette:** Use a neutral base (whites/grays in light mode, near-blacks in dark mode) with a single accent color for primary actions, links, and active states. Use semantic colors (green/amber/red/blue) sparingly for status indicators only.
- **Typography:** System font stack or a clean modern sans-serif (Inter, Geist, or similar). Clear hierarchy: large numbers for KPIs, medium for headings, small for labels and metadata.
- **Iconography:** A consistent, lightweight icon set (e.g., Lucide, Tabler, or Phosphor). Icons must be visually balanced with the typography.
- **Spacing:** Use a consistent spacing scale (4/8/12/16/24/32/48 px). Generous whitespace. Cards and sections should breathe.
- **Borders and shadows:** Subtle. Prefer 1px borders and soft, low-opacity shadows over heavy dividers.
- **Status indicators:** Always combine color + icon + text label (do not rely on color alone for accessibility).

---

### 4. Pages to Design

You must design wireframes (and optionally high-fidelity mockups) for every page listed below. For each page, provide a desktop layout and a mobile layout. Mark clearly what is interactive (React) vs static (Astro).

#### 4.1 Authentication Pages

**Login page** (`/login`)
- Centered card with: logo, app name, email input, password input, "Sign in" primary button, "Forgot password?" link, language selector, theme toggle.
- Optional: link to sign up (only enabled if no super admin exists yet).
- Mobile: full-screen card, large touch targets.

**Sign-up page** (`/signup`)
- Only used to create the first super admin. Show a clear notice that this is the initial setup.
- Fields: name, email, password, confirm password.
- "Create admin account" primary button.

#### 4.2 Main Application Pages

**Dashboard** (`/dashboard`) — *the main screen, the most important page*
- Layout: sidebar (left) + top bar + main content area.
- Main content split into:
  - **Map panel (primary, ~60% width on desktop, full width on mobile)** — large interactive map showing all user devices as markers. Markers must be color-coded by status (online green, stale amber, offline red) and have a small label on hover/tap. The map should support clustering when many devices are visible.
  - **Device list panel (secondary, ~40% width on desktop, scrollable below the map on mobile)** — list of devices with: status dot, name, last update time, battery indicator, current speed. Clicking a device should highlight its marker on the map and vice versa.
- Top bar: app logo, global search (Cmd+K), theme toggle, language selector, user avatar menu.
- Sidebar (collapsible on mobile): navigation links (Dashboard, Devices, Alerts, Profile, Admin if super admin).
- Above the map and list, include **3–4 KPI cards**: Total devices, Online, Offline, Alerts today. Each card must have an icon, a number, a label, and a small trend indicator if applicable.

**Devices list** (`/devices`)
- Header: page title "Devices", primary "Add device" button, bulk actions toolbar (appears when items are selected), filter dropdown (status, last seen, battery), search input.
- Table or card grid (toggleable view): columns/fields = checkbox, status, name, last update, battery, signal, owner, actions menu (edit, share, delete).
- Mobile: card grid view, swipe actions.
- Empty state: illustration + "No devices yet" + "Add your first device" CTA.
- Bulk actions: delete, share, assign to group.

**Device detail** (`/devices/:id`)
- Back button + device name + status badge + actions menu (edit, share, delete).
- **Top section:** map showing the current position and the historical route (polyline). The map must be the visual anchor of this page.
- **Right sidebar / below on mobile:** device info card with: name, UUID firmware, IMEI, firmware version, battery %, cellular signal (dBm), last heartbeat timestamp, owner.
- **Stats panel:** distance traveled (km), time in motion, max speed, average speed.
- **Timeline / activity feed:** chronological list of events (movement start/stop, low battery, offline/online, geofence enter/exit).
- **Route player:** a slider with play/pause controls to replay the device's route over a selectable time range (today, last 7 days, custom range).
- **Geofence editor (if feature is enabled):** UI to draw circles or polygons on the map and assign alerts to them.
- **Heatmap layer toggle** on the map to visualize activity density.

**Profile / Settings** (`/profile`)
- User info (name, email, role).
- Change password form.
- Language preference.
- Theme preference (system / light / dark).
- Logout button.
- Sessions list (active devices/sessions, with revoke option).

#### 4.3 Admin Pages (Super Admin only)

**Admin overview** (`/admin`)
- KPI cards: total users, total devices, online %, alerts today.
- Activity feed: recent user sign-ups, recent device registrations, recent admin actions.
- Charts: devices added over time, active users over time.

**Users management** (`/admin/users`)
- Table of all users: name, email, role, devices owned, last active, status (active/suspended), actions.
- Filter, search, bulk actions.
- "Invite user" button → modal with email + role.

**All devices** (`/admin/devices`)
- Same as the user devices list, but across the entire system.
- Includes an "Owner" column and the ability to reassign or delete any device.

---

### 5. Reusable UI Patterns to Define

In addition to the pages, design the following reusable patterns as a mini design system:

- **Sidebar navigation** (expanded and collapsed states, mobile drawer).
- **Top bar** with search, theme toggle, language selector, user menu.
- **Device status indicator** (dot + label): online, stale (>2 min), offline (>5 min).
- **Battery indicator** (visual bar + percentage, with color thresholds: green >50%, amber 20–50%, red <20%).
- **Signal indicator** (bars + dBm value).
- **KPI card** (icon, big number, label, optional trend).
- **Map marker** (status color, label, optional cluster badge).
- **Map info popover** (on marker click/tap: device name, status, last update, "View details" link).
- **Toast / notification** (success, info, warning, error; with grouped count like "5 new locations in the last 5 min").
- **Data table** (sortable columns, row hover, checkbox selection, sticky header, pagination, empty state, loading state).
- **Card grid** (for mobile device list).
- **Modal / dialog** (with header, body, footer, close button, responsive full-screen on mobile).
- **Form fields** (input, select, textarea, validation states).
- **Buttons** (primary, secondary, ghost, destructive; sizes sm/md/lg; loading and disabled states).
- **Empty states** (illustration + message + CTA).
- **Loading states** (skeletons, spinners).
- **Timeline / activity feed item**.
- **Geofence drawing controls** (draw circle, draw polygon, edit, delete).

---

### 6. Mobile Considerations

- The sidebar becomes a hamburger-triggered drawer.
- Tables become card lists with stacked information.
- The map should be expandable to full screen with a toggle.
- Touch targets must be at least 44×44 px.
- Bottom sheets for actions and filters instead of dropdowns where appropriate.
- KPI cards stack vertically.

---

### 7. Deliverables

For each page, produce:

1. A **low-fidelity wireframe** showing layout, hierarchy, and component placement (desktop and mobile).
2. A **high-fidelity mockup** in both light and dark themes, with realistic content (no Lorem Ipsum).
3. A **component annotation** indicating which components are interactive (React) and which are static (Astro).
4. **Spanish (ES) and English (EN) labels** for every visible text string, formatted as a list ready to be plugged into an i18n JSON file.

---

### 8. Tone and Quality Bar

This is an **open-source product intended for the community**. The design must:
- Look **professional and trustworthy**, on par with paid SaaS products.
- Feel **fast and lightweight**, in line with Astro's philosophy.
- Be **honest about data** — no fake liveness indicators, no misleading status colors.
- Be **accessible**: sufficient color contrast (WCAG AA), readable font sizes, focus states for keyboard navigation.

---

### 9. Reference Products for Inspiration

Study the visual language and UX patterns of the following kinds of products before designing (do not copy them directly, draw inspiration from their best ideas):
- Linear, Vercel, Stripe Dashboard (clean SaaS aesthetic, typography, spacing).
- Mapbox, Google Maps, Leaflet demos (map interaction, marker clustering, info popovers).
- Modern fleet tracking and logistics dashboards (e.g., design references on Dribbble and Behance for "fleet tracking", "logistics dashboard", "GPS tracker app").
- Apple Human Interface Guidelines and Material Design (principles for data density, clarity, mobile-first).

---

### 10. Final Note

Be opinionated. Make concrete design decisions (specific colors, specific spacing values, specific component shapes). Avoid vague placeholders. The output of this prompt should be detailed enough that a developer can directly implement the UI without guessing.