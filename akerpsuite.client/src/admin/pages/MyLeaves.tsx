import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";

type Stage =
    | "Awaiting Reliever"
    | "Awaiting HR"
    | "Forwarded"
    | "Approved"
    | "Rejected by Reliever"
    | "Rejected"
    | "Cancelled";

function getStage(req: any): Stage {
    const status = req.status;
    const rel = req.relieverStatus;

    if (status === "Pending") {
        return rel === "Pending" ? "Awaiting Reliever" : "Awaiting HR";
    }
    if (status === "Rejected" && rel === "Rejected") return "Rejected by Reliever";
    return status as Stage;
}

const STAGE_DOT: Record<string, string> = {
    "Awaiting Reliever": "bg-violet-500",
    "Awaiting HR": "bg-amber-500",
    Forwarded: "bg-blue-500",
    Approved: "bg-emerald-500",
    "Rejected by Reliever": "bg-rose-500",
    Rejected: "bg-rose-500",
    Cancelled: "bg-slate-400",
};

const STAGE_BADGE: Record<string, string> = {
    "Awaiting Reliever": "bg-violet-50 text-violet-700 border-violet-200/50",
    "Awaiting HR": "bg-amber-50 text-amber-700 border-amber-200/50",
    Forwarded: "bg-blue-50 text-blue-700 border-blue-200/50",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    "Rejected by Reliever": "bg-rose-50 text-rose-700 border-rose-200/50",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200/50",
    Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

// Filter backend `status` par chalta hai, isliye wahi values rakhi hain
const STATUS_FILTERS = ["", "Pending", "Forwarded", "Approved", "Rejected", "Cancelled"];

// "" = All (pehle)
const RELIEVER_FILTERS = ["", "Pending", "Accepted", "Rejected"];

const RELIEVER_BADGE: Record<string, string> = {
    Pending: "bg-violet-50 text-violet-700 border-violet-200/50",
    Accepted: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200/50",
};

const LEAVE_ACCENTS = [
    { ring: "#f59e0b", wash: "bg-amber-50", text: "text-amber-600" },
    { ring: "#3b82f6", wash: "bg-blue-50", text: "text-blue-600" },
    { ring: "#10b981", wash: "bg-emerald-50", text: "text-emerald-600" },
    { ring: "#8b5cf6", wash: "bg-purple-50", text: "text-purple-600" },
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Ek din ke working ghante. appsettings.json ke "Leave:ShiftHours" se same rakho.
const SHIFT_HOURS = 8;

// Short leave max ghante. C# service ke MaxShortLeaveHours aur SP ke v_max_short_hours se same rakho.
const SHORT_LEAVE_MAX_HOURS = 3;

// Leave ki pehli date par is ghante (subah) tak hi cancel ho sakti hai
const CANCEL_CUTOFF_HOUR = 8;

const cancelDeadline = (req: any) => {
    const d = new Date(String(req.fromDate).slice(0, 10) + "T00:00:00");
    d.setHours(CANCEL_CUTOFF_HOUR, 0, 0, 0);
    return d;
};

function calcDays(from: string, to: string, halfDay: boolean): number | null {
    if (!from) return null;
    if (halfDay) return 0.5;
    if (!to) return null;
    const n = Math.round((new Date(to).getTime() - new Date(from).getTime()) / MS_PER_DAY) + 1;
    return n >= 1 ? n : null;
}

// ── Short leave helpers ──
const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

function calcShortHours(fromTime: string, toTime: string): number | null {
    if (!fromTime || !toTime) return null;
    const diff = toMinutes(toTime) - toMinutes(fromTime);
    return diff > 0 ? Math.round((diff / 60) * 100) / 100 : null;
}

// "09:30:00" -> "09:30"
const fmtTime = (t?: string | null) => (t ? String(t).slice(0, 5) : "");

// Backend TimeSpan ko "HH:mm:ss" chahiye, <input type="time"> "HH:mm" deta hai
const withSeconds = (t: string) => (t.length === 5 ? `${t}:00` : t);

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

// Circular progress ring
function BalanceRing({ used, total, accent }: { used: number; total: number; accent: string }) {
    const size = 56;
    const stroke = 5;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = total > 0 ? Math.min(Math.max(used / total, 0), 1) : 0;
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

// ── Reliever dropdown (required) — shared by Apply + Edit ──
function RelieverSelect({
    value, onChange, relievers, loading, fallback,
}: {
    value: string;
    onChange: (v: string) => void;
    relievers: any[];
    loading: boolean;
    fallback?: { id: string; name: string } | null;
}) {
    const inList = relievers.some((r) => String(r.employeeId) === value);
    const showFallback = !!fallback && fallback.id === value && !inList;

    return (
        <div>
            <label className={labelClass}>Reliever *</label>
            <select
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={loading}
                className={`${inputClass} cursor-pointer ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
                <option value="">{loading ? "Loading employees..." : "Select reliever"}</option>
                {showFallback && <option value={fallback!.id}>{fallback!.name}</option>}
                {relievers.map((r: any) => (
                    <option key={r.employeeId} value={String(r.employeeId)}>
                        {r.name}{r.designation ? ` — ${r.designation}` : ""}
                    </option>
                ))}
            </select>
            {!loading && relievers.length === 0 && (
                <p className="text-[11px] text-rose-500 font-medium mt-1.5 ml-1">
                    Employee list could not be loaded. Please close and try again.
                </p>
            )}
            <p className="text-[11px] text-slate-400 font-medium mt-1.5 ml-1">
                Your request goes to the reliever first. After they accept, it goes to HR.
            </p>
        </div>
    );
}

const emptyForm = {
    fromDate: "",
    toDate: "",
    reason: "",
    halfDay: false,
    shortLeave: false,
    fromTime: "",
    toTime: "",
    relieverEmployeeId: "",
};

export default function MyLeaves() {
    const [balances, setBalances] = useState<any[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [requestsLoading, setRequestsLoading] = useState(false);

    const currentYear = new Date().getFullYear();
    const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

    const [filterYear, setFilterYear] = useState(currentYear);
    const [filterMonth, setFilterMonth] = useState("");
    const [filterStatus, setFilterStatus] = useState("");

    // ── Tabs: my requests / requests where I am the reliever ──
    const [activeTab, setActiveTab] = useState<"mine" | "reliever">("mine");

    // ── Reliever inbox ──
    const [relieverRequests, setRelieverRequests] = useState<any[]>([]);
    const [relieverLoading, setRelieverLoading] = useState(false);
    const [relieverFilter, setRelieverFilter] = useState(""); // "" = All
    const [pendingRelieverCount, setPendingRelieverCount] = useState(0);

    // Accept / Reject modal
    const [actionTarget, setActionTarget] = useState<{ req: any; action: "Accept" | "Reject" } | null>(null);
    const [actionRemarks, setActionRemarks] = useState("");
    const [actionSubmitting, setActionSubmitting] = useState(false);
    const [actionError, setActionError] = useState("");

    // ── Relievers (all active employees except self) ──
    const [relievers, setRelievers] = useState<any[]>([]);
    const [relieversLoading, setRelieversLoading] = useState(false);

    // ── Apply Leave modal state ──
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [applyError, setApplyError] = useState("");
    const [applySuccess, setApplySuccess] = useState("");
    const [form, setForm] = useState(emptyForm);

    // ── Edit Leave modal state ──
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<any>(null);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState("");
    const [editForm, setEditForm] = useState(emptyForm);

    // ── Cancel Leave state ──
    const [cancellingId, setCancellingId] = useState<number | string | null>(null);
    const [confirmCancelId, setConfirmCancelId] = useState<number | string | null>(null);
    const [cancelError, setCancelError] = useState("");

    // Short leave ka koi leave type nahi hota, balance cards normal types ke hi hain
    const activeLeaveTypes = leaveTypes.filter(isLeaveTypeActive);

    const shortHours = calcShortHours(form.fromTime, form.toTime);
    const shortDays = shortHours ? Math.round((shortHours / SHIFT_HOURS) * 100) / 100 : null;

    const previewDays = form.shortLeave ? null : calcDays(form.fromDate, form.toDate, form.halfDay);
    const editPreviewDays = calcDays(editForm.fromDate, editForm.toDate, editForm.halfDay);

    useEffect(() => {
        fetchLeaveData();
        fetchLeaveTypes();
        fetchPendingRelieverCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchLeaveRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterYear, filterMonth, filterStatus]);

    useEffect(() => {
        fetchLeaveBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterYear]);

    // Reliever tab ka data jab tab ya filter badle
    useEffect(() => {
        if (activeTab === "reliever") fetchRelieverRequests();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, relieverFilter]);

    // Modal khulte hi employees list load
    useEffect(() => {
        if (showApplyModal || showEditModal) fetchRelievers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showApplyModal, showEditModal]);

    const fetchRelievers = async () => {
        setRelieversLoading(true);
        try {
            const res = await adminService.getLeaveRelievers();
            if (res.Success || res.success) {
                setRelievers(res.Data || res.data || []);
            } else {
                setRelievers([]);
            }
        } catch (error) {
            console.error("Error fetching relievers:", error);
            setRelievers([]);
        } finally {
            setRelieversLoading(false);
        }
    };

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

    // ── Reliever inbox fetchers ──
    const fetchRelieverRequests = async () => {
        setRelieverLoading(true);
        try {
            const params: Record<string, any> = {};
            if (relieverFilter) params.status = relieverFilter;

            const res = await adminService.getRelieverRequests(params);
            if (res.Success || res.success) {
                setRelieverRequests(res.Data || res.data || []);
            }
        } catch (error) {
            console.error("Error fetching reliever requests:", error);
        } finally {
            setRelieverLoading(false);
        }
    };

    // Tab ke upar badge ke liye (sirf pending count)
    const fetchPendingRelieverCount = async () => {
        try {
            const res = await adminService.getRelieverRequests({ status: "Pending" });
            if (res.Success || res.success) {
                setPendingRelieverCount((res.Data || res.data || []).length);
            }
        } catch (error) {
            console.error("Error fetching reliever count:", error);
        }
    };

    const flashSuccess = (msg: string) => {
        setApplySuccess(msg);
        setTimeout(() => setApplySuccess(""), 3000);
    };

    const openApplyModal = () => {
        setForm(emptyForm);
        setApplyError("");
        setShowApplyModal(true);
    };

    const closeApplyModal = () => {
        setShowApplyModal(false);
        setApplyError("");
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setEditingRequest(null);
        setEditError("");
    };

    // ── Apply ──
    const handleApplyLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        setApplyError("");

        const singleDay = form.halfDay || form.shortLeave;

        if (!form.fromDate || (!singleDay && !form.toDate)) {
            setApplyError("From date and to date are required.");
            return;
        }

        let totalDays: number | null;

        if (form.shortLeave) {
            if (shortHours === null) {
                setApplyError("To time must be after from time.");
                return;
            }
            if (shortHours > SHIFT_HOURS) {
                setApplyError("Short leave cannot be longer than a working day. Apply a full-day leave instead.");
                return;
            }
            totalDays = shortDays;
        } else {
            totalDays = calcDays(form.fromDate, form.toDate, form.halfDay);
        }

        if (totalDays === null) {
            setApplyError("To date must be on or after the from date.");
            return;
        }

        // CHANGE 1: reliever sirf normal leave me zaroori
        if (!form.shortLeave && !form.relieverEmployeeId) {
            setApplyError("Please select a reliever.");
            return;
        }

        setSubmitting(true);
        try {
            // CHANGE 2: payload me reliever hata diya
            const payload: any = {
                fromDate: form.fromDate,
                toDate: singleDay ? form.fromDate : form.toDate,
                totalDays,
                reason: form.reason,
            };

            if (form.shortLeave) {
                // Short leave: koi leaveTypeId / reliever nahi, sirf time fields
                payload.fromTime = withSeconds(form.fromTime);
                payload.toTime = withSeconds(form.toTime);
                payload.durationHours = shortHours;
            } else {
                payload.relieverEmployeeId = Number(form.relieverEmployeeId);
            }

            const res = await adminService.applyLeave(payload);

            if (res.Success || res.success) {
                const applied = res.Data || res.data;

                // SP ka SIGNAL error ErrorMessage me aata hai
                if (applied?.errorMessage) {
                    setApplyError(applied.errorMessage);
                    return;
                }

                const wasShort = form.shortLeave;
                closeApplyModal();
                setForm(emptyForm);
                // CHANGE 3: short leave ka message HR wala
                flashSuccess(
                    wasShort
                        ? "Short leave request sent to HR."
                        : "Leave request sent to your reliever. HR will see it after the reliever responds."
                );

                await Promise.all([fetchLeaveRequests(), fetchLeaveBalance()]);
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

    // ── Edit: open modal pre-filled ──
    const openEditModal = (req: any) => {
        setEditingRequest(req);
        setEditError("");
        const isHalfDay = Number(req.totalDays) === 0.5;
        const from = req.fromDate ? String(req.fromDate).slice(0, 10) : "";
        setEditForm({
            fromDate: from,
            toDate: isHalfDay ? from : (req.toDate ? String(req.toDate).slice(0, 10) : ""),
            reason: req.reason || "",
            halfDay: isHalfDay,
            shortLeave: false,
            fromTime: "",
            toTime: "",
            relieverEmployeeId: req.relieverEmployeeId ? String(req.relieverEmployeeId) : "",
        });
        setShowEditModal(true);
    };

    const handleUpdateLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError("");

        if (!editingRequest) return;

        if (!editForm.fromDate || (!editForm.halfDay && !editForm.toDate)) {
            setEditError("From date and to date are required.");
            return;
        }

        const totalDays = calcDays(editForm.fromDate, editForm.toDate, editForm.halfDay);
        if (totalDays === null) {
            setEditError("To date must be on or after the from date.");
            return;
        }

        if (!editForm.relieverEmployeeId) {
            setEditError("Please select a reliever.");
            return;
        }

        setEditSubmitting(true);
        try {
            const payload = {
                fromDate: editForm.fromDate,
                toDate: editForm.halfDay ? editForm.fromDate : editForm.toDate,
                totalDays,
                reason: editForm.reason,
                relieverEmployeeId: Number(editForm.relieverEmployeeId),
            };

            const res = await adminService.updateLeaveRequest(editingRequest.leaveId, payload);

            if (res.Success || res.success) {
                const updated = res.Data || res.data;

                if (updated?.errorMessage) {
                    setEditError(updated.errorMessage);
                    return;
                }

                closeEditModal();
                flashSuccess("Leave request updated successfully.");

                await Promise.all([fetchLeaveRequests(), fetchLeaveBalance()]);
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

    // ── Cancel ──
    const handleCancelLeave = async (req: any) => {
        setCancellingId(req.leaveId);
        setCancelError("");
        try {
            const res = await adminService.cancelLeaveRequest(req.leaveId);
            if (res.Success || res.success) {
                flashSuccess(`Leave request for ${req.leaveName || "selected type"} cancelled.`);
                await Promise.all([fetchLeaveRequests(), fetchLeaveBalance()]);
            } else {
                setCancelError(res.Message || res.message || "Failed to cancel leave request.");
            }
        } catch (error: any) {
            console.error("Error cancelling leave:", error);
            setCancelError(error.message || "Could not cancel this leave.");
        } finally {
            setCancellingId(null);
            setConfirmCancelId(null);
        }
    };

    // ── Reliever Accept / Reject ──
    const openActionModal = (req: any, action: "Accept" | "Reject") => {
        setActionTarget({ req, action });
        setActionRemarks("");
        setActionError("");
    };

    const closeActionModal = () => {
        setActionTarget(null);
        setActionRemarks("");
        setActionError("");
    };

    const handleRelieverAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionTarget) return;

        const { req, action } = actionTarget;

        if (action === "Reject" && !actionRemarks.trim()) {
            setActionError("Please add a reason for rejecting this request.");
            return;
        }

        setActionSubmitting(true);
        setActionError("");
        try {
            const res = await adminService.relieverAction(req.leaveId, {
                action,
                remarks: actionRemarks.trim() || null,
            });

            if (res.Success || res.success) {
                closeActionModal();
                flashSuccess(
                    action === "Accept"
                        ? "You accepted the request. It has been sent to HR."
                        : "You rejected the request."
                );
                await Promise.all([fetchRelieverRequests(), fetchPendingRelieverCount(), fetchLeaveRequests()]);
            } else {
                setActionError(res.Message || res.message || "Could not complete this action.");
            }
        } catch (error: any) {
            console.error("Error in reliever action:", error);
            setActionError(error.message || "Something went wrong. Please try again.");
        } finally {
            setActionSubmitting(false);
        }
    };

    // Edit tabhi jab reliever ne abhi accept nahi kiya.
    // Short leave edit nahi hoti (backend SP bhi block karta hai), cancel karke dobara apply karo.
    const canEdit = (req: any) =>
        req.status === "Pending" && req.relieverStatus !== "Accepted" && !req.isShortLeave;

    // Cancel: Pending / Forwarded / Approved, aur leave ki pehli date par subah 8:00 se pehle
    const canCancel = (req: any) =>
        ["Pending", "Forwarded", "Approved"].includes(req.status) &&
        new Date() < cancelDeadline(req);

    return (
        <div className="space-y-6 font-sans relative z-0 pb-10">

            {/* ── Header ── */}
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
                        onClick={openApplyModal}
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

            {cancelError && (
                <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-bold px-5 py-3.5 rounded-xl shadow-sm">
                    <i className="fa-solid fa-triangle-exclamation" /> {cancelError}
                    <button
                        onClick={() => setCancelError("")}
                        className="ml-auto text-rose-400 hover:text-rose-600"
                        title="Dismiss"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
            )}

            {/* ── Leave Balances ── */}
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

            {/* ── Tabs ── */}
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("mine")}
                    className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${activeTab === "mine"
                        ? "border-amber-500 text-amber-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    My requests
                </button>
                <button
                    onClick={() => setActiveTab("reliever")}
                    className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors flex items-center gap-2 ${activeTab === "reliever"
                        ? "border-amber-500 text-amber-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                >
                    Reliever requests
                    {pendingRelieverCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-violet-500 text-white text-[11px] font-bold flex items-center justify-center">
                            {pendingRelieverCount}
                        </span>
                    )}
                </button>
            </div>

            {/* ══════════ TAB: MY REQUESTS ══════════ */}
            {activeTab === "mine" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-end gap-4">
                        <div className="w-32">
                            <label className={labelClass}>Year</label>
                            <select
                                value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}
                                className={`${inputClass} cursor-pointer appearance-none`}
                            >
                                {yearOptions.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-36">
                            <label className={labelClass}>Month</label>
                            <select
                                value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                                className={`${inputClass} cursor-pointer appearance-none`}
                            >
                                <option value="">All Months</option>
                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, idx) => (
                                    <option key={m} value={String(idx + 1)}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px] flex justify-end">
                            <div className="bg-white border border-slate-200 rounded-xl p-1 flex flex-wrap shadow-sm w-full sm:w-auto">
                                {STATUS_FILTERS.map((s) => (
                                    <button
                                        key={s || "all"}
                                        onClick={() => setFilterStatus(s)}
                                        className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${filterStatus === s
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
                        <table className="w-full text-sm text-left border-collapse min-w-[960px]">
                            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Leave Type</th>
                                    <th className="px-6 py-4">Duration</th>
                                    <th className="px-6 py-4">Days</th>
                                    <th className="px-6 py-4">Reliever</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {requestsLoading ? (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center">
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
                                        <td colSpan={7} className="py-20 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                                                <i className="fa-solid fa-inbox" />
                                            </div>
                                            <p className="text-base font-bold text-slate-700">No Leave Requests</p>
                                            <p className="text-sm text-slate-400 mt-1 font-medium">Try adjusting your filters or apply for a new leave.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((req: any) => {
                                        const stage = getStage(req);
                                        return (
                                            <tr key={req.leaveId} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900">
                                                    {req.isShortLeave ? (
                                                        <span className="inline-flex items-center gap-1.5 text-violet-700">
                                                            <i className="fa-solid fa-clock text-xs" />
                                                            Short Leave
                                                        </span>
                                                    ) : req.leaveName ? (
                                                        req.leaveName
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-slate-400 italic font-semibold">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                            Pending Type
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Duration */}
                                                <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                                                    {req.isShortLeave && req.fromTime ? (
                                                        <>
                                                            {fmtDate(req.fromDate)}
                                                            <span className="block text-xs font-bold text-violet-600 mt-0.5">
                                                                {fmtTime(req.fromTime)} – {fmtTime(req.toTime)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {fmtDate(req.fromDate)}
                                                            <span className="text-xs text-slate-400 mx-2">to</span>
                                                            {fmtDate(req.toDate)}
                                                        </>
                                                    )}
                                                </td>

                                                {/* Days */}
                                                <td className="px-6 py-4 font-mono font-bold text-amber-600 whitespace-nowrap">
                                                    {req.isShortLeave ? (
                                                        <>
                                                            {req.durationHours} hr(s)
                                                            <span className="block text-[10px] font-semibold text-slate-400">
                                                                = {req.totalDays} day
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>{req.totalDays} Day(s)</>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 font-medium text-slate-600">
                                                    {req.relieverName ? (
                                                        <span className="inline-flex items-center gap-2">
                                                            <i className="fa-solid fa-user-shield text-xs text-slate-400" />
                                                            {req.relieverName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-500 max-w-xs">
                                                    <p className="truncate" title={req.reason}>{req.reason}</p>
                                                    {req.relieverStatus === "Rejected" && req.relieverRemarks && (
                                                        <p className="text-[11px] text-rose-500 mt-1 truncate" title={req.relieverRemarks}>
                                                            Reliever: {req.relieverRemarks}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${STAGE_BADGE[stage] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT[stage] || "bg-slate-400"}`} />
                                                        {stage}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {canCancel(req) ? (
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
                                                                {canEdit(req) && (
                                                                    <button
                                                                        onClick={() => openEditModal(req)}
                                                                        title="Edit"
                                                                        className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                                    >
                                                                        <i className="fa-solid fa-pen text-xs" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => { setCancelError(""); setConfirmCancelId(req.leaveId); }}
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
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════ TAB: RELIEVER REQUESTS ══════════ */}
            {activeTab === "reliever" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-500">
                            Colleagues who picked you as their reliever. Accept to send the request to HR.
                        </p>
                        <div className="bg-white border border-slate-200 rounded-xl p-1 flex flex-wrap shadow-sm">
                            {RELIEVER_FILTERS.map((s) => (
                                <button
                                    key={s || "all"}
                                    onClick={() => setRelieverFilter(s)}
                                    className={`px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${relieverFilter === s
                                        ? "bg-amber-500 text-white shadow-md"
                                        : "text-slate-500 hover:bg-slate-50"
                                        }`}
                                >
                                    {s || "All"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[260px]">
                        <table className="w-full text-sm text-left border-collapse min-w-[900px]">
                            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Leave Type</th>
                                    <th className="px-6 py-4">Duration</th>
                                    <th className="px-6 py-4">Days</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4 text-right">Your response</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {relieverLoading ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-sm font-semibold text-slate-400 animate-pulse">
                                            Loading requests...
                                        </td>
                                    </tr>
                                ) : relieverRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center">
                                            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-xl mb-3 border border-slate-100">
                                                <i className="fa-solid fa-user-check" />
                                            </div>
                                            <p className="text-base font-bold text-slate-700">No requests here</p>
                                            <p className="text-sm text-slate-400 mt-1 font-medium">
                                                {relieverFilter === "Pending"
                                                    ? "Nobody is waiting on you right now."
                                                    : relieverFilter === ""
                                                        ? "No one has picked you as reliever yet."
                                                        : "Try a different filter."}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    relieverRequests.map((r: any) => {
                                        const awaiting = r.relieverStatus === "Pending" && r.status === "Pending";
                                        // Time fields tabhi dikhenge jab reliever SP/DTO se aayein
                                        const relShort = !!r.fromTime;
                                        return (
                                            <tr key={r.leaveId} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-900">{r.employeeName}</td>
                                                <td className="px-6 py-4 font-medium text-slate-600">
                                                    {relShort ? "Short Leave" : (r.leaveType || r.leaveName || "—")}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                                                    {relShort ? (
                                                        <>
                                                            {fmtDate(r.fromDate)}
                                                            <span className="block text-xs font-bold text-violet-600 mt-0.5">
                                                                {fmtTime(r.fromTime)} – {fmtTime(r.toTime)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {fmtDate(r.fromDate)}
                                                            <span className="text-xs text-slate-400 mx-2">to</span>
                                                            {fmtDate(r.toDate)}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold text-amber-600 whitespace-nowrap">
                                                    {relShort && r.durationHours ? <>{r.durationHours} hr(s)</> : <>{r.totalDays} Day(s)</>}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-slate-500 max-w-xs truncate" title={r.reason}>{r.reason}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wide ${RELIEVER_BADGE[r.relieverStatus] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                                                        {r.relieverStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {awaiting ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openActionModal(r, "Accept")}
                                                                className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <i className="fa-solid fa-check" /> Accept
                                                            </button>
                                                            <button
                                                                onClick={() => openActionModal(r, "Reject")}
                                                                className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 text-[11px] font-bold hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                                                            >
                                                                <i className="fa-solid fa-xmark" /> Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-300 font-medium flex justify-end">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Apply Leave Modal ── */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-7 w-full max-w-md max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <i className="fa-solid fa-calendar-plus text-amber-500" /> Apply Leave
                            </h3>
                            <button
                                onClick={closeApplyModal}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleApplyLeave} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>From Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={form.fromDate}
                                        onChange={(e) => setForm({
                                            ...form,
                                            fromDate: e.target.value,
                                            toDate: (form.halfDay || form.shortLeave) ? e.target.value : form.toDate,
                                        })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>To Date *</label>
                                    <input
                                        type="date"
                                        required={!form.halfDay && !form.shortLeave}
                                        disabled={form.halfDay || form.shortLeave}
                                        min={form.fromDate || undefined}
                                        value={(form.halfDay || form.shortLeave) ? form.fromDate : form.toDate}
                                        onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                                        className={`${inputClass} ${(form.halfDay || form.shortLeave) ? "opacity-50 cursor-not-allowed" : ""}`}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6 -mt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={form.halfDay}
                                        onChange={(e) => setForm({
                                            ...form,
                                            halfDay: e.target.checked,
                                            shortLeave: false,
                                            toDate: e.target.checked ? form.fromDate : form.toDate,
                                        })}
                                        className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-600">Half Day</span>
                                </label>

                                {/* Short Leave: hamesha dikhta hai, leave type ki zaroorat nahi */}
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={form.shortLeave}
                                        onChange={(e) => setForm({
                                            ...form,
                                            shortLeave: e.target.checked,
                                            halfDay: false,
                                            fromTime: e.target.checked ? form.fromTime : "",
                                            toTime: e.target.checked ? form.toTime : "",
                                            toDate: e.target.checked ? form.fromDate : form.toDate,
                                        })}
                                        className="w-4 h-4 rounded border-slate-300 text-violet-500 focus:ring-violet-400 cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-slate-600">Short Leave</span>
                                </label>
                            </div>

                            {form.shortLeave && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Going Out At *</label>
                                        <input
                                            type="time"
                                            required
                                            value={form.fromTime}
                                            onChange={(e) => setForm({ ...form, fromTime: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Back By *</label>
                                        <input
                                            type="time"
                                            required
                                            value={form.toTime}
                                            onChange={(e) => setForm({ ...form, toTime: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            )}

                            {previewDays && (
                                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 flex items-center gap-2">
                                    <i className="fa-solid fa-circle-info text-amber-500" />
                                    <p className="text-xs font-bold text-amber-700">
                                        This request covers {previewDays} day{previewDays > 1 ? "s" : ""}.
                                    </p>
                                </div>
                            )}

                            {form.shortLeave && (
                                <div className="bg-violet-50 border border-violet-200/60 rounded-xl p-3 flex items-start gap-2">
                                    <i className="fa-solid fa-circle-info text-violet-500 mt-0.5" />
                                    <div className="text-xs font-bold text-violet-700">
                                        {shortHours
                                            ? <>{shortHours} hr(s) = {shortDays} day. This will be deducted from your salary for that day.</>
                                            : <>Select the time you go out and the time you will be back.</>}
                                        
                                    </div>
                                </div>
                            )}

                            {!form.shortLeave && (
                                <RelieverSelect
                                    value={form.relieverEmployeeId}
                                    onChange={(v) => setForm({ ...form, relieverEmployeeId: v })}
                                    relievers={relievers}
                                    loading={relieversLoading}
                                />
                            )}

                            <div>
                                <label className={labelClass}>Reason *</label>
                                <textarea
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    rows={3}
                                    required
                                    maxLength={500}
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
                                    onClick={closeApplyModal}
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
                    <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-7 w-full max-w-md max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <i className="fa-solid fa-pen text-amber-500" /> Edit Leave Request
                            </h3>
                            <button
                                onClick={closeEditModal}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateLeave} className="space-y-5">
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
                                        min={editForm.fromDate || undefined}
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

                            <RelieverSelect
                                value={editForm.relieverEmployeeId}
                                onChange={(v) => setEditForm({ ...editForm, relieverEmployeeId: v })}
                                relievers={relievers}
                                loading={relieversLoading}
                                fallback={
                                    editingRequest.relieverEmployeeId && editingRequest.relieverName
                                        ? { id: String(editingRequest.relieverEmployeeId), name: editingRequest.relieverName }
                                        : null
                                }
                            />

                            <div>
                                <label className={labelClass}>Reason *</label>
                                <textarea
                                    value={editForm.reason}
                                    onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                    rows={3}
                                    required
                                    maxLength={500}
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
                                    onClick={closeEditModal}
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

            {/* ── Reliever Accept / Reject Modal ── */}
            {actionTarget && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-7 w-full max-w-md relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                {actionTarget.action === "Accept" ? (
                                    <i className="fa-solid fa-circle-check text-emerald-500" />
                                ) : (
                                    <i className="fa-solid fa-circle-xmark text-rose-500" />
                                )}
                                {actionTarget.action === "Accept" ? "Accept as reliever" : "Reject request"}
                            </h3>
                            <button
                                onClick={closeActionModal}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleRelieverAction} className="space-y-5">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
                                <p className="font-bold text-slate-800">{actionTarget.req.employeeName}</p>
                                <p className="text-slate-500 font-medium mt-1">
                                    {actionTarget.req.fromTime ? (
                                        <>
                                            {fmtDate(actionTarget.req.fromDate)}
                                            {" · "}{fmtTime(actionTarget.req.fromTime)} – {fmtTime(actionTarget.req.toTime)}
                                            {actionTarget.req.durationHours ? ` · ${actionTarget.req.durationHours} hr(s)` : ""}
                                        </>
                                    ) : (
                                        <>
                                            {fmtDate(actionTarget.req.fromDate)} to {fmtDate(actionTarget.req.toDate)}
                                            {" · "}{actionTarget.req.totalDays} day(s)
                                        </>
                                    )}
                                </p>
                                <p className="text-slate-500 mt-1">{actionTarget.req.reason}</p>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    Remarks {actionTarget.action === "Reject" ? "*" : "(optional)"}
                                </label>
                                <textarea
                                    value={actionRemarks}
                                    onChange={(e) => setActionRemarks(e.target.value)}
                                    rows={3}
                                    maxLength={500}
                                    className={`${inputClass} resize-y`}
                                    placeholder={
                                        actionTarget.action === "Reject"
                                            ? "Tell the employee why you can't cover for them..."
                                            : "Add a note for HR (optional)..."
                                    }
                                />
                            </div>

                            {actionTarget.action === "Accept" && (
                                <p className="text-xs font-medium text-slate-500">
                                    After you accept, this request goes to HR for final approval.
                                </p>
                            )}

                            {actionError && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                                    <i className="fa-solid fa-triangle-exclamation" /> {actionError}
                                </div>
                            )}

                            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeActionModal}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionSubmitting}
                                    className={`px-6 py-2.5 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-60 transition-all flex items-center gap-2 ${actionTarget.action === "Accept"
                                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                        : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                                        }`}
                                >
                                    {actionSubmitting && <i className="fa-solid fa-spinner animate-spin" />}
                                    {actionSubmitting
                                        ? "Saving..."
                                        : actionTarget.action === "Accept" ? "Accept request" : "Reject request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}