# UI-003 — Platform billing catalog returns empty data

**Fecha:** 2026-04-13  
**Estado:** 🟢 Resuelto  
**Contexto:** La UI reportó que `GET /api/v1/platform/billing/catalog` respondía `200 OK` pero con `data: []`, dejando sin catálogo la vista de planes de plataforma.

## Problema

La UI obtiene la siguiente respuesta al consumir `http://localhost:8080/keygo-server/api/v1/platform/billing/catalog`:

```json
{
  "data": [],
  "date": "2026-04-13T06:31:38.7665913",
  "success": {
    "code": "PLATFORM_PLAN_CATALOG_RETRIEVED",
    "message": "Platform plan catalog retrieved successfully"
  }
}
```

El backend exponía el endpoint y devolvía éxito, pero no entregaba planes de plataforma reales.

## Comportamiento esperado

El backend debe devolver el catálogo público de planes de plataforma (`FREE`, `PERSONAL`, `TEAM`,
`BUSINESS`, `FLEX`, `ENTERPRISE`) con versiones, billing options y entitlements, en vez de una
lista vacía.

## Resolución

Se corrigió la deriva entre modelo/código y baseline Flyway agregando la migración
`V20__platform_plan_catalog.sql`, que:

- habilita `app_plans.client_app_id = NULL` para planes de plataforma
- crea unicidad para códigos de plan de plataforma
- siembra el catálogo público de KeyGo con versiones, precios y entitlements

También se alineó la documentación del baseline para reflejar `V1–V20`.

**Tarea/RFC que lo resolvió:** [T-145-platform-billing-catalog-empty.md](../../../../09-ai/tasks/T-145-platform-billing-catalog-empty.md)

**Feedback OUT asociado:** [BE-005-platform-billing-catalog-available.md](../out/BE-005-platform-billing-catalog-available.md)
