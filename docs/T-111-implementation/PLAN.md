# T-111: Implementación Modelo ER Multi-Ámbito de RBAC

## Resumen Ejecutivo

Implementar el modelo de autorización multi-ámbito del RFC `restructure-multitenant` (doc 10). Actualmente, el sistema tiene RBAC para **apps** (AppRole) pero carece de:
- Roles de **tenant** (no tienen tabla explícita)
- Roles de **plataforma/Keygo** (almacenados en enum, no en tabla)

Este plan crea las tablas faltantes e integra las nuevas entidades JPA, repositorios, puertos y use cases.

**Alineación RFC:** De 78% → ~95% (tras implementar T-111)
**Esfuerzo estimado:** 2-3 días (implementación + tests + docs)
**Criticidad:** 🔴 ALTA — Fundamental para arquitectura limpia de autorización

---

## 1. Análisis de Estado Actual

### ✅ Implementado
- `AppRole` + `AppRoleHierarchyEntity` → Roles de app con soporte de jerarquía
- `AppRoleEntity` vinculado a `ClientAppEntity`
- RFC docs 08-2 diagrama propone 3 universos de RBAC

### ❌ Faltante
1. **Tabla `platform_roles`** — Define roles de plataforma/Keygo (`KEYGO_ADMIN`, `KEYGO_ACCOUNT_ADMIN`, etc.)
2. **Tabla `platform_user_roles`** — Asigna roles de plataforma a `UserEntity` (relación N:N)
3. **Tabla `tenant_roles`** — Define roles a nivel tenant (p.ej., `TENANT_ADMIN`, `TENANT_EDITOR`)
4. **Tabla `tenant_user_roles`** — Asigna roles de tenant a `TenantUserEntity` (relación N:N)
5. **Mapeos en dominio** — Modelos `PlatformRole`, `PlatformUserRole`, `TenantRole`, `TenantUserRole` (en `keygo-domain`)
6. **Entidades JPA** — `PlatformRoleEntity`, `PlatformUserRoleEntity`, `TenantRoleEntity`, `TenantUserRoleEntity` (en `keygo-supabase`)
7. **Repositorios** — `PlatformRoleJpaRepository`, `TenantRoleJpaRepository`, etc.
8. **Puertos de salida** — Interfaces para persistencia (en `keygo-app`)

---

## 2. Modelo Conceptual Propuesto

### Capas de RBAC

```
┌─────────────────────────────────────────────────────┐
│ CAPA DE PLATAFORMA                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ User (global) → PlatformUserRole → PlatformRole │ │
│ │ Roles: KEYGO_ADMIN, KEYGO_ACCOUNT_ADMIN, etc.  │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ CAPA DE TENANT                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ TenantUser → TenantUserRole → TenantRole       │ │
│ │ Roles: TENANT_ADMIN, TENANT_EDITOR, etc.       │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ CAPA DE APP                                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Membership → AppRole (ya existe ✅)             │ │
│ │ Roles: APP_ADMIN, APP_EDITOR, APP_VIEWER, etc. │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 3. Desglose de Tareas

### A. Modelos de Dominio (`keygo-domain`)

#### T-111.A1: Crear modelo `PlatformRole`
- Clase en `keygo-domain/membership/model/PlatformRole.java`
- Campos: `id` (UUID), `code` (String, único), `name`, `description`
- Enums de códigos: `KEYGO_ADMIN`, `KEYGO_ACCOUNT_ADMIN`, `KEYGO_USER`

#### T-111.A2: Crear modelo `PlatformUserRole`
- Clase en `keygo-domain/membership/model/PlatformUserRole.java`
- Representa asignación N:N entre `User` y `PlatformRole`
- Campos: `id`, `userId`, `platformRoleId`, `assignedAt` (Instant)

#### T-111.A3: Crear modelo `TenantRole`
- Clase en `keygo-domain/membership/model/TenantRole.java`
- Campos: `id`, `tenantId`, `code` (String, único + tenantId), `name`, `description`, `active` (boolean)
- Nota: Cada tenant puede definir sus propios roles

#### T-111.A4: Crear modelo `TenantUserRole`
- Clase en `keygo-domain/membership/model/TenantUserRole.java`
- Representa asignación N:N entre `TenantUser` y `TenantRole`
- Campos: `id`, `tenantUserId`, `tenantRoleId`, `assignedAt`, `removedAt` (nullable, para auditoría)

---

### B. Entidades JPA (`keygo-supabase`)

#### T-111.B1: Crear `PlatformRoleEntity`
- `keygo-supabase/membership/entity/PlatformRoleEntity.java`
- Tabla: `platform_roles` (id, code UNIQUE, name, description, created_at, updated_at)
- Anotaciones: `@Entity`, `@Table`, `@Getter`, `@Setter`, `@Builder`, etc.
- Relación: `@OneToMany` → `PlatformUserRoleEntity`

#### T-111.B2: Crear `PlatformUserRoleEntity`
- `keygo-supabase/membership/entity/PlatformUserRoleEntity.java`
- Tabla: `platform_user_roles` (id, user_id FK, platform_role_id FK, assigned_at, created_at, updated_at)
- Anotaciones: Relaciones `@ManyToOne` bidireccionales
- PK compuesta opcional: `UNIQUE(user_id, platform_role_id)` para evitar duplicados

#### T-111.B3: Crear `TenantRoleEntity`
- `keygo-supabase/membership/entity/TenantRoleEntity.java`
- Tabla: `tenant_roles` (id, tenant_id FK, code, name, description, active, created_at, updated_at)
- Anotaciones: `@ManyToOne` → `TenantEntity`, `@OneToMany` → `TenantUserRoleEntity`
- Constraint: `UNIQUE(tenant_id, code)` — cada tenant define roles únicos por código

#### T-111.B4: Crear `TenantUserRoleEntity`
- `keygo-supabase/membership/entity/TenantUserRoleEntity.java`
- Tabla: `tenant_user_roles` (id, tenant_user_id FK, tenant_role_id FK, assigned_at, removed_at, created_at, updated_at)
- Anotaciones: Relaciones `@ManyToOne` bidireccionales
- PK compuesta opcional: `UNIQUE(tenant_user_id, tenant_role_id)` cuando `removed_at IS NULL`

---

### C. Repositorios JPA (`keygo-supabase`)

#### T-111.C1: Crear `PlatformRoleJpaRepository`
- `keygo-supabase/membership/repository/PlatformRoleJpaRepository.java`
- Extiende `JpaRepository<PlatformRoleEntity, UUID>`
- Métodos: `findByCode(String)`, `findAllOrderedByName()`

#### T-111.C2: Crear `PlatformUserRoleJpaRepository`
- `keygo-supabase/membership/repository/PlatformUserRoleJpaRepository.java`
- Métodos: `findByUserId(UUID)`, `findByUserIdAndPlatformRoleCode(UUID, String)`, `deleteByUserIdAndPlatformRoleId(UUID, UUID)`

#### T-111.C3: Crear `TenantRoleJpaRepository`
- `keygo-supabase/membership/repository/TenantRoleJpaRepository.java`
- Métodos: `findByTenantIdAndCode(UUID, String)`, `findByTenantIdAndActive(UUID, boolean)`, `findByTenantId(UUID)`

#### T-111.C4: Crear `TenantUserRoleJpaRepository`
- `keygo-supabase/membership/repository/TenantUserRoleJpaRepository.java`
- Métodos: `findByTenantUserId(UUID)`, `findActiveByTenantUserIdAndTenantRoleCode(UUID, String)`, `deleteByTenantUserIdAndTenantRoleId(UUID, UUID)`

---

### D. Puertos de Salida (`keygo-app`)

#### T-111.D1: Crear `PlatformRoleRepositoryPort`
- `keygo-app/membership/port/PlatformRoleRepositoryPort.java`
- Métodos: `findByCode(String)`, `findAllRoles()`, `save(PlatformRole)`, `delete(UUID)`

#### T-111.D2: Crear `PlatformUserRoleRepositoryPort`
- `keygo-app/membership/port/PlatformUserRoleRepositoryPort.java`
- Métodos: `assignRole(userId, roleCode)`, `revokeRole(userId, roleCode)`, `findRolesByUserId(UUID)`, `hasRole(userId, roleCode)`

#### T-111.D3: Crear `TenantRoleRepositoryPort`
- `keygo-app/membership/port/TenantRoleRepositoryPort.java`
- Métodos: `create(TenantRole)`, `findByTenantAndCode(tenantId, code)`, `findByTenantId(UUID)`, `update(TenantRole)`, `delete(UUID)`

#### T-111.D4: Crear `TenantUserRoleRepositoryPort`
- `keygo-app/membership/port/TenantUserRoleRepositoryPort.java`
- Métodos: `assignRole(tenantUserId, tenantRoleId)`, `revokeRole(tenantUserId, tenantRoleId)`, `findRolesByTenantUserId(UUID)`, `hasRole(tenantUserId, roleId)`

---

### E. Adaptadores JPA (`keygo-supabase`)

#### T-111.E1: Crear `SupabasePlatformRoleRepositoryAdapter`
- `keygo-supabase/membership/adapter/SupabasePlatformRoleRepositoryAdapter.java`
- Implementa `PlatformRoleRepositoryPort`
- Inyecta `PlatformRoleJpaRepository`

#### T-111.E2: Crear `SupabasePlatformUserRoleRepositoryAdapter`
- `keygo-supabase/membership/adapter/SupabasePlatformUserRoleRepositoryAdapter.java`
- Implementa `PlatformUserRoleRepositoryPort`
- Inyecta `PlatformUserRoleJpaRepository` + `PlatformRoleJpaRepository`

#### T-111.E3: Crear `SupabaseTenantRoleRepositoryAdapter`
- `keygo-supabase/membership/adapter/SupabaseTenantRoleRepositoryAdapter.java`
- Implementa `TenantRoleRepositoryPort`

#### T-111.E4: Crear `SupabaseTenantUserRoleRepositoryAdapter`
- `keygo-supabase/membership/adapter/SupabaseTenantUserRoleRepositoryAdapter.java`
- Implementa `TenantUserRoleRepositoryPort`

---

### F. Use Cases (`keygo-app`)

#### T-111.F1: Crear `AssignPlatformRoleUseCase`
- `keygo-app/membership/usecase/AssignPlatformRoleUseCase.java`
- Entrada: `userId`, `roleCode`
- Salida: `PlatformRole`
- Lógica: Validar role existe, validar usuario existe, crear `PlatformUserRole`

#### T-111.F2: Crear `RevokePlatformRoleUseCase`
- Entrada: `userId`, `roleCode`
- Lógica: Eliminar `PlatformUserRole`

#### T-111.F3: Crear `CreateTenantRoleUseCase`
- Entrada: `tenantId`, `code`, `name`, `description`
- Salida: `TenantRole`
- Lógica: Validar tenant existe, crear rol, devolver

#### T-111.F4: Crear `AssignTenantRoleUseCase`
- Entrada: `tenantUserId`, `tenantRoleId`
- Salida: `TenantUserRole`
- Lógica: Validar ambos existen, crear asignación

#### T-111.F5: Crear `RevokeTenantRoleUseCase`
- Entrada: `tenantUserId`, `tenantRoleId`
- Lógica: Eliminar asignación de rol (soft delete con `removed_at`)

---

### G. Migraciones Flyway

#### T-111.G1: Crear `V24__platform_roles_and_user_roles.sql`
- Tabla `platform_roles`: id (UUID), code (VARCHAR 50 UNIQUE), name, description, created_at, updated_at
- Tabla `platform_user_roles`: id (UUID), user_id (FK → users), platform_role_id (FK → platform_roles), assigned_at (TIMESTAMPTZ), created_at, updated_at
- Constraint UNIQUE(user_id, platform_role_id)
- Índices en user_id, platform_role_id

#### T-111.G2: Crear `V25__tenant_roles_and_user_roles.sql`
- Tabla `tenant_roles`: id (UUID), tenant_id (FK → tenants), code (VARCHAR 50), name, description, active (BOOLEAN DEFAULT true), created_at, updated_at
- Constraint: UNIQUE(tenant_id, code)
- Tabla `tenant_user_roles`: id (UUID), tenant_user_id (FK → tenant_users), tenant_role_id (FK → tenant_roles), assigned_at (TIMESTAMPTZ), removed_at (TIMESTAMPTZ NULLABLE), created_at, updated_at
- Constraint: UNIQUE(tenant_user_id, tenant_role_id) WHERE removed_at IS NULL
- Índices en tenant_user_id, tenant_role_id

#### T-111.G3: Crear `V26__seed_platform_roles_and_tenant_roles.sql`
- Seed `platform_roles` con códigos: `KEYGO_ADMIN`, `KEYGO_ACCOUNT_ADMIN`, `KEYGO_USER`
- Seed `tenant_roles` para tenant `keygo`: `KEYGO_ADMIN_INTERNAL`, `KEYGO_EDITOR`, `KEYGO_VIEWER`
- Seed `tenant_roles` para tenant `demo`: `DEMO_ADMIN`, `DEMO_USER`
- Asignar roles a usuarios seed:
  - `keygo_admin` (User) → `KEYGO_ADMIN` (platform role)
  - `keygo_tenant_admin` (User) → `KEYGO_ACCOUNT_ADMIN` (platform role)
  - `keygo_admin` (TenantUser en keygo) → `KEYGO_ADMIN_INTERNAL` (tenant role)
  - `demo_admin` (TenantUser en demo) → `DEMO_ADMIN` (tenant role)

---

### H. Configuración Spring (`keygo-run`)

#### T-111.H1: Agregar `@Bean` en `ApplicationConfig`
- Wiring de adaptadores para puertos de roles de plataforma
- Wiring de adaptadores para puertos de roles de tenant

#### T-111.H2: Actualizar `SupabaseJpaConfig`
- Agregar `@EntityScan` para nuevas entidades (si se crean en paquete distinto)
- Agregar `@EnableJpaRepositories` para nuevos repos (si aplica)

---

### I. Tests Unitarios

#### T-111.I1: Tests de modelos de dominio
- `PlatformRoleTest`, `PlatformUserRoleTest`, `TenantRoleTest`, `TenantUserRoleTest`
- Validar constructores, métodos de negocio, invariantes

#### T-111.I2: Tests de use cases
- `AssignPlatformRoleUseCaseTest` (MockAssignmentPort)
- `RevokePlatformRoleUseCaseTest`
- `CreateTenantRoleUseCaseTest`
- `AssignTenantRoleUseCaseTest`
- `RevokeTenantRoleUseCaseTest`
- Cada test: mock de puertos, validar lógica de negocio, excepciones

#### T-111.I3: Tests de adaptadores JPA (integración ligera)
- `SupabasePlatformRoleRepositoryAdapterTest` (mock JpaRepository)
- `SupabaseTenantRoleRepositoryAdapterTest`
- Validar transformación entre entidad y modelo

#### T-111.I4: Tests de repositorios (Testcontainers)
- Validar queries generadas (findByCode, findByTenantId, etc.)
- Validar constraints únicos
- Validar índices
- (Opcional si hay tests de integración establecidos)

---

### J. Documentación

#### T-111.J1: Crear `docs/design/T-111-implementation/PLAN.md`
- Copia de este plan (versión permanente) ✅

#### T-111.J2: Crear `docs/design/T-111-implementation/MODEL.md`
- Diagrama ER de las nuevas tablas
- Descripción de cada tabla, campo, constraint
- Relaciones N:N
- Ejemplos de datos

#### T-111.J3: Crear `docs/design/T-111-implementation/IMPLEMENTATION_CHECKLIST.md`
- Checklist de tareas completadas
- Validaciones realizadas

#### T-111.J4: Actualizar `AGENTS.md`
- Agregar nuevas entidades a la tabla de entidades JPA
- Agregar nuevos repositorios
- Actualizar `docs/ai/agents-registro.md` con fecha y resumen de cambio

#### T-111.J5: Actualizar `ROADMAP.md`
- Marcar T-111 como ✅ COMPLETADA
- Fecha de completación
- Referencia a propuestas futuras (T-107, T-108, T-109)

---

## 4. Dependencias y Orden de Ejecución

```
T-111.A (Modelos dominio)
   ↓
T-111.B (Entidades JPA)
   ↓
T-111.C (Repositorios JPA)
   ↓
T-111.D (Puertos de salida)
   ↓
T-111.E (Adaptadores) + T-111.G (Migraciones)  [parallelizable]
   ↓
T-111.F (Use cases)
   ↓
T-111.H (Config Spring)
   ↓
T-111.I (Tests) [parallelizable]
   ↓
T-111.J (Documentación)
```

---

## 5. Criterios de Aceptación

- [ ] Todas las tablas creadas sin errores en Flyway
- [ ] Todas las entidades JPA compilables
- [ ] Todos los repositorios ejecutables (sin queries rotas)
- [ ] Todos los use cases tienen tests unitarios con cobertura ≥ 80%
- [ ] Seeds insertados correctamente en V26
- [ ] Sin conflictos de FK entre migraciones
- [ ] Documentación reflejada en AGENTS.md, ROADMAP.md
- [ ] Tests pasan: `./mvnw clean verify`
- [ ] Swagger UI accesible sin errores de entidades desconocidas

---

## 6. Cambios Relacionados (Para Futuro)

Una vez completado T-111, el siguiente paso lógico es:

- **T-107:** Renombrado de roles de Keygo (`ADMIN` → `KEYGO_ADMIN`)
  - Impactará código + migraciones
  - Depende de T-111 (roles como tabla)
  
- **T-108:** Crear rol `KEYGO_USER` explícito
  - Agregar en V26.sql seed

- **T-109:** Endpoint `/me/authorization`
  - Use case que consulta roles de plataforma + tenant + app

---

## 7. Notas Técnicas

### Jackson 3 & Spring Boot 4
- Usar imports `tools.jackson.databind.*` en adaptadores JSON (si aplica)

### Lombok
- Usar `@Getter`, `@Setter`, `@Builder` en entidades JPA
- **NO usar `@Data`** (genera equals/hashCode sobre colecciones lazy → bugs)

### Flyway
- Usar subqueries para FKs en seeds (nunca hardcodear UUIDs)
- Cada migración debe ser idempotente (V<n> nunca se ejecuta 2 veces en prod)

### Hexagonal
- Puertos en `keygo-app`, implementaciones en `keygo-supabase`
- `keygo-domain` SIN Spring, SIN dependencias internas

### Testing
- Unit tests en módulo específico (eg. `keygo-app/src/test/...`)
- Mock puertos con `@Mock` en use cases
- Usar AssertJ + Mockito

---

## 8. Estimación de Esfuerzo

| Componente | Horas | Notas |
|---|---|---|
| A. Modelos dominio | 3 | Straightforward |
| B. Entidades JPA | 3 | Relaciones, constraints |
| C. Repositorios JPA | 2 | Queries simples |
| D. Puertos | 2 | Interfaces, documentación |
| E. Adaptadores | 4 | Mapeos, error handling |
| F. Use cases | 6 | Lógica de negocio, validaciones |
| G. Migraciones | 4 | Scripts SQL, seeds |
| H. Config Spring | 1 | @Bean wiring |
| I. Tests unitarios | 8 | Cobertura, edge cases |
| J. Documentación | 3 | Diagramas, actualización docs |
| **TOTAL** | **36 horas** | **~4-5 días de desarrollo** |

---

## 9. Referencias

- RFC documento 08-diagramas-mermaid.md (diagrama 08-2)
- RFC documento 10-estado-implementacion-actual.md (sección 2.3)
- RFC documento 07-recomendaciones-de-implementacion.md (sección 2.1)
- `AGENTS.md` — Convenciones de naming, patrones JPA
- `ARCHITECTURE.md` — Decisiones de diseño
- `docs/design/email/` — Ejemplo de documentación de feature
