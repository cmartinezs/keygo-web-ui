# Fase E — RBAC en JWT: Integración Multicapa

> Instrucciones para enriquecer el JWT con roles del nivel correcto según el flujo de autenticación.

---

## E1. Diseño: dos contextos de JWT, dos fuentes de roles

| Flujo | Controller | Fuente de roles | Claims JWT |
|---|---|---|---|
| **Platform** | `PlatformAuthController` | `platform_user_roles` | `roles: ["keygo_admin"]` |
| **Tenant app** | `AuthorizationController` | `memberships → app_roles` | `roles: ["admin_tenant"]` |

Los roles de plataforma **NO aparecen en JWT de tenant app** y viceversa. Cada token pertenece a un contexto.

> **Nota sobre tenant_user_roles:** Los `tenant_user_roles` (T-111) representan roles de scope de tenant (ej. puede gestionar usuarios del tenant, crear apps). En MVP, estos se omiten del JWT. Si se necesitan, se agregarían al JWT de tenant app como claim separado `tenant_roles`.

---

## E2. Flujo Platform — cómo se agregan roles al JWT

### E2.1. En `IssuePlatformTokensUseCase.execute()`

```java
// Obtener platform roles
List<String> platformRoleCodes = platformUserRoleRepository
    .findByPlatformUserId(platformUser.getId())
    .stream()
    .map(r -> r.getRole().getCode())
    .toList();

// Emitir token con roles de plataforma
IssueTokensResult tokensResult = issueTokensUseCase.execute(
    null,                    // tenantId = null (es plataforma, no tenant-scoped)
    "https://keygo.io",      // issuer de plataforma (configurable)
    platformUser.getId().toString(),
    "keygo-ui",              // audience: la UI de KeyGo
    "openid profile platform",
    null,                    // nonce
    platformUser.getEmail().value(),
    platformUser.getFullName(),
    null,                    // authorizationCodeId (no hay code en platform flow)
    platformRoleCodes        // ← roles de plataforma
);
```

### E2.2. El `IssueTokensUseCase` no cambia

El use case existente ya acepta `List<String> roles` como parámetro y los incluye en el claim `roles`. No requiere modificación.

---

## E3. Flujo Tenant App — roles sin cambio (solo membresías)

El flujo existente en `AuthorizationController.token()` ya incluye:
```java
roles = membershipRepository.findEffectiveRoleCodesByUserAndClientApp(userUUID, clientAppUUID);
```

**No hay cambio en esta lógica.** El JWT de tenant app sigue teniendo solo roles de membresía.

---

## E4. Refresh token rotation — bifurcación de roles

Ver Fase D (sección D4). El `RotateRefreshTokenUseCase` necesita saber si es sesión de plataforma o de tenant app:

```java
// Determinar tipo de sesión
boolean isPlatformSession = session.getClientAppId() == null;

List<String> roles;
if (isPlatformSession) {
    // Roles de plataforma para el nuevo token
    roles = platformUserRoleRepository
        .findByPlatformUserId(session.getPlatformUserId())
        .stream()
        .map(r -> r.getRole().getCode())
        .toList();
} else {
    // Roles de membresía (sin cambio)
    roles = membershipRepository
        .findEffectiveRoleCodesByUserAndClientApp(
            refreshToken.getTenantUserId(),
            session.getClientAppId());
}
```

**Impacto en `ApplicationConfig`:** `rotateRefreshTokenUseCase` bean necesita inyectar `platformUserRoleRepository` adicional.

---

## E5. `BootstrapAdminKeyFilter` — mapeo de roles a authorities

No requiere cambio. El filtro ya mapea:
```java
// línea ~200
.map(role -> "ROLE_" + role.toUpperCase())
```

Por lo tanto:
- `keygo_admin` → `ROLE_KEYGO_ADMIN`
- `keygo_tenant_admin` → `ROLE_KEYGO_TENANT_ADMIN`
- `keygo_user` → `ROLE_KEYGO_USER`
- `admin_tenant` → `ROLE_ADMIN_TENANT`
- `user_tenant` → `ROLE_USER_TENANT`

---

## E6. Tabla de `@PreAuthorize` actualizada

| Endpoint | `@PreAuthorize` | Rol esperado |
|---|---|---|
| `GET /api/v1/platform/users` | `hasRole('KEYGO_ADMIN')` | `ROLE_KEYGO_ADMIN` |
| `POST /api/v1/platform/users` | `hasRole('KEYGO_ADMIN')` | `ROLE_KEYGO_ADMIN` |
| `GET /api/v1/tenants` (admin list) | `hasRole('KEYGO_ADMIN')` | `ROLE_KEYGO_ADMIN` |
| `GET /api/v1/admin/platform/dashboard` | `hasRole('KEYGO_ADMIN')` | `ROLE_KEYGO_ADMIN` |
| `GET /api/v1/platform/stats` | `hasRole('KEYGO_ADMIN')` | `ROLE_KEYGO_ADMIN` |
| `POST /api/v1/tenants/{slug}/users` | `hasRole('ADMIN_TENANT')` | `ROLE_ADMIN_TENANT` |
| `GET /api/v1/tenants/{slug}/users` | `hasRole('ADMIN_TENANT')` | `ROLE_ADMIN_TENANT` |
| `GET /api/v1/tenants/{slug}/apps/{id}` | `hasRole('ADMIN_TENANT')` | `ROLE_ADMIN_TENANT` |

> **Revisar todos los `@PreAuthorize` que usan `hasRole('ADMIN')`** — algunos podrían requerir `KEYGO_ADMIN` (plataforma) en vez de `ADMIN_TENANT` (tenant). Auditar en la fase G.

---

## E7. Tenant user roles en JWT (MVP: omitir, futuro: incluir)

Los `tenant_user_roles` (T-111) representan roles a nivel de tenant (no app). En MVP:
- **No se incluyen en el JWT** — simplifica el MVP y evita confusión con membership roles
- En el futuro, se pueden agregar como claim `tenant_roles: ["can_manage_users"]`

Para incluirlos (futuro, post-MVP):
```java
// En AuthorizationController, antes de emitir token:
List<String> tenantRoles = tenantUserRoleRepository
    .findActiveByTenantUserId(tenantUserId)
    .stream()
    .map(r -> r.getRole().getCode())
    .toList();

// Agregar al claims map:
accessClaims.put("tenant_roles", tenantRoles);
```

---

## E8. Tests de integración de RBAC en JWT

| Test | Qué verifica |
|---|---|
| `IssuePlatformTokensUseCaseTest` | JWT contiene `roles` de platform_user_roles |
| `RotatePlatformRefreshTokenUseCaseTest` | JWT rotado mantiene platform roles |
| `RotateRefreshTokenUseCaseTest` | JWT rotado de tenant mantiene membership roles |
| `AuthorizationControllerTest` | JWT de `token` endpoint tiene membership roles (no platform roles) |

---

## E9. Verificación completa de RBAC

```bash
# Compilar y testear todos los módulos afectados
./mvnw -pl keygo-domain,keygo-app,keygo-api,keygo-infra,keygo-supabase,keygo-run -am test -q
```
