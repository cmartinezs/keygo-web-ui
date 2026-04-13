# UI-001 — Missing platform users list endpoint

**Fecha:** 2026-04-13  
**Estado:** 🟢 Resuelto  
**Contexto:** Pantalla admin de plataforma que necesita cargar el listado paginado de usuarios globales.

## Problema

La UI consumia `GET /api/v1/platform/users?page=0&size=20`, pero el backend respondia
`HttpRequestMethodNotSupportedException` porque `PlatformUserController` no exponia el `GET`
de coleccion, solo `POST /platform/users` y `GET /platform/users/{userId}`.

## Comportamiento esperado

El backend debe exponer `GET /api/v1/platform/users` con contrato paginado (`PagedData`) para
que la UI pueda listar usuarios globales de plataforma sin depender de rutas alternativas.

## Resolución

Se implemento `GET /api/v1/platform/users` siguiendo el patron existente de listados paginados
del proyecto. El endpoint ahora soporta `page`, `size`, filtros opcionales (`status`,
`username_like`, `email_like`) y ordenamiento (`sort`, `order`), devolviendo
`BaseResponse<PagedData<PlatformUserData>>`.

**Tarea que lo resolvio:** [T-142-platform-users-list-endpoint.md](../../../../09-ai/tasks/T-142-platform-users-list-endpoint.md)
  
**Feedback OUT asociado:** [BE-003-platform-users-list-endpoint.md](../out/BE-003-platform-users-list-endpoint.md)
