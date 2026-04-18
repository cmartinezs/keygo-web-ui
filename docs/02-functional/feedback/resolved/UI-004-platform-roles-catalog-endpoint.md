# UI-004 — Platform roles catalog endpoint

**Fecha:** 2026-04-13  
**Iniciado por:** UI  
**Estado:** 🟢 Resuelto  
**Contexto / Plan:** Pantalla admin — selector de roles asignables en detalle de usuario de plataforma / T-146

---

## Apertura _(→ UI)_

### Descripción

La UI necesitaba consultar un catálogo oficial de roles de plataforma para la asignación de
nuevos roles en el detalle de usuario. Sin ese endpoint, el selector quedaba amarrado a un
catálogo local hardcodeado, con riesgo de desalinearse del backend.

### Expectativa del receptor

El backend debe exponer un endpoint de lectura para obtener el catálogo vigente de roles de
plataforma asignables, con código canónico y nombre legible para renderizar el selector.

---

## Respuesta _(→ Backend)_

Se habilitó `GET /api/v1/platform/roles`. La respuesta entrega una lista con:

- `id`, `code`, `name`, `description`

Código de éxito: `PLATFORM_ROLE_LIST_RETRIEVED`. Accesible con roles `KEYGO_ADMIN` y
`KEYGO_ACCOUNT_ADMIN`.

La UI quedó integrada al endpoint en `PlatformUserDetailPage.tsx` y `api.ts`, filtrando
localmente los roles ya asignados al usuario y enviando el `code` canónico al flujo de
asignación.

**Referencia:** [T-146](../../../../09-ai/tasks/T-146-platform-roles-catalog-endpoint.md) — [08-endpoints-admin.md](../08-endpoints-admin.md)
