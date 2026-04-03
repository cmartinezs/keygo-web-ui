---
description: "Use when adding or modifying styles, creating UI components, working with Tailwind CSS classes, or using shadcn/ui components."
applyTo: "src/**/*.{tsx,css}"
---

# Estilos — Tailwind CSS v4 + shadcn/ui

## Principios generales

- Usar **Tailwind CSS v4** con clases utilitarias directamente en JSX — no CSS modules ni `styled-components`.
- Componentes de UI complejos (diálogos, tablas, formularios): usar **shadcn/ui** como base.
- No escribir CSS custom salvo en `src/styles/index.css` para variables globales o fuentes.

## Tailwind v4 — diferencias clave

- Configuración en `tailwind.config.cjs` y `postcss.config.cjs`.
- Usar `@layer` en el CSS para extensiones custom.
- Variables CSS preferidas sobre colores hardcodeados: `bg-primary`, `text-foreground`, etc.

## Patrones de clase recomendados

```tsx
// Layout  
<div className="flex flex-col gap-4 p-6">

// Card / contenedor
<div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">

// Botón primario (shadcn/ui Button)
<Button variant="default" size="sm">Guardar</Button>

// Formulario con RHF
<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
  <div className="flex flex-col gap-1.5">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" {...register('email')} />
    {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
  </div>
</form>
```

## shadcn/ui

- Importar desde `@/components/ui/` (alias configurado).
- No modificar los archivos bajo `components/ui/` directamente — extender con wrapper.
- Componentes más usados: `Button`, `Input`, `Label`, `Card`, `Dialog`, `Table`, `Badge`, `Select`.

## Responsivo

- Mobile-first: clases base para móvil, `sm:` / `md:` / `lg:` para pantallas mayores.
- Evitar anchos fijos; preferir `max-w-*` + `w-full`.

## Iconografía

**Regla clave:** Todo títular, tab, card, sección, lista y mensaje de estado debe incluir una iconografía contextual visible (no solo color). La ausencia de icono es un defecto de UI.

### Estándar técnico

- **Origen:** Iconos SVG inline centralizados en `src/components/icons/` (exportados como componentes React).
- **Tamaño base:** `w-5 h-5` (20×20px) — excepciones documentadas si aplica.
- **Color:** Heredado vía `currentColor` + clases Tailwind (`text-slate-400`, `text-destructive`, etc.).
- **Dark mode:** Si el ícono cambia visualmente, usar `dark:text-*` en la clase del SVG.
- **Accesibilidad:** `aria-hidden="true"` obligatorio en iconos decorativos; buttons con ícono necesitan `aria-label` en el `<button>`, no en el ícono.

### Patrón de componente icon

```tsx
// src/components/icons/index.ts

export function IconShield() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04..." />
    </svg>
  )
}
```

### Contextos de aplicación obligatoria

| Contexto | Ejemplo | Icono sugerido |
|----------|---------|----------------|
| **Tab** | "Seguridad", "Notificaciones", "Billing" | Escudo, campana, tarjeta |
| **Estado info** | Mensajes informativos | Icono de círculo i |
| **Estado success** | Operación completada | Check mark |
| **Estado warning** | Advertencia | Triángulo de alerta |
| **Estado error/danger** | Error o acción destructiva | X circle |
| **Encabezado de sección** | "Usuarios activos", "Actividad reciente" | Icono del tópico |
| **Card de métrica** | Valor numérico + etiqueta | Icono contexto |
| **Botón accionable** | "Eliminar", "Descargar" | Ícono + aria-label en button |
| **Dropdown/select** | Elemento en lista | Ícono de acción o tipo |

### Catálogo semántico por estado

Para garantizar consistencia visual global:

```tsx
// Info — uso informativo, no accionable
<IconInfo className="w-5 h-5 text-blue-500" aria-hidden="true" />

// Success — operación completada exitosamente
<IconCheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />

// Warning — precaución, revisar
<IconAlertTriangle className="w-5 h-5 text-yellow-500" aria-hidden="true" />

// Error/Danger — acción fallida o destructiva
<IconXCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
```

### Importación

```tsx
import { IconShield, IconBell, IconCheckCircle } from '@/components/icons'

export function SettingsTab() {
  return (
    <button className="flex items-center gap-2">
      <IconShield className="w-5 h-5" aria-hidden="true" />
      Seguridad
    </button>
  )
}
```

---

## Accesibilidad

- Usar etiquetas semánticas (`nav`, `main`, `section`, `article`).
- Todo elemento interactivo debe tener `aria-label` si no tiene texto visible.
- El foco debe ser visible (`focus-visible:ring-*`).
