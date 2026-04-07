# Fase A — Modelo de Datos: Nuevas Tablas y Migraciones

> Instrucciones detalladas para crear las migraciones Flyway que implementan el nuevo modelo de datos.

---

## A1. Migración V27 — Tabla `platform_users`

**Archivo a crear:** `keygo-supabase/src/main/resources/db/migration/V27__platform_users.sql`

```sql
-- =============================================================================
-- V27: Platform Users — identidad global de plataforma
-- Separación de la identidad de plataforma (cuenta global) del usuario de tenant.
-- RFC: docs/rfc/restructure-multitenant/02-modelo-identidad-multitenancy.md
-- =============================================================================

CREATE TABLE platform_users (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    username            VARCHAR(100) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    status              VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE',
    email_verified_at   TIMESTAMPTZ,
    phone_number        VARCHAR(30),
    locale              VARCHAR(10),
    zoneinfo            VARCHAR(50),
    profile_picture_url TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_platform_users_status
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING', 'RESET_PASSWORD'))
);

CREATE INDEX idx_platform_users_email    ON platform_users(email);
CREATE INDEX idx_platform_users_username ON platform_users(username);
CREATE INDEX idx_platform_users_status   ON platform_users(status);

CREATE TRIGGER trg_platform_users_updated_at
    BEFORE UPDATE ON platform_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE platform_users IS
    'Global platform user identity. RFC: cuenta global de plataforma. '
    'Separate from tenant_users which represents organizational membership.';
COMMENT ON COLUMN platform_users.email IS 'Globally unique email (platform-level identity).';
COMMENT ON COLUMN platform_users.status IS
    'ACTIVE | SUSPENDED | PENDING (email not verified) | RESET_PASSWORD';
```

---

## A2. Migración V28 — Refactorización de sesiones y platform_user_roles

**Archivo a crear:** `keygo-supabase/src/main/resources/db/migration/V28__sessions_platform_refactor.sql`

Este script realiza cuatro cambios en orden:

1. Agrega `platform_user_id` a `tenant_users` (vínculo opcional para MVP)
2. Corrige `platform_user_roles` — cambia FK de `tenant_users` a `platform_users`
3. Refactoriza `sessions` — nueva semántica con `platform_user_id` + `client_app_id` nullable
4. Actualiza `refresh_tokens` — quitar `tenant_id` y `user_id` (derivables desde la sesión)

```sql
-- =============================================================================
-- V28: Sessions platform refactor + platform_user_roles correction
-- =============================================================================

-- ─── Paso 1: Vincular tenant_users con platform_users (nullable para MVP) ────
ALTER TABLE tenant_users
    ADD COLUMN platform_user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL;

CREATE INDEX idx_tenant_users_platform_user ON tenant_users(platform_user_id)
    WHERE platform_user_id IS NOT NULL;

COMMENT ON COLUMN tenant_users.platform_user_id IS
    'Optional link to platform_users (global identity). '
    'NULL for tenant-app-only users who have no platform account.';

-- ─── Paso 2: Corregir platform_user_roles ────────────────────────────────────
-- La FK actualmente apunta a tenant_users; debe apuntar a platform_users.
-- IMPORTANTE: Si existen filas, deben migrarse antes de hacer DROP.
-- En V26 seed se crearon filas con tenant_user_id de usuarios en keygo tenant.
-- La migración de datos se hace en V29 (junto con el seed de platform_users).
-- Por ahora, se recrean las restricciones.

ALTER TABLE platform_user_roles
    DROP CONSTRAINT IF EXISTS platform_user_roles_tenant_user_id_fkey;

ALTER TABLE platform_user_roles
    RENAME COLUMN tenant_user_id TO platform_user_id;

ALTER TABLE platform_user_roles
    ADD CONSTRAINT platform_user_roles_platform_user_id_fkey
        FOREIGN KEY (platform_user_id) REFERENCES platform_users(id) ON DELETE CASCADE;

-- Recrear índice con nombre correcto
DROP INDEX IF EXISTS idx_platform_user_roles_tenant_user;
CREATE INDEX idx_platform_user_roles_platform_user ON platform_user_roles(platform_user_id);

COMMENT ON COLUMN platform_user_roles.platform_user_id IS
    'FK to platform_users (global user identity). Previously was tenant_user_id.';

-- ─── Paso 3: Refactorizar sessions ───────────────────────────────────────────
-- sessions.user_id (FK → tenant_users) → sessions.platform_user_id (FK → platform_users)
-- sessions.client_app_id: de NOT NULL → nullable
-- sessions.tenant_id: eliminar (derivable desde client_apps.tenant_id)
-- Nota: Las sesiones existentes deben borrarse (en dev/local está bien).

-- Limpiar sesiones existentes (desarrollo/local; en producción hacer migración de datos)
DELETE FROM refresh_tokens;
DELETE FROM sessions;

-- Cambiar columna user_id → platform_user_id
ALTER TABLE sessions
    DROP CONSTRAINT IF EXISTS sessions_user_id_fkey,
    DROP CONSTRAINT IF EXISTS sessions_tenant_id_fkey,
    DROP CONSTRAINT IF EXISTS sessions_client_app_id_fkey;

ALTER TABLE sessions
    DROP COLUMN IF EXISTS tenant_id,
    DROP COLUMN IF EXISTS user_id;

ALTER TABLE sessions
    ADD COLUMN platform_user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE;

-- client_app_id: nullable (NULL = plataforma, NOT NULL = app de tenant)
ALTER TABLE sessions
    ALTER COLUMN client_app_id DROP NOT NULL;

ALTER TABLE sessions
    ADD CONSTRAINT sessions_client_app_id_fkey
        FOREIGN KEY (client_app_id) REFERENCES client_apps(id) ON DELETE CASCADE;

-- Constraint semántico: si client_app_id tiene valor, debe haber signing_key_id
-- (El signing_key_id nullable ya existe desde V22)
COMMENT ON COLUMN sessions.platform_user_id IS
    'FK to platform_users. Always set. The global user identity.';
COMMENT ON COLUMN sessions.client_app_id IS
    'FK to client_apps. NULL = platform session (KeyGo UI). '
    'NOT NULL = tenant app session (OAuth2 code exchange).';

DROP INDEX IF EXISTS idx_sessions_user_tenant;
CREATE INDEX idx_sessions_platform_user ON sessions(platform_user_id);
CREATE INDEX idx_sessions_client_app    ON sessions(client_app_id) WHERE client_app_id IS NOT NULL;

-- ─── Paso 4: Actualizar refresh_tokens ───────────────────────────────────────
-- Quitar tenant_id y user_id (derivables desde session → platform_user + client_app)

ALTER TABLE refresh_tokens
    DROP CONSTRAINT IF EXISTS refresh_tokens_tenant_id_fkey,
    DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_fkey;

ALTER TABLE refresh_tokens
    DROP COLUMN IF EXISTS tenant_id,
    DROP COLUMN IF EXISTS user_id;

-- client_app_id: mantener para lookup rápido; pero hacerla nullable igual que sessions
ALTER TABLE refresh_tokens
    DROP CONSTRAINT IF EXISTS refresh_tokens_client_app_id_fkey;

ALTER TABLE refresh_tokens
    ALTER COLUMN client_app_id DROP NOT NULL;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT refresh_tokens_client_app_id_fkey
        FOREIGN KEY (client_app_id) REFERENCES client_apps(id) ON DELETE CASCADE;

COMMENT ON COLUMN refresh_tokens.client_app_id IS
    'Optional: denormalized from session for quick lookup. '
    'NULL for platform session refresh tokens.';
```

---

## A3. Entidades JPA a crear/modificar

### A3.1. Nueva entidad `PlatformUserEntity`

**Archivo a crear:** `keygo-supabase/src/main/java/io/cmartinezs/keygo/supabase/user/entity/PlatformUserEntity.java`

```java
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "platform_users")
public class PlatformUserEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, unique = true) private String email;
    @Column(nullable = false, unique = true) private String username;
    @Column(nullable = false)               private String passwordHash;
    private String firstName;
    private String lastName;
    @Column(nullable = false)               private String status;
    private OffsetDateTime emailVerifiedAt;
    private String phoneNumber;
    private String locale;
    private String zoneinfo;
    private String profilePictureUrl;
    @CreationTimestamp private OffsetDateTime createdAt;
    @UpdateTimestamp   private OffsetDateTime updatedAt;
}
```

### A3.2. Nueva entidad `PlatformUserJpaRepository`

**Archivo a crear:** `keygo-supabase/src/main/java/io/cmartinezs/keygo/supabase/user/repository/PlatformUserJpaRepository.java`

```java
public interface PlatformUserJpaRepository extends JpaRepository<PlatformUserEntity, UUID> {
    Optional<PlatformUserEntity> findByEmail(String email);
    Optional<PlatformUserEntity> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
```

### A3.3. Modificar `PlatformUserRoleEntity`

**Archivo:** `keygo-supabase/.../membership/entity/PlatformUserRoleEntity.java`

Cambiar:
```java
// ANTES (incorrecto)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "tenant_user_id", nullable = false)
private TenantUserEntity tenantUser;
```
por:
```java
// DESPUÉS (correcto)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "platform_user_id", nullable = false)
private PlatformUserEntity platformUser;
```

### A3.4. Modificar `TenantUserEntity`

Agregar campo nullable:
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "platform_user_id")
private PlatformUserEntity platformUser;
```

### A3.5. Modificar `SessionEntity`

**Cambios:**
- Eliminar campo `tenant: TenantEntity`
- Eliminar campo `user: TenantUserEntity` (era `user_id`)
- Agregar campo `platformUser: PlatformUserEntity` (NOT NULL)
- Hacer `clientApp: ClientAppEntity` nullable (`@JoinColumn(nullable = true)`)

```java
// ELIMINAR:
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "tenant_id", nullable = false)
private TenantEntity tenant;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "user_id", nullable = false)
private TenantUserEntity user;

// AGREGAR:
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "platform_user_id", nullable = false)
private PlatformUserEntity platformUser;

// MODIFICAR: client_app_id ahora es nullable
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "client_app_id", nullable = true)
private ClientAppEntity clientApp;
```

### A3.6. Modificar `RefreshTokenEntity`

**Cambios:**
- Eliminar campo `tenant: TenantEntity`
- Eliminar campo `user: TenantUserEntity`
- Hacer `clientApp: ClientAppEntity` nullable

---

## A4. Declaración en `SupabaseJpaConfig`

La nueva entidad `PlatformUserEntity` se agregará automáticamente si el `@EntityScan` ya cubre el paquete `io.cmartinezs.keygo.supabase.user.entity`. Verificar.

Si no, actualizar `@EntityScan` en `SupabaseJpaConfig.java` para incluir el paquete.

---

## A5. Verificación

```bash
# Compilar solo supabase (con -am para resolver deps)
./mvnw -pl keygo-supabase -am compile -q

# Validar que Flyway acepta las migraciones sin error
./mvnw -pl keygo-supabase -am test -Dtest=none -q 2>&1 | grep -i flyway
```
