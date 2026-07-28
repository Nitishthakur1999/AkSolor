import { useState, useEffect, useMemo } from "react";
import { adminService } from "@/services/adminService";

// ─── Helpers ────────────────────────────────────────────────────────────────
function Badge({ status, isPublished }) {
    if (isPublished) {
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border bg-green-50 text-green-700 border-green-200">Published</span>;
    }

    const map = {
        Draft: "bg-amber-50 text-amber-700 border-amber-200",
        Closed: "bg-slate-100 text-slate-600 border-slate-200",
    };
    const cls = map[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
            {status || "Draft"}
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
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white disabled:bg-slate-50 disabled:text-slate-500"
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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Job Postings</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Create job listings from approved requisitions and publish them to the careers portal.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                    { label: "Total Postings", val: stats.total, color: "text-slate-800" },
                    { label: "Actively Published", val: stats.published, color: "text-green-600" },
                    { label: "Drafts / Unpublished", val: stats.drafts, color: "text-amber-600" },
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
                        value={publishedFilter}
                        onChange={e => setPublishedFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white"
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
                    className="px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-all shadow-sm"
                >
                    {showForm && !editingId ? "Cancel Creation" : "+ Create Job Posting"}
                </button>
            </div>

            {/* Form for Create/Edit */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <p className="text-sm font-bold text-slate-800">
                            {editingId ? "Edit Job Posting" : "Create New Job Posting"}
                        </p>
                        {editingId && (
                            <button type="button" onClick={handleCancel} className="text-xs text-slate-500 hover:text-slate-800 font-semibold">
                                ✕ Cancel Edit
                            </button>
                        )}
                    </div>

                    {approvedReqs.length === 0 && !editingId && (
                        <div className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                            No fully approved job requisitions are currently available. Please ensure that a job requisition has been approved through the Manager → HR → Management approval workflow before proceeding.
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <Field label="Link to Approved Requisition *">
                            <select
                                value={form.requisitionId}
                                onChange={handleRequisitionChange}
                                disabled={!!editingId} // Usually shouldn't change requisition once posted
                                required
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white disabled:bg-slate-100"
                            >
                                <option value="">Select Requisition...</option>
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
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white"
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

                    <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.isPublished}
                                onChange={set("isPublished")}
                                className="w-4 h-4 accent-amber-600 rounded"
                            />
                            <span className="text-sm font-semibold text-slate-700">Publish immediately to Careers Page</span>
                        </label>

                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 disabled:opacity-60 transition-all shadow-sm"
                        >
                            {saving ? "Saving..." : editingId ? "Update Posting" : "Create Posting"}
                        </button>
                    </div>
                </form>
            )}

            {/* Postings List Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3.5 text-left">Job Info</th>
                                <th className="px-6 py-3.5 text-left">Location & Type</th>
                                <th className="px-6 py-3.5 text-left">Req. Ref</th>
                                <th className="px-6 py-3.5 text-left">Closing Date</th>
                                <th className="px-6 py-3.5 text-left">Status</th>
                                <th className="px-6 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-amber-500 animate-pulse font-medium">
                                        Loading job postings...
                                    </td>
                                </tr>
                            ) : postings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No job postings found.
                                    </td>
                                </tr>
                            ) : (
                                postings.map((post, i) => (
                                    <tr key={post.postingId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-slate-800">{post.title}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                {post.salaryRange || "Salary not disclosed"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-700">{post.location}</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">{post.employmentType}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium text-xs">
                                            #{post.requisitionId}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                                            {post.closingDate ? new Date(post.closingDate).toLocaleDateString("en-IN") : "No deadline"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge status={post.status} isPublished={post.isPublished} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end items-center">
                                                <button
                                                    onClick={() => handleTogglePublish(post)}
                                                    className={`px-3 py-1 text-[11px] font-bold rounded-lg border transition-all ${post.isPublished
                                                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                                        : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                        }`}
                                                >
                                                    {post.isPublished ? "Unpublish" : "Publish"}
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(post)}
                                                    className="px-3 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 transition-all"
                                                >
                                                    Edit
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