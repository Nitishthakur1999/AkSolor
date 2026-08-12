import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

export default function LeaveRequests() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [loading, setLoading] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const res = await adminService.getAllLeaveRequests();
            if (res.Success || res.success) setLeaveRequests(res.Data || res.data || []);
        } catch (err) {
            console.error("Failed to load requests:", err);
            // 🐛 FIX: this endpoint is restricted to CMD/Admin/HR/Manager on the
            // backend. If a user without one of those roles lands on this page,
            // the request fails silently and they just see "No leave requests
            // found" — which looks like there's no data, not that they lack
            // permission. Surface a real message instead.
            alert("Failed to load leave requests. You may not have permission to view this data.");
        } finally {
            setLoading(false);
        }
    };

    // 🎯 Approvals Action
    const handleLeaveAction = async (leaveId, statusAction) => {
        try {
            const payload = {
                status: statusAction,
                approvedBy: user?.userId || 1,
                remarks: `Request ${statusAction} by Admin/HR`
            };
            const res = await adminService.actionLeaveRequest(leaveId, payload);
            if (res.Success || res.success) {
                setLeaveRequests(prev => prev.map(req => req.leaveId === leaveId ? { ...req, status: statusAction } : req));
            } else {
                alert(res.Message || "Failed to process request");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong while processing this request.");
        }
    };

    // 🎯 Filter & Pagination
    // 🐛 FIX: previously did `Object.values(item).join(" ")` which matches
    // against every field including numeric IDs (empId, leaveTypeId, totalDays,
    // etc). Searching "1" would match unrelated rows just because some number
    // field happened to contain a "1". Restrict the search to the fields a
    // user would actually expect to search by.
    const SEARCHABLE_FIELDS = ["fullName", "leaveName", "reason", "status"];
    const filteredData = leaveRequests.filter(item => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return SEARCHABLE_FIELDS.some(f => (item[f] ?? "").toString().toLowerCase().includes(q));
    });

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-5 pb-10 font-sans">

            {/* ── Compact Header Section ── */}
            <div className="bg-[#0b2532] rounded-2xl px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-calendar-minus text-lg text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Leave Requests</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Approve or reject employee leave applications.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Live Search Utilities Bar ── */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Search Requests</label>
                <div className="relative group flex items-center gap-3">
                    <div className="relative flex-1">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by employee, type, reason or status..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                    {searchTerm && (
                        <button
                            onClick={() => { setSearchTerm(""); setCurrentPage(1); }}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ── Core Records Table ── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div className="overflow-x-auto min-h-[300px]">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-4">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Fetching leave requests...</div>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                <i className="fa-solid fa-folder-open text-2xl text-slate-300" />
                            </div>
                            <p className="text-base text-slate-700 font-bold">No results found</p>
                            <p className="text-sm text-slate-400 mt-1 font-medium">{searchTerm ? "Try adjusting your search query." : "No pending leave requests found."}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Employee</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Leave Type</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Duration</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Reason</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {currentItems.map((req) => (
                                    <tr key={req.leaveId} className="hover:bg-slate-50/60 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{req.fullName || `EMP-${req.empId}`}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                {req.leaveName || `Type-${req.leaveTypeId}`}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-[11px] font-medium text-slate-500">{new Date(req.fromDate).toLocaleDateString()} to</div>
                                            <div className="font-bold text-slate-800 mt-0.5">
                                                {new Date(req.toDate).toLocaleDateString()}
                                                <span className="text-amber-600 ml-1.5 font-bold">({req.totalDays} Days)</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-600 max-w-[200px] truncate" title={req.reason}>
                                            {req.reason}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${req.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" :
                                                    req.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200/50" :
                                                        "bg-rose-50 text-rose-700 border-rose-200/50"
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${req.status === "Approved" ? "bg-emerald-500" :
                                                        req.status === "Pending" ? "bg-amber-500" :
                                                            "bg-rose-500"
                                                    }`} />
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {req.status === "Pending" ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleLeaveAction(req.leaveId, "Approved")}
                                                        className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/50 text-[11px] font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleLeaveAction(req.leaveId, "Rejected")}
                                                        className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200/50 text-[11px] font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-100 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 italic">Action Taken</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 🔢 PAGINATION WIDGET BAR */}
                {!loading && filteredData.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4">
                        <div>
                            Showing <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                            <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, filteredData.length)}</span> of{" "}
                            <span className="font-bold text-slate-800">{filteredData.length}</span> entries
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                            </button>
                            <div className="hidden sm:flex gap-1.5">
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPage(index + 1)}
                                        className={`w-8 h-8 rounded-lg border text-sm font-bold transition-all shadow-sm flex items-center justify-center ${currentPage === index + 1
                                                ? "bg-amber-500 border-amber-500 text-white"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                Next <i className="fa-solid fa-chevron-right text-[10px]" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}