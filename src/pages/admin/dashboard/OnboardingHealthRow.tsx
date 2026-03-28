import type { RegistrationSummary } from '@/types/dashboard'

// ── Sub-card ──────────────────────────────────────────────────────────────────

interface OnboardingStatProps {
  label: string
  value: number | undefined
  color: string
}

function OnboardingStat({ label, value, color }: OnboardingStatProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl p-5 flex flex-col gap-2 hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-colors">
      <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
        {label}
      </span>
      <span className={`text-2xl font-bold ${color}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface OnboardingHealthRowProps {
  registration: RegistrationSummary | undefined
}

export function OnboardingHealthRow({ registration }: OnboardingHealthRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <OnboardingStat
        label="Pendientes de verificación"
        value={registration?.pending_email_verifications}
        color="text-amber-500"
      />
      <OnboardingStat
        label="Verificaciones expiradas"
        value={registration?.expired_pending_verifications}
        color="text-red-500"
      />
      <OnboardingStat
        label="Registros recientes"
        value={registration?.recent_registrations}
        color="text-slate-900 dark:text-white"
      />
      <OnboardingStat
        label="Verificaciones recientes"
        value={registration?.recent_verifications}
        color="text-emerald-500"
      />
    </div>
  )
}
