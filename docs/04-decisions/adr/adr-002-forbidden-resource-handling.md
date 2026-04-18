# ADR-002 — Manejo explícito de `403 FORBIDDEN` como autorización de recurso

| Campo        | Valor                                                            |
| ------------ | ---------------------------------------------------------------- |
| **ID**       | ADR-002                                                          |
| **Título**   | Tratar `403 FORBIDDEN` como acceso denegado a recurso            |
| **Estado**   | ✅ Aceptado                                                      |
| **Fecha**    | 2026-04-14                                                       |
| **Autor**    | Equipo KeyGo                                                     |
| **Contexto** | Frontend integration — módulos protegidos por rol y por recurso |

---

## 1. Contexto

El frontend ya distingue autenticación (`401`), errores de red y reglas de negocio mediante `ErrorData`,
pero las pantallas de listado y detalle todavía trataban un `403 FORBIDDEN` como un fallo genérico de carga.

Eso genera una UX ambigua:

1. el rol del JWT puede habilitar un módulo en navegación,
2. el backend puede seguir negando un recurso concreto,
3. la UI termina mostrando un error rojo genérico, como si el servidor hubiese fallado.

El caso actual es `KEYGO_ACCOUNT_ADMIN` en `/dashboard/tenants`: la ruta existe en la UI, pero el endpoint
todavía responde `403 INSUFFICIENT_PERMISSIONS`.

---

## 2. Decisión

**El frontend tratará `403 FORBIDDEN` como un estado explícito de autorización de recurso y no como un error genérico de carga.**

### 2.1 Reglas operativas

- `401` sigue representando sesión ausente/expirada o necesidad de reautenticación.
- `403` representa **acceso denegado a un recurso o capacidad concreta**.
- `403` **no se reintenta automáticamente**.
- La UI **no redirige automáticamente** ante `403`; debe mostrar un estado contextual de acceso denegado.
- El `client_message` del backend se muestra tal como llega; la UI puede agregar contexto local adicional.

### 2.2 Capas afectadas

| Capa                    | Regla aplicada                                                                 |
| ----------------------- | ------------------------------------------------------------------------------ |
| `errorNormalizer.ts`    | Helpers explícitos para detectar `403` y `INSUFFICIENT_PERMISSIONS`.           |
| `client.ts`             | `403` relevantes también se registran en DevConsole con `code` y `trace_id`.  |
| Pantallas con `useQuery`| Un `403` se renderiza como `AccessDeniedState`/panel contextual.               |
| Guards de ruta          | `RoleGuard` sigue siendo coarse-grained por rol del JWT, no por recurso final. |

---

## 3. Alternativas consideradas

| Alternativa                                             | Motivo de descarte                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Redirigir siempre al dashboard                          | Oculta el problema real y hace parecer que el menú/ruta están mal configurados.   |
| Ocultar el módulo completo hasta que backend lo permita | Mezcla capacidades de navegación con permisos efectivos de recurso.                |
| Tratar `403` como error genérico de carga               | No diferencia falta de permiso de timeout, 5xx o caída de backend.                |

---

## 4. Consecuencias

### ✅ Positivas

- La UX comunica claramente que el recurso existe pero no está habilitado.
- El frontend queda preparado para endpoints que habilitan permisos gradualmente por rol.
- Se evita retry inútil sobre respuestas determinísticas del backend.
- La observabilidad mejora con `trace_id` y `code` visibles en DevConsole también para `403`.

### ⚠️ Limitaciones conocidas

- La implementación inicial se aplica como piloto en `TenantsPage`; el resto de módulos debe converger al mismo patrón.
- El frontend no infiere permisos por recurso antes del request; el backend sigue siendo la fuente final de autorización.

---

## 5. Implementación base

1. Crear helpers `isForbiddenError()` e `isInsufficientPermissionsError()`.
2. Crear el estado reusable `AccessDeniedState`.
3. Aplicar el patrón en pantallas críticas basadas en `useQuery`, empezando por `/dashboard/tenants`.
4. Mantener `RoleGuard` solo para autorización gruesa por rol presente en el JWT.

---

## 6. Referencias

- `src/shared/api/errorNormalizer.ts`
- `src/shared/api/client.ts`
- `src/shared/ui/AccessDeniedState.tsx`
- `src/features/ops/tenants/TenantsPage.tsx`
- `docs/03-architecture/04-api-integration.md`
