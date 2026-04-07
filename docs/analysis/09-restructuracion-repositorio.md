# 09 — Restructuración del Repositorio: Análisis de la Estructura Propuesta

> Análisis de la propuesta de organización por features con 5 contextos semánticos.

---

## Estructura propuesta

```
src/
  app/                          ← infraestructura de la aplicación
    router/                     ← definición centralizada de rutas
    layouts/                    ← shells de UI por contexto
    guards/                     ← AuthGuard, RoleGuard, PlatformGuard
  features/                     ← módulos por dominio funcional
    public/                     ← sin autenticación
      landing/
      pricing/
      docs/
    auth/                       ← autenticación y registro
      login/
      register/
      forgot-password/
    account/                    ← cuenta del usuario autenticado (self-service)
      profile/
      sessions/
      activity/
    console/                    ← panel del tenant admin / plataforma
      dashboard/
      apps/
      users/
      billing/
    ops/                        ← operaciones de plataforma (super-admin)
      tenants/
      support/
      audit/
  shared/                       ← código reutilizable transversal
    ui/                         ← componentes UI puros (shadcn wrappers, icons, primitives)
    hooks/                      ← hooks genéricos
    lib/                        ← utilidades de infraestructura (network, tracing, etc.)
    api/                        ← cliente HTTP base + interceptores
    utils/                      ← funciones puras de utilidad
```

---

## Filosofía del diseño

La propuesta aplica una organización **feature-first** en lugar de la actual **type-first** (pages/, components/, hooks/, api/).

### Comparación de enfoques

| Aspecto | Actual (type-first) | Propuesto (feature-first) |
|---------|---------------------|--------------------------|
| Organización | Por tipo técnico: `pages/`, `api/`, `hooks/`, `types/` | Por dominio funcional: `features/auth/`, `features/account/` |
| Colocación | Página en `pages/`, su API en `api/`, su tipo en `types/` | Página + API + tipo + hook juntos en `features/X/` |
| Navegabilidad | Fácil encontrar "todos los hooks" | Fácil encontrar "todo lo de billing" |
| Escalabilidad | Se degrada con muchos archivos por carpeta | Escala bien: cada feature es autocontenida |
| Refactoring | Borrar una feature requiere tocar múltiples directorios | Borrar una feature = borrar una carpeta |

---

## Los 5 contextos semánticos

La propuesta define 5 features que mapean directamente a los contextos de acceso del sistema:

### 1. `features/public/` — Sin autenticación

**Propósito:** Todo lo visible sin login.

| Subcarpeta | Contenido actual | Archivos que migrarían |
|------------|-----------------|----------------------|
| `landing/` | Landing page completa | `pages/landing/LandingPage.tsx`, `HeroSection.tsx`, `FeaturesSection.tsx`, etc. (9 componentes) |
| `pricing/` | Catálogo de planes público | `components/PlanCard.tsx`, `PlanCatalogGrid.tsx`, `PlanCardSelect.tsx`, `plans.ts`, `PricingSection.tsx` |
| `docs/` | Documentación para developers | `pages/developers/DeveloperDocsPage.tsx` |

**Observación:** `pricing/` es interesante porque actualmente los componentes de planes están en `components/` (shared) pero son específicos del dominio de billing. Colocarlos bajo `features/public/pricing/` los acerca a su contexto de uso público, pero también se reutilizan en el wizard de registro (`features/auth/register/`). Se necesita decidir: ¿componentes de plan en `shared/ui/` o en `features/public/pricing/` con re-export?

### 2. `features/auth/` — Autenticación y onboarding

**Propósito:** Flujos de entrada al sistema (login, registro, recuperación).

| Subcarpeta | Contenido actual | Archivos que migrarían |
|------------|-----------------|----------------------|
| `login/` | Login + callback | `pages/login/LoginPage.tsx`, `LogoutPage.tsx` + **nuevo** `PlatformLoginPage.tsx` |
| `register/` | Wizard de contrato + registro de usuario | `pages/register/NewContractPage.tsx`, `UserRegisterPage.tsx`, `ResumeContractPage.tsx`, `steps/` (6 pasos) |
| `forgot-password/` | Recuperación | `pages/login/ForgotPasswordPage.tsx`, `RecoverPasswordPage.tsx`, `ResetPasswordPage.tsx` |

**Observación:** Este módulo también albergaría la lógica de PKCE, token exchange y verificación JWKS. Los archivos actuales de `src/auth/` (pkce.ts, tokenStore.ts, jwksVerify.ts, refresh.ts) podrían:
- **Opción A:** Quedarse en `shared/lib/auth/` (son infraestructura transversal, no una feature).
- **Opción B:** Vivir en `features/auth/lib/` (colocación por feature).

**Recomendación:** Opción A — la lógica de PKCE, store y JWKS es consumida por `features/auth/`, `features/console/`, `features/account/` y `app/guards/`. Es infraestructura compartida.

### 3. `features/account/` — Cuenta del usuario (self-service)

**Propósito:** Gestión de la cuenta propia del usuario autenticado, sin importar su rol.

| Subcarpeta | Contenido actual | Archivos que migrarían |
|------------|-----------------|----------------------|
| `profile/` | Perfil y datos personales | `pages/dashboard/user/UserProfilePage.tsx` |
| `sessions/` | Sesiones activas + logout remoto | `pages/dashboard/account/AccountSessionsPage.tsx`, `SessionsList.tsx` |
| `activity/` | Actividad del usuario | `pages/dashboard/user/UserActivityPage.tsx` |

**Archivos adicionales que migrarían:**
- `pages/dashboard/account/AccountSettingsPage.tsx` → `features/account/settings/`
- `pages/dashboard/account/ChangePasswordForm.tsx` → `features/account/security/`
- `pages/dashboard/account/NotificationsPreferencesForm.tsx` → `features/account/notifications/`
- `pages/dashboard/account/ConnectionsPanel.tsx` → `features/account/connections/`
- `pages/dashboard/account/AccountPanelPrimitives.tsx` → `features/account/ui/` o `shared/ui/`
- `pages/dashboard/user/UserMyAccessPage.tsx` → `features/account/access/`

**Observación:** La propuesta original no incluye subcarpetas para `settings/`, `security/`, `notifications/`, `connections/` ni `access/`. Sugiero expandir:

```
features/account/
  profile/
  settings/          ← contenedor de tabs
  security/          ← cambio de contraseña
  sessions/          ← sesiones activas + logout remoto
  notifications/     ← preferencias
  connections/       ← cuentas vinculadas (MSW temporal)
  access/            ← apps y roles del usuario
  activity/          ← log de acciones
```

### 4. `features/console/` — Panel del admin de tenant

**Propósito:** Gestión operativa del workspace/tenant por parte del admin.

| Subcarpeta | Contenido actual | Archivos que migrarían |
|------------|-----------------|----------------------|
| `dashboard/` | Home del dashboard por rol | `pages/dashboard/DashboardHomePage.tsx`, `FeaturePlaceholderPage.tsx`, `FaqCenterPage.tsx` |
| `apps/` | ClientApps del tenant | `pages/dashboard/tenant/TenantAppsPage.tsx` |
| `users/` | Usuarios del tenant | `pages/dashboard/tenant/TenantUsersPage.tsx` |
| `billing/` | Suscripción y facturas | (actualmente distribuido en `api/billing.ts` + vistas pendientes) |

**Archivos adicionales:**
- `pages/dashboard/tenant/TenantMembershipsPage.tsx` → `features/console/memberships/`

**Observación:** El nombre `console/` es bueno — evita confusión con `admin/` (que en el contexto actual mezcla platform admin y tenant admin). Sin embargo, hay que definir: **¿`console/` es para tenant admin o también para platform admin?**

Con el modelo nuevo de dual auth:
- **Contexto platform:** El dashboard de KEYGO_ADMIN (`pages/admin/DashboardPage.tsx`) pertenece a `ops/`, no a `console/`.
- **Contexto tenant:** El dashboard de ADMIN_TENANT pertenece a `console/`.

Esto implica que `features/console/dashboard/` contiene el dashboard del **tenant**, no el de plataforma.

### 5. `features/ops/` — Operaciones de plataforma (super-admin)

**Propósito:** Administración global de la plataforma KeyGo. Solo KEYGO_ADMIN.

| Subcarpeta | Contenido actual | Archivos que migrarían |
|------------|-----------------|----------------------|
| `tenants/` | CRUD de tenants | `pages/admin/TenantsPage.tsx`, `TenantCreatePage.tsx`, `TenantDetailPage.tsx` |
| `support/` | (futuro) Soporte técnico | No existe aún |
| `audit/` | (futuro) Auditoría global | No existe aún |

**Archivos adicionales que migrarían:**
- `pages/admin/DashboardPage.tsx` → `features/ops/dashboard/`
- `pages/admin/dashboard/` (6 componentes de filas) → `features/ops/dashboard/components/`
- `pages/admin/PlatformStatsPage.tsx` → `features/ops/stats/`

**Archivos nuevos que se crearían (post-RFCs):**
- `features/ops/platform-users/` → Gestión de `platform_users` (KEYGO_ADMIN)
- `features/ops/platform-roles/` → Gestión de roles de plataforma

---

## Mapeo de `shared/` — Código transversal

### `shared/ui/`

Componentes UI puros sin lógica de negocio:

| Origen actual | Destino |
|---------------|---------|
| `components/icons/` | `shared/ui/icons/` |
| `components/Dropdown.tsx` | `shared/ui/Dropdown.tsx` |
| `components/SelectDropdown.tsx` | `shared/ui/SelectDropdown.tsx` |
| `components/GlobalLoaderOverlay.tsx` | `shared/ui/GlobalLoaderOverlay.tsx` |
| `components/AppErrorBoundary.tsx` | `shared/ui/AppErrorBoundary.tsx` |
| `components/AppFooter.tsx` | `shared/ui/AppFooter.tsx` |
| `components/BlockingErrorModal.tsx` | `shared/ui/BlockingErrorModal.tsx` |
| `components/ScrollToTop.tsx` | `shared/ui/ScrollToTop.tsx` |
| `components/LocaleSwitcher.tsx` | `shared/ui/LocaleSwitcher.tsx` |
| `components/PendingFeatureBadge.tsx` | `shared/ui/PendingFeatureBadge.tsx` |
| `components/PolicyModal.tsx` | `shared/ui/PolicyModal.tsx` |
| `components/PrivacyPolicyContent.tsx` | `shared/ui/legal/PrivacyPolicyContent.tsx` |
| `components/TermsOfServiceContent.tsx` | `shared/ui/legal/TermsOfServiceContent.tsx` |
| `components/HoneypotField.tsx` | `shared/ui/HoneypotField.tsx` |
| `components/TurnstileWidget.tsx` | `shared/ui/TurnstileWidget.tsx` |
| `components/DevConsole/` | `shared/ui/DevConsole/` |
| `components/dashboard/SidebarMenu.tsx` | `shared/ui/SidebarMenu.tsx` o `app/layouts/SidebarMenu.tsx` |

### `shared/hooks/`

| Origen actual | Destino |
|---------------|---------|
| `hooks/useCurrentUser.ts` | `shared/hooks/useCurrentUser.ts` |
| `hooks/useDropdown.ts` | `shared/hooks/useDropdown.ts` |
| `hooks/useHoneypot.ts` | `shared/hooks/useHoneypot.ts` |
| `hooks/useRateLimit.ts` | `shared/hooks/useRateLimit.ts` |
| `hooks/useTheme.ts` | `shared/hooks/useTheme.ts` |
| `hooks/useTurnstile.ts` | `shared/hooks/useTurnstile.ts` |

### `shared/lib/`

| Origen actual | Destino |
|---------------|---------|
| `auth/pkce.ts` | `shared/lib/auth/pkce.ts` |
| `auth/tokenStore.ts` | `shared/lib/auth/tokenStore.ts` |
| `auth/jwksVerify.ts` | `shared/lib/auth/jwksVerify.ts` |
| `auth/refresh.ts` | `shared/lib/auth/refresh.ts` |
| `auth/blockingErrorStore.ts` | `shared/lib/auth/blockingErrorStore.ts` |
| `lib/network/recovery.ts` | `shared/lib/network/recovery.ts` |
| `lib/traceId.ts` | `shared/lib/traceId.ts` |
| `lib/featureStatus.ts` | `shared/lib/featureStatus.ts` |
| `lib/devConsole/` | `shared/lib/devConsole/` |
| `config/env.ts` | `shared/lib/config/env.ts` |
| `config/network.ts` | `shared/lib/config/network.ts` |
| `i18n/` | `shared/lib/i18n/` |

### `shared/api/`

| Origen actual | Destino | Notas |
|---------------|---------|-------|
| `api/client.ts` | `shared/api/client.ts` | Base Axios + interceptores |
| `api/errorNormalizer.ts` | `shared/api/errorNormalizer.ts` | |
| `api/response.ts` | `shared/api/response.ts` | |
| `api/requestOptions.ts` | `shared/api/requestOptions.ts` | |

**¿Y los módulos de API por dominio?**

Aquí hay una decisión clave. Con feature-first, cada módulo API debería colocarse con su feature:

| Origen actual | Destino feature-first |
|---------------|----------------------|
| `api/auth.ts` | `features/auth/api.ts` |
| `api/account.ts` | `features/account/api.ts` |
| `api/billing.ts` | `features/console/billing/api.ts` + `features/public/pricing/api.ts` |
| `api/contracts.ts` | `features/auth/register/api.ts` |
| `api/tenants.ts` | `features/ops/tenants/api.ts` |
| `api/users.ts` | `features/console/users/api.ts` |
| `api/clientApps.ts` | `features/console/apps/api.ts` |
| `api/memberships.ts` | `features/console/memberships/api.ts` |
| `api/dashboard.ts` | `features/console/dashboard/api.ts` o `features/ops/dashboard/api.ts` |
| `api/serviceInfo.ts` | `features/ops/api.ts` |
| `api/pendingFeatures.ts` | `shared/api/pendingFeatures.ts` |

### `shared/utils/`

No existe actualmente como carpeta dedicada, pero funciones puras de utilidad que no encajan en hooks ni lib irían aquí.

---

## Mapeo de `app/` — Infraestructura de la SPA

### `app/router/`

| Origen actual | Destino |
|---------------|---------|
| `App.tsx` (definición de rutas) | `app/router/index.tsx` |
| — | `app/router/publicRoutes.tsx` |
| — | `app/router/authRoutes.tsx` |
| — | `app/router/accountRoutes.tsx` |
| — | `app/router/consoleRoutes.tsx` |
| — | `app/router/opsRoutes.tsx` |

### `app/layouts/`

| Origen actual | Destino |
|---------------|---------|
| `layouts/AdminLayout.tsx` | `app/layouts/ConsoleLayout.tsx` (renombrado) |
| — | `app/layouts/OpsLayout.tsx` (nuevo, para platform admin) |
| — | `app/layouts/AccountLayout.tsx` (nuevo) |
| — | `app/layouts/PublicLayout.tsx` (nuevo, para landing/auth) |

### `app/guards/`

| Origen actual | Destino |
|---------------|---------|
| `auth/roleGuard.tsx` | `app/guards/RoleGuard.tsx` |
| — | `app/guards/AuthGuard.tsx` |
| — | `app/guards/PlatformGuard.tsx` (nuevo) |
| — | `app/guards/TenantGuard.tsx` (nuevo) |

---

## Types: ¿dónde van?

La propuesta no menciona `types/` explícitamente. Dos opciones:

### Opción A: Types colocados con su feature

```
features/console/users/types.ts     ← TenantUserData
features/ops/tenants/types.ts       ← TenantData
features/auth/types.ts              ← TokenData, JwtClaims
shared/api/types.ts                 ← BaseResponse, ErrorData
```

**Pro:** Máxima colocación. Cada feature es autónoma.  
**Contra:** Tipos compartidos entre features (ej: `TenantData` usado por `ops/` y `console/`) necesitan vivir en `shared/`.

### Opción B: Types centralizados en `shared/types/`

```
shared/types/base.ts
shared/types/auth.ts
shared/types/tenant.ts
shared/types/billing.ts
...
```

**Pro:** Punto único de verdad para DTOs.  
**Contra:** Vuelve al pattern type-first para esta capa.

### Recomendación

**Enfoque híbrido:** Types que son DTOs del backend (wire format) van en `shared/types/` porque son contratos externos. Types internos de UI (props, form schemas) van colocados con su feature.

---

## Compatibilidad con el modelo dual auth

La estructura propuesta se alinea bien con los dos contextos de autenticación:

| Contexto | Feature principal | Rol requerido |
|----------|------------------|---------------|
| Sin auth | `features/public/` | Ninguno |
| Transición | `features/auth/` | Ninguno (público con side-effects) |
| Self-service | `features/account/` | Cualquier rol autenticado |
| Tenant admin | `features/console/` | ADMIN_TENANT / KEYGO_TENANT_ADMIN |
| Platform admin | `features/ops/` | KEYGO_ADMIN |

Cada contexto tiene su propio layout, sus propias rutas, y sus propios guards. La separación es limpia.

---

## Análisis de riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Migración masiva de archivos** — 100+ archivos se mueven | Alto — rompe imports, git blame, PRs abiertos | Hacer en un solo PR dedicado, sin cambios funcionales |
| **Imports rotos** — alias `@/` apunta a `src/` | Medio — todos los imports cambian de path | Usar find-and-replace automatizado + build de verificación |
| **Componentes compartidos entre features** — ej: `PlanCard` usado por `public/pricing/` y `auth/register/` | Medio — decidir dónde vive | Regla: si se usa en >1 feature → `shared/ui/` |
| **API modules distribuidos** — más difícil encontrar "todos los endpoints" | Bajo — es el trade-off de feature-first | Mantener `shared/api/client.ts` como punto central |
| **Curva de aprendizaje** — estructura nueva para quien ya conoce el proyecto | Bajo — la estructura es intuitiva | Documentar en `src/README.md` |

---

## Resumen: estado actual vs propuesto

```
ACTUAL                              PROPUESTO
──────                              ─────────
src/                                src/
├── api/          (15 archivos)     ├── app/
├── auth/         (7 archivos)      │   ├── router/
├── components/   (20+ archivos)    │   ├── layouts/
├── config/       (2 archivos)      │   └── guards/
├── hooks/        (6 archivos)      ├── features/
├── i18n/         (4 archivos)      │   ├── public/    (landing, pricing, docs)
├── layouts/      (1 archivo)       │   ├── auth/      (login, register, forgot)
├── lib/          (6 archivos)      │   ├── account/   (profile, sessions, settings)
├── mocks/        (3 archivos)      │   ├── console/   (dashboard, apps, users, billing)
├── pages/        (30+ archivos)    │   └── ops/       (tenants, support, audit)
├── styles/                         └── shared/
├── types/        (11 archivos)         ├── ui/        (icons, dropdowns, modals, ...)
├── App.tsx                             ├── hooks/     (useCurrentUser, useTheme, ...)
└── main.tsx                            ├── lib/       (auth, i18n, network, config, ...)
                                        ├── api/       (client, errorNormalizer, types)
                                        └── utils/
```

---

## Evaluación final

| Criterio | Puntuación | Justificación |
|----------|-----------|---------------|
| **Alineación con dual auth** | ⭐⭐⭐⭐⭐ | `ops/` = platform, `console/` = tenant, `account/` = self-service — mapa directo a los contextos |
| **Escalabilidad** | ⭐⭐⭐⭐⭐ | Cada feature escala independientemente. Agregar "billing de plataforma" es crear `features/ops/billing/` |
| **Colocación** | ⭐⭐⭐⭐ | Página + API + types juntos por feature. Pierde medio punto por types compartidos |
| **Costo de migración** | ⭐⭐⭐ | ~100 archivos se mueven. Requiere PR dedicado sin cambios funcionales |
| **Navegabilidad** | ⭐⭐⭐⭐ | Intuitivo para nuevos devs: "¿billing? → `features/console/billing/`" |
| **Compatibilidad con convenciones** | ⭐⭐⭐⭐ | Compatible con las convenciones del proyecto (named exports, container/presenter, etc.) |

**Veredicto:** La estructura propuesta es una mejora significativa sobre la actual. Se alinea naturalmente con la arquitectura dual-auth del backend y escala bien para las features futuras. El principal costo es la migración one-time de archivos.
