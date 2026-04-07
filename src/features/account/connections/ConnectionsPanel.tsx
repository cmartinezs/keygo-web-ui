import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { TENANT } from '@/shared/api/client'
import { SelectDropdown } from '@/shared/ui/SelectDropdown'
import {
  ACCOUNT_QUERY_KEYS,
  getAccountConnections,
  linkAccountConnection,
  unlinkAccountConnection,
} from '@/features/account/api'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/shared/lib/config/network'
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer'
import {
  isRequestTimeout,
  notifyMutationTimeout,
  runGetWithRecovery,
} from '@/shared/lib/network/recovery'
import type { AccountConnectionData } from '@/shared/types/user'
import {
  DangerActionButton,
  ErrorMessage,
  LoadingMessage,
  PanelCard,
  PrimaryActionButton,
} from '@/features/account/ui/AccountPanelPrimitives'

const SUPPORTED_PROVIDERS = ['google', 'github', 'microsoft'] as const

type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number]

function formatDateSafe(value: string | null | undefined, locale: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function normalizeProvider(provider: string | null | undefined): string {
  return (provider ?? '').trim().toLowerCase()
}

function ConnectionItem({
  connection,
  locale,
  onUnlink,
  isUnlinking,
}: {
  connection: AccountConnectionData
  locale: string
  onUnlink: (connectionId: string) => void
  isUnlinking: boolean
}) {
  const { t } = useTranslation()

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
            {connection.provider_name || '-'}
          </p>
          <dl className="mt-2 grid grid-cols-1 gap-y-1 text-xs sm:grid-cols-2 sm:gap-x-4">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">{t('accountConnections.status')}</dt>
              <dd className="text-slate-900 dark:text-white">{connection.status || '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">{t('accountConnections.providerUserId')}</dt>
              <dd className="truncate text-slate-900 dark:text-white">{connection.display_name || '-'}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">{t('accountConnections.linkedAt')}</dt>
              <dd className="text-slate-900 dark:text-white">{formatDateSafe(connection.connected_at, locale)}</dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">{t('accountConnections.lastUsedAt')}</dt>
              <dd className="text-slate-900 dark:text-white">{formatDateSafe(connection.last_used_at, locale)}</dd>
            </div>
          </dl>
        </div>

        <DangerActionButton
          onClick={() => onUnlink(connection.id)}
          pending={isUnlinking}
          disabled={isUnlinking || !connection.id}
          label={t('accountConnections.unlink')}
          pendingLabel={t('accountConnections.unlinking')}
        />
      </div>
    </li>
  )
}

export function ConnectionsPanel() {
  const { t, i18n } = useTranslation()
  const user = useCurrentUser()
  const tenantSlug = user?.tenantSlug ?? TENANT
  const queryClient = useQueryClient()
  const [providerToLink, setProviderToLink] = useState<SupportedProvider>('google')

  const connectionsQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.connections(tenantSlug),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'conexiones externas',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () => getAccountConnections(tenantSlug, { signal, timeoutMs: NETWORK_REQUEST_TIMEOUT_MS }),
      }),
    retry: false,
  })

  const linkMutation = useMutation({
    mutationFn: (provider: SupportedProvider) =>
      linkAccountConnection(
        tenantSlug,
        provider,
        {},
        {
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          idempotencyKey: `kg-account-link-${tenantSlug}-${provider}-${user?.sub ?? 'anonymous'}`,
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEYS.connections(tenantSlug) })
      toast.success(t('accountConnections.linkSuccess'))
    },
    onError: (error) => {
      if (isRequestTimeout(error)) {
        notifyMutationTimeout('vinculacion de conexion externa')
        return
      }
      toast.error(getUserMessage(getAppApiError(error)))
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: (connectionId: string) =>
      unlinkAccountConnection(tenantSlug, connectionId, { timeoutMs: NETWORK_REQUEST_TIMEOUT_MS }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEYS.connections(tenantSlug) })
      toast.success(t('accountConnections.unlinkSuccess'))
    },
    onError: (error) => {
      if (isRequestTimeout(error)) {
        notifyMutationTimeout('desvinculacion de conexion externa')
        return
      }
      toast.error(getUserMessage(getAppApiError(error)))
    },
  })

  const linkedProviders = useMemo(
    () => new Set((connectionsQuery.data ?? []).map((c) => normalizeProvider(c.provider_name))),
    [connectionsQuery.data],
  )

  const linkOptions = useMemo(
    () => SUPPORTED_PROVIDERS.filter((provider) => !linkedProviders.has(provider)),
    [linkedProviders],
  )

  return (
    <PanelCard
      title={t('accountConnections.title')}
      subtitle={t('accountConnections.subtitle')}
      badge={null}
    >

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10">
        <div className="min-w-[220px] flex-1">
          <p id="provider-to-link-label" className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-200">
            {t('accountConnections.providerToLink')}
          </p>
          <SelectDropdown
            value={providerToLink}
            onChange={setProviderToLink}
            options={
              linkOptions.length === 0
                ? [{ value: providerToLink, label: t('accountConnections.noProviderAvailable') }]
                : linkOptions.map((provider) => ({ value: provider, label: provider }))
            }
            label={t('accountConnections.noProviderAvailable')}
            ariaLabel={t('accountConnections.providerToLink')}
            labelledBy="provider-to-link-label"
            disabled={linkMutation.isPending || linkOptions.length === 0}
            hideSelectedOption
            selectedValueClassName="text-indigo-600 dark:text-indigo-400"
            triggerClassName="w-full justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-white dark:border-white/20 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-800"
            panelClassName="absolute right-0 top-full mt-2 w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 py-1 z-50"
          />
        </div>
        <PrimaryActionButton
          onClick={() => linkMutation.mutate(providerToLink)}
          disabled={linkMutation.isPending || linkOptions.length === 0}
          pending={linkMutation.isPending}
          label={t('accountConnections.link')}
          pendingLabel={t('accountConnections.linking')}
        />
      </div>

      <div className="mt-5">
        {connectionsQuery.isLoading ? <LoadingMessage message={t('accountConnections.loading')} /> : null}

        {connectionsQuery.isError ? <ErrorMessage message={t('accountConnections.loadError')} /> : null}

        {!connectionsQuery.isLoading && !connectionsQuery.isError ? (
          (connectionsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('accountConnections.empty')}</p>
          ) : (
            <ul aria-label={t('accountConnections.listAria')} className="space-y-3">
              {(connectionsQuery.data ?? []).map((connection, index) => {
                const key = connection.id?.trim() || `connection-${index}-${connection.provider_name}`
                return (
                  <ConnectionItem
                    key={key}
                    connection={connection}
                    locale={i18n.language}
                    onUnlink={(connectionId) => unlinkMutation.mutate(connectionId)}
                    isUnlinking={unlinkMutation.isPending && unlinkMutation.variables === connection.id}
                  />
                )
              })}
            </ul>
          )
        ) : null}
      </div>
    </PanelCard>
  )
}
