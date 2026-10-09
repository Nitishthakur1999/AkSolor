import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "@/services/adminService";

// ───────────────────────── Date/Time helpers ─────────────────────────

const SERVER_UTC_OFFSET = "-07:00";

// TEMP DEBUG: true karo to Applied On ke neeche raw createdAt dikhega.
const SHOW_RAW_DEBUG = false;

const parseServerDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    let s = String(value).trim().replace(" ", "T");
    s = s.replace(/(\.\d{3})\d+/, "$1"); // .NET 7-digit fraction trim
    const hasTz = /(Z|[+-]\d{2}:?\d{2})$/i.test(s);
    if (!hasTz) s += SERVER_UTC_OFFSET;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
};

// Applied On: date + time, hamesha IST me (createdAt server tz se convert hota hai)
const formatDateTime = (value) => {
    const d = parseServerDate(value);
    if (!d) return null;
    return {
        date: d.toLocaleDateString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
        }),
        time: d.toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
        }),
    };
};

// From/To date: sirf date, timezone shift nahi hoga
const formatDateOnly = (value) => {
    const m = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return "-";
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
    });
};

// punch / from / to time pehle se IST (naive) hai -> koi timezone conversion nahi.
// Accepts "10:49:00", "10:49", "2026-10-08T10:49:00", "2026-10-08 10:49:00" -> "10:49 AM"
const fmtClock = (value) => {
    if (!value) return "-";
    const m = String(value).trim().match(/(?:[T ]|^)(\d{1,2}):(\d{2})/);
    if (!m) return "-";
    const h = Number(m[1]);
    const min = m[2];
    if (isNaN(h) || h > 23) return "-";
    const ap = h >= 12 ? "PM" : "AM";
    return `${String(h % 12 || 12).padStart(2, "0")}:${min} ${ap}`;
};

// 0.01 -> "<1 min", 0.5 -> "30 min", 1.25 -> "1 hr 15 min"
const formatHours = (h) => {
    if (h === null || h === undefined || h === "") return "";
    const n = Number(h);
    if (isNaN(n)) return "";
    const mins = Math.round(n * 60);
    if (mins < 1) return "<1 min";
    if (mins < 60) return `${mins} min`;
    const hr = Math.floor(mins / 60);
    const rest = mins % 60;
    return rest ? `${hr} hr ${rest} min` : `${hr} hr`;
};

// Short leave detect: flag ya time ya naam, kuch bhi mile to short leave
const isShort = (r) =>
    r.isShortLeave === true || r.isShortLeave === 1 ||
    !!r.fromTime || r.leaveName === "Short Leave";

const STATUS_BADGE = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    Pending: "bg-amber-50 text-amber-700 border-amber-200/50",
    Forwarded: "bg-sky-50 text-sky-700 border-sky-200/50",
    Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200/50",
};

const STATUS_DOT = {
    Approved: "bg-emerald-500",
    Pending: "bg-amber-500",
    Forwarded: "bg-sky-500",
    Cancelled: "bg-slate-400",
    Rejected: "bg-rose-500",
};

const STATUS_NOTE = {
    Approved: "text-emerald-600",
    Rejected: "text-rose-600",
    Forwarded: "text-sky-600",
};

// Status tabs: Forwarded nahi chahiye to yahan se hata do
const STATUS_TABS = ["All", "Pending", "Approved", "Rejected", "Forwarded"];

export default function LeaveRequests() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const isHrRole = ["HR", "Sr. Manager (HR & Social Media)"].includes(user?.role);
    const isManagerRole = ["CMD", "Director"].includes(user?.role);

    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "manager" ? "manager" : "hr");
    const [statusFilter, setStatusFilter] = useState("All"); // All | Pending | Approved | Rejected | Forwarded
    const [loading, setLoading] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // top scrollbar sync
    const topScrollRef = useRef(null);
    const tableScrollRef = useRef(null);
    const [tableScrollWidth, setTableScrollWidth] = useState(0);

    // leaveId currently showing the "forward to..." choice
    const [forwardPickerId, setForwardPickerId] = useState(null);

    // leaveId currently showing the "select leave type to approve" picker
    const [approvePickerId, setApprovePickerId] = useState(null);
    const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState("");
    const [leaveTypes, setLeaveTypes] = useState([]);

    // leaveId currently mid-flight (prevents double-submit)
    const [actioningId, setActioningId] = useState(null);

    // load once + polling + focus refresh, so HR/Manager tab
    // status (Approved/Rejected/Forwarded) stays in sync across users
    useEffect(() => {
        loadRequests();
        loadLeaveTypes();

        const interval = setInterval(() => {
            loadRequests(true); // silent refresh, no spinner flicker
        }, 15000); // 15s poll

        const onFocus = () => loadRequests(true);
        window.addEventListener("focus", onFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", onFocus);
        };
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, statusFilter]);

    const loadRequests = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await adminService.getAllLeaveRequests();
            if (res.Success || res.success) setLeaveRequests(res.Data || res.data || []);
        } catch (err) {
            console.error("Failed to load requests:", err);
            if (!silent) alert("Failed to load leave requests. You may not have permission to view this data.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const loadLeaveTypes = async () => {
        try {
            const res = await adminService.getLeaveTypes();
            if (res.Success || res.success) setLeaveTypes(res.Data || res.data || []);
        } catch (err) {
            console.error("Failed to load leave types:", err);
        }
    };

    const handleLeaveAction = async (leaveId, statusAction, forwardedToRole = null, leaveTypeId = null) => {
        if (actioningId === leaveId) return;
        setActioningId(leaveId);
        try {
            const remarksText =
                statusAction === "Forwarded"
                    ? `Forwarded by HR to ${forwardedToRole} for approval`
                    : `Request ${statusAction} by Admin/HR`;

            const payload = {
                status: statusAction,
                approvedBy: user?.employeeId || 1,
                remarks: remarksText,
                // Forwarded ke saath bhi leaveTypeId bhejo — HR forward karte time hi type select karta hai
                ...(statusAction === "Forwarded" ? { forwardedToRole, leaveTypeId } : {}),
                ...(statusAction === "Approved" ? { leaveTypeId } : {}),
            };

            const res = await adminService.actionLeaveRequest(leaveId, payload);
            if (res.Success || res.success) {
                setLeaveRequests(prev =>
                    prev.map(req =>
                        req.leaveId === leaveId
                            ? {
                                ...req,
                                status: statusAction,
                                ...(statusAction === "Forwarded" ? { forwardedToRole, leaveTypeId } : {}),
                                ...(statusAction === "Approved" ? { leaveTypeId } : {}),
                                ...(statusAction === "Approved" || statusAction === "Rejected"
                                    ? { approvedBy: user?.employeeId || 1 }
                                    : {}),
                            }
                            : req
                    )
                );
                setForwardPickerId(null);
                setApprovePickerId(null);
                setSelectedLeaveTypeId("");

                // pull fresh truth from server right after own action too
                loadRequests(true);
            } else {
                alert(res.Message || res.message || "Failed to process request");
            }
        } catch (err) {
            console.error(err);
            const backendMsg =
                err?.response?.data?.Message ||
                err?.response?.data?.message ||
                err?.response?.data?.errorMessage ||
                (typeof err?.response?.data === "string" ? err.response.data : null) ||
                err?.message;
            alert(backendMsg || "Something went wrong while processing this request.");
        } finally {
            setActioningId(null);
        }
    };

    // HR / Manager tab filter
    const tabFilteredBase = leaveRequests.filter(item => {
        if (activeTab === "hr") return true;

        if (isManagerRole) {
            return item.forwardedToRole === user?.role || item.approvedBy === user?.employeeId;
        }
        return item.status === "Forwarded";
    });

    // Status tab counts (current HR/Manager tab ke hisaab se)
    const statusCounts = STATUS_TABS.reduce((acc, s) => {
        acc[s] = s === "All"
            ? tabFilteredBase.length
            : tabFilteredBase.filter(i => i.status === s).length;
        return acc;
    }, {});

    // Status filter
    const statusFilteredBase =
        statusFilter === "All"
            ? tabFilteredBase
            : tabFilteredBase.filter(i => i.status === statusFilter);

    // Search
    const SEARCHABLE_FIELDS = ["fullName", "leaveName", "reason", "status"];
    const filteredData = statusFilteredBase.filter(item => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return SEARCHABLE_FIELDS.some(f => (item[f] ?? "").toString().toLowerCase().includes(q));
    });

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    // Top scrollbar: dummy div ki width = table ki scrollWidth
    useEffect(() => {
        const update = () => {
            if (tableScrollRef.current) setTableScrollWidth(tableScrollRef.current.scrollWidth);
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [currentItems.length, loading, activeTab, statusFilter]);

    const syncScroll = (from, to) => {
        if (from.current && to.current && to.current.scrollLeft !== from.current.scrollLeft) {
            to.current.scrollLeft = from.current.scrollLeft;
        }
    };

    return (
        <div className="space-y-5 pb-10 font-sans">

            {/* Header */}
            <div className="bg-[#0b2532] rounded-2xl px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-calendar-minus text-lg text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Leave Requests</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Approve or reject employee leave applications.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit">
                <button
                    onClick={() => setActiveTab("hr")}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "hr" ? "bg-[#0b2532] text-white" : "text-slate-500 hover:bg-slate-50"
                        }`}
                >
                    HR Approval
                </button>
                <button
                    onClick={() => setActiveTab("manager")}
                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === "manager" ? "bg-[#0b2532] text-white" : "text-slate-500 hover:bg-slate-50"
                        }`}
                >
                    CMD / Director Approval
                </button>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit">
                {STATUS_TABS.map((s) => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${statusFilter === s ? "bg-[#0b2532] text-white" : "text-slate-500 hover:bg-slate-50"
                            }`}
                    >
                        {s}
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${statusFilter === s ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                            }`}>
                            {statusCounts[s]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Search Requests</label>
                <div className="relative group flex items-center gap-3">
                    <div className="relative flex-1">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by employee, type, reason or status..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">

                {/* TOP scrollbar (dummy, table ke saath sync) */}
                {!loading && currentItems.length > 0 && (
                    <div
                        ref={topScrollRef}
                        onScroll={() => syncScroll(topScrollRef, tableScrollRef)}
                        className="overflow-x-auto overflow-y-hidden border-b border-slate-100"
                        style={{ height: 14 }}
                    >
                        <div style={{ width: tableScrollWidth, height: 1 }} />
                    </div>
                )}

                {/* Real table container: niche ka scrollbar hidden */}
                <div
                    ref={tableScrollRef}
                    onScroll={() => syncScroll(tableScrollRef, topScrollRef)}
                    className="overflow-x-auto min-h-[300px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-4">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Fetching leave requests...</div>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                <i className="fa-solid fa-folder-open text-2xl text-slate-300" />
                            </div>
                            <p className="text-base text-slate-700 font-bold">No results found</p>
                            <p className="text-sm text-slate-400 mt-1 font-medium">
                                {searchTerm
                                    ? "Try adjusting your search query."
                                    : statusFilter !== "All"
                                        ? `No ${statusFilter.toLowerCase()} requests.`
                                        : activeTab === "hr"
                                            ? "No requests in HR queue."
                                            : isManagerRole
                                                ? `No requests forwarded to ${user?.role}.`
                                                : "No requests forwarded to CMD/Director."}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1050px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Employee</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Applied On</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Leave Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Duration</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Reason</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {currentItems.map((req) => {
                                    const short = isShort(req);
                                    // API me punch fields hon to wahi; purani API (fields nahi) ho to from/to time fallback
                                    const hasPunchFields = "punchOutTime" in req || "punchInTime" in req;
                                    const outVal = hasPunchFields ? req.punchOutTime : req.fromTime;
                                    const inVal = hasPunchFields ? req.punchInTime : req.toTime;
                                    const hasOut = !!outVal;
                                    const hasIn = !!inVal;
                                    // Short leave: jab tak employee Punch Out + Punch In nahi karta, HR action nahi le sakta.
                                    // (SP sirf punched-in rows bhejta hai, ye sirf safety net hai)
                                    const awaitingOut =
                                        short && hasPunchFields && !(hasOut && hasIn) && req.status === "Pending";
                                    return (
                                        // h-[88px]: short leave aur normal rows ki height same rahe
                                        <tr key={req.leaveId} className="hover:bg-slate-50/60 transition-colors group h-[88px]">
                                            <td className="px-6 py-4 align-middle">
                                                <div className="font-bold text-slate-900">{req.fullName || `EMP-${req.empId}`}</div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                {(() => {
                                                    const applied = formatDateTime(req.createdAt);
                                                    return applied ? (
                                                        <>
                                                            <div className="font-bold text-slate-800">{applied.date}</div>
                                                            <div className="text-[11px] font-medium text-slate-500 mt-0.5">{applied.time}</div>
                                                            {SHOW_RAW_DEBUG && (
                                                                <div className="text-[9px] text-red-500 mt-0.5">raw: {String(req.createdAt)}</div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    );
                                                })()}
                                            </td>

                                            {/* Leave Type: short leave = red badge */}
                                            <td className="px-6 py-4 align-middle">
                                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${short
                                                    ? "bg-red-50 text-red-600 border-red-300"
                                                    : "bg-slate-100 text-slate-600 border-slate-200"
                                                    }`}>
                                                    {short
                                                        ? "Short Leave"
                                                        : (req.leaveName || `Type-${req.leaveTypeId}`)}
                                                </span>
                                            </td>

                                            {/* Duration: short leave = punch time (already IST) + time away, normal = dates + days */}
                                            <td className="px-6 py-4 align-middle">
                                                {short ? (
                                                    <>
                                                        <div className="text-[11px] font-medium text-slate-500">
                                                            {formatDateOnly(req.fromDate)}
                                                        </div>
                                                        <div className="font-bold text-slate-800 mt-0.5">
                                                            {hasOut ? fmtClock(outVal) : "--:--"}
                                                            {" – "}
                                                            {hasIn ? fmtClock(inVal) : "--:--"}
                                                        </div>
                                                        <div className="text-[11px] font-bold text-red-600 mt-0.5">
                                                            {!hasOut
                                                                ? "Not punched out"
                                                                : !hasIn
                                                                    ? "Out, not back yet"
                                                                    : formatHours(req.durationHours) || "—"}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-[11px] font-medium text-slate-500">{formatDateOnly(req.fromDate)} to</div>
                                                        <div className="font-bold text-slate-800 mt-0.5">
                                                            {formatDateOnly(req.toDate)}
                                                            <span className="text-amber-600 ml-1.5 font-bold">({req.totalDays} Days)</span>
                                                        </div>
                                                    </>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 align-middle text-xs font-medium text-slate-600 max-w-[200px] truncate" title={req.reason}>
                                                {req.reason}
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${STATUS_BADGE[req.status] || STATUS_BADGE.Rejected}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[req.status] || STATUS_DOT.Rejected}`} />
                                                    {req.status}
                                                </span>

                                                {req.forwardedToRole && (
                                                    <div className={`text-[10px] font-bold mt-1.5 uppercase tracking-wide ${STATUS_NOTE[req.status] || "text-slate-400"}`}>
                                                        {req.status === "Forwarded" ? `→ ${req.forwardedToRole}` : `${req.status} by ${req.forwardedToRole}`}
                                                    </div>
                                                )}

                                                {/* Short leave: punch state dikhao */}
                                                {short && !req.forwardedToRole && (hasOut || hasIn) && (
                                                    <div className="text-[10px] font-bold mt-1.5 uppercase tracking-wide text-violet-600">
                                                        {hasIn ? "Back" : "Out"} at {fmtClock(hasIn ? inVal : outVal)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 align-middle text-center">
                                                {activeTab === "hr" && req.status === "Pending" ? (
                                                    awaitingOut ? (
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 italic">
                                                            {hasOut ? "Waiting for punch in" : "Waiting for punch out"}
                                                        </span>
                                                    ) : isHrRole ? (
                                                        approvePickerId === req.leaveId ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <select
                                                                    value={selectedLeaveTypeId}
                                                                    onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                                                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white focus:outline-none focus:border-amber-400"
                                                                >
                                                                    <option value="" disabled>-- Select type --</option>
                                                                    {leaveTypes.map((t) => (
                                                                        <option key={t.leaveTypeId} value={t.leaveTypeId}>
                                                                            {t.leaveName}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <button
                                                                    disabled={!selectedLeaveTypeId || actioningId === req.leaveId}
                                                                    onClick={() => handleLeaveAction(req.leaveId, "Approved", null, selectedLeaveTypeId)}
                                                                    className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/50 text-[11px] font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                                                                >
                                                                    {actioningId === req.leaveId ? "..." : "Confirm"}
                                                                </button>
                                                                <button
                                                                    disabled={actioningId === req.leaveId}
                                                                    onClick={() => { setApprovePickerId(null); setSelectedLeaveTypeId(""); }}
                                                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-200 disabled:opacity-40 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : forwardPickerId === req.leaveId ? (
                                                            // Forward se pehle leave type select karna zaroori
                                                            <div className="flex items-center justify-center gap-2">
                                                                <select
                                                                    value={selectedLeaveTypeId}
                                                                    onChange={(e) => setSelectedLeaveTypeId(e.target.value)}
                                                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 bg-white focus:outline-none focus:border-amber-400"
                                                                >
                                                                    <option value="" disabled>-- Select type --</option>
                                                                    {leaveTypes.map((t) => (
                                                                        <option key={t.leaveTypeId} value={t.leaveTypeId}>
                                                                            {t.leaveName}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                <span className="text-[11px] font-bold text-slate-500">to:</span>
                                                                <button
                                                                    disabled={!selectedLeaveTypeId || actioningId === req.leaveId}
                                                                    onClick={() => handleLeaveAction(req.leaveId, "Forwarded", "CMD", selectedLeaveTypeId)}
                                                                    className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200/50 text-[11px] font-bold uppercase tracking-wider text-sky-700 hover:bg-sky-100 disabled:opacity-40 transition-colors"
                                                                >
                                                                    CMD
                                                                </button>
                                                                <button
                                                                    disabled={!selectedLeaveTypeId || actioningId === req.leaveId}
                                                                    onClick={() => handleLeaveAction(req.leaveId, "Forwarded", "Director", selectedLeaveTypeId)}
                                                                    className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200/50 text-[11px] font-bold uppercase tracking-wider text-sky-700 hover:bg-sky-100 disabled:opacity-40 transition-colors"
                                                                >
                                                                    Director
                                                                </button>
                                                                <button
                                                                    disabled={actioningId === req.leaveId}
                                                                    onClick={() => { setForwardPickerId(null); setSelectedLeaveTypeId(""); }}
                                                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-200 disabled:opacity-40 transition-colors"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    disabled={actioningId === req.leaveId}
                                                                    onClick={() => { setApprovePickerId(req.leaveId); setSelectedLeaveTypeId(""); }}
                                                                    className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/50 text-[11px] font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    disabled={actioningId === req.leaveId}
                                                                    onClick={() => handleLeaveAction(req.leaveId, "Rejected")}
                                                                    className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200/50 text-[11px] font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-100 disabled:opacity-40 transition-colors"
                                                                >
                                                                    {actioningId === req.leaveId ? "..." : "Reject"}
                                                                </button>
                                                                <button
                                                                    disabled={actioningId === req.leaveId}
                                                                    onClick={() => { setForwardPickerId(req.leaveId); setSelectedLeaveTypeId(""); }}
                                                                    className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200/50 text-[11px] font-bold uppercase tracking-wider text-sky-700 hover:bg-sky-100 disabled:opacity-40 transition-colors"
                                                                >
                                                                    Forward
                                                                </button>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 italic">HR Only</span>
                                                    )
                                                ) : activeTab === "manager" && req.status === "Forwarded" ? (
                                                    isManagerRole && req.forwardedToRole === user?.role ? (
                                                        // CMD/Director ko sirf Approve/Reject — leave type HR ne pehle tay kar diya
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                disabled={actioningId === req.leaveId}
                                                                onClick={() => handleLeaveAction(req.leaveId, "Approved", null, req.leaveTypeId)}
                                                                className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/50 text-[11px] font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                                                            >
                                                                {actioningId === req.leaveId ? "..." : "Approve"}
                                                            </button>
                                                            <button
                                                                disabled={actioningId === req.leaveId}
                                                                onClick={() => handleLeaveAction(req.leaveId, "Rejected")}
                                                                className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200/50 text-[11px] font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-100 disabled:opacity-40 transition-colors"
                                                            >
                                                                {actioningId === req.leaveId ? "..." : "Reject"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 italic">
                                                            {isManagerRole ? "Not addressed to you" : "CMD/Director Only"}
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 italic">Action Taken</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {!loading && filteredData.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4">
                        <div>
                            Showing <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                            <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, filteredData.length)}</span> of{" "}
                            <span className="font-bold text-slate-800">{filteredData.length}</span> entries
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                            </button>
                            <div className="hidden sm:flex gap-1.5">
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPage(index + 1)}
                                        className={`w-8 h-8 rounded-lg border text-sm font-bold transition-all shadow-sm flex items-center justify-center ${currentPage === index + 1
                                            ? "bg-amber-500 border-amber-500 text-white"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                Next <i className="fa-solid fa-chevron-right text-[10px]" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}