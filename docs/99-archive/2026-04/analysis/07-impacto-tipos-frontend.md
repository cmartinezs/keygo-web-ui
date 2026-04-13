# 07 — Impacto en Tipos del Frontend: Análisis de Gap

> Comparación entre los tipos actuales en `src/types/` y lo que requiere el nuevo modelo.

---

## Estado actual de tipos (`src/types/`)

### `base.ts` — Respuesta base

```typescript
// Tipos existentes (ya actualizados)
SuccessInfo, FailureInfo, DebugInfo, BaseResponse<T>
ErrorData { code, layer?, origin, clientRequestCause?, clientMessage, detail?, exception?, fieldErrors? }
FieldValidationError { field, error }
```

**Estado:** ✅ Alineado con el nuevo modelo de error documentado en la guía.

### `auth.ts` — Autenticación

```typescript
// Tipos existentes
AuthorizeData { session_id, form_html }
LoginData { sessionId }
TokenData { access_token, id_token, refresh_token, expires_in, token_type }
JwtClaims { sub, email, roles, tenant_slug?, aud?, scope?, iss?, exp, iat }
```

**Gaps detectados:**

| Gap | Tipo requerido | Razón |
|-----|---------------|-------|
| JWT de plataforma | `PlatformJwtClaims` | Sin `tenant_slug`, `aud`, `scope`, `iss`; con `type` |
| Direct-login response | `DirectLoginResponse` | Para API/CLI (no SPA, pero el tipo debería existir) |
| Token con contexto | `TokenContext: 'platform' \| 'tenant'` | Discriminar tipo de sesión |

### `roles.ts` — Roles

```typescript
// Tipo actual
type AppRole = 'ADMIN' | 'ADMIN_TENANT' | 'USER_TENANT'
```

**Gaps detectados:**

| Gap | Cambio requerido |
|-----|-----------------|
| Roles de plataforma | `type PlatformRole = 'KEYGO_ADMIN' \| 'KEYGO_TENANT_ADMIN' \| 'KEYGO_USER'` |
| Roles de tenant | `type TenantRoleCode = string` (dinámicos por tenant) |
| Compatibilidad legacy | Helpers `normalizeRole()`, `isLegacyRole()` |
| Mapeo bidireccional | `ADMIN ↔ KEYGO_ADMIN`, `ADMIN_TENANT ↔ KEYGO_TENANT_ADMIN`, etc. |

### `tenant.ts` — Tenants

```typescript
// Tipos existentes
TenantData { id, name, slug, description?, status, owner_id?, created_at, updated_at }
CreateTenantRequest { name, slug, description? }
TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING'
```

**Estado:** ✅ Compatible con el modelo actual. Sin cambios requeridos por los RFCs.

### `user.ts` — Usuarios de tenant

```typescript
// Tipos existentes
TenantUserData { id, tenant_id, username, email, status, first_name?, last_name?, ... }
```

**Gaps detectados:**

| Gap | Cambio requerido |
|-----|-----------------|
| Vinculación con platform_user | `platform_user_id?: string` (nullable en MVP) |
| Tipo PlatformUser | Nuevo DTO completo para `platform_users` |

### `billing.ts` — Billing

```typescript
// Tipos existentes
AppPlanData, AppPlanVersionData, BillingContractData, AppSubscriptionData
ContractorData, InvoiceData, ContractStatus, SubscriptionStatus
```

**Gaps detectados:**

| Gap | Cambio requerido |
|-----|-----------------|
| `client_app_id` nullable | Cambiar de `string` a `string \| null` en todos los tipos de billing |
| `subscriber_type` | Agregar `'PLATFORM'` al tipo existente |
| `ContractorData` | `tenant_user_id` → `platform_user_id` |
| Discriminador de contexto | Helper `isPlatformBilling(entity): boolean` |

---

## Nuevos tipos requeridos (no existen)

### 1. `src/types/platformUser.ts`

```typescript
export interface PlatformUserData {
  id: string
  email: string
  username: string
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  first_name: string | null
  last_name: string | null
  created_at: string
  updated_at: string
}

export interface CreatePlatformUserRequest {
  email: string
  username: string
  password: string
  first_name?: string
  last_name?: string
}
```

### 2. `src/types/platformRole.ts`

```typescript
export interface PlatformRoleData {
  id: string
  code: string      // KEYGO_ADMIN, KEYGO_TENANT_ADMIN, KEYGO_USER
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface PlatformUserRoleData {
  id: string
  user_id: string
  platform_role_id: string
  assigned_at: string
}

export interface AssignPlatformRoleRequest {
  role_code: string
}
```

### 3. `src/types/tenantRole.ts`

```typescript
export interface TenantRoleData {
  id: string
  tenant_id: string
  code: string
  name: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface TenantUserRoleData {
  id: string
  tenant_user_id: string
  tenant_role_id: string
  assigned_at: string
  removed_at: string | null
}

export interface CreateTenantRoleRequest {
  code: string
  name: string
  description?: string
}

export interface AssignTenantRoleRequest {
  tenant_role_id: string
}
```

### 4. Extensión de `src/types/auth.ts`

```typescript
// JWT Claims de plataforma (sin claims de tenant)
export interface PlatformJwtClaims {
  sub: string            // platform_user_id
  email: string
  roles: string[]        // platform roles
  type: 'access_token' | 'refresh_token'
  iat: number
  exp: number
  // Ausentes deliberadamente: tenant_slug, aud, scope, iss
}

// JWT Claims de tenant app (actual, sin cambio)
export interface TenantJwtClaims {
  sub: string            // tenant_user_id
  email: string
  roles: string[]        // app roles (de memberships)
  tenant_slug: string
  aud: string            // client_app_id
  scope: string          // "openid profile email"
  iss: string            // "https://keygo-server/tenants/{slug}"
  iat: number
  exp: number
}

// Union discriminada
export type JwtClaims = PlatformJwtClaims | TenantJwtClaims

// Type guard
export function isPlatformToken(claims: JwtClaims): claims is PlatformJwtClaims {
  return !('tenant_slug' in claims)
}
```

### 5. Extensión de `src/types/roles.ts`

```typescript
// Roles de plataforma (valores conocidos)
export type PlatformRoleCode = 'KEYGO_ADMIN' | 'KEYGO_TENANT_ADMIN' | 'KEYGO_USER'

// Roles legacy (aún aceptados por el backend)
export type LegacyAppRole = 'ADMIN' | 'ADMIN_TENANT' | 'USER_TENANT'

// Mapa de equivalencia
export const LEGACY_TO_PLATFORM: Record<LegacyAppRole, PlatformRoleCode> = {
  'ADMIN': 'KEYGO_ADMIN',
  'ADMIN_TENANT': 'KEYGO_TENANT_ADMIN',
  'USER_TENANT': 'KEYGO_USER',
}

// Helper de normalización
export function normalizeRole(role: string): string {
  return LEGACY_TO_PLATFORM[role as LegacyAppRole] ?? role
}

// Helpers existentes actualizados
export function isAdmin(roles: string[]): boolean {
  return roles.some(r => r === 'ADMIN' || r === 'KEYGO_ADMIN' || r === 'keygo_admin')
}
```

---

## Resumen de gap

| Área | Archivos existentes | Cambios requeridos | Archivos nuevos |
|------|--------------------|--------------------|-----------------|
| Auth | `auth.ts` | Agregar claims de plataforma + union + type guard | — |
| Roles | `roles.ts` | Agregar `PlatformRoleCode`, legacy map, helpers | — |
| Users | `user.ts` | Agregar `platform_user_id` nullable | `platformUser.ts` |
| Billing | `billing.ts` | `client_app_id` nullable, `subscriber_type: 'PLATFORM'` | — |
| RBAC | — | — | `platformRole.ts`, `tenantRole.ts` |
| Dashboard | `dashboard.ts` | Posible expansión para platform dashboard | — |

---

## Convención wire format: recordatorio

Todos los tipos nuevos deben usar **snake_case** para reflejar el wire format real del backend:

```typescript
// ✅ Correcto — snake_case del wire
interface PlatformUserData {
  platform_user_id: string
  first_name: string | null
  created_at: string
}

// ❌ Incorrecto — camelCase no coincide con el backend
interface PlatformUserData {
  platformUserId: string
  firstName: string | null
  createdAt: string
}
```

Los formularios internos usan camelCase y se mapean explícitamente al enviar al backend.
