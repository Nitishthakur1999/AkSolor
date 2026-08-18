import { useState, useEffect } from "react";
import { adminService, getDocumentUrl } from "@/services/adminService"; // Verify path

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const fmtINR = (n: any) =>
    n == null ? "₹0" : "₹" + Number(n).toLocaleString("en-IN");

const fmtDate = (d: any) => (d ? String(d).slice(0, 10) : "-");

// Common Input/Label Styles
const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm";
const labelClass = "block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1";

export default function EmployeeDashboard() {
    // Role & access logic
    const currentUserRole = localStorage.getItem("userRole") || "Emp";
    const hasFullAccess = ["Admin", "HR", "SCMD"].includes(currentUserRole);

    // States
    const [activeTab, setActiveTab] = useState("payslip"); // 'payslip', 'loans', 'documents', 'bank'
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);

    // Admin-specific states
    const [selectedEmpId, setSelectedEmpId] = useState(""); // "" means self
    const [employeeList, setEmployeeList] = useState<any[]>([]);

    // Data states
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 1. Fetch employee list for Admins/HR
    useEffect(() => {
        if (hasFullAccess) {
            const fetchEmployees = async () => {
                try {
                    const res = await adminService.getEmployees();
                    if (res.success || res.Success) setEmployeeList(res.data || res.Data || []);
                } catch (err) {
                    console.error("Failed to load employees");
                }
            };
            fetchEmployees();
        }
    }, [hasFullAccess]);

    // 2. Fetch data based on active tab and selected employee
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError("");
            setData(null);
            try {
                let res: any;
                const isSelf = !hasFullAccess || selectedEmpId === "";

                if (activeTab === "payslip" && isSelf && currentUserRole === "Admin") {
                    setError("Admin accounts don't have a payslip. Select an employee above to view their payslip.");
                    setLoading(false);
                    return;
                }

                if (activeTab === "payslip") {
                    res = isSelf
                        ? await adminService.getMyPayslip(month, year)
                        : await adminService.getPayslip(selectedEmpId, month, year);
                } else if (activeTab === "loans") {
                    res = isSelf
                        ? await adminService.getMyLoans()
                        : await adminService.getLoansByEmployee(selectedEmpId);
                } else if (activeTab === "documents") {
                    res = isSelf
                        ? await adminService.getMyDocuments()
                        : await adminService.getEmployeeDocuments(selectedEmpId);
                } else if (activeTab === "bank") {
                    res = isSelf
                        ? await adminService.getMyBankDetails()
                        : await adminService.getBankDetails(selectedEmpId);
                }

                if ((res.success || res.Success) && (res.data != null || res.Data != null)) {
                    setData(res.data || res.Data);
                } else {
                    setError(res.message || res.Message || "No data available right now.");
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeTab, month, year, selectedEmpId, hasFullAccess, currentUserRole]);

    const handlePrint = () => window.print();

    // --- PAYSLIP CALCULATION LOGIC ---
    const isPayslip = activeTab === "payslip" && data;
    const earnings = isPayslip
        ? [
            { label: "Basic salary", amount: data.basic },
            { label: "HRA", amount: data.hra },
            { label: "TA", amount: data.ta },
            { label: "Special allowance", amount: data.specialAllow },
            { label: "Overtime", amount: data.overtimeAmount },
        ].filter((e) => e.amount > 0)
        : [];

    const deductions = isPayslip
        ? [
            { label: "PF deduction", amount: data.pfDeduction },
            { label: "ESIC deduction", amount: data.esicDeduction },
            { label: "TDS", amount: data.tdsDeduction },
            { label: "Professional tax", amount: data.ptDeduction },
            { label: "Absent deduction", amount: data.absentDeduction },
            { label: "Late mark deduction", amount: data.lateDeduction },
            { label: "Loan deduction", amount: data.loanDeduction },
            { label: "Penalty deduction", amount: data.penaltyDeduction },
        ].filter((d) => d.amount > 0)
        : [];

    const totalEarnings = data?.grossEarning ?? earnings.reduce((s, e) => s + (e.amount ?? 0), 0);
    const totalDeductions = data?.totalDeduction ?? deductions.reduce((s, d) => s + (d.amount ?? 0), 0);
    const netPay = data ? data.netSalary ?? totalEarnings - totalDeductions : 0;

    const TAB_CONFIG = [
        { key: "payslip", label: "Payslips", icon: "fa-solid fa-file-invoice-dollar" },
        { key: "loans", label: "Loans", icon: "fa-solid fa-hand-holding-dollar" },
        { key: "documents", label: "Documents", icon: "fa-solid fa-folder-open" },
        { key: "bank", label: "Bank Details", icon: "fa-solid fa-building-columns" }
    ];

    return (
        <div className="space-y-6 font-sans relative z-0 pb-10">
            {/* Print Styles */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #payslip-print-area, #payslip-print-area * { visibility: visible; }
                    #payslip-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .print\\:hidden { display: none !important; }
                    @page { margin: 15mm; }
                }
            `}</style>

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden print:hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-layer-group text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Information Dashboard</h2>
                        <p className="text-xs text-slate-400 mt-0.5">View and manage your payslips, loans, documents, and bank details.</p>
                    </div>
                </div>

                <div className="relative z-10 w-full md:w-auto">
                    {activeTab === "payslip" && data && !error && !loading && (
                        <button
                            onClick={handlePrint}
                            className="w-full md:w-auto px-5 py-2.5 bg-amber-400 text-[#0b2836] font-bold rounded-xl text-xs shadow-md shadow-amber-400/20 hover:bg-amber-500 transition-all flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-print" /> Print Payslip
                        </button>
                    )}
                </div>
            </div>

            {/* ── Filter Controls ── */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm print:hidden">
                <div className="flex flex-wrap items-end gap-4">
                    {/* Admin Employee Selector */}
                    {hasFullAccess && (
                        <div className="flex-1 min-w-[220px]">
                            <label className={labelClass}>Select Employee</label>
                            <select
                                value={selectedEmpId}
                                onChange={(e) => setSelectedEmpId(e.target.value)}
                                className={`${inputClass} cursor-pointer appearance-none bg-slate-50`}
                            >
                                <option value="">-- My Own Data (Self) --</option>
                                {employeeList.map((emp: any) => (
                                    <option key={emp.empId} value={emp.empId}>
                                        {emp.fullName} ({emp.empCode})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Month/Year Selector (Only for Payslip) */}
                    {activeTab === "payslip" && (
                        <>
                            <div className="w-full sm:w-40">
                                <label className={labelClass}>Month</label>
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(parseInt(e.target.value))}
                                    className={`${inputClass} cursor-pointer appearance-none`}
                                >
                                    {MONTHS.map((m, i) => (
                                        <option key={m} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full sm:w-32">
                                <label className={labelClass}>Year</label>
                                <input
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(parseInt(e.target.value))}
                                    className={inputClass}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Main Container (Tabs + Content) ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden print:border-none print:shadow-none">

                {/* ── Tabs Navigation ── */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50 print:hidden">
                    {TAB_CONFIG.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 focus:outline-none ${activeTab === tab.key
                                    ? "border-amber-500 text-amber-600 bg-white"
                                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                }`}
                        >
                            <i className={`${tab.icon} text-[13px]`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 sm:p-8 min-h-[400px]">

                    {/* Loading & Error States */}
                    {loading && (
                        <div className="py-24 flex flex-col items-center justify-center gap-4 print:hidden">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Loading {activeTab} data...</div>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="py-16 text-center print:hidden animate-in fade-in">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 text-2xl shadow-sm mb-4 border border-rose-100">
                                <i className="fa-solid fa-triangle-exclamation" />
                            </div>
                            <p className="text-base font-bold text-slate-700">{error}</p>
                            <p className="text-sm text-slate-400 mt-1 font-medium">Please check your selection or contact administration.</p>
                        </div>
                    )}

                    {/* --- PAYSLIP VIEW --- */}
                    {!loading && !error && activeTab === "payslip" && data && (
                        <div id="payslip-print-area" className="animate-in fade-in duration-300">
                            <div className="border border-slate-200 rounded-[20px] p-6 sm:p-10 bg-white shadow-sm print:shadow-none print:border-none">
                                {/* Payslip Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-100 pb-6 mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Payslip</h3>
                                        <p className="text-sm font-bold text-amber-600 mt-1 uppercase tracking-wider">{MONTHS[month - 1]} {year}</p>

                                        <div className="mt-4 space-y-1">
                                            <p className="text-base font-bold text-slate-800">{data.fullName}</p>
                                            <p className="text-sm font-medium text-slate-500">Emp Code: <span className="font-mono text-slate-700 font-bold">{data.empCode}</span></p>
                                            <p className="text-sm font-medium text-slate-500">{data.deptName} • {data.desigName}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 sm:mt-0 flex flex-col items-end">
                                        <span className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                                            {data.payrollStatus || "Processed"}
                                        </span>
                                        <div className="mt-4 text-right text-xs text-slate-500 space-y-1">
                                            <p>Working Days: <span className="font-bold text-slate-700">{data.workingDays}</span></p>
                                            <p>Present: <span className="font-bold text-emerald-600">{data.presentDays}</span></p>
                                            <p>Absent: <span className="font-bold text-rose-600">{data.absentDays}</span></p>
                                        </div>
                                    </div>
                                </div>

                                {/* Earnings & Deductions Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                                    {/* Earnings Column */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                            <i className="fa-solid fa-arrow-trend-up text-emerald-500" />
                                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Earnings</h4>
                                        </div>
                                        <ul className="space-y-3 text-sm">
                                            {earnings.map((e) => (
                                                <li key={e.label} className="flex justify-between items-center">
                                                    <span className="font-medium text-slate-600">{e.label}</span>
                                                    <span className="font-mono font-bold text-slate-800">{fmtINR(e.amount)}</span>
                                                </li>
                                            ))}
                                            <li className="flex justify-between items-center border-t border-slate-100 pt-3 mt-3">
                                                <span className="font-bold text-slate-800">Gross Earning</span>
                                                <span className="font-mono font-black text-emerald-600 text-base">{fmtINR(totalEarnings)}</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Deductions Column */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                                            <i className="fa-solid fa-arrow-trend-down text-rose-500" />
                                            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Deductions</h4>
                                        </div>
                                        <ul className="space-y-3 text-sm">
                                            {deductions.map((d) => (
                                                <li key={d.label} className="flex justify-between items-center">
                                                    <span className="font-medium text-slate-600">{d.label}</span>
                                                    <span className="font-mono font-bold text-slate-800">{fmtINR(d.amount)}</span>
                                                </li>
                                            ))}
                                            <li className="flex justify-between items-center border-t border-slate-100 pt-3 mt-3">
                                                <span className="font-bold text-slate-800">Total Deduction</span>
                                                <span className="font-mono font-black text-rose-600 text-base">{fmtINR(totalDeductions)}</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Net Pay Footer */}
                                <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 p-6 rounded-xl">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Net Payable Amount</p>
                                        {(data.bankName || data.accountNo) ? (
                                            <p className="text-xs font-medium text-slate-500">
                                                To be credited to: <span className="font-bold text-slate-700">{data.bankName}</span> (A/C: <span className="font-mono">{data.accountNo}</span>)
                                            </p>
                                        ) : (
                                            <p className="text-xs font-medium text-slate-500">Payment method: Offline / Check</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-[#0b2532] tabular-nums tracking-tight">
                                            {fmtINR(netPay)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- LOANS VIEW --- */}
                    {!loading && !error && activeTab === "loans" && data && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <i className="fa-solid fa-hand-holding-dollar" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Active & Past Loans</h3>
                            </div>

                            {data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {data.map((loan: any) => (
                                        <div key={loan.loanId} className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Loan Type</p>
                                                    <p className="font-black text-slate-800 text-lg">{loan.loanType}</p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${loan.status === 'Active' ? 'bg-amber-50 text-amber-700 border-amber-200/50'
                                                        : loan.status === 'Closed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                                                            : 'bg-slate-100 text-slate-600 border-slate-200'
                                                    }`}>
                                                    {loan.status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Amount</p>
                                                    <p className="font-mono font-bold text-slate-800">{fmtINR(loan.totalAmount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Monthly EMI</p>
                                                    <p className="font-mono font-bold text-amber-600">{fmtINR(loan.emiAmount)}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Remaining Balance</p>
                                                    <p className="font-mono font-black text-rose-600 text-lg">{fmtINR(loan.remainingAmount)}</p>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Disbursed On</p>
                                                    <p className="text-xs font-semibold text-slate-600">{fmtDate(loan.loanDate)}</p>
                                                </div>
                                                {loan.remarks && (
                                                    <p className="text-[11px] font-medium text-slate-500 max-w-[120px] truncate" title={loan.remarks}>
                                                        {loan.remarks}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                    <i className="fa-solid fa-file-invoice text-3xl text-slate-300 mb-3" />
                                    <p className="text-sm font-bold text-slate-600">No loan records found.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- DOCUMENTS VIEW --- */}
                    {!loading && !error && activeTab === "documents" && data && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <i className="fa-solid fa-folder-open" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">My Documents</h3>
                            </div>

                            {data.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {data.map((doc: any, i: number) => (
                                        <div key={doc.docId ?? i} className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex items-center gap-4 group">
                                            <div className="w-12 h-12 rounded-[14px] bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                                                <i className="fa-regular fa-file-pdf text-xl" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-amber-700 transition-colors">
                                                    {doc.docName ?? "Document"}
                                                </p>
                                                {doc.docType && (
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                                                        {doc.docType}
                                                    </p>
                                                )}
                                            </div>
                                            {doc.filePath && (
                                                <a
                                                    href={getDocumentUrl(doc.filePath)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-amber-100 hover:text-amber-600 transition-colors shrink-0"
                                                    title="View Document"
                                                >
                                                    <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                    <i className="fa-regular fa-folder-open text-3xl text-slate-300 mb-3" />
                                    <p className="text-sm font-bold text-slate-600">No documents uploaded.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- BANK DETAILS VIEW --- */}
                    {!loading && !error && activeTab === "bank" && data && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <i className="fa-solid fa-building-columns" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">Bank Information</h3>
                            </div>

                            {data.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {data.map((bank: any, i: number) => (
                                        <div key={bank.bankDetailId ?? i} className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-10" />

                                            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                                                    <i className="fa-solid fa-building-columns text-lg" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Bank Name</p>
                                                    <p className="text-base font-black text-slate-800 tracking-tight">{bank.bankName}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Account Number</p>
                                                    <p className="font-mono font-bold text-xl text-slate-900 tracking-widest bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 inline-block">
                                                        {bank.accountNo}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">IFSC Code</p>
                                                    <p className="font-mono font-bold text-sm text-slate-700">{bank.ifscCode}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                    <i className="fa-solid fa-building-columns text-3xl text-slate-300 mb-3" />
                                    <p className="text-sm font-bold text-slate-600">No bank details on file.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}