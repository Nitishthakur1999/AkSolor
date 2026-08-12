import { useState, useEffect, useMemo } from "react";
import { adminService, getDocumentUrl } from "@/services/adminService";

// Helper to get logged in user's ID
const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.userId ?? user?.UserId ?? user?.emp_id ?? 1;
};

const Icon = {
    Download: (p) => (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
        </svg>
    ),
    Check: (p) => (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M20 6 9 17l-5-5" />
        </svg>
    ),
    Calendar: (p) => (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" {...p}>
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
    ),
    Dots: (p) => (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
            <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
        </svg>
    ),
    Search: (p) => (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" {...p}>
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
    ),
    Inbox: (p) => (
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" {...p}>
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
        </svg>
    ),
};

/* ─────────────────────────────────────────────────────────────────────────
   Avatar — colored initials circle so a name-dense table has an anchor
   for the eye on every row, instead of plain text starting each line.
   ────────────────────────────────────────────────────────────────────── */
const AVATAR_PALETTE = [
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
    "bg-violet-100 text-violet-700 border-violet-200",
    "bg-rose-100 text-rose-700 border-rose-200",
    "bg-cyan-100 text-cyan-700 border-cyan-200",
];
function Avatar({ firstName, lastName }) {
    const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?";
    const hash = `${firstName}${lastName}`.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const palette = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
    return (
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-[11px] font-bold shrink-0 ${palette}`}>
            {initials}
        </div>
    );
}

// Matches DB enum: candidates.status — dot + label instead of a solid block,
// reads lighter across a dense table.
function Badge({ status }) {
    const map = {
        Applied: { dot: "bg-slate-400", text: "text-slate-700 bg-slate-50 border-slate-200/60" },
        Shortlisted: { dot: "bg-blue-500", text: "text-blue-700 bg-blue-50 border-blue-200/60" },
        Interview: { dot: "bg-purple-500", text: "text-purple-700 bg-purple-50 border-purple-200/60" },
        Selected: { dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50 border-emerald-200/60" },
        Offer: { dot: "bg-amber-500", text: "text-amber-700 bg-amber-50 border-amber-200/60" },
        Joined: { dot: "bg-green-500", text: "text-green-700 bg-green-50 border-green-200/60" },
        Rejected: { dot: "bg-rose-500", text: "text-rose-700 bg-rose-50 border-rose-200/60" },
    };
    const cfg = map[status] ?? map.Applied;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {status}
        </span>
    );
}

// ─── tiny sub-badge shown under "Offer" status so HR doesn't have to
// open the menu just to see whether an offer is pending/approved/rejected ──
function OfferSubBadge({ offerStatus }) {
    const map = {
        Pending: "text-amber-600 bg-amber-100/50",
        Approved: "text-emerald-600 bg-emerald-100/50",
        Rejected: "text-rose-600 bg-rose-100/50",
    };
    return (
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${map[offerStatus] || "text-slate-500 bg-slate-100"}`}>
            {offerStatus === "Pending" ? "Awaiting Approval" : offerStatus}
        </span>
    );
}

// ─── visual pipeline tracker. Lets HR see where a candidate stands and
// what's next at a glance, instead of decoding a single status word. ────────
const PIPELINE_STAGES = ["Applied", "Shortlisted", "Interview", "Selected", "Offer", "Joined"];
function PipelineTracker({ status }) {
    if (status === "Rejected") {
        return <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">Not moving forward</span>;
    }
    const currentIdx = PIPELINE_STAGES.indexOf(status);
    return (
        <div className="flex items-center gap-1.5 mt-1.5" title={`Stage: ${status}`}>
            {PIPELINE_STAGES.map((stage, i) => (
                <div
                    key={stage}
                    className={`h-1.5 rounded-full transition-all ${i <= currentIdx ? "bg-amber-500" : "bg-slate-200"
                        } ${i === currentIdx ? "w-6 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "w-2.5"}`}
                />
            ))}
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500 ml-1">{label}</label>
            {children}
        </div>
    );
}
function Input(props) {
    return (
        <input
            {...props}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
        />
    );
}
function Select({ children, ...props }) {
    return (
        <select
            {...props}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer"
        >
            {children}
        </select>
    );
}
function TextArea(props) {
    return (
        <textarea
            {...props}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm resize-none"
        />
    );
}

/* ─────────────────────────────────────────────────────────────────────────
   RowActions — redesigned to stay a single compact pill no matter how long
   the label is (icon + short text + title tooltip for the full label),
   instead of a heavy block that wraps to two lines per row.
   ────────────────────────────────────────────────────────────────────── */
function RowActions({ primary, secondary, busy }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="flex items-center gap-1.5 justify-end relative">
            {primary && (
                <button
                    onClick={primary.onClick}
                    disabled={busy}
                    title={primary.fullLabel || primary.label}
                    className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-bold uppercase tracking-wider rounded-lg px-3 py-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${primary.danger
                            ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                            : primary.subtle
                                ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                : "bg-[#0b2836] text-white hover:bg-[#0f3345] shadow-[#0b2836]/20"
                        }`}
                >
                    {primary.icon}
                    {busy ? primary.busyLabel || "Working…" : primary.label}
                </button>
            )}
            {secondary && secondary.length > 0 && (
                <div className="relative">
                    <button
                        onClick={() => setOpen(o => !o)}
                        disabled={busy}
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200 rounded-lg w-8 h-8 flex items-center justify-center disabled:opacity-40 transition-all shadow-sm"
                        title="More actions"
                    >
                        <Icon.Dots />
                    </button>
                    {open && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2">
                                {secondary.map((a, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setOpen(false); a.onClick(); }}
                                        className={`w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors ${a.danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-600"
                                            }`}
                                    >
                                        <span className={a.danger ? "text-rose-500" : "text-slate-400"}>{a.icon}</span>
                                        {a.label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            {!primary && (!secondary || secondary.length === 0) && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">No action pending</span>
            )}
        </div>
    );
}

// ─── lightweight in-app confirm dialog — replaces window.confirm() so
// it matches the app's own look instead of the browser's native popup. ─────
function ConfirmDialog({ state, onCancel, onConfirm }) {
    if (!state) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] shadow-2xl p-7 w-full max-w-sm text-center animate-in zoom-in-95 duration-200">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border ${state.danger ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-amber-50 text-amber-500 border-amber-100"}`}>
                    <i className={`fa-solid ${state.danger ? "fa-triangle-exclamation" : "fa-circle-question"} text-2xl`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{state.title}</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">{state.message}</p>
                <div className="flex justify-center gap-3">
                    <button onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 ${state.danger ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                            }`}>
                        {state.confirmLabel || "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── toast notifications — replaces alert() with a less jarring,
// self-dismissing message in the corner of the screen. ─────────────────────
function ToastStack({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;
    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id}
                    onClick={() => onDismiss(t.id)}
                    className={`cursor-pointer rounded-xl shadow-2xl border px-5 py-3.5 text-sm font-bold pointer-events-auto transition-all animate-in slide-in-from-right-8 duration-300 flex items-center gap-3 ${t.type === "error"
                            ? "bg-rose-600 border-rose-500 text-white"
                            : "bg-emerald-600 border-emerald-500 text-white"
                        }`}>
                    <i className={`fa-solid ${t.type === "error" ? "fa-circle-exclamation" : "fa-circle-check"} text-lg`} />
                    {t.message}
                </div>
            ))}
        </div>
    );
}

// Config: which fields each modal type needs, and the label/button text
const MODAL_CONFIG = {
    interview: { title: "Schedule Interview", submitLabel: "Schedule" },
    feedback: { title: "Submit Interview Feedback", submitLabel: "Submit Feedback" },
    selection: { title: "Selection Approval", submitLabel: "Confirm Decision" },
    offer: { title: "Create Offer", submitLabel: "Create Offer" },
    joining: { title: "Confirm Joining", submitLabel: "Confirm Joining" },
    regularization: { title: "Regularization of Service", submitLabel: "Generate Letter" },
};

export default function CandidateManagement() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [busyCandidateId, setBusyCandidateId] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchName, setSearchName] = useState("");
    const [activeModal, setActiveModal] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [dependentData, setDependentData] = useState(null);
    const [jobPostingFilter, setJobPostingFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [jobPostings, setJobPostings] = useState([]);
    const [offerStatusMap, setOfferStatusMap] = useState<Record<string, any>>({});

    type ConfirmState = {
        title: string;
        message: string;
        danger?: boolean;
        confirmLabel?: string;
        onConfirm: () => void;
    } | null;

    const [confirmState, setConfirmState] = useState<ConfirmState>(null);
    const [toasts, setToasts] = useState<Array<{ id: number; type: "success" | "error"; message: string }>>([]);

    const notify = (type, message) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };
    const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));
    const askConfirm = (
        title: string,
        message: string,
        onConfirm: () => void,
        options: { danger?: boolean; confirmLabel?: string } = {}
    ) => {
        const { danger = false, confirmLabel } = options;
        setConfirmState({ title, message, danger, confirmLabel, onConfirm });
    };

    useEffect(() => {
        adminService.getAllJobPostings()
            .then(res => {
                if (res.Success || res.success) {
                    setJobPostings(res.Data || res.data || []);
                }
            })
            .catch(err => console.error(err));
    }, []);

    useEffect(() => { loadCandidates(); }, [statusFilter, jobPostingFilter]);

    const loadCandidates = async () => {
        setLoading(true);
        try {
            const filter: Record<string, any> = {};
            if (statusFilter) filter.status = statusFilter;
            if (searchName) filter.name = searchName;
            if (jobPostingFilter) filter.jobPostingId = jobPostingFilter;
            if (fromDate) filter.fromDate = fromDate;
            if (toDate) filter.toDate = toDate;
            const res = await adminService.searchCandidates(filter);
            if (res.Success || res.success) {
                const list = res.Data || res.data || [];
                setCandidates(list);
                loadOfferStatuses(list);
            }
        } catch (err) {
            console.error(err);
            notify("error", "Couldn't load candidates. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };
    const handleClearFilters = () => {
        setStatusFilter("");
        setSearchName("");
        setJobPostingFilter("");
        setFromDate("");
        setToDate("");
        setTimeout(loadCandidates, 0);
    };
    const loadOfferStatuses = async (candidateList) => {
        const offerCandidates = candidateList.filter(c => c.status === "Offer");
        if (offerCandidates.length === 0) return;
        const results = await Promise.all(
            offerCandidates.map(async (c) => {
                try {
                    const res = await adminService.getOfferByCandidate(c.candidateId);
                    const offer = res.Data || res.data;
                    return [c.candidateId, offer?.status || "Pending"];
                } catch {
                    return [c.candidateId, "Pending"];
                }
            })
        );
        setOfferStatusMap(prev => ({ ...prev, ...Object.fromEntries(results) }));
    };
    const handleSimpleStatusUpdate = (candidateId, status) => {
        askConfirm(
            `Mark as ${status}?`,
            `This candidate will move to the "${status}" stage.`,
            async () => {
                setConfirmState(null);
                setBusyCandidateId(candidateId);
                try {
                    const res = await adminService.updateCandidateStatus({
                        candidateId,
                        status,
                        updatedBy: getUserId(),
                        remarks: `Status updated to ${status}`
                    });
                    if (res.Success || res.success) {
                        notify("success", `Candidate marked as ${status}.`);
                        loadCandidates();
                    } else {
                        notify("error", res.Message || "That action didn't go through.");
                    }
                } catch (err) {
                    console.error(err);
                    notify("error", "Network error — please try again.");
                } finally {
                    setBusyCandidateId(null);
                }
            },
            { danger: status === "Rejected", confirmLabel: `Mark as ${status}` }
        );
    };
    const handleOfferAction = (candidate, status) => {
        askConfirm(
            status === "Approved" ? "Approve this offer?" : "Reject this offer?",
            status === "Approved"
                ? "The candidate can move to joining confirmation once approved."
                : "This candidate's offer will be marked as rejected.",
            async () => {
                setConfirmState(null);
                setBusyCandidateId(candidate.candidateId);
                try {
                    const offerRes = await adminService.getOfferByCandidate(candidate.candidateId);
                    const offer = offerRes.Data || offerRes.data;
                    if (!offer?.offerId) {
                        notify("error", "No offer found for this candidate.");
                        return;
                    }
                    const res = await adminService.actionOffer({
                        offerId: offer.offerId,
                        status,
                        approvedBy: getUserId(),
                        remarks: `Offer ${status} via Candidate Tracking`
                    });
                    if (res.Success || res.success) {
                        notify("success", `Offer ${status.toLowerCase()} successfully.`);
                        setOfferStatusMap(prev => ({ ...prev, [candidate.candidateId]: status }));
                        loadCandidates();
                    } else {
                        notify("error", res.Message || "That action didn't go through.");
                    }
                } catch (err) {
                    console.error(err);
                    notify("error", "Network error — please try again.");
                } finally {
                    setBusyCandidateId(null);
                }
            },
            { danger: status === "Rejected", confirmLabel: status === "Approved" ? "Approve" : "Reject" }
        );
    };
    const handleDownloadOfferLetter = async (candidate) => {
        setBusyCandidateId(candidate.candidateId);
        try {
            await adminService.downloadOfferLetter(candidate.candidateId);
        } catch (err) {
            console.error(err);
            notify("error", "Couldn't generate the offer letter. Please try again.");
        } finally {
            setBusyCandidateId(null);
        }
    };
    const handleDownloadAppointmentLetter = async (candidate) => {
        setBusyCandidateId(candidate.candidateId);
        try {
            await adminService.downloadAppointmentLetter(candidate.candidateId);
        } catch (err) {
            console.error(err);
            notify("error", "Couldn't generate the appointment letter. Please try again.");
        } finally {
            setBusyCandidateId(null);
        }
    };
    const openModal = async (type, candidate) => {
        setSelectedCandidate(candidate);
        setFormData(
            type === "selection"
                ? { status: "Selected" }
                : type === "regularization"
                    ? { effectiveDate: new Date().toISOString().split("T")[0] }
                    : {}
        );
        setDependentData(null);
        setActiveModal(type);
        try {
            if (type === "feedback") {
                const res = await adminService.getInterviewsByCandidate(candidate.candidateId);
                if (res.Success || res.success) {
                    const interviews = res.Data || res.data || [];
                    if (interviews.length > 0) {
                        const last = interviews[interviews.length - 1];
                        setDependentData({ interviewId: last.interviewId });
                        setFormData(f => ({ ...f, roundNo: last.roundNo || 1 }));
                    } else {
                        notify("error", "No interview records found for this candidate yet.");
                        setActiveModal(null);
                    }
                }
            } else if (type === "joining") {
                const res = await adminService.getOfferByCandidate(candidate.candidateId);
                if (res.Success || res.success) {
                    const offer = res.Data || res.data;
                    if (offer && offer.offerId) {
                        if (offer.status !== "Approved") {
                            notify("error", `Offer must be approved first. Current status: ${offer.status}`);
                            setActiveModal(null);
                            return;
                        }
                        setDependentData({ offerId: offer.offerId });
                    } else {
                        notify("error", "No valid offer found for this candidate.");
                        setActiveModal(null);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load dependent data:", err);
            notify("error", "Couldn't load the details needed for this step.");
            setActiveModal(null);
        }
    };
    const closeModal = () => {
        setActiveModal(null);
        setSelectedCandidate(null);
        setFormData({});
        setDependentData(null);
    };
    const submitModal = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            let res;
            const currentUserId = getUserId();
            if (activeModal === "interview") {
                res = await adminService.scheduleInterview({
                    candidateId: selectedCandidate.candidateId,
                    scheduledDate: `${formData.date}T${formData.time}:00`,
                    mode: formData.mode || "Online",
                    location: formData.location || null,
                    interviewers: formData.interviewers,
                    roundNo: formData.roundNo ? parseInt(formData.roundNo) : 1
                });
            } else if (activeModal === "feedback") {
                res = await adminService.submitInterviewFeedback({
                    interviewId: dependentData.interviewId,
                    feedback: formData.feedback,
                    rating: parseInt(formData.rating),
                    result: formData.result || "Pending",
                    roundNo: formData.roundNo ? parseInt(formData.roundNo) : 1,
                    approvedBy: currentUserId
                });
                if (res.Success || res.success) {
                    if (formData.result === "Pass") {
                        const selRes = await adminService.approveSelection({
                            candidateId: selectedCandidate.candidateId,
                            status: "Selected",
                            remarks: "Auto-selected after positive interview feedback",
                            approvedBy: currentUserId
                        });
                        if (!(selRes.Success || selRes.success)) {
                            notify("error", selRes.Message || "Feedback saved, but selection update failed.");
                        }
                    } else if (formData.result === "Fail") {
                        const rejRes = await adminService.updateCandidateStatus({
                            candidateId: selectedCandidate.candidateId,
                            status: "Rejected",
                            updatedBy: currentUserId,
                            remarks: "Auto-rejected after interview feedback"
                        });
                        if (!(rejRes.Success || rejRes.success)) {
                            notify("error", rejRes.Message || "Feedback saved, but rejection update failed.");
                        }
                    }
                    notify(
                        "success",
                        formData.result === "Pass"
                            ? "Feedback submitted — candidate moved to Selected."
                            : formData.result === "Fail"
                                ? "Feedback submitted — candidate marked Rejected."
                                : "Feedback submitted — ready to schedule the next round."
                    );
                    closeModal();
                    loadCandidates();
                    setActionLoading(false);
                    return;
                }
            } else if (activeModal === "selection") {
                res = await adminService.approveSelection({
                    candidateId: selectedCandidate.candidateId,
                    status: formData.status || "Selected",
                    remarks: formData.remarks,
                    approvedBy: currentUserId
                });
            } else if (activeModal === "offer") {
                res = await adminService.createOffer({
                    candidateId: selectedCandidate.candidateId,
                    offeredCtc: parseFloat(formData.offeredCtc),
                    joiningDate: formData.joiningDate,
                    offerExpiry: formData.offerExpiry ? `${formData.offerExpiry}T00:00:00` : null,
                    approvedBy: currentUserId
                });
            } else if (activeModal === "joining") {
                res = await adminService.confirmJoining({
                    offerId: dependentData.offerId,
                    candidateId: selectedCandidate.candidateId,
                    actualJoiningDate: formData.actualJoiningDate,
                    confirmedBy: currentUserId,
                    employeeCode: formData.employeeCode || null
                });
            } else if (activeModal === "regularization") {
                try {
                    await adminService.downloadRegularizationLetter(
                        selectedCandidate.candidateId,
                        formData.effectiveDate
                    );
                    notify("success", "Regularization letter generated.");
                    closeModal();
                } catch (err) {
                    console.error(err);
                    notify("error", "Couldn't generate the regularization letter. Please try again.");
                } finally {
                    setActionLoading(false);
                }
                return;
            }
            if (res.Success || res.success) {
                notify("success", res.Message || "Done!");
                closeModal();
                loadCandidates();
            } else {
                notify("error", res.Message || "That action didn't go through.");
            }
        } catch (err) {
            console.error(err);
            notify("error", "Network error — please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Builds { primary, secondary } for a candidate's current stage.
    // primary buttons stay short + iconed so they never wrap; the full
    // action name still shows up as a hover tooltip via `fullLabel`. ────────
    const getActionsFor = (c) => {
        let primary = null;
        const secondary = [];
        if (c.status === "Applied") {
            primary = { label: "Shortlist", icon: <Icon.Check />, onClick: () => handleSimpleStatusUpdate(c.candidateId, "Shortlisted") };
        }
        if (c.status === "Shortlisted") {
            primary = { label: "Schedule Interview", icon: <Icon.Calendar />, onClick: () => openModal("interview", c) };
        }
        if (c.status === "Interview") {
            primary = { label: "Add Feedback", icon: <Icon.Check />, onClick: () => openModal("feedback", c) };
            secondary.push({ label: "Selection Approval", icon: <Icon.Check />, onClick: () => openModal("selection", c) });
        }
        if (c.status === "Selected") {
            primary = { label: "Create Offer", icon: <Icon.Check />, onClick: () => openModal("offer", c) };
        }
        if (c.status === "Offer") {
            const offerStatus = offerStatusMap[c.candidateId] || "Pending";
            secondary.push({ label: "Download Offer Letter", icon: <Icon.Download />, onClick: () => handleDownloadOfferLetter(c) });
            if (offerStatus === "Approved") {
                primary = { label: "Confirm Joining", icon: <Icon.Check />, onClick: () => openModal("joining", c) };
            } else if (offerStatus === "Rejected") {
                // no forward action — table shows "Not moving forward" via sub-badge
            } else {
                primary = { label: "Approve Offer", icon: <Icon.Check />, onClick: () => handleOfferAction(c, "Approved") };
                secondary.push({ label: "Reject Offer", icon: <i className="fa-solid fa-xmark" />, onClick: () => handleOfferAction(c, "Rejected"), danger: true });
            }
        }
        if (c.status === "Joined") {
            primary = {
                label: "Appt. Letter",
                fullLabel: "Download Appointment Letter",
                icon: <Icon.Download />,
                subtle: true,
                busyLabel: "Preparing…",
                onClick: () => handleDownloadAppointmentLetter(c),
            };
            secondary.push({ label: "Regularization of Service", icon: <Icon.Calendar />, onClick: () => openModal("regularization", c) });
        }
        if (!["Rejected", "Joined", "Offer"].includes(c.status)) {
            secondary.push({ label: "Reject Candidate", icon: <i className="fa-solid fa-ban" />, onClick: () => handleSimpleStatusUpdate(c.candidateId, "Rejected"), danger: true });
        }
        return { primary, secondary };
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[160px]">
                        <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer appearance-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="Applied">Applied</option>
                            <option value="Shortlisted">Shortlisted</option>
                            <option value="Interview">Interview</option>
                            <option value="Selected">Selected</option>
                            <option value="Offer">Offer</option>
                            <option value="Joined">Joined</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1">Job Role</label>
                        <select
                            value={jobPostingFilter}
                            onChange={e => setJobPostingFilter(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer appearance-none"
                        >
                            <option value="">All Job Roles</option>
                            {jobPostings.map(job => (
                                <option key={job.postingId} value={job.postingId}>{job.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-36">
                        <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                    <div className="w-36">
                        <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex-1 min-w-[240px]">
                        <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1">Search Name</label>
                        <div className="relative group w-full">
                            <Icon.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchName}
                                onChange={e => setSearchName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && loadCandidates()}
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-4 mt-4 border-t border-slate-100">
                    <button onClick={loadCandidates}
                        className="px-6 py-2.5 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] shadow-md shadow-[#0b2836]/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
                        <i className="fa-solid fa-filter" /> Search
                    </button>
                    <button onClick={handleClearFilters}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Candidates Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-sm font-bold text-slate-800">
                        Candidates Pipeline
                    </h2>
                    <span className="text-xs text-slate-400 font-medium">
                        Showing {candidates.length} candidate(s)
                    </span>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[1000px]">
                        <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left">Candidate</th>
                                <th className="px-6 py-4 text-left">Contact Info</th>
                                <th className="px-6 py-4 text-left">Experience</th>
                                <th className="px-6 py-4 text-left">Resume</th>
                                <th className="px-6 py-4 text-left">Pipeline Stage</th>
                                <th className="px-6 py-4 text-right">Next Step</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                                            <div className="text-sm font-medium text-slate-500 animate-pulse">Loading candidates...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : candidates.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                                            <i className="fa-solid fa-inbox" />
                                        </div>
                                        <p className="text-base font-bold text-slate-700">No Candidates Found</p>
                                        <p className="text-sm text-slate-400 mt-1 font-medium">Try adjusting your filters, or check back later.</p>
                                    </td>
                                </tr>
                            ) : (
                                candidates.map(c => {
                                    const { primary, secondary } = getActionsFor(c);
                                    const isBusy = busyCandidateId === c.candidateId;
                                    return (
                                        <tr key={c.candidateId} className="hover:bg-slate-50/60 transition-colors align-top group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3.5">
                                                    <Avatar firstName={c.firstName} lastName={c.lastName} />
                                                    <div>
                                                        <div className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                                                            {c.firstName} {c.lastName}
                                                        </div>
                                                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">#{c.candidateId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium text-slate-700">{c.email}</span>
                                                    <span className="text-[11px] font-mono font-bold text-slate-400">{c.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                {c.experience || "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                {c.resumeUrl ? (
                                                    <a href={getDocumentUrl(c.resumeUrl)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-[11px] uppercase tracking-wider transition-colors border border-blue-100/50 shadow-sm"
                                                    >
                                                        <Icon.Download /> View CV
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-300 text-xs font-bold">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge status={c.status} />
                                                        {c.status === "Offer" && (
                                                            <OfferSubBadge offerStatus={offerStatusMap[c.candidateId] || "Pending"} />
                                                        )}
                                                    </div>
                                                    <PipelineTracker status={c.status} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <RowActions primary={primary} secondary={secondary} busy={isBusy} />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Action Modal */}
            {activeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white rounded-[24px] shadow-2xl p-7 w-full max-w-lg my-8 relative animate-in zoom-in-95 duration-200">
                        <button onClick={closeModal}
                            className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                            <i className="fa-solid fa-xmark text-lg" />
                        </button>

                        <div className="mb-6 border-b border-slate-100 pb-4 pr-10">
                            <h2 className="text-xl font-bold text-slate-900 mb-1">{MODAL_CONFIG[activeModal].title}</h2>
                            <p className="text-sm font-medium text-slate-500">
                                {selectedCandidate ? `Candidate: ${selectedCandidate.firstName ?? ""} ${selectedCandidate.lastName ?? ""}`.trim() : ""}
                            </p>
                        </div>

                        <form onSubmit={submitModal} className="space-y-5">
                            {activeModal === "interview" && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Date *">
                                            <Input type="date" required
                                                value={formData.date || ""}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                        </Field>
                                        <Field label="Time *">
                                            <Input type="time" required
                                                value={formData.time || ""}
                                                onChange={e => setFormData({ ...formData, time: e.target.value })} />
                                        </Field>
                                    </div>
                                    <Field label="Mode *">
                                        <Select required value={formData.mode || "Online"}
                                            onChange={e => setFormData({ ...formData, mode: e.target.value })}>
                                            <option value="Online">Online</option>
                                            <option value="In-Person">In-Person</option>
                                            <option value="Telephonic">Telephonic</option>
                                        </Select>
                                    </Field>
                                    {formData.mode === "In-Person" && (
                                        <Field label="Location">
                                            <Input type="text" placeholder="Office address or branch"
                                                value={formData.location || ""}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                        </Field>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-2">
                                            <Field label="Interviewer(s) *">
                                                <Input type="text" required placeholder="Names, comma separated"
                                                    value={formData.interviewers || ""}
                                                    onChange={e => setFormData({ ...formData, interviewers: e.target.value })} />
                                            </Field>
                                        </div>
                                        <div className="sm:col-span-1">
                                            <Field label="Round No.">
                                                <Input type="number" min="1"
                                                    value={formData.roundNo || 1}
                                                    onChange={e => setFormData({ ...formData, roundNo: e.target.value })} />
                                            </Field>
                                        </div>
                                    </div>
                                </>
                            )}
                            {activeModal === "feedback" && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Field label="Rating (1-5) *">
                                            <Input type="number" min="1" max="5" required
                                                value={formData.rating || ""}
                                                onChange={e => setFormData({ ...formData, rating: e.target.value })} />
                                        </Field>
                                        <Field label="Recommendation *">
                                            <Select required value={formData.result || ""}
                                                onChange={e => setFormData({ ...formData, result: e.target.value })}>
                                                <option value="">Select...</option>
                                                <option value="Pass">Recommend for Selection</option>
                                                <option value="Hold">Move to Next Round</option>
                                                <option value="Fail">Reject</option>
                                            </Select>
                                        </Field>
                                    </div>
                                    <Field label="Feedback Notes *">
                                        <TextArea rows={4} required placeholder="Detailed feedback on skills, culture fit, etc."
                                            value={formData.feedback || ""}
                                            onChange={e => setFormData({ ...formData, feedback: e.target.value })} />
                                    </Field>
                                    {formData.result && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
                                            <i className="fa-solid fa-circle-info text-amber-500 mt-0.5" />
                                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide leading-relaxed">
                                                {formData.result === "Pass" && "This candidate will be automatically moved to 'Selected'."}
                                                {formData.result === "Fail" && "This candidate will be automatically marked 'Rejected'."}
                                                {formData.result === "Hold" && "This candidate will stay on 'Interview' so you can schedule the next round."}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                            {activeModal === "selection" && (
                                <>
                                    <Field label="Decision *">
                                        <Select required value={formData.status || "Selected"}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                            <option value="Selected">Selected</option>
                                            <option value="Rejected">Rejected</option>
                                        </Select>
                                    </Field>
                                    <Field label="Remarks">
                                        <TextArea rows={3} placeholder="Final thoughts or approval notes"
                                            value={formData.remarks || ""}
                                            onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
                                    </Field>
                                </>
                            )}
                            {activeModal === "offer" && (
                                <>
                                    <Field label="Offered CTC (per annum) *">
                                        <Input type="number" required step="0.01" placeholder="e.g. 500000"
                                            value={formData.offeredCtc || ""}
                                            onChange={e => setFormData({ ...formData, offeredCtc: e.target.value })} />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Joining Date *">
                                            <Input type="date" required
                                                value={formData.joiningDate || ""}
                                                onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
                                        </Field>
                                        <Field label="Offer Expiry">
                                            <Input type="date"
                                                value={formData.offerExpiry || ""}
                                                onChange={e => setFormData({ ...formData, offerExpiry: e.target.value })} />
                                        </Field>
                                    </div>
                                </>
                            )}
                            {activeModal === "joining" && (
                                <>
                                    <Field label="Actual Joining Date *">
                                        <Input type="date" required
                                            value={formData.actualJoiningDate || ""}
                                            onChange={e => setFormData({ ...formData, actualJoiningDate: e.target.value })} />
                                    </Field>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2.5">
                                        <i className="fa-solid fa-circle-info text-blue-500 mt-0.5" />
                                        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide leading-relaxed">
                                            The employee code, username, and password will be generated automatically upon confirmation.
                                        </p>
                                    </div>
                                </>
                            )}
                            {activeModal === "regularization" && (
                                <>
                                    <Field label="Confirmation Effective Date *">
                                        <Input type="date" required
                                            value={formData.effectiveDate || ""}
                                            onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })} />
                                    </Field>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5">
                                        <i className="fa-solid fa-file-word text-blue-500 mt-0.5" />
                                        <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide leading-relaxed">
                                            This is the date from which the employee's service is confirmed after probation. The letter (.docx) will download automatically.
                                        </p>
                                    </div>
                                </>
                            )}
                            <div className="pt-4 border-t border-slate-100 flex gap-3">
                                <button type="button" onClick={closeModal}
                                    className="flex-1 py-3.5 bg-white text-slate-600 border border-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={actionLoading}
                                    className="flex-1 py-3.5 bg-[#0b2836] text-white font-bold rounded-xl hover:bg-[#0f3345] disabled:opacity-60 transition-all text-sm shadow-lg shadow-[#0b2836]/20 hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                    {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-check" />}
                                    {actionLoading ? "Processing..." : MODAL_CONFIG[activeModal].submitLabel}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmDialog
                state={confirmState}
                onCancel={() => setConfirmState(null)}
                onConfirm={() => confirmState?.onConfirm()}
            />
            <ToastStack toasts={toasts} onDismiss={dismissToast} />
        </div>
    );
}