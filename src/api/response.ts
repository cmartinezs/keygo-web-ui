import type { BaseResponse } from '@/types/base'
import { buildAppApiErrorFromBaseResponse } from './errorNormalizer'

export function unwrapResponseData<T>(body: BaseResponse<T>, fallbackMessage: string): T {
  if (body.data !== undefined && body.data !== null) {
    return body.data
  }

  throw buildAppApiErrorFromBaseResponse(body, fallbackMessage)
}
