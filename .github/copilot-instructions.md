# KeyGo UI — Instrucciones para GitHub Copilot

`keygo-ui` es una **SPA React** para la plataforma de gestión de identidades KeyGo.
Un solo login OAuth2/PKCE, con vistas diferenciadas por el rol del JWT.

## Stack

| Capa | Herramienta |
|------|-------------|
| Bundler | Vite 6 |
| Framework | React 19 |
| Lenguaje | TypeScript 5 (strict) |
| Router | React Router 7 |
| Estado global | Zustand 5 (tokens **siempre en memoria**, nunca en localStorage) |
| Fetching / caché | TanStack Query 5 |
| Formularios | React Hook Form + Zod |
| HTTP | Axios 1.x |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| JWT | jose 5 (RS256, JWKS) |
| Testing | Vitest + Testing Library + MSW |

## Comandos

```bash
npm run dev       # Desarrollo (vite, puerto 5173)
npm run build     # Build de producción
npm run lint      # ESLint sobre .ts/.tsx
npm run format    # Prettier
```

## Estructura del proyecto

```
src/
├── auth/         # PKCE, tokenStore (Zustand), roleGuard, refresh, jwksVerify, logout
├── api/          # Axios client + endpoints por dominio (tenants, clientApps, users…)
├── layouts/      # RootLayout, AdminLayout, TenantAdminLayout, UserLayout
├── pages/        # Organizadas por rol: admin/, tenant-admin/, user/, shared/, login/, register/
├── components/   # Componentes reutilizables
├── hooks/        # useCurrentUser, useHasRole, useManagedTenant
├── types/        # DTOs TypeScript: base.ts, tenant.ts, clientapp.ts, user.ts, auth.ts, roles.ts
├── mocks/        # MSW handlers para endpoints pendientes
└── router.tsx    # Definición de rutas y guardias por rol
```

## Convenciones clave

- **Roles:** `ADMIN` | `ADMIN_TENANT` | `USER_TENANT` — leídos del JWT claim `roles`.
- **Autenticación:** OAuth2 Authorization Code + PKCE. Nunca `client_secret` en el browser.
- **Tokens:** Guardados en Zustand (en memoria). Refresh silencioso al 80% del TTL.
- **Respuestas API:** Todas siguen `BaseResponse<T>` — ver `src/types/base.ts`.
- **Routing por rol:** Usar `<AuthGuard>` / `<RoleGuard>` de `src/auth/roleGuard.tsx`.
- **Features pendientes:** Mockear con MSW en `src/mocks/handlers.ts` y señalar con `<PendingFeatureBadge />`.
- **Exportaciones:** Named exports en todos los módulos, default export solo en páginas y layouts.

## Reutilización y patrones de diseño

- **Reutilizar antes de crear:** verificar `src/components/` y shadcn/ui antes de crear un componente nuevo.
- **Extractar hooks:** lógica compartida entre componentes va en `src/hooks/`, nunca duplicada.
- **Container / Presenter:** separar el componente que maneja datos del que solo renderiza UI.
- **Flujo unidireccional:** `API → TanStack Query → Container → props → Presenter`. Zustand solo para estado global.
- **Responsabilidad única:** un componente = una responsabilidad. Más de ~150 líneas de JSX = señal para subdividir.
- **Estados async completos:** siempre manejar `isLoading`, `isError` y `data` en cada `useQuery`.
- **Query keys constantes:** definir en un objeto exportado, no strings sueltos por el código.

## Workflow obligatorio

Al finalizar **cada implementación**, ejecutar sin excepción:

1. **Checklist de consistencia** — ver `.github/instructions/workflow.instructions.md`.
2. **Auto-corrección** — corregir cualquier violación detectada antes de reportar la tarea como lista.
3. **Registro en backlog** — si se detecta una mejora, feature o bug fuera de scope, añadirlo a `docs/BACKLOG.md`.
4. **Auto-aprendizaje** — si se descubre un patrón nuevo no documentado, añadirlo al archivo de instructions correspondiente.
5. **Resumen post-implementación** — entregar el resumen estructurado definido en `workflow.instructions.md`.

## Contrato backend — documentos vivos

Ambos documentos se actualizan cada vez que el backend introduce cambios.
**Siempre consultarlos antes de implementar o modificar una llamada al backend.**

| Documento | Ruta | Contenido |
|-----------|------|-----------|
| OpenAPI v3 (fuente técnica) | [`docs/api-docs.json`](../docs/api-docs.json) | Paths, métodos, schemas, autenticación requerida |
| Frontend Developer Guide (fuente de negocio) | [`docs/FRONTEND_DEVELOPER_GUIDE.md`](../docs/FRONTEND_DEVELOPER_GUIDE.md) | Endpoints disponibles vs. pendientes, roles requeridos, flujo PKCE, convenciones |

## Referencia completa

- [docs/FRONTEND_DEVELOPER_GUIDE.md](../docs/FRONTEND_DEVELOPER_GUIDE.md) — Endpoints, flujo PKCE, convenciones de rol, checklist de seguridad.
- [docs/api-docs.json](../docs/api-docs.json) — Especificación OpenAPI v3 del backend (fuente de verdad técnica).
- [docs/BACKLOG.md](../docs/BACKLOG.md) — Features, mejoras y deuda técnica pendientes.
- [.github/instructions/workflow.instructions.md](./instructions/workflow.instructions.md) — Reglas de auto-aprendizaje, auto-corrección y revisión de consistencia.
