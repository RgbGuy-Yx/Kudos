import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
import HeroSection from '@/sections/hero-section';
import TrustedBrand from '@/sections/trusted-brand';
import FeaturesSection from '@/sections/features-section';
import BuildProcess from '@/sections/build-process';
import PricingSection from '@/sections/pricing-section';
import OurTestimonials from '@/sections/our-testimonials';
import CallToAction from '@/sections/call-to-action';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="px-4 py-4 md:px-16 lg:px-24 xl:px-32">
        <HeroSection />
        <TrustedBrand />
        <FeaturesSection />
        <BuildProcess />
        <PricingSection />
        <OurTestimonials />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
