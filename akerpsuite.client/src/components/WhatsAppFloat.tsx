import { CONTACT } from '../data/siteData'

export default function WhatsAppFloat() {
    return (
        <a
            href={CONTACT.whatsappPrefilled}
            target="_blank"
            rel="noopener"
            aria-label="Chat with us on WhatsApp"
            className="fixed bottom-5 left-5 z-[900] flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#25D366] text-[1.3rem] text-white shadow-[0_10px_28px_rgba(37,211,102,0.35)] transition-all hover:-translate-y-[3px] hover:scale-105 hover:shadow-[0_14px_34px_rgba(37,211,102,0.45)] md:bottom-7 md:left-7 md:h-14 md:w-14 md:text-[1.5rem]"
        >
            <span className="absolute inset-0 -z-10 animate-whatsapp-pulse rounded-full bg-[#25D366]"></span>
            <i className="fab fa-whatsapp"></i>
        </a>
    )
}
