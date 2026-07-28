import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";

// ─── Helpers ──────────────────────────────────────────────────────────────
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const fmtINR = (n) =>
    n == null ? "₹0" : "₹" + Number(n).toLocaleString("en-IN");

// ─── Payslip Print View ────────────────────────────────────────────────────
function PayslipCard({ data, month, year }) {
    const handlePrint = () => window.print();

    const earnings = [
        { label: "Basic salary", amount: data.basic },
        { label: "HRA", amount: data.hra },
        { label: "TA", amount: data.ta },
        { label: "DA", amount: data.da },
        { label: "Special allowance", amount: data.specialAllow },
        { label: "Overtime", amount: data.overtimeAmount },
    ].filter(e => e.amount > 0);

    const deductions = [
        { label: "PF deduction", amount: data.pfDeduction },
        { label: "ESIC deduction", amount: data.esicDeduction },
        { label: "TDS", amount: data.tdsDeduction },
        { label: "Professional tax", amount: data.ptDeduction },
        { label: "Absent deduction", amount: data.absentDeduction },
        { label: "Late mark deduction", amount: data.lateDeduction },
        { label: "Loan deduction", amount: data.loanDeduction },
        { label: "Penalty deduction", amount: data.penaltyDeduction },
    ].filter(d => d.amount > 0);

    const totalEarnings = earnings.reduce((s, e) => s + (e.amount ?? 0), 0);
    const totalDeductions = deductions.reduce((s, d) => s + (d.amount ?? 0), 0);
    const netPay = data.netSalary ?? (totalEarnings - totalDeductions);

    return (
        <div id="payslip-print-area">
            {/* Print button — hidden in actual print */}
            <div className="flex justify-end mb-4 print:hidden">
                <button
                    onClick={handlePrint}
                    className="px-5 py-2 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-all"
                >
                    🖨️ Print payslip
                </button>
            </div>

            {/* Payslip document */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden print:border-none print:rounded-none">
                {/* Header */}
                <div className="bg-amber-600 text-white px-8 py-6 print:bg-amber-600">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Akerp Suite</h1>
                            <p className="text-amber-200 text-xs mt-0.5">Payslip for {MONTHS[month - 1]} {year}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-amber-200">Payslip ID</p>
                            <p className="font-bold text-lg">#{data.detailId ?? data.payrollId ?? "—"}</p>
                            <p className="text-xs text-amber-200 mt-1">Generated on {new Date().toLocaleDateString("en-IN")}</p>
                        </div>
                    </div>
                </div>

                {/* Employee Info */}
                <div className="bg-slate-50 border-b border-slate-200 px-8 py-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                        {[
                            { label: "Employee name", val: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || "—" },
                            { label: "Employee ID", val: data.empCode ?? `#${data.empId}` },
                            { label: "Department", val: data.deptName ?? "—" },
                            { label: "Designation", val: data.desigName ?? "—" },
                            { label: "Bank account", val: data.accountNo ? `${data.bankName ?? ""} · ${data.accountNo}` : "—" },
                            { label: "PF / UAN number", val: data.uanNo ?? "—" },
                            { label: "Working days", val: `${data.workingDays ?? "—"} days` },
                            { label: "Present days", val: `${data.presentDays ?? "—"} days` },
                        ].map(({ label, val }) => (
                            <div key={label}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                                <p className="text-sm font-semibold text-slate-800 mt-0.5">{val}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Earnings & Deductions */}
                <div className="px-8 py-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Earnings */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Earnings</p>
                            <div className="space-y-2">
                                {earnings.map((e, i) => (
                                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                        <span className="text-sm text-slate-600">{e.label}</span>
                                        <span className="text-sm font-semibold text-slate-800">{fmtINR(e.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm font-bold text-green-700">Total earnings</span>
                                    <span className="text-sm font-bold text-green-700">{fmtINR(totalEarnings)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Deductions</p>
                            <div className="space-y-2">
                                {deductions.length === 0 ? (
                                    <p className="text-sm text-slate-400 py-2">No deductions this month.</p>
                                ) : deductions.map((d, i) => (
                                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                                        <span className="text-sm text-slate-600">{d.label}</span>
                                        <span className="text-sm font-semibold text-red-600">−{fmtINR(d.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm font-bold text-red-600">Total deductions</span>
                                    <span className="text-sm font-bold text-red-600">−{fmtINR(totalDeductions)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Pay */}
                    <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl px-6 py-4 flex flex-wrap justify-between items-center gap-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Net salary payable</p>
                            <p className="text-3xl font-bold text-amber-700 mt-0.5">{fmtINR(netPay)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-500">Payment status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 ${data.status === "Paid"
                                ? "bg-green-100 text-green-700"
                                : data.status === "Finalized"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}>{data.status ?? "Draft"}</span>
                        </div>
                    </div>

                    {/* Footer note */}
                    <p className="text-[10px] text-slate-400 mt-5 text-center">
                        This is a computer-generated payslip and does not require a signature.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Status badge for table rows ───────────────────────────────────────────
function StatusBadge({ ps }) {
    if (!ps) {
        return (
            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-400">
                Not generated
            </span>
        );
    }

    // Fallback to "Draft" if status string is empty/null but payslip exists
    // (DB enum has no "Generated" status — sp_payroll_generate sets status = 'Draft')
    const status = ps.status || "Draft";

    const cls =
        status === "Paid"
            ? "bg-green-100 text-green-700"
            : status === "Finalized"
                ? "bg-blue-100 text-blue-700"
                : "bg-amber-100 text-amber-700";

    return (
        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${cls}`}>
            {status}
        </span>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function PayslipViewer() {
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);

    const [employees, setEmployees] = useState([]);
    const [empSearch, setEmpSearch] = useState("");
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    // payslip status/data per emp for the selected month-year: { [empId]: payslipDataOrNull }
    const [payslipMap, setPayslipMap] = useState<Record<string, any>>({});
    const [loadingPayslips, setLoadingPayslips] = useState(false);

    const [activePayslip, setActivePayslip] = useState(null); // currently viewed payslip
    const [viewLoadingEmpId, setViewLoadingEmpId] = useState(null);

    // ─── Pagination ─────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const res = await adminService.getEmployees();
            if (res.Success || res.success) {
                setEmployees(res.Data || res.data || []);
            }
        } catch (err) {
            console.error("Failed to load employees:", err);
        } finally {
            setLoadingEmployees(false);
        }
    };

    // Calculate Pagination variables
    const filteredEmployees = empSearch.trim()
        ? employees.filter(emp => {
            const q = empSearch.toLowerCase();
            return (
                (emp.firstName || "").toLowerCase().includes(q) ||
                (emp.lastName || "").toLowerCase().includes(q) ||
                (emp.empCode || "").toLowerCase().includes(q) ||
                String(emp.empId || "").includes(q)
            );
        })
        : employees;

    const totalItems = filteredEmployees.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalItems);
    const paginatedEmployees = filteredEmployees.slice(startIdx, endIdx);

    // Month / Year Change -> Clear old payslip status map and reset page
    useEffect(() => {
        setPayslipMap({});
        setCurrentPage(1);
        setActivePayslip(null);
    }, [month, year]);

    // Search / Page size change -> Reset page to 1
    useEffect(() => {
        setCurrentPage(1);
    }, [empSearch, pageSize]);

    // ─── OPTIMIZED: Fetch statuses ONLY for the employees visible on current page ───
    useEffect(() => {
        if (paginatedEmployees.length === 0) return;

        let isMounted = true;

        const loadStatusesForCurrentPage = async () => {
            // Find which employees from the current page are NOT yet loaded in our map
            const needsFetch = paginatedEmployees.filter(emp => payslipMap[emp.empId] === undefined);

            if (needsFetch.length === 0) return; // All visible employees are already loaded

            setLoadingPayslips(true);
            try {
                const results = await Promise.all(
                    needsFetch.map(async (emp) => {
                        try {
                            const res = await adminService.getPayslip(emp.empId, month, year);
                            if (res.Success || res.success) {
                                return [emp.empId, res.Data || res.data];
                            }
                            return [emp.empId, null];
                        } catch {
                            return [emp.empId, null];
                        }
                    })
                );

                if (isMounted) {
                    setPayslipMap(prev => {
                        const newMap = { ...prev };
                        // Add newly fetched statuses to our map without removing others
                        results.forEach(([empId, data]) => { newMap[empId] = data; });
                        return newMap;
                    });
                }
            } finally {
                if (isMounted) setLoadingPayslips(false);
            }
        };

        loadStatusesForCurrentPage();

        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [safePage, pageSize, empSearch, employees, month, year]);

    const handleViewPayslip = async (emp) => {
        const existing = payslipMap[emp.empId];
        if (existing) {
            setActivePayslip(existing);
            // Scroll to payslip
            setTimeout(() => {
                document.getElementById("payslip-result-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 50);
            return;
        }

        // Re-fetch just in case bulk load missed/failed for this specific employee
        setViewLoadingEmpId(emp.empId);
        try {
            const res = await adminService.getPayslip(emp.empId, month, year);
            if (res.Success || res.success) {
                const data = res.Data || res.data;
                setPayslipMap(prev => ({ ...prev, [emp.empId]: data }));
                setActivePayslip(data);
                setTimeout(() => {
                    document.getElementById("payslip-result-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 50);
            } else {
                alert(`Payslip not generated yet for ${emp.firstName} ${emp.lastName} (${MONTHS[month - 1]} ${year}).`);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to fetch payslip.");
        } finally {
            setViewLoadingEmpId(null);
        }
    };

    const goToPage = (p) => {
        setCurrentPage(Math.min(Math.max(1, p), totalPages));
    };

    // Builds a compact page-number list with ellipses, e.g. 1 ... 4 5 6 ... 20
    const getPageNumbers = () => {
        const pages = [];
        const delta = 1;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= safePage - delta && i <= safePage + delta)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== "...") {
                pages.push("...");
            }
        }
        return pages;
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Payslip viewer</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    View every employee's CTC and payslip status, and generate/view individual payslips.
                </p>
            </div>

            {/* Filters card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <div className="flex flex-wrap gap-4 items-end">
                    {/* Search */}
                    <div className="flex flex-col gap-1" style={{ minWidth: 260 }}>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Search employee</label>
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={empSearch}
                            onChange={e => setEmpSearch(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 w-full"
                        />
                    </div>

                    {/* Month */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Month *</label>
                        <select
                            value={month}
                            onChange={e => setMonth(parseInt(e.target.value))}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year */}
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Year *</label>
                        <input
                            type="number"
                            value={year}
                            onChange={e => setYear(parseInt(e.target.value))}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 w-28"
                        />
                    </div>

                    {loadingPayslips && (
                        <span className="text-xs font-medium text-amber-500 animate-pulse self-end pb-2.5">
                            Loading statuses...
                        </span>
                    )}
                </div>
            </div>

            {/* Employee list table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-700">
                        Employees · {MONTHS[month - 1]} {year}
                    </p>
                    <p className="text-xs text-slate-400">
                        {totalItems === 0 ? "0 employees" : `Showing ${startIdx + 1}–${endIdx} of ${totalItems}`}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="px-6 py-3">Employee</th>
                                <th className="px-6 py-3">Emp ID</th>
                                <th className="px-6 py-3">Department</th>
                                <th className="px-6 py-3">Current CTC</th>
                                <th className="px-6 py-3">Net salary ({MONTHS[month - 1].slice(0, 3)})</th>
                                <th className="px-6 py-3">Payslip status</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingEmployees ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                                        Loading employees...
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                                        No employees found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedEmployees.map(emp => {
                                    const ps = payslipMap[emp.empId];
                                    return (
                                        <tr key={emp.empId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <p className="font-semibold text-slate-800">{emp.firstName} {emp.lastName}</p>
                                                <p className="text-[11px] text-slate-400">{emp.officialEmail}</p>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600">{emp.empCode || `#${emp.empId}`}</td>
                                            <td className="px-6 py-3.5 text-slate-600">{emp.deptName ?? "—"}</td>
                                            <td className="px-6 py-3.5 font-semibold text-slate-800">{fmtINR(emp.currentCtc)}</td>
                                            <td className="px-6 py-3.5 font-semibold text-slate-800">
                                                {ps ? fmtINR(ps.netSalary) : "—"}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <StatusBadge ps={ps} />
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <button
                                                    onClick={() => handleViewPayslip(emp)}
                                                    disabled={viewLoadingEmpId === emp.empId}
                                                    className="px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 disabled:opacity-60 transition-all"
                                                >
                                                    {viewLoadingEmpId === emp.empId ? "Loading..." : "View payslip"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination controls */}
                {!loadingEmployees && totalItems > 0 && (
                    <div className="flex flex-wrap gap-3 justify-between items-center px-6 py-4 border-t border-slate-100">
                        {/* Page size selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Rows per page</span>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(parseInt(e.target.value))}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-amber-400"
                            >
                                {[10, 25, 50, 100].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        {/* Page navigation */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => goToPage(1)}
                                disabled={safePage === 1}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-all"
                            >«</button>
                            <button
                                onClick={() => goToPage(safePage - 1)}
                                disabled={safePage === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-all"
                            >Prev</button>

                            {getPageNumbers().map((p, i) =>
                                p === "..." ? (
                                    <span key={`dots-${i}`} className="px-2 text-xs text-slate-400">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => goToPage(p)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${p === safePage
                                            ? "bg-amber-600 text-white"
                                            : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >{p}</button>
                                )
                            )}

                            <button
                                onClick={() => goToPage(safePage + 1)}
                                disabled={safePage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-all"
                            >Next</button>
                            <button
                                onClick={() => goToPage(totalPages)}
                                disabled={safePage === totalPages}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-500 disabled:opacity-40 hover:bg-slate-50 transition-all"
                            >»</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Payslip result — shown at the end of the table */}
            <div id="payslip-result-area">
                {activePayslip && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                        <PayslipCard data={activePayslip} month={month} year={year} />
                    </div>
                )}
            </div>

            <style>{`
    @media print {
        body * {
            visibility: hidden;
        }

        #payslip-print-area, #payslip-print-area * {
            visibility: visible;
        }

        #payslip-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
        }

        .bg-amber-600 { background-color: #4f46e5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .text-white { color: #ffffff !important; }
        .print\\:hidden { display: none !important; }
    }
`}</style>
        </div>
    );
}