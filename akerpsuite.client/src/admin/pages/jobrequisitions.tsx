import { useEffect, useState, useMemo } from "react";
import { adminService } from "@/services/adminService";

// ─── Helpers ────────────────────────────────────────────────────────────────
function Badge({ status }) {
    const map = {
        Pending: "bg-amber-50 text-amber-700 border-amber-200/50",
        ApprovedByManager: "bg-blue-50 text-blue-700 border-blue-200/50",
        ApprovedByHR: "bg-amber-50 text-amber-700 border-amber-200/50",
        ApprovedByMgmt: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
        Open: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
        Closed: "bg-slate-100 text-slate-600 border-slate-200",
        Rejected: "bg-rose-50 text-rose-700 border-rose-200/50",
    };

    const dotMap = {
        Pending: "bg-amber-500",
        ApprovedByManager: "bg-blue-500",
        ApprovedByHR: "bg-amber-500",
        ApprovedByMgmt: "bg-emerald-500",
        Open: "bg-emerald-500",
        Closed: "bg-slate-400",
        Rejected: "bg-rose-500",
    };

    const cls = map[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
    const dotCls = dotMap[status] ?? "bg-slate-400";

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`}></span>
            {status}
        </span>
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

function Input({ ...props }) {
    return (
        <input
            {...props}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
        />
    );
}

// Maps the requisition's current status to the next approval stage to send to the backend
function getNextStage(currentStatus) {
    if (currentStatus === "Pending") return "ManagerApproval";
    if (currentStatus === "ApprovedByManager") return "HRApproval";
    if (currentStatus === "ApprovedByHR") return "MgmtApproval";
    return "ManagerApproval";
}

// Statuses that are still eligible for further Approve/Reject action
const ACTIONABLE_STATUSES = ["Pending", "ApprovedByManager", "ApprovedByHR"];

// ─── Main Component ────────────────────────────────────────────────────────
export default function JobRequisitions() {
    const [requisitions, setRequisitions] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showForm, setShowForm] = useState(false);

    // Form Initial State
    const emptyForm = {
        title: "",
        departmentId: "",
        designationId: "",
        vacancies: "",
        experienceRequired: "",
        description: "",
    };
    const [form, setForm] = useState(emptyForm);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        loadRequisitions();
    }, [statusFilter]);

    const loadInitialData = async () => {
        try {
            const [deptRes, desigRes] = await Promise.all([
                adminService.getDepartments(),
                adminService.getDesignations()
            ]);

            if (deptRes.Success || deptRes.success) setDepartments(deptRes.Data || deptRes.data || []);
            if (desigRes.Success || desigRes.success) setDesignations(desigRes.Data || desigRes.data || []);
        } catch (err) {
            console.error("Failed to load initial dropdown data:", err);
        }
    };

    const loadRequisitions = async () => {
        setLoading(true);
        try {
            const res = await adminService.getAllRequisitions(statusFilter);
            if (res.Success || res.success) {
                setRequisitions(res.Data || res.data || []);
            }
        } catch (err) {
            console.error("Failed to load requisitions:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title || !form.departmentId || !form.designationId || !form.vacancies) {
            alert("Please fill all required fields.");
            return;
        }

        setSaving(true);
        try {
            const res = await adminService.createRequisition({
                title: form.title,
                departmentId: parseInt(form.departmentId),
                designationId: parseInt(form.designationId),
                vacancies: parseInt(form.vacancies),
                experienceRequired: form.experienceRequired,
                description: form.description,
                status: "Pending",
                stage: "Initial"
            });

            if (res.Success || res.success) {
                alert(res.Message || "Requisition submitted successfully!");
                setForm(emptyForm);
                setShowForm(false);
                loadRequisitions();
            } else {
                alert(res.Message || "Failed to submit requisition.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Check console.");
        } finally {
            setSaving(false);
        }
    };

    const [toast, setToast] = useState(null); // { type: "success" | "error", message: string }

    const handleAction = async (requisitionId, status, stage) => {
        if (!window.confirm(`Are you sure you want to mark this requisition as ${status}?`)) return;

        setActionLoading(requisitionId + status);
        try {
            const res = await adminService.actionRequisition({
                requisitionId,
                status,
                stage
            });

            if (res.Success || res.success) {
                setToast({ type: "success", message: res.Message || `Requisition ${status} successfully!` });
                loadRequisitions();
            } else {
                setToast({ type: "error", message: res.Message || "Failed to process requisition action." });
            }
        } catch (err) {
            console.error(err);
            setToast({ type: "error", message: "Network error." });
        } finally {
            setActionLoading("");
            setTimeout(() => setToast(null), 4000);
        }
    };

    // Calculate quick statistics
    const stats = useMemo(() => ({
        total: requisitions.length,
        pending: requisitions.filter(r => r.status === "Pending").length,
        approved: requisitions.filter(r => r.status === "ApprovedByMgmt").length,
        rejected: requisitions.filter(r => r.status === "Rejected").length,
    }), [requisitions]);

    return (
        <div className="space-y-6 pb-10 font-sans relative z-0">

            {/* ── Toast Notification ── */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold text-white transition-all animate-in slide-in-from-top-5 duration-300 ${toast.type === "error" ? "bg-rose-600 border border-rose-500" : "bg-emerald-600 border border-emerald-500"}`}>
                    <i className={`fa-solid ${toast.type === "error" ? "fa-triangle-exclamation" : "fa-circle-check"} text-lg`} />
                    {toast.message}
                </div>
            )}

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-file-signature text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Job Requisitions</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Raise new manpower requests, track hiring requirements, and manage approvals.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Quick Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Requests", val: stats.total, color: "text-slate-800" },
                    { label: "Pending Approvals", val: stats.pending, color: "text-amber-600" },
                    { label: "Approved Requisitions", val: stats.approved, color: "text-emerald-600" },
                    { label: "Rejected Requests", val: stats.rejected, color: "text-rose-600" },
                ].map(({ label, val, color }) => (
                    <div key={label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="text-[11px] text-slate-400 mb-1 font-bold uppercase tracking-wider">{label}</div>
                        <div className={`text-3xl font-black tabular-nums ${color}`}>{val}</div>
                    </div>
                ))}
            </div>

            {/* ── Controls Row ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex-1 min-w-[200px] max-w-sm">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Filter by Status</label>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all cursor-pointer shadow-sm appearance-none"
                    >
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="ApprovedByManager">Approved By Manager</option>
                        <option value="ApprovedByHR">Approved By HR</option>
                        <option value="ApprovedByMgmt">Approved By Management</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 text-[#0b2836] text-xs sm:text-sm font-bold rounded-xl hover:bg-amber-500 transition-all shadow-sm flex items-center justify-center gap-2 self-end"
                >
                    <i className={`fa-solid ${showForm ? "fa-xmark" : "fa-plus"}`} />
                    {showForm ? "Cancel Request" : "Raise Requisition"}
                </button>
            </div>

            {/* ── Expandable Requisition Creation Form ── */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                        <i className="fa-solid fa-file-circle-plus text-amber-500" />
                        <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">Create New Job Requisition</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <Field label="Job Title *">
                            <Input
                                type="text"
                                placeholder="e.g. Senior .NET Developer"
                                value={form.title}
                                onChange={set("title")}
                                required
                            />
                        </Field>

                        <Field label="Department *">
                            <select
                                value={form.departmentId}
                                onChange={set("departmentId")}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer appearance-none"
                            >
                                <option value="" disabled>Select Department</option>
                                {departments.length > 0 ? (
                                    departments.map(d => (
                                        <option key={d.deptId || d.id} value={d.deptId || d.id}>
                                            {d.deptName || d.departmentName}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>Loading departments...</option>
                                )}
                            </select>
                        </Field>

                        <Field label="Designation *">
                            <select
                                value={form.designationId}
                                onChange={set("designationId")}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer appearance-none"
                            >
                                <option value="" disabled>Select Designation</option>
                                {designations.length > 0 ? (
                                    designations.map(d => (
                                        <option key={d.desigId || d.id} value={d.desigId || d.id}>
                                            {d.desigName || d.designationName}
                                        </option>
                                    ))
                                ) : (
                                    <option disabled>Loading designations...</option>
                                )}
                            </select>
                        </Field>

                        <Field label="Number of Vacancies *">
                            <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 3"
                                value={form.vacancies}
                                onChange={set("vacancies")}
                                required
                            />
                        </Field>

                        <Field label="Experience Required">
                            <Input
                                type="text"
                                placeholder="e.g. 2-4 Years"
                                value={form.experienceRequired}
                                onChange={set("experienceRequired")}
                            />
                        </Field>

                        <Field label="Job Description / Notes">
                            <Input
                                type="text"
                                placeholder="Core skills, justification note..."
                                value={form.description}
                                onChange={set("description")}
                            />
                        </Field>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full sm:w-auto px-6 py-3 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] disabled:opacity-60 transition-all shadow-lg shadow-[#0b2836]/20 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:hover:translate-y-0"
                        >
                            {saving ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-paper-plane" />}
                            {saving ? "Submitting..." : "Submit Requisition"}
                        </button>
                    </div>
                </form>
            )}

            {/* ── Requisitions List Table ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[1000px]">
                        <thead className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left">Requisition Details</th>
                                <th className="px-6 py-4 text-left">Department</th>
                                <th className="px-6 py-4 text-left">Designation</th>
                                <th className="px-6 py-4 text-left">Vacancies</th>
                                <th className="px-6 py-4 text-left">Experience</th>
                                <th className="px-6 py-4 text-left">Stage</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                                            <div className="text-sm font-medium text-slate-500 animate-pulse">Loading requisitions pipeline...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : requisitions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-24 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                                            <i className="fa-solid fa-file-circle-xmark" />
                                        </div>
                                        <p className="text-base font-bold text-slate-700">No Requisitions Found</p>
                                        <p className="text-sm text-slate-400 mt-1 font-medium">No job requisitions matching current filter.</p>
                                    </td>
                                </tr>
                            ) : (
                                requisitions.map((req, i) => (
                                    <tr key={req.requisitionId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{req.title}</div>
                                            <div className="text-xs font-medium text-slate-500 mt-0.5 truncate max-w-[200px]" title={req.description}>
                                                {req.description || "No descriptions provided"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700">
                                            {req.deptName ?? `Dept #${req.departmentId}`}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600">
                                            {req.desigName ?? `Desig #${req.designationId}`}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-amber-600 text-base">
                                            {req.vacancies}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 font-medium text-xs">
                                            {req.experienceRequired || "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                {req.stage || "Initial"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge status={req.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {ACTIONABLE_STATUSES.includes(req.status) ? (
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        disabled={!!actionLoading}
                                                        onClick={() => handleAction(req.requisitionId, "Approved", "FullApproval")}
                                                        className="px-3.5 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200/50 transition-all disabled:opacity-60 shadow-sm"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        disabled={!!actionLoading}
                                                        onClick={() => handleAction(req.requisitionId, "Rejected", "FullApproval")}
                                                        className="px-3.5 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200/50 transition-all disabled:opacity-60 shadow-sm"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs font-bold uppercase tracking-widest">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}