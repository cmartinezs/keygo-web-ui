# RFC: Pantallas y secciones incompletas por informacion y/o contrato backend

- Fecha: 2026-04-02 (actualizado: 2026-04-03)
- Estado: Propuesto (con delta backend incorporado)
- Autor: Copilot (GPT-5.3-Codex)
- Alcance: SPA keygo-web-ui (rutas publicas y autenticadas)

## 1. Objetivo

Consolidar en un solo RFC todas las pantallas y secciones que hoy estan incompletas por al menos una de estas causas:

1. Falta de endpoint backend o contrato oficial.
2. Endpoint existente pero sin wiring funcional en UI.
3. Seccion con contenido o accion aun no definida (gap de informacion funcional).

## 2. Fuentes de verdad usadas

Fuentes principales (prioridad alta):

1. docs/FRONTEND_DEVELOPER_GUIDE.md (inventario disponible vs pendiente, flujos por rol)
2. docs/api-docs.json (contrato OpenAPI tecnico)
3. src/App.tsx (rutas reales expuestas)
4. src/layouts/AdminLayout.tsx (navegacion real por rol)
5. src/pages/** y src/api/** (estado implementado real)
6. docs/FUNCTIONAL_GUIDE.md y docs/BACKLOG.md (contexto funcional y deuda documentada)
7. docs/imcomplete-sections/03-implementation-plan.md (propuesta de ejecucion backend y prerequisitos de definicion frontend)
8. docs/imcomplete-sections/04-frontend-definitions-for-backend-implementation.md (detalle de decisiones frontend para habilitar implementacion backend)

## 3. Criterio de clasificacion

- Tipo A: Incompleta por backend pendiente.
- Tipo B: Incompleta por contenido/definicion funcional pendiente.
- Tipo C: Incompleta por wiring UI pendiente (backend existe, UI no completa).

## 4. Inventario consolidado de gaps vigentes

## 4.1 Publico (sin login)

| Pantalla/Seccion | Ruta | Tipo | Gap detectado | Endpoint/Contrato relacionado | Evidencia principal |
|---|---|---|---|---|---|
| Pago de suscripcion en produccion | /subscribe (paso de pago) | A | En produccion no hay pasarela integrada, solo mensaje informativo; en dev se usa mock approve | Endpoint de PSP real pendiente (referencia backlog: /billing/contracts/{id}/pay por definir) | src/pages/register/steps/PaymentStep.tsx + docs/FUNCTIONAL_GUIDE.md + docs/BACKLOG.md |
| Landing > Developers > SDKs e integraciones | / (seccion Developers) | B | CTA marcado "Proximamente" y badge "En desarrollo" sin entrega funcional | N/A (definicion de producto/documentacion) | src/pages/landing/DevelopersSection.tsx |

## 4.2 Dashboard transversal y por rol

| Pantalla/Seccion | Ruta | Tipo | Gap detectado | Endpoint/Contrato relacionado | Evidencia principal |
|---|---|---|---|---|---|
| Modulos placeholder por navegacion | /dashboard/feature/:featureId | C (y en algunos casos A/B) | Vista placeholder generica para modulos aun no conectados | Depende del featureId (apps, users, access, audit, signing-keys, sessions, tokens, api) | src/pages/dashboard/FeaturePlaceholderPage.tsx + src/layouts/AdminLayout.tsx |
| Home dashboard rol ADMIN_TENANT | /dashboard | C | Resuelto: tarjetas conectadas a datos reales (usuarios activos, apps, accesos del dia) | GET /users + GET /apps + GET /account/sessions ya integrados | src/pages/dashboard/DashboardHomePage.tsx |
| Home dashboard rol USER_TENANT | /dashboard | C | Resuelto: tarjetas conectadas a datos reales (sesiones activas, ultimo acceso, apps con acceso) | GET /account/sessions + GET /account/access ya integrados | src/pages/dashboard/DashboardHomePage.tsx |
| Header dashboard admin > selector de rango | /dashboard | B (posible A) | Selector Hoy/7/30 dias declarado como visual, sin impacto en query | Parametrizacion backend para rango (si aplica) | docs/FUNCTIONAL_GUIDE.md (2.1 Encabezado) + src/pages/admin/DashboardPage.tsx |
| Header dashboard admin > Acciones rapidas | /dashboard | B + C | Boton visible pero sin contenido/flujo definido | N/A o endpoint segun accion final | docs/FUNCTIONAL_GUIDE.md (2.1 Encabezado) + src/pages/admin/DashboardPage.tsx |

## 4.3 Cuenta de usuario (autenticado)

| Pantalla/Seccion | Ruta | Tipo | Gap detectado | Endpoint/Contrato relacionado | Evidencia principal |
|---|---|---|---|---|---|
| Mi cuenta > pestaña Actividad (interna) | /dashboard/account (tab activity) | C | Resuelto con datos reales de sesiones de cuenta + resumen de accesos; timeline avanzada queda como mejora evolutiva | GET /account/sessions + GET /account/access ya integrados en tab | src/pages/dashboard/user/UserProfilePage.tsx |
| Configuracion > Conexiones | /dashboard/account/settings?tab=connections | A (temporal cubierto con mock) | Implementado con MSW temporal, pendiente contrato backend oficial F-042 | GET/POST/DELETE /account/connections* pendiente backend oficial | src/api/account.ts + src/mocks/handlers.ts + docs/FUNCTIONAL_GUIDE.md |

## 4.4 Areas tenant/admin con deuda funcional asociada a backend

| Pantalla/Seccion | Ruta | Tipo | Gap detectado | Endpoint/Contrato relacionado | Evidencia principal |
|---|---|---|---|---|---|
| Gestion de usuarios tenant > suspender/activar usuario | /dashboard/tenant/users | A + C | Operacion no expuesta en UI actual. Tampoco se encuentra path equivalente en OpenAPI actual para usuarios (solo existe suspend/activate de tenant) | Esperado por negocio: PUT /api/v1/tenants/{tenantSlug}/users/{userId}/suspend y /activate. Existente distinto: PUT /api/v1/tenants/{slug}/suspend y /activate | FRONTEND_DEVELOPER_GUIDE 14.2.4 + docs/api-docs.json + src/pages/dashboard/tenant/TenantUsersPage.tsx |
| Gestion de usuarios tenant > ver sesiones por usuario | /dashboard/tenant/users | A + C | Sin accion de sesiones en UI y sin path equivalente en OpenAPI actual para sesiones por userId administradas por tenant-admin | Esperado por negocio: GET /api/v1/tenants/{tenantSlug}/users/{userId}/sessions | FRONTEND_DEVELOPER_GUIDE 14.2.4 + docs/api-docs.json + src/pages/dashboard/tenant/TenantUsersPage.tsx |

## 4.5 Verificacion meticulosa de endpoints homonimos (scope correcto)

La validacion se hizo contra docs/api-docs.json para evitar falsos pendientes por nombres parecidos.

| Caso | Endpoint esperado por pantalla | Estado en OpenAPI | Endpoint parecido que si existe | Conclusión |
|---|---|---|---|---|
| Recuperacion de cuenta publica (solicitud) | POST /api/v1/tenants/{tenantSlug}/account/forgot-password | Encontrado | POST /api/v1/tenants/{tenantSlug}/users/{userId}/reset-password | No equivalen. El endpoint encontrado es self-service (sin Bearer), el parecido sigue siendo reset administrativo |
| Reset por password temporal | POST /api/v1/tenants/{tenantSlug}/account/reset-password | Encontrado | POST /api/v1/tenants/{tenantSlug}/users/{userId}/reset-password | No equivalen por flujo y actor. Uno es self-service por credenciales temporales y el otro es accion administrativa |
| Recover por token de email | POST /api/v1/tenants/{tenantSlug}/account/recover-password | Encontrado | POST /api/v1/tenants/{tenantSlug}/users/{userId}/reset-password | No equivalen por mecanismo de recuperacion (token one-time vs reset administrativo) |
| Suspender usuario del tenant | PUT /api/v1/tenants/{tenantSlug}/users/{userId}/suspend | No encontrado | PUT /api/v1/tenants/{slug}/suspend | No equivalen. El existente suspende tenant completo |
| Activar usuario del tenant | PUT /api/v1/tenants/{tenantSlug}/users/{userId}/activate | No encontrado | PUT /api/v1/tenants/{slug}/activate | No equivalen. El existente activa tenant completo |
| Sesiones de usuario administradas por tenant-admin | GET /api/v1/tenants/{tenantSlug}/users/{userId}/sessions | No encontrado | GET /api/v1/tenants/{tenantSlug}/account/sessions | No equivalen. El existente es solo sesiones propias del usuario autenticado |
| Sesiones propias (cuenta) | GET /api/v1/tenants/{tenantSlug}/account/sessions | Encontrado | N/A | Disponible y ya consumido en UI |
| Cierre de sesion propia remota | DELETE /api/v1/tenants/{tenantSlug}/account/sessions/{sessionId} | Encontrado | N/A | Disponible y ya consumido en UI |

Nota: este RFC no marca como pendiente un endpoint solo por ausencia en frontend. Primero valida si existe en OpenAPI y despues clasifica el gap como backend o wiring UI.

## 5. Observaciones de consistencia documental

Se detectaron discrepancias entre documentos historicos y el estado actual del codigo/backend:

1. docs/BACKLOG.md aun lista como pendientes algunos endpoints que en FRONTEND_DEVELOPER_GUIDE y api-docs.json ya aparecen disponibles (ej. change-password, account/sessions, notification-preferences en cuenta propia).
2. docs/FRONTEND_DEVELOPER_GUIDE.md mantiene secciones donde forgot/reset aun figura como pendiente, mientras docs/api-docs.json ya expone forgot/reset/recover para account self-service.
3. docs/FUNCTIONAL_GUIDE.md seccion 5 mezcla items ya implementados con items realmente pendientes.
4. docs/account-ui-proposal contiene fases historicas y gaps que hoy ya no aplican totalmente.

Impacto:

- Riesgo de priorizar trabajo equivocado.
- Riesgo de abrir tareas de "pendiente backend" para endpoints ya productivos.

## 5.1 Alineacion con propuesta backend (implementation plan)

Se incorporan como insumo los documentos `docs/imcomplete-sections/03-implementation-plan.md` y `docs/imcomplete-sections/04-frontend-definitions-for-backend-implementation.md`, que detallan fases backend y decisiones frontend necesarias para T-103, T-104, F-043, T-033, T-110 y F-042.

Del cruce RFC + implementation plan se concluye:

1. El flujo de recuperacion de cuenta quedo implementado en frontend (rutas publicas + pantallas + api client) sobre contrato OpenAPI disponible.
2. F-042 (conexiones de cuenta) ya tiene definiciones frontend APROBADAS (shape, catalogo de provider, alcance V1 y semantica DELETE idempotente) y queda pendiente implementacion backend/publicacion en OpenAPI.
3. Para T-110 (sesiones admin por userId), frontend debe confirmar alcance de filtro y campos de tabla para cerrar contrato de respuesta sin retrabajo.

### Definiciones frontend pendientes para desbloquear backend

1. **Recuperacion de cuenta (F-043 + T-104):** definir experiencia de usuario final para coexistencia de flujos `reset-password` (password temporal) y `recover-password` (token por email), incluyendo copy y reglas de enrutamiento.
2. **Sesiones admin por usuario (T-110):** validar columnas y filtros requeridos en UI (`ACTIVE` solo vs `ACTIVE+EXPIRED`) para cerrar contrato sin ambiguedad.

## 6. Priorizacion recomendada

### P0 (bloqueante de experiencia o contrato)

1. Implementar contrato backend de conexiones de cuenta (F-042) ya definido por frontend y reemplazar MSW.
2. Definir e integrar pasarela PSP real para /subscribe en produccion.

### P1 (completitud de navegacion por rol)

1. Reemplazar placeholders de /dashboard/feature/:featureId por modulos funcionales priorizados por negocio.
2. Resolver actividad real en tab "Actividad" de Mi cuenta.

### P2 (calidad de producto/documentacion)

1. Definir contenido y accion para "Acciones rapidas" del dashboard admin.
2. Publicar deliverable real para "SDKs e integraciones" en landing developers.
3. Sincronizar BACKLOG y FUNCTIONAL_GUIDE con estado real de backend/UI.

## 7. Criterio de cierre por item

Un item se considera cerrado cuando cumple simultaneamente:

1. Contrato backend confirmado en docs/api-docs.json.
2. Estado actualizado en docs/FRONTEND_DEVELOPER_GUIDE.md.
3. Wiring completo en UI (sin placeholder ni mock temporal).
4. Cobertura minima de pruebas (API + pantalla afectada).
5. Actualizacion de docs/FUNCTIONAL_GUIDE.md y docs/TECHNICAL_GUIDE.md.

## 8. Anexo: mapa rapido de placeholders navegables actuales

Rutas que hoy pasan por placeholder generico:

- /dashboard/feature/apps
- /dashboard/feature/users
- /dashboard/feature/access
- /dashboard/feature/audit
- /dashboard/feature/signing-keys
- /dashboard/feature/sessions
- /dashboard/feature/tokens
- /dashboard/feature/api

Nota: estas rutas estan enlazadas desde el sidebar por rol en src/layouts/AdminLayout.tsx y renderizan src/pages/dashboard/FeaturePlaceholderPage.tsx.

## 9. Referencia operativa

Para seguimiento endpoint por endpoint (UI esperada vs OpenAPI vs API front vs consumo en pantalla), revisar:

- docs/ENDPOINT_COVERAGE_MATRIX_UI_OPENAPI_2026-04-02.md
