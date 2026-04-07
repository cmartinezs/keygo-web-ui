# 11 — Gaps y Dependencias: Lo que falta en Frontend y lo que se necesita del Backend

> Auditoría completa del estado actual del frontend vs. la arquitectura nueva.

---

## Resumen ejecutivo

El frontend actual fue diseñado para **un solo contexto de autenticación** (tenant `keygo`). La nueva arquitectura requiere **dos contextos** (platform + tenant) con roles, JWTs, endpoints y flujos independientes. Prácticamente **toda la capa de auth necesita refactor**, y el backend aún **no ha implementado los endpoints de plataforma**.

### Clasificación de gaps

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 Bloqueante backend (no hay endpoint) | 20 endpoints | Documentados en RFC, no implementados |
| 🟡 Refactor frontend (code existe pero es insuficiente) | 12 módulos | Diseñados para single-context |
| 🟢 Frontend-only (crear de cero) | 5 módulos nuevos | No existen aún |

---

## Parte 1 — Lo que necesito del backend

### 1.1 Endpoints de plataforma que NO existen en `api-docs.json`

Todos estos endpoints están documentados en el RFC (`08-api-gestion.md`) y en `FRONTEND_DEVELOPER_GUIDE.md`, pero **no aparecen en la especificación OpenAPI** — o sea que no están implementados.

#### OAuth2 / Autenticación (🔴 BLOQUEANTE)

| Método | Path | Para qué lo necesita el frontend |
|--------|------|----------------------------------|
| `GET` | `/api/v1/platform/oauth2/authorize` | Iniciar flujo PKCE de plataforma |
| `POST` | `/api/v1/platform/account/login` | Enviar credenciales, recibir authorization code |
| `POST` | `/api/v1/platform/oauth2/token` | Canjear code por tokens + refresh token rotation |
| `POST` | `/api/v1/platform/oauth2/revoke` | Logout de plataforma (revocar refresh token) |
| `POST` | `/api/v1/platform/account/direct-login` | Login directo para API/CLI (sin PKCE) |

**Impacto:** Sin estos, el frontend **no puede implementar login de plataforma**. Toda la sección `features/ops/` queda bloqueada.

#### JWKS / OIDC Discovery (🔴 BLOQUEANTE)

| Método | Path | Para qué lo necesita el frontend |
|--------|------|----------------------------------|
| `GET` | `/api/v1/platform/.well-known/jwks.json` | Verificar firma RS256 del JWT de plataforma |
| `GET` | `/api/v1/platform/.well-known/openid-configuration` | Descubrir endpoints de plataforma dinámicamente |

**Impacto:** Sin JWKS, `jwksVerify.ts` no puede validar tokens de plataforma. El frontend tendría que confiar ciegamente en el JWT — inaceptable.

#### Gestión de platform_users (🔴 BLOQUEANTE para panel ops/)

| Método | Path | Uso |
|--------|------|-----|
| `POST` | `/platform/users` | Crear platform user |
| `GET` | `/platform/users` | Listar platform users (paginado) |
| `GET` | `/platform/users/{userId}` | Detalle de platform user |
| `PUT` | `/platform/users/{userId}` | Actualizar platform user |
| `PUT` | `/platform/users/{userId}/suspend` | Suspender |
| `PUT` | `/platform/users/{userId}/activate` | Activar |
| `POST` | `/platform/users/{userId}/platform-roles` | Asignar rol de plataforma |
| `DELETE` | `/platform/users/{userId}/platform-roles/{roleCode}` | Revocar rol |
| `GET` | `/platform/users/{userId}/platform-roles` | Listar roles del user |

**Impacto:** Sin estos, no hay panel de administración de platform users.

#### Self-service de plataforma (🟡 IMPORTANTE, mockeable)

| Método | Path | Uso |
|--------|------|-----|
| `GET` | `/platform/account/me` | Perfil del platform user autenticado |
| `PATCH` | `/platform/account/me` | Actualizar perfil propio |
| `POST` | `/platform/account/change-password` | Cambio de contraseña |
| `POST` | `/platform/account/forgot-password` | Solicitar reset de contraseña (ÚNICO punto de entrada — no existe a nivel tenant) |
| `POST` | `/platform/account/reset-password` | Ejecutar reset con token recibido por email |
| `GET` | `/platform/account/sessions` | Listar sesiones activas |
| `DELETE` | `/platform/account/sessions/{id}` | Revocar sesión específica |

### 1.2 Contrato de JWT de plataforma — necesito confirmación

El RFC define la estructura pero necesito confirmación exacta del backend:

```jsonc
// ¿Es exactamente esto lo que emitirá el backend?
{
  "iss": "https://keygo.io",
  "sub": "<platform_user_id>",
  "email": "admin@keygo.io",
  "username": "keygo_admin",
  "preferred_username": "keygo_admin",  // ¿existe este claim?
  "roles": ["keygo_admin", "keygo_tenant_admin"],
  "scope": "openid profile platform",
  "type": "platform_user",             // ¿existe este claim?
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Preguntas pendientes al backend:**

| # | Pregunta | Impacto frontend |
|---|----------|-----------------|
| 1 | ¿El JWT de plataforma tiene claim `type: "platform_user"`? | Si no, ¿cómo distinguir un JWT de plataforma de uno de tenant? |
| 2 | ¿`preferred_username` está presente en ambos JWTs? | `useCurrentUser` depende de este claim |
| 3 | ¿`given_name` y `family_name` están en el JWT de plataforma? | Necesario para mostrar nombre en la UI |
| 4 | ¿El `sub` del JWT de plataforma es UUID de `platform_users.id`? | Necesario para llamadas a `/platform/account/me` |
| 5 | ¿Los roles de plataforma vienen en `snake_case` (`keygo_admin`) o `UPPER_CASE` (`KEYGO_ADMIN`)? | Define el mapper de roles del frontend |
| 6 | ¿El `scope` sirve como discriminador definitivo? (`"platform"` en scope = JWT de plataforma) | Alternativa al claim `type` |
| 7 | ¿Hay `id_token` separado del `access_token` en el flujo de plataforma? | `jwksVerify.ts` verifica `id_token`, no `access_token` |
| 8 | ¿El `expires_in` del token de plataforma es el mismo TTL que el de tenant? | Afecta el scheduler de refresh |

### 1.3 Tenant branding — no existe nada

**Situación:** No hay ningún endpoint ni metadata para personalización visual de tenants (logo, colores, nombre para mostrar). Para el hosted login esto es relevante:

| Dato | Necesario para | Endpoint esperado |
|------|----------------|-------------------|
| Nombre del tenant para mostrar | Hosted login: "Entrar a **ACME Store**" | `GET /tenants/{slug}` → campo `display_name`? |
| Logo del tenant | Hosted login: logo arriba del form | `GET /tenants/{slug}` → campo `logo_url`? |
| Colores primarios del tenant | Hosted login: branding | No definido |

**Recomendación al backend:** Agregar al menos `display_name` y `logo_url` al response de `GET /tenants/{slug}` (o nuevo endpoint `/tenants/{slug}/branding`). Sin esto, el hosted login mostrará solo el slug como texto.

### 1.4 Desincronización api-docs.json vs documentación

**Hallazgo crítico:** `docs/FRONTEND_DEVELOPER_GUIDE.md` marca varios endpoints de plataforma con ✅ (implementados), pero **no aparecen en `api-docs.json`**. Esto significa una de dos cosas:

1. Los endpoints existen en el código pero no están documentados en OpenAPI (problema de documentación)
2. La guía se adelantó y los marcó como implementados antes de tiempo (problema de estado)

**Necesito del backend:** Regenerar `api-docs.json` para confirmar qué endpoints de plataforma ya están activos.

---

## Parte 2 — Lo que está cojo en el frontend

### 2.1 Token Store (`src/auth/tokenStore.ts`)

**Estado actual:** Un solo contexto — `accessToken`, `refreshToken`, `roles[]`, `activeRole`, `setActiveRole()`.

**Buena noticia:** Con la confirmación de que siempre es login de plataforma + dropdown de rol activo, **el diseño del store no necesita dual-context**. Ya tiene `activeRole` + `setActiveRole` + `SelectDropdown` en `AdminLayout`.

**Lo que sí necesita:**
- Extender `AppRole` para incluir los nuevos nombres de rol de plataforma
- Que `resolvePrimaryRole()` entienda la nueva jerarquía (`keygo_admin` > `keygo_tenant_admin` > `keygo_user`)
- Que `setActiveRole()` acepte roles con formato nuevo

### 2.2 JWKS Verify (`src/auth/jwksVerify.ts`)

**Estado actual:** Solo soporta JWKS de tenant: `GET /tenants/{slug}/.well-known/jwks.json`

**Necesita:** Agregar soporte para `GET /platform/.well-known/jwks.json` con cache separada.

### 2.3 Refresh (`src/auth/refresh.ts`)

**Estado actual:** Refresca tokens con `POST /tenants/{tenantSlug}/oauth2/token`.

**Necesita:** Apuntar a `POST /platform/oauth2/token` en vez de al endpoint del tenant. Es un cambio de URL, no de lógica — el key de `sessionStorage` y el scheduler pueden mantenerse igual.

### 2.4 Roles (`src/types/roles.ts`)

**Estado actual:**
```typescript
export const APP_ROLES = ['ADMIN', 'ADMIN_TENANT', 'USER_TENANT'] as const
```

**Necesita:** Reemplazo directo (sin transición, los nombres legacy desaparecen):
```typescript
// Roles definitivos — sin mapper, sin período de transición
export const PLATFORM_ROLES = ['keygo_admin', 'keygo_tenant_admin', 'keygo_user'] as const
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

// APP_ROLES legacy se elimina por completo
// normalizeRole() NO es necesario — los roles legacy ya no existen en el backend
```

**Impacto cascada:** Todo lo que hoy referencia `'ADMIN' | 'ADMIN_TENANT' | 'USER_TENANT'` debe migrar a los nuevos nombres en un solo paso. No hay convivencia.

### 2.5 useCurrentUser (`src/hooks/useCurrentUser.ts`)

**Estado actual:** Decodifica JWT y extrae `email`, `username`, `roles`, `tenant_slug`.

**Problema:** El JWT de plataforma no tiene `tenant_slug`. El hook fallaría o devolvería datos incompletos.

**Necesita:** Detectar tipo de JWT (por `scope` o `type`) y retornar un `CurrentUser` con campo `context: 'platform' | 'tenant'`.

### 2.6 useHasRole — NO EXISTE

**Estado actual:** Solo hay `RoleGuard` como componente de ruta. No hay hook para verificación de rol a nivel de componente.

**Necesita:** Hook tipo `useHasRole('keygo_admin')` y `useHasAnyRole(['keygo_admin', 'keygo_tenant_admin'])`. Solo acepta los nuevos nombres de rol — sin soporte legacy.

### 2.7 API Client (`src/api/client.ts`)

**Estado actual:** Un solo interceptor que inyecta `Bearer <accessToken>`.

**Buena noticia:** Con single-context, **el interceptor sigue funcionando igual** — un solo token activo, un solo Bearer. No necesita routing por path.

**Lo que sí necesita:**
- `platformUrl` builder: `${API_V1}/platform` (similar al existente `tenantUrl`)
- Las funciones de auth (`authorize`, `login`, `exchangeToken`) apuntando a `/platform/...`

### 2.8 RoleGuard (`src/auth/roleGuard.tsx`)

**Estado actual:** Verifica roles contra un solo array de roles del token store.

**Necesita:** Entender de qué contexto vienen los roles que está verificando. Un guard en `/ops/tenants` debe verificar roles de plataforma, no de tenant.

### 2.9 LoginPage — sin detección de modo

**Estado actual:** Login hardcodeado al tenant `keygo` con variables de entorno.

**Necesita:** Tres modos:
1. **Platform login:** `POST /platform/account/login` (cuando no hay params de hosted)
2. **Hosted tenant login:** detectar `?tenantSlug=X&client_id=Y&redirect_uri=Z` en la URL
3. **KeyGo tenant login:** (legacy, período de transición)

### 2.10 Rutas (`src/App.tsx`)

**Estado actual:** Todo bajo `/dashboard` con un solo `AuthGuard`.

**Necesita:** Separar por contexto de auth:
- `/login` → bifurca entre platform y hosted
- `/ops/*` → requiere platform JWT + `keygo_admin`
- `/console/*` → requiere tenant JWT + `admin_tenant`
- `/account/*` → requiere cualquier JWT autenticado

---

## Parte 3 — Decisiones de diseño (resueltas y pendientes)

### Resueltas ✅

| # | Pregunta | Respuesta | Implicación |
|---|----------|-----------|-------------|
| 1 | **¿Sesiones simultáneas?** | **No. La plataforma siempre solicita login.** Un solo JWT activo a la vez. Si el usuario tiene múltiples roles, selecciona uno con el dropdown existente (`AdminLayout` → `SelectDropdown` + `setActiveRole`). | El token store **no necesita dual-context**. Se mantiene el diseño actual de un solo set de tokens. Solo cambian los roles y el endpoint de auth. |
| 2 | **¿Cómo se navega entre contextos?** | **Con el dropdown de rol activo que ya existe.** El usuario elige su rol y la UI adapta sidebar + rutas según el rol seleccionado. | No hay "cambiar de plataforma a tenant" — es un solo login con múltiples roles. La navegación ya está resuelta. |
| 3 | **¿Hosted login necesita branding dinámico?** | **Sí, si el plan del tenant lo tiene habilitado.** Si el plan no incluye branding, se muestra branding de KeyGo por defecto. | Se necesita: (a) que el endpoint de authorize o metadata del tenant indique si tiene branding habilitado, y (b) los assets del branding (logo, colores). Sin endpoint de backend, se usa branding KeyGo siempre. |
| 4 | **¿Hay período de transición de roles?** | **No. Los nombres legacy (`ADMIN`, `ADMIN_TENANT`, `USER_TENANT`) desaparecen inmediatamente.** Solo existen `keygo_admin`, `keygo_tenant_admin`, `keygo_user`. | **No se necesita `normalizeRole()` ni mapper.** El cambio es un reemplazo directo en todo el frontend. Todo lo que hoy dice `'ADMIN'` pasa a `'keygo_admin'` en un solo paso. Simplifica significativamente la migración. |
| 5 | **¿Platform users pueden hacer forgot-password?** | **Sí, y es la única vía.** Solo a través de platform se puede solicitar `/forgot-password`. | Se necesitan endpoints `POST /platform/account/forgot-password` y `POST /platform/account/reset-password`. La pantalla de forgot-password vive en `features/auth/forgot-password/`. No existe flujo de forgot-password a nivel de tenant (el tenant delega en platform). |

### Implicación arquitectónica: simplificación del token store

Con la confirmación de que **siempre es login de plataforma** (un solo JWT, un solo contexto), la complejidad baja significativamente:

```
ANTES (lo que asumí — dual context):
┌─────────────────────────────────────┐
│ tokenStore                          │
│  platformAuth: { tokens, roles }    │  ← NO NECESARIO
│  tenantAuth:   { tokens, roles }    │  ← NO NECESARIO
│  activeContext: 'platform'|'tenant' │  ← NO NECESARIO
└─────────────────────────────────────┘

AHORA (confirmado — single context, como ya está):
┌─────────────────────────────────────┐
│ tokenStore                          │
│  accessToken                        │  ← uno solo
│  idToken                            │  ← uno solo
│  refreshToken                       │  ← uno solo
│  roles: AppRole[]                   │  ← ahora incluye platform roles
│  activeRole                         │  ← selector ya existe
└─────────────────────────────────────┘
```

**Lo que sí cambia:**
- `AppRole` se extiende para incluir roles de plataforma (`keygo_admin`, etc.)
- Las funciones de auth (`authorize`, `login`, `exchangeToken`) apuntan a `/platform/...` en vez de `/tenants/keygo/...`
- El guard de rutas evalúa los nuevos nombres de rol
- El hosted login es un **flujo separado** que no toca el token store (solo redirige con code)

| 6 | **¿Consent screen en hosted login?** | **No. No es necesario.** Si una app usa KeyGo es porque existe un contrato de plan activo — el consentimiento es implícito en la relación comercial, no depende del usuario final. | A diferencia del OAuth2 de consumo (Google, Facebook), donde el usuario elige qué apps autoriza, en KeyGo el acceso está determinado por el contrato del tenant. Esto simplifica el flujo de hosted login: credenciales válidas → redirect con code, sin pantalla intermedia. |
| 7 | **¿Single domain o subdominios?** | **Diferido a una etapa futura.** No se aborda en esta iteración. | Sin impacto inmediato. Se asume single domain por ahora. |

### Pendientes 🟡

> **No quedan preguntas de diseño pendientes.** Todas las decisiones arquitectónicas necesarias para comenzar la implementación están resueltas.

### Branding en hosted login — detalle

El flujo de branding condicional al plan sería:

```
App tenant → redirect a KeyGo UI /login?tenantSlug=acme&client_id=...
                                    │
                            KeyGo UI detecta hosted mode
                                    │
                     GET /tenants/acme/oauth2/authorize
                                    │
                        ¿response incluye branding?
                           /              \
                         SÍ                NO
                    (plan lo permite)   (plan básico)
                         │                  │
                  Mostrar logo/nombre    Mostrar branding
                  del tenant             KeyGo por defecto
```

**Necesita del backend:** Que el response de `GET /tenants/{slug}/oauth2/authorize` (o un endpoint auxiliar) incluya metadata de branding cuando el plan lo permita:

```jsonc
// Propuesta: incluir en AuthorizeData
{
  "session_id": "...",
  "application_name": "ACME Store",
  "branding": {                      // null si el plan no lo permite
    "display_name": "ACME Corp",
    "logo_url": "https://...",
    "primary_color": "#1e40af"
  }
}
```

Si el backend no puede resolver esto en el authorize, alternativa: `GET /tenants/{slug}/branding` (público, cacheado).

---

## Parte 4 — Orden de prioridad recomendado (revisado)

Con la simplificación de single-context, la complejidad bajó significativamente.

### Fase 0: Contrato (sin código)
1. ✅ Confirmar estructura exacta del JWT de plataforma (preguntas §1.2)
2. ✅ Confirmar formato de roles en wire (`snake_case` vs `UPPER_CASE`)
3. ✅ Definir respuestas a las preguntas pendientes (§Parte 3)
4. ✅ Backend regenera `api-docs.json` actualizado

### Fase 1: Backend implementa endpoints de plataforma
1. 🔴 OAuth2 endpoints (authorize, login, token, revoke)
2. 🔴 JWKS + OIDC Discovery para plataforma
3. 🟡 Platform user management CRUD
4. 🟡 Platform self-service (me, sessions)

### Fase 2: Frontend — tipos y auth (sin UI nueva)
1. Reemplazar `types/roles.ts` — eliminar `APP_ROLES` legacy, definir `PLATFORM_ROLES` con nuevos nombres
2. Migrar todas las referencias a roles legacy en el codebase (`'ADMIN'` → `'keygo_admin'`, etc.)
3. Extender `types/auth.ts` con claims de JWT de plataforma
4. Crear funciones `platformAuthorize`, `platformLogin`, `platformExchangeToken` en `api/`
5. Actualizar `jwksVerify.ts` para JWKS de plataforma
6. Actualizar `refresh.ts` apuntando a endpoint de plataforma
7. Crear `useHasRole` hook

### Fase 3: Frontend — login y rutas
1. Migrar `LoginPage` de tenant keygo a platform login
2. Crear `ForgotPasswordPage` y `ResetPasswordPage` en `features/auth/` (solo platform, único punto de entrada)
3. Crear `HostedLoginFlow` (flujo separado, sin token store)
4. Actualizar `RoleGuard` para aceptar nuevos nombres de rol
5. Separar rutas: `/ops/*` (keygo_admin), `/console/*` (keygo_tenant_admin), `/account/*` (todos)

### Fase 4: Frontend — paneles y features
1. Panel `ops/` (platform users, roles, audit)
2. Hosted login branding (cuando backend lo soporte)
3. Migración de la estructura de directorios (feature-first, doc 09)

---

## Resumen visual

```
                     ┌─────────────────────────────────┐
                     │    ESTADO ACTUAL DEL FRONTEND    │
                     │  (single-context, tenant keygo)  │
                     └────────────────┬────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
    🔴 BLOQUEADO                🟡 COJO                    🟢 FALTA CREAR
    (necesita backend)          (código insuficiente)       (frontend-only)
          │                           │                           │
  ┌───────┴───────┐           ┌───────┴───────┐           ┌───────┴───────┐
  │ 20 endpoints  │           │ roles.ts      │           │ useHasRole    │
  │ de plataforma │           │ (solo legacy) │           │ HostedLogin   │
  │ no existen    │           │               │           │ PlatformLogin │
  │ en api-docs   │           │ jwksVerify    │           │ ForgotPwd     │
  │               │           │ (solo tenant) │           │ ResetPwd      │
  │ JWKS platform │           │               │           │ (funciones    │
  │ no existe     │           │ auth.ts types │           │  api/ nuevas) │
  │               │           │ (sin platform)│           │               │
  │ api-docs.json │           │               │           │               │
  │ desactualizado│           │ LoginPage     │           │               │
  │               │           │ (hardcoded    │           │               │
  │ branding      │           │  a tenant)    │           │               │
  │ metadata      │           │               │           │               │
  │ (hosted login)│           │ refresh.ts    │           │               │
  └───────────────┘           │ (tenant URL)  │           └───────────────┘
                              └───────────────┘

  NOTA: Token store, interceptor HTTP y dropdown de roles
        ya están bien diseñados para single-context.
        Solo necesitan extensión de roles, no refactor.
```
