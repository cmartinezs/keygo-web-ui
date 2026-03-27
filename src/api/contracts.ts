// ⏳ pendiente — no existe endpoint público de auto-contratación en el backend.
// El único endpoint disponible es POST /api/v1/tenants (requiere Bearer JWT de ADMIN).
// Tracking: F-NEW-001 — Self-service tenant signup
import type { BaseResponse } from '@/types/base'

export type PlanId = 'starter' | 'business' | 'on-premise'

export interface ContractRequest {
  plan: PlanId
  organization_name: string
  owner_first_name: string
  owner_last_name: string
  owner_email: string
  phone?: string
  country: string
}

// ⏳ pendiente — simula POST /api/v1/public/contracts (no existe aún en el backend)
export async function submitContract(data: ContractRequest): Promise<BaseResponse<void>> {
  // Simulated network delay for the mock
  await new Promise<void>((resolve) => setTimeout(resolve, 1500))
  // In production this will be replaced by: apiClient.post('/api/v1/public/contracts', data)
  void data
  return {
    date: new Date().toISOString(),
    success: {
      code: 'CONTRACT_CREATED',
      message: 'Solicitud de contrato registrada exitosamente.',
    },
  }
}
