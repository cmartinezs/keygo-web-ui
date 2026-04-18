# BE-007 — Platform account profile endpoints

**Fecha:** 2026-04-14  
**Iniciado por:** Backend  
**Estado:** 🟢 Confirmado  
**Contexto / Plan:** Panel de perfil personal del usuario de plataforma / T-153

---

## Apertura _(→ Backend)_

### Descripción

Se implementaron dos nuevos endpoints de perfil self-service a nivel de plataforma:

```
GET   /api/v1/platform/account/profile   Authorization: Bearer <access_token>
PATCH /api/v1/platform/account/profile   Authorization: Bearer <access_token>
```

**Response DTO `UserProfileData`:**
```json
{
  "id": "uuid",
  "tenant_id": null,
  "username": "user@domain.com",
  "email": "user@domain.com",
  "first_name": "John",
  "last_name": "Doe",
  "status": "ACTIVE",
  "phone_number": "+1234567890",
  "locale": "es-MX",
  "zoneinfo": "America/Mexico_City",
  "profile_picture_url": "https://...",
  "birthdate": null,
  "website": null
}
```

Para platform users, `tenant_id`, `birthdate` y `website` son siempre `null`.

**Request DTO `UpdateUserProfileRequest` (PATCH — todos los campos opcionales):**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone_number": "+9876543210",
  "locale": "en-US",
  "zoneinfo": "America/New_York",
  "profile_picture_url": "https://..."
}
```

Solo se actualizan los campos presentes. No es posible editar `email`, `username`,
`birthdate` ni `website`.

| HTTP | Código |
|---|---|
| `200` | `USER_PROFILE_RETRIEVED` (GET) / `USER_PROFILE_UPDATED` (PATCH) |
| `401` | `AUTHENTICATION_REQUIRED` |
| `404` | `RESOURCE_NOT_FOUND` |

### Expectativa del receptor

- Implementar panel de perfil personal del usuario de plataforma.
- `tenant_id` será siempre `null` en profile (diferente de `/tenants/{slug}/account/profile`).
- Campos editables: `first_name`, `last_name`, `phone_number`, `locale`, `zoneinfo`, `profile_picture_url`.
- CORS ya cubierto por política general del backend.

---

## Respuesta _(→ UI)_

_Pendiente confirmación de integración por parte de UI._

**Referencia:** [T-153](../../../09-ai/tasks/completed/T-153-platform-account-profile.md)
