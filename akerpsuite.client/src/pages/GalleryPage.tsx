import SEO from '../components/SEO';
import PageHeader from '../components/PageHeader';
import Gallery from '../components/Gallery';
import PhotoGallery from '../components/PhotoGallery';
import Videos from '../components/Videos';
import CTA from '../components/CTA';

export default function GalleryPage() {
    return (
        <>
            <SEO
                title="Project Gallery | AKS Solar Systems Himachal"
                description="See rooftop, off-grid and solar street light projects completed by AKS Solar across Himachal Pradesh and North India."
            />
            <PageHeader
                eyebrow="Our Work"
                title="Projects across"
                highlight="North India."
                desc="A look at installs we've completed — from rooftop residential systems to ground-mounted commercial plants."
            />
            <Gallery />
            <PhotoGallery />
            <Videos />
            <CTA />
        </>
    );
}