# BE-001 — Nuevo endpoint para validar existencia de email

**Fecha:** 2026-04-12  
**Iniciado por:** Backend  
**Estado:** 🟢 Confirmado  
**Contexto / Plan:** Flujo de onboarding — paso previo a aceptación de ToS / T-130

---

## Apertura _(→ Backend)_

### Descripción

Se implementó `POST /api/v1/platform/account/check-email` para verificar si un email está
registrado como `platform_user`.

El endpoint es **público** (no requiere Bearer token), pero exige que la sesión HTTP tenga
el atributo `platformAuthorizationState`, creado al completar previamente
`GET /api/v1/platform/oauth2/authorize`. Sin ese atributo responde `401`.

**Contrato:**
```http
POST /api/v1/platform/account/check-email
Content-Type: application/json
Cookie: <sesión de authorize>

{ "email": "user@example.com" }
```

| HTTP | Código | Significado |
|---|---|---|
| `200` | `PLATFORM_USER_EMAIL_FOUND` | Email registrado |
| `404` | `PLATFORM_USER_EMAIL_NOT_FOUND` | Email no registrado |
| `401` | `AUTHENTICATION_REQUIRED` | Sin sesión previa de authorize |

El campo `data` es siempre `null`. El resultado se comunica solo por HTTP status y código.

### Expectativa del receptor

- Antes del paso de ToS, llamar al endpoint con el email ingresado.
- `200` → usuario ya existe → redirigir al flujo de login.
- `404` → usuario nuevo → continuar con aceptación de ToS.
- `401` → sesión de authorize no existe o expiró → reiniciar flujo desde `GET /oauth2/authorize`.

---

## Respuesta _(→ UI)_

Integrado en `src/features/auth/register/NewContractPage.tsx` mediante el wrapper
`platformCheckEmail()` en `src/features/auth/api.ts`.

El wizard ahora:
- `200 PLATFORM_USER_EMAIL_FOUND` → mantiene en "Your details / Tus datos" con mensaje para ingresar otro correo
- `404 PLATFORM_USER_EMAIL_NOT_FOUND` → avanza al paso de términos
- `401 AUTHENTICATION_REQUIRED` → rehace `platformAuthorize()` y reintenta en el mismo submit

También se agregó mensajes i18n y pruebas del contrato en `src/features/auth/api.test.ts`.

**Referencia:** T-130
