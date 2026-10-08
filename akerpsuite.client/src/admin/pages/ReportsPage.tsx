import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { adminService } from "@/services/adminService";

const TABS = [
    { key: "employees", label: "Employee Report", icon: "fa-solid fa-users-viewfinder" },
    { key: "attendance", label: "Attendance Report", icon: "fa-solid fa-user-check" },
    { key: "leave", label: "Leave Report", icon: "fa-solid fa-calendar-minus" },
    { key: "payroll", label: "Payroll Report", icon: "fa-solid fa-file-invoice-dollar" },
];

const ATTENDANCE_STATUS = ["Present", "Absent", "Half-Day", "Holiday", "WeekOff", "Leave"];
const LEAVE_STATUS = ["Pending", "Approved", "Rejected"];
const EMPLOYEE_STATUS = ["Active", "Inactive", "Resigned", "Terminated", "On Leave"];
const MONTHS = [
    { value: 1, label: "January" }, { value: 2, label: "February" },
    { value: 3, label: "March" }, { value: 4, label: "April" },
    { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" },
    { value: 9, label: "September" }, { value: 10, label: "October" },
    { value: 11, label: "November" }, { value: 12, label: "December" },
];


const formatCurrency = (value) =>
    value != null ? `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "-";

const formatDate = (value) => (value ? String(value).split("T")[0] : "-");

const formatTime = (value) => (value ? value.toString().slice(0, 5) : "-");

const PAGE_SIZE = 10;


const toYear = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= 1900 && n <= 2100 ? n : new Date().getFullYear();
};

const getSearchableText = (record, tab) => {
    if (tab === "employees") {
        return [record.empCode, record.fullName, record.deptName, record.desigName, record.roleName, record.employmentStatus]
            .filter(Boolean).join(" ").toLowerCase();
    }
    if (tab === "attendance") {
        return [record.empCode, record.fullName, record.status]
            .filter(Boolean).join(" ").toLowerCase();
    }
    if (tab === "leave") {
        return [record.empCode, record.fullName, record.department, record.leaveName, record.status, record.approvedByName]
            .filter(Boolean).join(" ").toLowerCase();
    }
    if (tab === "payroll") {
        return [record.empCode, record.firstName, record.lastName, record.deptName, record.status]
            .filter(Boolean).join(" ").toLowerCase();
    }
    return "";
};

// UI Helpers
const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm";
const labelClass = "block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1";

const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (["present", "approved", "active"].includes(s)) return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    if (["absent", "rejected", "terminated", "resigned", "inactive"].includes(s)) return "bg-rose-50 text-rose-700 border-rose-200/50";
    if (["pending", "half-day", "on leave"].includes(s)) return "bg-amber-50 text-amber-700 border-amber-200/50";
    if (["holiday", "weekoff"].includes(s)) return "bg-blue-50 text-blue-700 border-blue-200/50";
    return "bg-slate-50 text-slate-600 border-slate-200";
};

const Th = ({ children, right = false }) => (
    <th className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 ${right ? "text-right" : ""}`}>
        {children}
    </th>
);

const StatusBadge = ({ status }) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${getStatusBadge(status)}`}>
        {status}
    </span>
);

// Backend may send camelCase (success/data) or PascalCase (Success/Data)
const unwrap = (res) => ({
    ok: !!(res?.success ?? res?.Success),
    message: res?.message ?? res?.Message,
    data: res?.data ?? res?.Data ?? [],
});

export default function ReportsPage({ initialTab = "employees" }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [printAll, setPrintAll] = useState(false);

    const [empFilters, setEmpFilters] = useState({ departmentId: "", roleId: "", status: "", designationId: "" });
    const [attFilters, setAttFilters] = useState({ empId: "", status: "", fromDate: "", toDate: "" });
    const [leaveFilters, setLeaveFilters] = useState({ empId: "", status: "", month: "", year: String(new Date().getFullYear()) });
    const [payrollFilters, setPayrollFilters] = useState({
        month: new Date().getMonth() + 1,
        year: String(new Date().getFullYear()),
        empId: "",
    });

    // Used to ignore responses from older / other-tab requests
    const requestIdRef = useRef(0);

    const fetchReport = async (tab = activeTab) => {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);

        try {
            let res;
            if (tab === "employees") res = await adminService.getEmployeeReportData(empFilters);
            else if (tab === "attendance") res = await adminService.getAttendanceReportData(attFilters);
            else if (tab === "leave") res = await adminService.getLeaveReportData({ ...leaveFilters, year: toYear(leaveFilters.year) });
            else if (tab === "payroll") res = await adminService.getPayrollReportData({ ...payrollFilters, year: toYear(payrollFilters.year) });

            if (requestId !== requestIdRef.current) return; // stale response

            const { ok, message, data } = unwrap(res);

            if (!ok) {
                setError(message || "Unable to load the report. Please try again.");
                setRecords([]);
                return;
            }

            setRecords(Array.isArray(data) ? data : []);
        } catch (err) {
            if (requestId !== requestIdRef.current) return;
            console.error("Report load failed:", tab, err);
            setError("Something went wrong while loading the report. Please check your connection or access permissions.");
            setRecords([]);
        } finally {
            if (requestId === requestIdRef.current) setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(activeTab);
        setSearchQuery("");
        setCurrentPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Print: render all rows, then open print dialog
    useEffect(() => {
        if (!printAll) return;
        const timer = setTimeout(() => window.print(), 150);
        const done = () => setPrintAll(false);
        window.addEventListener("afterprint", done);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("afterprint", done);
        };
    }, [printAll]);

    const filteredRecords = searchQuery.trim()
        ? records.filter((r) => getSearchableText(r, activeTab).includes(searchQuery.trim().toLowerCase()))
        : records;

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedRecords = printAll
        ? filteredRecords
        : filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleTabChange = (key) => {
        if (key === activeTab) return;
        // Clear old tab's data immediately so wrong columns never render
        setRecords([]);
        setError(null);
        setLoading(true);
        setActiveTab(key);
    };

    // ---------- Export ----------
    const handleExportExcel = () => {
        let rows = [];
        let sheetName = "Report";

        if (activeTab === "employees") {
            sheetName = "Employees";
            rows = filteredRecords.map((e) => ({
                "Emp Code": e.empCode,
                "Full Name": e.fullName,
                Department: e.deptName,
                Designation: e.desigName,
                Role: e.roleName,
                "Date of Joining": formatDate(e.dateOfJoining),
                Status: e.employmentStatus,
                Mobile: e.mobile,
                Email: e.officialEmail,
            }));
        } else if (activeTab === "attendance") {
            sheetName = "Attendance";
            rows = filteredRecords.map((r) => ({
                "Emp Code": r.empCode,
                "Full Name": r.fullName,
                Date: formatDate(r.attDate),
                "Check In": formatTime(r.checkIn),
                "Check Out": formatTime(r.checkOut),
                Status: r.status,
                "Late (min)": r.lateMinutes ?? 0,
                "Overtime (hrs)": r.overtimeHours ?? 0,
            }));
        } else if (activeTab === "leave") {
            sheetName = "Leave";
            rows = filteredRecords.map((r) => ({
                "Emp Code": r.empCode,
                "Full Name": r.fullName,
                Department: r.department,
                "Leave Type": r.leaveName,
                "From Date": formatDate(r.fromDate),
                "To Date": formatDate(r.toDate),
                "Total Days": r.totalDays,
                Status: r.status,
                "Approved By": r.approvedByName,
            }));
        } else if (activeTab === "payroll") {
            sheetName = "Payroll";
            rows = filteredRecords.map((r) => ({
                "Emp Code": r.empCode,
                Name: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim(),
                Department: r.deptName,
                "Present Days": r.presentDays,
                "Absent Days": r.absentDays,
                "Gross Earning": r.grossEarning,
                "Total Deduction": r.totalDeduction,
                "Net Salary": r.netSalary,
                Status: r.status,
            }));
        }

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${sheetName}_Report_${Date.now()}.xlsx`);
    };

    const handleExportPDF = () => setPrintAll(true);

    // ---------- Filter Bar (per tab) ----------
    const renderFilters = () => {
        if (activeTab === "employees") {
            return (
                <div className="flex-1 min-w-[200px]">
                    <label className={labelClass}>Status</label>
                    <select
                        className={`${inputClass} cursor-pointer appearance-none`}
                        value={empFilters.status}
                        onChange={(e) => setEmpFilters((p) => ({ ...p, status: e.target.value }))}
                    >
                        <option value="">All Statuses</option>
                        {EMPLOYEE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            );
        }

        if (activeTab === "attendance") {
            return (
                <>
                    <div className="flex-1 min-w-[150px]">
                        <label className={labelClass}>From Date</label>
                        <input
                            type="date"
                            className={inputClass}
                            value={attFilters.fromDate}
                            onChange={(e) => setAttFilters((p) => ({ ...p, fromDate: e.target.value }))}
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className={labelClass}>To Date</label>
                        <input
                            type="date"
                            className={inputClass}
                            value={attFilters.toDate}
                            onChange={(e) => setAttFilters((p) => ({ ...p, toDate: e.target.value }))}
                        />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                        <label className={labelClass}>Status</label>
                        <select
                            className={`${inputClass} cursor-pointer appearance-none`}
                            value={attFilters.status}
                            onChange={(e) => setAttFilters((p) => ({ ...p, status: e.target.value }))}
                        >
                            <option value="">All Statuses</option>
                            {ATTENDANCE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </>
            );
        }

        if (activeTab === "leave") {
            return (
                <>
                    <div className="flex-1 min-w-[160px]">
                        <label className={labelClass}>Month</label>
                        <select
                            className={`${inputClass} cursor-pointer appearance-none`}
                            value={leaveFilters.month}
                            onChange={(e) => setLeaveFilters((p) => ({ ...p, month: e.target.value }))}
                        >
                            <option value="">All Months</option>
                            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <label className={labelClass}>Year</label>
                        <input
                            type="number"
                            className={inputClass}
                            value={leaveFilters.year}
                            onChange={(e) => setLeaveFilters((p) => ({ ...p, year: e.target.value }))}
                        />
                    </div>
                    <div className="flex-1 min-w-[160px]">
                        <label className={labelClass}>Status</label>
                        <select
                            className={`${inputClass} cursor-pointer appearance-none`}
                            value={leaveFilters.status}
                            onChange={(e) => setLeaveFilters((p) => ({ ...p, status: e.target.value }))}
                        >
                            <option value="">All Statuses</option>
                            {LEAVE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </>
            );
        }

        if (activeTab === "payroll") {
            return (
                <>
                    <div className="flex-1 min-w-[160px]">
                        <label className={labelClass}>Month</label>
                        <select
                            className={`${inputClass} cursor-pointer appearance-none`}
                            value={payrollFilters.month}
                            onChange={(e) => setPayrollFilters((p) => ({ ...p, month: Number(e.target.value) }))}
                        >
                            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                        <label className={labelClass}>Year</label>
                        <input
                            type="number"
                            className={inputClass}
                            value={payrollFilters.year}
                            onChange={(e) => setPayrollFilters((p) => ({ ...p, year: e.target.value }))}
                        />
                    </div>
                </>
            );
        }

        return null;
    };

    // ---------- Table (per tab) ----------
    const renderTable = () => {
        if (loading) {
            return (
                <div className="py-24 flex flex-col items-center justify-center gap-4">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Generating report data...</div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="m-6 rounded-xl bg-rose-50 border border-rose-100 px-5 py-4 text-sm font-semibold text-rose-600 flex items-center gap-3">
                    <i className="fa-solid fa-triangle-exclamation text-lg" /> {error}
                </div>
            );
        }

        if (filteredRecords.length === 0) {
            return (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                        <i className="fa-solid fa-folder-open text-2xl text-slate-300" />
                    </div>
                    <p className="text-base font-bold text-slate-700">No Records Found</p>
                    <p className="text-sm text-slate-400 mt-1 font-medium">Try adjusting your filters or search query.</p>
                </div>
            );
        }

        const tableBase = "w-full text-left border-collapse whitespace-nowrap";
        const theadClass = "bg-slate-50/80 border-b border-slate-200";
        const tbodyClass = "divide-y divide-slate-100 text-sm text-slate-700";
        const rowClass = "hover:bg-slate-50/60 transition-colors";

        if (activeTab === "employees") {
            return (
                <table className={`${tableBase} min-w-[900px]`}>
                    <thead className={theadClass}>
                        <tr>
                            <Th>Emp Code</Th><Th>Name</Th><Th>Department</Th><Th>Designation</Th>
                            <Th>Role</Th><Th>Joining Date</Th><Th>Status</Th>
                        </tr>
                    </thead>
                    <tbody className={tbodyClass}>
                        {paginatedRecords.map((e, i) => (
                            <tr key={`emp-${e.empId ?? i}-${i}`} className={rowClass}>
                                <td className="px-6 py-4 font-mono font-bold text-amber-600">{e.empCode}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{e.fullName}</td>
                                <td className="px-6 py-4">{e.deptName || "—"}</td>
                                <td className="px-6 py-4">{e.desigName || "—"}</td>
                                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-md uppercase tracking-wider">{e.roleName || "—"}</span></td>
                                <td className="px-6 py-4">{formatDate(e.dateOfJoining)}</td>
                                <td className="px-6 py-4"><StatusBadge status={e.employmentStatus} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === "attendance") {
            return (
                <table className={`${tableBase} min-w-[900px]`}>
                    <thead className={theadClass}>
                        <tr>
                            <Th>Emp Code</Th><Th>Name</Th><Th>Date</Th><Th>Check In</Th>
                            <Th>Check Out</Th><Th>Status</Th><Th>Late (min)</Th><Th>Overtime (hrs)</Th>
                        </tr>
                    </thead>
                    <tbody className={tbodyClass}>
                        {paginatedRecords.map((r, i) => (
                            <tr key={`att-${r.attId ?? i}-${i}`} className={rowClass}>
                                <td className="px-6 py-4 font-mono font-bold text-amber-600">{r.empCode}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{r.fullName}</td>
                                <td className="px-6 py-4">{formatDate(r.attDate)}</td>
                                <td className="px-6 py-4 font-mono font-medium">{formatTime(r.checkIn)}</td>
                                <td className="px-6 py-4 font-mono font-medium">{formatTime(r.checkOut)}</td>
                                <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                                <td className="px-6 py-4 font-mono font-semibold text-rose-500">{r.lateMinutes ? `${r.lateMinutes} min` : "-"}</td>
                                <td className="px-6 py-4 font-mono font-semibold text-emerald-600">{r.overtimeHours ? `${r.overtimeHours} hrs` : "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === "leave") {
            return (
                <table className={`${tableBase} min-w-[900px]`}>
                    <thead className={theadClass}>
                        <tr>
                            <Th>Emp Code</Th><Th>Name</Th><Th>Department</Th><Th>Leave Type</Th>
                            <Th>From - To</Th><Th>Days</Th><Th>Status</Th><Th>Approved By</Th>
                        </tr>
                    </thead>
                    <tbody className={tbodyClass}>
                        {paginatedRecords.map((r, i) => (
                            <tr key={`leave-${r.leaveId ?? i}-${i}`} className={rowClass}>
                                <td className="px-6 py-4 font-mono font-bold text-amber-600">{r.empCode}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{r.fullName}</td>
                                <td className="px-6 py-4">{r.department || "—"}</td>
                                <td className="px-6 py-4 font-medium">{r.leaveName}</td>
                                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                    {formatDate(r.fromDate)} <span className="mx-1 text-slate-300">to</span> {formatDate(r.toDate)}
                                </td>
                                <td className="px-6 py-4 font-mono font-bold text-slate-800">{r.totalDays}</td>
                                <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                                <td className="px-6 py-4 text-xs font-semibold">{r.approvedByName ?? "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === "payroll") {
            const totalNetSalary = filteredRecords.reduce((sum, r) => sum + Number(r.netSalary || 0), 0);
            return (
                <table className={`${tableBase} min-w-[1000px]`}>
                    <thead className={theadClass}>
                        <tr>
                            <Th>Emp Code</Th><Th>Name</Th><Th>Department</Th><Th>Present</Th><Th>Absent</Th>
                            <Th right>Gross Earning</Th><Th right>Total Deduction</Th><Th right>Net Salary</Th><Th>Status</Th>
                        </tr>
                    </thead>
                    <tbody className={tbodyClass}>
                        {paginatedRecords.map((r, i) => (
                            <tr key={`payroll-${r.detailId ?? i}-${i}`} className={rowClass}>
                                <td className="px-6 py-4 font-mono font-bold text-amber-600">{r.empCode}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{r.firstName} {r.lastName}</td>
                                <td className="px-6 py-4">{r.deptName || "—"}</td>
                                <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{r.presentDays}</td>
                                <td className="px-6 py-4 font-mono text-rose-600 font-bold">{r.absentDays}</td>
                                <td className="px-6 py-4 text-right font-mono font-medium">{formatCurrency(r.grossEarning)}</td>
                                <td className="px-6 py-4 text-right font-mono font-medium text-rose-500">{formatCurrency(r.totalDeduction)}</td>
                                <td className="px-6 py-4 text-right font-mono font-black text-emerald-700 bg-emerald-50/30">{formatCurrency(r.netSalary)}</td>
                                <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-bold text-slate-900">
                            <td colSpan={7} className="px-6 py-4 text-right uppercase tracking-wider text-xs">Total Net Salary (Filtered):</td>
                            <td className="px-6 py-4 text-right font-mono text-base text-[#0b2836]">{formatCurrency(totalNetSalary)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            );
        }

        return null;
    };

    const hasData = !loading && !error && filteredRecords.length > 0;

    return (
        <div className="space-y-6 pb-10 font-sans relative z-0">
            {/* Print-only styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #printable-report, #printable-report * { visibility: visible; }
                    #printable-report {
                        position: absolute; left: 0; top: 0; width: 100%;
                        overflow: visible !important; height: auto !important; border: none !important;
                    }
                    @page { size: landscape; margin: 10mm; }
                }
            `}</style>

            {/* ── Header ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden print:hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-chart-line text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Reports & Analytics</h2>
                        <p className="text-xs text-slate-400 mt-0.5">View, filter, and export HR data across modules.</p>
                    </div>
                </div>
            </div>

            {/* ── Main Container ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden print:border-none print:shadow-none">

                {/* ── Tabs ── */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50 print:hidden">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 focus:outline-none ${activeTab === tab.key
                                ? "border-amber-500 text-amber-600 bg-white"
                                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                }`}
                        >
                            {tab.icon && <i className={`${tab.icon} text-[13px]`} />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-5 sm:p-6 min-h-[400px]">

                    {/* ── Controls: Search + Filters + Apply + Exports ── */}
                    <div className="flex flex-col xl:flex-row gap-5 mb-6 print:hidden">

                        <div className="flex-1 flex flex-wrap gap-4 items-end bg-slate-50/50 p-5 rounded-2xl border border-slate-100">

                            {/* Search */}
                            <div className="flex-1 min-w-[220px]">
                                <label className={labelClass}>Search Records</label>
                                <div className="relative group">
                                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={`Search ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()}...`}
                                        className="w-full pl-11 pr-10 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white transition-all shadow-sm"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-colors"
                                        >
                                            <i className="fa-solid fa-xmark text-xs" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {renderFilters()}

                            <button
                                onClick={() => fetchReport(activeTab)}
                                className="px-6 py-2.5 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-md shadow-[#0b2836]/20 hover:bg-[#0f3345] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 h-[42px] whitespace-nowrap w-full sm:w-auto"
                            >
                                <i className="fa-solid fa-filter" /> Apply Filters
                            </button>
                        </div>

                        {/* Exports */}
                        <div className="flex flex-row xl:flex-col gap-3 justify-end w-full xl:w-auto">
                            <button
                                onClick={handleExportExcel}
                                disabled={!hasData}
                                className="flex-1 xl:flex-none px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200/50 hover:bg-emerald-100 font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm h-[42px] whitespace-nowrap"
                            >
                                <i className="fa-solid fa-file-excel" /> Export Excel
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={!hasData}
                                className="flex-1 xl:flex-none px-5 py-2.5 bg-rose-50 text-rose-700 border border-rose-200/50 hover:bg-rose-100 font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm h-[42px] whitespace-nowrap"
                            >
                                <i className="fa-solid fa-file-pdf" /> Export PDF
                            </button>
                        </div>
                    </div>

                    {/* ── Table ── */}
                    <div id="printable-report" className="border border-slate-200 rounded-2xl overflow-x-auto bg-white shadow-sm">
                        {renderTable()}
                    </div>

                    {/* ── Pagination ── */}
                    {hasData && (
                        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border border-slate-200 text-sm text-slate-500 gap-4 mt-5 rounded-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{(safePage - 1) * PAGE_SIZE + 1}</span> to{" "}
                                <span className="font-bold text-slate-800">{Math.min(safePage * PAGE_SIZE, filteredRecords.length)}</span> of{" "}
                                <span className="font-bold text-slate-800">{filteredRecords.length}</span> entries
                            </div>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={safePage === 1}
                                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                                </button>

                                <div className="hidden sm:flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                                        .reduce((acc, p, idx, arr) => {
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
                                                    onClick={() => setCurrentPage(p)}
                                                    className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-bold transition-all shadow-sm ${p === safePage
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
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={safePage === totalPages}
                                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    Next <i className="fa-solid fa-chevron-right text-[10px]" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}