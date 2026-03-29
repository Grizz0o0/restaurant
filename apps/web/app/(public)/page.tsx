'use client';

import HeroSection from '@/app/(public)/_components/HeroSection';
import MenuSection from '@/app/(public)/_components/MenuSection';
import RecommendationsSection from '@/app/(public)/_components/RecommendationsSection';
import TopSellingSection from '@/app/(public)/_components/TopSellingSection';
import AboutSection from '@/app/(public)/_components/AboutSection';
import TestimonialsSection from '@/app/(public)/_components/TestimonialsSection';
import ContactSection from '@/app/(public)/_components/ContactSection';

const Index = () => {
    return (
        <div className="min-h-screen bg-background">
            <HeroSection />
            <RecommendationsSection />
            <TopSellingSection />
            <MenuSection />
            <AboutSection />
            <TestimonialsSection />
            <ContactSection />
        </div>
    );
};

export default Index;
