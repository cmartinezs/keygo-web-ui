import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { toast } from 'sonner'
import { listClientApps, createClientApp, rotateClientAppSecret, CLIENT_APP_QUERY_KEYS, type GrantType, type CreateClientAppRequest } from '@/api/clientApps'
import { getAppApiError } from '@/api/errorNormalizer'
import { TENANT } from '@/api/client'
import { useCurrentUser } from '@/hooks/useCurrentUser'
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

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Activa',
  INACTIVE: 'Inactiva',
}

const CreateClientAppSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  type: z.enum(['PUBLIC', 'CONFIDENTIAL'] as const),
  grants: z.array(z.enum(['AUTHORIZATION_CODE', 'CLIENT_CREDENTIALS', 'REFRESH_TOKEN', 'IMPLICIT'] as const)).min(1, 'Selecciona al menos un grant'),
  redirect_uris: z.array(z.string().url('URL válida')).optional(),
  scopes: z.array(z.string()).optional(),
})

type CreateClientAppFormData = z.infer<typeof CreateClientAppSchema>

export default function TenantAppsPage() {
  const user = useCurrentUser()
  const tenantSlug = user?.tenantSlug ?? TENANT
  const queryClient = useQueryClient()

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
        listClientApps(tenantSlug, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    })
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: CLIENT_APP_QUERY_KEYS.all(tenantSlug),
    queryFn: ({ signal }) => fetchAppsWithRecovery(signal),
    retry: false,
  })

  const createForm = useForm<CreateClientAppFormData>({
    resolver: zodResolver(CreateClientAppSchema),
    defaultValues: { name: '', description: '', type: 'PUBLIC', grants: ['AUTHORIZATION_CODE'], redirect_uris: [], scopes: [] },
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
      toast.error(getAppApiError(mutationError).clientMessage)
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
      toast.error(getAppApiError(mutationError).clientMessage)
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
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Crear aplicación
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
              {data?.map((app) => (
                <tr key={app.id} className="border-b border-slate-100 dark:border-white/5">
                  <td className="px-4 py-3 text-slate-800 dark:text-slate-100">{app.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono text-xs">{app.client_id}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{app.type}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{STATUS_LABEL[app.status] ?? app.status}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{app.grants.join(', ')}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setRotateSecretAppId(app.client_id)}
                      className="px-3 py-1 text-xs bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                      Rotar secret
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.length === 0 && (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No hay aplicaciones registradas para este tenant.</p>
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

            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
                <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Tipo *
                </label>
                <select
                  id="type"
                  {...createForm.register('type')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  disabled={createMutation.isPending}
                >
                  <option value="PUBLIC">Pública</option>
                  <option value="CONFIDENTIAL">Confidencial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Grants *
                </label>
                {grantFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 mb-2">
                    <select
                      {...createForm.register(`grants.${index}`)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                      disabled={createMutation.isPending}
                    >
                      <option value="AUTHORIZATION_CODE">Authorization Code</option>
                      <option value="CLIENT_CREDENTIALS">Client Credentials</option>
                      <option value="REFRESH_TOKEN">Refresh Token</option>
                      <option value="IMPLICIT">Implicit</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeGrant(index)}
                      className="px-2 py-2 text-red-600 hover:text-red-700 rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendGrant('AUTHORIZATION_CODE' as GrantType)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 mt-1"
                >
                  + Agregar grant
                </button>
                {createForm.formState.errors.grants && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{createForm.formState.errors.grants.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-colors"
                >
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
                    className="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Copiar al portapapeles
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRotateSecretAppId(null)
                      setRotatedSecret(null)
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
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
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateMutation.mutate(rotateSecretAppId)}
                      disabled={rotateMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 rounded-lg transition-colors"
                    >
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
