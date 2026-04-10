import { useState } from 'react'
import { Controller, useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { listClientApps, createClientApp, rotateClientAppSecret, CLIENT_APP_QUERY_KEYS } from '@/features/console/apps/api'
import type { GrantType, CreateClientAppRequest } from '@/shared/types/clientapp'
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer'
import { applyFieldErrors } from '@/shared/hooks/useFieldErrors'
import { ServerErrorBanner } from '@/shared/ui/ServerErrorBanner'
import { Paginator } from '@/shared/ui/Paginator'
import { TENANT } from '@/shared/api/client'
import { SelectDropdown } from '@/shared/ui/SelectDropdown'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'
import {
  IconPlus,
  IconRefresh,
  IconX,
  IconClipboard,
  IconCheckmark,
} from '@/shared/ui/icons'
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
  INACTIVE: 'Inactiva',
}

const APP_TYPE_OPTIONS = [
  { value: 'PUBLIC', label: 'Pública' },
  { value: 'CONFIDENTIAL', label: 'Confidencial' },
] as const

const GRANT_OPTIONS = [
  { value: 'AUTHORIZATION_CODE', label: 'Authorization Code' },
  { value: 'CLIENT_CREDENTIALS', label: 'Client Credentials' },
  { value: 'REFRESH_TOKEN', label: 'Refresh Token' },
  { value: 'IMPLICIT', label: 'Implicit' },
] as const

const GRANT_TYPES = ['AUTHORIZATION_CODE', 'CLIENT_CREDENTIALS', 'REFRESH_TOKEN', 'IMPLICIT'] as const

const CreateClientAppSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  type: z.enum(['PUBLIC', 'CONFIDENTIAL'] as const),
  grants: z.array(z.object({ value: z.enum(GRANT_TYPES) })).min(1, 'Selecciona al menos un grant'),
  redirect_uris: z.array(z.string().url('URL válida')).optional(),
  scopes: z.array(z.string()).optional(),
})

type CreateClientAppFormData = z.infer<typeof CreateClientAppSchema>

export default function TenantAppsPage() {
  const user = useCurrentUser()
  const tenantSlug = user?.tenantSlug ?? TENANT
  const queryClient = useQueryClient()

  const [currentPage, setCurrentPage] = useState(0)
  const PAGE_SIZE = 20
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [rotateSecretAppId, setRotateSecretAppId] = useState<string | null>(null)
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null)

  async function fetchAppsWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: 'aplicaciones',
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () =>
        listClientApps(tenantSlug, currentPage, PAGE_SIZE, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    })
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: CLIENT_APP_QUERY_KEYS.paginated(tenantSlug, currentPage, PAGE_SIZE),
    queryFn: ({ signal }) => fetchAppsWithRecovery(signal),
    retry: false,
  })

  const createForm = useForm<CreateClientAppFormData>({
    resolver: zodResolver(CreateClientAppSchema),
    defaultValues: { name: '', description: '', type: 'PUBLIC', grants: [{ value: 'AUTHORIZATION_CODE' }], redirect_uris: [], scopes: [] },
  })

  const { fields: grantFields, append: appendGrant, remove: removeGrant } = useFieldArray({
    control: createForm.control,
    name: 'grants',
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateClientAppRequest) =>
      createClientApp(tenantSlug, data, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-app-create-${tenantSlug}-${data.name.toLowerCase()}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_APP_QUERY_KEYS.all(tenantSlug) })
      createForm.reset()
      setIsCreateOpen(false)
      toast.success('Aplicacion creada correctamente')
    },
    onError: (mutationError) => {
      if (isRequestTimeout(mutationError)) {
        notifyMutationTimeout('creacion de aplicacion')
        return
      }
      const appError = getAppApiError(mutationError)
      if (!applyFieldErrors(appError, createForm.setError).hasErrors) {
        toast.error(getUserMessage(appError))
      }
    },
  })

  const rotateMutation = useMutation({
    mutationFn: (clientId: string) =>
      rotateClientAppSecret(tenantSlug, clientId, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-app-rotate-secret-${tenantSlug}-${clientId}`,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CLIENT_APP_QUERY_KEYS.all(tenantSlug) })
      setRotatedSecret(data.client_secret)
    },
    onError: (mutationError) => {
      if (isRequestTimeout(mutationError)) {
        notifyMutationTimeout('rotacion de secret')
        return
      }
      toast.error(getUserMessage(getAppApiError(mutationError)))
    },
  })

  return (
    <div className="max-w-screen-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aplicaciones del tenant</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Catalogo de client apps registradas para {tenantSlug}.
          </p>
        </header>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <IconPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
          Crear aplicación
        </button>
      </div>

      {isLoading && (
        <div role="status" aria-live="polite" className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 text-sm text-slate-500 dark:text-slate-400">
          Cargando aplicaciones...
        </div>
      )}

      {isError && (
        <div role="alert" className="rounded-xl border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
          {error instanceof Error ? error.message : 'No se pudieron cargar las aplicaciones.'}
        </div>
      )}

      {!isLoading && !isError && (
        <section className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <caption className="sr-only">Listado de aplicaciones del tenant</caption>
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Client ID</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Grants</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.content?.map((app) => (
                <tr key={app.id} className="border-b border-slate-100 dark:border-white/5">
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{app.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{app.client_id}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{app.type}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{STATUS_LABEL[app.status] ?? app.status}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{app.grants.join(', ')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setRotateSecretAppId(app.client_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      <IconRefresh className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Rotar secret
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.content.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No hay aplicaciones registradas para este tenant.</p>
          )}

          {data && data.total_pages > 1 && (
            <Paginator
              currentPage={data.page}
              totalPages={data.total_pages}
              totalElements={data.total_elements}
              pageSize={data.size}
              onPageChange={setCurrentPage}
              disabled={isLoading}
            />
          )}
        </section>
      )}

      {/* Modal: Crear aplicación */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-app-title"
          onClick={(e) => { if (e.target === e.currentTarget) setIsCreateOpen(false) }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
              <h2 id="create-app-title" className="text-lg font-bold text-slate-900 dark:text-white">Crear aplicación</h2>
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

            <form onSubmit={createForm.handleSubmit((formData) => {
              const payload: CreateClientAppRequest = {
                ...formData,
                grants: formData.grants.map((g) => g.value),
              }
              createMutation.mutate(payload)
            })} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {createMutation.isError && (
                <div className="rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                  {getAppApiError(createMutation.error)?.clientMessage || 'Error al crear aplicación'}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Nombre *
                </label>
                <input
                  id="name"
                  type="text"
                  {...createForm.register('name')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  disabled={createMutation.isPending}
                />
                {createForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Descripción
                </label>
                <textarea
                  id="description"
                  {...createForm.register('description')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  rows={2}
                  disabled={createMutation.isPending}
                />
              </div>

              <div>
                <p id="type-label" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Tipo *
                </p>
                <Controller
                  name="type"
                  control={createForm.control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value}
                      onChange={field.onChange}
                      options={[...APP_TYPE_OPTIONS]}
                      label="Tipo"
                      ariaLabel="Tipo de aplicación"
                      labelledBy="type-label"
                      disabled={createMutation.isPending}
                      containerClassName="w-full"
                      hideSelectedOption
                      selectedValueClassName="text-indigo-600 dark:text-indigo-400"
                      triggerClassName="w-full justify-between px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm hover:bg-white dark:hover:bg-slate-800"
                      panelClassName="absolute right-0 top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Grants *
                </label>
                {grantFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 mb-2">
                    <Controller
                      name={`grants.${index}.value`}
                      control={createForm.control}
                      render={({ field: grantField }) => (
                        <SelectDropdown
                          value={grantField.value}
                          onChange={grantField.onChange}
                          options={[...GRANT_OPTIONS]}
                          label="Grant"
                          ariaLabel={`Grant ${index + 1}`}
                          disabled={createMutation.isPending}
                          containerClassName="flex-1"
                          hideSelectedOption
                          selectedValueClassName="text-indigo-600 dark:text-indigo-400"
                          triggerClassName="flex-1 justify-between px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm hover:bg-white dark:hover:bg-slate-800"
                          panelClassName="absolute left-0 top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50"
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => removeGrant(index)}
                      className="inline-flex items-center justify-center px-2 py-2 text-red-600 hover:text-red-700 rounded"
                      aria-label={`Eliminar grant ${index + 1}`}
                    >
                      <IconX className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendGrant({ value: 'AUTHORIZATION_CODE' })}
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 mt-1"
                >
                  <IconPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Agregar grant
                </button>
                {createForm.formState.errors.grants && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createForm.formState.errors.grants.message}</p>
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

      {/* Modal: Rotar secret */}
      {rotateSecretAppId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rotate-secret-title"
          onClick={(e) => { if (e.target === e.currentTarget && !rotatedSecret) setRotateSecretAppId(null) }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
              <h2 id="rotate-secret-title" className="text-lg font-bold text-slate-900 dark:text-white">
                {rotatedSecret ? 'Nuevo secret generado' : 'Rotar secret'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setRotateSecretAppId(null)
                  setRotatedSecret(null)
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!rotatedSecret && rotateMutation.isError && (
                <div className="rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                  {getAppApiError(rotateMutation.error)?.clientMessage || 'Error al rotar secret'}
                </div>
              )}

              {rotatedSecret ? (
                <>
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4 text-sm text-amber-900 dark:text-amber-200">
                    Copia tu nuevo secret — no podrás verlo nuevamente.
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 font-mono text-xs text-slate-800 dark:text-slate-100 break-all">
                    {rotatedSecret}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(rotatedSecret)
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <IconClipboard className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Copiar al portapapeles
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRotateSecretAppId(null)
                      setRotatedSecret(null)
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    <IconCheckmark className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Hecho
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Esto generará un nuevo secret para tu aplicación. El anterior dejará de funcionar inmediatamente.
                  </p>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRotateSecretAppId(null)}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <IconX className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateMutation.mutate(rotateSecretAppId)}
                      disabled={rotateMutation.isPending}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors"
                    >
                      {rotateMutation.isPending ? (
                        <svg className="h-4 w-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                      ) : (
                        <IconRefresh className="h-4 w-4 shrink-0" aria-hidden="true" />
                      )}
                      {rotateMutation.isPending ? 'Rotando...' : 'Rotar secret'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
