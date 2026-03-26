# KeyGo UI

> **Plataforma de gestión de identidades multi-tenant — interfaz web SPA.**
> Un solo login OAuth2/PKCE. Tres roles. Acceso seguro para toda tu organización.

---

## ¿Qué es KeyGo?

**KeyGo** es una plataforma SaaS de gestión de identidades y accesos (IAM) diseñada para equipos que necesitan controlar **quién entra, con qué permisos, y en qué aplicaciones** — sin depender de soluciones genéricas ni infraestructura propia.

Con KeyGo puedes:

- **Centralizar el acceso** a múltiples aplicaciones desde un único punto de autenticación.
- **Separar tu base de usuarios por tenant** (organización, cliente, departamento) con total aislamiento.
- **Asignar roles finos** (`ADMIN`, `ADMIN_TENANT`, `USER_TENANT`) y adaptar la experiencia de cada usuario.
- **Integrar cualquier app** mediante el estándar OAuth 2.0 + OIDC — sin vendor lock-in.

---

## Propuesta de valor

| Para quién | Qué resuelve |
|---|---|
| **Startups y SaaS** | Autenticación multi-tenant lista desde el día uno, sin construirla desde cero |
| **Empresas con múltiples equipos** | Un portal unificado de acceso, con roles por área u organización |
| **Integradores y agencias** | Login centralizado reutilizable para las apps de sus clientes |
| **Equipos de seguridad** | RS256, PKCE, refresh token rotation, revocación — sin compromisos |

---

## Funcionalidades principales

- **Login unificado OAuth2/PKCE** — un solo flujo para todos los roles y tenants
- **Panel de administración global** — gestión de tenants, apps y usuarios desde `ADMIN`
- **Panel de administración de tenant** — control total de la organización para `ADMIN_TENANT`
- **Portal de usuario** — perfil, contraseña y sesiones para `USER_TENANT`
- **Página pública de precios y registro** — onboarding de nuevos clientes sin fricción
- **Aislamiento total entre tenants** — cada organización ve solo sus datos
- **Resistencia a fallos de conexión** — la pantalla de login detecta y reacciona a pérdidas de conectividad en tiempo real

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | React 19 + TypeScript 5 (strict) |
| Bundler | Vite 6 |
| Router | React Router 7 |
| Estado global | Zustand 5 (tokens en memoria, nunca en `localStorage`) |
| Fetching / caché | TanStack Query 5 |
| Formularios | React Hook Form + Zod |
| HTTP | Axios 1.x |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| JWT | jose 5 (RS256, verificación por JWKS) |
| Testing | Vitest + Testing Library + MSW |

---

## Inicio rápido

**Requisitos:** Node 18+ · npm

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env.local   # editar con tus valores

# 3. Iniciar en desarrollo
npm run dev                  # → http://localhost:5173
```

### Variables de entorno

```env
VITE_KEYGO_BASE=http://localhost:8080/keygo-server
VITE_TENANT_SLUG=keygo
VITE_CLIENT_ID=keygo-ui
VITE_REDIRECT_URI=http://localhost:5173/callback
```

### Comandos disponibles

```bash
npm run dev      # Servidor de desarrollo (puerto 5173)
npm run build    # Build de producción
npm run lint     # ESLint sobre .ts / .tsx
npm run format   # Prettier
```

---

## Estructura del proyecto

```
src/
├── auth/         # PKCE, Zustand token store, guards de rol, verificación JWT
├── api/          # Cliente Axios + endpoints por dominio
├── layouts/      # RootLayout, AdminLayout, TenantAdminLayout, UserLayout
├── pages/        # Vistas organizadas por rol: admin/, tenant-admin/, user/, login/, landing/
├── components/   # Componentes reutilizables (PlanCard, ScrollToTop…)
├── hooks/        # useCurrentUser, useHasRole, useManagedTenant
├── types/        # DTOs TypeScript: base, tenant, clientapp, user, auth, roles
└── mocks/        # MSW handlers para endpoints pendientes de backend
```

---

## Seguridad

- Tokens **siempre en memoria** (Zustand) — nunca en `localStorage` ni cookies accesibles por JS.
- Flujo **OAuth 2.0 Authorization Code + PKCE** — sin `client_secret` expuesto en el browser.
- `id_token` verificado localmente con **RS256 + JWKS** usando `jose`.
- **Refresh token rotation** automático al 80 % del TTL del access token.
- **Revocación de tokens** en logout mediante `POST /oauth2/revoke`.

---

## Documentación

| Documento | Descripción |
|---|---|
| [`docs/`](docs/README.md) | Índice de toda la documentación técnica y de negocio |
| [`docs/FRONTEND_DEVELOPER_GUIDE.md`](docs/FRONTEND_DEVELOPER_GUIDE.md) | Guía completa para desarrolladores: endpoints, roles, flujo PKCE, convenciones |
| [`docs/AUTH_FLOW.md`](docs/AUTH_FLOW.md) | Referencia del flujo OAuth2/PKCE paso a paso |
| [`docs/BACKLOG.md`](docs/BACKLOG.md) | Features pendientes, mejoras y deuda técnica |
| [`docs/api-docs.json`](docs/api-docs.json) | Especificación OpenAPI v3 del backend (fuente técnica de verdad) |
| [`src/`](src/README.md) | Guía de navegación del código fuente |

---

## Licencia

Propietario — todos los derechos reservados. Contacta al equipo de KeyGo para licencias comerciales.
