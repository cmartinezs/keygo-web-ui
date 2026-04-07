# Fase A — Migración V30: Contractor → PlatformUser + Billing Unificado

> **Migración:** `V30__billing_contractor_to_platform_user.sql`  
> **Prerequisito:** V24–V29 (platform_users, platform_roles, seeds) ya aplicadas

---

## Cambios en schema

### 1. Tabla `contractors` — FK a `platform_users`

```sql
-- 1a) Agregar nueva columna platform_user_id
ALTER TABLE contractors
    ADD COLUMN platform_user_id UUID;

-- 1b) Migrar datos existentes: buscar platform_user por email del tenant_user
UPDATE contractors c
SET platform_user_id = pu.id
FROM tenant_users tu
JOIN platform_users pu ON pu.email = tu.email
WHERE c.tenant_user_id = tu.id;

-- 1c) Hacer NOT NULL + UNIQUE después de migrar
ALTER TABLE contractors
    ALTER COLUMN platform_user_id SET NOT NULL,
    ADD CONSTRAINT uq_contractors_platform_user UNIQUE (platform_user_id),
    ADD CONSTRAINT fk_contractors_platform_user
        FOREIGN KEY (platform_user_id) REFERENCES platform_users(id) ON DELETE RESTRICT;

-- 1d) Eliminar FK y columna tenant_user_id
ALTER TABLE contractors
    DROP CONSTRAINT contractors_tenant_user_id_fkey,
    DROP CONSTRAINT contractors_tenant_user_id_key,
    DROP COLUMN tenant_user_id;

-- 1e) Índice para búsqueda por platform_user_id
CREATE INDEX idx_contractors_platform_user ON contractors(platform_user_id);
```

### 2. Tabla `app_plans` — `client_app_id` nullable

```sql
-- 2a) Eliminar la constraint NOT NULL en client_app_id
ALTER TABLE app_plans
    ALTER COLUMN client_app_id DROP NOT NULL;

-- 2b) Ajustar unique constraint: permitir NULL client_app_id
--     (NULL, code) debe ser único para planes de plataforma
ALTER TABLE app_plans
    DROP CONSTRAINT uq_app_plans_app_code;

-- Nuevo unique: para planes de app (client_app_id NOT NULL)
CREATE UNIQUE INDEX uq_app_plans_app_code
    ON app_plans(client_app_id, code) WHERE client_app_id IS NOT NULL;

-- Nuevo unique: para planes de plataforma (client_app_id IS NULL)
CREATE UNIQUE INDEX uq_app_plans_platform_code
    ON app_plans(code) WHERE client_app_id IS NULL;

-- 2c) Actualizar CHECK subscriber_type: agregar PLATFORM
ALTER TABLE app_plans
    DROP CONSTRAINT chk_app_plans_subscriber_type;
ALTER TABLE app_plans
    ADD CONSTRAINT chk_app_plans_subscriber_type
        CHECK (subscriber_type IN ('TENANT', 'TENANT_USER', 'PLATFORM'));

-- 2d) Ajustar índice de catálogo público para incluir planes de plataforma
DROP INDEX idx_app_plans_client_app_status;
CREATE INDEX idx_app_plans_client_app_status
    ON app_plans(client_app_id, status) WHERE is_public = TRUE;
CREATE INDEX idx_app_plans_platform_status
    ON app_plans(status) WHERE client_app_id IS NULL AND is_public = TRUE;
```

### 3. Tabla `app_contracts` — `client_app_id` nullable

```sql
-- 3a) Eliminar NOT NULL en client_app_id
ALTER TABLE app_contracts
    ALTER COLUMN client_app_id DROP NOT NULL;

-- 3b) Ajustar índice
DROP INDEX IF EXISTS idx_app_contracts_client_app;
CREATE INDEX idx_app_contracts_client_app
    ON app_contracts(client_app_id) WHERE client_app_id IS NOT NULL;
CREATE INDEX idx_app_contracts_platform
    ON app_contracts(status) WHERE client_app_id IS NULL;
```

### 4. Tabla `app_subscriptions` — `client_app_id` nullable

```sql
-- 4a) Eliminar NOT NULL en client_app_id
ALTER TABLE app_subscriptions
    ALTER COLUMN client_app_id DROP NOT NULL;

-- 4b) Ajustar índice
DROP INDEX IF EXISTS idx_app_subscriptions_client_app;
CREATE INDEX idx_app_subscriptions_client_app
    ON app_subscriptions(client_app_id) WHERE client_app_id IS NOT NULL;
CREATE INDEX idx_app_subscriptions_platform
    ON app_subscriptions(contractor_id, status) WHERE client_app_id IS NULL;
```

### 5. Migrar planes de plataforma (seed data)

```sql
-- Los planes existentes del seed keygo-ui pasan a ser planes de plataforma
-- Identificar por la ClientApp que pertenece al tenant "keygo"
UPDATE app_plans
SET client_app_id = NULL,
    subscriber_type = 'PLATFORM'
WHERE client_app_id = (
    SELECT ca.id FROM client_apps ca
    JOIN tenants t ON t.id = ca.tenant_id
    WHERE t.slug = 'keygo' AND ca.client_id = 'keygo-ui'
);

-- Los contratos existentes del seed también pasan a plataforma
UPDATE app_contracts
SET client_app_id = NULL
WHERE client_app_id = (
    SELECT ca.id FROM client_apps ca
    JOIN tenants t ON t.id = ca.tenant_id
    WHERE t.slug = 'keygo' AND ca.client_id = 'keygo-ui'
);

-- Las suscripciones existentes del seed también pasan a plataforma
UPDATE app_subscriptions
SET client_app_id = NULL
WHERE client_app_id = (
    SELECT ca.id FROM client_apps ca
    JOIN tenants t ON t.id = ca.tenant_id
    WHERE t.slug = 'keygo' AND ca.client_id = 'keygo-ui'
);
```

### 6. Asignar rol KEYGO_TENANT_ADMIN al contractor existente

```sql
-- El contractor del seed (keygo_contractor → platform_user) necesita KEYGO_TENANT_ADMIN
INSERT INTO platform_user_roles (platform_user_id, platform_role_id)
SELECT c.platform_user_id, pr.id
FROM contractors c
JOIN platform_roles pr ON pr.code = 'keygo_tenant_admin'
WHERE NOT EXISTS (
    SELECT 1 FROM platform_user_roles pur
    WHERE pur.platform_user_id = c.platform_user_id
    AND pur.platform_role_id = pr.id
);
```

---

## Comentarios de la migración

```sql
COMMENT ON COLUMN contractors.platform_user_id IS
    '1:1 link to PlatformUser — global identity of the contractor.';
COMMENT ON COLUMN app_plans.client_app_id IS
    'NULL = platform plan (offered by KeyGo). NOT NULL = app plan (offered by a ClientApp).';
COMMENT ON COLUMN app_plans.subscriber_type IS
    'PLATFORM = KeyGo platform. TENANT = B2B. TENANT_USER = B2C.';
```

---

## Validación post-migración

```sql
-- Verificar que todos los contractors tienen platform_user_id
SELECT COUNT(*) FROM contractors WHERE platform_user_id IS NULL;
-- Esperado: 0

-- Verificar que los planes de plataforma tienen client_app_id NULL
SELECT id, code, client_app_id, subscriber_type FROM app_plans WHERE subscriber_type = 'PLATFORM';
-- Esperado: 6 planes (FREE, PERSONAL, TEAM, BUSINESS, FLEX, ENTERPRISE)

-- Verificar que no queda tenant_user_id en contractors
SELECT column_name FROM information_schema.columns
WHERE table_name = 'contractors' AND column_name = 'tenant_user_id';
-- Esperado: 0 filas

-- Verificar contractor vinculado a platform_user
SELECT c.id, pu.email, c.status
FROM contractors c JOIN platform_users pu ON pu.id = c.platform_user_id;
```

---

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `db/migration/V30__billing_contractor_to_platform_user.sql` | **Crear** |

---

## Dependencias

- Requiere que V29 (seed platform_users) ya incluya un platform_user con email `contractor@keygo.local`
- Si no existe, la migración falla en el UPDATE de contractors (paso 1b)
