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

## Accesibilidad

- Usar etiquetas semánticas (`nav`, `main`, `section`, `article`).
- Todo elemento interactivo debe tener `aria-label` si no tiene texto visible.
- El foco debe ser visible (`focus-visible:ring-*`).
