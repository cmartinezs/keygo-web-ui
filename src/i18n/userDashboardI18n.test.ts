import { afterAll, describe, expect, it } from 'vitest'
import { i18n } from './config'

describe('user dashboard i18n', () => {
  const originalLanguage = i18n.language

  afterAll(async () => {
    await i18n.changeLanguage(originalLanguage)
  })

  it('resolves user dashboard labels in es-CL', async () => {
    await i18n.changeLanguage('es-CL')

    expect(i18n.t('userDashboardMyAccess.title')).toBe('Mi acceso')
    expect(i18n.t('userDashboardProfile.tabs.summary')).toBe('Resumen')
    expect(i18n.t('userDashboardSessions.title')).toBe('Sesiones')
  })

  it('switches user dashboard labels to en-US at runtime', async () => {
    await i18n.changeLanguage('en-US')

    expect(i18n.t('userDashboardMyAccess.title')).toBe('My access')
    expect(i18n.t('userDashboardProfile.form.saveChanges')).toBe('Save changes')
    expect(i18n.t('userDashboardSessions.persistenceTitle')).toBe('Session persistence')
  })
})
