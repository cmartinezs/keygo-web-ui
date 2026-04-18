# Matriz de Estado de Endpoints — Integración Backend → Frontend

**Última actualización:** 2026-04-03  
**OpenAPI versión:** docs/api-docs.json (snapshot 2026-04-02)  
**Propósito:** Fuente única de verdad para el estado de cada endpoint: qué está productivo, qué está mockeado, y qué está realmente bloqueado.

---

## Resumen Ejecutivo

| Categoría              | Total  | ✅ Productivos | ⚠️ Mockeados (OpenAPI existe) | ❌ No existe en OpenAPI |
| ---------------------- | ------ | -------------- | ----------------------------- | ----------------------- |
| **Account & Settings** | 14     | 14             | 0                             | 0                       |
| **Users**              | 8      | 8              | 0                             | 0                       |
| **Tenants**            | 5      | 5              | 0                             | 0                       |
| **Client Apps**        | 7      | 7              | 0                             | 0                       |
| **Memberships**        | 3      | 3              | 0                             | 0                       |
| **Billing**            | 12     | 12             | 0                             | 0                       |
| **Admin & Platform**   | 5      | 3              | 0                             | 2 (placeholders)        |
| **Auth**               | 4      | 4              | 0                             | 0                       |
| **TOTAL**              | **58** | **56**         | **0**                         | **2**                   |

---

## Detalle por dominio

### 1. Account & Settings (Autenticado, sin X-KEYGO-ADMIN)

Todos los endpoints de perfil, contraseña, sesiones y preferencias del usuario logueado.

| Endpoint                              | Método | OpenAPI | Frontend (src/api)                    | MSW | Estado        | Notas                                   |
| ------------------------------------- | ------ | ------- | ------------------------------------- | --- | ------------- | --------------------------------------- |
| `account/profile`                     | GET    | ✅      | ✅ getProfile                         | ❌  | ✅ Productivo | Devuelve claims OIDC extendidos         |
| `account/profile`                     | PATCH  | ✅      | ✅ updateProfile                      | ❌  | ✅ Productivo | Semántica PATCH — solo no-null          |
| `platform/account/profile`            | GET    | ✅*     | ✅ getPlatformProfile                 | ❌  | ✅ Productivo | Perfil self-service de platform user (`tenant_id = null`) |
| `platform/account/profile`            | PATCH  | ✅*     | ✅ updatePlatformProfile              | ❌  | ✅ Productivo | Solo `first_name`, `last_name`, `phone_number`, `locale`, `zoneinfo`, `profile_picture_url` |
| `account/change-password`             | POST   | ✅      | ✅ changePassword                     | ❌  | ✅ Productivo | Requiere contraseña actual              |
| `account/forgot-password`             | POST   | ✅      | ✅ forgotPassword                     | ❌  | ✅ Productivo | Anti-enumeración: siempre 200           |
| `account/recover-password`            | POST   | ✅      | ✅ recoverPassword                    | ❌  | ✅ Productivo | Usa token one-time de email             |
| `account/reset-password`              | POST   | ✅      | ✅ resetPasswordWithTemporaryPassword | ❌  | ✅ Productivo | Password temporal de admin              |
| `account/sessions`                    | GET    | ✅      | ✅ getSessions                        | ❌  | ✅ Productivo | Devuelve sesiones ACTIVE + `is_current` |
| `account/sessions/{sessionId}`        | DELETE | ✅      | ✅ revokeSession                      | ❌  | ✅ Productivo | Idempotente; ownership check            |
| `account/notification-preferences`    | GET    | ✅      | ✅ getNotificationPreferences         | ❌  | ✅ Productivo | Defaults si no existe registro          |
| `account/notification-preferences`    | PATCH  | ✅      | ✅ updateNotificationPreferences      | ❌  | ✅ Productivo | Upsert; rechaza campos desconocidos     |
| `account/access`                      | GET    | ✅      | ✅ getAccountAccess                   | ❌  | ✅ Productivo | Membresías del usuario con roles        |
| `account/connections`                 | GET    | ✅      | ✅ getAccountConnections              | ❌  | ✅ Productivo | Integrado en `ConnectionsPanel.tsx`     |
| `account/connections/{provider}/link` | POST   | ✅      | ✅ linkAccountConnection              | ❌  | ✅ Productivo | Integrado en `ConnectionsPanel.tsx`     |
| `account/connections/{connectionId}`  | DELETE | ✅      | ✅ unlinkAccountConnection            | ❌  | ✅ Productivo | Integrado en `ConnectionsPanel.tsx`     |

**Resumen:** 16 endpoints. **16 productivos ✅**

\* `platform/account/profile` fue confirmado por backend en `docs/02-functional/feedback/out/BE-007-platform-account-profile.md` mientras `docs/api-docs.json` local se sincroniza al siguiente snapshot.

---

### 2. Users (ADMIN_TENANT: Gestión de usuarios del tenant)

| Endpoint                        | Método | OpenAPI | Frontend                | MSW | Estado        | Notas                                      |
| ------------------------------- | ------ | ------- | ----------------------- | --- | ------------- | ------------------------------------------ |
| `users`                         | GET    | ✅      | ✅ listUsers            | ❌  | ✅ Productivo | Lista usuarios del tenant                  |
| `users`                         | POST   | ✅      | ✅ createUser           | ❌  | ✅ Productivo | Crea usuario + envía verificación          |
| `users/{userId}`                | GET    | ✅      | ✅ getUser              | ❌  | ✅ Productivo | Detalles de usuario                        |
| `users/{userId}`                | PUT    | ✅      | ✅ updateUser           | ❌  | ✅ Productivo | Actualiza firstName/lastName               |
| `users/{userId}/suspend`        | PUT    | ✅      | ✅ suspendUser          | ❌  | ✅ Productivo | Integrado en `TenantUsersPage.tsx`         |
| `users/{userId}/activate`       | PUT    | ✅      | ✅ activateUser         | ❌  | ✅ Productivo | Integrado en `TenantUsersPage.tsx`         |
| `users/{userId}/reset-password` | POST   | ✅      | ✅ resetUserPassword    | ❌  | ✅ Productivo | Reset administrativo con password temporal |
| `users/{userId}/sessions`       | GET    | ✅      | ✅ getAdminUserSessions | ❌  | ✅ Productivo | Integrado en `TenantUsersPage.tsx`         |

**Resumen:** 8 endpoints. **8 productivos ✅**

---

### 3. Tenants (ADMIN: Ciclo de vida de tenants)

| Endpoint                  | Método | OpenAPI | Frontend          | MSW | Estado        | Notas                           |
| ------------------------- | ------ | ------- | ----------------- | --- | ------------- | ------------------------------- |
| `tenants`                 | GET    | ✅      | ✅ listTenants    | ❌  | ✅ Productivo | Lista todos los tenants (ADMIN) |
| `tenants`                 | POST   | ✅      | ✅ createTenant   | ❌  | ✅ Productivo | Crea tenant (ADMIN)             |
| `tenants/{slug}`          | GET    | ✅      | ✅ getTenant      | ❌  | ✅ Productivo | Detalles de tenant              |
| `tenants/{slug}/suspend`  | PUT    | ✅      | ✅ suspendTenant  | ❌  | ✅ Productivo | Suspende tenant                 |
| `tenants/{slug}/activate` | PUT    | ✅      | ✅ activateTenant | ❌  | ✅ Productivo | Activa tenant suspendido        |

**Resumen:** 5 endpoints. **5 productivos ✅**

---

### 4. Client Apps (ADMIN_TENANT: Aplicaciones OAuth2)

| Endpoint                           | Método | OpenAPI | Frontend                 | MSW | Estado        | Notas                             |
| ---------------------------------- | ------ | ------- | ------------------------ | --- | ------------- | --------------------------------- |
| `apps`                             | GET    | ✅      | ✅ listClientApps        | ❌  | ✅ Productivo | Lista apps del tenant             |
| `apps`                             | POST   | ✅      | ✅ createClientApp       | ❌  | ✅ Productivo | Crea app (PUBLIC o CONFIDENTIAL)  |
| `apps/{clientAppId}`               | GET    | ✅      | ✅ getClientApp          | ❌  | ✅ Productivo | Detalles de app                   |
| `apps/{clientAppId}`               | PATCH  | ✅      | ✅ updateClientApp       | ❌  | ✅ Productivo | Edita metadata de app             |
| `apps/{clientAppId}/secret/rotate` | POST   | ✅      | ✅ rotateClientAppSecret | ❌  | ✅ Productivo | Rota client_secret (CONFIDENTIAL) |
| `apps/{clientAppId}/roles`         | GET    | ✅      | ✅ listAppRoles          | ❌  | ✅ Productivo | Lista roles de app                |
| `apps/{clientAppId}/roles`         | POST   | ✅      | ✅ createAppRole         | ❌  | ✅ Productivo | Crea rol en app                   |

**Resumen:** 7 endpoints. **7 productivos ✅**

---

### 5. Memberships (ADMIN_TENANT: Asignación de roles)

| Endpoint                     | Método | OpenAPI | Frontend                                        | MSW | Estado        | Notas                                   |
| ---------------------------- | ------ | ------- | ----------------------------------------------- | --- | ------------- | --------------------------------------- |
| `memberships`                | GET    | ✅      | ✅ listMembershipsByApp / listMembershipsByUser | ❌  | ✅ Productivo | Filtra por `client_app_id` o `user_id`  |
| `memberships`                | POST   | ✅      | ✅ createMembership                             | ❌  | ✅ Productivo | Crea membership (usuario + app + roles) |
| `memberships/{membershipId}` | DELETE | ✅      | ✅ revokeMembership                             | ❌  | ✅ Productivo | Revoca acceso                           |

**Resumen:** 3 endpoints. **3 productivos ✅**

---

### 6. Billing (Público + autenticado: Suscripciones y facturas)

| Endpoint                                              | Método | OpenAPI | Frontend                    | MSW | Estado              | Notas                                                 |
| ----------------------------------------------------- | ------ | ------- | --------------------------- | --- | ------------------- | ----------------------------------------------------- |
| `billing/catalog`                                     | GET    | ✅      | ✅ getBillingCatalog        | ❌  | ✅ Productivo       | Público: lista planes disponibles                     |
| `billing/catalog/{planCode}`                          | GET    | ✅      | ✅ getBillingCatalogPlan    | ❌  | ✅ Productivo       | Público: detalle de plan                              |
| `billing/contracts`                                   | POST   | ✅      | ✅ createBillingContract    | ❌  | ✅ Productivo       | Público: inicia contrato (wizard de suscripción)      |
| `billing/contracts/{contractId}`                      | GET    | ✅      | ✅ getBillingContract       | ❌  | ✅ Productivo       | Público: estado del contrato                          |
| `billing/contracts/{contractId}/verify-email`         | POST   | ✅      | ✅ verifyContractEmail      | ❌  | ✅ Productivo       | Público: valida código 6 dígitos                      |
| `billing/contracts/{contractId}/mock-approve-payment` | POST   | ✅      | ✅ mockApprovePayment       | ❌  | ✅ Productivo (dev) | DEV ONLY: aprueba pago mock                           |
| `billing/contracts/{contractId}/activate`             | POST   | ✅      | ✅ activateBillingContract  | ❌  | ✅ Productivo       | Público: activa contrato (crea usuario + suscripción) |
| `billing/contracts/{contractId}/resume`               | GET    | ✅      | ✅ resumeContractOnboarding | ❌  | ✅ Productivo       | Público: restaura estado del wizard                   |
| `billing/subscription`                                | GET    | ✅      | ✅ getActiveSubscription    | ❌  | ✅ Productivo       | Autenticado: suscripción activa del tenant            |
| `billing/subscription/cancel`                         | POST   | ✅      | ✅ cancelSubscription       | ❌  | ✅ Productivo       | Autenticado: agenda cancelación                       |
| `billing/invoices`                                    | GET    | ✅      | ✅ listInvoices             | ❌  | ✅ Productivo       | Autenticado: facturas del tenant                      |
| `billing/catalog`                                     | POST   | ✅      | ✅ createBillingPlan        | ❌  | ✅ Productivo       | ADMIN solo: crea plan                                 |

**Resumen:** 12 endpoints. **12 productivos ✅**

---

### 7. Admin & Platform (ADMIN + público)

| Endpoint                                        | Método | OpenAPI | Frontend                     | MSW    | Estado        | Notas                                    |
| ----------------------------------------------- | ------ | ------- | ---------------------------- | ------ | ------------- | ---------------------------------------- |
| `admin/platform/dashboard`                      | GET    | ✅      | ✅ getPlatformDashboard      | ❌     | ✅ Productivo | ADMIN: dashboard consolidado             |
| `platform/stats`                                | GET    | ✅      | ✅ getPlatformStats          | ❌     | ✅ Productivo | ADMIN: estadísticas agregadas            |
| `service/info`                                  | GET    | ✅      | ✅ getServiceInfo            | ❌     | ✅ Productivo | Público: info del servicio               |
| `platform/pending-features/{featureId}`         | GET    | ❌      | ✅ getPendingFeatureSnapshot | ⚠️ MSW | ❌ Temporal   | Temporal para placeholders del dashboard |
| `platform/pending-features/{featureId}/actions` | POST   | ❌      | ✅ runPendingFeatureAction   | ⚠️ MSW | ❌ Temporal   | Temporal para acciones de placeholders   |

**Resumen:** 5 endpoints. 3 productivos ✅ | 0 mockeados ⚠️ | 2 temporales ❌

---

### 8. Auth (Públicos: OAuth2/PKCE)

| Endpoint                 | Método | OpenAPI | Frontend                        | MSW | Estado        | Notas                                 |
| ------------------------ | ------ | ------- | ------------------------------- | --- | ------------- | ------------------------------------- |
| `oauth2/authorize`       | GET    | ✅      | ✅ authorize                    | ❌  | ✅ Productivo | Inicia flujo: devuelve code_challenge |
| `account/login`          | POST   | ✅      | ✅ login                        | ❌  | ✅ Productivo | Autentica credenciales                |
| `oauth2/token`           | POST   | ✅      | ✅ exchangeToken / refreshToken | ❌  | ✅ Productivo | Canje code → tokens O refresh         |
| `oauth2/token` (refresh) | POST   | ✅      | ✅ refreshToken                 | ❌  | ✅ Productivo | Renovación de access_token            |

**Resumen:** 4 endpoints. **4 productivos ✅**

---

## Pendientes accionables

### 🟠 Por plataforma (no bloquean, pero necesitan decisión de product)

**Dashboard placeholders:** 2 handlers temporales en MSW

- GET `/platform/pending-features/{featureId}`
- POST `/platform/pending-features/{featureId}/actions`
- **Estado:** No en OpenAPI, temporal para vistas placeholder de `/dashboard/feature/:featureId`
- **Acción:** Decidir si mantener placeholders o implementar módulos reales
- **Dueño:** Product / Tech Lead

---

## Próximas fases recomendadas

1. **Consolidar placeholders de dashboard:** decidir si reemplazar `/dashboard/feature/:featureId` por módulos reales o mantener MSW temporal.
2. **Ampliar cobertura de tests UI:** agregar pruebas de integración para `ConnectionsPanel` y `TenantUsersPage` con flujos de éxito y error.
3. **Sincronizar cron de revisión documental:** mantener esta matriz alineada con cada actualización de `docs/api-docs.json`.

---

## Mantenimiento de esta matriz

- **Cuándo actualizar:** Cada vez que se publica un endpoint en OpenAPI o se completa un wire-up en UI
- **Etiquetas oficiales:**
  - ✅ Productivo: OpenAPI + UI implementada + sin MSW
  - ⚠️ Mockeado: OpenAPI + UI con MSW + pendiente migración
  - ❌ No existe: Sin OpenAPI, temporal/mock indefinido
  - (en blanco) = N/A
- **Validación:** Cross-check con `docs/api-docs.json` cada mes

---

**Última revisión:** 2026-04-03 por Copilot (Fase A-E completadas para F-042/T-033/T-110)  
**Próxima revisión estimada:** Al siguiente delta de `docs/api-docs.json`
