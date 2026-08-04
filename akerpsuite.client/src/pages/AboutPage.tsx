import PageHeader from '../components/PageHeader';
import Process from '../components/Process';
import FounderMessage from '../components/Foundermessage';
import CMDMessage from '../components/Cmdmessage';
import DirectorMessage from '../components/Directormessage';
import Team from '../components/Team';
import Highlights from '../components/Highlights';
import Partners from '../components/Partners';
import CTA from '../components/CTA';

export default function AboutPage() {
    return (
        <>
            <PageHeader
                eyebrow="About AKS Solar"
                title="Built in the hills of"
                highlight="Himachal Pradesh."
                desc="Incorporated in 2023 and based in Sunder Nagar, Mandi — we design, install, and maintain solar systems for homes, institutions, and businesses across North India."
            />
            <Process />
            <Team />
            <Highlights />
            <Partners />
            <CTA />
        </>
    );
}