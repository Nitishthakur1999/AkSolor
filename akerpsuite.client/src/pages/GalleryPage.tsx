import PageHeader from '../components/PageHeader';
import Gallery from '../components/Gallery';
import PhotoGallery from '../components/PhotoGallery';
import CTA from '../components/CTA';

export default function GalleryPage() {
    return (
        <>
            <PageHeader
                eyebrow="Our Work"
                title="Projects across"
                highlight="North India."
                desc="A look at installs we've completed — from rooftop residential systems to ground-mounted commercial plants."
            />
            <Gallery />
            <PhotoGallery />
            <CTA />
        </>
    );
}
