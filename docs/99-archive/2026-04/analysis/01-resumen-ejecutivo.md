# 01 — Resumen Ejecutivo

> Visión global de todos los cambios documentados y su impacto en el frontend.

---

## Panorama general

El backend de KeyGo ha completado una transformación estructural mayor que afecta tres pilares fundamentales:

1. **Identidad global** — nueva tabla `platform_users` separada de `tenant_users`.
2. **Autorización de 3 capas** — roles a nivel plataforma, tenant y app (T-111).
3. **Billing desacoplado** — contractor vinculado a `platform_user`, no a `tenant_user`.

Estos tres cambios son interdependientes y convergen en un modelo donde:

```
platform_user (identidad global)
├── platform_user_roles    → KEYGO_ADMIN, KEYGO_TENANT_ADMIN, KEYGO_USER
├── contractor             → 1:1 con platform_user (billing)
└── tenant_users (N)       → membresías por organización
    ├── tenant_user_roles  → TENANT_ADMIN, EDITOR, VIEWER (por tenant)
    └── memberships (N)    → roles por app (ADMIN, EDITOR, VIEWER)
```

---

## Cambios en el modelo de autenticación

### Antes (modelo actual del frontend)

```
keygo-ui → POST /api/v1/tenants/keygo/account/login → JWT con app roles
```

- Un solo flujo de auth vía tenant `keygo`.
- Roles del JWT provenientes de `memberships` (app roles).
- `ADMIN`, `ADMIN_TENANT`, `USER_TENANT` como únicos valores posibles.

### Después (modelo nuevo)

```
keygo-ui (contexto platform) → POST /api/v1/platform/account/login → JWT con platform roles
keygo-ui (contexto tenant)   → POST /api/v1/tenants/{slug}/account/login → JWT con app roles
```

- **Dos flujos PKCE independientes** en la misma SPA.
- JWT de plataforma: `roles: ["keygo_admin", "keygo_user"]`, sin claims de tenant.
- JWT de tenant app: `roles: ["app_role"]`, con `tenant_slug`, `aud`, `scope`.
- Backend acepta ambos formatos de roles (legacy y nuevo) durante la transición.

---

## Cambios en billing

### Antes

```
contractor → tenant_user → tenant (billing acoplado a organización)
app_plans.client_app_id NOT NULL (siempre vinculado a una app)
```

### Después

```
contractor → platform_user (identidad global, desacoplado del tenant)
app_plans.client_app_id NULLABLE:
  - NULL = plan de plataforma (KeyGo ofrece planes para usar la plataforma)
  - UUID = plan de app (tenant ofrece planes a sus usuarios)
```

**Nuevos endpoints de billing de plataforma:**
- `GET /platform/billing/catalog` (público)
- `GET /platform/billing/subscription` (KEYGO_TENANT_ADMIN)
- `POST /platform/billing/subscription/cancel`
- `GET /platform/billing/invoices`

---

## Cambios en el modelo RBAC (T-111)

4 tablas nuevas sin romper las existentes:

| Tabla nueva | Capa | Propósito |
|-------------|------|-----------|
| `platform_roles` | Global | Definición de roles de plataforma |
| `platform_user_roles` | Global | Asignación usuario→rol plataforma |
| `tenant_roles` | Organización | Definición de roles por tenant |
| `tenant_user_roles` | Organización | Asignación usuario→rol tenant (soft delete) |

**Impacto en JWT:** El claim `roles` ahora puede contener valores de las 3 capas mezclados.

---

## Impacto consolidado en el frontend

### Categoría 1: Cambios estructurales (alta prioridad)

| Área | Cambio requerido | Esfuerzo estimado |
|------|------------------|-------------------|
| `src/auth/` | Dos flujos PKCE completos (platform + tenant) | Alto |
| `src/auth/tokenStore.ts` | Distinguir tipo de sesión (platform vs tenant) | Medio |
| `src/types/roles.ts` | Nuevos roles + helpers de compatibilidad legacy | Medio |
| `src/api/client.ts` | Interceptores adaptativos según contexto de auth | Medio |
| `src/App.tsx` / `router.tsx` | Rutas de plataforma separadas de rutas tenant | Alto |

### Categoría 2: Nuevos tipos y API modules

| Área | Nuevos archivos | Contenido |
|------|-----------------|-----------|
| `src/types/` | `platformUser.ts`, `platformRole.ts`, `tenantRole.ts` | DTOs para entidades nuevas |
| `src/api/` | `platformUsers.ts`, `platformBilling.ts`, `platformAuth.ts` | Endpoints de plataforma |
| `src/auth/` | `platformRefresh.ts`, `platformLogout.ts` | Refresh y logout de plataforma |

### Categoría 3: Páginas nuevas

| Página | Ruta | Rol requerido |
|--------|------|---------------|
| `PlatformLoginPage` | `/login` (platform) | Público |
| `PlatformUsersPage` | `/admin/users` | KEYGO_ADMIN |
| Platform Billing | `/account/billing` | KEYGO_TENANT_ADMIN |

### Categoría 4: Compatibilidad y transición

- Reconocer `ADMIN` y `KEYGO_ADMIN` como equivalentes en guards.
- Manejar `client_app_id: null` en respuestas de billing.
- Mantener flujo tenant app funcional mientras se construye el platform flow.

---

## Riesgos identificados

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Dos flujos auth en una SPA sin confundir tokens | Alto | Separar stores o contextos por tipo de sesión |
| Roles legacy vs nuevos en guards | Medio | Helper `isAdmin()` que reconozca ambos formatos |
| `client_app_id: null` rompe asunciones de billing | Medio | Guards de tipo en DTOs + discriminador explícito |
| Migración de rutas existentes | Medio | Feature flags o rutas paralelas durante transición |
| Documentación desincronizada | Bajo | Sincronizar BACKLOG y FUNCTIONAL_GUIDE post-merge |

---

## Dependencias cruzadas

```
T-111 (RBAC 3 capas) ←── depende de ──→ RFC Restructure (platform_users)
         ↑                                        ↑
         │                                        │
RFC Billing (contractor) ─── depende de ──→ RFC Restructure (platform_users)
         │
         └── Auth Flow (dual PKCE) depende de → RFC Restructure (platform auth endpoints)
```

**Conclusión:** RFC Restructure Multitenant es el cambio fundacional. T-111 y RFC Billing son extensiones que dependen de la existencia de `platform_users`.
