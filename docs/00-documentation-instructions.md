# Instrucciones para organizar documentación en el proyecto UI

## Principios base

1. Todo bajo `docs/`: ningún documento técnico u operativo vive en la raíz del repositorio. Dentro de `docs/`, la documentación viva debe organizarse por secciones y navegarse desde índices.
2. Cada carpeta tiene su `README.md`: actúa como índice con el propósito de la sección y una tabla de documentos.
3. Navegar por índices, no por exploración ciega: un lector llega a `docs/README.md`, selecciona una sección, lee el `README.md` de esa sección y luego abre el documento específico.

---

## Estructura de carpetas propuesta para el UI

```text
docs/
├── README.md              ← índice maestro
├── 01-product/            ← visión, alcance, glosario UI
│   └── README.md
├── 02-functional/         ← flujos de usuario, pantallas, navegación
│   └── README.md
├── 03-architecture/       ← estructura de módulos, patrones, state management
│   └── README.md
├── 04-decisions/          ← ADRs y RFCs de decisiones UI
│   ├── adr/
│   ├── rfc/
│   └── README.md
├── 05-delivery/           ← roadmap, sprints, releases
│   └── README.md
├── 06-quality/            ← testing, accesibilidad, performance
│   └── README.md
├── 07-operations/         ← setup local, despliegue, variables de entorno
│   └── README.md
├── 08-reference/          ← catálogos, componentes, convenciones
│   └── README.md
├── 09-ai/                 ← guías de agentes, propuestas, tasks
│   ├── proposals.md
│   ├── tasks/
│   └── README.md
└── 99-archive/            ← material histórico o reemplazado
    └── README.md
```

---

## Formato del `README.md` de cada carpeta

```md
# <Nombre de la sección>

<Propósito en 1-2 oraciones.>

## Contenido

| Documento              | Descripción            |
| ---------------------- | ---------------------- |
| [nombre.md](nombre.md) | Qué cubre en una línea |

## Criterio

- Qué tipo de documentos viven aquí.
- Qué NO va aquí (con referencia a dónde sí va).
```

---

## Formato del `docs/README.md` (índice maestro)

```md
# <Proyecto> — Documentación

Índice maestro de la documentación del repositorio.

## Cómo navegar

| Sección      | Propósito | Punto de entrada                             |
| ------------ | --------- | -------------------------------------------- |
| `01-product` | ...       | [01-product/README.md](01-product/README.md) |
| ...          | ...       | ...                                          |

## Fuentes de verdad

- Arquitectura: [03-architecture/architecture.md](...)
- Setup local: [07-operations/environment-setup.md](...)
- ...

## Reglas de ubicación

- Todo documento vivo vive bajo `docs/`.
- Si un tema evoluciona, la fuente de verdad se actualiza; lo previo va a `99-archive`.
- No duplicar entre secciones.
```

---

## Reglas de mantenimiento (en cada `README.md` relevante)

Agrega una tabla al final del `README.md` de las secciones que cambien frecuentemente:

```md
## Reglas de mantenimiento

| Cambio                        | Qué actualizar                           |
| ----------------------------- | ---------------------------------------- |
| Nueva pantalla o ruta         | `02-functional/` + este README si aplica |
| Nuevo componente reutilizable | `08-reference/components.md`             |
| Decisión arquitectónica       | ADR en `04-decisions/adr/`               |
| Nueva variable de entorno     | `07-operations/environment-setup.md`     |
```

---

## Convenciones de nombrado

| Concepto                      | Convención                                          |
| ----------------------------- | --------------------------------------------------- |
| Documentos de flujo funcional | `<dominio>-flow.md` (ej: `auth-flow.md`)            |
| Guías por dominio             | `NN-<dominio>.md` con prefijo numérico para ordenar |
| ADRs                          | `adr-NNN-<slug>.md`                                 |
| RFCs                          | `rfc-NNN-<slug>.md`                                 |
| Propuestas AI                 | `T-NNN-<slug>.md` en `09-ai/tasks/`                 |

---

## Checklist al agregar un documento

- [ ] ¿El documento está bajo `docs/`?
- [ ] ¿Tiene encabezado `#` con título descriptivo?
- [ ] ¿Se agregó una fila en el `README.md` de su carpeta?
- [ ] ¿Si es un nuevo dominio o sección, se creó el `README.md` de carpeta?
- [ ] ¿Se actualizó `docs/README.md` si es una nueva sección top-level?
