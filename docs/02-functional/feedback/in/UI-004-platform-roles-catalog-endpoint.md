# UI-004 — Platform roles catalog endpoint

**Fecha:** 2026-04-13  
**Estado:** 🟢 Resuelto  
**Contexto:** Pantalla admin de detalle de usuario de plataforma que necesita poblar el selector de roles asignables sin depender de catálogo hardcodeado.

## Problema

La UI necesitaba consultar un catálogo oficial de roles de plataforma para la asignación de nuevos roles en el detalle de usuario. Sin ese endpoint, el selector quedaba amarrado a un catálogo local hardcodeado, con riesgo de desalinearse del backend.

## Comportamiento esperado

El backend debe exponer un endpoint de lectura para obtener el catálogo vigente de roles de plataforma asignables, incluyendo el código canónico y el nombre legible que la UI necesita renderizar.

## Resolución

Se habilitó `GET /api/v1/platform/roles` y la UI ya quedó integrada a ese endpoint para poblar el selector de roles disponibles en la pantalla de detalle de usuario de plataforma.

La respuesta consumida por UI entrega una lista simple con:

- `id`
- `code`
- `name`
- `description`

La UI filtra localmente los roles ya asignados al usuario y envía el `code` canónico al flujo de asignación.

**Tarea/RFC que lo resolvió:** Implementación UI del 2026-04-13 sobre `src/features/ops/platform-users/PlatformUserDetailPage.tsx` y `src/features/ops/platform-users/api.ts`

**Feedback OUT asociado:** [BE-006-platform-roles-catalog-endpoint.md](../out/BE-006-platform-roles-catalog-endpoint.md)

<!-- Confirmado y resuelto: la UI ya consume GET /platform/roles para poblar el selector de roles asignables -->
