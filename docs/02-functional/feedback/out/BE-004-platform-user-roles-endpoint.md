# BE-004 — `GET /platform/users/{userId}/platform-roles` disponible para la UI

**Fecha:** 2026-04-13  
**Estado:** 🟢 Confirmado  
**Plan:** T-143  
**Feedback IN relacionado:** UI-002

## Cambio

El backend habilitó `GET /api/v1/platform/users/{userId}/platform-roles` para consultar los
roles de plataforma asignados a un usuario global.

La respuesta ahora entrega una lista simple con:

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

Código de éxito esperado:

- `PLATFORM_ROLE_LIST_RETRIEVED`

## Impacto en UI

- La pantalla admin de plataforma ya puede consultar los roles asignados a cada usuario.
- No hace falta paginación para esta superficie.
- La UI puede renderizar directamente el nombre legible del rol sin resolverlo localmente.
- La UI puede distinguir si la asignación es global o acotada por scope y mostrar contexto de contractor sin lookup adicional.

## Referencias

- Feedback UI de origen: [UI-002-missing-platform-user-roles-endpoint.md](../in/UI-002-missing-platform-user-roles-endpoint.md)
- Tarea técnica aplicada: [T-143-platform-user-roles-read-endpoint.md](../../../../09-ai/tasks/T-143-platform-user-roles-read-endpoint.md)
- Documentación funcional: [08-endpoints-admin.md](../../08-endpoints-admin.md)

## Confirmación

La revisión de T-143 fue aprobada por el usuario el 2026-04-13, validando el contrato del
endpoint para consumo desde UI.
