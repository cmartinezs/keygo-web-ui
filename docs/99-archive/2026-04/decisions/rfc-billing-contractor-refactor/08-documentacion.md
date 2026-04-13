# Fase H — Documentación

---

## 1. Documentos a actualizar (obligatorios por reglas del proyecto)

### `AGENTS.md` (raíz)

| Sección | Cambio |
|---------|--------|
| Flyway migrations | Agregar V30 con descripción |
| JPA entities | `ContractorEntity`: FK a PlatformUserEntity |
| Repositories | `ContractorJpaRepository`: nuevos métodos |
| Endpoints | Nuevos endpoints `/platform/billing/*` |
| BootstrapAdminKeyFilter | Nuevo path público catálogo plataforma |
| Naming conventions | Confirmar patrón para use cases de plataforma |
| Próxima migración | V31 |

### `docs/ai/agents-registro.md`

Agregar entrada con fecha, resumen de cambios.

### `docs/ai/lecciones.md`

Agregar lección sobre:
- Separación Contractor → PlatformUser
- Billing unificado con `client_app_id` nullable
- Eliminación de acoplamiento con tenant provider

### `docs/ai/propuestas.md` + `ROADMAP.md`

- Marcar como completada la propuesta T-108 (o la que corresponda)
- Registrar nuevas propuestas si surgen

---

## 2. Documentos de diseño a actualizar

### `docs/api/BILLING_FLOW.md`

- Actualizar diagrama de entidades (Contractor → PlatformUser)
- Actualizar diagrama del flujo de contratación (sin TenantUser)
- Agregar sección "Billing de plataforma vs Billing de app"
- Actualizar sección de autenticación (Bearer → platform roles)

### `docs/data/DATA_MODEL.md`

- Tabla `contractors`: `platform_user_id` reemplaza `tenant_user_id`
- Tablas `app_plans`, `app_contracts`, `app_subscriptions`: `client_app_id` nullable
- Nuevo `subscriber_type`: `PLATFORM`
- Diagrama ER actualizado

### `docs/keygo-ui/FRONTEND_DEVELOPER_GUIDE.md`

- §14: Agregar nuevos endpoints `/platform/billing/*`
- Flujo de contratación: el frontend envía `clientAppId: null` para planes de plataforma
- Sección billing: explicar discriminador `clientAppId`

### `docs/postman/KeyGo-Server.postman_collection.json`

Agregar requests:
- `GET Platform Plan Catalog`
- `GET Platform Plan Detail`
- `GET Platform Subscription`
- `POST Platform Cancel Subscription`
- `GET Platform Invoices`
- `POST Create Platform Contract` (clientAppId omitted)

---

## 3. Checklist final

- [ ] `AGENTS.md` actualizado con V30, entidades, endpoints
- [ ] `docs/ai/agents-registro.md` con entrada del cambio
- [ ] `docs/ai/lecciones.md` con lección del refactoring
- [ ] `docs/api/BILLING_FLOW.md` actualizado
- [ ] `docs/data/DATA_MODEL.md` actualizado
- [ ] `docs/keygo-ui/FRONTEND_DEVELOPER_GUIDE.md` actualizado
- [ ] `docs/postman/` con nuevos requests
- [ ] `ROADMAP.md` + `docs/ai/propuestas.md` actualizados
