# Propuesta UI de Cuenta — KeyGo

Este paquete define una propuesta funcional y técnica para separar y estandarizar:

- **Mi cuenta (Perfil)**
- **Configuración de cuenta**

La propuesta está inspirada en patrones tipo "Profile" y "Account Settings" pero adaptada al contrato real de KeyGo.

## Objetivo

1. Unificar semántica de navegación (sidebar + dropdown de usuario).
2. Definir una IA de tabs/subsecciones realista para cada vista.
3. Priorizar implementaciones según endpoints ya disponibles.
4. Documentar brechas para feedback concreto a backend.

## Documentos

1. `01-information-architecture.md`
   - Arquitectura UX propuesta.
   - Mapa de navegación por rol.
   - Definición de tabs para Perfil y Configuración.

2. `02-endpoint-coverage-matrix.md`
   - Matriz endpoint -> sección de UI -> estado.
   - Qué puede salir a producción sin backend adicional.

3. `03-backend-feedback-gaps.md`
   - Contrato recomendado para features faltantes.
   - Prioridad sugerida y racional de producto.

4. `04-rfc-account-backend-contract.md`
   - RFC tecnico detallado para backend.
   - Incluye request/response, validaciones, mensajes, HTTP y codigos KeyGo.

5. `05-frontend-implementation-plan.md`
   - Plan de ejecucion frontend por fases (Fase 1 a Fase 12).
   - Incluye baseline de contrato, brechas confirmadas y orden de implementacion.

## Decisión de nomenclatura recomendada

Se recomienda usar **Mi cuenta** como etiqueta raíz en todos los puntos de navegación visibles al usuario.

- En sidebar: `Mi cuenta` y `Configuración de cuenta`
- En dropdown de usuario: `Mi cuenta` y `Configuración de cuenta`

Racional:

- Reduce ambigüedad entre "Mi perfil" y "Mi cuenta".
- Facilita onboarding y consistencia cross-rol.
- Permite usar "Perfil" como una **tab interna** dentro de Mi cuenta.
