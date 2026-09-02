import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";

// ── Small inline icon set ──
const Icon = {
    Plus: (p: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...p}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    ),
    Calendar: (p: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
        </svg>
    ),
    Close: (p: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    ),
    Inbox: (p: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
        </svg>
    ),
    Check: (p: any) => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M20 6 9 17l-5-5" />
        </svg>
    ),
};

const STATUS_DOT: Record<string, string> = {
    Approved: "bg-emerald-500",
    Pending: "bg-amber-500",
    Rejected: "bg-rose-500",
};

const STATUS_BADGE: Record<string, string> = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    Pending: "bg-amber-50 text-amber-700 border-amber-200/50",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200/50",
};

const LEAVE_ACCENTS = [
    { ring: "#f59e0b", wash: "bg-amber-50", text: "text-amber-600" },
    { ring: "#3b82f6", wash: "bg-blue-50", text: "text-blue-600" },
    { ring: "#10b981", wash: "bg-emerald-50", text: "text-emerald-600" },
    { ring: "#8b5cf6", wash: "bg-purple-50", text: "text-purple-600" },
];

// Circular progress ring
function BalanceRing({ used, total, accent }: { used: number; total: number; accent: string }) {
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

const isLeaveTypeActive = (t: any) => {
    if (typeof t.isActive === "boolean") return t.isActive;
    if (typeof t.IsActive === "boolean") return t.IsActive;
    if (typeof t.status === "string") return t.status.toLowerCase() !== "inactive";
    if (typeof t.Status === "string") return t.Status.toLowerCase() !== "inactive";
    return true;
};

// Common Input Styles
const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm";
const labelClass = "block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1";

export default function MyLeaves() {
    const [balances, setBalances] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
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
        halfDay: false,
    });

    // ── Edit Leave modal state ──
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<any>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState("");
    const [editForm, setEditForm] = useState({
        leaveTypeId: "",
        fromDate: "",
        toDate: "",
        reason: "",
        halfDay: false,
    });

    // ── Cancel Leave state ──
    const [cancellingId, setCancellingId] = useState<number | string | null>(null);
    const [confirmCancelId, setConfirmCancelId] = useState<number | string | null>(null);

    const activeLeaveTypes = leaveTypes.filter(isLeaveTypeActive);

    useEffect(() => {
        fetchLeaveData();
        fetchLeaveTypes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchLeaveRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterYear, filterMonth, filterStatus]);

    const fetchLeaveData = async () => {
        setLoading(true);
        await Promise.all([fetchLeaveBalance(), fetchLeaveRequests()]);
        setLoading(false);
    };

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

    const fetchLeaveRequests = async () => {
        setRequestsLoading(true);
        try {
            // FIXED: Explicitly typed queryParams to allow adding arbitrary keys
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

    const handleApplyLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        setApplyError("");

        if (!form.leaveTypeId || !form.fromDate || (!form.halfDay && !form.toDate)) {
            setApplyError("Leave type, from date and to date are required.");
            return;
        }

        const effectiveToDate = form.halfDay ? form.fromDate : form.toDate;

        let totalDays: number;
        if (form.halfDay) {
            totalDays = 0.5;
        } else {
            const msPerDay = 1000 * 60 * 60 * 24;
            const from = new Date(form.fromDate);
            const to = new Date(form.toDate);
            totalDays = Math.round((to.getTime() - from.getTime()) / msPerDay) + 1;
        }

        if (totalDays < 0.5) {
            setApplyError("To date must be on or after the from date.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                leaveTypeId: Number(form.leaveTypeId),
                fromDate: form.fromDate,
                toDate: effectiveToDate,
                totalDays,
                reason: form.reason,
            };

            const res = await adminService.applyLeave(payload);

            if (res.Success || res.success) {
                const applied = res.Data || res.data;
                setRequests((prev) => [applied, ...prev]);

                setShowApplyModal(false);
                setForm({ leaveTypeId: "", fromDate: "", toDate: "", reason: "", halfDay: false });
                setApplySuccess(`Leave request for ${applied.leaveName} submitted successfully.`);
                setTimeout(() => setApplySuccess(""), 3000);

                fetchLeaveBalance();
            } else {
                setApplyError(res.Message || res.message || "Failed to submit leave request.");
            }
        } catch (error: any) {
            console.error("Error applying leave:", error);
            setApplyError(error.message || "Something went wrong while submitting your leave request.");
        } finally {
            setSubmitting(false);
        }
    };

    const previewDays = (() => {
        if (form.halfDay) return form.fromDate ? 0.5 : null;
        if (!form.fromDate || !form.toDate) return null;
        const msPerDay = 1000 * 60 * 60 * 24;
        const n = Math.round((new Date(form.toDate).getTime() - new Date(form.fromDate).getTime()) / msPerDay) + 1;
        return n >= 1 ? n : null;
    })();

    // ── Edit Leave: open modal pre-filled with the selected request ──
    const openEditModal = (req: any) => {
        setEditingRequest(req);
        setEditError("");
        const isHalfDay = Number(req.totalDays) === 0.5;
        setEditForm({
            leaveTypeId: String(req.leaveTypeId ?? ""),
            fromDate: req.fromDate ? String(req.fromDate).slice(0, 10) : "",
            toDate: isHalfDay
                ? (req.fromDate ? String(req.fromDate).slice(0, 10) : "")
                : (req.toDate ? String(req.toDate).slice(0, 10) : ""),
            reason: req.reason || "",
            halfDay: isHalfDay,
        });
        setShowEditModal(true);
    };

    const editPreviewDays = (() => {
        if (editForm.halfDay) return editForm.fromDate ? 0.5 : null;
        if (!editForm.fromDate || !editForm.toDate) return null;
        const msPerDay = 1000 * 60 * 60 * 24;
        const n = Math.round((new Date(editForm.toDate).getTime() - new Date(editForm.fromDate).getTime()) / msPerDay) + 1;
        return n >= 1 ? n : null;
    })();

    const handleUpdateLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError("");

        if (!editingRequest) return;

        if (!editForm.leaveTypeId || !editForm.fromDate || (!editForm.halfDay && !editForm.toDate)) {
            setEditError("Leave type, from date and to date are required.");
            return;
        }

        const effectiveToDate = editForm.halfDay ? editForm.fromDate : editForm.toDate;

        let totalDays: number;
        if (editForm.halfDay) {
            totalDays = 0.5;
        } else {
            const msPerDay = 1000 * 60 * 60 * 24;
            const from = new Date(editForm.fromDate);
            const to = new Date(editForm.toDate);
            totalDays = Math.round((to.getTime() - from.getTime()) / msPerDay) + 1;
        }

        if (totalDays < 0.5) {
            setEditError("To date must be on or after the from date.");
            return;
        }

        setEditSubmitting(true);
        try {
            const payload = {
                leaveTypeId: Number(editForm.leaveTypeId),
                fromDate: editForm.fromDate,
                toDate: effectiveToDate,
                totalDays,
                reason: editForm.reason,
            };

            const res = await adminService.updateLeaveRequest(editingRequest.leaveId, payload);


            if (res.Success || res.success) {
                const updated = res.Data || res.data || { ...editingRequest, ...payload };
                setRequests((prev) => prev.map((r: any) => (r.leaveId === editingRequest.leaveId ? updated : r)));

                setShowEditModal(false);
                setEditingRequest(null);
                setApplySuccess(`Leave request for ${updated.leaveName || editingRequest.leaveName} updated successfully.`);
                setTimeout(() => setApplySuccess(""), 3000);

                fetchLeaveBalance();
            } else {
                setEditError(res.Message || res.message || "Failed to update leave request.");
            }
        } catch (error: any) {
            console.error("Error updating leave:", error);
            setEditError(error.message || "Something went wrong while updating your leave request.");
        } finally {
            setEditSubmitting(false);
        }
    };

    // ── Cancel Leave ──
    const handleCancelLeave = async (req: any) => {
        setCancellingId(req.leaveId);
        try {
            const res = await adminService.cancelLeaveRequest(req.leaveId);
            if (res.Success || res.success) {
                setApplySuccess(`Leave request for ${req.leaveName} cancelled.`);
                setTimeout(() => setApplySuccess(""), 3000);

                // refetch instead of trusting local filter — keeps UI in sync with server
                await Promise.all([fetchLeaveRequests(), fetchLeaveBalance()]);
            } else {
                console.error(res.Message || res.message || "Failed to cancel leave request.");
            }
        } catch (error) {
            console.error("Error cancelling leave:", error);
        } finally {
            setCancellingId(null);
            setConfirmCancelId(null);
        }
    };

    return (
        <div className="space-y-6 font-sans relative z-0 pb-10">

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-calendar-minus text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">My Leaves</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Manage your leave balances and request history.</p>
                    </div>
                </div>
                <div className="relative z-10 w-full sm:w-auto">
                    <button
                        onClick={() => setShowApplyModal(true)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 text-[#0b2836] font-bold rounded-xl text-xs shadow-md shadow-amber-400/20 hover:bg-amber-500 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-plus" /> Apply Leave
                    </button>
                </div>
            </div>

            {applySuccess && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold px-5 py-3.5 rounded-xl shadow-sm animate-in fade-in duration-300">
                    <i className="fa-solid fa-circle-check text-lg" /> {applySuccess}
                </div>
            )}

            {/* ── Leave Balances (Cards with progress rings) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <BalanceCardSkeleton key={i} />)
                ) : activeLeaveTypes.length === 0 ? (
                    <div className="lg:col-span-4 bg-white rounded-2xl border border-dashed border-slate-200 py-10 flex flex-col items-center justify-center text-center shadow-sm">
                        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <i className="fa-solid fa-calendar-xmark text-2xl text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-500">No leave types configured yet.</p>
                        <p className="text-xs font-medium text-slate-400 mt-1">Please contact your HR or Administrator.</p>
                    </div>
                ) : (
                    activeLeaveTypes.map((t, i) => {
                        const accent = LEAVE_ACCENTS[i % LEAVE_ACCENTS.length];
                        const b = balances.find((bal: any) => bal.leaveTypeId === t.leaveTypeId);

                        const pendingDays = requests
                            .filter((r: any) => r.leaveTypeId === t.leaveTypeId && r.status === "Pending")
                            .reduce((sum, r: any) => sum + Number(r.totalDays || 0), 0);

                        const displayBalance = b ?? {
                            leaveName: t.leaveName,
                            totalLeaves: t.maxPerYear ?? 0,
                            usedLeaves: 0,
                            balanceLeaves: t.maxPerYear ?? 0,
                        };

                        return (
                            <div key={`leave-${t.leaveTypeId}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`relative flex items-center justify-center rounded-full ${accent.wash}`}>
                                        <BalanceRing used={displayBalance.usedLeaves} total={displayBalance.totalLeaves} accent={accent.ring} />
                                        <span className={`absolute text-[13px] font-bold ${accent.text}`}>
                                            {displayBalance.balanceLeaves}
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-800 truncate">{displayBalance.leaveName}</p>
                                        <p className="text-xs font-medium text-slate-400 mt-1">
                                            {displayBalance.totalLeaves} total &middot; {displayBalance.usedLeaves} used
                                        </p>
                                    </div>
                                </div>
                                {pendingDays > 0 && (
                                    <div className="bg-amber-50/50 border border-amber-100 rounded-lg py-1.5 px-3 flex items-center justify-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">{pendingDays} day(s) pending</span>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Leave Requests Table Section ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-end gap-4">
                    <div className="w-32">
                        <label className={labelClass}>Year</label>
                        <select
                            value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}
                            className={`${inputClass} cursor-pointer appearance-none`}
                        >
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                        </select>
                    </div>
                    <div className="w-36">
                        <label className={labelClass}>Month</label>
                        <select
                            value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                            className={`${inputClass} cursor-pointer appearance-none`}
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
                    </div>
                    <div className="flex-1 min-w-[200px] flex justify-end">
                        <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm w-full sm:w-auto">
                            {["", "Pending", "Approved", "Rejected"].map((s) => (
                                <button
                                    key={s || "all"}
                                    onClick={() => setFilterStatus(s)}
                                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${filterStatus === s
                                        ? "bg-amber-500 text-white shadow-md"
                                        : "text-slate-500 hover:bg-slate-50"
                                        }`}
                                >
                                    {s || "All"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                        <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Leave Type</th>
                                <th className="px-6 py-4">Duration</th>
                                <th className="px-6 py-4">Days</th>
                                <th className="px-6 py-4">Reason</th>
                                <th className="px-6 py-4 text-right">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {requestsLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="relative w-10 h-10 flex items-center justify-center">
                                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Loading leave history...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                                            <i className="fa-solid fa-inbox" />
                                        </div>
                                        <p className="text-base font-bold text-slate-700">No Leave Requests</p>
                                        <p className="text-sm text-slate-400 mt-1 font-medium">Try adjusting your filters or apply for a new leave.</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req: any) => (
                                    <tr key={req.leaveId} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{req.leaveName}</td>
                                        <td className="px-6 py-4 font-medium text-slate-600">
                                            {new Date(req.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            <span className="text-xs text-slate-400 mx-2">to</span>
                                            {new Date(req.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-amber-600">{req.totalDays} Day(s)</td>
                                        <td className="px-6 py-4 font-medium text-slate-500 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide ${STATUS_BADGE[req.status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[req.status] || "bg-slate-400"}`} />
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === "Pending" ? (
                                                confirmCancelId === req.leaveId ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-[11px] font-bold text-slate-500">Cancel this?</span>
                                                        <button
                                                            onClick={() => handleCancelLeave(req)}
                                                            disabled={cancellingId === req.leaveId}
                                                            className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-bold hover:bg-rose-600 disabled:opacity-60 transition-colors"
                                                        >
                                                            {cancellingId === req.leaveId ? "..." : "Yes"}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmCancelId(null)}
                                                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200 transition-colors"
                                                        >
                                                            No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openEditModal(req)}
                                                            title="Edit"
                                                            className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                        >
                                                            <i className="fa-solid fa-pen text-xs" />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmCancelId(req.leaveId)}
                                                            title="Cancel"
                                                            className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                        >
                                                            <i className="fa-solid fa-trash-can text-xs" />
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                <span className="text-[11px] text-slate-300 font-medium flex justify-end">—</span>
                                            )}
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-7 w-full max-w-md relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <i className="fa-solid fa-calendar-plus text-amber-500" /> Apply Leave
                            </h3>
                            <button
                                onClick={() => setShowApplyModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleApplyLeave} className="space-y-5">
                            <div>
                                <label className={labelClass}>Leave Type *</label>
                                <select
                                    value={form.leaveTypeId}
                                    onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                                    className={`${inputClass} cursor-pointer appearance-none`}
                                    required
                                >
                                    <option value="" disabled>-- Select leave type --</option>
                                    {activeLeaveTypes.map((t: any) => {
                                        const bal: any = balances.find((b: any) => b.leaveTypeId === t.leaveTypeId);
                                        return (
                                            <option key={t.leaveTypeId} value={t.leaveTypeId}>
                                                {t.leaveName}{bal ? ` (${bal.balanceLeaves} left)` : " (balance not set)"}
                                            </option>
                                        );
                                    })}
                                </select>
                                {activeLeaveTypes.length === 0 && (
                                    <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">No leave types configured yet.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>From Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.fromDate}
                                        onChange={(e) => setForm({ ...form, fromDate: e.target.value, toDate: form.halfDay ? e.target.value : form.toDate })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>To Date *</label>
                                    <input
                                        type="date"
                                        required={!form.halfDay}
                                        disabled={form.halfDay}
                                        value={form.halfDay ? form.fromDate : form.toDate}
                                        onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                                        className={`${inputClass} ${form.halfDay ? "opacity-50 cursor-not-allowed" : ""}`}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2.5 cursor-pointer select-none -mt-1">
                                <input
                                    type="checkbox"
                                    checked={form.halfDay}
                                    onChange={(e) => setForm({ ...form, halfDay: e.target.checked, toDate: e.target.checked ? form.fromDate : form.toDate })}
                                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                                />
                                <span className="text-xs font-bold text-slate-600">Half Day</span>
                            </label>

                            {previewDays && (
                                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex items-center gap-2">
                                    <i className="fa-solid fa-circle-info text-amber-500" />
                                    <p className="text-xs font-bold text-amber-700">
                                        This request covers {previewDays} day{previewDays > 1 ? "s" : ""}.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Reason *</label>
                                <textarea
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    rows={3}
                                    required
                                    className={`${inputClass} resize-y`}
                                    placeholder="Brief reason for your leave request..."
                                />
                            </div>

                            {applyError && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                                    <i className="fa-solid fa-triangle-exclamation" /> {applyError}
                                </div>
                            )}

                            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowApplyModal(false)}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-600/20 hover:bg-amber-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 transition-all flex items-center gap-2"
                                >
                                    {submitting ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-paper-plane" />}
                                    {submitting ? "Submitting..." : "Submit Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Edit Leave Modal ── */}
            {showEditModal && editingRequest && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-7 w-full max-w-md relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <i className="fa-solid fa-pen text-amber-500" /> Edit Leave Request
                            </h3>
                            <button
                                onClick={() => { setShowEditModal(false); setEditingRequest(null); }}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateLeave} className="space-y-5">
                            <div>
                                <label className={labelClass}>Leave Type *</label>
                                <select
                                    value={editForm.leaveTypeId}
                                    onChange={(e) => setEditForm({ ...editForm, leaveTypeId: e.target.value })}
                                    className={`${inputClass} cursor-pointer appearance-none`}
                                    required
                                >
                                    <option value="" disabled>-- Select leave type --</option>
                                    {activeLeaveTypes.map((t: any) => {
                                        const bal: any = balances.find((b: any) => b.leaveTypeId === t.leaveTypeId);
                                        return (
                                            <option key={t.leaveTypeId} value={t.leaveTypeId}>
                                                {t.leaveName}{bal ? ` (${bal.balanceLeaves} left)` : " (balance not set)"}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>From Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={editForm.fromDate}
                                        onChange={(e) => setEditForm({ ...editForm, fromDate: e.target.value, toDate: editForm.halfDay ? e.target.value : editForm.toDate })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>To Date *</label>
                                    <input
                                        type="date"
                                        required={!editForm.halfDay}
                                        disabled={editForm.halfDay}
                                        value={editForm.halfDay ? editForm.fromDate : editForm.toDate}
                                        onChange={(e) => setEditForm({ ...editForm, toDate: e.target.value })}
                                        className={`${inputClass} ${editForm.halfDay ? "opacity-50 cursor-not-allowed" : ""}`}
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2.5 cursor-pointer select-none -mt-1">
                                <input
                                    type="checkbox"
                                    checked={editForm.halfDay}
                                    onChange={(e) => setEditForm({ ...editForm, halfDay: e.target.checked, toDate: e.target.checked ? editForm.fromDate : editForm.toDate })}
                                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                                />
                                <span className="text-xs font-bold text-slate-600">Half Day</span>
                            </label>

                            {editPreviewDays && (
                                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex items-center gap-2">
                                    <i className="fa-solid fa-circle-info text-amber-500" />
                                    <p className="text-xs font-bold text-amber-700">
                                        This request covers {editPreviewDays} day{editPreviewDays > 1 ? "s" : ""}.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Reason *</label>
                                <textarea
                                    value={editForm.reason}
                                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                    rows={3}
                                    required
                                    className={`${inputClass} resize-y`}
                                    placeholder="Brief reason for your leave request..."
                                />
                            </div>

                            {editError && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                                    <i className="fa-solid fa-triangle-exclamation" /> {editError}
                                </div>
                            )}

                            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowEditModal(false); setEditingRequest(null); }}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editSubmitting}
                                    className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-600/20 hover:bg-amber-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 transition-all flex items-center gap-2"
                                >
                                    {editSubmitting ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-check" />}
                                    {editSubmitting ? "Updating..." : "Update Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}