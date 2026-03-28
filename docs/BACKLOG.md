# Backlog — KeyGo UI

Registro de features, mejoras, items en desarrollo y deuda técnica detectados durante el desarrollo.
Actualizado automáticamente por el agente al final de cada implementación.

> **No implementar sin validación explícita del equipo.**  
> Para solicitar un ítem, mencionarlo en el chat o crear una tarea formal.  
> Los ítems marcados con ⚠️ son bloqueantes para producción.

---

## Índice

1. [🚧 En desarrollo](#-en-desarrollo)
2. [🔴 Features críticas por implementar](#-features-críticas-por-implementar)
3. [🟡 Features planificadas](#-features-planificadas)
4. [🔵 Mejoras y refactorizaciones](#-mejoras-y-refactorizaciones)
5. [🟠 Deuda técnica](#-deuda-técnica)
6. [⏳ Endpoints pendientes de backend](#-endpoints-pendientes-de-backend)
7. [✅ Completados](#-completados)

---

## 🚧 En desarrollo

> Ítems que están siendo implementados o en revisión activa.

### [EN DESARROLLO] Página de nuevo contrato (`/contratar`) — F-NEW-001
- **Archivos:** `src/pages/register/NewContractPage.tsx`, `src/api/contracts.ts`
- **Estado:** UI implementada (3 pasos: plan → datos → condiciones). Mock simulado activo.
- **Pendiente:** Conectar al endpoint real `POST /api/v1/public/contracts` cuando esté disponible en backend. Ver sección [Endpoints pendientes](#-endpoints-pendientes-de-backend).
- **Fecha inicio:** 2026-03-26

---

## 🔴 Features críticas por implementar

> Bloqueantes para el uso real de la aplicación. ⚠️ Prioridad alta.

### [FEATURE] ⚠️ AuthGuard y RoleGuard para rutas protegidas
- **Detectado en:** `src/App.tsx` — rutas sin protección
- **Descripción:** Implementar `src/auth/roleGuard.tsx` con `<AuthGuard>` (requiere token válido) y `<RoleGuard roles={[…]}>` (valida claim `roles` del JWT). Sin esto, cualquier usuario puede acceder a cualquier ruta.
- **Referencias:** `src/types/roles.ts`, `src/auth/tokenStore.ts`
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-25

### [FEATURE] ⚠️ Silent refresh automático
- **Detectado en:** `src/auth/tokenStore.ts` — sin renovación automática
- **Descripción:** Implementar `src/auth/refresh.ts`: al cargar accessToken, calcular el 80% del TTL (claim `exp`) y programar `POST /oauth2/token` con `grant_type=refresh_token` antes de que expire. Si falla, hacer logout automático.
- **Endpoint backend:** `POST /api/v1/oauth2/token` ✅ Disponible
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-25

### [FEATURE] ⚠️ Logout con revocación de token
- **Detectado en:** `src/auth/tokenStore.ts` — `clearTokens()` existe pero sin revocación
- **Descripción:** Implementar `src/auth/logout.ts`: `POST /oauth2/revoke` con el `refresh_token`, limpiar el store con `clearTokens()` y redirigir a `/login`. Sin esto, los tokens robados siguen siendo válidos hasta expiración.
- **Endpoint backend:** `POST /api/v1/oauth2/revoke` ✅ Disponible
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-25

### [FEATURE] ⚠️ Interceptor Bearer en apiClient
- **Detectado en:** `src/api/client.ts` — instancia Axios sin interceptores
- **Descripción:** El `apiClient` no inyecta `Authorization: Bearer <accessToken>` en cada petición. Todas las llamadas a endpoints protegidos fallarán con 401. Implementar el interceptor de request que lea el token del `useTokenStore` y el interceptor de response que detecte 401 y dispare el refresh.
- **Archivos afectados:** `src/api/client.ts` o nuevo `src/api/interceptors.ts`
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-25

### [FEATURE] ⚠️ Callback OAuth2 (`/callback`) — intercambio de code por token
- **Detectado en:** `src/App.tsx` — ruta `/callback` no existe
- **Descripción:** Implementar `src/pages/login/CallbackPage.tsx`. Recibe `?code=&state=` del servidor de autorización, valida el `state` contra sessionStorage, llama `POST /oauth2/token` con `grant_type=authorization_code` + PKCE verifier, verifica el `id_token` con JWKS, extrae roles y redirige al dashboard correspondiente.
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-26

### [FEATURE] ⚠️ Módulos de API por dominio
- **Detectado en:** `src/api/` — solo existen `client.ts`, `auth.ts` y `contracts.ts`
- **Descripción:** Faltan los módulos de dominio requeridos por el guide. Sin ellos, ninguna página de datos puede funcionar:
  - `src/api/tenants.ts` — CRUD de tenants (ADMIN)
  - `src/api/clientApps.ts` — CRUD de ClientApps (ADMIN_TENANT)
  - `src/api/users.ts` — gestión de usuarios (ADMIN_TENANT)
  - `src/api/memberships.ts` — memberships y roles (ADMIN_TENANT)
  - `src/api/userinfo.ts` — GET /userinfo (todos los roles)
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-26

### [FEATURE] ⚠️ Tipos TypeScript faltantes
- **Detectado en:** `src/types/` — solo existen `base.ts`, `auth.ts`, `roles.ts`
- **Descripción:** Faltan los DTOs necesarios para tipar las respuestas de los módulos de API:
  - `src/types/tenant.ts` — `TenantData`, `CreateTenantRequest`
  - `src/types/clientapp.ts` — `ClientAppData`, `CreateClientAppRequest`
  - `src/types/user.ts` — `TenantUserData`, `CreateUserRequest`
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-26

### [FEATURE] ⚠️ Layouts por rol
- **Detectado en:** `src/` — directorio `layouts/` no existe
- **Descripción:** Sin los layouts, las páginas por rol no tienen shell de navegación ni contexto compartido:
  - `src/layouts/RootLayout.tsx` — topbar y sidebar adaptativo
  - `src/layouts/AdminLayout.tsx` — extiende RootLayout para ADMIN
  - `src/layouts/TenantAdminLayout.tsx` — provee contexto del tenant gestionado
  - `src/layouts/UserLayout.tsx` — layout mínimo para USER_TENANT
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-26

### [FEATURE] ⚠️ Páginas por rol — ADMIN
- **Detectado en:** `src/pages/` — directorio `admin/` no existe
- **Páginas a crear:**
  - `admin/DashboardPage.tsx` — panel con `GET /service/info` ✅
  - `admin/TenantsPage.tsx` — listar tenants ⏳ F-033
  - `admin/CreateTenantPage.tsx` — formulario `POST /api/v1/tenants` ✅
  - `admin/TenantDetailPage.tsx` — vista + suspender tenant ✅
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-26

### [FEATURE] ⚠️ Páginas por rol — ADMIN_TENANT
- **Detectado en:** `src/pages/` — directorio `tenant-admin/` no existe
- **Páginas a crear:**
  - `tenant-admin/DashboardPage.tsx`
  - `tenant-admin/AppsPage.tsx` — ClientApps ✅
  - `tenant-admin/UsersPage.tsx` — usuarios del tenant ✅
  - `tenant-admin/MembershipsPage.tsx` — memberships ✅
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-26

### [FEATURE] ⚠️ Páginas compartidas y de usuario
- **Detectado en:** `src/pages/` — directorios `user/` y `shared/` no existen
- **Páginas a crear:**
  - `user/DashboardPage.tsx` — panel USER_TENANT
  - `shared/ProfilePage.tsx` — perfil (`GET /userinfo`) ✅
  - `shared/ChangePasswordPage.tsx` — ⏳ F-030
  - `shared/SessionsPage.tsx` — ⏳ T-037
- **Prioridad:** 🔴 Alta
- **Fecha detección:** 2026-03-26

---

## 🟡 Features planificadas

> Features completas que están en el roadmap pero no son bloqueantes inmediatas.

### [FEATURE] Registro de usuario con verificación de email — flujo completo
- **Detectado en:** `src/pages/login/LoginPage.tsx` (link a `/register`)
- **Descripción:** Implementar el flujo de auto-registro en 3 pantallas:
  1. `register/RegisterPage.tsx` — formulario de registro, `POST /api/v1/tenants/keygo/apps/keygo-ui/register` ✅
  2. `register/VerifyEmailPage.tsx` — código OTP, `POST /api/v1/.../verify-email` ✅
  3. `register/ResendPage.tsx` — reenvío si expiró, `POST /api/v1/.../resend-verification` ✅
- **Nota:** `NewContractPage.tsx` es el flujo de contratación (nuevo tenant), distinto al auto-registro de usuario final.
- **Prioridad:** 🟡 Media-Alta
- **Fecha detección:** 2026-03-25

### [FEATURE] Hooks reutilizables de datos — directorio `src/hooks/`
- **Detectado en:** `src/` — directorio `hooks/` no existe
- **Descripción:** Extraer lógica compartida a hooks:
  - `useCurrentUser.ts` — combina `idToken` del store con `GET /userinfo`
  - `useHasRole.ts` — comprueba si el JWT incluye un rol concreto
  - `useManagedTenant.ts` — extrae el slug del tenant del claim `tenant_slug` o `iss`
- **Prioridad:** 🟡 Media-Alta
- **Fecha detección:** 2026-03-26

### [FEATURE] Componentes reutilizables — directorio `src/components/`
- **Detectado en:** `src/` — directorio `components/` no existe
- **Descripción:**
  - `PendingFeatureBadge.tsx` — badge "Próximamente" para features sin backend
  - `BaseResponseHandler.tsx` — manejo centralizado de `BaseResponse<T>` (loading/error/data)
  - `RoleAwareNav.tsx` — sidebar/menú que adapta ítems según el rol del JWT
  - `SecretRevealModal.tsx` — muestra `clientSecret` una única vez con confirmación
- **Prioridad:** 🟡 Media
- **Fecha detección:** 2026-03-26

### [FEATURE] Archivo `src/router.tsx` centralizado
- **Detectado en:** `src/App.tsx` — rutas definidas directamente en el componente raíz
- **Descripción:** Extraer la definición de rutas a `src/router.tsx` con la estructura anidada por layout y rol, incluyendo `<AuthGuard>` y `<RoleGuard>` según el guide. Simplifica el árbol de componentes y facilita la expansión.
- **Prioridad:** 🟡 Media
- **Fecha detección:** 2026-03-26

### [FEATURE] Variables de entorno — `.env.example`
- **Detectado en:** raíz del proyecto — no existe ningún `.env*`
- **Descripción:** Crear `.env.example` con las variables requeridas para que nuevos desarrolladores puedan arrancar el proyecto sin investigar el código fuente:
  ```
  VITE_KEYGO_BASE=http://localhost:8080/keygo-server
  VITE_TENANT_SLUG=keygo
  VITE_CLIENT_ID=keygo-ui
  VITE_REDIRECT_URI=http://localhost:5173/callback
  ```
- **Prioridad:** 🟡 Media
- **Fecha detección:** 2026-03-26

### [FEATURE] Olvidé mi contraseña — ⏳ F-030
- **Detectado en:** `src/pages/login/LoginPage.tsx`
- **Descripción:** Implementar páginas de recuperación de contraseña cuando el backend implemente los endpoints:
  - `POST /api/v1/tenants/keygo/account/forgot-password`
  - `POST /api/v1/tenants/keygo/account/reset-password`
- **Estado actual:** Mostrar link en `/login` con redirección a "Próximamente".
- **Prioridad:** 🟡 Media
- **Fecha detección:** 2026-03-25

---

## 🔵 Mejoras y refactorizaciones

> No bloquean funcionalidad actual pero mejoran mantenibilidad, DX o UX.

### [MEJORA] Instalar y configurar shadcn/ui
- **Detectado en:** `src/pages/login/LoginPage.tsx`, `src/pages/register/`
- **Descripción:** Los componentes de formulario usan Tailwind puro con clases repetidas. Instalar shadcn/ui (`Button`, `Input`, `Label`, `Card`, `Select`, `Checkbox`) para consistencia con el sistema de diseño definido en las instrucciones. Migrar login y pasos del contrato.
- **Impacto:** Reducción de clases duplicadas, accesibilidad mejorada, coherencia visual.
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-03-25

### [MEJORA] Instalar MSW y crear mocks de desarrollo
- **Detectado en:** `src/api/contracts.ts` — mock hecho con `setTimeout`
- **Descripción:** Instalar `msw` como devDependency. Crear `src/mocks/handlers.ts` con handlers para todos los endpoints ⏳ pendientes (ver sección correspondiente). Activar en `src/main.tsx` solo cuando `import.meta.env.DEV`. Reemplazar el mock de `contracts.ts`.
- **Impacto:** Desarrollo desacoplado del backend, tests de integración realistas.
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-03-26

### [MEJORA] Constantes de query keys centralizadas
- **Detectado en:** No hay queries aún, pero prevenirlo desde el inicio
- **Descripción:** Crear `src/api/queryKeys.ts` exportando un objeto con todas las keys de TanStack Query antes de que se dispersen como strings sueltos por el código.
  ```ts
  export const QUERY_KEYS = {
    tenants: ['tenants'] as const,
    tenant: (slug: string) => ['tenants', slug] as const,
    users: (slug: string) => ['users', slug] as const,
    // …
  }
  ```
- **Prioridad:** 🔵 Baja-Media
- **Fecha detección:** 2026-03-26

### [MEJORA] Extraer formularios de login a componentes separados
- **Detectado en:** `src/pages/login/LoginPage.tsx` — ~400 líneas en un solo archivo
- **Descripción:** El archivo mezcla helpers, sub-componentes y lógica de negocio. Candidatos a extraer: `InitLoadingState`, `InitErrorState`, `LoginForm` → carpeta `src/pages/login/components/`.
- **Prioridad:** 🔵 Baja
- **Fecha detección:** 2026-03-26

### [MEJORA] Navegación mobile en LandingPage
- **Detectado en:** `src/pages/landing/LandingNav.tsx` — menú `hidden md:flex`
- **Descripción:** El menú de la landing está oculto en pantallas pequeñas sin alternativa móvil (hamburger menu). Implementar menú desplegable accesible para `< md`.
- **Prioridad:** 🔵 Baja
- **Fecha detección:** 2026-03-26

---

## 🟠 Deuda técnica

> Problemas existentes que reducen la calidad del código o la mantenibilidad.

### [DEUDA] ⚠️ Testing completamente ausente
- **Detectado en:** Todo el proyecto
- **Descripción:** No existe ningún archivo de test (`*.test.ts`, `*.spec.tsx`), ni configuración de Vitest (`vitest.config.ts`), ni Testing Library, ni MSW instalado. El proyecto no puede ejecutar `npm test`. Riesgo alto ante refactorizaciones o cambios de backend.
- **Acciones:**
  1. Instalar: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw`, `jsdom`
  2. Crear `vitest.config.ts` con entorno `jsdom`
  3. Tests mínimos: `pkce.ts`, `tokenStore.ts`, `LoginPage.tsx` (render), `NewContractPage.tsx` (flujo de pasos)
- **Prioridad:** 🟠 Alta
- **Fecha detección:** 2026-03-26

### [DEUDA] ⚠️ ESLint plugin faltante — lint no funciona
- **Detectado en:** `.eslintrc.cjs` referencia `eslint-plugin-react` no instalado
- **Descripción:** `npm run lint` falla con `ESLint couldn't find the plugin "eslint-plugin-react"`. El linter no puede ejecutarse, lo que permite que errores de estilo y posibles bugs pasen desapercibidos.
- **Acción:** `npm install eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser --save-dev`
- **Prioridad:** 🟠 Alta
- **Fecha detección:** 2026-03-26

### [DEUDA] ⚠️ `src/api/auth.ts` — verificar consistencia con convenciones
- **Detectado en:** `src/api/auth.ts` — archivo no definido en la estructura del guide
- **Descripción:** El archivo existe y es usado por `LoginPage.tsx`, pero no está documentado en `FRONTEND_DEVELOPER_GUIDE.md`. Verificar que sigue las convenciones de `BaseResponse<T>` y que sus funciones deserializan `.data` antes de devolver.
- **Prioridad:** 🟠 Media
- **Fecha detección:** 2026-03-26

### [DEUDA] Solo 3 de 6 tipos definidos en `src/types/`
- **Detectado en:** `src/types/` — faltan `tenant.ts`, `clientapp.ts`, `user.ts`
- **Descripción:** Los DTOs de dominio están parcialmente definidos. Cuando se implementen los módulos de API (`tenants.ts`, `clientApps.ts`, `users.ts`), habrá tentación de definir interfaces locales — hay que crearlos antes en `src/types/` para centralizar la fuente de verdad.
- **Prioridad:** 🟠 Media
- **Fecha detección:** 2026-03-26

### [DEUDA] Mock de contratos con `setTimeout` en código de producción
- **Detectado en:** `src/api/contracts.ts`
- **Descripción:** La función `submitContract` usa `setTimeout` para simular latencia. Este approach no usa MSW y no respeta el shape `BaseResponse<T>` de error. Reemplazar con un handler MSW real en cuanto se instale la librería.
- **Prioridad:** 🟠 Media
- **Fecha detección:** 2026-03-26

### [DEUDA] `src/pages/home/Home.tsx` — página huérfana sin ruta
- **Detectado en:** `src/pages/home/Home.tsx`
- **Descripción:** El archivo existe pero no está registrado en ninguna ruta de `App.tsx`. Evaluar si es un placeholder temporal o eliminarlo para evitar confusión.
- **Prioridad:** 🟠 Baja
- **Fecha detección:** 2026-03-26

---

## ⏳ Endpoints pendientes de backend

> Endpoints que el frontend necesita pero aún no están implementados en el servidor.  
> Mientras no estén disponibles, usar handlers MSW en `src/mocks/handlers.ts`.

| # | Feature | Método | Endpoint | Ticket | Bloqueante para |
|---|---|---|---|---|---|
| 1 | Endpoint público de auto-contratación | POST | `/api/v1/public/contracts` | F-NEW-001 | `NewContractPage` |
| 2 | Listar tenants | GET | `/api/v1/tenants` | F-033 | `admin/TenantsPage` |
| 3 | Reactivar tenant | PUT | `/api/v1/tenants/{slug}/activate` | — | `admin/TenantDetailPage` |
| 4 | Auditoría global de plataforma | GET | `/api/v1/platform/audit` | F-034 | `admin/DashboardPage` |
| 5 | Olvidé mi contraseña | POST | `/api/v1/tenants/keygo/account/forgot-password` | F-030 | `shared/ForgotPasswordPage` |
| 6 | Reset de contraseña | POST | `/api/v1/tenants/keygo/account/reset-password` | F-030 | `shared/ForgotPasswordPage` |
| 7 | Cambiar contraseña | POST | `/api/v1/tenants/keygo/account/change-password` | F-030 | `shared/ChangePasswordPage` |
| 8 | Mis sesiones activas | GET | `/api/v1/tenants/keygo/account/sessions` | T-037 | `shared/SessionsPage` |
| 9 | Cerrar sesión remota | DELETE | `/api/v1/tenants/keygo/account/sessions/{id}` | T-037 | `shared/SessionsPage` |
| 10 | Editar rol de ClientApp | PUT | `/api/v1/tenants/{slug}/apps/{id}/roles/{roleId}` | — | `tenant-admin/AppsPage` |
| 11 | Eliminar rol de ClientApp | DELETE | `/api/v1/tenants/{slug}/apps/{id}/roles/{roleId}` | — | `tenant-admin/AppsPage` |
| 12 | Asignar roles a membership | POST | `/api/v1/tenants/{slug}/memberships/{id}/roles` | — | `tenant-admin/MembershipsPage` |
| 13 | Suspender usuario | PUT | `/api/v1/tenants/{slug}/users/{userId}/suspend` | T-033 | `tenant-admin/UsersPage` |
| 14 | Activar usuario | PUT | `/api/v1/tenants/{slug}/users/{userId}/activate` | T-033 | `tenant-admin/UsersPage` |
| 15 | Sesiones de usuario (admin) | GET | `/api/v1/tenants/{slug}/users/{userId}/sessions` | T-037 | `tenant-admin/UsersPage` |

---

## ✅ Completados

<!-- Mover aquí los ítems cuando sean implementados, con fecha de cierre. -->

### [FEATURE] Defensa anti-bot en formularios públicos
- **Cerrado:** 2026-03-28
- **Archivos:** `src/hooks/useRateLimit.ts`, `src/hooks/useHoneypot.ts`, `src/hooks/useTurnstile.ts`, `src/components/HoneypotField.tsx`, `src/components/TurnstileWidget.tsx`
- **Integrado en:** `src/pages/login/LoginPage.tsx`, `src/pages/register/UserRegisterPage.tsx`, `src/pages/register/steps/TermsStep.tsx`, `src/pages/register/NewContractPage.tsx`
- **Mecanismos implementados:** honeypot trap, timing check (< 1.5s), rate limiting progresivo (3→30s / 5→5min / 10→30min), Cloudflare Turnstile CAPTCHA opcional (`VITE_TURNSTILE_SITE_KEY`)
- **Pendiente de producción:** Verificar el token Turnstile server-side en el backend

### [FEATURE] LoginPage con flujo OAuth2/PKCE completo
- **Cerrado:** 2026-03-25
- **Archivos:** `src/pages/login/LoginPage.tsx`, `src/api/auth.ts`, `src/auth/pkce.ts`, `src/auth/jwksVerify.ts`, `src/auth/tokenStore.ts`

### [FEATURE] Landing page pública (marketing)
- **Cerrado:** 2026-03-25
- **Archivos:** `src/pages/landing/` (LandingPage, LandingNav, HeroSection, FeaturesSection, HowItWorksSection, RolesSection, PricingSection, DevelopersSection, CTASection)

### [FEATURE] Página de nuevo contrato — UI (flujo 3 pasos)
- **Cerrado:** 2026-03-26
- **Archivos:** `src/pages/register/NewContractPage.tsx`, `src/pages/register/steps/` (PlanStep, ContractorStep, TermsStep, SuccessStep), `src/api/contracts.ts`
- **Pendiente:** Conectar con endpoint real cuando esté disponible (F-NEW-001)
