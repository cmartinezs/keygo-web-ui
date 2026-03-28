import { Link } from 'react-router-dom'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function LandingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg"
            aria-label="Volver al inicio de la página"
          >
            <svg
              className="w-7 h-7 text-indigo-400"
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
            <span className="text-white font-bold text-xl tracking-tight">KeyGo</span>
          </button>

          <nav className="hidden md:flex items-center gap-6" aria-label="Navegación principal">
            <a href="#features" className="text-slate-300 hover:text-white transition-colors text-sm">
              Características
            </a>
            <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors text-sm">
              Cómo funciona
            </a>
            <a href="#roles" className="text-slate-300 hover:text-white transition-colors text-sm">
              Para tu equipo
            </a>
            <a href="#pricing" className="text-slate-300 hover:text-white transition-colors text-sm">
              Planes
            </a>
            <a href="#developers" className="text-slate-300 hover:text-white transition-colors text-sm">
              Desarrolladores
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/register"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
            >
              Regístrate
            </Link>
            <Link
              to="/subscribe"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
            >
              Nuevo contrato
            </Link>
            <Link
              to="/login"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
