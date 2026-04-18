# Estructura del proyecto

La estructura actual del frontend sigue un enfoque **feature-first** con tres capas principales dentro de `src/`: `app`, `features` y `shared`.

## Mapa principal

```text
src/
├── main.tsx
├── App.tsx
├── vite-env.d.ts
├── README.md
├── app/
│   ├── guards/
│   └── layouts/
├── features/
│   ├── account/
│   ├── auth/
│   ├── console/
│   ├── ops/
│   └── public/
├── shared/
│   ├── api/
│   ├── hooks/
│   ├── lib/
│   ├── mocks/
│   ├── types/
│   └── ui/
└── styles/
    └── index.css
```

## Responsabilidad por capa

| Ruta            | Responsabilidad                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `src/main.tsx`  | Bootstrap de la app: i18n, `QueryClientProvider`, `BrowserRouter`, restauración de sesión y activación opcional de MSW.              |
| `src/App.tsx`   | Árbol principal de rutas, guards, layouts, overlays globales, `Toaster` y `DevConsole`.                                              |
| `src/app/`      | Infraestructura de aplicación: guards de routing y layouts compartidos del dashboard.                                                |
| `src/features/` | Módulos funcionales por dominio de negocio. Cada feature concentra pantallas, UI local y APIs específicas del dominio cuando aplica. |
| `src/shared/`   | Código transversal reutilizable: utilidades, tipos, cliente API base, hooks genéricos, mocks y componentes compartidos.              |
| `src/styles/`   | Estilos globales del proyecto.                                                                                                       |

## `src/app/`

| Ruta                              | Responsabilidad                                                 |
| --------------------------------- | --------------------------------------------------------------- |
| `src/app/guards/roleGuard.tsx`    | `AuthGuard` y `RoleGuard` para proteger rutas por sesión y rol. |
| `src/app/layouts/AdminLayout.tsx` | Layout principal del dashboard autenticado; resuelve la identidad visible del usuario combinando claims del token con `getProfile()` para evitar degradar a IDs técnicos tras restaurar sesión. |
| `src/app/layouts/SidebarMenu.tsx` | Navegación lateral y composición del shell principal.           |

## `src/features/`

Los módulos de `features/` agrupan el comportamiento por contexto funcional:

| Ruta                    | Responsabilidad                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/features/public/`  | Superficies públicas: landing y documentación pública para developers.                                      |
| `src/features/auth/`    | Login, recuperación de acceso, logout, registro y contratación.                                             |
| `src/features/account/` | Áreas de cuenta del usuario: perfil, settings, sesiones, seguridad, actividad, conexiones y notificaciones; el módulo de perfil conmuta entre endpoints tenant-scoped y platform-scoped según la sesión activa. |
| `src/features/console/` | Operación autenticada del tenant: dashboard, apps, users, memberships y billing del tenant.                 |
| `src/features/ops/`     | Operación global de plataforma: tenants, platform users, stats, billing y dashboard administrativo.         |

### Submódulos visibles hoy

```text
src/features/auth/
├── api.ts
├── login/
└── register/

src/features/public/
├── docs/
└── landing/

src/features/account/
├── access/
├── activity/
├── connections/
├── notifications/
├── profile/
├── security/
├── sessions/
├── settings/
├── api.ts
├── api.test.ts
└── ui/

src/features/console/
├── apps/
├── billing/
├── dashboard/
├── memberships/
└── users/

src/features/ops/
├── billing/
├── dashboard/
├── platform-users/
├── stats/
├── tenants/
└── serviceInfoApi.ts
```

## `src/shared/`

`shared/` concentra dependencias reutilizables por múltiples features.

| Ruta                | Responsabilidad                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `src/shared/api/`   | Cliente HTTP base, helpers de request/response y normalización de errores compartida.            |
| `src/shared/hooks/` | Hooks genéricos reutilizables como tema, usuario actual y utilidades compartidas.                |
| `src/shared/lib/`   | Infraestructura transversal: auth, config, i18n, network, trace IDs y dev console.               |
| `src/shared/mocks/` | MSW worker y handlers para escenarios temporales o features pendientes.                          |
| `src/shared/types/` | Tipos y DTOs compartidos del proyecto.                                                           |
| `src/shared/ui/`    | Componentes reutilizables globales como overlays, dropdowns, paginator, cards, banners e iconos. El catálogo de planes concentra su traducción dinámica, la compatibilidad por periodicidad y la resolución dinámica del CTA/precio en `PlanCatalogGrid.tsx`, `PlanCard.tsx` y `plans.ts`, evitando textos hardcodeados fuera de `src/shared/lib/i18n/locales/`. |

### Submódulos visibles hoy

```text
src/shared/lib/
├── auth/
├── config/
├── devConsole/
├── i18n/
├── network/
├── featureStatus.ts
└── traceId.ts

src/shared/ui/
├── DevConsole/
├── icons/
├── AppErrorBoundary.tsx
├── BlockingErrorModal.tsx
├── Dropdown.tsx
├── GlobalLoaderOverlay.tsx
├── LocaleSwitcher.tsx
├── Paginator.tsx
├── PendingFeatureBadge.tsx
├── PlanCard.tsx
├── PlanCatalogGrid.tsx
├── SelectDropdown.tsx
├── ServerErrorBanner.tsx
└── ...
```

## Reglas de organización

1. **Feature-first:** la lógica de negocio vive en `features/`; lo transversal va a `shared/`.
2. **Infraestructura aislada:** guards y layouts viven en `app/`, no dentro de una feature específica.
3. **Sin fetch directo en UI:** la integración HTTP pasa por APIs de feature o por `src/shared/api/`.
4. **Tipos compartidos centralizados:** los contratos reutilizados entre módulos viven en `src/shared/types/`.
5. **UI compartida separada:** un componente reutilizable global debe vivir en `src/shared/ui/`; la UI local de un dominio se queda dentro de su feature.

## Lectura recomendada

- [01-system-overview.md](01-system-overview.md)
- [03-auth-and-session.md](03-auth-and-session.md)
- [04-api-integration.md](04-api-integration.md)
