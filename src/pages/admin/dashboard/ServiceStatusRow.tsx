import type { PlatformDashboardData } from '@/types/dashboard'
import { StatCard } from './DashboardPrimitives'

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconServer() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 17.25v.102a3 3 0 01-3 2.898h-13.5a3 3 0 01-3-2.898V17.25m19.5 0a2.25 2.25 0 00.75-1.661V6.75a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6.75v8.839c0 .621.247 1.183.648 1.661M21.75 17.25H2.25m4.5-9.75h.008v.008H6.75V7.5zm0 3h.008v.008H6.75V10.5zm0 3h.008v.008H6.75V13.5z" />
    </svg>
  )
}

function IconTag() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.169.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  )
}

function IconKey() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ServiceStatusRowProps {
  service: PlatformDashboardData['service'] | undefined
  activeSigningKey: PlatformDashboardData['security']['active_signing_key'] | undefined
}

export function ServiceStatusRow({ service, activeSigningKey }: ServiceStatusRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label="Servicio" value={service?.name} icon={<IconServer />} highlight />
      <StatCard label="Entorno" value={service?.environment} icon={<IconGlobe />} highlight />
      <StatCard label="Versión" value={service?.version} icon={<IconTag />} highlight />
      <div className="bg-white dark:bg-slate-900 border border-indigo-400 dark:border-indigo-500/60 rounded-xl p-5 flex flex-col gap-2 transition-colors">
        <div className="flex items-center gap-1.5">
          <span className="text-amber-500"><IconKey /></span>
          <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
            Clave activa
          </span>
        </div>
        {activeSigningKey
          ? (
            <>
              <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white truncate">
                {activeSigningKey.kid}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {activeSigningKey.algorithm} · {activeSigningKey.age_days}d
              </span>
            </>
          )
          : <span className="text-slate-400 dark:text-slate-600 text-sm font-normal italic">—</span>}
      </div>
    </div>
  )
}


