# KeyGo UI — Guía Técnica

> **Audiencia:** desarrollador que hereda o extiende el proyecto. Asume conocimiento de React, TypeScript y OAuth2.
>
> **Última actualización:** 2026-04-03

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
   - [blockingErrorStore.ts](#blockingerrorstoreets)
5. [Módulo de API — `src/api/`](#5-módulo-de-api--srcapi)
   - [client.ts](#clientts)
  - [errorNormalizer.ts](#errornormalizerts)
  - [response.ts](#responsets)
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
  - [GlobalLoaderOverlay.tsx](#globalloaderoverlaytsx)
   - [HoneypotField.tsx](#honeypotfieldtsx)
   - [TurnstileWidget.tsx](#turnstilewidgettsx)
   - [BlockingErrorModal.tsx](#blockingerrormodaltsx)
   - [PlanCard.tsx](#planCardtsx)
   - [plans.ts](#plansts)
  - [icons/ module (`src/components/icons/`)](#icons-module-srccomponentsicons)
   - [ScrollToTop.tsx](#scrolltotoptsx)
  - [8b. DevConsole — `src/lib/devConsole/` + `src/components/DevConsole/`](#8b-devconsole--srclibdevconsole--srccomponentsdevconsole)
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
  ├─ index.html          ← script inline de tema + fallback de carga inicial
  │
  └─ src/main.tsx        ← monta React + AppBootstrap (restoreSession)
       │
       ├─ QueryClientProvider (TanStack Query — cache de datos del servidor)
       ├─ BrowserRouter   (React Router 7 — enrutamiento client-side)
    └─ App.tsx         ← árbol de rutas + Toaster + loader global de red
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
  └─ useThemeStore    ← preferencia de tema (light/dark/high-contrast/system)

i18n (react-i18next + i18next)
  ├─ src/i18n/config.ts         ← inicializa i18n + detección de idioma
  ├─ src/i18n/useLocale.ts      ← hook para leer/cambiar locale
  ├─ src/i18n/constants.ts      ← locales soportados y clave de persistencia
  └─ src/i18n/locales/*.json    ← catálogos de traducción
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
| `test` | Vitest en modo CI (`vitest run`) |
| `test:watch` | Vitest en modo watch |

**Dependencias de producción destacadas:**
| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `react` / `react-dom` | ^19 | Framework UI |
| `react-router-dom` | ^7 | Enrutamiento client-side |
| `@tanstack/react-query` | ^5 | Cache y estado de servidor |
| `zustand` | ^5 | Estado global en memoria |
| `axios` | ^1.4 | Cliente HTTP |
| `jose` | ^5 | Verificación JWT / JWKS (RS256) |
| `i18next` | ^26 | Motor i18n y resolución de idioma |
| `react-i18next` | ^17 | Integración i18n con React |
| `i18next-browser-languagedetector` | ^8 | Detección de idioma por navegador/localStorage |
| `react-hook-form` | ^7.72 | Estado de formularios |
| `zod` | ^4.3 | Validación de schemas |
| `sonner` | ^2 | Notificaciones toast |

**Actualización relevante:** Se incorporo infraestructura base de tests con Vitest y scripts npm (`test`, `test:watch`).

### `.eslintrc.cjs` y `.eslintignore`

**Propósito:** Estandarizar calidad estática del código con ESLint para TypeScript + React 19.

**Construcción:**
- Configuración con `@typescript-eslint/parser` y plugins `react`, `react-hooks`, `@typescript-eslint`.
- Se activa `plugin:react/jsx-runtime` para soportar el runtime moderno de JSX sin requerir `import React` en cada componente.
- Reglas `react/react-in-jsx-scope` y `react/jsx-uses-react` se desactivan por compatibilidad con React 17+.
- `.eslintignore` excluye artefactos no fuente (`dist/`, `coverage/`, `tmp/`) para evitar ruido y tiempo extra en lint.

**Integración:** `npm run lint` ejecuta ESLint sobre el repositorio y respeta `.eslintignore` automáticamente.

**Decisión de diseño:** Preferir una configuración alineada al runtime actual de React y reglas de hooks activas, para capturar errores reales de orden de hooks, pureza y dependencias.

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
- Script inline que define `document.documentElement.lang` antes del primer paint usando prioridad:
  1. `localStorage['keygo-locale']` (preferencia manual)
  2. `navigator.languages[0]` / `navigator.language` (dispositivo)
  3. fallback `es-CL`
- Script **inline síncrono** de tema antes del primer paint:
  ```js
  (function () {
    var p = localStorage.getItem('keygo-theme') || 'system'
    var highContrast = p === 'high-contrast'
    var dark = p === 'dark' || (p === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (highContrast) {
      document.documentElement.classList.add('high-contrast')
      document.documentElement.classList.add('dark')
      return
    }
    if (dark) document.documentElement.classList.add('dark')
  })()
  ```
- `<div id="root">` — punto de montaje de React.
- Dentro de `#root` existe un fallback visual (`#kg-boot`) que evita pantalla en blanco antes de que React quede montado.

**Integración:** El script inline aplica idioma y clases de tema sobre `<html>` **antes de que React monte**, eliminando flash de idioma/tema incorrecto. `useThemeStore` y `useLocale` leen las mismas claves de `localStorage` durante inicialización.

**Debug operacional:** si se abre la app con `?debug-locale=1`, el bootstrap expone y loguea `window.__kgLocaleDebug` para inspeccionar `navigator.language`, `navigator.languages`, locale persistido y locale resuelto antes del montaje de React.

**Decisión de diseño:** La inicialización del tema debe ocurrir sincrónicamente en el HTML, no en un `useEffect`, porque los effects corren tras el primer render y causarían parpadeo visual.

**Estrategia de carga inicial:** El fallback de `#kg-boot` da feedback inmediato en conexiones lentas o cuando el bundle tarda en hidratar.

---

## 3. Puntos de entrada

### `src/main.tsx`

**Propósito:** Punto de arranque de la aplicación React.

**Construcción:**
1. Crea `QueryClient` con configuración por defecto.
2. Inicializa i18n importando `src/i18n/config.ts`.
3. Monta React inmediatamente con `StrictMode` + `QueryClientProvider` + `BrowserRouter`.
3. Usa `AppBootstrap` para ejecutar `restoreSession()` dentro de un `useEffect`.
4. Mientras `restoreSession()` está en progreso, renderiza `GlobalLoaderOverlay` en modo inmediato.
5. Al finalizar `restoreSession()` (éxito o error), muestra `App`.

**Integración:**
- `restoreSession` → `src/auth/refresh.ts`
- `QueryClientProvider` → disponible para todos los `useQuery`/`useMutation` del árbol
- `BrowserRouter` → habilita `useNavigate`, `useLocation`, etc.
- `react-i18next` → traducción de mensajes de bootstrap (`common.bootTitle`, `common.bootDescription`).

**Decisión de diseño:** "render-first + bootstrap gate" — la app monta de inmediato para evitar pantalla en blanco, pero el contenido funcional queda detrás de `AppBootstrap` hasta completar restauración de sesión.

**Deuda técnica:** `QueryClient` sin configuración global — sin `staleTime`, sin política de reintentos, sin `refetchOnWindowFocus: false`.

---

### `src/App.tsx`

**Propósito:** Definición del árbol de rutas y configuración del toast global.

**Construcción:**
- Define todas las rutas con `<Routes>` de React Router 7.
- Envuelve todo el arbol de rutas en `AppErrorBoundary` para contener errores de render no controlados en cualquier pantalla.
- En la ruta `/`, redirige a `/dashboard` cuando existe sesión activa (`accessToken`), y solo renderiza `LandingPage` para usuarios no autenticados.
- Expone rutas públicas adicionales `/developers` (documentación) y `/logout` (cierre de sesión seguro).
- Unifica toda el area autenticada en `/dashboard` (misma ruta para todos los roles).
- Expone rutas compartidas de cuenta para todos los roles: `/dashboard/account` y `/dashboard/account/settings`.
- Mantiene rutas legacy (`/home`, `/admin/*`, `/dashboard/user/profile`, `/dashboard/user/sessions`) como redirecciones de compatibilidad.
- Monta `<BlockingErrorModal />` globalmente junto a `<Toaster />`, fuera de `<Routes>`, para que se renderice sobre cualquier pantalla activa.
- Usa `useIsFetching()` y `useIsMutating()` para detectar actividad global de red en TanStack Query.
- Muestra `<GlobalLoaderOverlay />` mientras existan cargas o mutaciones activas (si no hay error bloqueante).
- Usa `<AuthGuard>` + `<AdminLayout>` para el shell comun del dashboard.
- Encapsula rutas exclusivas de `ADMIN` con `<RoleGuard roles={['ADMIN']} redirectTo="/dashboard" />`.
- Rutas anidadas de tenant (`/:slug` y `/new`) como hijos de `TenantsPage` (patrón master-detail con `<Outlet>`).
- `<Toaster>` de `sonner` con tema dark y posición `bottom-right`.
- Catch-all `*` redirige a `/login`.

**Actualización relevante:** si un componente lanza error en render, `AppErrorBoundary` evita la caída total de React y muestra fallback con acción de retorno a `/dashboard`.
El contenido del fallback es i18n y se alimenta desde `appErrorBoundary.*` en locales ES/EN.
En ambientes no productivos muestra en la misma pantalla el detalle técnico (`error.message` + `componentStack`) para acelerar diagnóstico, ocultándolo en producción.
En ese modo incorpora un botón con icono para copiar el stack al portapapeles y usa un contenedor más ancho para mejorar legibilidad del detalle.
Además, cuando el runtime entrega ubicación (`archivo:línea:columna`), el fallback muestra el stack de runtime y un preview del código con indicador de columna en formato de bloque técnico.
El preview de código reutiliza la misma librería de resaltado (`react-syntax-highlighter` + `atomOneDark`) usada en la sección Developers del landing para mantener consistencia visual y técnica.
El layout del fallback ocupa el viewport completo sin alargar la página: el panel central tiene scroll interno para detalles extensos y reutiliza `AppFooter` en variante adaptativa para seguir el theme efectivo (`light` / `dark` / `high-contrast`).
En modo desarrollo, el detalle técnico se presenta en orden: `Source location`, `Component stack` y `Runtime stack`; los stacks disponen de copia al portapapeles por bloque.
Las acciones del fallback ya no asumen que `/dashboard` es sano: el CTA principal recarga la ruta actual y el secundario deriva a una salida segura contextual (`/logout` en áreas autenticadas, `/` en áreas públicas).

**Integración:**
- `AuthGuard` / `RoleGuard` → `src/auth/roleGuard.tsx`
- `AdminLayout` → `src/layouts/AdminLayout.tsx`
- Todas las páginas → `src/pages/**`

**Árbol de rutas:**
| Ruta | Componente | Guardia |
|------|-----------|---------|
| `/` | `Navigate -> /dashboard` (si hay sesión) / `LandingPage` (sin sesión) | Pública |
| `/developers` | `DeveloperDocsPage` | Pública |
| `/login` | `Navigate -> /dashboard` (si hay sesión) / `LoginPage` (sin sesión) | Pública |
| `/forgot-password` | `Navigate -> /dashboard` (si hay sesión) / `ForgotPasswordPage` (sin sesión) | Pública |
| `/recover-password` | `Navigate -> /dashboard` (si hay sesión) / `RecoverPasswordPage` (sin sesión) | Pública |
| `/reset-password` | `Navigate -> /dashboard` (si hay sesión) / `ResetPasswordPage` (sin sesión) | Pública |
| `/logout` | `LogoutPage` | Pública |
| `/subscribe` | `NewContractPage` | Pública |
| `/subscribe/resume` | `Navigate -> /subscribe?resume=1` | Pública |
| `/register` | `UserRegisterPage` | Pública |
| `/dashboard` | `AuthGuard` → `AdminLayout` → `DashboardHomePage` | Autenticada |
| `/dashboard/feature/api` | `PlatformStatsPage` | `ADMIN` |
| `/dashboard/feature/apps` | `Navigate -> /dashboard/tenant/apps` | Autenticada (legacy) |
| `/dashboard/feature/users` | `Navigate -> /dashboard/tenant/users` | Autenticada (legacy) |
| `/dashboard/feature/access` | `Navigate -> /dashboard/tenant/memberships` | Autenticada (legacy) |
| `/dashboard/feature/sessions` | `Navigate -> /dashboard/account/sessions` | Autenticada (legacy) |
| `/dashboard/feature/:featureId` | `FeaturePlaceholderPage` (UI funcional con datos mock MSW) | Autenticada |
| `/dashboard/account` | `UserProfilePage` | Autenticada |
| `/dashboard/account/settings` | `AccountSettingsPage` | Autenticada |
| `/dashboard/account/sessions` | `AccountSessionsPage` | Autenticada |
| `/dashboard/tenants` | `TenantsPage` | `ADMIN` |
| `/dashboard/tenants/new` | `TenantCreatePage` (outlet) | `ADMIN` |
| `/dashboard/tenants/:slug` | `TenantDetailPage` (outlet) | `ADMIN` |
| `/dashboard/tenant/users` | `TenantUsersPage` | `ADMIN` o `ADMIN_TENANT` |
| `/dashboard/tenant/apps` | `TenantAppsPage` | `ADMIN` o `ADMIN_TENANT` |
| `/dashboard/tenant/memberships` | `TenantMembershipsPage` | `ADMIN` o `ADMIN_TENANT` |
| `/dashboard/user/my-access` | `UserMyAccessPage` | `USER_TENANT` |
| `/dashboard/user/activity` | `UserActivityPage` | `USER_TENANT` |
| `/dashboard/user/sessions` | `Navigate -> /dashboard/account/sessions` | `USER_TENANT` (legacy) |
| `/dashboard/user/profile` | `Navigate -> /dashboard/account` | `USER_TENANT` (legacy) |
| `/home` | `Navigate to /dashboard` | Pública (legacy) |
| `/admin/*` | `Navigate to /dashboard` | Pública (legacy) |
| `*` | `Navigate to="/login"` | — |

**Deuda técnica:** `ADMIN_TENANT` y `USER_TENANT` tienen modulos reales conectados. Sin pagina 404 dedicada. La ruta `/access/no-role` fue eliminada al migrar a modal bloqueante. Falta: editar usuario existente, desactivar app, editar roles de membership, filtros avanzados por app y endpoint dedicado de sesiones por dispositivo.

**Deuda técnica adicional:** El loader global depende de TanStack Query. Si aparecen llamadas HTTP fuera de Query, deben añadirse al mecanismo global para mantener comportamiento consistente.

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
@variant high-contrast (&:where(.high-contrast, .high-contrast *));
html, body, #root { height: 100%; }            /* Layouts full-height */
body { font-family: Inter, ui-sans-serif, … }  /* Fuente base */
```

**Integración:**
- Importado en `src/main.tsx`.
- La variante `dark` es class-based (`.dark` en `<html>`) — sincronizada con el script inline de `index.html` y con `applyTheme()` en `useThemeStore`.
- La variante `high-contrast` es class-based (`.high-contrast` en `<html>`) y agrega overrides globales para texto, bordes, enlaces y foco visible.
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
  activeRole: AppRole | null
}
// Acciones: setTokens(...), clearTokens()
```

`setTokens` inicializa `activeRole` usando la jerarquia de privilegios (`ADMIN` > `ADMIN_TENANT` > `USER_TENANT`). `setActiveRole` permite cambiar el contexto de trabajo solo a roles incluidos en `roles`.

`clearTokens` también llama a `sessionStorage.removeItem(SESSION_KEY)` — acoplamiento controlado al ciclo de vida del token de refresco.

**Integración:**
- `src/api/client.ts` → lee `accessToken` via `getState()` en el interceptor de Axios.
- `src/auth/roleGuard.tsx` → lee `accessToken` y `roles` para autorización.
- `src/auth/refresh.ts` → llama `setTokens()` via `getState()` (fuera de React).
- `src/hooks/useCurrentUser.ts` → lee `idToken`, `roles` y `activeRole`.
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
- `extractRoles(claims)` — valida que el claim `roles` sea una lista, elimina duplicados (case-insensitive) y filtra contra `APP_ROLES`.

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
- Lee `accessToken` + `roles` + `activeRole` del store.
- Sin token → `/login`.
- Si existe `activeRole`, autoriza contra ese rol activo (modo contexto de trabajo).
- Sin rol requerido en ese contexto → `redirectTo ?? '/login'`.
- Con rol apropiado → `children ?? <Outlet />`.
- Sin `activeRole`, usa fallback por membresia (`roles.some(r => userRoles.includes(r))`).

**Integración:** Usado en `src/App.tsx` para proteger `/admin/*` con `RoleGuard roles={['ADMIN']}`.

**Decisión de diseño:** El patrón `children ?? <Outlet />` soporta dos usos: envolver un componente directamente en JSX, o actuar como layout guard en rutas anidadas de React Router.

**Deuda técnica:** El redireccionamiento por rol incorrecto va a `/login` en lugar de a una página 403/Unauthorized dedicada. Puede confundir al usuario.

---

### `blockingErrorStore.ts`

**Propósito:** Store Zustand para errores bloqueantes que impiden continuar el flujo normal de la aplicación, independientemente del componente donde ocurran.

**Construcción:**
```ts
export type BlockingError = NoRoleError  // unión extensible: | ConnectionError | ...

interface NoRoleError {
  kind: 'NO_ROLE'
  supportCode: string  // 'KG-NO-ROLE'
  userId: string
  usernameHint: string
  rolesDetected: string
  tenantClaim: string
  issuer: string
  timestamp: string
}

useBlockingErrorStore  // { error, setError, clearError }
```

**Integración:**
- `setError()` es llamado desde `src/pages/login/LoginPage.tsx` cuando el login resulta exitoso pero sin roles compatibles con la UI.
- `clearError()` es llamado en `src/components/BlockingErrorModal.tsx` al ejecutar acciones configuradas como cierre de modal.
- El modal `BlockingErrorModal` suscribe al store y se monta/desmonta reactivamente.

**Decisión de diseño:** Store Zustand independiente del `tokenStore` — los errores bloqueantes no son estado de sesión, son estado de UI de emergencia. Separar las responsabilidades facilita activar el modal desde cualquier capa (api, hooks, efectos).

**Estrategia:** Unión de tipos con campo discriminante `kind` — añadir un nuevo tipo de error bloqueante requiere solo: (1) extender la unión en este archivo, (2) añadir un branch en `BlockingErrorModal.tsx`.

**Puntos de mejora / deuda técnica conocida:** No persiste entre recargas de página — si el usuario recarga estando en el estado bloqueante, el error se pierde. El `useEffect` de `LoginPage` lo redetecta si la sesión sigue viva (token en `sessionStorage`).

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

**Interceptor de respuesta (apiClient + authClient):**
- Normaliza cualquier error de transporte/API con `normalizeApiError`.
- Si el error es Axios, preserva el objeto original y adjunta `appApiError` para compatibilidad con pantallas que aún usan `axios.isAxiosError(...)`.
- Si no es Axios, rechaza directamente un `AppApiError`.

**Interceptores de DevConsole (request + response, ambos clientes):**
- Se añaden tras los interceptores de autenticación/error para observar el tráfico ya enriquecido.
- `attachDevConsoleRequest` — asigna un `id` y un `_startMs` al config de la request y llama `logRequest(...)` en el store.
- `finalizeDevConsoleSuccess` / `finalizeDevConsoleError` — calculan duración, extraen status y body, y llaman `finalizeRequest(...)` para completar la entrada en el log.
- El header `Authorization` se redacta (`[redacted]`) antes de almacenarlo; nunca se loguea el token real.
- Los interceptores no bloquean ni modifican el flujo normal; solo leen y escriben en el store.

**Integración:** Importado por todos los módulos de `src/api/*.ts`. Los interceptores de DevConsole usan `useDevConsoleStore.getState()` (Zustand fuera de React) para acceso seguro desde Axios.

**Decisión de diseño:** Dos instancias Axios separadas por responsabilidad — `authClient` para el flujo OAuth2 (necesita cookies de sesión del servidor), `apiClient` para llamadas autenticadas (necesita Bearer token). La observabilidad de DevConsole se añade como capa transversal sin modificar la lógica de negocio de cada instancia.

**Deuda técnica:** Sin timeout global en Axios y sin estrategia de retry/backoff centralizada; la normalización de errores ya existe pero falta migrar gradualmente los consumidores UI a `appApiError`.

---

### `errorNormalizer.ts`

**Propósito:** Normalizar respuestas de error del backend y errores de red en un único modelo de dominio (`AppApiError`) reutilizable por API, hooks y UI.

**Construcción:**
- `normalizeApiError(error: unknown): AppApiError` extrae y prioriza:
  - `data.clientMessage`
  - `failure.message`
  - fallback de red o mensaje genérico
- Mapea metadatos técnicos: `httpStatus`, `code`, `origin`, `clientRequestCause`, `detail`, `exception`, `fieldErrors`.
- Calcula `retryable` usando reglas por status/origen/código (`408`, `429`, `5xx`, `SERVER_PROCESSING`, `EXTERNAL_SERVICE_ERROR`, `OPERATION_FAILED`, errores de red).

**Integración:**
- Consumido por `src/api/client.ts` en interceptores de respuesta.
- Provee `getAppApiError(...)` para adopción incremental en páginas/hook que necesiten lectura consistente del error.

**Decisión de diseño:** En esta fase se prioriza compatibilidad retroactiva. Se adjunta `appApiError` al `AxiosError` en vez de reemplazarlo para no romper lógica existente mientras migra la UI.

**Estrategia:** Capa de adaptación centralizada por contrato backend (`ErrorResponse`) con fallback seguro para errores no tipados.

**Puntos de mejora / deuda técnica conocida:**
- Completar migración del resto de pantallas y hooks secundarios para aprovechar `getAppApiError(...)` de forma homogénea en toda la UI.
- Agregar tests unitarios dedicados para cada variante de error del contrato OpenAPI.

---

### `response.ts`

**Propósito:** Centralizar el desempaquetado seguro de `BaseResponse<T>` para que todos los módulos de `src/api/` retornen `data` o lancen un `AppApiError` normalizado.

**Construcción:**
- `unwrapResponseData<T>(body, fallbackMessage)` retorna `body.data` cuando existe.
- Si `data` viene `null/undefined`, lanza `buildAppApiErrorFromBaseResponse(...)` para preservar `code`, `origin`, `clientMessage`, `fieldErrors` y `retryable`.

**Integración:** Usado por `auth.ts`, `account.ts`, `tenants.ts`, `users.ts`, `clientApps.ts`, `memberships.ts`, `serviceInfo.ts`, `dashboard.ts` y `billing.ts`.

**Decisión de diseño:** Evitar lógica duplicada en cada endpoint y eliminar `throw new Error(...)` ad-hoc, manteniendo un contrato de error uniforme para TanStack Query y UI.

---

### `requestOptions.ts`

**Propósito:** Tipo compartido de opciones de request para toda la capa API.

**Construcción:**
- Define un único `RequestOptions` reutilizable por módulos de API:
  - `signal?: AbortSignal`
  - `timeoutMs?: number`
  - `idempotencyKey?: string`

**Integración:** `auth.ts`, `billing.ts`, `dashboard.ts`, `tenants.ts`, `users.ts`, `clientApps.ts`, `memberships.ts`, `account.ts`.

**Decisión de diseño:** eliminar interfaces duplicadas de opciones de request para aplicar DRY y evitar divergencia entre dominios.

---

### `src/config/network.ts` y `src/lib/network/recovery.ts`

**Propósito:** centralizar política de red y utilidades de recuperación para queries GET y notificaciones de timeout en mutaciones.

**Construcción:**
- `src/config/network.ts` define constantes compartidas:
  - `NETWORK_REQUEST_TIMEOUT_MS`
  - `NETWORK_RETRY_DELAY_MS`
  - `NETWORK_MAX_RETRIES`
- `src/lib/network/recovery.ts` expone utilidades:
  - `isRequestTimeout(error)`
  - `buildMutationTimeoutMessage(actionLabel, options?)`
  - `notifyMutationTimeout(actionLabel, options?)`
  - `buildTimeoutStateMessage(actionLabel, options?)`
  - `waitForAbortableDelay(ms, signal)`
  - `runGetWithRecovery({ signal, label, query, timeoutMs, retryDelayMs, maxRetries })`

**Integración:** usado por páginas de admin, tenant, user, landing, login y register para aplicar la misma estrategia de timeout/retry y mensajes de timeout sin duplicar lógica ni textos.

**Decisión de diseño:** extraer boilerplate repetido de `try/catch + retry + delay + abort` desde componentes de página a una utilidad única y testeable.

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
| `listTenants(params?, options?)` | GET | `/api/v1/tenants` | Soporta filtros, paginación, `signal` y `timeoutMs` |
| `getTenant(slug, options?)` | GET | `/api/v1/tenants/{slug}` | Soporta `signal` y `timeoutMs` |
| `createTenant(data, options?)` | POST | `/api/v1/tenants` | Soporta `timeoutMs` y `X-Idempotency-Key` opcional |
| `suspendTenant(slug, options?)` | PUT | `/api/v1/tenants/{slug}/suspend` | Soporta `timeoutMs` y `X-Idempotency-Key` opcional |
| `activateTenant(slug, options?)` | PUT | `/api/v1/tenants/{slug}/activate` | Soporta `timeoutMs` y `X-Idempotency-Key` opcional |

**Integración:**
- `src/pages/admin/TenantsPage.tsx` → `listTenants`, `TENANT_QUERY_KEYS.list`.
- `src/pages/admin/TenantDetailPage.tsx` → `getTenant`, `suspendTenant`, `activateTenant`.
- `src/pages/admin/TenantCreatePage.tsx` → `createTenant`.

**Decisión de diseño:** Query keys jerárquicas permiten invalidaciones inteligentes — `['tenants']` invalida todo, `['tenants', 'list', params]` solo la lista paginada actual.

**Estrategia de resiliencia:** las funciones GET aceptan cancelación/timeout para recovery controlado en UI; las mutaciones exponen timeout explícito y header de idempotencia opcional, manteniendo la política de no auto-retry en operaciones críticas.

---

### `users.ts`

**Propósito:** Gestión de usuarios del tenant (ADMIN/ADMIN_TENANT) y registro público por app.

**Construcción:**
- Exponer `USER_QUERY_KEYS` para lista/detalle.
- Endpoints de gestión:
  - `listUsers(tenantSlug, options?)`
  - `getUser(tenantSlug, userId, options?)`
  - `createUser(tenantSlug, data, options?)`
  - `updateUser(tenantSlug, userId, data, options?)`
  - `resetUserPassword(tenantSlug, userId, data, options?)`
- Registro público:
  - `registerUser(tenantSlug, clientId, data)`

`options` soporta `signal`, `timeoutMs` e `idempotencyKey` (este último en mutaciones).

**Integración:**
- `src/pages/dashboard/tenant/TenantUsersPage.tsx` consume lista + mutaciones de gestión.
- Flujo de registro público consume `registerUser(...)`.

**Decisión de diseño:** separar registro público del CRUD interno permite aplicar políticas de seguridad y resiliencia distintas por contexto.

---

### `clientApps.ts`, `memberships.ts` y `account.ts`

**Propósito:** módulos de dominio para administración de apps, memberships y perfil de cuenta autenticada.

**Construcción (actualización 2026-04-02):**
- Se agregó `RequestOptions` en funciones de lectura/escritura para soportar:
  - `signal` (cancelación por React Query),
  - `timeoutMs` (timeout explícito por request),
  - `idempotencyKey` opcional en mutaciones críticas.
- Esto permite que las páginas apliquen recovery de GET (timeout + retry controlado) sin mezclar lógica de resiliencia dentro del módulo API.

**Integración:**
- `TenantAppsPage`, `TenantMembershipsPage`, `UserActivityPage`, `UserMyAccessPage` y `UserProfilePage` ahora invocan estos módulos con opciones de resiliencia explícitas.

**Decisión de diseño:** mantener la capa API agnóstica de UI (sin toasts ni decisiones de retry), delegando en contenedores de página la estrategia de recuperación visible al usuario.

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

**Decisión de diseño:** `data`, `success` y `failure` son todos opcionales en el tipo, lo que refleja fielmente el contrato del backend pero obliga al frontend a verificar la presencia antes de usar. `ErrorData` incluye los campos enriquecidos del contrato OpenAPI (`layer`, `fieldErrors`) además de `origin` y `clientRequestCause` para clasificación UX.

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

### `dropdown.ts`

**Propósito:** Tipos compartidos para primitives de dropdown (`Dropdown` y `SelectDropdown`) y su API declarativa.

**Tipos clave:**
```ts
export interface DropdownProps {
  ariaLabel: string
  trigger: (params: DropdownTriggerParams) => ReactNode
  panelClassName?: string
  panelRole?: 'listbox' | 'menu'
  children: ReactNode | ((params: DropdownChildrenParams) => ReactNode)
}

export interface DropdownOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface SelectDropdownProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: DropdownOption<T>[]
  label: string
  icon?: ReactNode
  ariaLabel: string
  hideSelectedOption?: boolean
  selectedValueClassName?: string
}
```

**Integración:** Consumido por `src/components/Dropdown.tsx`, `src/components/SelectDropdown.tsx` y `src/layouts/AdminLayout.tsx`.

**Decisión de diseño:** Extraer tipos de UI compartida evita re-definir interfaces dentro de layouts y mejora la reutilización entre menús/selectores.

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
  const { idToken, accessToken, roles } = useTokenStore()
  if (!idToken) return null
  // decode solo, sin verificar (el token ya fue verificado al login)
  // tenantSlug: id_token.tenant_slug -> access_token.tenant_slug -> parseo de iss
  // displayName = username ?? email ?? sub
}
```

**Integración:** Usado en `src/layouts/AdminLayout.tsx` para mostrar nombre, iniciales y rol en sidebar y header. También expone `tenantSlug` para páginas tenant-scoped en `/dashboard/tenant/*` y para el home de `/dashboard` en roles `ADMIN_TENANT` y `USER_TENANT`.

**Decisión de diseño:** `decodeJwt` (sin verify) es suficiente aquí porque: el token ya fue verificado criptográficamente en `jwksVerify.ts` al recibirlo, y este hook es solo para display — no para decisiones de seguridad. Para reducir dependencia de un único claim, el tenant activo se resuelve en cascada desde `id_token`, luego `access_token` y, si falta, desde `iss`.

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

### `src/i18n/constants.ts`

**Propósito:** Fuente única de verdad para locales soportados, locale por defecto y clave de persistencia en `localStorage`.

**Construcción:**
- `SUPPORTED_LOCALES = ['es-CL', 'en-US']`
- `DEFAULT_LOCALE = 'es-CL'`
- `LOCALE_STORAGE_KEY = 'keygo-locale'`

**Integración:** Consumido por `config.ts`, `localeUtils.ts` y `useLocale.ts`.

**Decisión de diseño:** Evitar strings duplicados y reducir errores al agregar nuevos idiomas.

---

### `src/i18n/localeUtils.ts`

**Propósito:** Normalización y resolución de locale BCP-47 para garantizar que la app siempre opere con locales soportados.

**Construcción:**
- `normalizeLocale(value)` mapea variantes (`es-*`, `en-*`) a locales canónicos soportados.
- `resolveDeviceLocale()` obtiene idioma del dispositivo con fallback seguro.
- `getStoredManualLocale()` solo acepta `localStorage` cuando la fuente fue marcada explícitamente como manual.
- `resolveInitialLocale()` prioriza preferencia manual valida; si no existe, usa idioma del dispositivo.

**Integración:** Usado por `config.ts`, `useLocale.ts` y utilidades de formato.

**Decisión de diseño:** Mantener la lógica de fallback fuera de componentes para minimizar acoplamiento y evitar que la detección automática contamine la persistencia manual.

---

### `src/i18n/config.ts`

**Propósito:** Inicializar i18n en una sola instancia global.

**Construcción:**
- Registra `LanguageDetector` + `initReactI18next`.
- Configura recursos locales (`es-CL`, `en-US`).
- Detección por prioridad: `localStorage` luego `navigator`.
- Fallback global: `es-CL`.

**Integración:** Importado en `src/main.tsx` para inicialización temprana.

**Decisión de diseño:** Solución de ecosistema madura (react-i18next) en lugar de implementación custom.

**Puntos de mejora / deuda técnica conocida:** En fase futura se evaluará carga lazy por namespace para optimizar bundle inicial.

---

### `src/i18n/useLocale.ts`

**Propósito:** Hook de acceso al locale activo y acciones de cambio/restablecimiento automático.

**Construcción:**
- Expone `locale`, `setLocale`, `resetToDeviceLocale`, `supportedLocales`, `isAutoDetected`.
- Sincroniza `document.documentElement.lang` cuando cambia idioma.
- Persiste selección manual en `localStorage`.

**Integración:** Consumido en `AccountSettingsPage` para selector de idioma y modo automático.

**Decisión de diseño:** API simple y desacoplada del resto de stores globales (sin duplicar fuente de verdad con Zustand).

---

### `src/i18n/adminDashboardI18n.test.ts`

**Propósito:** Validar regresiones de internacionalización en el dashboard admin.

**Construcción:**
- Verifica resolución de claves `adminDashboard.*` en `es-CL`.
- Verifica cambio de idioma en runtime a `en-US` con `i18n.changeLanguage(...)`.
- Restaura el idioma original al finalizar para evitar acoplamiento entre tests.

**Integración:** Ejecutado por Vitest junto al resto de tests unitarios (`npm test`).

**Decisión de diseño:** Cobertura ligera y estable sin dependencias de render UI (asserts directos sobre el motor i18n).

---

### `src/i18n/userDashboardI18n.test.ts`

**Propósito:** Validar regresiones de internacionalización en paginas de usuario del dashboard (`my-access`, `account`, `sessions`).

**Construcción:**
- Verifica resolución de claves `userDashboardMyAccess.*`, `userDashboardProfile.*` y `userDashboardSessions.*` en `es-CL`.
- Verifica cambio de idioma en runtime a `en-US` para mismas claves.
- Restaura idioma original al finalizar para evitar side effects entre tests.

**Integración:** Ejecutado por Vitest junto al resto de tests unitarios (`npm test`).

**Decisión de diseño:** Prueba de bajo acoplamiento enfocada en consistencia de catálogos y switch runtime sin montar componentes.

---

### `useDropdown.ts`

**Propósito:** Hook reusable para controlar el ciclo de vida de dropdowns (open/close, toggle y cierre por click fuera).

**Construcción:**
- Mantiene estado local `open`.
- Expone `ref` para delimitar el contenedor interactivo.
- Registra `mousedown` en `document` para cerrar cuando el click ocurre fuera del `ref`.
- Expone helpers `toggle()` y `close()` para consumo declarativo desde primitives.

**Integración:** Consumido por `src/components/Dropdown.tsx`. Indirectamente usado por `ThemeToggle`, `RoleSwitcher` y menú de usuario en `src/layouts/AdminLayout.tsx`.

**Decisión de diseño:** Centralizar esta lógica evita listeners duplicados por pantalla y mantiene consistencia de comportamiento entre dropdowns.

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

### `Dropdown.tsx`

**Propósito:** Primitive base para cualquier menú desplegable del proyecto con API declarativa por `trigger` + `children`.

**Construcción:**
- Usa `useDropdown` para estado y cierre por click exterior.
- Permite `panelRole` (`menu` o `listbox`) y `panelClassName` configurable.
- Permite `containerClassName` para integrarse en layouts de formulario sin wrappers extra.
- Renderiza `children` estático o render function con acceso a `close()`.

**Integración:** Base de `SelectDropdown.tsx` y del menú de usuario en `AdminLayout`.

**Decisión de diseño:** Unificar primitives de dropdown evita repetir lógica de interacción y baja deuda de accesibilidad.

---

### `SelectDropdown.tsx`

**Propósito:** Wrapper especializado para selectores (rol, tema, etc.) construido sobre `Dropdown`.

**Construcción:**
- Recibe opciones tipadas (`DropdownOption<T>`) y controla selección por `value` + `onChange`.
- Soporta `hideSelectedOption` para ocultar el valor activo dentro del panel.
- Soporta `selectedValueClassName` para estilizar el valor seleccionado en trigger cerrado.
- Soporta `disabled`, `triggerClassName`, `panelClassName`, `containerClassName` y asociación accesible con labels visibles (`labelledBy`).
- Soporta theming contextual del panel abierto mediante `optionClassName`, `activeOptionClassName` y `emptyStateClassName`.

**Integración:** Usado en `src/layouts/AdminLayout.tsx` para `ThemeToggle` y `RoleSwitcher`.

**i18n:** Cuando no existen opciones para seleccionar, el componente usa la clave `common.noMoreOptions` para mostrar el estado vacío en el idioma activo.

**Decisión de diseño:** Separar el caso "selector" del primitive general permite configuración por props sin repetir JSX ni handlers.

---

### `LocaleSwitcher.tsx`

**Propósito:** componente reusable para cambio de idioma (`es-CL`/`en-US`) sobre `SelectDropdown`, preparado para variantes visuales por contexto.

**Construcción:**
- Usa `useLocale()` para leer locale activo y ejecutar `setLocale(...)` con persistencia manual.
- Renderiza opciones con bandera por idioma y soporta modo `compact` (labels `ES`/`EN`) para headers con poco espacio.
- Expone `triggerClassName`, `panelClassName`, `containerClassName` y `selectedValueClassName` para adaptar look & feel sin duplicar lógica.

**Integración:** consumido por `LandingNav.tsx` (header público) y `LoginPage.tsx` (tarjeta de autenticación).

**Decisión de diseño:** centralizar el switcher evita duplicar iconografía/binding i18n y asegura comportamiento consistente de idioma en vistas públicas.

---

### Icons module (`src/components/icons/`)

**Propósito:** centralizar la iconografía SVG del proyecto para evitar duplicación, mantener consistencia visual y facilitar accesibilidad.

**Construcción:**
- `src/components/icons/definitions.tsx` contiene los componentes SVG (`Icon*`) agrupados por dominio (navegación, sidebar, estado, acciones, dashboard, billing, banderas).
- `src/components/icons/index.ts` expone un barrel export para imports limpios (`@/components/icons`).
- Todos los íconos se implementan como componentes React sin dependencia externa.

**Integración:**
- Consumido por `AdminLayout`, dashboard admin (`IamCoreRow`, `ServiceStatusRow`, `SecurityRow`), `TenantsPage`, `SelectDropdown`, `ScrollToTop`, landing (`FeaturesSection`, `DevelopersSection`) y vistas de cuenta (`UserProfilePage`, `AccountSettingsPage`, `DashboardHomePage`).

**Decisión de diseño (Fase 4 - 2026-04-02):**
- Se evaluó migrar a `lucide-react` y se decidió **postergar** la adopción.
- Motivo: la centralización actual ya resuelve consistencia, accesibilidad y DX sin introducir peso adicional ni riesgo de regresión visual.
- Criterios para reevaluar migración: reducción neta de mantenimiento, mejora tangible de bundle y paridad total de iconografía semántica existente.

---

### `GlobalLoaderOverlay.tsx`

**Propósito:** Componente reusable de carga fullscreen para evitar pantallas vacías durante demoras de red o durante el bootstrap inicial.

**Construcción:**
- Recibe `active` para activar/desactivar el overlay.
- Implementa anti-flicker con `SHOW_DELAY_MS` (delay de entrada) y `MIN_VISIBLE_MS` (tiempo mínimo visible).
- Permite `skipDelays` para mostrar carga inmediata cuando se necesita.
- Expone `title`, `description` y `zIndexClassName` para adaptar el contexto sin duplicar implementación.
- Declara `role="status"`, `aria-live="polite"` y `aria-atomic="true"` para accesibilidad.

**Integración:**
- `src/main.tsx`: se usa durante `restoreSession()` dentro de `AppBootstrap`.
- `src/App.tsx`: se activa de forma condicional cuando coinciden dos señales: ventana de render crítico por cambio de ruta y red lenta sostenida.

**Decisión de diseño:** Centralizar la experiencia de espera en una sola pieza evita crear loaders por pantalla y mantiene consistencia visual.

**Estrategia:** Activación contextual en dos niveles: bootstrap (inmediata) y render crítico con red lenta (`> 5_000 ms`).

**Implementación actual (Fase 1 y 2):**
- `src/App.tsx` mantiene una ventana de asentamiento de ruta (`ROUTE_SETTLING_WINDOW_MS = 1200`).
- Solo durante esa ventana se evalúa la red como candidata a escalar loader global.
- Si `isFetching`/`isMutating` se mantienen activos por más de `SLOW_REQUEST_THRESHOLD_MS = 5000`, se muestra el overlay.
- Si la vista ya está asentada, el loader global no interfiere en llamadas de fondo.

**Puntos de mejora / deuda técnica conocida:**
- Separar en modo bloqueante/no bloqueante para polling en background.
- Integrar señales de Axios si se incorporan requests fuera de TanStack Query.

#### Contrato técnico aprobado (Paso 0) — Orquestación de loader global

Estado: **Aprobado el 2026-04-02**.

**Objetivo técnico:** el loader global deja de depender de toda actividad de red y pasa a activarse solo en operaciones críticas para render visible.

**Reglas base aprobadas:**
- No mostrar loader global cuando la vista ya tiene contenido útil renderizado.
- Respetar loaders locales existentes; el global solo escala si hay degradación real de UX.
- Umbral de visibilidad global: `> 5_000 ms` en llamada crítica sin resolución.
- Umbral de timeout duro: `> 10_000 ms` para abortar la llamada.
- Post-timeout: toast + espera de `5_000 ms` + retry automático.
- Límite de retries automáticos por operación: `3`.
- Al agotar retries: detener cadena automática y notificar con toast final.

**Alcance de implementación previsto (fases siguientes):**
- `src/App.tsx`: activación condicional del overlay (no por tráfico global bruto).
- `src/main.tsx`: mantener bootstrap inmediato solo para fase de restauración de sesión.
- `src/api/client.ts`: soporte consistente de abort/cancel en llamadas críticas.
- Hooks/containers críticos (por ejemplo registro/planes): marcar operaciones críticas para render y aplicar política timeout/retry.

**Estado de implementación progresiva (2026-04-02):**
- Fase 3 y 4 se aplicaron primero al flujo crítico de catálogo de planes en `src/pages/register/NewContractPage.tsx`.
- `getBillingCatalog` ahora acepta opciones de `signal` y `timeoutMs` en `src/api/billing.ts`.
- Política activa en este flujo: timeout por intento a 10s, espera de 5s entre intentos y máximo 3 reintentos automáticos.
- Al agotar reintentos, se detiene la cadena automática y se notifica al usuario por toast.
- Se extendió la misma política al lookup de contrato por ID (`getBillingContract`) en el mismo flujo.
- Decisión de seguridad de rollout: el auto-retry se limita por ahora a operaciones idempotentes (GET) para evitar efectos colaterales en operaciones POST sensibles (creación, verificación, activación).
- Operaciones POST críticas del flujo (`createBillingContract`, `verifyContractEmail`, `resendContractVerificationEmail`, `mockApprovePayment`, `activateBillingContract`) quedaron con timeout de 10s por intento, sin reintento automático.
- Estas funciones también aceptan `RequestOptions` (`timeoutMs`, `signal`) para futuras extensiones controladas.
- Se extendió la política al módulo de autenticación en `src/api/auth.ts` y `src/pages/login/LoginPage.tsx`.
- `authorize` usa timeout de 10s y retry automático controlado en UI (5s entre intentos, máximo 3).
- `login` y `exchangeToken` usan timeout de 10s sin retry automático.
- Se agregó soporte opcional de `idempotencyKey` en `RequestOptions` para operaciones POST de billing/auth; cuando el backend lo soporte, permite deduplicación segura de intentos repetidos.
- Fase 5 extendida a vistas críticas de administración:
  - `src/pages/admin/DashboardPage.tsx` (GET dashboard con timeout/retry controlado)
  - `src/pages/admin/TenantsPage.tsx` (GET listado con timeout/retry controlado)

**Estado de validación (Fase 6):**
- Validación técnica continua ejecutada con `npm run lint` tras cada iteración relevante.
- Política aplicada y consistente en flujos críticos actuales:
  - GET críticos: timeout 10s + retry automático 5s + máximo 3
  - POST críticos: timeout 10s + retry manual (sin auto-retry)
- Se mantiene pendiente una validación E2E formal transversal cuando se complete la adopción en el resto de vistas de tenant/user.

**Estado actual de backend sobre idempotencia (importante):**
- El backend **aún no soporta** deduplicación transaccional basada en header `X-Idempotency-Key`.
- En consecuencia, el frontend envía ese header como preparación de contrato futuro, pero hoy debe considerarse un **hint sin efecto garantizado**.
- Por esta razón se mantiene la regla de seguridad: auto-retry solo en operaciones idempotentes (GET) y sin auto-retry en POST críticos.

**Por qué se mantiene esta decisión:**
- Sin idempotencia real en backend, reintentar POST puede provocar efectos duplicados (por ejemplo, doble creación o doble transición de estado).
- El timeout en POST protege UX y evita bloqueos largos, pero el reintento queda bajo control explícito del usuario.
- Esta estrategia minimiza riesgo funcional mientras se espera soporte backend definitivo.

**Condición para habilitar auto-retry en POST en el futuro:**
- Confirmación backend de soporte efectivo para `X-Idempotency-Key` (persistencia de clave, ventana temporal, deduplicación por operación y respuesta consistente para replays).

### `BlockingErrorModal.tsx`

**Propósito:** Modal de error bloqueante montado globalmente. Se superpone a la pantalla activa cuando el sistema detecta un error que impide continuar el flujo normal.

**Construcción — componentes internos:**

`DetailCell({ label, value })` — celda de dato de soporte reutilizable dentro del modal.

`NoRoleContent({ error, actions, onAction })` — contenido específico para `kind === 'NO_ROLE'`:
- Hace `useQuery` a `GET /api/v1/tenants/{slug}/account/profile` (no requiere rol) para obtener `username` y `email` reales del backend, sobreescribiendo los hints del token que pudieran ser `N/D`.
- Muestra el código de referencia `KG-NO-ROLE`, datos de diagnóstico y los botones de acción.
- Botón copiar: escribe un bloque de texto `clave=valor` en el portapapeles vía `navigator.clipboard.writeText`. La acción `logout` redirige a `/logout` para centralizar el cierre de sesión.
- Botones configurables: renderiza acciones definidas en `error.actions` (o acciones por defecto) y delega la ejecución al handler `onAction` del padre.

`BlockingErrorModal()` — contenedor del modal:
- Suscribe al `useBlockingErrorStore`. Si `error === null`, no renderiza nada (`return null`).
- Cuando se activa, mueve el foco al contenedor del modal (`innerRef.current?.focus()`).
- Trampa de foco: `onKeyDown` intercepta Tab/Shift+Tab para circular dentro del modal.
- Bloquea Escape (`e.preventDefault()`) — es un modal bloqueante intencional.
- Overlay semitransparente (`bg-slate-950/55`) para mantener contexto visual de la pantalla base.
- `role="alertdialog"` + `aria-modal="true"` + `aria-labelledby` para accesibilidad.

**Integración:**
- Montado en `src/App.tsx` junto al `<Toaster />`, fuera de `<Routes>`.
- Se activa vía `useBlockingErrorStore.setError(...)` desde cualquier punto de la app.
- `NoRoleContent` usa `getProfile` de `src/api/account.ts` y `ACCOUNT_QUERY_KEYS` para el cache de TanStack Query.

**Decisión de diseño:** Modal bloqueante en vez de página dedicada, para que el mensaje de error aparezca sobre el contexto donde ocurrió el problema — el usuario no pierde orientación visual. La acción de cierre es explícita (botón), no accidental (Escape o clic fuera).

**Estrategia:** Discriminación por `error.kind` — cada tipo de error bloqueante tiene su propio componente de contenido. Añadir un caso nuevo no requiere modificar la lógica del contenedor.

**Puntos de mejora / deuda técnica conocida:** La query al perfil no se cancela si el modal se desmonta antes de que responda; es inofensivo porque TanStack Query deduplicará la respuesta si el modal vuelve a montarse.

---

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

## 8b. DevConsole — `src/lib/devConsole/` + `src/components/DevConsole/`

### `src/lib/devConsole/store.ts`

**Propósito:** Zustand store centralizado para el estado de la consola de desarrollo: log de tráfico HTTP, salida de comandos e historial de entrada.

**Construcción:**
- `HttpLogEntry` — modelo de una entrada HTTP: `id`, `timestamp`, `method`, `url`, `status`, `duration`, `requestBody`, `responseBody`, `error`.
- `OutputLine` — unión discriminada de tipos de salida: `command`, `output`, `error`, `info`, `divider`, `http-header`, `http-row`.
- `DevConsoleStore` expone:
  - `open` / `height` — estado visual del panel.
  - `httpLog[]` — circular (máximo 200 entradas), alimentado por interceptores de Axios.
  - `output[]` — líneas de salida del intérprete (máximo 500).
  - `history[]` — historial de comandos ejecutados (máximo 100).
  - `logRequest` / `finalizeRequest` — API de escritura para interceptores (dos fases: request bootstrap → response patch).
  - `push` / `clearOutput` / `addHistory` — API del intérprete de comandos.

**Integración:**
- Leído por `DevConsole.tsx` para renderizar estado y reaccionar a cambios.
- Escrito por los interceptores de `src/api/client.ts`.
- Escrito por `src/lib/devConsole/commands.ts` vía `push` y `clearOutput`.

**Decisión de diseño:** Store separado de `tokenStore` y `blockingErrorStore` para encapsular completamente la preocupación de observabilidad interna. Solo se activa en el layout con rol `ADMIN`.

**Deuda técnica:** El log es en memoria; se pierde al navegar o recargar. Se podría persistir en `sessionStorage` con un límite ajustado si se necesita diagnóstico cross-navegación.

---

### `src/lib/devConsole/commands.ts`

**Propósito:** Intérprete puro de comandos de texto para la consola. Sin dependencias de React.

**Construcción:**
- `runCommand(raw, ctx)` — función de entrada: parsea el string, despacha al handler correspondiente.
- `CommandContext` — interfaz que recibe `httpLog[]`, `push()` y `clear()` para desacoplar el intérprete del store.
- Comandos implementados: `req [N]`, `requests [N]`, `filter <METHOD>`, `status`, `detail <N>`, `clear`, `cls`, `help`, `?`.
- Ningún handler tiene efectos secundarios fuera del `CommandContext` recibido.

**Integración:** Invocado por `CommandInput` dentro de `DevConsole.tsx` en el evento `submit` del input.

**Decisión de diseño:** Mantener el intérprete puro (sin imports de React ni Zustand) permite testarlo en aislamiento y añadir nuevos comandos sin tocar el componente visual.

---

### `src/components/DevConsole/DevConsole.tsx`

**Propósito:** Componente UI de la consola de desarrollo. Renderiza la barra, el panel de salida y el input de comandos.

**Construcción (subcomponentes privados):**
- `HttpTableHeader` — cabecera de la tabla de requests.
- `HttpRow` — fila individual de request con coloreado por método y estado.
- `OutputLineItem` — despacha cada `OutputLine` al renderer correcto (plain text / tabla HTTP / divider).
- `CommandInput` — input controlado con submit por Enter, historial `↑`/`↓` y focus automático al abrir.
- `RequestsBadge` — badge numérico con el total de requests registrados.
- `DevConsole` (export principal) — orquesta tamaño, drag-to-resize, atajos de teclado y scroll automático al final del log.

**Estado y efectos:**
- `useRef` + `useEffect` para scroll automático al final del output cuando se añaden líneas.
- `useEffect` para focus del input al abrir.
- `useEffect` para atajo `Ctrl+`` (global en `window`).
- Lógica de drag-to-resize via `mousedown` + listeners globales `mousemove`/`mouseup`.

**Accesibilidad:**
- `role="region"` + `aria-label` en el contenedor principal.
- `role="log"` + `aria-live="polite"` en el área de salida.
- `aria-expanded` y `aria-controls` en el botón de toggle.
- `aria-label` en el input de comandos.
- Botones con `focus-visible:ring` para navegación por teclado.

**Integración:** Montado condicionalmente en `AdminLayout.tsx` solo cuando `activeRole === 'ADMIN'`.

**Decisión de diseño:** Panel siempre presente en el DOM (sin desmontar) para no perder el estado de log al cambiar de ruta; solo cambia la altura CSS entre `28px` (colapsado) y el valor de `height` del store.

**Deuda técnica:** El drag-to-resize no está adaptado a touch (sin `touchmove`/`touchend`). Los comandos están hardcoded en español; no están conectados al sistema i18n.

---

## 9. Layouts — `src/layouts/`

### `AdminLayout.tsx`

**Propósito:** Shell compartido del dashboard para todos los roles autenticados — estructura persistente (sidebar + header) con `<Outlet>`.

**Construcción:**

**Componentes privados internos:**
- Importa iconos desde `src/components/icons/` (módulo centralizado).
- `Dropdown<T>` — componente reutilizable para selectores del header con cierre por click exterior y `role="listbox"`.
- `ThemeToggle` y `RoleSwitcher` — wrappers que consumen `Dropdown<T>` para mapear opciones de tema/rol.
- `LanguageSwitcher` — wrapper del selector de idioma en cabecera con iconos de bandera (`es-CL`, `en-US`).
- `useDropdown` — hook interno que centraliza `open/close`, toggle y click-outside para cualquier menú desplegable del layout.
- `UserAvatar` — genera iniciales desde `displayName` para el avatar circular.

**Sidebar por rol:**
- La constante `SIDEBAR_BY_ROLE` define secciones e items para `ADMIN`, `ADMIN_TENANT` y `USER_TENANT`.
- El rol primario se calcula con `resolvePrimaryRole(...)` a partir de `useCurrentUser()`.
- La renderizacion del menu se delega al componente generico `SidebarMenu`.
- Los items de rutas padre (`/dashboard`, `/dashboard/account`) se marcan con `exact: true` para evitar activacion por prefijo en subrutas hermanas.

**Grupos de navegación actuales (ejemplo ADMIN):**

| Grupo | Items |

---

## 10. API de cuenta (actualizacion 2026-04-02)

### `src/api/account.ts`

**Proposito:** Consolidar la capa API del dominio Account para todos los flujos self-service del usuario autenticado.

**Construccion:**
- Mantiene wrappers existentes de perfil (`getProfile`, `updateProfile`).
- Se agregaron wrappers para seguridad y configuracion:
  - `changePassword`
  - `getSessions`
  - `revokeSession`
  - `getNotificationPreferences`
  - `updateNotificationPreferences`
  - `getAccountAccess`
- Se agregaron wrappers para `connections` (backend real):
  - `getAccountConnections`
  - `linkAccountConnection`
  - `unlinkAccountConnection`
- Se mantiene normalizacion defensiva en `connections` para aceptar wire `snake_case` y `camelCase` y evitar quiebres entre versiones de contrato.
- Se amplio `ACCOUNT_QUERY_KEYS` para `sessions`, `notificationPreferences`, `access` y `connections`.

**Integracion:**
- Usa `apiClient` + `tenantUrl` para construir paths del tenant autenticado.
- Usa `RequestOptions` para `signal`, `timeoutMs` e `idempotencyKey` en mutaciones.
- Usa `unwrapResponseData` para extraer `BaseResponse<T>.data` de forma consistente.

**Decision de diseno:** Priorizar wrappers tipados y puros en `src/api/` para desacoplar UI de detalles HTTP y facilitar evolucion de contrato sin tocar componentes.

**Estrategia:** API domain-first; primero se completa la superficie de endpoints y query keys para luego conectar UI (fases 5-8) sin duplicar logica de red en componentes.

**Puntos de mejora / deuda tecnica conocida:**
- El mapper de compatibilidad mantiene doble naming (snake/camel) hasta estabilizar naming wire definitivo del backend.

### `src/types/user.ts`

**Proposito:** Centralizar DTOs del dominio usuario/cuenta para evitar definiciones locales en componentes o modulos API.

**Construccion:**
- Se agregaron tipos de account para soportar la ampliacion de `src/api/account.ts`:
  - `ChangePasswordRequest`, `ChangePasswordResult`
  - `AccountSessionData`, `RevokeAccountSessionResult`
  - `NotificationPreferencesData`, `UpdateNotificationPreferencesRequest`
  - `AccountAccessRoleData`, `AccountAccessData`
  - `AccountConnectionData`, `AccountConnectionProvider`, `WireAccountConnectionData`, `WireLinkAccountConnectionResult`, `LinkAccountConnectionRequest`, `LinkAccountConnectionResult`, `UnlinkAccountConnectionResult`

**Integracion:** Los nuevos DTOs son consumidos por la capa API de account y quedaran disponibles para hooks/paginas de settings/profile en fases siguientes.

**Decision de diseno:** Mantener DTOs en un unico modulo de tipos del dominio para preservar trazabilidad y evitar `any` o `Record<string, unknown>` en endpoints criticos.

### `src/api/account.test.ts`

**Proposito:** validar la capa API de `account.ts` en aislamiento, asegurando contratos de mapeo internos/wire y construccion correcta de endpoints.

**Cobertura actual (7 tests):**
- Query keys de account.
- `changePassword`: payload snake_case -> camelCase.
- `getSessions`: wire -> DTO interno.
- `revokeSession`: wire -> DTO interno.
- `notification-preferences`: mapeo bidireccional request/response.
- `getAccountAccess`: wire `UserAccessData` -> `AccountAccessData`.
- `connections`: encoding de `provider` y `connectionId` en rutas.

**Estrategia de test:**
- Mock de `apiClient` y `tenantUrl` usando `vi.hoisted(...)` + `vi.mock(...)` para evitar dependencias de red.
- Verificacion explicita de argumentos de llamada (`url`, `body`, `timeout`, headers de idempotencia).

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

**Selector de rol activo (menu de usuario):**
- Implementado sobre `SelectDropdown` (basado en `Dropdown<T>`) con los roles presentes en el claim `roles`.
- Se ubica dentro del menu de usuario, por encima de la accion "Mi cuenta".
- Configurado con `hideSelectedOption=true` para no repetir el rol activo dentro del menu desplegado.
- En ese contexto, su panel se posiciona hacia la izquierda para evitar solaparse con el panel principal del menu de usuario.
- Al cambiar rol: actualiza `activeRole` en `tokenStore` y navega a `/dashboard` para refrescar contenido y permisos visibles.
- Sidebar, etiqueta de rol y guards quedan sincronizados con el rol seleccionado.

**Effects:**
- Cierra el cajón móvil al cambiar de ruta (`location.pathname`).
- El cierre por click fuera de todos los dropdowns del header se resuelve en `useDropdown` (sin listeners duplicados en `AdminLayout`).

**Flujo de logout:** `navigate('/logout', { replace: true })` desde la UI. La ruta `/logout` centraliza `clearError()` + `clearTokens()` y redirige a `/login`.

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
- `useCurrentUser` → datos base del usuario para avatar/nombre en sidebar y dropdown; en el dropdown superior el nombre visible prioriza nombre+apellido y usa username como fallback.
- `useTheme` → ThemeToggle.
- `react-i18next` → textos de navegación, etiquetas de rol/tema, aria-labels y acciones del menú de usuario.
- `useTokenStore.clearTokens` → logout.
- `SidebarMenu` (`src/components/dashboard/SidebarMenu.tsx`) → render del menu parametrizable.
- Menú de usuario, selector de rol y selector de tema comparten el mismo primitive `Dropdown`.
- Selector de idioma de cabecera también reutiliza el mismo primitive via `SelectDropdown`.
- `useLocale` (`src/i18n/useLocale.ts`) alimenta el idioma actual, opciones soportadas y el cambio de idioma.
- `AdminLayout` es el `element` del route `/dashboard` en `App.tsx`.

**Decisión de diseño:** usar iconografía SVG centralizada en `src/components/icons/` (sin dependencia externa) para mantener consistencia visual (`w-5 h-5` base), accesibilidad (`aria-hidden="true"` en decorativos) y reutilización.

**Deuda técnica:**
- Buscador en el header es solo decorativo.
- Campana de notificaciones sin funcionalidad.
- Configuración de cuenta ya integra conexiones externas con backend real; se mantiene deuda de evolución para actividad avanzada de cuenta.
- Sin keyboard navigation completa en ThemeToggle (solo focus ring).
- `DevConsole` montada solo para `ADMIN`; los roles `ADMIN_TENANT` y `USER_TENANT` no tienen acceso a ella.

**DevConsole integration:**
```
div.flex-1.flex-col
├── header
├── main > Outlet
└── DevConsole  ← solo cuando activeRole === 'ADMIN'
```

**Regla de UX aplicada:** los selectores deben reutilizar el primitive compartido `Dropdown` (via `SelectDropdown`) para consistencia visual y de interacción; incluye selector de idioma en cabecera y en `AccountSettingsPage`.

---

## 10. Páginas — `src/pages/`

### 10.1 Landing — `src/pages/landing/`

**`LandingPage.tsx`** — Composición casi pura. Monta `LandingNav` + 6 secciones + `CTASection` + `ScrollToTop` y consume un flag de navegación en `location.state` para forzar scroll al inicio cuando se vuelve desde `/developers`.

**Secciones:**
| Archivo | Propósito | Notas |
|---------|-----------|-------|
| `LandingNav.tsx` | Barra de nav fija con links de ancla y CTAs | Integrado con i18n para labels del menu y acciones |
| `HeroSection.tsx` | Banner full-height con CTAs | Integrado con i18n para titular, descripcion y stats |
| `FeaturesSection.tsx` | Grid de 6 feature cards | Textos i18n + iconografia por key semantica |
| `HowItWorksSection.tsx` | 3 pasos del flujo de auth | Steps por key i18n (`landing.howItWorks.steps.*`) |
| `RolesSection.tsx` | Tarjetas de los 3 roles | Copy y capabilities resueltas por i18n |
| `PricingSection.tsx` | Grid de plan cards en modo display | Carga diferida del catálogo con `IntersectionObserver` + `useQuery`, timeout de 10s y retry automático controlado (5s, máximo 3) |
| `DevelopersSection.tsx` | Recursos para devs | Enlaza la guía pública de integración + copy i18n por recurso |
| `CTASection.tsx` | Footer con CTA final y copyright | i18n para copy/acciones + año dinámico |

**Decisión de diseño:** Cada sección es un componente independiente para facilitar su mantenimiento y reemplazo. `LandingPage` no contiene lógica — solo composición.

**Actualización relevante:** `LandingNav.tsx` incorpora `LocaleSwitcher` en modo compacto para permitir cambio de idioma (ES/EN) directamente desde la landing, integrado al estilo visual del header público.

**Actualización relevante:** `LandingNav.tsx` replica la estrategia responsive de `/subscribe` para mobile/tablet: wordmark `KeyGo` oculto hasta `lg` (`hidden lg:inline`) y `LocaleSwitcher` con `selectedValueClassName="hidden lg:inline ..."` para mostrar solo bandera hasta ese breakpoint.

**Actualización relevante:** `HeroSection.tsx` ajustó el offset vertical del hero en mobile (`pt-24 sm:pt-16`) para compensar el header fijo y mantener distancia visual entre la barra superior y el badge "Plataforma IAM cloud-ready".

**Actualizacion relevante:** todas las secciones de landing (`LandingNav`, `HeroSection`, `FeaturesSection`, `HowItWorksSection`, `RolesSection`, `PricingSection`, `DevelopersSection`, `CTASection`) migraron copy visible a claves i18n `landing.*` para que el cambio de idioma sea consistente en toda la pantalla.

**Actualización relevante:** `DevelopersSection.tsx` pasó de ser un bloque meramente promocional a un punto de entrada funcional hacia la guía pública `/developers`, usando `Link` de React Router para navegar a la documentación y al ancla de endpoints.

---

### 10.2 Login — `src/pages/login/`

**`LoginPage.tsx`**

**Propósito:** Implementación completa del flujo OAuth2/PKCE desde el navegador.

**Construcción:**

Componentes privados:
- `InitLoadingState` — spinner durante inicialización.
- `InitErrorState` — error con opción de retry.
- `LoginForm` — formulario de credenciales con honeypot, Turnstile, rate limiting y toggle mostrar/ocultar contraseña (botón tipo ojo con `aria-label` dinámico).

Helpers privados:
- `resolveRedirectPath(roles)` — mapea rol → ruta post-login.
- `extractAuthorizeError(error)` — normaliza errores del paso 1 usando `getAppApiError(...)`.
- `extractLoginError(error)` — normaliza errores del paso 2 usando `getAppApiError(...)`.

Detección de sesión sin roles:
- Un `useEffect` observa `accessToken` e `idToken`. Si hay token pero `roles.length === 0`, llama `setError(...)` en `useBlockingErrorStore` con `kind: 'NO_ROLE'`, activando el modal bloqueante sobre la pantalla actual.
- Esto cubre tanto el login recién completado como la sesión restaurada al recargar la página (refresh token en `sessionStorage`).
- `resolveRedirectPath` ya no maneja el caso sin roles — ese flujo está completamente en manos del store.

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

**Integración:** `authorize`, `login`, `exchangeToken` (api/auth.ts) → `verifyIdToken`, `extractRoles` (auth/jwksVerify.ts) → `setTokens` (auth/tokenStore.ts) → `persistRefreshToken` (auth/refresh.ts) → `useBlockingErrorStore` (auth/blockingErrorStore.ts) → `useHoneypot`, `useRateLimit`, `TurnstileWidget`.

**Actualización relevante:** se integra `LocaleSwitcher` en el header de la tarjeta de login para permitir cambio de idioma sin abandonar el flujo de autenticación.

**Actualización relevante:** los mensajes de timeout/reconexión del login dejaron de usar literales fijos y ahora consumen claves i18n (`auth.errors.timeout*`) para respetar el idioma activo también en fallos de red.

**Actualización relevante:** La captura de errores dejó de depender de parseo manual del envelope Axios y ahora usa `getAppApiError(...)` (código, mensaje y retryabilidad) para mantener consistencia con el contrato OpenAPI de `ErrorResponse`. La lógica de reintento/reconexión en `onError` también usa `retryable` y `httpStatus` normalizados.

**Actualización relevante:** los fallbacks genéricos de `errorNormalizer` (`unknown` y `network`) ahora se resuelven vía i18n (`errors.*`) en runtime, evitando mensajes forzados en español cuando el idioma activo es inglés.

**Actualización relevante:** `resolveRedirectPath` ahora mapea todos los roles a `/dashboard` (ruta unificada). Además, el efecto de inicialización de login evita ejecutar `authorize()` cuando ya existe `accessToken`, previniendo ciclos de autorización si la navegación retorna a `/login`.

**Actualización relevante:** el auto-reintento de `authorize()` en estado de error dejó de usar un `setInterval` continuo y ahora agenda un solo intento por ciclo (cada 5s, máximo 3). El contador solo se reinicia al iniciar un nuevo episodio (reintento manual o re-inicialización explícita), evitando reintentos indefinidos cuando el backend está caído.

**Actualizacion relevante:** se incorporo el enlace "Olvide mi contrasena" en el footer de login y se agregaron tres rutas publicas nuevas:
- `ForgotPasswordPage.tsx` (`/forgot-password`) — solicitud de recuperacion por correo con respuesta neutral.
- `RecoverPasswordPage.tsx` (`/recover-password`) — recuperacion por token de email.
- `ResetPasswordPage.tsx` (`/reset-password`) — reset con contrasena temporal.

**Actualizacion relevante:** el bloque de CTA secundarios del footer del login (`forgot password` y `register`) aumento su escala tipografica a `text-sm` y mayor peso visual para mejorar legibilidad respecto al estado previo.

**Deuda técnica:** el dashboard compartido mantiene tarjetas de resumen con placeholders en roles no ADMIN. Falta conectar metricas especificas por rol.

**`LogoutPage.tsx`**

**Propósito:** ruta de salida segura para cerrar sesión incluso en estados inconsistentes de contexto (por ejemplo, rol activo no asentado).

**Construcción:** al montar, ejecuta `clearError()` del `blockingErrorStore` y `clearTokens()` del `tokenStore`, luego redirige con `Navigate` a `/login`.

**Integración:** se expone como ruta pública `/logout` en `App.tsx` y es usada por acciones de cierre de sesión desde `AdminLayout` y `BlockingErrorModal`.

---

### 10.2.1 Dashboard compartido por rol — `src/pages/dashboard/`

**`DashboardHomePage.tsx`**

**Propósito:** punto de entrada comun de `/dashboard`. Decide el contenido principal segun rol conservando el mismo layout visual.

**Construcción:**
- Resuelve el rol de vista desde `activeRole` (seleccionado por el usuario en el header) y usa rol primario como fallback.
- Si es `ADMIN`, renderiza `AdminDashboardPage` completo.
- Si es `ADMIN_TENANT`, ejecuta queries locales para `listUsers`, `listClientApps` y `getSessions`, y calcula tarjetas reales (usuarios activos, apps, accesos del dia).
- Si es `USER_TENANT`, ejecuta queries locales para `getSessions` y `getAccountAccess`, y calcula tarjetas reales (sesiones activas, ultimo acceso, apps con acceso).
- Cada tarjeta resuelve `loading/error/data` de forma local (`...`, `N/D` o valor final), sin bloquear toda la pantalla.
- Si no existe `tenantSlug` en la sesion, muestra alerta local de contexto invalido para evitar llamadas fuera de scope.
- El mensaje de tenant no resuelto se renderiza via i18n (`dashboard.tenantResolutionError`) para respetar `es-CL`/`en-US`.
- Las métricas consumen normalización defensiva de colecciones (`array`, `items`, `content`, `rows`, `data`) antes de aplicar `filter`/`length`, evitando crash de runtime cuando backend o intermediarios devuelven envelopes paginados.

**Integración:** se monta como `index` route de `/dashboard` en `src/App.tsx`.

**Decisión de diseño:** reutilizar el dashboard admin existente para `ADMIN` y aplicar el mismo esqueleto visual para los otros roles, sin duplicar layout.

**Puntos de mejora / deuda técnica conocida:** enriquecer indicadores con endpoints agregados tenant/user (estadisticas historicas y alertas reales) para reducir dependencia de conteos derivados de sesiones actuales.

**`FeaturePlaceholderPage.tsx`**

**Propósito:** pantalla dinamica para modulos pendientes del sidebar con UI funcional y datos mockeados.

**Construcción:**
- Usa `featureId` en URL para resolver titulo, badge y metadata del modulo.
- Consulta snapshot del modulo con TanStack Query + `getPendingFeatureSnapshot(...)` (MSW) y resiliencia de red (`runGetWithRecovery`).
- Renderiza resumen, KPIs, acciones y tabla de datos segun la configuracion del modulo.
- Ejecuta acciones simuladas mediante `runPendingFeatureAction(...)` con `useMutation` y feedback con toast.
- Mantiene estados locales de `loading`, `error` y `data` sin bloquear el resto del dashboard.

**Integración:** se monta en `/dashboard/feature/:featureId`.

**Actualización relevante:** `feature/api` dejó de usar placeholder y ahora se resuelve con `PlatformStatsPage` para el rol `ADMIN`.

**Decisión de diseño:** reemplazar placeholders vacios por una unica pagina dinamica para acelerar validacion funcional y UX mientras el backend publica contratos definitivos por modulo.

**Puntos de mejora / deuda técnica conocida:** reemplazar el endpoint mock `GET/POST /api/v1/platform/pending-features/:featureId` por endpoints backend reales por dominio y migrar la tabla generica a componentes especificos por modulo.

**`src/api/pendingFeatures.ts`**

**Propósito:** encapsular acceso a endpoints temporales MSW para modulos pendientes del dashboard.

**Construcción:**
- `getPendingFeatureSnapshot(featureId)` obtiene `PendingFeatureSnapshot` para pintar la UI.
- `runPendingFeatureAction(featureId, action, itemId)` simula acciones operativas con envelope `BaseResponse<T>`.
- Define `PENDING_FEATURE_QUERY_KEYS` para cache consistente de TanStack Query.

**Integración:** consumido por `FeaturePlaceholderPage.tsx`; datos servidos por `src/mocks/handlers.ts`.

**Decisión de diseño:** centralizar capa API mock en un modulo para evitar lógica HTTP en componentes y facilitar migracion a backend real.

**Puntos de mejora / deuda técnica conocida:** al existir contrato oficial, dividir este modulo en APIs de dominio (`apps`, `audit`, `tokens`, etc.) y eliminar dependencias temporales.

### 10.2.2 Admin tenant pages reales — `src/pages/dashboard/tenant/`

**`TenantUsersPage.tsx`**

**Propósito:** gestión completa de usuarios del tenant (lectura + escritura) para rol `ADMIN_TENANT`.

**Construcción:**
- Usa `useCurrentUser().tenantSlug` (fallback `TENANT`) para resolver el scope del tenant.
- Lectura: consulta `listUsers(...)` con `useQuery` y `USER_QUERY_KEYS.all(...)`; renderiza tabla.
- Resiliencia GET: timeout por intento (10s) + retry automático controlado (5s, máximo 3) para la carga inicial/listado.
- Escritura: `useMutation` para `createUser(...)` y `resetUserPassword(...)`.
  - Modal "Crear usuario" con formulario Zod validado (username, email, password requeridos; nombre/apellido opcionales).
  - Botón "Resetear contraseña" en cada fila abre modal de entrada segura.
  - Invalidación de cache de usuarios tras éxito de mutación.
- Resiliencia mutaciones: timeout explícito (10s) sin auto-retry para crear/editar/resetear contraseña.

**Integración:** ruta `/dashboard/tenant/users` protegida por `RoleGuard` con `ADMIN_TENANT`.

**Decisión de diseño:** modales inline con estado local para mantener UI y lógica en un archivo; validación con Zod + react-hook-form para consistencia con el resto del proyecto.

**Puntos de mejora / deuda técnica conocida:** editar perfil de usuario (nombre, apellido, teléfono), cambiar estado (suspender/activar).

**`TenantAppsPage.tsx`**

**Propósito:** gestión completa de client apps del tenant (lectura + escritura) para rol `ADMIN_TENANT`.

**Construcción:**
- Lectura: consulta `listClientApps(...)` con `CLIENT_APP_QUERY_KEYS.all(...)`; renderiza tabla.
- Resiliencia GET: timeout por intento (10s) + retry automático controlado (5s, máximo 3).
- Escritura: `useMutation` para `createClientApp(...)` y `rotateClientAppSecret(...)`.
  - Modal "Crear aplicación" con formulario completo: nombre, descripción, tipo (PUBLIC/CONFIDENTIAL), grants (múltiple), redirect_uris, scopes.
  - Los campos `type` y `grants` usan `SelectDropdown` en vez de `select` nativo.
  - Botón "Rotar secret" en cada fila abre confirmación y luego muestra nuevo secret con opción copiar (one-time display).
  - Invalidación de cache tras éxito.
- Resiliencia mutaciones: timeout explícito (10s) sin auto-retry para crear app y rotar secret.

**Integración:** ruta `/dashboard/tenant/apps` protegida por `RoleGuard` con `ADMIN_TENANT`.

**Decisión de diseño:** `useFieldArray` para agregar/quitar grants dinámicamente; modal separada para rotar secret con UX segura (copia al clipboard).

**Puntos de mejora / deuda técnica conocida:** editar app existente (nombre, descripción, grants), desactivar app, agregar/remover redirect_uris desde detalle.

**`TenantMembershipsPage.tsx`**

**Propósito:** gestión completa de memberships usuario-app (lectura + escritura) para rol `ADMIN_TENANT`.

**Construcción:**
- Lectura: carga usuarios (`listUsers`) y apps (`listClientApps`) del tenant; permite seleccionar usuario con dropdown.
  - Carga memberships por usuario usando `listMembershipsByUser(...)`.
  - Resuelve nombre de app desde mapa `client_app_id` → `name`.
- Resiliencia GET: timeout por intento (10s) + retry automático controlado (5s, máximo 3) en usuarios, apps, memberships y roles.
- Escritura: `useMutation` para `createMembership(...)` y `revokeMembership(...)`.
  - Modal "Crear membership" con selección de usuario y app mediante `SelectDropdown`, y roles con checkboxes dinámicas cargadas por app.
  - Botón "Revocar" en cada fila con confirmación; elimina membership inmediatamente.
  - Invalidación de cache tras éxito.
- Resiliencia mutaciones: timeout explícito (10s) sin auto-retry para crear/revocar membership.

**Integración:** ruta `/dashboard/tenant/memberships` protegida por `RoleGuard` con `ADMIN_TENANT`.

**Decisión de diseño:** query `listAppRoles` condicional para cargar roles sólo cuando se selecciona app; checkboxes para selección múltiple de roles sin complejidad de multi-select.

**Puntos de mejora / deuda técnica conocida:** filtro de memberships por app, editar roles de membership existente, suspender/reactivar membership.

### 10.2.3 Sidebar parametrizable — `src/components/dashboard/SidebarMenu.tsx`

**Propósito:** componente de menu lateral generico reutilizable para cualquier rol.

**Construcción:**
- Recibe `sections` (lista de secciones y items), estado `collapsed` y callback `onNavigate`.
- Renderiza `NavLink` con estilos activos/inactivos comunes.
- Cada item acepta `exact?: boolean`; cuando esta activo, se propaga a `NavLink end` para match exacto de ruta.
- Soporta modo colapsado con separadores visuales.

**Integración:** consumido por `src/layouts/AdminLayout.tsx`, que inyecta configuraciones de menu por rol.

**Decisión de diseño:** separar estructura de menu (datos) de la presentacion para mantener sidebars parametrizables.

**Puntos de mejora / deuda técnica conocida:** revisar periódicamente iconos inline residuales en pantallas legacy para consolidarlos al módulo compartido.

### 10.2.4 User tenant pages reales — `src/pages/dashboard/user/`

**`UserMyAccessPage.tsx`**

**Propósito:** visibilidad de accesos efectivos del usuario autenticado en su tenant.

**Construcción:**
- Usa `useCurrentUser()` para resolver `tenantSlug` y `sub` del usuario.
- Consulta memberships con `listMembershipsByUser(...)` y apps con `listClientApps(...)`.
- Resuelve `client_app_id` a nombre de app para renderizar tabla de accesos.
- Resiliencia GET: timeout por intento (10s) + retry automático controlado (5s, máximo 3) para memberships y apps.
- i18n con `react-i18next` usando claves `userDashboardMyAccess.*` para encabezado, tabla, estados y mensajes de carga/error/vacio.
- Formatea `created_at` con `toLocaleString(i18n.language)` para respetar locale activo.

**Integración:** ruta `/dashboard/user/my-access` protegida por `RoleGuard` con `USER_TENANT`.

**Decisión de diseño:** reutilizar APIs de memberships y apps ya existentes para evitar endpoint adicional de agregacion.

**Puntos de mejora / deuda técnica conocida:** mostrar nombres de rol funcionales (hoy se muestran ids/codigos).

**`UserActivityPage.tsx`**

**Propósito:** mostrar actividad reciente de acceso del usuario.

**Construcción:**
- Lee ultimo login desde claim `iat` del `idToken`.
- Usa memberships ordenadas por `created_at` para construir linea de tiempo de eventos de acceso.
- Resiliencia GET: timeout por intento (10s) + retry automático controlado (5s, máximo 3) para memberships y apps.

**Integración:** ruta `/dashboard/user/activity` protegida por `RoleGuard` con `USER_TENANT`.

**Decisión de diseño:** sin endpoint dedicado de auditoria para USER_TENANT, se expone actividad util usando datos ya disponibles y verificables.

**Puntos de mejora / deuda técnica conocida:** migrar a endpoint de auditoria real cuando backend lo exponga.

**`UserSessionsPage.tsx`**

**Propósito:** exponer estado de la sesion activa del usuario.

**Construcción:**
- Decodifica `accessToken` e `idToken` para mostrar emision, expiracion y TTL estimado.
- Muestra disponibilidad de `refreshToken` en `sessionStorage` (via store en memoria + persistencia parcial).
- i18n con `react-i18next` usando claves `userDashboardSessions.*` en titulos, labels y estado de persistencia.
- Fechas de token se formatean con locale activo (`i18n.resolvedLanguage ?? i18n.language`).

**Integración:** ruta `/dashboard/user/sessions` protegida por `RoleGuard` con `USER_TENANT`.

**Decisión de diseño:** dar visibilidad de sesion sin crear endpoint nuevo; utiliza metadata JWT local.

**Puntos de mejora / deuda técnica conocida:** agregar sesion por dispositivo/IP cuando exista endpoint backend.

**`UserProfilePage.tsx`**

**Propósito:** vista unificada de **Mi cuenta** para todos los roles autenticados, con tabs de resumen, perfil, accesos y actividad.

**Construcción:**
- Query `getProfile(...)` con `ACCOUNT_QUERY_KEYS.profile(...)` para hidratar resumen y formulario.
- Tabs accesibles (`role="tablist"`, `role="tab"`, `role="tabpanel"`) para separar estados de UI sin overlays globales.
- Tabs con iconografía contextual (`Dashboard`, `User`, `Shield`, `Clock`) para mejorar escaneo visual.
- Tab **Perfil** con formulario RHF + Zod para campos editables.
- Mutacion `updateProfile(...)` con invalidacion de cache y feedback por toast.
- Tab **Accesos** conectada a `getAccountAccess(...)` con estados locales (`loading/error/empty/data`).
- Tab **Actividad** conectada a `getSessions(...)` para mostrar sesiones recientes, estado de sesion actual, IP y fechas de ultimo acceso/expiracion.
- En tab **Resumen**, el nombre visible prioriza `first_name + last_name`; si ambos faltan, usa `username` como fallback.
- En tab **Resumen**, no se muestran `email` ni `activeRole`.
- Resiliencia: GET de perfil/sesiones con timeout (10s) + retry automático controlado (5s, máximo 3); PATCH de actualización con timeout explícito (10s) sin auto-retry.
- i18n con `react-i18next` usando claves `userDashboardProfile.*` para tabs, labels, placeholders, carga/error y toasts.
- Schema Zod se construye con mensajes localizados (`invalidProfileUrl`) para mantener validación consistente por idioma.

**Integración:**
- Ruta principal: `/dashboard/account` (autenticada para todos los roles).
- Ruta legacy: `/dashboard/user/profile` redirige a `/dashboard/account`.

**Decisión de diseño:** centralizar cuenta personal en una única ruta reduce duplicidad entre sidebar y dropdown, y desacopla "mi cuenta" de rutas específicas por rol.

**Puntos de mejora / deuda técnica conocida:**
- enriquecer actividad con un endpoint de timeline/auditoría dedicado cuando backend publique contrato self-service específico.

**`AccountSettingsPage.tsx`**

**Propósito:** concentrar la configuración de cuenta en una única vista con tabs de seguridad, notificaciones, conexiones, idioma y facturación.

**Construcción:**
- Tabs accesibles con estado local para segmentar cada bloque de configuración.
- Tabs con iconografía contextual (`Shield`, `Bell`, `Link`, `Globe`, `CreditCard`) alineadas con el estándar global.
- Lectura de `?tab=` para compatibilidad con rutas legacy (por ejemplo redirección desde `/dashboard/user/sessions`).
- La configuración de idioma se resuelve en tab dedicada, con helper explicativo de fuente de detección (`navigator.languages`) y estado de preferencia (automático/manual).
- Seguridad implementada con módulos dedicados:
  - `ChangePasswordForm.tsx`: RHF + Zod + `changePassword(...)`.
- Notificaciones implementadas con `NotificationsPreferencesForm.tsx`:
  - `getNotificationPreferences(...)` + `updateNotificationPreferences(...)`.
  - Estado local de carga/error/guardado y toast de feedback.
- Conexiones implementadas con `ConnectionsPanel.tsx` sobre endpoints temporales MSW:
  - `getAccountConnections(...)`, `linkAccountConnection(...)`, `unlinkAccountConnection(...)`.
  - Selector de proveedor implementado con `SelectDropdown`, más lista de conexiones y acciones de vincular/desvincular.
  - Indicadores explícitos en UI de dependencia contractual pendiente (`F-042`).
- Facturación conectada a endpoints reales (`getActiveSubscription`, `listInvoices`) para `ADMIN_TENANT`.
- Se agrega mutación de cancelación de renovación (`cancelSubscription`) con confirmación explícita y refresco de cache (`invalidateQueries`) para suscripción e invoices.
- Resiliencia GET: timeout por intento (10s) + retry automático controlado (5s, máximo 3) para suscripción e invoices.

**Integración:**
- Ruta principal: `/dashboard/account/settings` (autenticada para todos los roles).
- Render condicional por rol: la tab de facturación muestra datos solo para `ADMIN_TENANT`.
- Rutas legacy: `/dashboard/user/sessions` redirige a `/dashboard/account/sessions`.

**Decisión de diseño:** separar "Mi cuenta" de "Configuración de cuenta" evita sobrecargar una sola página y permite habilitar módulos backend en forma incremental.

**Puntos de mejora / deuda técnica conocida:**
- Reemplazar MSW por backend productivo cuando `F-042` quede publicado en OpenAPI; el panel ya esta preparado para transicion de naming.
- Falta conectar la tab de actividad de `UserProfilePage` a un endpoint backend self-service cuando el contrato esté disponible.

**`AccountSessionsPage.tsx`**

**Propósito:** separar la gestión de sesiones activas/remotas fuera de Configuración de cuenta para mantener `AccountSettingsPage` enfocada en preferencias y configuración.

**Construcción:**
- Header contextual con título/subtítulo de seguridad de cuenta.
- Reutiliza `SessionsList.tsx` como bloque autónomo para listado de sesiones y revocación remota.
- Incluye acceso rápido de retorno a Configuración de cuenta en tab Seguridad.

**Integración:**
- Ruta principal: `/dashboard/account/sessions` (autenticada para todos los roles).
- Compatibilidad: `/dashboard/user/sessions` redirige a esta nueva ruta.

**Decisión de diseño:** mover sesiones a una vista dedicada reduce sobrecarga en la tab de Seguridad de settings y facilita descubribilidad desde el sidebar.

**`AccountPanelPrimitives.tsx`**

**Propósito:** centralizar primitives presentacionales del dominio Account Settings para evitar duplicación de estilos y estructura entre tabs.

**Construcción:**
- `PanelCard` para contenedor uniforme de módulo (título/subtítulo/badge opcional).
- `LoadingMessage` y `ErrorMessage` para estados async locales consistentes.
- `PrimaryActionButton` y `DangerActionButton` para acciones CTA repetidas.

**Integración:** reutilizado por `NotificationsPreferencesForm.tsx`, `ConnectionsPanel.tsx` y `SessionsList.tsx`.

**Decisión de diseño:** mantener separación estricta entre presentación reutilizable y lógica de datos por componente para respetar patrón Container/Presenter.

**`FaqCenterPage.tsx`**

**Propósito:** centralizar preguntas frecuentes de todo el sistema en una página única que evolucione junto con nuevas funcionalidades.

**Construcción:**
- Página standalone con tabs accesibles (`tablist`, `tab`, `tabpanel`) alineadas con los menús del sidebar según rol activo.
- Cada tab contiene FAQs en formato accordion (`details/summary`) ordenadas de simple a avanzado.
- El contenido se modela por configuración (`FAQ_TABS_BY_ROLE`) para soportar crecimiento orgánico por módulo del sistema.
- Buscador local (`type=search`) para filtrar por texto en pregunta/respuesta dentro de la pestaña visible, con estado vacío accesible.
- Header con nota explícita de crecimiento orgánico para guiar mantenimiento y expansión del contenido.

**Integración:**
- Ruta protegida para usuarios autenticados: `/dashboard/faq`.
- Compatibilidad legacy: `/dashboard/account/faq` redirige a `/dashboard/faq`.
- Entrada en navegación lateral y menú de usuario desde `AdminLayout`.
- CTA de acceso desde `AccountSettingsPage`.

**Decisión de diseño:** centralizar FAQs en una sola ruta transversal evita fragmentación por pantalla y mejora descubribilidad de ayuda contextual por rol.

**Puntos de mejora / deuda técnica conocida:**
- En próximas iteraciones se puede versionar el contenido por feature flag para mostrar FAQs solo cuando un módulo esté habilitado en backend.

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
- `StepRail` (privado): navegacion vertical de pasos en lateral izquierdo para desktop.
- `LiveSummary` (privado): panel lateral derecho con resumen en vivo (paso actual, plan, precio, responsable, empresa, condiciones e ID de contrato).
- El bloque `Current step` de `LiveSummary` reutiliza el lenguaje visual de seleccion (fondo indigo claro + borde indigo marcado + sombra) para mantener consistencia con la seleccion de planes.
- Honeypot a nivel de página (`HoneypotField` + `useHoneypot`) filtrado en `handleTermsSubmit`.
- Layout responsive: en `lg` usa grilla de 3 columnas (`StepRail` + contenido + `LiveSummary`); en móvil mantiene `StepIndicator` compacto sobre el contenido.
- Ajuste visual: en desktop intermedio se redujo el ancho de columnas laterales para priorizar la columna central, se bajo padding vertical/horizontal del panel principal y los paneles laterales (`StepRail`/`LiveSummary`) quedaron sticky para mantener contexto con menos scroll percibido.

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

**Actualizacion relevante:** el header de `NewContractPage.tsx` (y la vista legacy `ResumeContractPage.tsx`) integra `LocaleSwitcher` en modo compacto para permitir cambio de idioma sin salir del flujo de contratacion.

**Actualizacion relevante:** el flujo completo de `/subscribe` y sus steps (`PlanStep`, `ContractorStep`, `TermsStep`, `EmailVerificationStep`, `PaymentStep`, `SuccessStep`) migro sus textos visibles a claves i18n `subscribe.*`, incluyendo mensajes de estado y labels accesibles del OTP.

**Actualizacion relevante:** `TermsOfServiceContent.tsx` y `PrivacyPolicyContent.tsx` eliminaron el switch local ES/EN; ahora ambos renderizan la version legal segun el idioma global activo (`i18n.resolvedLanguage`/`i18n.language`) para mantener consistencia con `LocaleSwitcher` del flujo.

**Actualizacion relevante:** `PolicyModal.tsx` migro sus textos estaticos a i18n (`policyModal.close`, `policyModal.accept`, `policyModal.scrollHint`) para que el aria-label del cierre, los botones y el mensaje de "desplazate" se rendericen en el idioma activo.

**Actualizacion relevante:** `PlanCatalogGrid.tsx` migro el toggle de periodicidad de seleccion de plan (`Mensual/Anual`) a i18n usando `subscribe.period.monthly` y `subscribe.period.yearly`, eliminando labels hardcodeados en español.

**Actualizacion relevante:** `PlanCatalogGrid.tsx` ajusto su estrategia de `visibleCount` en modo seleccion para mostrar menos tarjetas por viewport en desktop intermedio (2 en lugar de 3), evitando cards angostas en `/subscribe`.

**Actualizacion relevante:** en modo seleccion, `PlanCatalogGrid.tsx` endurecio breakpoints para mostrar 1 card por vista en movil/tablet chico y pasar a 2 cards recien desde anchos grandes (`>=1200px`), corrigiendo compresion de tarjetas en telefono.

**Actualizacion relevante:** `PlanCatalogGrid.tsx` corrigio overflow horizontal post-carga en movil/tablet agregando `box-border` a cada slide del track, de modo que el padding lateral quede incluido en el ancho porcentual de la tarjeta (`width: cardPct%`).

**Actualizacion relevante:** `StepIndicator` en `NewContractPage.tsx` ajusto tamano/espaciado en mobile (`w/h` de nodos y ancho de conectores) y encapsulo overflow horizontal para evitar que el tracker de 5 pasos empuje el layout fuera del viewport en telefono.

**Actualizacion relevante:** `PlanCard.tsx` en modo seleccion utiliza tipografia/padding mas compactos y el badge (`Mas popular`) fuerza `whitespace-nowrap` para evitar quiebres.

**Actualizacion relevante:** `PlanStep.tsx` redujo su separacion vertical (`gap`) y elimino padding superior extra en el contenedor de acciones para acercar el boton "Continuar" al carrusel y alinear el ritmo visual con los otros pasos.

**Actualizacion relevante:** `NewContractPage.tsx` aumento la jerarquia tipografica del CTA de retoma de contrato al pie del wizard (`text-xs` -> `text-sm` y accion con `font-semibold`) para equiparar legibilidad con otros CTAs textuales de autenticacion/registro.

**Actualizacion relevante:** `NewContractPage.tsx` y `ResumeContractPage.tsx` ocultaron el wordmark "KeyGo" en mobile (`hidden sm:inline`) para dejar solo el icono en header y mejorar el uso de ancho junto al selector de idioma y CTA de login.

**Actualizacion relevante:** en ambos headers de subscribe, `LocaleSwitcher` usa `selectedValueClassName="hidden sm:inline ..."` para mostrar solo la bandera en mobile y recuperar la etiqueta textual del idioma en `sm+`.

**Actualizacion relevante:** en `NewContractPage.tsx` y `ResumeContractPage.tsx`, el texto introductorio del enlace de login (`subscribe.header.alreadyHaveAccount`) se oculta en mobile (`hidden sm:inline`) para dejar solo la accion principal (`subscribe.header.login`) y optimizar ancho en cabecera.

**Actualización relevante:** El manejo de errores del flujo migró a `getAppApiError(...)` en sus handlers principales (lookup de contrato, creación, verificación de email, reenvío de código y pago/activación), eliminando parsing por string y homogenizando mensajes por contrato backend.

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

**Actualización relevante:** El submit ahora clasifica errores por `code`/`httpStatus` normalizados (`RESOURCE_NOT_FOUND`, `DUPLICATE_RESOURCE`, `CONFLICT/409`) en vez de heurísticas por texto (`includes('404'/'duplicate')`).

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
- Internacionalización completa del módulo con `react-i18next` usando claves `adminDashboard.*`.

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

**i18n:**
- `DashboardPage.tsx` traduce encabezado, selector de rango, acciones, error global y títulos de secciones.
- `DashboardPrimitives.tsx` traduce etiquetas de desglose (`active/pending/suspended`).
- `ServiceStatusRow.tsx`, `IamCoreRow.tsx`, `SecurityRow.tsx`, `PendingAndActivityRow.tsx`, `RankingsRow.tsx` y `OnboardingHealthRow.tsx` consumen `adminDashboard.*` para evitar hardcodes.
- `RankingsRow.tsx` formatea cantidades con `toLocaleString(i18n.language)` para coherencia numérica por idioma.

**Decisión de diseño:** Un único endpoint agrega todos los datos para evitar waterfalls. El selector de rango es local hasta que el backend soporte parámetros de filtro temporal.

**Deuda técnica:** El rango seleccionado (Hoy / 7d / 30d) no se envía al backend (el endpoint no define query params de rango). Se activa como filtro cuando el backend lo soporte.

**`src/pages/admin/PlatformStatsPage.tsx`**

**Propósito:** módulo funcional de `Sistema > API` para visualizar estadísticas globales de plataforma en una vista compacta.

**Construcción:**
- Consulta `getPlatformStats(...)` desde `api/serviceInfo.ts` con `useQuery` y `PLATFORM_QUERY_KEYS.stats`.
- Usa `runGetWithRecovery` para timeout de 10 segundos y retry controlado (5 segundos, máximo 3).
- Renderiza cuatro tarjetas (tenants, usuarios, apps y claves activas) con manejo local `isLoading/isError/data`.
- Aplica lectura defensiva (`?.` + fallback numérico) para payloads parciales del backend y evita crashes por propiedades ausentes.

**Integración:** ruta `/dashboard/feature/api` protegida con `RoleGuard` para `ADMIN` en `src/App.tsx`, con textos i18n en `platformStats.*`.

**Decisión de diseño:** cerrar primero el `GAP_UI` de un endpoint ya productivo (`GET /platform/stats`) antes de abrir módulos con dependencia de contrato pendiente.

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

**i18n:** filtros, estados, placeholders, mensajes de vacío/error, paginación y labels ARIA se resuelven con `react-i18next` (`adminTenants.*`).

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

**i18n:** toasts, confirmación de suspensión, labels de metadata y acciones se resuelven con `react-i18next` (`adminTenantDetail.*`).

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

**i18n:** schema de validación (Zod), textos de formulario y toasts de resultado usan claves `adminTenantCreate.*` para respetar idioma activo.

---

### 10.9 Developer docs — `src/pages/developers/`

**`DeveloperDocsPage.tsx`**

**Propósito:** página pública que documenta dos modelos de integración con KeyGo: login propio y login integrado de keygo-ui como hosted login.

**Construcción:** organiza el contenido en cinco bloques: hero introductorio, comparativa de estrategias, sección de login propio, sección de login integrado, catálogo mínimo de endpoints y checklist de seguridad. Usa arrays inline para prerrequisitos, endpoints y reglas, renderiza snippets con subcomponentes locales `CodePanel`, `JsonPanel` y `QueryStringPanel`, tablas de campos con `FieldTable`, tabs de I/O con `EndpointIoTabs`, tabs de catálogo con `EndpointCatalogTabs`, y normaliza el scroll de entrada con `useLocation`: sin hash sube al tope; con hash hace scroll a la sección objetivo. El bloque de endpoints se presenta como tabs accesibles por endpoint para reducir altura visual y facilitar comparación rápida. Las tabs del catálogo usan etiquetas concisas (`Authorize`, `Login`, `Token`, `JWKS`) en layout con `flex-wrap` para evitar scroll horizontal en pantallas estrechas. El endpoint activo muestra método HTTP, requisito de auth/sesión y alterna en tabs entre `Request` y `Response`: `Request` muestra tablas de campos por canal (`queryParams` y/o `requestBody`) más ejemplos (query string para `queryParams`, JSON para `requestBody`), mientras `Response` muestra formato, tabla de campos y ejemplos JSON. Cada bloque usa una lista `examples[]` para soportar variantes excluyentes del mismo endpoint (por ejemplo, `authorization_code` y `refresh_token` en `/oauth2/token`).

**Integración:** se registra en `App.tsx` bajo la ruta pública `/developers`, reutiliza `AppFooter` para mantener consistencia visual con el resto del acceso público, es enlazada desde `src/pages/landing/DevelopersSection.tsx` y al volver al landing navega con `state={{ scrollToTop: true }}` para resetear la posición vertical de la home.

**Actualizacion relevante:** `AppFooter` consume i18n para el copyright y el indicador de estado (`common.allRightsReserved`, `common.allSystemsOperational`), evitando textos fijos en espanol cuando el idioma activo es ingles.

**Decisión de diseño:** se implementó como página pública separada, no como una subsección adicional del landing, para permitir un contenido más profundo, navegable por anclas y con snippets de código sin sobrecargar la home de marketing.

**Estrategia:** documentación embebida en la SPA pública. El contenido es framework-agnóstico y describe el contrato HTTP real del backend en lugar de exponer helpers internos del proyecto.

**Puntos de mejora / deuda técnica conocida:** la guía describe el patrón de login central soportado por el backend, pero la pantalla pública de login actual sigue parametrizada al tenant y client configurados por defecto; si se quiere ofrecer hosted login multi-tenant real desde esta misma SPA, habrá que aceptar parámetros dinámicos en la ruta de login.

---

## 11. Cómo extender el proyecto

### Añadir una nueva página de admin

1. Crear `src/pages/admin/MiPagina.tsx` con `export default MiPagina`.
2. Añadir la ruta en `src/App.tsx` dentro del bloque `/dashboard` y protegida por `RoleGuard` de admin:
   ```tsx
  <Route element={<RoleGuard roles={['ADMIN']} redirectTo="/dashboard" />}>
    <Route path="mi-ruta" element={<MiPagina />} />
  </Route>
   ```
3. Añadir item en `SIDEBAR_BY_ROLE.ADMIN` dentro de `src/layouts/AdminLayout.tsx`.
4. Si necesita datos: crear función en `src/api/` y los tipos en `src/types/`.
5. Actualizar `docs/FUNCTIONAL_GUIDE.md` y este archivo.

### Añadir el área ADMIN_TENANT

1. Crear la página en `src/pages/dashboard/`.
2. Añadir la ruta bajo `/dashboard`.
3. Registrar el item de menu en `SIDEBAR_BY_ROLE.ADMIN_TENANT` dentro de `src/layouts/AdminLayout.tsx`.
4. Si la ruta debe ser exclusiva, envolver con `RoleGuard roles={['ADMIN_TENANT']}`.
5. Ejemplo:
   ```tsx
  <Route element={<RoleGuard roles={['ADMIN_TENANT']} redirectTo="/dashboard" />}>
    <Route path="tenant-report" element={<TenantReportPage />} />
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

### Cobertura actual de errores API

- `src/api/errorNormalizer.test.ts`: valida normalizacion de `ErrorResponse`, errores de red, retryabilidad y helpers (`isAppApiError`, `getAppApiError`).
- `src/api/response.test.ts`: valida `unwrapResponseData` en path feliz y en errores con fallback/mensajes de backend.

---

## 12. Deuda técnica consolidada

| # | Ubicación | Descripción | Prioridad |
|---|-----------|-------------|-----------|
| 1 | `src/auth/tokenStore.ts` + `refresh.ts` | `SESSION_KEY = 'kg_rt'` duplicado | Baja |
| 2 | `src/auth/jwksVerify.ts` | No se valida el `issuer` en `jwtVerify` | **Alta** (seguridad) |
| 3 | `src/auth/pkce.ts` | `state` generado pero nunca validado | Media (solo si se migra a redirect) |
| 4 | `src/auth/refresh.ts` | Sin timer de refresh proactivo al 80% del TTL | Media |
| 5 | `src/auth/roleGuard.tsx` | Redirige a `/login` en vez de `/403` para rol incorrecto | Baja |
| 6 | `src/api/client.ts` | Falta política de refresh/retry para 401 en uso activo (ya existe normalización de errores) | Media |
| 7 | `src/api/client.ts` | Sin timeout global en Axios | Baja |
| 8 | `src/api/` | Falta expandir tests de error a integracion con MSW (mocks de endpoints y mapeo UI por `code`) | Media |
| 9 | `src/api/contracts.ts` | Módulo legado (mock) — `PlanId` migrado a `plans.ts`. Pendiente eliminar si no hay más dependientes | Baja |
| 10 | `src/hooks/useRateLimit.ts` | `setInterval` no se limpia en unmount | Baja |
| 11 | `src/styles/index.css` | Fuente `Inter` no importada explícitamente | Baja |
| 12 | `src/main.tsx` | `QueryClient` sin configuración global (staleTime, retry) | Baja |
| 13 | `src/pages/dashboard/tenant/*` + `src/pages/dashboard/user/*` | Modulos reales para ADMIN_TENANT y USER_TENANT implementados; faltan: endpoint de sesiones por dispositivo, auditoria de actividad dedicada, editar usuario, desactivar app, editar roles membership, filtros avanzados | Media |
| 14 | `src/App.tsx` | Sin página 404 (catch-all va a `/login`) | Baja |
| 15 | `src/pages/admin/DashboardPage.tsx` | Selector de rango (Hoy/7d/30d) es solo estado visual — no se envía al backend | Baja |
| 16 | `src/pages/landing/LandingNav.tsx` | Sin menú de navegación en móvil | Baja |
| 17 | `src/layouts/AdminLayout.tsx` | Buscador, notificaciones, Mi perfil y Configuración son decorativos | Media |
| 18 | Proyecto general | Sin infraestructura de tests (Vitest, Testing Library, MSW) | **Alta** |
| 19 | `tsconfig.json` | `moduleResolution: "Node"` es el modo legacy | Baja |
| 20 | `src/components/DevConsole/DevConsole.tsx` | Drag-to-resize no soporta touch (sin `touchmove`/`touchend`) | Baja |
| 21 | `src/lib/devConsole/` | Comandos hardcoded en español; no conectados al sistema i18n | Baja |
| 22 | `src/lib/devConsole/store.ts` | Log HTTP en memoria; se pierde al recargar la página | Baja |

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
