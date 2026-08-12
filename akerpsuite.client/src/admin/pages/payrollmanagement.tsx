import { useEffect, useState, useMemo, useRef } from "react";
import { adminService } from "@/services/adminService";
import { Link, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";

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
        Generated: "bg-amber-50 text-amber-700 border-amber-200/50",
        Draft: "bg-amber-50 text-amber-700 border-amber-200/50",
        Processing: "bg-slate-100 text-slate-500 border-slate-200",
        Finalized: "bg-blue-50 text-blue-700 border-blue-200/50",
        Paid: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
        Pending: "bg-amber-50 text-amber-700 border-amber-200/50",
        Approved: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
        Rejected: "bg-rose-50 text-rose-700 border-rose-200/50",
        Active: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
        Closed: "bg-slate-100 text-slate-600 border-slate-200",
    };
    const cls = map[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${cls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75"></span>
            {status}
        </span>
    );
}

function Field({ label, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">{label}</label>
            {children}
        </div>
    );
}

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm";

function Input({ ...props }) {
    return (
        <input
            {...props}
            className={inputClass}
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
                    className={`${inputClass} cursor-pointer appearance-none`}
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
        <div className="flex flex-col gap-1.5 relative" ref={ref} style={{ minWidth: width ?? 220 }}>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide ml-1">{label}</label>
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
                className={`${inputClass} ${disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : ""}`}
            />
            {showDropdown && !disabled && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto z-50">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400 italic">No employees found.</div>
                    ) : (
                        filtered.map(emp => (
                            <button
                                type="button"
                                key={emp.empId}
                                onClick={() => handleSelect(emp)}
                                className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors border-b border-slate-50 last:border-0"
                            >
                                <div className="text-sm font-bold text-slate-800">{emp.firstName} {emp.lastName}</div>
                                <div className="text-xs text-slate-400 font-medium mt-0.5">{emp.empCode || `#${emp.empId}`} · {emp.officialEmail}</div>
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
        basic: "", epfBasic: "", hra: "", ta: "", da: "", specialAllow: "",
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
                epfBasic: form.epfBasic ? parseFloat(form.epfBasic) : parseFloat(form.basic),
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
        { label: "EPF Basic (₹)", key: "epfBasic", type: "number", ph: "15000" },
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
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="relative group w-full sm:max-w-xs">
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        type="text" placeholder="Search by name or ID…"
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                    />
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="px-5 py-2.5 bg-amber-400 text-[#0b2836] text-xs sm:text-sm font-bold rounded-xl hover:bg-amber-500 transition-all shadow-sm flex items-center gap-2"
                >
                    <i className={`fa-solid ${showForm ? "fa-xmark" : "fa-plus"}`} /> {showForm ? "Cancel" : "Set Salary"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5 animate-in fade-in duration-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-800">Set / Update Salary Structure</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
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
                    <p className="text-xs text-slate-400 font-medium">
                        Leave "EPF Basic" blank to use the same value as Basic. Set it separately only when EPF is calculated on a capped wage.
                    </p>
                    <div className="flex justify-end pt-3 border-t border-slate-200/60">
                        <button
                            type="submit" disabled={saving}
                            className="px-6 py-3 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] disabled:opacity-60 transition-all shadow-lg shadow-[#0b2836]/20"
                        >{saving ? "Saving…" : "Save Structure"}</button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[1000px]">
                    <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                            {["Employee", "Structure", "Basic", "EPF Basic", "HRA", "TA", "DA", "Special Allow.", "Gross CTC", "Effective From"].map(h => (
                                <th key={h} className="px-5 py-4 text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={10} className="px-5 py-12 text-center text-slate-400 font-medium">No salary records found.</td></tr>
                        ) : filtered.map((s, i) => {
                            const gross = (s.basic ?? 0) + (s.hra ?? 0) + (s.ta ?? 0) + (s.da ?? 0) + (s.specialAllow ?? 0);
                            return (
                                <tr key={s.salId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="font-bold text-slate-900">
                                            {s.firstName} {s.lastName}
                                        </div>
                                        <div className="text-xs font-mono font-bold text-amber-600 mt-0.5">{s.empCode || `#${s.empId}`}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-lg text-[11px] font-bold">
                                            {s.structureName ?? (s.structureId ? `#${s.structureId}` : "—")}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(s.basic)}</td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(s.epfBasic ?? s.basic)}</td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(s.hra)}</td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(s.ta)}</td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(s.da)}</td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(s.specialAllow)}</td>
                                    <td className="px-5 py-4 font-mono font-bold text-emerald-700">{fmtINR(gross)}</td>
                                    <td className="px-5 py-4 text-slate-500 font-medium text-xs">{s.effectiveFrom ? s.effectiveFrom.slice(0, 10) : "—"}</td>
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
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                {title} — {MONTHS[(period.month ?? 1) - 1]} {period.year}
                {!loading && <span className="text-slate-400 font-normal normal-case"> · {list?.length ?? 0} employee(s)</span>}
            </p>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[1000px]">
                    <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                            {["Employee", "Basic", "HRA", "TA", "DA", "Special Allow.", "Gross", "PF", "Deductions", "Net pay", "Status"].map(h => (
                                <th key={h} className="px-5 py-4 text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={11} className="px-5 py-12 text-center text-amber-500 font-bold animate-pulse">Loading…</td></tr>
                        ) : !list || list.length === 0 ? (
                            <tr><td colSpan={11} className="px-5 py-12 text-center text-slate-400 font-medium">No records found for this period.</td></tr>
                        ) : list.map((d, i) => (
                            <tr key={d.payrollId ?? d.empId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="font-bold text-slate-900">{d.empName ?? `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() ?? `EMP-${d.empId}`}</div>
                                    <div className="text-xs font-mono font-bold text-amber-600 mt-0.5">#{d.empId}</div>
                                </td>
                                <td className="px-5 py-4 font-mono">{fmtINR(d.basic)}</td>
                                <td className="px-5 py-4 font-mono">{fmtINR(d.hra)}</td>
                                <td className="px-5 py-4 font-mono">{fmtINR(d.ta)}</td>
                                <td className="px-5 py-4 font-mono">{fmtINR(d.da)}</td>
                                <td className="px-5 py-4 font-mono">{fmtINR(d.specialAllow ?? d.specialAllowance)}</td>
                                <td className="px-5 py-4 font-mono font-semibold text-slate-800">{fmtINR(d.grossEarning ?? d.grossSalary ?? d.grossPay ?? d.totalGross)}</td>
                                <td className="px-5 py-4 font-mono">{fmtINR(d.pfDeduction ?? d.pfAmount ?? d.pfEmployee)}</td>
                                <td className="px-5 py-4 font-mono text-rose-600">{fmtINR(d.totalDeduction ?? d.totalDeductions)}</td>
                                <td className="px-5 py-4 font-mono font-bold text-emerald-700">{fmtINR(d.netSalary ?? d.netPay)}</td>
                                <td className="px-5 py-4"><Badge status={d.status} /></td>
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
    const [finForm, setFinForm] = useState({ month: currentMonth, year: currentYear });
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
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        act("Finalize", () => adminService.finalizePayroll({
            month: finForm.month,
            year: finForm.year,
            approvedBy: user?.userId ?? user?.UserId ?? 1,
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
        <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: "Total months", val: stats.total, color: "text-slate-800" },
                    { label: "Generated", val: stats.generated, color: "text-amber-600" },
                    { label: "Finalized", val: stats.finalized, color: "text-blue-600" },
                    { label: "Paid", val: stats.paid, color: "text-emerald-600" },
                ].map(({ label, val, color }) => (
                    <div key={label} className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
                        <div className={`text-3xl font-black ${color}`}>{val}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                    <span className="text-sm font-bold text-slate-800 block">Generate Payroll</span>
                    <p className="text-xs text-slate-500">Create payroll for a month/year for all or a specific employee.</p>
                    <button onClick={() => { hide(); setShowGen(v => !v); }}
                        className="w-full py-2.5 bg-amber-400 text-[#0b2836] text-xs font-bold rounded-xl hover:bg-amber-500 transition-all shadow-sm">
                        {showGen ? "Close Form" : "Generate Payroll"}
                    </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                    <span className="text-sm font-bold text-slate-800 block">Finalize Payroll</span>
                    <p className="text-xs text-slate-500">Lock payroll before disbursement. Requires approver ID.</p>
                    <button onClick={() => { hide(); setShowFin(v => !v); }}
                        className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm">
                        {showFin ? "Close Form" : "Finalize Payroll"}
                    </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                    <span className="text-sm font-bold text-slate-800 block">Mark as Paid</span>
                    <p className="text-xs text-slate-500">Confirm salary disbursed by Accounts team.</p>
                    <button onClick={() => { hide(); setShowPaid(v => !v); }}
                        className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-sm">
                        {showPaid ? "Close Form" : "Mark as Paid"}
                    </button>
                </div>
            </div>

            {showGen && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-800">Generate Payroll Configuration</p>
                    <label className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 cursor-pointer w-fit shadow-sm">
                        <input
                            type="checkbox"
                            checked={genForAll}
                            onChange={e => {
                                setGenForAll(e.target.checked);
                                if (e.target.checked) setGenForm(f => ({ ...f, empId: "" }));
                            }}
                            className="w-4 h-4 text-amber-600 focus:ring-amber-500 rounded cursor-pointer"
                        />
                        <span className="text-sm font-bold text-slate-700">Generate for all employees (default)</span>
                    </label>

                    <div className="flex flex-wrap gap-4 items-end pt-2">
                        <MonthYearPicker month={genForm.month} year={genForm.year}
                            onChange={(m, y) => setGenForm(f => ({ ...f, month: m, year: y }))} />
                        <EmployeePicker
                            label="Employee (optional)"
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
                        <div className="flex gap-2 self-end">
                            <button disabled={loading === "Generate"} onClick={doGenerate}
                                className="px-6 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 disabled:opacity-60 transition-all">
                                {loading === "Generate" ? "Generating…" : genForAll ? "Generate for all" : "Generate"}
                            </button>
                            <button onClick={() => setShowGen(false)}
                                className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100">Cancel</button>
                        </div>
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
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-800">Finalize Payroll Configuration</p>
                    <div className="flex flex-wrap gap-4 items-end">
                        <MonthYearPicker month={finForm.month} year={finForm.year}
                            onChange={(m, y) => setFinForm(f => ({ ...f, month: m, year: y }))} />
                        <div className="flex gap-2 self-end">
                            <button disabled={loading === "Finalize"} onClick={doFinalize}
                                className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-all">
                                {loading === "Finalize" ? "Finalizing…" : "Finalize"}
                            </button>
                            <button onClick={() => setShowFin(false)}
                                className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showPaid && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-800">Mark Payroll as Paid Configuration</p>
                    <div className="flex flex-wrap gap-4 items-end">
                        <MonthYearPicker month={paidForm.month} year={paidForm.year}
                            onChange={(m, y) => setPaidForm(f => ({ ...f, month: m, year: y }))} />
                        <div className="flex gap-2 self-end">
                            <button disabled={loading === "MarkPaid"} onClick={doMarkPaid}
                                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-all">
                                {loading === "MarkPaid" ? "Saving…" : "Mark as Paid"}
                            </button>
                            <button onClick={() => setShowPaid(false)}
                                className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100">Cancel</button>
                        </div>
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
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Payroll Months History</p>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                    <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[800px]">
                        <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                {["Month / Year", "Employees", "Total Gross", "Status", "Finalized By", "Actions"].map(h => (
                                    <th key={h} className="px-5 py-4 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {months.length === 0 ? (
                                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400 font-medium">No payroll months found.</td></tr>
                            ) : months.map((m, i) => (
                                <tr key={m.payrollId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-4 font-bold text-slate-900">
                                        {MONTHS[(m.month ?? 1) - 1]} {m.year}
                                    </td>
                                    <td className="px-5 py-4 font-mono font-semibold text-slate-700">{m.empCount ?? "—"}</td>
                                    <td className="px-5 py-4 font-mono font-bold text-emerald-700">{fmtINR(m.totalGross)}</td>
                                    <td className="px-5 py-4"><Badge status={m.status} /></td>
                                    <td className="px-5 py-4 font-semibold text-slate-600">{m.finalizedBy ?? "—"}</td>
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => viewHistoryDetails(m)}
                                            disabled={loadingHistoryList}
                                            className="px-4 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 text-xs font-bold rounded-xl transition-all border border-amber-200/50 shadow-sm disabled:opacity-60">
                                            View Details
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

// ── 3. Deductions Tab ────────────────────────────────────────────────----
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
            <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">Add Deduction / Penalty</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    <EmployeePicker
                        value={form.empId}
                        onChange={(id) => setForm(f => ({ ...f, empId: id }))}
                    />
                    <Field label="Deduction Type *">
                        <select value={form.deductionType} onChange={set("deductionType")} required
                            className={`${inputClass} cursor-pointer appearance-none`}>
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
                <div className="flex justify-end pt-3 border-t border-slate-200/60">
                    <button type="submit" disabled={saving}
                        className="px-6 py-3 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] disabled:opacity-60 transition-all shadow-lg shadow-[#0b2836]/20">
                        {saving ? "Adding…" : "Add Deduction"}
                    </button>
                </div>
            </form>

            <div className="flex gap-3 flex-wrap items-center">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 bg-white focus:outline-none focus:border-amber-400 cursor-pointer shadow-sm">
                    <option value="">All statuses</option>
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                </select>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[900px]">
                    <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                            {["Employee", "Month / Year", "Type", "Amount", "Reason", "Status", "Actions"].map(h => (
                                <th key={h} className="px-5 py-4 text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 font-medium">No deductions found.</td></tr>
                        ) : filtered.map((d, i) => (
                            <tr key={d.deductionId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="font-bold text-slate-900">{d.empName ?? `EMP-${d.empId}`}</div>
                                    <div className="text-xs font-mono font-bold text-amber-600 mt-0.5">#{d.empId}</div>
                                </td>
                                <td className="px-5 py-4 font-semibold text-slate-700">{MONTHS[(d.month ?? 1) - 1]} {d.year}</td>
                                <td className="px-5 py-4">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">
                                        {deductionTypeLabel(d.deductionType)}
                                    </span>
                                </td>
                                <td className="px-5 py-4 font-mono font-bold text-rose-600">−{fmtINR(d.amount)}</td>
                                <td className="px-5 py-4 text-slate-600 font-medium max-w-[200px] truncate" title={d.reason}>{d.reason}</td>
                                <td className="px-5 py-4"><Badge status={d.status} /></td>
                                <td className="px-5 py-4">
                                    {d.status === "Pending" ? (
                                        <div className="flex gap-2">
                                            <button disabled={!!actLoading}
                                                onClick={() => handleAction(d.deductionId, "Approved", "Verified and approved by HR")}
                                                className="px-3.5 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200/50 transition-all disabled:opacity-60 shadow-sm">
                                                Approve
                                            </button>
                                            <button disabled={!!actLoading}
                                                onClick={() => handleAction(d.deductionId, "Rejected", "Rejected")}
                                                className="px-3.5 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200/50 transition-all disabled:opacity-60 shadow-sm">
                                                Reject
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 text-xs font-bold">—</span>
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
function exportSalarySheet(details, month, year, companyName) {
    const title = `${(companyName || "COMPANY NAME").toUpperCase()}`;
    const subtitle = `SALARY SHEET FOR THE MONTH ${MONTHS[(month ?? 1) - 1].toUpperCase()}, ${year}`;

    const headers = [
        "S NO.", "ESIC NO.", "UAN NO.", "NAME OF EMPLOYEES", "FATHER NAME/ HUSBAND NAME",
        "CATEGORY", "DESIGNATION", "TOTAL DAYS", "NO OF PRESENT DAYS",
        "EPF BASIC", "BASIC SALARY", "HRA", "OTHER ALLOWANCE", "TOTAL SALARY",
        "EARNING EPF BASIC", "EARNING BASIC", "EARNING HRA", "EARNING OTHER ALLOWANCE",
        "GROSS SALARY", "EPF 12%", "ESI @0.75%", "TOTAL DEDUCTION", "NET PAY", "SIGNATURE",
    ];
    const colCount = headers.length;

    const rows = details.map((d, i) => {
        const totalDays = Number(d.workingDays ?? 0);
        const presentDays = Number(d.presentDays ?? 0);
        const ratio = presentDays > 0 ? totalDays / presentDays : 1;

        const earnEpfBasic = Number(d.epfBasic ?? 0);
        const earnBasic = Number(d.basic ?? 0);
        const earnHra = Number(d.hra ?? 0);
        const earnOther = Number(d.ta ?? 0) + Number(d.da ?? 0) + Number(d.specialAllow ?? 0);
        const grossSalary = d.grossEarning != null ? Number(d.grossEarning) : (earnEpfBasic ? earnBasic + earnHra + earnOther : earnBasic + earnHra + earnOther);

        const epfBasic = earnEpfBasic * ratio;
        const basicSalary = earnBasic * ratio;
        const hra = earnHra * ratio;
        const otherAllow = earnOther * ratio;
        const totalSalary = basicSalary + hra + otherAllow;

        const epf12 = Number(d.pfDeduction ?? 0);
        const esi = Number(d.esicDeduction ?? 0);
        const totalDeduction = Number(d.totalDeduction ?? 0);
        const netPay = Number(d.netSalary ?? 0);

        return [
            i + 1,
            d.esicNo || "",
            d.uanNo || "",
            d.empName ?? `${d.firstName ?? ""} ${d.lastName ?? ""}`.trim(),
            d.fatherHusbandName || "",
            d.category || "",
            d.desigName || "",
            totalDays,
            presentDays,
            round2(epfBasic), round2(basicSalary), round2(hra), round2(otherAllow), round2(totalSalary),
            round2(earnEpfBasic), round2(earnBasic), round2(earnHra), round2(earnOther),
            round2(grossSalary), round2(epf12), round2(esi), round2(totalDeduction), round2(netPay),
            "",
        ];
    });

    const totalsRow = [
        "", "", "", "", "", "", "TOTAL", "", "",
        ...[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(colIdx =>
            round2(rows.reduce((s, r) => s + (Number(r[colIdx]) || 0), 0))
        ),
        "",
    ];

    const aoa = [
        [title, ...Array(colCount - 1).fill("")],
        [subtitle, ...Array(colCount - 1).fill("")],
        headers,
        ...rows,
        totalsRow,
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } },
    ];
    ws["!cols"] = [
        { wch: 5 }, { wch: 12 }, { wch: 14 }, { wch: 22 }, { wch: 20 },
        { wch: 12 }, { wch: 26 }, { wch: 8 }, { wch: 10 },
        { wch: 11 }, { wch: 12 }, { wch: 9 }, { wch: 13 }, { wch: 12 },
        { wch: 14 }, { wch: 13 }, { wch: 11 }, { wch: 16 },
        { wch: 12 }, { wch: 10 }, { wch: 11 }, { wch: 13 }, { wch: 12 }, { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salary Sheet");
    XLSX.writeFile(wb, `Salary_Sheet-${MONTHS[(month ?? 1) - 1]}_${year}.xlsx`);
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

function DetailsTab() {
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [empId, setEmpId] = useState("");

    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [companyName, setCompanyName] = useState("");

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
                month,
                year,
                empId ? parseInt(empId) : undefined
            );
            if (res.Success || res.success) {
                setDetails(res.Data || res.data || []);
                setLoaded(true);
            } else {
                alert(res.Message || "Failed to load details.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <p className="text-sm font-bold text-slate-800">Filter Payroll Details</p>
                <div className="flex flex-wrap gap-4 items-end">
                    <MonthYearPicker
                        month={month}
                        year={year}
                        onChange={(m, y) => { setMonth(m); setYear(y); }}
                    />
                    <EmployeePicker
                        label="Employee (optional)"
                        required={false}
                        placeholder="Leave blank for all employees"
                        value={empId}
                        onChange={(id) => setEmpId(id)}
                        width={240}
                    />
                    <button
                        onClick={loadDetails}
                        disabled={loading}
                        className="px-6 py-3 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] disabled:opacity-60 transition-all self-end shadow-lg shadow-[#0b2836]/20"
                    >
                        {loading ? "Loading…" : "Load Details"}
                    </button>
                </div>
            </div>

            {loaded && details.length > 0 && (
                <div className="flex flex-wrap gap-4 items-center justify-between bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-6 shadow-sm">
                    <Field label="Company Name (For Excel Sheet Header)">
                        <Input
                            type="text" placeholder="e.g. AKS SOLAR SYSTEMS PRIVATE LIMITED"
                            value={companyName} onChange={e => setCompanyName(e.target.value)}
                            style={{ width: 340 }}
                        />
                    </Field>
                    <button
                        onClick={() => exportSalarySheet(details, month, year, companyName)}
                        className="px-6 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all self-end shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                    >
                        <i className="fa-solid fa-file-excel" /> Download Salary Sheet (.xlsx)
                    </button>
                </div>
            )}

            {loaded && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Total Gross", val: fmtINR(totals.gross), color: "text-slate-900" },
                        { label: "Total Deductions", val: fmtINR(totals.deductions), color: "text-rose-600" },
                        { label: "Net Payable", val: fmtINR(totals.net), color: "text-emerald-700" },
                        { label: "PF Total", val: fmtINR(totals.pf), color: "text-amber-600" },
                    ].map(({ label, val, color }) => (
                        <div key={label} className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
                            <div className={`text-2xl font-black ${color}`}>{val}</div>
                        </div>
                    ))}
                </div>
            )}

            {loaded && (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                    <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[1100px]">
                        <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                {["Employee", "Basic", "HRA", "TA", "DA", "Special Allow.", "Gross", "PF", "Deductions", "Net Pay", "Status", "Payslip"].map(h => (
                                    <th key={h} className="px-5 py-4 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {details.length === 0 ? (
                                <tr><td colSpan={12} className="px-5 py-12 text-center text-slate-400 font-medium">No payroll records for selected period.</td></tr>
                            ) : details.map((d, i) => (
                                <tr key={d.detailId ?? d.payrollId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="font-bold text-slate-900">
                                            {d.empName ?? (`${d.firstName ?? ""} ${d.lastName ?? ""}`.trim() || `EMP-${d.empId}`)}
                                        </div>
                                        <div className="text-xs font-mono font-bold text-amber-600 mt-0.5">#{d.empId}</div>
                                    </td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(d.basic)}</td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(d.hra)}</td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(d.ta)}</td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(d.da)}</td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(d.specialAllow ?? d.specialAllowance)}</td>
                                    <td className="px-5 py-4 font-mono font-semibold text-slate-800">{fmtINR(d.grossEarning ?? d.grossSalary)}</td>
                                    <td className="px-5 py-4 font-mono">{fmtINR(d.pfDeduction ?? d.pfAmount ?? d.pfEmployee)}</td>
                                    <td className="px-5 py-4 font-mono text-rose-600">{fmtINR(d.totalDeduction ?? d.totalDeductions)}</td>
                                    <td className="px-5 py-4 font-mono font-bold text-emerald-700">{fmtINR(d.netSalary)}</td>
                                    <td className="px-5 py-4"><Badge status={d.status} /></td>
                                    <td className="px-5 py-4">
                                        <Link
                                            to={`/payroll/payslip?empId=${d.empId}&month=${month}&year=${year}`}
                                            className="px-3.5 py-1.5 text-xs font-bold bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-all inline-block border border-amber-200/50 shadow-sm"
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
                <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl py-24 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 text-2xl shadow-sm mb-4">
                        <i className="fa-solid fa-file-invoice-dollar" />
                    </div>
                    <p className="text-base font-bold text-slate-600">No Period Selected</p>
                    <p className="text-sm text-slate-400 mt-1">Select month and year above, then click "Load Details".</p>
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
            <div className="flex flex-wrap items-center justify-between gap-4">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 bg-white focus:outline-none focus:border-amber-400 cursor-pointer shadow-sm">
                    <option value="">All statuses</option>
                    <option>Pending</option>
                    <option>Active</option>
                    <option>Closed</option>
                    <option>Rejected</option>
                </select>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className="px-5 py-2.5 bg-amber-400 text-[#0b2836] text-xs sm:text-sm font-bold rounded-xl hover:bg-amber-500 transition-all shadow-sm flex items-center gap-2"
                >
                    <i className={`fa-solid ${showForm ? "fa-xmark" : "fa-plus"}`} /> {showForm ? "Cancel" : "New Loan / Advance"}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleAdd} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-5 animate-in fade-in duration-200 shadow-sm">
                    <p className="text-sm font-bold text-slate-800">New Loan / Advance Request</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        <EmployeePicker
                            value={form.empId}
                            onChange={(id) => setForm(f => ({ ...f, empId: id }))}
                        />
                        <Field label="Type *">
                            <select value={form.loanType} onChange={set("loanType")}
                                className={`${inputClass} cursor-pointer appearance-none`}>
                                <option value="Loan">Loan</option>
                                <option value="Advance">Advance</option>
                            </select>
                        </Field>
                        <Field label="Total Amount (₹) *">
                            <Input type="number" placeholder="e.g. 50000" value={form.totalAmount} onChange={set("totalAmount")} required />
                        </Field>
                        <Field label="EMI Amount (₹) *">
                            <Input type="number" placeholder="e.g. 5000" value={form.emiAmount} onChange={set("emiAmount")} required />
                        </Field>
                        <Field label="Loan Date *">
                            <Input type="date" value={form.loanDate} onChange={set("loanDate")} required />
                        </Field>
                        <Field label="Remarks">
                            <Input type="text" placeholder="Optional note" value={form.remarks} onChange={set("remarks")} />
                        </Field>
                    </div>
                    <div className="flex justify-end pt-3 border-t border-slate-200/60">
                        <button type="submit" disabled={saving}
                            className="px-6 py-3 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] disabled:opacity-60 transition-all shadow-lg shadow-[#0b2836]/20">
                            {saving ? "Saving…" : "Submit Request"}
                        </button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[900px]">
                    <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                            {["Employee", "Type", "Total", "EMI", "Remaining", "Loan Date", "Status", "Actions"].map(h => (
                                <th key={h} className="px-5 py-4 text-left">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={8} className="px-5 py-12 text-center text-amber-500 font-bold animate-pulse">Loading…</td></tr>
                        ) : loans.length === 0 ? (
                            <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400 font-medium">No loans/advances found.</td></tr>
                        ) : loans.map((l, i) => (
                            <tr key={l.loanId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-5 py-4">
                                    <div className="font-bold text-slate-900">{l.empName ?? `EMP-${l.empId}`}</div>
                                    <div className="text-xs font-mono font-bold text-amber-600 mt-0.5">#{l.empId}</div>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold border border-slate-200">{l.loanType}</span>
                                </td>
                                <td className="px-5 py-4 font-mono font-semibold text-slate-700">{fmtINR(l.totalAmount)}</td>
                                <td className="px-5 py-4 font-mono font-semibold text-slate-700">{fmtINR(l.emiAmount)}</td>
                                <td className="px-5 py-4 font-mono font-bold text-emerald-700">{fmtINR(l.remainingAmount)}</td>
                                <td className="px-5 py-4 text-slate-500 font-medium text-xs">{l.loanDate ? l.loanDate.slice(0, 10) : "—"}</td>
                                <td className="px-5 py-4"><Badge status={l.status} /></td>
                                <td className="px-5 py-4">
                                    {l.status === "Pending" ? (
                                        <div className="flex gap-2">
                                            <button disabled={!!actLoading}
                                                onClick={() => handleAction(l.loanId, "Active")}
                                                className="px-3.5 py-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200/50 transition-all disabled:opacity-60 shadow-sm">
                                                Approve
                                            </button>
                                            <button disabled={!!actLoading}
                                                onClick={() => handleAction(l.loanId, "Rejected")}
                                                className="px-3.5 py-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200/50 transition-all disabled:opacity-60 shadow-sm">
                                                Reject
                                            </button>
                                        </div>
                                    ) : l.status === "Active" ? (
                                        <button disabled={!!actLoading}
                                            onClick={() => handleClose(l.loanId)}
                                            className="px-3.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all disabled:opacity-60 border border-slate-200 shadow-sm">
                                            Close Loan
                                        </button>
                                    ) : (
                                        <span className="text-slate-400 text-xs font-bold">—</span>
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
        <div className="space-y-6">
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 mb-1">Currently Active Rule</p>
                {loading ? (
                    <p className="text-sm font-bold text-amber-700 animate-pulse">Loading…</p>
                ) : activeRule ? (
                    <p className="text-lg font-bold text-amber-900">
                        {activeRule.latesCount} late marks → {activeRule.penaltyType === "FullDay" ? "1 full day" : "half day"} deduction
                    </p>
                ) : (
                    <p className="text-sm font-bold text-amber-700">No active rule configured. Payroll will default to 3 lates = half day.</p>
                )}
            </div>

            <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">Set a New Rule</p>
                <p className="text-xs text-slate-400 font-medium">Saving a new rule replaces the active one — it will apply from the next payroll run onward.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-lg">
                    <Field label="Late Marks Count *">
                        <Input type="number" min="1" placeholder="e.g. 3" value={form.latesCount}
                            onChange={e => setForm(f => ({ ...f, latesCount: e.target.value }))} required />
                    </Field>
                    <Field label="Penalty *">
                        <select value={form.penaltyType}
                            onChange={e => setForm(f => ({ ...f, penaltyType: e.target.value }))}
                            className={`${inputClass} cursor-pointer appearance-none`}>
                            <option value="HalfDay">Half Day</option>
                            <option value="FullDay">Full Day</option>
                        </select>
                    </Field>
                </div>
                <div className="pt-3 border-t border-slate-200/60">
                    <button type="submit" disabled={saving}
                        className="px-6 py-3 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] disabled:opacity-60 transition-all shadow-lg shadow-[#0b2836]/20">
                        {saving ? "Saving…" : "Save Rule"}
                    </button>
                </div>
            </form>

            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 ml-1">Rule History</p>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                    <table className="w-full text-sm border-collapse whitespace-nowrap min-w-[600px]">
                        <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                {["Lates Count", "Penalty", "Status", "Created Date"].map(h => (
                                    <th key={h} className="px-5 py-4 text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {history.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-12 text-center text-slate-400 font-medium">No rule history yet.</td></tr>
                            ) : history.map((r, i) => (
                                <tr key={r.ruleId ?? i} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-5 py-4 font-bold text-slate-900">{r.latesCount}</td>
                                    <td className="px-5 py-4 font-medium text-slate-700">{r.penaltyType === "FullDay" ? "Full Day" : "Half Day"}</td>
                                    <td className="px-5 py-4">
                                        {r.isActive ? <Badge status="Active" /> : <span className="text-slate-400 text-xs font-bold">Inactive</span>}
                                    </td>
                                    <td className="px-5 py-4 text-slate-500 font-medium text-xs">{r.createdAt ? r.createdAt.slice(0, 10) : "—"}</td>
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
    { id: "salary", label: "Salary Structure", icon: "fa-solid fa-file-invoice-dollar" },
    { id: "payroll", label: "Payroll Processing", icon: "fa-solid fa-calculator" },
    { id: "deductions", label: "Deductions", icon: "fa-solid fa-hand-holding-dollar" },
    { id: "loans", label: "Loans / Advances", icon: "fa-solid fa-wallet" },
    { id: "latemarks", label: "Late Mark Rules", icon: "fa-solid fa-clock-rotate-left" },
    { id: "details", label: "Payroll Details", icon: "fa-solid fa-table-list" },
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
        <div className="space-y-5 pb-10 font-sans relative z-0">

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-wallet text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Payroll Management</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Manage salary structures, generate &amp; finalize payroll, handle deductions, loans, and view payroll details.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Main Container (Tabs + Content) ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

                {/* ── Tabs Navigation ── */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50">
                    {TABS.map(t => (
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

                <div className="p-6 sm:p-8 min-h-[400px]">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-3">
                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                            <div className="text-sm font-medium text-slate-500 animate-pulse">Loading payroll data...</div>
                        </div>
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