import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";

// ── Small inline icon set (no external icon font dependency) ──
const Icon = {
    Plus: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...p}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    ),
    Calendar: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
    ),
    Close: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    ),
    Inbox: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
        </svg>
    ),
    Check: (p) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M20 6 9 17l-5-5" />
        </svg>
    ),
};

const STATUS_DOT = {
    Approved: "bg-emerald-500",
    Pending: "bg-amber-500",
    Rejected: "bg-red-500",
};

const STATUS_BADGE = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
};

const LEAVE_ACCENTS = [
    { ring: "#6366f1", wash: "bg-amber-50", text: "text-amber-600" },
    { ring: "#0d9488", wash: "bg-teal-50", text: "text-teal-600" },
    { ring: "#d946ef", wash: "bg-fuchsia-50", text: "text-fuchsia-600" },
    { ring: "#f59e0b", wash: "bg-amber-50", text: "text-amber-600" },
];

// Circular progress ring — encodes balance-used-of-total visually rather than decoratively
function BalanceRing({ used, total, accent }) {
    const size = 56;
    const stroke = 5;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = total > 0 ? Math.min(used / total, 1) : 0;
    const offset = circumference * (1 - pct);

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef2f7" strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={accent} strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
        </svg>
    );
}

function BalanceCardSkeleton() {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-2">
                <div className="h-3 w-20 bg-slate-100 rounded" />
                <div className="h-6 w-16 bg-slate-100 rounded" />
            </div>
        </div>
    );
}

// A leave type counts as "inactive" if it's flagged that way with any of the
// field names the backend might use (isActive boolean, or a status string).
// Defensive on purpose — we only want to *hide*, never accidentally hide
// everything just because a field name doesn't match what we expect.
const isLeaveTypeActive = (t) => {
    if (typeof t.isActive === "boolean") return t.isActive;
    if (typeof t.IsActive === "boolean") return t.IsActive;
    if (typeof t.status === "string") return t.status.toLowerCase() !== "inactive";
    if (typeof t.Status === "string") return t.Status.toLowerCase() !== "inactive";
    return true;
};

export default function MyLeaves() {
    const [balances, setBalances] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]); // NEW — independent source for the dropdown
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestsLoading, setRequestsLoading] = useState(false);

    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [filterMonth, setFilterMonth] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    // ── Apply Leave modal state ──
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [applyError, setApplyError] = useState("");
    const [applySuccess, setApplySuccess] = useState("");
    const [form, setForm] = useState({
        leaveTypeId: "",
        fromDate: "",
        toDate: "",
        reason: "",
    });

    // Only the leave types HR has marked Active show up in the "your balances"
    // cards above the table. Everything else about leaveTypes (e.g. the Apply
    // Leave dropdown) still uses the full, unfiltered list.
    const activeLeaveTypes = leaveTypes.filter(isLeaveTypeActive);

    useEffect(() => {
        fetchLeaveData();
        fetchLeaveTypes(); // NEW — runs once, does not depend on balance init
    }, []);

    useEffect(() => {
        fetchLeaveRequests();
    }, [filterYear, filterMonth, filterStatus]);

    const fetchLeaveData = async () => {
        setLoading(true);
        await Promise.all([fetchLeaveBalance(), fetchLeaveRequests()]);
        setLoading(false);
    };

    // 1. Balance API Bind
    const fetchLeaveBalance = async () => {
        try {
            const res = await adminService.getMyLeaveBalance(filterYear);
            if (res.Success || res.success) {
                setBalances(res.Data || res.data || []);
            }
        } catch (error) {
            console.error("Error fetching balance:", error);
        }
    };

    // NEW — Leave Types API Bind (GET /api/leave/types)
    // This is what actually drives the "Apply Leave" dropdown. It's independent
    // of whether an admin has "Initialize Balance"'d this employee for the
    // selected year — so the dropdown is never empty just because balance
    // setup hasn't happened yet.
    const fetchLeaveTypes = async () => {
        try {
            const res = await adminService.getLeaveTypes();
            if (res.Success || res.success) {
                setLeaveTypes(res.Data || res.data || []);
            }
        } catch (error) {
            console.error("Error fetching leave types:", error);
        }
    };

    // 2. Requests API Bind
    const fetchLeaveRequests = async () => {
        setRequestsLoading(true);
        try {
            const queryParams: Record<string, any> = { year: filterYear };
            if (filterMonth) queryParams.month = filterMonth;
            if (filterStatus) queryParams.status = filterStatus;

            const res = await adminService.getMyLeaveRequests(queryParams);
            if (res.Success || res.success) {
                setRequests(res.Data || res.data || []);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setRequestsLoading(false);
        }
    };

    // 3. Apply Leave submit
    const handleApplyLeave = async (e) => {
        e.preventDefault();
        setApplyError("");

        if (!form.leaveTypeId || !form.fromDate || !form.toDate) {
            setApplyError("Leave type, from date and to date are required.");
            return;
        }

        // TotalDays is a required decimal on SelfLeaveRequestDto — compute it
        // from the date range (inclusive) since the form doesn't collect it directly.
        const msPerDay = 1000 * 60 * 60 * 24;
        const from = new Date(form.fromDate);
        const to = new Date(form.toDate);
        const totalDays = Math.round((to.getTime() - from.getTime()) / msPerDay) + 1;

        if (totalDays < 1) {
            setApplyError("To date must be on or after the from date.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                leaveTypeId: Number(form.leaveTypeId),
                fromDate: form.fromDate,
                toDate: form.toDate,
                totalDays,
                reason: form.reason,
            };

            const res = await adminService.applyLeave(payload);

            if (res.Success || res.success) {
                const applied = res.Data || res.data;

                // Bind the API response straight into the table — instant feedback,
                // no need to wait for a full refetch.
                setRequests((prev) => [applied, ...prev]);

                setShowApplyModal(false);
                setForm({ leaveTypeId: "", fromDate: "", toDate: "", reason: "" });
                setApplySuccess(`Leave request for ${applied.leaveName} submitted successfully.`);
                setTimeout(() => setApplySuccess(""), 3000);

                // Balance changed (usedLeaves/balanceLeaves) — refresh it in the background
                fetchLeaveBalance();
            } else {
                setApplyError(res.Message || res.message || "Failed to submit leave request.");
            }
        } catch (error) {
            console.error("Error applying leave:", error);
            setApplyError(error.message || "Something went wrong while submitting your leave request.");
        } finally {
            setSubmitting(false);
        }
    };

    // Live day-count preview shown inside the modal as dates are picked
    const previewDays = (() => {
        if (!form.fromDate || !form.toDate) return null;
        const msPerDay = 1000 * 60 * 60 * 24;
        const n = Math.round((new Date(form.toDate).getTime() - new Date(form.fromDate).getTime()) / msPerDay) + 1;
        return n >= 1 ? n : null;
    })();

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            {/* ── Header & Apply Button ── */}
            <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Leaves</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage your leave balances and request history.</p>
                </div>
                <button
                    onClick={() => setShowApplyModal(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-amber-200 transition-all active:scale-[0.98]"
                >
                    <Icon.Plus className="w-4 h-4" />
                    Apply Leave
                </button>
            </div>

            {applySuccess && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium px-4 py-3 rounded-xl animate-in fade-in duration-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <Icon.Check className="w-3 h-3" />
                    </span>
                    {applySuccess}
                </div>
            )}

            {/* ── Leave Balances (Cards with progress rings) ── */}
            {/* Only Active leave types are shown here — Inactive ones (e.g. a leave
                type HR turned off) are filtered out via activeLeaveTypes. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => <BalanceCardSkeleton key={i} />)
                ) : activeLeaveTypes.length === 0 ? (
                    <div className="md:col-span-3 bg-white rounded-2xl border border-dashed border-slate-200 py-8 text-center text-slate-400 text-sm">
                        No leave types configured yet. Contact HR/Admin.
                    </div>
                ) : (
                    // 🆕 Har active leaveType ke liye card dikhao — chahe balance initialize hua ho ya nahi.
                    // Isse HR ke naye leave type add karte hi wo turant yahan dikhega. Inactive leave
                    // types yahan bilkul nahi dikhaye jaate (activeLeaveTypes already filter kar chuka hai).
                    activeLeaveTypes.map((t, i) => {
                        const accent = LEAVE_ACCENTS[i % LEAVE_ACCENTS.length];
                        const b = balances.find((bal) => bal.leaveTypeId === t.leaveTypeId);

                        const pendingDays = requests
                            .filter((r) => r.leaveTypeId === t.leaveTypeId && r.status === "Pending")
                            .reduce((sum, r) => sum + Number(r.totalDays || 0), 0);

                        // 🆕 Agar HR ne is employee ke liye is leave type ka balance abhi tak
                        // "Initialize Balance" se initialize nahi kiya, to yahan ek default/synthetic
                        // balance bana lo (poora quota available, 0 used) — leave type ke apne
                        // maxPerYear se. Isse employee ko "contact HR" placeholder ki jagah turant
                        // apna leave quota dikh jaata hai, chahe HR ne abhi tak record initialize
                        // kiya ho ya nahi. Actual applied/approved leaves already `requests` se
                        // pendingDays ke through reflect ho rahe hain upar; agar zaroorat pade to
                        // yahan bhi approved requests ka totalDays minus kiya ja sakta hai.
                        const displayBalance = b ?? {
                            leaveName: t.leaveName,
                            totalLeaves: t.maxPerYear ?? 0,
                            usedLeaves: 0,
                            balanceLeaves: t.maxPerYear ?? 0,
                        };

                        return (
                            <div key={`leave-${t.leaveTypeId}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                <div className={`relative flex items-center justify-center rounded-full ${accent.wash}`}>
                                    <BalanceRing used={displayBalance.usedLeaves} total={displayBalance.totalLeaves} accent={accent.ring} />
                                    <span className={`absolute text-[13px] font-bold ${accent.text}`}>
                                        {displayBalance.balanceLeaves}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-700 truncate">{displayBalance.leaveName}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {displayBalance.balanceLeaves} of {displayBalance.totalLeaves} left · {displayBalance.usedLeaves} used
                                    </p>
                                    {pendingDays > 0 && (
                                        <p className="text-[11px] text-amber-600 font-semibold mt-1 inline-flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                            {pendingDays} day(s) pending approval
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Leave Requests Table Section ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-3">
                    <select
                        value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                    >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                    </select>
                    <select
                        value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                    >
                        <option value="">All Months</option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                    </select>

                    {/* Status filter as pill toggle group instead of a plain select */}
                    <div className="flex items-center gap-1.5 ml-auto bg-white border border-slate-200 rounded-lg p-1">
                        {["", "Pending", "Approved", "Rejected"].map((s) => (
                            <button
                                key={s || "all"}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${filterStatus === s
                                    ? "bg-amber-600 text-white shadow-sm"
                                    : "text-slate-500 hover:bg-slate-50"
                                    }`}
                            >
                                {s || "All"}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Leave Type</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Days</th>
                                <th className="px-6 py-4">Reason</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {requestsLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-3 w-24 bg-slate-100 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-3 w-32 bg-slate-100 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-3 w-10 bg-slate-100 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-3 w-40 bg-slate-100 rounded" /></td>
                                        <td className="px-6 py-4 text-right"><div className="h-3 w-16 bg-slate-100 rounded ml-auto" /></td>
                                    </tr>
                                ))
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-14">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <Icon.Inbox className="w-8 h-8" />
                                            <p className="text-sm font-medium text-slate-500">No leave requests found</p>
                                            <p className="text-xs">Adjust the filters above, or apply for a new leave.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                requests.map(req => (
                                    <tr key={req.leaveId} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-700">{req.leaveName}</td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(req.fromDate).toLocaleDateString()} <span className="text-xs text-slate-400 mx-1">to</span> {new Date(req.toDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600">{req.totalDays} Day(s)</td>
                                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{req.reason}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[req.status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[req.status] || "bg-slate-400"}`} />
                                                {req.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Apply Leave Modal ── */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <Icon.Calendar className="w-5 h-5" />
                                </span>
                                <div>
                                    <h2 className="text-base font-bold text-slate-800">Apply Leave</h2>
                                    <p className="text-xs text-slate-400">Submit a new leave request</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowApplyModal(false)}
                                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
                            >
                                <Icon.Close className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleApplyLeave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Leave Type
                                </label>
                                <select
                                    value={form.leaveTypeId}
                                    onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                                >
                                    <option value="">Select leave type</option>
                                    {leaveTypes.map((t) => {
                                        // Cross-reference with balances (if initialized) to show
                                        // remaining days; falls back to a clear "not set" hint
                                        // so the dropdown is never empty just because balance
                                        // hasn't been initialized by HR yet.
                                        const bal = balances.find((b) => b.leaveTypeId === t.leaveTypeId);
                                        return (
                                            <option key={t.leaveTypeId} value={t.leaveTypeId}>
                                                {t.leaveName}{bal ? ` (${bal.balanceLeaves} left)` : " (balance not set)"}
                                            </option>
                                        );
                                    })}
                                </select>
                                {leaveTypes.length === 0 && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        No leave types configured yet. Contact HR/Admin.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        From Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.fromDate}
                                        onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                        To Date
                                    </label>
                                    <input
                                        type="date"
                                        value={form.toDate}
                                        onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            {previewDays && (
                                <p className="text-xs text-amber-600 font-medium bg-amber-50 rounded-lg px-3 py-2">
                                    This request covers {previewDays} day{previewDays > 1 ? "s" : ""}.
                                </p>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Reason
                                </label>
                                <textarea
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-400"
                                    placeholder="Reason for leave"
                                />
                            </div>

                            {applyError && (
                                <p className="text-sm text-red-600">{applyError}</p>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowApplyModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]"
                                >
                                    {submitting ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}