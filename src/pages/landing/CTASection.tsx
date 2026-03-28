import { Link } from 'react-router-dom'

export function CTASection() {
  return (
    <footer className="bg-slate-900">
      {/* CTA principal */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="relative rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-8 py-16 overflow-hidden"
          >
            {/* Decoración */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />

            <div className="relative">
              <h2 className="text-4xl font-extrabold text-white mb-4">
                ¿Listo para empezar?
              </h2>
              <p className="text-indigo-100 text-lg mb-8 max-w-xl mx-auto">
                Accede a tu panel de KeyGo y toma el control de la identidad digital
                de tu organización hoy mismo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="inline-block bg-white text-indigo-700 font-bold px-10 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/subscribe"
                  className="inline-block border-2 border-white/60 hover:border-white text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
                >
                  Contratar
                </Link>
                <Link
                  to="/register"
                  className="inline-block border-2 border-white/60 hover:border-white text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
                >
                  Súmate a tu equipo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer inferior */}
      <div className="border-t border-white/10 px-4 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-indigo-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
            </svg>
            <span className="text-white font-semibold">KeyGo</span>
          </div>
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} KeyGo. Plataforma de gestión de identidades.
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" aria-hidden="true" />
            <span className="text-slate-400 text-sm">Todos los sistemas operativos</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
