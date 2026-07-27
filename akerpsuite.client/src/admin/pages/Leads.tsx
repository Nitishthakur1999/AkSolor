import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "@/services/adminService";


const todayISO = () => new Date().toISOString().split("T")[0];


export default function Leads() {
    const navigate = useNavigate();

    // Tabs: 'table' (All Leads), 'form' (Add New)
    const [activeTab, setActiveTab] = useState("table");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Data States
    const [leads, setLeads] = useState([]);
    const [segments, setSegments] = useState([]);

    // Table & Pagination States
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form State — matches doc's Step 1 (General Data Entry) requirement
    const [leadForm, setLeadForm] = useState({
        leadDate: todayISO(),
        name: "",
        contactNo: "",
        email: "",
        address: "",
        reference: "",
        segmentId: "",
        queryType: "",
        remarks: "",
        label: "",
        status: "New"
    });

    // ── Add Segment Modal state ──
    const [showSegmentModal, setShowSegmentModal] = useState(false);
    const [segmentName, setSegmentName] = useState("");
    const [segmentLoading, setSegmentLoading] = useState(false);
    const [segmentError, setSegmentError] = useState("");

    useEffect(() => {
        loadLeads();
        loadSegments();
    }, []);

    const loadLeads = async () => {
        setLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.getLeads();
            if (res?.success) {
                setLeads(res.data || []);
            } else {
                setErrorMsg(res?.message || "Failed to load leads");
            }
        } catch (err) {
            console.error("Failed to load leads", err);
            setErrorMsg("Could not reach the server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const loadSegments = async () => {
        try {
            // Only Active segments should be selectable while creating a lead
            const res = await adminService.getSegments();
            if (res?.success) {
                setSegments((res.data || []).filter(s => s.isActive));
            }
        } catch (err) {
            console.error("Failed to load segments", err);
        }
    };

    // ── Add Segment handler ──
    const handleAddSegment = async (e) => {
        e.preventDefault();
        if (!segmentName.trim()) return;

        setSegmentLoading(true);
        setSegmentError("");
        try {
            const res = await adminService.createSegment({
                segmentName: segmentName.trim(),
                segmentCode: segmentName.trim().toUpperCase().replace(/\s+/g, "_"), // 👈 auto-generate unique code from name
                isActive: true
            });
            if (res?.success) {
                setSegmentName("");
                setShowSegmentModal(false);
                await loadSegments();
            } else {
                setSegmentError(res?.message || "Could not create segment.");
            }
        } catch (err) {
            console.error("Failed to create segment", err);
            setSegmentError(err.message || "Something went wrong while creating segment.");
        } finally {
            setSegmentLoading(false);
        }
    };

    // --- TABLE & SEARCH LOGIC ---
    const filteredLeads = useMemo(() => {
        if (!searchTerm) return leads;
        return leads.filter(item => {
            const searchStr = `${item.name} ${item.contactNo} ${item.leadId} ${item.status} ${item.segmentName || ""} ${item.reference || ""} ${item.label || ""}`.toLowerCase();
            return searchStr.includes(searchTerm.toLowerCase());
        });
    }, [leads, searchTerm]);

    const totalItems = filteredLeads.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const currentLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endEntry = Math.min(currentPage * itemsPerPage, totalItems);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    // --- FORM LOGIC ---
    const handleSaveLead = async (e) => {
        e.preventDefault();
        if (!leadForm.segmentId) {
            setErrorMsg("Please select Type of Query (Segment) before saving.");
            return;
        }

        setActionLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.createLead({
                ...leadForm,
                segmentId: Number(leadForm.segmentId)
            });

            if (res?.success) {
                resetForm();
                await loadLeads();
                setActiveTab("table");
            } else {
                setErrorMsg(res?.message || "Could not save the lead.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Something went wrong while saving. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setLeadForm({
            leadDate: todayISO(),
            name: "", contactNo: "", email: "", address: "",
            reference: "", segmentId: "", queryType: "", remarks: "", label: "",
            status: "New"
        });
        setErrorMsg("");
    };

    return (
        <div className="space-y-6 text-slate-800">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Leads Pipeline</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage incoming leads, track statuses, and view pipeline details.</p>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold px-4 py-3 rounded-xl">
                    {errorMsg}
                </div>
            )}

            {/* MAIN CONTAINER */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

                {/* TABS */}
                <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-6 pt-2 text-xs font-bold uppercase tracking-wider">
                    <button
                        onClick={() => { setActiveTab("table"); resetForm(); }}
                        className={`pb-3 pt-2 px-1 mr-6 border-b-2 whitespace-nowrap transition-colors ${activeTab === "table" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                    >
                        All Leads
                    </button>
                    <button
                        onClick={() => setActiveTab("form")}
                        className={`pb-3 pt-2 px-1 border-b-2 whitespace-nowrap transition-colors ${activeTab === "form" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                    >
                        + Create New Lead
                    </button>
                </div>

                <div className="p-6 min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col justify-center items-center gap-3 py-16">
                            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-sm font-semibold text-indigo-600 animate-pulse tracking-wide">
                                Loading leads...
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: TABLE VIEW */}
                            {activeTab === "table" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 bg-slate-50/70 border border-slate-200 rounded-xl p-3">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">Search:</span>
                                        <input
                                            type="text"
                                            placeholder="Search by name, contact, status, or segment..."
                                            value={searchTerm}
                                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                            className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        />
                                    </div>

                                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                                                    <th className="px-6 py-4">Lead ID</th>
                                                    <th className="px-6 py-4">Client Name</th>
                                                    <th className="px-6 py-4">Contact</th>
                                                    <th className="px-6 py-4">Segment</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                                {currentLeads.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-10 text-slate-400 italic">
                                                            No leads found.
                                                        </td>
                                                    </tr>
                                                ) : currentLeads.map((lead, idx) => {
                                                    const statusStyles = {
                                                        new: "bg-blue-50 text-blue-700 border-blue-100/50",
                                                        followup: "bg-amber-50 text-amber-700 border-amber-100/50",
                                                        survey: "bg-amber-50 text-amber-700 border-amber-100/50",
                                                        proposal: "bg-purple-50 text-purple-700 border-purple-100/50",
                                                        negotiation: "bg-orange-50 text-orange-700 border-orange-100/50",
                                                        won: "bg-emerald-50 text-emerald-700 border-emerald-200",
                                                        lost: "bg-rose-50 text-rose-700 border-rose-200",
                                                        notfeasible: "bg-slate-100 text-slate-500 border-slate-200",
                                                    };
                                                    const statusKey = (lead.status || "").toLowerCase().replace(/\s+/g, "");
                                                    const statusClass = statusStyles[statusKey] || "bg-slate-50 text-slate-600 border-slate-200";
                                                    const initial = (lead.name || "?").trim().charAt(0).toUpperCase();

                                                    return (
                                                        <tr key={lead.leadId || idx} className="hover:bg-slate-50/40 transition-colors duration-150 group">
                                                            <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                                                                #{lead.leadId}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-indigo-100/50">
                                                                        {initial}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-semibold text-slate-900">{lead.name}</span>
                                                                        {lead.label && (
                                                                            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100/50 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                                                {lead.label}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">{lead.contactNo}</td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/50">
                                                                    {lead.segmentName || "-"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${statusClass}`}>
                                                                    {lead.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <button
                                                                    onClick={() => navigate(`/sales/leads/${lead.leadId}`)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/40 active:scale-95 transition-all"
                                                                >
                                                                    View Pipeline
                                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* PAGINATION UI */}
                                    {totalItems > 0 && (
                                        <div className="flex justify-between items-center px-2 py-2 text-xs font-semibold text-slate-500">
                                            <div>
                                                Showing <span className="text-slate-800">{startEntry}</span> to{" "}
                                                <span className="text-slate-800">{endEntry}</span> of{" "}
                                                <span className="text-slate-800">{totalItems}</span> entries
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    className="px-2.5 py-1.5 rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    Previous
                                                </button>
                                                {pageNumbers.map(number => (
                                                    <button
                                                        key={number}
                                                        onClick={() => setCurrentPage(number)}
                                                        className={`px-3 py-1.5 rounded-lg border transition-all ${currentPage === number ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                                                    >
                                                        {number}
                                                    </button>
                                                ))}
                                                <button
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    className="px-2.5 py-1.5 rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: ADD FORM */}
                            {activeTab === "form" && (
                                <div className="max-w-3xl mx-auto">
                                    <div className="flex justify-end mb-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowSegmentModal(true)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/40 active:scale-95 transition-all"
                                        >
                                            + Add Segment
                                        </button>
                                    </div>
                                    <form onSubmit={handleSaveLead} className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date *</label>
                                                <input type="date" required value={leadForm.leadDate} onChange={e => setLeadForm({ ...leadForm, leadDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type of Query (Segment) *</label>
                                                <select required value={leadForm.segmentId} onChange={e => setLeadForm({ ...leadForm, segmentId: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                                                    <option value="">-- Select Segment --</option>
                                                    {segments.map(seg => (
                                                        <option key={seg.segmentId} value={seg.segmentId}>{seg.segmentName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Name *</label>
                                                <input type="text" required placeholder="e.g. John Doe" value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number *</label>
                                                <input type="text" required placeholder="e.g. 9876543210" value={leadForm.contactNo}
                                                    onChange={(e) => setLeadForm({ ...leadForm, contactNo: e.target.value })}
                                                    className="w-full px-3 py-2 rounded-xl border text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                                <input type="email" placeholder="e.g. john@example.com" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reference (Lead Source)</label>
                                                <input type="text" placeholder="e.g. Existing Client, Facebook, Dealer" value={leadForm.reference} onChange={e => setLeadForm({ ...leadForm, reference: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                            </div>
                                        </div>

                                        <div>
                                            {/* TODO: confirm exact purpose vs Segment with backend — DB has both segment_id and query_type as separate columns */}
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Query Type</label>
                                            <input type="text" placeholder="e.g. New Installation, Repair, Enquiry" value={leadForm.queryType} onChange={e => setLeadForm({ ...leadForm, queryType: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address / Location</label>
                                            <textarea placeholder="Site or client address..." value={leadForm.address} onChange={e => setLeadForm({ ...leadForm, address: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-xl border text-sm resize-none" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks</label>
                                            <textarea placeholder="Any additional notes about this query..." value={leadForm.remarks} onChange={e => setLeadForm({ ...leadForm, remarks: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-xl border text-sm resize-none" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Label</label>
                                            <input type="text" placeholder="e.g. Hot Lead" value={leadForm.label} onChange={e => setLeadForm({ ...leadForm, label: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" />
                                        </div>

                                        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                            <button type="submit" disabled={actionLoading} className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md whitespace-nowrap">
                                                {actionLoading ? "Saving..." : "Create Lead"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Add Segment Modal ── */}
            {showSegmentModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-bold text-slate-900">Add New Segment</h3>
                            <button
                                type="button"
                                onClick={() => { setShowSegmentModal(false); setSegmentName(""); setSegmentError(""); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 text-xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        {segmentError && (
                            <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
                                {segmentError}
                            </div>
                        )}
                        <form onSubmit={handleAddSegment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Segment Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="e.g. PMSGY, Industrial, Commercial"
                                    value={segmentName}
                                    onChange={(e) => setSegmentName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border text-sm"
                                />
                            </div>
                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowSegmentModal(false); setSegmentName(""); setSegmentError(""); }}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={segmentLoading}
                                    className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                                >
                                    {segmentLoading ? "Saving..." : "Save Segment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}