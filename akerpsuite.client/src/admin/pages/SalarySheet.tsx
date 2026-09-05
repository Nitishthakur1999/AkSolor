import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { adminService } from "@/services/adminService";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

interface PayrollRow {
    detailId: number;
    payrollId: number;
    empId: number;
    empCode: string;
    firstName: string;
    lastName: string;
    fatherHusbandName?: string;
    category?: string;
    deptName?: string;
    desigName?: string;
    uanNo?: string;
    esicNo?: string;
    workingDays: number;
    presentDays: number;
    epfBasic: number;
    basic: number;
    hra: number;
    ta: number;
    da: number;
    specialAllow: number;
    grossEarning: number;
    pfDeduction: number;
    esicDeduction: number;
    totalDeduction: number;
    netSalary: number;
    status: string;
}

export default function SalarySheet() {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rows, setRows] = useState<PayrollRow[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [department, setDepartment] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        loadDepartments();
    }, []);

    useEffect(() => {
        loadPayroll();
    }, [month, year]);

    async function loadDepartments() {
        try {
            const res = await adminService.getDepartments();
            setDepartments(res.data || res.Data || []);
        } catch (err) {
            console.error("Failed to load departments", err);
        }
    }

    async function loadPayroll() {
        try {
            setLoading(true);
            setError(null);
            const res = await adminService.getPayrollDetails(month, year);
            if (res.success || res.Success) {
                setRows(res.data || res.Data || []);
            } else {
                setError(res.message || res.Message || "Salary Sheet data load nahi ho saka.");
            }
        } catch (err) {
            setError("Failed to connect to the server.");
        } finally {
            setLoading(false);
        }
    }

    const filteredRows = useMemo(() => {
        return rows.filter((item) => {
            const searchMatch = `${item.empCode} ${item.firstName} ${item.lastName}`
                .toLowerCase()
                .includes(search.toLowerCase());

            const deptMatch = department === "" || item.deptName === department;
            return searchMatch && deptMatch;
        });
    }, [rows, search, department]);

    const totals = useMemo(() => {
        return filteredRows.reduce(
            (acc, row) => {
                acc.gross += Number(row.grossEarning || 0);
                acc.deduction += Number(row.totalDeduction || 0);
                acc.net += Number(row.netSalary || 0);
                return acc;
            },
            { gross: 0, deduction: 0, net: 0 }
        );
    }, [filteredRows]);

    const exportExcel = () => {
        const excel = filteredRows.map((item, index) => ({
            "S.No": index + 1,
            "Emp Code": item.empCode,
            "Employee Name": `${item.firstName} ${item.lastName}`,
            "Father/Husband": item.fatherHusbandName || "-",
            Category: item.category || "-",
            Department: item.deptName || "-",
            Designation: item.desigName || "-",
            "UAN No": item.uanNo || "-",
            "ESIC No": item.esicNo || "-",
            "Working Days": item.workingDays,
            "Present Days": item.presentDays,
            "EPF Basic": item.epfBasic,
            Basic: item.basic,
            HRA: item.hra,
            TA: item.ta,
            DA: item.da,
            "Special Allow": item.specialAllow,
            "Gross Salary": item.grossEarning,
            PF: item.pfDeduction,
            ESI: item.esicDeduction,
            "Total Deduction": item.totalDeduction,
            "Net Salary": item.netSalary,
        }));

        const ws = XLSX.utils.json_to_sheet(excel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Salary Sheet");
        XLSX.writeFile(wb, `Salary_Sheet_${MONTHS[month - 1]}_${year}.xlsx`);
    };

    const handlePrint = () => {
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Loading State
    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Loading salary sheet...</div>
            </div>
        );
    }

    // Error State
    if (error) {
        return (
            <div className="m-6 rounded-2xl bg-rose-50 border border-rose-100 px-6 py-6 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
                    <i className="fa-solid fa-triangle-exclamation" />
                </div>
                <p className="text-slate-700 text-sm font-bold">{error}</p>
                <button
                    onClick={loadPayroll}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                    Retry
                </button>
            </div>
        );
    }
    return (
        <>

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden print:hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-file-invoice-dollar text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Salary Sheet</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            View monthly employee salary breakdowns, earnings, deductions and generate reports.
                        </p>
                    </div>
                </div>
            </div>

            {/* Screen UI Matching Theme */}
            <div className="space-y-5 print:hidden">

                {/* Summary Cards Grid */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                    <SummaryCard
                        title="Total Employees"
                        value={filteredRows.length.toString()}
                        icon="fa-users"
                        bgColor="bg-blue-50"
                        iconColor="text-blue-600"
                    />
                    <SummaryCard
                        title="Gross Salary"
                        value={formatCurrency(totals.gross)}
                        icon="fa-money-bill-wave"
                        bgColor="bg-emerald-50"
                        iconColor="text-emerald-600"
                    />
                    <SummaryCard
                        title="Total Deduction"
                        value={formatCurrency(totals.deduction)}
                        icon="fa-money-bill-transfer"
                        bgColor="bg-rose-50"
                        iconColor="text-rose-600"
                    />
                    <SummaryCard
                        title="Net Salary"
                        value={formatCurrency(totals.net)}
                        icon="fa-wallet"
                        bgColor="bg-amber-50"
                        iconColor="text-amber-600"
                    />
                </div>

                {/* Filter Controls Panel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                                Search Employee
                            </label>
                            <div className="relative group">
                                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name or ID..."
                                    className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                                Month *
                            </label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer appearance-none"
                            >
                                {MONTHS.map((m, idx) => (
                                    <option key={m} value={idx + 1}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                                Year *
                            </label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Container */}
                {filteredRows.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                            <i className="fa-solid fa-table-columns" />
                        </div>
                        <p className="text-base font-bold text-slate-700">No Salary Records Found</p>
                        <p className="text-sm text-slate-400 mt-1 font-medium">Try adjusting your search criteria or period.</p>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-sm font-bold text-slate-800">
                                Employees Directory · <span className="text-amber-600">{MONTHS[month - 1]} {year}</span>
                            </h2>
                            <span className="text-xs text-slate-400 font-medium">
                                Showing {filteredRows.length} records
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs min-w-[1700px] border-collapse">
                                <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] font-bold tracking-widest border-b border-slate-200">
                                    <tr>
                                        <th className="py-4 px-4">#</th>
                                        <th className="py-4 px-4">Emp ID</th>
                                        <th className="py-4 px-4">Employee Name</th>
                                        <th className="py-4 px-4">Father/Husband</th>
                                        <th className="py-4 px-4">Category</th>
                                        <th className="py-4 px-4">Department</th>
                                        <th className="py-4 px-4">UAN</th>
                                        <th className="py-4 px-4">ESIC</th>
                                        <th className="py-4 px-4">Work/Pres</th>
                                        <th className="py-4 px-4 text-right">EPF Basic</th>
                                        <th className="py-4 px-4 text-right">Basic</th>
                                        <th className="py-4 px-4 text-right">HRA</th>
                                        <th className="py-4 px-4 text-right">TA</th>
                                        <th className="py-4 px-4 text-right">DA</th>
                                        <th className="py-4 px-4 text-right">Special</th>
                                        <th className="py-4 px-4 text-right">Gross</th>
                                        <th className="py-4 px-4 text-right">PF</th>
                                        <th className="py-4 px-4 text-right">ESI</th>
                                        <th className="py-4 px-4 text-right">Deduction</th>
                                        <th className="py-4 px-4 text-right">Net Salary</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                                    {filteredRows.map((item, index) => (
                                        <tr key={item.detailId} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-4 px-4 font-medium text-slate-400 text-xs">{index + 1}</td>
                                            <td className="py-4 px-4 font-mono font-bold text-amber-600 text-xs">{item.empCode}</td>
                                            <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                                                {item.firstName} {item.lastName}
                                            </td>
                                            <td className="py-4 px-4 text-slate-500 font-medium">{item.fatherHusbandName || "—"}</td>
                                            <td className="py-4 px-4 text-slate-500 font-medium">{item.category || "—"}</td>
                                            <td className="py-4 px-4 text-slate-600 font-semibold">{item.deptName}</td>
                                            <td className="py-4 px-4 text-slate-500 font-mono text-xs">{item.uanNo || "—"}</td>
                                            <td className="py-4 px-4 text-slate-500 font-mono text-xs">{item.esicNo || "—"}</td>
                                            <td className="py-4 px-4 font-bold text-slate-600">{item.workingDays}/{item.presentDays}</td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono">{formatCurrency(item.epfBasic)}</td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono">{formatCurrency(item.basic)}</td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono">{formatCurrency(item.hra)}</td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono">{formatCurrency(item.ta)}</td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono">{formatCurrency(item.da)}</td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono">{formatCurrency(item.specialAllow)}</td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono font-bold text-slate-800">
                                                {formatCurrency(item.grossEarning)}
                                            </td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono text-rose-500">{formatCurrency(item.pfDeduction)}</td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono text-rose-500">{formatCurrency(item.esicDeduction)}</td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono font-bold text-rose-600">
                                                {formatCurrency(item.totalDeduction)}
                                            </td>
                                            <td className="py-4 px-4 text-right tabular-nums font-mono font-black text-emerald-700 bg-emerald-50/20">
                                                {formatCurrency(item.netSalary)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 font-bold text-slate-900 text-xs">
                                    <tr>
                                        <td colSpan={15} className="py-4 px-4 text-right uppercase tracking-wider text-[11px] text-slate-400">
                                            Total:
                                        </td>
                                        <td className="py-4 px-4 text-right text-slate-900 font-mono text-sm">{formatCurrency(totals.gross)}</td>
                                        <td colSpan={2}></td>
                                        <td className="py-4 px-4 text-right text-rose-600 font-mono text-sm">{formatCurrency(totals.deduction)}</td>
                                        <td className="py-4 px-4 text-right text-[#0b2836] font-mono text-base">{formatCurrency(totals.net)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* Bottom Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm gap-4">
                    <p className="text-slate-500 text-sm font-medium">
                        Total active records displayed: <span className="font-bold text-slate-800">{filteredRows.length}</span>
                    </p>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <button
                            onClick={handlePrint}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200/50 text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-print" />
                            Print Sheet
                        </button>
                        <button
                            onClick={exportExcel}
                            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2 shadow-emerald-600/20"
                        >
                            <i className="fa-solid fa-file-excel" />
                            Export Excel
                        </button>
                    </div>
                </div>

            </div>

            {/* Print Container (Preserved exact structure & functionality) */}
            <div id="payslip-print-area" className="hidden print:block print:absolute print:top-0 print:left-0 print:bg-white print:z-50 print:p-6 print:w-full print:min-h-screen">
                <div className="text-center mb-6">
                    <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
                        AKS Solar Systems Private Limited
                    </h1>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5">
                        Salary Sheet - {MONTHS[month - 1]} {year}
                    </p>
                </div>

                <table className="w-full text-[9px] border-collapse border border-slate-300">
                    <thead>
                        <tr className="bg-slate-100 text-slate-800 uppercase font-bold">
                            <th className="border border-slate-300 p-1 text-center">#</th>
                            <th className="border border-slate-300 p-1 text-left">Code</th>
                            <th className="border border-slate-300 p-1 text-left">Name</th>
                            <th className="border border-slate-300 p-1 text-left">Father/Husband</th>
                            <th className="border border-slate-300 p-1 text-left">Category</th>
                            <th className="border border-slate-300 p-1 text-left">Dept</th>
                            <th className="border border-slate-300 p-1 text-left">UAN</th>
                            <th className="border border-slate-300 p-1 text-left">ESIC</th>
                            <th className="border border-slate-300 p-1 text-center">Days</th>
                            <th className="border border-slate-300 p-1 text-right">EPF Basic</th>
                            <th className="border border-slate-300 p-1 text-right">Basic</th>
                            <th className="border border-slate-300 p-1 text-right">HRA</th>
                            <th className="border border-slate-300 p-1 text-right">TA</th>
                            <th className="border border-slate-300 p-1 text-right">DA</th>
                            <th className="border border-slate-300 p-1 text-right">Special</th>
                            <th className="border border-slate-300 p-1 text-right">Gross</th>
                            <th className="border border-slate-300 p-1 text-right">PF</th>
                            <th className="border border-slate-300 p-1 text-right">ESI</th>
                            <th className="border border-slate-300 p-1 text-right">Deductions</th>
                            <th className="border border-slate-300 p-1 text-right">Net Salary</th>
                            <th className="border border-slate-300 p-1 text-center">Signature</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.map((item, index) => (
                            <tr key={item.detailId}>
                                <td className="border border-slate-300 p-1 text-center">{index + 1}</td>
                                <td className="border border-slate-300 p-1 font-semibold">{item.empCode}</td>
                                <td className="border border-slate-300 p-1 font-medium">{item.firstName} {item.lastName}</td>
                                <td className="border border-slate-300 p-1">{item.fatherHusbandName || "-"}</td>
                                <td className="border border-slate-300 p-1">{item.category || "-"}</td>
                                <td className="border border-slate-300 p-1">{item.deptName}</td>
                                <td className="border border-slate-300 p-1">{item.uanNo || "-"}</td>
                                <td className="border border-slate-300 p-1">{item.esicNo || "-"}</td>
                                <td className="border border-slate-300 p-1 text-center">{item.workingDays}/{item.presentDays}</td>
                                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.epfBasic)}</td>
                                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.basic)}</td>
                                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.hra)}</td>
                                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.ta)}</td>
                                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.da)}</td>
                                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.specialAllow)}</td>
                                <td className="border border-slate-300 p-1 text-right font-semibold">{formatCurrency(item.grossEarning)}</td>
                                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.pfDeduction)}</td>
                                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.esicDeduction)}</td>
                                <td className="border border-slate-300 p-1 text-right">{formatCurrency(item.totalDeduction)}</td>
                                <td className="border border-slate-300 p-1 text-right font-bold">{formatCurrency(item.netSalary)}</td>
                                <td className="border border-slate-300 p-1"></td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-100 font-bold">
                            <td colSpan={15} className="border border-slate-300 p-1 text-right">TOTAL</td>
                            <td className="border border-slate-300 p-1 text-right">{formatCurrency(totals.gross)}</td>
                            <td colSpan={2} className="border border-slate-300 p-1"></td>
                            <td className="border border-slate-300 p-1 text-right">{formatCurrency(totals.deduction)}</td>
                            <td className="border border-slate-300 p-1 text-right">{formatCurrency(totals.net)}</td>
                            <td className="border border-slate-300 p-1"></td>
                        </tr>
                    </tfoot>
                </table>

                <div className="grid grid-cols-3 gap-8 mt-16 text-center text-xs">
                    <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">Prepared By</div>
                    <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">Checked By</div>
                    <div className="border-t border-slate-400 pt-1 font-semibold text-slate-700">Authorized Signatory</div>
                </div>
            </div>
        </>
    );
}

// Summary Card Component (Updated for Light Theme System)
function SummaryCard({ title, value, icon, bgColor, iconColor }: any) {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    {title}
                </p>
                <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
                    <i className={`fa-solid ${icon} ${iconColor} text-sm`} />
                </div>
            </div>
            <div className="mt-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight tabular-nums">
                    {value}
                </h2>
            </div>
        </div>
    );
}

// Currency Helper
function formatCurrency(val: number) {
    if (!val) return "₹0";
    return `₹${Number(val).toLocaleString("en-IN")}`;
}