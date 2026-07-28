import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "@/admin/pages/sidebar";

// Fallback labels/icons for routes that aren't in the DB-driven "pages" list
// (e.g. deep-linked detail views) — keeps the topbar title from going blank.
const ROUTE_FALLBACKS: Record<string, { name: string; icon: string }> = {
    "/sales/leads": { name: "Leads", icon: "fa-chart-line" },
};

function useCurrentPage(pathname: string) {
    return useMemo(() => {
        try {
            const pages = JSON.parse(localStorage.getItem("pages") || "[]");
            const match = pages.find((p: any) => p.pageLink === pathname);
            if (match) return { name: match.pageName, icon: "fa-table-cells-large", group: match.pageType };
        } catch {
            /* no-op */
        }
        // Try a prefix fallback for nested/detail routes (e.g. /sales/leads/42)
        const prefixKey = Object.keys(ROUTE_FALLBACKS).find((k) => pathname.startsWith(k));
        if (prefixKey) return { name: ROUTE_FALLBACKS[prefixKey].name, icon: ROUTE_FALLBACKS[prefixKey].icon, group: null };
        const last = pathname.split("/").filter(Boolean).pop() || "Dashboard";
        return { name: last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), icon: "fa-table-cells-large", group: null };
    }, [pathname]);
}

export default function CmdLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { pathname } = useLocation();
    const page = useCurrentPage(pathname);

    // Auto-close the drawer whenever the route changes (mobile/tablet)
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Lock body scroll while the mobile drawer is open
    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [sidebarOpen]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">

            {/* Mobile/Tablet overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar: fixed drawer on mobile/tablet, static column on desktop */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-[85vw] max-w-72 sm:w-72 transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0 lg:static lg:inset-auto lg:w-72 lg:shrink-0`}
            >
                <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content Area Wrapper */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">

                {/* Top bar — present at every breakpoint, same height as the sidebar's
                    brand row, so there's no dead gap between sidebar and content. */}
                {/* <header className="shrink-0 flex items-center gap-3 h-16 px-3 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 shrink-0 lg:hidden"
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="hidden sm:flex shrink-0 w-9 h-9 rounded-lg bg-[#0b2836]/[0.06] items-center justify-center">
                            <i className={`fa-solid ${page.icon} text-[#0b2836] text-sm`} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-[15px] sm:text-base font-bold text-slate-900 leading-tight truncate">
                                {page.name}
                            </h1>
                            <p className="hidden sm:block text-[11px] text-slate-400 leading-tight truncate">
                                <Link to="/dashboard" className="hover:text-slate-600">Home</Link>
                                {page.group ? <span> · {page.group}</span> : null}
                                <span> · {page.name}</span>
                            </p>
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-3 shrink-0">
                        <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-3 py-1.5">
                            <i className="fa-regular fa-calendar text-slate-400" />
                            {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                    </div>
                </header> */}

                {/* Main Dynamic Workspace Route Target */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-2 max-w-[1600px] mx-auto overflow-x-hidden">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}