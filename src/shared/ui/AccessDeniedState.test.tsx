import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import '@/shared/lib/i18n/config'
import { AccessDeniedState } from './AccessDeniedState'

describe('AccessDeniedState', () => {
  it('renders the forbidden message and action label', () => {
    const onAction = vi.fn()

    const markup = renderToStaticMarkup(
      <AccessDeniedState
        title="Acceso restringido"
        message="No tienes permiso para consultar este recurso."
        description="Solicita habilitación al equipo administrador."
        actionLabel="Volver al dashboard"
        onAction={onAction}
      />,
    )

    expect(markup).toContain('Acceso restringido')
    expect(markup).toContain('No tienes permiso para consultar este recurso.')
    expect(markup).toContain('Volver al dashboard')
  })
})
