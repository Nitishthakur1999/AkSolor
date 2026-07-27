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
