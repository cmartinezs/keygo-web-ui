const steps = [
  {
    number: '01',
    title: 'El usuario inicia sesión',
    description:
      'El usuario accede con sus credenciales a través de una pantalla de login segura gestionada por KeyGo. No importa desde qué aplicación entre: siempre es la misma experiencia.',
    detail: 'Un único punto de acceso para todas tus aplicaciones.',
  },
  {
    number: '02',
    title: 'KeyGo verifica y authoriza',
    description:
      'KeyGo comprueba la identidad del usuario, valida sus permisos y establece una sesión activa de forma automática. Todo ocurre en segundo plano, sin interrumpir el flujo de trabajo.',
    detail: 'La sesión se renueva sola para que nadie pierda su trabajo.',
  },
  {
    number: '03',
    title: 'Acceso personalizado por perfil',
    description:
      'Cada usuario llega directamente a su panel: administradores globales, responsables de organización o usuarios finales ven exactamente las herramientas que les corresponden.',
    detail: 'Sin configuración manual: los permisos se aplican de forma automática.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-indigo-600 text-sm font-semibold uppercase tracking-widest">
            Cómo funciona
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-slate-900">
            Seguridad sin fricciones en tres pasos
          </h2>
          <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
            KeyGo gestiona toda la complejidad de la seguridad en segundo plano.
            Tus usuarios solo experimentan acceso rápido y fluido.
          </p>
        </div>

        <div className="relative">
          {/* Línea conectora — solo desktop */}
          <div
            className="hidden lg:block absolute top-12 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
            {steps.map(({ number, title, description, detail }) => (
              <div key={number} className="flex flex-col items-center text-center">
                {/* Número */}
                <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-600/30 relative z-10">
                  <span className="text-white font-extrabold text-2xl">{number}</span>
                </div>

                <h3 className="text-slate-900 font-bold text-xl mb-3">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{description}</p>

                <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2">
                  <p className="text-indigo-700 text-xs font-medium">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
