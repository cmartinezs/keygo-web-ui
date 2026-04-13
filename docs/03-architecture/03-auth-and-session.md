# Autenticación y sesión

## Flujos soportados

- **Plataforma**: `keygo-ui` autentica operadores y administradores contra endpoints `/platform/...`.
- **Tenant app / hosted login**: la misma UI puede servir como pantalla de login para apps de tenant vía `/tenants/{slug}/...`.

## Componentes clave

| Módulo          | Responsabilidad                                               |
| --------------- | ------------------------------------------------------------- |
| `pkce.ts`       | Generar `code_verifier`, `code_challenge` y `state`.          |
| `tokenStore.ts` | Guardar access, refresh, roles y estado de sesión en memoria. |
| `jwksVerify.ts` | Verificar `id_token` con RS256 + JWKS.                        |
| `refresh.ts`    | Renovación silenciosa al 80% del TTL.                         |
| `roleGuard.tsx` | Proteger rutas por autenticación y rol.                       |
| `logout.ts`     | Revocar token y limpiar estado cliente.                       |

## Reglas

1. Nunca guardar tokens en `localStorage` o `sessionStorage`.
2. El rol efectivo se resuelve desde el JWT.
3. La SPA usa PKCE; `direct-login` queda fuera de uso para la UI.
4. Cualquier recuperación de sesión visible debe comunicar su impacto en la UI.

## Referencia funcional

- [../02-functional/04-auth-flow-platform-and-tenant.md](../02-functional/04-auth-flow-platform-and-tenant.md)
