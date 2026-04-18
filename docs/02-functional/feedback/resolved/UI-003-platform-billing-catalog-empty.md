# UI-003 — Platform billing catalog returns empty data

**Fecha:** 2026-04-13  
**Iniciado por:** UI  
**Estado:** 🟢 Resuelto  
**Contexto / Plan:** Vista de planes de plataforma — catálogo de billing vacío / T-145

---

## Apertura _(→ UI)_

### Descripción

`GET /api/v1/platform/billing/catalog` respondía `200 OK` pero con `data: []`:

```json
{
  "data": [],
  "success": { "code": "PLATFORM_PLAN_CATALOG_RETRIEVED" }
}
```

El backend exponía el endpoint y devolvía éxito, pero no entregaba planes reales.

### Expectativa del receptor

El backend debe devolver el catálogo público de planes (`FREE`, `PERSONAL`, `TEAM`, `BUSINESS`,
`FLEX`, `ENTERPRISE`) con versiones, billing options y entitlements en lugar de lista vacía.

---

## Respuesta _(→ Backend)_

Se agregó la migración `V20__platform_plan_catalog.sql`, que:

- habilita `app_plans.client_app_id = NULL` para planes de plataforma
- crea unicidad para códigos de plan de plataforma
- siembra el catálogo público de KeyGo con versiones, precios y entitlements

Documentación del baseline actualizada a `V1–V20`. El contrato del endpoint no cambió;
solo cambia el dato devuelto, que deja de venir vacío.

Para verlo en local: reiniciar el backend para que Flyway aplique `V20`.

**Referencia:** [T-145](../../../../09-ai/tasks/T-145-platform-billing-catalog-empty.md) — [07-endpoints-billing.md](../07-endpoints-billing.md)
