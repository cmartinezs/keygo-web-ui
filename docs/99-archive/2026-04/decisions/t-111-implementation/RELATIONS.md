# T-111: Relaciones Completamente Mapeadas

## Propósito
Clarificar la estructura **completa** de relaciones entre:
- Tablas **existentes** (no modificadas)
- Tablas **nuevas** (T-111)
- Cómo se conectan las 3 capas de RBAC

---

## Vista de Diagrama Jerárquico

```
┌─────────────────────────────────────────────────────────────────────┐
│  USUARIOS GLOBALES                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ users                                                       │   │
│  │ ├── id (PK)                                                 │   │
│  │ ├── email UNIQUE                                            │   │
│  │ └── ...                                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         ↓                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ platform_user_roles (NUEVA — T-111)                        │   │
│  │ ├── id (PK)                                                 │   │
│  │ ├── user_id (FK → users)                                   │   │
│  │ ├── platform_role_id (FK → platform_roles)                 │   │
│  │ └── assigned_at                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         ↓                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ platform_roles (NUEVA — T-111)                             │   │
│  │ ├── id (PK)                                                 │   │
│  │ ├── code UNIQUE (KEYGO_ADMIN, KEYGO_ACCOUNT_ADMIN, etc.)  │   │
│  │ ├── name                                                    │   │
│  │ └── description                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

         ↓ (cada usuario global puede participar en)

┌─────────────────────────────────────────────────────────────────────┐
│  USUARIOS POR TENANT (Organizaciones)                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ tenants                                                     │   │
│  │ ├── id (PK)                                                 │   │
│  │ ├── slug UNIQUE (acme, demo, keygo)                         │   │
│  │ └── ...                                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         ↓                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ tenant_users (EXISTENTE ✅)                                │   │
│  │ ├── id (PK)                                                 │   │
│  │ ├── user_id (FK → users)                      ←─┐           │   │
│  │ ├── tenant_id (FK → tenants)                   │ (mismo user│   │
│  │ ├── email (copia, normalmente)                 │  puede     │   │
│  │ └── status (ACTIVE, PENDING, SUSPENDED)        │  pertenecer│   │
│  └─────────────────────────────────────────────────┼──────────┤   │
│         ↓                                          │ a N       │   │
│  ┌─────────────────────────────────────────────────┼──tenants) │   │
│  │ tenant_user_roles (NUEVA — T-111)              │           │   │
│  │ ├── id (PK)                                     │           │   │
│  │ ├── tenant_user_id (FK → tenant_users)          │           │   │
│  │ ├── tenant_role_id (FK → tenant_roles)         │           │   │
│  │ ├── assigned_at                                 │           │   │
│  │ └── removed_at (soft delete)                   │           │   │
│  └─────────────────────────────────────────────────┘           │   │
│         ↓                                                       │   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ tenant_roles (NUEVA — T-111)                               │   │
│  │ ├── id (PK)                                                 │   │
│  │ ├── tenant_id (FK → tenants)                                │   │
│  │ ├── code UNIQUE+tenant_id (TENANT_ADMIN, EDITOR, VIEWER)   │   │
│  │ ├── name                                                    │   │
│  │ ├── description                                             │   │
│  │ └── active (boolean)                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

         ↓ (cada tenant user puede acceder a)

┌─────────────────────────────────────────────────────────────────────┐
│  APLICACIONES POR TENANT                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ client_apps (EXISTENTE ✅)                                 │   │
│  │ ├── id (PK)                                                 │   │
│  │ ├── client_id UNIQUE (keygo-ui, my-app, etc.)             │   │
│  │ ├── tenant_id (FK → tenants)                                │   │
│  │ └── ...                                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         ↓                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ memberships (EXISTENTE ✅)                                 │   │
│  │ ├── id (PK)                                                 │   │
│  │ ├── tenant_user_id (FK → tenant_users)                      │   │
│  │ ├── client_app_id (FK → client_apps)                        │   │
│  │ ├── status (ACTIVE, PENDING, SUSPENDED)                     │   │
│  │ └── ...                                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         ↓                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ membership_roles o app_role_id (EXISTENTE ✅)              │   │
│  │ ├── membership_id (FK → memberships)                        │   │
│  │ └── app_role_id (FK → app_roles)                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│         ↓                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ app_roles (EXISTENTE ✅)                                   │   │
│  │ ├── id (PK)                                                 │   │
│  │ ├── client_app_id (FK → client_apps)                        │   │
│  │ ├── code UNIQUE+app_id (ADMIN, EDITOR, VIEWER)             │   │
│  │ ├── name                                                    │   │
│  │ └── ...                                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tabla de Conectividad Completa

| Tabla Origen | Tabla Destino | Relación | Tipo FK | Cardinalidad | ¿Existente? | ¿Afectada? |
|---|---|---|---|---|---|---|
| `users` | `platform_user_roles` | 1:N | user_id | 1U → NP | ❌ NEW | — |
| `platform_user_roles` | `platform_roles` | N:1 | platform_role_id | NP → 1PR | ❌ NEW | — |
| `users` | `tenant_users` | 1:N | user_id | 1U → NTU | ✅ YES | ❌ NO |
| `tenants` | `tenant_users` | 1:N | tenant_id | 1T → NTU | ✅ YES | ❌ NO |
| `tenants` | `tenant_roles` | 1:N | tenant_id | 1T → NTR | ❌ NEW | — |
| `tenant_users` | `tenant_user_roles` | 1:N | tenant_user_id | 1TU → NTUR | ❌ NEW | — |
| `tenant_user_roles` | `tenant_roles` | N:1 | tenant_role_id | NTUR → 1TR | ❌ NEW | — |
| `tenants` | `client_apps` | 1:N | tenant_id | 1T → NCA | ✅ YES | ❌ NO |
| `tenant_users` | `memberships` | 1:N | tenant_user_id | 1TU → NM | ✅ YES | ❌ NO |
| `client_apps` | `memberships` | 1:N | client_app_id | 1CA → NM | ✅ YES | ❌ NO |
| `client_apps` | `app_roles` | 1:N | client_app_id | 1CA → NAR | ✅ YES | ❌ NO |
| `memberships` | `app_roles` | N:N | (via membership_roles o app_role_id) | NM → NAR | ✅ YES | ❌ NO |

**Leyenda:**
- U = User
- PR = PlatformRole
- T = Tenant
- TU = TenantUser
- TUR = TenantUserRole
- TR = TenantRole
- CA = ClientApp
- M = Membership
- AR = AppRole

---

## Consultas SQL por Capas

### Capa 1: Roles de Plataforma
```sql
-- ¿Qué roles de plataforma tiene un usuario?
SELECT pr.code, pr.name
FROM platform_user_roles pur
JOIN platform_roles pr ON pr.id = pur.platform_role_id
WHERE pur.user_id = $1;

-- ¿Es un usuario KEYGO_ADMIN?
SELECT 1 FROM platform_user_roles pur
JOIN platform_roles pr ON pr.id = pur.platform_role_id
WHERE pur.user_id = $1 AND pr.code = 'KEYGO_ADMIN';
```

### Capa 2: Roles de Tenant
```sql
-- ¿Qué roles tiene un TenantUser en su tenant?
SELECT tr.code, tr.name
FROM tenant_user_roles tur
JOIN tenant_roles tr ON tr.id = tur.tenant_role_id
WHERE tur.tenant_user_id = $1 AND tur.removed_at IS NULL;

-- ¿Qué usuarios de un tenant tienen rol TENANT_ADMIN?
SELECT tu.user_id, tu.email
FROM tenant_users tu
JOIN tenant_user_roles tur ON tur.tenant_user_id = tu.id
JOIN tenant_roles tr ON tr.id = tur.tenant_role_id
WHERE tu.tenant_id = $1 AND tr.code = 'TENANT_ADMIN' AND tur.removed_at IS NULL;
```

### Capa 3: Roles de App
```sql
-- ¿Qué apps puede acceder un TenantUser?
SELECT DISTINCT ca.id, ca.client_id, ca.name
FROM memberships m
JOIN client_apps ca ON ca.id = m.client_app_id
WHERE m.tenant_user_id = $1 AND m.status = 'ACTIVE';

-- ¿Qué roles tiene un usuario en una app específica?
SELECT DISTINCT ar.code, ar.name
FROM memberships m
JOIN membership_roles mr ON mr.membership_id = m.id
JOIN app_roles ar ON ar.id = mr.app_role_id
WHERE m.tenant_user_id = $1 AND m.client_app_id = $2 AND m.status = 'ACTIVE';
```

### Consulta Consolidada: Autorización Completa
```sql
-- ¿Qué puede hacer un usuario (email) en una app específica (client_id) en un tenant (slug)?
WITH user_cte AS (
    SELECT u.id FROM users u WHERE u.email = $1
),
platform_roles_cte AS (
    SELECT ARRAY_AGG(pr.code) AS roles
    FROM platform_user_roles pur
    JOIN platform_roles pr ON pr.id = pur.platform_role_id
    WHERE pur.user_id = (SELECT id FROM user_cte)
),
tenant_cte AS (
    SELECT t.id FROM tenants t WHERE t.slug = $2
),
tenant_user_cte AS (
    SELECT tu.id FROM tenant_users tu
    WHERE tu.user_id = (SELECT id FROM user_cte)
    AND tu.tenant_id = (SELECT id FROM tenant_cte)
),
tenant_roles_cte AS (
    SELECT ARRAY_AGG(tr.code) AS roles
    FROM tenant_user_roles tur
    JOIN tenant_roles tr ON tr.id = tur.tenant_role_id
    WHERE tur.tenant_user_id = (SELECT id FROM tenant_user_cte)
    AND tur.removed_at IS NULL
),
app_roles_cte AS (
    SELECT ARRAY_AGG(ar.code) AS roles
    FROM memberships m
    JOIN membership_roles mr ON mr.membership_id = m.id
    JOIN app_roles ar ON ar.id = mr.app_role_id
    JOIN client_apps ca ON ca.id = m.client_app_id
    WHERE m.tenant_user_id = (SELECT id FROM tenant_user_cte)
    AND ca.client_id = $3
    AND m.status = 'ACTIVE'
)
SELECT
    COALESCE((SELECT roles FROM platform_roles_cte), ARRAY[]::TEXT[]) AS platform_roles,
    COALESCE((SELECT roles FROM tenant_roles_cte), ARRAY[]::TEXT[]) AS tenant_roles,
    COALESCE((SELECT roles FROM app_roles_cte), ARRAY[]::TEXT[]) AS app_roles;
```

---

## Matriz de Cambios en Esquema

| Tabla | Columnas | FKs | Índices | ¿Cambio? |
|---|---|---|---|---|
| users | — | — | — | ❌ NO |
| tenants | — | — | — | ❌ NO |
| tenant_users | — | — | — | ❌ NO |
| client_apps | — | — | — | ❌ NO |
| memberships | — | — | — | ❌ NO |
| app_roles | — | — | — | ❌ NO |
| **platform_roles** | 5 (id, code, name, desc, timestamps) | 0 | 1 (UNIQUE code) | 🆕 NEW |
| **platform_user_roles** | 5 (id, user_id, role_id, assigned_at, timestamps) | 2 (user_id, platform_role_id) | 3 (user_id, role_id, UNIQUE pair) | 🆕 NEW |
| **tenant_roles** | 7 (id, tenant_id, code, name, desc, active, timestamps) | 1 (tenant_id) | 3 (tenant_id, tenant+code, active) | 🆕 NEW |
| **tenant_user_roles** | 6 (id, tu_id, tr_id, assigned_at, removed_at, timestamps) | 2 (tenant_user_id, tenant_role_id) | 4 (tenant_user_id, tenant_role_id, UNIQUE active, removed_at) | 🆕 NEW |

**Total de cambios:** 0 modificaciones + 4 tablas nuevas = **Cambio backwards-compatible ✅**

---

## Resumen: Integridad Transaccional

La estructura propuesta garantiza:

1. **Sin rupturas de FK:** Tablas existentes no se modifican
2. **Aislamiento de capas:** Cada capa de RBAC es independiente
3. **Trazabilidad:** Campos `assigned_at`, `removed_at`, `updated_at` en todas partes
4. **Sin cascadas peligrosas:** `ON DELETE RESTRICT` en tenant_role_id (proteger roles), `CASCADE` en user_id (limpiar si usuario se elimina)
5. **Soft deletes en tenant:** `removed_at IS NULL` para auditoría

**Todos los cambios son seguros y reversibles si es necesario.**
