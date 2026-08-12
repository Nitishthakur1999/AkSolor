import { useState, useEffect, useMemo } from "react";
import { adminService } from "@/services/adminService";

// ─── Helpers ────────────────────────────────────────────────────────────────
function Badge({ status, isPublished }) {
    if (isPublished) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border bg-emerald-50 text-emerald-700 border-emerald-200/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Published
            </span>
        );
    }

    const map = {
        Draft: "bg-amber-50 text-amber-700 border-amber-200/50",
        Closed: "bg-slate-50 text-slate-600 border-slate-200",
    };

    const dotMap = {
        Draft: "bg-amber-500",
        Closed: "bg-slate-400",
    };

    const cls = map[status] ?? "bg-slate-50 text-slate-600 border-slate-200";
    const dotCls = dotMap[status] ?? "bg-slate-400";

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`}></span>
            {status || "Draft"}
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
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400"
        />
    );
}

function Textarea({ ...props }) {
    return (
        <textarea
            {...props}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm resize-y"
        />
    );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function JobPostings() {
    const [postings, setPostings] = useState([]);
    const [approvedReqs, setApprovedReqs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [publishedFilter, setPublishedFilter] = useState(""); // "" = all, "true" = published, "false" = unpublished

    const emptyForm = {
        requisitionId: "",
        title: "",
        description: "",
        location: "",
        employmentType: "Full-Time",
        salaryRange: "",
        closingDate: "",
        isPublished: false
    };
    const [form, setForm] = useState(emptyForm);

    const set = (k) => (e) => setForm(f => ({
        ...f,
        [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    }));

    useEffect(() => {
        loadApprovedRequisitions();
        loadPostings();
    }, [publishedFilter]);

    const loadApprovedRequisitions = async () => {
        try {
            // Ye API sirf un requisitions ko fetch karti hai jo fully approved (Manager + HR + Mgmt) hain,
            // taaki Job Posting create karte waqt backend ka "must be fully approved" error na aaye.
            const res = await adminService.getAllRequisitions("ApprovedByMgmt");
            if (res.Success || res.success) {
                setApprovedReqs(res.Data || res.data || []);
            }
        } catch (err) {
            console.error("Failed to load approved requisitions:", err);
        }
    };

    const loadPostings = async () => {
        setLoading(true);
        try {
            let filterVal = null;
            if (publishedFilter === "true") filterVal = true;
            if (publishedFilter === "false") filterVal = false;

            const res = await adminService.getAllJobPostings(filterVal);
            if (res.Success || res.success) {
                setPostings(res.Data || res.data || []);
            }
        } catch (err) {
            console.error("Failed to load job postings:", err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fill title if a requisition is selected
    const handleRequisitionChange = (e) => {
        const reqId = e.target.value;
        const selectedReq = approvedReqs.find(r => String(r.requisitionId) === String(reqId));
        setForm(f => ({
            ...f,
            requisitionId: reqId,
            title: selectedReq ? selectedReq.title : f.title
        }));
    };

    const handleEditClick = (posting) => {
        setForm({
            requisitionId: posting.requisitionId || "",
            title: posting.title || "",
            description: posting.description || "",
            location: posting.location || "",
            employmentType: posting.employmentType || "Full-Time",
            salaryRange: posting.salaryRange || "",
            closingDate: posting.closingDate ? posting.closingDate.slice(0, 10) : "",
            isPublished: posting.isPublished || false
        });
        setEditingId(posting.postingId);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.requisitionId || !form.title || !form.location) {
            alert("Requisition, Title, and Location are required.");
            return;
        }

        setSaving(true);
        try {
            const payload: Record<string, any> = {
                requisitionId: parseInt(form.requisitionId),
                title: form.title,
                description: form.description,
                location: form.location,
                employmentType: form.employmentType,
                salaryRange: form.salaryRange,
                closingDate: form.closingDate ? `${form.closingDate}T00:00:00` : null,
                isPublished: form.isPublished
            };

            let res;
            if (editingId) {
                payload.postingId = editingId;
                res = await adminService.updateJobPosting(payload);
            } else {
                res = await adminService.createJobPosting(payload);
            }

            if (res.Success || res.success) {
                alert(res.Message || `Job posting ${editingId ? 'updated' : 'created'} successfully!`);
                handleCancel();
                loadPostings();
            } else {
                alert(res.Message || "Failed to save job posting.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Check console.");
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePublish = async (posting) => {
        if (!window.confirm(`Are you sure you want to ${posting.isPublished ? 'unpublish' : 'publish'} this job?`)) return;

        try {
            const payload = {
                postingId: posting.postingId,
                requisitionId: posting.requisitionId,
                title: posting.title,
                description: posting.description,
                location: posting.location,
                employmentType: posting.employmentType,
                salaryRange: posting.salaryRange,
                closingDate: posting.closingDate,
                isPublished: !posting.isPublished // Toggle
            };
            const res = await adminService.updateJobPosting(payload);
            if (res.Success || res.success) {
                loadPostings();
            } else {
                alert(res.Message || "Failed to update publish status.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        }
    };

    // Calculate quick statistics
    const stats = useMemo(() => ({
        total: postings.length,
        published: postings.filter(p => p.isPublished).length,
        drafts: postings.filter(p => !p.isPublished && p.status !== "Closed").length,
    }), [postings]);

    return (
        <div className="space-y-5 pb-10 font-sans relative z-0">

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-briefcase text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Job Postings</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Create job listings from approved requisitions and publish them to the careers portal.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Quick Stats ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total Postings", val: stats.total, color: "text-slate-800" },
                    { label: "Actively Published", val: stats.published, color: "text-emerald-600" },
                    { label: "Drafts / Unpublished", val: stats.drafts, color: "text-amber-600" },
                ].map(({ label, val, color }) => (
                    <div key={label} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                        <div className="text-[11px] text-slate-400 mb-1 font-bold uppercase tracking-wider">{label}</div>
                        <div className={`text-3xl font-black tabular-nums ${color}`}>{val}</div>
                    </div>
                ))}
            </div>

            {/* ── Controls Row ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-full sm:w-auto min-w-[220px]">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Filter Postings</label>
                    <select
                        value={publishedFilter}
                        onChange={e => setPublishedFilter(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all cursor-pointer shadow-sm appearance-none"
                    >
                        <option value="">All Postings</option>
                        <option value="true">Published Only</option>
                        <option value="false">Unpublished / Drafts Only</option>
                    </select>
                </div>
                <button
                    onClick={() => {
                        if (showForm && !editingId) handleCancel();
                        else { handleCancel(); setShowForm(true); }
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 text-[#0b2836] text-xs sm:text-sm font-bold rounded-xl hover:bg-amber-500 transition-all shadow-sm flex items-center justify-center gap-2 self-end"
                >
                    <i className={`fa-solid ${showForm && !editingId ? "fa-xmark" : "fa-plus"}`} />
                    {showForm && !editingId ? "Cancel Creation" : "Create Job Posting"}
                </button>
            </div>

            {/* ── Form for Create/Edit ── */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-file-pen text-amber-500" />
                            <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                {editingId ? "Edit Job Posting" : "Create New Job Posting"}
                            </p>
                        </div>
                        {editingId && (
                            <button type="button" onClick={handleCancel} className="text-xs text-rose-500 hover:text-rose-600 font-bold">
                                ✕ Cancel Edit
                            </button>
                        )}
                    </div>

                    {approvedReqs.length === 0 && !editingId && (
                        <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3 flex items-start gap-2.5 shadow-sm">
                            <i className="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5" />
                            <span>No fully approved job requisitions are currently available. Please ensure that a job requisition has been approved through the Manager → HR → Management workflow before proceeding.</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <Field label="Link to Approved Requisition *">
                            <select
                                value={form.requisitionId}
                                onChange={handleRequisitionChange}
                                disabled={!!editingId}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer appearance-none disabled:bg-slate-100 disabled:text-slate-400"
                            >
                                <option value="" disabled>Select Requisition...</option>
                                {approvedReqs.map(r => (
                                    <option key={r.requisitionId} value={r.requisitionId}>
                                        {r.title} (Req #{r.requisitionId})
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Display Job Title *">
                            <Input
                                type="text"
                                placeholder="Public title for careers page"
                                value={form.title}
                                onChange={set("title")}
                                required
                            />
                        </Field>

                        <Field label="Location *">
                            <Input
                                type="text"
                                placeholder="e.g. Remote, Mumbai, Hybrid"
                                value={form.location}
                                onChange={set("location")}
                                required
                            />
                        </Field>

                        <Field label="Employment Type *">
                            <select
                                value={form.employmentType}
                                onChange={set("employmentType")}
                                required
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer appearance-none"
                            >
                                <option value="Full-Time">Full-Time</option>
                                <option value="Part-Time">Part-Time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                            </select>
                        </Field>

                        <Field label="Salary Range (Optional)">
                            <Input
                                type="text"
                                placeholder="e.g. ₹5,00,000 - ₹8,00,000 PA"
                                value={form.salaryRange}
                                onChange={set("salaryRange")}
                            />
                        </Field>

                        <Field label="Application Closing Date">
                            <Input
                                type="date"
                                value={form.closingDate}
                                onChange={set("closingDate")}
                            />
                        </Field>
                    </div>

                    <Field label="Job Description">
                        <Textarea
                            rows={4}
                            placeholder="Full job description, responsibilities, requirements..."
                            value={form.description}
                            onChange={set("description")}
                        />
                    </Field>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-slate-100 gap-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={form.isPublished}
                                onChange={set("isPublished")}
                                className="w-4 h-4 text-amber-600 focus:ring-amber-500 rounded cursor-pointer border-slate-300"
                            />
                            <span className="text-sm font-bold text-slate-700 group-hover:text-amber-700 transition-colors">Publish immediately to Careers Page</span>
                        </label>

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full sm:w-auto px-6 py-3 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] disabled:opacity-60 transition-all shadow-lg shadow-[#0b2836]/20 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                        >
                            {saving ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-floppy-disk" />}
                            {saving ? "Saving..." : editingId ? "Update Posting" : "Create Posting"}
                        </button>
                    </div>
                </form>
            )}

            {/* ── Postings List Table ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[900px]">
                        <thead className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left">Job Info</th>
                                <th className="px-6 py-4 text-left">Location & Type</th>
                                <th className="px-6 py-4 text-left">Req. Ref</th>
                                <th className="px-6 py-4 text-left">Closing Date</th>
                                <th className="px-6 py-4 text-left">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                                            <div className="text-sm font-medium text-slate-500 animate-pulse">Loading job postings...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : postings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                                            <i className="fa-solid fa-folder-open" />
                                        </div>
                                        <p className="text-base font-bold text-slate-700">No Job Postings Found</p>
                                        <p className="text-sm text-slate-400 mt-1 font-medium">No job postings available matching your filter.</p>
                                    </td>
                                </tr>
                            ) : (
                                postings.map((post, i) => (
                                    <tr key={post.postingId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{post.title}</div>
                                            {post.description && (
                                                <div className="text-xs text-slate-500 font-medium mt-0.5 max-w-xs truncate" title={post.description}>
                                                    {post.description}
                                                </div>
                                            )}
                                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                                {post.salaryRange || "Salary not disclosed"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-700">{post.location}</div>
                                            <div className="text-xs text-slate-500 font-medium mt-0.5">{post.employmentType}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold text-amber-600 text-xs">
                                            #{post.requisitionId}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                                            {post.closingDate ? new Date(post.closingDate).toLocaleDateString("en-IN") : "No deadline"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge status={post.status} isPublished={post.isPublished} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end items-center">
                                                <button
                                                    onClick={() => handleTogglePublish(post)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm ${post.isPublished
                                                        ? "bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100"
                                                        : "bg-emerald-50 text-emerald-700 border-emerald-200/50 hover:bg-emerald-100"
                                                        }`}
                                                >
                                                    {post.isPublished ? "Unpublish" : "Publish"}
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(post)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                                    title="Edit Posting"
                                                >
                                                    <i className="fa-solid fa-pen text-[13px]" />
                                                </button>
                                            </div>
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