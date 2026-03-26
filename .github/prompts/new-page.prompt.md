---
description: "Scaffold a new page with role, route, and layout wiring"
argument-hint: "Page name, role (admin|tenant-admin|user|shared), and purpose"
agent: "agent"
---

Create a new page in the keygo-ui project following the project conventions.

## Instructions

1. **Determine the role folder** from the user's request:
   - `admin/` → Requires role `ADMIN`
   - `tenant-admin/` → Requires role `ADMIN_TENANT` (or `ADMIN`)
   - `user/` → Requires role `USER_TENANT`
   - `shared/` → All authenticated roles

2. **Create the page file** at `src/pages/<role>/<PageName>Page.tsx`:
   - Default export for the page component
   - Use the correct layout: `AdminLayout`, `TenantAdminLayout`, `UserLayout`, or `RootLayout`
   - If the feature relies on a non-existing endpoint, add `<PendingFeatureBadge />` and create the MSW handler

3. **Register the route** in `src/router.tsx`:
   - Wrap with the correct guard: `<RoleGuard roles={[...]}>` or `<AuthGuard>`
   - Use the matching layout as the parent route element

4. **If data fetching is needed**, create the API function in the appropriate `src/api/*.ts` module and use `useQuery` in the page.

5. **Reference files:**
   - [router.tsx](../src/router.tsx)
   - [src/auth/roleGuard.tsx](../src/auth/roleGuard.tsx)
   - [src/layouts/](../src/layouts/)
   - [src/mocks/handlers.ts](../src/mocks/handlers.ts)
   - [docs/FRONTEND_DEVELOPER_GUIDE.md](../docs/FRONTEND_DEVELOPER_GUIDE.md)

## Expected output

- `src/pages/<role>/<PageName>Page.tsx` — Page component
- Updated `src/router.tsx` — Route added with guard
- (if needed) Updated `src/api/<module>.ts` — API function
- (if pending) Updated `src/mocks/handlers.ts` — MSW handler
