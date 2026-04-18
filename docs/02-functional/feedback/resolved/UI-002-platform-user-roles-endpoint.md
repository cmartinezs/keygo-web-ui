# UI-002 — Missing platform user roles endpoint

**Fecha:** 2026-04-13  
**Iniciado por:** UI  
**Estado:** 🟢 Resuelto  
**Contexto / Plan:** Pantalla admin de plataforma — roles asignados a un usuario global / T-143

---

## Apertura _(→ UI)_

### Descripción

La UI intentaba consumir `GET /api/v1/platform/users/{userId}/platform-roles`, pero el backend
respondía `HttpRequestMethodNotSupportedException` porque `PlatformUserController` solo exponía:

- `POST /api/v1/platform/users/{userId}/platform-roles`
- `DELETE /api/v1/platform/users/{userId}/platform-roles/{roleCode}`

No existía el `GET` de colección para consultar los roles ya asignados al usuario.

### Expectativa del receptor

El backend debe exponer un endpoint de lectura para obtener los roles de plataforma asignados
a un `platform_user`, consumible desde la pantalla de detalle de usuario.

---

## Respuesta _(→ Backend)_

Se implementó `GET /api/v1/platform/users/{userId}/platform-roles`. La respuesta entrega una
lista con metadata de rol, metadata de asignación y contexto de contractor cuando aplica:

- `assignmentId`, `roleId`, `roleCode`, `roleName`, `description`
- `scopeType`, `contractorId`, `tenantId`
- `contractor { id, displayName, billingEmail }`
- `assignedAt`

Código de éxito: `PLATFORM_ROLE_LIST_RETRIEVED`. Sin paginación para esta superficie.

La revisión fue aprobada el 2026-04-13.

**Referencia:** [T-143](../../../../09-ai/tasks/T-143-platform-user-roles-read-endpoint.md) — [08-endpoints-admin.md](../08-endpoints-admin.md)
