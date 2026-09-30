import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFoundPage() {
    return (
        <>
            <SEO
                title="Page Not Found | AKS Solar Systems"
                description="The page you are looking for does not exist. Return to the AKS Solar Systems homepage."
                noIndex
            />

            <section className="flex min-h-[70vh] items-center border-t border-line bg-paper py-16 sm:py-24">
                <div className="container mx-auto max-w-[700px] px-5 text-center sm:px-7">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold-deep">
                        Error 404
                    </p>
                    <h1 className="mb-4 text-5xl font-bold text-charcoal sm:text-7xl">
                        Page not found.
                    </h1>
                    <p className="mx-auto mb-8 max-w-[520px] text-[0.96rem] leading-[1.8] text-charcoal">
                        The page you are looking for may have been moved, renamed, or never existed.
                        Let's get you back to the sunshine.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            to="/"
                            className="rounded-full bg-gold-deep px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                            Back to Home
                        </Link>
                        <Link
                            to="/contact"
                            className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-charcoal transition hover:bg-black/5"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}