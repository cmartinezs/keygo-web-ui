export const PLATFORM_ROLES = ['keygo_admin', 'keygo_tenant_admin', 'keygo_user'] as const
export type PlatformRole = (typeof PLATFORM_ROLES)[number]

const ROLE_PRIORITY: PlatformRole[] = ['keygo_admin', 'keygo_tenant_admin', 'keygo_user']

export function resolvePrimaryRole(roles: PlatformRole[]): PlatformRole | null {
	return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null
}

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
	keygo_admin: 'Administrador Global',
	keygo_tenant_admin: 'Administrador Tenant',
	keygo_user: 'Usuario Tenant',
}
