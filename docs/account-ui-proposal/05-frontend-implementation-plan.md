# Plan de Implementacion Frontend - Account RFC

Fecha: 2026-04-02
Estado general: Completado
Estado fase actual: Fase 12 completada

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

Estado: Completada

1. Corregir DTOs internos para alinear con contrato OpenAPI real:
   - `RevokeAccountSessionResult`: corregido de `{ revoked }` a `{ session_id, already_closed }`.
   - `NotificationPreferencesData`: eliminados `billing_alerts_in_app`, `product_updates_in_app`; agregado `weekly_digest`.
   - `UpdateNotificationPreferencesRequest`: mismos cambios.
   - `AccountAccessData`: corregido conforme a `UserAccessData` de OpenAPI (`app_id`, `app_name`, `membership_id`, `status`, `roles: string[]`).
   - `AccountAccessRoleData`: eliminado (no existe en contrato real).
2. Agregar tipos wire (camelCase) en seccion dedicada de `src/types/user.ts`:
   - `WireChangePasswordRequest`, `WireAccountSessionData`, `WireRevokeSessionResult`,
     `WireNotificationPreferencesData`, `WireUpdateNotificationPreferencesRequest`, `WireUserAccessData`.
3. Agregar funciones mapper privadas en `src/api/account.ts`:
   - `toWireChangePassword`, `fromWireSession`, `fromWireRevokeSession`,
     `fromWireNotificationPreferences`, `toWireUpdateNotificationPreferences`, `fromWireUserAccess`.
4. Actualizar funciones de API para aplicar mappers en el boundary:
   - `changePassword`, `getSessions`, `revokeSession`, `getNotificationPreferences`,
     `updateNotificationPreferences`, `getAccountAccess`.

Implementado en:

1. [src/api/account.ts](../../src/api/account.ts)
2. [src/types/user.ts](../../src/types/user.ts)


2. Implementar mapeadores explicitos request/response en boundary API.
3. Evitar parsing/manual mapping en componentes UI.

### Fase 4 - MSW temporal de connections

Estado: Completada

1. Instalado `msw@2` como devDependency.
2. Creada infraestructura en `src/mocks/`:
   - `handlers.ts` — 3 handlers (GET list, POST link, DELETE unlink) con datos semilla.
   - `browser.ts` — Service Worker para interceptar en navegador.
   - `server.ts` — Instancia Node para interceptar en tests.
3. Agregada variable `VITE_MOCK_CONNECTIONS` (bool, default=false) a `src/config/env.ts`.
4. `src/main.tsx` llama `prepareMocks()` antes del render; solo activa el worker si
   `env.MOCK_CONNECTIONS && env.DEV`.
5. Ejecutado `npx msw init public/` — archivo `mockServiceWorker.js` generado en `public/`.
6. Todos los handlers marcados con `⏳ pendiente backend (F-042)`.

Implementado en:

1. [src/mocks/handlers.ts](../../src/mocks/handlers.ts)
2. [src/mocks/browser.ts](../../src/mocks/browser.ts)
3. [src/mocks/server.ts](../../src/mocks/server.ts)
4. [src/config/env.ts](../../src/config/env.ts)
5. [src/main.tsx](../../src/main.tsx)

### Fase 5 - UI Security tab

Estado: Completada

1. Agregadas claves i18n `accountSecurity.*` en `es-CL.json` y `en-US.json` (38 claves).
2. Creado `ChangePasswordForm.tsx` — formulario con Zod + RHF, 3 campos de contraseña con toggle,
   submit con `useMutation` de `changePassword`, feedback toast en éxito y error, ARIA completo.
3. Creado `SessionsList.tsx` — bloque autónomo con `useQuery(getSessions)` + `useMutation(revokeSession)`,
   `SessionCard` para cada sesión, badge de sesión actual, revocación remota, accesibilidad keyboard-first.
4. Reemplazados los 2 `PendingFeatureCard` del panel `security` por `<ChangePasswordForm />` y `<SessionsList />`.

Implementado en:

1. [src/pages/dashboard/account/ChangePasswordForm.tsx](../../src/pages/dashboard/account/ChangePasswordForm.tsx)
2. [src/pages/dashboard/account/SessionsList.tsx](../../src/pages/dashboard/account/SessionsList.tsx)
3. [src/pages/dashboard/account/AccountSettingsPage.tsx](../../src/pages/dashboard/account/AccountSettingsPage.tsx)
4. [src/i18n/locales/es-CL.json](../../src/i18n/locales/es-CL.json)
5. [src/i18n/locales/en-US.json](../../src/i18n/locales/en-US.json)

### Fase 6 - UI Notifications tab

Estado: Completada

1. Creado `NotificationsPreferencesForm.tsx` con lectura (`useQuery`) y edicion (`useMutation`) de
   `notification-preferences`, usando `runGetWithRecovery` para GET y timeout explicito de red.
2. Implementado formulario accesible con 5 toggles mapeados al contrato real:
   - `security_alerts_email`
   - `security_alerts_in_app`
   - `billing_alerts_email`
   - `product_updates_email`
   - `weekly_digest`
3. Feedback de mutaciones con toast:
   - exito: `accountNotifications.saveSuccess`
   - timeout: `notifyMutationTimeout(...)`
   - error API: `getAppApiError(error).clientMessage`
4. Reemplazado placeholder de tab `notifications` por `<NotificationsPreferencesForm />`.
5. Agregadas claves i18n `accountNotifications.*` en `es-CL` y `en-US`.

Implementado en:

1. [src/pages/dashboard/account/NotificationsPreferencesForm.tsx](../../src/pages/dashboard/account/NotificationsPreferencesForm.tsx)
2. [src/pages/dashboard/account/AccountSettingsPage.tsx](../../src/pages/dashboard/account/AccountSettingsPage.tsx)
3. [src/i18n/locales/es-CL.json](../../src/i18n/locales/es-CL.json)
4. [src/i18n/locales/en-US.json](../../src/i18n/locales/en-US.json)

### Fase 7 - UI Connections tab (temporal)

Estado: Completada

1. Creado `ConnectionsPanel.tsx` con flujo completo temporal:
   - `getAccountConnections` (listado)
   - `linkAccountConnection` (vincular proveedor)
   - `unlinkAccountConnection` (desvincular)
2. Integrado con `runGetWithRecovery` para GET y timeout explicito para mutaciones.
3. Señalización explícita de dependencia backend pendiente (`F-042`) en la UI:
   - badge `Temporal MSW`
   - mensaje contextual de contrato pendiente.
4. Reemplazado placeholder de tab `connections` por `<ConnectionsPanel />`.
5. Añadidas claves i18n `accountConnections.*` en `es-CL` y `en-US`.

Implementado en:

1. [src/pages/dashboard/account/ConnectionsPanel.tsx](../../src/pages/dashboard/account/ConnectionsPanel.tsx)
2. [src/pages/dashboard/account/AccountSettingsPage.tsx](../../src/pages/dashboard/account/AccountSettingsPage.tsx)
3. [src/i18n/locales/es-CL.json](../../src/i18n/locales/es-CL.json)
4. [src/i18n/locales/en-US.json](../../src/i18n/locales/en-US.json)

### Fase 8 - UserProfile access wiring

Estado: Completada

1. Conectado tab `access` de `UserProfilePage` al endpoint real `getAccountAccess(...)`.
2. Implementados estados locales robustos:
   - loading (`role=\"status\"`, `aria-live=\"polite\"`)
   - error (`role=\"alert\"`)
   - empty
   - data list con `membership`, `status` y `roles`.
3. Se mantiene continuidad visual: la carga/error del panel Access no bloquea el resto de la página.
4. Agregadas claves i18n para Access (`loading`, `errorFallback`, `empty`, `listAria`, etc.) en `es-CL` y `en-US`.

Implementado en:

1. [src/pages/dashboard/user/UserProfilePage.tsx](../../src/pages/dashboard/user/UserProfilePage.tsx)
2. [src/i18n/locales/es-CL.json](../../src/i18n/locales/es-CL.json)
3. [src/i18n/locales/en-US.json](../../src/i18n/locales/en-US.json)

### Fase 9 - Reutilizacion y arquitectura

Estado: Completada

1. Extraídos presentacionales compartidos en `AccountPanelPrimitives.tsx`:
   - `PanelCard`
   - `LoadingMessage`
   - `ErrorMessage`
   - `PrimaryActionButton`
   - `DangerActionButton`
2. Aplicados en módulos de settings para reducir duplicación visual:
   - `NotificationsPreferencesForm.tsx`
   - `ConnectionsPanel.tsx`
   - `SessionsList.tsx`
3. Se preserva patrón Container/Presenter:
   - lógica de datos (query/mutation) permanece en cada contenedor.
   - primitives solo encapsulan presentación y estados visuales repetidos.

Implementado en:

1. [src/pages/dashboard/account/AccountPanelPrimitives.tsx](../../src/pages/dashboard/account/AccountPanelPrimitives.tsx)
2. [src/pages/dashboard/account/NotificationsPreferencesForm.tsx](../../src/pages/dashboard/account/NotificationsPreferencesForm.tsx)
3. [src/pages/dashboard/account/ConnectionsPanel.tsx](../../src/pages/dashboard/account/ConnectionsPanel.tsx)
4. [src/pages/dashboard/account/SessionsList.tsx](../../src/pages/dashboard/account/SessionsList.tsx)

### Fase 10 - Tests

Estado: Completada

1. Agregada suite unitaria `src/api/account.test.ts` (7 casos) para validar:
   - `ACCOUNT_QUERY_KEYS`.
   - Mapeo request `changePassword` (snake_case -> camelCase).
   - Mapeo response `getSessions` (camelCase -> snake_case).
   - Mapeo response `revokeSession`.
   - Mapeo bidireccional de `notification-preferences`.
   - Mapeo de `account/access`.
   - Encoding correcto de rutas `link/unlink` en `connections` temporal.
2. Los tests mockean `apiClient` y `tenantUrl` con Vitest (`vi.hoisted + vi.mock`) para aislamiento total de red.
3. Ejecución validada: `vitest run src/api/account.test.ts` -> 7/7 passing.

Implementado en:

1. [src/api/account.test.ts](../../src/api/account.test.ts)

### Fase 11 - Verificacion integral

Estado: Completada

1. Verificacion de calidad automatizada:
   - `npm run lint` -> OK.
   - `npm run test` -> 8 files / 30 tests passing.
   - `npm run build` -> build de produccion exitoso.
2. Verificacion de rutas account por inspeccion de router:
   - `/dashboard/account`
   - `/dashboard/account/settings`
   - redirect legacy `/dashboard/user/sessions` -> `/dashboard/account/settings?tab=security`
3. Validacion de resiliencia/accesibilidad por inspeccion de codigo:
   - GET criticos en account usan `runGetWithRecovery` + timeout/retry.
   - estados locales de carga/error con `role="status"` y `role="alert"` en panels account/profile.

Nota: la validacion manual visual de UI en navegador no se ejecuto en esta fase desde CLI.

### Fase 12 - Documentacion y cierre

Estado: Completada

1. `docs/FUNCTIONAL_GUIDE.md` actualizado para reflejar estado real de Account:
   - tab Access en `/dashboard/account` ya conectado a backend.
   - tabs de settings (seguridad/notificaciones/conexiones) documentadas como implementadas.
2. `docs/TECHNICAL_GUIDE.md` actualizado para sincronizar deuda técnica y evitar referencias obsoletas a placeholders ya removidos.
3. `docs/BACKLOG.md` actualizado con mejora fuera de alcance detectada en verificación integral:
   - optimización de chunks/bundle en build de producción.
4. Cierre de ciclo validado con lint + test + build en Fase 11.

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
