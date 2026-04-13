# UI-002 — Missing platform user roles endpoint

**Fecha:** 2026-04-13  
**Estado:** 🟢 Resuelto  
**Contexto:** Pantalla admin de plataforma que necesita obtener los roles asignados a un usuario global.

## Problema

La UI intenta consumir `GET /api/v1/platform/users/{userId}/platform-roles`, pero el backend
responde `HttpRequestMethodNotSupportedException` porque `PlatformUserController` hoy solo
expone:

- `POST /api/v1/platform/users/{userId}/platform-roles`
- `DELETE /api/v1/platform/users/{userId}/platform-roles/{roleCode}`

No existe el `GET` de colección para consultar los roles ya asignados al usuario.

## Comportamiento esperado

El backend debe exponer un endpoint de lectura para obtener los roles de plataforma asignados
a un `platform_user`, de forma consumible por la UI.

## Resolución

Se implementó `GET /api/v1/platform/users/{userId}/platform-roles` para exponer los roles de
plataforma asignados a un usuario global.

La respuesta ahora entrega una lista simple con metadata de rol, metadata de asignación y
contexto de contractor cuando aplica:

- `assignmentId`
- `roleId`
- `roleCode`
- `roleName`
- `description`
- `scopeType`
- `contractorId`
- `tenantId`
- `contractor { id, displayName, billingEmail }`
- `assignedAt`

**Tarea/RFC que lo resolvió:** [T-143-platform-user-roles-read-endpoint.md](../../../../09-ai/tasks/T-143-platform-user-roles-read-endpoint.md)

**Feedback OUT asociado:** [BE-004-platform-user-roles-endpoint.md](../out/BE-004-platform-user-roles-endpoint.md)

<!-- Confirmado y resuelto: el controller ahora expone GET /{userId}/platform-roles -->
