import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { adminService } from "@/services/adminService";
import logo from "@/assets/logo.png";
import { createPortal } from "react-dom";

// Report sub-pages to hide from the sidebar nav.
// Match is case-insensitive and ignores extra spaces.
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
  // (Router/DB still has the other sales pages, we're only hiding the nav links here)
  if (groupedPages["Sales"]) {
    groupedPages["Sales"] = groupedPages["Sales"].filter(
      (page) => page.pageLink === "/sales/leads",
    );
    if (groupedPages["Sales"].length === 0) delete groupedPages["Sales"];
  }

  const activeGroups = GROUP_ORDER.filter((g) => groupedPages[g]);

  Object.keys(groupedPages).forEach((g) => {
    if (!activeGroups.includes(g)) activeGroups.push(g);
  });

  const [openGroups, setOpenGroups] = useState<Record<string, any>>(() => {
    // Auto-open the group that contains the current route so users land oriented.
    const initial: Record<string, any> = {};
    for (const g of activeGroups) {
      if (groupedPages[g]?.some((p) => p.pageLink === pathname))
        initial[g] = true;
    }
    return initial;
  });
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
      <aside className="h-full w-full flex flex-col bg-[#0b2836] text-white font-sans">
        {/* ── Brand ── */}
        <div className="relative px-4 sm:px-5 pt-4 sm:pt-5 pb-4 sm:pb-5 border-b border-white/10">
          <div className="flex items-center gap-2.5 sm:gap-3 pr-16">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/[0.07] flex items-center justify-center shrink-0 overflow-hidden p-1">
              <img
                src={logo}
                alt="AkerpSuite logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base sm:text-lg font-bold text-white leading-tight truncate">
                AkerpSuite
              </p>
              <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.18em] text-slate-400 uppercase mt-0.5">
                Admin Panel
              </p>
            </div>
          </div>

          {/* ── Mobile close button ── */}
          <button
            onClick={onNavigate}
            aria-label="Close menu"
            className="lg:hidden absolute top-4 sm:top-5 right-14 sm:right-16 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <i className="fa-solid fa-xmark text-base" />
          </button>

          {/* ── Bell icon ── */}
          <div
            className="absolute top-4 sm:top-5 right-4 sm:right-5"
            ref={reminderRef}
          >
            <button
              onClick={() => setShowReminders((prev) => !prev)}
              aria-label="Reminders"
              className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
            >
              <i className="fa-solid fa-bell text-base" />
              {reminders.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#0b2836]">
                  {reminders.length > 9 ? "9+" : reminders.length}
                </span>
              )}
            </button>

            {/* ── Dropdown panel ── */}
            {showReminders && (
              <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-auto sm:w-80 max-h-96 overflow-y-auto rounded-2xl bg-[#0f3345] border border-white/10 shadow-2xl z-[9999]">
                <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#0f3345]/95 backdrop-blur rounded-t-2xl">
                  <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-bell text-amber-300 text-[13px]" />
                    Reminders
                  </span>
                  {remindersLoading && (
                    <span className="text-[11px] text-slate-400">Loading…</span>
                  )}
                </div>

                {reminders.length === 0 && !remindersLoading && (
                  <div className="px-4 py-8 text-center">
                    <i className="fa-solid fa-circle-check text-3xl text-emerald-400 mb-2 block" />
                    <p className="text-sm font-medium text-white">
                      All caught up
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      No pending reminders right now
                    </p>
                  </div>
                )}

                {reminders.map((r) => (
                  <div
                    key={r.reminderId || r.ReminderId}
                    className="px-4 py-3 border-b border-white/[0.06] last:border-b-0 hover:bg-white/[0.04] transition-colors flex gap-3"
                  >
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-100 leading-snug">
                        {r.message || r.Message || "(no message)"}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">
                          {r.reminderDate || r.ReminderDate
                            ? new Date(
                                r.reminderDate || r.ReminderDate,
                              ).toLocaleString()
                            : ""}
                        </span>
                        <button
                          onClick={() =>
                            handleMarkDone(r.reminderId || r.ReminderId)
                          }
                          className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 shrink-0"
                        >
                          <i className="fa-solid fa-check text-[11px]" />
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

        {/* ── Nav Pages ── */}
        <nav className="flex-1 px-3 sm:px-4 py-3 sm:py-4 overflow-y-auto space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {activeGroups.map((groupName) => {
            const items = groupedPages[groupName];
            const icon = getGroupIcon(groupName);

            // ── Single-page groups render as a flat, direct link (e.g. "Dashboard") ──
            if (items.length === 1) {
              const page = items[0];
              const active = pathname === page.pageLink;
              return (
                <Link
                  key={groupName}
                  to={page.pageLink}
                  onClick={onNavigate}
                  className={`relative flex items-center gap-3 py-2.5 pl-4 pr-3 rounded-xl transition-all ${
                    active
                      ? "bg-white/[0.09] text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {active && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-amber-300" />
                  )}
                  <i className={`fa-solid ${icon} text-sm w-4 text-center`} />
                  <span className="text-[13px] font-bold">{page.pageName}</span>
                </Link>
              );
            }

            // ── Multi-page groups render as an accordion ──
            const isOpen = !!openGroups[groupName];
            const hasActiveChild = items.some((p) => p.pageLink === pathname);
            return (
              <div key={groupName} className="select-none">
                <button
                  onClick={() => toggleGroup(groupName)}
                  className={`relative w-full flex items-center justify-between py-2.5 pl-4 pr-3 rounded-xl transition-all ${
                    hasActiveChild && !isOpen
                      ? "bg-white/[0.06] text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  {hasActiveChild && (
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-amber-300" />
                  )}
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid ${icon} text-sm w-4 text-center`} />
                    <span className="text-[13px] font-bold">{groupName}</span>
                  </div>
                  <i
                    className={`fa-solid fa-chevron-down text-[10px] text-slate-500 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="pl-[44px] pr-2 pt-1 pb-1.5 flex flex-col gap-0.5">
                      {items.map((page) => {
                        const active = pathname === page.pageLink;
                        return (
                          <Link
                            key={page.pageId}
                            to={page.pageLink}
                            onClick={onNavigate}
                            className={`relative py-1.5 pl-4 pr-2 rounded-lg text-[12.5px] transition-all ${
                              active
                                ? "text-white font-semibold bg-white/[0.06]"
                                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                            }`}
                          >
                            {active && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-300" />
                            )}
                            {page.pageName}
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

        {/* ── Bottom: Profile + Sign out ── */}
        <div className="px-4 pt-3 pb-4 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#cfcb9e] flex items-center justify-center shrink-0">
              <span className="text-[12px] font-bold text-[#0b2836]">
                {initials || "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-white truncate leading-tight">
                {username}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {role || "Member"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 mt-2 py-2 px-1 text-slate-400 hover:text-red-400 transition-all text-[13px] font-bold"
          >
            <i className="fa-solid fa-right-from-bracket text-sm w-4 text-center" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

          {/* ── Logout Modal ── */}
          {showLogoutModal && createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
                  <div className="w-full max-w-[340px] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                          <i className="fa-solid fa-right-from-bracket text-xl text-red-500" />
                      </div>

                      <h2 className="text-lg font-semibold text-slate-900">Sign out</h2>
                      <p className="mt-1.5 text-sm leading-6 text-slate-500">
                          Your session will be cleared and you'll be redirected to the login
                          page.
                      </p>

                      <div className="flex gap-3 mt-6">
                          <button
                              type="button"
                              onClick={() => setShowLogoutModal(false)}
                              className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                          >
                              Cancel
                          </button>

                          <button
                              type="button"
                              onClick={handleLogout}
                              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
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

// ── Group Icons (Font Awesome — matches the icon set actually loaded in index.html) ──
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
    Public: "ti-world",

    Self: "fa-user",
  };
  return icons[group] || "fa-folder";
}
