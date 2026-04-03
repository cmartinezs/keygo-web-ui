import AdminDashboardPage from '@/pages/admin/DashboardPage'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { IconUsers, IconApps, IconClock, IconBell } from '@/components/icons'
import { resolvePrimaryRole } from '@/types/roles'
import type { AppRole } from '@/types/roles'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string
  description: string
  icon?: ReactNode
}

type NonAdminRole = Exclude<AppRole, 'ADMIN'>

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-5 space-y-1.5">
      {icon && <div className="w-5 h-5 text-slate-400 dark:text-slate-500">{icon}</div>}
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </article>
  )
}

function RoleOverview({ role }: { role: NonAdminRole }) {
  const roleCopy = {
    ADMIN_TENANT: {
      title: 'Panel de administracion del tenant',
      subtitle: 'Gestiona usuarios, aplicaciones y seguridad de tu organizacion.',
      cards: [
        { title: 'Usuarios activos', value: '--', description: 'Pendiente de integrar metricas del tenant.', icon: <IconUsers className="w-5 h-5" aria-hidden="true" /> },
        { title: 'Aplicaciones', value: '--', description: 'Listado y estado de apps conectadas.', icon: <IconApps className="w-5 h-5" aria-hidden="true" /> },
        { title: 'Accesos del dia', value: '--', description: 'Actividad de autenticacion reciente.', icon: <IconClock className="w-5 h-5" aria-hidden="true" /> },
      ],
    },
    USER_TENANT: {
      title: 'Panel personal',
      subtitle: 'Accede a tus recursos, historial de accesos y configuraciones personales.',
      cards: [
        { title: 'Sesiones activas', value: '--', description: 'Dispositivos con sesion iniciada.', icon: <IconUsers className="w-5 h-5" aria-hidden="true" /> },
        { title: 'Ultimo acceso', value: '--', description: 'Fecha y origen de tu ultimo login.', icon: <IconClock className="w-5 h-5" aria-hidden="true" /> },
        { title: 'Alertas', value: '--', description: 'Notificaciones de seguridad y cuenta.', icon: <IconBell className="w-5 h-5" aria-hidden="true" /> },
      ],
    },
  } as const

  const view = roleCopy[role]

  return (
    <div className="max-w-screen-xl mx-auto space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{view.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{view.subtitle}</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" aria-label="Resumen del dashboard">
        {view.cards.map((card) => (
          <StatCard key={card.title} title={card.title} value={card.value} description={card.description} icon={card.icon} />
        ))}
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-white/80 dark:bg-slate-900/80 p-6">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Siguientes modulos</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Este dashboard ya comparte layout, navegacion y estructura visual con administracion global. El contenido
          funcional de este rol se conectara progresivamente a los endpoints especificos del backend.
        </p>
      </section>
    </div>
  )
}

export default function DashboardHomePage() {
  const user = useCurrentUser()
  const role = user?.activeRole ?? resolvePrimaryRole(user?.roles ?? []) ?? 'USER_TENANT'

  if (role === 'ADMIN') {
    return <AdminDashboardPage />
  }

  return <RoleOverview role={role as NonAdminRole} />
}
