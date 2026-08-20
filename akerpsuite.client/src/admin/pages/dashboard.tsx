// pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/services/adminService";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";


const SNAPSHOT_TITLES = ["Total Employees", "Departments", "Designations", "Roles", "Total Users"];
const PENDING_TITLES = [
    "Pending Leaves",
    "Monthly Leave Requests",
    "Pending Payroll",
    "Pending Payments",
    "Pending Overtime",
    "Low Stock Items",
];

const CHART_BAR_COLOR = "#d97706"; // amber-600, matches the accent used across the app
const CHART_GRID_COLOR = "#e2e8f0"; // slate-200
const CHART_TEXT_COLOR = "#64748b"; // slate-500

function CardBarChart({ title, icon, data }) {
    if (data.length === 0) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <i className={`fa-solid ${icon} text-amber-500 text-sm`} />
                <h3 className="text-slate-700 text-xs sm:text-sm font-sans font-bold uppercase tracking-wider">
                    {title}
                </h3>
            </div>
            <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: CHART_TEXT_COLOR, fontSize: 10 }}
                            axisLine={{ stroke: CHART_GRID_COLOR }}
                            tickLine={false}
                            interval={0}
                            angle={-35}
                            textAnchor="end"
                            height={64}
                        />
                        <YAxis
                            tick={{ fill: CHART_TEXT_COLOR, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            cursor={{ fill: "rgba(217, 119, 6, 0.08)" }}
                            contentStyle={{
                                borderRadius: 10,
                                border: "1px solid #e2e8f0",
                                fontSize: 12,
                                fontFamily: "inherit",
                            }}
                            formatter={(value, _name, item) => [
                                item?.payload?.prefix === "₹" ? `₹${Number(value).toLocaleString("en-IN")}` : value,
                                "",
                            ]}
                        />
                        <Bar dataKey="value" fill={CHART_BAR_COLOR} radius={[6, 6, 0, 0]} maxBarSize={44} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fullName, setFullName] = useState("");

    const role = localStorage.getItem("role") ?? "User";
    const username = localStorage.getItem("username") ?? "";

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
    })();

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

    // Fetch first/last name for the greeting (localStorage only has username)
    useEffect(() => {
        adminService
            .getMyProfile()
            .then((res) => {
                const profile = res.data || res.Data;
                const name =
                    profile?.fullName ||
                    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim();
                setFullName(name || username || "there");
            })
            .catch(() => setFullName(username || "there"));
    }, [username]);

    // Split the flat card list into "chart" groups (rendered as bars) and
    // everything else (still rendered as the original number tiles), so
    // existing cards aren't duplicated between the grid and the charts.
    const { snapshotData, pendingData, tileCards } = useMemo(() => {
        const toChartPoint = (card) => ({
            name: card.cardTitle,
            value: Number(card.cardValue) || 0,
            prefix: card.prefix,
        });

        const snapshot = cards.filter((c) => SNAPSHOT_TITLES.includes(c.cardTitle));
        const pending = cards.filter((c) => PENDING_TITLES.includes(c.cardTitle));
        const chartedTitles = new Set([...SNAPSHOT_TITLES, ...PENDING_TITLES]);

        return {
            snapshotData: snapshot.map(toChartPoint),
            pendingData: pending.map(toChartPoint),
            tileCards: cards.filter((c) => !chartedTitles.has(c.cardTitle)),
        };
    }, [cards]);

    // ─── Loading State ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <i className="fa-solid fa-spinner text-4xl text-amber-500 animate-spin" />
                <p className="text-slate-400 text-sm font-medium font-sans">Loading dashboard...</p>
            </div>
        );
    }

    // ─── Error State ──────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <i className="fa-solid fa-circle-exclamation text-4xl text-rose-500" />
                <p className="text-slate-600 text-sm font-medium font-sans">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-[#0b2836] text-white text-sm font-semibold rounded-lg hover:bg-[#0f3345] transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    // ─── Dashboard ────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 sm:space-y-6">

            {/* ── Header ── */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#0b2836] shadow-sm">
                <div className="pointer-events-none absolute -right-10 -top-16 w-56 h-56 rounded-full bg-amber-300/10 blur-2xl" />
                <div className="pointer-events-none absolute right-16 bottom-0 w-24 h-24 rounded-full bg-amber-300/10 blur-xl" />
                <div className="relative flex items-center gap-3 p-5 sm:p-6">
                    <div className="hidden sm:flex shrink-0 w-11 h-11 rounded-xl bg-white/[0.08] items-center justify-center">
                        <i className="fa-solid fa-sun text-amber-300 text-lg" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] sm:text-xs font-mono font-semibold text-amber-300/80 uppercase tracking-[0.2em]">
                            {greeting} · {role}
                        </p>
                        <h1 className="font-display text-xl sm:text-2xl md:text-[26px] font-bold tracking-tight text-white leading-tight">
                            {fullName}
                        </h1>
                        <p className="text-slate-400 text-[11px] sm:text-xs font-medium mt-0.5">
                            Real-time organization overview — AkerpSuite ERP
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Cards Grid (everything not pulled into a chart below) ── */}
            {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[160px] gap-2 bg-white border border-slate-200 rounded-2xl">
                    <i className="fa-solid fa-table-columns text-3xl text-slate-300" />
                    <p className="text-slate-400 text-sm font-sans">No dashboard cards configured for your role.</p>
                </div>
            ) : (
                <>
                    {tileCards.length > 0 && (
                        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                            {tileCards.map((card) => (
                                <DashboardCard key={card.cardKey} card={card} />
                            ))}
                        </div>
                    )}

                    {/* ── Chart panels ── */}
                    {(snapshotData.length > 0 || pendingData.length > 0) && (
                        <div className="grid gap-3 sm:gap-4 lg:grid-cols-2">
                            <CardBarChart title="Organisation Snapshot" icon="fa-building" data={snapshotData} />
                            <CardBarChart title="Pending & Actionable" icon="fa-triangle-exclamation" data={pendingData} />
                        </div>
                    )}
                </>
            )}

        </div>
    );
}

// ─── Single Card Component ────────────────────────────────────────────────────
function DashboardCard({ card }) {
    const formattedValue = formatValue(card.cardValue, card.prefix);

    return (
        <div className="group relative bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-amber-300/60 hover:-translate-y-0.5 transition-all duration-300">

            {/* Top accent bar */}
            <div
                className={`absolute top-0 left-3 right-3 h-0.5 rounded-full ${card.bgColor} opacity-70`}
            />

            {/* Top row: label + icon */}
            <div className="flex items-start justify-between gap-2">
                <p className="text-slate-500 text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider leading-snug">
                    {card.cardTitle}
                </p>
                <div
                    className={`shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${card.bgColor} flex items-center justify-center border border-white shadow-sm`}
                >
                    <i className={`ti ${card.cardIcon} ${card.iconColor} text-sm sm:text-base`} />
                </div>
            </div>

            {/* Value */}
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1">
                <h2 className="font-display text-xl sm:text-[26px] font-bold text-slate-900 tracking-tight tabular-nums">
                    {formattedValue}
                </h2>
            </div>
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