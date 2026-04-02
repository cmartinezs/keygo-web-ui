# RFC: Account and Settings API Contract for KeyGo UI

- Status: Draft
- Authors: Frontend (KeyGo UI)
- Target: Backend (KeyGo Server)
- Last update: 2026-04-02
- Related docs:
  - docs/api-docs.json
  - docs/FRONTEND_DEVELOPER_GUIDE.md
  - docs/account-ui-proposal/01-information-architecture.md
  - docs/account-ui-proposal/02-endpoint-coverage-matrix.md

## 1. Abstract

This RFC defines the API contract required to fully support the new Account UX split:

1. My account (identity + profile)
2. Account settings (security + preferences + billing context)

The RFC includes:

- Request and response schemas
- Field validations
- Expected user-facing messages
- HTTP status codes
- KeyGo business codes

The contract is divided into:

1. Existing endpoints (already available)
2. Proposed endpoints (required to complete UX)

## 2. Goals and non-goals

## 2.1 Goals

1. Make the Account UX implementable without ambiguous backend behavior.
2. Standardize error semantics for frontend rendering.
3. Preserve compatibility with current BaseResponse envelope.
4. Define explicit self-service endpoints (avoid admin-shaped APIs for end users).

## 2.2 Non-goals

1. Redesign OAuth2 core endpoints.
2. Redefine tenant or membership domain models.
3. Introduce transport-level changes outside REST/JSON.

## 3. Global API contract rules

## 3.1 Envelope

All responses MUST use current KeyGo envelope:

```json
{
  "date": "2026-04-02T14:25:01Z",
  "success": { "code": "SOME_SUCCESS_CODE", "message": "optional" },
  "failure": null,
  "data": {}
}
```

Error responses:

```json
{
  "date": "2026-04-02T14:25:01Z",
  "success": null,
  "failure": { "code": "SOME_ERROR_CODE", "message": "Request failed" },
  "data": {
    "code": "SOME_ERROR_CODE",
    "origin": "CLIENT_REQUEST",
    "clientRequestCause": "USER_INPUT",
    "clientMessage": "Mensaje para mostrar en UI",
    "fieldErrors": [
      { "field": "new_password", "message": "Debe tener al menos 12 caracteres" }
    ]
  }
}
```

## 3.2 Auth and authorization

1. All `/account/*` endpoints require `Authorization: Bearer <access_token>`.
2. Account endpoints are self-service by default (subject in token determines owner resource).
3. Endpoints MUST NOT require `X-KEYGO-ADMIN` for self-service account flows.

## 3.3 Validation error shape

For invalid inputs, backend SHOULD return:

- HTTP `400`
- `failure.code = INVALID_INPUT`
- `data.origin = CLIENT_REQUEST`
- `data.clientRequestCause = USER_INPUT`
- `data.fieldErrors[]` populated

## 3.4 Message policy

`data.clientMessage` MUST be safe to display directly in UI.

- In prod/staging: user-friendly text.
- In dev/local: may include technical details (current behavior).

## 3.5 Idempotency

1. `DELETE /account/sessions/{sessionId}` SHOULD be idempotent.
2. Unknown or already-closed session SHOULD return `200` with success code, not `404`, to simplify UX and avoid race issues.

## 4. Existing endpoints (normative)

## 4.1 GET /api/v1/tenants/{tenantSlug}/account/profile

Purpose:

- Fetch authenticated user profile (extended claims and editable attributes).

Request:

- Path params:
  - `tenantSlug` (string, required)
- Headers:
  - `Authorization: Bearer ...` (required)

Success:

- HTTP `200`
- KeyGo code: `USER_PROFILE_RETRIEVED`

Response data (current model):

```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "username": "string",
  "email": "string",
  "first_name": "string|null",
  "last_name": "string|null",
  "status": "ACTIVE|SUSPENDED|PENDING",
  "phone_number": "string|null",
  "locale": "string|null",
  "zoneinfo": "string|null",
  "profile_picture_url": "string|null",
  "birthdate": "YYYY-MM-DD|null",
  "website": "string|null"
}
```

Errors:

1. HTTP `401`, code `AUTHENTICATION_REQUIRED`
2. HTTP `404`, code `RESOURCE_NOT_FOUND`
3. HTTP `500`, code `OPERATION_FAILED`
4. HTTP `503`, code `EXTERNAL_SERVICE_ERROR`

## 4.2 PATCH /api/v1/tenants/{tenantSlug}/account/profile

Purpose:

- Partial update of own profile.

Request body (current model):

```json
{
  "first_name": "string|optional",
  "last_name": "string|optional",
  "phone_number": "string|optional",
  "locale": "string|optional",
  "zoneinfo": "string|optional",
  "profile_picture_url": "string|optional",
  "birthdate": "YYYY-MM-DD|optional",
  "website": "string|optional"
}
```

Success:

- HTTP `200`
- KeyGo code: `USER_PROFILE_UPDATED`

Validations (recommended strictness):

1. `profile_picture_url`: valid absolute URL.
2. `website`: valid absolute URL.
3. `birthdate`: valid date, not future date.
4. `locale`: BCP-47 normalized (example `es-CL`, `en-US`).
5. `first_name/last_name`: trimmed, max length 120.
6. `phone_number`: E.164 compatible max length 20.

Validation error:

- HTTP `400`
- KeyGo code: `INVALID_INPUT`
- `fieldErrors` included

## 4.3 GET /api/v1/tenants/{tenantSlug}/userinfo

Purpose:

- OIDC user claims snapshot for active session.

Success:

- HTTP `200`
- KeyGo code: `USER_INFO_RETRIEVED`

Primary UI use:

- Roles and identity context for account header and role-aware tabs.

## 4.4 Billing endpoints used under Account Settings

## 4.4.1 GET /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/subscription

- HTTP `200`
- KeyGo code: `APP_SUBSCRIPTION_RETRIEVED`

## 4.4.2 GET /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/invoices

- HTTP `200`
- KeyGo code: backend should keep explicit success code in envelope for consistency.
- Recommended code: `APP_INVOICE_LIST_RETRIEVED`

## 4.4.3 POST /api/v1/tenants/{tenantSlug}/apps/{clientId}/billing/subscription/cancel

- HTTP `200`
- KeyGo code: `APP_SUBSCRIPTION_CANCELLED`

## 5. Proposed endpoints (required)

## 5.1 Security: change password

Endpoint:

- `POST /api/v1/tenants/{tenantSlug}/account/change-password`

Purpose:

- Allow authenticated user to rotate own password.

Request body:

```json
{
  "current_password": "string",
  "new_password": "string"
}
```

Validations:

1. `current_password`: required, non-empty.
2. `new_password`: required.
3. Password policy minimum:
   - length >= 12
   - at least one lowercase
   - at least one uppercase
   - at least one digit
   - at least one special char
4. `new_password` MUST differ from `current_password`.
5. Optional: reject if in previous password history window.

Success:

- HTTP `200`
- KeyGo code: `ACCOUNT_PASSWORD_CHANGED`
- Message example: `Contrasena actualizada correctamente.`

Success response example:

```json
{
  "date": "2026-04-02T14:25:01Z",
  "success": { "code": "ACCOUNT_PASSWORD_CHANGED", "message": "Contrasena actualizada correctamente." },
  "data": { "changed": true }
}
```

Errors:

1. HTTP `400`
   - code: `INVALID_INPUT`
   - `fieldErrors` for policy failures
2. HTTP `403`
   - code: `BUSINESS_RULE_VIOLATION`
   - use when current password is incorrect
   - `clientMessage`: `La contrasena actual no es valida.`
3. HTTP `401`
   - code: `AUTHENTICATION_REQUIRED`
4. HTTP `429` (optional but recommended)
   - code: `RATE_LIMIT_EXCEEDED`
   - for brute-force protection
5. HTTP `500`
   - code: `OPERATION_FAILED`
6. HTTP `503`
   - code: `EXTERNAL_SERVICE_ERROR`

## 5.2 Security: list current sessions

Endpoint:

- `GET /api/v1/tenants/{tenantSlug}/account/sessions`

Purpose:

- Show active sessions/devices for self-managed security.

Request:

- Path: `tenantSlug`
- Header: `Authorization`

Success:

- HTTP `200`
- KeyGo code: `ACCOUNT_SESSIONS_RETRIEVED`

Response data schema:

```json
[
  {
    "id": "uuid",
    "device_label": "Chrome on Linux",
    "device_type": "desktop|mobile|tablet|unknown",
    "browser": "Chrome 123",
    "os": "Linux",
    "ip_address": "200.10.1.55",
    "location": "Santiago, CL",
    "created_at": "2026-04-01T10:00:00Z",
    "last_seen_at": "2026-04-02T14:00:00Z",
    "expires_at": "2026-04-09T10:00:00Z",
    "is_current": true
  }
]
```

Validation/business rules:

1. Only sessions belonging to authenticated subject.
2. Ordered by `last_seen_at desc`.
3. `is_current` MUST be exactly one active session entry.

Errors:

1. HTTP `401`, code `AUTHENTICATION_REQUIRED`
2. HTTP `500`, code `OPERATION_FAILED`
3. HTTP `503`, code `EXTERNAL_SERVICE_ERROR`

## 5.3 Security: remote logout session

Endpoint:

- `DELETE /api/v1/tenants/{tenantSlug}/account/sessions/{sessionId}`

Purpose:

- Revoke a specific session/device.

Request:

- Path params:
  - `tenantSlug` (string)
  - `sessionId` (uuid)

Success:

- HTTP `200`
- KeyGo code: `ACCOUNT_SESSION_REVOKED`
- Response:

```json
{
  "revoked": true,
  "session_id": "uuid"
}
```

Idempotency requirement:

- If session is already revoked or not found for current user, return HTTP `200` with code `ACCOUNT_SESSION_ALREADY_CLOSED`.

Errors:

1. HTTP `401`, code `AUTHENTICATION_REQUIRED`
2. HTTP `403`, code `INSUFFICIENT_PERMISSIONS` (if ownership check fails with strict semantics)
3. HTTP `500`, code `OPERATION_FAILED`
4. HTTP `503`, code `EXTERNAL_SERVICE_ERROR`

## 5.4 Account preferences (notifications)

## 5.4.1 GET /api/v1/tenants/{tenantSlug}/account/notification-preferences

Success:

- HTTP `200`
- KeyGo code: `ACCOUNT_NOTIFICATION_PREFERENCES_RETRIEVED`

Response:

```json
{
  "security_alerts_email": true,
  "security_alerts_in_app": true,
  "billing_alerts_email": true,
  "product_updates_email": false,
  "weekly_digest": false
}
```

## 5.4.2 PATCH /api/v1/tenants/{tenantSlug}/account/notification-preferences

Request:

```json
{
  "security_alerts_email": true,
  "security_alerts_in_app": true,
  "billing_alerts_email": true,
  "product_updates_email": false,
  "weekly_digest": false
}
```

Success:

- HTTP `200`
- KeyGo code: `ACCOUNT_NOTIFICATION_PREFERENCES_UPDATED`

Validation:

1. All fields boolean.
2. Reject unknown fields (`400 INVALID_INPUT`).

## 5.5 Account connections (optional, roadmap)

## 5.5.1 GET /api/v1/tenants/{tenantSlug}/account/connections

- HTTP `200`
- KeyGo code: `ACCOUNT_CONNECTIONS_RETRIEVED`

## 5.5.2 POST /api/v1/tenants/{tenantSlug}/account/connections/{provider}/link

- HTTP `200`
- KeyGo code: `ACCOUNT_CONNECTION_LINKED`

## 5.5.3 DELETE /api/v1/tenants/{tenantSlug}/account/connections/{connectionId}

- HTTP `200`
- KeyGo code: `ACCOUNT_CONNECTION_UNLINKED`

Minimal connection object:

```json
{
  "id": "uuid",
  "provider": "google|microsoft|github",
  "provider_account": "user@example.com",
  "linked_at": "ISO-8601",
  "is_primary": false
}
```

## 5.6 Self-service access view

Endpoint:

- `GET /api/v1/tenants/{tenantSlug}/account/access`

Purpose:

- Return current user's app access and roles without requiring admin-style query params.

Success:

- HTTP `200`
- KeyGo code: `ACCOUNT_ACCESS_RETRIEVED`

Response:

```json
[
  {
    "client_app_id": "uuid",
    "client_app_name": "KeyGo UI",
    "membership_id": "uuid",
    "status": "ACTIVE",
    "roles": ["ADMIN_TENANT"]
  }
]
```

Errors:

1. HTTP `401`, code `AUTHENTICATION_REQUIRED`
2. HTTP `500`, code `OPERATION_FAILED`
3. HTTP `503`, code `EXTERNAL_SERVICE_ERROR`

## 6. Error catalog and HTTP mapping

## 6.1 Reusable KeyGo error codes

1. `AUTHENTICATION_REQUIRED`
2. `INSUFFICIENT_PERMISSIONS`
3. `INVALID_INPUT`
4. `BUSINESS_RULE_VIOLATION`
5. `RESOURCE_NOT_FOUND`
6. `OPERATION_FAILED`
7. `EXTERNAL_SERVICE_ERROR`
8. `RATE_LIMIT_EXCEEDED` (recommended)

## 6.2 HTTP mapping standard

1. `200` success
2. `400` invalid request/field validation
3. `401` missing/invalid auth
4. `403` authenticated but blocked by policy/business rule
5. `404` missing resource (only when safe and intentional)
6. `409` conflict (duplicate/invalid state transitions)
7. `422` semantic invalid state (optional, if domain already uses it)
8. `429` abuse/rate limit
9. `500` internal failure
10. `503` downstream dependency unavailable

## 6.3 Origin mapping (`data.origin`)

1. `CLIENT_REQUEST`
   - `USER_INPUT` for form errors
   - `CLIENT_TECHNICAL` for malformed integration requests
2. `BUSINESS_RULE`
   - policy/state violations
3. `SERVER_PROCESSING`
   - internal processing errors

## 7. Frontend-visible messages (recommended)

These messages are suggested values for `data.clientMessage` in production:

1. `Contrasena actualizada correctamente.`
2. `No fue posible actualizar la contrasena. Revisa los requisitos.`
3. `La contrasena actual no es valida.`
4. `Sesiones recuperadas correctamente.`
5. `La sesion seleccionada fue cerrada.`
6. `No fue posible cerrar la sesion seleccionada.`
7. `Preferencias de notificacion actualizadas.`
8. `No fue posible guardar tus preferencias.`

## 8. OpenAPI snippets (proposed)

## 8.1 Change password

```yaml
/api/v1/tenants/{tenantSlug}/account/change-password:
  post:
    tags: [Account Settings]
    summary: Change own password
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [current_password, new_password]
            properties:
              current_password:
                type: string
              new_password:
                type: string
                minLength: 12
    responses:
      '200':
        description: Password changed (ACCOUNT_PASSWORD_CHANGED)
      '400':
        description: Validation error (INVALID_INPUT)
      '401':
        description: Authentication required (AUTHENTICATION_REQUIRED)
      '403':
        description: Current password invalid (BUSINESS_RULE_VIOLATION)
      '429':
        description: Rate limit exceeded (RATE_LIMIT_EXCEEDED)
      '500':
        description: Operation failed (OPERATION_FAILED)
      '503':
        description: External service error (EXTERNAL_SERVICE_ERROR)
```

## 8.2 Account sessions

```yaml
/api/v1/tenants/{tenantSlug}/account/sessions:
  get:
    tags: [Account Settings]
    summary: List own active sessions
    security:
      - BearerAuth: []
    responses:
      '200':
        description: Sessions retrieved (ACCOUNT_SESSIONS_RETRIEVED)
      '401':
        description: Authentication required (AUTHENTICATION_REQUIRED)
      '500':
        description: Operation failed (OPERATION_FAILED)
      '503':
        description: External service error (EXTERNAL_SERVICE_ERROR)

/api/v1/tenants/{tenantSlug}/account/sessions/{sessionId}:
  delete:
    tags: [Account Settings]
    summary: Revoke own session
    security:
      - BearerAuth: []
    responses:
      '200':
        description: Session revoked/already closed (ACCOUNT_SESSION_REVOKED | ACCOUNT_SESSION_ALREADY_CLOSED)
      '401':
        description: Authentication required (AUTHENTICATION_REQUIRED)
      '500':
        description: Operation failed (OPERATION_FAILED)
      '503':
        description: External service error (EXTERNAL_SERVICE_ERROR)
```

## 9. Backward compatibility and rollout

1. Existing endpoints remain unchanged.
2. Proposed endpoints are additive.
3. Frontend can release progressively:
   - Phase A: profile + billing tab
   - Phase B: sessions and password
   - Phase C: notifications/connections/access self-service

## 10. Acceptance criteria

This RFC is considered accepted when backend confirms:

1. Final endpoint list and payloads.
2. Validation rules per field.
3. Stable KeyGo success/error codes.
4. HTTP status policy for each operation.
5. OpenAPI publication in `docs/api-docs.json` for all approved endpoints.
