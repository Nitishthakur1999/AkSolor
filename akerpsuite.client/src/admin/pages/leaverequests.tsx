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

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Leave Requests</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Approve or reject employee leave applications.</p>
                </div>
                <div className="w-full sm:w-64">
                    <input type="text" placeholder="Search by employee, type, or status..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:border-amber-500" />
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-sm font-semibold text-amber-600 animate-pulse">Loading requests...</div>
                ) : (
                    <div className="overflow-x-auto min-h-[300px]">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Leave Type</th>
                                    <th className="px-6 py-4">Duration</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {currentItems.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">{searchTerm ? "No matching leave requests found." : "No leave requests found."}</td></tr>
                                ) : currentItems.map((req) => (
                                    <tr key={req.leaveId} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-semibold text-slate-900">{req.fullName || `EMP-${req.empId}`}</td>
                                        <td className="px-6 py-4">{req.leaveName || `Type-${req.leaveTypeId}`}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-500">{new Date(req.fromDate).toLocaleDateString()} to</div>
                                            <div className="font-medium">{new Date(req.toDate).toLocaleDateString()} <span className="text-amber-600">({req.totalDays} Days)</span></div>
                                        </td>
                                        <td className="px-6 py-4 text-xs max-w-[200px] truncate">{req.reason}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${req.status === "Approved" ? "bg-emerald-50 text-emerald-700" : req.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-2">
                                            {req.status === "Pending" ? (
                                                <>
                                                    <button onClick={() => handleLeaveAction(req.leaveId, "Approved")} className="px-4 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors">Approve</button>
                                                    <button onClick={() => handleLeaveAction(req.leaveId, "Rejected")} className="px-4 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition-colors">Reject</button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Action Taken</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-slate-200 bg-slate-50">
                        <span className="text-xs text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded border bg-white text-slate-600 text-sm hover:bg-slate-100 disabled:opacity-50">Prev</button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded border bg-white text-slate-600 text-sm hover:bg-slate-100 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}