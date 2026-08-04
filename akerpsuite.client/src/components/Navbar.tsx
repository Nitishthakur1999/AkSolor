import { useRef, useState, useEffect, useCallback, type CSSProperties } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";
import logo from "../assets/logo.png";
import { companyDropdown, messagesDropdown } from "../data/siteData";
import ThemeToggle from "./ThemeToggle";

const MAX_TILT_DEG = 4;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export default function Navbar() {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileGroup, setMobileGroup] = useState(null);
    const location = useLocation();

    const [isFinePointer] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(pointer: fine)").matches,
    );
    const [prefersReducedMotion] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    const closeTimers = useRef({});

    // --- 3D tilt tracking: the navbar reads as a floating glass panel that
    // subtly leans toward the cursor, driven by pointer position over the header.
    const navRef = useRef(null);
    const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

    useEffect(() => {
        if (!isFinePointer || prefersReducedMotion) return;

        function handlePointerMove(e) {
            const el = navRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const px = clamp((e.clientX - rect.left) / rect.width, 0, 1);
            const py = clamp((e.clientY - rect.top) / rect.height, 0, 1);
            const ry = clamp((px - 0.5) * 2 * MAX_TILT_DEG, -MAX_TILT_DEG, MAX_TILT_DEG);
            const rx = clamp((0.5 - py) * 2 * MAX_TILT_DEG, -MAX_TILT_DEG, MAX_TILT_DEG);
            setTilt({ rx, ry });
        }

        function resetTilt() {
            setTilt({ rx: 0, ry: 0 });
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerleave", resetTilt);
        window.addEventListener("blur", resetTilt);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerleave", resetTilt);
            window.removeEventListener("blur", resetTilt);
        };
    }, [isFinePointer, prefersReducedMotion]);

    // Close menus on route change
    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        setOpenDropdown(null);
        setMobileOpen(false);
        setMobileGroup(null);
    }, [location.pathname, location.hash]);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Lock body scroll while mobile menu is open
    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    // Keyboard and click-outside logic for desktop dropdowns
    useEffect(() => {
        function closeAll() {
            setOpenDropdown(null);
        }
        document.addEventListener("click", closeAll);
        function onEscape(e) {
            if (e.key === "Escape") {
                closeAll();
                setMobileOpen(false);
            }
        }
        document.addEventListener("keydown", onEscape);
        return () => {
            document.removeEventListener("click", closeAll);
            document.removeEventListener("keydown", onEscape);
        };
    }, []);

    const openNow = useCallback((key) => {
        clearTimeout(closeTimers.current[key]);
        setOpenDropdown(key);
    }, []);

    const closeSoon = useCallback((key) => {
        closeTimers.current[key] = setTimeout(() => {
            setOpenDropdown((cur) => (cur === key ? null : cur));
        }, 180);
    }, []);

    function dropdownProps(key) {
        if (isFinePointer) {
            return {
                onMouseEnter: () => openNow(key),
                onMouseLeave: () => closeSoon(key),
                onFocus: () => openNow(key),
            };
        }
        return {
            onClick: (e) => {
                e.stopPropagation();
                setOpenDropdown((cur) => (cur === key ? null : key));
            },
        };
    }

    const navLinkCls = ({ isActive }) =>
        `group relative flex items-center gap-1.5 px-4 py-2.5 text-[0.88rem] font-bold uppercase tracking-[0.04em] transition-[color,transform] duration-200 will-change-transform hover:[transform:translateY(-1px)_translateZ(10px)] ${isActive ? "text-charcoal" : "text-charcoal-soft hover:text-charcoal"
        }`;

    const underlineCls = (isActive) =>
        `pointer-events-none absolute bottom-1 left-4 right-4 h-[2px] origin-left bg-gold shadow-[0_1px_3px_rgba(224,66,31,0.5)] transition-transform duration-300 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`;

    const dropdownCls =
        "absolute left-0 top-[calc(100%+16px)] z-50 min-w-[300px] rounded-2xl border border-line-strong bg-paper p-2 shadow-[0_25px_50px_-10px_rgba(0,0,0,0.45)]";

    function dropdownStyle(isOpen) {
        return {
            transformOrigin: "top center",
            transform: isOpen
                ? "perspective(1000px) rotateX(0deg) translateY(0px) translateZ(0px) scale(1)"
                : "perspective(1000px) rotateX(-14deg) translateY(-10px) translateZ(-40px) scale(0.96)",
            opacity: isOpen ? 1 : 0,
            pointerEvents: (isOpen ? "auto" : "none") as CSSProperties["pointerEvents"],
            transition:
                "transform 280ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease",
        } as CSSProperties;
    }

    const megaGroups = [
        { key: "company", label: "Company", items: companyDropdown },
        { key: "messages", label: "Messages", items: messagesDropdown },
    ];

    return (
        <header
            className="fixed inset-x-0 top-0 z-[1000] w-full border-b border-line-strong bg-chalk"
            style={{ perspective: "1600px" }}
        >
            <nav
                ref={navRef}
                style={{
                    transformStyle: "preserve-3d",
                    transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
                    transition: "transform 250ms ease-out",
                    boxShadow: "0 22px 45px -28px rgba(0,0,0,0.35)",
                }}
                className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3 px-5 py-4 sm:px-8"
            >
                <Link
                    to="/"
                    className="group flex shrink-0 items-center gap-3 [perspective:700px]"
                    aria-label="AKS Solar — Home"
                >
                    <img
                        src={logo}
                        alt="AKS Solar logo"
                        className="block h-12 w-auto transition-transform duration-300 ease-out will-change-transform group-hover:[transform:rotateY(16deg)_scale(1.06)] sm:h-12"
                    />
                    <span className="hidden font-display text-[0.98rem] font-extrabold uppercase leading-tight tracking-tight text-charcoal sm:block">
                        AKS Solar
                        <span className="block -mt-0.5 font-mono text-[0.6rem] font-medium normal-case tracking-[0.16em] text-gold">
                            Systems Pvt. Ltd.
                        </span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <ul className="hidden md:flex items-center gap-1 list-none">
                    <li className="relative">
                        <NavLink to="/" end className={navLinkCls}>
                            {({ isActive }) => (
                                <>
                                    Home
                                    <span className={underlineCls(isActive)} />
                                </>
                            )}
                        </NavLink>
                    </li>

                    <li className="relative">
                        <NavLink to="/services" className={navLinkCls}>
                            {({ isActive }) => (
                                <>
                                    Services
                                    <span className={underlineCls(isActive)} />
                                </>
                            )}
                        </NavLink>
                    </li>

                    {megaGroups.map((group) => (
                        <li
                            className="relative"
                            key={group.key}
                            style={{ transformStyle: "preserve-3d" }}
                            {...dropdownProps(group.key)}
                        >
                            <button
                                className="group relative flex items-center gap-1.5 px-4 py-2.5 text-[0.88rem] font-bold uppercase tracking-[0.04em] text-charcoal-soft transition-[color,transform] duration-200 will-change-transform hover:text-charcoal hover:[transform:translateY(-1px)_translateZ(10px)]"
                                aria-expanded={openDropdown === group.key}
                            >
                                {group.label}
                                <ChevronDown
                                    size={14}
                                    strokeWidth={2.5}
                                    className={`transition-transform duration-200 ${openDropdown === group.key ? "rotate-180 text-gold" : ""}`}
                                />
                                <span className={underlineCls(openDropdown === group.key)} />
                            </button>
                            <div
                                style={dropdownStyle(openDropdown === group.key)}
                                className={dropdownCls}
                            >
                                {group.items.map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.href}
                                        className="group/item block rounded-xl border-l-2 border-transparent px-4 py-3 transition-[border-color,background-color,transform] duration-200 hover:border-gold hover:bg-gold/[0.06] hover:[transform:translateZ(14px)]"
                                    >
                                        <div className="font-semibold text-[0.9rem] text-charcoal group-hover/item:text-gold">
                                            {item.label}
                                        </div>
                                        <div className="text-[0.78rem] text-charcoal-soft">
                                            {item.desc}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </li>
                    ))}

                    <li className="relative">
                        <NavLink to="/gallery" className={navLinkCls}>
                            {({ isActive }) => (
                                <>
                                    Projects
                                    <span className={underlineCls(isActive)} />
                                </>
                            )}
                        </NavLink>
                    </li>
                    <li className="relative">
                        <NavLink to="/careers" className={navLinkCls}>
                            {({ isActive }) => (
                                <>
                                    Careers
                                    <span className={underlineCls(isActive)} />
                                </>
                            )}
                        </NavLink>
                    </li>
                    <li className="relative">
                        <NavLink to="/contact" className={navLinkCls}>
                            {({ isActive }) => (
                                <>
                                    Contact
                                    <span className={underlineCls(isActive)} />
                                </>
                            )}
                  
                        </NavLink>
                    </li>
                </ul>

                <div className="flex items-center gap-2.5" style={{ transformStyle: "preserve-3d" }}>
                    <ThemeToggle className="hidden sm:inline-flex" />

                    {/* Extruded 3D CTA button: a shaded "slab" sits behind the face and is
              revealed more on hover (lift) and less on press (push-down). */}
                    <Link
                        to="/contact"
                        className="group relative hidden md:inline-flex [perspective:600px]"
                    >
                        <span
                            aria-hidden="true"
                            className="absolute inset-0 rounded-full transition-transform duration-150 ease-out"
                            style={{
                                background:
                                    "color-mix(in srgb, var(--color-gold-deep) 55%, black)",
                                transform: "translateY(5px)",
                            }}
                        />
                        <span
                            className="relative inline-flex items-center gap-2 rounded-full bg-gold-deep px-5 py-2.5 font-sans text-[0.84rem] font-extrabold uppercase tracking-wide text-chalk shadow-[0_8px_22px_rgba(224,66,31,0.35)] transition-transform duration-150 ease-out will-change-transform group-hover:-translate-y-[3px] group-active:translate-y-[2px]"
                        >
                            Get Quote <ArrowUpRight size={15} strokeWidth={2.5} />
                        </span>
                    </Link>

                    <button
                        type="button"
                        aria-label={mobileOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileOpen}
                        onClick={(e) => {
                            e.stopPropagation();
                            setMobileOpen((v) => !v);
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong bg-paper text-charcoal transition-[color,border-color,transform] duration-200 will-change-transform hover:border-gold hover:text-gold active:scale-90 md:hidden"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu panel — flips open in 3D like a hinged flap */}
            <div
                className={`md:hidden fixed inset-x-0 top-[76px] z-[999] mx-auto grid w-full border-t border-line-strong bg-chalk transition-[grid-template-rows] duration-300 ease-out ${mobileOpen ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr] border-t-0"
                    }`}
                style={{
                    transformOrigin: "top center",
                    transform: mobileOpen
                        ? "perspective(1200px) rotateX(0deg)"
                        : "perspective(1200px) rotateX(-8deg)",
                    transition: "transform 300ms ease-out",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="overflow-hidden">
                    <div className="max-h-[calc(100vh-90px)] overflow-y-auto p-4">
                        <div className="mb-2 flex items-center justify-between rounded-2xl border border-line-strong bg-paper px-4 py-3.5 sm:hidden">
                            <span className="font-mono text-[0.72rem] font-bold uppercase tracking-[0.1em] text-charcoal-soft">
                                Appearance
                            </span>
                            <ThemeToggle compact />
                        </div>

                        <MobileLink
                            to="/"
                            label="Home"
                            onNavigate={() => setMobileOpen(false)}
                        />

                        <MobileLink
                            to="/services"
                            label="Services"
                            onNavigate={() => setMobileOpen(false)}
                        />

                        {megaGroups.map((group) => (
                            <div key={group.key} className="rounded-2xl">
                                <button
                                    onClick={() =>
                                        setMobileGroup((cur) =>
                                            cur === group.key ? null : group.key,
                                        )
                                    }
                                    className="flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-[0.98rem] font-bold uppercase tracking-wide text-charcoal hover:text-gold"
                                >
                                    {group.label}
                                    <ChevronDown
                                        size={16}
                                        className={`transition-transform duration-200 ${mobileGroup === group.key ? "rotate-180 text-gold" : ""}`}
                                    />
                                </button>
                                {mobileGroup === group.key && (
                                    <div className="pb-2 pl-3">
                                        {group.items.map((item) => (
                                            <Link
                                                key={item.label}
                                                to={item.href}
                                                onClick={() => setMobileOpen(false)}
                                                className="block rounded-xl border-l-2 border-transparent px-4 py-2.5 text-[0.9rem] text-charcoal-soft hover:border-gold hover:text-charcoal"
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        <MobileLink
                            to="/gallery"
                            label="Projects"
                            onNavigate={() => setMobileOpen(false)}
                        />
                        <MobileLink
                            to="/careers"
                            label="Careers"
                            onNavigate={() => setMobileOpen(false)}
                        />
                        <MobileLink
                            to="/contact"
                            label="Contact"
                            onNavigate={() => setMobileOpen(false)}
                        />

                        <Link
                            to="/contact"
                            onClick={() => setMobileOpen(false)}
                            className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-deep to-gold px-5 py-4 font-sans text-[0.92rem] font-extrabold uppercase tracking-wide text-chalk shadow-[0_8px_22px_rgba(224,66,31,0.3)] transition-transform duration-150 active:scale-95"
                        >
                            Get Free Quote <ArrowUpRight size={16} strokeWidth={2.5} />
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}

function MobileLink({ to, label, onNavigate }) {
    return (
        <NavLink
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
                `block rounded-2xl px-4 py-4 text-[0.98rem] font-bold uppercase tracking-wide transition-colors duration-200 ${isActive ? "text-gold" : "text-charcoal hover:text-gold"}`
            }
        >
            {label}
        </NavLink>
    );
}
