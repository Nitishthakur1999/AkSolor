export default function ScrollTopButton({ show }) {
    function handleClick() {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    return (
        <button
            aria-label="Scroll to top"
            onClick={handleClick}
            className={`fixed bottom-5 right-5 z-[900] flex h-[46px] w-[46px] items-center justify-center rounded-full bg-gold text-[1.05rem] text-chalk shadow-[0_10px_28px_rgba(228,255,78,0.25)] transition-all duration-300 hover:bg-gold-deep hover:text-chalk hover:shadow-[0_10px_28px_rgba(255,77,46,0.35)] md:bottom-7 md:right-7 md:h-[50px] md:w-[50px]
      ${show ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-3 opacity-0'}`}
        >
            <i className="fas fa-arrow-up"></i>
        </button>
    )
}
