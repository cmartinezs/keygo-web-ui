# 05 — RFC Restructure Multitenant: Análisis

> Reestructuración fundamental: `platform_users`, dos flujos de auth, migración de sesiones.

---

## Naturaleza del RFC

Este RFC es **prescriptivo**, no exploratorio. Define **una sola arquitectura recomendada** con implementación por fases (A–H). No propone 4 enfoques alternativos, sino que describe:

1. **Un modelo de datos** con `platform_users` como identidad global.
2. **Dos flujos de autenticación** independientes (platform y tenant app).
3. **Dos fuentes de roles** en JWT según el contexto.
4. **Una decisión MVP** (Option A: mantener tenant `keygo` para signing keys).

La "separación de vistas por perfil" que mencionas se materializa como la separación de **contextos de autenticación**, no como enfoques alternativos de UI.

---

## Principios arquitectónicos

### 1. Identidad global → Membresía en tenant → Acceso a app

```
platform_user (identidad global, una por persona)
    ├── platform_user_roles (KEYGO_ADMIN, KEYGO_USER, ...)
    ├── contractor (1:1 opcional, para billing)
    └── tenant_users (N, membresía en organizaciones)
        ├── tenant_user_roles (TENANT_ADMIN, EDITOR, ...)
        └── memberships (N, acceso a apps)
            └── app_roles (ADMIN, EDITOR, ...)
```

### 2. Dos flujos de auth completamente separados

| Aspecto | Platform Auth | Tenant App Auth |
|---------|--------------|-----------------|
| Endpoint | `/api/v1/platform/account/login` | `/api/v1/tenants/{slug}/account/login` |
| Tabla de identidad | `platform_users` | `tenant_users` |
| Roles en JWT | De `platform_user_roles` | De `memberships` (app roles) |
| Claims del JWT | `sub`, `email`, `roles`, `type` | `sub`, `email`, `roles`, `tenant_slug`, `aud`, `scope`, `iss` |
| PKCE | Sí (primario) + direct-login (API/CLI) | Sí (obligatorio) |
| Refresh | `/platform/oauth2/token` | `/tenants/{slug}/oauth2/token` |
| Revoke | `/platform/oauth2/revoke` | `/tenants/{slug}/oauth2/revoke` |

**Regla crítica:** Los roles de plataforma NO aparecen en el JWT de tenant app y viceversa. Cada token es específico de su contexto.

### 3. Sesiones unificadas

La tabla `sessions` se refactoriza:

```
sessions (ANTES):   tenant_user_id NOT NULL, client_app_id NOT NULL
sessions (DESPUÉS): platform_user_id NULLABLE (MVP), client_app_id NULLABLE
```

- `client_app_id = NULL` → sesión de plataforma
- `client_app_id = UUID` → sesión de tenant app
- `platform_user_id` nullable en MVP para no romper sesiones existentes de tenant-only users

### 4. MVP progresivo con nullable

- `sessions.platform_user_id` es nullable inicialmente.
- Post-MVP: migrar todos los `tenant_users` para que tengan `platform_user_id`, luego hacer NOT NULL.
- `tenant_users.platform_user_id` es FK opcional que vincula identidad de tenant con identidad global.

### 5. Asignación automática de roles de plataforma

| Evento | Rol asignado automáticamente |
|--------|------------------------------|
| Crear `platform_user` | `KEYGO_USER` |
| Verificar email de contrato | `KEYGO_TENANT_ADMIN` |
| Asignación manual | `KEYGO_ADMIN` (solo por otro admin) |

---

## Fases de implementación (backend)

### Fase A: Modelo de datos (Migraciones V27–V29)

**V27 — tabla `platform_users`:**
```sql
CREATE TABLE platform_users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**V28 — Sesiones + corrección de `platform_user_roles`:**
- `sessions` agrega `platform_user_id` (nullable).
- `platform_user_roles` corrige FK: `user_id` → `platform_user_id` (FK a `platform_users`, no a `users`).
- `tenant_users` agrega `platform_user_id` (nullable) para vinculación futura.

**V29 — Seed + Rename:**
- 4 `platform_users` seed: `admin`, `tenant-admin`, `user`, `contractor`.
- Asignación de roles: `keygo_admin → KEYGO_ADMIN`, `tenant-admin → KEYGO_TENANT_ADMIN`, etc.
- Vinculación `tenant_users.platform_user_id` para usuarios existentes.

### Fase B: Dominio y puertos

Nuevas entidades, ports, adapters y use cases para `PlatformUser`, `PlatformSession`, etc.

### Fase C: Flujo de autenticación de plataforma

Nuevo `PlatformAuthController` con endpoints de login, token, revoke, sessions.

### Fase D: Simplificación de auth de tenant app

`AuthorizationController` existente se adapta para incluir `platform_user_id` en sesiones.

### Fase E: RBAC en JWT — integración multicapa

Bifurcación del `RotateRefreshTokenUseCase`: si `client_app_id = NULL` → roles de plataforma; si UUID → roles de memberships.

### Fase F: Rename y seeds

Renombrar roles internos y actualizar seeds con UUIDs estables.

### Fase G: API de gestión de platform users

Endpoints admin-only + self-service para `platform_users`.

### Fase H: Documentación y cierre

---

## Cómo impacta al frontend: los dos contextos

### Contexto 1: KeyGo UI como plataforma

```
Rutas:
  /login                    → PlatformLoginPage
  /dashboard               → Platform dashboard (KEYGO_ADMIN)
  /admin/users             → Platform users management
  /admin/users/:id/roles   → Platform role assignment
  /account/me              → Platform profile
  /account/sessions        → Platform sessions
  /account/change-password → Platform password change
```

- Login vía `/platform/account/login`
- JWT sin claims de tenant
- Roles: `KEYGO_ADMIN`, `KEYGO_TENANT_ADMIN`, `KEYGO_USER`

### Contexto 2: KeyGo UI como hosted login

```
Rutas:
  /tenants/:slug/login     → Tenant app login
  /tenants/:slug/dashboard → Tenant dashboard
  /tenants/:slug/users     → Tenant user management (ADMIN_TENANT)
```

- Login vía `/tenants/{slug}/account/login`
- JWT con `tenant_slug`, `aud`, `scope`
- Roles: los del app (vía memberships)

### Separación en la SPA

La clave es que **no son 4 enfoques para elegir**, sino **dos modos de operación coexistentes** en la misma SPA. La SPA necesita:

1. **Detectar el contexto** al inicio (¿platform login o tenant login?).
2. **Seleccionar el stack de auth** correspondiente.
3. **Renderizar el layout** adecuado según los roles del JWT.
4. **Enrutar** a la sección correcta.

### Arquitectura sugerida para la SPA

```typescript
// Estado global
interface AuthState {
  context: 'platform' | 'tenant' | null
  accessToken: string | null
  refreshToken: string | null
  platformUserId: string | null
  tenantSlug: string | null
  roles: string[]
}

// Rutas
<Routes>
  {/* Rutas públicas */}
  <Route path="/login" element={<PlatformLoginPage />} />
  <Route path="/tenants/:slug/login" element={<TenantLoginPage />} />

  {/* Rutas de plataforma */}
  <Route element={<PlatformGuard />}>
    <Route element={<PlatformLayout />}>
      <Route path="/dashboard" element={<PlatformDashboard />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/account/*" element={<AccountRoutes />} />
    </Route>
  </Route>

  {/* Rutas de tenant */}
  <Route element={<TenantGuard />}>
    <Route element={<TenantLayout />}>
      <Route path="/tenants/:slug/*" element={<TenantRoutes />} />
    </Route>
  </Route>
</Routes>
```

---

## Decisión MVP: mantener tenant `keygo`

El RFC decide **no eliminar** el tenant `keygo` porque:

- Las signing keys pertenecen al tenant `keygo`.
- La migración de signing keys a plataforma es trabajo futuro.
- El platform auth no depende del tenant `keygo` para funcionar.

**Impacto frontend:** Ninguno directo. El frontend usará endpoints `/platform/...` sin referencia a `keygo` como tenant.

---

## Antes vs después

| Aspecto | Antes | Después |
|---------|-------|---------|
| Identidad de plataforma | Mezclada con tenant `keygo` | Tabla `platform_users` separada |
| Login de plataforma | `/tenants/keygo/account/login` | `/platform/account/login` |
| Sesiones FK | `tenant_user_id` | `platform_user_id` + `client_app_id` nullable |
| Roles en JWT plataforma | N/A | De `platform_user_roles` |
| Roles en JWT tenant | De `memberships` | De `memberships` (sin cambio) |
| Vinculación tenant↔platform | Ninguna | `tenant_users.platform_user_id` (nullable) |
| Migraciones | V24–V26 (T-111) | V27–V29 (este RFC) |
