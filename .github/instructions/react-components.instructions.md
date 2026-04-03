---
description: "Use when creating or modifying React components, pages, hooks or layouts. Covers FC conventions, props typing, TanStack Query usage, shadcn/ui patterns, component reuse, design patterns, and best practices."
applyTo: "src/**/*.tsx"
---

# React / TypeScript — Convenciones de componentes

## Estructura de un componente

```tsx
// Named export + FC tipado con props inline o interface separada
interface MyComponentProps {
  title: string
  onAction?: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return <div>{title}</div>
}
```

- **Nunca** usar `React.FC<Props>` — tipar las props directamente.
- **Named exports** en componentes reutilizables; `export default` solo en páginas y layouts.
- No incluir la extensión `.tsx` en los imports (`import { Foo } from './Foo'`).

## Hooks y datos

- Usar **TanStack Query** (`useQuery`, `useMutation`) para datos del servidor.
- No mezclar `useState` + `fetch` directamente — siempre pasar por la capa `src/api/`.
- Para estado de formularios: **React Hook Form + Zod** (`useForm`, `zodResolver`).

```tsx
import { useQuery } from '@tanstack/react-query'
import { getTenants } from '@/api/tenants'

export function TenantList() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['tenants'],
    queryFn: getTenants,
  })
  // ...
}
```

## Páginas

- Cada página vive en `src/pages/<rol>/<NombrePage>.tsx`.
- Siempre usar `<RoleGuard>` o `<AuthGuard>` desde `src/auth/roleGuard.tsx` para proteger rutas.
- Usar el layout correspondiente al rol (`AdminLayout`, `TenantAdminLayout`, `UserLayout`).

## Features pendientes

Si el endpoint aún no existe en el backend:
1. Agregar handler en `src/mocks/handlers.ts` (MSW).
2. Renderizar `<PendingFeatureBadge />` visible en la UI.
3. Incluir comentario `// ⏳ pendiente` junto al import del endpoint.

## TypeScript

- Strict mode activado en `tsconfig.json` — no usar `any` sin justificación explícita.
- Los DTOs viven en `src/types/` — nunca definir el mismo shape en dos lugares.
- Usar `as const` para enums de rol en lugar de `enum` clásico (véase `src/types/roles.ts`).

---

## Reutilización de componentes

**Antes de crear un componente nuevo**, verificar en orden:
1. ¿Existe ya en `src/components/`? → Reutilizarlo o extenderlo con props opcionales.
2. ¿Existe en **shadcn/ui**? → Importar desde `@/components/ui/` y wrappear si hace falta.
3. ¿Es lógica compartida (no UI)? → Extraer a un hook custom en `src/hooks/`.
4. Solo si ninguna aplica → crear un componente nuevo.

### Props extensibles

Diseñar props para casos actuales, pero sin cerrar la puerta a extensiones simples:

```tsx
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending'
  className?: string   // permite override de estilos puntual
  icon?: ReactNode     // ← permite pasar icono opcional
}
```

**Componentes con iconos**
- Exponer `icon?: ReactNode` como prop opcional para permitir override o inyección de icono.
- Si el icono es decorativo (acompaña texto visible), aplicar `aria-hidden="true"` en el ícono.
- Si el ícono va dentro de un `<button>`, el nombre accesible va en `aria-label` del botón, no en el ícono.
- **Importar iconos desde `src/components/icons/`** — nunca definir iconos inline nuevos en componentes.
- **[Aprendido]** Se permite SVG inline solo para iconografía transitoria de estado (por ejemplo, `spinner` de carga local) o casos excepcionales aún no incorporados al catálogo central; en esos casos debe registrarse su consolidación pendiente en `docs/BACKLOG.md`.

Ejemplo:
```tsx
interface TabProps {
  label: string
  icon?: ReactNode
  isActive: boolean
  onClick: () => void
}

export function Tab({ label, icon, isActive, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={...}
      aria-selected={isActive}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </button>
  )
}

// Uso
import { IconShield } from '@/components/icons'

<Tab label="Seguridad" icon={<IconShield className="w-5 h-5" />} isActive={...} ... />
```

### Hooks reutilizables

Si la misma lógica (fetching, transformación, permisos) aparece en más de un componente, extraerla:

```ts
// src/hooks/useTenantUsers.ts
export function useTenantUsers(tenantSlug: string) {
  return useQuery({
    queryKey: ['users', tenantSlug],
    queryFn: () => getUsers(tenantSlug),
  })
}
```

### Código duplicado = señal de alerta

Si el mismo bloque JSX o la misma lógica aparece en dos lugares, refactorizar en un componente o hook compartido. Registrar en el backlog si el refactor está fuera del scope actual.

### Dropdowns unificados

- Todo dropdown nuevo o modificado debe construirse sobre el componente base `Dropdown` (y hooks asociados), evitando estados `open/close` duplicados por pantalla.
- Los casos de selector (ej: rol, tema) deben usar un wrapper configurado (ej: `SelectDropdown`) en vez de reescribir markup y lógica.
- Los menús de acciones (ej: menú de usuario) deben declararse por configuración de ítems y reutilizar el mismo primitive `Dropdown`.

### Un archivo por definición compartida

- Todo componente reutilizable debe vivir en su propio archivo dentro de `src/components/`.
- Todo hook reutilizable debe vivir en su propio archivo dentro de `src/hooks/`.
- Los tipos e interfaces reutilizados por más de un módulo deben extraerse a `src/types/` (o submódulo de tipos) y evitarse en archivos contenedores grandes.
- Si una pantalla necesita helpers locales no reutilizables, pueden quedar en el archivo de la pantalla, pero al primer segundo uso se deben extraer.

**[Aprendido]** Estandarizar dropdowns en un primitive único (`Dropdown`) + configuración declarativa reduce deuda de accesibilidad y evita inconsistencias de comportamiento entre menús y selectores.
**[Aprendido]** Separar componentes, hooks y tipos compartidos por archivo reduce sobrecarga cognitiva y evita duplicación accidental al escalar el proyecto.

---

## Patrones de diseño y composición

### Separación Container / Presenter

- **Container** (página o componente «smart»): maneja datos, queries, mutaciones, estado.
- **Presenter** (componente «dumb»): recibe todo por props, solo renderiza UI.

```tsx
// Container — TenantListPage.tsx
export default function TenantListPage() {
  const { data, isLoading } = useQuery({ queryKey: ['tenants'], queryFn: getTenants })
  return <TenantTable tenants={data ?? []} isLoading={isLoading} />
}

// Presenter — TenantTable.tsx
interface TenantTableProps {
  tenants: TenantData[]
  isLoading: boolean
}
export function TenantTable({ tenants, isLoading }: TenantTableProps) {
  if (isLoading) return <Skeleton />
  return <Table>{/* ... */}</Table>
}
```

### Flujo de datos unidireccional

```
API (src/api/)  →  TanStack Query  →  Componente Container  →  Props  →  Presenter
                                            ↑
                                     Zustand store (solo auth/estado global)
```

- Los datos bajan por props.
- Los eventos suben por callbacks (`onSuccess`, `onDelete`, etc.).
- El store de Zustand es **solo** para estado global persistente (tokens, rol activo).
- No usar el store como sustituto de `useQuery` para datos del servidor.

### Composición sobre herencia

Preferir `children` y slots sobre herencia de componentes:

```tsx
// ✅ Composición
<Card>
  <CardHeader><CardTitle>Tenants</CardTitle></CardHeader>
  <CardContent><TenantTable tenants={tenants} /></CardContent>
</Card>

// ❌ Evitar
class ExtendedCard extends Card { ... }
```

### Responsabilidad única

Cada componente hace **una sola cosa**. Si un componente:
- Tiene más de ~150 líneas de JSX → dividirlo.
- Hace fetching Y renderiza tabla Y maneja un dialog → separar en subcomponentes.
- Tiene más de 3 niveles de condicionales anidados → extraer a helpers o subcomponentes.

---

## Mejores prácticas generales

### Estado local vs. global

| Situación | Dónde guardar |
|-----------|---------------|
| Datos del servidor | TanStack Query (`useQuery`) |
| Formularios | React Hook Form |
| UI temporal (modal abierto, tab activa) | `useState` local |
| Tokens y rol activo | Zustand (`tokenStore`) |
| Datos del dominio compartidos | Zustand solo si >2 capas de prop drilling |

### Manejo de estados asíncronos

Siempre manejar los tres estados de `useQuery`:

```tsx
const { data, isLoading, isError, error } = useQuery(...)

if (isLoading) return <LoadingSkeleton />
if (isError) return <ErrorMessage message={error.message} />
return <MyComponent data={data} />
```

### Regla obligatoria de carga: pagina vs componente vs backend

Aplicar siempre esta separación en cualquier pantalla o flujo con datos:

1. **Render de pagina (critico)**
  - Evitar pantalla en blanco durante bootstrap o cambios de ruta.
  - El loader global solo se usa para asentamiento critico de ruta/pagina y ante red lenta sostenida.

2. **Render de componente (local)**
  - Cada widget o bloque visual maneja su `isLoading`, `isError` y `data` localmente.
  - Preferir skeletons/placeholders locales en lugar de bloquear toda la pantalla.

3. **Llamadas backend (resiliencia)**
  - Timeout explicito para requests criticos.
  - GET criticos con retry controlado (intervalo y maximo de intentos definidos).
  - Mutaciones criticas sin auto-retry mientras backend no garantice idempotencia real.

Si una accion de recuperacion en background modifica el estado visible, notificar con `toast`.

### Mutaciones con feedback

```tsx
const mutation = useMutation({
  mutationFn: createTenant,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tenants'] })
    // feedback al usuario (toast, navigate, etc.)
  },
  onError: (error) => {
    // mostrar mensaje de error al usuario
  },
})
```

### Notificaciones y toasts — `sonner`

Usar **`sonner`** (`import { toast } from 'sonner'`) para notificar resultados de acciones. El `<Toaster />` está montado globalmente en `src/App.tsx`.

#### Cuándo usar toast

| Situación | Tipo de toast | Ejemplo |
|-----------|---------------|---------|
| Acción en segundo plano iniciada | `toast.loading(...)` | "Intentando reconectar…" |
| Acción en segundo plano completada | `toast.success(...)` | "Conexión restablecida" |
| Acción en segundo plano fallida (silenciosa) | `toast.dismiss(id)` | Descartar sin molestar |
| Mutación iniciada por el usuario completada | `toast.success(...)` | "Tenant creado correctamente" |
| Mutación iniciada por el usuario fallida | `toast.error(...)` | "No se pudo guardar" |
| Acción destructiva completada | `toast.success(...)` | "Usuario eliminado" |

#### Regla clave: acciones en segundo plano DEBEN notificarse

> Si el sistema hace algo que el usuario no inició explícitamente (polling, retry automático, refresco silencioso de token, invalidación de caché) **y el resultado afecta el estado visible de la UI**, se debe mostrar un toast.

#### Patrón tipico — acción de fondo con ciclo loading → resolve/dismiss

```ts
// Guardar el id del toast para resolverlo después
const toastIdRef = useRef<string | number | null>(null)

// Al iniciar la acción en segundo plano:
toastIdRef.current = toast.loading('Sincronizando…')
// Pequeño pre-delay (600 ms) si la request puede ser instantánea,
// para que el toast sea siempre perceptible:
setTimeout(() => mutation.mutate(), 600)

// En onSuccess:
if (toastIdRef.current !== null) {
  toast.success('Sincronizado', { id: toastIdRef.current })
  toastIdRef.current = null
}

// En onError (fallo silencioso — no molestar con error):
if (toastIdRef.current !== null) {
  setTimeout(() => {
    toast.dismiss(toastIdRef.current!)
    toastIdRef.current = null
  }, 800) // post-delay para que la transición sea perceptible
}
```

#### Reglas adicionales

- **No** usar `toast.error` para fallos silenciosos de background (como un ping fallido) — solo cuando el usuario necesita actuar.
- Los toasts de acción de usuario sí pueden usar `toast.error` directamente en `onError`.
- No duplicar feedback: si la UI ya muestra el error en pantalla (banner, etc.), no añadir también un toast.
- No crear wrappers alrededor de `toast` — importar directamente de `'sonner'`.

### Keys de query consistentes

Definir las query keys como constantes para evitar typos:

```ts
export const queryKeys = {
  tenants: ['tenants'] as const,
  tenant: (slug: string) => ['tenants', slug] as const,
  tenantUsers: (slug: string) => ['tenants', slug, 'users'] as const,
}
```

### Memoización — solo cuando haya evidencia de problema

- No usar `useMemo` / `useCallback` preventivamente.
- Aplicarlos solo cuando el profiler muestre re-renders costosos o cuando se pase una función como dep de `useEffect`.

### Validación de formularios

```tsx
const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
})
```

- El esquema Zod es la única fuente de verdad para las reglas de validación.
- No duplicar validaciones entre Zod y atributos HTML (`required`, `minLength`, etc.).
