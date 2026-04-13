# 02 — Frontend Developer Guide: Análisis de cambios

> Revisión de la guía actualizada (3.896 líneas, fases 0–9b del backend completadas).

---

## Cambio fundamental: "One App, Two Modes"

La guía ahora documenta que `keygo-ui` opera como una **sola SPA con dos contextos de autenticación**:

| Modo | Contexto | Endpoints base | Roles en JWT |
|------|----------|----------------|--------------|
| **Platform Admin** | Identidad global | `/platform/...` | `KEYGO_ADMIN`, `KEYGO_TENANT_ADMIN`, `KEYGO_USER` |
| **Hosted Login** | Identidad por tenant | `/tenants/{slug}/...` | Roles de app (vía memberships) |

### Implicación para el frontend

No es un cambio menor. Requiere que la SPA:

1. **Detecte** en qué contexto está operando (platform vs tenant app).
2. **Seleccione** el flujo PKCE correcto para ese contexto.
3. **Almacene** tokens con metadata de contexto (tipo de sesión).
4. **Rutas** separadas pero con componentes compartidos donde sea posible.
5. **Guards** que interpreten roles de ambas fuentes.

---

## Transición de nombres de roles

La guía documenta una transición de nombres que el backend ya acepta en ambos formatos:

```
ADMIN        ↔ KEYGO_ADMIN          (plataforma)
ADMIN_TENANT ↔ KEYGO_TENANT_ADMIN   (plataforma)
USER_TENANT  ↔ KEYGO_USER           (plataforma)
```

### Recomendación para el frontend

Crear un helper de normalización:

```typescript
function normalizeRole(role: string): NormalizedRole {
  const MAP: Record<string, NormalizedRole> = {
    'ADMIN': 'KEYGO_ADMIN',
    'KEYGO_ADMIN': 'KEYGO_ADMIN',
    'ADMIN_TENANT': 'KEYGO_TENANT_ADMIN',
    'KEYGO_TENANT_ADMIN': 'KEYGO_TENANT_ADMIN',
    'USER_TENANT': 'KEYGO_USER',
    'KEYGO_USER': 'KEYGO_USER',
  }
  return MAP[role] ?? role
}
```

Esto permite que los guards funcionen con cualquier formato sin duplicar lógica.

---

## BaseResponse mejorado

La guía ahora documenta un `ErrorData` más rico:

```typescript
interface ErrorData {
  code: string
  layer?: 'DOMAIN' | 'USE_CASE' | 'PORT' | 'CONTROLLER'
  origin: 'CLIENT_REQUEST' | 'BUSINESS_RULE' | 'SERVER_PROCESSING'
  clientRequestCause?: 'USER_INPUT' | 'CLIENT_TECHNICAL'
  clientMessage: string        // user-friendly, siempre presente
  detail?: string              // solo en dev
  exception?: string           // solo en dev
  fieldErrors?: FieldValidationError[]
}
```

### Semántica para el frontend

| Combinación | Acción en UI |
|-------------|-------------|
| `origin=CLIENT_REQUEST` + `cause=USER_INPUT` | Mostrar error inline en campo del formulario |
| `origin=BUSINESS_RULE` | Mostrar como violación de regla, ofrecer alternativas |
| `origin=SERVER_PROCESSING` | Mensaje genérico de reintento + log a monitoring |
| `fieldErrors` presente | Mapear errores a campos específicos del formulario |

### Impacto

El `errorNormalizer.ts` actual necesita actualizarse para manejar `layer`, `clientRequestCause` y `fieldErrors`.

---

## Estructura de proyecto recomendada

La guía propone una estructura expandida que difiere de la actual:

### Archivos nuevos documentados pero no implementados

| Archivo | Propósito |
|---------|-----------|
| `src/auth/platformRefresh.ts` | Silent refresh para tokens de plataforma |
| `src/auth/platformLogout.ts` | Logout con revocación de plataforma |
| `src/api/platformUsers.ts` | CRUD de `platform_users` (KEYGO_ADMIN) |
| `src/pages/login/PlatformLoginPage.tsx` | Login de plataforma (PKCE separado) |
| `src/pages/admin/PlatformUsersPage.tsx` | Gestión de usuarios de plataforma |

### Discrepancias con el estado actual

| Aspecto | Guía dice | Estado real |
|---------|-----------|-------------|
| Router | `src/router.tsx` centralizado | Rutas definidas en `src/App.tsx` |
| Layouts | `RootLayout`, `AdminLayout`, `TenantAdminLayout`, `UserLayout` | Solo existe `AdminLayout` |
| Páginas por rol | Directorios `admin/`, `tenant-admin/`, `user/`, `shared/` | Estructura mixta `admin/`, `dashboard/` |
| Auth modules | Platform + tenant separados | Solo flujo tenant implementado |
| API modules | `platformUsers.ts`, `clientApps.ts`, `memberships.ts` | Solo `account.ts`, `billing.ts`, `tenants.ts`, `users.ts`, `serviceInfo.ts` |

---

## Inventario de endpoints (14 secciones)

La guía documenta 14 secciones de endpoints. Estado de cobertura frontend:

| Sección | Endpoints | Frontend API | Estado |
|---------|-----------|-------------|--------|
| 14.0 Platform Auth | 5 | ❌ No existe | Pendiente |
| 14.0.1 Platform Users | 6 | ❌ No existe | Pendiente |
| 14.1 Tenant App Auth | ~12 | ✅ `src/api/auth.ts` | Parcial |
| 14.2 Tenant Management | ~15 | ✅ `src/api/tenants.ts`, `users.ts` | Parcial |
| 14.3 Billing | 12 | ✅ `src/api/billing.ts` | Parcial |
| 14.4 Account | ~8 | ✅ `src/api/account.ts` | Implementado |

---

## Observabilidad: X-Trace-ID

La guía introduce un header simétrico de trazabilidad:

```
Request:  X-Trace-ID: <uuid>  (opcional, frontend lo genera)
Response: X-Trace-ID: <mismo o nuevo>
```

### Recomendación

Agregar al interceptor de Axios:

```typescript
apiClient.interceptors.request.use((config) => {
  config.headers['X-Trace-ID'] = crypto.randomUUID()
  return config
})
```

Y en el manejo de errores, capturar el trace ID para enviarlo a Sentry/DataDog.

---

## Inconsistencias detectadas

1. **Roles legacy sin fecha de deprecación** — La guía dice "ambos formatos aceptados" pero no define cuándo dejar de soportar los legacy.
2. **Direct-login disponible** — Endpoint `POST /platform/account/direct-login` documentado como "API/CLI only" pero sin enforcement del lado del cliente. La SPA no debería usarlo.
3. **Token storage** — La guía no menciona explícitamente la política de almacenamiento (`refreshToken` en `sessionStorage` vs solo memoria). Hay que mantener la convención actual.
4. **Secciones con endpoints pendientes** — El guide dice "56/58 endpoints productivos" pero no identifica cuáles son los 2 parciales.
5. **Naming de tipos wire** — La guía no refleja consistentemente la convención `snake_case` del wire. Algunos ejemplos muestran `camelCase` (artefacto del generador OpenAPI).
