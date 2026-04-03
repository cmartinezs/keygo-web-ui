import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { TENANT } from '@/api/client'
import { getAppApiError } from '@/api/errorNormalizer'
import { PendingFeatureBadge } from '@/components/PendingFeatureBadge'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/config/network'
import {
  isRequestTimeout,
  notifyMutationTimeout,
  runGetWithRecovery,
} from '@/lib/network/recovery'
import {
  createUser,
  listUsers,
  resetUserPassword,
  updateUser,
  suspendUser,
  activateUser,
  getAdminUserSessions,
  USER_QUERY_KEYS,
} from '@/api/users'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type {
  CreateUserRequest,
  ResetPasswordRequest,
  UpdateUserRequest,
  UserData,
  AccountSessionData,
} from '@/types/user'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  PENDING: 'Pendiente',
}

const createUserSchema = z.object({
  username: z.string().min(3, 'Minimo 3 caracteres'),
  email: z.string().email('Email valido requerido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
})

const editUserSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
})

const resetPasswordSchema = z.object({
  new_password: z.string().min(8, 'Minimo 8 caracteres'),
})

type CreateUserFormData = z.infer<typeof createUserSchema>
type EditUserFormData = z.infer<typeof editUserSchema>
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface TenantModalProps {
  title: string
  dialogId: string
  onClose: () => void
  children: React.ReactNode
}

function TenantModal({ title, dialogId, onClose, children }: TenantModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={dialogId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
          <h2 id={dialogId} className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Cerrar dialogo"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default function TenantUsersPage() {
  const user = useCurrentUser()
  const tenantSlug = user?.tenantSlug ?? TENANT
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null)
  const [confirmStatusUser, setConfirmStatusUser] = useState<UserData | null>(null)
  const [viewingSessionsUser, setViewingSessionsUser] = useState<UserData | null>(null)

  async function fetchUsersWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: 'usuarios',
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () =>
        listUsers(tenantSlug, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    })
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: USER_QUERY_KEYS.all(tenantSlug),
    queryFn: ({ signal }) => fetchUsersWithRecovery(signal),
    retry: false,
  })

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
    },
  })

  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { first_name: '', last_name: '' },
  })

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: '' },
  })

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserRequest) =>
      createUser(tenantSlug, payload, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-user-create-${tenantSlug}-${payload.username.toLowerCase()}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all(tenantSlug) })
      createForm.reset()
      setIsCreateOpen(false)
      toast.success('Usuario creado correctamente')
    },
    onError: (mutationError) => {
      if (isRequestTimeout(mutationError)) {
        notifyMutationTimeout('creacion de usuario')
        return
      }
      toast.error(getAppApiError(mutationError).clientMessage)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserRequest) =>
      updateUser(tenantSlug, editingUser!.id, payload, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-user-update-${tenantSlug}-${editingUser!.id}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all(tenantSlug) })
      editForm.reset({ first_name: '', last_name: '' })
      setEditingUser(null)
      toast.success('Usuario actualizado correctamente')
    },
    onError: (mutationError) => {
      if (isRequestTimeout(mutationError)) {
        notifyMutationTimeout('actualizacion de usuario')
        return
      }
      toast.error(getAppApiError(mutationError).clientMessage)
    },
  })

  const resetMutation = useMutation({
    mutationFn: (payload: ResetPasswordRequest) =>
      resetUserPassword(tenantSlug, resetPasswordUser!.id, payload, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-user-reset-password-${tenantSlug}-${resetPasswordUser!.id}`,
      }),
    onSuccess: () => {
      resetForm.reset({ new_password: '' })
      setResetPasswordUser(null)
      toast.success('Contrasena restablecida correctamente')
    },
    onError: (mutationError) => {
      if (isRequestTimeout(mutationError)) {
        notifyMutationTimeout('reseteo de contrasena')
        return
      }
      toast.error(getAppApiError(mutationError).clientMessage)
    },
  })

  // ── T-033: Suspend / Activate ⏳ pendiente backend ─────────────────────────

  const suspendMutation = useMutation({
    mutationFn: (userId: string) =>
      suspendUser(tenantSlug, userId, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-user-suspend-${tenantSlug}-${userId}`,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all(tenantSlug) })
      setConfirmStatusUser(null)
      if (result.already_suspended) {
        toast.info('El usuario ya estaba suspendido')
      } else {
        toast.success('Usuario suspendido correctamente')
      }
    },
    onError: (mutationError) => {
      if (isRequestTimeout(mutationError)) {
        notifyMutationTimeout('suspension de usuario')
        return
      }
      toast.error(getAppApiError(mutationError).clientMessage)
    },
  })

  const activateMutation = useMutation({
    mutationFn: (userId: string) =>
      activateUser(tenantSlug, userId, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-user-activate-${tenantSlug}-${userId}`,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.all(tenantSlug) })
      setConfirmStatusUser(null)
      if (result.already_active) {
        toast.info('El usuario ya estaba activo')
      } else {
        toast.success('Usuario activado correctamente')
      }
    },
    onError: (mutationError) => {
      if (isRequestTimeout(mutationError)) {
        notifyMutationTimeout('activacion de usuario')
        return
      }
      toast.error(getAppApiError(mutationError).clientMessage)
    },
  })

  // ── T-110: Sesiones de usuario (admin) ⏳ pendiente backend ────────────────

  const {
    data: adminSessions,
    isLoading: isLoadingSessions,
    isError: isSessionsError,
  } = useQuery({
    queryKey: USER_QUERY_KEYS.sessions(tenantSlug, viewingSessionsUser?.id ?? ''),
    queryFn: ({ signal }) =>
      getAdminUserSessions(tenantSlug, viewingSessionsUser!.id, {
        signal,
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      }),
    enabled: Boolean(viewingSessionsUser),
    retry: false,
  })

  function openEditModal(item: UserData) {
    setEditingUser(item)
    editForm.reset({
      first_name: item.first_name ?? '',
      last_name: item.last_name ?? '',
    })
  }

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Usuarios del tenant</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestion operativa de cuentas para {tenantSlug}.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <PendingFeatureBadge
              featureCode="T-033"
              title="Suspender/Activar usuario — Backend en desarrollo"
              description="Suspender y activar usuarios individuales. Botones para cambiar el estado están en la fila de cada usuario (Suspender/Activar). Actualmente funciona con mocks. Una vez el backend implemente el endpoint, estos cambios serán persistentes."
            />
            <PendingFeatureBadge
              featureCode="T-110"
              title="Ver sesiones del usuario — Backend en desarrollo"
              description="Ver todas las sesiones activas de un usuario específico (navegador, SO, IP, último acceso). Botón 'Sesiones' en cada fila. Actualmente devuelve datos simulados. Cuando el backend publique el endpoint, mostrará las sesiones reales."
            />
          </div>
        </header>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          Crear usuario
        </button>
      </div>

      {isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
        >
          Cargando usuarios...
        </div>
      ) : null}

      {isError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {error instanceof Error ? error.message : 'No se pudieron cargar los usuarios.'}
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
          <table className="w-full min-w-[840px] text-sm">
            <caption className="sr-only">Listado de usuarios del tenant</caption>
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-white/10 dark:text-slate-400">
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 dark:border-white/5">
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{item.username}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.email}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {[item.first_name, item.last_name].filter(Boolean).join(' ') || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {STATUS_LABEL[item.status] ?? item.status}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded bg-slate-200 px-3 py-1 text-xs text-slate-800 transition-colors hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetPasswordUser(item)}
                        className="rounded bg-slate-200 px-3 py-1 text-xs text-slate-800 transition-colors hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        Resetear contrasena
                      </button>
                      {item.status === 'SUSPENDED' ? (
                        <button
                          type="button"
                          onClick={() => setConfirmStatusUser(item)}
                          className="rounded bg-emerald-100 px-3 py-1 text-xs text-emerald-800 transition-colors hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30"
                        >
                          Activar
                        </button>
                      ) : null}
                      {item.status !== 'SUSPENDED' ? (
                        <button
                          type="button"
                          onClick={() => setConfirmStatusUser(item)}
                          className="rounded bg-amber-100 px-3 py-1 text-xs text-amber-800 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30"
                        >
                          Suspender
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setViewingSessionsUser(item)}
                        className="rounded bg-slate-200 px-3 py-1 text-xs text-slate-800 transition-colors hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                      >
                        Sesiones
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
              No hay usuarios registrados para este tenant.
            </p>
          ) : null}
        </section>
      ) : null}

      {isCreateOpen ? (
        <TenantModal
          title="Crear usuario"
          dialogId="create-user-title"
          onClose={() => {
            setIsCreateOpen(false)
            createForm.reset()
          }}
        >
          <form className="space-y-4" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
            <div>
              <label htmlFor="create-username" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Username
              </label>
              <input
                id="create-username"
                type="text"
                aria-invalid={Boolean(createForm.formState.errors.username)}
                aria-describedby={createForm.formState.errors.username ? 'create-username-error' : undefined}
                {...createForm.register('username')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                disabled={createMutation.isPending}
              />
              {createForm.formState.errors.username ? (
                <p id="create-username-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {createForm.formState.errors.username.message}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="create-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                id="create-email"
                type="email"
                aria-invalid={Boolean(createForm.formState.errors.email)}
                aria-describedby={createForm.formState.errors.email ? 'create-email-error' : undefined}
                {...createForm.register('email')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                disabled={createMutation.isPending}
              />
              {createForm.formState.errors.email ? (
                <p id="create-email-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {createForm.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="create-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Contrasena
              </label>
              <input
                id="create-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(createForm.formState.errors.password)}
                aria-describedby={createForm.formState.errors.password ? 'create-password-error' : undefined}
                {...createForm.register('password')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                disabled={createMutation.isPending}
              />
              {createForm.formState.errors.password ? (
                <p id="create-password-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {createForm.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="create-first-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nombre
                </label>
                <input
                  id="create-first-name"
                  type="text"
                  {...createForm.register('first_name')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  disabled={createMutation.isPending}
                />
              </div>

              <div>
                <label htmlFor="create-last-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Apellido
                </label>
                <input
                  id="create-last-name"
                  type="text"
                  {...createForm.register('last_name')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  disabled={createMutation.isPending}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </form>
        </TenantModal>
      ) : null}

      {editingUser ? (
        <TenantModal
          title="Editar usuario"
          dialogId="edit-user-title"
          onClose={() => {
            setEditingUser(null)
            editForm.reset({ first_name: '', last_name: '' })
          }}
        >
          <form className="space-y-4" onSubmit={editForm.handleSubmit((values) => updateMutation.mutate(values))}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-300">
              <p>
                <span className="font-medium text-slate-900 dark:text-white">Usuario:</span> {editingUser.username}
              </p>
              <p>
                <span className="font-medium text-slate-900 dark:text-white">Email:</span> {editingUser.email}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-first-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nombre
                </label>
                <input
                  id="edit-first-name"
                  type="text"
                  {...editForm.register('first_name')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  disabled={updateMutation.isPending}
                />
              </div>

              <div>
                <label htmlFor="edit-last-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Apellido
                </label>
                <input
                  id="edit-last-name"
                  type="text"
                  {...editForm.register('last_name')}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  disabled={updateMutation.isPending}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </TenantModal>
      ) : null}

      {resetPasswordUser ? (
        <TenantModal
          title="Resetear contrasena"
          dialogId="reset-password-title"
          onClose={() => {
            setResetPasswordUser(null)
            resetForm.reset({ new_password: '' })
          }}
        >
          <form className="space-y-4" onSubmit={resetForm.handleSubmit((values) => resetMutation.mutate(values))}>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              La nueva contrasena se aplicara de inmediato para {resetPasswordUser.username}.
            </div>

            <div>
              <label htmlFor="reset-password-input" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Nueva contrasena
              </label>
              <input
                id="reset-password-input"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(resetForm.formState.errors.new_password)}
                aria-describedby={resetForm.formState.errors.new_password ? 'reset-password-input-error' : undefined}
                {...resetForm.register('new_password')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                disabled={resetMutation.isPending}
              />
              {resetForm.formState.errors.new_password ? (
                <p id="reset-password-input-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {resetForm.formState.errors.new_password.message}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetPasswordUser(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={resetMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {resetMutation.isPending ? 'Restableciendo...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </TenantModal>
      ) : null}

      {/* ── T-033: Confirmar suspend / activate ⏳ pendiente backend ─────────── */}
      {confirmStatusUser ? (
        <TenantModal
          title={confirmStatusUser.status === 'SUSPENDED' ? 'Activar usuario' : 'Suspender usuario'}
          dialogId="confirm-status-title"
          onClose={() => setConfirmStatusUser(null)}
        >
          <div className="space-y-4">
            {confirmStatusUser.status === 'SUSPENDED' ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                El usuario <strong>{confirmStatusUser.username}</strong> recuperara acceso al sistema.
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                El usuario <strong>{confirmStatusUser.username}</strong> no podra iniciar sesion mientras este suspendido.
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmStatusUser(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              {confirmStatusUser.status === 'SUSPENDED' ? (
                <button
                  type="button"
                  disabled={activateMutation.isPending}
                  onClick={() => activateMutation.mutate(confirmStatusUser.id)}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  {activateMutation.isPending ? 'Activando...' : 'Activar'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={suspendMutation.isPending}
                  onClick={() => suspendMutation.mutate(confirmStatusUser.id)}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {suspendMutation.isPending ? 'Suspendiendo...' : 'Suspender'}
                </button>
              )}
            </div>
          </div>
        </TenantModal>
      ) : null}

      {/* ── T-110: Sesiones activas del usuario (admin) ⏳ pendiente backend ─── */}
      {viewingSessionsUser ? (
        <TenantModal
          title={`Sesiones de ${viewingSessionsUser.username}`}
          dialogId="user-sessions-title"
          onClose={() => setViewingSessionsUser(null)}
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sesiones activas detectadas para este usuario.
            </p>
            {isLoadingSessions ? (
              <p role="status" aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">
                Cargando sesiones...
              </p>
            ) : null}
            {isSessionsError ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                No se pudieron cargar las sesiones.
              </p>
            ) : null}
            {!isLoadingSessions && !isSessionsError && adminSessions ? (
              adminSessions.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Sin sesiones activas.</p>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-white/5">
                  {adminSessions.map((session: AccountSessionData) => (
                    <li key={session.session_id} className="py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {session.browser} / {session.os}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            session.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        IP: {session.ip_address} &mdash; Dispositivo: {session.device_type}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        Ultimo acceso:{' '}
                        {new Date(session.last_accessed_at).toLocaleString('es-CL', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingSessionsUser(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </TenantModal>
      ) : null}
    </div>
  )
}
