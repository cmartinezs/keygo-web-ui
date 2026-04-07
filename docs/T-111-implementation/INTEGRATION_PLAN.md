# T-111 — Plan de Integración RBAC en Flujos Existentes

> **Audiencia:** Agente AI / developer implementando las fases aquí descritas.  
> **Prerrequisito:** T-111 Fase A–J completada (modelos, entidades JPA, migraciones V24–V26, use cases CRUD, wiring, tests).  
> **Propósito:** Integrar los nuevos roles de plataforma y tenant en los flujos de autorización (JWT) y onboarding/billing.

---

## Contexto y problema

T-111 creó la infraestructura CRUD para roles de plataforma y tenant:

| Artefacto | Descripción |
|---|---|
| `PlatformRole`, `PlatformUserRole` | Modelos de dominio para roles globales de plataforma |
| `TenantRole`, `TenantUserRole` | Modelos de dominio para roles por tenant |
| `platform_roles`, `platform_user_roles`, `tenant_roles`, `tenant_user_roles` | Tablas en DB (V24–V26) |
| `AssignPlatformRoleUseCase`, `RevokePlatformRoleUseCase` | Casos de uso CRUD de plataforma |
| `CreateTenantRoleUseCase`, `AssignTenantRoleUseCase`, `RevokeTenantRoleUseCase` | Casos de uso CRUD de tenant |

**Lo que falta:**

1. El claim `roles` del JWT solo incluye **roles de aplicación** (`app_roles`/`memberships`). Los roles de plataforma y tenant NO están en el token.
2. `@PreAuthorize("hasRole('ADMIN')")` funciona solo porque el app role `admin` (via membership de `keygo-ui`) llega al JWT. Con el nuevo modelo RBAC, los usuarios platform-admin deberían tener roles de plataforma, no depender del modelo de membership.
3. `RevokeTenantRoleUseCase` tiene un bug crítico: usa `tenantUserId` donde debería usarse `tenantRoleId` para validar.
4. `RegisterTenantUserUseCase` no asigna ningún rol de tenant al nuevo usuario.
5. No existen endpoints REST para gestionar plataforma/tenant roles.

---

## Flujo actual (solo app roles en JWT)

```
POST /oauth2/token (code exchange)
  └─ AuthorizationController.exchangeToken()
       ├─ ExchangeAuthorizationCodeUseCase.execute()
       ├─ membershipRepository.findEffectiveRoleCodesByUserAndClientApp(userUUID, clientAppUUID)
       │    └─ devuelve: ["admin"]  ← SOLO app roles (app_roles / memberships)
       └─ IssueTokensUseCase.execute(..., roles=["admin"])
            └─ JWT roles claim: ["admin"]
                 └─ Filter → ROLE_ADMIN → @PreAuthorize("hasRole('ADMIN')") ✅
```

**Problema:** `platform_user_roles` y `tenant_user_roles` no son consultados. Un usuario con `keygo_admin` en `platform_user_roles` NO tiene ese rol en su JWT.

---

## Flujo objetivo (roles multicapa en JWT)

```
POST /oauth2/token (code exchange)
  └─ AuthorizationController.exchangeToken()
       ├─ ExchangeAuthorizationCodeUseCase.execute()
       ├─ membershipRepository.findEffectiveRoleCodesByUserAndClientApp()  → ["admin"]
       ├─ platformUserRoleRepository.findRoleCodesByUserId()               → ["keygo_admin"]
       ├─ tenantUserRoleRepository.findActiveRoleCodesByTenantUserId()     → ["ADMIN_INTERNAL"]
       └─ IssueTokensUseCase.execute(..., roles=["admin","keygo_admin","ADMIN_INTERNAL"])
            └─ JWT roles claim: ["admin","keygo_admin","ADMIN_INTERNAL"]
                 └─ Filter (.toUpperCase()) → ROLE_ADMIN, ROLE_KEYGO_ADMIN, ROLE_ADMIN_INTERNAL
```

---

## Fases de implementación

### Fase A — Enriquecimiento del JWT (roles multicapa)

**Objetivo:** Que el claim `roles` del JWT incluya app roles + platform roles + tenant roles.

#### A1. Nuevos métodos en puertos existentes

**Archivo:** `keygo-app/.../membership/port/PlatformUserRoleRepositoryPort.java`

Agregar método:
```java
/** Retrieve the role codes for all platform roles assigned to a user. */
List<String> findRoleCodesByUserId(UUID tenantUserId);
```

**Archivo:** `keygo-app/.../membership/port/TenantUserRoleRepositoryPort.java`

Agregar método:
```java
/** Retrieve the codes of all ACTIVE tenant roles for a tenant user. */
List<String> findActiveRoleCodesByTenantUserId(UUID tenantUserId);
```

**Implementaciones JPA** (en `keygo-supabase`): actualizar ambos adapters para implementar los nuevos métodos.

- `PlatformUserRoleRepositoryPort` adapter: consultar `platform_user_roles JOIN platform_roles WHERE tenant_user_id = ?` → retornar `List<String>` con el campo `code`.
- `TenantUserRoleRepositoryPort` adapter: consultar `tenant_user_roles JOIN tenant_roles WHERE tenant_user_id = ? AND removed_at IS NULL` → retornar `List<String>` con el campo `code`.

#### A2. Actualizar `AuthorizationController`

**Archivo:** `keygo-api/.../auth/controller/AuthorizationController.java`

1. Agregar campos:
   ```java
   private final PlatformUserRoleRepositoryPort platformUserRoleRepository;
   private final TenantUserRoleRepositoryPort tenantUserRoleRepository;
   ```

2. Actualizar constructor (2 params nuevos al final):
   ```java
   PlatformUserRoleRepositoryPort platformUserRoleRepository,
   TenantUserRoleRepositoryPort tenantUserRoleRepository
   ```

3. En el método `exchangeToken()` (~línea 448–451), reemplazar:
   ```java
   roles = membershipRepository.findEffectiveRoleCodesByUserAndClientApp(userUUID, clientAppUUID);
   ```
   por:
   ```java
   List<String> appRoles = membershipRepository.findEffectiveRoleCodesByUserAndClientApp(userUUID, clientAppUUID);
   List<String> platformRoles = platformUserRoleRepository.findRoleCodesByUserId(userUUID);
   List<String> tenantRoles = tenantUserRoleRepository.findActiveRoleCodesByTenantUserId(userUUID);
   roles = Stream.of(appRoles, platformRoles, tenantRoles)
       .flatMap(Collection::stream)
       .distinct()
       .toList();
   ```

4. Agregar imports: `java.util.stream.Stream`, `java.util.Collection` (si no existen).

> **Nota importante:** `AuthorizationController` es un `@RestController`, Spring inyecta su constructor automáticamente. No requiere cambio en `ApplicationConfig` — Spring descubrirá los nuevos parámetros en el constructor como beans existentes.

#### A3. Actualizar `RotateRefreshTokenUseCase`

**Archivo:** `keygo-app/.../auth/usecase/RotateRefreshTokenUseCase.java`

1. Agregar campos:
   ```java
   private final PlatformUserRoleRepositoryPort platformUserRoleRepository;
   private final TenantUserRoleRepositoryPort tenantUserRoleRepository;
   ```

2. Actualizar constructor (2 params nuevos, ordenados después de `MembershipRepositoryPort`):
   ```java
   PlatformUserRoleRepositoryPort platformUserRoleRepository,
   TenantUserRoleRepositoryPort tenantUserRoleRepository
   ```

3. En el método `execute()` (~línea 150), reemplazar:
   ```java
   List<String> roles = membershipRepository.findEffectiveRoleCodesByUserAndClientApp(...);
   ```
   por la misma lógica multicapa que en A2.

4. Agregar imports: `io.cmartinezs.keygo.app.membership.port.PlatformUserRoleRepositoryPort`, `io.cmartinezs.keygo.app.membership.port.TenantUserRoleRepositoryPort`.

#### A4. Actualizar wiring en `ApplicationConfig`

**Archivo:** `keygo-run/.../config/ApplicationConfig.java`

El método `rotateRefreshTokenUseCase()` (bean factory) necesita 2 nuevos parámetros:

```java
@Bean
public RotateRefreshTokenUseCase rotateRefreshTokenUseCase(
    RefreshTokenRepositoryPort refreshTokenRepositoryPort,
    SessionRepositoryPort sessionRepositoryPort,
    SigningKeyRepositoryPort signingKeyRepositoryPort,
    TokenSignerPort tokenSignerPort,
    TokenClaimsFactoryPort tokenClaimsFactoryPort,
    TenantRepositoryPort tenantRepositoryPort,
    ClientAppRepositoryPort clientAppRepositoryPort,
    UserRepositoryPort userRepositoryPort,
    MembershipRepositoryPort membershipRepositoryPort,
    PlatformUserRoleRepositoryPort platformUserRoleRepositoryPort,   // NUEVO
    TenantUserRoleRepositoryPort tenantUserRoleRepositoryPort,       // NUEVO
    ClockPort clockPort,
    @Value("${keygo.info.issuer-base-url:http://localhost:8080/keygo-server}")
        String issuerBaseUrl) {
  return new RotateRefreshTokenUseCase(
      refreshTokenRepositoryPort, sessionRepositoryPort,
      signingKeyRepositoryPort, tokenSignerPort,
      tokenClaimsFactoryPort, tenantRepositoryPort,
      clientAppRepositoryPort, userRepositoryPort,
      membershipRepositoryPort,
      platformUserRoleRepositoryPort,    // NUEVO
      tenantUserRoleRepositoryPort,      // NUEVO
      clockPort, issuerBaseUrl);
}
```

Agregar los imports correspondientes de `PlatformUserRoleRepositoryPort` y `TenantUserRoleRepositoryPort`.

#### A5. Tests de Fase A

- `RotateRefreshTokenUseCaseTest` — agregar `@Mock PlatformUserRoleRepositoryPort`, `@Mock TenantUserRoleRepositoryPort`; actualizar casos de prueba para verificar que los roles de plataforma y tenant se incluyen en el JWT.
- Crear `AuthorizationControllerRolesEnrichmentTest` (unitario, sin Spring context) que verifique que los 3 puertos son consultados y el resultado es merged correctamente.

---

### Fase B — Corrección de bug en `RevokeTenantRoleUseCase`

**Archivo:** `keygo-app/.../membership/usecase/RevokeTenantRoleUseCase.java`

**Bug actual:**
```java
// ❌ INCORRECTO: findByTenantId espera un tenant ID, no un user ID
boolean roleExists = tenantRoleRepositoryPort.findByTenantId(tenantUserId).stream()
    .anyMatch(r -> r.getId().value().equals(tenantRoleId));
if (!roleExists && tenantRoleRepositoryPort.findByTenantId(tenantUserId).isEmpty()) {
    throw new TenantRoleNotFoundException(tenantRoleId);
}
```

**B1. Agregar `findById` a `TenantRoleRepositoryPort`**

```java
/** Retrieve a tenant role by its ID. */
Optional<TenantRole> findById(UUID id);
```

**B2. Implementar en el adapter JPA** (`keygo-supabase`): `tenantRoleJpaRepository.findById(id).map(mapper::toDomain)`.

**B3. Corregir `RevokeTenantRoleUseCase.execute()`:**

```java
public void execute(UUID tenantUserId, UUID tenantRoleId) {
    // ✅ Validar que el rol existe (por su propio ID)
    tenantRoleRepositoryPort.findById(tenantRoleId)
        .orElseThrow(() -> new TenantRoleNotFoundException(tenantRoleId));
    // ✅ Revocar (soft-delete)
    tenantUserRoleRepositoryPort.revoke(tenantUserId, tenantRoleId);
}
```

**B4. Actualizar `RevokeTenantRoleUseCaseTest`** — quitar mock de `findByTenantId`, agregar mock de `findById`.

---

### Fase C — Auto-asignación de rol en `RegisterTenantUserUseCase`

**Objetivo:** Cuando un usuario se registra, opcionalmente asignarle un rol de tenant por defecto.

#### C1. Actualizar `RegisterTenantUserCommand`

**Archivo:** `keygo-app/.../user/command/RegisterTenantUserCommand.java`

Agregar campo opcional:
```java
/** Optional default tenant role code to assign upon registration. Null = no role assigned. */
@Nullable String defaultRoleCode
```

Si `RegisterTenantUserCommand` es un Java `record`, agregar el campo al final del record.

#### C2. Actualizar `RegisterTenantUserUseCase`

**Archivo:** `keygo-app/.../user/usecase/RegisterTenantUserUseCase.java`

1. Agregar nuevas dependencias al constructor:
   ```java
   private final TenantRoleRepositoryPort tenantRoleRepositoryPort;
   private final TenantUserRoleRepositoryPort tenantUserRoleRepositoryPort;
   ```

2. Al final de `execute()`, después de persistir el usuario y antes de enviar el email de verificación:
   ```java
   // Assign default tenant role if provided
   if (command.defaultRoleCode() != null) {
     tenantRoleRepositoryPort
         .findByTenantAndCode(tenant.getId().value(), command.defaultRoleCode())
         .ifPresent(role ->
             tenantUserRoleRepositoryPort.assign(createdUser.getId().value(), role.getId().value()));
   }
   ```
   Si el rol no existe, se ignora silenciosamente (sin excepción).

#### C3. Actualizar `ApplicationConfig` wiring

Agregar los 2 nuevos puertos al `@Bean` de `registerTenantUserUseCase`.

#### C4. Actualizar `RegistrationController`

**Archivo:** `keygo-api/.../registration/controller/RegistrationController.java`

En el endpoint `POST /{slug}/apps/{clientId}/register`, agregar campo `defaultRoleCode` (opcional) al request body o bien dejarlo como null si el registro público no debe asignar roles automáticamente.

> **Decisión de diseño:** Para el flujo de registro público (`/register`), la recomendación es **no exponer `defaultRoleCode` al cliente**. En cambio, el admin del tenant configura el rol por defecto para la app. Si se quiere configurable, ver alternativa en sección "Diseño alternativo" al final.

#### C5. Tests

Actualizar `RegisterTenantUserUseCaseTest`:
- Caso: `defaultRoleCode = null` → no se llama `tenantRoleRepositoryPort`
- Caso: `defaultRoleCode = "USER"`, rol encontrado → `tenantUserRoleRepositoryPort.assign()` llamado
- Caso: `defaultRoleCode = "USER"`, rol no encontrado → no lanza excepción

---

### Fase D — Endpoints REST para Gestión RBAC

> **Estado actual:** Los use cases existen pero no hay controllers.

#### D1. Identificar use cases existentes vs. faltantes

| Acción | Use Case | Estado |
|---|---|---|
| Crear platform role | `CreatePlatformRoleUseCase` | ❓ Verificar si existe |
| Asignar platform role a user | `AssignPlatformRoleUseCase` | ✅ Existe |
| Revocar platform role de user | `RevokePlatformRoleUseCase` | ✅ Existe |
| Listar platform roles | `ListPlatformRolesUseCase` | ❌ Falta crear |
| Listar platform role assignments de un user | — | ❌ Falta crear |
| Crear tenant role | `CreateTenantRoleUseCase` | ✅ Existe |
| Asignar tenant role a user | `AssignTenantRoleUseCase` | ✅ Existe |
| Revocar tenant role de user | `RevokeTenantRoleUseCase` | ✅ Existe (bug en Fase B) |
| Listar tenant roles de un tenant | `ListTenantRolesUseCase` | ❌ Falta crear |
| Listar tenant role assignments de un user | — | ❌ Falta crear |

#### D2. Crear `PlatformRbacController` — ADMIN only

**Archivo a crear:** `keygo-api/.../platform/controller/PlatformRbacController.java`

```
@RestController
@RequestMapping("/api/v1/platform")
@PreAuthorize("hasRole('ADMIN')")
```

Endpoints:

| Método | Path | Acción |
|---|---|---|
| `POST` | `/platform/roles` | Crear platform role |
| `GET` | `/platform/roles` | Listar todos los platform roles |
| `POST` | `/platform/users/{userId}/roles` | Asignar platform role a user |
| `DELETE` | `/platform/users/{userId}/roles/{roleCode}` | Revocar platform role de user |
| `GET` | `/platform/users/{userId}/roles` | Listar platform roles de un user |

Response codes a agregar en `ResponseCode` enum:
- `PLATFORM_ROLE_CREATED`
- `PLATFORM_ROLE_ASSIGNED`
- `PLATFORM_ROLE_REVOKED`
- `PLATFORM_ROLES_RETRIEVED`

#### D3. Crear `TenantRbacController` — ADMIN + ADMIN_TENANT

**Archivo a crear:** `keygo-api/.../tenant/controller/TenantRbacController.java`

```
@RestController
@RequestMapping("/api/v1/tenants/{slug}")
@PreAuthorize("hasAnyRole('ADMIN','ADMIN_TENANT') and @tenantAuthorizationEvaluator.hasTenantAccess(authentication)")
```

Endpoints:

| Método | Path | Acción |
|---|---|---|
| `POST` | `/tenants/{slug}/roles` | Crear tenant role |
| `GET` | `/tenants/{slug}/roles` | Listar roles del tenant |
| `POST` | `/tenants/{slug}/users/{userId}/roles` | Asignar tenant role a user |
| `DELETE` | `/tenants/{slug}/users/{userId}/roles/{roleId}` | Revocar tenant role de user |
| `GET` | `/tenants/{slug}/users/{userId}/roles` | Listar roles activos del user en el tenant |

Response codes a agregar en `ResponseCode` enum:
- `TENANT_ROLE_CREATED`
- `TENANT_ROLE_ASSIGNED`
- `TENANT_ROLE_REVOKED`
- `TENANT_ROLES_RETRIEVED`
- `USER_ROLES_RETRIEVED`

#### D4. Use cases faltantes a crear

Para los endpoints de listado necesitamos:

**`ListPlatformRolesUseCase`** (`keygo-app/.../membership/usecase/`):
- Port: `PlatformRoleRepositoryPort.findAll()` — agregar si no existe
- Retorna: `List<PlatformRole>`

**`ListTenantRolesUseCase`** (`keygo-app/.../membership/usecase/`):
- Port: `TenantRoleRepositoryPort.findActiveByTenantId(UUID tenantId)` — ya existe
- Retorna: `List<TenantRole>` para el tenant dado

**`GetUserPlatformRolesUseCase`** (`keygo-app/.../membership/usecase/`):
- Port: `PlatformUserRoleRepositoryPort.findByUserId(UUID tenantUserId)` — ya existe
- Retorna: `List<PlatformUserRole>`

**`GetUserTenantRolesUseCase`** (`keygo-app/.../membership/usecase/`):
- Port: `TenantUserRoleRepositoryPort.findActiveByTenantUserId(UUID tenantUserId)` — ya existe
- Retorna: `List<TenantUserRole>`

---

### Fase E — Documentación AI obligatoria

Al concluir las Fases A–D:

1. **`AGENTS.md`** — actualizar "Entradas recientes" con T-111-INT; añadir nuevos endpoints REST a la tabla de context-path
2. **`docs/ai/agents-registro.md`** — entrada completa con todos los artefactos creados/modificados
3. **`docs/ai/lecciones.md`** — al menos:
   - Lección sobre enriquecimiento multicapa de JWT roles
   - Lección sobre el bug de `RevokeTenantRoleUseCase`
4. **`ROADMAP.md`** — marcar T-111-INT ✅ completada (o T-112 si se registra como propuesta separada)
5. **`docs/postman/KeyGo-Server.postman_collection.json`** — agregar requests para los nuevos endpoints RBAC
6. **`docs/keygo-ui/FRONTEND_DEVELOPER_GUIDE.md`** — sección §14 con nuevos endpoints

---

## Orden de ejecución recomendado

```
B (bug fix) → A (JWT enrichment) → C (registration default role) → D (REST controllers)
```

Razón: B corrige el bug antes de que se propague; A es la integración más crítica (afecta todos los logins); C es simple y de alto valor; D es la mayor cantidad de código nuevo.

---

## Archivos afectados por fase (resumen)

### Fase A
| Módulo | Archivo | Acción |
|---|---|---|
| `keygo-app` | `PlatformUserRoleRepositoryPort.java` | + método `findRoleCodesByUserId` |
| `keygo-app` | `TenantUserRoleRepositoryPort.java` | + método `findActiveRoleCodesByTenantUserId` |
| `keygo-supabase` | adapter de `PlatformUserRoleRepositoryPort` | implementar nuevo método |
| `keygo-supabase` | adapter de `TenantUserRoleRepositoryPort` | implementar nuevo método |
| `keygo-api` | `AuthorizationController.java` | + 2 puertos; merge roles multicapa |
| `keygo-app` | `RotateRefreshTokenUseCase.java` | + 2 puertos; merge roles multicapa |
| `keygo-run` | `ApplicationConfig.java` | + 2 params en `rotateRefreshTokenUseCase` bean |
| tests | `RotateRefreshTokenUseCaseTest.java` | + mocks de nuevos puertos |

### Fase B
| Módulo | Archivo | Acción |
|---|---|---|
| `keygo-app` | `TenantRoleRepositoryPort.java` | + método `findById(UUID)` |
| `keygo-supabase` | adapter de `TenantRoleRepositoryPort` | implementar `findById` |
| `keygo-app` | `RevokeTenantRoleUseCase.java` | corregir bug lógica de validación |
| tests | `RevokeTenantRoleUseCaseTest.java` | actualizar mocks y casos |

### Fase C
| Módulo | Archivo | Acción |
|---|---|---|
| `keygo-app` | `RegisterTenantUserCommand.java` | + campo `defaultRoleCode` |
| `keygo-app` | `RegisterTenantUserUseCase.java` | + 2 puertos; auto-assign lógica |
| `keygo-run` | `ApplicationConfig.java` | + 2 params en `registerTenantUserUseCase` bean |
| `keygo-api` | `RegistrationController.java` | revisión (exponer o no `defaultRoleCode`) |
| tests | `RegisterTenantUserUseCaseTest.java` | nuevos escenarios de auto-assign |

### Fase D
| Módulo | Archivo | Acción |
|---|---|---|
| `keygo-app` | `ListPlatformRolesUseCase.java` | CREAR |
| `keygo-app` | `ListTenantRolesUseCase.java` | CREAR |
| `keygo-app` | `GetUserPlatformRolesUseCase.java` | CREAR |
| `keygo-app` | `GetUserTenantRolesUseCase.java` | CREAR |
| `keygo-api` | `PlatformRbacController.java` | CREAR |
| `keygo-api` | `TenantRbacController.java` | CREAR |
| `keygo-api` | `ResponseCode.java` (enum) | + 9 nuevos códigos |
| `keygo-run` | `ApplicationConfig.java` | + beans de nuevos use cases |

---

## Diseño alternativo: rol por defecto configurable por ClientApp

En lugar de pasar `defaultRoleCode` en el request de registro, el administrador configura el rol por defecto en la `ClientApp`:

```sql
ALTER TABLE client_apps ADD COLUMN default_registration_role_code VARCHAR(100);
```

Ventajas:
- El usuario final no controla qué rol recibe
- El administrador lo configura una sola vez por app
- El flujo de registro no cambia la API pública

Desventaja: requiere nueva migración Flyway y cambios en `ClientApp` dominio/entidad.

> **Recomendación:** Implementar la versión simple (Campo en `RegisterTenantUserCommand`) primero. Migrar a la versión configurable por `ClientApp` como T-NNN en el roadmap si se necesita.

---

## Verificación al finalizar

```bash
./mvnw -pl keygo-app,keygo-supabase,keygo-api,keygo-run -am test -q
./mvnw clean package -q
```

Criterios de éxito:
- [ ] JWT de un usuario con `keygo_admin` en `platform_user_roles` incluye `"keygo_admin"` en el claim `roles`
- [ ] JWT de un usuario con `ADMIN_INTERNAL` en `tenant_user_roles` incluye `"ADMIN_INTERNAL"` en el claim `roles`
- [ ] `RevokeTenantRoleUseCase` valida la existencia del rol por `tenantRoleId` (no por `tenantUserId`)
- [ ] Usuario auto-registrado puede recibir rol de tenant si se configura
- [ ] Todos los tests pasan
