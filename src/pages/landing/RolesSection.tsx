interface RoleCard {
  role: string
  tag: string
  tagColor: string
  description: string
  capabilities: string[]
  accentBg: string
  accentText: string
  borderColor: string
}

const roles: RoleCard[] = [
  {
    role: 'Administrador Global',
    tag: 'ADMIN',
    tagColor: 'bg-rose-100 text-rose-700',
    description:
      'Control total sobre la plataforma KeyGo. Gestiona tenants, configura el sistema y supervisa toda la actividad desde un único panel.',
    capabilities: [
      'Crear y gestionar tenants',
      'Administrar usuarios globales',
      'Configurar aplicaciones cliente',
      'Supervisar logs y auditoría',
    ],
    accentBg: 'bg-rose-50',
    accentText: 'text-rose-600',
    borderColor: 'border-rose-100 hover:border-rose-300',
  },
  {
    role: 'Administrador de Tenant',
    tag: 'ADMIN_TENANT',
    tagColor: 'bg-amber-100 text-amber-700',
    description:
      'Gestión autónoma dentro de su organización. Administra usuarios, permisos y configuraciones sin depender del equipo técnico central.',
    capabilities: [
      'Gestionar usuarios del tenant',
      'Asignar y revocar roles',
      'Ver métricas de su organización',
      'Administrar sesiones activas',
    ],
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-600',
    borderColor: 'border-amber-100 hover:border-amber-300',
  },
  {
    role: 'Usuario del sistema',
    tag: 'USER_TENANT',
    tagColor: 'bg-emerald-100 text-emerald-700',
    description:
      'Acceso seguro y personalizado a las aplicaciones del tenant. Gestiona su perfil, sesiones y preferencias de forma autónoma.',
    capabilities: [
      'Acceder a aplicaciones autorizadas',
      'Ver y editar su perfil',
      'Gestionar sesiones activas',
      'Cambiar credenciales de forma segura',
    ],
    accentBg: 'bg-emerald-50',
    accentText: 'text-emerald-600',
    borderColor: 'border-emerald-100 hover:border-emerald-300',
  },
]

export function RolesSection() {
  return (
    <section id="roles" className="py-24 bg-white px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">
            Para tu equipo
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            El acceso correcto para cada persona
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            KeyGo adapta la experiencia y los permisos automáticamente según el rol
            del usuario, leído directamente del token JWT.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map(({ role, tag, tagColor, description, capabilities, accentBg, accentText, borderColor }) => (
            <article
              key={tag}
              className={`rounded-2xl border-2 p-8 transition-all ${borderColor}`}
            >
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 ${tagColor}`}>
                {tag}
              </span>
              <h3 className="text-slate-900 font-bold text-xl mb-3">{role}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">{description}</p>

              <ul className="space-y-2">
                {capabilities.map((cap) => (
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
