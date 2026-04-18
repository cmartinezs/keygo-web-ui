# UI-005 — Endpoint para reportar acceso denegado como posible error

**Fecha:** 2026-04-14  
**Iniciado por:** UI  
**Estado:** 🔴 Abierto  
**Contexto / Plan:** Estados `403 FORBIDDEN` en pantallas protegidas por rol/recurso, comenzando por `/dashboard/tenants`

---

## Apertura _(→ UI)_

### Descripción

La UI distingue `403 FORBIDDEN` y muestra un estado explícito en pantalla. Sin embargo,
no existe un endpoint backend para que el usuario pueda indicar que cree que ese rechazo
es un error y enviar el contexto técnico y funcional necesario para investigación.

La UI ya puede reunir:

- comentario del usuario, `trace_id`, `code`, `origin`, `detail`, `exception`, `client_message`
- ruta actual, recurso afectado, contexto funcional del bloque
- `sub`, correo, username, rol activo, roles detectados y tenant gestionado

### Expectativa del receptor

El backend debe exponer `POST /api/v1/platform/support/access-incidents` (autenticado con
`BearerAuth`) para recibir el reporte.

**Request propuesto:**
```json
{
  "incident_type": "ACCESS_DENIED",
  "feature_key": "dashboard_tenants",
  "route_path": "/dashboard/tenants",
  "current_url": "http://localhost:5173/dashboard/tenants",
  "resource_path": "/api/v1/tenants",
  "resource_label": "tenants asociados",
  "user_comment": "Soy administrador de cuenta y debería ver mis tenants asociados.",
  "http_status": 403,
  "error_code": "INSUFFICIENT_PERMISSIONS",
  "client_message": "You don't have permission to perform this action.",
  "error_origin": "BUSINESS_RULE",
  "trace_id": "0fa43e27-1c68-435d-a75f-c75a72660a02",
  "exception": "AuthorizationDeniedException",
  "detail": "Access Denied",
  "actor_sub": "8b231536-870d-4e95-9d37-137b8f495de3",
  "actor_email": "account.admin@keygo.dev",
  "actor_username": "account.admin@keygo.dev",
  "active_role": "keygo_account_admin",
  "detected_roles": ["keygo_account_admin", "keygo_user"],
  "tenant_claim": "keygo",
  "managed_tenant_slug": null,
  "ui_trace_id": "1f6d0b66-26e8-4d7f-8d80-cf6f30d8e4d7",
  "resource_context": {
    "search_query": "",
    "filter_status": "ALL",
    "page": 0,
    "managed_tenant_slug": null
  }
}
```

**Response propuesta:**
```json
{
  "code": "ACCESS_INCIDENT_REPORTED",
  "data": {
    "incident_id": "incident-001",
    "received_at": "2026-04-14T15:40:00Z",
    "status": "RECEIVED"
  }
}
```

La UI ya tiene preparados: estado visual `AccessDeniedState`, acción "Reportar posible error",
wrapper `createAccessIncidentReport()` y mock MSW temporal. Cuando backend publique el contrato
real, la UI solo migra el wrapper y elimina el mock.

---

## Respuesta _(→ Backend)_

_Pendiente._

**Referencia:** _Pendiente._
