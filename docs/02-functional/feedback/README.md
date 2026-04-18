# Feedback UI ↔ Backend

Canal de comunicación activa entre los equipos de UI y backend.
Cada ítem es un archivo único que contiene la apertura (quien inicia) y la respuesta (quien cierra).

## Convenciones de nombrado

```
UI-NNN-<slug>.md   → inicia UI
BE-NNN-<slug>.md   → inicia Backend
```

## Estados

| Estado                   | Significado                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| 🔴 Abierto               | Reportado o notificado, sin respuesta                                      |
| 🟡 En revisión           | Reconocido, en evaluación o bloqueado por contraparte                      |
| 🟢 Resuelto / Confirmado | Implementado o integrado; **solo quien inició puede marcar como resuelto** |
| ⬛ Archivado             | Ya no aplica                                                               |

## Reglas de cierre

1. **Solo quien inicia** el feedback puede marcar como 🟢 Resuelto.
2. La contraparte indica "listo" cuando completa su parte (pasa a 🟡 En revisión).
3. El iniciador valida y puede **reabrir** si encuentra un bug, indicando cuál en la sección de respuesta.

## Plantilla

```markdown
# [UI|BE]-NNN — <título corto>

**Fecha:** YYYY-MM-DD
**Iniciado por:** UI | Backend
**Estado:** 🔴 Abierto
**Contexto / Plan:** <pantalla o flujo> / T-NNN o RFC-NNN (si aplica)

---

## Apertura _(→ [UI | Backend])_

### Descripción

<UI: gap o inconsistencia detectada / BE: cambio implementado o previsto>

### Expectativa del receptor

<UI: qué debe exponer o cambiar el backend / BE: qué debe adaptar o integrar la UI>

---

## Respuesta _(→ [Backend | UI])_

_Pendiente._

**Referencia:** _Pendiente._

<!-- T-NNN / RFC-NNN / ADR / artefacto que cierra este ítem -->
```

## Índice

### Abiertos / En revisión

| Archivo                                                                                              | Iniciado por | Estado         | Resumen                                                                                       |
| ---------------------------------------------------------------------------------------------------- | ------------ | -------------- | --------------------------------------------------------------------------------------------- |
| [UI-005-access-incident-reporting-endpoint.md](UI-005-access-incident-reporting-endpoint.md)         | UI           | 🔴 Abierto     | UI necesita `POST /platform/support/access-incidents` para reportar `403` como posible error. |
| [BE-002-billing-entitlement-limitvalue-decimal.md](BE-002-billing-entitlement-limitvalue-decimal.md) | Backend      | 🔴 Abierto     | `limitValue` de billing ahora es decimal (`NUMERIC(18,4)`); UI debe adaptar serialización.    |
| [BE-008-tenant-app-self-registration.md](BE-008-tenant-app-self-registration.md)                     | Backend      | 🔴 Abierto     | Flujo completo de self-registro público en app de tenant: 3 endpoints (T-154).                |
| [BE-009-tenant-app-invitation-flow.md](BE-009-tenant-app-invitation-flow.md)                         | Backend      | 🟡 En revisión | Flujo de invitación admin → app de tenant: 6 endpoints; bloqueado hasta T-155.                |

### Resueltos

| Archivo                                                                                                  | Iniciado por | Resumen                                                                                               |
| -------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| [resolved/UI-001-platform-users-list-endpoint.md](resolved/UI-001-platform-users-list-endpoint.md)       | UI           | `GET /platform/users` no existía; backend lo habilitó con paginación (T-142).                         |
| [resolved/UI-002-platform-user-roles-endpoint.md](resolved/UI-002-platform-user-roles-endpoint.md)       | UI           | `GET /platform/users/{userId}/platform-roles` no existía; backend lo habilitó (T-143).                |
| [resolved/UI-003-platform-billing-catalog-empty.md](resolved/UI-003-platform-billing-catalog-empty.md)   | UI           | `GET /platform/billing/catalog` devolvía `data: []`; se alineó con Flyway V20 (T-145).                |
| [resolved/UI-004-platform-roles-catalog-endpoint.md](resolved/UI-004-platform-roles-catalog-endpoint.md) | UI           | `GET /platform/roles` para catálogo de roles asignables; UI lo consume en detalle de usuario (T-146). |
| [resolved/BE-001-check-email-endpoint.md](resolved/BE-001-check-email-endpoint.md)                       | Backend      | `POST /platform/account/check-email` para onboarding; UI integrado en `NewContractPage.tsx` (T-130).  |
| [resolved/BE-007-platform-account-profile.md](resolved/BE-007-platform-account-profile.md)               | Backend      | `GET`/`PATCH /platform/account/profile` — perfil self-service de platform user (T-153).               |
