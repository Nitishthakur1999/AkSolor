import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { publicSiteService } from "../services/publicService";
import Reveal from "./Reveal";

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL;
//const API_ORIGIN = "https://localhost:7272"; 

interface Banner {
    image: string;
}

const AUTOPLAY_MS = 2500;
const DRAG_THRESHOLD = 60;

const CHAMFER: React.CSSProperties = { clipPath: "polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)" };
const CHAMFER_SMALL = "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)";

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function resolveImage(raw?: string) {
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const cleanPath = raw.replace(/^\/+/, "");
    return `${API_ORIGIN}/${cleanPath}`;
}

interface BannerSlideProps {
    banner: Banner;
    active: boolean;
}

function BannerSlide({ banner, active }: BannerSlideProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [cardTilt, setCardTilt] = useState({ rx: 0, ry: 0 });
    const rafRef = useRef<number | null>(null);

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!active) return;
        const el = cardRef.current;
        if (!el) return;
        const clientX = e.clientX;
        const clientY = e.clientY;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
            const rect = el.getBoundingClientRect();
            const px = clamp((clientX - rect.left) / rect.width, 0, 1);
            const py = clamp((clientY - rect.top) / rect.height, 0, 1);
            setCardTilt({
                rx: clamp((0.5 - py) * 9, -6, 6),
                ry: clamp((px - 0.5) * 9, -6, 6),
            });
        });
    }
    function handleMouseLeave() {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        setCardTilt({ rx: 0, ry: 0 });
    }

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative h-full w-full overflow-hidden"
            style={{
                ...CHAMFER,
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                transform: `perspective(1400px) rotateX(${cardTilt.rx}deg) rotateY(${cardTilt.ry}deg)`,
                transition: "transform 300ms ease-out",
                willChange: "transform",
                border: "1px solid color-mix(in srgb, var(--color-gold-deep) 35%, transparent)",
                boxShadow:
                    "inset 0 1px 0 rgba(255,196,90,0.15), 0 40px 70px -25px color-mix(in srgb, var(--color-gold-deep) 45%, black)",
            }}
        >
            {banner.image ? (
                <img
                    src={banner.image}
                    alt="Banner"
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out will-change-transform ${active ? "scale-100" : "scale-110"
                        }`}
                />
            ) : (
                <div className="absolute inset-0 bg-gold-deep/10" />
            )}

            <span
                className="absolute right-0 top-0 border-b-[26px] border-l-[26px] border-b-transparent border-l-gold"
                aria-hidden="true"
                style={{ transform: "translateZ(24px)" }}
            />
        </div>
    );
}

export default function BannerCarousel() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [index, setIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [autoplayKey, setAutoplayKey] = useState(0);
    const [drag, setDrag] = useState({ active: false, startX: 0, deltaX: 0 });
    const [stageWidth, setStageWidth] = useState(1);
    const stageRef = useRef<HTMLDivElement>(null);
    const total = banners.length;

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const res = await publicSiteService.getBanners();
                const raw = Array.isArray(res?.data) ? res.data : [];

                const list: Banner[] = raw.map((b: any) => ({
                    image: resolveImage(b.imagePath ?? b.imageUrl ?? b.image ?? b.photoUrl ?? b.bannerUrl),
                }));

                if (!cancelled) {
                    setBanners(list);
                    setError(null);
                }
            } catch (err: any) {
                if (!cancelled) setError(err?.message || "Failed to load banners");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        function updateWidth() {
            if (stageRef.current) setStageWidth(stageRef.current.offsetWidth || 1);
        }
        updateWidth();
        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, [total]);

    const goTo = useCallback((next: number | ((prev: number) => number), { fromUser = false } = {}) => {
        if (total === 0) return;
        setIndex((prev) => {
            const resolved = typeof next === "function" ? next(prev) : next;
            return ((resolved % total) + total) % total;
        });
        if (fromUser) setAutoplayKey((k) => k + 1);
    }, [total]);

    const goPrev = () => goTo((prev) => prev - 1, { fromUser: true });
    const goNext = () => goTo((prev) => prev + 1, { fromUser: true });

    useEffect(() => {
        if (isPaused || drag.active || total === 0) return;
        const id = setInterval(() => {
            goTo((prev) => prev + 1);
        }, AUTOPLAY_MS);
        return () => clearInterval(id);
    }, [isPaused, drag.active, total, goTo]);

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
        if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
    }

    function onPointerDown(e: React.PointerEvent) {
        setDrag({ active: true, startX: e.clientX, deltaX: 0 });
        stageRef.current?.setPointerCapture?.(e.pointerId);
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

    const dragFraction = drag.active ? drag.deltaX / stageWidth : 0;

    if (loading) {
        return (
            <section className="relative bg-chalk py-16 sm:py-24 md:py-[104px]">
                <div className="container mx-auto px-5 sm:px-7 text-center font-mono text-sm text-slate">
                    Loading banners...
                </div>
            </section>
        );
    }

    if (error || total === 0) {
        return (
            <section className="relative bg-chalk py-16 sm:py-24 md:py-[104px]">
                <div className="container mx-auto px-5 sm:px-7 text-center font-mono text-sm text-slate">
                    {error || "No banners to show right now."}
                </div>
            </section>
        );
    }

    return (
        <section
            className="relative overflow-hidden bg-chalk py-16 sm:py-24 md:py-[104px]"
            style={{
                backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 56px), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 56px)',
                backgroundPosition: '-1px -1px',
            }}
        >
            <div className="container relative z-[1] mx-auto px-5 sm:px-7">
                <Reveal className="mb-8 flex flex-col gap-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-[14px] flex items-center gap-2.5 font-mono text-[0.72rem] font-medium uppercase tracking-[0.14em] text-gold-deep before:inline-block before:h-px before:w-[22px] before:bg-gold-deep sm:mb-[18px] sm:text-[0.74rem]">
                            On Site
                        </p>
                        <h2 className="font-display text-[clamp(1.7rem,4vw,2.6rem)] font-bold leading-[1.1] tracking-[-0.01em] text-charcoal">
                            Installations in the field
                        </h2>
                    </div>

                    <div className="flex items-center justify-between gap-5 sm:justify-end">
                        <span className="font-mono text-[0.78rem] tabular-nums tracking-wide text-slate">
                            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                        </span>
                        <div className="flex items-center gap-3">
                            <button onClick={goPrev} aria-label="Previous slide" className="group relative h-11 w-11 sm:h-12 sm:w-12">
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 transition-transform duration-150 ease-out"
                                    style={{
                                        clipPath: CHAMFER_SMALL,
                                        transform: "translateY(4px)",
                                        background: "color-mix(in srgb, var(--color-gold-deep) 55%, black)",
                                    }}
                                />
                                <span
                                    className="relative flex h-11 w-11 items-center justify-center transition-transform duration-150 ease-out will-change-transform group-hover:-translate-y-[3px] group-active:translate-y-[2px] sm:h-12 sm:w-12"
                                    style={{
                                        clipPath: CHAMFER_SMALL,
                                        background: "color-mix(in srgb, var(--color-gold) 16%, white)",
                                        border: "1.5px solid color-mix(in srgb, var(--color-gold-deep) 45%, transparent)",
                                        color: "color-mix(in srgb, var(--color-gold-deep) 80%, black)",
                                    }}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </span>
                            </button>
                            <button onClick={goNext} aria-label="Next slide" className="group relative h-11 w-11 sm:h-12 sm:w-12">
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0"
                                    style={{
                                        clipPath: CHAMFER_SMALL,
                                        transform: "translateY(4px)",
                                        background: "color-mix(in srgb, var(--color-gold-deep) 65%, black)",
                                    }}
                                />
                                <span
                                    className="relative flex h-11 w-11 items-center justify-center bg-gold-deep text-white transition-transform duration-150 ease-out will-change-transform group-hover:-translate-y-[3px] group-active:translate-y-[2px] sm:h-12 sm:w-12"
                                    style={{ clipPath: CHAMFER_SMALL }}
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </span>
                            </button>
                        </div>
                    </div>
                </Reveal>

                <div
                    className="relative select-none"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onKeyDown={onKeyDown}
                    tabIndex={0}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Homepage banners"
                >
                    <p className="sr-only" aria-live="polite">
                        {`Slide ${index + 1} of ${total}`}
                    </p>

                    <div
                        ref={stageRef}
                        className="relative mx-auto h-[300px] max-w-[860px] cursor-grab touch-pan-y select-none active:cursor-grabbing xs:h-[340px] sm:h-[420px] md:h-[460px] lg:h-[480px]"
                        style={{ perspective: "1900px" }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                    >
                        {banners.map((banner, i) => {
                            let diff = i - index;
                            if (diff > total / 2) diff -= total;
                            if (diff < -total / 2) diff += total;
                            const diffDisplay = diff + dragFraction;
                            const absDiff = Math.abs(diffDisplay);

                            const translateX = diffDisplay * 58;
                            const rotateY = clamp(-diffDisplay * 40, -70, 70);
                            const translateZ = -absDiff * 210;
                            const scale = clamp(1 - absDiff * 0.15, 0.5, 1);
                            const opacity = clamp(1 - absDiff * 0.36, 0, 1);
                            const zIndex = Math.round(100 - absDiff * 10);
                            const isCentered = absDiff < 0.5;

                            return (
                                <div
                                    key={i}
                                    className="absolute inset-0"
                                    style={{
                                        transformStyle: "preserve-3d",
                                        backfaceVisibility: "hidden",
                                        willChange: "transform, opacity",
                                        transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                                        opacity,
                                        zIndex,
                                        pointerEvents: isCentered ? "auto" : "none",
                                        transition: drag.active
                                            ? "none"
                                            : "transform 300ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease",
                                    }}
                                >
                                    <BannerSlide banner={banner} active={isCentered} />
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-10 flex flex-wrap items-center justify-center gap-y-2">
                        {banners.map((_, i) => (
                            <div key={i} className="flex items-center last:flex-none">
                                <button
                                    onClick={() => goTo(i, { fromUser: true })}
                                    aria-label={`Go to slide ${i + 1}`}
                                    aria-current={i === index}
                                    className="group relative flex h-6 w-6 shrink-0 items-center justify-center [perspective:300px]"
                                >
                                    <span
                                        className={`h-2.5 w-2.5 rotate-45 border-[1.5px] shadow-[0_2px_4px_rgba(0,0,0,0.25)] transition-all duration-300 will-change-transform group-hover:[transform:rotate(45deg)_translateZ(6px)] ${i === index ? "scale-125 border-gold-deep bg-gold" : "border-gold-deep/30 bg-transparent group-hover:border-gold-deep"
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
                                    <span className="mx-1 h-px w-8 bg-gradient-to-r from-gold-deep/50 via-gold-deep/15 to-gold-deep/50 sm:w-14" />
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