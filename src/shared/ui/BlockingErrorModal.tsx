import { useEffect, useRef, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  useBlockingErrorStore,
  type BlockingErrorAction,
  type NoRoleError,
} from '@/shared/lib/auth/blockingErrorStore'
import { useTokenStore } from '@/shared/lib/auth/tokenStore'
import { getProfile, ACCOUNT_QUERY_KEYS } from '@/features/account/api'
import { TENANT } from '@/shared/api/client'
import { env } from '@/shared/lib/config/env'

const DEFAULT_NO_ROLE_ACTIONS: BlockingErrorAction[] = [
  { id: 'close-modal', label: 'Cerrar mensaje', kind: 'close', variant: 'secondary' },
  { id: 'logout', label: 'Cerrar sesión', kind: 'logout', variant: 'primary' },
]

function actionClassName(variant: BlockingErrorAction['variant']) {
  if (variant === 'secondary') {
    return 'border border-white/20 hover:border-white/40 hover:bg-white/5 text-slate-100 focus-visible:ring-white/40'
  }
  return 'bg-amber-500 hover:bg-amber-400 text-slate-900 focus-visible:ring-amber-300'
}

// ── DetailCell ────────────────────────────────────────────────────────────────

interface DetailCellProps {
  label: string
  value: string
}

function DetailCell({ label, value }: DetailCellProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/60 px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-all">{value}</dd>
    </div>
  )
}

// ── NoRoleContent ─────────────────────────────────────────────────────────────

interface NoRoleContentProps {
  error: NoRoleError
  actions: BlockingErrorAction[]
  onAction: (action: BlockingErrorAction) => void
}

function NoRoleContent({ error, actions, onAction }: NoRoleContentProps) {
  const [isCopying, setIsCopying] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.profile(TENANT),
    queryFn: () => getProfile(TENANT),
    retry: 1,
  })

  const payload = useMemo(
    () => ({
      supportCode: error.supportCode,
      timestamp: error.timestamp,
      userId: error.userId,
      username: profile?.username ?? error.usernameHint,
      email: profile?.email ?? 'N/D',
      rolesDetected: error.rolesDetected,
      tenantClaim: error.tenantClaim,
      issuer: error.issuer,
      uiTenantSlug: env.TENANT_SLUG,
      uiClientId: env.CLIENT_ID,
    }),
    [error, profile],
  )

  async function handleCopy() {
    setIsCopying(true)
    const text = [
      `supportCode=${payload.supportCode}`,
      `timestamp=${payload.timestamp}`,
      `userId=${payload.userId}`,
      `username=${payload.username}`,
      `email=${payload.email}`,
      `rolesDetected=${payload.rolesDetected}`,
      `tenantClaim=${payload.tenantClaim}`,
      `issuer=${payload.issuer}`,
      `uiTenantSlug=${payload.uiTenantSlug}`,
      `uiClientId=${payload.uiClientId}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Datos de soporte copiados al portapapeles.')
    } catch {
      toast.error('No se pudieron copiar los datos. Intenta copiar manualmente.')
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <>
      <header className="mb-6">
        <p className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
          Acceso correcto sin permisos disponibles
        </p>
        <h2 id="blocking-error-title" className="mt-4 text-2xl font-bold tracking-tight">
          Tu inicio de sesión fue exitoso, pero por ahora no tienes acceso a esta sección.
        </h2>
        <p className="mt-3 text-sm text-slate-300 leading-relaxed">
          Esto puede pasar cuando tu cuenta aún no tiene permisos cargados en el sistema.
          Contacta a soporte o a tu administrador e indica el código y los datos que aparecen abajo.
        </p>
      </header>

      <div
        className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3"
        aria-label="Código de referencia para soporte"
      >
        <p className="text-xs uppercase tracking-wide text-amber-200">Código de referencia</p>
        <p className="mt-1 text-lg font-bold text-amber-100">{payload.supportCode}</p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2" aria-label="Datos de referencia para soporte">
        <DetailCell label="ID de usuario" value={payload.userId} />
        <DetailCell label="Usuario" value={payload.username} />
        <DetailCell label="Correo" value={payload.email} />
        <DetailCell label="Permisos detectados" value={payload.rolesDetected} />
        <DetailCell label="Organización (sistema)" value={payload.tenantClaim} />
        <DetailCell label="Organización esperada (UI)" value={payload.uiTenantSlug} />
        <DetailCell label="Aplicación (UI)" value={payload.uiClientId} />
        <DetailCell label="Servidor de autenticación" value={payload.issuer} />
      </dl>

      <p className="mt-4 text-xs text-slate-400">Referencia generada: {payload.timestamp}</p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleCopy}
          disabled={isCopying}
          className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2.5 transition-colors disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-amber-300"
        >
          {isCopying ? 'Copiando...' : 'Copiar datos para soporte'}
        </button>
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action)}
            className={`flex-1 rounded-lg px-4 py-2.5 font-semibold transition-colors focus-visible:ring-2 ${actionClassName(action.variant)}`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </>
  )
}

// ── BlockingErrorModal ────────────────────────────────────────────────────────

/**
 * Modal bloqueante genérico: aparece sobre la pantalla actual cuando se
 * detecta un error que impide continuar el flujo normal.
 * Montado globalmente en App.tsx. Se activa vía useBlockingErrorStore.
 * No se puede cerrar con Escape ni haciendo clic fuera — solo con las
 * acciones explícitas de cada tipo de error.
 */
export function BlockingErrorModal() {
  const { error, clearError } = useBlockingErrorStore()
  const { clearTokens } = useTokenStore()
  const navigate = useNavigate()
  const innerRef = useRef<HTMLDivElement>(null)

  // Mover el foco al modal al abrirse
  useEffect(() => {
    if (error) innerRef.current?.focus()
  }, [error])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Modal bloqueante: Escape no cierra
    if (e.key === 'Escape') { e.preventDefault(); return }
    if (e.key !== 'Tab') return
    // Trampa de foco: Tab circula solo dentro del modal
    const focusable = innerRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  function handleAction(action: BlockingErrorAction) {
    if (action.kind === 'close') {
      clearError()
      return
    }
    if (action.kind === 'go-login') {
      clearError()
      navigate('/login', { replace: true })
      return
    }
    if (action.kind === 'logout') {
      clearError()
      clearTokens()
      navigate('/logout', { replace: true })
    }
  }

  if (!error) return null

  const actions = error.kind === 'NO_ROLE'
    ? error.actions ?? DEFAULT_NO_ROLE_ACTIONS
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-10 overflow-y-auto">
      <div
        ref={innerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="blocking-error-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-slate-900 p-6 sm:p-8 shadow-2xl outline-none text-slate-100"
      >
        {error.kind === 'NO_ROLE' && (
          <NoRoleContent error={error} actions={actions} onAction={handleAction} />
        )}
      </div>
    </div>
  )
}
