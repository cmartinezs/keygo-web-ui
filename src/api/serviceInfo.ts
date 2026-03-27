import type { BaseResponse } from '@/types/base'
import { apiClient, API_V1 } from './client'

export interface ServiceInfoData {
  title: string
  name: string
  version: string
  environment?: string
  status?: string
}

export async function getServiceInfo(): Promise<ServiceInfoData> {
  const response = await apiClient.get<BaseResponse<ServiceInfoData>>(`${API_V1}/service/info`)
  const body = response.data
  if (!body.data) throw new Error(body.failure?.message ?? 'Failed to fetch service info')
  return body.data
}
