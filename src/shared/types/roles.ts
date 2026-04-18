export const PLATFORM_ROLES = ['keygo_admin', 'keygo_account_admin', 'keygo_user'] as const
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

const ROLE_PRIORITY: PlatformRole[] = ['keygo_admin', 'keygo_account_admin', 'keygo_user']

export function normalizePlatformRoleCode(role: string | null | undefined): PlatformRole | null {
	if (typeof role !== 'string') return null
	const normalizedRole = role.trim().toLowerCase()
	return PLATFORM_ROLES.includes(normalizedRole as PlatformRole)
		? (normalizedRole as PlatformRole)
		: null
}

export function resolvePrimaryRole(roles: PlatformRole[]): PlatformRole | null {
	return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null
}

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
	keygo_admin: 'Administrador Global',
	keygo_account_admin: 'Administrador de Cuenta',
	keygo_user: 'Usuario KeyGo',
}
