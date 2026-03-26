---
description: "Run a full consistency review of one or more files or a feature area against all project conventions"
argument-hint: "Files, folders, or feature name to review (e.g. 'src/api/', 'AuthFlow', 'TenantsPage')"
agent: "agent"
---

Run a thorough consistency review of the specified files or feature area against all keygo-ui conventions.

## Review checklist

### 1. TypeScript
- No `any` without justification
- All types imported from `src/types/` — no local redefinitions
- Props interfaces follow `<Component>Props` naming
- `import type` used where possible

### 2. React components
- Named exports in reusable components; default export only in pages and layouts
- No `React.FC<Props>` usage — props typed inline
- No direct `useState` + `fetch` — all data via `useQuery` / `src/api/`
- No sensitive data in `localStorage` / `sessionStorage`

### 3. API layer
- Every API function unwraps `BaseResponse<T>.data` before returning
- MSW handlers follow `BaseResponse<T>` shape
- Pending endpoints marked `// ⏳ pendiente` with matching MSW handler

### 4. Security
- No `client_secret` in browser-side code
- No token logging
- All protected routes have `<AuthGuard>` or `<RoleGuard>` in `router.tsx`

### 5. Styles
- Tailwind classes used — no inline styles except documented exceptions
- Interactive elements have visible text or `aria-label`

### 6. Testing
- New components have at least a basic render test
- MSW mocks use correct `BaseResponse<T>` shape

## Instructions

1. Read the specified files (use tools to explore the folder if a path is given).
2. Cross-check each file against the checklist above.
3. For each violation found, note the file and line and explain the issue.
4. Apply fixes directly if they are safe and non-destructive.
5. For issues that require larger refactoring, register them in [docs/BACKLOG.md](../docs/BACKLOG.md) with type `[REFACTOR]` or `[MEJORA]`.

## Reference files
- [.github/instructions/react-components.instructions.md](../instructions/react-components.instructions.md)
- [.github/instructions/api-client.instructions.md](../instructions/api-client.instructions.md)
- [.github/instructions/auth.instructions.md](../instructions/auth.instructions.md)
- [.github/instructions/styling.instructions.md](../instructions/styling.instructions.md)
- [.github/instructions/testing.instructions.md](../instructions/testing.instructions.md)
- [docs/BACKLOG.md](../../docs/BACKLOG.md)

## Expected output

```
### 🔍 Revisión de consistencia — <área revisada>

**Archivos revisados:** N

**Problemas encontrados:**
- [TIPO] `src/ruta/archivo.ts:L42` — descripción del problema
  ✅ Corregido / 📝 Registrado en BACKLOG.md

**Sin problemas:** <lista de archivos limpios>
```
