# T-111: Modelo ER Multi-Ámbito de RBAC — Documentación

## 📖 Índice de Documentos

Este directorio contiene la documentación completa para la **propuesta T-111** del RFC `restructure-multitenant`.

### 1. [PLAN.md](./PLAN.md) — Plan de Implementación Detallado
**Leer primero.** Contiene:
- Resumen ejecutivo y alineación con RFC
- Análisis de estado actual
- Desglose completo de tareas (A → J)
- Dependencias y orden de ejecución
- Criterios de aceptación
- Estimación de esfuerzo (~36 horas / 4-5 días)

**Usa este documento para:** Entender qué se va a implementar, por qué, y en qué orden.

---

### 2. [MODEL.md](./MODEL.md) — Modelo ER y Detalles Técnicos
**Leer segundo.** Contiene:
- Diagrama ER Mermaid (completo, con relaciones existentes)
- Definición detallada de 4 tablas nuevas
- Relaciones cruzadas y queries de ejemplo
- Datos de seed con ejemplos reales
- Mapeos: entidad JPA → modelo de dominio
- Validación de integridad

**Usa este documento para:** Entender la estructura exacta de las tablas, campos, constraints e índices.

---

### 3. [RELATIONS.md](./RELATIONS.md) — Mapeo Completo de Relaciones (NEW)
**Leer si tienes dudas sobre conectividad.** Contiene:
- Diagrama jerárquico de **todas las relaciones** (existentes + nuevas)
- Tabla de conectividad completa (qué tabla apunta a qué)
- Consultas SQL por capas (plataforma, tenant, app)
- Matriz de cambios en esquema (qué se modifica y qué no)
- Prueba de integridad transaccional

**Usa este documento para:** Validar que las 3 capas de RBAC están correctamente conectadas, ver cómo se relacionan las nuevas tablas con las existentes.

---

### 4. [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) — Checklist de Tareas
**Leer mientras trabajas.** Contiene:
- 10 fases (A → J) con todas las tareas detalladas
- Criterios de completación para cada tarea
- Validaciones finales
- Sign-off board

**Usa este documento para:** Marcar progreso, validar completación, detectar qué falta.

---

## 🎯 Resumen Ejecutivo

### El Problema
El sistema actual tiene RBAC implementado **solo para apps** (AppRole):
```
ClientApp → AppRole → AppRoleMembership ✅
```

Pero **faltan 2 de los 3 universos de RBAC** propuestos por el RFC:
```
User → PlatformRole → PlatformUserRole ❌
Tenant → TenantRole → TenantUserRole ❌
```

### La Solución
Crear **4 tablas nuevas** + **modelos dominio** + **repositorios** + **use cases**:

| Tabla | Propósito | FK |
|---|---|---|
| `platform_roles` | Define roles de plataforma (KEYGO_ADMIN, KEYGO_ACCOUNT_ADMIN, etc.) | — |
| `platform_user_roles` | Asigna roles de plataforma a usuarios globales | user_id → users, platform_role_id → platform_roles |
| `tenant_roles` | Define roles a nivel tenant (TENANT_ADMIN, EDITOR, etc.) | tenant_id → tenants |
| `tenant_user_roles` | Asigna roles de tenant a usuarios dentro de un tenant | tenant_user_id → tenant_users, tenant_role_id → tenant_roles |

### Impacto
- **Alineación RFC:** 78% → 95%
- **Criticidad:** 🔴 ALTA (fundamental para RBAC coherente)
- **Esfuerzo:** 36 horas (~4-5 días)
- **Complejidad:** Media (patrones ya existen en AppRole)

---

## 🚀 Guía Rápida de Inicio

### Para Entender la Propuesta
1. Lee el resumen de este archivo (arriba)
2. Lee [PLAN.md](./PLAN.md) — secciones 1-2
3. Lee [MODEL.md](./MODEL.md) — sección 1 (diagrama)
4. Lee [RELATIONS.md](./RELATIONS.md) — sección "Diagrama Jerárquico" (para ver cómo se conectan todas las capas)

**Tiempo:** ~20 minutos

### Para Implementar
1. Completa [PLAN.md](./PLAN.md) — sección 3 (desglose de tareas)
2. Usa [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) para marcar progreso
3. Consulta [MODEL.md](./MODEL.md) para detalles técnicos específicos

**Tiempo:** 36 horas (4-5 días)

### Para Validar
Ejecuta [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) — sección "Validaciones Finales"

**Tiempo:** ~1 hora

---

## 📋 Mapeo a Documentos RFC

| Sección en Estos Docs | RFC Documento | Sección | Decisión |
|---|---|---|---|
| Problema (arriba) | 10-estado-implementacion-actual.md | 2.3 | Modelo ER incompleto (50% alineación) |
| Plan.md — Sección 2 (modelo conceptual) | 08-diagramas-mermaid.md | Sección 2 | Diagrama 08-2: Modelo extendido con roles por ámbito |
| Plan.md — Sección 3.A-J (desglose) | 07-recomendaciones-de-implementacion.md | 2.1 | Formalizar RBAC de Keygo |
| Model.md — Tablas nuevas | 02-modelo-identidad-multitenancy.md | 2 | Capas conceptuales (global / tenant / app) |

---

## 🔄 Dependencias

### Bloqueadores
- ✅ Entidades existentes: `User`, `TenantUser`, `Tenant`, `ClientApp`
- ✅ RFC decisiones: Capas de RBAC separadas (ya decidido en RFC)

### Habilitadores
- ✅ Patrón de AppRole existente (usar como referencia)
- ✅ Migraciones Flyway (V23 es la última disponible)

### Propuestas Futuras
- ⏳ **T-107:** Renombrar roles de Keygo (`ADMIN` → `KEYGO_ADMIN`) — depende de T-111
- ⏳ **T-108:** Crear rol `KEYGO_USER` explícito — depende de T-111
- ⏳ **T-109:** Endpoint `/me/authorization` — depende de T-111

---

## 📚 Referencias Clave

### En el Repositorio
- `AGENTS.md` — Patrones JPA, convenciones de naming
- `ARCHITECTURE.md` — Decisiones de diseño hexagonal
- `docs/rfc/restructure-multitenant/` — RFC completo

### En Este Directorio
- `PLAN.md` — Guía paso a paso
- `MODEL.md` — Especificación técnica
- `IMPLEMENTATION_CHECKLIST.md` — Validaciones

### RFC Específicos
- `10-estado-implementacion-actual.md` — Análisis actual (sección 2.3)
- `08-diagramas-mermaid.md` — Diagrama ER propuesto (sección 2)
- `07-recomendaciones-de-implementacion.md` — Recomendaciones (sección 2.1)

---

## 🎓 Lecciones Aprendidas (de Implementaciones Similares)

### ✅ Do's
- Usar **subqueries** en seeds Flyway para FKs (nunca hardcodear UUIDs)
- Aplicar **trigger** `update_updated_at_column()` en todas las tablas
- Usar **soft deletes** (`removed_at`) para auditoría
- Crear **índices compuestos** en búsquedas frecuentes
- Mantener **separación clara** entre plataforma / tenant / app

### ❌ Don'ts
- ❌ No usar `@Data` en entidades JPA (genera equals/hashCode sobre lazy collections)
- ❌ No inflar JWT con permisos finos (almacenar solo roles)
- ❌ No crear jerarquías de roles en esta fase (guardar para futura propuesta)
- ❌ No mezclar RBAC de plataforma con RBAC de tenant

---

## 📞 Soporte

### Si tienes dudas sobre...
- **La propuesta completa:** Lee [PLAN.md](./PLAN.md)
- **La estructura técnica:** Lee [MODEL.md](./MODEL.md)
- **El progreso:** Usa [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)
- **Decisiones del RFC:** Consulta `docs/rfc/restructure-multitenant/10-estado-implementacion-actual.md`

### Si encuentras problemas...
1. Revisa [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) — validaciones finales
2. Compara con [MODEL.md](./MODEL.md) — especificación exacta
3. Consulta [PLAN.md](./PLAN.md) — notas técnicas (sección 7)

---

## ✅ Definición de "Done"

T-111 estará **completada** cuando:

- [ ] Todas las 4 tablas nuevas existen en PostgreSQL sin errores
- [ ] Todas las 4 entidades JPA compilan sin warnings
- [ ] Todos los 4 repositorios JPA tienen queries funcionales
- [ ] Todos los 5 use cases tienen tests ≥ 80% coverage
- [ ] Migraciones V24, V25, V26 pasan sin errores
- [ ] Build limpio: `./mvnw clean verify`
- [ ] Documentación actualizada en AGENTS.md, ROADMAP.md
- [ ] Alineación RFC: 78% → 95%

**Esfuerzo total:** ~36 horas (4-5 días de desarrollo)

---

## 📅 Changelog

| Fecha | Cambio | Estado |
|---|---|---|
| 2026-04-06 | Creación inicial de PLAN.md, MODEL.md, IMPLEMENTATION_CHECKLIST.md | ✅ |
| — | Fase A-J implementación (a completar) | ⏳ |
| — | Sign-off y actualización ROADMAP.md | ⏳ |

---

**Última actualización:** 2026-04-06  
**RFC versión:** 10-estado-implementacion-actual.md (última revisión)  
**Próxima propuesta:** T-107 (Renombrado roles Keygo)
