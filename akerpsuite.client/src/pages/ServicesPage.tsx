import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import Services from '../components/Services';
import WhyUs from '../components/WhyUs';
import CTA from '../components/CTA';

export default function ServicesPage() {
    return (
        <>
            <SEO
                title="Solar Services in Himachal Pradesh | AKS Solar Systems"
                description="Rooftop solar, off-grid systems, solar geysers and street lights — design, installation and maintenance by AKS Solar across Himachal Pradesh and North India."
            />
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