# BE-002 — `limitValue` de entitlements de billing ahora es decimal

**Fecha:** 2026-04-13  
**Iniciado por:** Backend  
**Estado:** 🔴 Abierto  
**Contexto / Plan:** Corrección de compatibilidad JPA ↔ Flyway — sin tarea asociada

---

## Apertura _(→ Backend)_

### Descripción

El backend alineó el contrato de billing con el esquema PostgreSQL activo:

- `app_plan_entitlements.limit_value` se persiste como `NUMERIC(18,4)`
- `entitlements[].limitValue` en request/response de planes de billing ahora se modela como
  decimal (`BigDecimal`) en lugar de entero (`Long`)

El cambio responde a una corrección de compatibilidad JPA ↔ Flyway para evitar drift de tipos.

Referencia actualizada en `doc/02-functional/frontend/07-endpoints-billing.md` y
`postman/KeyGo-Server.postman_collection.json`.

### Expectativa del receptor

- No asumir que `limitValue` siempre será un entero.
- Tratar `limitValue` como número decimal al serializar/deserializar formularios de creación
  y pantallas de detalle/catálogo de planes.
- Si la UI muestra límites como enteros por UX, hacerlo solo a nivel de presentación cuando
  el valor no tenga parte fraccionaria.

---

## Respuesta _(→ UI)_

_Pendiente._

**Referencia:** _Pendiente._
