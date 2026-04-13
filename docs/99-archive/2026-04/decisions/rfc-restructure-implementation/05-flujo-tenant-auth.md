# Fase D — Simplificación del Flujo de Autenticación de Tenant App

> Instrucciones para adaptar el flujo de tenant app existente al nuevo modelo de datos
> (donde `sessions` usa `platform_user_id` en vez de `tenant_user_id`).

---

## Contexto

El flujo tenant app existente en `AuthorizationController` (`/api/v1/tenants/{slug}/...`) autentica usuarios de tenant. Con la nueva arquitectura:

1. Cuando un `tenant_user` hace login, primero se verifica su identidad a través de `platform_users` (si tiene `platform_user_id` vinculado) o directamente por email/password en `tenant_users`.
2. La sesión creada siempre lleva `platform_user_id` + `client_app_id`.
3. Si el `tenant_user` NO tiene `platform_user_id`, se crea la sesión con un "platform_user_id virtual" (opción A: UUID propio del tenant_user temporalmente) o se require la vinculación previa (opción B).

### Decisión de MVP: opción A (vinculación progresiva)

Para MVP, si `tenant_user.platform_user_id IS NULL`:
- La sesión se crea sin `platform_user_id` (haría falta un esquema de nullable), OR
- Se rechaza el login con mensaje claro de "tu cuenta de tenant no está vinculada a un platform user".

**Decisión preferida para MVP:**
- Mantener la sesión de tenant funcional **sin requerir `platform_user_id`**.
- Para esto, la columna `sessions.platform_user_id` puede ser **nullable** inicialmente.
- En una migración futura, se fuerza NOT NULL después de completar la migración de datos.

> **Revisar contra la decisión en 02-modelo-datos.md**: cambiar `sessions.platform_user_id NOT NULL` a `NULLABLE` para MVP.

---

## D1. Cambio en migración V28 (revisión)

En el archivo `02-modelo-datos.md`, sección A2, cambiar:

```sql
-- ORIGINAL (demasiado restrictivo para MVP):
platform_user_id UUID NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE;

-- MVP (nullable):
platform_user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL;
```

Esto permite que sesiones de tenant funcionen mientras los `tenant_users` aún no tienen `platform_user_id` vinculado.

---

## D2. Cambios en `AuthorizationController` (token exchange)

**Archivo:** `keygo-api/.../auth/controller/AuthorizationController.java`

### D2.1. Método `token()` — líneas 336–467

El método actualmente:
1. Valida el authorization code
2. Resuelve `user_id` (UUID de `tenant_user`)
3. Obtiene roles de membresía: `membershipRepository.findEffectiveRoleCodesByUserAndClientApp()`
4. Llama `IssueTokensUseCase`
5. Crea sesión via `OpenSessionUseCase`
6. Crea refresh token via `SaveRefreshTokenUseCase`

**Cambios necesarios:**

**Paso 3 (roles):** sin cambio — los roles del JWT de tenant app siguen viniendo de membresías.

**Paso 5 (sesión):** La llamada a `OpenSessionUseCase` (o equivalente) debe incluir el `platform_user_id` del tenant user si está disponible. Si `tenant_user.platform_user_id != null`, incluirlo; si es `null`, dejar la sesión con `platform_user_id = null` (MVP).

**No hay cambio en la lógica de roles para JWT de tenant app.** Los membership roles siguen siendo la única fuente.

---

## D3. Adaptar `OpenSessionUseCase`

**Archivo existente:** `keygo-app/.../auth/usecase/OpenSessionUseCase.java` (o `SaveSessionUseCase`)

Necesita saber si hay un `platform_user_id` disponible:

```java
// Antes (implícito)
session = sessionRepo.save(tenantId, clientAppId, tenantUserId, ...);

// Después
UUID platformUserId = tenantUser.getPlatformUserId(); // puede ser null en MVP
session = sessionRepo.save(platformUserId, clientAppId, ...);
// tenant_id y tenant_user_id ya no se guardan en sessions
```

### D3.1. Actualizar `SessionEntity`

Ver cambios en `02-modelo-datos.md` sección A3.5.

### D3.2. Actualizar adaptador de sesiones

**Archivo:** `keygo-supabase/.../auth/adapter/SessionRepositoryAdapter.java` (o similar)

El método `save()` debe:
- Recibir `platformUserId` (UUID, nullable)
- No recibir `tenantId` ni `tenantUserId` (eliminados de `sessions`)
- Recibir `clientAppId` (UUID, nullable — null para sesiones de plataforma)

---

## D4. Adaptar `RotateRefreshTokenUseCase`

**Archivo:** `keygo-app/.../auth/usecase/RotateRefreshTokenUseCase.java`

El caso de uso actualmente obtiene roles mediante `membershipRepository.findEffectiveRoleCodesByUserAndClientApp(userId, clientAppId)`.

Con el nuevo modelo:
- Si `session.client_app_id IS NOT NULL` → es sesión de tenant app → obtener roles de membresía (sin cambio)
- Si `session.client_app_id IS NULL` → es sesión de plataforma → obtener roles de `platform_user_roles`

Este caso de uso debe bifurcar lógica basándose en `session.client_app_id`:

```java
List<String> roles;
if (session.getClientAppId() == null) {
    // Platform session: get platform roles
    roles = platformUserRoleRepository.findByPlatformUserId(session.getPlatformUserId())
        .stream().map(r -> r.getRole().getCode()).toList();
} else {
    // Tenant app session: get membership roles
    roles = membershipRepository.findEffectiveRoleCodesByUserAndClientApp(
        session.getTenantUserId(), session.getClientAppId());
}
```

> **Nota:** Para obtener `tenantUserId` en el caso de tenant app, podría quedar en `refresh_tokens` o en el `subject` del JWT.  
> **Alternativa más limpia:** Guardar `tenant_user_id` solo en `refresh_tokens` (no en `sessions`).

### D4.1. Solución recomendada para MVP

En `refresh_tokens`, agregar columna `tenant_user_id UUID REFERENCES tenant_users(id)` (nullable):
- Si es sesión de plataforma → `tenant_user_id = NULL`
- Si es sesión de tenant app → `tenant_user_id = <UUID del tenant_user>`

Esto evita JOIN innecesarios y mantiene el contexto del refresh token auto-contenido.

**Agregar en V28:**
```sql
ALTER TABLE refresh_tokens
    ADD COLUMN tenant_user_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL;
```

---

## D5. Autenticación en `account/login` de tenant (existente)

**Archivo:** `AuthorizationController` método `login()` — línea 270

El método actual:
1. Busca el `TenantUser` por username/email dentro del tenant
2. Valida credentials
3. Crea un authorization code
4. Retorna el code para que el cliente lo canjee

Con el nuevo modelo:
- El método sigue siendo el mismo (busca `tenant_user` dentro del tenant)
- **No cambia la lógica de login de tenant app**
- Solo cambia la creación de sesión en el `token` endpoint (paso D2)

---

## D6. Eliminar dependencia de `KeyGo como tenant` del auth flow

Con el nuevo flujo:
- KeyGo UI usará `POST /api/v1/platform/account/login` → **nunca** `tenants/keygo/account/login`
- El tenant `keygo` (si se mantiene para otras razones como signing keys) NO se usa para autenticación de administradores de plataforma
- Los `platform_users` en el seed reemplazarán a los `tenant_users` del tenant `keygo` para el acceso de plataforma

---

## D7. Impacto en `@PreAuthorize`

Los endpoints ADMIN existentes usan `@PreAuthorize("hasRole('ADMIN')")`. Esto mapea desde el claim `roles` del JWT:
- **JWT de plataforma:** `roles: ["keygo_admin"]` → `ROLE_KEYGO_ADMIN`
- **JWT de tenant app:** `roles: ["admin_tenant"]` → `ROLE_ADMIN_TENANT`

Los endpoints de gestión de plataforma (`/api/v1/platform/**`) deben cambiar a:
```java
@PreAuthorize("hasRole('KEYGO_ADMIN')")   // solo platform admins
```

Los endpoints de tenant (`/api/v1/tenants/{slug}/...`) deben revisar:
- Si hoy usan `ADMIN` (que vendría del JWT de plataforma), cambiar a `ADMIN_TENANT`
- Si usan `ADMIN_TENANT`, sin cambio

---

## D8. Prueba de regresión del flujo tenant

Después de los cambios de D2–D5, ejecutar:

```bash
./mvnw -pl keygo-api,keygo-app test -q
```

Los tests existentes de `AuthorizationController` validan:
- `token()` → roles desde membresía
- `login()` → authorization code
- Refresh token → rotación

Deben seguir pasando. Si alguno falla, ajustar mocks para la nueva estructura de `SessionEntity` y `RefreshTokenEntity`.
