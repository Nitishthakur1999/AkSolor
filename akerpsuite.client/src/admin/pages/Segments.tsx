import { useEffect, useState, useMemo } from "react";
import { adminService } from "@/services/adminService";

export default function Segments() {
    // Tabs: 'table' (All Segments), 'form' (Add/Edit)
    const [activeTab, setActiveTab] = useState("table");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Data States
    const [segments, setSegments] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Add/Edit Form State — field names match sp_GetAllSalesSegments output exactly
    const [editingId, setEditingId] = useState(null);
    const [segmentForm, setSegmentForm] = useState({
        segmentCode: "", segmentName: "", description: "", isActive: true
    });

    useEffect(() => {
        loadSegments();
    }, []);

    const loadSegments = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.getSegments();
            if (res?.success) {
                setSegments(res.data || []);
            } else {
                setErrorMsg(res?.message || "Failed to load segments");
            }
        } catch (err) {
            console.error("Failed to load segments", err);
            setErrorMsg("Could not reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Table & Pagination Logic
    const filteredSegments = useMemo(() => {
        if (!searchTerm) return segments;
        return segments.filter(item => {
            const searchStr = `${item.segmentCode} ${item.segmentName} ${item.description}`.toLowerCase();
            return searchStr.includes(searchTerm.toLowerCase());
        });
    }, [segments, searchTerm]);

    const totalItems = filteredSegments.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const currentSegments = filteredSegments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endEntry = Math.min(currentPage * itemsPerPage, totalItems);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    // Form Logic
    const handleSave = async (e) => {
        e.preventDefault();
        if (!segmentForm.segmentName.trim()) return;

        setActionLoading(true);
        setErrorMsg("");
        try {
            const res = editingId
                ? await adminService.updateSegment({ segmentId: editingId, ...segmentForm })
                : await adminService.createSegment(segmentForm);

            if (res?.success) {
                resetForm();
                await loadSegments();
                setActiveTab("table");
            } else {
                setErrorMsg(res?.message || "Could not save the segment.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Something went wrong while saving. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditClick = (seg) => {
        setEditingId(seg.segmentId);
        setSegmentForm({
            segmentCode: seg.segmentCode || "",
            segmentName: seg.segmentName || "",
            description: seg.description || "",
            isActive: !!seg.isActive
        });
        setErrorMsg("");
        setActiveTab("form");
    };

    // Segments aren't hard-deleted (leads reference them) — deactivate instead.
    const handleToggleStatus = async (seg) => {
        setActionLoading(true);
        try {
            const res = await adminService.updateSegment({
                segmentId: seg.segmentId,
                segmentCode: seg.segmentCode,
                segmentName: seg.segmentName,
                description: seg.description,
                isActive: !seg.isActive
            });
            if (res?.success) {
                await loadSegments();
            } else {
                setErrorMsg(res?.message || "Could not update status.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Something went wrong while updating status.");
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setSegmentForm({ segmentCode: "", segmentName: "", description: "", isActive: true });
    };

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Sales Segments</h2>
                <p className="text-xs text-slate-500 mt-0.5">Categorize your leads into different business segments for better tracking (PMSGY, Industrial, Commercial, Ground Mounted, Retail, etc.).</p>
            </div>

            {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium px-4 py-3 rounded-xl">
                    {errorMsg}
                </div>
            )}

            {/* MAIN CONTAINER */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                {/* TABS */}
                <div className="flex overflow-x-auto border-b border-slate-200 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <button onClick={() => { setActiveTab("table"); resetForm(); }} className={`px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === "table" ? "border-slate-800 text-slate-800" : "border-transparent hover:text-slate-600"}`}>All Segments</button>
                    <button onClick={() => setActiveTab("form")} className={`px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === "form" ? "border-indigo-600 text-indigo-600" : "border-transparent hover:text-slate-600"}`}>
                        {editingId ? "✏️ Edit Segment" : "+ Add New Segment"}
                    </button>
                </div>

                <div className="p-6 min-h-[400px]">
                    {loading ? (
                        <div className="text-center text-indigo-600 py-10 font-medium animate-pulse">Loading Data...</div>
                    ) : (
                        <>
                            {activeTab === "table" && (
                                <div className="space-y-4">
                                    <div className="flex justify-end mb-4">
                                        <input type="text" placeholder="Search segments..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64 px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all" />
                                    </div>
                                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wide">
                                                <tr>
                                                    <th className="px-6 py-4">ID</th>
                                                    <th className="px-6 py-4">Code</th>
                                                    <th className="px-6 py-4">Segment Name</th>
                                                    <th className="px-6 py-4">Description</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                                {currentSegments.length === 0 ? (
                                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">No segments found. Add one to start categorizing leads.</td></tr>
                                                ) : currentSegments.map((seg, idx) => (
                                                    <tr key={seg.segmentId || idx} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-slate-800">#{seg.segmentId}</td>
                                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{seg.segmentCode || "-"}</td>
                                                        <td className="px-6 py-4 font-semibold text-slate-800">{seg.segmentName}</td>
                                                        <td className="px-6 py-4 text-xs text-slate-500">{seg.description || "-"}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${seg.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"}`}>
                                                                {seg.isActive ? "Active" : "Inactive"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center space-x-2">
                                                            <button onClick={() => handleEditClick(seg)} className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-2xl text-xs transition-colors">Edit</button>
                                                            <button onClick={() => handleToggleStatus(seg)} disabled={actionLoading} className={`px-4 py-1.5 font-bold rounded-2xl text-xs transition-colors disabled:opacity-50 ${seg.isActive ? "bg-rose-50 hover:bg-rose-100 text-rose-600" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"}`}>
                                                                {seg.isActive ? "Deactivate" : "Activate"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* PAGINATION UI */}
                                    {totalItems > 0 && (
                                        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-2 gap-4">
                                            <div className="text-sm text-slate-500 font-medium">
                                                Showing <span className="font-bold text-slate-700">{startEntry}</span> to <span className="font-bold text-slate-700">{endEntry}</span> of <span className="font-bold text-slate-700">{totalItems}</span> entries
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all">Previous</button>
                                                {pageNumbers.map(number => (
                                                    <button key={number} onClick={() => setCurrentPage(number)} className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${currentPage === number ? "bg-indigo-600 text-white shadow-md border-indigo-600" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                                        {number}
                                                    </button>
                                                ))}
                                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all">Next</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "form" && (
                                <div className="max-w-2xl mx-auto pt-2">
                                    <form onSubmit={handleSave} className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Segment Code</label>
                                                <input type="text" placeholder="e.g. PMSGY01" value={segmentForm.segmentCode} onChange={e => setSegmentForm({ ...segmentForm, segmentCode: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 bg-white transition-all" />
                                                {/* TODO: confirm with backend DTO whether SegmentCode is required on Create */}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Segment Name *</label>
                                                <input type="text" required placeholder="e.g. PMSGY (Domestic, Subsidised)" value={segmentForm.segmentName} onChange={e => setSegmentForm({ ...segmentForm, segmentName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 bg-white transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                                            <textarea placeholder="Describe this segment..." value={segmentForm.description} onChange={e => setSegmentForm({ ...segmentForm, description: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 bg-white transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Status *</label>
                                            <select value={segmentForm.isActive ? "Active" : "Inactive"} onChange={e => setSegmentForm({ ...segmentForm, isActive: e.target.value === "Active" })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 bg-white transition-all">
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-200/60 mt-4">
                                            {editingId && (
                                                <button type="button" onClick={() => { setActiveTab("table"); resetForm(); }} className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-100 transition-all">Cancel</button>
                                            )}
                                            <button type="submit" disabled={actionLoading} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-indigo-700 disabled:opacity-60 transition-all">
                                                {actionLoading ? "Saving..." : (editingId ? "Update Segment" : "Create Segment")}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}