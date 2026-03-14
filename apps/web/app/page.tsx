'use client';

import HeroSection from '@/components/sections/HeroSection';
import MenuSection from '@/components/sections/MenuSection';
import RecommendationsSection from '@/components/sections/RecommendationsSection';
import TopSellingSection from '@/components/sections/TopSellingSection';
import AboutSection from '@/components/sections/AboutSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import ContactSection from '@/components/sections/ContactSection';

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
