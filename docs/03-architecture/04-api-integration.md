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
- Los selectores administrativos de roles no deben depender de catálogos hardcodeados cuando exista un endpoint dedicado (por ejemplo `GET /api/v1/platform/roles`); la UI debe poblar opciones desde backend y filtrar localmente solo las ya asignadas.
- Los DTOs de request deben preservar exactamente el naming del wire backend en snake_case; por ejemplo, la asignación de roles de plataforma exige `role_code`, no aliases camelCase ni nombres abreviados.
- Los códigos de rol que lleguen desde backend o catálogos administrativos deben normalizarse antes de compararlos en la UI; no se debe asumir casing estable (`KEYGO_ADMIN` vs `keygo_admin`) para controles de seguridad o visibilidad.
- `403 FORBIDDEN` debe tratarse como autorización de recurso: sin retry automático, sin redirección forzada y con un estado visual explícito de acceso denegado en la pantalla o bloque afectado.
- Cuando un `403` pueda ser un falso positivo operativo, la UI puede ofrecer una acción de reporte hacia un endpoint dedicado de incidentes. Si el contrato backend aún no existe, debe prepararse con MSW y registrarse en `docs/02-functional/feedback/in/`.
- Toda acción crítica iniciada por el usuario debe requerir una confirmación explícita en la UI antes de ejecutarse.
- Si la acción implica privilegios globales, elevación de permisos, impacto irreversible o exposición de seguridad especialmente alta, la confirmación debe escalar a reautenticación con contraseña y no solo a un diálogo de aceptación.
- `platformCheckEmail()` es un wrapper guiado por status HTTP: `200` significa usuario existente, `404` significa correo disponible para onboarding y `401` debe disparar un nuevo `platformAuthorize()` antes de reintentar desde la UI.
- La capa de cuenta debe seleccionar el endpoint de perfil según el alcance real de la sesión: platform users consumen `GET/PATCH /api/v1/platform/account/profile`, mientras sesiones tenant-scoped siguen usando `/api/v1/tenants/{tenantSlug}/account/profile`.

## Referencias

- OpenAPI: [../api-docs.json](../api-docs.json)
- Matriz de estado: [../08-reference/01-endpoint-status-matrix.md](../08-reference/01-endpoint-status-matrix.md)
