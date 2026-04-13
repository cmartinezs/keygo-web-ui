# Fase C — Flujo de Autenticación de Plataforma

> Instrucciones para crear el nuevo flujo de autenticación de plataforma (`/api/v1/platform/...`),
> separado del flujo de tenant apps (`/api/v1/tenants/{slug}/...`).

---

## Contexto

El flujo existente (`AuthorizationController` bajo `/api/v1/tenants/{tenantSlug}`) fue diseñado para autenticar usuarios en apps de tenants específicos (OAuth2 Authorization Code + PKCE con membership roles).

El nuevo flujo de plataforma es más simple:
- **Usuario:** `platform_users` (identidad global)
- **Credenciales:** email + password
- **JWT resultante:** contiene `platform_roles` (de `platform_user_roles`)
- **Sin PKCE:** es un flujo directo (KeyGo UI es la única "app" que usa este endpoint)
- **Sesión:** `sessions` con `client_app_id = NULL` (sesión de plataforma)

---

## C1. Nuevos endpoints de plataforma

| Método | Path | Descripción |
|---|---|---|
| `POST` | `/api/v1/platform/account/login` | Autenticar platform user; retorna `access_token` + `refresh_token` |
| `POST` | `/api/v1/platform/oauth2/token` | Rotar refresh token de plataforma |
| `POST` | `/api/v1/platform/oauth2/revoke` | Revocar token de plataforma (RFC 7009) |
| `GET`  | `/api/v1/platform/account/sessions` | Listar sesiones activas del platform user |
| `DELETE` | `/api/v1/platform/account/sessions/{sessionId}` | Revocar sesión de plataforma |

> **No se implementa `/authorize`** en la plataforma porque KeyGo UI no usa Authorization Code + PKCE. El login es directo (email/password → tokens).

---

## C2. Crear controller `PlatformAuthController`

**Archivo a crear:**
`keygo-api/src/main/java/io/cmartinezs/keygo/api/platform/controller/PlatformAuthController.java`

```java
@RestController
@RequestMapping("/api/v1/platform")
public class PlatformAuthController {

    private final AuthenticatePlatformUserUseCase authenticatePlatformUserUseCase;
    private final IssuePlatformTokensUseCase issuePlatformTokensUseCase;
    // Inyectados por constructor (Spring autowires @RestController)

    @PostMapping("/account/login")
    public ResponseEntity<BaseResponse<PlatformTokenData>> login(
            @RequestBody @Valid PlatformLoginRequest request) {
        
        // 1. Autenticar platform user (valida email + password + status)
        PlatformUser platformUser = authenticatePlatformUserUseCase.execute(
            AuthenticatePlatformUserCommand.of(request.getEmail(), request.getPassword()));
        
        // 2. Emitir tokens (access_token + refresh_token)
        PlatformTokensResult result = issuePlatformTokensUseCase.execute(
            IssuePlatformTokensCommand.of(platformUser));
        
        return ResponseEntity.ok(
            BaseResponse.<PlatformTokenData>builder()
                .data(PlatformTokenData.from(result))
                .success(ResponseHelper.message(ResponseCode.PLATFORM_LOGIN_SUCCESS))
                .build());
    }

    @PostMapping("/oauth2/token")  
    public ResponseEntity<BaseResponse<PlatformTokenData>> rotateToken(
            @RequestParam("grant_type") String grantType,
            @RequestParam("refresh_token") String refreshToken) {
        // Validar grant_type = "refresh_token"
        // Rotar refresh token de plataforma
        // ...
    }
}
```

---

## C3. Crear use case `IssuePlatformTokensUseCase`

**Archivo a crear:** `keygo-app/src/main/java/io/cmartinezs/keygo/app/platform/usecase/IssuePlatformTokensUseCase.java`

**Responsabilidades:**
1. Buscar `platform_user_roles` del usuario via `PlatformUserRoleRepositoryPort.findByPlatformUserId()`
2. Construir lista de role codes para el JWT
3. Llamar a `TokenSignerPort` para emitir access token con claims: `sub=platformUser.id`, `email=platformUser.email`, `roles=[...]`, `scope=openid profile platform`
4. Crear sesión via `SessionRepositoryPort.openPlatformSession()` (sin `client_app_id`)
5. Crear refresh token via `RefreshTokenRepositoryPort.create()`
6. Retornar `IssuePlatformTokensResult(accessToken, refreshToken, expiresIn)`

**Command:** `IssuePlatformTokensCommand(platformUser: PlatformUser)`

**Result:** `IssuePlatformTokensResult(accessToken: String, refreshToken: String, expiresIn: long, tokenType: String)`

---

## C4. DTO de request y response

### PlatformLoginRequest

**Archivo a crear:** `keygo-api/src/main/java/io/cmartinezs/keygo/api/platform/request/PlatformLoginRequest.java`

```java
public record PlatformLoginRequest(
    @NotBlank @Email String email,
    @NotBlank String password
) {}
```

### PlatformTokenData

**Archivo a crear:** `keygo-api/src/main/java/io/cmartinezs/keygo/api/platform/response/PlatformTokenData.java`

```java
public record PlatformTokenData(
    String accessToken,
    String refreshToken,
    String tokenType,
    Long expiresIn
) {
    public static PlatformTokenData from(IssuePlatformTokensResult result) { ... }
}
```

---

## C5. Nuevo `ResponseCode` de plataforma

Agregar al enum `ResponseCode` existente en `keygo-api`:

```java
PLATFORM_LOGIN_SUCCESS("PLT-001", "Platform login successful"),
PLATFORM_TOKEN_ISSUED("PLT-002", "Platform token issued"),
PLATFORM_TOKEN_ROTATED("PLT-003", "Platform token rotated"),
PLATFORM_TOKEN_REVOKED("PLT-004", "Platform token revoked"),
```

---

## C6. Configuración de seguridad — rutas públicas de plataforma

### C6.1. En `KeyGoBootstrapProperties`

Agregar propiedades:
```java
private String platformLoginPathSuffix = "/platform/account/login";
private String platformTokenPathSuffix = "/platform/oauth2/token";
private String platformRevokePathSuffix = "/platform/oauth2/revoke";
```

### C6.2. En `BootstrapAdminKeyFilter`

Las rutas `/api/v1/platform/account/login`, `/api/v1/platform/oauth2/token` y `/api/v1/platform/oauth2/revoke` deben ser públicas (no requieren Bearer token para acceder al login inicial).

Las rutas `/api/v1/platform/account/sessions` y `/api/v1/platform/account/sessions/{id}` SÍ requieren Bearer token (son autenticadas con el access token de plataforma).

Agregar lógica de detección de paths de plataforma en la sección de "public paths" del filtro.

### C6.3. En `application.yml`

```yaml
keygo:
  bootstrap:
    platform-login-path-suffix: /platform/account/login
    platform-token-path-suffix: /platform/oauth2/token
    platform-revoke-path-suffix: /platform/oauth2/revoke
```

---

## C7. JWT de plataforma — estructura de claims

El access token emitido por el flujo de plataforma tendrá:

```json
{
  "iss": "https://keygo.io",
  "sub": "<platform_user_id>",
  "email": "admin@keygo.io",
  "username": "keygo_admin",
  "roles": ["keygo_admin", "keygo_tenant_admin"],
  "scope": "openid profile platform",
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Diferencias respecto al JWT de tenant app:**
- `sub` es `platform_user_id` (no `tenant_user_id`)
- No hay `tenant_slug` ni `client_id` claims
- `roles` vienen de `platform_user_roles` (no de `memberships`)
- `scope` incluye `platform` para distinguirlos

> **`@PreAuthorize` en endpoints de plataforma:** Los endpoints de gestión de plataforma  
> usan `@PreAuthorize("hasRole('KEYGO_ADMIN')")` → Spring authority `ROLE_KEYGO_ADMIN`.  
> `BootstrapAdminKeyFilter` mappea `roles: ["keygo_admin"]` → `ROLE_KEYGO_ADMIN`.

---

## C8. Rotar refresh token de plataforma

### C8.1. Crear use case `RotatePlatformRefreshTokenUseCase`

**Archivo a crear:** `keygo-app/src/main/java/io/cmartinezs/keygo/app/platform/usecase/RotatePlatformRefreshTokenUseCase.java`

**Lógica:**
1. Buscar refresh token por hash (SHA-256 del token recibido)
2. Validar que no esté `USED`/`EXPIRED`/`REVOKED`
3. Validar que la sesión esté `ACTIVE`
4. Verificar que `session.client_app_id IS NULL` (es sesión de plataforma)
5. Emitir nuevo access token + nuevo refresh token
6. Marcar old refresh token como `USED` (`replaced_by_id = new token id`)

---

## C9. Wiring en `ApplicationConfig`

```java
@Bean
public IssuePlatformTokensUseCase issuePlatformTokensUseCase(
        PlatformUserRoleRepositoryPort platformUserRoleRepository,
        TokenSignerPort tokenSigner,
        SessionRepositoryPort sessionRepository,
        RefreshTokenRepositoryPort refreshTokenRepository) {
    return new IssuePlatformTokensUseCase(
        platformUserRoleRepository, tokenSigner, sessionRepository, refreshTokenRepository);
}

@Bean
public RotatePlatformRefreshTokenUseCase rotatePlatformRefreshTokenUseCase(
        RefreshTokenRepositoryPort refreshTokenRepository,
        SessionRepositoryPort sessionRepository,
        PlatformUserRoleRepositoryPort platformUserRoleRepository,
        TokenSignerPort tokenSigner) {
    return new RotatePlatformRefreshTokenUseCase(
        refreshTokenRepository, sessionRepository, platformUserRoleRepository, tokenSigner);
}
```

---

## C10. Tests

| Test | Casos mínimos |
|---|---|
| `IssuePlatformTokensUseCaseTest` | roles vacíos (solo emit), roles presentes, firma correcta |
| `RotatePlatformRefreshTokenUseCaseTest` | token inválido, sesión terminada, rotación exitosa |
| `PlatformAuthControllerTest` (`@WebMvcTest`) | login exitoso, credenciales inválidas, usuario suspendido |
