import { useState, useEffect } from "react";
import { adminService, getDocumentUrl } from "../../services/adminService";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const fmtINR = (n) =>
    n == null ? "₹0" : "₹" + Number(n).toLocaleString("en-IN");

const fmtDate = (d) => (d ? String(d).slice(0, 10) : "-");

export default function EmployeeDashboard() {
    // Role & access logic (role comes from localStorage or Auth Context)
    const currentUserRole = localStorage.getItem("userRole") || "Emp"; // e.g. 'Emp', 'Admin', 'HR', 'SCMD'
    const hasFullAccess = ["Admin", "HR", "SCMD"].includes(currentUserRole);

    // States
    const [activeTab, setActiveTab] = useState("payslip"); // 'payslip', 'loans', 'documents', 'bank'
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);

    // Admin-specific states
    const [selectedEmpId, setSelectedEmpId] = useState(""); // "" means self
    const [employeeList, setEmployeeList] = useState([]);

    // Data states
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // 1. Fetch employee list for Admins/HR
    useEffect(() => {
        if (hasFullAccess) {
            const fetchEmployees = async () => {
                try {
                    // Ensure this API exists in adminService
                //    const res = await adminService.getAllEmployees();
                    const res = await adminService.getEmployees();
                    if (res.success) setEmployeeList(res.data || []);
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
                let res;
                // If an admin has selected a specific employee, fetch that employee's data.
                // Otherwise fetch the logged-in user's own (self) data.
                const isSelf = !hasFullAccess || selectedEmpId === "";

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

                // Backend ApiResponseDto is serialized as camelCase: { success, message, data }
                if (res.success && res.data != null) {
                    setData(res.data);
                } else {
                    setError(res.message || "No data available right now.");
                }
            } catch (err) {
                console.error(err);
                setError("Something went wrong. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeTab, month, year, selectedEmpId, hasFullAccess]);

    const handlePrint = () => window.print();

    // --- PAYSLIP CALCULATION LOGIC ---
    // Note: SelfPayslipResponseDto is returned as camelCase: basic, hra, ta, specialAllow, overtimeAmount, etc.
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

    return (
        <div className="space-y-6">
            {/* Top Header & Role Based Filters */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Information Dashboard</h2>
                    <p className="text-xs text-slate-500 mt-0.5">View and manage your details.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Admin Employee Selector */}
                    {hasFullAccess && (
                        <select
                            value={selectedEmpId}
                            onChange={(e) => setSelectedEmpId(e.target.value)}
                            className="border border-indigo-300 bg-indigo-50 rounded-lg px-3 py-2 text-sm text-indigo-800 font-medium"
                        >
                            <option value="">My Own Data (Self)</option>
                            {employeeList.map(emp => (
                                <option key={emp.empId} value={emp.empId}>
                                    {emp.fullName} ({emp.empCode})
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Month/Year Selector (Only for Payslip) */}
                    {activeTab === "payslip" && (
                        <>
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700"
                            >
                                {MONTHS.map((m, i) => (
                                    <option key={m} value={i + 1}>{m}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value))}
                                className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-24"
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 print:hidden overflow-x-auto pb-2">
                {['payslip', 'loans', 'documents', 'bank'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors capitalize ${activeTab === tab
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Loading & Error States */}
            {loading && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm py-16 text-center text-slate-400">
                    Loading data...
                </div>
            )}

            {!loading && error && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                </div>
            )}

            {/* --- PAYSLIP VIEW --- */}
            {!loading && !error && activeTab === "payslip" && data && (
                <div id="payslip-print-area">
                    <div className="flex justify-end mb-4 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="px-5 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all"
                        >
                            🖨️ Print Payslip
                        </button>
                    </div>
                    {/* Payslip UI Box */}
                    <div className="border border-slate-200 rounded-2xl p-6 bg-white print:border-none">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold">Payslip for {MONTHS[month - 1]} {year}</h3>
                                <p className="text-sm text-slate-500">{data.fullName} ({data.empCode})</p>
                                <p className="text-sm text-slate-500">{data.deptName} - {data.desigName}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                                {data.payrollStatus || "-"}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-2">Earnings</h4>
                                <ul className="space-y-1 text-sm">
                                    {earnings.map((e) => (
                                        <li key={e.label} className="flex justify-between">
                                            <span className="text-slate-600">{e.label}</span>
                                            <span className="font-medium">{fmtINR(e.amount)}</span>
                                        </li>
                                    ))}
                                    <li className="flex justify-between border-t pt-1 font-semibold">
                                        <span>Gross Earning</span>
                                        <span>{fmtINR(totalEarnings)}</span>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-700 mb-2">Deductions</h4>
                                <ul className="space-y-1 text-sm">
                                    {deductions.map((d) => (
                                        <li key={d.label} className="flex justify-between">
                                            <span className="text-slate-600">{d.label}</span>
                                            <span className="font-medium">{fmtINR(d.amount)}</span>
                                        </li>
                                    ))}
                                    <li className="flex justify-between border-t pt-1 font-semibold">
                                        <span>Total Deduction</span>
                                        <span>{fmtINR(totalDeductions)}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                            <div className="text-sm text-slate-500">
                                Working days: {data.workingDays} • Present: {data.presentDays} • Absent: {data.absentDays}
                            </div>
                            <p className="text-lg font-bold text-indigo-700">Net Pay: {fmtINR(netPay)}</p>
                        </div>

                        {(data.bankName || data.accountNo) && (
                            <div className="mt-4 text-xs text-slate-400">
                                {data.bankName} • A/C {data.accountNo} • IFSC {data.ifscCode}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- LOANS VIEW --- */}
            {!loading && !error && activeTab === "loans" && data && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Loan Details</h3>
                    {data.length > 0 ? (
                        <ul className="space-y-3">
                            {data.map((loan) => (
                                <li key={loan.loanId} className="p-4 bg-slate-50 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-slate-800">{loan.loanType}</p>
                                            <p className="text-sm text-slate-600">
                                                Total: {fmtINR(loan.totalAmount)} • EMI: {fmtINR(loan.emiAmount)}
                                            </p>
                                            <p className="text-sm text-slate-600">
                                                Remaining: {fmtINR(loan.remainingAmount)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Loan date: {fmtDate(loan.loanDate)}
                                            </p>
                                            {loan.remarks && (
                                                <p className="text-xs text-slate-400 mt-1">{loan.remarks}</p>
                                            )}
                                        </div>
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                            {loan.status}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-slate-500">No active loans found.</p>}
                </div>
            )}

            {/* --- DOCUMENTS VIEW --- */}
            {!loading && !error && activeTab === "documents" && data && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">My Documents</h3>
                    {data.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {data.map((doc, i) => (
                                <div key={doc.docId ?? i} className="p-4 bg-slate-50 border rounded-lg flex justify-between items-center">
                                    <div>
                                        <span className="font-medium block">{doc.docName ?? "Document"}</span>
                                        {doc.docType && (
                                            <span className="text-xs text-slate-400">{doc.docType}</span>
                                        )}
                                    </div>
                                    {doc.filePath && (

                                       <a href = { getDocumentUrl(doc.filePath)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-600 text-sm font-bold">
                                    View
                                </a>
                            )}
                        </div>
                    ))}
                        </div>
                    ) : <p className="text-slate-500">No documents have been uploaded.</p>}
                </div>
            )}

            {/* --- BANK DETAILS VIEW --- */}
            {!loading && !error && activeTab === "bank" && data && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Bank Information</h3>
                    {data.length > 0 ? (
                        <div className="space-y-4">
                            {data.map((bank, i) => (
                                <div key={bank.bankDetailId ?? i} className="p-4 border rounded-lg flex flex-col gap-1">
                                    <p><span className="text-slate-500">Bank Name:</span> <span className="font-semibold">{bank.bankName}</span></p>
                                    <p><span className="text-slate-500">A/C No:</span> <span className="font-semibold">{bank.accountNo}</span></p>
                                    <p><span className="text-slate-500">IFSC:</span> <span className="font-semibold">{bank.ifscCode}</span></p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-slate-500">No bank details on file.</p>}
                </div>
            )}

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #payslip-print-area, #payslip-print-area * { visibility: visible; }
                    #payslip-print-area { position: absolute; left: 0; top: 0; width: 100%; }
                    .print\\:hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}