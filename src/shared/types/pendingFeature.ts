export interface PendingFeatureKpi {
  key: string
  label: string
  value: string
}

export interface PendingFeatureAction {
  id: string
  label: string
  tone?: 'default' | 'danger'
}

export interface PendingFeatureSnapshot {
  feature_id: string
  title: string
  summary: string
  columns: string[]
  rows: Record<string, string>[]
  kpis: PendingFeatureKpi[]
  actions?: PendingFeatureAction[]
}

export interface PendingFeatureActionResult {
  action: string
  item_id?: string
  ok: boolean
  message: string
}
