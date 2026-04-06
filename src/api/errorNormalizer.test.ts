import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n/config'
import {
  getAppApiError,
  isAppApiError,
  normalizeApiError,
  type AppApiError,
  type AxiosErrorWithAppApiError,
} from './errorNormalizer'
import type { ErrorResponse } from '@/types/base'

function createAxiosLikeError(params: {
  status?: number
  data?: ErrorResponse
  message?: string
}): AxiosErrorWithAppApiError {
  return {
    isAxiosError: true,
    name: 'AxiosError',
    message: params.message ?? 'Request failed',
    response:
      params.status !== undefined || params.data !== undefined
        ? {
            status: params.status,
            data: params.data,
            statusText: '',
            headers: {},
            config: {},
          }
        : undefined,
    config: {},
    toJSON: () => ({}),
  } as AxiosErrorWithAppApiError
}

describe('errorNormalizer', () => {
  it('normalizes API error with clientMessage and fieldErrors', () => {
    const error = createAxiosLikeError({
      status: 400,
      data: {
        date: '2026-04-01T00:00:00Z',
        failure: { code: 'INVALID_INPUT', message: 'Validation failed' },
        data: {
          code: 'INVALID_INPUT',
          origin: 'CLIENT_REQUEST',
          clientRequestCause: 'USER_INPUT',
          clientMessage: 'Por favor revisa los campos.',
          fieldErrors: [{ field: 'email', message: 'Email invalido' }],
        },
      },
    })

    const normalized = normalizeApiError(error)

    expect(normalized.clientMessage).toBe('Por favor revisa los campos.')
    expect(normalized.code).toBe('INVALID_INPUT')
    expect(normalized.origin).toBe('CLIENT_REQUEST')
    expect(normalized.clientRequestCause).toBe('USER_INPUT')
    expect(normalized.fieldErrors).toHaveLength(1)
    expect(normalized.retryable).toBe(false)
  })

  it('marks server processing and 5xx errors as retryable', () => {
    const error = createAxiosLikeError({
      status: 503,
      data: {
        date: '2026-04-01T00:00:00Z',
        failure: { code: 'EXTERNAL_SERVICE_ERROR', message: 'Downstream failed' },
        data: {
          code: 'EXTERNAL_SERVICE_ERROR',
          origin: 'SERVER_PROCESSING',
          clientMessage: 'Servicio temporalmente no disponible.',
        },
      },
    })

    const normalized = normalizeApiError(error)

    expect(normalized.retryable).toBe(true)
    expect(normalized.httpStatus).toBe(503)
    expect(normalized.origin).toBe('SERVER_PROCESSING')
  })

  it('normalizes network error with retryable=true', () => {
    const error = createAxiosLikeError({
      message: 'Network Error',
    })

    void i18n.changeLanguage('en-US')
    const normalized = normalizeApiError(error)

    expect(normalized.clientMessage).toContain('could not complete communication with the server')
    expect(normalized.retryable).toBe(true)
    expect(normalized.httpStatus).toBeUndefined()

    void i18n.changeLanguage('es-CL')
  })

  it('returns attached appApiError when present in AxiosError', () => {
    const attached = new Error('Typed') as AppApiError
    attached.name = 'AppApiError'
    attached.kind = 'APP_API_ERROR'
    attached.clientMessage = 'Typed'
    attached.fieldErrors = []
    attached.retryable = false
    attached.raw = null

    const error = createAxiosLikeError({ status: 400 })
    error.appApiError = attached

    const resolved = getAppApiError(error)
    expect(resolved).toBe(attached)
  })

  it('isAppApiError identifies normalized errors', () => {
    const normalized = normalizeApiError(new Error('Boom'))
    expect(isAppApiError(normalized)).toBe(true)
    expect(isAppApiError(new Error('Nope'))).toBe(false)
  })

  it('maps snake_case backend fields: client_message and trace_id', () => {
    // Real backend 500 payload uses snake_case inside data
    const error = createAxiosLikeError({
      status: 500,
      data: {
        date: '2026-04-05T20:51:47.740944735',
        failure: { code: 'OPERATION_FAILED', message: 'Operation failed to complete' },
        data: {
          client_message: "We couldn't complete the request. Try again in a few moments.",
          code: 'OPERATION_FAILED',
          detail: "Contract cannot perform 'verifyCode' in state: PENDING_PAYMENT",
          exception: 'ContractStateViolationException',
          layer: 'DOMAIN',
          origin: 'SERVER_PROCESSING',
          trace_id: 'a5c9268a-0ca5-4d1c-b712-3f3b7b4e4cb7',
        } as unknown as import('@/types/base').ErrorData,
      },
    })

    const normalized = normalizeApiError(error)

    // client_message must win over failure.message
    expect(normalized.clientMessage).toBe("We couldn't complete the request. Try again in a few moments.")
    expect(normalized.traceId).toBe('a5c9268a-0ca5-4d1c-b712-3f3b7b4e4cb7')
    expect(normalized.origin).toBe('SERVER_PROCESSING')
    expect(normalized.code).toBe('OPERATION_FAILED')
    expect(normalized.retryable).toBe(true)
  })
})
