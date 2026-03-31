import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { LandingNav } from './LandingNav'
import { HeroSection } from './HeroSection'
import { FeaturesSection } from './FeaturesSection'
import { HowItWorksSection } from './HowItWorksSection'
import { RolesSection } from './RolesSection'
import { PricingSection } from './PricingSection'
import { DevelopersSection } from './DevelopersSection'
import { CTASection } from './CTASection'
import { ScrollToTop } from '@/components/ScrollToTop'

export default function LandingPage() {
  const location = useLocation()

  useEffect(() => {
    const navigationState = location.state as { scrollToTop?: boolean } | null

    if (!navigationState?.scrollToTop) {
      return
    }

    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.state])

  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <RolesSection />
        <PricingSection />
        <DevelopersSection />
      </main>
      <CTASection />
      <ScrollToTop />
    </div>
  )
}
