# BE-003 — `GET /platform/users` disponible para la UI

**Fecha:** 2026-04-13  
**Estado:** 🔴 Abierto  
**Plan:** T-142  
**Feedback IN relacionado:** UI-001

## Cambio

El backend habilitó `GET /api/v1/platform/users` para listar usuarios globales de plataforma.

El endpoint devuelve `BaseResponse<PagedData<PlatformUserData>>` y soporta:

- `page`
- `size`
- `status`
- `username_like`
- `email_like`
- `sort`
- `order`

Código de éxito esperado:

- `PLATFORM_USER_LIST_RETRIEVED`

## Impacto en UI

- La pantalla admin de plataforma ya puede consumir el listado sin depender de rutas alternativas.
- El contrato es paginado y sigue la misma convención usada por otros listados del backend.
- Si la UI necesita filtrar o ordenar, puede usar directamente los query params soportados por el endpoint.

## Referencias

- Feedback UI de origen: [UI-001-missing-platform-users-list-endpoint.md](../in/UI-001-missing-platform-users-list-endpoint.md)
- Tarea técnica aplicada: [T-142-platform-users-list-endpoint.md](../../../../09-ai/tasks/T-142-platform-users-list-endpoint.md)
- Documentación funcional: [08-endpoints-admin.md](../../08-endpoints-admin.md)

## Confirmación

_Pendiente — UI debe confirmar integración del endpoint en la pantalla correspondiente._
