import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { TENANT } from '@/api/client'
import {
  ACCOUNT_QUERY_KEYS,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/api/account'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import {
  NETWORK_MAX_RETRIES,
  NETWORK_REQUEST_TIMEOUT_MS,
  NETWORK_RETRY_DELAY_MS,
} from '@/config/network'
import { getAppApiError } from '@/api/errorNormalizer'
import {
  isRequestTimeout,
  notifyMutationTimeout,
  runGetWithRecovery,
} from '@/lib/network/recovery'
import type { NotificationPreferencesData, UpdateNotificationPreferencesRequest } from '@/types/user'
import { ErrorMessage, LoadingMessage, PanelCard, PrimaryActionButton } from './AccountPanelPrimitives'

const preferencesSchema = z.object({
  security_alerts_email: z.boolean(),
  security_alerts_in_app: z.boolean(),
  billing_alerts_email: z.boolean(),
  product_updates_email: z.boolean(),
  weekly_digest: z.boolean(),
})

type PreferencesFormData = z.infer<typeof preferencesSchema>

function ToggleField({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: keyof PreferencesFormData
  label: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-white/20"
      />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium text-slate-900 dark:text-white">{label}</span>
        <span className="block text-xs text-slate-600 dark:text-slate-400">{description}</span>
      </span>
    </label>
  )
}

function toFormValues(data: NotificationPreferencesData): PreferencesFormData {
  return {
    security_alerts_email: data.security_alerts_email,
    security_alerts_in_app: data.security_alerts_in_app,
    billing_alerts_email: data.billing_alerts_email,
    product_updates_email: data.product_updates_email,
    weekly_digest: data.weekly_digest,
  }
}

function toUpdateRequest(data: PreferencesFormData): UpdateNotificationPreferencesRequest {
  return {
    security_alerts_email: data.security_alerts_email,
    security_alerts_in_app: data.security_alerts_in_app,
    billing_alerts_email: data.billing_alerts_email,
    product_updates_email: data.product_updates_email,
    weekly_digest: data.weekly_digest,
  }
}

export function NotificationsPreferencesForm() {
  const { t } = useTranslation()
  const user = useCurrentUser()
  const tenantSlug = user?.tenantSlug ?? TENANT
  const queryClient = useQueryClient()

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      security_alerts_email: false,
      security_alerts_in_app: false,
      billing_alerts_email: false,
      product_updates_email: false,
      weekly_digest: false,
    },
  })
  const watchedValues = useWatch({ control: form.control })

  const preferencesQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.notificationPreferences(tenantSlug),
    queryFn: ({ signal }) =>
      runGetWithRecovery({
        signal,
        label: 'preferencias de notificaciones',
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        retryDelayMs: NETWORK_RETRY_DELAY_MS,
        maxRetries: NETWORK_MAX_RETRIES,
        query: () =>
          getNotificationPreferences(tenantSlug, {
            signal,
            timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
          }),
      }),
    retry: false,
  })

  useEffect(() => {
    if (!preferencesQuery.data) return
    form.reset(toFormValues(preferencesQuery.data))
  }, [form, preferencesQuery.data])

  const updateMutation = useMutation({
    mutationFn: (payload: PreferencesFormData) =>
      updateNotificationPreferences(tenantSlug, toUpdateRequest(payload), {
        timeoutMs: NETWORK_REQUEST_TIMEOUT_MS,
        idempotencyKey: `kg-account-notifications-${tenantSlug}-${user?.sub ?? 'anonymous'}`,
      }),
    onSuccess: (data) => {
      form.reset(toFormValues(data))
      queryClient.invalidateQueries({
        queryKey: ACCOUNT_QUERY_KEYS.notificationPreferences(tenantSlug),
      })
      toast.success(t('accountNotifications.saveSuccess'))
    },
    onError: (error) => {
      if (isRequestTimeout(error)) {
        notifyMutationTimeout('actualizacion de preferencias de notificacion')
        return
      }
      toast.error(getAppApiError(error).clientMessage)
    },
  })

  function submit(values: PreferencesFormData) {
    updateMutation.mutate(values)
  }

  return (
    <PanelCard
      title={t('accountNotifications.title')}
      subtitle={t('accountNotifications.subtitle')}
    >
      {preferencesQuery.isLoading ? <LoadingMessage withMargin message={t('accountNotifications.loading')} /> : null}

      {preferencesQuery.isError ? <ErrorMessage withMargin message={t('accountNotifications.loadError')} /> : null}

      {!preferencesQuery.isLoading && !preferencesQuery.isError ? (
        <form
          onSubmit={form.handleSubmit(submit)}
          noValidate
          className="mt-5 space-y-4"
          aria-label={t('accountNotifications.title')}
        >
          <fieldset className="space-y-3">
            <legend className="sr-only">{t('accountNotifications.title')}</legend>

            <ToggleField
              id="security_alerts_email"
              label={t('accountNotifications.securityAlertsEmailLabel')}
              description={t('accountNotifications.securityAlertsEmailDesc')}
              checked={!!watchedValues.security_alerts_email}
              onChange={(next) => form.setValue('security_alerts_email', next, { shouldDirty: true })}
            />
            <ToggleField
              id="security_alerts_in_app"
              label={t('accountNotifications.securityAlertsInAppLabel')}
              description={t('accountNotifications.securityAlertsInAppDesc')}
              checked={!!watchedValues.security_alerts_in_app}
              onChange={(next) => form.setValue('security_alerts_in_app', next, { shouldDirty: true })}
            />
            <ToggleField
              id="billing_alerts_email"
              label={t('accountNotifications.billingAlertsEmailLabel')}
              description={t('accountNotifications.billingAlertsEmailDesc')}
              checked={!!watchedValues.billing_alerts_email}
              onChange={(next) => form.setValue('billing_alerts_email', next, { shouldDirty: true })}
            />
            <ToggleField
              id="product_updates_email"
              label={t('accountNotifications.productUpdatesEmailLabel')}
              description={t('accountNotifications.productUpdatesEmailDesc')}
              checked={!!watchedValues.product_updates_email}
              onChange={(next) => form.setValue('product_updates_email', next, { shouldDirty: true })}
            />
            <ToggleField
              id="weekly_digest"
              label={t('accountNotifications.weeklyDigestLabel')}
              description={t('accountNotifications.weeklyDigestDesc')}
              checked={!!watchedValues.weekly_digest}
              onChange={(next) => form.setValue('weekly_digest', next, { shouldDirty: true })}
            />
          </fieldset>

          <PrimaryActionButton
            type="submit"
            label={t('accountNotifications.save')}
            pendingLabel={t('accountNotifications.saving')}
            pending={updateMutation.isPending}
            disabled={updateMutation.isPending || !form.formState.isDirty}
          />
        </form>
      ) : null}
    </PanelCard>
  )
}
