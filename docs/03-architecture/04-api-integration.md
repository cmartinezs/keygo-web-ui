# Integración API

## Contrato base

Todos los endpoints del backend devuelven `BaseResponse<T>`. La capa API debe extraer `data` antes de entregar el resultado a la UI.

## Piezas principales

| Elemento             | Rol                                                       |
| -------------------- | --------------------------------------------------------- |
| `client.ts`          | Axios base, interceptores y configuración común.          |
| `response.ts`        | Helpers para unwrap de `BaseResponse<T>`.                 |
| `errorNormalizer.ts` | Traducción de errores backend a forma usable por la UI.   |
| Módulos por dominio  | Tenants, users, memberships, billing, account, auth, etc. |

## Reglas operativas

- Timeouts explícitos por request crítica.
- GET críticos con retry controlado.
- Mutaciones críticas sin auto-retry si no hay garantía de idempotencia.
- Endpoints pendientes se mockean con MSW y se documentan como tales.
- Cuando el backend amplía un payload útil, los DTOs y la UI deben alinearse para exponer esa información y cubrir el estado de carga local del bloque afectado (por ejemplo `role_id`, `assignment_id`, `scope_type` o un futuro `picture_url` en detalles de usuario).
- Los arreglos de acciones operativas devueltos por endpoints agregados (por ejemplo `quick_actions` en dashboard) deben renderizarse desde el payload, no reemplazarse por CTAs estáticos desconectados del contrato.

## Referencias

- OpenAPI: [../api-docs.json](../api-docs.json)
- Matriz de estado: [../08-reference/01-endpoint-status-matrix.md](../08-reference/01-endpoint-status-matrix.md)
