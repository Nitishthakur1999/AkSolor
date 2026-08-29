import React, { useState, useEffect, useCallback, useMemo } from "react";
import { adminService } from "@/services/adminService";

const STATUS_STYLES = {
    Present: "bg-emerald-50 text-emerald-700 border-emerald-200/50 dot-emerald-500",
    Absent: "bg-rose-50 text-rose-700 border-rose-200/50 dot-rose-500",
    "Half-Day": "bg-amber-50 text-amber-700 border-amber-200/50 dot-amber-500",
    Holiday: "bg-blue-50 text-blue-700 border-blue-200/50 dot-blue-500",
    WeekOff: "bg-slate-100 text-slate-600 border-slate-200 dot-slate-400",
    Leave: "bg-purple-50 text-purple-700 border-purple-200/50 dot-purple-500",
};

const REG_STATUS_STYLES = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200/50 dot-amber-500",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200/50 dot-emerald-500",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200/50 dot-rose-500",
};

function StatusBadge({ status, styleMap }: any) {
    const config = styleMap[status] || "bg-slate-100 text-slate-600 border-slate-200 dot-slate-400";
    const dotClass = config.split(' ').find((c: string) => c.startsWith('dot-'))?.replace('dot-', 'bg-') || 'bg-slate-400';
    const bgClass = config.split(' ').filter((c: string) => !c.startsWith('dot-')).join(' ');

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${bgClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
            {status}
        </span>
    );
}

const firstDayOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm";
const labelClass = "block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1";
const PAGE_SIZE = 10;

export default function MyAttendance() {
    const [fromDate, setFromDate] = useState(firstDayOfMonth());
    const [toDate, setToDate] = useState(today());
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showRegularizeModal, setShowRegularizeModal] = useState(false);

    // --- Pagination state for Attendance Logs ---
    const [attPage, setAttPage] = useState(1);

    // --- State for regularization requests ---
    const [regRequests, setRegRequests] = useState([]);
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState("");
    const [regStatusFilter, setRegStatusFilter] = useState("");

    // --- Pagination state for Regularization Requests ---
    const [regPage, setRegPage] = useState(1);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await adminService.getMyAttendance({ fromDate, toDate });
            if (res.success || res.Success) {
                setRecords(res.data || res.Data || []);
                setAttPage(1); // Reset to first page on new data
            } else {
                setError(res.message || res.Message || "Failed to load attendance");
            }
        } catch (err) {
            setError("Something went wrong, please try again");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate]);

    const fetchRegularizations = useCallback(async () => {
        setRegLoading(true);
        setRegError("");
        try {
            const res = await adminService.getMyRegularizations(
                regStatusFilter ? { status: regStatusFilter } : {}
            );
            if (res.success || res.Success) {
                setRegRequests(res.data || res.Data || []);
                setRegPage(1); // Reset to first page on new data
            } else {
                setRegError(res.message || res.Message || "Failed to load regularization requests");
            }
        } catch (err) {
            setRegError("Something went wrong, please try again");
        } finally {
            setRegLoading(false);
        }
    }, [regStatusFilter]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    useEffect(() => {
        fetchRegularizations();
    }, [fetchRegularizations]);

    // --- Pagination Calculations ---
    const totalAttPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
    const paginatedAtt = useMemo(() => {
        const start = (attPage - 1) * PAGE_SIZE;
        return records.slice(start, start + PAGE_SIZE);
    }, [records, attPage]);

    const totalRegPages = Math.max(1, Math.ceil(regRequests.length / PAGE_SIZE));
    const paginatedReg = useMemo(() => {
        const start = (regPage - 1) * PAGE_SIZE;
        return regRequests.slice(start, start + PAGE_SIZE);
    }, [regRequests, regPage]);

    // Pagination UI Helper
    const renderPagination = (currentPage: number, totalPages: number, totalCount: number, setPageFn: Function) => {
        if (totalCount === 0) return null;
        const start = (currentPage - 1) * PAGE_SIZE + 1;
        const end = Math.min(currentPage * PAGE_SIZE, totalCount);

        return (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4 mt-auto">
                <div>
                    Showing <span className="font-bold text-slate-800">{start}</span> to{" "}
                    <span className="font-bold text-slate-800">{end}</span> of{" "}
                    <span className="font-bold text-slate-800">{totalCount}</span> entries
                </div>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setPageFn((p: number) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                    >
                        <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                    </button>
                    <div className="hidden sm:flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .reduce((acc: any[], p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("ellipsis-" + p);
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p) =>
                                typeof p === "string" ? (
                                    <span key={p} className="px-2 text-xs text-slate-400 font-bold">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setPageFn(p)}
                                        className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-bold transition-all shadow-sm ${p === currentPage
                                                ? "bg-amber-500 border-amber-500 text-white"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                    </div>
                    <button
                        onClick={() => setPageFn((p: number) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                    >
                        Next <i className="fa-solid fa-chevron-right text-[10px]" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-10 font-sans relative z-0">

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-clock text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">My Attendance</h2>
                        <p className="text-xs text-slate-400 mt-0.5">View your daily attendance logs and submit regularization requests.</p>
                    </div>
                </div>
                <div className="relative z-10 w-full sm:w-auto">
                    <button
                        onClick={() => setShowRegularizeModal(true)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 text-[#0b2836] font-bold rounded-xl text-xs shadow-md shadow-amber-400/20 hover:bg-amber-500 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-pen-to-square" /> Request Regularization
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-5 py-3.5 rounded-xl shadow-sm flex items-center gap-2 animate-in fade-in">
                    <i className="fa-solid fa-triangle-exclamation" /> {error}
                </div>
            )}

            {/* ── Filter Controls ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <label className={labelClass}>From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className={labelClass}>To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className="w-full sm:w-auto">
                        <button
                            onClick={fetchAttendance}
                            className="w-full sm:w-auto px-6 py-2.5 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-md shadow-[#0b2836]/20 hover:bg-[#0f3345] transition-all flex items-center justify-center gap-2 h-[42px]"
                        >
                            <i className="fa-solid fa-filter" /> Apply Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Attendance Log Table ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-sm font-bold text-slate-800">
                        Attendance Logs
                    </h3>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                        <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Punch In</th>
                                <th className="px-6 py-4">Punch Out</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="relative w-10 h-10 flex items-center justify-center">
                                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                                <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                                            </div>
                                            <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Loading attendance logs...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                                            <i className="fa-solid fa-calendar-xmark" />
                                        </div>
                                        <p className="text-base font-bold text-slate-700">No Records Found</p>
                                        <p className="text-sm text-slate-400 mt-1 font-medium">There are no attendance logs for the selected date range.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedAtt.map((r: any, i: number) => (
                                    <tr key={r.attId || i} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-mono font-bold text-amber-600">{r.attDate?.slice(0, 10)}</td>
                                        <td className="px-6 py-4 font-mono font-medium">{r.checkIn || "—"}</td>
                                        <td className="px-6 py-4 font-mono font-medium">{r.checkOut || "—"}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={r.status} styleMap={STATUS_STYLES} />
                                        </td>     
                                        <td className="px-6 py-4 max-w-[200px] truncate text-xs text-slate-500 font-medium" title={r.remarks || ""}>
                                            {r.remarks || "—"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {!loading && renderPagination(attPage, totalAttPages, records.length, setAttPage)}
            </div>

            {/* ── My Regularization Requests ── */}
            <div className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight  p-5" >My Regularization Requests</h2>
                    <div className="w-full sm:w-auto min-w-[160px]">
                        <select
                            value={regStatusFilter}
                            onChange={(e) => setRegStatusFilter(e.target.value)}
                            className={`${inputClass} cursor-pointer appearance-none bg-white py-2`}
                        >
                            <option value="">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {regError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-5 py-3.5 rounded-xl shadow-sm flex items-center gap-2 mb-4 animate-in fade-in">
                        <i className="fa-solid fa-triangle-exclamation" /> {regError}
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto min-h-[200px]">
                        <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[800px]">
                            <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Request Date</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Approved By</th>
                                    <th className="px-6 py-4">Approved At</th>
                                    <th className="px-6 py-4">Submitted At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {regLoading ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <i className="fa-solid fa-spinner text-2xl text-amber-500 animate-spin" />
                                                <div className="text-xs font-semibold text-slate-400 tracking-wide animate-pulse">Loading requests...</div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : regRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-16 text-center">
                                            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-xl shadow-sm mb-3 border border-slate-100">
                                                <i className="fa-solid fa-folder-open" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">No Requests Found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedReg.map((r: any, i: number) => (
                                        <tr key={r.requestId || i} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.requestDate?.slice(0, 10)}</td>
                                            <td className="px-6 py-4 max-w-[250px] truncate text-xs text-slate-600 font-medium" title={r.reason}>{r.reason || "—"}</td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={r.status} styleMap={REG_STATUS_STYLES} />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-700">{r.approvedBy || "—"}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                {r.approvedAt ? r.approvedAt.slice(0, 10) : "—"}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                {r.createdAt ? r.createdAt.slice(0, 16).replace("T", " ") : "—"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {!regLoading && renderPagination(regPage, totalRegPages, regRequests.length, setRegPage)}
                </div>
            </div>

            {/* ── Regularize Request Modal ── */}
            {showRegularizeModal && (
                <RegularizeModal
                    onClose={() => setShowRegularizeModal(false)}
                    onSuccess={() => {
                        setShowRegularizeModal(false);
                        fetchAttendance();
                        fetchRegularizations();
                    }}
                />
            )}
        </div>
    );
}

function RegularizeModal({ onClose, onSuccess }: any) {
    const [date, setDate] = useState(today());
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError("Please provide a valid reason.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const res = await adminService.requestRegularization({
                requestDate: date,
                reason,
            });
            if (res.success || res.Success) {
                onSuccess();
            } else {
                setError(res.message || res.Message || "Failed to submit request");
            }
        } catch (err) {
            setError("Something went wrong, please try again");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-7 w-full max-w-md relative animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <i className="fa-solid fa-pen-to-square text-amber-500" /> Regularize Attendance
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                        <i className="fa-solid fa-xmark text-lg" />
                    </button>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className={labelClass}>Select Date *</label>
                        <input
                            type="date"
                            value={date}
                            max={today()}
                            onChange={(e) => setDate(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Reason / Remarks *</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className={`${inputClass} resize-y`}
                            placeholder="Why did you miss the punch? Explain briefly..."
                        />
                    </div>
                </div>

                {error && (
                    <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2">
                        <i className="fa-solid fa-circle-exclamation" /> {error}
                    </div>
                )}

                <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-600/20 hover:bg-amber-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 transition-all flex items-center gap-2"
                    >
                        {submitting ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-paper-plane" />}
                        {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                </div>
            </div>
        </div>
    );
}