import { useTranslation } from 'react-i18next'

interface RoleCard {
  key: string
  tag: string
  tagColor: string
  accentText: string
  borderColor: string
}

const roles: RoleCard[] = [
  {
    key: 'admin',
    tag: 'keygo_admin',
    tagColor: 'bg-rose-100 text-rose-700',
    accentText: 'text-rose-600',
    borderColor: 'border-rose-100 hover:border-rose-300',
  },
  {
    key: 'tenantAdmin',
    tag: 'keygo_tenant_admin',
    tagColor: 'bg-amber-100 text-amber-700',
    accentText: 'text-amber-600',
    borderColor: 'border-amber-100 hover:border-amber-300',
  },
  {
    key: 'tenantUser',
    tag: 'keygo_user',
    tagColor: 'bg-emerald-100 text-emerald-700',
    accentText: 'text-emerald-600',
    borderColor: 'border-emerald-100 hover:border-emerald-300',
  },
]

export function RolesSection() {
  const { t } = useTranslation()

  return (
    <section id="roles" className="py-24 bg-white px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">
            {t('landing.roles.eyebrow')}
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            {t('landing.roles.title')}
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            {t('landing.roles.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map(({ key, tag, tagColor, accentText, borderColor }) => (
            <article
              key={tag}
              className={`rounded-2xl border-2 p-8 transition-all ${borderColor}`}
            >
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${tagColor}`}>
                {tag}
              </span>
              <h3 className="text-slate-900 font-bold text-xl mb-3">{t(`landing.roles.items.${key}.title`)}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">{t(`landing.roles.items.${key}.description`)}</p>

              <ul className="space-y-2">
                {(t(`landing.roles.items.${key}.capabilities`, { returnObjects: true }) as string[]).map((cap) => (
                  <li key={cap} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className={`mt-0.5 text-base leading-none ${accentText}`} aria-hidden="true">✓</span>
                    {cap}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
