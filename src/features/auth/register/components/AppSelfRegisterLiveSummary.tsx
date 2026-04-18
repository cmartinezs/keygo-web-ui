import { useTranslation } from 'react-i18next'
import { StepSummary } from '@/shared/ui/StepSummary'

interface AppSelfRegisterLiveSummaryProps {
  tenantName: string | null
  appName: string | null
  email: string | null
  currentStepLabel: string
  done: boolean
}

export function AppSelfRegisterLiveSummary({
  tenantName,
  appName,
  email,
  currentStepLabel,
  done,
}: AppSelfRegisterLiveSummaryProps) {
  const { t } = useTranslation()

  const sections = [
    {
      label: t('appSelfRegister.layout.summaryTenant'),
      value: tenantName || '—',
    },
    {
      label: t('appSelfRegister.layout.summaryApp'),
      value: appName || '—',
    },
    {
      label: t('appSelfRegister.layout.summaryEmail'),
      value: email || '—',
    },
  ]

  return (
    <StepSummary
      title={t('appSelfRegister.layout.summaryTitle')}
      currentStepLabel={currentStepLabel}
      currentStepText={t('appSelfRegister.layout.currentStep')}
      completedText={t('appSelfRegister.layout.completed')}
      isDone={done}
      sections={sections}
    />
  )
}

