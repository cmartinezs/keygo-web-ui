import { afterAll, describe, expect, it } from 'vitest'
import { i18n } from './config'

describe('admin dashboard i18n', () => {
  const originalLanguage = i18n.language

  afterAll(async () => {
    await i18n.changeLanguage(originalLanguage)
  })

  it('resolves admin dashboard labels in es-CL', async () => {
    await i18n.changeLanguage('es-CL')

    expect(i18n.t('adminDashboard.title')).toBe('Panel de control')
    expect(i18n.t('adminDashboard.sections.security')).toBe('Seguridad')
    expect(i18n.t('adminDashboard.rankings.topAppsByMemberships')).toBe('Top apps por memberships')
  })

  it('switches admin dashboard labels to en-US at runtime', async () => {
    await i18n.changeLanguage('en-US')

    expect(i18n.t('adminDashboard.title')).toBe('Control panel')
    expect(i18n.t('adminDashboard.refresh')).toBe('Refresh')
    expect(i18n.t('adminDashboard.rankings.membersLabel')).toBe('members')
  })
})
