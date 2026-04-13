# Fase G — API de Gestión de Platform Users

> Instrucciones para crear los endpoints REST de gestión de `platform_users`.

---

## G1. Endpoints de gestión de plataforma

| Método | Path | Descripción | Autorización |
|---|---|---|---|
| `POST` | `/api/v1/platform/users` | Crear platform user | `KEYGO_ADMIN` |
| `GET` | `/api/v1/platform/users` | Listar platform users (paginado) | `KEYGO_ADMIN` |
| `GET` | `/api/v1/platform/users/{userId}` | Obtener platform user por ID | `KEYGO_ADMIN` |
| `PUT` | `/api/v1/platform/users/{userId}` | Actualizar perfil platform user | `KEYGO_ADMIN` |
| `PUT` | `/api/v1/platform/users/{userId}/suspend` | Suspender platform user | `KEYGO_ADMIN` |
| `PUT` | `/api/v1/platform/users/{userId}/activate` | Activar platform user | `KEYGO_ADMIN` |
| `POST` | `/api/v1/platform/users/{userId}/platform-roles` | Asignar rol de plataforma | `KEYGO_ADMIN` |
| `DELETE` | `/api/v1/platform/users/{userId}/platform-roles/{roleCode}` | Revocar rol de plataforma | `KEYGO_ADMIN` |
| `GET` | `/api/v1/platform/users/{userId}/platform-roles` | Listar roles del platform user | `KEYGO_ADMIN` |

---

## G2. Crear controller `PlatformUserController`

**Archivo a crear:** `keygo-api/src/main/java/io/cmartinezs/keygo/api/platform/controller/PlatformUserController.java`

```java
@RestController
@RequestMapping("/api/v1/platform/users")
public class PlatformUserController {

    private final CreatePlatformUserUseCase createPlatformUserUseCase;
    private final GetPlatformUserUseCase getPlatformUserUseCase;
    private final UpdatePlatformUserUseCase updatePlatformUserUseCase;
    private final SuspendPlatformUserUseCase suspendPlatformUserUseCase;
    private final AssignPlatformRoleUseCase assignPlatformRoleUseCase;
    private final RevokePlatformRoleUseCase revokePlatformRoleUseCase;
    private final ListPlatformUserRolesUseCase listPlatformUserRolesUseCase;

    @PostMapping
    @PreAuthorize("hasRole('KEYGO_ADMIN')")
    public ResponseEntity<BaseResponse<PlatformUserData>> createUser(
            @RequestBody @Valid CreatePlatformUserRequest request) {
        PlatformUser user = createPlatformUserUseCase.execute(
            CreatePlatformUserCommand.from(request));
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(BaseResponse.<PlatformUserData>builder()
                .data(PlatformUserData.from(user))
                .success(ResponseHelper.message(ResponseCode.PLATFORM_USER_CREATED))
                .build());
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('KEYGO_ADMIN')")
    public ResponseEntity<BaseResponse<PlatformUserData>> getUser(
            @PathVariable UUID userId) {
        PlatformUser user = getPlatformUserUseCase.execute(userId);
        return ResponseEntity.ok(BaseResponse.<PlatformUserData>builder()
            .data(PlatformUserData.from(user))
            .success(ResponseHelper.message(ResponseCode.PLATFORM_USER_RETRIEVED))
            .build());
    }

    @PostMapping("/{userId}/platform-roles")
    @PreAuthorize("hasRole('KEYGO_ADMIN')")
    public ResponseEntity<BaseResponse<Void>> assignRole(
            @PathVariable UUID userId,
            @RequestBody @Valid AssignPlatformRoleRequest request) {
        assignPlatformRoleUseCase.execute(userId, request.roleCode());
        return ResponseEntity.ok(BaseResponse.<Void>builder()
            .success(ResponseHelper.message(ResponseCode.PLATFORM_ROLE_ASSIGNED))
            .build());
    }

    @DeleteMapping("/{userId}/platform-roles/{roleCode}")
    @PreAuthorize("hasRole('KEYGO_ADMIN')")
    public ResponseEntity<BaseResponse<Void>> revokeRole(
            @PathVariable UUID userId,
            @PathVariable String roleCode) {
        revokePlatformRoleUseCase.execute(userId, roleCode);
        return ResponseEntity.ok(BaseResponse.<Void>builder()
            .success(ResponseHelper.message(ResponseCode.PLATFORM_ROLE_REVOKED))
            .build());
    }
}
```

---

## G3. DTOs de request y response

### G3.1. `CreatePlatformUserRequest`

**Archivo:** `keygo-api/src/main/java/io/cmartinezs/keygo/api/platform/request/CreatePlatformUserRequest.java`

```java
public record CreatePlatformUserRequest(
    @NotBlank @Email    String email,
    @NotBlank @Size(min=3, max=100) String username,
    @NotBlank @Size(min=8) String password,
    String firstName,
    String lastName
) {}
```

### G3.2. `PlatformUserData`

**Archivo:** `keygo-api/src/main/java/io/cmartinezs/keygo/api/platform/response/PlatformUserData.java`

```java
public record PlatformUserData(
    String id,
    String email,
    String username,
    String firstName,
    String lastName,
    String status,
    String createdAt
) {
    public static PlatformUserData from(PlatformUser user) { ... }
}
```

### G3.3. `AssignPlatformRoleRequest`

```java
public record AssignPlatformRoleRequest(
    @NotBlank String roleCode
) {}
```

---

## G4. Nuevos ResponseCode

Agregar al enum `ResponseCode`:

```java
// Platform User management
PLATFORM_USER_CREATED("PLT-010", "Platform user created"),
PLATFORM_USER_RETRIEVED("PLT-011", "Platform user retrieved"),
PLATFORM_USER_UPDATED("PLT-012", "Platform user updated"),
PLATFORM_USER_SUSPENDED("PLT-013", "Platform user suspended"),
PLATFORM_USER_ACTIVATED("PLT-014", "Platform user activated"),
PLATFORM_USER_NOT_FOUND("PLT-015", "Platform user not found"),

// Platform Role management
PLATFORM_ROLE_ASSIGNED("PLT-020", "Platform role assigned"),
PLATFORM_ROLE_REVOKED("PLT-021", "Platform role revoked"),
PLATFORM_ROLE_NOT_FOUND("PLT-022", "Platform role not found"),
```

---

## G5. `GlobalExceptionHandler` — manejar `PlatformUserNotFoundException`

Agregar en `GlobalExceptionHandler`:

```java
@ExceptionHandler(PlatformUserNotFoundException.class)
public ResponseEntity<BaseResponse<ErrorData>> handlePlatformUserNotFound(
        PlatformUserNotFoundException ex) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(BaseResponse.<ErrorData>builder()
            .failure(ResponseHelper.message(ResponseCode.PLATFORM_USER_NOT_FOUND))
            .data(ErrorData.of(ex.getMessage()))
            .build());
}
```

---

## G6. Wiring en `ApplicationConfig`

```java
@Bean
public GetPlatformUserUseCase getPlatformUserUseCase(
        PlatformUserRepositoryPort platformUserRepository) {
    return new GetPlatformUserUseCase(platformUserRepository);
}

@Bean
public UpdatePlatformUserUseCase updatePlatformUserUseCase(
        PlatformUserRepositoryPort platformUserRepository) {
    return new UpdatePlatformUserUseCase(platformUserRepository);
}

@Bean
public SuspendPlatformUserUseCase suspendPlatformUserUseCase(
        PlatformUserRepositoryPort platformUserRepository) {
    return new SuspendPlatformUserUseCase(platformUserRepository);
}

// AssignPlatformRoleUseCase y RevokePlatformRoleUseCase ya existen de T-111
// Solo actualizar para usar platformUserId en vez de tenantUserId
```

---

## G7. Endpoints de autenticación propia del platform user

Además de la gestión admin, los platform users necesitan self-service:

| Método | Path | Descripción | Auth |
|---|---|---|---|
| `GET` | `/api/v1/platform/account/me` | Obtener perfil propio | Bearer |
| `PATCH` | `/api/v1/platform/account/me` | Actualizar perfil propio | Bearer |
| `POST` | `/api/v1/platform/account/change-password` | Cambiar contraseña propia | Bearer |

Estos endpoints son similares a los existentes en `/api/v1/tenants/{slug}/account/...` pero para platform users.

**Para MVP:** Implementar solo `GET /api/v1/platform/account/me`. Los demás pueden diferirse.

---

## G8. Tests

| Test | Casos mínimos |
|---|---|
| `PlatformUserControllerTest` | crear exitoso, email duplicado, sin autenticación (401), sin rol KEYGO_ADMIN (403) |
| `GetPlatformUserUseCaseTest` | usuario encontrado, no encontrado |
| `SuspendPlatformUserUseCaseTest` | suspender activo, suspender ya suspendido |
