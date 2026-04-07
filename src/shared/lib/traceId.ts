/**
 * Gestión del X-Trace-ID para correlación de peticiones HTTP.
 *
 * Cada página/ruta genera un nuevo traceId. Todas las peticiones
 * disparadas dentro de la misma ruta comparten ese traceId, lo que
 * permite correlacionar logs en el backend con la pantalla de origen.
 *
 * Uso:
 *  - `getTraceId()`  → lee el traceId activo (lo inyecta el interceptor de Axios)
 *  - `resetTraceId()` → genera uno nuevo (llamar en cada cambio de ruta)
 */

let _currentTraceId: string = crypto.randomUUID()

/** Devuelve el traceId activo para la ruta actual. */
export function getTraceId(): string {
  return _currentTraceId
}

/** Genera y almacena un nuevo traceId. Llamar al navegar a una nueva ruta. */
export function resetTraceId(): void {
  _currentTraceId = crypto.randomUUID()
}
