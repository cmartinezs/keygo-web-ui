---
description: "Use always during any implementation task. Covers the mandatory end-of-implementation consistency review, auto-learning (documenting new patterns), auto-correction checklist, and how to log new features, improvements, or bugs to the project backlog."
---

# Workflow — Auto-aprendizaje, Auto-corrección y Revisión de Consistencia

Estas reglas se aplican **al final de cada implementación**, sin excepción, antes de dar la tarea por terminada.

---

## 0. Pre-implementación — verificar el contrato backend

Antes de escribir cualquier llamada al backend, verificar en orden:

1. **Leer `docs/api-docs.json`** — buscar el path y método en `"paths"`. Confirmar:
   - Path exacto y parámetros requeridos.
   - Schema del body (`requestBody`) y de la respuesta.
   - Si requiere `Authorization: Bearer`.

2. **Leer la sección correspondiente de `docs/FRONTEND_DEVELOPER_GUIDE.md`** — confirmar:
   - El endpoint está marcado como **disponible** (no `⏳ pendiente`).
   - El rol requerido para consumirlo.
   - El flujo completo en contexto del negocio.

3. Si el endpoint es `⏳ pendiente` → crear handler MSW en `src/mocks/handlers.ts` que respete el schema de `api-docs.json` y marcar con `// ⏳ pendiente`.

> **Nota:** Ambos documentos se actualizan cuando el backend cambia. Si hay discrepancia técnica, `api-docs.json` tiene prioridad. Si hay discrepancia de negocio/flujo, el guide tiene prioridad.

---

## 1. Checklist de revisión de consistencia (post-implementación)

Después de cada cambio, verificar los siguientes puntos en orden:

### TypeScript
- [ ] No se usa `any` sin comentario justificado.
- [ ] Los tipos se importan desde `src/types/` (nunca redefinidos localmente).
- [ ] Las interfaces de props tienen nombre `<Component>Props`.
- [ ] No hay imports de tipos con `import` normal cuando se puede usar `import type`.

### Componentes React
- [ ] Named export en componentes reutilizables; `export default` solo en páginas y layouts.
- [ ] No se usa `React.FC<Props>` — props tipadas directamente en el parámetro.
- [ ] No hay `useState` + `fetch` directo — los datos van por `useQuery` / `src/api/`.
- [ ] Ningún token o dato sensible se guarda en `localStorage` / `sessionStorage`.
- [ ] Toda acción en segundo plano que afecte la UI visible notifica al usuario con `toast` de `sonner` (ver `react-components.instructions.md` → "Notificaciones y toasts").

### Reutilización y patrones
- [ ] Antes de crear un componente, se verificó que no existe uno equivalente en `src/components/` o shadcn/ui.
- [ ] La lógica compartida entre componentes está en un hook en `src/hooks/`, no duplicada.
- [ ] Los componentes container y presenter están separados (datos vs. renderizado).
- [ ] No hay más de ~150 líneas de JSX en un solo componente sin subdivisión.
- [ ] Los tres estados async (`isLoading`, `isError`, data) están manejados en cada `useQuery`.
- [ ] Las query keys siguen el patrón de constantes consistente (sin strings sueltos repetidos).
- [ ] `useMemo` / `useCallback` solo presentes donde hay justificación de performance.

### Contrato backend
- [ ] El path y método HTTP usados coinciden con `docs/api-docs.json`.
- [ ] Los tipos de request/response de los DTOs coinciden con los schemas de `api-docs.json`.
- [ ] Si el endpoint no aparece en `api-docs.json` → no implementar sin consultar; en su lugar crear mock.

### API
- [ ] Cada función de API desenvuelve `BaseResponse<T>.data` antes de devolver.
- [ ] Los handlers MSW respetan el shape `BaseResponse<T>` y el schema de `api-docs.json`.
- [ ] Los endpoints pendientes están marcados con `// ⏳ pendiente` y tienen handler MSW.

### Seguridad
- [ ] No hay `client_secret` en código del browser.
- [ ] No se loggea ningún token o claim sensible en consola.
- [ ] Las rutas protegidas tienen `<AuthGuard>` o `<RoleGuard>` en `router.tsx`.

### Estilos
- [ ] Se usan clases Tailwind; no CSS inline (salvo casos excepcionales documentados).
- [ ] Elementos interactivos tienen texto visible o `aria-label`.

### Testing
- [ ] Si se crea un componente nuevo, existe al menos un test básico de render.
- [ ] Los mocks MSW usan el shape correcto de `BaseResponse<T>`.

### Documentación
- [ ] Si se añadió, modificó o eliminó alguna funcionalidad visible para el usuario final → actualizar `docs/FUNCTIONAL_GUIDE.md`.
- [ ] Si se creó o modificó un archivo, módulo, hook, layout o patrón de arquitectura → actualizar `docs/TECHNICAL_GUIDE.md`.
- [ ] La documentación técnica de cada archivo afectado refleja: propósito, integración con otros módulos, decisiones de diseño, estrategia utilizada y deuda técnica conocida.

---

## 2. Auto-corrección

Si al revisar el checklist se detecta un problema:
1. **Corregirlo de inmediato** antes de reportar la tarea como finalizada.
2. Si la corrección afecta a más archivos del mismo tipo, buscarlos y corregirlos también.
3. Informar brevemente qué se corrigió y por qué.

```
✅ Corregido: [api/users.ts] — la función `getUsers` devolvía `BaseResponse<T>` 
completo en lugar de extraer `.data`. Ajustado para consistencia con el resto del módulo.
```

---

## 3. Auto-aprendizaje — documentar nuevos patrones

Si durante la implementación se descubre un patrón, convención o restricción **no documentada** que debería aplicarse en el futuro:

1. Añadirlo a la instruction correspondiente en `.github/instructions/`:
   - Patrón de componente → `react-components.instructions.md`
   - Patrón de API → `api-client.instructions.md`
   - Patrón de auth → `auth.instructions.md`
   - Patrón de estilo → `styling.instructions.md`
   - Patrón de test → `testing.instructions.md`
   - Workflow o convención general → este mismo archivo

2. Usar el formato:
   ```markdown
   **[Aprendido]** <descripción breve del patrón>
   ```
   para que sea fácil de identificar y revisar.

3. Informar al usuario qué se añadió y en qué archivo.

---

## 4. Registro de mejoras, features y correcciones pendientes

Cuando durante el trabajo se detecte:
- Una **mejora** posible al código existente (sin necesidad de hacerla ahora).
- Una **feature** útil que no fue solicitada pero tiene sentido.
- Un **bug** o inconsistencia existente que no es parte de la tarea actual.

Registrar en [docs/BACKLOG.md](../docs/BACKLOG.md) con el siguiente formato:

```markdown
## [TIPO] Título breve
- **Detectado en:** `src/ruta/al/archivo.ts` (línea aproximada)
- **Descripción:** Qué se detectó y por qué merece atención.
- **Prioridad sugerida:** Alta / Media / Baja
- **Fecha:** YYYY-MM-DD
```

Tipos válidos: `[FEATURE]`, `[MEJORA]`, `[BUG]`, `[SEGURIDAD]`, `[REFACTOR]`, `[DEUDA TÉCNICA]`.

> No ejecutar estas mejoras sin que el usuario las solicite explícitamente.
> Solo registrar; la decisión de implementar es del usuario.

---

## 5. Actualización de documentación (obligatoria)

Toda implementación que cambie, añada o elimine comportamiento **debe actualizar la documentación** antes de considerarse finalizada.
Existen dos documentos vivos que deben mantenerse sincronizados con el código:

---

### 5.1 Documentación funcional — `docs/FUNCTIONAL_GUIDE.md`

**Audiencia:** usuario final o product owner. No asume conocimiento técnico.

Actualizar cuando:
- Se añade, modifica o elimina una pantalla, flujo o acción disponible para el usuario.
- Cambia el comportamiento visible de una feature existente.
- Se restringe o amplía el acceso según rol.

Contenido por feature/sección:
- **Qué puede hacer el usuario** en esa pantalla o flujo (lenguaje funcional, no técnico).
- **Quién puede acceder** (rol: `ADMIN`, `ADMIN_TENANT`, `USER_TENANT`, o público).
- **Pasos del flujo** si hay una secuencia relevante.
- **Resultado esperado** al completar la acción.

---

### 5.2 Documentación técnica — `docs/TECHNICAL_GUIDE.md`

**Audiencia:** desarrollador que hereda el proyecto o quiere extenderlo.

Actualizar cuando:
- Se crea o modifica un archivo (componente, hook, módulo de API, layout, tipo, etc.).
- Se introduce un patrón de arquitectura nuevo.
- Se identifica deuda técnica en el archivo afectado.

Por cada archivo creado o modificado, documentar las siguientes secciones:

```markdown
## `src/ruta/al/archivo.ts`

**Propósito:** qué hace y por qué existe este archivo.

**Construcción:** cómo está estructurado internamente (funciones clave, estado, efectos).

**Integración:** con qué otros módulos se conecta y cómo (imports, eventos, props, query keys…).

**Decisión de diseño:** por qué se estructuró de esta forma; qué alternativas se descartaron y por qué.

**Estrategia:** patrón principal aplicado (container/presenter, custom hook, singleton, etc.).

**Puntos de mejora / deuda técnica conocida:** limitaciones actuales, simplificaciones asumidas, qué cambiaría en una siguiente iteración.
```

> Si el archivo ya estaba documentado, actualizar únicamente las secciones afectadas por el cambio.

---

## 6. Resumen post-implementación

Al terminar cada tarea, entregar un resumen breve con esta estructura:

```
### ✅ Implementado
- <qué se hizo>

### 🔍 Revisión de consistencia
- <resultado del checklist — qué estaba bien, qué se corrigió>

### � Documentación actualizada
- **Funcional** (`docs/FUNCTIONAL_GUIDE.md`): <qué sección se actualizó o "sin cambios funcionales visibles">
- **Técnica** (`docs/TECHNICAL_GUIDE.md`): <qué archivos se documentaron o actualizaron>

### �📝 Backlog actualizado (si aplica)
- [TIPO] Título del ítem añadido

### 🧠 Patrón aprendido (si aplica)
- <descripción del nuevo patrón documentado>
```
