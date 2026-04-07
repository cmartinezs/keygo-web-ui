# 04 — T-111 Modelo RBAC de 3 Capas: Análisis

> Implementación del modelo de autorización multi-nivel: platform → tenant → app.

---

## Resumen del modelo

T-111 agrega **4 tablas nuevas** sin modificar las existentes, completando un modelo RBAC de 3 capas:

```
┌──────────────────────────────────────────────────────────┐
│ CAPA 1: PLATAFORMA (Global)                              │
│ users → platform_user_roles → platform_roles             │
│ Ejemplos: KEYGO_ADMIN, KEYGO_ACCOUNT_ADMIN, KEYGO_USER   │
└──────────────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│ CAPA 2: TENANT (Organización)                            │
│ tenants → tenant_roles                                   │
│ tenant_users → tenant_user_roles → tenant_roles          │
│ Ejemplos: TENANT_ADMIN, EDITOR, VIEWER                   │
└──────────────────────────────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────────┐
│ CAPA 3: APP (Aplicación) [EXISTENTE ✅]                  │
│ client_apps → app_roles                                  │
│ memberships → app_role_id → app_roles                    │
│ Ejemplos: ADMIN, EDITOR, VIEWER (por app)                │
└──────────────────────────────────────────────────────────┘
```

---

## Tablas nuevas

### `platform_roles`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `code` | VARCHAR(50) UNIQUE | `KEYGO_ADMIN`, `KEYGO_ACCOUNT_ADMIN`, `KEYGO_USER` |
| `name` | VARCHAR(255) | Nombre legible |
| `description` | TEXT | Propósito del rol |
| `created_at`, `updated_at` | TIMESTAMPTZ | Automáticos |

### `platform_user_roles`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `user_id` | FK → users | Identidad global |
| `platform_role_id` | FK → platform_roles | Rol asignado |
| `assigned_at` | TIMESTAMPTZ | Fecha de asignación |
| Constraint | UNIQUE(user_id, platform_role_id) | Sin duplicados |

### `tenant_roles`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenant_id` | FK → tenants | Tenant dueño |
| `code` | VARCHAR(50) | Único dentro del tenant |
| `name` | VARCHAR(255) | |
| `description` | TEXT | |
| `active` | BOOLEAN DEFAULT true | Si se pueden asignar nuevos usuarios |
| Constraint | UNIQUE(tenant_id, code) | Codes únicos por tenant |
| Constraint | CHECK(code ~ '^[A-Z_][A-Z0-9_]*$') | Solo UPPERCASE_SNAKE |

### `tenant_user_roles`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID PK | |
| `tenant_user_id` | FK → tenant_users | Usuario en la organización |
| `tenant_role_id` | FK → tenant_roles | Rol asignado |
| `assigned_at` | TIMESTAMPTZ | Fecha de asignación |
| `removed_at` | TIMESTAMPTZ NULL | **Soft delete** para auditoría |
| Constraint | UNIQUE(tenant_user_id, tenant_role_id) WHERE removed_at IS NULL | Sin duplicados activos |

---

## Impacto en JWT

### Antes de T-111

```json
{
  "sub": "user-uuid",
  "roles": ["ADMIN"]  // Solo app roles (de memberships)
}
```

### Después de T-111 (integración fase A)

El JWT combina roles de las 3 capas:

```json
{
  "sub": "user-uuid",
  "roles": ["admin", "KEYGO_ADMIN", "TENANT_ADMIN"]
  //        ↑ app     ↑ platform     ↑ tenant
}
```

### Implicación para el frontend

El array `roles` del JWT ahora es **heterogéneo**. Los roles de cada capa tienen convenciones de naming diferentes:

| Capa | Prefijo típico | Ejemplos |
|------|---------------|----------|
| Platform | `KEYGO_*` o `keygo_*` | `KEYGO_ADMIN`, `keygo_user` |
| Tenant | Definido por tenant | `TENANT_ADMIN`, `EDITOR`, `VIEWER` |
| App | Definido por app | `ADMIN`, `EDITOR`, `VIEWER` |

**Riesgo:** Colisión de nombres entre capas (ej: `ADMIN` como app role vs `TENANT_ADMIN` como tenant role). El frontend debe usar helpers que aclaren el contexto.

---

## Endpoints de gestión de roles (Fase D de integración)

### Platform RBAC (solo KEYGO_ADMIN)

| Método | Path | Propósito |
|--------|------|-----------|
| GET | `/api/v1/platform/roles` | Listar roles de plataforma |
| POST | `/api/v1/platform/roles` | Crear rol de plataforma |
| GET | `/api/v1/platform/users/{userId}/roles` | Roles de un usuario |
| POST | `/api/v1/platform/users/{userId}/roles` | Asignar rol |
| DELETE | `/api/v1/platform/users/{userId}/roles/{code}` | Revocar rol |

### Tenant RBAC (ADMIN o ADMIN_TENANT)

| Método | Path | Propósito |
|--------|------|-----------|
| GET | `/api/v1/tenants/{slug}/roles` | Listar roles del tenant |
| POST | `/api/v1/tenants/{slug}/roles` | Crear rol del tenant |
| GET | `/api/v1/tenants/{slug}/users/{userId}/roles` | Roles de un usuario en el tenant |
| POST | `/api/v1/tenants/{slug}/users/{userId}/roles` | Asignar rol |
| DELETE | `/api/v1/tenants/{slug}/users/{userId}/roles/{id}` | Revocar rol |

---

## DTOs requeridos para el frontend

```typescript
// src/types/platformRole.ts
export interface PlatformRole {
  id: string
  code: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface PlatformUserRole {
  id: string
  user_id: string
  platform_role_id: string
  assigned_at: string
}

// src/types/tenantRole.ts
export interface TenantRole {
  id: string
  tenant_id: string
  code: string
  name: string
  description?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface TenantUserRole {
  id: string
  tenant_user_id: string
  tenant_role_id: string
  assigned_at: string
  removed_at: string | null  // null = activo
}
```

---

## Bug documentado

En `RevokeTenantRoleUseCase`, la validación usa `findByTenantId(tenantUserId)` cuando debería usar `findById(tenantRoleId)`. El fix está planificado en la Fase B de integración.

---

## Compatibilidad

| Aspecto | Estado |
|---------|--------|
| Base de datos | ✅ Zero breaking changes (solo tablas nuevas) |
| API existente | ✅ Backward compatible (endpoints existentes sin cambio) |
| JWT | ⚠️ Claim `roles` más grande (3 fuentes) — frontend debe manejar |
| Frontend types | ⚠️ 4 nuevos DTOs requeridos |
| Guards de ruta | ⚠️ Lógica de autorización más compleja |

---

## Datos seed iniciales

### Roles de plataforma

| Code | Nombre | Propósito |
|------|--------|-----------|
| `KEYGO_ADMIN` | Admin de plataforma | Acceso total |
| `KEYGO_ACCOUNT_ADMIN` | Admin de cuentas | Gestión de tenants |
| `KEYGO_USER` | Usuario básico | Acceso mínimo |

### Roles de tenant (keygo)

| Code | Nombre |
|------|--------|
| `KEYGO_ADMIN_INTERNAL` | Admin interno KeyGo |
| `KEYGO_EDITOR` | Editor KeyGo |
| `KEYGO_VIEWER` | Viewer KeyGo |

### Roles de tenant (demo)

| Code | Nombre |
|------|--------|
| `DEMO_ADMIN` | Admin del demo |
| `DEMO_USER` | Usuario del demo |
| `DEMO_VIEWER` | Viewer del demo |

---

## Propuestas futuras (post-T-111)

| Ticket | Propuesta |
|--------|-----------|
| T-107 | Renombrar roles KeyGo (`ADMIN` → `KEYGO_ADMIN`) |
| T-108 | Crear rol explícito `KEYGO_USER` |
| T-109 | Endpoint `/me/authorization` (todos los roles del usuario) |
| T-NNN | Jerarquías de roles (ADMIN hereda de EDITOR) |
| T-NNN | Sistema de permisos granulares |
