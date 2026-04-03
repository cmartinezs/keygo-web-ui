# Plan de Implementación — RFC Pantallas y Secciones Incompletas

- Estado: **Propuesto**
- Fecha: 2026-04-02
- RFC base: `02-RFC-PANTALLAS-SECCIONES-INCOMPLETAS-BACKEND-2026-04-02.md`
- Matriz de cobertura: `01-ENDPOINT_COVERAGE_MATRIX_UI_OPENAPI_2026-04-02.md`
- Definiciones frontend para desbloqueo backend: `04-frontend-definitions-for-backend-implementation.md`
- Implementador: AI Agent (Claude Code)
- Revisión: Carlos F. Martínez Sánchez

---

## Resumen ejecutivo

El RFC identifica **GAP_BACKEND** (sin contrato backend) y **TEMP_MSW** (cubierto provisionalmente con mocks) en 7 casos de uso pendientes. Este plan cubre únicamente los items de responsabilidad backend; los items `GAP_UI` (wiring de pantallas donde el backend ya existe) y los `Tipo B` (definición funcional) quedan fuera del alcance.

### Alcance de este plan

| Item RFC | Tipo | Fase | Propuesta ROADMAP |
|---|---|---|---|
| T-103: Bloquear login con `status=RESET_PASSWORD` | GAP_BACKEND | 1 | T-103 (mediano plazo) |
| T-104: `POST /account/reset-password` (contraseña temporal) | GAP_BACKEND | 2 | T-104 (mediano plazo) |
| `POST /account/forgot-password` | GAP_BACKEND | 3 | F-043 (nuevo) |
| `POST /account/recover-password` | GAP_BACKEND | 3 | F-043 (nuevo) |
| T-033: `PUT /users/{userId}/suspend` + `/activate` | GAP_BACKEND | 4 | T-033 (mediano plazo) |
| T-110: `GET /users/{userId}/sessions` (admin) | GAP_BACKEND | 5 | T-110 (nuevo) |
| F-042: `GET/DELETE /account/connections` | TEMP_MSW | 6 | F-042 (requiere diseño) |

### Fuera del alcance

Los items sin trabajo backend pendiente se listan aquí con su tipo RFC, la razón de exclusión y
la condición que los traería al alcance en el futuro.

| Item | RFC § | Tipo RFC | Razón de exclusión | Condición de entrada |
|---|---|---|---|---|
| Pago real en producción (`/billing/contracts/{id}/pay`) | §4.1 | A | Requiere decisión de negocio sobre proveedor de pago (Stripe, MercadoPago) y configuración de cuenta PSP | Proveedor PSP seleccionado + credenciales disponibles → T-084 |
| Sección "SDKs e integraciones" en landing | §4.1 | B | Contenido de marketing/producto; no depende de ningún endpoint backend | Definición de contenido por parte de producto |
| Módulos placeholder `/dashboard/feature/:featureId` | §4.2 | C (y A/B en algunos casos) | Trabajo exclusivamente de UI (wiring de rutas existentes); cada feature tiene su propio backlog | Priorización por negocio de qué módulo conectar primero |
| Métricas home dashboard `ADMIN_TENANT` (tarjetas con "--") | §4.2 | C + B | Gap UI resuelto en frontend (2026-04-03) con datos reales desde endpoints existentes (`users`, `apps`, `account/sessions`) | No requiere backend adicional en esta fase; evolución futura opcional con `GET /api/v1/tenants/{slug}/stats` |
| Métricas home dashboard `USER_TENANT` (sesiones, último acceso, alertas) | §4.2 | C + B | Gap UI resuelto en frontend (2026-04-03) con datos reales desde `account/sessions` y `account/access` | No requiere backend adicional en esta fase; para alertas avanzadas, definir contrato de actividad personal (T-076) |
| Selector de rango Hoy/7/30 días en header dashboard admin | §4.2 | B (posible A) | Dashboard admin ya acepta datos agregados sin parámetro de rango; parametrizar requiere definición funcional | Confirmar si el endpoint existente `GET /admin/platform/dashboard` necesita `?from=&to=` o si es un filtro puramente visual |
| Acciones rápidas en header dashboard admin | §4.2 | B + C | No existe definición de qué acciones exponer ni a qué endpoints apuntarían | Definición de producto: lista de acciones + endpoints destino |
| Mi cuenta > pestaña "Actividad" | §4.3 | C + B | Gap UI base resuelto en frontend (2026-04-03) con sesiones de cuenta y resumen de accesos; la timeline avanzada sigue dependiente de contrato dedicado | Para evolución, implementar T-076 (tabla `audit_events`) o contrato alternativo de actividad personal |
| `GET /platform/stats` sin wiring en UI | §4.4 | GAP_UI (resuelto en frontend 2026-04-03) | Backend existe y devuelve datos; wiring implementado en `PlatformStatsPage` (`/dashboard/feature/api`) | No requiere trabajo backend adicional |
| Cancelar renovación de suscripción sin wiring | §6 | GAP_UI (resuelto en frontend 2026-04-03) | `POST /billing/subscription/cancel` existe en OpenAPI y ya fue conectado en UI con confirmación | No requiere trabajo backend adicional |

---

## Convenciones transversales

Las mismas del RFC anterior aplican:

- Todos los endpoints usan `BaseResponse<T>` como envelope
- Bearer JWT en `Authorization: Bearer <token>` para endpoints autenticados
- Endpoints públicos se agregan al `BootstrapAdminKeyFilter` como sufijos permitidos
- Next migration: **V22** (no reutilizar ni editar migraciones existentes)
- Jackson databind: `tools.jackson.databind.*` — nunca `com.fasterxml.jackson.databind.*` (ver CLAUDE.md)
- JPA entities: `@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor` — nunca `@Data`

---

## Árbol de dependencias entre fases

```
Fase 1 (T-103: bloquear login RESET_PASSWORD)
  └── Fase 2 (T-104: reset-password con contraseña temporal)
Fase 3 (forgot/recover-password — independiente de Fase 1/2)
Fase 4 (suspend/activate — independiente)
Fase 5 (admin sessions — independiente; SessionRepositoryPort ya existe)
Fase 6 (connections — requiere diseño aprobado primero)
  └── Fase 7 (documentación y cierre)
```

---

## Fase 1 — Infraestructura base (T-103)

**Objetivo:** Bloquear autenticación de usuarios con `status=RESET_PASSWORD` y agregar los
`ResponseCode` y sufijos públicos que necesitan las fases siguientes. No crea endpoints nuevos.

**Módulos afectados:** `keygo-app`, `keygo-api`, `keygo-run`

### Artefactos

| Artefacto | Módulo | Acción | Detalle |
|---|---|---|---|
| `UserPasswordResetRequiredException.java` | `keygo-app` | Crear | En `app/user/exception/`. Extiende `UseCaseException`. Sin Spring. |
| `ValidateUserCredentialsUseCase.java` | `keygo-app` | Modificar | Después de validar credenciales: si `user.isResetPassword()` → lanzar `UserPasswordResetRequiredException`. Agregar **después** de la validación de contraseña (para evitar oracle de timing). |
| `ResponseCode.java` | `keygo-api` | Modificar | Agregar 7 nuevos codes: `RESET_PASSWORD_REQUIRED`, `PASSWORD_RESET`, `PASSWORD_RECOVERY_SENT`, `PASSWORD_RECOVERED`, `USER_SUSPENDED`, `USER_ACTIVATED`, `USER_SESSIONS_RETRIEVED` |
| `GlobalExceptionHandler.java` | `keygo-api` | Modificar | Handler para `UserPasswordResetRequiredException` → HTTP 403, code `RESET_PASSWORD_REQUIRED`, `origin=BUSINESS_RULE` |
| `KeyGoBootstrapProperties.java` | `keygo-run` | Modificar | Agregar 3 propiedades de sufijos públicos: `accountResetPasswordPathSuffix`, `accountForgotPasswordPathSuffix`, `accountRecoverPasswordPathSuffix` |
| `application.yml` | `keygo-run` | Modificar | Registrar los 3 sufijos: `/account/reset-password`, `/account/forgot-password`, `/account/recover-password` |
| `BootstrapAdminKeyFilter.java` | `keygo-run` | Modificar | Agregar condición de paso público para los 3 sufijos nuevos |

### Test a crear

| Test | Escenario |
|---|---|
| `ValidateUserCredentialsUseCaseTest` | Credenciales válidas con `status=RESET_PASSWORD` → lanza `UserPasswordResetRequiredException` |
| `BootstrapAdminKeyFilterTest` | 3 tests de regresión: `/account/reset-password`, `/account/forgot-password`, `/account/recover-password` no requieren Bearer |

### Criterio de aceptación

- `./mvnw test` pasa
- Intento de login con usuario `RESET_PASSWORD` → respuesta `403 RESET_PASSWORD_REQUIRED`
- Los nuevos `ResponseCode` visibles en `GET /api/v1/response-codes`

---

## Fase 2 — Reset de contraseña con contraseña temporal (T-104)

**Objetivo:** Implementar `POST /account/reset-password` que permite a un usuario en estado
`RESET_PASSWORD` (aprovisionado por admin) establecer su contraseña definitiva usando la
contraseña temporal recibida por email.

**Prerrequisito:** Fase 1 completada.

**Módulos afectados:** `keygo-app`, `keygo-api`, `keygo-run`

### Artefactos

| Artefacto | Módulo | Acción | Detalle |
|---|---|---|---|
| `ResetPasswordCommand.java` | `keygo-app` | Crear | Record con: `tenantSlug`, `email`, `temporaryPassword`, `newPassword` |
| `ResetPasswordResult.java` | `keygo-app` | Crear | Record con: `boolean reset` |
| `ResetPasswordUseCase.java` | `keygo-app` | Crear | (1) Resolver tenant por slug; (2) buscar usuario por `tenantId` + `email`; (3) verificar `user.isResetPassword()` (lanzar `UseCaseException` si no); (4) `PasswordHasherPort.matches(temporaryPassword, user.getPasswordHash())` → lanzar `IncorrectCurrentPasswordException` si falla; (5) `PasswordPolicy.validate(newPassword)`; (6) `user.updatePassword(hash(newPassword))`; (7) `user.activate()`; (8) `userRepository.save(user)` |
| `ResetPasswordUseCaseTest.java` | `keygo-app` | Crear | Escenarios: éxito, usuario no en RESET_PASSWORD, contraseña temporal incorrecta, nueva contraseña viola política |
| `ResetPasswordRequest.java` | `keygo-api` | Crear | Record Jackson: `email`, `temporary_password`, `new_password` |
| `AccountSettingsController.java` | `keygo-api` | Modificar | Agregar `POST /reset-password` con `@Operation` + `@ApiResponse` 200/400/403/404/500 |
| `ApplicationConfig.java` | `keygo-run` | Modificar | Bean para `ResetPasswordUseCase` |

### Flujo

```
POST /account/reset-password
  → ResetPasswordUseCase
      → TenantRepositoryPort.findBySlug(tenantSlug)
      → UserRepositoryPort.findByTenantIdAndEmail(tenantId, email)
      → verificar isResetPassword()
      → PasswordHasherPort.matches(temporaryPassword, hash)   [403 si falla]
      → PasswordPolicy.validate(newPassword)                  [400 si falla]
      → user.updatePassword(hash(newPassword)) + user.activate()
      → UserRepositoryPort.save(user)
  ← 200 PASSWORD_RESET { "reset": true }
```

### Criterio de aceptación

- Usuario con `RESET_PASSWORD` + contraseña temporal correcta → 200 `PASSWORD_RESET`, status cambia a `ACTIVE`
- Contraseña temporal incorrecta → 403 `BUSINESS_RULE_VIOLATION`
- Usuario no en `RESET_PASSWORD` → 403 `BUSINESS_RULE_VIOLATION`
- Contraseña débil → 400 `INVALID_INPUT` con `fieldErrors`

---

## Fase 3 — Flujo olvidé mi contraseña (F-043)

**Objetivo:** Implementar el flujo público de recuperación de contraseña self-service:
(1) usuario solicita código de recuperación por email; (2) usuario envía código + nueva contraseña.

**Prerrequisito:** Ninguno (independiente de fases 1 y 2).

**Módulos afectados:** `keygo-domain`, `keygo-app`, `keygo-supabase`, `keygo-api`, `keygo-infra`, `keygo-run`

### Migración V22

```sql
-- V22__password_recovery_tokens.sql
CREATE TABLE password_recovery_tokens (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_user_id  UUID        NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
  token           VARCHAR(64) NOT NULL,  -- UUID sin guiones (32 hex) o random hex
  expires_at      TIMESTAMPTZ NOT NULL,
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_user_id)                -- solo 1 token activo por usuario
);
CREATE INDEX idx_pwd_recovery_token ON password_recovery_tokens(token);
COMMENT ON TABLE password_recovery_tokens IS 'Recovery tokens for self-service forgot-password flow (30 min TTL)';
```

> **Decisión de diseño:** `UNIQUE(tenant_user_id)` — un usuario solo puede tener un token activo.
> Solicitar un nuevo token invalida el anterior (upsert por `tenant_user_id`).

### Artefactos

| Artefacto | Módulo | Acción | Detalle |
|---|---|---|---|
| `PasswordRecoveryToken.java` | `keygo-domain` | Crear | En `domain/user/model/`. Record inmutable: `userId(UserId)`, `tenantId(TenantId)`, `token(String)`, `expiresAt(Instant)`, `usedAt(Instant)`. Método `isExpired()`, `isUsed()`. Sin Spring. |
| `PasswordRecoveryTokenRepositoryPort.java` | `keygo-app` | Crear | Métodos: `upsert(PasswordRecoveryToken): PasswordRecoveryToken`, `findByToken(String): Optional<PasswordRecoveryToken>`, `markUsed(PasswordRecoveryToken): void` |
| `ForgotPasswordCommand.java` | `keygo-app` | Crear | Record: `tenantSlug`, `email` |
| `ForgotPasswordResult.java` | `keygo-app` | Crear | Record: `boolean sent` (siempre true — nunca revelar si el email existe) |
| `ForgotPasswordUseCase.java` | `keygo-app` | Crear | (1) Resolver tenant; (2) buscar user por email → **si no existe: retornar `sent=true` sin error** (evitar oracle de enumeración); (3) verificar que user esté `ACTIVE` o `PENDING`; (4) generar token UUID; (5) persistir via `upsert`; (6) `EmailNotificationPort.sendPasswordRecoveryEmail(...)` |
| `RecoverPasswordCommand.java` | `keygo-app` | Crear | Record: `tenantSlug`, `recoveryToken`, `newPassword` |
| `RecoverPasswordResult.java` | `keygo-app` | Crear | Record: `boolean recovered` |
| `RecoverPasswordUseCase.java` | `keygo-app` | Crear | (1) Resolver tenant; (2) `tokenRepository.findByToken(token)` → 404 si no existe; (3) verificar no expirado → 422 `PasswordRecoveryTokenExpiredException`; (4) verificar no usado → 422 `PasswordRecoveryTokenAlreadyUsedException`; (5) `PasswordPolicy.validate(newPassword)`; (6) cargar user; (7) `user.updatePassword(hash)`; si estaba `PENDING` → `user.activate()`; (8) `tokenRepository.markUsed(token)`; (9) `userRepository.save(user)` |
| `PasswordRecoveryTokenExpiredException.java` | `keygo-domain` | Crear | Extiende `DomainException`. |
| `PasswordRecoveryTokenAlreadyUsedException.java` | `keygo-domain` | Crear | Extiende `DomainException`. |
| `ForgotPasswordUseCaseTest.java` | `keygo-app` | Crear | Escenarios: email existe → envía; email no existe → retorna sent=true sin error; usuario SUSPENDED → envía igualmente (no revelar estado) |
| `RecoverPasswordUseCaseTest.java` | `keygo-app` | Crear | Escenarios: éxito, token expirado, token ya usado, token no encontrado, contraseña viola política |
| `PasswordRecoveryTokenEntity.java` | `keygo-supabase` | Crear | JPA entity para `password_recovery_tokens` |
| `PasswordRecoveryTokenJpaRepository.java` | `keygo-supabase` | Crear | Spring Data JPA: `findByToken(String)`, `findByTenantUserId(UUID)` |
| `PasswordRecoveryTokenRepositoryAdapter.java` | `keygo-supabase` | Crear | Implementa `PasswordRecoveryTokenRepositoryPort`. `upsert`: buscar por userId → si existe actualizar token+expiresAt, si no crear nuevo. |
| `EmailNotificationPort.java` | `keygo-app` | Modificar | Agregar `sendPasswordRecoveryEmail(String toEmail, String username, String recoveryToken, String tenantSlug)` |
| `SmtpEmailNotificationAdapter.java` | `keygo-infra` | Modificar | Implementar `sendPasswordRecoveryEmail(...)` con HTML similar a los existentes |
| `ForgotPasswordRequest.java` | `keygo-api` | Crear | Record Jackson: `email` |
| `RecoverPasswordRequest.java` | `keygo-api` | Crear | Record Jackson: `recovery_token`, `new_password` |
| `GlobalExceptionHandler.java` | `keygo-api` | Modificar | Handlers: `PasswordRecoveryTokenExpiredException` → 422 + `BUSINESS_RULE_VIOLATION`; `PasswordRecoveryTokenAlreadyUsedException` → 422 + `BUSINESS_RULE_VIOLATION` |
| `AccountSettingsController.java` | `keygo-api` | Modificar | Agregar `POST /forgot-password` y `POST /recover-password` con `@Operation` + `@ApiResponse` |
| `ApplicationConfig.java` | `keygo-run` | Modificar | Beans para `ForgotPasswordUseCase` y `RecoverPasswordUseCase` |

### Flujo forgot-password

```
POST /account/forgot-password   { "email": "..." }
  → ForgotPasswordUseCase
      → TenantRepositoryPort.findBySlug(tenantSlug)
      → UserRepositoryPort.findByTenantIdAndEmail(tenantId, email)
      → [si no existe] retornar sent=true sin error (no revelar enumeración)
      → generar token = UUID.randomUUID() sin guiones (32 chars hex)
      → expiresAt = Instant.now() + 30 min (configurable)
      → tokenRepository.upsert(PasswordRecoveryToken)
      → EmailNotificationPort.sendPasswordRecoveryEmail(email, username, token, tenantSlug)
  ← 200 PASSWORD_RECOVERY_SENT { "sent": true }
```

### Flujo recover-password

```
POST /account/recover-password  { "recovery_token": "...", "new_password": "..." }
  → RecoverPasswordUseCase
      → TenantRepositoryPort.findBySlug(tenantSlug)
      → tokenRepository.findByToken(recoveryToken)    [404 si no existe]
      → token.isExpired()                             [422 si expirado]
      → token.isUsed()                                [422 si ya usado]
      → PasswordPolicy.validate(newPassword)          [400 si falla]
      → UserRepositoryPort.findByIdAndTenantId(...)
      → user.updatePassword(hash(newPassword))
      → user.activate()  [si estaba PENDING]
      → tokenRepository.markUsed(token)
      → UserRepositoryPort.save(user)
  ← 200 PASSWORD_RECOVERED { "recovered": true }
```

### Criterio de aceptación

- `POST /forgot-password` con email inexistente → 200 `PASSWORD_RECOVERY_SENT` (no revelar enumeración)
- `POST /forgot-password` con email existente → 200 + email enviado con token
- `POST /recover-password` con token válido + contraseña segura → 200 `PASSWORD_RECOVERED`, usuario `ACTIVE`
- Token expirado → 422 `BUSINESS_RULE_VIOLATION`
- Token ya usado → 422 `BUSINESS_RULE_VIOLATION`

---

## Fase 4 — Suspender / Activar usuario del tenant (T-033)

**Objetivo:** Exponer los métodos `user.suspend()` / `user.activate()` del dominio como endpoints
REST para uso de `ADMIN` y `ADMIN_TENANT`. La entidad y los métodos de dominio ya existen.

**Prerrequisito:** Ninguno.

**Módulos afectados:** `keygo-app`, `keygo-api`, `keygo-run`

> No requiere nueva migración Flyway — la columna `status` y sus valores (`ACTIVE`, `SUSPENDED`) ya existen en `tenant_users`.

### Artefactos

| Artefacto | Módulo | Acción | Detalle |
|---|---|---|---|
| `SuspendUserCommand.java` | `keygo-app` | Crear | Record: `tenantSlug`, `userId (UUID)` |
| `SuspendUserResult.java` | `keygo-app` | Crear | Record: `UUID userId`, `String status`, `boolean alreadySuspended` |
| `SuspendUserUseCase.java` | `keygo-app` | Crear | (1) Resolver tenant; (2) `userRepository.findByIdAndTenantId()` → lanzar `UserNotFoundException` si no existe; (3) `user.suspend()` — capturar `UserSuspendedException` → retornar `alreadySuspended=true`; (4) `userRepository.save(user)` |
| `ActivateUserCommand.java` | `keygo-app` | Crear | Record: `tenantSlug`, `userId (UUID)` |
| `ActivateUserResult.java` | `keygo-app` | Crear | Record: `UUID userId`, `String status`, `boolean alreadyActive` |
| `ActivateUserUseCase.java` | `keygo-app` | Crear | (1) Resolver tenant; (2) `userRepository.findByIdAndTenantId()` → `UserNotFoundException` si no existe; (3) verificar `user.isActive()` → si ya activo: retornar `alreadyActive=true`; (4) `user.activate()`; (5) `userRepository.save(user)` |
| `SuspendUserUseCaseTest.java` | `keygo-app` | Crear | Escenarios: suspender activo → success; suspender ya suspendido → alreadySuspended; userId no encontrado → exception |
| `ActivateUserUseCaseTest.java` | `keygo-app` | Crear | Escenarios: activar suspendido → success; activar ya activo → alreadyActive; userId no encontrado → exception |
| `TenantUserController.java` | `keygo-api` | Modificar | Agregar `PUT /{userId}/suspend` y `PUT /{userId}/activate`; misma `@PreAuthorize` que los endpoints existentes |
| `ApplicationConfig.java` | `keygo-run` | Modificar | Beans para `SuspendUserUseCase` y `ActivateUserUseCase` |

### Diseño de idempotencia

Ambas operaciones son **idempotentes**:
- Suspender un usuario ya suspendido → 200 `USER_SUSPENDED` con `alreadySuspended=true`
- Activar un usuario ya activo → 200 `USER_ACTIVATED` con `alreadyActive=true`

> Esto evita errores 409 innecesarios y simplifica el código del frontend.

### Criterio de aceptación

- `PUT /{userId}/suspend` sobre usuario `ACTIVE` → 200 `USER_SUSPENDED`, status=`SUSPENDED`
- `PUT /{userId}/suspend` sobre usuario ya `SUSPENDED` → 200 `USER_SUSPENDED`, `alreadySuspended=true`
- `PUT /{userId}/activate` sobre usuario `SUSPENDED` → 200 `USER_ACTIVATED`, status=`ACTIVE`
- Usuario inexistente → 404 `RESOURCE_NOT_FOUND`
- Sin Bearer o roles insuficientes → 401/403

---

## Fase 5 — Sesiones de usuario por administrador (T-110)

**Objetivo:** Exponer `GET /users/{userId}/sessions` para que `ADMIN` y `ADMIN_TENANT` puedan
ver las sesiones activas de cualquier usuario en el tenant, sin necesidad de autenticarse como ese usuario.

**Prerrequisito:** Ninguno. `SessionRepositoryPort.findAllByUserIdAndTenantId()` ya existe.

**Módulos afectados:** `keygo-app`, `keygo-api`, `keygo-run`

> No requiere nueva migración Flyway.

### Artefactos

| Artefacto | Módulo | Acción | Detalle |
|---|---|---|---|
| `GetAdminUserSessionsCommand.java` | `keygo-app` | Crear | Record: `tenantSlug`, `targetUserId (UUID)`, `bearerToken` (para validar que el solicitante tiene acceso) |
| `AdminUserSessionsResult.java` | `keygo-app` | Crear | Record: `List<SessionInfoResult> sessions` (reutiliza el record ya creado en la Fase 3 del RFC anterior) |
| `GetAdminUserSessionsUseCase.java` | `keygo-app` | Crear | (1) Verificar token del admin; (2) Resolver tenant; (3) Verificar que `targetUserId` exista en el tenant; (4) `sessionRepository.findAllByUserIdAndTenantId(targetUserId, tenantId)`; (5) Filtrar ACTIVE/EXPIRED según query param; (6) Mapear a `SessionInfoResult` con `isCurrent=false` siempre (contexto admin) |
| `GetAdminUserSessionsUseCaseTest.java` | `keygo-app` | Crear | Escenarios: usuario con sesiones activas; usuario sin sesiones (lista vacía); userId no encontrado en tenant |
| `TenantUserController.java` | `keygo-api` | Modificar | Agregar `GET /{userId}/sessions`; reutiliza `AccountSessionData` como DTO de respuesta; misma `@PreAuthorize` que endpoints existentes |
| `ApplicationConfig.java` | `keygo-run` | Modificar | Bean para `GetAdminUserSessionsUseCase` |

### Diferencias vs `ListUserSessionsUseCase` (self-service)

| Aspecto | Self-service | Admin |
|---|---|---|
| Auth | JWT del propio usuario | JWT del admin |
| `userId` target | Extraído del JWT `sub` | Path variable `{userId}` |
| `is_current` | Determinado por UA+IP | Siempre `false` |
| Filtro | Solo `ACTIVE` | `ACTIVE` + `EXPIRED` (opcional) |

### Criterio de aceptación

- `GET /users/{userId}/sessions` con admin válido → 200 `USER_SESSIONS_RETRIEVED`, lista de sesiones
- `userId` inexistente en tenant → 404 `RESOURCE_NOT_FOUND`
- Sin Bearer o rol insuficiente → 401/403

---

## Fase 6 — Contrato e implementación de conexiones de cuenta (F-042)

**Objetivo:** Reemplazar el mock MSW temporal de `ConnectionsPanel.tsx` con un contrato backend
oficial. Las definiciones frontend del contrato ya quedaron aprobadas en `04-frontend-definitions-for-backend-implementation.md`.

**Prerrequisito:** Publicar contrato OpenAPI final y habilitar endpoints productivos.

### Diseño propuesto del modelo

Una "conexión" representa una **autorización OAuth2 de terceros** que el usuario ha otorgado
para que una app externa acceda a su cuenta KeyGo (similar a "Apps conectadas" en GitHub/Google).

```sql
-- V23__account_connections.sql (propuesto)
CREATE TABLE account_connections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES tenant_users(id) ON DELETE CASCADE,
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider_name   VARCHAR(50) NOT NULL,          -- 'GOOGLE', 'GITHUB', 'SLACK', etc.
  provider_user_id VARCHAR(255) NOT NULL,         -- ID del usuario en el proveedor externo
  display_name    VARCHAR(255),                   -- nombre o email del proveedor
  avatar_url      VARCHAR(500),
  scopes          TEXT[],                         -- scopes autorizados
  status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  connected_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at    TIMESTAMPTZ,
  UNIQUE (user_id, provider_name, provider_user_id)
);
CREATE INDEX idx_connections_user_tenant ON account_connections(user_id, tenant_id);
```

### Endpoints propuestos

| Method | Path | Descripción |
|---|---|---|
| `GET` | `/account/connections` | Lista conexiones del usuario autenticado |
| `POST` | `/account/connections/{provider}/link` | Vincula conexión con proveedor externo |
| `DELETE` | `/account/connections/{connectionId}` | Revoca una conexión (idempotente) |

### Artefactos (pendientes de implementación backend)

| Artefacto | Módulo | Acción |
|---|---|---|
| `AccountConnection.java` | `keygo-domain` | Nuevo modelo de dominio |
| `AccountConnectionRepositoryPort.java` | `keygo-app` | Puerto OUT |
| `GetAccountConnectionsUseCase.java` | `keygo-app` | Listar por userId + tenantId |
| `RevokeAccountConnectionUseCase.java` | `keygo-app` | Revocar por ID + ownership check |
| `V23__account_connections.sql` | `keygo-supabase` | Migración — NEXT tras V22 |
| `AccountConnectionEntity.java` | `keygo-supabase` | JPA entity |
| `AccountConnectionData.java` | `keygo-api` | DTO de respuesta |
| `AccountSettingsController.java` | `keygo-api` | GET + DELETE `/connections` y `/connections/{id}` |
| `ApplicationConfig.java` | `keygo-run` | Beans |

### Proceso recomendado antes de implementar

1. Revisar los mocks en `src/mocks/handlers.ts` y el componente `ConnectionsPanel.tsx` en `keygo-ui`
   para validar que el modelo propuesto satisface todos los campos que la UI espera.
2. Implementar catalogo de `provider_name` como enum V1 (`GOOGLE`, `GITHUB`, `MICROSOFT`, `SLACK`) con tolerancia a nuevos valores para no romper UI.
3. Incluir `POST /connections/{provider}/link` en OpenAPI V1 para cubrir acción de vinculación existente en settings.
4. Publicar migración V23 y contrato OpenAPI antes de iniciar integración final en UI.

---

## Fase 7 — Documentación y cierre

**Objetivo:** Actualizar todos los documentos obligatorios según las reglas de CLAUDE.md.

| Artefacto | Detalle |
|---|---|
| `AGENTS.md` | Agregar nuevos endpoints; actualizar "Próxima migración: V22 → V24" |
| `docs/ai/agents-registro.md` | Entrada por cambios en `AGENTS.md` |
| `docs/data/DATA_MODEL.md` | Diccionario de `password_recovery_tokens` (V22) y `account_connections` (V23 si se implementa F-042) |
| `docs/data/ENTITY_RELATIONSHIPS.md` | Contexto 13: `password_recovery_tokens`; Contexto 14: `account_connections` (si aplica) |
| `docs/data/MIGRATIONS.md` | Secciones V22 (y V23 si aplica) |
| `docs/postman/KeyGo-Server.postman_collection.json` | Folder "🔑 Password Recovery" (2 requests); folder "👥 Tenant Users — Admin" actualizado con suspend/activate/sessions |
| `docs/keygo-ui/FRONTEND_DEVELOPER_GUIDE.md` | §14 inventario: marcar 7 endpoints nuevos ✅; actualizar §11.3 |
| `docs/ai/lecciones.md` | Entradas por aprendizajes (si los hay) |
| `ROADMAP.md` + `docs/ai/propuestas.md` | Marcar T-033, T-103, T-104 como ✅; agregar T-110, F-043; actualizar F-042 |
| `docs/rfc/incomplete-sections/01-ENDPOINT_COVERAGE_MATRIX...md` | Actualizar columnas `OpenAPI` y `Estado` de los gaps resueltos |
| `docs/keygo-ui/api-docs.json` | Regenerar con app corriendo: `GET /keygo-server/v3/api-docs` |

---

## Estado de fases

| Fase | Descripción | Estado |
|---|---|---|
| 1 | T-103: Bloquear login RESET_PASSWORD + ResponseCodes + sufijos | Pendiente |
| 2 | T-104: Reset contraseña con contraseña temporal | Pendiente |
| 3 | Forgot/Recover password self-service (F-043) + V22 | Pendiente |
| 4 | Suspender/Activar usuario del tenant (T-033) | Pendiente |
| 5 | Sesiones por userId admin (T-110) | Pendiente |
| 6 | Contrato e implementación de conexiones (F-042) + V23 | Pendiente implementación backend |
| 7 | Documentación y cierre | Pendiente |

---

## Nuevas propuestas generadas por este plan

| ID | Tipo | Descripción |
|---|---|---|
| F-043 | Funcional | Self-service forgot/recover password: `POST /account/forgot-password` + `POST /account/recover-password`; tabla `password_recovery_tokens` (V22); TTL configurable 30 min |
| T-110 | Técnica | Endpoint admin `GET /users/{userId}/sessions`; reutiliza `SessionRepositoryPort.findAllByUserIdAndTenantId()`; `is_current=false` en contexto admin |

> T-033, T-103, T-104 y F-042 ya están registrados en `ROADMAP.md`.

---

## Definiciones pendientes del frontend para habilitar implementación backend

Estas definiciones son prerequisito para evitar retrabajo de contrato y para cerrar correctamente los endpoints que dependen de UX/shape final del front.

### 1) F-042 — Conexiones de cuenta

1. Confirmar **shape final** de cada conexión consumida por UI:
  - `id`
  - `providerName`
  - `displayName`
  - `avatarUrl`
  - `connectedAt`
  - `lastUsedAt`
  - `scopes`
  - `status`
2. Confirmar si `providerName` se modela como:
  - enum controlado por backend (recomendado), o
  - string libre para proveedores dinámicos.
3. Confirmar si el front requiere **vinculación manual** en settings:
  - Si **no**: alcance backend queda en `GET /account/connections` + `DELETE /account/connections/{id}`.
  - Si **sí**: se debe definir y agregar `POST /account/connections` (fuera del alcance actual).
4. Definir reglas UX para `DELETE` idempotente:
  - mensaje de éxito base,
  - comportamiento cuando el recurso ya no existe,
  - política de refresco de lista (invalidate/refetch).

### 2) F-043 + T-104 — Recuperación y reset de contraseña

1. Definir **decisión de experiencia** entre flujos disponibles:
  - `POST /account/reset-password` (password temporal),
  - `POST /account/recover-password` (token one-time por email),
  - y cuándo se muestra cada uno.
2. Confirmar rutas públicas definitivas de UI y deep-links esperados:
  - ejemplo: `/forgot-password`, `/recover-password`.
3. Confirmar copy y comportamiento anti-enumeración en `forgot-password`:
  - siempre mostrar mensaje neutral en éxito,
  - no distinguir email existente/no existente.
4. Confirmar payload final esperado por pantalla para prevenir adapters transitorios.

### 3) T-110 — Sesiones de usuario por administrador

1. Confirmar filtros obligatorios para primera versión:
  - solo `ACTIVE`, o
  - `ACTIVE + EXPIRED`.
2. Confirmar columnas mínimas de tabla (frontend) para cerrar DTO estable.
3. Confirmar acciones de UI sobre sesiones (solo lectura vs acciones futuras).

### 4) Criterio de “frontend definido” para pasar a implementación backend

Se considera que frontend dejó definido un item cuando existe, como mínimo:

1. Contrato de payload/respuesta validado por ambos equipos.
2. Decisión de UX explícita en documentación (flujo, estados vacíos/error/success).
3. Confirmación de alcance V1 (qué entra y qué queda fuera).
