import SEO from '../components/SEO';
import Hero from '../components/Hero';
import Ticker from '../components/Ticker';
import WhyUs from '../components/WhyUs';
import Carousel from '../components/Carousel';
import Services from '../components/Services';
import Impact from '../components/Impact';
import CTA from '../components/CTA';
import Testimonials from '../components/Testimonials';

export default function HomePage() {
    return (
        <>
            <SEO
                title="AKS Solar Systems | Solar Power Solutions in Himachal Pradesh"
                description="AKS Solar Systems provides rooftop, off-grid & solar power plants, solar geysers, and solar street lights across Himachal Pradesh and North India. Get a free quote."
            />
            <Hero />
            <Ticker />
            <WhyUs />
            <Carousel />
            <Services />
            <Impact />
            <Testimonials />
            <CTA />
        </>
    );
}