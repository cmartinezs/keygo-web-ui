---
description: "Use when implementing authentication, PKCE flow, JWT validation, token storage, role guards, silent refresh, or logout. Covers OAuth2/PKCE, Zustand token store, jose, and security requirements."
applyTo: "src/auth/**"
---

# Autenticación — OAuth2/PKCE y gestión de tokens

## Flujo OAuth2 Authorization Code + PKCE

1. **Generar** `code_verifier` y `code_challenge` (SHA-256 Base64URL) con `src/auth/pkce.ts`.
2. **Redirigir** al endpoint de autorización: `GET /oauth2/authorize?response_type=code&client_id=…&code_challenge=…`.
3. **Intercambiar** el `code` por tokens: `POST /oauth2/token` con `code_verifier`.
4. **Verificar** el `id_token` con JWKS RS256 usando `jose` en `src/auth/jwksVerify.ts`.
5. **Guardar** tokens en el store de Zustand (memoria) — **nunca** en `localStorage` ni `sessionStorage`.

## Token Store (Zustand — `src/auth/tokenStore.ts`)

```ts
interface TokenStore {
  accessToken: string | null
  idToken: string | null
  refreshToken: string | null
  roles: AppRole[]
  setTokens: (tokens: TokenData) => void
  clearTokens: () => void
}
```

- Solo acceder al store desde hooks o interceptores, **nunca** directamente en componentes de UI.
- `roles` se extrae del claim `roles` del JWT al hacer `setTokens`.

## Roles y guardias

- Roles disponibles: `ADMIN` | `ADMIN_TENANT` | `USER_TENANT` (ver `src/types/roles.ts`).
- Usar `<AuthGuard>` para rutas que requieren solo autenticación.
- Usar `<RoleGuard roles={['ADMIN']}>` para restricción por rol.
- Hook `useHasRole(role)` para condicionales en componentes.

```tsx
// En router.tsx
<Route element={<RoleGuard roles={['ADMIN']} />}>
  <Route path="/admin/tenants" element={<TenantsPage />} />
</Route>
```

## Silent Refresh (`src/auth/refresh.ts`)

- Programar el refresh al **80% del TTL** del access token.
- Usar `POST /oauth2/refresh` con el `refresh_token`.
- Si el refresh falla → limpiar store + redirigir a login.

## Logout (`src/auth/logout.ts`)

1. `POST /oauth2/revoke` con el `refresh_token`.
2. Llamar a `clearTokens()` del store.
3. Redirigir a `/login`.

## Seguridad

- Nunca incluir `client_secret` en el browser (el app type es PUBLIC).
- No loggear tokens en consola.
- Validar la firma RS256 del `id_token` antes de confiar en los claims.
- El `state` del flujo PKCE debe ser aleatorio y verificado al recibir el callback.
