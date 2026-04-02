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

## Regla global de carga y red (obligatoria)

Esta regla aplica siempre, en toda feature nueva o modificación de flujo existente.

1. **Carga de pagina y render critico**
   - Evitar pantalla en blanco en primer paint y cambios de ruta.
   - Usar loader global solo en ventanas de asentamiento de ruta o bootstrap critico.
   - El loader global debe activarse solo ante red lenta sostenida (no por actividad breve).

2. **Carga de componentes (scope local)**
   - Cada bloque visual debe resolver su estado con skeleton/spinner/error local.
   - No bloquear toda la pantalla por cargas parciales de widgets secundarios.
   - Mantener continuidad de UI: preferir placeholders locales antes que overlays globales.

3. **Llamadas al backend (resiliencia)**
   - Timeout explicito por request (base de referencia: 10s).
   - GET criticos con retry controlado (base de referencia: cada 5s, maximo 3 intentos).
   - POST/PUT/PATCH/DELETE criticos sin auto-retry mientras backend no garantice idempotencia real.
   - Si hay retry o recuperacion en segundo plano que impacta UI, notificar con toast.

4. **Priorizacion de decision**
   - Primero: proteger render critico (sin blancos).
   - Segundo: preservar UX local de cada componente.
   - Tercero: endurecer resiliencia de red segun criticidad y seguridad del endpoint.

5. **Regla de cumplimiento**
   - Ninguna implementacion se considera terminada si no explicita esta separacion:
     - render de pagina,
     - render de componente,
     - politica de backend.

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
3. **Actualizar documentación** — obligatorio en cada cambio que afecte comportamiento o estructura:
   - **`docs/FUNCTIONAL_GUIDE.md`** — si cambia algo visible para el usuario final (pantallas, flujos, acciones, roles).
   - **`docs/TECHNICAL_GUIDE.md`** — si se crea o modifica un archivo, módulo o patrón. Documentar propósito, construcción, integración con otros módulos, decisión de diseño, estrategia empleada y deuda técnica conocida.
4. **Registro en backlog** — si se detecta una mejora, feature o bug fuera de scope, añadirlo a `docs/BACKLOG.md`.
5. **Auto-aprendizaje** — si se descubre un patrón nuevo no documentado, añadirlo al archivo de instructions correspondiente.
6. **Resumen post-implementación** — entregar el resumen estructurado definido en `workflow.instructions.md`.

## Accesibilidad — norma chilena

Este proyecto adopta **WCAG 2.2 nivel AA** como estándar técnico, con base en la **Ley N° 20.422** y los Decretos N° 1/2015 y N° 14/2014 de Chile.

- **Documento normativo:** [`docs/ACCESSIBILITY-CHILE.md`](../docs/ACCESSIBILITY-CHILE.md) — política completa, requisitos obligatorios, Definition of Done, checklist para agentes AI y criterios de PR.
- **Instrucciones para el agente:** [`.github/instructions/accessibility.instructions.md`](./instructions/accessibility.instructions.md) — reglas condensadas aplicables en cada componente `.tsx`.
- **Incorporación paulatina:** todo componente **nuevo o modificado** debe cumplir las reglas. No se exige una auditoría retroactiva completa en cada PR, pero sí que no se introduzcan regresiones.
- La accesibilidad **prevalece sobre la implementación visual** cuando hay conflicto.

---

## Contrato backend — documentos vivos

Ambos documentos se actualizan cada vez que el backend introduce cambios.
**Siempre consultarlos antes de implementar o modificar una llamada al backend.**

| Documento | Ruta | Contenido |
|-----------|------|-----------|
| OpenAPI v3 (fuente técnica) | [`docs/api-docs.json`](../docs/api-docs.json) | Paths, métodos, schemas, autenticación requerida |
| Frontend Developer Guide (fuente de negocio) | [`docs/FRONTEND_DEVELOPER_GUIDE.md`](../docs/FRONTEND_DEVELOPER_GUIDE.md) | Endpoints disponibles vs. pendientes, roles requeridos, flujo PKCE, convenciones |

## Referencia completa

- [docs/FUNCTIONAL_GUIDE.md](../docs/FUNCTIONAL_GUIDE.md) — **Documentación funcional**: qué puede hacer el usuario final en cada pantalla y flujo, organizado por rol.
- [docs/TECHNICAL_GUIDE.md](../docs/TECHNICAL_GUIDE.md) — **Documentación técnica**: arquitectura del proyecto, descripción por archivo (propósito, integración, decisiones de diseño, estrategia, deuda técnica), y guía de extensión.
- [docs/FRONTEND_DEVELOPER_GUIDE.md](../docs/FRONTEND_DEVELOPER_GUIDE.md) — Endpoints, flujo PKCE, convenciones de rol, checklist de seguridad.
- [docs/api-docs.json](../docs/api-docs.json) — Especificación OpenAPI v3 del backend (fuente de verdad técnica).
- [docs/BACKLOG.md](../docs/BACKLOG.md) — Features, mejoras y deuda técnica pendientes.
- [docs/ACCESSIBILITY-CHILE.md](../docs/ACCESSIBILITY-CHILE.md) — Política de accesibilidad (WCAG 2.2 AA, Ley N° 20.422). Consultar antes de crear o modificar cualquier componente UI.
- [.github/instructions/accessibility.instructions.md](./instructions/accessibility.instructions.md) — Reglas condensadas de accesibilidad para el agente AI.
- [.github/instructions/workflow.instructions.md](./instructions/workflow.instructions.md) — Reglas de auto-aprendizaje, auto-corrección, revisión de consistencia y actualización de documentación.
