import { redirect } from 'next/navigation';
import { LANDING_CONFIG } from '@/constants/landing';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import ContactSection from '@/components/landing/ContactSection';
import FooterSection from '@/components/landing/FooterSection';

export default function Home() {
  /* Toggle: set showLanding to false to redirect straight to login (useful for testing) */
  if (!LANDING_CONFIG.showLanding) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <ContactSection />
      <FooterSection />
    </main>
  );
}
