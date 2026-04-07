import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { createPlatformUser, PLATFORM_USER_QUERY_KEYS } from '@/features/ops/platform-users/api'
import { getAppApiError, getUserMessage } from '@/shared/api/errorNormalizer'
import { applyFieldErrors } from '@/shared/hooks/useFieldErrors'
import { ServerErrorBanner } from '@/shared/ui/ServerErrorBanner'
import { IconChevronLeft, IconUsers, IconX, IconPlus } from '@/shared/ui/icons'
import { NETWORK_REQUEST_TIMEOUT_MS } from '@/shared/lib/config/network'
import { isRequestTimeout, notifyMutationTimeout } from '@/shared/lib/network/recovery'

// ── Form field wrapper ────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactNode
}

function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  const errorId = `${htmlFor}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlatformUserCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const timeoutMs = NETWORK_REQUEST_TIMEOUT_MS

  const schema = z.object({
    email: z.string().email(t('platformUserCreate.validation.email')),
    username: z
      .string()
      .min(3, t('platformUserCreate.validation.usernameMin'))
      .max(50, t('platformUserCreate.validation.usernameMax')),
    password: z
      .string()
      .min(8, t('platformUserCreate.validation.passwordMin')),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
  })

  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', username: '', password: '', first_name: '', last_name: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      createPlatformUser(
        {
          email: values.email,
          username: values.username,
          password: values.password,
          first_name: values.first_name || undefined,
          last_name: values.last_name || undefined,
        },
        { timeoutMs },
      ),
    onSuccess: (data) => {
      toast.success(t('platformUserCreate.createdSuccess', { name: data.username }))
      queryClient.invalidateQueries({ queryKey: PLATFORM_USER_QUERY_KEYS.all })
      navigate(`../${data.id}`, { relative: 'path' })
    },
    onError: (err) => {
      if (isRequestTimeout(err)) notifyMutationTimeout('creación del usuario')
      else {
        const appError = getAppApiError(err)
        if (!applyFieldErrors(appError, setError).hasErrors) {
          toast.error(getUserMessage(appError))
        }
      }
    },
  })

  const inputCls =
    'w-full px-3 py-2 text-sm rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="p-6 max-w-lg space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate('/dashboard/platform-users')}
        className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
        aria-label={t('platformUserCreate.back')}
      >
        <IconChevronLeft className="w-4 h-4" aria-hidden="true" />
        {t('platformUserCreate.back')}
      </button>

      {/* Form card */}
      <div className="rounded-lg border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <IconUsers className="w-5 h-5 text-indigo-500" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {t('platformUserCreate.title')}
          </h2>
        </div>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <Field
            label={t('platformUserCreate.emailLabel')}
            htmlFor="email"
            error={errors.email?.message}
          >
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={inputCls}
              {...register('email')}
            />
          </Field>

          <Field
            label={t('platformUserCreate.usernameLabel')}
            htmlFor="username"
            error={errors.username?.message}
          >
            <input
              id="username"
              type="text"
              autoComplete="username"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? 'username-error' : undefined}
              className={inputCls}
              {...register('username')}
            />
          </Field>

          <Field
            label={t('platformUserCreate.passwordLabel')}
            htmlFor="password"
            error={errors.password?.message}
          >
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={inputCls}
              {...register('password')}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label={t('platformUserCreate.firstNameLabel')}
              htmlFor="first_name"
              error={errors.first_name?.message}
            >
              <input
                id="first_name"
                type="text"
                autoComplete="given-name"
                className={inputCls}
                {...register('first_name')}
              />
            </Field>

            <Field
              label={t('platformUserCreate.lastNameLabel')}
              htmlFor="last_name"
              error={errors.last_name?.message}
            >
              <input
                id="last_name"
                type="text"
                autoComplete="family-name"
                className={inputCls}
                {...register('last_name')}
              />
            </Field>
          </div>

          <ServerErrorBanner errors={errors} />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/dashboard/platform-users')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <IconX className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('platformUserCreate.cancel')}
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {mutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  {t('platformUserCreate.creating')}
                </>
              ) : (
                <>
                  <IconPlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t('platformUserCreate.createButton')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
