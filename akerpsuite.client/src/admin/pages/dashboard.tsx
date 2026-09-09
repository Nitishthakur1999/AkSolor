// pages/Dashboard.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "@/services/adminService";

export default function Dashboard() {
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fullName, setFullName] = useState("");

    // Inline detail-table state
    const [selectedCard, setSelectedCard] = useState(null);
    const [detailRows, setDetailRows] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    // notification state
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const notifRef = useRef(null);

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
                    setError("Failed to load dashboard data.");
                }
            })
            .catch(() => setError("Failed to connect to the server."))
            .finally(() => setLoading(false));
    }, []);

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

    // notification load + 15s poll
    useEffect(() => {
        loadNotifications();

        const interval = setInterval(() => {
            loadNotifications();
        }, 15000);

        const onFocus = () => loadNotifications();
        window.addEventListener("focus", onFocus);

        const onClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifDropdown(false);
            }
        };
        document.addEventListener("mousedown", onClickOutside);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("mousedown", onClickOutside);
        };
    }, []);

    const loadNotifications = async () => {
        try {
            const res = await adminService.getUnreadNotifications();
            if (res.Success || res.success) setNotifications(res.Data || res.data || []);
        } catch (err) {
            console.error("Failed to load notifications:", err);
        }
    };

    const handleNotificationClick = async (notif) => {
        try {
            await adminService.markNotificationRead(notif.notificationId ?? notif.NotificationId);
        } catch (err) {
            console.error("Failed to mark notification read:", err);
        }
        setNotifications((prev) =>
            prev.filter((n) => (n.notificationId ?? n.NotificationId) !== (notif.notificationId ?? notif.NotificationId))
        );
        setShowNotifDropdown(false);

        const isHrRole = ["HR", "Sr. Manager (HR & Social Media)"].includes(role);
        navigate(isHrRole ? "/hr/leave/requests?tab=hr" : "/hr/leave/requests?tab=manager");
    };
    const handleCardClick = async (card) => {
        if (selectedCard?.cardKey === card.cardKey) {
            setSelectedCard(null);
            setDetailRows([]);
            setDetailError(null);
            return;
        }

        setSelectedCard(card);
        setDetailRows([]);
        setDetailError(null);
        setDetailLoading(true);

        try {
            const res = await adminService.getDashboardDetail(card.cardKey);
            if (res.Success || res.success) {
                setDetailRows(res.Data || res.data || []);
            } else {
                setDetailError(res.Message || res.message || "Failed to load details.");
            }
        } catch (err) {
            setDetailError(err?.message || "Failed to load details.");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleCloseDetail = () => {
        setSelectedCard(null);
        setDetailRows([]);
        setDetailError(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
                <i className="fa-solid fa-spinner text-4xl text-amber-500 animate-spin" />
                <p className="text-slate-400 text-sm font-medium font-sans">Loading dashboard...</p>
            </div>
        );
    }

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

    return (
        <div className="space-y-5 sm:space-y-6">

            {/* ── Header (FIXED — overflow-hidden hataya, blobs alag layer mein) ── */}
            <div className="relative rounded-2xl border border-slate-200 bg-[#0b2836] shadow-sm">
                <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-amber-300/10 blur-2xl" />
                    <div className="absolute right-16 bottom-0 w-24 h-24 rounded-full bg-amber-300/10 blur-xl" />
                </div>

                <div className="relative flex items-center justify-between gap-3 p-5 sm:p-6">
                    <div className="flex items-center gap-3 min-w-0">
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

                    {/* Bell notification */}
                    <div className="relative shrink-0" ref={notifRef}>
                        <button
                            onClick={() => setShowNotifDropdown((prev) => !prev)}
                            className="relative w-10 h-10 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] flex items-center justify-center transition-colors"
                        >
                            <i className="fa-solid fa-bell text-amber-300 text-base" />
                            {notifications.length > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {notifications.length > 9 ? "9+" : notifications.length}
                                </span>
                            )}
                        </button>

                        {showNotifDropdown && (
                            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-lg z-50">
                                <div className="px-4 py-3 border-b border-slate-100">
                                    <p className="text-sm font-bold text-slate-800">Notifications</p>
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <i className="fa-solid fa-inbox text-2xl text-slate-300" />
                                        <p className="text-xs text-slate-400 mt-2">No new notifications.</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <button
                                            key={notif.notificationId ?? notif.NotificationId}
                                            onClick={() => handleNotificationClick(notif)}
                                            className="w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-amber-50/60 transition-colors flex items-start gap-2.5"
                                        >
                                            <span className="shrink-0 w-2 h-2 rounded-full bg-sky-500 mt-1.5" />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-700">
                                                    {notif.message ?? notif.Message}
                                                </p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">
                                                    {new Date(notif.createdAt ?? notif.CreatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[160px] gap-2 bg-white border border-slate-200 rounded-2xl">
                    <i className="fa-solid fa-table-columns text-3xl text-slate-300" />
                    <p className="text-slate-400 text-sm font-sans">No dashboard cards configured for your role.</p>
                </div>
            ) : (
                <>
                    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                        {cards.map((card) => (
                            <DashboardCard
                                key={card.cardKey}
                                card={card}
                                onClick={handleCardClick}
                                isActive={selectedCard?.cardKey === card.cardKey}
                            />
                        ))}
                    </div>

                    {selectedCard && (
                        <DetailTable
                            card={selectedCard}
                            rows={detailRows}
                            loading={detailLoading}
                            error={detailError}
                            onClose={handleCloseDetail}
                        />
                    )}
                </>
            )}

        </div>
    );
}

// ─── Single Card Component ────────────────────────────────────────────────────
function DashboardCard({ card, onClick, isActive }) {
    const formattedValue = formatValue(card.cardValue, card.prefix);

    return (
        <div
            onClick={() => onClick(card)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onClick(card);
            }}
            className={`group relative bg-white border rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer active:scale-[0.98] ${isActive ? "border-amber-400 ring-1 ring-amber-300/60" : "border-slate-200 hover:border-amber-300/60"
                }`}
        >
            <div
                className={`absolute top-0 left-3 right-3 h-0.5 rounded-full ${card.bgColor} opacity-70`}
            />
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
            <div className="mt-2 sm:mt-3 flex items-baseline gap-1">
                <h2 className="font-display text-xl sm:text-[26px] font-bold text-slate-900 tracking-tight tabular-nums">
                    {formattedValue}
                </h2>
                <i
                    className={`fa-solid ${isActive ? "fa-chevron-up text-amber-500" : "fa-chevron-down text-slate-300 group-hover:text-amber-500"} text-[10px] transition-colors ml-auto self-center`}
                />
            </div>
        </div>
    );
}

const STATUS_STYLES = {
    present: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    won: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    open: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    published: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    absent: "bg-rose-50 text-rose-700 ring-rose-600/20",
    rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
    cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
    lost: "bg-rose-50 text-rose-700 ring-rose-600/20",
    fail: "bg-rose-50 text-rose-700 ring-rose-600/20",
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    draft: "bg-amber-50 text-amber-700 ring-amber-600/20",
    hold: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

function StatusPill({ value }) {
    const key = String(value).toLowerCase();
    const style = STATUS_STYLES[key] || "bg-slate-100 text-slate-600 ring-slate-500/20";
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style}`}>
            {value}
        </span>
    );
}

function initialsOf(name) {
    return String(name)
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase();
}

const AVATAR_COLORS = [
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
    "bg-emerald-100 text-emerald-700",
    "bg-indigo-100 text-indigo-700",
];

function avatarColor(name) {
    const sum = String(name)
        .split("")
        .reduce((a, c) => a + c.charCodeAt(0), 0);
    return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function formatCellValue(col, value) {
    if (value === null || value === undefined || value === "") return "-";

    const colLower = col.toLowerCase();

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}t\d{2}:\d{2}:\d{2}/i.test(value)) {
        const d = new Date(value);
        const hasTime = !(d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0);
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
            (hasTime ? ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "");
    }

    if (/amount|total|value/i.test(col) && !isNaN(Number(value))) {
        return `₹${Number(value).toLocaleString("en-IN")}`;
    }

    if (colLower === "status") {
        return <StatusPill value={value} />;
    }
    if (colLower === "active" || colLower === "is_active") {
        const isActive = value === 1 || value === "1" || value === true;
        return <StatusPill value={isActive ? "Active" : "Inactive"} />;
    }

    return String(value);
}

function DetailTable({ card, rows, loading, error, onClose }) {
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    const nameCol = columns.find((c) => /employee|name|lead|candidate|supplier/i.test(c));
    const today = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                        {card.cardTitle}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">{today} · {rows.length} record{rows.length !== 1 ? "s" : ""}</p>
                </div>
                <button
                    onClick={onClose}
                    className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <i className="fa-solid fa-xmark" /> Close
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-14 gap-2">
                    <i className="fa-solid fa-spinner text-2xl text-amber-500 animate-spin" />
                    <p className="text-slate-400 text-sm">Loading details...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-14 gap-2">
                    <i className="fa-solid fa-circle-exclamation text-2xl text-rose-500" />
                    <p className="text-slate-500 text-sm">{error}</p>
                </div>
            ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-2">
                    <i className="fa-solid fa-inbox text-2xl text-slate-300" />
                    <p className="text-slate-400 text-sm">No records found.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200">
                                {columns.map((col) => (
                                    <th
                                        key={col}
                                        className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 bg-slate-50/95 backdrop-blur"
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col} className="px-6 py-3.5 text-slate-700 font-medium">
                                            {col === nameCol && row[col] ? (
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${avatarColor(row[col])}`}>
                                                        {initialsOf(row[col])}
                                                    </span>
                                                    <span>{row[col]}</span>
                                                </div>
                                            ) : (
                                                formatCellValue(col, row[col])
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function formatValue(value, prefix) {
    if (value === null || value === undefined) return "—";

    const num = Number(value);

    if (prefix === "₹") {
        if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(1)}Cr`;
        if (num >= 100_000) return `₹${(num / 100_000).toFixed(1)}L`;
        if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
        return `₹${num.toLocaleString("en-IN")}`;
    }

    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString("en-IN");
}