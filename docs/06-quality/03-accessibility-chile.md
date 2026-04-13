# Política de Accesibilidad Web para Proyectos en Chile

## 1. Propósito

Este documento define las directrices mínimas de accesibilidad que deben cumplir los sistemas web del proyecto.

Su objetivo es:

- establecer una base normativa y técnica para el desarrollo;
- servir como criterio de revisión para PRs, QA y auditorías internas;
- integrarse a workflows automatizados y agentes AI;
- reducir riesgos legales, de exclusión de usuarios y de deuda técnica.

---

## 2. Alcance

Estas directrices aplican a:

- páginas públicas;
- áreas autenticadas;
- paneles de administración;
- formularios;
- flujos de login, recuperación de contraseña y MFA;
- componentes reutilizables de UI;
- contenido incrustado relevante;
- documentos descargables cuando formen parte de la experiencia principal.

---

## 3. Base normativa y estándar técnico

### 3.1 Referencia legal chilena

El proyecto debe considerar como base normativa chilena, al menos:

- **Ley N° 20.422**, que establece normas sobre igualdad de oportunidades e inclusión social de personas con discapacidad.
- **Decreto N° 1 de 2015**, del Ministerio Secretaría General de la Presidencia, aplicable especialmente a órganos de la Administración del Estado en materia de sitios web y sistemas digitales.
- **Decreto N° 14 de 2014**, relativo a estándares para sitios electrónicos del Estado.

> Aunque algunas obligaciones reglamentarias están expresamente dirigidas al sector público, este proyecto adopta sus principios como baseline de cumplimiento y buena práctica también para contextos privados.

### 3.2 Estándar técnico de implementación

A nivel técnico, el estándar objetivo del proyecto será:

- **WCAG 2.2 nivel AA** como criterio general de conformidad.

Cuando exista conflicto entre una implementación visual y la accesibilidad, debe prevalecer la accesibilidad.

---

## 4. Principios obligatorios

Todo desarrollo web del proyecto debe ser:

1. **Perceptible**: la información y los componentes deben poder percibirse de más de una manera.
2. **Operable**: la interfaz debe poder utilizarse sin barreras de interacción.
3. **Comprensible**: el contenido y el comportamiento deben ser claros y predecibles.
4. **Robusto**: el sistema debe ser compatible con navegadores modernos y tecnologías de asistencia.

---

## 5. Requisitos obligatorios de accesibilidad

## 5.1 Navegación por teclado

Todo flujo crítico debe poder completarse usando solo teclado.

### Obligatorio

- foco visible en todos los elementos interactivos;
- orden de tabulación lógico;
- ausencia de trampas de teclado;
- posibilidad de activar controles con teclado;
- acceso a menús, diálogos, tabs, tablas y formularios sin mouse.

### Prohibido

- interacciones críticas solo por hover;
- focus oculto sin reemplazo visible;
- componentes personalizados que no respondan a teclado.

---

## 5.2 Estructura semántica

La interfaz debe usar HTML semántico antes de recurrir a ARIA.

### Obligatorio

- jerarquía correcta de headings;
- uso de `header`, `nav`, `main`, `section`, `footer` cuando corresponda;
- botones reales para acciones y links reales para navegación;
- tablas solo para datos tabulares;
- labels asociados programáticamente a inputs.

### Regla

**No usar ARIA para reparar HTML mal estructurado cuando el problema puede resolverse con semántica correcta.**

---

## 5.3 Texto alternativo

Todo contenido no textual con significado debe tener alternativa textual equivalente.

### Obligatorio

- `alt` útil en imágenes informativas;
- `alt=""` en imágenes decorativas;
- nombre accesible en icon buttons;
- descripción textual o equivalente para gráficos relevantes.

### Prohibido

- usar imágenes con texto relevante sin alternativa equivalente;
- iconos accionables sin nombre accesible.

---

## 5.4 Contraste y color

El color no puede ser el único medio para comunicar información.

### Obligatorio

- contraste suficiente en texto y componentes UI;
- errores, estados y alertas identificables por más de color;
- links distinguibles sin depender solo del color.

### Ejemplos correctos

- error con color + ícono + mensaje;
- estado con badge + texto descriptivo;
- campos inválidos con borde + texto + asociación accesible.

---

## 5.5 Formularios

Los formularios deben ser comprensibles, navegables y tolerantes a errores.

### Obligatorio

- etiqueta visible o nombre accesible correcto;
- instrucciones claras cuando el formato no sea obvio;
- mensajes de error específicos;
- asociación entre error y campo;
- preservación razonable de datos ingresados tras error;
- estados `disabled`, `readonly`, `required` y `invalid` bien comunicados.

### Prohibido

- placeholders como único reemplazo de label;
- errores genéricos sin indicar campo o causa;
- validaciones solo visuales.

---

## 5.6 Componentes dinámicos

Todo cambio de estado importante debe ser detectable por tecnologías de asistencia.

### Obligatorio

- modales con manejo correcto de foco;
- cierre por teclado cuando corresponda;
- anuncios accesibles para mensajes de estado;
- loaders y resultados con feedback claro;
- acordeones, tabs y menús con estados accesibles.

### Recomendación

Usar componentes accesibles de base y no reinventar patrones complejos sin necesidad.

---

## 5.7 Responsive, zoom y reflow

La interfaz debe seguir siendo usable en distintos tamaños y niveles de zoom.

### Obligatorio

- funcionamiento correcto en móvil, tablet y desktop;
- reflow sin pérdida de funcionalidad relevante;
- no bloquear zoom del navegador;
- evitar cortes de contenido, overlays rotos y scrolls dobles innecesarios.

---

## 5.8 Autenticación accesible

Los flujos de autenticación son críticos y deben diseñarse con especial cuidado.

### Obligatorio

- login usable con teclado;
- labels claros y persistentes;
- posibilidad de pegar contraseña;
- compatibilidad con gestores de contraseñas;
- recuperación de cuenta sin barreras innecesarias;
- MFA con experiencia accesible;
- mensajes de error comprensibles sin exponer datos sensibles.

### Evitar

- CAPTCHA visual como única opción;
- pruebas de memoria o transcripción innecesarias;
- timers agresivos sin control del usuario.

---

## 5.9 Contenido multimedia

Cuando exista contenido audiovisual relevante:

### Obligatorio

- subtítulos para video con audio relevante;
- transcripción para audio relevante;
- alternativas cuando la información dependa exclusivamente de lo visual o auditivo.

---

## 5.10 Consistencia

La experiencia debe ser predecible.

### Obligatorio

- navegación consistente entre pantallas equivalentes;
- nombres de acciones coherentes;
- ubicación consistente de elementos repetidos;
- patrones uniformes para errores, validaciones y confirmaciones.

---

## 6. Reglas para diseño y desarrollo

## 6.1 Regla general

La accesibilidad **no es una tarea de cierre**, sino un criterio de diseño, implementación y revisión continua.

## 6.2 Regla para diseño

Todo diseño nuevo debe considerar desde el inicio:

- contraste;
- foco;
- estados;
- navegación por teclado;
- responsive;
- textos y labels claros.

## 6.3 Regla para frontend

Todo componente reusable debe:

- exponer nombre accesible correcto;
- soportar teclado si es interactivo;
- respetar foco;
- comunicar estados;
- poder testearse automáticamente.

## 6.4 Regla para backend

El backend debe colaborar con accesibilidad cuando corresponda, por ejemplo:

- errores consistentes y claros para formularios;
- mensajes estructurados por campo;
- tiempos y expiraciones razonables;
- flujos de autenticación compatibles con UX accesible.

---

## 7. Criterios obligatorios para PRs

Ningún PR que afecte UI o flujos de usuario debe aprobarse si incumple alguno de estos puntos críticos:

- no se puede operar con teclado;
- no existe foco visible;
- el componente no tiene nombre accesible;
- hay errores comunicados solo por color;
- un formulario no tiene labels correctos;
- un modal rompe el foco;
- un flujo crítico se vuelve inaccesible en móvil o con zoom;
- login, reset o MFA quedan bloqueados para tecnologías de asistencia.

---

## 8. Definition of Done de accesibilidad

Una tarea que modifica UI se considera terminada solo si:

- cumple semántica correcta;
- se probó navegación por teclado;
- tiene foco visible;
- valida contraste y legibilidad;
- los formularios informan errores correctamente;
- los mensajes de estado relevantes son detectables;
- funciona en viewport móvil y desktop;
- pasa validaciones automáticas configuradas por el proyecto;
- no introduce regresiones evidentes en accesibilidad.

---

## 9. Checklist corto para agentes AI

Los agentes AI que generen o modifiquen código deben seguir estas reglas:

1. usar HTML semántico primero;
2. no crear `div` clickeables cuando corresponde `button` o `a`;
3. asegurar labels, `aria-label` o nombre accesible donde aplique;
4. mantener foco visible;
5. no depender solo de color;
6. asegurar operación por teclado;
7. considerar estados vacíos, error, loading y éxito;
8. no introducir placeholders como único label;
9. no romper responsive ni zoom;
10. priorizar WCAG 2.2 AA en decisiones de UI.

### Instrucción sugerida para prompts de agentes

```txt
Toda contribución de UI debe cumplir la política ACCESSIBILITY-CHILE.md del repositorio.
Prioriza HTML semántico, operación por teclado, foco visible, labels correctos,
mensajes de error accesibles, contraste suficiente y cumplimiento general WCAG 2.2 AA.
No generes componentes interactivos inaccesibles.
```

---

## 10. Checklist ampliado para revisión automática o manual

### Semántica

- [ ] La página tiene estructura semántica razonable.
- [ ] Los headings siguen un orden lógico.
- [ ] Los botones son botones y los links son links.

### Teclado

- [ ] Todo se puede usar con teclado.
- [ ] El foco es visible.
- [ ] No hay keyboard traps.

### Formularios

- [ ] Todos los inputs tienen label.
- [ ] Los errores se asocian a los campos.
- [ ] No se depende solo del color.

### Estados dinámicos

- [ ] Modales y overlays manejan el foco correctamente.
- [ ] Los mensajes de estado relevantes son perceptibles.

### Visual

- [ ] El contraste es suficiente.
- [ ] La UI funciona en móvil.
- [ ] La UI tolera zoom sin romperse.

### Autenticación

- [ ] Login usable por teclado.
- [ ] Reset de contraseña accesible.
- [ ] MFA no bloquea a usuarios con asistencia.

---

## 11. Integración recomendada con workflows

## 11.1 En pull requests

Agregar una sección obligatoria en el template de PR:

```md
## Accesibilidad

- [ ] Revisé navegación por teclado
- [ ] Revisé foco visible
- [ ] Revisé labels y nombre accesible
- [ ] Revisé errores y mensajes de estado
- [ ] Revisé responsive básico
- [ ] No introduje barreras evidentes de accesibilidad
```

## 11.2 En instrucciones para agentes AI

Referenciar este archivo en:

- prompts del repositorio;
- instrucciones de asistentes de codificación;
- reglas de generación de componentes;
- workflows de revisión automática.

## 11.3 En Definition of Done del equipo

Agregar una regla explícita:

```txt
No se cierra una tarea con impacto en UI si incumple ACCESSIBILITY-CHILE.md.
```

---

## 12. Nivel de severidad para hallazgos

### Crítico

Bloquea uso total o parcial de un flujo crítico.

Ejemplos:

- login inaccesible con teclado;
- botón principal sin nombre accesible;
- foco invisible en flujo clave;
- modal imposible de cerrar sin mouse.

### Alto

No bloquea completamente, pero dificulta gravemente el uso.

Ejemplos:

- errores mal asociados;
- contraste insuficiente en textos clave;
- navegación inconsistente en proceso principal.

### Medio

Afecta calidad de uso, comprensión o robustez, pero existe workaround.

### Bajo

Mejora recomendada sin impacto severo inmediato.

---

## 13. Criterio de adopción del proyecto

Este proyecto adopta como política que:

- la accesibilidad es un requisito de calidad obligatorio;
- el cumplimiento objetivo es **WCAG 2.2 AA**;
- la interpretación normativa se alinea con la legislación chilena aplicable y sus principios de accesibilidad universal;
- toda contribución de UI debe revisarse con este documento como baseline.

---

## 14. Texto corto para README o GOVERNANCE

```md
Este proyecto adopta una política de accesibilidad alineada con principios de accesibilidad universal aplicables en Chile y con WCAG 2.2 nivel AA como estándar técnico objetivo. Toda contribución con impacto en UI debe cumplir el archivo `ACCESSIBILITY-CHILE.md`.
```

---

## 15. Nota final

Si el proyecto presta servicios a organismos públicos, concesionarios, instituciones con exigencias contractuales o plataformas de alto alcance ciudadano, se recomienda complementar este documento con:

- auditoría manual formal de accesibilidad;
- validación con lector de pantalla;
- revisión legal específica del contexto contractual;
- criterios documentales para PDFs y otros entregables no HTML.
