import type { PlanId } from '@/api/contracts'

export interface PlanInfo {
  id: PlanId
  name: string
  badge?: string
  price: string
  priceNote: string
  description: string
  features: string[]
  cta: string
  highlighted: boolean
}

export const PLANS: PlanInfo[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Gratis',
    priceNote: 'Para siempre',
    description:
      'Ideal para proyectos personales, prototipos o equipos pequeños que quieren explorar KeyGo sin compromisos.',
    features: [
      'Hasta 500 usuarios activos',
      '1 tenant incluido',
      '2 aplicaciones cliente',
      'Inicio de sesión seguro',
      'Soporte por comunidad',
    ],
    cta: 'Empezar gratis',
    highlighted: false,
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'Más popular',
    price: '49 €',
    priceNote: 'por mes · facturación anual',
    description:
      'Para empresas en crecimiento que necesitan gestionar múltiples organizaciones con control total y soporte dedicado.',
    features: [
      'Usuarios ilimitados',
      'Tenants ilimitados',
      'Aplicaciones cliente ilimitadas',
      'Roles y permisos avanzados',
      'SSO con tus sistemas actuales',
      'Soporte prioritario por email',
      'SLA 99.9 % de disponibilidad',
    ],
    cta: 'Iniciar prueba de 14 días',
    highlighted: true,
  },
  {
    id: 'on-premise',
    name: 'On-Premise',
    price: 'A medida',
    priceNote: 'Licencia perpetua o suscripción',
    description:
      'Despliega KeyGo en tu propia infraestructura. Control total sobre tus datos, sin dependencias externas.',
    features: [
      'Instalación en tus servidores',
      'Datos 100 % bajo tu control',
      'Integración con Active Directory / LDAP',
      'Acceso completo al código fuente',
      'Soporte de implementación incluido',
      'Actualizaciones y parches garantizados',
    ],
    cta: 'Contactar con ventas',
    highlighted: false,
  },
]

export const PLAN_NAMES: Record<PlanId, string> = {
  starter: 'Starter',
  business: 'Business',
  'on-premise': 'On-Premise',
}
