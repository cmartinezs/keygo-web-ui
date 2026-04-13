import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CriticalActionConfirmationModal } from './CriticalActionConfirmationModal'

describe('CriticalActionConfirmationModal', () => {
  it('renders the warning step with configurable texts', () => {
    const markup = renderToStaticMarkup(
      <CriticalActionConfirmationModal
        isOpen
        step="warning"
        requirePassword
        requireTypedConfirmation
        texts={{
          warningTitle: 'Suspender usuario',
          warningDescription: 'Esta accion bloqueara el acceso.',
          confirmationHelpText: 'Escribe la frase exacta.',
          confirmationPhrase: 'quiero suspender al usuario demo',
          confirmationLabel: 'Frase de confirmacion',
          confirmationPlaceholder: 'Escribe la frase exacta',
          confirmationExactMatchHint: 'Debe coincidir exactamente.',
          continueLabel: 'Continuar',
          cancelLabel: 'Cancelar',
          passwordTitle: 'Confirma tu contrasena',
          passwordDescription: 'Reingresa tu contrasena.',
          passwordLabel: 'Contrasena actual',
          passwordBackLabel: 'Volver',
          submitLabel: 'Confirmar suspension',
        }}
        confirmationValue=""
        confirmationErrorMessage={null}
        password=""
        passwordErrorMessage={null}
        isPending={false}
        onConfirmationChange={() => undefined}
        onPasswordChange={() => undefined}
        onClose={() => undefined}
        onBack={() => undefined}
        onContinue={() => undefined}
        onSubmit={() => undefined}
      />,
    )

    expect(markup).toContain('Suspender usuario')
    expect(markup).toContain('quiero suspender al usuario demo')
    expect(markup).toContain('Continuar')
  })
})
