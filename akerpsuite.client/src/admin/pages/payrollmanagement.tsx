import { useEffect, useState, useMemo, useRef } from "react";
import { adminService } from "@/services/adminService";
import { Link, useSearchParams } from "react-router-dom";
// ─── Constants ─────────────────────────────────────────────────────────────
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const todayISO = new Date().toISOString().slice(0, 10);

// 🔧 Must exactly match backend `validTypes` in PayrollService.AddDeductionAsync
const DEDUCTION_TYPES = [
    { value: "UniformViolation", label: "Uniform Code Not Followed" },
    { value: "IDCardMissing", label: "ID Card Not Carried" },
    { value: "Damage", label: "Damage Recovery" },
    { value: "AssetLoss", label: "Asset Loss" },
    { value: "Fine", label: "Fine" },
    { value: "Disciplinary", label: "Disciplinary Deduction" },
    { value: "AdvanceAdjustment", label: "Advance Salary Adjustment" },
    { value: "Other", label: "Other" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtINR = (n) =>
    n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN");

const deductionTypeLabel = (code) =>
    DEDUCTION_TYPES.find(t => t.value === code)?.label ?? code ?? "—";

function Badge({ status }) {
    const map = {
        Generated: "bg-amber-50 text-amber-700 border-amber-200",
        Draft: "bg-amber-50 text-amber-700 border-amber-200",
        Processing: "bg-slate-100 text-slate-500 border-slate-200",
        Finalized: "bg-blue-50  text-blue-700  border-blue-200",
        Paid: "bg-green-50 text-green-700 border-green-200",
        Pending: "bg-amber-50 text-amber-700 border-amber-200",
        Approved: "bg-green-50 text-green-700 border-green-200",
        Rejected: "bg-red-50   text-red-700   border-red-200",
    };
    const cls = map[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
            {status}
        </span>
    );
}

function Field({ label, children }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
            {children}
        </div>
    );
}

function Input({ ...props }) {
    return (
        <input
            {...props}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
        />
    );
}

function MonthYearPicker({ month, year, onChange }) {
    return (
        <>
            <Field label="Month *">
                <select
                    value={month}
                    onChange={e => onChange(parseInt(e.target.value), year)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white"
                >
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
            </Field>
            <Field label="Year *">
                <Input
                    type="number" value={year} style={{ width: 110 }}
                    onChange={e => onChange(month, parseInt(e.target.value))}
                />
            </Field>
        </>
    );
}

function EmployeePicker({ label = "Employee *", value, onChange, required = true, placeholder = "Search by name or ID...", width = "100%", disabled = false }: any) {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedName, setSelectedName] = useState("");
    const ref = useRef(null);

    useEffect(() => {
        adminService.getEmployees().then(res => {
            if (res.Success || res.success) setEmployees(res.Data || res.data || []);
        }).catch(err => console.error("Failed to load employees:", err));
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!value) setSelectedName("");
    }, [value]);

    const filtered = search.trim()
        ? employees.filter(emp => {
            const q = search.toLowerCase();
            return (
                (emp.firstName || "").toLowerCase().includes(q) ||
                (emp.lastName || "").toLowerCase().includes(q) ||
                (emp.empCode || "").toLowerCase().includes(q) ||
                String(emp.empId || "").includes(q)
            );
        })
        : employees;

    const handleSelect = (emp) => {
        onChange(emp.empId);
        setSelectedName(`${emp.firstName} ${emp.lastName} (${emp.empCode || `#${emp.empId}`})`);
        setSearch("");
        setShowDropdown(false);
    };

    return (
        <div className="flex flex-col gap-1 relative" ref={ref} style={{ minWidth: width ?? 220 }}>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
            <input
                type="text"
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                value={showDropdown ? search : selectedName}
                onChange={e => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                    if (!e.target.value) { onChange(""); setSelectedName(""); }
                }}
                onFocus={() => { if (!disabled) { setShowDropdown(true); setSearch(""); } }}
                className={`px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white w-full ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
            />
            {showDropdown && !disabled && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-50">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400">No employees found.</div>
                    ) : (
                        filtered.map(emp => (
                            <button
                                type="button"
                                key={emp.empId}
                                onClick={() => handleSelect(emp)}
                                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0"
                            >
                                <div className="text-sm font-semibold text-slate-800">{emp.firstName} {emp.lastName}</div>
                                <div className="text-[11px] text-slate-400">{emp.empCode || `#${emp.empId}`} · {emp.officialEmail}</div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ── 1. Salary Structure Tab ───────────────────────────────────────────────
function SalaryTab({ structures }) {
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [saving, setSaving] = useState(false);

    const emptyForm = {
        empId: "", structureId: "1",
        basic: "", hra: "", ta: "", da: "", specialAllow: "",
        pfEmployee: "", pfEmployer: "", esicEmployee: "0", esicEmployer: "0",
        tds: "0", professionalTax: "200",
        effectiveFrom: todayISO, createdBy: "1"
    };
    const [form, setForm] = useState(emptyForm);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const filtered = useMemo(() => {
        if (!search.trim()) return structures;
        const q = search.toLowerCase();
        return structures.filter(s =>
            `${s.firstName ?? ""} ${s.lastName ?? ""}`.toLowerCase().includes(q) ||
            String(s.empId ?? "").includes(q)
        );
    }, [structures, search]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.empId || !form.basic || !form.effectiveFrom) {
            alert("Employee, Basic salary and Effective From date are required.");
            return;
        }
        setSaving(true);
        try {
            const res = await adminService.setEmployeeSalary({
                empId: parseInt(form.empId),
                structureId: parseInt(form.structureId) || 1,
                basic: parseFloat(form.basic),
                hra: parseFloat(form.hra) || 0,
                ta: parseFloat(form.ta) || 0,
                da: parseFloat(form.da) || 0,
                specialAllow: parseFloat(form.specialAllow) || 0,
                pfEmployee: parseFloat(form.pfEmployee) || 0,
                pfEmployer: parseFloat(form.pfEmployer) || 0,
                esicEmployee: parseFloat(form.esicEmployee) || 0,
                esicEmployer: parseFloat(form.esicEmployer) || 0,
                tds: parseFloat(form.tds) || 0,
                professionalTax: parseFloat(form.professionalTax) || 0,
                effectiveFrom: form.effectiveFrom,
                createdBy: parseInt(form.createdBy) || 1,
            });
            if (res.Success || res.success) {
                alert("Salary structure saved!");
                setShowForm(false);
                setForm(emptyForm);
                window.location.reload();
            } else {
                alert(res.Message || "Failed to save salary structure.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error. Check console.");
        } finally {
            setSaving(false);
        }
    };

    const fields = [
        { label: "Basic (₹) *", key: "basic", type: "number", ph: "80000" },
        { label: "HRA (₹)", key: "hra", type: "number", ph: "25000" },
        { label: "TA (₹)", key: "ta", type: "number", ph: "5000" },
        { label: "DA (₹)", key: "da", type: "number", ph: "3000" },
        { label: "Special Allowance (₹)", key: "specialAllow", type: "number", ph: "8000" },
        { label: "PF Employee (₹)", key: "pfEmployee", type: "number", ph: "9600" },
        { label: "PF Employer (₹)", key: "pfEmployer", type: "number", ph: "9600" },
        { label: "ESIC Employee (₹)", key: "esicEmployee", type: "number", ph: "0" },
        { label: "ESIC Employer (₹)", key: "esicEmployer", type: "number", ph: "0" },
        { label: "TDS (₹)", key: "tds", type: "number", ph: "5000" },
        { label: "Professional Tax (₹)", key: "professionalTax", type: "number", ph: "200" },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="text" placeholder="Search by name or ID…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] max-w-xs px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400"
                />
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all"
                >{showForm ? "Cancel" : "+ Set salary"}</button>
            </div>

            {showForm && (
                <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Set / update salary structure</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <EmployeePicker
                            value={form.empId}
                            onChange={(id) => setForm(f => ({ ...f, empId: id }))}
                        />
                        {fields.map(({ label, key, type, ph }) => (
                            <Field key={key} label={label}>
                                <Input type={type} placeholder={ph} value={form[key]} onChange={set(key)} />
                            </Field>
                        ))}
                        <Field label="Effective From *">
                            <Input type="date" value={form.effectiveFrom} onChange={set("effectiveFrom")} required />
                        </Field>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all"
                        >{saving ? "Saving…" : "Save structure"}</button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <tr>
                            {["Employee", "Structure", "Basic", "HRA", "TA", "DA", "Special Allow.", "Gross CTC", "Effective From"].map(h => (
                                <th key={h} className="px-5 py-3 text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-400">No salary records found.</td></tr>
                        ) : filtered.map((s, i) => {
                            const gross = (s.basic ?? 0) + (s.hra ?? 0) + (s.ta ?? 0) + (s.da ?? 0) + (s.specialAllow ?? 0);
                            return (
                                <tr key={s.salId ?? i} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="font-semibold text-slate-800">
                                            {s.firstName} {s.lastName}
                                        </div>
                                        <div className="text-[11px] text-slate-400">{s.empCode || `#${s.empId}`}</div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] font-bold">
                                            {s.structureName ?? (s.structureId ? `#${s.structureId}` : "—")}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">{fmtINR(s.basic)}</td>
                                    <td className="px-5 py-3">{fmtINR(s.hra)}</td>
                                    <td className="px-5 py-3">{fmtINR(s.ta)}</td>
                                    <td className="px-5 py-3">{fmtINR(s.da)}</td>
                                    <td className="px-5 py-3">{fmtINR(s.specialAllow)}</td>
                                    <td className="px-5 py-3 font-semibold text-slate-800">{fmtINR(gross)}</td>
                                    <td className="px-5 py-3 text-slate-500 text-xs">{s.effectiveFrom ? s.effectiveFrom.slice(0, 10) : "—"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PayrollResultTable({ title, period, list, loading }) {
    if (!period) return null;
    return (
        <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {title} — {MONTHS[(period.month ?? 1) - 1]} {period.year}
                {!loading && <span className="text-slate-400 font-normal normal-case"> · {list?.length ?? 0} employee(s)</span>}
            </p>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <tr>
                            {["Employee", "Basic", "HRA", "TA", "DA", "Special Allow.", "Gross", "PF", "Deductions", "Net pay", "Status"].map(h => (
                                <th key={h} className="px-5 py-3 text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={11} className="px-5 py-10 text-center text-indigo-500 animate-pulse">Loading…</td></tr>
                        ) : !list || list.length === 0 ? (
                            <tr><td colSpan={11} className="px-5 py-10 text-center text-slate-400">No records found for this period.</td></tr>
                        ) : list.map((d, i) => (
                            <tr key={d.payrollId ?? d.empId ?? i} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-5 py-3">
                                    <div className="font-semibold text-slate-800">{d.empName ?? `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() ?? `EMP-${d.empId}`}</div>
                                    <div className="text-[11px] text-slate-400">#{d.empId}</div>
                                </td>
                                <td className="px-5 py-3">{fmtINR(d.basic)}</td>
                                <td className="px-5 py-3">{fmtINR(d.hra)}</td>
                                <td className="px-5 py-3">{fmtINR(d.ta)}</td>
                                <td className="px-5 py-3">{fmtINR(d.da)}</td>
                                <td className="px-5 py-3">{fmtINR(d.specialAllow ?? d.specialAllowance)}</td>
                                <td className="px-5 py-3 font-semibold">{fmtINR(d.grossEarning ?? d.grossSalary ?? d.grossPay ?? d.totalGross)}</td>
                                <td className="px-5 py-3">{fmtINR(d.pfDeduction ?? d.pfAmount ?? d.pfEmployee)}</td>
                                <td className="px-5 py-3 text-red-600">{fmtINR(d.totalDeduction ?? d.totalDeductions)}</td>
                                <td className="px-5 py-3 font-semibold text-green-600">{fmtINR(d.netSalary ?? d.netPay)}</td>
                                <td className="px-5 py-3"><Badge status={d.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── 2. Payroll Processing Tab ─────────────────────────────────────────────
function PayrollTab({ months, onRefresh }) {
    const [genForm, setGenForm] = useState({ month: currentMonth, year: currentYear, empId: "", createdBy: "1" });
    const [genForAll, setGenForAll] = useState(true);
    const [finForm, setFinForm] = useState({ month: currentMonth, year: currentYear, approvedBy: "" });
    const [paidForm, setPaidForm] = useState({ month: currentMonth, year: currentYear });
    const [showGen, setShowGen] = useState(false);
    const [showFin, setShowFin] = useState(false);
    const [showPaid, setShowPaid] = useState(false);
    const [loading, setLoading] = useState("");

    const [generatedList, setGeneratedList] = useState(null);
    const [generatedPeriod, setGeneratedPeriod] = useState(null);
    const [loadingGeneratedList, setLoadingGeneratedList] = useState(false);

    const [paidList, setPaidList] = useState(null);
    const [paidPeriod, setPaidPeriod] = useState(null);
    const [loadingPaidList, setLoadingPaidList] = useState(false);

    const [historyList, setHistoryList] = useState(null);
    const [historyPeriod, setHistoryPeriod] = useState(null);
    const [loadingHistoryList, setLoadingHistoryList] = useState(false);

    const fetchPayrollList = async (month, year) => {
        try {
            const res = await adminService.getPayrollDetails(month, year);
            if (res.Success || res.success) return res.Data || res.data || [];
            return [];
        } catch (err) {
            console.error("Failed to load payroll list:", err);
            return [];
        }
    };

    // 🐛 Bug 3 fix: DB enum has no "Generated" status — sp_payroll_generate sets
    // status = 'Draft'. Filtering on "Generated" always returned 0.
    const stats = useMemo(() => ({
        total: months.length,
        generated: months.filter(m => m.status === "Draft").length,
        finalized: months.filter(m => m.status === "Finalized").length,
        paid: months.filter(m => m.status === "Paid").length,
    }), [months]);

    const act = async (label, fn) => {
        setLoading(label);
        try {
            const res = await fn();
            if (res.Success || res.success) { alert(res.Message ?? `${label} successful!`); onRefresh(); return true; }
            else { alert(res.Message || `${label} failed.`); return false; }
        } catch (err) { console.error(err); alert("Network error. Check console."); return false; }
        finally { setLoading(""); }
    };

    const doGenerate = async () => {
        if (!genForm.createdBy) { alert("Created By (User ID) is required."); return; }
        if (!genForAll && !genForm.empId) {
            alert("Please select an employee, or switch on 'Generate for all employees'.");
            return;
        }
        const ok = await act("Generate", () => adminService.generatePayroll({
            month: genForm.month,
            year: genForm.year,
            createdBy: parseInt(genForm.createdBy),
            ...(!genForAll && genForm.empId ? { empId: parseInt(genForm.empId) } : {}),
        }));
        if (ok) {
            setLoadingGeneratedList(true);
            setGeneratedPeriod({ month: genForm.month, year: genForm.year });
            const list = await fetchPayrollList(genForm.month, genForm.year);
            setGeneratedList(list);
            setLoadingGeneratedList(false);
        }
    };

    const doFinalize = () => {
        if (!finForm.approvedBy) { alert("Approved By (User ID) is required to finalize payroll."); return; }
        act("Finalize", () => adminService.finalizePayroll({
            month: finForm.month,
            year: finForm.year,
            approvedBy: parseInt(finForm.approvedBy),
        }));
    };

    const doMarkPaid = async () => {
        const ok = await act("MarkPaid", () => adminService.markPayrollPaid(paidForm.month, paidForm.year));
        if (ok) {
            setLoadingPaidList(true);
            setPaidPeriod({ month: paidForm.month, year: paidForm.year });
            const list = await fetchPayrollList(paidForm.month, paidForm.year);
            setPaidList(list);
            setLoadingPaidList(false);
        }
    };

    const hide = () => { setShowGen(false); setShowFin(false); setShowPaid(false); };

    const viewHistoryDetails = async (m) => {
        setHistoryPeriod({ month: m.month, year: m.year });
        setLoadingHistoryList(true);
        const list = await fetchPayrollList(m.month, m.year);
        setHistoryList(list);
        setLoadingHistoryList(false);
        setTimeout(() => {
            document.getElementById("history-result-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    };

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Total months", val: stats.total, color: "text-slate-800" },
                    { label: "Generated", val: stats.generated, color: "text-amber-600" },
                    { label: "Finalized", val: stats.finalized, color: "text-blue-600" },
                    { label: "Paid", val: stats.paid, color: "text-green-600" },
                ].map(({ label, val, color }) => (
                    <div key={label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="text-[11px] text-slate-400 mb-1">{label}</div>
                        <div className={`text-2xl font-semibold ${color}`}>{val}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">Generate payroll</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Create payroll for a month/year for all or a specific employee.</p>
                    <button onClick={() => { hide(); setShowGen(v => !v); }}
                        className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all">
                        Generate
                    </button>
                </div>
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">Finalize payroll</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Lock payroll before disbursement. Requires approver ID.</p>
                    <button onClick={() => { hide(); setShowFin(v => !v); }}
                        className="w-full py-2 border bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-slate-50 transition-all">
                        Finalize
                    </button>
                </div>
                <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">Mark as paid</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Confirm salary disbursed by Accounts team.</p>
                    <button onClick={() => { hide(); setShowPaid(v => !v); }}
                        className="w-full py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all">
                        Mark paid
                    </button>
                </div>
            </div>

            {showGen && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">Generate payroll</p>
                    <label className="flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            checked={genForAll}
                            onChange={e => {
                                setGenForAll(e.target.checked);
                                if (e.target.checked) setGenForm(f => ({ ...f, empId: "" }));
                            }}
                            className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="text-sm font-semibold text-indigo-700">Generate for all employees</span>
                        <span className="text-[11px] text-indigo-400">(default)</span>
                    </label>

                    <div className="flex flex-wrap gap-3 items-end">
                        <MonthYearPicker month={genForm.month} year={genForm.year}
                            onChange={(m, y) => setGenForm(f => ({ ...f, month: m, year: y }))} />
                        <EmployeePicker
                            label="Employee (only if not generating for all)"
                            required={false}
                            disabled={genForAll}
                            placeholder={genForAll ? "All employees selected" : "Search by name or ID..."}
                            value={genForm.empId}
                            onChange={(id) => setGenForm(f => ({ ...f, empId: id }))}
                            width={240}
                        />
                        <Field label="Created By (User ID) *">
                            <Input type="number" placeholder="e.g. 1" value={genForm.createdBy}
                                onChange={e => setGenForm(f => ({ ...f, createdBy: e.target.value }))}
                                style={{ width: 130 }} />
                        </Field>
                        <button disabled={loading === "Generate"} onClick={doGenerate}
                            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all self-end">
                            {loading === "Generate" ? "Generating…" : genForAll ? "Generate for all" : "Generate"}
                        </button>
                        <button onClick={() => setShowGen(false)}
                            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 self-end">Cancel</button>
                    </div>
                </div>
            )}

            <PayrollResultTable
                title="Generated payroll"
                period={generatedPeriod}
                list={generatedList}
                loading={loadingGeneratedList}
            />

            {showFin && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Finalize payroll</p>
                    <div className="flex flex-wrap gap-3 items-end">
                        <MonthYearPicker month={finForm.month} year={finForm.year}
                            onChange={(m, y) => setFinForm(f => ({ ...f, month: m, year: y }))} />
                        <Field label="Approved By (User ID) *">
                            <Input type="number" placeholder="e.g. 1" value={finForm.approvedBy}
                                onChange={e => setFinForm(f => ({ ...f, approvedBy: e.target.value }))}
                                style={{ width: 150 }} />
                        </Field>
                        <button disabled={loading === "Finalize"} onClick={doFinalize}
                            className="px-6 py-2.5  bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-900 disabled:opacity-60 transition-all self-end">
                            {loading === "Finalize" ? "Finalizing…" : "Finalize"}
                        </button>
                        <button onClick={() => setShowFin(false)}
                            className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 self-end">Cancel</button>
                    </div>
                </div>
            )}

            {showPaid && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Mark payroll as paid</p>
                    <div className="flex flex-wrap gap-3 items-end">
                        <MonthYearPicker month={paidForm.month} year={paidForm.year}
                            onChange={(m, y) => setPaidForm(f => ({ ...f, month: m, year: y }))} />
                        <button disabled={loading === "MarkPaid"} onClick={doMarkPaid}
                            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-all self-end">
                            {loading === "MarkPaid" ? "Saving…" : "Mark as paid"}
                        </button>
                        <button onClick={() => setShowPaid(false)}
                            className="px-4 py-2.5 border border-indigo-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-indigo-100 self-end">Cancel</button>
                    </div>
                </div>
            )}

            <PayrollResultTable
                title="Marked as paid"
                period={paidPeriod}
                list={paidList}
                loading={loadingPaidList}
            />

            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Payroll months history</p>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                            <tr>
                                {["Month / Year", "Employees", "Total gross", "Status", "Finalized by", ""].map(h => (
                                    <th key={h} className="px-5 py-3 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {months.length === 0 ? (
                                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No payroll months found.</td></tr>
                            ) : months.map((m, i) => (
                                <tr key={m.payrollId ?? i} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-5 py-3 font-semibold text-slate-800">
                                        {MONTHS[(m.month ?? 1) - 1]} {m.year}
                                    </td>
                                    <td className="px-5 py-3">{m.empCount ?? "—"}</td>
                                    <td className="px-5 py-3 font-semibold">{fmtINR(m.totalGross)}</td>
                                    <td className="px-5 py-3"><Badge status={m.status} /></td>
                                    <td className="px-5 py-3 text-slate-500">{m.finalizedBy ?? "—"}</td>
                                    <td className="px-5 py-3">
                                        <button
                                            onClick={() => viewHistoryDetails(m)}
                                            disabled={loadingHistoryList}
                                            className="px-3 py-1 text-xs font-bold bg-indigo-100 hover:bg-indigo-200 text-slate-600 rounded-xl transition-all disabled:opacity-60">
                                            View details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div id="history-result-area">
                <PayrollResultTable
                    title="Employees"
                    period={historyPeriod}
                    list={historyList}
                    loading={loadingHistoryList}
                />
            </div>
        </div>
    );
}

// ── 3. Deductions Tab ────────────────────────────────────────────────────
function DeductionsTab({ deductions, onRefresh }) {
    const emptyForm = {
        empId: "", month: currentMonth, year: currentYear,
        deductionType: "", amount: "", reason: "",
        entryDate: todayISO, createdBy: "1"
    };
    const [form, setForm] = useState(emptyForm);
    const [statusFilter, setStatusFilter] = useState("");
    const [saving, setSaving] = useState(false);
    const [actLoading, setActLoading] = useState("");

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const filtered = useMemo(() => {
        if (!statusFilter) return deductions;
        return deductions.filter(d => (d.status ?? "").toLowerCase() === statusFilter.toLowerCase());
    }, [deductions, statusFilter]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.empId || !form.deductionType || !form.amount || !form.reason) {
            alert("Employee, Deduction Type, Amount and Reason are required.");
            return;
        }
        setSaving(true);
        try {
            const res = await adminService.addDeduction({
                empId: parseInt(form.empId),
                month: parseInt(String(form.month)),
                year: parseInt(String(form.year)),
                deductionType: form.deductionType,
                amount: parseFloat(form.amount),
                reason: form.reason,
                entryDate: form.entryDate ? `${form.entryDate}T00:00:00` : `${todayISO}T00:00:00`,
                createdBy: parseInt(form.createdBy) || 1,
            });
            if (res.Success || res.success) {
                alert("Deduction added successfully!");
                setForm(emptyForm);
                onRefresh();
            } else {
                alert(res.Message || "Failed to add deduction.");
            }
        } catch (err) { console.error(err); alert("Network error."); }
        finally { setSaving(false); }
    };

    const handleAction = async (deductionId, status, remarks = "") => {
        setActLoading(deductionId + status);
        try {
            const res = await adminService.actionDeduction({
                deductionId,
                status,
                approvedBy: 1,
                remarks,
            });
            if (res.Success || res.success) onRefresh();
            else alert(res.Message || "Action failed.");
        } catch (err) { console.error(err); }
        finally { setActLoading(""); }
    };

    return (
        <div className="space-y-5">
            <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <p className="text-sm font-semibold text-slate-700">Add deduction / penalty</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <EmployeePicker
                        value={form.empId}
                        onChange={(id) => setForm(f => ({ ...f, empId: id }))}
                    />
                    <Field label="Deduction Type *">
                        <select value={form.deductionType} onChange={set("deductionType")} required
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                            <option value="">Select type…</option>
                            {DEDUCTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </Field>
                    <Field label="Amount (₹) *">
                        <Input type="number" placeholder="e.g. 500" value={form.amount} onChange={set("amount")} required />
                    </Field>
                    <Field label="Reason *">
                        <Input type="text" placeholder="e.g. Came without uniform" value={form.reason} onChange={set("reason")} required />
                    </Field>
                    <Field label="Entry Date *">
                        <Input type="date" value={form.entryDate} onChange={set("entryDate")} required />
                    </Field>
                    <MonthYearPicker month={form.month} year={form.year}
                        onChange={(m, y) => setForm(f => ({ ...f, month: m, year: y }))} />
                </div>
                <div className="flex justify-end">
                    <button type="submit" disabled={saving}
                        className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all">
                        {saving ? "Adding…" : "Add deduction"}
                    </button>
                </div>
            </form>

            <div className="flex gap-3 flex-wrap items-center">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400">
                    <option value="">All statuses</option>
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                </select>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <tr>
                            {["Employee", "Month / Year", "Type", "Amount", "Reason", "Status", "Actions"].map(h => (
                                <th key={h} className="px-5 py-3 text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No deductions found.</td></tr>
                        ) : filtered.map((d, i) => (
                            <tr key={d.deductionId ?? i} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-5 py-3">
                                    <div className="font-semibold text-slate-800">{d.empName ?? `EMP-${d.empId}`}</div>
                                    <div className="text-[11px] text-slate-400">#{d.empId}</div>
                                </td>
                                <td className="px-5 py-3">{MONTHS[(d.month ?? 1) - 1]} {d.year}</td>
                                <td className="px-5 py-3">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">
                                        {deductionTypeLabel(d.deductionType)}
                                    </span>
                                </td>
                                <td className="px-5 py-3 font-semibold text-red-600">−{fmtINR(d.amount)}</td>
                                <td className="px-5 py-3 text-slate-500 max-w-[180px] truncate" title={d.reason}>{d.reason}</td>
                                <td className="px-5 py-3"><Badge status={d.status} /></td>
                                <td className="px-5 py-3">
                                    {d.status === "Pending" ? (
                                        <div className="flex gap-2">
                                            <button disabled={!!actLoading}
                                                onClick={() => handleAction(d.deductionId, "Approved", "Verified and approved by HR")}
                                                className="px-3 py-1 text-xs font-bold bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-200 transition-all disabled:opacity-60">
                                                Approve
                                            </button>
                                            <button disabled={!!actLoading}
                                                onClick={() => handleAction(d.deductionId, "Rejected", "Rejected")}
                                                className="px-3 py-1 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 transition-all disabled:opacity-60">
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 text-xs">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── 4. Payroll Details Tab ───────────────────────────────────────────────
function DetailsTab() {
    const [filter, setFilter] = useState({ month: currentMonth, year: currentYear, empId: "" });
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const totals = useMemo(() => ({
        gross: details.reduce((s, d) => s + (d.grossEarning ?? d.grossSalary ?? 0), 0),
        deductions: details.reduce((s, d) => s + (d.totalDeduction ?? d.totalDeductions ?? 0), 0),
        net: details.reduce((s, d) => s + (d.netSalary ?? 0), 0),
        pf: details.reduce((s, d) => s + (d.pfDeduction ?? d.pfAmount ?? d.pfEmployee ?? 0), 0),
    }), [details]);

    const loadDetails = async () => {
        setLoading(true);
        try {
            const res = await adminService.getPayrollDetails(
                filter.month,
                filter.year,
                filter.empId ? parseInt(filter.empId) : undefined
            );
            if (res.Success || res.success) {
                setDetails(res.Data || res.data || []);
                setLoaded(true);
            } else {
                alert(res.Message || "Failed to load details.");
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap gap-3 items-end">
                <MonthYearPicker month={filter.month} year={filter.year}
                    onChange={(m, y) => setFilter(f => ({ ...f, month: m, year: y }))} />
                <EmployeePicker
                    label="Employee (optional)"
                    required={false}
                    placeholder="Leave blank for all employees"
                    value={filter.empId}
                    onChange={(id) => setFilter(f => ({ ...f, empId: id }))}
                    width={220}
                />
                <button onClick={loadDetails} disabled={loading}
                    className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all self-end">
                    {loading ? "Loading…" : "Load details"}
                </button>
            </div>

            {loaded && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total gross", val: fmtINR(totals.gross), color: "text-slate-800" },
                        { label: "Total deductions", val: fmtINR(totals.deductions), color: "text-red-600" },
                        { label: "Net payable", val: fmtINR(totals.net), color: "text-green-600" },
                        { label: "PF total", val: fmtINR(totals.pf), color: "text-amber-600" },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="text-[11px] text-slate-400 mb-1">{label}</div>
                            <div className={`text-xl font-semibold ${color}`}>{val}</div>
                        </div>
                    ))}
                </div>
            )}

            {loaded && (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                            <tr>
                                {["Employee", "Basic", "HRA", "TA", "DA", "Special Allow.", "Gross", "PF", "Deductions", "Net pay", "Status", "Payslip"].map(h => (
                                    <th key={h} className="px-5 py-3 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {details.length === 0 ? (
                                <tr><td colSpan={12} className="px-5 py-10 text-center text-slate-400">No payroll records for selected period.</td></tr>
                            ) : details.map((d, i) => (
                                <tr key={d.detailId ?? d.payrollId ?? i} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="font-semibold text-slate-800">
                                            {d.empName ?? (`${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() || `EMP-${d.empId}`)}
                                        </div>
                                        <div className="text-[11px] text-slate-400">#{d.empId}</div>
                                    </td>
                                    <td className="px-5 py-3">{fmtINR(d.basic)}</td>
                                    <td className="px-5 py-3">{fmtINR(d.hra)}</td>
                                    <td className="px-5 py-3">{fmtINR(d.ta)}</td>
                                    <td className="px-5 py-3">{fmtINR(d.da)}</td>
                                    <td className="px-5 py-3">{fmtINR(d.specialAllow ?? d.specialAllowance)}</td>
                                    <td className="px-5 py-3 font-semibold">{fmtINR(d.grossEarning ?? d.grossSalary)}</td>
                                    <td className="px-5 py-3">{fmtINR(d.pfDeduction ?? d.pfAmount ?? d.pfEmployee)}</td>
                                    <td className="px-5 py-3 text-red-600">{fmtINR(d.totalDeduction ?? d.totalDeductions)}</td>
                                    <td className="px-5 py-3 font-semibold text-green-600">{fmtINR(d.netSalary)}</td>
                                    <td className="px-5 py-3"><Badge status={d.status} /></td>
                                    <td className="px-5 py-3">
                                        <Link
                                            to={`/payroll/payslip?empId=${d.empId}&month=${filter.month}&year=${filter.year}`}
                                            className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all inline-block"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!loaded && !loading && (
                <div className="text-center py-16 text-slate-400 text-sm">
                    Select month &amp; year, then click "Load details".
                </div>
            )}
        </div>
    );
}

// ── 5. Loans / Advances Tab ──────────────────────────────────────────────
function LoansTab() {
    const emptyForm = {
        empId: "", loanType: "Loan", totalAmount: "", emiAmount: "",
        loanDate: todayISO, remarks: ""
    };
    const [form, setForm] = useState(emptyForm);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actLoading, setActLoading] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [showForm, setShowForm] = useState(false);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const loadLoans = async () => {
        setLoading(true);
        try {
            const res = await adminService.getAllLoans(statusFilter);
            if (res.Success || res.success) setLoans(res.Data || res.data || []);
        } catch (err) {
            console.error("Failed to load loans:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadLoans(); }, [statusFilter]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!form.empId || !form.totalAmount || !form.emiAmount || !form.loanDate) {
            alert("Employee, Total amount, EMI amount and Loan date are required.");
            return;
        }
        setSaving(true);
        try {
            const res = await adminService.createLoan({
                empId: parseInt(form.empId),
                loanType: form.loanType,
                totalAmount: parseFloat(form.totalAmount),
                emiAmount: parseFloat(form.emiAmount),
                loanDate: form.loanDate,
                remarks: form.remarks,
            });
            if (res.Success || res.success) {
                alert("Loan/Advance request created!");
                setForm(emptyForm);
                setShowForm(false);
                loadLoans();
            } else {
                alert(res.Message || "Failed to create loan request.");
            }
        } catch (err) { console.error(err); alert("Network error."); }
        finally { setSaving(false); }
    };

    const handleAction = async (loanId, status) => {
        setActLoading(loanId + status);
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const res = await adminService.actionLoan({
                loanId, status,
                approvedBy: user?.userId ?? user?.UserId ?? 1,
            });
            if (res.Success || res.success) loadLoans();
            else alert(res.Message || "Action failed.");
        } catch (err) {
            console.error(err);
            alert(err.message || "Network/Server error while updating loan status.");
        }
        finally { setActLoading(""); }
    };

    const handleClose = async (loanId) => {
        if (!window.confirm("Close this loan? This cannot be undone.")) return;
        setActLoading(loanId + "Close");
        try {
            const res = await adminService.closeLoan({ loanId, remarks: "Closed manually by HR" });
            if (res.Success || res.success) loadLoans();
            else alert(res.Message || "Failed to close loan.");
        } catch (err) { console.error(err); }
        finally { setActLoading(""); }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                    <option value="">All statuses</option>
                    <option>Pending</option>
                    <option>Active</option>
                    <option>Closed</option>
                    <option>Rejected</option>
                </select>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all"
                >{showForm ? "Cancel" : "+ New loan / advance"}</button>
            </div>

            {showForm && (
                <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <p className="text-sm font-semibold text-slate-700">New loan / advance request</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <EmployeePicker
                            value={form.empId}
                            onChange={(id) => setForm(f => ({ ...f, empId: id }))}
                        />
                        <Field label="Type *">
                            <select value={form.loanType} onChange={set("loanType")}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                                <option value="Loan">Loan</option>
                                <option value="Advance">Advance</option>
                            </select>
                        </Field>
                        <Field label="Total amount (₹) *">
                            <Input type="number" placeholder="e.g. 50000" value={form.totalAmount} onChange={set("totalAmount")} required />
                        </Field>
                        <Field label="EMI amount (₹) *">
                            <Input type="number" placeholder="e.g. 5000" value={form.emiAmount} onChange={set("emiAmount")} required />
                        </Field>
                        <Field label="Loan date *">
                            <Input type="date" value={form.loanDate} onChange={set("loanDate")} required />
                        </Field>
                        <Field label="Remarks">
                            <Input type="text" placeholder="Optional note" value={form.remarks} onChange={set("remarks")} />
                        </Field>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={saving}
                            className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all">
                            {saving ? "Saving…" : "Submit request"}
                        </button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                        <tr>
                            {["Employee", "Type", "Total", "EMI", "Remaining", "Loan date", "Status", "Actions"].map(h => (
                                <th key={h} className="px-5 py-3 text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={8} className="px-5 py-10 text-center text-indigo-500 animate-pulse">Loading…</td></tr>
                        ) : loans.length === 0 ? (
                            <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">No loans/advances found.</td></tr>
                        ) : loans.map((l, i) => (
                            <tr key={l.loanId ?? i} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-5 py-3">
                                    <div className="font-semibold text-slate-800">{l.empName ?? `EMP-${l.empId}`}</div>
                                    <div className="text-[11px] text-slate-400">#{l.empId}</div>
                                </td>
                                <td className="px-5 py-3">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-semibold">{l.loanType}</span>
                                </td>
                                <td className="px-5 py-3">{fmtINR(l.totalAmount)}</td>
                                <td className="px-5 py-3">{fmtINR(l.emiAmount)}</td>
                                <td className="px-5 py-3 font-semibold">{fmtINR(l.remainingAmount)}</td>
                                <td className="px-5 py-3 text-slate-500 text-xs">{l.loanDate ? l.loanDate.slice(0, 10) : "—"}</td>
                                <td className="px-5 py-3"><Badge status={l.status} /></td>
                                <td className="px-5 py-3">
                                    {l.status === "Pending" ? (
                                        <div className="flex gap-2">
                                            <button disabled={!!actLoading}
                                                onClick={() => handleAction(l.loanId, "Active")}
                                                className="px-3 py-1 text-xs font-bold bg-green-50 hover:bg-green-100 text-green-700 rounded-xl border border-green-200 transition-all disabled:opacity-60">
                                                Approve
                                            </button>
                                            <button disabled={!!actLoading}
                                                onClick={() => handleAction(l.loanId, "Rejected")}
                                                className="px-3 py-1 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 transition-all disabled:opacity-60">
                                                Reject
                                            </button>
                                        </div>
                                    ) : l.status === "Active" ? (
                                        <button disabled={!!actLoading}
                                            onClick={() => handleClose(l.loanId)}
                                            className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all disabled:opacity-60">
                                            Close loan
                                        </button>
                                    ) : (
                                        <span className="text-slate-400 text-xs">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// ── 6. Late Mark Rule Tab ────────────────────────────────────────────────
function LateMarkRuleTab() {
    const [activeRule, setActiveRule] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ latesCount: "3", penaltyType: "HalfDay" });

    const loadData = async () => {
        setLoading(true);
        try {
            const [activeRes, histRes] = await Promise.all([
                adminService.getActiveLateMarkRule(),
                adminService.getLateMarkRuleHistory(),
            ]);
            if (activeRes.Success || activeRes.success) setActiveRule(activeRes.Data || activeRes.data || null);
            if (histRes.Success || histRes.success) setHistory(histRes.Data || histRes.data || []);
        } catch (err) {
            console.error("Failed to load late mark rules:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.latesCount || parseInt(form.latesCount) <= 0) {
            alert("Lates count must be greater than 0.");
            return;
        }
        setSaving(true);
        try {
            const res = await adminService.createLateMarkRule({
                latesCount: parseInt(form.latesCount),
                penaltyType: form.penaltyType,
            });
            if (res.Success || res.success) {
                alert("Late mark rule saved! This is now the active rule.");
                loadData();
            } else {
                alert(res.Message || "Failed to save rule.");
            }
        } catch (err) { console.error(err); alert("Network error."); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-5">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-1">Currently active rule</p>
                {loading ? (
                    <p className="text-sm text-indigo-600 animate-pulse">Loading…</p>
                ) : activeRule ? (
                    <p className="text-lg font-bold text-indigo-800">
                        {activeRule.latesCount} late marks → {activeRule.penaltyType === "FullDay" ? "1 full day" : "half day"} deduction
                    </p>
                ) : (
                    <p className="text-sm text-indigo-400">No active rule configured. Payroll will default to 3 lates = half day.</p>
                )}
            </div>

            <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <p className="text-sm font-semibold text-slate-700">Set a new rule</p>
                <p className="text-[11px] text-slate-400">Saving a new rule replaces the active one — it will apply from the next payroll run onward.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                    <Field label="Late marks count *">
                        <Input type="number" min="1" placeholder="e.g. 3" value={form.latesCount}
                            onChange={e => setForm(f => ({ ...f, latesCount: e.target.value }))} required />
                    </Field>
                    <Field label="Penalty *">
                        <select value={form.penaltyType}
                            onChange={e => setForm(f => ({ ...f, penaltyType: e.target.value }))}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                            <option value="HalfDay">Half day</option>
                            <option value="FullDay">Full day</option>
                        </select>
                    </Field>
                </div>
                <button type="submit" disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all">
                    {saving ? "Saving…" : "Save rule"}
                </button>
            </form>

            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Rule history</p>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                            <tr>
                                {["Lates count", "Penalty", "Status", "Created"].map(h => (
                                    <th key={h} className="px-5 py-3 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-400">No rule history yet.</td></tr>
                            ) : history.map((r, i) => (
                                <tr key={r.ruleId ?? i} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-5 py-3 font-semibold">{r.latesCount}</td>
                                    <td className="px-5 py-3">{r.penaltyType === "FullDay" ? "Full day" : "Half day"}</td>
                                    <td className="px-5 py-3">
                                        {r.isActive ? <Badge status="Approved" /> : <span className="text-slate-400 text-xs">Inactive</span>}
                                    </td>
                                    <td className="px-5 py-3 text-slate-500 text-xs">{r.createdAt ? r.createdAt.slice(0, 10) : "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────
const TABS = [
    { id: "salary", label: "Salary structure" },
    { id: "payroll", label: "Payroll processing" },
    { id: "deductions", label: "Deductions" },
    { id: "loans", label: "Loans / Advances" },
    { id: "latemarks", label: "Late Mark Rules" },
    { id: "details", label: "Payroll details" },
];

export default function PayrollManagement() {
    const [activeTab, setActiveTab] = useState("salary");
    const [loading, setLoading] = useState(false);
    const [structures, setStructures] = useState([]);
    const [months, setMonths] = useState([]);
    const [deductions, setDeductions] = useState([]);

    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [salRes, monRes, dedRes] = await Promise.all([
                adminService.getAllEmployeeSalaries(),
                adminService.getPayrollMonths(),
                adminService.getDeductions(),
            ]);
            if (salRes.Success || salRes.success) setStructures(salRes.Data || salRes.data || []);
            if (monRes.Success || monRes.success) setMonths(monRes.Data || monRes.data || []);
            if (dedRes.Success || dedRes.success) setDeductions(dedRes.Data || dedRes.data || []);
        } catch (err) {
            console.error("Failed to load payroll data:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Payroll management</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Manage salary structures, generate &amp; finalize payroll, handle deductions, loans, and view payroll details.
                </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex overflow-x-auto border-b border-slate-200 px-2 text-xs font-bold uppercase tracking-wider text-slate-400 hide-scrollbar">
                    {TABS.map(t => (
                        <button key={t.id} onClick={() => setActiveTab(t.id)}
                            className={`px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id
                                ? "border-indigo-600 text-indigo-600"
                                : "border-transparent hover:text-slate-600"
                                }`}>{t.label}</button>
                    ))}
                </div>

                <div className="p-6 min-h-[400px]">
                    {loading ? (
                        <div className="text-center text-indigo-600 py-16 font-medium animate-pulse">Loading payroll data…</div>
                    ) : (
                        <>
                            {activeTab === "salary" && <SalaryTab structures={structures} />}
                            {activeTab === "payroll" && <PayrollTab months={months} onRefresh={loadAll} />}
                            {activeTab === "deductions" && <DeductionsTab deductions={deductions} onRefresh={loadAll} />}
                            {activeTab === "loans" && <LoansTab />}
                            {activeTab === "latemarks" && <LateMarkRuleTab />}
                            {activeTab === "details" && <DetailsTab />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}