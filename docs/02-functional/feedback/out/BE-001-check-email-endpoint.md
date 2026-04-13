# BE-001 — Nuevo endpoint para validar existencia de email

**Fecha:** 2026-04-12
**Estado:** 🔴 Abierto
**Plan:** T-130

## Cambio

Se implementó el endpoint `POST /api/v1/platform/account/check-email` para verificar
si un email está registrado como `platform_user`.

## Cuándo usarlo

En el flujo de onboarding de hosted login, **antes del paso de aceptación de ToS**,
para diferenciar entre un usuario nuevo y uno existente sin necesidad de intentar el registro.

## Prerequisito de sesión

El endpoint es **público** (no requiere Bearer token), pero exige que la sesión HTTP
tenga el atributo `platformAuthorizationState`, que se crea al completar previamente
`GET /api/v1/platform/oauth2/authorize`.
Sin ese atributo, responde `401`.

## Contrato

**Request**
```http
POST /api/v1/platform/account/check-email
Content-Type: application/json
Cookie: <sesión de authorize>

{ "email": "user@example.com" }
```

**Responses**

| HTTP | `success` / `failure` code | Significado |
|---|---|---|
| `200` | `PLATFORM_USER_EMAIL_FOUND` | Email registrado → redirigir a login |
| `404` | `PLATFORM_USER_EMAIL_NOT_FOUND` | Email no registrado → continuar registro |
| `401` | `AUTHENTICATION_REQUIRED` | Sin sesión previa de authorize |

El campo `data` es siempre `null`. El resultado se comunica solo por HTTP status y código.

## Impacto en UI

- Antes de mostrar el ToS, llamar a este endpoint con el email ingresado.
- `200` → el usuario ya existe → redirigir al flujo de login.
- `404` → el usuario es nuevo → continuar con el paso de aceptación de ToS.
- `401` → la sesión de authorize no existe o expiró → reiniciar el flujo desde `GET /oauth2/authorize`.

## Confirmación

_Pendiente — UI debe confirmar integración._
