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
