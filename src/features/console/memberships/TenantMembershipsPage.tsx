import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { TENANT } from '@/shared/api/client'
import { SelectDropdown } from '@/shared/ui/SelectDropdown'
import { Paginator } from '@/shared/ui/Paginator'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'
import {
  IconPlus,
  IconXCircle,
  IconX,
} from '@/shared/ui/icons'
import { listUsers, USER_QUERY_KEYS } from '@/features/console/users/api'
import { listClientApps, CLIENT_APP_QUERY_KEYS, listAppRoles } from '@/features/console/apps/api'
import { listMembershipsByUser, createMembership, revokeMembership, MEMBERSHIP_QUERY_KEYS } from '@/features/console/memberships/api'
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer'
import { applyFieldErrors } from '@/shared/hooks/useFieldErrors'
import { ServerErrorBanner } from '@/shared/ui/ServerErrorBanner'
import type { CreateMembershipRequest } from '@/shared/types/membership'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import {
  isRequestTimeout,
  notifyMutationTimeout,
  runGetWithRecovery,
} from '@/shared/lib/network/recovery'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activa',
  SUSPENDED: 'Suspendida',
  PENDING: 'Pendiente',
}

const CreateMembershipSchema = z.object({
  user_id: z.string().min(1, 'Usuario requerido'),
  client_app_id: z.string().min(1, 'Aplicación requerida'),
  role_codes: z.array(z.string()).min(1, 'Selecciona al menos un rol'),
})

type CreateMembershipFormData = z.infer<typeof CreateMembershipSchema>

export default function TenantMembershipsPage() {
  const user = useCurrentUser()
  const tenantSlug = user?.tenantSlug ?? TENANT
  const queryClient = useQueryClient()
  const [manualSelectedUserId, setManualSelectedUserId] = useState<string>('')
  const [membershipsCurrentPage, setMembershipsCurrentPage] = useState(0)
  const MEMBERSHIPS_PAGE_SIZE = 20
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedAppForRoles, setSelectedAppForRoles] = useState<string>('')
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null)

  const usersQuery = useQuery({
    queryKey: USER_QUERY_KEYS.all(tenantSlug),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'usuarios',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          listUsers(tenantSlug, 0, 20, {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    retry: false,
  })

  const appsQuery = useQuery({
    queryKey: CLIENT_APP_QUERY_KEYS.all(tenantSlug),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'aplicaciones',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          listClientApps(tenantSlug, 0, 20, {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    retry: false,
  })

  const selectedUserId = manualSelectedUserId || usersQuery.data?.content?.[0]?.id || ''

  const membershipsQuery = useQuery({
    queryKey: MEMBERSHIP_QUERY_KEYS.byUser(tenantSlug, selectedUserId, membershipsCurrentPage, MEMBERSHIPS_PAGE_SIZE),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'memberships',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          listMembershipsByUser(tenantSlug, selectedUserId, membershipsCurrentPage, MEMBERSHIPS_PAGE_SIZE, {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    enabled: selectedUserId.length > 0,
    retry: false,
  })

  const appRolesQuery = useQuery({
    queryKey: ['app-roles', tenantSlug, selectedAppForRoles],
    queryFn: ({ signal }) =>
      (selectedAppForRoles
        ? runGetWithRecovery({
            signal,
            label: 'roles de aplicacion',
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
            retryDelayMs: NETWORK_RETRY_DELAY_MS,
            maxRetries: NETWORK_MAX_RETRIES,
            query: () =>
              listAppRoles(tenantSlug, selectedAppForRoles, 0, 20, {
                signal,
                timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
              }),
          })
        : Promise.resolve({ content: [], page: 0, size: 20, total_elements: 0, total_pages: 0, last: true })),
    enabled: selectedAppForRoles.length > 0,
    retry: false,
  })

  const appNameById = new Map((appsQuery.data?.content ?? []).map((app) => [app.id, app.name]))

  const createForm = useForm<CreateMembershipFormData>({
    resolver: zodResolver(CreateMembershipSchema),
    defaultValues: { user_id: '', client_app_id: '', role_codes: [] },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateMembershipRequest) =>
      createMembership(tenantSlug, data, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-membership-create-${tenantSlug}-${data.user_id}-${data.client_app_id}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEYS.byUser(tenantSlug, createForm.getValues().user_id) })
      createForm.reset()
      setSelectedAppForRoles('')
      setIsCreateOpen(false)
      toast.success('Membership creada correctamente')
    },
    onError: (mutationError) => {
      if (isRequestTimeout(mutationError)) {
        notifyMutationTimeout('creacion de membership')
        return
      }
      const appError = getAppApiError(mutationError)
      if (!applyFieldErrors(appError, createForm.setError).hasErrors) {
        toast.error(getUserMessage(appError))
      }
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (membershipId: string) =>
      revokeMembership(tenantSlug, membershipId, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-membership-revoke-${tenantSlug}-${membershipId}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIP_QUERY_KEYS.byUser(tenantSlug, selectedUserId) })
      setRevokeConfirmId(null)
      toast.success('Membership revocada correctamente')
    },
    onError: (mutationError) => {
      if (isRequestTimeout(mutationError)) {
        notifyMutationTimeout('revocacion de membership')
        return
      }
      toast.error(getUserMessage(getAppApiError(mutationError)))
    },
  })

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Memberships</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Asignaciones usuario-app para el tenant {tenantSlug}.
          </p>
        </header>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <IconPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
          Crear membership
        </button>
      </div>

      {usersQuery.isError && (
        <div role="alert" className="rounded-xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {usersQuery.error instanceof Error ? usersQuery.error.message : 'No se pudieron cargar los usuarios del tenant.'}
        </div>
      )}

      {!usersQuery.isError && (
        <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-4 space-y-4">
          <p id="membership-user-label" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Usuario a revisar
          </p>
          <SelectDropdown
            value={selectedUserId}
            onChange={setManualSelectedUserId}
            options={(usersQuery.data?.content ?? []).map((tenantUser) => ({
              value: tenantUser.id,
              label: `${tenantUser.username} (${tenantUser.email})`,
            }))}
            label="Selecciona un usuario"
            ariaLabel="Usuario a revisar"
            labelledBy="membership-user-label"
            disabled={usersQuery.isLoading || (usersQuery.data?.content?.length ?? 0) === 0}
            containerClassName="w-full max-w-lg"
            hideSelectedOption
            selectedValueClassName="text-indigo-600 dark:text-indigo-400"
            triggerClassName="w-full justify-between rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-800"
            panelClassName="absolute right-0 top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50"
          />

          {usersQuery.isLoading && (
            <p role="status" aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">Cargando usuarios...</p>
          )}

          {!usersQuery.isLoading && (usersQuery.data?.content?.length ?? 0) === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No existen usuarios para consultar memberships.</p>
          )}
        </section>
      )}

      {membershipsQuery.isError && (
        <div role="alert" className="rounded-xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {membershipsQuery.error instanceof Error ? membershipsQuery.error.message : 'No se pudieron cargar las memberships.'}
        </div>
      )}

      {selectedUserId && !membershipsQuery.isError && (
        <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-x-auto">
          {membershipsQuery.isLoading ? (
            <p role="status" aria-live="polite" className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">Cargando memberships...</p>
          ) : (
            <table className="w-full min-w-[820px] text-sm">
              <caption className="sr-only">Listado de memberships por usuario</caption>
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-left text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-semibold">App</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Roles asignados</th>
                  <th className="px-4 py-3 font-semibold">Creada</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(membershipsQuery.data?.content ?? []).map((membership) => (
                  <tr key={membership.id} className="border-b border-slate-100 dark:border-white/5">
                    <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                      {appNameById.get(membership.client_app_id) ?? membership.client_app_id}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {STATUS_LABEL[membership.status] ?? membership.status}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {membership.role_ids.length > 0 ? membership.role_ids.join(', ') : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {new Date(membership.created_at).toLocaleString('es-CL')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setRevokeConfirmId(membership.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-red-200 dark:bg-red-700/30 text-red-800 dark:text-red-200 rounded hover:bg-red-300 dark:hover:bg-red-700/50 transition-colors"
                      >
                        <IconXCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!membershipsQuery.isLoading && (membershipsQuery.data?.content?.length ?? 0) === 0 && (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No hay memberships para el usuario seleccionado.</p>
          )}

          {membershipsQuery.data && membershipsQuery.data.total_pages > 1 && (
            <Paginator
              currentPage={membershipsQuery.data.page}
              totalPages={membershipsQuery.data.total_pages}
              totalElements={membershipsQuery.data.total_elements}
              pageSize={membershipsQuery.data.size}
              onPageChange={setMembershipsCurrentPage}
              disabled={membershipsQuery.isLoading}
            />
          )}
        </section>
      )}

      {/* Modal: Crear membership */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-membership-title"
          onClick={(e) => { if (e.target === e.currentTarget) setIsCreateOpen(false) }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
              <h2 id="create-membership-title" className="text-lg font-bold text-slate-900 dark:text-white">Crear membership</h2>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {createMutation.isError && (
                <div className="rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                  {getAppApiError(createMutation.error)?.clientMessage || 'Error al crear membership'}
                </div>
              )}

              <div>
                <p id="user-id-label" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Usuario *
                </p>
                <Controller
                  name="user_id"
                  control={createForm.control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value}
                      onChange={field.onChange}
                      options={[
                        { value: '', label: '-- Selecciona un usuario --' },
                        ...((usersQuery.data?.content ?? []).map((u) => ({
                          value: u.id,
                          label: `${u.username} (${u.email})`,
                        }))),
                      ]}
                      label="-- Selecciona un usuario --"
                      ariaLabel="Usuario"
                      labelledBy="user-id-label"
                      disabled={createMutation.isPending || usersQuery.isLoading}
                      containerClassName="w-full"
                      selectedValueClassName="text-indigo-600 dark:text-indigo-400"
                      triggerClassName="w-full justify-between px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm hover:bg-white dark:hover:bg-slate-800"
                      panelClassName="absolute right-0 top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50"
                    />
                  )}
                />
                {createForm.formState.errors.user_id && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createForm.formState.errors.user_id.message}</p>
                )}
              </div>

              <div>
                <p id="client-app-id-label" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Aplicación *
                </p>
                <Controller
                  name="client_app_id"
                  control={createForm.control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value}
                      onChange={(nextValue) => {
                        field.onChange(nextValue)
                        setSelectedAppForRoles(nextValue)
                      }}
                      options={[
                        { value: '', label: '-- Selecciona una aplicación --' },
                        ...((appsQuery.data?.content ?? []).map((app) => ({
                          value: app.id,
                          label: app.name,
                        }))),
                      ]}
                      label="-- Selecciona una aplicación --"
                      ariaLabel="Aplicación"
                      labelledBy="client-app-id-label"
                      disabled={createMutation.isPending || appsQuery.isLoading}
                      containerClassName="w-full"
                      selectedValueClassName="text-indigo-600 dark:text-indigo-400"
                      triggerClassName="w-full justify-between px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm hover:bg-white dark:hover:bg-slate-800"
                      panelClassName="absolute right-0 top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50"
                    />
                  )}
                />
                {createForm.formState.errors.client_app_id && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createForm.formState.errors.client_app_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Roles *
                </label>
                {appRolesQuery.isLoading && <p className="text-xs text-slate-500">Cargando roles...</p>}
                {appRolesQuery.isError && <p className="text-xs text-red-600">Error al cargar roles</p>}
                {appRolesQuery.data && appRolesQuery.data.content.length === 0 && (
                  <p className="text-xs text-slate-500">La aplicación no tiene roles definidos</p>
                )}
                <div className="space-y-2">
                  {(appRolesQuery.data?.content ?? []).map((role) => (
                    <label key={role.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        value={role.code}
                        onChange={(e) => {
                          const current = createForm.getValues('role_codes')
                          if (e.target.checked) {
                            createForm.setValue('role_codes', [...current, role.code])
                          } else {
                            createForm.setValue('role_codes', current.filter((r) => r !== role.code))
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600"
                        disabled={createMutation.isPending}
                      />
                      <span className="text-slate-700 dark:text-slate-200">{role.display_name || role.code}</span>
                    </label>
                  ))}
                </div>
                {createForm.formState.errors.role_codes && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createForm.formState.errors.role_codes.message}</p>
                )}
              </div>

              <ServerErrorBanner errors={createForm.formState.errors} />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <IconX className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
                >
                  {createMutation.isPending ? (
                    <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <IconPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  {createMutation.isPending ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar revoke */}
      {revokeConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revoke-title"
          onClick={(e) => { if (e.target === e.currentTarget) setRevokeConfirmId(null) }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
              <h2 id="revoke-title" className="text-lg font-bold text-slate-900 dark:text-white">Revocar membership</h2>
              <button
                type="button"
                onClick={() => setRevokeConfirmId(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {revokeMutation.isError && (
                <div className="rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                  {getAppApiError(revokeMutation.error)?.clientMessage || 'Error al revocar membership'}
                </div>
              )}

              <p className="text-sm text-slate-600 dark:text-slate-400">
                ¿Estás seguro de que deseas revocar este membership? El usuario perderá acceso a la aplicación inmediatamente.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRevokeConfirmId(null)}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <IconX className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => revokeMutation.mutate(revokeConfirmId)}
                  disabled={revokeMutation.isPending}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors"
                >
                  {revokeMutation.isPending ? (
                    <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <IconXCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  {revokeMutation.isPending ? 'Revocando...' : 'Revocar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
