# KeyGo UI — Código fuente (`src/`)

Guía de navegación del código fuente para desarrolladores que trabajan en `keygo-ui`.

---

## Estructura general

```
src/
├── main.tsx            # Punto de entrada: monta React + QueryClient + Router
├── App.tsx             # Definición de rutas (React Router 7)
├── vite-env.d.ts       # Tipos de variables de entorno Vite
│
├── auth/               # Todo lo relacionado con autenticación y seguridad
├── api/                # Clientes HTTP y endpoints por dominio
├── pages/              # Vistas organizadas por rol / sección
├── components/         # Componentes reutilizables entre páginas
├── hooks/              # Hooks personalizados compartidos
├── types/              # DTOs y tipos TypeScript
├── mocks/              # MSW handlers para endpoints pendientes
└── styles/
    └── index.css       # Estilos globales (Tailwind CSS v4 @import)
```

---

## `auth/` — Autenticación y seguridad

| Archivo | Responsabilidad |
|---|---|
| `pkce.ts` | Generación de `code_verifier`, `code_challenge` (SHA-256) y `state` para OAuth2 PKCE |
| `tokenStore.ts` | Zustand store — guarda `accessToken`, `idToken`, `refreshToken` y `roles` **en memoria** (nunca en `localStorage`) |
| `jwksVerify.ts` | Verifica `id_token` con RS256 usando JWKS del backend; extrae claims y roles |

> **Regla de oro:** nunca almacenar tokens fuera de Zustand. Ver [`docs/AUTH_FLOW.md`](../docs/AUTH_FLOW.md).

---

## `api/` — Clientes HTTP y contratos

| Archivo | Responsabilidad |
|---|---|
| `client.ts` | Instancias Axios (`authClient` con `withCredentials`, `apiClient` con Bearer) + constantes de URL |
| `auth.ts` | Funciones de autenticación: `authorize`, `login`, `exchangeToken` |
| `contracts.ts` | Endpoints de contratos públicos (nuevo registro de cliente) |

Todas las respuestas siguen `BaseResponse<T>` — ver [`src/types/base.ts`](types/base.ts).

> Antes de añadir o modificar un endpoint, consultar [`docs/api-docs.json`](../docs/api-docs.json) y [`docs/FRONTEND_DEVELOPER_GUIDE.md`](../docs/FRONTEND_DEVELOPER_GUIDE.md).

---

## `pages/` — Vistas por rol y sección

```
pages/
├── landing/        # Página pública: hero, features, precios, CTA, nav
├── login/          # LoginPage — flujo OAuth2/PKCE completo
├── register/       # NewContractPage — alta de nuevo contrato (3 pasos)
│   └── steps/      #   PlanStep, ContractorStep, TermsStep, SuccessStep
└── home/           # Home.tsx — raíz autenticada (redirige por rol)
```

**Convención de routing:**

| Path | Acceso | Descripción |
|---|---|---|
| `/` | Público | Landing page |
| `/login` | Público | Login OAuth2/PKCE |
| `/subscribe` | Público | Registro de nuevo contrato |
| `/admin` | `ADMIN` | Panel de administración global |
| `/tenant-admin` | `ADMIN_TENANT` | Panel de administrador de tenant |
| `/home` | `USER_TENANT` | Portal de usuario |

---

## `components/` — Componentes reutilizables

| Archivo | Descripción |
|---|---|
| `PlanCard.tsx` | Tarjeta de plan con dos modos: `display` (landing, con Link CTA) y `select` (suscripción, como botón con `aria-pressed`) |
| `ScrollToTop.tsx` | Botón flotante (esquina inferior derecha) para volver al top; se oculta cuando `scrollY ≤ 200` |
| `plans.ts` | Fuente única de datos de planes (`PLANS[]`, `PlanInfo`, `PLAN_NAMES`) — importar desde aquí, nunca duplicar |

> Antes de crear un componente nuevo, verificar si existe algo reutilizable aquí o en shadcn/ui.

---

## `hooks/` — Hooks compartidos

Hooks de negocio que encapsulan lógica común entre páginas:

- `useCurrentUser` — datos del usuario autenticado desde el JWT
- `useHasRole` — verifica si el usuario tiene un rol específico
- `useManagedTenant` — tenant activo para `ADMIN_TENANT`

---

## `types/` — DTOs TypeScript

| Archivo | Contenido |
|---|---|
| `base.ts` | `BaseResponse<T>`, `ErrorData`, `ErrorOrigin`, `ClientRequestCause`, `ErrorResponse` |
| `auth.ts` | `AuthorizeData`, `LoginData`, `TokenData`, `JwtClaims` |
| `roles.ts` | `AppRole` union type: `'ADMIN' \| 'ADMIN_TENANT' \| 'USER_TENANT'` |

---

## `mocks/` — MSW para features pendientes

Los endpoints aún no disponibles en el backend se mockan con [MSW](https://mswjs.io/) en `handlers.ts`.
Los componentes que usan datos mockeados incluyen `<PendingFeatureBadge />` para señalarlo visualmente.

---

## Patrones clave

### Flujo de datos
```
API → TanStack Query → Container → props → Presenter
```
Zustand solo para estado global (tokens, sesión).

### Estados async
Siempre manejar los tres estados en cada `useQuery`:
```tsx
if (isLoading) return <Skeleton />
if (isError)   return <ErrorState />
return <DataView data={data} />
```

### Tamaño de componentes
Más de ~150 líneas de JSX es señal para subdividir en subcomponentes o extraer un hook.

### Query keys
Definir en un objeto exportado, nunca como strings sueltos en el código.

---

## Referencias

- [README principal](../README.md) — visión general del producto
- [docs/FRONTEND_DEVELOPER_GUIDE.md](../docs/FRONTEND_DEVELOPER_GUIDE.md) — guía completa de desarrollo
- [docs/AUTH_FLOW.md](../docs/AUTH_FLOW.md) — flujo OAuth2/PKCE
- [docs/BACKLOG.md](../docs/BACKLOG.md) — pendientes y deuda técnica
