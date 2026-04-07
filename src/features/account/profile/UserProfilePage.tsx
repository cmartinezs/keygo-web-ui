import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { ACCOUNT_QUERY_KEYS, getAccountAccess, getProfile, getSessions, updateProfile } from '@/features/account/api'
import { TENANT } from '@/shared/api/client'
import { getAppApiError } from '@/shared/api/errorNormalizer'
import { useCurrentUser } from '@/shared/hooks/useCurrentUser'
import { IconDashboard, IconUser, IconShield, IconClock, IconCheckmark } from '@/shared/ui/icons'
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
import { i18n } from '@/shared/lib/i18n/config'
import type { UpdateUserProfileRequest } from '@/shared/types/user'

type AccountTab = 'summary' | 'profile' | 'access' | 'activity'

interface AccountTabOption {
  key: AccountTab
  label: string
  icon: ReactNode
}

function createProfileSchema() {
  return z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone_number: z.string().optional(),
    locale: z.string().optional(),
    zoneinfo: z.string().optional(),
    website: z.string().optional(),
    birthdate: z.string().optional(),
    profile_picture_url: z.string().url(i18n.t('userDashboardProfile.validation.invalidProfileUrl')).or(z.literal('')),
  })
}

type ProfileFormData = z.infer<ReturnType<typeof createProfileSchema>>

function formatDateTime(value: string, locale: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '--'
  }
  return parsed.toLocaleString(locale)
}

export default function UserProfilePage() {
  const { t } = useTranslation()
  const currentUser = useCurrentUser()
  const tenantSlug = currentUser?.tenantSlug ?? TENANT
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<AccountTab>('summary')
  const profileSchema = createProfileSchema()
  const accountTabs: Array<AccountTabOption> = [
    { key: 'summary', label: t('userDashboardProfile.tabs.summary'), icon: <span aria-hidden="true"><IconDashboard /></span> },
    { key: 'profile', label: t('userDashboardProfile.tabs.profile'), icon: <span aria-hidden="true"><IconUser /></span> },
    { key: 'access', label: t('userDashboardProfile.tabs.access'), icon: <span aria-hidden="true"><IconShield /></span> },
    { key: 'activity', label: t('userDashboardProfile.tabs.activity'), icon: <span aria-hidden="true"><IconClock /></span> },
  ]

  async function fetchProfileWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: t('userDashboardProfile.recovery.profileLabel'),
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () =>
        getProfile(tenantSlug, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    })
  }

  async function fetchAccessWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: t('userDashboardProfile.recovery.accessLabel'),
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () =>
        getAccountAccess(tenantSlug, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    })
  }

  async function fetchSessionsWithRecovery(signal: AbortSignal) {
    return runGetWithRecovery({
      signal,
      label: t('userDashboardProfile.recovery.sessionsLabel'),
      timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
      retryDelayMs: NETWORK_RETRY_DELAY_MS,
      maxRetries: NETWORK_MAX_RETRIES,
      query: () =>
        getSessions(tenantSlug, {
          signal,
          timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        }),
    })
  }

  const profileQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.profile(tenantSlug),
    queryFn: ({ signal }) => fetchProfileWithRecovery(signal),
    retry: false,
  })

  const accessQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.access(tenantSlug),
    queryFn: ({ signal }) => fetchAccessWithRecovery(signal),
    retry: false,
  })

  const sessionsQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.sessions(tenantSlug),
    queryFn: ({ signal }) => fetchSessionsWithRecovery(signal),
    retry: false,
  })

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      phone_number: '',
      locale: '',
      zoneinfo: '',
      website: '',
      birthdate: '',
      profile_picture_url: '',
    },
  })

  useEffect(() => {
    if (!profileQuery.data) return

    form.reset({
      first_name: profileQuery.data.first_name ?? '',
      last_name: profileQuery.data.last_name ?? '',
      phone_number: profileQuery.data.phone_number ?? '',
      locale: profileQuery.data.locale ?? '',
      zoneinfo: profileQuery.data.zoneinfo ?? '',
      website: profileQuery.data.website ?? '',
      birthdate: profileQuery.data.birthdate ?? '',
      profile_picture_url: profileQuery.data.profile_picture_url ?? '',
    })
  }, [form, profileQuery.data])

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserProfileRequest) =>
      updateProfile(tenantSlug, payload, {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-user-profile-update-${tenantSlug}-${currentUser?.sub ?? 'anonymous'}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEYS.profile(tenantSlug) })
      toast.success(t('userDashboardProfile.toasts.updated'))
    },
    onError: (mutationError) => {
      if (isRequestTimeout(mutationError)) {
        notifyMutationTimeout('actualizacion de perfil')
        return
      }
      toast.error(getAppApiError(mutationError).clientMessage)
    },
  })

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('userDashboardProfile.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('userDashboardProfile.subtitle')}
        </p>
      </header>

      <section
        aria-label={t('userDashboardProfile.sectionsAria')}
        className="rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900"
      >
        <div role="tablist" aria-label={t('userDashboardProfile.tabsAria')} className="flex flex-wrap gap-2">
          {accountTabs.map((tab) => (
            <button
              key={tab.key}
              id={`account-tab-${tab.key}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              aria-controls={`account-panel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              <span className={activeTab === tab.key ? 'text-white' : ''}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {profileQuery.isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
        >
          {t('userDashboardProfile.loading')}
        </div>
      ) : null}

      {profileQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {profileQuery.error instanceof Error ? profileQuery.error.message : t('userDashboardProfile.errorFallback')}
        </div>
      ) : null}

      {!profileQuery.isLoading && !profileQuery.isError ? (
        <>
          <section
            id="account-panel-summary"
            role="tabpanel"
            aria-labelledby="account-tab-summary"
            hidden={activeTab !== 'summary'}
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('userDashboardProfile.summary.title')}</h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('userDashboardProfile.summary.fullName')}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">
                  {profileQuery.data?.first_name ?? '-'} {profileQuery.data?.last_name ?? ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('userDashboardProfile.summary.email')}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{profileQuery.data?.email ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('userDashboardProfile.summary.username')}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{profileQuery.data?.username ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('userDashboardProfile.summary.status')}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{profileQuery.data?.status ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('userDashboardProfile.summary.tenant')}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{tenantSlug}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('userDashboardProfile.summary.activeRole')}</dt>
                <dd className="text-sm font-medium text-slate-900 dark:text-white">{currentUser?.activeRole ?? '-'}</dd>
              </div>
            </dl>
          </section>

          <section
            id="account-panel-profile"
            role="tabpanel"
            aria-labelledby="account-tab-profile"
            hidden={activeTab !== 'profile'}
          >
            <form
              onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900"
            >
              <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2" disabled={updateMutation.isPending}>
                <div>
                  <label htmlFor="first_name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('userDashboardProfile.form.firstName')}
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    {...form.register('first_name')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('userDashboardProfile.form.lastName')}
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    {...form.register('last_name')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="phone_number" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('userDashboardProfile.form.phone')}
                  </label>
                  <input
                    id="phone_number"
                    type="text"
                    {...form.register('phone_number')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="locale" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('userDashboardProfile.form.locale')}
                  </label>
                  <input
                    id="locale"
                    type="text"
                    {...form.register('locale')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="zoneinfo" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('userDashboardProfile.form.zoneinfo')}
                  </label>
                  <input
                    id="zoneinfo"
                    type="text"
                    {...form.register('zoneinfo')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="birthdate" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('userDashboardProfile.form.birthdate')}
                  </label>
                  <input
                    id="birthdate"
                    type="date"
                    {...form.register('birthdate')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="website" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('userDashboardProfile.form.website')}
                  </label>
                  <input
                    id="website"
                    type="text"
                    {...form.register('website')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="profile_picture_url" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('userDashboardProfile.form.profilePictureUrl')}
                  </label>
                  <input
                    id="profile_picture_url"
                    type="text"
                    {...form.register('profile_picture_url')}
                    aria-invalid={Boolean(form.formState.errors.profile_picture_url)}
                    aria-describedby={form.formState.errors.profile_picture_url ? 'profile-picture-error' : undefined}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/10 dark:bg-slate-800 dark:text-white"
                  />
                  {form.formState.errors.profile_picture_url ? (
                    <p id="profile-picture-error" role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                      {form.formState.errors.profile_picture_url.message}
                    </p>
                  ) : null}
                </div>
              </fieldset>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                >
                  {updateMutation.isPending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" aria-hidden="true" />
                  ) : (
                    <IconCheckmark className="h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                  {updateMutation.isPending
                    ? t('userDashboardProfile.form.saving')
                    : t('userDashboardProfile.form.saveChanges')}
                </button>
              </div>
            </form>
          </section>

          <section
            id="account-panel-access"
            role="tabpanel"
            aria-labelledby="account-tab-access"
            hidden={activeTab !== 'access'}
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('userDashboardProfile.access.title')}</h2>

            {accessQuery.isLoading ? (
              <div role="status" aria-live="polite" className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {t('userDashboardProfile.access.loading')}
              </div>
            ) : null}

            {accessQuery.isError ? (
              <div role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {accessQuery.error instanceof Error
                  ? accessQuery.error.message
                  : t('userDashboardProfile.access.errorFallback')}
              </div>
            ) : null}

            {!accessQuery.isLoading && !accessQuery.isError ? (
              (accessQuery.data?.length ?? 0) === 0 ? (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{t('userDashboardProfile.access.empty')}</p>
              ) : (
                <ul aria-label={t('userDashboardProfile.access.listAria')} className="mt-4 space-y-3">
                  {(accessQuery.data ?? []).map((membership, index) => {
                    const itemKey = membership.membership_id || `${membership.app_id}-${index}`
                    return (
                      <li
                        key={itemKey}
                        className="rounded-lg border border-slate-200 p-4 dark:border-white/10"
                      >
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{membership.app_name || '-'}</p>
                        <dl className="mt-2 grid grid-cols-1 gap-y-1 text-xs sm:grid-cols-3 sm:gap-x-3">
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">{t('userDashboardProfile.access.membershipId')}</dt>
                            <dd className="text-slate-900 dark:text-white truncate">{membership.membership_id || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">{t('userDashboardProfile.access.status')}</dt>
                            <dd className="text-slate-900 dark:text-white">{membership.status || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500 dark:text-slate-400">{t('userDashboardProfile.access.roles')}</dt>
                            <dd className="text-slate-900 dark:text-white">
                              {membership.roles.length > 0
                                ? membership.roles.join(', ')
                                : t('userDashboardProfile.access.noRoles')}
                            </dd>
                          </div>
                        </dl>
                      </li>
                    )
                  })}
                </ul>
              )
            ) : null}
          </section>

          <section
            id="account-panel-activity"
            role="tabpanel"
            aria-labelledby="account-tab-activity"
            hidden={activeTab !== 'activity'}
            className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('userDashboardProfile.activity.title')}</h2>

            {sessionsQuery.isLoading ? (
              <p role="status" aria-live="polite" className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {t('userDashboardProfile.activity.loading')}
              </p>
            ) : null}

            {sessionsQuery.isError ? (
              <div role="alert" className="mt-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {sessionsQuery.error instanceof Error
                  ? sessionsQuery.error.message
                  : t('userDashboardProfile.activity.errorFallback')}
              </div>
            ) : null}

            {!sessionsQuery.isLoading && !sessionsQuery.isError ? (
              <>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <article className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('userDashboardProfile.activity.cards.activeSessions')}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                      {sessionsQuery.data?.length ?? 0}
                    </p>
                  </article>

                  <article className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('userDashboardProfile.activity.cards.currentSession')}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                      {sessionsQuery.data?.some((session) => session.is_current)
                        ? t('userDashboardProfile.activity.currentSessionOpen')
                        : t('userDashboardProfile.activity.currentSessionNotFound')}
                    </p>
                  </article>

                  <article className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t('userDashboardProfile.activity.cards.appsWithAccess')}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                      {accessQuery.data?.length ?? 0}
                    </p>
                  </article>
                </div>

                {(sessionsQuery.data?.length ?? 0) === 0 ? (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                    {t('userDashboardProfile.activity.empty')}
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3" aria-label={t('userDashboardProfile.activity.listAria')}>
                    {(sessionsQuery.data ?? [])
                      .slice()
                      .sort((left, right) =>
                        new Date(right.last_accessed_at).getTime() - new Date(left.last_accessed_at).getTime(),
                      )
                      .slice(0, 5)
                      .map((session) => (
                        <li key={session.session_id} className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {session.browser} · {session.os}
                            </p>
                            {session.is_current ? (
                              <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                                {t('userDashboardProfile.activity.currentSessionBadge')}
                              </span>
                            ) : null}
                          </div>

                          <dl className="mt-2 grid grid-cols-1 gap-y-1 text-xs sm:grid-cols-3 sm:gap-x-3">
                            <div>
                              <dt className="text-slate-500 dark:text-slate-400">{t('userDashboardProfile.activity.columns.ipAddress')}</dt>
                              <dd className="text-slate-900 dark:text-white">{session.ip_address || '--'}</dd>
                            </div>
                            <div>
                              <dt className="text-slate-500 dark:text-slate-400">{t('userDashboardProfile.activity.columns.lastAccess')}</dt>
                              <dd className="text-slate-900 dark:text-white">
                                {formatDateTime(session.last_accessed_at, i18n.language)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-slate-500 dark:text-slate-400">{t('userDashboardProfile.activity.columns.expiresAt')}</dt>
                              <dd className="text-slate-900 dark:text-white">
                                {formatDateTime(session.expires_at, i18n.language)}
                              </dd>
                            </div>
                          </dl>
                        </li>
                      ))}
                  </ul>
                )}
              </>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  )
}
