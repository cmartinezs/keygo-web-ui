---
description: "Use when creating or modifying any UI component, page, form, layout, or interactive element. Enforces the accessibility policy defined in docs/ACCESSIBILITY-CHILE.md (WCAG 2.2 AA, Ley N° 20.422). Apply progressively: every new or modified component must meet these rules."
applyTo: "src/**/*.tsx"
---

# Accesibilidad — Política ACCESSIBILITY-CHILE.md

> Documento normativo completo: [`docs/ACCESSIBILITY-CHILE.md`](../../docs/ACCESSIBILITY-CHILE.md)  
> Estándar técnico objetivo: **WCAG 2.2, nivel AA**  
> Base legal: Ley N° 20.422 (Chile) + Decretos N° 1/2015 y N° 14/2014

---

## Regla general

**La accesibilidad no es una tarea de cierre.** Es un criterio de diseño, implementación y revisión continua.

Cuando exista conflicto entre una implementación visual y la accesibilidad, **prevalece la accesibilidad**.

---

## 1. Semántica HTML primero

```tsx
// ✅ Correcto
<button onClick={handleDelete}>Eliminar</button>
<a href="/dashboard">Ir al panel</a>

// ❌ Prohibido
<div onClick={handleDelete}>Eliminar</div>
<span onClick={goToDashboard}>Ir al panel</span>
```

- Usar `<button>` para acciones, `<a href>` para navegación.
- Usar `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` donde corresponda.
- **No usar ARIA para reparar HTML mal estructurado** cuando la solución es corregir la semántica.
- Jerarquía de headings correcta (`h1` → `h2` → `h3`), nunca saltar niveles por estilo.

---

## 2. Operación por teclado

- Todo flujo crítico debe completarse **solo con teclado**.
- Foco visible en todos los elementos interactivos (no ocultar el outline por CSS sin reemplazo visible).
- Orden de tabulación lógico (`tabIndex` positivo solo como último recurso).
- Sin trampas de teclado (excepto en modales: el foco debe quedar atrapado dentro del modal).
- Menús, diálogos, tabs y formularios deben ser navegables por teclado.

```tsx
// ✅ Foco visible — no eliminar sin alternativa
// En Tailwind, usar focus-visible:ring en lugar de eliminar outline
<button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
```

---

## 3. Nombres accesibles

```tsx
// ✅ Icon button con nombre accesible
<button aria-label="Cerrar diálogo" onClick={onClose}>
  <XIcon aria-hidden="true" />
</button>

// ❌ Icon button sin nombre — indetectable por screen reader
<button onClick={onClose}>
  <XIcon />
</button>
```

- Toda imagen informativa necesita `alt` descriptivo; imágenes decorativas: `alt=""`.
- Los icon buttons requieren `aria-label` o `aria-labelledby`.
- Los svg/icons que acompañan texto: `aria-hidden="true"`.

---

## 4. Formularios

```tsx
// ✅ Label asociado + error accesible
<label htmlFor="email">Correo electrónico</label>
<input
  id="email"
  aria-describedby="email-error"
  aria-invalid={!!errors.email}
/>
{errors.email && (
  <p id="email-error" role="alert">
    {errors.email.message}
  </p>
)}

// ❌ Placeholder como único label
<input placeholder="Correo electrónico" />
```

- **Nunca** usar `placeholder` como reemplazo de `<label>` visible o accesible.
- Asociar errores al campo con `aria-describedby` + `aria-invalid`.
- Errores identificables **por más de color** (ícono + texto + borde).
- Estados `disabled`, `required`, `readonly` e `invalid` comunicados explícitamente.

---

## 5. Componentes dinámicos

### Modales y diálogos
```tsx
// Usar <dialog> nativo o el componente Dialog de shadcn/ui
// que maneja foco, Escape y aria-modal automáticamente
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>…</DialogContent>
</Dialog>
```

- El foco debe entrar al modal al abrirse y volver al elemento disparador al cerrarse.
- Soporte de cierre con `Escape`.
- `aria-modal="true"` en el contenedor del diálogo.

### Mensajes de estado y loading
```tsx
// ✅ Anunciar cambios a screen readers
<div role="status" aria-live="polite">
  {isLoading ? 'Cargando…' : null}
</div>

<div role="alert" aria-live="assertive">
  {error ? error.message : null}
</div>
```

---

## 6. Color y contraste

- El color **no puede ser el único medio** para comunicar información.
- Errores, alertas y estados: color + ícono + texto.
- Links distinguibles sin depender solo del color (subrayado u otro indicador visual).
- Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande (WCAG AA).

---

## 7. Flujos de autenticación

Por requerir especial atención (sección 5.8 de ACCESSIBILITY-CHILE.md):

- Login completamente operable por teclado.
- Labels claros y persistentes en todos los campos.
- Permitir pegar contraseñas (`autocomplete="current-password"`).
- Compatibilidad con gestores de contraseñas.
- Errores de login comprensibles sin exponer información sensible.
- CAPTCHA (Turnstile): asegurar que existe opción alternativa o accesible.
- MFA con experiencia accesible (instrucciones claras, sin timers agresivos).

---

## 8. Responsive y zoom

- La UI debe funcionar en móvil, tablet y desktop.
- No bloquear zoom del navegador (`user-scalable=no` está prohibido).
- Reflow sin pérdida de funcionalidad al redimensionar.
- Evitar scroll horizontal involuntario o overlays rotos en viewports pequeños.

---

## Checklist rápido (aplicar en cada PR que toque UI)

- [ ] Semántica correcta: `button`, `a`, landmarks, headings.
- [ ] Todo operable por teclado, con foco visible.
- [ ] Labels asociados a inputs; errores asociados a campos.
- [ ] Errores comunicados por más de color.
- [ ] Icon buttons tienen `aria-label`; iconos decorativos tienen `aria-hidden="true"`.
- [ ] Modales atrapan el foco y se cierran con `Escape`.
- [ ] Mensajes de estado/carga anunciados con `role`/`aria-live`.
- [ ] UI funcional en móvil y con zoom del navegador.
- [ ] No se usa `placeholder` como único label.
- [ ] Flujos de auth accesibles por teclado.

---

## Herramientas recomendadas

- **axe-core** (vía `@axe-core/react` en dev) — análisis automático en consola.
- **Lighthouse** (Chrome DevTools) — auditoría de accesibilidad integrada.
- **eslint-plugin-jsx-a11y** — lint estático de atributos accesibles (añadir cuando se instale eslint-plugin-react).
- Prueba manual: Tab, Shift+Tab, Enter, Space, Escape, flechas. Sin mouse.
