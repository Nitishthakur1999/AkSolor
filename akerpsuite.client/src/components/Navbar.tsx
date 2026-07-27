import { useRef, useState, useEffect, useCallback } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, ArrowUpRight } from "lucide-react";
import logo from "../assets/logo.png";
import { servicesDropdown, companyDropdown } from "../data/siteData";
import ThemeToggle from "./ThemeToggle";

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
  const closeTimers = useRef({});

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
    `group relative flex items-center gap-1.5 px-4 py-2.5 text-[0.88rem] font-bold uppercase tracking-[0.04em] transition-colors duration-200 ${
      isActive ? "text-charcoal" : "text-charcoal-soft hover:text-charcoal"
    }`;

  const underlineCls = (isActive) =>
    `pointer-events-none absolute bottom-1 left-4 right-4 h-[2px] origin-left bg-gold transition-transform duration-300 ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`;

  const dropdownCls =
    "absolute left-0 top-[calc(100%+16px)] z-50 min-w-[300px] rounded-2xl border border-line-strong bg-paper p-2 shadow-[0_20px_45px_rgba(0,0,0,0.35)] transition-[opacity,transform] duration-200";

  const megaGroups = [
    { key: "services", label: "Services", items: servicesDropdown },
    { key: "company", label: "Company", items: companyDropdown },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-[1000] w-full border-b border-line-strong bg-chalk">

      <nav className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-3"
          aria-label="AKS Solar — Home"
        >
          <img
            src={logo}
            alt="AKS Solar logo"
            className="block h-12 w-auto sm:h-12"
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

          {megaGroups.map((group) => (
            <li
              className="relative"
              key={group.key}
              {...dropdownProps(group.key)}
            >
              <button
                className="group relative flex items-center gap-1.5 px-4 py-2.5 text-[0.88rem] font-bold uppercase tracking-[0.04em] text-charcoal-soft transition-colors duration-200 hover:text-charcoal"
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
                className={`${dropdownCls} ${openDropdown === group.key ? "visible scale-100 opacity-100" : "invisible scale-95 opacity-0"}`}
              >
                {group.items.map((item) => (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="group/item block rounded-xl border-l-2 border-transparent px-4 py-3 transition-[border-color,background-color] duration-200 hover:border-gold hover:bg-gold/[0.06]"
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

        <div className="flex items-center gap-2.5">
          <ThemeToggle className="hidden sm:inline-flex" />

          <Link
            to="/contact"
            className="hidden md:inline-flex items-center gap-2 rounded-full bg-gold-deep px-5 py-2.5 font-sans text-[0.84rem] font-extrabold uppercase tracking-wide text-chalk shadow-[0_8px_22px_rgba(224,66,31,0.35)] transition-transform duration-200 hover:-translate-y-0.5 active:scale-95"
          >
            Get Quote <ArrowUpRight size={15} strokeWidth={2.5} />
          </Link>

          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMobileOpen((v) => !v);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line-strong bg-paper text-charcoal transition-colors duration-200 hover:border-gold hover:text-gold md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      <div
        className={`md:hidden fixed inset-x-0 top-[76px] z-[999] mx-auto grid w-full border-t border-line-strong bg-chalk transition-[grid-template-rows] duration-300 ease-out ${
          mobileOpen ? "grid-rows-[1fr] border-t" : "grid-rows-[0fr] border-t-0"
        }`}
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
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gold-deep to-gold px-5 py-4 font-sans text-[0.92rem] font-extrabold uppercase tracking-wide text-chalk shadow-[0_8px_22px_rgba(224,66,31,0.3)]"
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