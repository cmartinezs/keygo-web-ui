# Feedback UI ↔ Backend

Canal de comunicación activa entre los equipos de UI y backend.
Cada feedback es un archivo independiente dentro de `in/` o `out/`.

## Estructura

| Carpeta | Dirección | Descripción |
|---|---|---|
| [in/](in/README.md) | UI → Backend | Gaps reportados por UI: endpoints faltantes, campos ausentes, tipos incorrectos |
| [out/](out/README.md) | Backend → UI | Cambios notificados por backend: contratos modificados, flujos rediseñados, breaking changes |

## Estados

| Estado | Significado |
|---|---|
| 🔴 Abierto | Reportado, sin respuesta |
| 🟡 En revisión | Reconocido, en evaluación |
| 🟢 Resuelto | Implementado o descartado con justificación |
| ⬛ Archivado | Ya no aplica |

## Convenciones de nombrado

```
in/  → UI-NNN-<slug>.md     ej: UI-001-missing-tenant-stats-endpoint.md
out/ → BE-NNN-<slug>.md     ej: BE-001-membership-activatedat-rename.md
```

Si el feedback deriva en un plan o RFC, referenciar el ID en el archivo (`T-NNN` / `RFC-NNN`).
