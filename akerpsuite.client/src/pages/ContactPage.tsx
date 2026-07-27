import PageHeader from '../components/PageHeader';
import Contact from '../components/Contact';
import FAQ from '../components/FAQ';

export default function ContactPage() {
    return (
        <>
            <PageHeader
                eyebrow="Get In Touch"
                title="Let's talk about your"
                highlight="solar switch."
                desc="Fill out the form, call us, or drop by our office in Sunder Nagar — we'll arrange a free site survey and consultation."
            />
            <Contact />
            <FAQ />
        </>
    );
}
