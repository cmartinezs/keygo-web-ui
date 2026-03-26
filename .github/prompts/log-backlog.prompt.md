---
description: "Log a new feature request, improvement, bug, or technical debt item to the project backlog"
argument-hint: "Type (FEATURE|MEJORA|BUG|SEGURIDAD|REFACTOR|DEUDA TÉCNICA), title, and description"
agent: "agent"
---

Add a new item to the project backlog in [docs/BACKLOG.md](../../docs/BACKLOG.md).

## Instructions

1. Ask for (or infer from context):
   - **Type:** `FEATURE`, `MEJORA`, `BUG`, `SEGURIDAD`, `REFACTOR`, or `DEUDA TÉCNICA`
   - **Title:** Brief, action-oriented title
   - **File/area affected:** Relevant file path or feature area
   - **Description:** What was detected and why it deserves attention
   - **Priority:** Alta / Media / Baja

2. Append the item under `## Ítems pendientes` in `docs/BACKLOG.md` using the format:

```markdown
## [TIPO] Título breve
- **Detectado en:** `src/ruta/al/archivo.ts`
- **Descripción:** Qué se detectó y por qué merece atención.
- **Prioridad sugerida:** Alta / Media / Baja
- **Fecha:** YYYY-MM-DD
```

3. Replace the `_Aún no hay ítems registrados._` placeholder if it's the first item.

4. Do NOT implement the item — only register it.

## Reference files
- [docs/BACKLOG.md](../../docs/BACKLOG.md)

## Expected output

Confirm the item was added:
```
📝 Añadido al backlog:
[TIPO] Título — Prioridad: Alta/Media/Baja
```
