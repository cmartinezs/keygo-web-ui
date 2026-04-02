---
description: "Use when creating or modifying API clients, Axios endpoints, HTTP interceptors, or domain API modules. Covers BaseResponse, error handling, endpoint conventions, and mandatory backend contract verification."
applyTo: "src/api/**"
---

# API Client — Convenciones

## Contrato backend — fuentes de verdad

Antes de implementar o modificar cualquier llamada al backend, **siempre consultar ambas fuentes**:

| Fuente | Ruta | Cuándo usarla |
|--------|------|---------------|
| **OpenAPI v3 (JSON)** | [`docs/api-docs.json`](../../docs/api-docs.json) | Verificar método HTTP, path exacto, body/params, respuesta y códigos de error |
| **Frontend Developer Guide** | [`docs/FRONTEND_DEVELOPER_GUIDE.md`](../../docs/FRONTEND_DEVELOPER_GUIDE.md) | Entender el contexto de negocio, el rol requerido, el flujo completo y si el endpoint está disponible o pendiente |

### Reglas de sincronización

- **`docs/api-docs.json`** se actualiza cada vez que el backend publica cambios. Es la especificación oficial de contratos (paths, schemas, autenticación requerida).
- **`docs/FRONTEND_DEVELOPER_GUIDE.md`** se actualiza periódicamente reflejando el estado real del backend (endpoints disponibles, pendientes, y convenciones de negocio).
- Si hay discrepancia entre ambos documentos, **`api-docs.json` tiene prioridad** para detalles técnicos; el guide tiene prioridad para contexto de negocio y flujo por rol.
- Si un endpoint está en `api-docs.json` pero marcado `⏳ pendiente` en el guide → **usar MSW mock** hasta que el guide lo marque como disponible.

### Cómo buscar un endpoint en `api-docs.json`

```jsonc
// Estructura OpenAPI v3 — buscar en la clave "paths"
{
  "paths": {
    "/api/v1/tenants": {
      "get": {
        "tags": ["Tenants"],
        "operationId": "listTenants",
        "security": [{ "bearerAuth": [] }],
        "responses": { "200": { ... } }
      }
    }
  }
}
```

Verificar antes de implementar:
- Path exacto (con o sin `/{tenantSlug}` según el scope)
- Método HTTP correcto
- Parámetros de path/query requeridos
- Schema del body (`requestBody`)
- Schema de la respuesta exitosa
- Si requiere Bearer JWT (`security: [{ bearerAuth: [] }]`)

---

## Cliente Axios base (`src/api/client.ts`)

- Instancia única de Axios configurada con `baseURL` desde `import.meta.env.VITE_API_BASE_URL`.
- Interceptor de request: adjunta `Authorization: Bearer <accessToken>` desde `tokenStore`.
- Interceptor de response: maneja 401 → silent refresh + reintentar; otros errores → lanzar.

## Shape de respuesta — `BaseResponse<T>`

Todos los endpoints del backend devuelven:

```ts
// src/types/base.ts
interface BaseResponse<T> {
  success: boolean
  message: string
  responseCode: string
  data: T
}
```

Las funciones de API deben devolver `T` directamente, extrayendo `.data` del response:

```ts
export async function getTenants(): Promise<TenantData[]> {
  const res = await apiClient.get<BaseResponse<TenantData[]>>('/tenants')
  return res.data.data
}
```

## Módulos por dominio

| Archivo | Scope |
|---------|-------|
| `client.ts` | Instancia Axios + interceptores + constantes de URL |
| `tenants.ts` | Control Plane — solo `ADMIN` |
| `clientApps.ts` | ClientApps del tenant — `ADMIN_TENANT` |
| `users.ts` | Usuarios del tenant — `ADMIN_TENANT` |
| `memberships.ts` | Memberships y roles — `ADMIN_TENANT` |
| `userinfo.ts` | GET /userinfo — todos los roles autenticados |

## Convenciones de función

- Funciones puras que reciben parámetros tipados y devuelven una promesa.
- No mezclar lógica de UI (toasts, navigate) dentro de `src/api/` — eso va en el hook o componente.
- Prefijos de verbo: `get*`, `create*`, `update*`, `delete*`.

## Politica obligatoria de resiliencia de red

Esta politica aplica a toda llamada critica del frontend:

- Definir timeout explícito por request (base de referencia: 10s).
- Para GET críticos, permitir retry controlado con backoff fijo (base de referencia: cada 5s, máximo 3 intentos).
- Para POST/PUT/PATCH/DELETE críticos, no habilitar auto-retry mientras backend no confirme idempotencia real.
- Si existe soporte de idempotencia por header (por ejemplo `X-Idempotency-Key`), tratarlo como complemento y no como reemplazo de la validación de backend.

Esta capa define resiliencia de backend; la decisión de loader global o placeholders locales pertenece a la capa de render (página/componente).

## Convención de naming — wire format vs. TypeScript

> ⚠️ **La documentación autogenerada (`api-docs.json` y `FRONTEND_DEVELOPER_GUIDE.md`) puede mostrar nombres en camelCase. Esto es un error del generador. El backend real usa snake_case en todas las capas sin excepción.**

| Contexto | Convención | Ejemplo |
|----------|------------|---------|
| Parámetros TypeScript internos (interfaces, props, form fields) | camelCase | `emailOrUsername`, `organizationName` |
| **Claves de query params enviadas al backend** | **snake_case** | `name_like`, `client_app_id`, `code_challenge` |
| **Claves del JSON body enviado al backend** | **snake_case** | `plan_version_id`, `billing_period`, `grant_type` |
| **Claves de la respuesta recibida del backend** | **snake_case** | `access_token`, `client_app_id`, `base_price`, `metric_code` |

### Regla aplicada a los DTOs de TypeScript

Los tipos de la respuesta (`*Data` interfaces en `src/types/`) deben reflejar el nombre real del campo wire:

```ts
// ✅ Correcto — nombres en snake_case tal como vienen del backend
export interface AppPlanVersion {
  id: string
  billing_period: BillingPeriod
  base_price: number
  trial_days: number
  effective_from: string
  effective_to: string | null
}

// ❌ Incorrecto — camelCase que no coincide con el wire real
export interface AppPlanVersion {
  billingPeriod: BillingPeriod   // ← el backend envía billing_period
  basePrice: number               // ← el backend envía base_price
}
```

Los tipos de **request** (`*Request` interfaces) también usan snake_case:

```ts
// ✅ Correcto
export interface CreateContractRequest {
  plan_version_id: string
  billing_period: BillingPeriod
  contractor_email: string
}
```

Los tipos **internos de la UI** (schemas de formulario Zod, props de componentes) usan camelCase y se mapean explícitamente al enviar al backend:

```ts
// Formulario interno (camelCase)
interface ContractForm {
  planVersionId: string
  billingPeriod: BillingPeriod
}

// Al enviar al backend — convertir a snake_case
const payload: CreateContractRequest = {
  plan_version_id: form.planVersionId,
  billing_period: form.billingPeriod,
}
```

```ts
export async function createTenant(payload: CreateTenantRequest): Promise<TenantData> {
  const res = await apiClient.post<BaseResponse<TenantData>>('/tenants', payload)
  return res.data.data
}
```

## Manejo de errores

- Lanzar el error para que TanStack Query lo capture en `isError`.
- No silenciar errores con try/catch vacíos.
- Los mensajes de error del backend vienen en `BaseResponse.message` — exponer en la UI.
