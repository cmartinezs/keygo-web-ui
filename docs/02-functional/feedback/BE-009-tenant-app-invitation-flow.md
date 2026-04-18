# BE-009 — Flujo de invitación de admin a app de tenant

**Fecha:** 2026-04-15  
**Iniciado por:** Backend  
**Estado:** 🟡 Pendiente implementación backend  
**Contexto / Plan:** Invitación controlada por admin para incorporar usuarios a una app de tenant / T-155

> ⚠️ Este documento define el contrato previsto. Los endpoints **aún no existen** en backend.
> UI puede iniciar el diseño de pantallas; la integración real queda bloqueada hasta que T-155
> esté en estado `in-development`.

---

## Apertura _(→ Backend)_

### Descripción

Backend implementará un flujo completo de invitación controlada por admin. Cubre dos variantes:

- **Usuario nuevo:** el email invitado no tiene cuenta en el tenant → crea contraseña al aceptar.
- **Usuario existente:** el email ya tiene cuenta activa → solo confirma para activar la Membership.

Los endpoints de **aceptación y validación son públicos**. Los de **gestión requieren Bearer JWT
con rol `ADMIN_TENANT`**.

**Ruta base:** `/api/v1/tenants/{tenantSlug}/apps/{clientId}`

#### Endpoints admin (requieren Bearer JWT — `ADMIN_TENANT`)

**Invitar usuario:**
```
POST /memberships/invite
```
```json
{
  "email": "invitado@example.com",
  "role_codes": ["USER", "VIEWER"],
  "expires_in_hours": 72
}
```
Response 201: `INVITATION_SENT` con `invitation_id`, `email`, `status`, `expires_at`.

Errores: `409 DUPLICATE_INVITATION` / `409 USER_ALREADY_MEMBER` / `400 INVALID_INPUT`.

**Listar invitaciones:**
```
GET /invitations?status=SENT&page=0&size=20
```
Response 200: `INVITATIONS_RETRIEVED` con lista paginada.

**Reenviar invitación:**
```
POST /invitations/{invitationId}/resend
```
Response 200: `INVITATION_RESENT`.

**Revocar invitación:**
```
DELETE /invitations/{invitationId}
```
Response 200: `INVITATION_REVOKED`.

#### Endpoints públicos (sin autenticación)

**Validar token de invitación:**
```
GET /invitations/{token}/validate
```
Response 200: `INVITATION_VALID` con `invitation_id`, `email`, `tenant_name`, `app_name`,
`roles`, `user_exists`, `expires_at`.

| Campo | UI usa para |
|---|---|
| `user_exists` | Decidir entre "crear contraseña" (`false`) o "confirmar acceso" (`true`) |
| `roles` | Mostrar al invitado qué accesos tendrá |
| `expires_at` | Mostrar countdown o badge de urgencia |

Errores: `404 RESOURCE_NOT_FOUND` / `410 INVITATION_EXPIRED` / `409 INVITATION_ALREADY_ACCEPTED`.

**Aceptar invitación:**
```
POST /invitations/{token}/accept
```
- Usuario nuevo: `{ "password": "Min8Chars!", "first_name": "Juan", "last_name": "Pérez" }`
- Usuario existente: `{}`

Response 200: `INVITATION_ACCEPTED` con `user_id`, `username`, `app_name`, `membership_status`.

### Expectativa del receptor

**Panel admin:**
```
A1: Lista de invitaciones
  - GET /invitations (filtro status)
  - Tabla: email · status · roles · expires_at · acciones
  - Botón "Invitar" → A2
  - Por fila: "Reenviar" → POST /resend | "Revocar" → DELETE /{id}

A2: Formulario de invitación
  - email, multiselect role_codes, expires_in_hours (opcional)
  └─► POST /invite → 201 → A3 | 409 → error inline

A3: Confirmación de envío
  - "Invitación enviada a [email]. Expira el [fecha]."
```

**Flujo del usuario invitado:**
```
(usuario abre link del email: /invitations/{token}/validate)

U1: Loading — validando invitación
  └─► GET /validate
        ├─ 200 user_exists=false → U2a
        ├─ 200 user_exists=true  → U2b
        ├─ 404 / 410             → U4
        └─ 409 already_accepted  → login

U2a: Crear contraseña (usuario nuevo)
  └─► POST /accept → 200 → U3 | 400 → error inline

U2b: Confirmar acceso (usuario existente)
  └─► POST /accept (body vacío) → 200 → U3

U3: Invitación aceptada → CTA "Iniciar sesión"
U4: Inválida o expirada → sugerir contactar al admin
```

Al aceptar, la Membership nace directamente `ACTIVE` (sin aprobación adicional).

---

## Respuesta _(→ UI)_

_Pendiente implementación backend (T-155)._

**Referencia:** [T-155](../../../09-ai/tasks/registered/T-155-tenant-app-invitation-flow.md)
