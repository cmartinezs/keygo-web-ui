# BE-005 — `GET /platform/billing/catalog` ya entrega catálogo público de plataforma

**Fecha:** 2026-04-13  
**Estado:** 🔴 Abierto  
**Plan:** T-145  
**Feedback IN relacionado:** UI-003

## Cambio

El backend dejó trazado y aplicado el ajuste para que `GET /api/v1/platform/billing/catalog`
devuelva planes públicos de plataforma en lugar de `data: []`.

El cambio quedó materializado con:

- migración `V20__platform_plan_catalog.sql`
- soporte físico para `app_plans.client_app_id = NULL` en planes de plataforma
- seed del catálogo público KeyGo (`FREE`, `PERSONAL`, `TEAM`, `BUSINESS`, `FLEX`, `ENTERPRISE`)
- documentación del baseline actualizada a `V1–V20`

## Impacto en UI

- La UI ya puede consumir el catálogo público de plataforma desde la misma ruta.
- Para verlo en ambiente local, el backend debe reiniciarse y aplicar Flyway `V20`.
- No cambia el contrato del endpoint; cambia el dato devuelto, que deja de venir vacío.

## Referencias

- Feedback UI de origen: [UI-003-platform-billing-catalog-empty.md](../in/UI-003-platform-billing-catalog-empty.md)
- Tarea técnica aplicada: [T-145-platform-billing-catalog-empty.md](../../../../09-ai/tasks/T-145-platform-billing-catalog-empty.md)
- Documentación funcional: [07-endpoints-billing.md](../../07-endpoints-billing.md)

## Confirmación

_Pendiente._
