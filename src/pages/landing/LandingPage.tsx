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
