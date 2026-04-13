import { normalizePlatformRoleCode } from '@/shared/types/roles'

interface SensitiveRoleAssignmentParams {
  selectedRoleCode: string | null | undefined
  actorUserId: string | null | undefined
  targetUserId: string
}

export function requiresSensitivePlatformRoleConfirmation({
  selectedRoleCode,
  actorUserId,
  targetUserId,
}: SensitiveRoleAssignmentParams): boolean {
  const normalizedRoleCode = normalizePlatformRoleCode(selectedRoleCode)
  if (normalizedRoleCode !== 'keygo_admin') return false

  return !actorUserId || actorUserId !== targetUserId
}

export function matchesSensitiveConfirmationPhrase(
  expectedPhrase: string,
  enteredPhrase: string | null | undefined,
): boolean {
  return enteredPhrase?.trim() === expectedPhrase
}
