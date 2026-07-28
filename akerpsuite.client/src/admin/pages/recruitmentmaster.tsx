import { useState, useEffect, useMemo } from "react";
import CandidateManagement from "./candidatemanagement";
import { adminService } from "../../services/adminService"; // adjust path to your project structure

const TABS = [
    { id: "candidates", label: "Candidate Tracking (ATS)" },
    { id: "report", label: "Recruitment Report" },
];

// .NET's default JSON serializer returns camelCase property names
// (RequisitionTitle -> requisitionTitle). If your API returns PascalCase
// instead, change the values below to match.
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
    Pending: "bg-slate-100 text-slate-600",
    ApprovedByManager: "bg-amber-50 text-amber-700",
    ApprovedByHR: "bg-amber-50 text-amber-700",
    ApprovedByMgmt: "bg-emerald-50 text-emerald-700",
    Rejected: "bg-rose-50 text-rose-700",
    Open: "bg-emerald-50 text-emerald-700",
    Closed: "bg-slate-100 text-slate-600",
    Draft: "bg-slate-100 text-slate-600",
    Published: "bg-emerald-50 text-emerald-700",
};

function StatusBadge({ value }) {
    if (!value) return <span className="text-slate-400 text-xs">-</span>;
    const cls = STATUS_STYLES[value] || "bg-slate-100 text-slate-600";
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
            {value}
        </span>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center">
            <div className="text-xl font-bold text-slate-900">{value}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mt-0.5">{label}</div>
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
        <div className="space-y-5">
            <form onSubmit={handleApply} className="flex flex-wrap gap-3 items-end">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">From Date</label>
                    <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">To Date</label>
                    <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                >
                    Apply Filter
                </button>
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-slate-500 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    Clear
                </button>
            </form>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <StatCard label="Applied" value={totals.applied} />
                <StatCard label="Shortlisted" value={totals.shortlisted} />
                <StatCard label="Interview" value={totals.interview} />
                <StatCard label="Selected" value={totals.selected} />
                <StatCard label="Offer" value={totals.offer} />
                <StatCard label="Joined" value={totals.joined} />
                <StatCard label="Rejected" value={totals.rejected} />
            </div>

            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-3">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wide">
                        <tr>
                            <th className="px-3 py-2.5 text-left">Requisition</th>
                            <th className="px-3 py-2.5 text-left">Dept</th>
                            <th className="px-3 py-2.5 text-left">Designation</th>
                            <th className="px-3 py-2.5 text-center">Vacancies</th>
                            <th className="px-3 py-2.5 text-left">Req Status</th>
                            <th className="px-3 py-2.5 text-left">Posting Status</th>
                            <th className="px-3 py-2.5 text-left">Job Link</th>
                            <th className="px-3 py-2.5 text-center">Applied</th>
                            <th className="px-3 py-2.5 text-center">Shortlisted</th>
                            <th className="px-3 py-2.5 text-center">Interview</th>
                            <th className="px-3 py-2.5 text-center">Selected</th>
                            <th className="px-3 py-2.5 text-center">Offer</th>
                            <th className="px-3 py-2.5 text-center">Joined</th>
                            <th className="px-3 py-2.5 text-center">Rejected</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={14} className="text-center py-8 text-slate-400">
                                    Loading report...
                                </td>
                            </tr>
                        )}

                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={14} className="text-center py-8 text-slate-400">
                                    No requisitions found for the selected range.
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            paginatedRows.map((r) => (
                                <tr key={r[FIELD.requisitionId]} className="border-t border-slate-100 hover:bg-slate-50">
                                    <td className="px-3 py-2.5 font-medium text-slate-800">
                                        {r[FIELD.requisitionTitle]}
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">{r[FIELD.departmentName] || "-"}</td>
                                    <td className="px-3 py-2.5 text-slate-600">{r[FIELD.designationName] || "-"}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-600">{r[FIELD.vacancies]}</td>
                                    <td className="px-3 py-2.5">
                                        <StatusBadge value={r[FIELD.requisitionStatus]} />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <StatusBadge value={r[FIELD.postingStatus]} />
                                    </td>
                                    <td className="px-3 py-2.5">
                                        {r[FIELD.shareableLink] ? (
                                            <a
                                                href={r[FIELD.shareableLink]}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-amber-600 hover:underline text-xs font-medium"
                                            >
                                                View link
                                            </a>
                                        ) : (
                                            <span className="text-slate-300 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-slate-700">{r[FIELD.totalApplied]}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-700">{r[FIELD.totalShortlisted]}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-700">{r[FIELD.totalInterview]}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-700">{r[FIELD.totalSelected]}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-700">{r[FIELD.totalOffer]}</td>
                                    <td className="px-3 py-2.5 text-center text-emerald-700 font-semibold">
                                        {r[FIELD.totalJoined]}
                                    </td>
                                    <td className="px-3 py-2.5 text-center text-rose-600">{r[FIELD.totalRejected]}</td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {!loading && rows.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                    <div className="text-xs text-slate-500">
                        Showing {rangeStart} to {rangeEnd} of {rows.length}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                        >
                            Previous
                        </button>

                        {pageNumbers.map((item) =>
                            item.type === "ellipsis" ? (
                                <span key={item.key} className="px-2 text-xs text-slate-400">
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={item.key}
                                    onClick={() => goToPage(item.value)}
                                    className={
                                        item.value === currentPage
                                            ? "w-8 h-8 text-xs font-semibold rounded-lg bg-amber-600 text-white transition-colors"
                                            : "w-8 h-8 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                    }
                                >
                                    {item.value}
                                </button>
                            )
                        )}

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RecruitmentMaster() {
    const [activeTab, setActiveTab] = useState("candidates");

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Recruitment & Hiring</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Track candidates from application to joining, and view the overall recruitment pipeline report.
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex overflow-x-auto border-b border-slate-200 px-2 text-xs font-bold uppercase tracking-wider text-slate-400 hide-scrollbar">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id
                                    ? "border-amber-600 text-amber-600"
                                    : "border-transparent hover:text-slate-600"
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 min-h-[400px] bg-slate-50/50 rounded-b-2xl">
                    {activeTab === "candidates" && <CandidateManagement />}
                    {activeTab === "report" && <RecruitmentReportTab />}
                </div>
            </div>
        </div>
    );
}