import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { CustomerReview } from '@/components/landing/CustomerReview';
import { ServicesCollection } from '@/components/landing/ServicesCollection';
import { PhilosophySection } from '@/components/landing/PhilosophySection';
import { Footer } from '@/components/layout/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9F5] flex flex-col font-body selection:bg-[#C5A880]/30 selection:text-[#14271C]">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <CustomerReview />
        <ServicesCollection />
        <PhilosophySection />
      </main>
      <Footer />
    </div>
  );
};
