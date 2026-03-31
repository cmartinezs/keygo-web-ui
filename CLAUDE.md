# CLAUDE.md — KeyGo Web UI

> Guía de contexto para Claude Code. Todo lo que necesitas para trabajar en este proyecto de forma efectiva.

---

## Descripción del proyecto

**KeyGo UI** es una SPA (Single Page Application) que sirve como frontend de una plataforma IAM (Identity & Access Management) multi-tenant SaaS. Implementa autenticación OAuth 2.0 + PKCE, paneles diferenciados por rol y flujos de registro/suscripción de nuevos clientes.

**Backend:** `keygo-server` — API REST en Java/Spring. El frontend nunca genera secretos; toda la lógica sensible vive en el servidor.

**Idioma del proyecto:** español en UI, comentarios, documentación y commits.

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | React 19 + TypeScript 5 (strict) | `tsconfig.json` con `strict: true` |
| Bundler | Vite 6 | Port 5173, alias `@/` → `src/` |
| Router | React Router 7 | Rutas definidas en `src/App.tsx` |
| Estado global | Zustand 5 | Solo para tokens (en memoria) |
| Fetching / caché | TanStack Query 5 | Toda la data async pasa por aquí |
| Formularios | React Hook Form 7 + Zod 4 | Validación en cliente y en API boundary |
| HTTP | Axios 1.x | Dos instancias: `authClient` y `apiClient` |
| Estilos | Tailwind CSS v4 + shadcn/ui | Sin CSS-in-JS, sin módulos CSS |
| JWT | jose 5 | RS256 + JWKS, verificación local del `id_token` |
| Notificaciones | sonner 2 | Toasts globales |

---

## Comandos esenciales

```bash
npm run dev              # Servidor de desarrollo → http://localhost:5173
npm run dev:staging      # Dev con variables de staging
npm run build            # Build de producción (mode "production")
npm run build:staging    # Build de staging
npm run lint             # ESLint sobre .ts/.tsx/.js/.jsx
npm run format           # Prettier (auto-fix)
npm run preview          # Preview del build en puerto 5173
```

**Variables de entorno requeridas** (validadas con Zod en `src/config/env.ts`):

```env
VITE_KEYGO_BASE=http://localhost:8080/keygo-server
VITE_TENANT_SLUG=keygo
VITE_CLIENT_ID=keygo-ui
VITE_REDIRECT_URI=http://localhost:5173/callback
```

Archivos por modo: `.env.development`, `.env.staging`, `.env.production`. Override local: `.env.local` (ignorado por git).

---

## Estructura de directorios

```
src/
├── auth/               # PKCEgeneración, Zustand token store, guards de rol, JWKS
│   ├── pkce.ts         # code_verifier + code_challenge (SHA-256)
│   ├── tokenStore.ts   # Zustand: accessToken, idToken, refreshToken (EN MEMORIA)
│   ├── jwksVerify.ts   # Verificación RS256 + JWKS con jose
│   ├── refresh.ts      # Refresh automático al 80% del TTL + restauración de sesión
│   └── roleGuard.tsx   # <AuthGuard> y <RoleGuard> para proteger rutas
│
├── api/                # Un archivo por dominio
│   ├── client.ts       # authClient (withCredentials) + apiClient (Bearer token)
│   ├── auth.ts         # OAuth2: authorize, login, exchangeToken, revoke
│   ├── contracts.ts    # Registro público de nuevos tenants
│   ├── billing.ts      # Suscripciones y facturación
│   ├── tenants.ts      # Gestión de tenants (solo ADMIN)
│   ├── users.ts        # Gestión de usuarios
│   ├── dashboard.ts    # Métricas del panel
│   └── serviceInfo.ts  # Health checks
│
├── pages/              # Vistas organizadas por sección
│   ├── landing/        # Página pública de marketing (9 componentes)
│   ├── login/          # LoginPage: flujo OAuth2/PKCE completo
│   ├── register/       # Registro de nuevos tenants (multistep wizard)
│   │   └── steps/      # 6 pasos: Plan → Contractor → Payment → Email → Terms → Success
│   ├── admin/          # Panel ADMIN (dashboard, tenants CRUD)
│   └── home/           # Redirect según rol al iniciar sesión
│
├── components/         # Reutilizables, sin lógica de negocio
│   ├── plans.ts        # FUENTE DE VERDAD de planes: PLANS[]
│   ├── PlanCard.tsx    # Props: mode "display" | "select"
│   ├── PlanCatalogGrid.tsx
│   ├── PolicyModal.tsx # Modales de T&C y Privacidad
│   ├── HoneypotField.tsx
│   └── TurnstileWidget.tsx
│
├── hooks/              # Lógica de negocio reutilizable
│   ├── useCurrentUser.ts   # Decodifica idToken → CurrentUser | null
│   ├── useHasRole.ts       # useHasRole('ADMIN') → boolean
│   ├── useManagedTenant.ts # Tenant activo para ADMIN_TENANT
│   ├── useTheme.ts         # dark/light/system con localStorage
│   ├── useRateLimit.ts     # Rate limiting en formularios
│   ├── useHoneypot.ts      # Estado del honeypot field
│   └── useTurnstile.ts     # Token de Cloudflare Turnstile
│
├── types/              # DTOs TypeScript puros (sin lógica)
│   ├── base.ts         # BaseResponse<T>, ErrorData, paginación
│   ├── auth.ts         # AuthorizeData, LoginData, TokenData, JwtClaims
│   ├── roles.ts        # AppRole: 'ADMIN' | 'ADMIN_TENANT' | 'USER_TENANT'
│   ├── tenant.ts       # TenantData, CreateTenantRequest
│   ├── billing.ts      # Billing, suscripciones
│   └── dashboard.ts    # Métricas del dashboard
│
├── config/
│   └── env.ts          # Zod parse de import.meta.env → tipado fuerte
│
├── layouts/
│   └── AdminLayout.tsx # Sidebar + header para rutas /admin/*
│
└── App.tsx             # Definición centralizada de rutas (React Router 7)
```

---

## Arquitectura de autenticación

El flujo OAuth 2.0 Authorization Code + PKCE sigue estos pasos:

```
1. GET  /oauth2/authorize?response_type=code&client_id=...&code_challenge=...
        → devuelve sessionId + formHTML (NO redirect)
2. POST /account/login  { username, password, sessionId }
        → valida credenciales + JSESSIONID cookie
3. POST /oauth2/token   { code, code_verifier, grant_type=authorization_code }
        → { access_token, id_token, refresh_token, expires_in }
4. Verificación local del id_token con RS256 + JWKS endpoint
5. Refresh automático al 80% del TTL del access_token
```

**Reglas de seguridad de tokens — NUNCA violar:**
- Tokens **siempre en Zustand (memoria RAM)** — nunca `localStorage`, nunca cookies accesibles por JS.
- Solo el `refreshToken` va a `sessionStorage` para sobrevivir a page reload.
- `apiClient` inyecta `Authorization: Bearer <token>` en cada request via interceptor.
- `authClient` usa `withCredentials: true` para transportar `JSESSIONID`.

---

## Roles y enrutamiento

| Rol | Acceso | Path principal |
|-----|--------|---------------|
| `ADMIN` | Panel global: tenants, apps, usuarios, métricas | `/admin/dashboard` |
| `ADMIN_TENANT` | Panel de su organización (pendiente de implementar) | `/tenant-admin/...` |
| `USER_TENANT` | Portal de usuario (pendiente de implementar) | `/home` |

Rutas protegidas con `<AuthGuard>` (requiere sesión) y `<RoleGuard role="ADMIN">` (requiere rol específico). Fallback `*` redirige a `/login`.

---

## Patrones de código a seguir

### Flujo de datos

```
API call (src/api/[dominio].ts)
  ↓
TanStack Query (useQuery / useMutation) en el componente contenedor
  ↓
Componente presentador (recibe datos por props, sin lógica async)
```

### Formato de respuesta del backend

```typescript
// Toda respuesta sigue BaseResponse<T>
interface BaseResponse<T> {
  date: string
  success?: { code: string; message?: string }
  failure?: { code: string; message: string }
  data?: T
  debug?: { code: string; message?: string }    // solo en dev/local
  throwable?: string                             // solo en dev/local
}

// Los errores incluyen origen clasificado
interface ErrorData {
  code: string
  origin: 'CLIENT_REQUEST' | 'BUSINESS_RULE' | 'SERVER_PROCESSING'
  clientMessage: string   // mostrar al usuario
  detail?: string         // solo en dev
}
```

### Validación de formularios

```typescript
// Siempre Zod + react-hook-form
const schema = z.object({ email: z.string().email() })
const { register, handleSubmit } = useForm({ resolver: zodResolver(schema) })
```

### Componentes

- Tamaño objetivo: < 150 líneas de JSX. Superar esa cifra es señal de split.
- Props interface: `{NombreComponente}Props`.
- Nunca lógica async dentro de un componente presentador.
- Clases CSS exclusivamente Tailwind utility + `dark:` prefix para dark mode.

### Naming

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos de componentes | PascalCase | `LoginPage.tsx` |
| Archivos de hooks | camelCase con prefijo `use` | `useCurrentUser.ts` |
| Archivos de tipos/utils | camelCase | `env.ts`, `pkce.ts` |
| Directorios de páginas | kebab-case | `pages/login/` |
| Interfaces | PascalCase | `CurrentUser` |
| Props interface | `{Nombre}Props` | `AuthGuardProps` |
| Tipos de roles | PascalCase union | `AppRole` |

---

## Documentación de referencia

Antes de implementar algo, consulta estos archivos (son la fuente de verdad):

| Documento | Cuándo leerlo |
|-----------|--------------|
| [docs/FRONTEND_DEVELOPER_GUIDE.md](docs/FRONTEND_DEVELOPER_GUIDE.md) | Guía completa de desarrollo: endpoints, patrones, roles, PKCE (leer primero) |
| [docs/AUTH_FLOW.md](docs/AUTH_FLOW.md) | Cualquier cambio al flujo de autenticación/tokens |
| [docs/BILLING_FLOW.md](docs/BILLING_FLOW.md) | Cambios en suscripciones, planes o pagos |
| [docs/TECHNICAL_GUIDE.md](docs/TECHNICAL_GUIDE.md) | Decisiones de arquitectura y patrones de integración |
| [docs/BACKLOG.md](docs/BACKLOG.md) | Features pendientes y deuda técnica |
| [docs/ACCESSIBILITY-CHILE.md](docs/ACCESSIBILITY-CHILE.md) | Requisitos de accesibilidad (normativa chilena) |
| [docs/api-docs.json](docs/api-docs.json) | OpenAPI v3 del backend — fuente técnica de verdad para endpoints |
| [src/README.md](src/README.md) | Guía de navegación del código fuente |

---

## Áreas en desarrollo activo (marzo 2026)

- **Flujo de registro multi-step** (`src/pages/register/`) — pasos en `steps/`
- **Panel de administración** (`src/pages/admin/`) — nuevas métricas y filas del dashboard
- **Componentes de planes/billing** (`src/components/Plan*.tsx`)
- **Cumplimiento de accesibilidad** — normativa chilena Ley 21.015

---

## Lo que NO hacer

- **Nunca** guardar tokens en `localStorage`, `sessionStorage` (excepto `refreshToken`), ni cookies.
- **Nunca** crear CSS custom o módulos CSS — solo clases Tailwind.
- **Nunca** usar React Context para estado global — usar Zustand o TanStack Query.
- **Nunca** llamar APIs directamente desde componentes — pasar siempre por `src/api/` + TanStack Query.
- **Nunca** exponer información de debug (`detail`, `throwable`) en UI de producción — solo en dev.
- **Nunca** agregar funcionalidad no solicitada — no anticipar features, no refactorizar código no tocado.
- **Nunca** crear archivos `.md` de documentación sin que el usuario lo pida explícitamente.

---

## Convenciones de commits

El proyecto usa commits descriptivos en español con prefijo convencional:

```
feat: descripción de la funcionalidad nueva
fix: descripción del bug corregido
refactor: descripción del cambio estructural
docs: actualización de documentación
chore: cambios de config, deps, scripts
```

---

## Tests

El stack de testing está configurado pero en proceso de implementación:
- **Framework:** Vitest + Testing Library
- **Mocks de API:** MSW (Mock Service Worker) — handlers en `src/mocks/`
- Consultar `docs/BACKLOG.md` para el estado actual de cobertura

---

## Checklist antes de hacer un cambio

1. Leer el archivo que vas a modificar — no proponer cambios sin leerlo.
2. Verificar si hay un tipo en `src/types/` para los datos que maneja.
3. Confirmar que el endpoint existe en `docs/api-docs.json`.
4. Usar `useQuery`/`useMutation` de TanStack Query para toda operación async.
5. Validar con Zod si hay entrada de usuario.
6. Respetar el tamaño máximo de componente (< 150 líneas JSX).
7. Probar en dark mode si el cambio es visual.
