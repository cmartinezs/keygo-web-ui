# BE-006 — `GET /platform/roles` disponible para la UI

**Fecha:** 2026-04-13  
**Estado:** 🟢 Confirmado  
**Plan:** T-146

## Cambio

El backend habilitó `GET /api/v1/platform/roles` para consultar el catálogo de roles de
plataforma disponibles para asignación desde la UI admin.

La respuesta entrega una lista simple con:

- `id`
- `code`
- `name`
- `description`

Código de éxito esperado:

- `PLATFORM_ROLE_LIST_RETRIEVED`

## Impacto en UI

- La pantalla admin ya puede poblar el selector/listado de roles sin hardcodear catálogo local.
- La UI puede usar el mismo código de rol canónico que luego envía al flujo de asignación.
- La superficie admite `KEYGO_ADMIN` y `KEYGO_ACCOUNT_ADMIN`; la UI debe considerar ese acceso en
  experiencias administrativas scopeadas.

## Referencias

- Tarea técnica aplicada: [T-146-platform-roles-catalog-endpoint.md](../../../../09-ai/tasks/T-146-platform-roles-catalog-endpoint.md)
- Documentación funcional: [08-endpoints-admin.md](../../08-endpoints-admin.md)

## Confirmación

La UI ya quedó adaptada para consumir `GET /api/v1/platform/roles` en el detalle de usuario
de plataforma, poblando el selector de roles disponibles desde backend y filtrando los ya
asignados al usuario.

**Feedback IN asociado:** [UI-004-platform-roles-catalog-endpoint.md](../in/UI-004-platform-roles-catalog-endpoint.md)
