import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "@/admin/pages/sidebar";

const ROUTE_FALLBACKS: Record<string, { name: string; icon: string }> = {
    "/sales/leads": { name: "Leads", icon: "fa-chart-line" },
};

function useCurrentPage(pathname: string) {
    return useMemo(() => {
        try {
            const pages = JSON.parse(localStorage.getItem("pages") || "[]");
            const match = pages.find((p: any) => p.pageLink === pathname);
            if (match) return { name: match.pageName, icon: "fa-table-cells-large", group: match.pageType };
        } catch { /* no-op */ }
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

    useEffect(() => { setSidebarOpen(false); }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = sidebarOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [sidebarOpen]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">

            {/* ── Mobile overlay ── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ── Sidebar ── */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-40
                    w-[85vw] max-w-72 sm:w-72
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0 lg:static lg:inset-auto lg:w-72 lg:shrink-0
                `}
            >
                <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>

            {/* ── Main area ── */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">

                {/* ── Top bar (mobile/tablet only — hidden on desktop lg+) ── */}
                <header className="shrink-0 flex items-center gap-3 h-14 px-4 sm:px-5
                                   bg-white border-b border-slate-200 lg:hidden">

                    {/* Hamburger — THIS was missing because the whole header was commented out */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 shrink-0"
                        aria-label="Open menu"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Page title */}
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                            <i className={`fa-solid ${page.icon} text-slate-600 text-xs`} />
                        </div>
                        <h1 className="text-sm font-bold text-slate-900 truncate">
                            {page.name}
                        </h1>
                    </div>

                    {/* Date — right side */}
                    <span className="ml-auto hidden sm:inline-flex items-center gap-1.5
                                     text-[11px] font-semibold text-slate-500
                                     bg-slate-100 rounded-full px-3 py-1">
                        <i className="fa-regular fa-calendar text-slate-400" />
                        {new Date().toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric"
                        })}
                    </span>
                </header>

                {/* ── Page content ── */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-2 max-w-[1600px] mx-auto overflow-x-hidden">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}