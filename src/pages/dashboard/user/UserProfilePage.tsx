import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ACCOUNT_QUERY_KEYS, getProfile, updateProfile } from '@/api/account'
import { TENANT } from '@/api/client'
import { getAppApiError } from '@/api/errorNormalizer'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import type { UpdateUserProfileRequest } from '@/types/user'

const profileSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone_number: z.string().optional(),
  locale: z.string().optional(),
  zoneinfo: z.string().optional(),
  website: z.string().optional(),
  birthdate: z.string().optional(),
  profile_picture_url: z.string().url('URL valida').or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function UserProfilePage() {
  const currentUser = useCurrentUser()
  const tenantSlug = currentUser?.tenantSlug ?? TENANT
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.profile(tenantSlug),
    queryFn: () => getProfile(tenantSlug),
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
    mutationFn: (payload: UpdateUserProfileRequest) => updateProfile(tenantSlug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEYS.profile(tenantSlug) })
      toast.success('Perfil actualizado correctamente')
    },
    onError: (mutationError) => {
      toast.error(getAppApiError(mutationError).clientMessage)
    },
  })

  return (
    <div className="mx-auto max-w-screen-xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mi cuenta</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Gestiona la informacion de tu perfil personal.
        </p>
      </header>

      {profileQuery.isLoading ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
        >
          Cargando perfil...
        </div>
      ) : null}

      {profileQuery.isError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          {profileQuery.error instanceof Error ? profileQuery.error.message : 'No fue posible cargar tu perfil.'}
        </div>
      ) : null}

      {!profileQuery.isLoading && !profileQuery.isError ? (
        <form
          onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900"
        >
          <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2" disabled={updateMutation.isPending}>
            <div>
              <label htmlFor="first_name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Nombre
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
                Apellido
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
                Telefono
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
                Locale
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
                Zona horaria
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
                Fecha de nacimiento
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
                Sitio web
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
                URL foto de perfil
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
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
