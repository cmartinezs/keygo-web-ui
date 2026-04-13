# 02 - Arquitectura

## Vista General

La arquitectura propuesta separa la trazabilidad en 4 capas:

1. Captura
- Hooks/wrappers de tracking para eventos de UI.
- Listener global de navegacion.
- Interceptor Axios para resultado de llamadas API.

2. Enriquecimiento y Sanitizacion
- Normalizacion de campos.
- Eliminacion o transformacion de datos sensibles.
- Agregado de metadata tecnica.

3. Buffer y Control de Flujo
- Cola en memoria con capacidad maxima.
- Dedupe local por llave de evento.
- Scheduler de flush periodico.

4. Transporte
- Envio batch al backend.
- Retry con backoff y jitter.
- Fallback de cierre de pestana con sendBeacon cuando aplique.

## Componentes Propuestos

1. TrackingProvider
- Registra pipeline central.
- Expone funcion track() al resto de la app.

2. useActionTracking
- API ergonomica para componentes.
- Aplica debounce por tipo de evento.

3. RouterTelemetryListener
- Emite route_change en cada cambio de ruta.

4. ApiTelemetryInterceptor
- Emite api_success y api_error clasificado.

5. TelemetryQueue
- Maneja push, batch, retries y flush.

## Flujo de Datos

1. UI dispara evento.
2. Pipeline valida y sanitiza.
3. Evento entra en cola.
4. Scheduler dispara flush cada 10 a 15 minutos o por umbral de lote.
5. Backend responde accepted/ignored.
6. Cola elimina confirmados y reintenta fallidos.

## Estrategia Menos Invasiva

1. Evitar refactor de paginas completas.
2. Inyectar listener y provider a nivel raiz.
3. Instrumentar primero puntos de alto valor:
- Login.
- Registro multi-step.
- Admin dashboard y tenant actions.

## Manejo de Fallos

1. Si falla telemetria: no bloquear flujo principal.
2. Si falla red: reintentar con politica acotada.
3. Si se supera capacidad de cola: descarte controlado y metricas de drop.
