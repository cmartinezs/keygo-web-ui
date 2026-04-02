import { useParams } from 'react-router-dom'

const TITLE_BY_FEATURE: Record<string, string> = {
  apps: 'Aplicaciones',
  users: 'Usuarios',
  access: 'Accesos',
  audit: 'Registro',
  'signing-keys': 'Claves de firma',
  sessions: 'Sesiones',
  tokens: 'Tokens',
  api: 'API',
  settings: 'Configuracion',
  profile: 'Mi cuenta',
  members: 'Miembros del tenant',
  services: 'Servicios del tenant',
  'my-access': 'Mi acceso',
  activity: 'Actividad',
}

export default function FeaturePlaceholderPage() {
  const { featureId } = useParams<{ featureId: string }>()
  const title = featureId ? TITLE_BY_FEATURE[featureId] ?? 'Modulo' : 'Modulo'

  return (
    <div className="max-w-screen-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-white dark:bg-slate-900 p-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Este modulo usa la nueva navegacion por rol y quedo listo para conectar funcionalidades reales.
        </p>
      </div>
    </div>
  )
}
