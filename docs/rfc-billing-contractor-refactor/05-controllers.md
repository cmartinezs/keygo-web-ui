# Fase E — Controllers: Nuevos endpoints de plataforma + ajustes

---

## 1. Nuevo `PlatformBillingController`

**Path base:** `/api/v1/platform/billing`  
**Módulo:** `keygo-api`  
**Package:** `io.cmartinezs.keygo.api.platform.controller`

### Endpoints

| Método | Path | Auth | Use Case |
|--------|------|------|----------|
| GET | `/catalog` | Público | `GetPlatformPlanCatalogUseCase` |
| GET | `/catalog/{planCode}` | Público | `GetPlatformPlanUseCase` |
| GET | `/subscription` | Bearer (KEYGO_TENANT_ADMIN) | `GetPlatformSubscriptionUseCase` |
| POST | `/subscription/cancel` | Bearer (KEYGO_TENANT_ADMIN) | `CancelPlatformSubscriptionUseCase` |
| GET | `/invoices` | Bearer (KEYGO_TENANT_ADMIN) | `ListPlatformInvoicesUseCase` |

### Resolución de identidad

Para endpoints protegidos (subscription, invoices):
- Extraer `platformUserId` del JWT (claim `sub` o `platform_user_id`)
- Pasar al use case para resolver Contractor

```java
@GetMapping("/subscription")
@PreAuthorize("hasAnyRole('KEYGO_ADMIN','KEYGO_TENANT_ADMIN')")
public ResponseEntity<BaseResponse<AppSubscriptionData>> getSubscription(
        Authentication authentication) {
    UUID platformUserId = extractPlatformUserId(authentication);
    var subscription = getPlatformSubscriptionUseCase.execute(platformUserId);
    // ... build BaseResponse
}
```

### Response DTOs

Reutilizar los DTOs existentes de billing:
- `AppPlanData` — ya existe
- `AppPlanDetailData` — ya existe
- `AppSubscriptionData` — ya existe
- `InvoiceData` — ya existe

### ResponseCodes nuevos

```java
PLATFORM_PLAN_CATALOG_RETRIEVED,
PLATFORM_PLAN_RETRIEVED,
PLATFORM_SUBSCRIPTION_RETRIEVED,
PLATFORM_SUBSCRIPTION_CANCELLED,
PLATFORM_INVOICES_RETRIEVED,
```

---

## 2. Ajustes a `AppBillingContractController`

### `CreateAppContractRequest` — `clientAppId` opcional

```java
// ANTES
public record CreateAppContractRequest(
    @NotNull UUID clientAppId,
    @NotNull UUID planVersionId,
    // ...
)

// DESPUÉS
public record CreateAppContractRequest(
    UUID clientAppId,  // nullable: NULL = platform contract
    @NotNull UUID planVersionId,
    // ...
)
```

### Sin otros cambios

Los demás endpoints del contract flow (verify-email, activate, resume, etc.)
trabajan con `contractId` como path variable, no con clientApp.
El flujo es agnóstico al tipo de contrato (plataforma vs app).

---

## 3. Ajustes a `AppBillingSubscriptionController`

### Sin cambios funcionales

Este controller sigue sirviendo suscripciones de **app** (scoped por tenant/clientApp).
La resolución de contractor via `tenant.getContractorId()` sigue siendo válida
para suscripciones de app (el contractor creó ese tenant).

Para suscripciones de **plataforma**, el nuevo `PlatformBillingController` las maneja.

---

## 4. Ajustes a `AppBillingPlanController`

### Sin cambios funcionales

- `GET /billing/catalog` sigue siendo para planes de app (scoped por tenant/clientApp)
- `POST /billing/plans` sigue creando planes de app
- Los planes de plataforma se sirven vía `PlatformBillingController`

---

## 5. Bean wiring en `ApplicationConfig.java` (`keygo-run`)

### Nuevos beans

```java
@Bean
public GetPlatformPlanCatalogUseCase getPlatformPlanCatalogUseCase(
        AppPlanRepositoryPort planRepo) {
    return new GetPlatformPlanCatalogUseCase(planRepo);
}

@Bean
public GetPlatformPlanUseCase getPlatformPlanUseCase(
        AppPlanRepositoryPort planRepo) {
    return new GetPlatformPlanUseCase(planRepo);
}

@Bean
public GetPlatformSubscriptionUseCase getPlatformSubscriptionUseCase(
        ContractorRepositoryPort contractorRepo,
        AppSubscriptionRepositoryPort subscriptionRepo) {
    return new GetPlatformSubscriptionUseCase(contractorRepo, subscriptionRepo);
}

@Bean
public CancelPlatformSubscriptionUseCase cancelPlatformSubscriptionUseCase(
        ContractorRepositoryPort contractorRepo,
        AppSubscriptionRepositoryPort subscriptionRepo) {
    return new CancelPlatformSubscriptionUseCase(contractorRepo, subscriptionRepo);
}

@Bean
public ListPlatformInvoicesUseCase listPlatformInvoicesUseCase(
        ContractorRepositoryPort contractorRepo,
        AppSubscriptionRepositoryPort subscriptionRepo,
        InvoiceRepositoryPort invoiceRepo) {
    return new ListPlatformInvoicesUseCase(contractorRepo, subscriptionRepo, invoiceRepo);
}
```

### Bean modificado: `VerifyContractEmailUseCase`

```java
// ANTES
@Bean
public VerifyContractEmailUseCase verifyContractEmailUseCase(
    AppContractRepositoryPort contractRepo,
    ClientAppRepositoryPort clientAppRepo,
    UserRepositoryPort userRepo,
    ContractorRepositoryPort contractorRepo,
    MembershipRepositoryPort membershipRepo,
    AppRoleRepositoryPort appRoleRepo,
    CredentialEncoderPort credentialEncoder,
    EmailNotificationPort emailNotification) { ... }

// DESPUÉS
@Bean
public VerifyContractEmailUseCase verifyContractEmailUseCase(
    AppContractRepositoryPort contractRepo,
    ContractorRepositoryPort contractorRepo,
    PlatformUserRepositoryPort platformUserRepo,
    PlatformRoleRepositoryPort platformRoleRepo,
    CredentialEncoderPort credentialEncoder,
    EmailNotificationPort emailNotification) { ... }
```

---

## 6. Archivos a crear/modificar

| Archivo | Módulo | Acción |
|---------|--------|--------|
| `PlatformBillingController.java` | keygo-api | **Crear** |
| `CreateAppContractRequest.java` | keygo-api | Modificar: clientAppId nullable |
| `ResponseCode.java` | keygo-api | Modificar: agregar 5 códigos plataforma |
| `ApplicationConfig.java` | keygo-run | Modificar: beans nuevos + ajustar VerifyContract |
