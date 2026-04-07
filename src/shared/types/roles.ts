export const APP_ROLES = ['ADMIN', 'ADMIN_TENANT', 'USER_TENANT'] as const
export type AppRole = (typeof APP_ROLES)[number]

const ROLE_PRIORITY: AppRole[] = ['ADMIN', 'ADMIN_TENANT', 'USER_TENANT']

export function resolvePrimaryRole(roles: AppRole[]): AppRole | null {
	return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null
}

export const APP_ROLE_LABELS: Record<AppRole, string> = {
	ADMIN: 'Administrador Global',
	ADMIN_TENANT: 'Administrador Tenant',
	USER_TENANT: 'Usuario Tenant',
}
