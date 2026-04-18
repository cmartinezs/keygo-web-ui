# BE-008 — Flujo de self-registro abierto a app de tenant

**Fecha:** 2026-04-14  
**Iniciado por:** Backend  
**Estado:** 🟡 En revisión  
**Contexto / Plan:** Registro público de usuarios en apps de tenant / T-154 + T-158

---

## Apertura _(→ Backend)_

### Descripción

Backend expone un flujo completo de registro público que permite a cualquier usuario crear
cuenta en la app de un tenant, verificar su email y activarse. Los tres endpoints son
**públicos** (sin autenticación).

**Ruta base:** `/api/v1/tenants/{tenantSlug}/apps/{clientId}`

#### 1. Registrar usuario

```
POST /register
```

**Request:**

```json
{
  "username": "jdoe",
  "email": "jdoe@example.com",
  "password": "Min8Chars!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response 201:**

```json
{
  "code": "USER_REGISTERED",
  "data": {
    "id": "uuid",
    "username": "jdoe",
    "notification_email": "j***@example.com",
    "status": "PENDING"
  }
}
```

| HTTP | `code`                    | Acción UI                                                                        |
| ---- | ------------------------- | -------------------------------------------------------------------------------- |
| 400  | `INVALID_INPUT`           | Errores inline en el formulario                                                  |
| 403  | `BUSINESS_RULE_VIOLATION` | App es `INVITE_ONLY` — "El registro para esta aplicación es solo por invitación" |
| 404  | `RESOURCE_NOT_FOUND`      | Error de configuración — app o tenant inválido                                   |
| 409  | `DUPLICATE_RESOURCE`      | "Ya existe una cuenta con ese email o nombre de usuario"                         |

> **Nota — Identidad global:** al registrar, el backend crea (o reutiliza si el email ya existe) un registro en `platform_users` — la raíz de identidad global de Keygo. Sobre esa identidad se crea un `tenant_user` que vincula al usuario con el tenant específico. La UI no necesita conocer este detalle, pero explica por qué el mismo email no puede usarse en dos cuentas distintas dentro de la plataforma.

#### 2. Verificar email

```
POST /verify-email
```

**Request:** `{ "email": "jdoe@example.com", "code": "847291" }`

**Response 200:** `{ "code": "EMAIL_VERIFIED", "data": null }`

| HTTP | `code`                       | Acción UI                                       |
| ---- | ---------------------------- | ----------------------------------------------- |
| 422  | `EMAIL_VERIFICATION_EXPIRED` | Mensaje de expiración + botón "Reenviar código" |
| 422  | `EMAIL_VERIFICATION_INVALID` | "Código incorrecto. Inténtalo de nuevo."        |
| 409  | `EMAIL_ALREADY_VERIFIED`     | Redirigir a login                               |

#### 3. Reenviar código de verificación

```
POST /resend-verification
```

**Request:** `{ "email": "jdoe@example.com" }`

**Response 200:** `{ "code": "EMAIL_VERIFICATION_RESENT", "data": null }`

| HTTP | `code`                          | Acción UI                                             |
| ---- | ------------------------------- | ----------------------------------------------------- |
| 422  | `VERIFICATION_CODE_STILL_VALID` | "Tu código anterior sigue vigente. Revisa tu correo." |
| 409  | `EMAIL_ALREADY_VERIFIED`        | Redirigir a login                                     |

### Expectativa del receptor

**Flujo de descubrimiento previo al registro (PRE-REQUISITO):**

Antes de que el usuario vea el formulario de registro, la UI necesita **descubrir**:

1. ¿Cuáles tenants existen? (`name`, `slug`)
2. ¿Cuáles apps tiene cada tenant? (que acepten self-registro, según `registrationPolicy`)

**RESUELTO (T-158):** Endpoints públicos de discovery implementados y disponibles.

Ver subtarea **[T-158 — Public discovery endpoints](../../../09-ai/tasks/pending-ui/T-158-public-discovery-endpoints.md)**.

---

**Flujo completo para UI (CON descubrimiento):**

```
Pantalla 0: Seleccionar empresa + aplicación
  - API GET /tenants/public → listar tenants con nombre/slug
  - Usuario elige tenant
  - API GET /tenants/{tenantSlug}/apps/public → listar apps con
    registration_policy ∈ { OPEN_AUTO_ACTIVE, OPEN_AUTO_PENDING }
    (excluye INVITE_ONLY y OPEN_NO_MEMBERSHIP)
  - Usuario elige app → obtiene clientId

Pantalla 1: Formulario de registro
  - Ahora tiene: {tenantSlug, clientId}
  └─► POST /register
```

**Flujo completo para UI (sin descubrimiento — ACTUAL):**

```
Pantalla 1: Formulario de registro
  - PROBLEMA: usuario NO sabe qué ingresar en tenantSlug/clientId
  - ¿De dónde obtiene esto? ¿Link directo de email? ¿Invitación?
  - No existe UX clara.
```

\*\*Nueva expectativa del receptor (actualizada):

```
Pantalla 1: Formulario de registro
  └─► POST /register
        ├─ 201 → Pantalla 2
        └─ 400/409 → error inline

Pantalla 2: "Revisa tu email"
  - Mostrar notification_email (enmascarado)
  - Countdown 30 minutos (TTL fijo — el backend no lo retorna)
  - Botón "Ya tengo el código" → Pantalla 3
  - Botón "Reenviar" (activo solo si countdown = 0)
      └─► POST /resend-verification → reiniciar countdown

Pantalla 3: "Ingresar código"
  - Campo 6 dígitos / email precompletado (no editable)
  └─► POST /verify-email
        ├─ 200 → Pantalla 4
        ├─ 422 INVALID → error inline
        └─ 422 EXPIRED → Pantalla 2 con aviso de expiración

Pantalla 4: Registro completado
  - CTA: "Iniciar sesión" → flujo OAuth2/OIDC del tenant
```

> **Nota sobre Membership:** al completar `EMAIL_VERIFIED`, el backend aplica la política de
> la app:
>
> - `OPEN_AUTO_ACTIVE` → membership creada con estado `ACTIVE` (acceso inmediato).
> - `OPEN_AUTO_PENDING` → membership creada con estado `PENDING` (admin debe aprobar).
> - `OPEN_NO_MEMBERSHIP` → sin membership automática; el acceso debe otorgarse manualmente.
>
> Las apps con `OPEN_NO_MEMBERSHIP` **no aparecen** en el discovery de apps (`/apps/public`),
> por lo que la UI no debería encontrarse con este caso en el flujo normal de auto-registro.

---

## Respuesta _(→ UI)_

_Resuelto por backend. Listo para integración UI._

**Estado de T-154:** ✅ Endpoints 1-3 implementados — /register, /verify-email, /resend-verification  
**Estado de T-158:** ✅ Endpoints de discovery implementados — /tenants/public y /tenants/{slug}/apps/public

**Sin bloqueadores.** La UI puede integrar el flujo completo (Pantalla 0 + Pantallas 1-4).

**Referencia:**

- Backend task: [T-154](../../../09-ai/tasks/pending-ui/T-154-tenant-app-open-registration-flow.md)
- Backend task: [T-158](../../../09-ai/tasks/pending-ui/T-158-public-discovery-endpoints.md)
