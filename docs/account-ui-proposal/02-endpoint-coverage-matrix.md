# Matriz de Cobertura — Endpoint vs UI de Cuenta

Este documento prioriza por viabilidad inmediata y distingue claramente:

- **Disponible ahora**
- **Parcial**
- **Pendiente backend**

## 1) Mi cuenta

| Sección UI | Endpoint(s) | Estado | Observaciones |
|---|---|---|---|
| Resumen | `GET /api/v1/tenants/{tenantSlug}/account/profile` | Disponible ahora | Datos de perfil completo del usuario autenticado. |
| Resumen | `GET /api/v1/tenants/{tenantSlug}/userinfo` | Disponible ahora | Claims OIDC para identidad/roles/scope. |
| Perfil editable | `PATCH /api/v1/tenants/{tenantSlug}/account/profile` | Disponible ahora | PATCH semántico, solo campos no-null. |
| Accesos | `GET /api/v1/tenants/{tenantSlug}/memberships?user_id={uuid}` | Parcial | Útil para ADMIN/ADMIN_TENANT. Para USER_TENANT falta endpoint self-service. |
| Actividad | (sin endpoint de cuenta personal confirmado) | Pendiente backend | Puede evaluarse reutilizar auditoría si existe endpoint apto para self-service. |

## 2) Configuración de cuenta

| Sección UI | Endpoint(s) | Estado | Observaciones |
|---|---|---|---|
| Seguridad > Cambiar contraseña | `POST /api/v1/tenants/{tenantSlug}/account/change-password` | Pendiente backend | Marcado como pendiente en guía frontend. |
| Seguridad > Sesiones activas | `GET /api/v1/tenants/{tenantSlug}/account/sessions` | Pendiente backend | Marcado como pendiente en guía frontend. |
| Seguridad > Cerrar sesión remota | `DELETE /api/v1/tenants/{tenantSlug}/account/sessions/{id}` | Pendiente backend | Marcado como pendiente en guía frontend. |
| Facturación > Suscripción | `GET /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/subscription` | Disponible ahora | Requiere rol con permisos de billing. |
| Facturación > Facturas | `GET /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/invoices` | Disponible ahora | Lista histórica de facturas. |
| Facturación > Cancelar renovación | `POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/subscription/cancel` | Disponible ahora | Cancela al fin de período. |
| Notificaciones | (sin endpoint dedicado) | Pendiente backend | Requiere contrato de preferencias por canal/tipo. |
| Conexiones | (sin endpoint dedicado) | Pendiente backend | Requiere definición de proveedores y linking. |

## 3) Rutas de referencia de contrato

## 3.1 Confirmadas en OpenAPI

- `GET /api/v1/tenants/{tenantSlug}/account/profile`
- `PATCH /api/v1/tenants/{tenantSlug}/account/profile`
- `GET /api/v1/tenants/{tenantSlug}/userinfo`
- `GET /api/v1/tenants/{tenantSlug}/memberships`
- `GET /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/subscription`
- `GET /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/invoices`
- `POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/subscription/cancel`

## 3.2 Pendientes reportadas en guía frontend

- `POST /api/v1/tenants/{tenantSlug}/account/change-password`
- `GET /api/v1/tenants/{tenantSlug}/account/sessions`
- `DELETE /api/v1/tenants/{tenantSlug}/account/sessions/{id}`

## 4) Prioridad de implementación frontend sugerida

1. **Fase 1 (sin esperar backend):**
   - Mi cuenta: Resumen + Perfil editable.
   - Configuración: Facturación (rol-gated).

2. **Fase 2 (parcial):**
   - Mi cuenta: Accesos (admin-first).

3. **Fase 3 (backend requerido):**
   - Seguridad completa (cambio contraseña + sesiones).
   - Notificaciones.
   - Conexiones.
