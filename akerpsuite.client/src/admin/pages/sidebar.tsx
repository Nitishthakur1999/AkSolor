import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { adminService, getDocumentUrl } from "@/services/adminService";
import logo from "@/assets/logo.png";
import { createPortal } from "react-dom";

const HIDDEN_PAGE_NAMES = [
    "attendance report",
    "leave report",
    "payroll report",
    "add employee",
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const allPages = JSON.parse(localStorage.getItem("pages") || "[]");
    const pages = allPages.filter(
        (page) =>
            !HIDDEN_PAGE_NAMES.includes((page.pageName || "").trim().toLowerCase()),
    );
    const username = localStorage.getItem("username") || "User";
    const role = localStorage.getItem("role") || "";

    const GROUP_ORDER = [
        "General",
        "Admin",
        "HR",
        "Payroll",
        "Recruitment",
        "Sales",
        "Inventory",
        "Reports",
        "Public",
        "Self",
    ];

    const groupedPages = pages.reduce((groups, page) => {
        const type = page.pageType || "General";
        if (!groups[type]) groups[type] = [];
        groups[type].push(page);
        return groups;
    }, {});

    // ── Sidebar-only override: Sales module should show just "Leads" ──
    if (groupedPages["Sales"]) {
        groupedPages["Sales"] = groupedPages["Sales"].filter(
            (page) => page.pageLink === "/sales/leads",
        );
        if (groupedPages["Sales"].length === 0) delete groupedPages["Sales"];
    }

    // ── Sidebar-only override: CMD accounts ──
    if (role === "CMD" && groupedPages["Self"]) {
        delete groupedPages["Self"];
    }

    const activeGroups = GROUP_ORDER.filter((g) => groupedPages[g]);

    Object.keys(groupedPages).forEach((g) => {
        if (!activeGroups.includes(g)) activeGroups.push(g);
    });

    const [openGroups, setOpenGroups] = useState<Record<string, any>>(() => {
        const initial: Record<string, any> = {};
        for (const g of activeGroups) {
            if (groupedPages[g]?.some((p) => p.pageLink === pathname))
                initial[g] = true;
        }
        return initial;
    });
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // ── Reminders state ──
    const [reminders, setReminders] = useState([]);
    const [showReminders, setShowReminders] = useState(false);
    const [remindersLoading, setRemindersLoading] = useState(false);
    const reminderRef = useRef(null);

    // Profile photo state
    const [myPhotoPath, setMyPhotoPath] = useState<string | null>(null);

    useEffect(() => {
        const allowedRoles = ["Admin", "HR"];
        if (!allowedRoles.includes(role)) return;

        fetchReminders();
        const interval = setInterval(fetchReminders, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        adminService
            .getMyProfile()
            .then((res) => {
                if (res?.success && res?.data) {
                    setMyPhotoPath(res.data.photoPath || null);
                }
            })
            .catch(() => {
                // Silent fail — initials avatar stays as fallback
            });
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (reminderRef.current && !reminderRef.current.contains(e.target)) {
                setShowReminders(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchReminders = async () => {
        try {
            setRemindersLoading(true);
            const res = await adminService.getPendingReminders();
            setReminders(res?.Data || res?.data || []);
        } catch (err) {
            if (err?.message?.includes("403")) {
                setReminders([]);
            } else {
                console.error("Failed to fetch reminders:", err);
            }
        } finally {
            setRemindersLoading(false);
        }
    };

    const handleMarkDone = async (reminderId) => {
        try {
            await adminService.markReminderDone(reminderId);
            setReminders((prev) => prev.filter((r) => r.reminderId !== reminderId));
        } catch (err) {
            console.error("Failed to mark reminder done:", err);
        }
    };

    const toggleGroup = (groupName) => {
        setOpenGroups((prev) => ({
            ...prev,
            [groupName]: !prev[groupName],
        }));
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        localStorage.removeItem("pages");
        navigate("/");
    };

    const initials = username
        .split(".")
        .map((w) => w[0]?.toUpperCase())
        .join("")
        .slice(0, 2);

    return (
        <>
            <aside className="h-full w-full flex flex-col bg-gradient-to-b from-[#0b2836] via-[#0b2836] to-[#081e29] text-white font-sans border-r border-white/5 select-none">

                {/* ── Brand Header ── */}
                <div className="relative px-4 py-4 sm:px-5 sm:py-5 border-b border-white/[0.08] flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-white ring-1 ring-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-inner">
                            <img
                                src={logo}
                                alt="AkerpSuite logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="font-display text-base font-bold text-white tracking-wide truncate leading-tight">
                                AKS SOLAR
                            </p>
                            <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">
                                Enterprise Suite
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* ── Mobile close button ── */}
                        <button
                            onClick={onNavigate}
                            aria-label="Close menu"
                            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <i className="fa-solid fa-xmark text-sm" />
                        </button>

                        {/* ── Notification Bell ── */}
                        <div className="relative" ref={reminderRef}>
                            <button
                                onClick={() => setShowReminders((prev) => !prev)}
                                aria-label="Reminders"
                                className={`relative p-2 rounded-xl transition-all duration-200 ${showReminders
                                        ? "bg-white/15 text-white ring-1 ring-white/20"
                                        : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
                                    }`}
                            >
                                <i className="fa-solid fa-bell text-sm" />
                                {reminders.length > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#0b2836] shadow-sm animate-pulse">
                                        {reminders.length > 9 ? "9+" : reminders.length}
                                    </span>
                                )}
                            </button>

                            {/* ── Reminders Dropdown ── */}
                            {showReminders && (
                                <div className="fixed top-16 left-4 right-4 sm:left-auto sm:right-auto sm:w-80 max-h-96 overflow-y-auto rounded-2xl bg-[#0f3345] border border-white/15 shadow-2xl z-[9999] backdrop-blur-md">
                                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0f3345]/95 backdrop-blur rounded-t-2xl">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                                            <i className="fa-solid fa-bell text-amber-400 text-xs" />
                                            Reminders
                                        </span>
                                        {remindersLoading && (
                                            <span className="text-[11px] text-slate-400">Loading…</span>
                                        )}
                                    </div>

                                    {reminders.length === 0 && !remindersLoading && (
                                        <div className="px-4 py-8 text-center">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
                                                <i className="fa-solid fa-check text-lg" />
                                            </div>
                                            <p className="text-xs font-semibold text-white">All caught up</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">No pending reminders right now</p>
                                        </div>
                                    )}

                                    {reminders.map((r) => (
                                        <div
                                            key={r.reminderId || r.ReminderId}
                                            className="px-4 py-3 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.04] transition-colors flex gap-2.5"
                                        >
                                            <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-slate-100 leading-snug break-words">
                                                    {r.message || r.Message || "(no message)"}
                                                </p>
                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    <span className="text-[10px] text-slate-400">
                                                        {r.reminderDate || r.ReminderDate
                                                            ? new Date(r.reminderDate || r.ReminderDate).toLocaleString()
                                                            : ""}
                                                    </span>
                                                    <button
                                                        onClick={() => handleMarkDone(r.reminderId || r.ReminderId)}
                                                        className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 shrink-0"
                                                    >
                                                        <i className="fa-solid fa-check text-[10px]" />
                                                        Mark done
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Navigation Links ── */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {activeGroups.map((groupName) => {
                        const items = groupedPages[groupName];
                        const icon = getGroupIcon(groupName);

                        // Single page link
                        if (items.length === 1) {
                            const page = items[0];
                            const active = pathname === page.pageLink;
                            return (
                                <Link
                                    key={groupName}
                                    to={page.pageLink}
                                    onClick={onNavigate}
                                    className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${active
                                            ? "bg-white/[0.12] text-white shadow-sm ring-1 ring-white/10"
                                            : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                                        }`}
                                >
                                    {active && (
                                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber-400" />
                                    )}
                                    <div
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${active ? "bg-amber-400/20 text-amber-400" : "text-slate-400 group-hover:text-white"
                                            }`}
                                    >
                                        <i className={`fa-solid ${icon} text-xs`} />
                                    </div>
                                    <span className="truncate">{page.pageName}</span>
                                </Link>
                            );
                        }

                        // Accordion group
                        const isOpen = !!openGroups[groupName];
                        const hasActiveChild = items.some((p) => p.pageLink === pathname);

                        return (
                            <div key={groupName} className="space-y-0.5">
                                <button
                                    onClick={() => toggleGroup(groupName)}
                                    className={`group relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${hasActiveChild && !isOpen
                                            ? "bg-white/[0.07] text-white"
                                            : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                                        }`}
                                >
                                    {hasActiveChild && (
                                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-amber-400" />
                                    )}
                                    <div className="flex items-center gap-3 truncate">
                                        <div
                                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${hasActiveChild ? "bg-amber-400/20 text-amber-400" : "text-slate-400 group-hover:text-white"
                                                }`}
                                        >
                                            <i className={`fa-solid ${icon} text-xs`} />
                                        </div>
                                        <span className="truncate">{groupName}</span>
                                    </div>
                                    <i
                                        className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-white" : "rotate-0"
                                            }`}
                                    />
                                </button>

                                {/* Sub Menu Links */}
                                <div
                                    className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                        }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="ml-7 pl-3 my-1 border-l border-white/10 flex flex-col gap-1">
                                            {items.map((page) => {
                                                const active = pathname === page.pageLink;
                                                return (
                                                    <Link
                                                        key={page.pageId}
                                                        to={page.pageLink}
                                                        onClick={onNavigate}
                                                        className={`group relative py-1.5 px-3 rounded-lg text-xs font-normal transition-all duration-150 flex items-center gap-2 ${active
                                                                ? "text-white font-medium bg-white/[0.09]"
                                                                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                                                            }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full transition-colors ${active ? "bg-amber-400" : "bg-transparent group-hover:bg-slate-500"
                                                                }`}
                                                        />
                                                        <span className="truncate">{page.pageName}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* ── User Profile & Logout Section ── */}
                <div className="p-3 border-t border-white/[0.08]">
                    <div className="bg-white/[0.04] p-2.5 rounded-2xl border border-white/[0.06] backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#cfcb9e] flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white/10 shadow-sm">
                                {myPhotoPath ? (
                                    <img
                                        src={getDocumentUrl(myPhotoPath)}
                                        alt={username}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                            setMyPhotoPath(null);
                                        }}
                                    />
                                ) : (
                                    <span className="text-xs font-bold text-[#0b2836]">
                                        {initials || "U"}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-white truncate leading-tight">
                                    {username}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5 uppercase tracking-wider">
                                    {role || "Member"}
                                </p>
                            </div>

                            <button
                                onClick={() => setShowLogoutModal(true)}
                                title="Sign out"
                                aria-label="Logout"
                                className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                            >
                                <i className="fa-solid fa-right-from-bracket text-xs" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Logout Modal ── */}
            {/* ── Logout Modal ── */}
            {showLogoutModal && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
                    <div className="w-full max-w-[400px] rounded-[24px] bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                        {/* Icon */}
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-6 text-red-500 ring-[8px] ring-red-50">
                            <i className="fa-solid fa-arrow-right-from-bracket text-xl" />
                        </div>

                        {/* Text */}
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign out</h2>
                        <p className="mt-2 text-[14px] font-medium leading-relaxed text-slate-500 pr-2">
                            Your active session will end and you will be redirected to the login screen.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-8">
                            <button
                                type="button"
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-bold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex-1 rounded-2xl bg-[#DC2626] px-4 py-3 text-[14px] font-bold text-white transition-all hover:bg-red-700 active:scale-95 focus:outline-none shadow-sm shadow-red-500/20"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

// ── Group Icons ──
function getGroupIcon(group) {
    const icons = {
        General: "fa-table-cells-large",
        Admin: "fa-user-shield",
        HR: "fa-users",
        Payroll: "fa-wallet",
        Recruitment: "fa-briefcase",
        Sales: "fa-chart-line",
        Inventory: "fa-box",
        Reports: "fa-chart-bar",
        Public: "fa-globe",
        Self: "fa-user",
    };
    return icons[group] || "fa-folder";
}