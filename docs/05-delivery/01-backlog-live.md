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
7. [♿ Backlog de accesibilidad](#-backlog-de-accesibilidad)
8. [✅ Completados](#-completados)

---

## 🚧 En desarrollo

> Ítems que están siendo implementados o en revisión activa.

### [COMPLETADO] Página de nuevo contrato (`/subscribe`) — F-NEW-001

- **Archivos:** `src/pages/register/NewContractPage.tsx`, `src/api/billing.ts`, `src/types/billing.ts`, `src/pages/register/steps/` (PlanStep, ContractorStep, TermsStep, EmailVerificationStep, PaymentStep, SuccessStep)
- **Estado:** ✅ Implementado. Flujo completo de 5 pasos conectado al backend de billing (catálogo, createContract, verifyEmail, mockApprovePayment, activateContract). Soporta B2B (empresa) y B2C (personal).
- **Deuda pendiente:** Integración PSP real para el paso de pago (actualmente solo mock DEV). Ver [Pendientes de backend](#-endpoints-pendientes-de-backend).
- **Fecha completado:** 2026-07-08

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

## [MEJORA] Sincronización de idioma por perfil backend (fase 2 i18n)

- **Detectado en:** `src/pages/dashboard/account/AccountSettingsPage.tsx` (selector local) y `src/i18n/useLocale.ts` (persistencia localStorage)
- **Descripción:** Actualmente la preferencia de idioma se guarda solo en navegador. Implementar persistencia server-side usando `profile.locale` para mantener idioma entre dispositivos y sesiones cruzadas.
- **Prioridad sugerida:** Media
- **Fecha:** 2026-04-02

### [FEATURE] Endpoint de sesiones y actividad para USER_TENANT

- **Detectado en:** `src/pages/dashboard/user/UserSessionsPage.tsx`, `src/pages/dashboard/user/UserActivityPage.tsx`
- **Descripción:** Actualmente la vista de sesiones y actividad de usuario se construye con metadata local de JWT + memberships. Se requiere endpoint backend dedicado para listar sesiones por dispositivo/IP, cierres de sesion remotos y eventos de auditoria por usuario final.
- **Prioridad:** 🟡 Media
- **Fecha detección:** 2026-04-02

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

### [MEJORA] Botón "Enviar reporte" para errores de servidor (SERVER_PROCESSING)

- **Detectado en:** conversación de diseño de manejo de errores 2026-04-05
- **Descripción:** Cuando ocurre un error `SERVER_PROCESSING` o 5xx, el DevConsole ya registra `trace_id`, `exception`, `detail` y el `clientMessage` correcto. El siguiente paso natural es ofrecer al usuario un botón "Enviar reporte" que envíe ese paquete diagnóstico al backend (o al menos lo copie al portapapeles como soporte de texto).
- **Requisitos previos:**
  1. Endpoint backend `POST /api/v1/error-reports` (pendiente de diseño con el equipo).
  2. Definir política de rate-limit y almacenamiento en backend.
  3. Decidir si el botón aparece en un toast expandible, en el DevConsole, o en un modal ad-hoc.
- **Alternativa inmediata disponible:** el DevConsole ya muestra los detalles con comando `detail <N>`. Se puede usar copiar texto hasta tener el endpoint.
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-04-05

### [MEJORA] Diseño formal de manejo de errores controlados vs. descontrolados

- **Detectado en:** conversación de diseño de manejo de errores 2026-04-05
- **Descripción:** Definir y documentar la estrategia completa para:
  - **Controlados** (`CLIENT_REQUEST`, `BUSINESS_RULE`): mostrar `clientMessage` en toast o inline; no loguear detalles técnicos al DevConsole.
  - **Descontrolados** (`SERVER_PROCESSING`, red, timeout): mostrar `clientMessage` al usuario + loguear `trace_id`, `exception`, `detail`, `layer` al DevConsole (ya implementado). Eventual botón de reporte.
  - **Unhandled** (crash de React → `AppErrorBoundary`): ya tiene su propio flujo.
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-04-05

### [MEJORA] Extender `AccessDeniedState` a módulos restantes con `useQuery`

- **Detectado en:** `src/features/ops/tenants/TenantsPage.tsx`, `src/features/console/dashboard/FeaturePlaceholderPage.tsx`, listados administrativos con estados `isError`
- **Descripción:** El patrón robusto para `403 FORBIDDEN` quedó implementado como piloto en tenants, con helpers en `errorNormalizer.ts` y estado visual reusable `AccessDeniedState.tsx`. Falta converger el resto de pantallas de consulta para que distingan acceso denegado vs. error técnico genérico.
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-04-14

### [MEJORA] Telemetría de crashes desde AppErrorBoundary

- **Detectado en:** `src/components/AppErrorBoundary.tsx`, `src/App.tsx`
- **Descripción:** Cuando ocurra un crash de render, enviar un evento al backend con contexto mínimo para observabilidad (mensaje, `componentStack`, ruta actual, timestamp, `userAgent`, rol activo y tenant si existe), almacenarlo y exponerlo en un panel de monitoreo para soporte y diagnóstico.
- **Requisitos sugeridos:** endpoint dedicado con rate-limit, sanitización de datos sensibles, correlación por `supportCode` y vista paginada/filtrable en dashboard admin.
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-04-04

### [MEJORA] Optimización de bundle/chunks en build de producción

- **Detectado en:** `npm run build` (warning Vite/Rollup por chunks > 500 kB)
- **Descripción:** Implementar code-splitting por ruta o por módulo (dynamic `import()` + `manualChunks`) para reducir tamaño de chunks principales y mejorar tiempo de carga inicial.
- **Evidencia reciente:** `dist/assets/index-*.js` ~1.8 MB (gzip ~563 kB).
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-04-02

### [MEJORA] Reevaluar migración a librería de iconos (`lucide-react`)

- **Detectado en:** `src/components/icons/definitions.tsx`, `src/components/icons/index.ts`
- **Descripción:** La fase de centralización de iconografía SVG ya está implementada y operativa. Mantener este enfoque por ahora y reevaluar migración a librería externa solo si aporta beneficios medibles.
- **Estado actual:** Postergado por decisión técnica (2026-04-02).
- **Criterios de reapertura:**
  1. Reducción comprobable de mantenimiento en nuevos features.
  2. Impacto positivo en bundle y tree-shaking.
  3. Paridad visual/accesible sin regresiones en tabs, cards y mensajes de estado.
- **Prioridad:** 🔵 Baja
- **Fecha detección:** 2026-04-02

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
  };
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

### [REFACTOR] Consolidar SVG inline residuales al catálogo central

- **Detectado en:** `src/pages/login/LoginPage.tsx`, `src/pages/register/**`, `src/pages/admin/**`, `src/components/PolicyModal.tsx`, `src/components/PlanCard.tsx`, `src/components/AppFooter.tsx`
- **Descripción:** Tras la centralización principal de iconografía en `src/components/icons/`, persisten SVG inline en pantallas legacy y estados transitorios. Mantener los spinners inline es aceptable; el resto de iconos de contexto debe migrarse gradualmente al catálogo central.
- **Prioridad:** 🔵 Baja
- **Fecha detección:** 2026-04-02

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

### [DEUDA TÉCNICA] Soporte backend pendiente para X-Idempotency-Key

- **Detectado en:** `src/api/billing.ts`, `src/api/auth.ts`, `src/pages/register/NewContractPage.tsx`, `src/pages/login/LoginPage.tsx`
- **Descripción:** El frontend ya envía `X-Idempotency-Key` en operaciones POST críticas, pero el backend todavía no aplica deduplicación transaccional basada en esa clave. Mientras no exista soporte efectivo, no es seguro habilitar reintentos automáticos en POST.
- **Impacto actual:**
  - Reintentos automáticos se limitan a GET idempotentes.
  - En POST críticos se usa timeout + mensaje al usuario + reintento manual.
- **Criterios de cierre en backend:**
  - Persistencia de clave de idempotencia por operación.
  - Ventana de deduplicación definida.
  - Mismo resultado para solicitudes repetidas con misma clave.
  - Documentación oficial del contrato (OpenAPI/guía backend).
- **Prioridad:** 🟠 Media-Alta
- **Fecha detección:** 2026-04-02

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

| #   | Feature                                   | Método   | Endpoint                                          | Ticket    | Bloqueante para                                       |
| --- | ----------------------------------------- | -------- | ------------------------------------------------- | --------- | ----------------------------------------------------- |
| 1   | ~~Endpoint público de auto-contratación~~ | ~~POST~~ | ~~`/api/v1/public/contracts`~~                    | F-NEW-001 | ✅ Implementado — billing API en `src/api/billing.ts` |
| 1b  | Integración PSP real (pago)               | POST     | `/billing/contracts/{id}/pay` (pendiente definir) | —         | `PaymentStep` — actualmente usa mock DEV              |
| 2   | Listar tenants                            | GET      | `/api/v1/tenants`                                 | F-033     | `admin/TenantsPage`                                   |
| 3   | Reactivar tenant                          | PUT      | `/api/v1/tenants/{slug}/activate`                 | —         | `admin/TenantDetailPage`                              |
| 4   | Auditoría global de plataforma            | GET      | `/api/v1/platform/audit`                          | F-034     | `admin/DashboardPage`                                 |
| 5   | Olvidé mi contraseña                      | POST     | `/api/v1/tenants/keygo/account/forgot-password`   | F-030     | `shared/ForgotPasswordPage`                           |
| 6   | Reset de contraseña                       | POST     | `/api/v1/tenants/keygo/account/reset-password`    | F-030     | `shared/ForgotPasswordPage`                           |
| 7   | Cambiar contraseña                        | POST     | `/api/v1/tenants/keygo/account/change-password`   | F-030     | `shared/ChangePasswordPage`                           |
| 8   | Mis sesiones activas                      | GET      | `/api/v1/tenants/keygo/account/sessions`          | T-037     | `shared/SessionsPage`                                 |
| 9   | Cerrar sesión remota                      | DELETE   | `/api/v1/tenants/keygo/account/sessions/{id}`     | T-037     | `shared/SessionsPage`                                 |
| 10  | Editar rol de ClientApp                   | PUT      | `/api/v1/tenants/{slug}/apps/{id}/roles/{roleId}` | —         | `tenant-admin/AppsPage`                               |
| 11  | Eliminar rol de ClientApp                 | DELETE   | `/api/v1/tenants/{slug}/apps/{id}/roles/{roleId}` | —         | `tenant-admin/AppsPage`                               |
| 12  | Asignar roles a membership                | POST     | `/api/v1/tenants/{slug}/memberships/{id}/roles`   | —         | `tenant-admin/MembershipsPage`                        |
| 13  | Suspender usuario                         | PUT      | `/api/v1/tenants/{slug}/users/{userId}/suspend`   | T-033     | `tenant-admin/UsersPage`                              |
| 14  | Activar usuario                           | PUT      | `/api/v1/tenants/{slug}/users/{userId}/activate`  | T-033     | `tenant-admin/UsersPage`                              |
| 15  | Sesiones de usuario (admin)               | GET      | `/api/v1/tenants/{slug}/users/{userId}/sessions`  | T-037     | `tenant-admin/UsersPage`                              |

---

## ♿ Backlog de accesibilidad

> Items derivados de la política [`docs/ACCESSIBILITY-CHILE.md`](./ACCESSIBILITY-CHILE.md) (WCAG 2.2 AA, Ley N° 20.422).  
> Incorporación paulatina: todo componente **nuevo o modificado** debe cumplir las reglas. No se exige auditoría retroactiva en un solo PR.

### [ACCESIBILIDAD] Skip-to-content link global

- **Detectado en:** `src/layouts/` / `index.html` — ausente en toda la aplicación
- **Descripción:** Añadir un enlace "Saltar al contenido principal" visible al recibir foco, apuntando a `<main id="main-content">`. Es un requisito básico de navegación por teclado (WCAG 2.4.1).
- **Afecta:** `AdminLayout.tsx` y cualquier layout que se implemente.
- **Prioridad:** 🟡 Media-Alta
- **Fecha detección:** 2026-03-30

### [ACCESIBILIDAD] Foco visible consistente en toda la app

- **Detectado en:** `src/styles/index.css` — revisar si se elimina el outline por defecto sin reemplazo
- **Descripción:** Asegurar que todos los elementos interactivos tienen `focus-visible:ring` o equivalente visual claro. Prohibido `outline: none` sin alternativa (WCAG 2.4.7).
- **Acción:** Auditar el CSS global y los componentes shadcn/ui personalizados.
- **Prioridad:** 🟡 Media-Alta
- **Fecha detección:** 2026-03-30

### [ACCESIBILIDAD] PolicyModal — trampa de foco y cierre por Escape

- **Detectado en:** `src/components/PolicyModal.tsx`
- **Descripción:** Verificar que el modal usa el componente `<Dialog>` de shadcn/ui (que gestiona foco y `Escape` automáticamente) o implementar manejo manual de foco. Sin trampa de foco, los usuarios de teclado/lector de pantalla quedan fuera del modal (WCAG 2.1.2).
- **Prioridad:** 🟡 Media-Alta
- **Fecha detección:** 2026-03-30

### [ACCESIBILIDAD] Formulario de login — labels, errores y autofill

- **Detectado en:** `src/pages/login/LoginPage.tsx`
- **Descripción:**
  - Verificar que todos los inputs tienen `<label>` asociado (no solo `placeholder`).
  - Errores de autenticación deben anunciarse con `role="alert"` y no solo con color.
  - Añadir `autocomplete="username"` / `autocomplete="current-password"` para compatibilidad con gestores de contraseñas.
- **Norma:** WCAG 1.3.5, 3.3.1, 3.3.2
- **Prioridad:** 🟡 Media-Alta
- **Fecha detección:** 2026-03-30

### [ACCESIBILIDAD] Formulario de registro multistep — accesibilidad por paso

- **Detectado en:** `src/pages/register/steps/` (ContractorStep, PlanStep, TermsStep, PaymentStep…)
- **Descripción:**
  - Cada paso debe anunciar su título al cambiar (puede usarse `aria-live` o mover el foco al heading del paso).
  - Los inputs deben tener labels explícitos y errores asociados con `aria-describedby`.
  - El indicador de progreso debe ser perceptible sin depender solo de color.
- **Norma:** WCAG 1.3.1, 3.3.1, 4.1.3
- **Prioridad:** 🟡 Media
- **Fecha detección:** 2026-03-30

### [ACCESIBILIDAD] LandingNav — menú mobile accesible

- **Detectado en:** `src/pages/landing/LandingNav.tsx` — menú `hidden md:flex` sin hamburger alternativo
- **Descripción:** Implementar menú desplegable accesible para `< md`: botón hamburger con `aria-expanded`, `aria-controls`, cierre con `Escape` y trampa de foco opcional. Relacionado con la mejora UX ya registrada.
- **Norma:** WCAG 2.1.1, 4.1.2
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-03-30

### [ACCESIBILIDAD] Turnstile CAPTCHA — opción alternativa accesible

- **Detectado en:** `src/components/TurnstileWidget.tsx`
- **Descripción:** El CAPTCHA visual puede bloquear usuarios con discapacidad visual. Verificar que Cloudflare Turnstile ofrece el modo "challenge" accesible o que existe un flujo alternativo. Si no hay alternativa, documentar como limitación conocida.
- **Norma:** WCAG 1.1.1; sección 5.8 de ACCESSIBILITY-CHILE.md
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-03-30

### [ACCESIBILIDAD] Dashboard admin — tablas y gráficos con alternativas textuales

- **Detectado en:** `src/pages/admin/dashboard/` (IamCoreRow, SecurityRow, RankingsRow…)
- **Descripción:** Los componentes de dashboard que muestran datos numéricos o gráficos deben:
  - Usar `<table>` con `<caption>` y `<th scope>` para datos tabulares.
  - Proveer alternativa textual o `aria-label` en gráficos.
  - Anunciar actualizaciones en tiempo real con `aria-live="polite"`.
- **Norma:** WCAG 1.1.1, 1.3.1
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-03-30

### [ACCESIBILIDAD] Integrar eslint-plugin-jsx-a11y

- **Detectado en:** Todo el proyecto — sin análisis estático de accesibilidad
- **Descripción:** Instalar `eslint-plugin-jsx-a11y` junto con los plugins de ESLint pendientes (ver deuda técnica). Activar reglas recomendadas para detectar automáticamente violaciones de accesibilidad en cada commit.
- **Dependencia:** Requiere resolver primero `[DEUDA] ESLint plugin faltante`.
- **Prioridad:** 🔵 Media
- **Fecha detección:** 2026-03-30

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
