# Fase B — Dominio y Puertos: PlatformUser

> Instrucciones para crear el modelo de dominio `PlatformUser` y los puertos/adapters necesarios.

---

## B1. Nuevo modelo de dominio `PlatformUser`

**Archivo a crear:** `keygo-domain/src/main/java/io/cmartinezs/keygo/domain/user/model/PlatformUser.java`

```java
package io.cmartinezs.keygo.domain.user.model;

import io.cmartinezs.keygo.domain.user.exception.UserSuspendedException;
import lombok.Builder;
import lombok.Getter;

/**
 * PlatformUser — global platform identity.
 * Represents a person's account at the KeyGo platform level.
 * NOT scoped to any tenant. Credentials (email, password) live here.
 * Per-tenant identity is modeled via TenantUser (which has a FK to PlatformUser).
 * RFC: docs/rfc/restructure-multitenant/02-modelo-identidad-multitenancy.md
 */
@Getter
public class PlatformUser {

    private final UserId id;
    private final EmailAddress email;
    private final Username username;
    private PasswordHash passwordHash;
    private String firstName;
    private String lastName;
    private UserStatus status;

    // OIDC §5.3 profile claims (same as tenant-level User)
    private String phoneNumber;
    private String locale;
    private String zoneinfo;
    private String profilePictureUrl;

    @Builder
    private PlatformUser(
            UserId id,
            EmailAddress email,
            Username username,
            PasswordHash passwordHash,
            String firstName,
            String lastName,
            UserStatus status,
            String phoneNumber,
            String locale,
            String zoneinfo,
            String profilePictureUrl) {
        if (email == null)        throw new IllegalArgumentException("PlatformUser email cannot be null");
        if (username == null)     throw new IllegalArgumentException("PlatformUser username cannot be null");
        if (passwordHash == null) throw new IllegalArgumentException("PlatformUser passwordHash cannot be null");
        if (status == null)       throw new IllegalArgumentException("PlatformUser status cannot be null");

        this.id = id;
        this.email = email;
        this.username = username;
        this.passwordHash = passwordHash;
        this.firstName = firstName;
        this.lastName = lastName;
        this.status = status;
        this.phoneNumber = phoneNumber;
        this.locale = locale;
        this.zoneinfo = zoneinfo;
        this.profilePictureUrl = profilePictureUrl;
    }

    public boolean isActive() { return UserStatus.ACTIVE.equals(status); }
    public boolean isPending() { return UserStatus.PENDING.equals(status); }
    public boolean isSuspended() { return UserStatus.SUSPENDED.equals(status); }
    public boolean isResetPassword() { return UserStatus.RESET_PASSWORD.equals(status); }

    public void suspend() {
        if (isSuspended()) throw new UserSuspendedException(username.value());
        this.status = UserStatus.SUSPENDED;
    }

    public void activate() { this.status = UserStatus.ACTIVE; }

    public void updatePassword(PasswordHash newPasswordHash) {
        if (newPasswordHash == null) throw new IllegalArgumentException("New password hash cannot be null");
        this.passwordHash = newPasswordHash;
    }

    @Override
    public String toString() {
        return "PlatformUser{id=" + id + ", email=" + email + ", status=" + status + "}";
    }
}
```

> **Reusar value objects existentes:** `UserId`, `EmailAddress`, `Username`, `PasswordHash`, `UserStatus` — todos en `keygo-domain/.../user/model/`. No crear duplicados.

---

## B2. Puerto OUT `PlatformUserRepositoryPort`

**Archivo a crear:** `keygo-app/src/main/java/io/cmartinezs/keygo/app/user/port/PlatformUserRepositoryPort.java`

```java
public interface PlatformUserRepositoryPort {
    /** Save (create or update) a platform user. */
    PlatformUser save(PlatformUser platformUser);

    /** Find by email (for login validation). */
    Optional<PlatformUser> findByEmail(String email);

    /** Find by username. */
    Optional<PlatformUser> findByUsername(String username);

    /** Find by ID. */
    Optional<PlatformUser> findById(UUID id);

    /** Check if email already registered. */
    boolean existsByEmail(String email);

    /** Check if username already registered. */
    boolean existsByUsername(String username);
}
```

---

## B3. Adapter JPA `PlatformUserRepositoryAdapter`

**Archivo a crear:** `keygo-supabase/src/main/java/io/cmartinezs/keygo/supabase/user/adapter/PlatformUserRepositoryAdapter.java`

Implementa `PlatformUserRepositoryPort`. Delega en `PlatformUserJpaRepository` y usa un mapper para convertir entre `PlatformUserEntity` y `PlatformUser`.

**Mapper a crear:** `PlatformUserMapper` (clase interna o separada) con métodos:
- `toDomain(PlatformUserEntity)` → `PlatformUser`
- `toEntity(PlatformUser)` → `PlatformUserEntity`

---

## B4. Nuevo modelo de dominio `PlatformSession`

**Archivo a crear:** `keygo-domain/src/main/java/io/cmartinezs/keygo/domain/auth/model/PlatformSession.java`

Representa una sesión de plataforma (sin `clientAppId`).

```java
@Getter
@Builder
public class PlatformSession {
    private final SessionId id;
    private final UserId platformUserId;    // FK a platform_users
    private ClientAppId clientAppId;        // null = platform session
    private String status;
    private Instant expiresAt;
    private Instant lastAccessedAt;
    private String userAgent;
    private String ipAddress;
}
```

> **Nota:** El dominio `Session` existente (para tenant apps) puede adaptarse para ser el mismo modelo con `clientAppId` nullable, evitando duplicación. Evaluar al implementar.

---

## B5. Puerto OUT actualizado `SessionRepositoryPort`

El `SessionRepositoryPort` existente necesita ser actualizado para soportar `platform_user_id`:

Agregar métodos:
```java
/** Open a platform session (no client app). */
Session openPlatformSession(UUID platformUserId, String userAgent, String ipAddress, Instant expiresAt);

/** Find active platform sessions for a platform user. */
List<Session> findActivePlatformSessionsByPlatformUserId(UUID platformUserId);
```

---

## B6. Use cases de PlatformUser a crear

**Directorio:** `keygo-app/src/main/java/io/cmartinezs/keygo/app/user/usecase/`

| Use Case | Descripción |
|---|---|
| `CreatePlatformUserUseCase` | Crea un nuevo platform user (usado por admin o flujo de invitación) |
| `AuthenticatePlatformUserUseCase` | Valida credenciales (email + password) de un platform user |
| `GetPlatformUserUseCase` | Obtiene un platform user por ID o email |
| `UpdatePlatformUserUseCase` | Actualiza perfil de un platform user |
| `SuspendPlatformUserUseCase` | Suspende un platform user |

### B6.1. `CreatePlatformUserUseCase`

**Command:** `CreatePlatformUserCommand(email, username, rawPassword, firstName, lastName)`

**Lógica:**
1. Validar que email y username no existen en `PlatformUserRepositoryPort`
2. Encodear el password con `CredentialEncoderPort`
3. Crear `PlatformUser` con `status = ACTIVE` (creado por admin, ya verificado)
4. Guardar via `PlatformUserRepositoryPort.save()`
5. **Auto-asignar rol base `KEYGO_USER`** via `PlatformUserRoleRepositoryPort.assign(platformUser.id, "keygo_user")`
6. Retornar `PlatformUser`

> **Regla de negocio:** Todo `platform_user` recibe automáticamente el rol `KEYGO_USER` al ser creado. Es el rol base de plataforma. No requiere ser asignado manualmente.

### B6.2. `AuthenticatePlatformUserUseCase`

**Command:** `AuthenticatePlatformUserCommand(email, rawPassword)`

**Lógica:**
1. Buscar por email → lanzar `UserNotFoundException` si no existe
2. Verificar password con `CredentialEncoderPort.matches(rawPassword, user.passwordHash)` → lanzar excepción si no coincide
3. Validar status: si `SUSPENDED` → lanzar `UserSuspendedException`; si `PENDING` → lanzar exception de verificación pendiente
4. Retornar `PlatformUser`

---

## B6.5. Reglas de negocio — asignación automática de roles de plataforma

Las siguientes reglas definen **cuándo y cómo** se asignan los roles de plataforma. Son invariantes de negocio, no opcionales.

| Rol | Código | Asignación automática | Momento |
|---|---|---|---|
| `KEYGO_USER` | `keygo_user` | **Siempre** | Al crear el `platform_user` (`CreatePlatformUserUseCase`) |
| `KEYGO_TENANT_ADMIN` | `keygo_tenant_admin` | **Al activar un contrato de billing** | En `ActivateAppContractUseCase`, si el contractor tiene `platform_user_id` |
| `KEYGO_ADMIN` | `keygo_admin` | **Manual únicamente** | Asignado explícitamente por un `KEYGO_ADMIN` existente (nunca automático) |

### Regla 1 — `KEYGO_USER` (rol base)

- **Quién:** Todos los `platform_users` sin excepción.
- **Cuándo:** Inmediatamente al crear el `platform_user` en `CreatePlatformUserUseCase`.
- **Cómo:** El use case llama a `PlatformUserRoleRepositoryPort.assign(platformUserId, "keygo_user")` justo después de persistir el usuario.
- **No requiere intervención manual.**

### Regla 2 — `KEYGO_TENANT_ADMIN` (rol de gestor de tenant suscrito)

- **Quién:** El `platform_user` que contrató un plan de billing y lo activó.
- **Cuándo:** En `ActivateAppContractUseCase.execute()`, tras crear la suscripción y la factura exitosamente.
- **Cómo:**
  1. El `Contractor` del contrato tiene un `tenantUser` en el tenant del proveedor.
  2. Ese `tenantUser` tiene `platform_user_id` (vinculado en el flujo de onboarding billing).
  3. `ActivateAppContractUseCase` llama a `PlatformUserRoleRepositoryPort.assign(platformUserId, "keygo_tenant_admin")` al final del flujo exitoso.
- **Idempotente:** Si el `platform_user` ya tiene `KEYGO_TENANT_ADMIN`, no falla (usar `ON CONFLICT DO NOTHING` o `hasRole()` previo).
- **Implicación para el flujo de onboarding:** El `CreateAppContractUseCase` (inicio del onboarding) debe capturar el `platform_user_id` del contractor. Si el contractor no tiene `platform_user_id` aún, **debe crearse un `platform_user`** antes de activar el contrato.

### Regla 3 — `KEYGO_ADMIN` (administrador global de plataforma)

- **Quién:** Solo operadores internos de KeyGo.
- **Cuándo:** Asignación manual por un `KEYGO_ADMIN` existente.
- **Cómo:** `POST /api/v1/platform/users/{userId}/platform-roles` con `{"roleCode": "keygo_admin"}`.
- **No existe flujo automático para este rol.**
- **Seed:** El usuario `keygo_admin` (en V29) recibe este rol explícitamente en la migración.

### Impacto en `ActivateAppContractUseCase`

El use case necesita una nueva dependencia: `PlatformUserRoleRepositoryPort`. Al finalizar exitosamente:

```java
// Al final de execute(), después de crear suscripción + factura:
if (contractor.getPlatformUserId() != null) {
    platformUserRoleRepository.assign(contractor.getPlatformUserId(), "keygo_tenant_admin");
}
```

También necesitará `ContractorRepositoryPort` para recuperar el `platform_user_id` del contractor (si no viene en el modelo `AppContract` ya).

### Vinculación de contractor con platform_user en el onboarding

El flujo `CreateAppContractUseCase` crea un `Contractor` (que es un `TenantUser` en el tenant del proveedor). Para que `ActivateAppContractUseCase` pueda asignar `KEYGO_TENANT_ADMIN`, ese `TenantUser` necesita `platform_user_id`.

**Opciones MVP:**

**Opción A (Recomendada):** En `CreateAppContractUseCase`, cuando se crea el contractor:
1. Verificar si ya existe un `platform_user` con ese email.
2. Si no existe, crear un `platform_user` con los datos del contractor (email, nombre).
3. Vincular `tenant_user.platform_user_id → platform_user.id`.

**Opción B (Diferida):** No crear `platform_user` en el onboarding. El contractor hace login de plataforma la primera vez y se le crea/vincula el `platform_user` entonces. `KEYGO_TENANT_ADMIN` se asigna en ese momento de primer login.

**Decisión MVP: Opción A** — crear `platform_user` durante el onboarding para que el rol se asigne automáticamente al activar.

---

## B7. Actualizar `PlatformUserRoleRepositoryPort`

El método `findByUserId(UUID tenantUserId)` debe renombrarse para claridad:

```java
// ANTES
List<PlatformUserRole> findByUserId(UUID tenantUserId);
boolean hasRole(UUID tenantUserId, String roleCode);
PlatformUserRole assign(UUID tenantUserId, String roleCode);
void revoke(UUID tenantUserId, String roleCode);

// DESPUÉS
List<PlatformUserRole> findByPlatformUserId(UUID platformUserId);
boolean hasRole(UUID platformUserId, String roleCode);
PlatformUserRole assign(UUID platformUserId, String roleCode);
void revoke(UUID platformUserId, String roleCode);
```

> **Impacto:** Todos los use cases T-111 que usan `PlatformUserRoleRepositoryPort` deben actualizarse.

---

## B8. Actualizar use cases T-111 afectados

Los siguientes use cases de T-111 usan `tenantUserId` para operaciones de `PlatformUserRoleRepositoryPort`. Deben renombrarse/actualizarse para usar `platformUserId`:

- `AssignPlatformRoleUseCase` — `execute(UUID tenantUserId, String roleCode)` → `execute(UUID platformUserId, String roleCode)`
- `RevokePlatformRoleUseCase` — misma actualización
- `AssignPlatformRoleUseCaseTest`, `RevokePlatformRoleUseCaseTest` — actualizar

---

## B9. Wiring en `ApplicationConfig`

Agregar beans:
```java
@Bean
public PlatformUserRepositoryPort platformUserRepositoryPort(PlatformUserJpaRepository repo) {
    return new PlatformUserRepositoryAdapter(repo);
}

@Bean
public CreatePlatformUserUseCase createPlatformUserUseCase(
        PlatformUserRepositoryPort platformUserRepository,
        CredentialEncoderPort credentialEncoder) {
    return new CreatePlatformUserUseCase(platformUserRepository, credentialEncoder);
}

@Bean
public AuthenticatePlatformUserUseCase authenticatePlatformUserUseCase(
        PlatformUserRepositoryPort platformUserRepository,
        CredentialEncoderPort credentialEncoder) {
    return new AuthenticatePlatformUserUseCase(platformUserRepository, credentialEncoder);
}
```

---

## B10. Tests

Para cada use case de B6, crear tests unitarios con `@ExtendWith(MockitoExtension.class)`:

| Test | Casos mínimos |
|---|---|
| `CreatePlatformUserUseCaseTest` | email duplicado, username duplicado, creación exitosa |
| `AuthenticatePlatformUserUseCaseTest` | usuario no existe, password incorrecto, usuario suspendido, exitoso |
