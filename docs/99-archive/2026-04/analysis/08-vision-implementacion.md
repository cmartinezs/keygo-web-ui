# 08 — Visión de Implementación

> Cómo veo la implementación: fases, riesgos, dependencias y recomendaciones.

---

## Principio rector

Los tres RFCs (restructure, T-111, billing) convergen en un cambio fundacional: **la creación de `platform_users` como identidad global**. Todo lo demás (RBAC, billing desacoplado, dual auth) es extensión de ese cambio.

La implementación del frontend debe seguir el mismo orden de dependencias:

```
Fase 0: Preparación de tipos y infraestructura
    ↓
Fase 1: Auth de plataforma (el cambio más impactante)
    ↓
Fase 2: RBAC multicapa + guards actualizados
    ↓
Fase 3: Billing de plataforma
    ↓
Fase 4: Restructuración de rutas y layouts
    ↓
Fase 5: Páginas de gestión (platform users, roles)
```

---

## Fase 0: Preparación de tipos e infraestructura

### Objetivo
Crear los DTOs y helpers sin romper nada existente.

### Entregables

1. **Nuevos archivos de tipos:**
   - `src/types/platformUser.ts` — `PlatformUserData`, `CreatePlatformUserRequest`
   - `src/types/platformRole.ts` — `PlatformRoleData`, `PlatformUserRoleData`
   - `src/types/tenantRole.ts` — `TenantRoleData`, `TenantUserRoleData`

2. **Extensiones a tipos existentes:**
   - `src/types/auth.ts` — `PlatformJwtClaims`, `TenantJwtClaims`, union `JwtClaims`, type guard `isPlatformToken()`
   - `src/types/roles.ts` — `PlatformRoleCode`, legacy map, helpers actualizados
   - `src/types/billing.ts` — `client_app_id: string | null` en todos los tipos de billing, `'PLATFORM'` en `SubscriberType`
   - `src/types/user.ts` — `platform_user_id?: string` en `TenantUserData`

3. **Helpers de normalización:**
   - `normalizeRole(role: string): string`
   - `isPlatformBilling(entity): boolean`
   - `isPlatformToken(claims): boolean`

### Riesgo
Bajo. Son cambios aditivos sin impacto en funcionalidad existente.

### Dependencia backend
Ninguna. Se puede hacer ahora.

---

## Fase 1: Auth de plataforma

### Objetivo
Implementar el flujo PKCE de plataforma como stack paralelo al existente.

### Entregables

1. **Módulos de auth:**
   - `src/auth/platformPkce.ts` — PKCE para `/platform/oauth2/authorize`
   - `src/auth/platformRefresh.ts` — refresh vía `/platform/oauth2/token`
   - `src/auth/platformLogout.ts` — revocación vía `/platform/oauth2/revoke`

2. **Token store ampliado:**
   - Agregar `context: 'platform' | 'tenant' | null` al store
   - Los interceptores de Axios seleccionan el token según el contexto

3. **Módulo API:**
   - `src/api/platformAuth.ts` — authorize, login, exchangeToken, refreshToken, revoke

4. **Página de login:**
   - `src/pages/login/PlatformLoginPage.tsx` — formulario que inicia PKCE de plataforma

### Decisiones de diseño

**¿Un token store o dos?**

Recomiendo **un solo store con campo `context`**:

```typescript
interface TokenStore {
  context: 'platform' | 'tenant' | null
  accessToken: string | null
  refreshToken: string | null
  roles: string[]
  platformUserId: string | null   // solo en contexto platform
  tenantSlug: string | null       // solo en contexto tenant
  setTokens: (data: TokenData, context: 'platform' | 'tenant') => void
  clearTokens: () => void
}
```

**Razón:** No se espera que un usuario esté autenticado en ambos contextos simultáneamente en la misma tab del navegador. Si surge ese caso, se puede bifurcar.

### Riesgo
Alto. Es el cambio más complejo. Requiere que los interceptores, guards y componentes de UI reconozcan el contexto.

### Dependencia backend
Endpoints de plataforma auth deben estar disponibles (Fase C del RFC restructure).

---

## Fase 2: RBAC multicapa + guards actualizados

### Objetivo
Que los guards de ruta y los hooks de autorización funcionen con roles de las 3 capas.

### Entregables

1. **Guards actualizados:**
   - `<PlatformGuard>` — requiere contexto platform + roles de plataforma
   - `<TenantGuard>` — requiere contexto tenant (existente `<RoleGuard>` adaptado)
   - `<AuthGuard>` — acepta cualquier contexto autenticado

2. **Hooks actualizados:**
   - `useHasRole(role)` — normaliza roles legacy antes de comparar
   - `useCurrentUser()` — retorna data diferente según contexto (platform user vs tenant user)
   - `useAuthContext()` — retorna `'platform' | 'tenant' | null`

3. **API modules:**
   - `src/api/platformRoles.ts` — CRUD de roles de plataforma (KEYGO_ADMIN)
   - `src/api/tenantRoles.ts` — CRUD de roles por tenant (ADMIN_TENANT)

### Riesgo
Medio. La complejidad está en que los guards deben distinguir entre roles de plataforma y roles de app sin confundirse.

### Dependencia backend
T-111 implementado + Fase E del RFC restructure (RBAC en JWT).

---

## Fase 3: Billing de plataforma

### Objetivo
Soportar planes, suscripciones y facturas a nivel de plataforma.

### Entregables

1. **Módulo API:**
   - `src/api/platformBilling.ts` — catalog, subscription, cancel, invoices

2. **Actualización de tipos:**
   - `client_app_id: null` soportado en todos los componentes de billing

3. **Actualización del wizard de registro:**
   - `NewContractPage.tsx` debe soportar `client_app_id: null` para contratos de plataforma

4. **Landing / Pricing:**
   - `PricingSection.tsx` puede mostrar planes de plataforma usando el nuevo endpoint público

### Riesgo
Medio. El principal riesgo es el manejo de `null` en `client_app_id` donde antes era `string`.

### Dependencia backend
RFC Billing implementado (V30 + nuevos endpoints).

---

## Fase 4: Restructuración de rutas y layouts

### Objetivo
Separar las rutas de plataforma de las rutas de tenant en la SPA.

### Entregables

1. **Router actualizado:**
   ```
   /login                    → PlatformLoginPage
   /tenants/:slug/login      → TenantLoginPage (hosted login)
   
   /dashboard                → Platform dashboard (según roles)
   /admin/*                  → Platform admin routes
   /account/*                → Platform account routes
   
   /tenants/:slug/dashboard  → Tenant dashboard
   /tenants/:slug/*          → Tenant routes
   ```

2. **Layouts:**
   - `PlatformLayout` — shell para contexto plataforma
   - `TenantLayout` — shell para contexto tenant (existente `AdminLayout` adaptado)
   - Componentes compartidos (sidebar, header) con adaptación por contexto

3. **Migración de rutas existentes:**
   - `/dashboard/*` actual → evaluar si mapea a platform o tenant
   - `/admin/*` actual → mapea a platform admin
   - `/dashboard/account/*` → mapea a platform account (o tenant account según contexto)

### Riesgo
Alto. Es la fase más visible para el usuario y la que más archivos toca. Requiere migración cuidadosa con posibles rutas paralelas durante transición.

### Dependencia backend
Auth de plataforma funcional (Fase 1 completada).

---

## Fase 5: Páginas de gestión

### Objetivo
Implementar las páginas de administración de platform users y roles.

### Entregables

1. `PlatformUsersPage.tsx` — listar, crear, suspender/activar platform users
2. `PlatformUserDetailPage.tsx` — detalle con roles asignados
3. `PlatformRolesPage.tsx` — listar roles de plataforma + asignar/revocar
4. `TenantRolesPage.tsx` — gestión de roles por tenant

### Riesgo
Bajo-medio. Son páginas CRUD estándar.

### Dependencia backend
Todos los endpoints de gestión disponibles (Fases G de restructure + D de T-111).

---

## Riesgos transversales

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Backend no listo cuando frontend lo necesita | Media | Alto | MSW mocks + feature flags |
| Confusión de tokens entre contextos | Media | Alto | Type guards estrictos + contexto en store |
| Regresión en funcionalidad existente | Media | Alto | Tests de integración antes de migrar |
| Colisión de nombres de roles entre capas | Baja | Medio | Normalización centralizada |
| Performance por JWT más grande (3 fuentes de roles) | Baja | Bajo | Monitorear tamaño del token |

---

## Recomendaciones generales

1. **No migrar todo de golpe.** Implementar por fases, con feature flags si es posible.

2. **Mantener el flujo tenant funcional** mientras se construye el platform flow. No romper lo que ya funciona.

3. **Type guards como primera línea de defensa.** Antes de consumir un JWT o response de billing, validar el contexto con type guards tipados.

4. **Un solo archivo de constantes de roles.** Toda la lógica de normalización y equivalencia en un solo lugar (`src/types/roles.ts`).

5. **Tests de integración por contexto.** Cada flujo (platform login → dashboard, tenant login → dashboard) debe tener su test end-to-end.

6. **MSW para endpoints no disponibles.** Cualquier endpoint pendiente del backend debe tener handler MSW que respete el schema de `api-docs.json`.

7. **Actualizar BACKLOG.md** al final de cada fase con el estado real de implementación.

8. **Documentación viva.** Cada fase implementada debe reflejarse en `TECHNICAL_GUIDE.md` y `FUNCTIONAL_GUIDE.md`.

---

## Dependencias entre fases

```
Fase 0 (tipos) ─────────────────────────────→ se puede hacer ahora
     │
     ├── Fase 1 (auth platform) ──────────→ requiere backend Fase C
     │       │
     │       ├── Fase 2 (RBAC) ──────────→ requiere backend T-111 + Fase E
     │       │
     │       ├── Fase 4 (rutas) ─────────→ requiere Fase 1 funcional
     │       │       │
     │       │       └── Fase 5 (páginas) → requiere backend Fases G + D
     │       │
     │       └── Fase 3 (billing) ───────→ requiere backend RFC Billing
     │
     └── (Fase 0 no bloquea nada más)
```

**Camino crítico:** Fase 0 → Fase 1 → Fase 2 → Fase 4 → Fase 5

**Paralelizable:** Fase 3 (billing) puede avanzar en paralelo con Fase 2 si el backend está listo.

---

## Nota sobre los "4 enfoques de contexto"

El RFC de restructuración **no propone 4 enfoques alternativos** para separar vistas por perfil. Propone **una sola arquitectura** con dos contextos de autenticación (platform y tenant). Lo que se materializa en la SPA es:

1. **Contexto platform** — rutas `/login`, `/dashboard`, `/admin/*`, `/account/*`
2. **Contexto tenant** — rutas `/tenants/:slug/login`, `/tenants/:slug/*`

Dentro de cada contexto, la visibilidad de secciones depende de los roles del JWT correspondiente. No hay 4 enfoques a elegir; hay un solo diseño con dos modos de operación.
