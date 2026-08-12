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
            <div className="flex justify-end gap-2 mb-4 print:hidden">
                <button
                    onClick={handlePrint}
                    className="px-5 py-2.5 bg-[#0b2836] text-white text-xs font-bold rounded-xl hover:bg-[#0f3345] shadow-lg shadow-[#0b2836]/20 transition-all flex items-center gap-2"
                >
                    <i className="fa-solid fa-print" /> Print Payslip
                </button>
            </div>

            {/* Payslip document */}
            <div className="border border-slate-200 rounded-[24px] overflow-hidden print:border-none print:rounded-none shadow-sm bg-white">
                {/* Header */}
                <div className="bg-[#0b2836] text-white px-8 py-6 print:bg-[#0b2836]">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">AKS Solar</h1>
                            <p className="text-amber-400 text-xs font-medium mt-0.5">Payslip for {MONTHS[month - 1]} {year}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Payslip ID</p>
                            <p className="font-mono font-bold text-lg text-amber-400">#{data.detailId ?? data.payrollId ?? "—"}</p>
                            <p className="text-xs text-slate-400 mt-1">Generated on {new Date().toLocaleDateString("en-IN")}</p>
                        </div>
                    </div>
                </div>

                {/* Employee Info */}
                <div className="bg-slate-50/70 border-b border-slate-200 px-8 py-5">
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
                        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-1.5">
                                <i className="fa-solid fa-arrow-trend-up"></i> Earnings
                            </p>
                            <div className="space-y-2">
                                {earnings.map((e, i) => (
                                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                                        <span className="text-sm font-medium text-slate-600">{e.label}</span>
                                        <span className="text-sm font-semibold text-slate-800 font-mono">{fmtINR(e.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-2">
                                    <span className="text-sm font-bold text-emerald-700">Total earnings</span>
                                    <span className="text-sm font-bold text-emerald-700 font-mono">{fmtINR(totalEarnings)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                            <p className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-3 flex items-center gap-1.5">
                                <i className="fa-solid fa-arrow-trend-down"></i> Deductions
                            </p>
                            <div className="space-y-2">
                                {deductions.length === 0 ? (
                                    <p className="text-sm text-slate-400 py-2 italic">No deductions this month.</p>
                                ) : deductions.map((d, i) => (
                                    <div key={i} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                                        <span className="text-sm font-medium text-slate-600">{d.label}</span>
                                        <span className="text-sm font-semibold text-rose-600 font-mono">−{fmtINR(d.amount)}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-2">
                                    <span className="text-sm font-bold text-rose-600">Total deductions</span>
                                    <span className="text-sm font-bold text-rose-600 font-mono">−{fmtINR(totalDeductions)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Pay */}
                    <div className="mt-6 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-200/60 rounded-2xl px-6 py-5 flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Net salary payable</p>
                            <p className="text-3xl font-black text-slate-900 mt-0.5 font-mono">{fmtINR(netPay)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-slate-400">Payment status</p>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mt-1 uppercase tracking-wide border ${data.status === "Paid"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : data.status === "Finalized"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}>{data.status ?? "Draft"}</span>
                        </div>
                    </div>

                    {/* Footer note */}
                    <p className="text-[11px] text-slate-400 mt-6 text-center font-medium">
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border bg-slate-50 text-slate-400 border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Not generated
            </span>
        );
    }

    const status = ps.status || "Draft";

    const cls =
        status === "Paid"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
            : status === "Finalized"
                ? "bg-blue-50 text-blue-700 border-blue-200/50"
                : "bg-amber-50 text-amber-700 border-amber-200/50";

    const dotCls =
        status === "Paid" ? "bg-emerald-500" : status === "Finalized" ? "bg-blue-500" : "bg-amber-500";

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`}></span>
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

    const [payslipMap, setPayslipMap] = useState<Record<string, any>>({});
    const [loadingPayslips, setLoadingPayslips] = useState(false);

    const [activePayslip, setActivePayslip] = useState(null);
    const [viewLoadingEmpId, setViewLoadingEmpId] = useState(null);

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

    useEffect(() => {
        setPayslipMap({});
        setCurrentPage(1);
        setActivePayslip(null);
    }, [month, year]);

    useEffect(() => {
        setCurrentPage(1);
    }, [empSearch, pageSize]);

    useEffect(() => {
        if (paginatedEmployees.length === 0) return;

        let isMounted = true;

        const loadStatusesForCurrentPage = async () => {
            const needsFetch = paginatedEmployees.filter(emp => payslipMap[emp.empId] === undefined);

            if (needsFetch.length === 0) return;

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
            setTimeout(() => {
                document.getElementById("payslip-result-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 50);
            return;
        }

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
        <div className="space-y-5 pb-10 font-sans relative z-0">

            {/* ── Compact Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-receipt text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Payslip Viewer</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            View every employee's CTC and payslip status, and generate/view individual payslips.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Filters Card ── */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[260px]">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Search Employee</label>
                        <div className="relative group">
                            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={empSearch}
                                onChange={e => setEmpSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="min-w-[160px]">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Month *</label>
                        <select
                            value={month}
                            onChange={e => setMonth(parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer appearance-none"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-32">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Year *</label>
                        <input
                            type="number"
                            value={year}
                            onChange={e => setYear(parseInt(e.target.value))}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                        />
                    </div>

                    {loadingPayslips && (
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 self-end pb-3">
                            <i className="fa-solid fa-spinner animate-spin" /> Loading statuses...
                        </div>
                    )}
                </div>
            </div>

            {/* ── Employee list table ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3 bg-slate-50/50">
                    <div>
                        <p className="text-sm font-bold text-slate-800">
                            Employees Directory · <span className="text-amber-600">{MONTHS[month - 1]} {year}</span>
                        </p>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {totalItems === 0 ? "0 employees" : `Showing ${startIdx + 1}–${endIdx} of ${totalItems} entries`}
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Emp ID</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Current CTC</th>
                                <th className="px-6 py-4">Net Salary ({MONTHS[month - 1].slice(0, 3)})</th>
                                <th className="px-6 py-4">Payslip Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loadingEmployees ? (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                                            <div className="text-sm font-medium text-slate-500 animate-pulse">Loading directory...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-24 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                                            <i className="fa-solid fa-users-slash" />
                                        </div>
                                        <p className="text-base font-bold text-slate-700">No Employees Found</p>
                                        <p className="text-sm text-slate-400 mt-1 font-medium">Try adjusting your search criteria.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedEmployees.map(emp => {
                                    const ps = payslipMap[emp.empId];
                                    return (
                                        <tr key={emp.empId} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</p>
                                                <p className="text-xs text-slate-400 font-medium mt-0.5">{emp.officialEmail}</p>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-amber-600">{emp.empCode || `#${emp.empId}`}</td>
                                            <td className="px-6 py-4 font-medium text-slate-600">{emp.deptName ?? "—"}</td>
                                            <td className="px-6 py-4 font-mono font-semibold text-slate-700">{fmtINR(emp.currentCtc)}</td>
                                            <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                                                {ps ? fmtINR(ps.netSalary) : "—"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge ps={ps} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleViewPayslip(emp)}
                                                    disabled={viewLoadingEmpId === emp.empId}
                                                    className="px-4 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 text-xs font-bold rounded-xl disabled:opacity-60 transition-all border border-amber-200/50 shadow-sm"
                                                >
                                                    {viewLoadingEmpId === emp.empId ? "Loading..." : "View Payslip"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!loadingEmployees && totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4 mt-auto">
                        <div className="flex items-center gap-3">
                            <span>Showing <span className="font-bold text-slate-800">{startIdx + 1}</span> to <span className="font-bold text-slate-800">{endIdx}</span> of <span className="font-bold text-slate-800">{totalItems}</span></span>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(parseInt(e.target.value))}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white focus:outline-none focus:border-amber-400 cursor-pointer"
                            >
                                {[10, 25, 50, 100].map(n => (
                                    <option key={n} value={n}>{n} / page</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-1.5">
                            <button
                                onClick={() => goToPage(safePage - 1)}
                                disabled={safePage === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                            </button>
                            <div className="hidden sm:flex items-center gap-1">
                                {getPageNumbers().map((p, i) =>
                                    p === "..." ? (
                                        <span key={`dots-${i}`} className="px-2 text-xs text-slate-400 font-bold">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => goToPage(p)}
                                            className={`w-8 h-8 rounded-lg border text-sm font-bold transition-all shadow-sm flex items-center justify-center ${p === safePage
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
                                onClick={() => goToPage(safePage + 1)}
                                disabled={safePage === totalPages}
                                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                Next <i className="fa-solid fa-chevron-right text-[10px]" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Active Payslip Result Card ── */}
            <div id="payslip-result-area">
                {activePayslip && (
                    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 animate-in fade-in duration-300">
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

                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}