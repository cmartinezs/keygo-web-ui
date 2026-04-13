# Fase F — Rename y Seeds: platform_users seed + KEYGO_TENANT_ADMIN

> Instrucciones para renombrar `keygo_account_admin` → `keygo_tenant_admin` y crear los seeds
> de `platform_users` que reemplazan a los `tenant_users` del tenant `keygo` para el acceso de plataforma.

---

## F1. Migración V29 — Rename de rol de plataforma + seed de platform_users

**Archivo a crear:** `keygo-supabase/src/main/resources/db/migration/V29__platform_users_seed_and_role_rename.sql`

```sql
-- =============================================================================
-- V29: platform_users seed + rename keygo_account_admin → keygo_tenant_admin
-- Parte del RFC restructure-multitenant.
-- Los platform_users reemplazan el uso de tenant_users del tenant 'keygo'
-- para el acceso de plataforma (KeyGo UI login).
-- =============================================================================

-- ─── Paso 1: Rename keygo_account_admin → keygo_tenant_admin ─────────────────
UPDATE platform_roles
SET code = 'keygo_tenant_admin',
    name = 'Keygo Tenant Administrator',
    description = 'Manage tenant onboarding, billing contracts, and account lifecycle'
WHERE code = 'keygo_account_admin';

-- ─── Paso 2: Insertar platform_users para los admins de plataforma ────────────
-- IDs estables para idempotencia en resets de DB.
-- Contraseñas: bcrypt hash de 'Admin1234!' (12 rounds)
-- ADVERTENCIA: Solo para desarrollo local — nunca usar en producción.

INSERT INTO platform_users (
    id, email, username, password_hash,
    first_name, last_name, status, email_verified_at,
    created_at, updated_at
) VALUES
-- keygo_admin: admin global de plataforma
(
    'bbbbbbbb-0001-0000-0000-000000000001',
    'admin@keygo.io',
    'keygo_admin',
    '$2a$12$PLACEHOLDER_HASH_FOR_Admin1234!',  -- actualizar con hash real
    'KeyGo', 'Administrator',
    'ACTIVE', now(),
    now(), now()
),
-- keygo_tenant_admin: gestor de tenants/billing
(
    'bbbbbbbb-0002-0000-0000-000000000001',
    'tenant-admin@keygo.io',
    'keygo_tenant_admin',
    '$2a$12$PLACEHOLDER_HASH_FOR_Admin1234!',  -- actualizar con hash real
    'KeyGo', 'Tenant Admin',
    'ACTIVE', now(),
    now(), now()
),
-- keygo_user: usuario regular de plataforma
(
    'bbbbbbbb-0003-0000-0000-000000000001',
    'user@keygo.io',
    'keygo_user',
    '$2a$12$PLACEHOLDER_HASH_FOR_Admin1234!',  -- actualizar con hash real
    'KeyGo', 'User',
    'ACTIVE', now(),
    now(), now()
),
-- keygo_contractor: usuario de tipo contractor en plataforma
(
    'bbbbbbbb-0004-0000-0000-000000000001',
    'contractor@keygo.io',
    'keygo_contractor',
    '$2a$12$PLACEHOLDER_HASH_FOR_Admin1234!',  -- actualizar con hash real
    'KeyGo', 'Contractor',
    'ACTIVE', now(),
    now(), now()
)
ON CONFLICT (email) DO UPDATE SET
    username        = EXCLUDED.username,
    password_hash   = EXCLUDED.password_hash,
    status          = EXCLUDED.status,
    updated_at      = now();

-- ─── Paso 3: Asignar roles de plataforma a los platform_users ────────────────
-- Regla: todos reciben KEYGO_USER (rol base). Los admins reciben roles adicionales.

-- Primero, borrar las asignaciones antiguas que usaban tenant_user_id
-- (fueron migradas en V28; aquí hacemos limpieza de datos dev)
DELETE FROM platform_user_roles;

-- keygo_admin → KEYGO_USER (rol base) + KEYGO_ADMIN
INSERT INTO platform_user_roles (id, platform_user_id, platform_role_id, assigned_at)
VALUES (
    'cccccccc-0001-0000-0000-000000000001',
    'bbbbbbbb-0001-0000-0000-000000000001',
    (SELECT id FROM platform_roles WHERE code = 'keygo_user'),
    now()
) ON CONFLICT DO NOTHING;

INSERT INTO platform_user_roles (id, platform_user_id, platform_role_id, assigned_at)
VALUES (
    'cccccccc-0001-0000-0000-000000000002',
    'bbbbbbbb-0001-0000-0000-000000000001',
    (SELECT id FROM platform_roles WHERE code = 'keygo_admin'),
    now()
) ON CONFLICT DO NOTHING;

-- keygo_tenant_admin → KEYGO_USER (rol base) + KEYGO_TENANT_ADMIN (suscriptor con plan)
INSERT INTO platform_user_roles (id, platform_user_id, platform_role_id, assigned_at)
VALUES (
    'cccccccc-0002-0000-0000-000000000001',
    'bbbbbbbb-0002-0000-0000-000000000001',
    (SELECT id FROM platform_roles WHERE code = 'keygo_user'),
    now()
) ON CONFLICT DO NOTHING;

INSERT INTO platform_user_roles (id, platform_user_id, platform_role_id, assigned_at)
VALUES (
    'cccccccc-0002-0000-0000-000000000002',
    'bbbbbbbb-0002-0000-0000-000000000001',
    (SELECT id FROM platform_roles WHERE code = 'keygo_tenant_admin'),
    now()
) ON CONFLICT DO NOTHING;

-- keygo_user → solo KEYGO_USER (usuario regular de plataforma)
INSERT INTO platform_user_roles (id, platform_user_id, platform_role_id, assigned_at)
VALUES (
    'cccccccc-0003-0000-0000-000000000001',
    'bbbbbbbb-0003-0000-0000-000000000001',
    (SELECT id FROM platform_roles WHERE code = 'keygo_user'),
    now()
) ON CONFLICT DO NOTHING;

-- keygo_contractor → KEYGO_USER (rol base) + KEYGO_TENANT_ADMIN (tiene contrato activo en V18)
INSERT INTO platform_user_roles (id, platform_user_id, platform_role_id, assigned_at)
VALUES (
    'cccccccc-0004-0000-0000-000000000001',
    'bbbbbbbb-0004-0000-0000-000000000001',
    (SELECT id FROM platform_roles WHERE code = 'keygo_user'),
    now()
) ON CONFLICT DO NOTHING;

INSERT INTO platform_user_roles (id, platform_user_id, platform_role_id, assigned_at)
VALUES (
    'cccccccc-0004-0000-0000-000000000002',
    'bbbbbbbb-0004-0000-0000-000000000001',
    (SELECT id FROM platform_roles WHERE code = 'keygo_tenant_admin'),
    now()
) ON CONFLICT DO NOTHING;

-- ─── Paso 4: Vincular tenant_users existentes con sus platform_users ──────────
-- Actualizar FK platform_user_id en tenant_users para los usuarios de keygo tenant
-- Esto es opcional en MVP (platform_user_id es nullable), pero se hace para consistencia.

UPDATE tenant_users tu
SET platform_user_id = 'bbbbbbbb-0001-0000-0000-000000000001'
FROM tenants t
WHERE t.id = tu.tenant_id
  AND t.slug = 'keygo'
  AND tu.username = 'keygo_admin';

UPDATE tenant_users tu
SET platform_user_id = 'bbbbbbbb-0002-0000-0000-000000000001'
FROM tenants t
WHERE t.id = tu.tenant_id
  AND t.slug = 'keygo'
  AND tu.username = 'keygo_tenant_admin';

UPDATE tenant_users tu
SET platform_user_id = 'bbbbbbbb-0003-0000-0000-000000000001'
FROM tenants t
WHERE t.id = tu.tenant_id
  AND t.slug = 'keygo'
  AND tu.username = 'keygo_user';

UPDATE tenant_users tu
SET platform_user_id = 'bbbbbbbb-0004-0000-0000-000000000001'
FROM tenants t
WHERE t.id = tu.tenant_id
  AND t.slug = 'keygo'
  AND tu.username = 'keygo_contractor';
```

---

## F2. Generación del bcrypt hash real

Los `PLACEHOLDER_HASH_FOR_Admin1234!` en V29 deben reemplazarse con hashes reales antes de ejecutar la migración.

Usar el script utilitario (si existe) o generarlos con Spring Security's `BCryptPasswordEncoder`:

```bash
# Con Java (inline, en cualquier terminal con Java 21+):
java -cp ~/.m2/repository/org/springframework/security/spring-security-crypto/*/spring-security-crypto-*.jar \
  org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder Admin1234!
```

O generar con el test utilitario del proyecto:
```bash
# Si existe un test de generación de contraseñas:
./mvnw -pl keygo-infra test -Dtest=PasswordHashGeneratorTest -q
```

El hash debe reemplazar `PLACEHOLDER_HASH_FOR_Admin1234!` antes de que la migración sea ejecutada en cualquier ambiente. **Asegurarse de no commitear contraseñas en texto plano.**

---

## F3. Tabla de credenciales de desarrollo (actualizada)

| Tabla | Usuario | Email | Contraseña | Roles de plataforma |
|---|---|---|---|---|
| `platform_users` | `keygo_admin` | `admin@keygo.io` | `Admin1234!` | `keygo_user` (base) + `keygo_admin` |
| `platform_users` | `keygo_tenant_admin` | `tenant-admin@keygo.io` | `Admin1234!` | `keygo_user` (base) + `keygo_tenant_admin` |
| `platform_users` | `keygo_user` | `user@keygo.io` | `Admin1234!` | `keygo_user` (base) |
| `platform_users` | `keygo_contractor` | `contractor@keygo.io` | `Admin1234!` | `keygo_user` (base) + `keygo_tenant_admin` (tiene contrato activo) |

> **Regla:** `keygo_user` es el rol base de plataforma — todos los `platform_users` lo tienen. `keygo_tenant_admin` se asigna automáticamente al activar un contrato de billing. `keygo_admin` se asigna solo manualmente.

---

## F4. ¿Qué pasa con el tenant `keygo` y su app?

### Opciones:

**Opción A (Recomendada para MVP):** Mantener el tenant `keygo` y su app `keygo-ui` en el seed.
- Razón: Las `signing_keys` tienen FK a `tenant_id`; el tenant `keygo` puede seguir siendo el propietario de las claves de firma globales.
- Los `tenant_users` del tenant `keygo` siguen existiendo para compatibilidad con el flujo de tenant app si alguien lo necesita.
- El acceso de plataforma se hace exclusivamente por `platform_users`.

**Opción B (Limpieza completa):** Eliminar tenant `keygo` y su app.
- Requiere migrar las `signing_keys` a un scope de plataforma (sin `tenant_id`).
- Mayor esfuerzo, pero más limpio a largo plazo.
- **Posponer para post-MVP.**

**Decisión MVP: Opción A.** El tenant `keygo` y su app `keygo-ui` se mantienen.

---

## F5. Actualizar documentación de credenciales dev

Actualizar en `AGENTS.md` la sección "Seed credentials (dev/local ONLY)":
- Agregar tabla de `platform_users` con las nuevas credenciales
- Mantener tabla de `tenant_users` (para el flujo de tenant app)
- Anotar que KeyGo UI login usa `platform_users`
