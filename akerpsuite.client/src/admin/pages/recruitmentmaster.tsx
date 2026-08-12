import { useState, useEffect, useMemo } from "react";
import CandidateManagement from "./candidatemanagement";
import { adminService } from "@/services/adminService";

const TABS = [
    { id: "candidates", label: "Candidate Tracking", icon: "fa-solid fa-user-tie" },
    { id: "report", label: "Recruitment Report", icon: "fa-solid fa-chart-pie" },
];

const FIELD = {
    requisitionId: "requisitionId",
    requisitionTitle: "requisitionTitle",
    departmentName: "departmentName",
    designationName: "designationName",
    vacancies: "vacancies",
    requisitionStatus: "requisitionStatus",
    postingStatus: "postingStatus",
    shareableLink: "shareableLink",
    totalApplied: "totalApplied",
    totalShortlisted: "totalShortlisted",
    totalInterview: "totalInterview",
    totalSelected: "totalSelected",
    totalOffer: "totalOffer",
    totalJoined: "totalJoined",
    totalRejected: "totalRejected",
};

const STATUS_STYLES = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200/50",
    ApprovedByManager: "bg-blue-50 text-blue-700 border-blue-200/50",
    ApprovedByHR: "bg-amber-50 text-amber-700 border-amber-200/50",
    ApprovedByMgmt: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200/50",
    Open: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
    Closed: "bg-slate-50 text-slate-600 border-slate-200",
    Draft: "bg-slate-50 text-slate-600 border-slate-200",
    Published: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
};

const DOT_STYLES = {
    Pending: "bg-amber-500",
    ApprovedByManager: "bg-blue-500",
    ApprovedByHR: "bg-amber-500",
    ApprovedByMgmt: "bg-emerald-500",
    Rejected: "bg-rose-500",
    Open: "bg-emerald-500",
    Closed: "bg-slate-400",
    Draft: "bg-slate-400",
    Published: "bg-emerald-500",
};

function StatusBadge({ value }) {
    if (!value) return <span className="text-slate-400 text-xs">—</span>;
    const cls = STATUS_STYLES[value] || "bg-slate-50 text-slate-600 border-slate-200";
    const dotCls = DOT_STYLES[value] || "bg-slate-400";
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`}></span>
            {value}
        </span>
    );
}

function StatCard({ label, value, icon, bgColor, iconColor }) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    {label}
                </p>
                {icon && (
                    <div className={`w-9 h-9 rounded-xl ${bgColor || "bg-amber-50"} flex items-center justify-center shrink-0`}>
                        <i className={`fa-solid ${icon} ${iconColor || "text-amber-600"} text-xs`} />
                    </div>
                )}
            </div>
            <div className="mt-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight tabular-nums">
                    {value}
                </h2>
            </div>
        </div>
    );
}

function RecruitmentReportTab() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({ fromDate: "", toDate: "" });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const fetchReport = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await adminService.getRecruitmentStatusReport(filters);
            setRows(res?.Data || res?.data || []);
            setCurrentPage(1);
        } catch (err) {
            setError(err.message || "Failed to load recruitment report");
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totals = useMemo(() => {
        return rows.reduce(
            (acc, r) => {
                acc.applied += Number(r[FIELD.totalApplied] || 0);
                acc.shortlisted += Number(r[FIELD.totalShortlisted] || 0);
                acc.interview += Number(r[FIELD.totalInterview] || 0);
                acc.selected += Number(r[FIELD.totalSelected] || 0);
                acc.offer += Number(r[FIELD.totalOffer] || 0);
                acc.joined += Number(r[FIELD.totalJoined] || 0);
                acc.rejected += Number(r[FIELD.totalRejected] || 0);
                return acc;
            },
            { applied: 0, shortlisted: 0, interview: 0, selected: 0, offer: 0, joined: 0, rejected: 0 }
        );
    }, [rows]);

    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

    const paginatedRows = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return rows.slice(start, start + pageSize);
    }, [rows, currentPage]);

    const pageNumbers = useMemo(() => {
        const nums = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                nums.push(i);
            }
        }
        const result = [];
        let prev = 0;
        for (const n of nums) {
            if (prev && n - prev > 1) {
                result.push({ type: "ellipsis", key: "e" + n });
            }
            result.push({ type: "page", value: n, key: "p" + n });
            prev = n;
        }
        return result;
    }, [totalPages, currentPage]);

    const handleApply = (e) => {
        e.preventDefault();
        fetchReport();
    };

    const handleClear = () => {
        setFilters({ fromDate: "", toDate: "" });
        setTimeout(fetchReport, 0);
    };

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const rangeEnd = Math.min(currentPage * pageSize, rows.length);

    return (
        <div className="space-y-6">
            <form onSubmit={handleApply} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">From Date</label>
                    <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                    />
                </div>
                <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">To Date</label>
                    <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#0b2836] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#0f3345] transition-all shadow-md shadow-[#0b2836]/20"
                    >
                        Apply Filter
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs sm:text-sm font-bold rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Clear
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <StatCard label="Applied" value={totals.applied} icon="fa-user-plus" bgColor="bg-blue-50" iconColor="text-blue-600" />
                <StatCard label="Shortlisted" value={totals.shortlisted} icon="fa-filter" bgColor="bg-amber-50" iconColor="text-amber-600" />
                <StatCard label="Interview" value={totals.interview} icon="fa-comments" bgColor="bg-purple-50" iconColor="text-purple-600" />
                <StatCard label="Selected" value={totals.selected} icon="fa-user-check" bgColor="bg-emerald-50" iconColor="text-emerald-600" />
                <StatCard label="Offer" value={totals.offer} icon="fa-file-contract" bgColor="bg-blue-50" iconColor="text-blue-600" />
                <StatCard label="Joined" value={totals.joined} icon="fa-handshake" bgColor="bg-green-50" iconColor="text-green-600" />
                <StatCard label="Rejected" value={totals.rejected} icon="fa-user-xmark" bgColor="bg-rose-50" iconColor="text-rose-600" />
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-5 py-3.5 font-semibold flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation" /> {error}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[1200px]">
                        <thead className="bg-slate-50/80 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-4 text-left">Requisition</th>
                                <th className="px-5 py-4 text-left">Dept</th>
                                <th className="px-5 py-4 text-left">Designation</th>
                                <th className="px-5 py-4 text-center">Vacancies</th>
                                <th className="px-5 py-4 text-left">Req Status</th>
                                <th className="px-5 py-4 text-left">Posting Status</th>
                                <th className="px-5 py-4 text-left">Job Link</th>
                                <th className="px-5 py-4 text-center">Applied</th>
                                <th className="px-5 py-4 text-center">Shortlisted</th>
                                <th className="px-5 py-4 text-center">Interview</th>
                                <th className="px-5 py-4 text-center">Selected</th>
                                <th className="px-5 py-4 text-center">Offer</th>
                                <th className="px-5 py-4 text-center">Joined</th>
                                <th className="px-5 py-4 text-center">Rejected</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr>
                                    <td colSpan={14} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                                            <div className="text-sm font-medium text-slate-500 animate-pulse">Loading report data...</div>
                                        </div>
                                    </td>
                                </tr>
                            )}

                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td colSpan={14} className="py-24 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                                            <i className="fa-solid fa-folder-open" />
                                        </div>
                                        <p className="text-base font-bold text-slate-700">No Requisitions Found</p>
                                        <p className="text-sm text-slate-400 mt-1 font-medium">No requisitions found for the selected range.</p>
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                paginatedRows.map((r, i) => (
                                    <tr key={r[FIELD.requisitionId] ?? i} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-5 py-4 font-bold text-slate-900">
                                            {r[FIELD.requisitionTitle]}
                                        </td>
                                        <td className="px-5 py-4 text-slate-600 font-medium">{r[FIELD.departmentName] || "—"}</td>
                                        <td className="px-5 py-4 text-slate-600 font-medium">{r[FIELD.designationName] || "—"}</td>
                                        <td className="px-5 py-4 text-center font-mono font-bold text-slate-700">{r[FIELD.vacancies]}</td>
                                        <td className="px-5 py-4">
                                            <StatusBadge value={r[FIELD.requisitionStatus]} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge value={r[FIELD.postingStatus]} />
                                        </td>
                                        <td className="px-5 py-4">
                                            {r[FIELD.shareableLink] ? (
                                                <a
                                                    href={r[FIELD.shareableLink]}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-3 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 font-bold rounded-lg text-xs transition-colors border border-amber-200/50 inline-block"
                                                >
                                                    View Link
                                                </a>
                                            ) : (
                                                <span className="text-slate-300 text-xs font-bold">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center font-mono font-semibold text-slate-700">{r[FIELD.totalApplied]}</td>
                                        <td className="px-5 py-4 text-center font-mono font-semibold text-amber-600">{r[FIELD.totalShortlisted]}</td>
                                        <td className="px-5 py-4 text-center font-mono font-semibold text-purple-600">{r[FIELD.totalInterview]}</td>
                                        <td className="px-5 py-4 text-center font-mono font-semibold text-emerald-600">{r[FIELD.totalSelected]}</td>
                                        <td className="px-5 py-4 text-center font-mono font-semibold text-blue-600">{r[FIELD.totalOffer]}</td>
                                        <td className="px-5 py-4 text-center font-mono font-bold text-green-700 bg-green-50/30">
                                            {r[FIELD.totalJoined]}
                                        </td>
                                        <td className="px-5 py-4 text-center font-mono font-semibold text-rose-600">{r[FIELD.totalRejected]}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {!loading && rows.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4 mt-auto">
                        <div>
                            Showing <span className="font-bold text-slate-800">{rangeStart}</span> to{" "}
                            <span className="font-bold text-slate-800">{rangeEnd}</span> of{" "}
                            <span className="font-bold text-slate-800">{rows.length}</span> entries
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => goToPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                            </button>
                            <div className="hidden sm:flex items-center gap-1">
                                {pageNumbers.map((item) =>
                                    item.type === "ellipsis" ? (
                                        <span key={item.key} className="px-2 text-xs text-slate-400 font-bold">…</span>
                                    ) : (
                                        <button
                                            key={item.key}
                                            onClick={() => goToPage(item.value)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-bold transition-all shadow-sm ${item.value === currentPage
                                                    ? "bg-amber-500 border-amber-500 text-white"
                                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            {item.value}
                                        </button>
                                    )
                                )}
                            </div>
                            <button
                                onClick={() => goToPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
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

export default function RecruitmentMaster() {
    const [activeTab, setActiveTab] = useState("candidates");

    return (
        <div className="space-y-5 pb-10 font-sans relative z-0">

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-people-arrows text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Recruitment & Hiring</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Track candidates from application to joining, and view the overall recruitment pipeline report.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Main Container (Tabs + Content) ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

                {/* ── Tabs Navigation ── */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 focus:outline-none ${activeTab === t.id
                                    ? "border-amber-500 text-amber-600 bg-white"
                                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                }`}
                        >
                            <i className={`${t.icon} text-[13px]`} />
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 sm:p-8 min-h-[400px] bg-white">
                    {activeTab === "candidates" && <CandidateManagement />}
                    {activeTab === "report" && <RecruitmentReportTab />}
                </div>
            </div>
        </div>
    );
}