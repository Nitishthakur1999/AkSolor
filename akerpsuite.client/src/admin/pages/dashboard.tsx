// pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

export default function Dashboard() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const role = localStorage.getItem("role") ?? "User";
    const username = localStorage.getItem("username") ?? "";

    useEffect(() => {
        adminService
            .getDashboard()
            .then((res) => {
                if (res.success) {
                    setCards(res.data);
                } else {
                    setError("Dashboard data load nahi ho saka.");
                }
            })
            .catch(() => setError("Server se connection fail hua."))
            .finally(() => setLoading(false));
    }, []);

    // ─── Loading State ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <i className="ti ti-loader-2 text-4xl text-indigo-500 animate-spin" />
                <p className="text-slate-400 text-sm font-medium">Loading dashboard...</p>
            </div>
        );
    }

    // ─── Error State ──────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <i className="ti ti-alert-circle text-4xl text-rose-500" />
                <p className="text-slate-600 text-sm font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    // ─── Dashboard ────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">

            {/* ── Header ── */}
            <div className="relative p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-transparent to-transparent pointer-events-none" />
                <div className="relative space-y-1">
                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest">
                        {role} Dashboard
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                        Welcome back, <span className="text-blue-500">{username}</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        Real-time organization overview — AkerpSuite ERP
                    </p>
                </div>
            </div>

            {/* ── Cards Grid ── */}
            {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] gap-2 bg-white border border-slate-200 rounded-2xl">
                    <i className="ti ti-layout-dashboard text-3xl text-slate-300" />
                    <p className="text-slate-400 text-sm">No dashboard cards configured for your role.</p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {cards.map((card) => (
                        <DashboardCard key={card.cardKey} card={card} />
                    ))}
                </div>
            )}

        </div>
    );
}

// ─── Single Card Component ────────────────────────────────────────────────────
function DashboardCard({ card }) {
    const formattedValue = formatValue(card.cardValue, card.prefix);

    return (
        <div className="group relative bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all duration-300 hover:-translate-y-0.5">

            {/* Top row: label + icon */}
            <div className="flex items-start justify-between gap-2">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider leading-snug">
                    {card.cardTitle}
                </p>
                <div
                    className={`shrink-0 w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center border border-white shadow-sm`}
                >
                    <i className={`ti ${card.cardIcon} ${card.iconColor} text-xl`} />
                </div>
            </div>

            {/* Value */}
            <div className="mt-5 flex items-baseline gap-1">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight tabular-nums">
                    {formattedValue}
                </h2>
            </div>

            {/* Subtle bottom accent line on hover */}
            <div
                className={`absolute bottom-0 left-6 right-6 h-0.5 rounded-full ${card.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            />
        </div>
    );
}

// ─── Value Formatter ──────────────────────────────────────────────────────────
function formatValue(value, prefix) {
    if (value === null || value === undefined) return "—";

    const num = Number(value);

    if (prefix === "₹") {
        // Currency formatting
        if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
        if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
        if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
        return `₹${num.toLocaleString("en-IN")}`;
    }

    // Plain number
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString("en-IN");
}