import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4 pt-16 overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" aria-hidden="true" />
          <span className="text-indigo-300 text-sm font-medium">
            Plataforma IAM cloud-ready
          </span>
        </div>

        {/* Titular principal */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
          La llave de tu
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            identidad digital
          </span>
        </h1>

        <p className="text-slate-300 text-lg sm:text-xl leading-relaxed mb-10 max-w-3xl mx-auto">
          KeyGo es la plataforma de gestión de identidades que centraliza el acceso de tus usuarios,
          protege tus aplicaciones y permite a cada persona ver{' '}
          <strong className="text-white">exactamente lo que necesita</strong>, sin complicaciones y
          con la seguridad que tu organización merece.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            Empezar ahora →
          </Link>
          <a
            href="#features"
            className="border border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
          >
            Ver características
          </a>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 border-t border-white/10 pt-16">
          {[
            { value: 'Acceso seguro', label: 'Inicio de sesión unificado', desc: 'Un solo login para todas tus aplicaciones' },
            { value: 'Control total', label: 'Permisos por perfil', desc: 'Cada usuario ve solo lo que le corresponde' },
            { value: 'Multi-tenant', label: 'Gestión centralizada', desc: 'Múltiples organizaciones en una sola plataforma' },
          ].map(({ value, label, desc }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-indigo-300 text-sm font-medium mt-1">{label}</div>
              <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
