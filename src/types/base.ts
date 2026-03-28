export interface SuccessInfo {
  code: string
  message?: string
}

export interface FailureInfo {
  code: string
  message: string
}

export interface BaseResponse<T> {
  date: string
  success?: SuccessInfo
  failure?: FailureInfo
  data?: T
  /** Información de debug — solo en perfiles dev/local */
  debug?: SuccessInfo
  /** Nombre de la excepción — solo en perfiles dev/local */
  throwable?: string
}

/** Envelope de paginación devuelto por endpoints con soporte de página. */
export interface PagedData<T> {
  content: T[]
  page: number
  size: number
  total_elements: number
  total_pages: number
  last: boolean
}

// ---------------------------------------------------------------------------
// Error handling — ErrorData
// ---------------------------------------------------------------------------

/** Origen del error devuelto por el backend */
export type ErrorOrigin =
  | 'CLIENT_REQUEST'    // Error causado por la solicitud del cliente
  | 'BUSINESS_RULE'     // Regla de negocio que impide la operación
  | 'SERVER_PROCESSING' // Error interno del servidor

/**
 * Sub-clasificación de errores de cliente.
 * Solo presente cuando `origin === 'CLIENT_REQUEST'`.
 */
export type ClientRequestCause =
  | 'USER_INPUT'        // Datos ingresados por el usuario (credenciales, campos de formulario)
  | 'CLIENT_TECHNICAL'  // Problema de integración técnica (cookie faltante, parámetro mal construido)

/**
 * Estructura del campo `data` en respuestas de error.
 * Enviada dentro de `BaseResponse<ErrorData>`.
 *
 * Comportamiento según el perfil del backend:
 *  - Perfiles `dev` / `local`: `clientMessage` puede contener texto técnico (nombre de
 *    excepción, detalle de causa) útil para diagnóstico en desarrollo.
 *  - Perfil `prod` / `staging`: `clientMessage` es siempre amigable para el usuario final.
 *
 * El frontend debe mostrar `clientMessage` directamente — el backend ya realiza la
 * adaptación al ambiente. No sustituir ni reescribir `clientMessage` en el cliente.
 *
 * Guía de uso según `origin`:
 *  - `CLIENT_REQUEST` + `clientRequestCause === 'USER_INPUT'`
 *      → mostrar `clientMessage` junto al formulario o campo correspondiente
 *  - `CLIENT_REQUEST` + `clientRequestCause === 'CLIENT_TECHNICAL'`
 *      → revisar integración técnica; NO presentar como error del usuario
 *  - `BUSINESS_RULE`
 *      → mostrar `clientMessage`; ofrecer acción alternativa si aplica
 *  - `SERVER_PROCESSING`
 *      → mostrar mensaje genérico de reintento; loguear en monitoreo
 */
export interface ErrorData {
  /** ResponseCode del error (mismo valor que `failure.code`) */
  code: string
  /** Origen del error */
  origin: ErrorOrigin
  /** Sub-causa de errores de cliente (ausente si `origin !== 'CLIENT_REQUEST'`) */
  clientRequestCause?: ClientRequestCause
  /**
   * Mensaje listo para mostrar al usuario.
   * Su contenido es específico por tipo de excepción y se adapta al perfil del backend:
   * técnico en dev/local, amigable para el usuario final en producción.
   */
  clientMessage: string
  /** Detalle técnico de la excepción — solo en perfiles `dev` / `local` */
  detail?: string
  /** Nombre de la clase de excepción — solo en perfiles `dev` / `local` */
  exception?: string
}

/** Alias tipado para respuestas de error de la API */
export type ErrorResponse = BaseResponse<ErrorData>
