# Fase G — Tests: Crear y actualizar

---

## 1. Tests a actualizar (existentes)

### `CreateAppContractUseCaseTest`

- Agregar test: contrato de plataforma (`clientAppId = null`)
- Agregar test: email ya registrado como contractor (nuevo método `findByPlatformUserEmail`)
- Ajustar mocks: `contractorRepo.findByPlatformUserEmail()` en lugar de `findByTenantUserEmail()`
- Eliminar mock de `ClientAppRepositoryPort` si ya no es dependencia obligatoria

### `VerifyContractEmailUseCaseTest`

- **Reescribir completamente** acorde al nuevo flujo:
  - Mock `PlatformUserRepositoryPort` (find/create)
  - Mock `PlatformRoleRepositoryPort` (assignRole, hasRole)
  - Mock `ContractorRepositoryPort` (findByPlatformUserId)
  - Eliminar mocks de `UserRepositoryPort`, `MembershipRepositoryPort`, `AppRoleRepositoryPort`
- Casos:
  - PlatformUser ya existe → find, no create
  - PlatformUser no existe → create + enviar credenciales
  - Contractor ya existe → find, no create
  - Contractor no existe → create PENDING
  - Código inválido → excepción
  - Código expirado → excepción
  - Rol KEYGO_TENANT_ADMIN ya asignado → no duplicar

### `ActivateAppContractUseCaseTest`

- Agregar test: activar contrato de plataforma (`clientAppId = null`)
- Ajustar mock para búsqueda idempotente con `findPlatformSubscriptionByContractorId()`

### `ContractorRepositoryAdapterTest` (si existe)

- Actualizar mapeo: `platformUser` en lugar de `tenantUser`

### `BillingPersistenceMapperTest` (si existe)

- Test de mapeo con `clientApp = null` → `clientAppId = null` en domain

---

## 2. Tests nuevos

### `PlatformBillingControllerTest`

- `GET /platform/billing/catalog` → 200, lista de planes de plataforma
- `GET /platform/billing/catalog/{code}` → 200, detalle de plan
- `GET /platform/billing/catalog/{code}` → 404, plan no encontrado
- `GET /platform/billing/subscription` → 200, suscripción activa
- `GET /platform/billing/subscription` → 401, sin Bearer
- `GET /platform/billing/subscription` → 403, KEYGO_USER sin permiso
- `POST /platform/billing/subscription/cancel` → 200, cancelación exitosa
- `GET /platform/billing/invoices` → 200, lista de facturas

### `GetPlatformPlanCatalogUseCaseTest`

- Retorna lista de planes de plataforma
- Retorna lista vacía si no hay planes

### `GetPlatformPlanUseCaseTest`

- Retorna plan por código
- Lanza excepción si no existe

### `GetPlatformSubscriptionUseCaseTest`

- Retorna suscripción activa por platformUserId
- Lanza excepción si no hay contractor
- Lanza excepción si no hay suscripción

### `CancelPlatformSubscriptionUseCaseTest`

- Cancela suscripción al fin del período
- Lanza excepción si no hay contractor
- Lanza excepción si no hay suscripción

### `ListPlatformInvoicesUseCaseTest`

- Retorna facturas del contractor
- Retorna lista vacía
- Lanza excepción si no hay contractor

---

## 3. Resumen de cobertura

| Use case / Controller | Tests existentes | Tests nuevos | Total estimado |
|----------------------|------------------|--------------|----------------|
| `CreateAppContractUseCase` | ~5 ajustar | 2 nuevos | ~7 |
| `VerifyContractEmailUseCase` | ~8 reescribir | — | ~8 |
| `ActivateAppContractUseCase` | ~5 ajustar | 1 nuevo | ~6 |
| `PlatformBillingController` | — | 8 nuevos | 8 |
| `GetPlatformPlanCatalogUseCase` | — | 2 nuevos | 2 |
| `GetPlatformPlanUseCase` | — | 2 nuevos | 2 |
| `GetPlatformSubscriptionUseCase` | — | 3 nuevos | 3 |
| `CancelPlatformSubscriptionUseCase` | — | 3 nuevos | 3 |
| `ListPlatformInvoicesUseCase` | — | 3 nuevos | 3 |
| **TOTAL** | **~18 ajustar** | **~24 nuevos** | **~42** |

---

## 4. Archivos a crear/modificar

| Archivo | Módulo | Acción |
|---------|--------|--------|
| `CreateAppContractUseCaseTest.java` | keygo-app | Modificar |
| `VerifyContractEmailUseCaseTest.java` | keygo-app | **Reescribir** |
| `ActivateAppContractUseCaseTest.java` | keygo-app | Modificar |
| `PlatformBillingControllerTest.java` | keygo-api | **Crear** |
| `GetPlatformPlanCatalogUseCaseTest.java` | keygo-app | **Crear** |
| `GetPlatformPlanUseCaseTest.java` | keygo-app | **Crear** |
| `GetPlatformSubscriptionUseCaseTest.java` | keygo-app | **Crear** |
| `CancelPlatformSubscriptionUseCaseTest.java` | keygo-app | **Crear** |
| `ListPlatformInvoicesUseCaseTest.java` | keygo-app | **Crear** |
