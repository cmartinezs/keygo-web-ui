# UI-001 — Missing platform users list endpoint

**Fecha:** 2026-04-13  
**Iniciado por:** UI  
**Estado:** 🟢 Resuelto  
**Contexto / Plan:** Pantalla admin de plataforma — listado paginado de usuarios globales / T-142

---

## Apertura _(→ UI)_

### Descripción

La UI consumía `GET /api/v1/platform/users?page=0&size=20`, pero el backend respondía
`HttpRequestMethodNotSupportedException` porque `PlatformUserController` no exponía el `GET`
de colección, solo `POST /platform/users` y `GET /platform/users/{userId}`.

### Expectativa del receptor

El backend debe exponer `GET /api/v1/platform/users` con contrato paginado (`PagedData`) para
que la UI pueda listar usuarios globales de plataforma sin depender de rutas alternativas.

---

## Respuesta _(→ Backend)_

Se implementó `GET /api/v1/platform/users` siguiendo el patrón existente de listados paginados.
El endpoint soporta `page`, `size`, filtros opcionales (`status`, `username_like`, `email_like`)
y ordenamiento (`sort`, `order`), devolviendo `BaseResponse<PagedData<PlatformUserData>>`.

Código de éxito: `PLATFORM_USER_LIST_RETRIEVED`.

La pantalla admin de plataforma ya puede consumir el listado sin depender de rutas alternativas.

**Referencia:** [T-142](../../../../09-ai/tasks/T-142-platform-users-list-endpoint.md) — [08-endpoints-admin.md](../08-endpoints-admin.md)
