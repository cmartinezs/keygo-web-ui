# RFC Restructure-Multitenant — Plan de Implementación

> **Audiencia:** Agente AI y desarrolladores que implementarán este plan.  
> **Origen:** RFC `docs/rfc/restructure-multitenant/` (documentos 00–10).  
> **Prerrequisito:** T-111 CRUD completado (V24–V26 migraciones, use cases CRUD de platform/tenant roles).

---

## Propósito

Este plan implementa las decisiones arquitectónicas del RFC `restructure-multitenant`, específicamente las partes que aún no están implementadas tras T-111:

1. **`platform_users` como entidad global de identidad** — separada de `tenant_users`.
2. **Flujo de autenticación de plataforma separado** — KeyGo UI no usa `tenants/{slug}/oauth2/...`.
3. **`sessions` refactorizada** — apunta a `platform_users` (no `tenant_users`), con `client_app_id` nullable para distinguir sesión de plataforma vs. sesión de app.
4. **RBAC de plataforma en JWT** — el token de plataforma lleva `platform_roles`, el token de app lleva `membership roles`.
5. **Rename de `KEYGO_ACCOUNT_ADMIN` → `KEYGO_TENANT_ADMIN`**.

---

## Principios de diseño

### Principio 1: identidad global, pertenencia por tenant, acceso por app

```
platform_users    ← identidad global (email, contraseña, perfil base)
  └─ tenant_users ← presencia en un tenant (FK platform_user_id → platform_users)
       └─ memberships ← acceso a una app (FK tenant_user_id → tenant_users)
            └─ membership_roles ← roles en la app
  └─ platform_user_roles ← roles de plataforma (FK platform_user_id → platform_users)
  └─ sessions     ← sesión (FK platform_user_id → platform_users, client_app_id nullable)
```

### Principio 2: dos flujos de autenticación distintos

| Flujo | Endpoint | Usuario | JWT roles |
|---|---|---|---|
| **Plataforma** | `POST /api/v1/platform/oauth2/token` | `platform_users` | Desde `platform_user_roles` |
| **App de tenant** | `POST /api/v1/tenants/{slug}/oauth2/token` | `tenant_users` + memberships | Desde `memberships`/`app_roles` |

### Principio 3: sesiones unificadas

La tabla `sessions` referencia `platform_users` siempre. `client_app_id` nullable:
- `client_app_id = NULL` → sesión de plataforma (KeyGo UI)
- `client_app_id = UUID` → sesión de app de tenant

### Principio 4: MVP progresivo

Para MVP, `tenant_users` puede crearse independientemente (sin `platform_user_id` si el usuario se auto-registra en una app). La vinculación de `tenant_users → platform_users` se hará cuando el usuario también tenga una cuenta de plataforma (fase de migración futura).

### Principio 5: asignación de roles de plataforma por evento de negocio

Los roles de plataforma se asignan automáticamente según eventos concretos, no manualmente (salvo `KEYGO_ADMIN`):

| Rol | Evento de asignación |
|---|---|
| `KEYGO_USER` | Creación de `platform_user` (siempre, rol base) |
| `KEYGO_TENANT_ADMIN` | Activación de contrato de billing (`ActivateAppContractUseCase`) |
| `KEYGO_ADMIN` | Asignación manual por un `KEYGO_ADMIN` existente (solo operadores internos) |

---

## Fases del plan

| Fase | Documento | Contenido | Migración Flyway |
|---|---|---|---|
| A | `02-modelo-datos.md` | Nueva tabla `platform_users`, refactorización `sessions`, actualización `platform_user_roles` | V27, V28 |
| B | `03-dominio-y-puertos.md` | Nuevo dominio `PlatformUser`, puertos, adapters | — |
| C | `04-flujo-platform-auth.md` | Nuevos endpoints `/api/v1/platform/oauth2/...` | — |
| D | `05-flujo-tenant-auth.md` | Simplificación `tenants/{slug}/oauth2/...` (solo membership roles) | — |
| E | `06-rbac-jwt.md` | JWT multicapa: plataforma vs. app | — |
| F | `07-rename-y-seeds.md` | Rename `KEYGO_ACCOUNT_ADMIN→KEYGO_TENANT_ADMIN`, seeds, `platform_users` seed | V29 |
| G | `08-api-gestion.md` | REST endpoints para gestión de `platform_users` | — |
| H | `09-documentacion.md` | Actualización de docs AI, Postman, frontend guide | — |

---

## Orden de ejecución recomendado

```
A (modelo datos) → B (dominio) → C (platform auth) → D (simplificar tenant auth) 
    → E (RBAC JWT) → F (rename/seeds) → G (API gestión) → H (docs)
```

Razón: el modelo de datos es la base de todo; el dominio habilita los use cases; la auth de plataforma es la capacidad más crítica; la simplificación del tenant auth es necesaria para coherencia; el RBAC finaliza la integración; el rename es la última limpieza; la API de gestión es la capa de control.

---

## Impacto en código existente

### Artefactos creados por T-111 que necesitan actualización

| Artefacto | Cambio requerido |
|---|---|
| `PlatformUserRoleEntity.tenantUser` (FK → `tenant_users`) | → `platformUser` (FK → `platform_users`) |
| `PlatformUserRoleRepositoryAdapter` | Adaptar a `PlatformUserEntity` |
| `AssignPlatformRoleUseCase`, `RevokePlatformRoleUseCase` | Cambiar tipo de user ID |
| `platform_user_roles` tabla (V24) | FK cambia de `tenant_users` a `platform_users` |

### Artefactos de auth que cambian

| Artefacto | Cambio requerido |
|---|---|
| `SessionEntity` | `tenant_user_id` → `platform_user_id`; `client_app_id` nullable; `tenant_id` eliminado |
| `RefreshTokenEntity` | Actualizar FK de sesión; quitar `tenant_user_id` |
| `AuthorizationController` | Solo para tenant apps; platform auth en controller nuevo |
| `RotateRefreshTokenUseCase` | Adaptar a nuevo modelo de sesión |
| `OpenSessionUseCase` | Adaptar a `platform_user_id` en sessions |

---

## Estado inicial de migraciones

Las migraciones V24–V26 (T-111) crearon:
- `platform_roles` — roles de plataforma (V24)
- `platform_user_roles.tenant_user_id` FK a `tenant_users` — **incorrecto, se corregirá** (V24/V28)
- `tenant_roles`, `tenant_user_roles` — roles de tenant (V25)
- Seed de roles de plataforma y tenant (V26)

La próxima migración libre es **V27**.

---

## Resumen de tablas al finalizar

| Tabla | Estado | Notas |
|---|---|---|
| `platform_users` | NUEVA (V27) | Global user identity |
| `platform_roles` | Existente (V24) | Sin cambio (solo rename en V29) |
| `platform_user_roles` | Modificada (V28) | FK cambia: `tenant_user_id` → `platform_user_id` |
| `tenant_users` | Modificada (V28) | Agregar `platform_user_id` nullable FK |
| `sessions` | Modificada (V28) | `platform_user_id` NOT NULL, `client_app_id` nullable, quitar `tenant_user_id` y `tenant_id` |
| `refresh_tokens` | Modificada (V28) | Quitar `tenant_user_id`, `tenant_id`; mantener `session_id`, `client_app_id` |
| `tenant_roles` | Existente (V25) | Sin cambio |
| `tenant_user_roles` | Existente (V25) | Sin cambio |
