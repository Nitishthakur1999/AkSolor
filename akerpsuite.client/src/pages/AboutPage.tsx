import PageHeader from '../components/PageHeader';
import Process from '../components/Process';
import Team from '../components/Team';
import Highlights from '../components/Highlights';
import Partners from '../components/Partners';
import CTA from '../components/CTA';

export default function AboutPage() {
    return (
        <>
            <PageHeader
                eyebrow="About AKS Solar Systems Private Limited"
                title="Built in the hills of"
                highlight="Himachal Pradesh."
                desc="AKS Solar Systems Private Limited was incorporated in 2023 and is based in Sunder Nagar, Mandi, Himachal Pradesh — we design, install, and maintain solar systems for homes, institutions, and businesses across North India."
            />
            <Process />
            <Team />
            <Highlights />
            <Partners />
            <CTA />
        </>
    );
}