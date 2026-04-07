# Fase B — Dominio y Puertos: Contractor → PlatformUser

---

## 1. Cambios en modelo de dominio

### `Contractor.java` (`keygo-domain/billing/contractor/model/`)

```java
// ANTES
private final UUID tenantUserId;
// Constructor validation: if (tenantUserId == null) throw ...

// DESPUÉS
private final UUID platformUserId;
// Constructor validation: if (platformUserId == null) throw ...
```

**Campos a cambiar:**
- `tenantUserId` → `platformUserId`
- Builder: `.tenantUserId()` → `.platformUserId()`
- Javadoc: actualizar referencia de TenantUser a PlatformUser

**Campos sin cambio:** `id`, `status`, `createdAt`, `updatedAt`, métodos `isActive()`, `activate()`, `suspend()`

### `AppContract.java` (`keygo-domain/billing/contracting/model/`)

**Cambio:** `clientAppId` pasa de `UUID` obligatorio a `UUID` nullable

```java
// ANTES
private final UUID clientAppId; // NOT NULL

// DESPUÉS
private final UUID clientAppId; // nullable — NULL = platform contract
```

**Impacto:** el builder ya no debe validar `clientAppId != null`

### `AppSubscription.java` (`keygo-domain/billing/subscription/model/`)

**Cambio:** `clientAppId` pasa de `UUID` obligatorio a `UUID` nullable

```java
// ANTES
private final UUID clientAppId; // NOT NULL

// DESPUÉS  
private final UUID clientAppId; // nullable — NULL = platform subscription
```

### `AppPlan.java` (`keygo-domain/billing/catalog/model/`)

**Cambio:** `clientAppId` pasa a nullable

### Nuevo enum: `SubscriberType` (si no existe)

Agregar valor `PLATFORM` al enum existente o crear uno nuevo:

```java
public enum SubscriberType {
    TENANT,       // B2B — plan de app para tenants
    TENANT_USER,  // B2C — plan de app para usuarios de tenant
    PLATFORM      // Plan de plataforma KeyGo
}
```

---

## 2. Cambios en puertos

### `ContractorRepositoryPort.java` (`keygo-app/billing/contractor/port/`)

```java
// ANTES
Optional<Contractor> findByTenantUserId(UUID tenantUserId);
Optional<Contractor> findByTenantUserEmail(UUID tenantId, String email);

// DESPUÉS
Optional<Contractor> findByPlatformUserId(UUID platformUserId);
Optional<Contractor> findByPlatformUserEmail(String email);
```

**Notas:**
- `findByPlatformUserEmail` ya no necesita `tenantId` — el email es globalmente único en `platform_users`
- `findByTenantUserId` → `findByPlatformUserId`

### Puertos sin cambio

Los siguientes puertos NO cambian porque trabajan con UUIDs genéricos:

- `AppContractRepositoryPort` — `findById`, `save`, etc.
- `AppSubscriptionRepositoryPort` — `findByClientAppIdAndContractorId` (funciona con nullable clientAppId)
- `AppPlanRepositoryPort` — queries por clientAppId
- `AppPlanVersionRepositoryPort`
- `InvoiceRepositoryPort`
- `AppPlanBillingOptionRepositoryPort`
- `AppPlanEntitlementRepositoryPort`

### Nuevos métodos en puertos existentes

#### `AppPlanRepositoryPort` — nuevo método para planes de plataforma

```java
// Planes de plataforma (client_app_id IS NULL)
List<AppPlan> findPlatformPlans();
Optional<AppPlan> findPlatformPlanByCode(String code);
```

#### `AppSubscriptionRepositoryPort` — nuevo método para suscripción de plataforma

```java
// Suscripción de plataforma (client_app_id IS NULL, contractor_id = X)
Optional<AppSubscription> findPlatformSubscriptionByContractorId(UUID contractorId);
```

#### `InvoiceRepositoryPort` — nuevo método para facturas de plataforma

```java
// Facturas de plataforma (via subscription que tiene client_app_id IS NULL)
List<Invoice> findBySubscriptionId(UUID subscriptionId); // ya existe
```

---

## 3. Nuevos puertos (si se requieren)

No se necesitan puertos nuevos. Los cambios se absorben en los existentes.

---

## 4. Dependencias de puertos a inyectar en use cases

### `VerifyContractEmailUseCase` — cambio de dependencias

```
ELIMINAR:
  - UserRepositoryPort (TenantUser)
  - MembershipRepositoryPort
  - AppRoleRepositoryPort

AGREGAR:
  - PlatformUserRepositoryPort
  - PlatformRoleRepositoryPort
  - AssignPlatformRolePort (o integrado en PlatformUserRepositoryPort)

MANTENER:
  - AppContractRepositoryPort
  - ClientAppRepositoryPort (aún necesario para contratos de app)
  - ContractorRepositoryPort
  - CredentialEncoderPort
  - EmailNotificationPort
```

### `CreateAppContractUseCase` — cambio de dependencias

```
ELIMINAR:
  - ClientAppRepositoryPort (ya no se necesita para resolver "provider tenant")

AGREGAR:
  - (ninguno)

AJUSTAR:
  - ContractorRepositoryPort: findByTenantUserEmail → findByPlatformUserEmail
  - Validación de clientAppId: ahora es opcional

MANTENER:
  - AppContractRepositoryPort
  - AppPlanVersionRepositoryPort
  - EmailNotificationPort
```

### `ActivateAppContractUseCase` — sin cambio de dependencias

El use case ya solo crea Subscription + Invoice. No toca tenants ni users.

---

## 5. Archivos a crear/modificar

| Archivo | Módulo | Acción |
|---------|--------|--------|
| `Contractor.java` | keygo-domain | Modificar: `tenantUserId` → `platformUserId` |
| `AppContract.java` | keygo-domain | Modificar: `clientAppId` nullable |
| `AppSubscription.java` | keygo-domain | Modificar: `clientAppId` nullable |
| `AppPlan.java` | keygo-domain | Modificar: `clientAppId` nullable |
| `SubscriberType.java` | keygo-domain | Modificar: agregar `PLATFORM` |
| `ContractorRepositoryPort.java` | keygo-app | Modificar: nuevos métodos |
| `AppPlanRepositoryPort.java` | keygo-app | Modificar: agregar `findPlatformPlans()` |
| `AppSubscriptionRepositoryPort.java` | keygo-app | Modificar: agregar `findPlatformSubscriptionByContractorId()` |
