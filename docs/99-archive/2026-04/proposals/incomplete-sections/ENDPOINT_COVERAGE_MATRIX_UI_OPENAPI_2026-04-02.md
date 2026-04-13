# Matriz de Cobertura: UI vs OpenAPI vs Implementacion Front

- Fecha de corte: 2026-04-02
- Objetivo: validar endpoint por endpoint evitando falsos pendientes por nombres similares o distinto alcance.
- Fuente de contrato: docs/api-docs.json
- Fuente de implementacion: src/api/*.ts y paginas/rutas en src/App.tsx + src/pages/**

## Leyenda

- OpenAPI: Si = path/method existe en docs/api-docs.json.
- API Front: Si = existe funcion consumible en src/api.
- UI: Si = hay pantalla/flujo que lo consume actualmente.
- Estado:
  - OK = contrato + API + UI alineados.
  - GAP_BACKEND = no existe contrato OpenAPI para el caso de uso.
  - GAP_UI = contrato existe, pero falta wiring de pantalla/flujo.
  - TEMP_MSW = implementado de forma temporal con mock (sin contrato oficial).
  - ALCANCE_DISTINTO = existe endpoint parecido, pero no cubre el caso funcional esperado.

## 1) Cuenta propia (self-service)

| Caso funcional | Endpoint esperado | OpenAPI | API Front | UI | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Ver perfil propio | GET /api/v1/tenants/{tenantSlug}/account/profile | Si | Si | Si | OK | src/api/account.ts, src/pages/dashboard/user/UserProfilePage.tsx |
| Editar perfil propio | PATCH /api/v1/tenants/{tenantSlug}/account/profile | Si | Si | Si | OK | src/api/account.ts, src/pages/dashboard/user/UserProfilePage.tsx |
| Cambiar contrasena propia | POST /api/v1/tenants/{tenantSlug}/account/change-password | Si | Si | Si | OK | src/api/account.ts, src/pages/dashboard/account/ChangePasswordForm.tsx |
| Ver sesiones propias | GET /api/v1/tenants/{tenantSlug}/account/sessions | Si | Si | Si | OK | src/api/account.ts, src/pages/dashboard/account/SessionsList.tsx |
| Cerrar sesion propia remota | DELETE /api/v1/tenants/{tenantSlug}/account/sessions/{sessionId} | Si | Si | Si | OK | src/api/account.ts, src/pages/dashboard/account/SessionsList.tsx |
| Ver preferencias de notificacion | GET /api/v1/tenants/{tenantSlug}/account/notification-preferences | Si | Si | Si | OK | src/api/account.ts, src/pages/dashboard/account/NotificationsPreferencesForm.tsx |
| Editar preferencias de notificacion | PATCH /api/v1/tenants/{tenantSlug}/account/notification-preferences | Si | Si | Si | OK | src/api/account.ts, src/pages/dashboard/account/NotificationsPreferencesForm.tsx |
| Ver accesos propios (apps/roles) | GET /api/v1/tenants/{tenantSlug}/account/access | Si | Si | Si | OK | src/api/account.ts, src/pages/dashboard/user/UserProfilePage.tsx |
| Actividad en Mi cuenta (tab Activity) | GET /api/v1/tenants/{tenantSlug}/account/sessions + GET /api/v1/tenants/{tenantSlug}/account/access | Si | Si | Si | OK | src/api/account.ts, src/pages/dashboard/user/UserProfilePage.tsx |
| Olvide mi contrasena | POST /api/v1/tenants/keygo/account/forgot-password | Si | Si | Si | OK | src/api/account.ts, src/pages/login/ForgotPasswordPage.tsx, src/App.tsx |
| Recuperar contrasena por token | POST /api/v1/tenants/keygo/account/recover-password | Si | Si | Si | OK | src/api/account.ts, src/pages/login/RecoverPasswordPage.tsx, src/App.tsx |
| Reset con contrasena temporal | POST /api/v1/tenants/keygo/account/reset-password | Si | Si | Si | OK | src/api/account.ts, src/pages/login/ResetPasswordPage.tsx, src/App.tsx |
| Conexiones externas (listar/vincular/desvincular) | /api/v1/tenants/{tenantSlug}/account/connections* | No | Si | Si | TEMP_MSW | src/api/account.ts, src/mocks/handlers.ts, src/pages/dashboard/account/ConnectionsPanel.tsx |

## 2) Usuarios administrados por tenant (ADMIN / ADMIN_TENANT)

| Caso funcional | Endpoint esperado | OpenAPI | API Front | UI | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Listar usuarios del tenant | GET /api/v1/tenants/{tenantSlug}/users | Si | Si | Si | OK | src/api/users.ts, src/pages/dashboard/tenant/TenantUsersPage.tsx |
| Obtener usuario | GET /api/v1/tenants/{tenantSlug}/users/{userId} | Si | Si | Parcial | OK | src/api/users.ts |
| Crear usuario | POST /api/v1/tenants/{tenantSlug}/users | Si | Si | Si | OK | src/api/users.ts, src/pages/dashboard/tenant/TenantUsersPage.tsx |
| Actualizar usuario | PUT /api/v1/tenants/{tenantSlug}/users/{userId} | Si | Si | Si | OK | src/api/users.ts, src/pages/dashboard/tenant/TenantUsersPage.tsx |
| Resetear contrasena de usuario (admin) | POST /api/v1/tenants/{tenantSlug}/users/{userId}/reset-password | Si | Si | Si | OK | src/api/users.ts, src/pages/dashboard/tenant/TenantUsersPage.tsx |
| Suspender usuario del tenant | PUT /api/v1/tenants/{tenantSlug}/users/{userId}/suspend | No | No | No | GAP_BACKEND | docs/api-docs.json (sin path), docs/FRONTEND_DEVELOPER_GUIDE.md 14.2.4 |
| Activar usuario del tenant | PUT /api/v1/tenants/{tenantSlug}/users/{userId}/activate | No | No | No | GAP_BACKEND | docs/api-docs.json (sin path), docs/FRONTEND_DEVELOPER_GUIDE.md 14.2.4 |
| Ver sesiones de usuario (admin) | GET /api/v1/tenants/{tenantSlug}/users/{userId}/sessions | No | No | No | GAP_BACKEND | docs/api-docs.json (sin path), docs/FRONTEND_DEVELOPER_GUIDE.md 14.2.4 |

## 3) Tenants (ADMIN plataforma)

| Caso funcional | Endpoint esperado | OpenAPI | API Front | UI | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Listar tenants | GET /api/v1/tenants | Si | Si | Si | OK | src/api/tenants.ts, src/pages/admin/TenantsPage.tsx |
| Ver tenant | GET /api/v1/tenants/{slug} | Si | Si | Si | OK | src/api/tenants.ts, src/pages/admin/TenantDetailPage.tsx |
| Crear tenant | POST /api/v1/tenants | Si | Si | Si | OK | src/api/tenants.ts, src/pages/admin/TenantCreatePage.tsx |
| Suspender tenant | PUT /api/v1/tenants/{slug}/suspend | Si | Si | Si | OK | src/api/tenants.ts, src/pages/admin/TenantDetailPage.tsx |
| Activar tenant | PUT /api/v1/tenants/{slug}/activate | Si | Si | Si | OK | src/api/tenants.ts, src/pages/admin/TenantDetailPage.tsx |

## 4) Dashboard y plataforma

| Caso funcional | Endpoint esperado | OpenAPI | API Front | UI | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Dashboard admin agregado | GET /api/v1/admin/platform/dashboard | Si | Si | Si | OK | src/api/dashboard.ts, src/pages/admin/DashboardPage.tsx |
| Home dashboard ADMIN_TENANT (usuarios/apps/accesos del dia) | GET /api/v1/tenants/{tenantSlug}/users + GET /api/v1/tenants/{tenantSlug}/apps + GET /api/v1/tenants/{tenantSlug}/account/sessions | Si | Si | Si | OK | src/api/users.ts, src/api/clientApps.ts, src/api/account.ts, src/pages/dashboard/DashboardHomePage.tsx |
| Home dashboard USER_TENANT (sesiones/ultimo acceso/apps con acceso) | GET /api/v1/tenants/{tenantSlug}/account/sessions + GET /api/v1/tenants/{tenantSlug}/account/access | Si | Si | Si | OK | src/api/account.ts, src/pages/dashboard/DashboardHomePage.tsx |
| Estadisticas plataforma | GET /api/v1/platform/stats | Si | Si | Si | OK | src/api/serviceInfo.ts, src/pages/admin/PlatformStatsPage.tsx, src/App.tsx |
| Auditoria global plataforma | GET /api/v1/platform/audit | No | No | No | GAP_BACKEND | docs/BACKLOG.md, docs/api-docs.json (sin path) |

## 5) Registro y autenticacion

| Caso funcional | Endpoint esperado | OpenAPI | API Front | UI | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Iniciar authorize PKCE | GET /api/v1/tenants/{tenantSlug}/oauth2/authorize | Si | Si | Si | OK | src/api/auth.ts, src/pages/login/LoginPage.tsx |
| Login credenciales | POST /api/v1/tenants/{tenantSlug}/account/login | Si | Si | Si | OK | src/api/auth.ts, src/pages/login/LoginPage.tsx |
| Exchange token | POST /api/v1/tenants/{tenantSlug}/oauth2/token | Si | Si | Si | OK | src/api/auth.ts, src/pages/login/LoginPage.tsx |
| Revoke token | POST /api/v1/tenants/{tenantSlug}/oauth2/revoke | Si | Si | Si | OK | src/api/auth.ts, src/pages/login/LogoutPage.tsx |
| Registro usuario publico | POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/register | Si | Si | Si | OK | src/api/users.ts, src/pages/register/UserRegisterPage.tsx |
| Verificar email registro | POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/verify-email | Si | Si | Si | OK | src/api/auth.ts/src/api/users.ts + paginas register |
| Reenviar verificacion registro | POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/resend-verification | Si | Si | Si | OK | src/api/auth.ts/src/api/users.ts + paginas register |

## 6) Billing/Contratacion

| Caso funcional | Endpoint esperado | OpenAPI | API Front | UI | Estado | Evidencia |
|---|---|---|---|---|---|---|
| Catalogo publico | GET /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/catalog | Si | Si | Si | OK | src/api/billing.ts, src/pages/register/NewContractPage.tsx |
| Detalle plan publico | GET /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/catalog/{planCode} | Si | Si | Si | OK | src/api/billing.ts |
| Crear contrato | POST /api/v1/billing/contracts | Si | Si | Si | OK | src/api/billing.ts, src/pages/register/NewContractPage.tsx |
| Verificar email contrato | POST /api/v1/billing/contracts/{contractId}/verify-email | Si | Si | Si | OK | src/api/billing.ts, src/pages/register/NewContractPage.tsx |
| Reenviar verificacion contrato | POST /api/v1/billing/contracts/{contractId}/resend-verification | Si | Si | Si | OK | src/api/billing.ts, src/pages/register/NewContractPage.tsx |
| Aprobar pago mock dev | POST /api/v1/billing/contracts/{contractId}/mock-approve-payment | Si | Si | Si (solo DEV) | OK | src/api/billing.ts, src/pages/register/steps/PaymentStep.tsx |
| Activar contrato | POST /api/v1/billing/contracts/{contractId}/activate | Si | Si | Si | OK | src/api/billing.ts, src/pages/register/NewContractPage.tsx |
| Estado contrato | GET /api/v1/billing/contracts/{contractId} | Si | Si | Si | OK | src/api/billing.ts, src/pages/register/ResumeContractPage.tsx |
| Reanudar onboarding contrato | GET /api/v1/billing/contracts/{contractId}/resume | Si | Si | Si | OK | src/api/billing.ts, src/pages/register/ResumeContractPage.tsx |
| Suscripcion activa tenant | GET /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/subscription | Si | Si | Si | OK | src/api/billing.ts, src/pages/dashboard/account/AccountSettingsPage.tsx |
| Facturas tenant | GET /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/invoices | Si | Si | Si | OK | src/api/billing.ts, src/pages/dashboard/account/AccountSettingsPage.tsx |
| Cancelar renovacion | POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/subscription/cancel | Si | Si | Si | OK | src/api/billing.ts, src/pages/dashboard/account/AccountSettingsPage.tsx |
| Pago real PSP produccion | POST /billing/contracts/{id}/pay (definir) | No | No | No | GAP_BACKEND | docs/BACKLOG.md, src/pages/register/steps/PaymentStep.tsx |

## 7) Mapa de confusiones comunes (scope)

| Endpoint existente | Cubre este caso | No cubre este caso |
|---|---|---|
| POST /api/v1/tenants/{tenantSlug}/users/{userId}/reset-password | Reset administrativo por tenant-admin | Forgot/reset self-service de usuario final |
| GET /api/v1/tenants/{tenantSlug}/account/sessions | Sesiones del usuario autenticado | Sesiones de cualquier userId gestionadas por admin |
| PUT /api/v1/tenants/{slug}/suspend y /activate | Suspender/activar tenant completo | Suspender/activar un usuario puntual |

## 8) Checklist de cierre sugerido

1. Resolver primero GAP_BACKEND con backend/contrato (OpenAPI).
2. Luego resolver GAP_UI (wiring de pantallas y acciones).
3. Eliminar TEMP_MSW solo cuando exista contrato oficial y pruebas de regresion.
4. Mantener esta matriz como documento vivo cada vez que cambie docs/api-docs.json.
