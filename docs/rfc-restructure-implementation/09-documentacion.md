# Fase H — Documentación AI y Cierre

> Instrucciones para actualizar la base de conocimiento del agente AI al concluir la implementación.

---

## H1. Actualizar `AGENTS.md`

### H1.1. Sección "JPA entities (keygo-supabase)" — agregar entidad

```markdown
| `PlatformUserEntity` | `user.entity` | `platform_users` | Identidad global de plataforma; `@OneToMany` → `PlatformUserRoleEntity` |
```

### H1.2. Sección "Existing repositories" — agregar repository

```markdown
| `PlatformUserJpaRepository` | `user.repository` |
```

### H1.3. Sección "Flyway migrations already applied" — agregar V27–V29

```markdown
- `V27__platform_users.sql` — Tabla `platform_users` (identidad global, separada de tenant_users)
- `V28__sessions_platform_refactor.sql` — `sessions` refactorizada: `platform_user_id`, `client_app_id` nullable; `platform_user_roles.tenant_user_id` → `platform_user_id`; `tenant_users.platform_user_id` FK nullable
- `V29__platform_users_seed_and_role_rename.sql` — Seed `platform_users` + rename `keygo_account_admin` → `keygo_tenant_admin`
```

### H1.4. Sección "context-path is always active" — agregar endpoints de plataforma

```markdown
- `http://localhost:8080/keygo-server/api/v1/platform/account/login` (POST — **público** — autenticar platform user; retorna access_token + refresh_token)
- `http://localhost:8080/keygo-server/api/v1/platform/oauth2/token` (POST — **público** — rotar refresh token de plataforma)
- `http://localhost:8080/keygo-server/api/v1/platform/oauth2/revoke` (POST — **público** — revocar token de plataforma)
- `http://localhost:8080/keygo-server/api/v1/platform/users` (POST — **Bearer KEYGO_ADMIN** — crear platform user)
- `http://localhost:8080/keygo-server/api/v1/platform/users` (GET — **Bearer KEYGO_ADMIN** — listar platform users)
- `http://localhost:8080/keygo-server/api/v1/platform/users/{userId}` (GET — **Bearer KEYGO_ADMIN** — obtener platform user)
- `http://localhost:8080/keygo-server/api/v1/platform/users/{userId}/suspend` (PUT — **Bearer KEYGO_ADMIN** — suspender platform user)
- `http://localhost:8080/keygo-server/api/v1/platform/users/{userId}/activate` (PUT — **Bearer KEYGO_ADMIN** — activar platform user)
- `http://localhost:8080/keygo-server/api/v1/platform/users/{userId}/platform-roles` (POST/GET/DELETE — **Bearer KEYGO_ADMIN** — gestión de roles de plataforma)
- `http://localhost:8080/keygo-server/api/v1/platform/account/me` (GET — **Bearer platform** — perfil propio del platform user)
```

### H1.5. Sección "Seed credentials" — agregar tabla de platform_users

```markdown
**Platform users (para login en KeyGo UI — flujo de plataforma):**

| Tabla | Usuario | Email | Contraseña | Rol de plataforma |
|---|---|---|---|---|
| `platform_users` | `keygo_admin` | `admin@keygo.io` | `Admin1234!` | `keygo_admin` |
| `platform_users` | `keygo_tenant_admin` | `tenant-admin@keygo.io` | `Admin1234!` | `keygo_tenant_admin` |
| `platform_users` | `keygo_user` | `user@keygo.io` | `Admin1234!` | `keygo_user` |
| `platform_users` | `keygo_contractor` | `contractor@keygo.io` | `Admin1234!` | `keygo_user` |
```

### H1.6. Módulo map — confirmar que no hay cambios a la estructura de módulos

La estructura de módulos no cambia. Solo se agregan artefactos dentro de los módulos existentes.

---

## H2. Actualizar `docs/ai/lecciones.md`

Agregar entrada:

```markdown
### [YYYY-MM-DD] Separación de identidad platform_user / tenant_user (RFC restructure-multitenant)
**Contexto:** Implementación del RFC docs/rfc/restructure-multitenant para separar la identidad global de plataforma de la pertenencia a un tenant.
**Problema:** KeyGo era modelado como un tenant con tenant_users para los admins de plataforma, lo que generaba confusión entre "usuario de plataforma" y "usuario de app".
**Solución / Buena práctica:**
- `platform_users` es la identidad global (email único, credenciales). No pertenece a ningún tenant.
- `tenant_users` es la presencia de un usuario en un tenant específico (tiene FK opcional `platform_user_id`).
- Los `platform_users` usan el endpoint `POST /api/v1/platform/account/login` para autenticarse en KeyGo UI.
- Los `tenant_users` usan `POST /api/v1/tenants/{slug}/account/login` para autenticarse en apps de tenants.
- El JWT de plataforma lleva `roles` de `platform_user_roles`; el JWT de tenant app lleva roles de membresías.
- La tabla `sessions` usa `platform_user_id NOT NULL` siempre, y `client_app_id` nullable (NULL = sesión de plataforma).
**Archivos clave:**
- `docs/design/rfc-restructure-implementation/` — plan completo
- `V27__platform_users.sql`, `V28__sessions_platform_refactor.sql`, `V29__platform_users_seed_and_role_rename.sql`
```

---

## H3. Actualizar `docs/ai/propuestas.md`

### Marcar como completadas:

- La propuesta relacionada a `platform_users` y separación de identidad (si estaba registrada)

### Agregar propuestas nuevas generadas por esta implementación:

```markdown
**T-120 — Corto plazo:** Vincular `tenant_users.platform_user_id` para todos los tenant users existentes (migración de datos post-MVP para eliminar el nullable).

**T-121 — Mediano plazo:** Endpoint de invitación de platform user (email de invitación + link de activación), en lugar de creación directa con contraseña.

**T-122 — Mediano plazo:** SSO entre plataforma y apps de tenant — cuando un platform_user hace login en KeyGo UI, debe poder acceder a sus tenant apps sin hacer login de nuevo.

**T-123 — Largo plazo:** `sessions.platform_user_id NOT NULL` — forzar NOT NULL después de completar migración de datos en V28 (cambiar nullable a required en una migración futura).
```

---

## H4. Actualizar `ROADMAP.md`

Agregar las propuestas T-120 a T-123 en la tabla de propuestas técnicas, horizonte correspondiente.

---

## H5. Actualizar `docs/ai/agents-registro.md`

Agregar entrada de historial:

```markdown
| [YYYY-MM-DD] | RFC restructure-multitenant implementado: nueva tabla `platform_users`, refactorización de `sessions` (V27–V29), nuevos endpoints `/api/v1/platform/...`, rename `keygo_account_admin` → `keygo_tenant_admin`, flujo de plataforma separado del flujo de tenant app. |
```

---

## H6. Postman collection

Agregar en `docs/postman/KeyGo-Server.postman_collection.json`:

1. **POST /api/v1/platform/account/login** — body: `{ "email": "admin@keygo.io", "password": "Admin1234!" }`, pm.test validando `access_token` y `refresh_token` en `data`
2. **POST /api/v1/platform/oauth2/token** — body: `grant_type=refresh_token&refresh_token={{platformRefreshToken}}`
3. **GET /api/v1/platform/users** — header: `Authorization: Bearer {{platformAccessToken}}`
4. **POST /api/v1/platform/users** — header: Bearer, body con email/username/password

---

## H7. Frontend Developer Guide

Actualizar sección §14 en `docs/keygo-ui/FRONTEND_DEVELOPER_GUIDE.md`:

- Agregar todos los nuevos endpoints de `/api/v1/platform/...`
- Documentar que KeyGo UI debe usar `POST /api/v1/platform/account/login` (NO `tenants/keygo/account/login`)
- Documentar la estructura del JWT de plataforma vs JWT de tenant app
- Ejemplo de flujo: login → access_token → usar en APIs de plataforma con `Authorization: Bearer <token>`

---

## H8. Verificación final del plan completo

```bash
# Build completo
./mvnw clean package -q

# Tests
./mvnw verify -q

# Smoke test (si la app está corriendo)
curl -s -X POST http://localhost:8080/keygo-server/api/v1/platform/account/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@keygo.io","password":"Admin1234!"}' | python3 -m json.tool
```
