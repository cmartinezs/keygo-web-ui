const resources = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: 'Documentación técnica',
    description: 'Guías de integración, referencia de la API REST y ejemplos de código para conectar KeyGo con tus aplicaciones.',
    cta: 'Próximamente',
    ctaHref: '#developers',
    pending: true,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    title: 'SDKs e integraciones',
    description: 'Librerías oficiales y ejemplos listos para usar en los frameworks y lenguajes más populares.',
    cta: 'Próximamente',
    ctaHref: '#developers',
    pending: true,
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'API REST completa',
    description: 'Endpoints documentados con OpenAPI v3. Integra KeyGo en tu stack en minutos con contratos claros y respuestas consistentes.',
    cta: 'Ver especificación',
    ctaHref: '#developers',
    pending: false,
  },
]

export function DevelopersSection() {
  return (
    <section id="developers" className="py-24 bg-slate-900 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-indigo-400 text-sm font-semibold uppercase tracking-widest">
            Para desarrolladores
          </span>
          <h2 className="mt-3 text-4xl font-extrabold text-white">
            Integra KeyGo en minutos
          </h2>
          <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
            KeyGo está diseñado para ser adoptado rápidamente por cualquier equipo de desarrollo.
            Documentación clara, API REST estándar y SDKs oficiales en camino.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {resources.map(({ icon, title, description, cta, ctaHref, pending }) => (
            <div
              key={title}
              className="rounded-2xl bg-slate-800 border border-slate-700 p-8 flex flex-col"
            >
              <div className="w-12 h-12 bg-indigo-900/60 text-indigo-400 rounded-xl flex items-center justify-center mb-5">
                {icon}
              </div>
              <h3 className="text-white font-bold text-lg mb-3">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1 mb-6">{description}</p>
              <a
                href={ctaHref}
                className={`inline-flex items-center gap-2 text-sm font-semibold ${
                  pending
                    ? 'text-slate-500 cursor-default'
                    : 'text-indigo-400 hover:text-indigo-300 transition-colors'
                }`}
                aria-disabled={pending}
              >
                {cta}
                {!pending && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
                {pending && (
                  <span className="bg-slate-700 text-slate-400 text-xs font-medium px-2 py-0.5 rounded-full">
                    En desarrollo
                  </span>
                )}
              </a>
            </div>
          ))}
        </div>

        {/* Banner de documentación futura */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/40 px-8 py-10 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div>
            <h3 className="text-white font-bold text-xl mb-2">Portal de documentación — próximamente</h3>
            <p className="text-slate-400 text-sm max-w-xl">
              Estamos preparando un portal completo con guías paso a paso, referencia de la API,
              tutoriales y ejemplos de integración para los principales frameworks.
            </p>
          </div>
          <a
            href="#developers"
            aria-disabled
            className="shrink-0 border border-indigo-500/40 text-indigo-400 text-sm font-semibold px-6 py-3 rounded-xl cursor-default opacity-60"
          >
            Avisarme cuando esté listo
          </a>
        </div>
      </div>
    </section>
  )
}
