# 04 - Privacidad y Seguridad

## Principios

1. Minimizar datos por defecto.
2. No capturar secretos.
3. Aplicar sanitizacion antes de persistir o enviar.
4. Trazabilidad de accesos a datos de soporte.

## Campos Prohibidos

Nunca incluir en eventos:
- passwords
- access_token
- refresh_token
- id_token
- secretos de integracion
- payloads completos de formularios sensibles

## Campos Sensibles Condicionados

Se permite incluir email/username para soporte cuando:
1. Exista justificacion operativa.
2. Haya control de acceso por rol en backend.
3. Quede registro de consulta/export de auditoria.
4. Se cumpla politica legal vigente.

## Sanitizacion

1. Whitelist de campos permitidos.
2. Bloqueo por blacklist de campos sensibles.
3. Truncado de textos libres largos.
4. Normalizacion de errores a codigos estables.

## Seguridad de Transporte

1. Envio solo por HTTPS.
2. Autenticacion Bearer con token en memoria.
3. Reintentos acotados, sin loops infinitos.
4. Manejo de 401/403 sin fuga de datos.

## Control de Acceso

1. Solo perfiles autorizados pueden consultar trazabilidad detallada.
2. Definir vistas agregadas para audiencias no tecnicas.
3. Separar datos operativos de datos potencialmente identificables.

## Riesgos y Mitigaciones

1. Riesgo: sobrecaptura de PII.
Mitigacion: schema estricto y validacion previa.

2. Riesgo: filtrado insuficiente en errores.
Mitigacion: mapear a codigos internos, no enviar stack traces crudos.

3. Riesgo: uso indebido de datos de soporte.
Mitigacion: auditoria de acceso y retencion acotada.
