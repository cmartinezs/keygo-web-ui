# Plan de Implementacion Frontend - Account RFC

Fecha: 2026-04-02
Estado general: En ejecucion
Estado fase actual: Fase 2 completada

## 1. Objetivo

Implementar y validar end-to-end el bloque Account/Settings contra contrato backend actualizado, cubriendo:

1. API frontend faltante.
2. UI funcional donde hoy hay placeholders.
3. Testing de regresion y comportamiento critico.
4. Documentacion funcional y tecnica sincronizada.

Incluye implementacion temporal de connections con MSW hasta disponibilidad oficial de backend.

## 2. Alcance acordado

1. Entrega completa: API + UI + tests + docs.
2. Connections: habilitar flujo parcial temporal con MSW.
3. Estrategia de datos: mapeo explicito en boundary API para aislar diferencias de naming interno/wire.

## 3. Fase 1 (completada) - Baseline y matriz de contrato

### 3.1 Evidencia usada

1. Contrato tecnico: [docs/api-docs.json](../api-docs.json)
2. Estado funcional/backend: [docs/FRONTEND_DEVELOPER_GUIDE.md](../FRONTEND_DEVELOPER_GUIDE.md)
3. API actual: [src/api/account.ts](../../src/api/account.ts)
4. UI actual: [src/pages/dashboard/account/AccountSettingsPage.tsx](../../src/pages/dashboard/account/AccountSettingsPage.tsx)
5. UI actual: [src/pages/dashboard/user/UserProfilePage.tsx](../../src/pages/dashboard/user/UserProfilePage.tsx)
6. Routing: [src/App.tsx](../../src/App.tsx)

### 3.2 Matriz baseline (endpoint por endpoint)

| Endpoint | Guide | OpenAPI | Frontend actual | UI actual | Estado |
|---|---|---|---|---|---|
| GET /account/profile | Implementado | Presente | getProfile | UserProfile consumiendo | Cubierto |
| PATCH /account/profile | Implementado | Presente | updateProfile | UserProfile consumiendo | Cubierto |
| POST /account/change-password | Implementado | Presente | No implementado | Placeholder security | Gap |
| GET /account/sessions | Implementado | Presente | No implementado | Placeholder security | Gap |
| DELETE /account/sessions/{id} | Implementado | Derivado desde sessions | No implementado | Placeholder security | Gap |
| GET /account/notification-preferences | Implementado | Presente | No implementado | Placeholder notifications | Gap |
| PATCH /account/notification-preferences | Implementado | Presente | No implementado | Placeholder notifications | Gap |
| GET /account/access | Implementado | Presente | No implementado | Tab access con texto, sin wiring | Gap |
| GET /account/connections | Pendiente (F-042) | No presente | No implementado | Placeholder connections | Temporal-MSW |
| POST/DELETE /account/connections | Pendiente (F-042) | No presente | No implementado | Placeholder connections | Temporal-MSW |

### 3.3 Hallazgos concretos

1. La brecha principal no esta en routing: rutas account y settings ya existen.
2. La brecha real esta en src/api/account.ts (solo profile GET/PATCH) y en tabs de settings/profile que aun usan placeholders.
3. Connections requiere contrato temporal local con MSW por no existir en OpenAPI.

### 3.4 Evidencia de lineas clave

1. OpenAPI account paths:
   1. [docs/api-docs.json](../api-docs.json#L2910)
   2. [docs/api-docs.json](../api-docs.json#L3390)
   3. [docs/api-docs.json](../api-docs.json#L3562)
   4. [docs/api-docs.json](../api-docs.json#L4278)
   5. [docs/api-docs.json](../api-docs.json#L4350)
2. Guide inventory account:
   1. [docs/FRONTEND_DEVELOPER_GUIDE.md](../FRONTEND_DEVELOPER_GUIDE.md#L1757)
   2. [docs/FRONTEND_DEVELOPER_GUIDE.md](../FRONTEND_DEVELOPER_GUIDE.md#L1767)
3. API account actual (solo 2 funciones):
   1. [src/api/account.ts](../../src/api/account.ts#L30)
   2. [src/api/account.ts](../../src/api/account.ts#L47)
4. Placeholders actuales:
   1. [src/pages/dashboard/account/AccountSettingsPage.tsx](../../src/pages/dashboard/account/AccountSettingsPage.tsx#L276)
   2. [src/pages/dashboard/account/AccountSettingsPage.tsx](../../src/pages/dashboard/account/AccountSettingsPage.tsx#L282)
   3. [src/pages/dashboard/account/AccountSettingsPage.tsx](../../src/pages/dashboard/account/AccountSettingsPage.tsx#L297)
   4. [src/pages/dashboard/account/AccountSettingsPage.tsx](../../src/pages/dashboard/account/AccountSettingsPage.tsx#L312)
   5. [src/pages/dashboard/user/UserProfilePage.tsx](../../src/pages/dashboard/user/UserProfilePage.tsx#L369)
5. Rutas account ya activas:
   1. [src/App.tsx](../../src/App.tsx#L102)
   2. [src/App.tsx](../../src/App.tsx#L103)
   3. [src/App.tsx](../../src/App.tsx#L126)

## 4. Plan completo de ejecucion (fases 2 a 12)

### Fase 2 - API account

Estado: Completada

1. Extender src/api/account.ts con wrappers faltantes:
   1. changePassword
   2. getSessions
   3. revokeSession
   4. getNotificationPreferences
   5. updateNotificationPreferences
   6. getAccountAccess
   7. operations connections (mock-first)
2. Mantener RequestOptions y unwrapResponseData.
3. Definir ACCOUNT_QUERY_KEYS para nuevos dominios.

Implementado en:

1. [src/api/account.ts](../../src/api/account.ts)
2. [src/types/user.ts](../../src/types/user.ts)

### Fase 3 - Tipos y mapeo

1. Ampliar src/types/user.ts con DTOs de account faltantes.
2. Implementar mapeadores explicitos request/response en boundary API.
3. Evitar parsing/manual mapping en componentes UI.

### Fase 4 - MSW temporal de connections

1. Crear infraestructura de mocks account en src/mocks.
2. Implementar handlers para list/link/unlink connections.
3. Etiquetar con comentario de pendiente backend.

### Fase 5 - UI Security tab

1. Reemplazar placeholders por:
   1. Formulario cambio de contrasena.
   2. Listado de sesiones activas.
   3. Revocacion remota de sesion.
2. Manejo local de loading/error/data.
3. Accesibilidad keyboard-first y roles ARIA.

### Fase 6 - UI Notifications tab

1. Implementar lectura y edicion de preferencias.
2. Feedback de mutaciones con toast.
3. Validaciones de formulario y mensajes de error claros.

### Fase 7 - UI Connections tab (temporal)

1. Habilitar flujo parcial sobre MSW.
2. Dejar señalizacion explicita de dependencia backend.
3. Estructura preparada para swap a backend real sin rehacer UI.

### Fase 8 - UserProfile access wiring

1. Conectar tab access a endpoint account/access.
2. Estados locales robustos (loading/error/empty/data).
3. Mantener continuidad visual sin bloquear pantalla completa.

### Fase 9 - Reutilizacion y arquitectura

1. Extraer presentacionales reutilizables cuando exista repeticion.
2. Mantener patron Container/Presenter.
3. Evitar duplicacion de logica entre tabs.

### Fase 10 - Tests

1. Tests de capa API account.
2. Tests de pages account/profile.
3. Casos para flujo connections con MSW.

### Fase 11 - Verificacion integral

1. Lint y tests.
2. Verificacion manual de rutas account.
3. Validacion de resiliencia (timeout/retry) y accesibilidad.

### Fase 12 - Documentacion y cierre

1. Actualizar docs/FUNCTIONAL_GUIDE.md.
2. Actualizar docs/TECHNICAL_GUIDE.md.
3. Registrar fuera de alcance en docs/BACKLOG.md si aplica.

## 5. Dependencias y orden

1. Fase 2 depende de Fase 1.
2. Fases 5, 6 y 8 dependen de Fases 2 y 3.
3. Fase 7 depende de Fase 4.
4. Fase 10 depende de Fases 2 a 8.
5. Fases 11 y 12 dependen de Fase 10.

## 6. Criterio de salida de Fase 1

1. Matriz endpoint/ruta/estado/brecha validada y documentada.
2. Alcance tecnico y funcional confirmado.
3. Lista de archivos objetivo y dependencias de ejecucion definida.
4. Sin bloqueos para iniciar Fase 2.
