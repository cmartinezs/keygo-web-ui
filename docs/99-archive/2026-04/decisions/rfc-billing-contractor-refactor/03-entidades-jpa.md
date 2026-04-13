# Fase C — Entidades JPA, Repositorios, Adapters, Mappers

---

## 1. Cambios en entidades JPA

### `ContractorEntity.java` (`keygo-supabase/billing/entity/`)

```java
// ANTES
@OneToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "tenant_user_id", nullable = false, unique = true)
private TenantUserEntity tenantUser;

// DESPUÉS
@OneToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "platform_user_id", nullable = false, unique = true)
private PlatformUserEntity platformUser;
```

**Imports a cambiar:**
- Eliminar: `import ...user.entity.TenantUserEntity;`
- Agregar: `import ...platform.entity.PlatformUserEntity;`

### `AppPlanEntity.java` (`keygo-supabase/billing/entity/`)

```java
// ANTES
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "client_app_id", nullable = false)
private ClientAppEntity clientApp;

// DESPUÉS
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "client_app_id")  // nullable = true (omitido es default)
private ClientAppEntity clientApp;
```

### `AppContractEntity.java` (`keygo-supabase/billing/entity/`)

```java
// ANTES
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "client_app_id", nullable = false)
private ClientAppEntity clientApp;

// DESPUÉS
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "client_app_id")  // nullable
private ClientAppEntity clientApp;
```

### `AppSubscriptionEntity.java` (`keygo-supabase/billing/entity/`)

```java
// ANTES
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "client_app_id", nullable = false)
private ClientAppEntity clientApp;

// DESPUÉS
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "client_app_id")  // nullable
private ClientAppEntity clientApp;
```

---

## 2. Cambios en repositorios JPA

### `ContractorJpaRepository.java` (`keygo-supabase/billing/repository/`)

```java
// ANTES
Optional<ContractorEntity> findByTenantUserId(UUID tenantUserId);
Optional<ContractorEntity> findByTenantUser_Tenant_IdAndTenantUser_Email(UUID tenantId, String email);

// DESPUÉS
Optional<ContractorEntity> findByPlatformUserId(UUID platformUserId);
Optional<ContractorEntity> findByPlatformUser_Email(String email);
```

### `AppPlanJpaRepository.java` — nuevos métodos

```java
// Planes de plataforma (client_app_id IS NULL)
List<AppPlanEntity> findByClientAppIsNullAndStatusAndIsPublicTrue(AppPlanStatus status);

// Plan de plataforma por código
Optional<AppPlanEntity> findByClientAppIsNullAndCode(String code);
```

### `AppSubscriptionJpaRepository.java` — nuevo método

```java
// Suscripción de plataforma por contractor
Optional<AppSubscriptionEntity> findByClientAppIsNullAndContractor_Id(UUID contractorId);
```

---

## 3. Cambios en adapters

### `ContractorRepositoryAdapter.java` (`keygo-supabase/billing/adapter/`)

**Cambios completos:**

```java
// ANTES
private final TenantUserJpaRepository tenantUserRepo;

// DESPUÉS
private final PlatformUserJpaRepository platformUserRepo;
```

**Método `toEntity()`:**
```java
// ANTES
private ContractorEntity toEntity(Contractor c) {
    return ContractorEntity.builder()
        .tenantUser(tenantUserRepo.getReferenceById(c.getTenantUserId()))
        .status(c.getStatus())
        .build();
}

// DESPUÉS
private ContractorEntity toEntity(Contractor c) {
    return ContractorEntity.builder()
        .platformUser(platformUserRepo.getReferenceById(c.getPlatformUserId()))
        .status(c.getStatus())
        .build();
}
```

**Método `toDomain()`:**
```java
// ANTES
private Contractor toDomain(ContractorEntity e) {
    return Contractor.builder()
        .id(e.getId())
        .tenantUserId(e.getTenantUser().getId())
        .status(e.getStatus())
        ...

// DESPUÉS
private Contractor toDomain(ContractorEntity e) {
    return Contractor.builder()
        .id(e.getId())
        .platformUserId(e.getPlatformUser().getId())
        .status(e.getStatus())
        ...
```

**Métodos de búsqueda:**
```java
// ANTES
@Override
public Optional<Contractor> findByTenantUserId(UUID tenantUserId) {
    return jpaRepo.findByTenantUserId(tenantUserId).map(this::toDomain);
}

@Override
public Optional<Contractor> findByTenantUserEmail(UUID tenantId, String email) {
    return jpaRepo.findByTenantUser_Tenant_IdAndTenantUser_Email(tenantId, email)
        .map(this::toDomain);
}

// DESPUÉS
@Override
public Optional<Contractor> findByPlatformUserId(UUID platformUserId) {
    return jpaRepo.findByPlatformUserId(platformUserId).map(this::toDomain);
}

@Override
public Optional<Contractor> findByPlatformUserEmail(String email) {
    return jpaRepo.findByPlatformUser_Email(email).map(this::toDomain);
}
```

### Adapters de Plan, Subscription — ajustes menores

Los adapters de `AppPlanRepositoryAdapter` y `AppSubscriptionRepositoryAdapter` necesitan:
- Nuevos métodos para planes/suscripciones de plataforma (delegan a los nuevos métodos del JPA repo)
- Mapeo: `clientAppId` puede ser null → manejar en `toDomain()`

---

## 4. Cambios en mapper

### `BillingPersistenceMapper.java` (`keygo-supabase/billing/mapper/`)

**Cambios en mapeo de AppContract y AppSubscription:**

```java
// En toDomain(AppContractEntity):
// ANTES
.clientAppId(e.getClientApp().getId())

// DESPUÉS
.clientAppId(e.getClientApp() != null ? e.getClientApp().getId() : null)
```

Mismo patrón para `toDomain(AppSubscriptionEntity)` y `toDomain(AppPlanEntity)`.

---

## 5. Archivos a crear/modificar

| Archivo | Módulo | Acción |
|---------|--------|--------|
| `ContractorEntity.java` | keygo-supabase | Modificar: FK → PlatformUserEntity |
| `AppPlanEntity.java` | keygo-supabase | Modificar: `clientApp` nullable |
| `AppContractEntity.java` | keygo-supabase | Modificar: `clientApp` nullable |
| `AppSubscriptionEntity.java` | keygo-supabase | Modificar: `clientApp` nullable |
| `ContractorJpaRepository.java` | keygo-supabase | Modificar: nuevos métodos |
| `AppPlanJpaRepository.java` | keygo-supabase | Modificar: nuevos métodos plataforma |
| `AppSubscriptionJpaRepository.java` | keygo-supabase | Modificar: nuevo método plataforma |
| `ContractorRepositoryAdapter.java` | keygo-supabase | Modificar: PlatformUser mapping |
| `AppPlanRepositoryAdapter.java` | keygo-supabase | Modificar: nuevo método plataforma |
| `AppSubscriptionRepositoryAdapter.java` | keygo-supabase | Modificar: nuevo método plataforma |
| `BillingPersistenceMapper.java` | keygo-supabase | Modificar: nullable clientApp |
