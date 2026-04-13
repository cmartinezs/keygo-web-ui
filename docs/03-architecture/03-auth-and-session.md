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
| `CriticalActionConfirmationModal.tsx` | Reutilizar confirmaciones críticas con frase consciente y contraseña opcional. |

## Reglas

1. Nunca guardar tokens en `localStorage` o `sessionStorage`.
2. El rol efectivo se resuelve desde el JWT.
3. La SPA usa PKCE para el login interactivo; `direct-login` no se usa como flujo primario, pero puede reutilizarse para reautenticaciones puntuales de acciones administrativas de alto riesgo sin reemplazar la sesión actual.
4. Cualquier recuperación de sesión visible debe comunicar su impacto en la UI.
5. Las acciones críticas deben pedir confirmación explícita; si además son muy críticas desde el punto de vista de seguridad o privilegio, deben escalar con fricción consciente (por ejemplo una frase tipeada) y reingreso de contraseña antes de continuar.
6. La fricción de acciones críticas debe implementarse con un flujo reutilizable y configurable, separando textos, frase consciente, requerimiento de contraseña y callback final de la acción para evitar modales ad hoc por cada caso.
7. Cuando una cuenta de plataforma esté en estado `SUSPENDED`, su detalle administrativo debe renderizarse en modo casi solo lectura; la UI no debe habilitar acciones ni enlaces interactivos sobre esa cuenta mientras permanezca suspendida, salvo la acción explícita de reactivación.

## Referencia funcional

- [../02-functional/04-auth-flow-platform-and-tenant.md](../02-functional/04-auth-flow-platform-and-tenant.md)
