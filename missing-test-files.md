# Missing test files

Tracks `src/lib/**`. **P0 (pure-fn utilities)** is covered by colocated
`*.test.ts` files. Everything below is pending and prioritized. Update the
checkbox when a test file ships.

## P0 — covered

- [x] `src/lib/api/api-utils.test.ts` — `isApiError`, `asApiError`, `toApiError`, `handleApiError`
- [x] `src/lib/map-utils.test.ts` — `projectCoordinate`, `formatCoords`, `getPathFromRoute`, `getMapStatusLabels`
- [x] `src/lib/user-utils.test.ts` — `getInitials`, `getFirstNameWithInitial`, `getUserTableColumns`
- [x] `src/lib/date-utils.test.ts` — `formatDate`

## P1 — DOM-dependent utils + stores

- [ ] `src/lib/device-utils.ts` — `getDeviceTableColumns`, `getDemoKpiItems`, `getDeviceAccessTableColumns`
- [ ] `src/lib/router-utils.ts` — `generateNavbarItems` (pure) + `redirectTo` (mock `navigator`/`window.location`)
- [ ] `src/lib/http-utils.ts` — `readDeviceIdFromUrl`
- [ ] `src/lib/stores/auth.ts` — atom transitions, `$isAuthenticated` computed

## P2 — React hook without network

- [ ] `src/lib/hooks/useHydrateOnce.ts` — ref-gate, StrictMode double-mount

## P3 — Network-touching React services

- [ ] `src/lib/auth/service.ts` — signIn / signUp / signInOAuth / signOut / getSession
- [ ] `src/lib/hooks/useAuth.ts` — store-binding snapshot
- [ ] `src/lib/api/services/bootstrap.service.ts` — happy + error paths
- [ ] `src/lib/api/services/userService.ts` — CRUD via `vi.mock('apiClient')`
- [ ] `src/lib/api/services/deviceService.ts` — CRUD + optimistic add + access grants/revokes
- [ ] `src/lib/api/services/profileService.ts` — captures errors into state instead of re-throwing

## Out of scope (YAGNI)

- `src/lib/api/client.ts`, `src/lib/auth/client.ts` — 3-line factories wired to
  `import.meta.env`; a test would assert the library works, not our code.
- All `*.ts` barrel re-exports.
