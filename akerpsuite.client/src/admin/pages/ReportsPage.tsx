import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { adminService } from "@/services/adminService";

const TABS = [
    { key: "employees", label: "Employee Report" },
    { key: "attendance", label: "Attendance Report" },
    { key: "leave", label: "Leave Report" },
    { key: "payroll", label: "Payroll Report" },
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

// ---------------------------------------------------------------------
// ROLE VISIBILITY LOGIC (exclusion-based, not strict hierarchy order)
// ---------------------------------------------------------------------
// For each role, list which roles it must NOT see. Any role not in the
// list (including roles not even defined here) will still show up.
const ROLE_VISIBILITY_RULES = {
    CMD: { seeAll: true },                 // CMD -> no restriction, sees everyone
    Admin: { hideRoles: ["CMD", "Admin"] }, // Admin -> hides CMD + itself, sees everyone else
    HR: { hideRoles: ["CMD", "Admin", "HR"] }, // HR -> hides CMD, Admin, other HRs, sees everyone else
    Employee: { selfOnly: true },           // Employee -> sees only their own record
};

/**
 * Returns the current logged-in user's role + empId.
 * NOTE: This is a placeholder. Replace this with however you actually
 * store the logged-in user in your app (auth context, redux, localStorage, etc).
 */
const getCurrentUser = () => {
    try {
        const role = localStorage.getItem("role") || "Employee";
        const empId = localStorage.getItem("empId"); // see note below
        return {
            role,
            empId: empId != null ? empId : null,
        };
    } catch {
        return { role: "Employee", empId: null };
    }
};

/**
 * Core visibility filter.
 * - seeAll   -> no filtering at all (CMD)
 * - selfOnly -> only the logged-in user's own record (Employee)
 * - hideRoles -> hide records whose role is in this list; everything
 *                else (including roles not defined in ROLE_VISIBILITY_RULES
 *                at all) still shows (Admin / HR)
 *
 * `getRecordRole` and `getRecordEmpId` let each report type tell this
 * function how to read the role / empId off of its own record shape.
 */
const filterByRoleVisibility = (records, { getRecordRole, getRecordEmpId }) => {
    const currentUser = getCurrentUser();
    const rule = ROLE_VISIBILITY_RULES[currentUser.role];

    // Unknown/unlisted role -> safest default is "self only"
    if (!rule) {
        return records.filter((r) => getRecordEmpId(r) === currentUser.empId);
    }

    if (rule.seeAll) {
        return records;
    }

    if (rule.selfOnly) {
        return records.filter((r) => getRecordEmpId(r) === currentUser.empId);
    }

    // hideRoles -> keep everything except the roles listed
    return records.filter((r) => !rule.hideRoles.includes(getRecordRole(r)));
};

const formatCurrency = (value) =>
    value != null ? `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` : "-";

const formatDate = (value) => (value ? value.split("T")[0] : "-");

const formatTime = (value) => (value ? value.toString().slice(0, 5) : "-");

const PAGE_SIZE = 10;

// Returns the text a record should be matched against for the search bar,
// per report type. Keep this in sync with the columns shown in each table.
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

export default function ReportsPage({ initialTab = "employees" }) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const [empFilters, setEmpFilters] = useState({ departmentId: "", roleId: "", status: "", designationId: "" });
    const [attFilters, setAttFilters] = useState({ empId: "", status: "", fromDate: "", toDate: "" });
    const [leaveFilters, setLeaveFilters] = useState({ empId: "", status: "", month: "", year: new Date().getFullYear() });
    const [payrollFilters, setPayrollFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        empId: "",
    });

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            let res;
            if (activeTab === "employees") res = await adminService.getEmployeeReportData(empFilters);
            else if (activeTab === "attendance") res = await adminService.getAttendanceReportData(attFilters);
            else if (activeTab === "leave") res = await adminService.getLeaveReportData(leaveFilters);
            else if (activeTab === "payroll") res = await adminService.getPayrollReportData(payrollFilters);

            if (!res?.success) {
                setError(res?.message || "Unable to load the report. Please try again.");
                setRecords([]);
                return;
            }

            let data = res.data || [];

            // ---- Apply role-hierarchy filtering per report type ----
            if (activeTab === "employees") {
                data = filterByRoleVisibility(data, {
                    getRecordRole: (e) => e.roleName,
                    getRecordEmpId: (e) => e.empId,
                });
            } else if (activeTab === "attendance") {
                // NOTE: attendance records don't carry a role field from the API
                // today. If you need CMD/Admin/HR to see "roles below them" here
                // too, the backend needs to include each row's roleName.
                data = filterByRoleVisibility(data, {
                    getRecordRole: (r) => r.roleName,
                    getRecordEmpId: (r) => r.empId,
                });
            } else if (activeTab === "leave") {
                data = filterByRoleVisibility(data, {
                    getRecordRole: (r) => r.roleName,
                    getRecordEmpId: (r) => r.empId,
                });
            } else if (activeTab === "payroll") {
                data = filterByRoleVisibility(data, {
                    getRecordRole: (r) => r.roleName,
                    getRecordEmpId: (r) => r.empId,
                });
            }

            setRecords(data);
        } catch (err) {
            setError("Something went wrong while loading the report. Please check your connection or access permissions.");
            setRecords([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        setSearchQuery("");
        setCurrentPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    // Reset to page 1 whenever the search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Search-filtered records (applied on top of the role-visibility-filtered
    // records already in state). Pagination is applied on top of this.
    const filteredRecords = searchQuery.trim()
        ? records.filter((r) => getSearchableText(r, activeTab).includes(searchQuery.trim().toLowerCase()))
        : records;

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const handleTabChange = (key) => setActiveTab(key);

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
                Name: `${r.firstName} ${r.lastName}`,
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

    const handleExportPDF = () => window.print();

    // ---------- Filter Bar (per tab) ----------
    const renderFilters = () => {
        if (activeTab === "employees") {
            return (
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                    <select
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[160px]"
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
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
                        <input
                            type="date"
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={attFilters.fromDate}
                            onChange={(e) => setAttFilters((p) => ({ ...p, fromDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
                        <input
                            type="date"
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                            value={attFilters.toDate}
                            onChange={(e) => setAttFilters((p) => ({ ...p, toDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[160px]"
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
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px]"
                            value={leaveFilters.month}
                            onChange={(e) => setLeaveFilters((p) => ({ ...p, month: e.target.value }))}
                        >
                            <option value="">All Months</option>
                            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                        <input
                            type="number"
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-24"
                            value={leaveFilters.year}
                            onChange={(e) => setLeaveFilters((p) => ({ ...p, year: Number(e.target.value) }))}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[160px]"
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
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                        <select
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm min-w-[140px]"
                            value={payrollFilters.month}
                            onChange={(e) => setPayrollFilters((p) => ({ ...p, month: Number(e.target.value) }))}
                        >
                            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                        <input
                            type="number"
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-24"
                            value={payrollFilters.year}
                            onChange={(e) => setPayrollFilters((p) => ({ ...p, year: Number(e.target.value) }))}
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
                <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
                    Loading report...
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex items-center justify-center py-16 text-red-600 text-sm bg-red-50">
                    {error}
                </div>
            );
        }

        if (filteredRecords.length === 0) {
            return (
                <div className="flex items-center justify-center py-16 text-gray-500 text-sm">
                    No records found for the selected filters.
                </div>
            );
        }

        if (activeTab === "employees") {
            return (
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                        <tr>
                            <th className="px-4 py-3 text-left">Emp Code</th>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Department</th>
                            <th className="px-4 py-3 text-left">Designation</th>
                            <th className="px-4 py-3 text-left">Role</th>
                            <th className="px-4 py-3 text-left">Joining Date</th>
                            <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedRecords.map((e) => (
                            <tr key={e.empId} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{e.empCode}</td>
                                <td className="px-4 py-3 font-medium">{e.fullName}</td>
                                <td className="px-4 py-3">{e.deptName}</td>
                                <td className="px-4 py-3">{e.desigName}</td>
                                <td className="px-4 py-3">{e.roleName}</td>
                                <td className="px-4 py-3">{formatDate(e.dateOfJoining)}</td>
                                <td className="px-4 py-3">{e.employmentStatus}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === "attendance") {
            return (
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                        <tr>
                            <th className="px-4 py-3 text-left">Emp Code</th>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Date</th>
                            <th className="px-4 py-3 text-left">Check In</th>
                            <th className="px-4 py-3 text-left">Check Out</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Late (min)</th>
                            <th className="px-4 py-3 text-left">Overtime (hrs)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedRecords.map((r) => (
                            <tr key={r.attId} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{r.empCode}</td>
                                <td className="px-4 py-3 font-medium">{r.fullName}</td>
                                <td className="px-4 py-3">{formatDate(r.attDate)}</td>
                                <td className="px-4 py-3">{formatTime(r.checkIn)}</td>
                                <td className="px-4 py-3">{formatTime(r.checkOut)}</td>
                                <td className="px-4 py-3">{r.status}</td>
                                <td className="px-4 py-3">{r.lateMinutes ?? "-"}</td>
                                <td className="px-4 py-3">{r.overtimeHours ?? "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === "leave") {
            return (
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                        <tr>
                            <th className="px-4 py-3 text-left">Emp Code</th>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Department</th>
                            <th className="px-4 py-3 text-left">Leave Type</th>
                            <th className="px-4 py-3 text-left">From</th>
                            <th className="px-4 py-3 text-left">To</th>
                            <th className="px-4 py-3 text-left">Days</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Approved By</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedRecords.map((r) => (
                            <tr key={r.leaveId} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{r.empCode}</td>
                                <td className="px-4 py-3 font-medium">{r.fullName}</td>
                                <td className="px-4 py-3">{r.department}</td>
                                <td className="px-4 py-3">{r.leaveName}</td>
                                <td className="px-4 py-3">{formatDate(r.fromDate)}</td>
                                <td className="px-4 py-3">{formatDate(r.toDate)}</td>
                                <td className="px-4 py-3">{r.totalDays}</td>
                                <td className="px-4 py-3">{r.status}</td>
                                <td className="px-4 py-3">{r.approvedByName ?? "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === "payroll") {
            const totalNetSalary = filteredRecords.reduce((sum, r) => sum + (r.netSalary || 0), 0);
            return (
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                        <tr>
                            <th className="px-4 py-3 text-left">Emp Code</th>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Department</th>
                            <th className="px-4 py-3 text-left">Present</th>
                            <th className="px-4 py-3 text-left">Absent</th>
                            <th className="px-4 py-3 text-right">Gross Earning</th>
                            <th className="px-4 py-3 text-right">Total Deduction</th>
                            <th className="px-4 py-3 text-right">Net Salary</th>
                            <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedRecords.map((r) => (
                            <tr key={r.detailId} className="hover:bg-gray-50">
                                <td className="px-4 py-3">{r.empCode}</td>
                                <td className="px-4 py-3 font-medium">{r.firstName} {r.lastName}</td>
                                <td className="px-4 py-3">{r.deptName}</td>
                                <td className="px-4 py-3">{r.presentDays}</td>
                                <td className="px-4 py-3">{r.absentDays}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(r.grossEarning)}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(r.totalDeduction)}</td>
                                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(r.netSalary)}</td>
                                <td className="px-4 py-3">{r.status}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t bg-gray-50 font-semibold">
                            <td colSpan={7} className="px-4 py-3 text-right">Total Net Salary</td>
                            <td className="px-4 py-3 text-right">{formatCurrency(totalNetSalary)}</td>
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
        <div className="p-6">
            {/* Print-only styles: hide everything on the page except the
                report table itself, so Export PDF / window.print() doesn't
                produce a blank page caused by the surrounding layout's
                fixed height / overflow (sidebar, tabs, filter bar, etc). */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #printable-report, #printable-report * {
                        visibility: visible;
                    }
                    #printable-report {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        overflow: visible !important;
                        height: auto !important;
                        border: none !important;
                    }
                    @page {
                        size: auto;
                        margin: 12mm;
                    }
                }
            `}</style>

            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-500 mt-1">
                    View, filter, and export HR data across employees, attendance, leave, and payroll.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-6">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => handleTabChange(tab.key)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="mb-4 print:hidden">
                <div className="relative max-w-sm">
                    <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search this report..."
                        className="w-full border border-gray-300 rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <i className="ti ti-x text-sm" />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 mb-5 items-end bg-white border border-gray-200 rounded-lg p-4">
                {renderFilters()}

                <button
                    onClick={fetchReport}
                    className="bg-indigo-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                    Apply Filters
                </button>

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        disabled={!hasData}
                        className="bg-green hover:bg-green disabled:bg-green disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Export Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={!hasData}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Table */}
            <div id="printable-report" className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                {renderTable()}
            </div>

            {/* Pagination */}
            {filteredRecords.length > 0 && (
                <div className="flex items-center justify-between mt-4 print:hidden">
                    <p className="text-sm text-gray-500">
                        Showing {(safePage - 1) * PAGE_SIZE + 1}
                        {"\u2013"}
                        {Math.min(safePage * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                            .reduce((acc, p, idx, arr) => {
                                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("ellipsis-" + p);
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((p) =>
                                typeof p === "string" ? (
                                    <span key={p} className="px-2 text-gray-400 text-sm">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${p === safePage
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}