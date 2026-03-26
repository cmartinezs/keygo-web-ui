export const APP_ROLES = ['ADMIN', 'ADMIN_TENANT', 'USER_TENANT'] as const
export type AppRole = (typeof APP_ROLES)[number]
