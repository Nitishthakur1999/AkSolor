import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { adminService } from "@/services/adminService";

// Report sub-pages to hide from the sidebar nav.
// Match is case-insensitive and ignores extra spaces.
const HIDDEN_PAGE_NAMES = ["attendance report", "leave report", "payroll report"];

export default function Sidebar() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const allPages = JSON.parse(localStorage.getItem("pages") || "[]");
    const pages = allPages.filter(
        (page) => !HIDDEN_PAGE_NAMES.includes((page.pageName || "").trim().toLowerCase())
    );
    const username = localStorage.getItem("username") || "User";
    const role = localStorage.getItem("role") || "";

    const GROUP_ORDER = ["General", "Admin", "HR", "Payroll", "Recruitment", "Sales", "Inventory", "Reports", "Self"];

    const groupedPages = pages.reduce((groups, page) => {
        const type = page.pageType || "General";
        if (!groups[type]) groups[type] = [];
        groups[type].push(page);
        return groups;
    }, {});

    // ── Sidebar-only override: Sales module should show just "Leads" ──
    // (Router/DB still has the other sales pages, we're only hiding the nav links here)
    if (groupedPages["Sales"]) {
        groupedPages["Sales"] = groupedPages["Sales"].filter(
            (page) => page.pageLink === "/sales/leads"
        );
        if (groupedPages["Sales"].length === 0) delete groupedPages["Sales"];
    }

    const activeGroups = GROUP_ORDER.filter(g => groupedPages[g]);

    Object.keys(groupedPages).forEach(g => {
        if (!activeGroups.includes(g)) activeGroups.push(g);
    });

    const [openGroups, setOpenGroups] = useState<Record<string, any>>({});
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // ── Reminders (bell icon) state ──
    const [reminders, setReminders] = useState([]);
    const [showReminders, setShowReminders] = useState(false);
    const [remindersLoading, setRemindersLoading] = useState(false);
    const reminderRef = useRef(null);

    // Fetch pending reminders on mount (badge count) — refetch every 60s
    useEffect(() => {
        const allowedRoles = ["Admin", "HR"]; 
        if (!allowedRoles.includes(role)) return;

        fetchReminders();
        const interval = setInterval(fetchReminders, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
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
            <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-[#0b1727] text-white z-20">

                {/* ── Top: User Info + Bell ── */}
                <div className="p-5 border-b border-slate-700/50">
                    <div className="flex justify-center items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                                src="admin.png"
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{username}</p>
                            <p className="text-xs text-indigo-400 font-medium truncate">{role}</p>
                        </div>

                        {/* ── Bell icon ── */}
                        <div className="relative shrink-0" ref={reminderRef}>
                            <button
                                onClick={() => setShowReminders((prev) => !prev)}
                                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                            >
                                <i className="ti ti-bell text-lg" />
                                {reminders.length > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {reminders.length > 9 ? "9+" : reminders.length}
                                    </span>
                                )}
                            </button>

                            {/* ── Dropdown panel — fixed so it never squeezes/overlaps the sidebar ── */}
                            {showReminders && (
                                <div className="fixed top-20 left-4 w-80 max-h-96 overflow-y-auto rounded-xl bg-white text-black shadow-2xl border border-slate-200 z-[9999]">
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-black">Reminders</span>
                                        {remindersLoading && (
                                            <span className="text-xs text-black">Loading...</span>
                                        )}
                                    </div>

                                    {reminders.length === 0 && !remindersLoading && (
                                        <div className="px-4 py-6 text-center text-sm text-black">
                                            No pending reminders
                                        </div>
                                    )}

                                    {reminders.map((r) => (
                                        <div
                                            key={r.reminderId || r.ReminderId}
                                            className="px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                        >
                                            <p className="text-sm text-black">
                                                {r.message || r.Message || "(no message)"}
                                            </p>
                                            <div className="mt-1 flex items-center justify-between">
                                                <span className="text-xs text-black">
                                                    {(r.reminderDate || r.ReminderDate)
                                                        ? new Date(r.reminderDate || r.ReminderDate).toLocaleString()
                                                        : ""}
                                                </span>
                                                <button
                                                    onClick={() => handleMarkDone(r.reminderId || r.ReminderId)}
                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                                >
                                                    Mark Done
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Nav Pages ── */}
                <nav className="flex-1 justify-center px-3 py-8 overflow-y-auto space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {activeGroups.map((groupName) => {
                        const isOpen = !!openGroups[groupName];
                        return (
                            <div key={groupName} className="select-none">
                                <button
                                    onClick={() => toggleGroup(groupName)}
                                    className="w-full flex items-center justify-between py-2 px-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <i className={`ti ${getGroupIcon(groupName)} text-slate-400 text-sm`} />
                                        <span className="text-[15px] font-medium">{groupName}</span>
                                    </div>
                                    <i className={`ti ti-chevron-down text-xs text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`} />
                                </button>

                                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                                    <div className="overflow-hidden">
                                        <div className="pl-9 pt-1 pb-2 flex flex-col gap-0.5">
                                            {groupedPages[groupName].map((page) => (
                                                <Link
                                                    key={page.pageId} to={page.pageLink}
                                                    className={`py-1.5 px-2 rounded-md text-[14px] transition-all ${pathname === page.pageLink
                                                        ? "text-white font-semibold bg-slate-700/50"
                                                        : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                                        }`}
                                                >
                                                    {page.pageName}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* ── Bottom: Sign out ── */}
                <div className="p-3 border-t border-slate-700/50">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full flex items-center gap-3 py-2.5 px-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-[13px]"
                    >
                        <i className="ti ti-logout" />
                        <span className="font-bold">Sign out</span>
                    </button>
                </div>
            </aside>

            {/* ── Logout Modal ── */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-80 rounded-2xl border border-slate-700 bg-white p-6 shadow-2xl">

                        {/* Header */}
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-black">
                                Sign out
                            </h2>

                            <p className="mt-1 text-sm text-slate-300">
                                Are you sure?
                            </p>
                        </div>

                        {/* Description */}
                        <p className="mb-6 text-sm leading-6 text-slate-300">
                            Your session will be cleared and you'll be redirected to the login page.
                        </p>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ── Group Icons ──────────────────────────────────────────────────────────────
function getGroupIcon(group) {
    const icons = {
        General: "ti-layout-dashboard",
        Admin: "ti-shield-lock",
        HR: "ti-users",
        Payroll: "ti-cash",
        Recruitment: "ti-briefcase",
        Sales: "ti-chart-line",
        Inventory: "ti-box",
        Reports: "ti-chart-bar",
        Self: "ti-user",
    };
    return icons[group] || "ti-folder";
}