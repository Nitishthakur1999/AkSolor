import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";

// Import your images here
import img1 from "/carousel/Rooftop.webp";
import img2 from "/carousel/offgridhome.webp";
import img3 from "/carousel/street.jpg";
import img4 from "/carousel/field.jpg";
import img5 from "/carousel/Heater.jpg";

const PROJECTS = [
    { title: "12kW Rooftop Solar Plant", location: "Sunder Nagar, Mandi", capacity: "12", unit: "kW", type: "Rooftop Grid-Tied", image: img1 },
    { title: "Off-Grid Home System", location: "Kullu Valley", capacity: "5", unit: "kW", type: "Off-Grid + Battery", image: img2 },
    { title: "Municipal Street Lighting", location: "Mandi", capacity: "80", unit: "units", type: "Solar Street Lights", image: img3 },
    { title: "Ground-Mounted Solar Farm", location: "Hamirpur", capacity: "50", unit: "kW", type: "Ground-Mounted", image: img4 },
    { title: "Solar Water Heating", location: "Bilaspur", capacity: "500", unit: "LPD", type: "Solar Geyser", image: img5 },
];

const AUTOPLAY_MS = 5500;
const DRAG_THRESHOLD = 60;

const CHAMFER = { clipPath: "polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)" };

function ProjectSlide({ project, active, index, total }: { project: typeof PROJECTS[number]; active: boolean; index: number; total: number }) {
    return (
        <div
            className="grid grid-cols-1 overflow-hidden border border-line-strong bg-paper shadow-card md:grid-cols-2"
            style={CHAMFER}
        >
            <div className="relative flex min-h-[250px] w-full items-center justify-center overflow-hidden bg-charcoal md:min-h-[400px]">
                <img
                    src={project.image}
                    alt={project.title}
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out will-change-transform ${active ? "scale-100" : "scale-110"
                        }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/10 to-transparent" />

                {/* corner chamfer flag, echoes the panel-cell notch */}
                <span
                    className="absolute right-0 top-0 border-b-[26px] border-l-[26px] border-b-transparent border-l-gold"
                    aria-hidden="true"
                />

                <span className="absolute left-5 top-5 z-10 flex items-center gap-1.5 rounded-full bg-chalk/90 px-3.5 py-1.5 font-mono text-[0.66rem] font-bold uppercase tracking-wider text-charcoal backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-deep" />
                    {project.type}
                </span>

                <span className="absolute bottom-5 left-5 z-10 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-chalk/80">
                    Install {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                </span>
            </div>

            <div className="flex flex-col justify-center gap-5 p-8 md:p-12">
                <div className="flex items-center gap-2 font-mono text-[0.75rem] uppercase tracking-[0.14em] text-gold-deep">
                    <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                    {project.location}
                </div>

                <h3 className="font-display text-[1.9rem] font-bold leading-tight text-charcoal md:text-[2.3rem]">
                    {project.title}
                </h3>

                <div className="flex items-end gap-4 border-t border-dashed border-line-strong pt-5">
                    <span className="font-display text-[2.4rem] font-bold leading-none tracking-tight text-charcoal">
                        {project.capacity}
                        <span className="ml-1 font-mono text-[0.9rem] font-medium text-gold-deep">{project.unit}</span>
                    </span>
                    <span className="mb-1 font-mono text-[0.72rem] uppercase tracking-wide text-slate">
                        Installed
                        <br />
                        capacity
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function Carousel() {
    const [index, setIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [autoplayKey, setAutoplayKey] = useState(0); // remounts progress bar to restart its animation
    const [drag, setDrag] = useState({ active: false, startX: 0, deltaX: 0 });
    const total = PROJECTS.length;
    const trackRef = useRef<HTMLDivElement>(null);

    const goTo = useCallback((next: number, { fromUser = false } = {}) => {
        setIndex(((next % total) + total) % total);
        if (fromUser) setAutoplayKey((k) => k + 1); // give the user the full interval again
    }, [total]);

    const goPrev = () => goTo(index - 1, { fromUser: true });
    const goNext = () => goTo(index + 1, { fromUser: true });

    // Auto-scroll logic
    useEffect(() => {
        if (isPaused || drag.active) return;
        const id = setTimeout(() => goTo(index + 1), AUTOPLAY_MS);
        return () => clearTimeout(id);
    }, [index, isPaused, drag.active, goTo, autoplayKey]);

    // Keyboard navigation
    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
        if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
    }

    // Drag / swipe (mouse + touch via Pointer Events)
    function onPointerDown(e: React.PointerEvent) {
        setDrag({ active: true, startX: e.clientX, deltaX: 0 });
        trackRef.current?.setPointerCapture?.(e.pointerId);
    }
    function onPointerMove(e: React.PointerEvent) {
        if (!drag.active) return;
        setDrag((d) => ({ ...d, deltaX: e.clientX - d.startX }));
    }
    function onPointerUp() {
        if (!drag.active) return;
        if (drag.deltaX > DRAG_THRESHOLD) goPrev();
        else if (drag.deltaX < -DRAG_THRESHOLD) goNext();
        setDrag({ active: false, startX: 0, deltaX: 0 });
    }

    const dragPercent = drag.active ? (drag.deltaX / (trackRef.current?.offsetWidth || 1)) * 100 : 0;

    return (
        <section
            id="projects"
            className="relative overflow-hidden bg-chalk py-16 md:py-24"
            style={{
                backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 56px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 56px)',
                backgroundPosition: '-1px -1px',
            }}
        >
            <div className="container relative z-[1] mx-auto px-7">
                <div className="mb-10 flex flex-col gap-6 md:mb-16 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-4 flex items-center gap-2.5 font-mono text-[0.78rem] font-medium uppercase tracking-[0.16em] text-gold-deep">
                            <span aria-hidden="true" className="h-0.5 w-[26px] bg-gold-deep" />
                            Featured Work
                        </div>
                        <h2 className="max-w-6xl font-display text-[clamp(1.9rem,3.5vw,2.4rem)] font-bold leading-[1.1] tracking-[-0.01em] text-charcoal">
                            Installations powering homes and towns.
                        </h2>
                    </div>

                    <div className="flex items-center gap-5 self-start md:self-auto">
                        <span className="font-mono text-[0.78rem] tabular-nums tracking-wide text-slate">
                            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                        </span>
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={goPrev}
                                aria-label="Previous slide"
                                className="flex h-12 w-12 items-center justify-center border-[1.5px] border-line-strong text-charcoal transition hover:border-gold hover:text-gold-deep active:scale-95"
                                style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={goNext}
                                aria-label="Next slide"
                                className="flex h-12 w-12 items-center justify-center bg-gold text-charcoal transition hover:bg-gold-deep active:scale-95"
                                style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className="relative select-none"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onKeyDown={onKeyDown}
                    tabIndex={0}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Featured solar installations"
                >
                    {/* Screen-reader announcement */}
                    <p className="sr-only" aria-live="polite">
                        {`Slide ${index + 1} of ${total}: ${PROJECTS[index].title}, ${PROJECTS[index].location}`}
                    </p>

                    <div
                        ref={trackRef}
                        className="overflow-hidden cursor-grab active:cursor-grabbing"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                    >
                        <div
                            className={`flex ${drag.active ? "" : "transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"}`}
                            style={{ transform: `translateX(calc(-${index * 100}% + ${dragPercent}%))` }}
                        >
                            {PROJECTS.map((project, i) => (
                                <div key={i} className="w-full flex-none px-1">
                                    <ProjectSlide project={project} active={i === index} index={i} total={total} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bus-bar style progress: a wired string of nodes, echoing how PV cells connect in series */}
                    <div className="mt-10 flex items-center justify-center">
                        {PROJECTS.map((_, i) => (
                            <div key={i} className="flex items-center last:flex-none">
                                <button
                                    onClick={() => goTo(i, { fromUser: true })}
                                    aria-label={`Go to slide ${i + 1}`}
                                    aria-current={i === index}
                                    className="group relative flex h-6 w-6 shrink-0 items-center justify-center"
                                >
                                    <span
                                        className={`h-2.5 w-2.5 rotate-45 border-[1.5px] transition-all duration-300 ${i === index ? "scale-125 border-gold-deep bg-gold" : "border-line-strong bg-chalk group-hover:border-gold-deep"
                                            }`}
                                    />
                                    {i === index && (
                                        <span
                                            key={autoplayKey}
                                            className="absolute inset-0 rotate-45 border-[1.5px] border-gold-deep/40"
                                            style={{
                                                animation: isPaused || drag.active
                                                    ? "none"
                                                    : `carousel-node-ring ${AUTOPLAY_MS}ms linear forwards`,
                                            }}
                                        />
                                    )}
                                </button>
                                {i < total - 1 && (
                                    <span className="mx-1 h-px w-8 bg-gradient-to-r from-gold-deep/50 via-line-strong to-gold-deep/50 sm:w-14" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes carousel-node-ring {
          from { transform: rotate(45deg) scale(1.9); opacity: 0.9; }
          to { transform: rotate(45deg) scale(1); opacity: 0; }
        }
      `}</style>
        </section>
    );
}