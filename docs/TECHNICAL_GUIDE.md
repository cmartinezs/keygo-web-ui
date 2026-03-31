# KeyGo UI — Guía Técnica

> **Audiencia:** desarrollador que hereda o extiende el proyecto. Asume conocimiento de React, TypeScript y OAuth2.
>
> **Última actualización:** 2026-03-31

---

## Índice

1. [Arquitectura general](#1-arquitectura-general)
2. [Configuración del proyecto](#2-configuración-del-proyecto)
   - [vite.config.ts](#viteconfigts)
   - [tsconfig.json](#tsconfigjson)
   - [package.json](#packagejson)
   - [tailwind.config.cjs / postcss.config.cjs](#tailwindconfigcjs--postcssconfigcjs)
   - [index.html](#indexhtml)
3. [Puntos de entrada](#3-puntos-de-entrada)
   - [src/main.tsx](#srcmaintsx)
   - [src/App.tsx](#srcapptsx)
   - [src/vite-env.d.ts](#srcvite-envdts)
   - [src/styles/index.css](#srcstylesindexcss)
4. [Módulo de autenticación — `src/auth/`](#4-módulo-de-autenticación--srcauth)
   - [tokenStore.ts](#tokenstorets)
   - [pkce.ts](#pkcets)
   - [jwksVerify.ts](#jwksverifyts)
   - [refresh.ts](#refreshts)
   - [roleGuard.tsx](#roleguardtsx)
5. [Módulo de API — `src/api/`](#5-módulo-de-api--srcapi)
   - [client.ts](#clientts)
   - [auth.ts](#authts)
   - [tenants.ts](#tenantsts)
   - [users.ts](#usersts)
   - [serviceInfo.ts](#serviceinfots)
   - [contracts.ts](#contractsts)
6. [Tipos — `src/types/`](#6-tipos--srctypes)
   - [base.ts](#basets)
   - [auth.ts](#authts-1)
   - [tenant.ts](#tenantts)
   - [roles.ts](#rolests)
7. [Hooks — `src/hooks/`](#7-hooks--srchooks)
   - [useCurrentUser.ts](#usecurrentuserts)
   - [useHoneypot.ts](#usehoneypotts)
   - [useRateLimit.ts](#useratelimitts)
   - [useTheme.ts](#usethemets)
   - [useTurnstile.ts](#useturnstilts)
8. [Componentes reutilizables — `src/components/`](#8-componentes-reutilizables--srccomponents)
   - [HoneypotField.tsx](#honeypotfieldtsx)
   - [TurnstileWidget.tsx](#turnstilewidgettsx)
   - [PlanCard.tsx](#planCardtsx)
   - [plans.ts](#plansts)
   - [ScrollToTop.tsx](#scrolltotoptsx)
9. [Layouts — `src/layouts/`](#9-layouts--srclayouts)
   - [AdminLayout.tsx](#adminlayouttsx)
10. [Páginas — `src/pages/`](#10-páginas--srcpages)
    - [Landing](#101-landing--srcpageslanding)
    - [Login](#102-login--srcpageslogin)
    - [Nuevo contrato](#103-nuevo-contrato--srcpagesregister)
    - [Registro de usuario](#104-registro-de-usuario--srcpagesregister)
    - [Admin — Dashboard](#105-admin-dashboard)
    - [Admin — Tenants](#106-admin-tenants)
    - [Admin — Detalle de Tenant](#107-admin-detalle-de-tenant)
    - [Admin — Crear Tenant](#108-admin-crear-tenant)
  - [Developer docs](#109-developer-docs--srcpagesdevelopers)
11. [Cómo extender el proyecto](#11-cómo-extender-el-proyecto)
12. [Deuda técnica consolidada](#12-deuda-técnica-consolidada)
13. [Documentación de trazabilidad](#13-documentación-de-trazabilidad)
14. [Plan de pruebas de seguridad de login](#14-plan-de-pruebas-de-seguridad-de-login)

---

## 1. Arquitectura general

```
Browser
  │
  ├─ index.html          ← script inline de tema (antes de React)
  │
  └─ src/main.tsx        ← restoreSession() → monta React
       │
       ├─ QueryClientProvider (TanStack Query — cache de datos del servidor)
       ├─ BrowserRouter   (React Router 7 — enrutamiento client-side)
       └─ App.tsx         ← árbol de rutas + Toaster
            │
            ├─ Rutas públicas   (Landing, Login, Suscripción, Registro)
            └─ /admin/*         ← RoleGuard (ADMIN) → AdminLayout → Outlet
                 ├─ DashboardPage
                 ├─ TenantsPage  → Outlet
                 │    ├─ TenantDetailPage
                 │    └─ TenantCreatePage
                 └─ (futuro: ADMIN_TENANT, USER_TENANT)
```

**Flujo de datos:**

```
Backend API
  └─ src/api/*.ts          (funciones puras, Axios)
       └─ TanStack Query   (useQuery / useMutation — caché, estados async)
            └─ Componente container  (página o layout)
                 └─ props → Componente presenter (UI pura)
```

**Estado global:**

```
Zustand
  ├─ useTokenStore    ← tokens en memoria, roles, lifecycle de sesión
  └─ useThemeStore    ← preferencia de tema (light/dark/system)
```

---

## 2. Configuración del proyecto

### `vite.config.ts`

**Propósito:** Configuración del bundler Vite.

**Construcción:**
- Plugin `@vitejs/plugin-react` — React Fast Refresh y transform JSX automático.
- Alias `@` → `src/` — sincronizado con `tsconfig.json > paths`.
- Puerto fijo `5173` en desarrollo.

**Integración:** El alias `@` es el contrato entre TypeScript (type-check) y Vite (resolve en tiempo de ejecución). Cualquier importación con `@/` en el código solo funciona si ambos archivos lo declaran.

**Decisión de diseño:** Configuración mínima intencional — sin proxy, sin split de chunks personalizado, sin plugins adicionales. Las llamadas al backend se hacen directamente desde el navegador.

**Deuda técnica:** Sin configuración de `build.target`, sin análisis de bundle, sin cabeceras CSP en desarrollo.

---

### `tsconfig.json`

**Propósito:** Configuración de TypeScript (solo type-check; Vite transpila con esbuild).

**Claves importantes:**
| Clave | Valor | Motivo |
|-------|-------|--------|
| `strict: true` | — | Tipado estricto en todo el proyecto |
| `noEmit: true` | — | TS solo verifica tipos; Vite transforma |
| `jsx: "react-jsx"` | — | JSX automático (sin `import React`) |
| `isolatedModules: true` | — | Compatible con esbuild/Vite |
| `paths: { "@/*": ["src/*"] }` | — | Alias espejo de `vite.config.ts` |

**Deuda técnica:** `moduleResolution: "Node"` es el modo legacy. Para proyectos nuevos con ESM puro se recomienda `"Bundler"`.

---

### `package.json`

**Propósito:** Manifiesto del proyecto. Define dependencias y scripts.

**Scripts clave:**
| Script | Comando |
|--------|---------|
| `dev` | `vite` (puerto 5173) |
| `build` | `vite build` |
| `lint` | ESLint sobre `.ts/.tsx` |
| `format` | Prettier |

**Dependencias de producción destacadas:**
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `react` / `react-dom` | ^19 | Framework UI |
| `react-router-dom` | ^7 | Enrutamiento client-side |
| `@tanstack/react-query` | ^5 | Cache y estado de servidor |
| `zustand` | ^5 | Estado global en memoria |
| `axios` | ^1.4 | Cliente HTTP |
| `jose` | ^5 | Verificación JWT / JWKS (RS256) |
| `react-hook-form` | ^7.72 | Estado de formularios |
| `zod` | ^4.3 | Validación de schemas |
| `sonner` | ^2 | Notificaciones toast |

**Deuda técnica:** Vitest, Testing Library y MSW no están instalados — las instrucciones del proyecto exigen tests pero aún no hay infraestructura de testing.

---

### `tailwind.config.cjs` / `postcss.config.cjs`

**Propósito:** Configuración de Tailwind CSS v4 y PostCSS.

**Construcción:**
- `tailwind.config.cjs` — solo declara los archivos a escanear para purgar clases. No hay tokens de diseño personalizados.
- `postcss.config.cjs` — plugins `@tailwindcss/postcss` (v4) y `autoprefixer`.

**Decisión de diseño:** Tailwind v4 se importa vía `@import "tailwindcss"` en el CSS (no las directivas `@tailwind base/components/utilities` de v3). El archivo `.cjs` quedan como mínimo necesario para compatibilidad de herramientas que lo leen.

---

### `index.html`

**Propósito:** Documento HTML raíz.

**Construcción:**
- `lang="es"` — idioma del documento.
- Script **inline síncrono** de tema antes del primer paint:
  ```js
  (function () {
    var p = localStorage.getItem('keygo-theme') || 'system'
    var dark = p === 'dark' || (p === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (dark) document.documentElement.classList.add('dark')
  })()
  ```
- `<div id="root">` — punto de montaje de React.

**Integración:** El script inline aplica `.dark` a `<html>` **antes de que React monte**, eliminando el flash de tema incorrecto (FOCT). `useThemeStore` lee el mismo `localStorage.getItem('keygo-theme')` en su inicialización, quedando sincronizado.

**Decisión de diseño:** La inicialización del tema debe ocurrir sincrónicamente en el HTML, no en un `useEffect`, porque los effects corren tras el primer render y causarían parpadeo visual.

---

## 3. Puntos de entrada

### `src/main.tsx`

**Propósito:** Punto de arranque de la aplicación React.

**Construcción:**
1. Crea `QueryClient` con configuración por defecto.
2. Llama `restoreSession()` — intenta restaurar la sesión desde `sessionStorage` antes de montar.
3. En `.finally()` (siempre, independientemente del resultado): monta el árbol React con `StrictMode` + `QueryClientProvider` + `BrowserRouter` + `App`.

**Integración:**
- `restoreSession` → `src/auth/refresh.ts`
- `QueryClientProvider` → disponible para todos los `useQuery`/`useMutation` del árbol
- `BrowserRouter` → habilita `useNavigate`, `useLocation`, etc.

**Decisión de diseño:** "Session-first render" — el app no monta hasta que `restoreSession` termina. Garantiza que los guards de ruta evalúen el estado de auth ya hidratado. El `.finally()` asegura que un error de refresh no bloquee el montaje (el usuario simplemente llegará al login).

**Deuda técnica:** `QueryClient` sin configuración global — sin `staleTime`, sin política de reintentos, sin `refetchOnWindowFocus: false`.

---

### `src/App.tsx`

**Propósito:** Definición del árbol de rutas y configuración del toast global.

**Construcción:**
- Define todas las rutas con `<Routes>` de React Router 7.
- Expone una ruta pública adicional `/developers` para la documentación de integración.
- Wrap de rutas `/admin/*` con `<RoleGuard roles={['ADMIN']}>` + `<AdminLayout>`.
- Rutas anidadas de tenant (`/:slug` y `/new`) como hijos de `TenantsPage` (patrón master-detail con `<Outlet>`).
- `<Toaster>` de `sonner` con tema dark y posición `bottom-right`.
- Catch-all `*` redirige a `/login`.

**Integración:**
- `RoleGuard` → `src/auth/roleGuard.tsx`
- `AdminLayout` → `src/layouts/AdminLayout.tsx`
- Todas las páginas → `src/pages/**`

**Árbol de rutas:**
| Ruta | Componente | Guardia |
|------|-----------|---------|
| `/` | `LandingPage` | Pública |
| `/developers` | `DeveloperDocsPage` | Pública |
| `/login` | `LoginPage` | Pública |
| `/subscribe` | `NewContractPage` | Pública |
| `/subscribe/resume` | `Navigate -> /subscribe?resume=1` | Pública |
| `/register` | `UserRegisterPage` | Pública |
| `/admin` | `RoleGuard` → `AdminLayout` | `ADMIN` |
| `/admin/dashboard` | `AdminDashboardPage` | — |
| `/admin/tenants` | `TenantsPage` | — |
| `/admin/tenants/new` | `TenantCreatePage` (outlet) | — |
| `/admin/tenants/:slug` | `TenantDetailPage` (outlet) | — |
| `*` | `Navigate to="/login"` | — |

**Deuda técnica:** Sin rutas para `ADMIN_TENANT` ni `USER_TENANT`. Sin página 404. `Home.tsx` no está conectado al router.

---

### `src/vite-env.d.ts`

**Propósito:** Extiende `ImportMetaEnv` con las variables de entorno del proyecto.

**Variables declaradas:**
| Variable | Tipo | Obligatoria | Propósito |
|----------|------|-------------|-----------|
| `VITE_KEYGO_BASE` | `string` | Sí | URL base del backend |
| `VITE_TENANT_SLUG` | `string` | Sí | Slug del tenant por defecto |
| `VITE_CLIENT_ID` | `string` | Sí | Client ID OAuth2 |
| `VITE_REDIRECT_URI` | `string` | Sí | URI de redirección OAuth2 |
| `VITE_TURNSTILE_SITE_KEY` | `string?` | No | Site key de Cloudflare Turnstile |

**Integración:** Consume en `src/api/client.ts`. El tipo opcional en `VITE_TURNSTILE_SITE_KEY` permite que `useTurnstile` y `TurnstileWidget` sean no-op automáticamente cuando la variable no está definida.

---

### `src/styles/index.css`

**Propósito:** Hoja de estilos global.

**Construcción:**
```css
@import "tailwindcss";                          /* Tailwind v4 */
@variant dark (&:where(.dark, .dark *));        /* Modo oscuro basado en clase */
html, body, #root { height: 100%; }            /* Layouts full-height */
body { font-family: Inter, ui-sans-serif, … }  /* Fuente base */
```

**Integración:**
- Importado en `src/main.tsx`.
- La variante `dark` es class-based (`.dark` en `<html>`) — sincronizada con el script inline de `index.html` y con `applyTheme()` en `useThemeStore`.
- `height: 100%` en `#root` es requerido por `AdminLayout` que usa `h-screen`.

**Deuda técnica:** Inter está declarada como fuente primaria pero no se importa explícitamente (Google Fonts o Fontsource). Si el OS no la tiene instalada, cae al fallback `ui-sans-serif`.

---

## 4. Módulo de autenticación — `src/auth/`

### `tokenStore.ts`

**Propósito:** Store global de sesión. Guarda tokens en memoria (nunca en disco).

**Construcción — Zustand store:**
```ts
interface TokenState {
  accessToken: string | null
  idToken: string | null
  refreshToken: string | null
  roles: AppRole[]
}
// Acciones: setTokens(...), clearTokens()
```

`clearTokens` también llama a `sessionStorage.removeItem(SESSION_KEY)` — acoplamiento controlado al ciclo de vida del token de refresco.

**Integración:**
- `src/api/client.ts` → lee `accessToken` via `getState()` en el interceptor de Axios.
- `src/auth/roleGuard.tsx` → lee `accessToken` y `roles` para autorización.
- `src/auth/refresh.ts` → llama `setTokens()` via `getState()` (fuera de React).
- `src/hooks/useCurrentUser.ts` → lee `idToken`.
- `src/layouts/AdminLayout.tsx` → llama `clearTokens()` en logout.

**Decisión de diseño:** Tokens en memoria (Zustand) protegidos de ataques XSS — un script malicioso no puede leer `localStorage`. El `refreshToken` en sesión (`sessionStorage`) es el único dato que persiste entre recargas; su alcance es por pestaña, lo que limita el daño de un token robado.

**Deuda técnica:** `SESSION_KEY = 'kg_rt'` está duplicado en `tokenStore.ts` y en `refresh.ts`. Debe extraerse a una constante compartida.

---

### `pkce.ts`

**Propósito:** Generación criptográfica de los parámetros PKCE para OAuth2.

**Construcción — tres funciones puras:**
- `generateCodeVerifier()` → 64 bytes aleatorios → base64url (512 bits de entropía, supera el mínimo del spec).
- `generateCodeChallenge(verifier)` → SHA-256 del verifier → base64url (método S256, asíncrono via `crypto.subtle`).
- `generateState()` → 32 bytes aleatorios → base64url (CSRF protection).

**Integración:** Llamado únicamente desde `src/pages/login/LoginPage.tsx` en el paso 0 del flujo de autenticación.

**Decisión de diseño:** Usa Web Crypto API nativa del browser — sin dependencias externas de criptografía. Seguro, ampliamente soportado en navegadores modernos.

**Deuda técnica:** El `state` generado nunca se valida en callback. En el flujo actual (POST-based, no redirect), no aplica. Si el flujo cambia a redirect-based, la validación del `state` es obligatoria para prevenir CSRF.

---

### `jwksVerify.ts`

**Propósito:** Verificación de `id_token` JWT contra las claves públicas del servidor (JWKS).

**Construcción:**
- Cache de instancias `RemoteJWKSet` por `tenantSlug` (singleton por pestaña).
- `verifyIdToken(idToken, tenantSlug)` — llama `jwtVerify` de `jose` con `algorithms: ['RS256']`.
- `extractRoles(claims)` — filtra los roles del JWT contra `APP_ROLES`; roles desconocidos son descartados silenciosamente.

**Integración:**
- `src/pages/login/LoginPage.tsx` → verifica el `id_token` tras el intercambio de código.
- `src/auth/refresh.ts` → verifica el nuevo `id_token` al restaurar la sesión.

**Decisión de diseño:** La cache de JWKS evita re-descargar las claves públicas en cada verificación. `jose` maneja la rotación de claves automáticamente (descarga nuevas claves cuando encuentra un `kid` desconocido).

**Deuda técnica:** No se pasa opción `issuer` a `jwtVerify`, lo que significa que tokens de emisores arbitrarios serían aceptados si la firma y el algoritmo son válidos. Se debe añadir `{ issuer: expectedIss }`.

---

### `refresh.ts`

**Propósito:** Persistencia y restauración de sesión entre recargas de página.

**Construcción:**
- `persistRefreshToken(rt)` → `sessionStorage.setItem('kg_rt', rt)`.
- `clearPersistedRefreshToken()` → `sessionStorage.removeItem('kg_rt')`.
- `restoreSession()` → lee el refresh token → llama a la API → verifica `id_token` → almacena tokens en Zustand → persiste el token rotado.

**Integración:**
- `src/main.tsx` → `restoreSession()` antes de montar React.
- `src/pages/login/LoginPage.tsx` → `persistRefreshToken()` tras login exitoso.
- `src/auth/tokenStore.ts` → `clearTokens()` llama `sessionStorage.removeItem('kg_rt')` (coordinación implícita).

**Decisión de diseño:** Implementa **token rotation** — cada refresh devuelve un nuevo refresh token que reemplaza inmediatamente al anterior. `sessionStorage` garantiza alcance de pestaña (no compartido entre tabs), reduciendo el riesgo de reutilización maliciosa de refresh tokens.

**Deuda técnica:**
- `SESSION_KEY` duplicado (ver `tokenStore.ts`).
- No hay un timer de refresh proactivo al 80% del TTL del `access_token` (documentado como requerido en las instrucciones del proyecto pero no implementado).

---

### `roleGuard.tsx`

**Propósito:** Componentes guard que protegen rutas por autenticación y por rol.

**Construcción — dos componentes:**

`AuthGuard({ children? })`:
- Lee `accessToken` del store.
- Sin token → `<Navigate to="/login" replace />`.
- Con token → renderiza `children ?? <Outlet />`.

`RoleGuard({ roles, redirectTo?, children? })`:
- Lee `accessToken` + `roles` del store.
- Sin token → `/login`.
- Sin rol requerido → `redirectTo ?? '/login'`.
- Con rol apropiado → `children ?? <Outlet />`.
- La lógica es `roles.some(r => userRoles.includes(r))` — unión (OR), no intersección (AND).

**Integración:** Usado en `src/App.tsx` para proteger `/admin/*` con `RoleGuard roles={['ADMIN']}`.

**Decisión de diseño:** El patrón `children ?? <Outlet />` soporta dos usos: envolver un componente directamente en JSX, o actuar como layout guard en rutas anidadas de React Router.

**Deuda técnica:** El redireccionamiento por rol incorrecto va a `/login` en lugar de a una página 403/Unauthorized dedicada. Puede confundir al usuario.

---

## 5. Módulo de API — `src/api/`

### `client.ts`

**Propósito:** Configuración de clientes Axios y constantes de URL.

**Construcción:**
```ts
// Constantes de configuración (desde variables de entorno)
export const KEYGO_BASE = import.meta.env.VITE_KEYGO_BASE ?? 'http://localhost:8080/...'
export const API_V1 = `${KEYGO_BASE}/api/v1`
export const TENANT = import.meta.env.VITE_TENANT_SLUG ?? 'keygo'
export const CLIENT_ID = ...
export const REDIRECT_URI = ...

// Constructores de URL
export const tenantUrl = (slug) => `${API_V1}/tenants/${slug}`
export const appUrl = (slug, clientId) => `${tenantUrl(slug)}/apps/${clientId}`
export const keygoUrl = tenantUrl(TENANT)

// Instancias Axios
export const authClient   // withCredentials: true (gestiona JSESSIONID)
export const apiClient    // interceptor de Bearer token
```

**Interceptor de `apiClient`:**
```ts
apiClient.interceptors.request.use(config => {
  const token = useTokenStore.getState().accessToken  // Zustand fuera de React
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

**Integración:** Importado por todos los módulos de `src/api/*.ts`.

**Decisión de diseño:** Dos instancias Axios separadas por responsabilidad — `authClient` para el flujo OAuth2 (necesita cookies de sesión del servidor), `apiClient` para llamadas autenticadas (necesita Bearer token).

**Deuda técnica:** Sin interceptor de respuesta para 401 (token expirado durante uso activo), sin timeout, sin normalización global de errores.

---

### `auth.ts`

**Propósito:** Funciones del flujo OAuth2/PKCE — autorización, login, intercambio de tokens y refresh.

**Construcción — 4 funciones:**

| Función | Método | Endpoint | Descripción |
|---------|--------|----------|-------------|
| `authorize(params)` | GET | `/tenants/{slug}/oauth2/authorize` | Establece sesión PKCE en el servidor |
| `login(params)` | POST | `/tenants/{slug}/account/login` | Valida credenciales → devuelve código de autorización |
| `exchangeToken(params)` | POST | `/tenants/{slug}/oauth2/token` | Intercambia código + verifier → tokens |
| `refreshToken(params)` | POST | `/tenants/{slug}/oauth2/token` | Renueva sesión con `grant_type=refresh_token` |

Todas usan `authClient` (con `withCredentials: true`) para que la cookie `JSESSIONID` del paso `authorize` se envíe automáticamente en los pasos posteriores.

**Integración:**
- `src/pages/login/LoginPage.tsx` → `authorize`, `login`, `exchangeToken`.
- `src/auth/refresh.ts` → `refreshToken`.

**Decisión de diseño:** El flujo es completamente POST-based (no hay redirección del navegador al `/callback`). Los pasos de autorización, login e intercambio se encadenan en JavaScript, simplificando la UX pero requiriendo gestión explícita de la cookie de sesión.

---

### `tenants.ts`

**Propósito:** CRUD de tenants para el admin global.

**Construcción:**

`TENANT_QUERY_KEYS` — constantes jerárquicas de query keys:
```ts
{
  all: ['tenants'],
  list: (params?) => ['tenants', 'list', params],
  detail: (slug) => ['tenants', slug],
}
```

Funciones:
| Función | Método | Endpoint | Notas |
|---------|--------|----------|-------|
| `listTenants(params?)` | GET | `/api/v1/tenants` | Soporta filtros y paginación |
| `getTenant(slug)` | GET | `/api/v1/tenants/{slug}` | — |
| `createTenant(data)` | POST | `/api/v1/tenants` | — |
| `suspendTenant(slug)` | PUT | `/api/v1/tenants/{slug}/suspend` | — |
| `activateTenant(slug)` | — | ⏳ pendiente T-033 | Mock de 500ms |

**Integración:**
- `src/pages/admin/TenantsPage.tsx` → `listTenants`, `TENANT_QUERY_KEYS.list`.
- `src/pages/admin/TenantDetailPage.tsx` → `getTenant`, `suspendTenant`, `activateTenant`.
- `src/pages/admin/TenantCreatePage.tsx` → `createTenant`.

**Decisión de diseño:** Query keys jerárquicas permiten invalidaciones inteligentes — `['tenants']` invalida todo, `['tenants', 'list', params]` solo la lista paginada actual.

---

### `users.ts`

**Propósito:** Registro de usuarios finales de un tenant.

**Construcción:**
```ts
export interface RegisterUserRequest {
  username: string; email: string; password: string;
  firstName?: string; lastName?: string;
}
export async function registerUser(tenantSlug, clientId, data): Promise<void>
// POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/register
```

**Deuda técnica:** Valida `res.data.success` en lugar de `res.data.data` — diferente al patrón del resto de módulos de API. Puede ser un bug latente según el contrato real del backend.

---

### `serviceInfo.ts`

**Propósito:** Información del estado del servicio backend (endpoints legacy usados previamente en el dashboard).

> **Nota:** Mantenido por compatibilidad. El nuevo dashboard usa `api/dashboard.ts`.

---

### `dashboard.ts`

**Propósito:** Endpoint único agregado del panel de control de la plataforma.

**Construcción:**
```ts
export const DASHBOARD_QUERY_KEYS = {
  platformDashboard: ['platform-dashboard'] as const,
}

// GET /api/v1/admin/platform/dashboard — requiere rol ADMIN
export async function getPlatformDashboard(): Promise<PlatformDashboardData>
```

**Integración:**
- Usa `apiClient` con Bearer token.
- Los tipos están definidos en `src/types/dashboard.ts`.
- Consumido por `AdminDashboardPage` vía `useQuery`.

**Decisión de diseño:** Endpoint único para reducir waterfalls de red — todo el estado inicial del dashboard en una sola request.

---

### `contracts.ts`

**Propósito:** ⚠️ Módulo legado (mock). Supersedido por `src/api/billing.ts`. Mantener solo para compatibilidad con `PlanId` si aún se referencia (ahora `PlanId` vive en `src/components/plans.ts`).

---

### `billing.ts`

**Propósito:** Módulo de API completo para el flujo de auto-contratación (billing). Conecta con todos los endpoints del contrato público del backend.

**Construcción:**
```ts
// Constante de query keys
export const BILLING_QUERY_KEYS = {
  catalog: (tenantSlug, clientId) => ['billing', 'catalog', tenantSlug, clientId],
  contract: (contractId) => ['billing', 'contract', contractId],
  // ...
}

// Helper de URL base
function billingBase(tenantSlug, clientId): string
// → `${KEYGO_BASE}/api/v1/tenants/{slug}/apps/{clientId}/billing`

// Funciones públicas (sin auth):
getBillingCatalog(tenantSlug?, clientId?) → AppPlan[]
createBillingContract(request, tenantSlug?, clientId?) → AppContract
verifyContractEmail(contractId, request, tenantSlug?, clientId?) → AppContract
mockApprovePayment(contractId, tenantSlug?, clientId?) → AppContract   // DEV only
activateBillingContract(contractId, tenantSlug?, clientId?) → AppContract
getBillingContract(contractId, tenantSlug?, clientId?) → AppContract

// Funciones autenticadas (Bearer required):
getActiveSubscription(tenantSlug?, clientId?) → AppSubscription
cancelSubscription(tenantSlug?, clientId?) → void
listInvoices(tenantSlug?, clientId?) → AppInvoice[]
```

**Integración:** `NewContractPage` (getTenantSlug/CLIENT_ID de `src/api/client.ts`), TanStack Query para catálogo, llamadas imperativas para transiciones de estado.

**Decisión de diseño:** `tenantSlug` y `clientId` tienen valores por defecto (`TENANT`, `CLIENT_ID` de `client.ts`), por lo que la mayoría de las llamadas no necesitan pasarlos explícitamente.

---

## 6. Tipos — `src/types/`

### `base.ts`

**Propósito:** Tipos base del contrato universal de respuesta del backend.

**Tipos clave:**
```ts
// Envelope de toda respuesta de la API
interface BaseResponse<T> {
  date: string
  success?: SuccessInfo    // { code, message? }
  failure?: FailureInfo    // { code, message }
  data?: T
}

// Paginación
interface PagedData<T> {
  content: T[]; page: number; size: number;
  total_elements: number; total_pages: number; last: boolean;
}
```

**Integración:** Todos los módulos de `src/api/` devuelven tipos derivados de `BaseResponse<T>`. Las funciones de API desenvuelven `.data` antes de retornar.

**Decisión de diseño:** `data`, `success` y `failure` son todos opcionales en el tipo, lo que refleja fielmente el contrato del backend pero obliga al frontend a verificar la presencia antes de usar. La documentación inline en `ErrorData` explica cómo mapear `origin` + `clientRequestCause` a UX.

---

### `auth.ts`

**Propósito:** DTOs del flujo de autenticación OAuth2/PKCE.

**Tipos:**
| Tipo | Uso |
|------|-----|
| `AuthorizeData` | Respuesta de `GET /oauth2/authorize` |
| `LoginData` | Respuesta de `POST /account/login` (contiene el `code`) |
| `TokenData` | Respuesta de `POST /oauth2/token` (todos los tokens) |
| `KeyGoJwtClaims` | Claims del `id_token` decodificado |

`KeyGoJwtClaims` incluye `roles?: string[]` y `tenant_slug?` como claims custom de KeyGo. El `?` refleja que tokens de diferentes versiones del servidor pueden no incluirlos.

---

### `tenant.ts`

**Propósito:** DTOs del dominio de tenants.

**Tipos:**
```ts
type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'

interface TenantData {
  id: string; slug: string; name: string;
  owner_email?: string; status: TenantStatus; created_at: string;
}

interface CreateTenantRequest { name: string; owner_email: string; }

interface ListTenantsParams {
  status?: TenantStatus; name_like?: string; page?: number; size?: number;
}
```

---

### `roles.ts`

**Propósito:** Fuente única de verdad para los roles de la aplicación.

**Construcción:**
```ts
export const APP_ROLES = ['ADMIN', 'ADMIN_TENANT', 'USER_TENANT'] as const
export type AppRole = (typeof APP_ROLES)[number]
// → 'ADMIN' | 'ADMIN_TENANT' | 'USER_TENANT'
```

**Decisión de diseño:** `as const` + `typeof` genera el tipo union desde el array — añadir un rol nuevo es un cambio en un único lugar. `APP_ROLES` también se usa en `extractRoles` de `jwksVerify.ts` como lista de roles válidos para filtrar los claims del JWT.

---

### `dashboard.ts`

**Propósito:** Tipos del endpoint agregado del panel de control de la plataforma.

**Tipos clave:**
```ts
export interface CountBreakdown { total, active, pending, suspended: number }
export interface SecurityMetric  { total, active: number }
export interface AlertMetric     { total, critical: number }

export interface PlatformDashboardData {
  service:  { name, environment, version, activeKey }
  iam:      { tenants, users, apps, memberships: CountBreakdown }
  security: { sessions, refreshTokens, authorizationCodes: SecurityMetric; alerts: AlertMetric }
  pendingActions:    PendingAction[]
  recentActivity:    ActivityItem[]
  topTenantsByUsers: RankedTenant[]
  topAppsByAccesses: RankedApp[]
  onboarding:        { pendingVerification, expiredVerifications, recentRegistrations, successfulVerifications: number }
}
```

**Consumido por:** `src/api/dashboard.ts`, `src/pages/admin/dashboard/` (sub-componentes).

---

### `billing.ts` (types)

**Propósito:** DTOs completos del módulo de billing alineados con `docs/api-docs.json`.

**Tipos clave:**
```ts
export type SubscriberType = 'TENANT' | 'TENANT_USER'
export type BillingPeriod  = 'MONTHLY' | 'ANNUAL' | 'ONE_TIME'
export type ContractStatus =
  | 'PENDING_EMAIL_VERIFICATION' | 'PENDING_PAYMENT'
  | 'READY_TO_ACTIVATE' | 'ACTIVATED' | 'EXPIRED' | 'CANCELLED' | 'FAILED'

export interface AppPlanEntitlement { metric, displayName, value, unit, enforcementMode }
export interface AppPlanVersion {
  id, version, billingPeriod: BillingPeriod,
  price, currency, trialDays, status: PlanStatus
  entitlements: AppPlanEntitlement[]
}
export interface AppPlan {
  id, name, description, subscriberType: SubscriberType,
  status: PlanStatus, versions: AppPlanVersion[]
}

export interface AppContract {
  id, status: ContractStatus, subscriberType: SubscriberType,
  contractorEmail, contractorFirstName, contractorLastName,
  planVersionId, billingPeriod: BillingPeriod,
  companyName?, companySlug?, companyTaxId?, companyAddress?
}

export interface CreateContractRequest { planVersionId, billingPeriod, subscriberType, contractorEmail,
  contractorFirstName, contractorLastName, companyName?, companySlug?, companyTaxId?, companyAddress? }
export interface VerifyContractEmailRequest { code: string }
```

**Consumido por:** `src/api/billing.ts`, todos los steps de `src/pages/register/`.

---

**Propósito:** Fuente única de verdad para los roles de la aplicación.

**Construcción:**
```ts
export const APP_ROLES = ['ADMIN', 'ADMIN_TENANT', 'USER_TENANT'] as const
export type AppRole = (typeof APP_ROLES)[number]
// → 'ADMIN' | 'ADMIN_TENANT' | 'USER_TENANT'
```

**Decisión de diseño:** `as const` + `typeof` genera el tipo union desde el array — añadir un rol nuevo es un cambio en un único lugar. `APP_ROLES` también se usa en `extractRoles` de `jwksVerify.ts` como lista de roles válidos para filtrar los claims del JWT.

---

## 7. Hooks — `src/hooks/`

### `useCurrentUser.ts`

**Propósito:** Expone los datos del usuario autenticado actual de forma tipada.

**Construcción:**
```ts
interface CurrentUser { sub: string; email?: string; username?: string; displayName?: string; roles: string[] }

function useCurrentUser(): CurrentUser | null {
  const { idToken, roles } = useTokenStore()
  if (!idToken) return null
  const claims = decodeJwt(idToken)  // decode solo, sin verificar (el token ya fue verificado al login)
  // displayName = username ?? email ?? sub
}
```

**Integración:** Usado en `src/layouts/AdminLayout.tsx` para mostrar nombre, iniciales y rol en sidebar y header.

**Decisión de diseño:** `decodeJwt` (sin verify) es suficiente aquí porque: el token ya fue verificado criptográficamente en `jwksVerify.ts` al recibirlo, y este hook es solo para display — no para decisiones de seguridad.

---

### `useHoneypot.ts`

**Propósito:** Detección de bots mediante campo trampa + verificación de tiempo mínimo de interacción.

**Construcción:**
```ts
const MIN_INTERACTION_MS = 1500

function useHoneypot() {
  // mountedAt: timestamp de inicio → rechaza envíos en < 1500ms
  // value: contenido del campo honeypot → debe estar vacío
  return {
    validate(): { blocked: boolean; reason: '...' | null }
    fieldProps: { tabIndex: -1, autoComplete: 'off', aria-hidden: true, ... }
  }
}
```

**Integración:** `HoneypotField` renderiza el campo usando `fieldProps`. `validate()` es llamado en el `onSubmit` del formulario; si `blocked`, la submission se descarta silenciosamente.

**Decisión de diseño:** La submisión bloqueada nunca muestra un error al usuario — los bots no reciben retroalimentación. El tiempo mínimo de 1500ms descarta scripts que no simulan comportamiento humano.

---

### `useRateLimit.ts`

**Propósito:** Bloqueo progresivo de intentos fallidos en formularios críticos (login).

**Construcción:**
```ts
function useRateLimit(formKey: string) {
  // Estado en localStorage: { attempts, lockedUntil }
  // Clave: `keygo_rl_${formKey}`
  return { isLocked, remainingSeconds, attempts, recordFailure, recordSuccess }
}
```

**Tabla de bloqueo:**
| Intentos | Duración de bloqueo |
|----------|---------------------|
| ≥ 3 | 30 segundos |
| ≥ 5 | 5 minutos |
| ≥ 10 | 30 minutos |

**Integración:** Usado en `src/pages/login/LoginPage.tsx`. `recordFailure()` se llama en errores de credenciales; `recordSuccess()` limpia el estado tras login exitoso.

**Decisión de diseño:** Client-side rate limiting como capa de UX/fricción, no como control de seguridad real. Persiste en `localStorage` (sobrevive F5 pero no limpieza de datos). Complementa el rate limiting del lado servidor.

**Deuda técnica:** El `setInterval` del countdown no se limpia al desmontar el componente — puede generar warnings de "state update on unmounted component".

---

### `useTheme.ts`

**Propósito:** Gestión de preferencia de tema (claro/oscuro/sistema) con persistencia.

**Construcción:**
- `useThemeStore` — Zustand store que sincroniza `localStorage` ↔ clase `.dark` en `<html>`.
- `applyTheme(preference)` — aplica la clase `dark` según preferencia y `prefers-color-scheme`.
- `useTheme()` — hook que expone `{ preference, setPreference, cycleTheme }` y escucha cambios del OS cuando `preference === 'system'`.

**Integración:** Usado en `src/layouts/AdminLayout.tsx` (ThemeToggle en el header).

**Decisión de diseño:** El store lee `localStorage` sincrónicamente en el momento de importación del módulo, garantizando coherencia con el script inline de `index.html` que ya aplicó el tema antes del primer paint.

---

### `useTurnstile.ts`

**Propósito:** Integración con Cloudflare Turnstile CAPTCHA.

**Construcción:**
- Si `VITE_TURNSTILE_SITE_KEY` no está definida → devuelve `{ enabled: false }` (no-op total).
- Si está definida: inyecta el script de Turnstile dinámicamente (con guard por `id` para evitar duplicados), renderiza el widget en el `containerRef` y expone el token.
- Limpia el widget en unmount (`turnstile.remove(widgetId)`).

**Integración:** Consumido por `TurnstileWidget.tsx`. El token resultante bloquea la submission del formulario hasta que Turnstile lo valida.

**Deuda técnica:** Si múltiples formularios con Turnstile están montados simultáneamente, el guard por `id` funciona correctamente pero solo el último widget que se monte podría comportarse inesperadamente.

---

## 8. Componentes reutilizables — `src/components/`

### `HoneypotField.tsx`

**Propósito:** Campo trampa visualmente invisible para bots.

**Construcción:**
```tsx
// Div posicionado a -9999px (fuera de pantalla pero en el DOM)
// Input con label "Website" — nombre común que los bots rellenan
// aria-hidden="true", tabIndex={-1}, autoComplete="off"
```

**Integración:** Usado en `LoginPage`, `NewContractPage`, `UserRegisterPage`. El hook `useHoneypot` conecta el valor del campo con la lógica de validación.

**Decisión de diseño:** CSS off-screen en lugar de `display: none` o `visibility: hidden`, porque algunos bots detectan y saltan campos visualmente ocultos.

---

### `TurnstileWidget.tsx`

**Propósito:** Componente UI que envuelve el widget de Cloudflare Turnstile.

**Construcción:**
- Retorna `null` si Turnstile no está configurado (zero footprint).
- Patrón `callbackRef` para evitar closures obsoletos en `onTokenChange`:
  ```ts
  const callbackRef = useRef(onTokenChange)
  useEffect(() => { callbackRef.current = onTokenChange })       // sincroniza ref
  useEffect(() => { callbackRef.current(token) }, [token])       // dispara con token nuevo
  ```
- Muestra `<p role="alert">` si el widget falla al cargar.

**Integración:** Recibe `onTokenChange` del padre. El padre usa el token para habilitar/deshabilitar el botón de submit.

**Decisión de diseño:** El doble-`useEffect` con ref es el patrón recomendado para callbacks en efectos sin volverlos dependencia directa (evita re-ejecuciones en bucle).

---

### `PlanCard.tsx`

**Propósito:** Tarjeta de plan de precios reutilizable en dos modos (display y selección).

**Construcción — discriminated union:**
```ts
type PlanCardProps =
  | { plan: PlanInfo; mode: 'display'; ctaTo: string }
  | { plan: PlanInfo; mode: 'select'; selected: boolean; onSelect: () => void }
```

- `mode='display'` → `<article>` + `<Link>` (landing pricing).
- `mode='select'` → `<button aria-pressed={selected}>` (asistente de contratación).

**Integración:**
- `PricingSection` → `mode='display'` con `ctaTo=/subscribe?plan=...`.
- `PlanStep` → `mode='select'` con callbacks de selección.

**Decisión de diseño:** Unión discriminada en vez de dos componentes separados — mantiene la consistencia visual sin duplicar el markup del card.

---

### `plans.ts`

**Propósito:** Datos estáticos de los planes de suscripción.

**Construcción:**
```ts
export interface PlanInfo { id: PlanId; name: string; badge?: string; price: string; ... }
export const PLANS: PlanInfo[] = [starter, business, onPremise]
export const PLAN_NAMES: Record<PlanId, string> = { starter: 'Starter', ... }
```

**Integración:** `PricingSection`, `PlanStep` (plan cards), `NewContractPage` (resumen del paso 3), `SuccessStep` (nombre del plan en confirmación).

**Decisión de diseño:** Datos de planes son estáticos — no hay API que los sirva. `PlanId` en `contracts.ts` y `PLANS` en `plans.ts` forman el contrato de tipo entre la UI y el módulo de API.

---

### `ScrollToTop.tsx`

**Propósito:** Botón flotante de scroll-to-top visible al desplazarse.

**Construcción:**
- Listener pasivo en `window.scroll`.
- Visible cuando `scrollY > 200`.
- `window.scrollTo({ top: 0, behavior: 'smooth' })` al hacer clic.
- `aria-label` descriptivo para accesibilidad.

**Integración:** Montado directamente en `LandingPage` (al final del árbol JSX).

---

## 9. Layouts — `src/layouts/`

### `AdminLayout.tsx`

**Propósito:** Shell de la interfaz del administrador global — estructura persistente (sidebar + header) con `<Outlet>` para el contenido de cada página.

**Construcción:**

**Componentes privados internos:**
- Iconos SVG inline (`IconKey`, `IconDashboard`, `IconBuilding`, `IconApps`, `IconUsers`, `IconShield`, `IconClipboard`, `IconKeySmall`, `IconClock`, `IconTicket`, `IconCloud`, etc.) — sin dependencia de librería de iconos.
- `ThemeToggle` — dropdown de tema con cierre por click exterior y `role="listbox"`.
- `NavSection` — título de grupo en el sidebar (separador visual cuando colapsado).
- `NavItem` — wrapper de `NavLink` con estilos de ítem activo y soporte de modo colapsado (solo icono).
- `UserAvatar` — genera iniciales desde `displayName` para el avatar circular.

**Grupos de navegación actuales:**

| Grupo | Items |
|-------|-------|
| Plataforma | Dashboard, Tenants, Apps, Usuarios |
| Accesos & Registro | Accesos, Registro |
| Seguridad | Claves de firma, Sesiones, Tokens |
| Sistema | API, Configuración, Mi cuenta |

**Estado local:**
| Estado | Tipo | Propósito |
|--------|------|-----------|
| `collapsed` | boolean | Sidebar colapsado en desktop (solo iconos) |
| `mobileOpen` | boolean | Sidebar abierto en móvil (cajón) |
| `dropdownOpen` | boolean | Menú de usuario abierto |

**Effects:**
- Cierra el cajón móvil al cambiar de ruta (`location.pathname`).
- Cierra el dropdown de usuario al hacer click fuera (`mousedown` en `document`).

**Flujo de logout:** `clearTokens()` → `navigate('/login', { replace: true })`.

**Estructura DOM:**
```
div.flex.h-screen
├── div (backdrop móvil, condicional)
├── aside (sidebar)
│   ├── Logo + toggle colapsar
│   ├── nav > NavItem × N
│   └── Strip de usuario (avatar + nombre + rol)
└── div.flex-1.flex-col
    ├── header (hamburger | search | ThemeToggle | bell | user dropdown)
    └── main > Outlet
```

**Integración:**
- `useCurrentUser` → nombre + iniciales + rol del usuario en sidebar y dropdown.
- `useTheme` → ThemeToggle.
- `useTokenStore.clearTokens` → logout.
- `AdminLayout` es el `element` del route `/admin` en `App.tsx`.

**Decisión de diseño:** Iconos SVG inline para evitar una dependencia de librería de iconos. La consistencia visual se logra usando siempre el mismo tamaño (`w-5 h-5`) y `aria-hidden="true"`.

**Deuda técnica:**
- Buscador en el header es solo decorativo.
- Campana de notificaciones sin funcionalidad.
- "Mi perfil" y "Configuración" en el dropdown no navegan a ningún lado.
- Sin keyboard navigation completa en ThemeToggle (solo focus ring).

---

## 10. Páginas — `src/pages/`

### 10.1 Landing — `src/pages/landing/`

**`LandingPage.tsx`** — Composición casi pura. Monta `LandingNav` + 6 secciones + `CTASection` + `ScrollToTop` y consume un flag de navegación en `location.state` para forzar scroll al inicio cuando se vuelve desde `/developers`.

**Secciones:**
| Archivo | Propósito | Notas |
|---------|-----------|-------|
| `LandingNav.tsx` | Barra de nav fija con links de ancla y CTAs | Sin menú móvil — deuda técnica |
| `HeroSection.tsx` | Banner full-height con CTAs | Static content |
| `FeaturesSection.tsx` | Grid de 6 feature cards | Array de datos inline |
| `HowItWorksSection.tsx` | 3 pasos del flujo de auth | Array de datos inline |
| `RolesSection.tsx` | Tarjetas de los 3 roles | Mapeados desde `AppRole` values |
| `PricingSection.tsx` | Grid de plan cards en modo display | Usa `PlanCard` + `PLANS` |
| `DevelopersSection.tsx` | Recursos para devs | Enlaza la guía pública de integración y deja solo SDKs como pendiente |
| `CTASection.tsx` | Footer con CTA final y copyright | Año dinámico: `new Date().getFullYear()` |

**Decisión de diseño:** Cada sección es un componente independiente para facilitar su mantenimiento y reemplazo. `LandingPage` no contiene lógica — solo composición.

**Actualización relevante:** `DevelopersSection.tsx` pasó de ser un bloque meramente promocional a un punto de entrada funcional hacia la guía pública `/developers`, usando `Link` de React Router para navegar a la documentación y al ancla de endpoints.

---

### 10.2 Login — `src/pages/login/`

**`LoginPage.tsx`**

**Propósito:** Implementación completa del flujo OAuth2/PKCE desde el navegador.

**Construcción:**

Componentes privados:
- `InitLoadingState` — spinner durante inicialización.
- `InitErrorState` — error con opción de retry.
- `LoginForm` — formulario de credenciales con honeypot, Turnstile, rate limiting.

Helpers privados:
- `resolveRedirectPath(roles)` — mapea rol → ruta post-login.
- `extractAuthorizeError(error)` — normaliza errores del paso 1.
- `extractLoginError(error)` — normaliza errores del paso 2.

**Máquina de estados implícita (renderCardContent):**
```
initMutation.isPending && autoreintentando && hay error → InitErrorState (estático)
initMutation.isPending                                  → InitLoadingState
initMutation.isError                                    → InitErrorState
initMutation.isSuccess                                  → LoginForm
```

**Mutaciones:**
- `initMutation` — Pasos 0-1: genera PKCE → `authorize()`.
- `loginMutation` — Pasos 2-3: `login()` → `exchangeToken()` → `verifyIdToken()` → `setTokens()` → navigate.

**Refs clave:**
- `codeVerifierRef` — preserva el verifier PKCE entre paso 1 y paso 3.
- `loginPhaseRef` — distingue errores de login vs. errores post-login para enrutar el handling.
- `isAutoRetryingRef` — suprime el spinner durante auto-reintentos silenciosos.

**Integración:** `authorize`, `login`, `exchangeToken` (api/auth.ts) → `verifyIdToken`, `extractRoles` (auth/jwksVerify.ts) → `setTokens` (auth/tokenStore.ts) → `persistRefreshToken` (auth/refresh.ts) → `useHoneypot`, `useRateLimit`, `TurnstileWidget`.

**Deuda técnica:** `resolveRedirectPath` referencia rutas (`/tenant-admin/dashboard`, `/dashboard`) que aún no existen en el router.

---

### 10.3 Nuevo contrato — `src/pages/register/`

**`NewContractPage.tsx`**

**Propósito:** Wizard de 5 pasos para auto-contratación de un plan. Soporta flujo B2B (empresa) y B2C (personal) determinado por el campo `subscriberType` del catálogo.

**Construcción:**
- **Estado de la página:** `step` (0–4 | 'done'), `selectedPlan`, `selectedVersion`, `contractor`, `contractId`, `isProcessing`, `processError`.
- **Catálogo:** `useQuery` con `BILLING_QUERY_KEYS.catalog` → `getBillingCatalog()`. TTL de 5 min.
- **Modo reanudación integrado:** desde el mismo wizard (`/subscribe`) permite lookup por ID de contrato en el paso 4 (email), hidrata plan/version desde catálogo y reposiciona el flujo en email o pago según el estado del contrato.
- **Pasos:**
  - 0 → `PlanStep`: selección desde catálogo API, toggle de periodicidad.
  - 1 → `ContractorStep`: formulario RHF+Zod diferenciado B2B/B2C.
  - 2 → `TermsStep`: revisión + legal + Turnstile → llama `createBillingContract()`.
  - 3 → `EmailVerificationStep`: OTP 6-dígitos → llama `verifyContractEmail()`.
  - 4 → `PaymentStep`: orden + (en DEV) mock payment → `mockApprovePayment()` + `activateBillingContract()`.
  - `done` → `SuccessStep`.
- `StepIndicator` (privado): 5 steps, con checkmark SVG para completados y `aria-current="step"` para el activo.
- Honeypot a nivel de página (`HoneypotField` + `useHoneypot`) filtrado en `handleTermsSubmit`.
- Ancho de tarjeta mayor en paso 0 (grilla de planes) que en los demás pasos.

**Steps:**
| Componente | Archivo | Responsabilidad |
|-----------|---------|-----------------|
| `PlanStep` | `steps/PlanStep.tsx` | Grilla de planes desde API; toggle mensual/anual |
| `ContractorStep` | `steps/ContractorStep.tsx` | Formulario RHF+Zod, B2B con companySlug auto-generado |
| `TermsStep` | `steps/TermsStep.tsx` | Resumen + checkboxes legales + Turnstile + `createContract` |
| `EmailVerificationStep` | `steps/EmailVerificationStep.tsx` | Input OTP 6-dígitos con auto-foco y paste |
| `PaymentStep` | `steps/PaymentStep.tsx` | Mock DEV / aviso PROD + activación |
| `SuccessStep` | `steps/SuccessStep.tsx` | Confirmación con companySlug (B2B) y link a `/login` |

**Integración:** `getBillingCatalog`, `createBillingContract`, `verifyContractEmail`, `mockApprovePayment`, `activateBillingContract` de `src/api/billing.ts`; `BILLING_QUERY_KEYS`; `useHoneypot`; `HoneypotField`; `toast` (sonner).

---

### 10.4 Registro de usuario — `src/pages/register/`

**`UserRegisterPage.tsx`**

**Propósito:** Wizard de 2 pasos para auto-registro de usuarios finales de un tenant existente.

**Construcción:**
- Pasos: `CompanyStep` → `PersonalStep` → `SuccessState`.
- `CompanyStep` (privado): slug del tenant + client ID, validados con regex `/^[a-z0-9-]+$/`.
- `PersonalStep` (privado): datos personales + contraseña con confirmación (`.refine()` en Zod).
- Llamada real a `registerUser()` — el único formulario público con backend operativo.

**Integración:** `registerUser` (api/users.ts), `useHoneypot`, `HoneypotField`, `TurnstileWidget`.

---

### 10.5 Admin — Dashboard

**`src/pages/admin/DashboardPage.tsx`** — container
**`src/pages/admin/dashboard/`** — sub-componentes

**Propósito:** Panel de control completo de la plataforma. Orquesta datos y renderizado por filas temáticas.

**Construcción (container):**
```tsx
const { data, isLoading, isError, refetch, isFetching } = useQuery({
  queryKey: DASHBOARD_QUERY_KEYS.platformDashboard,
  queryFn: getPlatformDashboard,   // GET /api/v1/admin/platform/dashboard
})
```

- Header con selector de rango (Hoy / 7 días / 30 días, estado local) + botón Actualizar + Acciones rápidas.
- 6 filas semánticas, cada una en un `<section aria-labelledby>` con su skeleton y componente de datos.

**Sub-componentes (`src/pages/admin/dashboard/`):**

| Archivo | Responsabilidad |
|---------|----------------|
| `DashboardPrimitives.tsx` | StatCard, BreakdownCard, SecurityCard, SectionTitle, CardSkeleton, ErrorAlert |
| `ServiceStatusRow.tsx` | Fila 1: Servicio, Entorno, Versión, Clave activa |
| `IamCoreRow.tsx` | Fila 2: Tenants/Usuarios/Apps/Memberships con breakdown |
| `SecurityRow.tsx` | Fila 3: Sesiones/Refresh Tokens/Auth Codes/Alertas |
| `PendingAndActivityRow.tsx` | Fila 4: Pendientes de gestión + Actividad reciente |
| `RankingsRow.tsx` | Fila 5: Top tenants por usuarios / Top apps por accesos |
| `OnboardingHealthRow.tsx` | Fila 6: 4 métricas de salud de onboarding |

**Integración:** `getPlatformDashboard`, `DASHBOARD_QUERY_KEYS` (api/dashboard.ts) · tipos en `types/dashboard.ts`.

**Decisión de diseño:** Un único endpoint agrega todos los datos para evitar waterfalls. El selector de rango es local hasta que el backend soporte parámetros de filtro temporal.

**Deuda técnica:** El rango seleccionado (Hoy / 7d / 30d) no se envía al backend (el endpoint no define query params de rango). Se activa como filtro cuando el backend lo soporte.

---

### 10.6 Admin — Tenants

**`src/pages/admin/TenantsPage.tsx`**

**Propósito:** Vista master-detail de la lista de tenants con búsqueda, filtros y paginación.

**Construcción:**

Estado local:
| Estado | Tipo | Propósito |
|--------|------|-----------|
| `search` | string | Texto del buscador (debounce 350ms) |
| `statusFilter` | `TenantStatus \| 'ALL'` | Pestaña activa |
| `page` | number | Página actual (1-based) |
| `debouncedSearch` | string | Valor de búsqueda tras delay |

```tsx
const { data, isLoading } = useQuery({
  queryKey: TENANT_QUERY_KEYS.list({ status, name_like, page }),
  queryFn: () => listTenants({ status, name_like: debouncedSearch, page }),
})
```

- Panel izquierdo: lista paginada con skeleton, estado vacío y paginación.
- Panel derecho: `<Outlet />` — muestra `TenantDetailPage` o `TenantCreatePage` según ruta.
- Responsive: en móvil, lista o detalle (no ambos).

**Integración:** `listTenants`, `TENANT_QUERY_KEYS` (api/tenants.ts), rutas anidadas via `<Outlet>`.

---

### 10.7 Admin — Detalle de Tenant

**`src/pages/admin/TenantDetailPage.tsx`**

**Propósito:** Vista detallada de un tenant con sus acciones de gestión.

**Construcción:**
```tsx
const { slug } = useParams()
const { data, isLoading, isError } = useQuery({
  queryKey: TENANT_QUERY_KEYS.detail(slug),
  queryFn: () => getTenant(slug),
})
```

Mutaciones:
- `suspendMutation` → `suspendTenant(slug)` → invalida `.all` + `.detail(slug)` → toast.
- `activateMutation` → `activateTenant(slug)` (mock) → invalida queries → toast con advertencia.

Acciones condicionadas por `TenantStatus`:
- `ACTIVE` → muestra "Suspender" (rojo).
- `SUSPENDED` → muestra "Reactivar" (verde, con badge de mock).

**Integración:** `getTenant`, `suspendTenant`, `activateTenant`, `TENANT_QUERY_KEYS` (api/tenants.ts), `useQueryClient` para invalidaciones.

---

### 10.8 Admin — Crear Tenant

**`src/pages/admin/TenantCreatePage.tsx`**

**Propósito:** Formulario de creación de nuevo tenant.

**Construcción:**
```tsx
const schema = z.object({ name: z.string().min(1).max(255), owner_email: z.string().email() })
const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) })

const mutation = useMutation({
  mutationFn: createTenant,
  onSuccess: (tenant) => {
    queryClient.invalidateQueries({ queryKey: TENANT_QUERY_KEYS.all })
    toast.success(`Tenant '${tenant.name}' creado correctamente.`)
    navigate(`/admin/tenants/${tenant.slug}`)
  }
})
```

**Integración:** `createTenant`, `TENANT_QUERY_KEYS` (api/tenants.ts), `useNavigate`, `useQueryClient`.

---

### 10.9 Developer docs — `src/pages/developers/`

**`DeveloperDocsPage.tsx`**

**Propósito:** página pública que documenta dos modelos de integración con KeyGo: login propio y login integrado de keygo-ui como hosted login.

**Construcción:** organiza el contenido en cinco bloques: hero introductorio, comparativa de estrategias, sección de login propio, sección de login integrado, catálogo mínimo de endpoints y checklist de seguridad. Usa arrays inline para prerrequisitos, endpoints y reglas, renderiza snippets con subcomponentes locales `CodePanel`, `JsonPanel` y `QueryStringPanel`, tablas de campos con `FieldTable`, tabs de I/O con `EndpointIoTabs`, tabs de catálogo con `EndpointCatalogTabs`, y normaliza el scroll de entrada con `useLocation`: sin hash sube al tope; con hash hace scroll a la sección objetivo. El bloque de endpoints se presenta como tabs accesibles por endpoint para reducir altura visual y facilitar comparación rápida. Las tabs del catálogo usan etiquetas concisas (`Authorize`, `Login`, `Token`, `JWKS`) en layout con `flex-wrap` para evitar scroll horizontal en pantallas estrechas. El endpoint activo muestra método HTTP, requisito de auth/sesión y alterna en tabs entre `Request` y `Response`: `Request` muestra tablas de campos por canal (`queryParams` y/o `requestBody`) más ejemplos (query string para `queryParams`, JSON para `requestBody`), mientras `Response` muestra formato, tabla de campos y ejemplos JSON. Cada bloque usa una lista `examples[]` para soportar variantes excluyentes del mismo endpoint (por ejemplo, `authorization_code` y `refresh_token` en `/oauth2/token`).

**Integración:** se registra en `App.tsx` bajo la ruta pública `/developers`, reutiliza `AppFooter` para mantener consistencia visual con el resto del acceso público, es enlazada desde `src/pages/landing/DevelopersSection.tsx` y al volver al landing navega con `state={{ scrollToTop: true }}` para resetear la posición vertical de la home.

**Decisión de diseño:** se implementó como página pública separada, no como una subsección adicional del landing, para permitir un contenido más profundo, navegable por anclas y con snippets de código sin sobrecargar la home de marketing.

**Estrategia:** documentación embebida en la SPA pública. El contenido es framework-agnóstico y describe el contrato HTTP real del backend en lugar de exponer helpers internos del proyecto.

**Puntos de mejora / deuda técnica conocida:** la guía describe el patrón de login central soportado por el backend, pero la pantalla pública de login actual sigue parametrizada al tenant y client configurados por defecto; si se quiere ofrecer hosted login multi-tenant real desde esta misma SPA, habrá que aceptar parámetros dinámicos en la ruta de login.

---

## 11. Cómo extender el proyecto

### Añadir una nueva página de admin

1. Crear `src/pages/admin/MiPagina.tsx` con `export default MiPagina`.
2. Añadir la ruta en `src/App.tsx` dentro del bloque `/admin`:
   ```tsx
   <Route path="mi-ruta" element={<MiPagina />} />
   ```
3. Añadir `NavItem` en `src/layouts/AdminLayout.tsx` con el icono y la ruta.
4. Si necesita datos: crear función en `src/api/` y los tipos en `src/types/`.
5. Actualizar `docs/FUNCTIONAL_GUIDE.md` y este archivo.

### Añadir el área ADMIN_TENANT

1. Crear `src/layouts/TenantAdminLayout.tsx` (clonar `AdminLayout` adaptando la nav).
2. Crear `src/pages/tenant-admin/` con las páginas necesarias.
3. Añadir en `App.tsx`:
   ```tsx
   <Route path="/tenant-admin" element={<RoleGuard roles={['ADMIN_TENANT']}><TenantAdminLayout /></RoleGuard>}>
     <Route index element={<Navigate to="dashboard" />} />
     <Route path="dashboard" element={<TenantDashboardPage />} />
   </Route>
   ```

### Añadir un endpoint real donde hay un mock

1. Verificar el path en `docs/api-docs.json`.
2. Reemplazar la función mock en `src/api/` con la llamada real (Axios).
3. Actualizar o eliminar el handler MSW correspondiente en `src/mocks/handlers.ts`.
4. Eliminar el badge `⏳` o comentario de mock del código.

### Añadir un nuevo formulario

1. Definir schema Zod en el componente de la página.
2. `useForm({ resolver: zodResolver(schema) })`.
3. `useMutation({ mutationFn: miFuncionDeApi })`.
4. Incluir `HoneypotField` si el formulario es público.
5. Incluir `TurnstileWidget` si el formulario es de alto riesgo (login, registro, contratación).

### Instalar infraestructura de tests

```bash
npm install -D vitest @testing-library/react @testing-library/user-event msw
```

Crear `src/mocks/handlers.ts` con `http.get/post(...)` de MSW respetando el shape `BaseResponse<T>`. Configurar `vitest.config.ts` con `environment: 'jsdom'`.

---

## 12. Deuda técnica consolidada

| # | Ubicación | Descripción | Prioridad |
|---|-----------|-------------|-----------|
| 1 | `src/auth/tokenStore.ts` + `refresh.ts` | `SESSION_KEY = 'kg_rt'` duplicado | Baja |
| 2 | `src/auth/jwksVerify.ts` | No se valida el `issuer` en `jwtVerify` | **Alta** (seguridad) |
| 3 | `src/auth/pkce.ts` | `state` generado pero nunca validado | Media (solo si se migra a redirect) |
| 4 | `src/auth/refresh.ts` | Sin timer de refresh proactivo al 80% del TTL | Media |
| 5 | `src/auth/roleGuard.tsx` | Redirige a `/login` en vez de `/403` para rol incorrecto | Baja |
| 6 | `src/api/client.ts` | Sin interceptor de respuesta para 401 silencioso | Media |
| 7 | `src/api/client.ts` | Sin timeout global en Axios | Baja |
| 8 | `src/api/users.ts` | Valida `.success` en vez de `.data` (inconsistente) | Media |
| 9 | `src/api/contracts.ts` | Módulo legado (mock) — `PlanId` migrado a `plans.ts`. Pendiente eliminar si no hay más dependientes | Baja |
| 10 | `src/hooks/useRateLimit.ts` | `setInterval` no se limpia en unmount | Baja |
| 11 | `src/styles/index.css` | Fuente `Inter` no importada explícitamente | Baja |
| 12 | `src/main.tsx` | `QueryClient` sin configuración global (staleTime, retry) | Baja |
| 13 | `src/App.tsx` | Sin rutas para `ADMIN_TENANT` y `USER_TENANT` | Media |
| 14 | `src/App.tsx` | Sin página 404 (catch-all va a `/login`) | Baja |
| 15 | `src/pages/admin/DashboardPage.tsx` | Selector de rango (Hoy/7d/30d) es solo estado visual — no se envía al backend | Baja |
| 16 | `src/pages/landing/LandingNav.tsx` | Sin menú de navegación en móvil | Baja |
| 17 | `src/layouts/AdminLayout.tsx` | Buscador, notificaciones, Mi perfil y Configuración son decorativos | Media |
| 18 | Proyecto general | Sin infraestructura de tests (Vitest, Testing Library, MSW) | **Alta** |
| 19 | `tsconfig.json` | `moduleResolution: "Node"` es el modo legacy | Baja |

---

## 13. Documentación de trazabilidad

Se incorporó la carpeta `docs/tracking-telemetry/` para consolidar la estrategia de tracking y telemetría de usuario. Esta carpeta concentra decisiones, arquitectura, contrato de eventos, privacidad, operación, rollout y KPIs, de forma separada de la guía técnica general.

### Archivos incluidos

| Archivo | Propósito |
|---------|-----------|
| `docs/tracking-telemetry/README.md` | Resumen ejecutivo, decisiones cerradas e índice de navegación |
| `docs/tracking-telemetry/01-vision-alcance.md` | Objetivos, no objetivos, casos de uso y principios |
| `docs/tracking-telemetry/02-arquitectura.md` | Diseño de captura, cola, scheduler y transporte batch |
| `docs/tracking-telemetry/03-contrato-eventos.md` | Envelope, taxonomía, versionado e idempotencia |
| `docs/tracking-telemetry/04-privacidad-seguridad.md` | Minimización de datos, sanitización y controles de acceso |
| `docs/tracking-telemetry/05-operacion-retencion.md` | Retención de 90 días, envío cada 10-15 min y SLO operativo |
| `docs/tracking-telemetry/06-rollout-fases.md` | Fases A/B/C con riesgos y mitigaciones |
| `docs/tracking-telemetry/07-verificacion-kpis.md` | Estrategia de pruebas y métricas de calidad del dato |
| `docs/tracking-telemetry/08-backend-contrato-pendiente.md` | Gap contractual actual y propuesta de ingestión batch |
| `docs/tracking-telemetry/09-plan-prs.md` | Plan de ejecución incremental por PR con alcance, riesgos y rollback |

### Decisión de diseño

Se eligió desacoplar esta temática en una carpeta dedicada para evitar sobrecargar la guía técnica principal y permitir evolución independiente del plan de telemetría sin mezclarlo con documentación de módulos de código ya implementados.

---

## 14. Plan de pruebas de seguridad de login

Se incorporó `docs/SECURITY_LOGIN_TEST_PLAN.md` como documento operativo para validar hardening del flujo OAuth2/PKCE desde una perspectiva defensiva.

**Propósito:** estandarizar pruebas repetibles sobre login y protección de credenciales, priorizando riesgos de autenticación indebida (por ejemplo, conocer solo `tenantSlug`) y abuso de sesión/código.

**Construcción:** el plan está organizado por bloques de riesgo (tenant/client/redirect, sesión intermedia, PKCE/state/code, robo de credenciales, CORS/CSRF), cada uno con casos de prueba, resultado esperado y severidad.

**Integración:** complementa `docs/AUTH_FLOW.md` (flujo y contratos), `docs/FRONTEND_DEVELOPER_GUIDE.md` (guía de implementación) y `docs/api-docs.json` (fuente de verdad técnica de endpoints).

**Artefacto operativo asociado:** `docs/SECURITY_LOGIN_RUNBOOK.md` traduce el plan a una secuencia ejecutable con comandos `curl`, checklist `PASS/FAIL` y plantilla de evidencia para ejecución repetible en dev/staging.

**Sistema automatizado asociado:** se agregó `scripts/security-login/` con un menú central (`scripts/security-login.sh`) para ejecutar casos críticos de forma semiautomática. Estructura:
- `scripts/security-login/menu.sh`: selección de `.env.*`, menú de ejecución y orquestación.
- `scripts/security-login/lib.sh`: carga de entorno, utilidades HTTP y generación de reportes.
- `scripts/security-login/cases.sh`: implementación de casos automatizados (`T01`, `T02`, `T03`, `T05`, `T06`, `T08`, `T10-T12`).

Los reportes se guardan en `tmp/security-login-reports/` con timestamp por ejecución.

**Decisión de diseño:** separar pruebas de seguridad en un documento independiente evita mezclar checklists operativos con la guía técnica general y facilita su uso por QA/Seguridad en ciclos de regresión.

**Estrategia:** enfoque de validación por abuso de flujo (negative testing) más evidencia reproducible, en lugar de checklist genérico de cumplimiento.

**Puntos de mejora / deuda técnica conocida:** el plan no sustituye un pentest externo; conviene complementarlo con automatización parcial (scripts CI) y pruebas de DAST en staging.
