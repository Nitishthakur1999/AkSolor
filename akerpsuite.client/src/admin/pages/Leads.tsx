import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "@/services/adminService";

const todayISO = () => new Date().toISOString().split("T")[0];

// Common input styles for premium theme
const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm";
const labelClass = "block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1";

const emptyLeadForm = {
    leadDate: todayISO(),
    name: "",
    contactNo: "",
    alternateContactNo: "",
    email: "",
    address: "",
    reference: "",
    segmentId: "",
    queryType: "",
    remarks: "",
    label: "",
    status: "New"
};

export default function Leads() {
    const navigate = useNavigate();

    // Tabs: 'table' (All Leads), 'form' (Create New Lead)
    const [activeTab, setActiveTab] = useState("table");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    // Data States
    const [leads, setLeads] = useState([]);
    const [segments, setSegments] = useState([]);

    // Table & Pagination States (All Leads tab)
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Table & Pagination States (mini table on Create New Lead tab)
    const [createSearchTerm, setCreateSearchTerm] = useState("");
    const [createPage, setCreatePage] = useState(1);
    const createItemsPerPage = 5;

    // Form State — matches doc's Step 1 (General Data Entry) requirement
    const [leadForm, setLeadForm] = useState(emptyLeadForm);

    // Edit mode — when set, form edits this lead instead of creating a new one
    const [editingLeadId, setEditingLeadId] = useState(null);

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
                segmentCode: segmentName.trim().toUpperCase().replace(/\s+/g, "_"), // auto-generate unique code from name
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

    // --- ALL LEADS TAB: TABLE & SEARCH LOGIC ---
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

    // --- CREATE NEW LEAD TAB: mini editable table logic ---
    const createFilteredLeads = useMemo(() => {
        if (!createSearchTerm) return leads;
        return leads.filter(item => {
            const searchStr = `${item.name} ${item.contactNo} ${item.leadId} ${item.status} ${item.segmentName || ""}`.toLowerCase();
            return searchStr.includes(createSearchTerm.toLowerCase());
        });
    }, [leads, createSearchTerm]);

    const createTotalItems = createFilteredLeads.length;
    const createTotalPages = Math.ceil(createTotalItems / createItemsPerPage) || 1;
    const createPageLeads = createFilteredLeads.slice((createPage - 1) * createItemsPerPage, createPage * createItemsPerPage);
    const createStartEntry = createTotalItems === 0 ? 0 : (createPage - 1) * createItemsPerPage + 1;
    const createEndEntry = Math.min(createPage * createItemsPerPage, createTotalItems);

    // --- FORM LOGIC (handles both Create + Edit) ---
    const handleSaveLead = async (e) => {
        e.preventDefault();
        if (!leadForm.segmentId) {
            setErrorMsg("Please select Type of Query (Segment) before saving.");
            return;
        }

        setActionLoading(true);
        setErrorMsg("");
        try {
            const payload = {
                ...leadForm,
                segmentId: Number(leadForm.segmentId)
            };
            const res = editingLeadId
                ? await adminService.updateLead({ leadId: editingLeadId, ...payload })
                : await adminService.createLead(payload);

            if (res?.success) {
                resetForm();
                await loadLeads();
            } else {
                setErrorMsg(res?.message || `Could not ${editingLeadId ? "update" : "save"} the lead.`);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg("Something went wrong while saving. Please try again.");
        } finally {
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setLeadForm(emptyLeadForm);
        setEditingLeadId(null);
        setErrorMsg("");
    };

    // Populate form with lead data for editing (used by mini table on Create tab)
    const handleEditLead = (lead) => {
        setLeadForm({
            leadDate: lead.leadDate ? lead.leadDate.split("T")[0] : todayISO(),
            name: lead.name || "",
            contactNo: lead.contactNo || "",
            alternateContactNo: lead.alternateContactNo || "",
            email: lead.email || "",
            address: lead.address || "",
            reference: lead.reference || "",
            segmentId: lead.segmentId ? String(lead.segmentId) : "",
            queryType: lead.queryType || "",
            remarks: lead.remarks || "",
            label: lead.label || "",
            status: lead.status || "New"
        });
        setEditingLeadId(lead.leadId);
        setErrorMsg("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteLead = async (lead) => {
        if (!window.confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;

        setDeletingId(lead.leadId);
        setErrorMsg("");
        try {
            const res = await adminService.deleteLead(lead.leadId);
            if (res?.success) {
                if (editingLeadId === lead.leadId) resetForm();
                await loadLeads();
            } else {
                setErrorMsg(res?.message || "Could not delete the lead.");
            }
        } catch (err) {
            console.error("Failed to delete lead", err);
            setErrorMsg("Something went wrong while deleting. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const statusStyles = {
        new: "bg-blue-50 text-blue-700 border-blue-200/50 dot-blue-500",
        followup: "bg-amber-50 text-amber-700 border-amber-200/50 dot-amber-500",
        survey: "bg-amber-50 text-amber-700 border-amber-200/50 dot-amber-500",
        proposal: "bg-purple-50 text-purple-700 border-purple-200/50 dot-purple-500",
        negotiation: "bg-orange-50 text-orange-700 border-orange-200/50 dot-orange-500",
        won: "bg-emerald-50 text-emerald-700 border-emerald-200/50 dot-emerald-500",
        lost: "bg-rose-50 text-rose-700 border-rose-200/50 dot-rose-500",
        notfeasible: "bg-slate-100 text-slate-600 border-slate-200 dot-slate-400",
    };

    const getStatusVisuals = (status) => {
        const statusKey = (status || "").toLowerCase().replace(/\s+/g, "");
        const statusClass = statusStyles[statusKey] || "bg-slate-50 text-slate-600 border-slate-200 dot-slate-400";
        const dotMatch = statusClass.match(/dot-([a-z]+-[0-9]+)/);
        const dotColor = dotMatch ? `bg-${dotMatch[1]}` : "bg-slate-400";
        const finalStatusClass = statusClass.replace(/dot-[a-z]+-[0-9]+/, "").trim();
        return { dotColor, finalStatusClass };
    };

    return (
        <div className="space-y-5 pb-10 font-sans relative z-0">

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-filter-circle-dollar text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Leads Pipeline</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Manage incoming leads, track statuses, and view pipeline details.</p>
                    </div>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-5 py-3.5 rounded-xl shadow-sm flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation" /> {errorMsg}
                </div>
            )}

            {/* ── Main Container (Tabs + Content) ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

                {/* ── Tabs Navigation ── */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50">
                    <button
                        onClick={() => { setActiveTab("table"); }}
                        className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 focus:outline-none ${activeTab === "table"
                            ? "border-amber-500 text-amber-600 bg-white"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <i className="fa-solid fa-table-list text-[13px]" />
                        All Leads
                    </button>
                    <button
                        onClick={() => setActiveTab("form")}
                        className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 focus:outline-none ${activeTab === "form"
                            ? "border-amber-500 text-amber-600 bg-white"
                            : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <i className="fa-solid fa-plus text-[13px]" />
                        Create New Lead
                    </button>
                </div>

                <div className="p-6 sm:p-8 min-h-[400px]">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-3">
                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                            <div className="text-sm font-medium text-slate-500 animate-pulse">Loading leads data...</div>
                        </div>
                    ) : (
                        <>
                            {/* TAB 1: ALL LEADS (view only) */}
                            {activeTab === "table" && (
                                <div className="space-y-4 animate-in fade-in duration-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="relative group w-full sm:max-w-md">
                                            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Search by name, contact, status, or segment..."
                                                value={searchTerm}
                                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                                className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors shadow-sm"
                                            />
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                            {filteredLeads.length} Lead(s) found
                                        </span>
                                    </div>

                                    <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                                        <table className="w-full text-left border-collapse min-w-[900px]">
                                            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-slate-200">
                                                <tr>
                                                    <th className="px-6 py-4">Lead Info</th>
                                                    <th className="px-6 py-4">Contact</th>
                                                    <th className="px-6 py-4">Segment</th>
                                                    <th className="px-6 py-4">Status</th>
                                                    <th className="px-6 py-4 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                                {currentLeads.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="text-center py-16">
                                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-2">
                                                                    <i className="fa-solid fa-inbox text-2xl text-slate-300" />
                                                                </div>
                                                                <p className="text-base font-bold text-slate-600">No leads found.</p>
                                                                <p className="text-xs font-medium">Try adjusting your search query.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : currentLeads.map((lead, idx) => {
                                                    const { dotColor, finalStatusClass } = getStatusVisuals(lead.status);
                                                    const initial = (lead.name || "?").trim().charAt(0).toUpperCase();
                                                    return (
                                                        <tr key={lead.leadId || idx} className="hover:bg-slate-50/60 transition-colors duration-150 group align-top">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3.5">
                                                                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm flex-shrink-0 border border-amber-200/60 shadow-sm">
                                                                        {initial}
                                                                    </div>
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">{lead.name}</span>
                                                                            {lead.label && (
                                                                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-100/50 rounded-md text-[9px] font-black uppercase tracking-wider shadow-sm">
                                                                                    {lead.label}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-[11px] font-mono text-slate-400 font-medium">#{lead.leadId}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="font-medium text-slate-700">{lead.email || "—"}</span>
                                                                    <span className="text-[11px] font-mono font-bold text-slate-400">{lead.contactNo}</span>
                                                                    {lead.alternateContactNo && (
                                                                        <span className="text-[11px] font-mono text-slate-400">Alt: {lead.alternateContactNo}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 tracking-wide uppercase">
                                                                    {lead.segmentName || "General"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${finalStatusClass}`}>
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                                                    {lead.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => navigate(`/sales/leads/${lead.leadId}`)}
                                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 border border-amber-200/50 transition-all shadow-sm"
                                                                >
                                                                    View Pipeline
                                                                    <i className="fa-solid fa-arrow-right text-[10px]" />
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
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-2 pt-2 text-sm text-slate-500 font-medium">
                                            <div>
                                                Showing <span className="font-bold text-slate-800">{startEntry}</span> to{" "}
                                                <span className="font-bold text-slate-800">{endEntry}</span> of{" "}
                                                <span className="font-bold text-slate-800">{totalItems}</span> entries
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <button
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
                                                >
                                                    <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                                                </button>
                                                <div className="hidden sm:flex items-center gap-1">
                                                    {pageNumbers.map(number => (
                                                        <button
                                                            key={number}
                                                            onClick={() => setCurrentPage(number)}
                                                            className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-bold transition-all shadow-sm ${currentPage === number
                                                                ? "bg-amber-500 border-amber-500 text-white"
                                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                                }`}
                                                        >
                                                            {number}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
                                                >
                                                    Next <i className="fa-solid fa-chevron-right text-[10px]" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: CREATE / EDIT LEAD + editable mini table below */}
                            {activeTab === "form" && (
                                <div className="max-w-4xl mx-auto animate-in fade-in duration-200 space-y-8">
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setShowSegmentModal(true)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 border border-amber-200/50 transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            <i className="fa-solid fa-layer-group" /> Add New Segment
                                        </button>
                                    </div>

                                    <form onSubmit={handleSaveLead} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editingLeadId ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                                                    <i className={`fa-solid ${editingLeadId ? "fa-pen" : "fa-user-plus"}`} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800">
                                                    {editingLeadId ? `Edit Lead #${editingLeadId}` : "New Lead Details"}
                                                </h3>
                                            </div>
                                            {editingLeadId && (
                                                <button
                                                    type="button"
                                                    onClick={resetForm}
                                                    className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1"
                                                >
                                                    <i className="fa-solid fa-xmark" /> Cancel Edit
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Lead Date *</label>
                                                <input type="date" required value={leadForm.leadDate} onChange={e => setLeadForm({ ...leadForm, leadDate: e.target.value })} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Type of Query (Segment) *</label>
                                                <select required value={leadForm.segmentId} onChange={e => setLeadForm({ ...leadForm, segmentId: e.target.value })} className={`${inputClass} cursor-pointer appearance-none`}>
                                                    <option value="" disabled>-- Select Segment --</option>
                                                    {segments.map(seg => (
                                                        <option key={seg.segmentId} value={seg.segmentId}>{seg.segmentName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Client Name *</label>
                                                <input type="text" required placeholder="e.g. John Doe" value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Phone Number *</label>
                                                <input type="text" required placeholder="e.g. 9876543210" value={leadForm.contactNo}
                                                    onChange={(e) => setLeadForm({ ...leadForm, contactNo: e.target.value })}
                                                    className={inputClass}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Alternate Mobile Number</label>
                                                <input type="text" placeholder="e.g. 9123456780 (optional)" value={leadForm.alternateContactNo}
                                                    onChange={(e) => setLeadForm({ ...leadForm, alternateContactNo: e.target.value })}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Email Address</label>
                                                <input type="email" placeholder="e.g. john@example.com" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} className={inputClass} />
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Reference (Lead Source)</label>
                                                <input type="text" placeholder="e.g. Existing Client, Facebook, Dealer" value={leadForm.reference} onChange={e => setLeadForm({ ...leadForm, reference: e.target.value })} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Query Type</label>
                                                <input type="text" placeholder="e.g. New Installation, Repair, Enquiry" value={leadForm.queryType} onChange={e => setLeadForm({ ...leadForm, queryType: e.target.value })} className={inputClass} />
                                            </div>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className={labelClass}>Label</label>
                                                <input type="text" placeholder="e.g. Hot Lead" value={leadForm.label} onChange={e => setLeadForm({ ...leadForm, label: e.target.value })} className={inputClass} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Address / Location</label>
                                            <textarea placeholder="Site or client address..." value={leadForm.address} onChange={e => setLeadForm({ ...leadForm, address: e.target.value })} rows={2} className={`${inputClass} resize-y`} />
                                        </div>

                                        <div>
                                            <label className={labelClass}>Remarks</label>
                                            <textarea placeholder="Any additional notes about this query..." value={leadForm.remarks} onChange={e => setLeadForm({ ...leadForm, remarks: e.target.value })} rows={3} className={`${inputClass} resize-y`} />
                                        </div>

                                        <div className="flex justify-end pt-5 border-t border-slate-100">
                                            <button type="submit" disabled={actionLoading}
                                                className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-[#0b2836] hover:bg-[#0f3345] rounded-xl shadow-lg shadow-[#0b2836]/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0"
                                            >
                                                {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className={`fa-solid ${editingLeadId ? "fa-check" : "fa-floppy-disk"}`} />}
                                                {actionLoading ? "Saving..." : (editingLeadId ? "Update Lead" : "Create Lead")}
                                            </button>
                                        </div>
                                    </form>

                                    {/* ── Mini editable table below the form ── */}
                                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                    <i className="fa-solid fa-list-check" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-800">Recently Added Leads</h3>
                                            </div>
                                            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                {createFilteredLeads.length} Lead(s)
                                            </span>
                                        </div>
                                        <div className="relative group w-full sm:max-w-sm">
                                            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Search leads..."
                                                value={createSearchTerm}
                                                onChange={(e) => { setCreateSearchTerm(e.target.value); setCreatePage(1); }}
                                                className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors shadow-sm"
                                            />
                                        </div>
                                        <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm">
                                            <table className="w-full text-left border-collapse min-w-[700px]">
                                                <thead className="bg-slate-50/80 text-[10px] font-bold uppercase text-slate-500 tracking-widest border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-6 py-4">Lead Info</th>
                                                        <th className="px-6 py-4">Contact</th>
                                                        <th className="px-6 py-4">Segment</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4 text-right">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                                    {createPageLeads.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="text-center py-12">
                                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                                    <i className="fa-solid fa-inbox text-2xl text-slate-300" />
                                                                    <p className="text-sm font-bold text-slate-600">No leads yet.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : createPageLeads.map((lead, idx) => {
                                                        const { dotColor, finalStatusClass } = getStatusVisuals(lead.status);
                                                        const isBeingEdited = editingLeadId === lead.leadId;
                                                        return (
                                                            <tr key={lead.leadId || idx} className={`transition-colors duration-150 align-top ${isBeingEdited ? "bg-amber-50/60" : "hover:bg-slate-50/60"}`}>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="font-bold text-slate-900">{lead.name}</span>
                                                                        <div className="text-[11px] font-mono text-slate-400 font-medium">#{lead.leadId}</div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="font-medium text-slate-700">{lead.email || "—"}</span>
                                                                        <span className="text-[11px] font-mono font-bold text-slate-400">{lead.contactNo}</span>
                                                                        {lead.alternateContactNo && (
                                                                            <span className="text-[11px] font-mono text-slate-400">Alt: {lead.alternateContactNo}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 tracking-wide uppercase">
                                                                        {lead.segmentName || "General"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${finalStatusClass}`}>
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                                                        {lead.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => handleEditLead(lead)}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/50 transition-all shadow-sm"
                                                                        >
                                                                            <i className="fa-solid fa-pen text-[10px]" /> Edit
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteLead(lead)}
                                                                            disabled={deletingId === lead.leadId}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/50 transition-all shadow-sm disabled:opacity-50"
                                                                        >
                                                                            {deletingId === lead.leadId
                                                                                ? <i className="fa-solid fa-spinner animate-spin text-[10px]" />
                                                                                : <i className="fa-solid fa-trash text-[10px]" />}
                                                                            Delete
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {createTotalItems > 0 && (
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 px-2 pt-1 text-xs text-slate-500 font-medium">
                                                <div>
                                                    Showing <span className="font-bold text-slate-800">{createStartEntry}</span>–<span className="font-bold text-slate-800">{createEndEntry}</span> of <span className="font-bold text-slate-800">{createTotalItems}</span>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button
                                                        disabled={createPage === 1}
                                                        onClick={() => setCreatePage(p => Math.max(1, p - 1))}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                                    >
                                                        <i className="fa-solid fa-chevron-left text-[10px]" />
                                                    </button>
                                                    <span className="px-2 py-1.5 font-bold text-slate-700">{createPage} / {createTotalPages}</span>
                                                    <button
                                                        disabled={createPage === createTotalPages}
                                                        onClick={() => setCreatePage(p => Math.min(createTotalPages, p + 1))}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                                    >
                                                        <i className="fa-solid fa-chevron-right text-[10px]" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Add Segment Modal ── */}
            {showSegmentModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[24px] p-7 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Add New Segment</h3>
                            <button
                                type="button"
                                onClick={() => { setShowSegmentModal(false); setSegmentName(""); setSegmentError(""); }}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        {segmentError && (
                            <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation" /> {segmentError}
                            </div>
                        )}

                        <form onSubmit={handleAddSegment} className="space-y-6">
                            <div>
                                <label className={labelClass}>
                                    Segment Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="e.g. PMSGY, Industrial, Commercial"
                                    value={segmentName}
                                    onChange={(e) => setSegmentName(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowSegmentModal(false); setSegmentName(""); setSegmentError(""); }}
                                    className="px-5 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={segmentLoading}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 flex items-center gap-2"
                                >
                                    {segmentLoading ? <i className="fa-solid fa-spinner animate-spin" /> : null}
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