# T-111: Implementation Checklist

## Fase A: Modelos de Dominio

- [ ] **A1:** `PlatformRole.java` creado (keygo-domain)
  - [ ] Campos: id, code, name, description
  - [ ] Getters, Setters, Builder
  - [ ] Documentación de dominio
  
- [ ] **A2:** `PlatformUserRole.java` creado (keygo-domain)
  - [ ] Campos: id, userId, platformRoleId, assignedAt
  - [ ] Getters, Setters, Builder
  
- [ ] **A3:** `TenantRole.java` creado (keygo-domain)
  - [ ] Campos: id, tenantId, code, name, description, active
  - [ ] Validación de código
  - [ ] Getters, Setters, Builder
  
- [ ] **A4:** `TenantUserRole.java` creado (keygo-domain)
  - [ ] Campos: id, tenantUserId, tenantRoleId, assignedAt, removedAt
  - [ ] Soporte para soft deletes
  - [ ] Getters, Setters, Builder

---

## Fase B: Entidades JPA

- [ ] **B1:** `PlatformRoleEntity.java` creado (keygo-supabase)
  - [ ] @Entity, @Table, @Getter, @Setter, @Builder
  - [ ] Anotaciones: @GeneratedValue(UUID), @CreationTimestamp, @UpdateTimestamp
  - [ ] Relación @OneToMany → PlatformUserRoleEntity
  - [ ] Sin @Data (usar @Getter + @Setter)
  
- [ ] **B2:** `PlatformUserRoleEntity.java` creado (keygo-supabase)
  - [ ] @ManyToOne → User + PlatformRole
  - [ ] UNIQUE constraint (user_id, platform_role_id)
  
- [ ] **B3:** `TenantRoleEntity.java` creado (keygo-supabase)
  - [ ] @ManyToOne → Tenant
  - [ ] @OneToMany → TenantUserRole
  - [ ] UNIQUE constraint (tenant_id, code)
  - [ ] Campo `active` (boolean)
  
- [ ] **B4:** `TenantUserRoleEntity.java` creado (keygo-supabase)
  - [ ] @ManyToOne → TenantUser + TenantRole
  - [ ] Campo `removedAt` para soft deletes
  - [ ] UNIQUE constraint (tenant_user_id, tenant_role_id) WHERE removed_at IS NULL

---

## Fase C: Repositorios JPA

- [ ] **C1:** `PlatformRoleJpaRepository.java` creado (keygo-supabase)
  - [ ] extends JpaRepository<PlatformRoleEntity, UUID>
  - [ ] Método: findByCode(String)
  - [ ] Método: findAllOrderedByName()
  
- [ ] **C2:** `PlatformUserRoleJpaRepository.java` creado (keygo-supabase)
  - [ ] Método: findByUserId(UUID)
  - [ ] Método: findByUserIdAndPlatformRoleCode(UUID, String)
  - [ ] Método: deleteByUserIdAndPlatformRoleId(UUID, UUID)
  
- [ ] **C3:** `TenantRoleJpaRepository.java` creado (keygo-supabase)
  - [ ] Método: findByTenantIdAndCode(UUID, String)
  - [ ] Método: findByTenantIdAndActive(UUID, boolean)
  - [ ] Método: findByTenantId(UUID)
  
- [ ] **C4:** `TenantUserRoleJpaRepository.java` creado (keygo-supabase)
  - [ ] Método: findByTenantUserId(UUID)
  - [ ] Método: findByTenantUserIdAndRemovedAtNull(UUID)
  - [ ] Método: deleteByTenantUserIdAndTenantRoleId(UUID, UUID)

---

## Fase D: Puertos de Salida

- [ ] **D1:** `PlatformRoleRepositoryPort.java` creado (keygo-app)
  - [ ] Método: Optional<PlatformRole> findByCode(String)
  - [ ] Método: List<PlatformRole> findAllRoles()
  - [ ] Método: PlatformRole save(PlatformRole)
  - [ ] Método: void delete(UUID)
  
- [ ] **D2:** `PlatformUserRoleRepositoryPort.java` creado (keygo-app)
  - [ ] Método: void assignRole(UUID userId, String roleCode)
  - [ ] Método: void revokeRole(UUID userId, String roleCode)
  - [ ] Método: List<String> findRolesByUserId(UUID)
  - [ ] Método: boolean hasRole(UUID userId, String roleCode)
  
- [ ] **D3:** `TenantRoleRepositoryPort.java` creado (keygo-app)
  - [ ] Método: TenantRole create(TenantRole)
  - [ ] Método: Optional<TenantRole> findByTenantAndCode(UUID tenantId, String code)
  - [ ] Método: List<TenantRole> findByTenantId(UUID)
  - [ ] Método: TenantRole update(TenantRole)
  - [ ] Método: void delete(UUID)
  
- [ ] **D4:** `TenantUserRoleRepositoryPort.java` creado (keygo-app)
  - [ ] Método: void assignRole(UUID tenantUserId, UUID tenantRoleId)
  - [ ] Método: void revokeRole(UUID tenantUserId, UUID tenantRoleId)
  - [ ] Método: List<String> findRolesByTenantUserId(UUID)
  - [ ] Método: boolean hasRole(UUID tenantUserId, UUID roleId)

---

## Fase E: Adaptadores JPA

- [ ] **E1:** `SupabasePlatformRoleRepositoryAdapter.java` creado (keygo-supabase)
  - [ ] @Component que implementa PlatformRoleRepositoryPort
  - [ ] Inyecta PlatformRoleJpaRepository
  - [ ] Mapea entidad → modelo
  
- [ ] **E2:** `SupabasePlatformUserRoleRepositoryAdapter.java` creado (keygo-supabase)
  - [ ] @Component que implementa PlatformUserRoleRepositoryPort
  - [ ] Inyecta PlatformUserRoleJpaRepository + PlatformRoleJpaRepository
  - [ ] Validaciones (usuario existe, rol existe)
  
- [ ] **E3:** `SupabaseTenantRoleRepositoryAdapter.java` creado (keygo-supabase)
  - [ ] @Component que implementa TenantRoleRepositoryPort
  - [ ] Inyecta TenantRoleJpaRepository + TenantJpaRepository
  
- [ ] **E4:** `SupabaseTenantUserRoleRepositoryAdapter.java` creado (keygo-supabase)
  - [ ] @Component que implementa TenantUserRoleRepositoryPort
  - [ ] Inyecta TenantUserRoleJpaRepository + TenantUserJpaRepository + TenantRoleJpaRepository
  - [ ] Soft delete con `removed_at`

---

## Fase F: Use Cases

- [ ] **F1:** `AssignPlatformRoleUseCase.java` creado (keygo-app)
  - [ ] Input: userId (UUID), roleCode (String)
  - [ ] Output: PlatformRole
  - [ ] Validar: rol existe, usuario existe
  - [ ] Test: > 80% coverage
  
- [ ] **F2:** `RevokePlatformRoleUseCase.java` creado (keygo-app)
  - [ ] Input: userId (UUID), roleCode (String)
  - [ ] Eliminar asignación
  - [ ] Manejo de excepciones (rol no existe, usuario no tiene rol)
  - [ ] Test: > 80% coverage
  
- [ ] **F3:** `CreateTenantRoleUseCase.java` creado (keygo-app)
  - [ ] Input: tenantId, code, name, description
  - [ ] Output: TenantRole
  - [ ] Validar: tenant existe, código único en tenant
  - [ ] Test: > 80% coverage
  
- [ ] **F4:** `AssignTenantRoleUseCase.java` creado (keygo-app)
  - [ ] Input: tenantUserId, tenantRoleId
  - [ ] Output: TenantUserRole
  - [ ] Validar: ambos existen, no asignados 2 veces
  - [ ] Test: > 80% coverage
  
- [ ] **F5:** `RevokeTenantRoleUseCase.java` creado (keygo-app)
  - [ ] Input: tenantUserId, tenantRoleId
  - [ ] Soft delete: marcar `removed_at`
  - [ ] Idempotente: revoke dos veces debe ser seguro
  - [ ] Test: > 80% coverage

---

## Fase G: Migraciones Flyway

- [ ] **G1:** `V24__platform_roles_and_user_roles.sql` creado (keygo-supabase)
  - [ ] Tabla `platform_roles` con constraint UNIQUE(code)
  - [ ] Tabla `platform_user_roles` con FKs y UNIQUE(user_id, platform_role_id)
  - [ ] Índices creados
  - [ ] Trigger `update_updated_at_column()` aplicado si existe
  - [ ] Sin errores al ejecutar: `./mvnw flyway:migrate`
  
- [ ] **G2:** `V25__tenant_roles_and_user_roles.sql` creado (keygo-supabase)
  - [ ] Tabla `tenant_roles` con constraint UNIQUE(tenant_id, code)
  - [ ] Tabla `tenant_user_roles` con FKs y UNIQUE(tenant_user_id, tenant_role_id) WHERE removed_at IS NULL
  - [ ] Índices creados
  - [ ] Trigger aplicado
  
- [ ] **G3:** `V26__seed_platform_roles_and_tenant_roles.sql` creado (keygo-supabase)
  - [ ] INSERT platform_roles: KEYGO_ADMIN, KEYGO_ACCOUNT_ADMIN, KEYGO_USER
  - [ ] INSERT tenant_roles para tenant `keygo`
  - [ ] INSERT tenant_roles para tenant `demo`
  - [ ] INSERT platform_user_roles (asignar roles a usuarios seed)
  - [ ] INSERT tenant_user_roles (asignar roles a tenantusers seed)
  - [ ] Sin duplicados, sin FK errors
  
- [ ] **G4:** Validar migraciones
  - [ ] `./mvnw -Dspring.profiles.active=supabase -pl keygo-supabase flyway:info`
  - [ ] Ver: 3 migraciones nuevas (V24, V25, V26)
  - [ ] Ver: todas con estado "Success"

---

## Fase H: Configuración Spring

- [ ] **H1:** `ApplicationConfig.java` actualizado (keygo-run)
  - [ ] @Bean para SupabasePlatformRoleRepositoryAdapter
  - [ ] @Bean para SupabasePlatformUserRoleRepositoryAdapter
  - [ ] @Bean para SupabaseTenantRoleRepositoryAdapter
  - [ ] @Bean para SupabaseTenantUserRoleRepositoryAdapter
  
- [ ] **H2:** `SupabaseJpaConfig.java` actualizado (keygo-supabase)
  - [ ] @EntityScan contiene nuevas entidades (si en paquete distinto)
  - [ ] @EnableJpaRepositories contiene nuevos repos (si en paquete distinto)

---

## Fase I: Tests Unitarios

- [ ] **I1:** Tests de dominio
  - [ ] PlatformRoleTest.java (constructores, campos, validaciones)
  - [ ] TenantRoleTest.java (formato de código, validaciones)
  - [ ] PlatformUserRoleTest.java
  - [ ] TenantUserRoleTest.java (soft delete, auditoría)
  - [ ] Cobertura total ≥ 80%
  
- [ ] **I2:** Tests de use cases (con @ExtendWith(MockitoExtension.class))
  - [ ] AssignPlatformRoleUseCaseTest.java (happy path, error cases)
  - [ ] RevokePlatformRoleUseCaseTest.java
  - [ ] CreateTenantRoleUseCaseTest.java (validar código único)
  - [ ] AssignTenantRoleUseCaseTest.java
  - [ ] RevokeTenantRoleUseCaseTest.java (verificar soft delete)
  - [ ] Cada test: Given/When/Then
  - [ ] Cobertura total ≥ 80% por use case
  
- [ ] **I3:** Tests de adaptadores
  - [ ] SupabasePlatformRoleRepositoryAdapterTest.java (con mock JpaRepository)
  - [ ] SupabaseTenantRoleRepositoryAdapterTest.java
  - [ ] SupabasePlatformUserRoleRepositoryAdapterTest.java
  - [ ] SupabaseTenantUserRoleRepositoryAdapterTest.java
  - [ ] Validar mapeos entidad → modelo
  - [ ] Validar manejo de nulls
  
- [ ] **I4:** Validar cobertura global
  - [ ] `./mvnw clean verify` — sin errores
  - [ ] Cobertura JaCoCo ≥ 75% (en módulos nuevos)
  - [ ] Checkstyle sin warnings críticos

---

## Fase J: Documentación

- [ ] **J1:** `docs/design/T-111-implementation/PLAN.md` creado ✅
  
- [ ] **J2:** `docs/design/T-111-implementation/MODEL.md` creado ✅
  
- [ ] **J3:** `docs/design/T-111-implementation/IMPLEMENTATION_CHECKLIST.md` creado (este archivo) ✅
  
- [ ] **J4:** `AGENTS.md` actualizado
  - [ ] Sección "JPA entities" — agregar 4 entidades nuevas
  - [ ] Sección "Existing repositories" — agregar 4 repositorios nuevos
  - [ ] Actualizar tabla de próximas migraciones (V24, V25, V26)
  - [ ] Actualizar tabla de entidades totales
  
- [ ] **J5:** `docs/ai/agents-registro.md` actualizado
  - [ ] Agregar entrada con fecha actual
  - [ ] Resumen: "T-111: Implementación modelo ER multi-ámbito (platform + tenant roles)"
  - [ ] Archivos clave: V24, V25, V26, nuevas entidades/repos
  
- [ ] **J6:** `ROADMAP.md` actualizado
  - [ ] Marcar T-111 como ✅ COMPLETADA
  - [ ] Agregar fecha de completación
  - [ ] Actualizar % alineación RFC (78% → 95%)
  - [ ] Añadir referencia a T-107, T-108, T-109 como siguientes pasos
  
- [ ] **J7:** `docs/ai/lecciones.md` actualizado (si aplica)
  - [ ] Agregar cualquier error resuelto o patrón descubierto
  - [ ] Formato: [YYYY-MM-DD] Título | Contexto | Problema | Solución

---

## Validaciones Finales

- [ ] **Build:** `./mvnw clean package` sin errores
- [ ] **Tests:** `./mvnw test` — todos pasan
- [ ] **Verify:** `./mvnw verify` — JaCoCo OK, checkstyle OK
- [ ] **Swagger:** Accesible en `http://localhost:8080/keygo-server/swagger-ui/` sin errores
- [ ] **Entidades:** Todas las 4 entidades listadas en Swagger schema
- [ ] **Migraciones:** `flyway:info` muestra V24, V25, V26 con estado Success
- [ ] **Sin TODOs:** Grep por "TODO" / "FIXME" relacionados a T-111
- [ ] **Sin hardcoded UUIDs:** Todas las seeds usan subqueries

---

## Sign-off

| Componente | Completado | Aprobado | Notas |
|---|---|---|---|
| A. Modelos dominio | ☐ | ☐ | |
| B. Entidades JPA | ☐ | ☐ | |
| C. Repositorios JPA | ☐ | ☐ | |
| D. Puertos | ☐ | ☐ | |
| E. Adaptadores | ☐ | ☐ | |
| F. Use cases | ☐ | ☐ | |
| G. Migraciones | ☐ | ☐ | |
| H. Config Spring | ☐ | ☐ | |
| I. Tests | ☐ | ☐ | |
| J. Documentación | ☐ | ☐ | |
| **TOTAL T-111** | ☐ | ☐ | **Alineación RFC: 95%** |

---

## Notas Generales

- Mantener alineación con patrones de `AppRole` / `AppRoleHierarchy` existentes
- Todos los campos de auditoría (`created_at`, `updated_at`) deben seguir la convención global
- Sin `@Data` en entidades JPA — usar `@Getter` + `@Setter`
- Tests: mínimo 3 escenarios por use case (happy path, error 1, error 2)
- Documentar en código cualquier decisión no obvia (comentarios)
