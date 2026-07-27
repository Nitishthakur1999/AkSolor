import { useState, useEffect, useMemo } from "react";
import { adminService } from "@/services/adminService";

// ─── Helpers ────────────────────────────────────────────────────────────────
function Badge({ status }) {
    const map = {
        Pending: "bg-amber-50 text-amber-700 border-amber-200",
        ApprovedByManager: "bg-blue-50 text-blue-700 border-blue-200",
        ApprovedByHR: "bg-indigo-50 text-indigo-700 border-indigo-200",
        ApprovedByMgmt: "bg-green-50 text-green-700 border-green-200",
        Open: "bg-green-50 text-green-700 border-green-200",
        Closed: "bg-slate-100 text-slate-600 border-slate-200",
        Rejected: "bg-red-50   text-red-700   border-red-200",
    };
    const cls = map[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
            {status}
        </span>
    );
}

function Field({ label, children }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
            {children}
        </div>
    );
}

function Input({ ...props }) {
    return (
        <input
            {...props}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Job Requisitions</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Raise new manpower requests, track hiring requirements, and manage approvals.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total Requests", val: stats.total, color: "text-slate-800" },
                    { label: "Pending Approvals", val: stats.pending, color: "text-amber-600" },
                    { label: "Approved Requisitions", val: stats.approved, color: "text-green-600" },
                    { label: "Rejected Requests", val: stats.rejected, color: "text-red-600" },
                ].map(({ label, val, color }) => (
                    <div key={label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                        <div className="text-[11px] text-slate-400 mb-1 font-bold uppercase tracking-wider">{label}</div>
                        <div className={`text-2xl font-semibold ${color}`}>{val}</div>
                    </div>
                ))}
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
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
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
                >
                    {showForm ? "Cancel Request" : "+ Raise Requisition"}
                </button>
            </div>

            {/* Expandable Requisition Creation Form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <p className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Create New Job Requisition</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                            >
                                <option value="">Select Department</option>
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
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                            >
                                <option value="">Select Designation</option>
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

                    <div className="flex justify-end pt-2 border-t border-slate-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-sm"
                        >
                            {saving ? "Submitting..." : "Submit Requisition"}
                        </button>
                    </div>
                </form>
            )}

            {/* Requisitions List Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3.5 text-left">Requisition Details</th>
                                <th className="px-6 py-3.5 text-left">Department</th>
                                <th className="px-6 py-3.5 text-left">Designation</th>
                                <th className="px-6 py-3.5 text-left">Vacancies</th>
                                <th className="px-6 py-3.5 text-left">Experience</th>
                                <th className="px-6 py-3.5 text-left">Stage</th>
                                <th className="px-6 py-3.5 text-left">Status</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-indigo-500 animate-pulse font-medium">
                                        Loading requisitions pipeline...
                                    </td>
                                </tr>
                            ) : requisitions.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                                        No job requisitions found matching current filter.
                                    </td>
                                </tr>
                            ) : (
                                requisitions.map((req, i) => (
                                    <tr key={req.requisitionId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{req.title}</div>
                                            <div className="text-[11px] text-slate-400 truncate max-w-[200px]" title={req.description}>
                                                {req.description || "No descriptions provided"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                            {req.deptName ?? `Dept #${req.departmentId}`}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {req.desigName ?? `Desig #${req.designationId}`}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700">
                                            {req.vacancies}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {req.experienceRequired || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-medium">
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
                                                        className="px-3 py-1 text-xs font-bold bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-200 transition-all disabled:opacity-60"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        disabled={!!actionLoading}
                                                        onClick={() => handleAction(req.requisitionId, "Rejected", "FullApproval")}
                                                        className="px-3 py-1 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 transition-all disabled:opacity-60"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs font-medium">—</span>
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