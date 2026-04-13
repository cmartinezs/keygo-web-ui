# Fase D — Use Cases: Refactoring del flujo de contratación

---

## 1. `CreateAppContractUseCase` — Ajustes

### Cambios

1. **`clientAppId` ahora es opcional** en el comando:
   - Si `clientAppId == null` → contrato de plataforma
   - Si `clientAppId != null` → contrato de app (comportamiento actual)

2. **Validación de email duplicado** cambia:
   - ANTES: `contractorRepo.findByTenantUserEmail(providerTenantId, email)`
   - DESPUÉS: `contractorRepo.findByPlatformUserEmail(email)`
   - Ya no necesita resolver "provider tenant"

3. **Si es contrato de plataforma** (`clientAppId == null`):
   - No se valida ClientApp
   - El plan version debe pertenecer a un plan de plataforma (`client_app_id IS NULL`)

4. **Si es contrato de app** (`clientAppId != null`):
   - Se valida que ClientApp exista (igual que antes)
   - El plan version debe pertenecer a un plan de esa app

### Dependencias que cambian

```
ELIMINAR:
  - ClientAppRepositoryPort (solo se usaba para resolver provider tenant)
    → AHORA: solo se necesita si clientAppId != null para validar existencia

MANTENER:
  - AppContractRepositoryPort
  - AppPlanVersionRepositoryPort
  - ContractorRepositoryPort (con nuevo método)
  - EmailNotificationPort
```

### Pseudocódigo

```java
public AppContractResult execute(CreateAppContractCommand cmd) {
    // 1. Validar plan version
    var planVersion = versionRepo.findById(cmd.planVersionId())
        .orElseThrow(() -> new PlanVersionNotFoundException(cmd.planVersionId()));

    // 2. Si es contrato de app, validar ClientApp
    if (cmd.clientAppId() != null) {
        clientAppRepo.findById(ClientAppId.of(cmd.clientAppId()))
            .orElseThrow(() -> new IllegalArgumentException("Client app not found"));
    }

    // 3. Validar que no exista contractor con ese email
    contractorRepo.findByPlatformUserEmail(cmd.contractorEmail())
        .ifPresent(existing -> {
            throw new ContractorEmailAlreadyExistsException(cmd.contractorEmail());
        });

    // 4. Crear contrato (clientAppId puede ser null)
    AppContract contract = AppContract.builder()
        .clientAppId(cmd.clientAppId())  // nullable OK
        .selectedPlanVersionId(cmd.planVersionId())
        // ... resto igual
        .build();

    contract = contractRepo.save(contract);
    // ... enviar email verificación
    return new AppContractResult(contract, null);
}
```

---

## 2. `VerifyContractEmailUseCase` — REESCRITURA MAYOR

### Flujo actual (a eliminar)

```
1. Verificar código
2. Resolver provider tenant desde ClientApp
3. Find/Create TenantUser en provider tenant ← ELIMINAR
4. Find/Create Contractor(tenantUserId) ← CAMBIAR
5. Crear Membership + AppRole ADMIN_TENANT ← ELIMINAR
6. Vincular contractor al contrato
```

### Flujo nuevo

```
1. Verificar código
2. Find/Create PlatformUser con email del contrato
3. Asignar KEYGO_USER si es nuevo
4. Asignar KEYGO_TENANT_ADMIN
5. Find/Create Contractor(platformUserId)
6. Vincular contractor al contrato
```

### Dependencias nuevas

```
ELIMINAR:
  - UserRepositoryPort (TenantUser CRUD)
  - MembershipRepositoryPort
  - AppRoleRepositoryPort
  - ClientAppRepositoryPort (ya no resolvemos provider tenant)

AGREGAR:
  - PlatformUserRepositoryPort
  - PlatformRoleRepositoryPort (o AssignPlatformRolePort)

MANTENER:
  - AppContractRepositoryPort
  - ContractorRepositoryPort
  - CredentialEncoderPort
  - EmailNotificationPort
```

### Pseudocódigo

```java
public AppContractResult execute(UUID contractId, String inputCode) {
    var contract = contractRepo.findById(contractId)
        .orElseThrow(() -> new ContractNotFoundException(contractId));

    OffsetDateTime now = OffsetDateTime.now();
    final String email = contract.getContractorEmail();
    final String firstName = contract.getContractorFirstName();
    final String lastName = contract.getContractorLastName();

    // 1. Find or Create PlatformUser
    PlatformUser platformUser = platformUserRepo.findByEmail(email)
        .orElseGet(() -> {
            String rawPassword = generateTemporaryPassword();
            String hashed = credentialEncoder.encode(rawPassword);

            PlatformUser newUser = PlatformUser.builder()
                .email(email)
                .username(generateUsername(firstName, lastName))
                .displayName(firstName + " " + lastName)
                .passwordHash(hashed)
                .status(PlatformUserStatus.ACTIVE)
                .build();

            PlatformUser saved = platformUserRepo.save(newUser);

            // Asignar KEYGO_USER (rol base automático)
            platformRoleRepo.assignRole(saved.getId(), "keygo_user");

            // Enviar credenciales temporales
            emailNotification.sendTemporaryPasswordEmail(
                email, saved.getUsername(), rawPassword);

            return saved;
        });

    // 2. Asignar KEYGO_TENANT_ADMIN si no lo tiene
    if (!platformRoleRepo.hasRole(platformUser.getId(), "keygo_tenant_admin")) {
        platformRoleRepo.assignRole(platformUser.getId(), "keygo_tenant_admin");
    }

    // 3. Find or Create Contractor
    Contractor contractor = contractorRepo.findByPlatformUserId(platformUser.getId())
        .orElseGet(() -> {
            Contractor newContractor = Contractor.builder()
                .id(UUID.randomUUID())
                .platformUserId(platformUser.getId())
                .status(ContractorStatus.PENDING)
                .build();
            return contractorRepo.save(newContractor);
        });

    // 4. Verificar código y vincular contractor
    contract.verifyCode(inputCode, contractor.getId(), now);
    contract = contractRepo.save(contract);

    return new AppContractResult(contract, null);
}
```

### Lo que se ELIMINA del use case

- Resolución de "provider tenant" (`clientAppRepo.findById()`)
- Creación de TenantUser (`userRepo.save()`)
- Creación de Membership (`membershipRepo.save()`)
- Asignación de AppRole ADMIN_TENANT (`appRoleRepo.findByClientAppAndCode()`)
- Generación de username vía `contract.generateUsername()`

---

## 3. `ActivateAppContractUseCase` — Sin cambios funcionales

El use case actual ya solo:
1. Carga contrato
2. Valida estado READY_TO_ACTIVATE + pago verificado + contractor vinculado
3. Crea AppSubscription (con `clientAppId` del contrato — ahora puede ser null)
4. Genera Invoice
5. Marca contrato como ACTIVE

**No crea tenants, ni users, ni memberships.** ✅ Ya es correcto.

**Único ajuste menor:** la búsqueda de suscripción existente (idempotencia):

```java
// ANTES (siempre busca por clientAppId + contractorId)
subscriptionRepo.findByClientAppIdAndContractorId(contract.getClientAppId(), contract.getContractorId())

// DESPUÉS: si clientAppId es null, buscar suscripción de plataforma
if (contract.getClientAppId() == null) {
    subscriptionRepo.findPlatformSubscriptionByContractorId(contract.getContractorId())
} else {
    subscriptionRepo.findByClientAppIdAndContractorId(contract.getClientAppId(), contract.getContractorId())
}
```

---

## 4. Nuevos use cases para billing de plataforma

### `GetPlatformPlanCatalogUseCase`

```java
// Retorna planes de plataforma (client_app_id IS NULL, status ACTIVE, isPublic true)
public List<AppPlan> execute() {
    return planRepo.findPlatformPlans();
}
```

### `GetPlatformPlanUseCase`

```java
// Retorna detalle de un plan de plataforma por código
public AppPlan execute(String planCode) {
    return planRepo.findPlatformPlanByCode(planCode)
        .orElseThrow(() -> new PlanNotFoundException(planCode));
}
```

### `GetPlatformSubscriptionUseCase`

```java
// Retorna suscripción activa del contractor autenticado
public AppSubscription execute(UUID platformUserId) {
    var contractor = contractorRepo.findByPlatformUserId(platformUserId)
        .orElseThrow(() -> new ContractorNotFoundException(platformUserId));
    return subscriptionRepo.findPlatformSubscriptionByContractorId(contractor.getId())
        .orElseThrow(() -> new SubscriptionNotFoundException());
}
```

### `CancelPlatformSubscriptionUseCase`

```java
// Cancelar suscripción de plataforma al fin del período
public AppSubscription execute(UUID platformUserId) {
    var contractor = contractorRepo.findByPlatformUserId(platformUserId)
        .orElseThrow(() -> ...);
    var subscription = subscriptionRepo.findPlatformSubscriptionByContractorId(contractor.getId())
        .orElseThrow(() -> ...);
    subscription.cancelAtPeriodEnd();
    return subscriptionRepo.save(subscription);
}
```

### `ListPlatformInvoicesUseCase`

```java
// Facturas del contractor autenticado (via suscripción de plataforma)
public List<Invoice> execute(UUID platformUserId) {
    var contractor = contractorRepo.findByPlatformUserId(platformUserId)
        .orElseThrow(() -> ...);
    var subscription = subscriptionRepo.findPlatformSubscriptionByContractorId(contractor.getId())
        .orElseThrow(() -> ...);
    return invoiceRepo.findBySubscriptionId(subscription.getId());
}
```

---

## 5. Archivos a crear/modificar

| Archivo | Módulo | Acción |
|---------|--------|--------|
| `CreateAppContractUseCase.java` | keygo-app | Modificar: clientAppId opcional, email check global |
| `CreateAppContractCommand.java` | keygo-app | Modificar: `clientAppId` nullable |
| `VerifyContractEmailUseCase.java` | keygo-app | **Reescribir**: PlatformUser, roles plataforma |
| `ActivateAppContractUseCase.java` | keygo-app | Modificar: búsqueda idempotente nullable |
| `GetPlatformPlanCatalogUseCase.java` | keygo-app | **Crear** |
| `GetPlatformPlanUseCase.java` | keygo-app | **Crear** |
| `GetPlatformSubscriptionUseCase.java` | keygo-app | **Crear** |
| `CancelPlatformSubscriptionUseCase.java` | keygo-app | **Crear** |
| `ListPlatformInvoicesUseCase.java` | keygo-app | **Crear** |
