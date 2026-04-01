import { describe, expect, it } from 'vitest'
import { unwrapResponseData } from './response'
import type { BaseResponse } from '@/types/base'

describe('unwrapResponseData', () => {
  it('returns body.data when present', () => {
    const body: BaseResponse<{ ok: boolean }> = {
      date: '2026-04-01T00:00:00Z',
      data: { ok: true },
    }

    expect(unwrapResponseData(body, 'fallback')).toEqual({ ok: true })
  })

  it('throws AppApiError using failure message when data is absent', () => {
    const body: BaseResponse<unknown> = {
      date: '2026-04-01T00:00:00Z',
      failure: { code: 'INVALID_INPUT', message: 'Validation failed' },
    }

    try {
      unwrapResponseData(body, 'Mensaje fallback')
      throw new Error('Expected unwrapResponseData to throw')
    } catch (error) {
      const appError = error as {
        name: string
        kind: string
        code?: string
        clientMessage: string
        fieldErrors: unknown[]
      }

      expect(appError.name).toBe('AppApiError')
      expect(appError.kind).toBe('APP_API_ERROR')
      expect(appError.code).toBe('INVALID_INPUT')
      expect(appError.clientMessage).toBe('Validation failed')
      expect(appError.fieldErrors).toHaveLength(0)
    }
  })

  it('uses fallback message when backend does not provide one', () => {
    const body: BaseResponse<unknown> = {
      date: '2026-04-01T00:00:00Z',
    }

    try {
      unwrapResponseData(body, 'Fallback esperado')
      throw new Error('Expected unwrapResponseData to throw')
    } catch (error) {
      const appError = error as { clientMessage: string }
      expect(appError.clientMessage).toBe('Fallback esperado')
    }
  })
})
