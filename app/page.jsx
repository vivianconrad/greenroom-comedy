import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/organisms/landing/navbar'
import { HeroSection } from '@/components/organisms/landing/hero-section'
import { SocialProofBar } from '@/components/organisms/landing/social-proof-bar'
import { FeaturesSection } from '@/components/organisms/landing/features-section'
import { HowItWorksSection } from '@/components/organisms/landing/how-it-works-section'
import { CtaSection } from '@/components/organisms/landing/cta-section'
import { Footer } from '@/components/organisms/landing/footer'

export const metadata = {
  title: 'Greenroom — Show production software for comedy producers',
  description:
    'Greenroom gives independent comedy producers the checklists, timelines, and booking tools they actually need. Know what to do, when to do it, and never forget to locate the rubber ducks again.',
  openGraph: {
    title: 'Greenroom — Show production software for comedy producers',
    description:
      'Know what to do, when to do it, and never forget to locate the rubber ducks again.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Greenroom app preview' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Greenroom — Show production software for comedy producers',
    description:
      'Know what to do, when to do it, and never forget to locate the rubber ducks again.',
  },
}

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-cream font-body">
      <Navbar isLoggedIn={!!user} />
      <main>
        <HeroSection />
        <SocialProofBar />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
