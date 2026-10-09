import { lazy, Suspense, useEffect, useRef, useState, type ComponentType } from 'react';
import SEO from '../components/SEO';
import Hero from '../components/Hero';
import Ticker from '../components/Ticker';

// Below-the-fold: alag chunks
const WhyUs = lazy(() => import('../components/WhyUs'));
const Carousel = lazy(() => import('../components/Carousel'));
const Services = lazy(() => import('../components/Services'));
const Impact = lazy(() => import('../components/Impact'));
const Testimonials = lazy(() => import('../components/Testimonials'));
const CTA = lazy(() => import('../components/CTA'));

function Deferred({
    component: Component,
    minHeight = 500,
}: {
    component: ComponentType;
    minHeight?: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (show) return;
        const el = ref.current;
        if (!el) return;

        let timer: number | undefined;
        let io: IntersectionObserver | undefined;

        const reveal = () => {
            setShow(true);
            io?.disconnect();
            if (timer) window.clearTimeout(timer);
        };

        if ('IntersectionObserver' in window) {
            io = new IntersectionObserver(
                (entries) => entries.some((e) => e.isIntersecting) && reveal(),
                { rootMargin: '400px 0px' }
            );
            io.observe(el);
        } else {
            reveal();
        }

        timer = window.setTimeout(reveal, 4000);

        return () => {
            io?.disconnect();
            if (timer) window.clearTimeout(timer);
        };
    }, [show]);

    return (
        <div ref={ref} style={show ? undefined : { minHeight }}>
            {show && (
                <Suspense fallback={<div style={{ minHeight }} />}>
                    <Component />
                </Suspense>
            )}
        </div>
    );
}

export default function HomePage() {
    return (
        <>
            <SEO
                title="AKS Solar Systems | Solar Power Solutions in Himachal Pradesh"
                description="AKS Solar Systems provides rooftop, off-grid & solar power plants, solar geysers, and solar street lights across Himachal Pradesh and North India. Get a free quote."
            />
            <Hero />
            <Ticker />
            <Deferred component={WhyUs} minHeight={600} />
            <Deferred component={Carousel} minHeight={500} />
            <Deferred component={Services} minHeight={700} />
            <Deferred component={Impact} minHeight={400} />
            <Deferred component={Testimonials} minHeight={500} />
            <Deferred component={CTA} minHeight={300} />
        </>
    );
}