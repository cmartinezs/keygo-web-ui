# 12 — Cross-Reference: api-docs.json actualizado vs. análisis previo

> Auditoría completa del `api-docs.json` regenerado. **65 endpoints** documentados.

---

## Hallazgo principal: la arquitectura es distinta a lo asumido

El backend **NO implementó endpoints separados para plataforma** en OAuth2, self-service ni OIDC Discovery. En su lugar:

```
ASUMIDO (doc 11):
  /api/v1/platform/oauth2/authorize     ← NO EXISTE
  /api/v1/platform/account/login        ← NO EXISTE
  /api/v1/platform/account/me           ← NO EXISTE
  /api/v1/platform/.well-known/jwks.json ← NO EXISTE

REALIDAD:
  /api/v1/tenants/{tenantSlug}/oauth2/authorize      ← el slug "keygo" ES platform
  /api/v1/tenants/{tenantSlug}/account/login          ← mismos endpoints
  /api/v1/tenants/{tenantSlug}/account/profile        ← self-service aquí
  /api/v1/tenants/{tenantSlug}/.well-known/jwks.json  ← JWKS aquí
```

**Implicación:** Los platform users SON users del tenant `keygo`. La autenticación, self-service y OIDC Discovery pasan por los endpoints de tenant con `tenantSlug = "keygo"`. El prefijo `/platform/` solo existe para **operaciones administrativas cross-tenant** (gestión de users, billing de plataforma, stats, dashboard).

### Lo que esto significa para el frontend

| Área | Lo que asumí | Lo que es | Impacto |
|------|-------------|-----------|---------|
| **Login** | Nuevo `platformLogin()` con `/platform/account/login` | Mismo `login()` existente con slug `keygo` | **Ya funciona** — no hay cambio |
| **OAuth2 flow** | Nuevo `/platform/oauth2/*` | Mismo `/tenants/keygo/oauth2/*` | **Ya funciona** |
| **JWKS** | Nuevo `/platform/.well-known/jwks.json` | Mismo `/tenants/keygo/.well-known/jwks.json` | **Ya funciona** |
| **Token refresh** | Cambiar URL a `/platform/oauth2/token` | Mismo `/tenants/keygo/oauth2/token` | **Ya funciona** |
| **Profile** | Nuevo `/platform/account/me` | `/tenants/keygo/account/profile` | Nuevo endpoint, pero bajo tenant |
| **Sessions** | Nuevo `/platform/account/sessions` | `/tenants/keygo/account/sessions` | Nuevo endpoint, bajo tenant |
| **Forgot password** | `/platform/account/forgot-password` | `/tenants/keygo/account/forgot-password` | Nuevo endpoint, bajo tenant |
| **Platform user CRUD** | `/platform/users/*` | `/platform/users/*` — **sí existe** | Es lo único realmente "platform" |
| **Platform billing** | No anticipado | `/platform/billing/*` — **nuevo** | Funcionalidad nueva |
| **Admin dashboard** | No anticipado | `/admin/platform/dashboard` — **nuevo** | Funcionalidad nueva |

### Consecuencia: 14 de los 20 endpoints "bloqueantes" ya están resueltos

Los 5 de OAuth2, los 2 de JWKS y los 7 de self-service **no se necesitan como endpoints separados** — se usan los de tenant `keygo` que ya existen.

---

## Estado de cobertura: endpoints necesarios vs disponibles

### ✅ Auth y OIDC — 100% cubierto (via tenant keygo)

| Endpoint | Path | Estado |
|----------|------|--------|
| Authorize | `GET /tenants/{slug}/oauth2/authorize` | ✅ Disponible |
| Login | `POST /tenants/{slug}/account/login` | ✅ Disponible |
| Token exchange | `POST /tenants/{slug}/oauth2/token` | ✅ Disponible |
| Revoke | `POST /tenants/{slug}/oauth2/revoke` | ✅ Disponible |
| JWKS | `GET /tenants/{slug}/.well-known/jwks.json` | ✅ Disponible |
| OIDC Discovery | `GET /tenants/{slug}/.well-known/openid-configuration` | ✅ Disponible |
| UserInfo | `GET /tenants/{slug}/userinfo` | ✅ Disponible |

### ✅ Self-service / Account — 100% cubierto (via tenant keygo)

| Endpoint | Path | Estado |
|----------|------|--------|
| Get profile | `GET /tenants/{slug}/account/profile` | ✅ Nuevo |
| Update profile | `PATCH /tenants/{slug}/account/profile` | ✅ Nuevo |
| Change password | `POST /tenants/{slug}/account/change-password` | ✅ Nuevo |
| Forgot password | `POST /tenants/{slug}/account/forgot-password` | ✅ Nuevo |
| Recover password | `POST /tenants/{slug}/account/recover-password` | ✅ Nuevo |
| Reset password | `POST /tenants/{slug}/account/reset-password` | ✅ Nuevo |
| List sessions | `GET /tenants/{slug}/account/sessions` | ✅ Nuevo |
| Revoke session | `DELETE /tenants/{slug}/account/sessions/{id}` | ✅ Nuevo |
| Get access/roles | `GET /tenants/{slug}/account/access` | ✅ Nuevo |
| Notification prefs | `GET/PATCH /tenants/{slug}/account/notification-preferences` | ✅ Nuevo |

### 🟡 Platform Users — 60% cubierto (3 gaps)

| Endpoint | Path | Estado |
|----------|------|--------|
| Create user | `POST /platform/users` | ✅ Disponible |
| Get user | `GET /platform/users/{userId}` | ✅ Disponible |
| Suspend user | `PUT /platform/users/{userId}/suspend` | ✅ Disponible |
| Activate user | `PUT /platform/users/{userId}/activate` | ✅ Disponible |
| Assign role | `POST /platform/users/{userId}/platform-roles` | ✅ Disponible |
| Revoke role | `DELETE /platform/users/{userId}/platform-roles/{roleCode}` | ✅ Disponible |
| **List users** | `GET /platform/users` | ❌ **No existe** |
| **Update user** | `PUT /platform/users/{userId}` | ❌ **No existe** |
| **List user roles** | `GET /platform/users/{userId}/platform-roles` | ❌ **No existe** |

### ✅ Platform Billing — 100% (no anticipado, todo nuevo)

| Endpoint | Path | Público |
|----------|------|---------|
| Plan catalog | `GET /platform/billing/catalog` | Sí |
| Plan detail | `GET /platform/billing/catalog/{planCode}` | Sí |
| Current subscription | `GET /platform/billing/subscription` | No |
| Cancel subscription | `POST /platform/billing/subscription/cancel` | No |
| List invoices | `GET /platform/billing/invoices` | No |

### ✅ Admin Dashboard — 100% (no anticipado, todo nuevo)

| Endpoint | Path | Notas |
|----------|------|-------|
| Dashboard completo | `GET /admin/platform/dashboard` | Requiere ADMIN. Datos muy ricos. |
| Platform stats | `GET /platform/stats` | Requiere ADMIN. Resumen rápido. |

---

## Endpoints completamente nuevos (no anticipados en el análisis previo)

### Billing Contracts — 7 endpoints (ciclo completo de contratación)

| Método | Path | Operación | Auth |
|--------|------|-----------|------|
| `POST` | `/billing/contracts` | Crear contrato | No |
| `GET` | `/billing/contracts/{id}` | Estado del contrato | No |
| `GET` | `/billing/contracts/{id}/resume` | Reanudar onboarding | No |
| `POST` | `/billing/contracts/{id}/verify-email` | Verificar email | No |
| `POST` | `/billing/contracts/{id}/resend-verification` | Reenviar código | No |
| `POST` | `/billing/contracts/{id}/mock-approve-payment` | Mock pago (dev) | No |
| `POST` | `/billing/contracts/{id}/activate` | Activar contrato | No |

**Schema clave — `AppContractData`:**
```
id, clientAppId, selectedPlanVersionId, billingPeriod, status,
contractorEmail, contractorFirstName, contractorLastName, companyName,
contractorId, emailVerified, paymentVerified, expiresAt, createdAt
```

**Schema — `AppContractResumeData`** (extiende contract con hints de UI):
```
...todos los campos de AppContractData...
verificationCodeExpired (boolean)  — hint para UI
nextAction (string)                — hint para UI: qué paso sigue
```

### App Roles — 4 endpoints (roles jerárquicos por app)

| Método | Path | Operación | Auth |
|--------|------|-----------|------|
| `GET` | `/tenants/{slug}/apps/{appId}/roles` | Listar roles (paginado, filtrable) | Bearer |
| `POST` | `/tenants/{slug}/apps/{appId}/roles` | Crear rol | Bearer |
| `POST` | `/tenants/{slug}/apps/{appId}/roles/{code}/parent` | Asignar padre | Bearer |
| `DELETE` | `/tenants/{slug}/apps/{appId}/roles/{code}/parent` | Quitar padre | Bearer |

**Schema — `AppRoleData`:**
```
id, clientAppId, code, displayName, description, createdAt
```

### Memberships — 4 endpoints (acceso usuario↔app)

| Método | Path | Operación | Auth |
|--------|------|-----------|------|
| `GET` | `/tenants/{slug}/memberships` | Listar (paginado, filtrable por user/app) | Bearer |
| `POST` | `/tenants/{slug}/memberships` | Crear membership | Bearer |
| `PUT` | `/tenants/{slug}/memberships/{id}/approve` | Aprobar | Bearer |
| `DELETE` | `/tenants/{slug}/memberships/{id}` | Revocar | Bearer |

**Schema — `MembershipData`:**
```
id, userId, clientAppId, status (ACTIVE|SUSPENDED|PENDING),
roleIds[], createdAt
```

### Client App Billing — 6 endpoints (billing por app de tenant)

| Método | Path | Operación | Auth |
|--------|------|-----------|------|
| `GET` | `/tenants/{slug}/apps/{id}/billing/catalog` | Catálogo de planes | No |
| `GET` | `/tenants/{slug}/apps/{id}/billing/catalog/{planCode}` | Detalle de plan | No |
| `POST` | `/tenants/{slug}/apps/{id}/billing/plans` | Crear plan | Bearer (ADMIN_TENANT) |
| `GET` | `/tenants/{slug}/apps/{id}/billing/subscription` | Suscripción activa | Bearer (ADMIN_TENANT) |
| `POST` | `/tenants/{slug}/apps/{id}/billing/subscription/cancel` | Cancelar suscripción | Bearer (ADMIN_TENANT) |
| `GET` | `/tenants/{slug}/apps/{id}/billing/invoices` | Facturas | Bearer (ADMIN_TENANT) |

**Schema — `AppPlanData`:**
```
id, clientAppId, code, name, description, status, isPublic, sortOrder,
versions[]: { id, version, currency, trialDays, effectiveFrom, effectiveTo, billingOptions[], status }
entitlements[]: { id, metricCode, metricType, limitValue, periodType, enforcementMode, isEnabled }
```

**Schema — `BillingOptionData`:**
```
id, billingPeriod (MONTHLY|YEARLY|ONE_TIME), basePrice, discountPct, finalPrice, isDefault
```

### Registration — 3 endpoints (registro de usuarios en apps de tenant)

| Método | Path | Operación | Auth |
|--------|------|-----------|------|
| `POST` | `/tenants/{slug}/apps/{id}/register` | Registrar usuario | No |
| `POST` | `/tenants/{slug}/apps/{id}/verify-email` | Verificar email | No |
| `POST` | `/tenants/{slug}/apps/{id}/resend-verification` | Reenviar código | No |

### Otros nuevos

| Método | Path | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/response-codes` | Catálogo de códigos de respuesta | No |
| `GET` | `/service/info` | Info del servicio (health) | No |

---

## Schemas de respuesta — resumen para DTOs del frontend

### BaseResponse<T> (wrapper universal)

```typescript
interface BaseResponse<T> {
  date: string
  success?: { code: string; message: string }
  failure?: { code: string; message: string }
  data?: T
  debug?: { code: string; message: string }   // solo dev
  throwable?: string                            // solo dev
}
```

### Paginación — PagedData<T>

```typescript
interface PagedData<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
```

### DTOs principales que el frontend necesita crear/actualizar

| DTO | Campos clave | Usado por |
|-----|-------------|-----------|
| `PlatformUserData` | id, email, username, firstName, lastName, status | Platform Users CRUD |
| `PlatformStatsData` | tenants{}, users{}, apps{}, signingKeys{} | Stats rápido |
| `PlatformDashboardData` | service, security, tenants, users, apps, memberships, registration, topology, rankings, pendingActions, recentActivity, quickActions | Dashboard admin |
| `UserProfileData` | id, tenantId, username, email, firstName, lastName, status, phoneNumber, locale, zoneinfo, profilePictureUrl, birthdate, website | Account profile |
| `AccountSessionData` | sessionId, status, browser, os, deviceType, ipAddress, createdAt, lastAccessedAt, expiresAt, isCurrent | Sessions |
| `UserAccessData` | clientAppId, clientAppName, membershipId, status, roles[] | Access review |
| `NotificationPreferencesData` | securityAlertsEmail, securityAlertsInApp, billingAlertsEmail, productUpdatesEmail, weeklyDigest | Notification prefs |
| `AppContractData` | id, clientAppId, selectedPlanVersionId, billingPeriod, status, contractorEmail, contractorFirstName, contractorLastName, companyName, contractorId, emailVerified, paymentVerified, expiresAt, createdAt | Contracts |
| `AppContractResumeData` | ...AppContractData + verificationCodeExpired, nextAction | Resume onboarding |
| `AppRoleData` | id, clientAppId, code, displayName, description, createdAt | App roles |
| `MembershipData` | id, userId, clientAppId, status, roleIds[], createdAt | Memberships |
| `AppPlanData` | id, clientAppId, code, name, description, status, isPublic, sortOrder, versions[], entitlements[] | Plans |
| `AppPlanVersionData` | id, version, currency, trialDays, effectiveFrom, effectiveTo, billingOptions[], status | Plan versions |
| `BillingOptionData` | id, billingPeriod, basePrice, discountPct, finalPrice, isDefault | Billing options |
| `AppPlanEntitlementData` | id, metricCode, metricType, limitValue, periodType, enforcementMode, isEnabled | Plan entitlements |
| `AppSubscriptionData` | id, clientAppId, appPlanVersionId, contractorId, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, nextBillingAt, autoRenew, createdAt | Subscriptions |
| `AppInvoiceData` | id, subscriptionId, invoiceNumber, status, issueDate, dueDate, periodStart, periodEnd, currency, subtotal, taxAmount, total, billingNameSnapshot, planVersionSnapshot, pdfUrl, createdAt | Invoices |
| `UserInfoResult` | sub, email, name, preferredUsername, givenName, familyName, picture, locale, zoneinfo, birthdate, website, phoneNumber | UserInfo OIDC |
| `RegistrationData` | id, username, email, status | Registration |
| `LoginData` | message, code, redirect_uri, reset_code_id | Login response |
| `AuthorizationInitiatedData` | client_id, client_name, redirect_uri | Authorize response |
| `TokenData` | access_token, id_token, refresh_token, token_type, expires_in, scope, authorization_code_id | Token response |

---

## Wire format — CONFIRMADO: snake_case en todo

**Confirmado por el equipo backend (2026-04-07):**

- `api-docs.json` muestra camelCase porque refleja los nombres de campos en Java.
- Sin embargo, **Jackson ObjectMapper** está configurado globalmente con `PropertyNamingStrategies.SNAKE_CASE`.
- Tanto request como response pasan por Jackson **siempre**.
- **Resultado:** el wire real es `snake_case` en todas las capas, sin excepción.

| api-docs.json muestra | Wire real (JSON) | DTO frontend debe usar |
|-----------------------|-----------------|----------------------|
| `firstName` | `first_name` | `first_name` |
| `clientAppId` | `client_app_id` | `client_app_id` |
| `contractorEmail` | `contractor_email` | `contractor_email` |
| `billingPeriod` | `billing_period` | `billing_period` |
| `emailVerified` | `email_verified` | `email_verified` |
| `selectedPlanVersionId` | `selected_plan_version_id` | `selected_plan_version_id` |
| `isPublic` | `is_public` | `is_public` |
| `createdAt` | `created_at` | `created_at` |

**Regla para el frontend:** Todo DTO de wire (`*Data`, `*Request`, `*Response`) usa snake_case. Los schemas internos de formularios (Zod) usan camelCase y se mapean al enviar.

---

## Gaps reales que quedan (solo 3 endpoints)

| # | Endpoint faltante | Impacto | Workaround |
|---|-------------------|---------|------------|
| 1 | `GET /platform/users` (listar) | No se puede mostrar tabla de platform users | Mockear con MSW hasta que backend lo implemente |
| 2 | `PUT /platform/users/{userId}` (actualizar) | No se puede editar datos de un platform user | Solo crear/suspender/activar por ahora |
| 3 | `GET /platform/users/{userId}/platform-roles` (listar roles) | No se puede ver qué roles tiene un user | Se puede inferir del JWT o del dashboard |

**De 20 endpoints "bloqueantes" → solo 3 gaps reales.** El resto ya existe o se resuelve usando endpoints de tenant `keygo`.

---

## Plan de implementación revisado

### Fase 1: Tipos y API (sin UI nueva)

**Sin bloqueantes — todo disponible.**

1. Verificar wire format real (snake_case vs camelCase) con una petición al backend
2. Crear/actualizar DTOs en `src/types/`:
   - `platform.ts` — PlatformUserData, PlatformStatsData, PlatformDashboardData
   - `account.ts` — UserProfileData, AccountSessionData, UserAccessData, NotificationPreferencesData
   - `billing.ts` — AppContractData, AppSubscriptionData, AppInvoiceData, AppPlanData, etc.
   - `membership.ts` — MembershipData
   - `roles.ts` — Reemplazar APP_ROLES legacy por PLATFORM_ROLES nuevos, AppRoleData
   - `registration.ts` — RegistrationData
   - `auth.ts` — Actualizar LoginData, AuthorizationInitiatedData, TokenData
3. Crear módulos API en `src/api/`:
   - `platform-users.ts` — CRUD de platform users
   - `platform-billing.ts` — suscripción, facturas, catálogo de platform
   - `platform-dashboard.ts` — dashboard + stats
   - `account.ts` — profile, sessions, notifications, password
   - `contracts.ts` — actualizar para nuevos schemas
   - `memberships.ts` — nuevo
   - `app-roles.ts` — nuevo
   - `app-billing.ts` — billing por app de tenant
   - `registration.ts` — nuevo
4. Actualizar `roles.ts` — reemplazo directo, sin transición
5. Crear `useHasRole` hook

### Fase 2: Auth y rutas

**Sin bloqueantes — el login ya funciona con tenant keygo.**

1. Actualizar `RoleGuard` para nuevos nombres de rol (`keygo_admin`, etc.)
2. Crear pantallas de forgot-password / reset-password (endpoints disponibles)
3. Preparar hosted login flow (detección de query params + redirect)
4. Reorganizar rutas por contexto (ops, console, account)

### Fase 3: Paneles y features

1. **Dashboard admin** — datos riquísimos del endpoint `/admin/platform/dashboard`
2. **Platform users** — CRUD (con MSW mock para list)
3. **Account/profile** — pantallas de profile, sessions, notifications, change-password
4. **Console** — apps, roles, memberships, billing de tenant
5. **Contracts** — flujo de contratación actualizado
6. **Restructuración del repo** — migrar a feature-first (doc 09)

---

## Resumen visual actualizado

```
                        ┌────────────────────────────────┐
                        │     ESTADO POST api-docs.json  │
                        │         65 endpoints           │
                        └───────────────┬────────────────┘
                                        │
          ┌─────────────────────────────┼──────────────────────────┐
          │                             │                          │
    ✅ YA DISPONIBLE              ❌ GAPS (solo 3)         🆕 NUEVOS NO
    (62 endpoints)                                         ANTICIPADOS
          │                             │                          │
  ┌───────┴───────┐            ┌────────┴────────┐        ┌───────┴───────┐
  │ Auth/OAuth2   │            │ GET /platform/  │        │ 7 contracts   │
  │ (via keygo)   │            │   users (list)  │        │ 4 app roles   │
  │               │            │                 │        │ 4 memberships │
  │ Self-service  │            │ PUT /platform/  │        │ 6 app billing │
  │ (via keygo)   │            │   users/{id}    │        │ 3 registration│
  │               │            │                 │        │ 2 dashboard   │
  │ JWKS/OIDC     │            │ GET .../        │        │ 5 plat billing│
  │ (via keygo)   │            │   platform-roles│        │ 10 account    │
  │               │            └─────────────────┘        │ 2 platform    │
  │ Platform CRUD │                                       └───────────────┘
  │ (6 endpoints) │
  │               │
  │ Platform      │
  │ billing (5)   │
  │               │
  │ Dashboard (2) │
  └───────────────┘

  La mayoría de los "bloqueantes" de doc 11
  resultaron ser endpoints de tenant keygo
  que ya existían o se acaban de agregar.
```
