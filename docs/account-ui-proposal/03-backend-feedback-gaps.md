# Feedback a Backend — Brechas para UI de Cuenta

Este documento sintetiza los contratos recomendados para cerrar la propuesta de UI de cuenta.

## 1) Seguridad de cuenta (prioridad Alta)

## 1.1 Cambiar contraseña

Endpoint esperado:

- `POST /api/v1/tenants/{tenantSlug}/account/change-password`

Request mínimo sugerido:

```json
{
  "current_password": "string",
  "new_password": "string"
}
```

Response esperado:

- `200` éxito con código de negocio.
- `400` validación de password policy.
- `401` token inválido/no autenticado.
- `403` contraseña actual incorrecta o política de seguridad.

## 1.2 Sesiones activas de cuenta

Endpoints esperados:

- `GET /api/v1/tenants/{tenantSlug}/account/sessions`
- `DELETE /api/v1/tenants/{tenantSlug}/account/sessions/{sessionId}`

Modelo mínimo sugerido para `GET`:

```json
[
  {
    "id": "uuid",
    "device_label": "Chrome on Linux",
    "ip_address": "string",
    "last_seen_at": "ISO-8601",
    "created_at": "ISO-8601",
    "is_current": true,
    "location": "optional string"
  }
]
```

Consideraciones:

- Incluir `is_current` para evitar auto-invalidación accidental de la sesión activa sin confirmación explícita.
- `DELETE` idealmente idempotente.

---

## 2) Notificaciones de cuenta (prioridad Media)

Endpoint sugerido:

- `GET /api/v1/tenants/{tenantSlug}/account/notification-preferences`
- `PATCH /api/v1/tenants/{tenantSlug}/account/notification-preferences`

Modelo sugerido:

```json
{
  "security_alerts_email": true,
  "security_alerts_in_app": true,
  "product_updates_email": false,
  "billing_alerts_email": true,
  "weekly_digest": false
}
```

Racional:

- La UI de "Configuración" requiere preferencia explícita por canal y tipo.
- Evita hardcodear defaults en frontend sin persistencia.

---

## 3) Conexiones de cuenta (prioridad Media/Baja)

Si el roadmap contempla cuentas vinculadas (Google, Microsoft, GitHub, etc.), sugerir:

- `GET /api/v1/tenants/{tenantSlug}/account/connections`
- `POST /api/v1/tenants/{tenantSlug}/account/connections/{provider}/link`
- `DELETE /api/v1/tenants/{tenantSlug}/account/connections/{connectionId}`

Modelo sugerido:

```json
[
  {
    "id": "uuid",
    "provider": "google",
    "provider_account": "user@dominio.com",
    "linked_at": "ISO-8601",
    "is_primary": false
  }
]
```

---

## 4) Accesos self-service para USER_TENANT (prioridad Media)

Problema actual:

- `memberships?user_id` sirve para escenarios admin, pero no es un contrato explícito de autoconsulta para usuario final.

Endpoint sugerido:

- `GET /api/v1/tenants/{tenantSlug}/account/access`

Modelo mínimo:

```json
[
  {
    "client_app_id": "uuid",
    "client_app_name": "string",
    "roles": ["ROLE_X", "ROLE_Y"],
    "status": "ACTIVE"
  }
]
```

Racional:

- Evita exponer parámetros/semántica de administración para una vista de perfil personal.

---

## 5) Trazabilidad y códigos de error recomendados

Para facilitar UX consistente en frontend, se sugiere estandarizar response codes de negocio:

1. `ACCOUNT_PASSWORD_CHANGED`
2. `ACCOUNT_SESSIONS_RETRIEVED`
3. `ACCOUNT_SESSION_REVOKED`
4. `ACCOUNT_NOTIFICATION_PREFERENCES_UPDATED`
5. `ACCOUNT_CONNECTION_LINKED`
6. `ACCOUNT_CONNECTION_UNLINKED`
7. `ACCOUNT_ACCESS_RETRIEVED`

Y errores típicos:

1. `AUTHENTICATION_REQUIRED`
2. `INSUFFICIENT_PERMISSIONS`
3. `INVALID_INPUT`
4. `BUSINESS_RULE_VIOLATION`
5. `RESOURCE_NOT_FOUND`

---

## 6) Orden de entrega sugerido a backend

1. Seguridad de cuenta (change-password + sessions).
2. Self-service access (`/account/access`).
3. Preferencias de notificaciones.
4. Conexiones de cuenta.

Este orden habilita mayor valor UX en menor tiempo y destraba la navegación "Configuración de cuenta" con impacto real para usuarios finales.
