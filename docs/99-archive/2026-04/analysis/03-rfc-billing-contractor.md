# 03 — RFC Billing Contractor Refactor: Análisis

> Separación de la identidad del contractor del modelo tenant. Billing en dos niveles: plataforma y app.

---

## Cambio central

La identidad del **contractor** (quien contrata un plan) se desacopla completamente del **tenant**:

```
ANTES:  contractor.tenant_user_id → tenant_users → tenants
DESPUÉS: contractor.platform_user_id → platform_users (identidad global)
```

Esto permite que un contractor exista antes de tener un tenant, y que el billing opere a nivel de plataforma (KeyGo ofrece planes) o a nivel de app (un tenant ofrece planes a sus usuarios).

---

## Migración V30: Cambios de schema

| Cambio | Tabla | Impacto |
|--------|-------|---------|
| Agregar `platform_user_id` (NOT NULL, UNIQUE) | `contractors` | FK a `platform_users` |
| Eliminar `tenant_user_id` | `contractors` | Rompe acoplamiento con tenant |
| `client_app_id` → NULLABLE | `app_plans` | NULL = plan de plataforma |
| `client_app_id` → NULLABLE | `app_contracts` | NULL = contrato de plataforma |
| `client_app_id` → NULLABLE | `app_subscriptions` | NULL = suscripción de plataforma |
| Nuevo valor enum `PLATFORM` | `app_plans.subscriber_type` | Discriminador de nivel |

### Regla discriminadora para el frontend

```typescript
// Determinar si es plan de plataforma o de app
function isPlatformPlan(plan: AppPlan): boolean {
  return plan.client_app_id === null
}

function isAppPlan(plan: AppPlan): boolean {
  return plan.client_app_id !== null
}
```

---

## Nuevos endpoints de billing de plataforma

| Endpoint | Método | Auth | Propósito |
|----------|--------|------|-----------|
| `/api/v1/platform/billing/catalog` | GET | Público | Listar planes de plataforma |
| `/api/v1/platform/billing/catalog/{planCode}` | GET | Público | Detalle de plan |
| `/api/v1/platform/billing/subscription` | GET | Bearer (KEYGO_TENANT_ADMIN) | Suscripción activa del contractor |
| `/api/v1/platform/billing/subscription/cancel` | POST | Bearer (KEYGO_TENANT_ADMIN) | Cancelar al final del período |
| `/api/v1/platform/billing/invoices` | GET | Bearer (KEYGO_TENANT_ADMIN) | Facturas del contractor |

### Nuevo módulo API requerido

```typescript
// src/api/platformBilling.ts
export async function getPlatformCatalog(): Promise<AppPlan[]>
export async function getPlatformPlan(planCode: string): Promise<AppPlan>
export async function getPlatformSubscription(): Promise<AppSubscription>
export async function cancelPlatformSubscription(): Promise<AppSubscription>
export async function getPlatformInvoices(): Promise<Invoice[]>
```

---

## Impacto en el flujo de verificación de email (contrato)

### Antes (flujo actual)

```
1. Crear contrato → contractor.tenant_user_id
2. Verificar email → crear TenantUser en tenant proveedor
3.                  → crear Membership + AppRole ADMIN_TENANT
4.                  → crear Contractor(tenantUserId)
```

### Después (flujo nuevo)

```
1. Crear contrato → contractor.platform_user_id
2. Verificar email → crear PlatformUser (identidad global)
3.                  → asignar KEYGO_USER (automático, primera vez)
4.                  → asignar KEYGO_TENANT_ADMIN (siempre)
5.                  → crear Contractor(platformUserId)
```

### Implicación para el frontend

El endpoint de verificación no cambia (`POST /billing/contracts/{id}/verify-email`), pero:

- La respuesta ahora referencia un `platform_user` en lugar de un `tenant_user`.
- El usuario verificado recibe credenciales temporales por email para hacer login de **plataforma** (no de tenant).
- Post-activación, el contractor puede crear su primer workspace (tenant).

---

## Cambio en CreateContractRequest

```typescript
// ANTES
interface CreateContractRequest {
  client_app_id: string      // obligatorio
  plan_version_id: string
  // ...
}

// DESPUÉS
interface CreateContractRequest {
  client_app_id: string | null  // null = contrato de plataforma
  plan_version_id: string
  // ...
}
```

---

## Seguridad

- El catálogo de plataforma es **público** (sin auth) — equivalente al catálogo de app.
- Los endpoints de gestión de suscripción requieren `KEYGO_TENANT_ADMIN` (no `ADMIN_TENANT`).
- La identidad del contractor se resuelve desde el JWT (`platform_user_id` en el claim `sub`).
- `BootstrapAdminKeyFilter` necesita nuevas rutas públicas para `/platform/billing/catalog*`.

---

## Impacto en tipos existentes del frontend

### Tipos que necesitan actualización

| Tipo actual | Campo afectado | Cambio |
|-------------|---------------|--------|
| `BillingContractData` | `client_app_id` | Ahora nullable |
| `AppPlanData` | `client_app_id` | Ahora nullable |
| `AppPlanData` | `subscriber_type` | Agregar valor `'PLATFORM'` |
| `AppSubscriptionData` | `client_app_id` | Ahora nullable |
| `ContractorData` | `tenant_user_id` → `platform_user_id` | Renombrar campo |

### Tipos nuevos requeridos

```typescript
// Extensión del enum
type SubscriberType = 'TENANT' | 'TENANT_USER' | 'PLATFORM'

// Discriminated union pattern (opcional pero recomendado)
type PlatformBillingContext = {
  type: 'platform'
  client_app_id: null
}

type AppBillingContext = {
  type: 'app'
  client_app_id: string
}

type BillingContext = PlatformBillingContext | AppBillingContext
```

---

## Breaking changes para el frontend

| Cambio | Riesgo | Mitigación |
|--------|--------|------------|
| `client_app_id` nullable en billing responses | Medio — puede romper asunciones de non-null | Type guards + actualizar DTOs |
| `contractor.tenant_user_id` eliminado | Bajo — el frontend no consumía este campo directamente | Actualizar tipo si existe |
| Verificación de email crea PlatformUser (no TenantUser) | Medio — el flujo post-verificación cambia | Ajustar redirect post-verificación |
| Nuevos endpoints `/platform/billing/*` | Bajo — son aditivos | Crear nuevo módulo API |

---

## Observaciones

1. **El catálogo de la landing page** (`PricingSection.tsx`) actualmente consume el catálogo de billing por app. Habrá que decidir si mostrar planes de plataforma, de app, o ambos.
2. **El wizard de registro** (`NewContractPage.tsx`) necesita soportar `client_app_id: null` para contratos de plataforma.
3. **Los response codes son nuevos** (`PLATFORM_PLAN_CATALOG_RETRIEVED`, etc.) — el error normalizer debe reconocerlos.
4. **Reutilización de DTOs**: El RFC indica que los DTOs existentes (`AppPlanData`, `AppSubscriptionData`, etc.) se reutilizan en los nuevos endpoints. Solo cambia la semántica del `client_app_id`.
