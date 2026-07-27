import PageHeader from '../components/PageHeader';
import Services from '../components/Services';
import WhyUs from '../components/WhyUs';
import CTA from '../components/CTA';

export default function ServicesPage() {
    return (
        <>
            <PageHeader
                eyebrow="What We Do"
                title="Solar solutions for every"
                highlight="rooftop and field."
                desc="From residential rooftops to ground-mounted commercial arrays — design, installation, and maintenance, all under one roof."
            />
            <Services />
            <WhyUs />
            <CTA />
        </>
    );
}
