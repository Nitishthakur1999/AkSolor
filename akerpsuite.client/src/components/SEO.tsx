import { Helmet } from 'react-helmet-async';

type SEOProps = {
    title: string;
    description: string;
    noIndex?: boolean;
};

export default function SEO({ title, description, noIndex = false }: SEOProps) {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content="website" />
            {noIndex && <meta name="robots" content="noindex, nofollow" />}
        </Helmet>
    );
}