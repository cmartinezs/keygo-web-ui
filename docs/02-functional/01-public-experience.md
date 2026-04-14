# Experiencia pública

Resumen de las áreas públicas de KeyGo UI y su comportamiento esperado.

## Superficies públicas

| Área         | Ruta base                                                  | Objetivo                                                            |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| Landing      | `/`                                                        | Presentar la plataforma y dirigir a login, registro o contratación. |
| Login        | `/login`                                                   | Autenticar mediante OAuth2 Authorization Code + PKCE.               |
| Registro     | `/register`                                                | Alta de usuario en el flujo soportado por backend.                  |
| Recuperación | `/forgot-password`, `/recover-password`, `/reset-password` | Recuperar acceso sin exponer información sensible.                  |
| Contratación | `/subscribe`                                               | Crear contrato, verificar correo, avanzar pago y activar cuenta.    |

## Criterios funcionales

- No debe haber pantalla en blanco en bootstrap o cambios de ruta.
- Los errores de red se resuelven con feedback visible y recuperación controlada.
- El idioma activo afecta login, landing y mensajes públicos.
- La contratación es un flujo propio y no debe mezclarse con el registro de usuario final.
- El catálogo/carrusel de planes debe traducir tanto la estructura del componente como los textos dinámicos de cada plan (badge, CTA, notas de precio, beneficios y navegación accesible) según el idioma activo.
- Con el selector de periodicidad activo, el catálogo muestra solo los planes compatibles con el periodo elegido; los planes sin opciones de billing declaradas permanecen visibles.
- El CTA de cada plan debe derivarse del catálogo real: si el plan tiene `trial_days`, se prioriza ese mensaje; si no tiene trial, se usa el precio real informado por el endpoint para esa versión/periodicidad.
