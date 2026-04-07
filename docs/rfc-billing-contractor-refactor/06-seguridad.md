# Fase F — Seguridad: BootstrapAdminKeyFilter + paths públicos/protegidos

---

## 1. Nuevos paths públicos

### Catálogo de plataforma

```
/platform/billing/catalog → público (mismo patrón que /billing/catalog de app)
```

**Implementación:** agregar sufijo en `KeyGoBootstrapProperties`:

```java
private String platformBillingCatalogPathPrefix;
```

**application.yml:**
```yaml
keygo:
  bootstrap:
    platform-billing-catalog-path-prefix: "/platform/billing/catalog"
```

**BootstrapAdminKeyFilter** — agregar check:
```java
private boolean isPublicByPrefix(String path) {
    return ...
        || path.startsWith(bootstrapProperties.getPlatformBillingCatalogPathPrefix());
}
```

---

## 2. Paths protegidos (Bearer token requerido)

Los siguientes paths **requieren Bearer** y validan roles vía `@PreAuthorize`:

| Path | Roles requeridos |
|------|------------------|
| `/platform/billing/subscription` | KEYGO_ADMIN, KEYGO_TENANT_ADMIN |
| `/platform/billing/subscription/cancel` | KEYGO_ADMIN, KEYGO_TENANT_ADMIN |
| `/platform/billing/invoices` | KEYGO_ADMIN, KEYGO_TENANT_ADMIN |

Estos paths comienzan con `/platform/` que ya es manejado como ruta de plataforma
en el filtro actual (herencia del RFC restructure-multitenant). Solo necesitamos
asegurar que los paths que NO son `/platform/billing/catalog` pasen por autenticación.

**No se necesita configuración adicional** si `/platform/` ya es un prefijo protegido
y solo `/platform/billing/catalog` está excluido como público.

---

## 3. Resumen de paths billing completo

### Públicos (sin Bearer)

| Path pattern | Razón |
|---|---|
| `*/billing/catalog*` | Catálogo de planes público (app y plataforma) |
| `/billing/contracts*` | Flujo de contratación público |
| `/platform/billing/catalog*` | Catálogo de plataforma público |

### Protegidos (Bearer + roles)

| Path pattern | Roles |
|---|---|
| `*/billing/plans` (POST) | ADMIN, ADMIN_TENANT, KEYGO_ADMIN, KEYGO_TENANT_ADMIN |
| `*/billing/subscription*` | ADMIN, ADMIN_TENANT, KEYGO_ADMIN, KEYGO_TENANT_ADMIN |
| `*/billing/invoices` | ADMIN, ADMIN_TENANT, KEYGO_ADMIN, KEYGO_TENANT_ADMIN |
| `/platform/billing/subscription*` | KEYGO_ADMIN, KEYGO_TENANT_ADMIN |
| `/platform/billing/invoices` | KEYGO_ADMIN, KEYGO_TENANT_ADMIN |

---

## 4. Archivos a crear/modificar

| Archivo | Módulo | Acción |
|---------|--------|--------|
| `KeyGoBootstrapProperties.java` | keygo-run | Modificar: nuevo path prefix |
| `BootstrapAdminKeyFilter.java` | keygo-run | Modificar: check público para catalog plataforma |
| `application.yml` | keygo-run | Modificar: nuevo path en bootstrap |
