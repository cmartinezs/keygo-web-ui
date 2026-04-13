# RFC: Billing Contractor Refactor — Contractor → PlatformUser + Billing Unificado

> **Estado:** Plan aprobado — pendiente de implementación  
> **Prerequisito:** RFC restructure-multitenant (Fases A–H) completadas  
> **Próxima migración Flyway:** V30

---

## Visión

Separar completamente la identidad del contractor del modelo de tenants, vinculándolo
directamente a `platform_users` (identidad global) y hacer que el billing sea un
concepto unificado que opera a dos niveles:

1. **Billing de plataforma** — KeyGo ofrece planes para usar la plataforma (crear tenants, gestionar apps/usuarios)
2. **Billing de app** — Las apps de los tenants ofrecen planes a sus propios usuarios

El discriminador es `client_app_id`: **NULL = plan de plataforma**, **UUID = plan de app**.

---

## Modelo objetivo

```
┌──────────────────────────────────────────────────────────────────┐
│ PLATAFORMA                                                       │
│                                                                  │
│  PlatformUser ──1:1──► Contractor                                │
│       │                    │                                     │
│       │                    ├── AppContract (client_app_id=NULL)   │
│       │                    │      └── AppSubscription             │
│       │                    │              └── Invoice             │
│       │                    │                                     │
│       │ platform_roles:    │                                     │
│       │ KEYGO_USER         │ (auto al registrarse)               │
│       │ KEYGO_TENANT_ADMIN │ (auto al activar contrato)          │
│       │ KEYGO_ADMIN        │ (manual, solo operadores)           │
│       │                    │                                     │
│  Post-login: Dashboard vacío → "Crea tu primer workspace"        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ TENANT (workspace creado por el contractor)                      │
│                                                                  │
│  Tenant ◄── contractor_id ── Contractor                          │
│    └── ClientApp                                                 │
│           ├── AppPlan (client_app_id=UUID)                       │
│           │      └── AppContract (client_app_id=UUID)            │
│           │             └── AppSubscription                      │
│           │                    └── Invoice                       │
│           └── TenantUser (admin auto-creado al crear tenant)     │
└──────────────────────────────────────────────────────────────────┘
```

---

## Ciclo de vida del contratante

```
1. Se registra en KeyGo       → PlatformUser + KEYGO_USER
2. Contrata plan de plataforma → Contractor + KEYGO_TENANT_ADMIN + Subscription
3. Entra a KeyGo UI           → Dashboard vacío → "Crea tu primer workspace"
4. Crea tenant                → TenantUser admin auto-creado en ese tenant
5. Crea ClientApp en su tenant → Puede ofrecer planes propios (billing de app)
6. Usuarios de esa app        → Se suscriben a planes de la app (billing de app)
```

---

## Endpoints

### Billing de plataforma (nuevo)

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/v1/platform/billing/catalog` | Público | Planes de KeyGo plataforma |
| GET | `/api/v1/platform/billing/catalog/{planCode}` | Público | Detalle plan plataforma |
| GET | `/api/v1/platform/billing/subscription` | Bearer (KEYGO_TENANT_ADMIN) | Suscripción activa |
| POST | `/api/v1/platform/billing/subscription/cancel` | Bearer (KEYGO_TENANT_ADMIN) | Cancelar al fin del período |
| GET | `/api/v1/platform/billing/invoices` | Bearer (KEYGO_TENANT_ADMIN) | Facturas |

### Billing de contratos (existente, ajustado)

| Método | Path | Auth | Cambio |
|--------|------|------|--------|
| POST | `/api/v1/billing/contracts` | Público | `clientAppId` → **opcional** (NULL = plataforma) |
| POST | `/{id}/verify-email` | Público | Crea PlatformUser (no TenantUser) |
| POST | `/{id}/activate` | Público | Solo billing, nada de tenant |

### Billing de app (existente, sin cambios funcionales)

| Método | Path | Auth | Nota |
|--------|------|------|------|
| GET | `/tenants/{slug}/apps/{id}/billing/catalog` | Público | Sin cambio |
| POST | `/tenants/{slug}/apps/{id}/billing/plans` | Bearer ADMIN_TENANT | Sin cambio |
| GET | `/tenants/{slug}/apps/{id}/billing/subscription` | Bearer ADMIN_TENANT | Sin cambio |

---

## Documentos del plan

| Archivo | Fase | Contenido |
|---------|------|-----------|
| `01-migracion-v30.md` | A | Schema changes: contractors, plans, contracts, subscriptions, seeds |
| `02-dominio-y-puertos.md` | B | Contractor domain, ports, port changes |
| `03-entidades-jpa.md` | C | JPA entities, repositories, adapters, mappers |
| `04-use-cases.md` | D | Create/Verify/Activate refactoring + nuevos use cases catalog |
| `05-controllers.md` | E | PlatformBillingController + ajustes a existentes |
| `06-seguridad.md` | F | BootstrapAdminKeyFilter, paths públicos/protegidos |
| `07-tests.md` | G | Tests a crear/actualizar |
| `08-documentacion.md` | H | Docs AI, AGENTS.md, billing flow, data model |

---

## Orden de implementación

```
Fase A (V30) ──► Fase B (dominio) ──► Fase C (JPA) ──► Fase D (use cases)
                                                              │
                                                              ▼
                                      Fase E (controllers) ◄──┘
                                              │
                                              ▼
                                      Fase F (seguridad)
                                              │
                                              ▼
                                      Fase G (tests)
                                              │
                                              ▼
                                      Fase H (documentación)
```

---

## Reglas inquebrantables

- [ ] `contractors.tenant_user_id` desaparece → `contractors.platform_user_id`
- [ ] `client_app_id` nullable en `app_plans`, `app_contracts`, `app_subscriptions`
- [ ] NULL = plan/contrato/suscripción de plataforma
- [ ] UUID = plan/contrato/suscripción de app
- [ ] `VerifyContractEmailUseCase` crea PlatformUser, NO TenantUser
- [ ] `ActivateAppContractUseCase` crea solo billing, NO tenant/user
- [ ] El contratante empieza con dashboard vacío al entrar a KeyGo
- [ ] Imports Jackson: `tools.jackson.databind.*` — nunca `com.fasterxml`
- [ ] Entidades JPA: `@Getter @Setter @Builder` — nunca `@Data`
- [ ] Migración nunca reutiliza ni edita archivos existentes
