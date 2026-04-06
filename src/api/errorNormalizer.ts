import axios, { type AxiosError } from 'axios'
import { i18n } from '@/i18n/config'
import type {
  BaseResponse,
  ClientRequestCause,
  ErrorData,
  ErrorOrigin,
  ErrorResponse,
  FieldValidationError,
} from '@/types/base'

type ErrorCode = string

export interface AppApiError extends Error {
  kind: 'APP_API_ERROR'
  httpStatus?: number
  code?: ErrorCode
  origin?: ErrorOrigin
  clientRequestCause?: ClientRequestCause
  clientMessage: string
  detail?: string
  exception?: string
  /** Identificador de traza del backend (enviado como `trace_id` en la respuesta). */
  traceId?: string
  fieldErrors: FieldValidationError[]
  retryable: boolean
  raw: unknown
}

export interface AxiosErrorWithAppApiError extends AxiosError {
  appApiError?: AppApiError
}

function getDefaultUnknownMessage(): string {
  return i18n.t('errors.unknownMessage', {
    defaultValue: 'No pudimos completar la solicitud en este momento. Vuelve a intentarlo en unos segundos.',
  })
}

function getDefaultNetworkMessage(): string {
  return i18n.t('errors.networkMessage', {
    defaultValue: 'No pudimos completar la comunicacion con el servidor. Reintentaremos automaticamente; si persiste, vuelve a intentarlo en unos segundos.',
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function extractErrorData(body: unknown): Partial<ErrorData> | undefined {
  if (!isRecord(body)) return undefined
  const data = body['data']
  if (!isRecord(data)) return undefined

  // Normalize snake_case keys sent by the backend to the camelCase fields used in ErrorData.
  // Both forms are supported so mocks and legacy payloads continue to work.
  const normalized: Record<string, unknown> = { ...data }
  if ('client_message' in data && !('clientMessage' in data)) {
    normalized['clientMessage'] = data['client_message']
  }
  if ('trace_id' in data && !('traceId' in data)) {
    normalized['traceId'] = data['trace_id']
  }

  return normalized as Partial<ErrorData>
}

function extractFailure(body: unknown): { code?: string; message?: string } {
  if (!isRecord(body)) return {}
  const failure = body['failure']
  if (!isRecord(failure)) return {}

  return {
    code: typeof failure['code'] === 'string' ? failure['code'] : undefined,
    message: typeof failure['message'] === 'string' ? failure['message'] : undefined,
  }
}

function resolveFieldErrors(data?: Partial<ErrorData>): FieldValidationError[] {
  if (!Array.isArray(data?.fieldErrors)) return []
  return data.fieldErrors
}

function resolveMessage(params: {
  backendMessage?: string
  clientMessage?: string
  fallback?: string
}): string {
  return params.clientMessage ?? params.backendMessage ?? params.fallback ?? getDefaultUnknownMessage()
}

function isRetryable(params: { status?: number; origin?: ErrorOrigin; code?: string; isNetwork: boolean }): boolean {
  if (params.isNetwork) return true
  if (params.status === 408 || params.status === 429) return true
  if ((params.status ?? 0) >= 500) return true
  if (params.origin === 'SERVER_PROCESSING') return true
  if (params.code === 'EXTERNAL_SERVICE_ERROR' || params.code === 'OPERATION_FAILED') return true
  return false
}

export function normalizeApiError(error: unknown): AppApiError {
  const isAxios = axios.isAxiosError(error)
  const axiosError = (isAxios ? error : undefined) as AxiosError<ErrorResponse> | undefined

  const status = axiosError?.response?.status
  const responseBody = axiosError?.response?.data
  const failure = extractFailure(responseBody)
  const errorData = extractErrorData(responseBody)
  const networkError = isAxios && !axiosError?.response

  const message = resolveMessage({
    clientMessage: typeof errorData?.clientMessage === 'string' ? errorData.clientMessage : undefined,
    backendMessage: failure.message,
    fallback: networkError ? getDefaultNetworkMessage() : isAxios ? axiosError?.message : undefined,
  })

  const normalized = new Error(message) as AppApiError
  normalized.name = 'AppApiError'
  normalized.kind = 'APP_API_ERROR'
  normalized.httpStatus = status
  normalized.code = typeof errorData?.code === 'string' ? errorData.code : failure.code
  normalized.origin = errorData?.origin
  normalized.clientRequestCause = errorData?.clientRequestCause
  normalized.clientMessage = message
  normalized.detail = typeof errorData?.detail === 'string' ? errorData.detail : undefined
  normalized.exception = typeof errorData?.exception === 'string' ? errorData.exception : undefined
  normalized.traceId = typeof errorData?.traceId === 'string' ? errorData.traceId : undefined
  normalized.fieldErrors = resolveFieldErrors(errorData)
  normalized.retryable = isRetryable({
    status,
    origin: normalized.origin,
    code: normalized.code,
    isNetwork: networkError,
  })
  normalized.raw = error
  return normalized
}

export function isAppApiError(error: unknown): error is AppApiError {
  return isRecord(error) && error['name'] === 'AppApiError' && error['kind'] === 'APP_API_ERROR'
}

export function getAppApiError(error: unknown): AppApiError {
  if (isAppApiError(error)) return error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosErrorWithAppApiError
    if (axiosError.appApiError) return axiosError.appApiError
  }
  return normalizeApiError(error)
}

export function buildAppApiErrorFromBaseResponse<T>(
  body: BaseResponse<T>,
  fallbackMessage: string,
): AppApiError {
  const errorData = extractErrorData(body)
  const failure = extractFailure(body)
  const message = resolveMessage({
    clientMessage: typeof errorData?.clientMessage === 'string' ? errorData.clientMessage : undefined,
    backendMessage: failure.message,
    fallback: fallbackMessage,
  })

  const normalized = new Error(message) as AppApiError
  normalized.name = 'AppApiError'
  normalized.kind = 'APP_API_ERROR'
  normalized.httpStatus = undefined
  normalized.code = typeof errorData?.code === 'string' ? errorData.code : failure.code
  normalized.origin = errorData?.origin
  normalized.clientRequestCause = errorData?.clientRequestCause
  normalized.clientMessage = message
  normalized.detail = typeof errorData?.detail === 'string' ? errorData.detail : undefined
  normalized.exception = typeof errorData?.exception === 'string' ? errorData.exception : undefined
  normalized.traceId = typeof errorData?.traceId === 'string' ? errorData.traceId : undefined
  normalized.fieldErrors = resolveFieldErrors(errorData)
  normalized.retryable = isRetryable({
    status: undefined,
    origin: normalized.origin,
    code: normalized.code,
    isNetwork: false,
  })
  normalized.raw = body
  return normalized
}
