import { useState, useEffect, useRef } from "react";
import { adminService, getDocumentUrl } from "../../services/adminService";

const emptyBankForm = {
    bankId: null,
    empId: "",
    bankName: "",
    accountNo: "",
    ifscCode: "",
    branchName: "",
    accountType: "Savings",
    isPrimary: true,
};

const emptyDocForm = {
    docId: null,
    empId: "",
    docType: "",
    docName: "", // holds the document number (Aadhaar no., PAN no., etc.)
    fileBase64: "",
    fileExtension: "",
    uploadedBy: 0,
};

// Converts a File object to base64 (without the data: prefix)
const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm";

// ── Searchable Employee Select ──────────────────────────────────────────
type Employee = {
    empId: number | string;
    fullName: string;
    empCode: string;
};

type SearchableEmployeeSelectProps = {
    employeeList: Employee[];
    selectedEmpId: string;
    onSelect: (empId: string) => void;
};

function SearchableEmployeeSelect({
    employeeList,
    selectedEmpId,
    onSelect,
}: SearchableEmployeeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedEmp = employeeList.find(
        (emp) => String(emp.empId) === String(selectedEmpId)
    );

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search by name or emp code
    const filteredList = employeeList.filter((emp) => {
        const query = search.toLowerCase();
        return (
            emp.fullName?.toLowerCase().includes(query) ||
            emp.empCode?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="relative min-w-[280px] sm:min-w-[340px] w-full md:w-auto" ref={wrapperRef}>
            <div className="relative">
                <i className={`fa-solid fa-user-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isOpen ? "text-amber-500" : "text-amber-200/70"}`} />
                <input
                    type="text"
                    readOnly={!isOpen}
                    value={
                        isOpen
                            ? search
                            : selectedEmp
                                ? `${selectedEmp.fullName} (${selectedEmp.empCode})`
                                : ""
                    }
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={() => {
                        setIsOpen(true);
                        setSearch("");
                    }}
                    placeholder="-- Select Employee to Manage --"
                    className={`w-full rounded-xl pl-11 pr-10 py-3 text-sm font-bold cursor-pointer transition-all duration-300 focus:outline-none ${isOpen
                            ? "bg-white text-slate-800 placeholder-slate-400 border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-4 ring-amber-400/20"
                            : "bg-white/10 border border-white/10 text-white placeholder-amber-100/50 hover:bg-white/20 shadow-inner"
                        }`}
                />
                <i className={`fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[11px] transition-transform duration-300 ${isOpen ? "rotate-180 text-amber-500" : "text-amber-200/70"}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[999] mt-2 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <div
                        onClick={() => {
                            onSelect("");
                            setIsOpen(false);
                            setSearch("");
                        }}
                        className="px-4 py-3 text-sm font-bold text-slate-400 cursor-pointer hover:bg-slate-50 border-b border-slate-100 transition-colors"
                    >
                        -- Clear Selection --
                    </div>

                    {filteredList.length === 0 ? (
                        <div className="px-4 py-4 text-sm font-medium text-slate-400 text-center italic">No employee found</div>
                    ) : (
                        filteredList.map((emp) => (
                            <div
                                key={emp.empId}
                                onClick={() => {
                                    onSelect(String(emp.empId));
                                    setIsOpen(false);
                                    setSearch("");
                                }}
                                className={`px-4 py-3 text-sm cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${String(emp.empId) === String(selectedEmpId)
                                    ? "bg-amber-50 font-bold text-amber-700"
                                    : "text-slate-700 font-semibold hover:bg-amber-50/50 hover:text-amber-600"
                                    }`}
                            >
                                {emp.fullName} <span className="text-xs text-slate-400 font-mono ml-1">({emp.empCode})</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────

export default function EmployeeMasterData() {
    const currentUserId = parseInt(localStorage.getItem("userId") || "0", 10);

    const [employeeList, setEmployeeList] = useState([]);
    const [selectedEmpId, setSelectedEmpId] = useState("");
    const [activeSection, setActiveSection] = useState("bank"); // 'bank' | 'documents'

    const [bankList, setBankList] = useState([]);
    const [docList, setDocList] = useState([]);

    const [bankForm, setBankForm] = useState(emptyBankForm);
    const [docForm, setDocForm] = useState(emptyDocForm);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState("");
    const [msgType, setMsgType] = useState("success"); // 'success' | 'error'
    const [errors, setErrors] = useState<Record<string, any>>({});

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await adminService.getEmployees();
                if (res.success) setEmployeeList(res.data || []);
            } catch (err) {
                console.error("Failed to load employees", err);
            }
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (!selectedEmpId) {
            setBankList([]);
            setDocList([]);
            return;
        }
        loadEmployeeData(selectedEmpId);
    }, [selectedEmpId]);

    const loadEmployeeData = async (empId) => {
        setLoading(true);
        try {
            const [bankRes, docRes] = await Promise.all([
                adminService.getBankDetails(empId),
                adminService.getEmployeeDocuments(empId),
            ]);
            if (bankRes.success) setBankList(bankRes.data || []);
            if (docRes.success) setDocList(docRes.data || []);
        } catch (err) {
            console.error(err);
            showMsg("Failed to load employee data.", "error");
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (text, type = "success") => {
        setMsg(text);
        setMsgType(type);
        setTimeout(() => setMsg(""), 3000);
    };

    const selectedEmployee = employeeList.find(
        (emp) => String(emp.empId) === String(selectedEmpId)
    );

    // ---------- BANK HANDLERS ----------
    const handleBankSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEmpId) return;
        setErrors({});
        setSaving(true);

        const payload = {
            bankId: bankForm.bankId || null,
            empId: parseInt(selectedEmpId, 10),
            bankName: bankForm.bankName,
            accountNo: bankForm.accountNo,
            ifscCode: bankForm.ifscCode.toUpperCase(),
            branchName: bankForm.branchName || null,
            accountType: bankForm.accountType,
            isPrimary: bankForm.isPrimary,
        };

        try {
            if (bankForm.bankId) {
                await adminService.updateBankDetail(payload);
                showMsg("Bank detail updated successfully.");
            } else {
                await adminService.createBankDetail(payload);
                showMsg("Bank detail added successfully.");
            }
            setBankForm(emptyBankForm);
            loadEmployeeData(selectedEmpId);
        } catch (err) {
            console.error(err);
            const apiErrors = err?.response?.data?.errors;
            if (apiErrors) setErrors(apiErrors);
            showMsg(err?.response?.data?.message || "Failed to save bank detail.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleBankEdit = (bank) => {
        setBankForm({
            bankId: bank.bankId,
            empId: bank.empId,
            bankName: bank.bankName || "",
            accountNo: bank.accountNo || "",
            ifscCode: bank.ifscCode || "",
            branchName: bank.branchName || "",
            accountType: bank.accountType || "Savings",
            isPrimary: bank.isPrimary ?? true,
        });
    };

    const handleBankDelete = async (bankId) => {
        if (!window.confirm("Are you sure you want to delete this bank detail?")) return;
        try {
            await adminService.deleteBankDetail(bankId);
            showMsg("Bank detail deleted successfully.");
            loadEmployeeData(selectedEmpId);
        } catch (err) {
            console.error(err);
            showMsg("Failed to delete bank detail.", "error");
        }
    };

    // ---------- DOCUMENT HANDLERS ----------
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setSelectedFile(file);
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
        setDocForm((prev) => ({ ...prev, fileExtension: ext }));
    };

    const handleDocSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEmpId) return;
        setErrors({});
        setSaving(true);

        try {
            let fileBase64 = docForm.fileBase64;
            let fileExtension = docForm.fileExtension;

            if (selectedFile) {
                fileBase64 = await fileToBase64(selectedFile);
                fileExtension = selectedFile.name.includes(".")
                    ? selectedFile.name.split(".").pop()
                    : "";
            }

            const payload = {
                docId: docForm.docId || null,
                empId: parseInt(selectedEmpId, 10),
                docType: docForm.docType,
                docName: docForm.docName,
                fileBase64: fileBase64 || null,
                fileExtension: fileExtension || null,
                uploadedBy: currentUserId,
            };

            if (docForm.docId) {
                await adminService.updateEmployeeDocument(payload);
                showMsg("Document updated successfully.");
            } else {
                await adminService.uploadEmployeeDocument(payload);
                showMsg("Document uploaded successfully.");
            }
            setDocForm(emptyDocForm);
            setSelectedFile(null);
            loadEmployeeData(selectedEmpId);
        } catch (err) {
            console.error(err);
            const apiErrors = err?.response?.data?.errors;
            if (apiErrors) setErrors(apiErrors);
            showMsg(err?.response?.data?.message || "Failed to save document.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDocEdit = (doc) => {
        setDocForm({
            docId: doc.docId,
            empId: doc.empId,
            docType: doc.docType || "",
            docName: doc.docName || "",
            fileBase64: "",
            fileExtension: doc.fileExtension || "",
            uploadedBy: currentUserId,
        });
        setSelectedFile(null);
    };

    const handleDocDelete = async (docId) => {
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await adminService.deleteEmployeeDocument(docId);
            showMsg("Document deleted successfully.");
            loadEmployeeData(selectedEmpId);
        } catch (err) {
            console.error(err);
            showMsg("Failed to delete document.", "error");
        }
    };

    return (
        <div className="space-y-6 pb-10 font-sans relative z-0">

            {/* ── Toast Notification ── */}
            {msg && (
                <div className={`fixed top-8 right-8 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold text-white transition-all animate-in slide-in-from-top-5 duration-300 ${msgType === "error" ? "bg-rose-600 border border-rose-500" : "bg-emerald-600 border border-emerald-500"}`}>
                    <i className={`fa-solid ${msgType === "error" ? "fa-triangle-exclamation" : "fa-circle-check"} text-lg`} />
                    {msg}
                </div>
            )}

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative z-20">
                {/* Fixed clipping wrapper for the glow effect */}
                <div className="absolute inset-0 overflow-hidden rounded-[24px] pointer-events-none">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl" />
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-vault text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Bank Details & Documents</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Manage financial routing and compliance documents for personnel.
                        </p>
                    </div>
                </div>

                <div className="relative z-30 w-full md:w-auto">
                    <SearchableEmployeeSelect
                        employeeList={employeeList}
                        selectedEmpId={selectedEmpId}
                        onSelect={(empId) => {
                            setSelectedEmpId(empId);
                            setBankForm(emptyBankForm);
                            setDocForm(emptyDocForm);
                            setSelectedFile(null);
                        }}
                    />
                </div>
            </div>

            {/* ── Empty State (No Employee Selected) ── */}
            {!selectedEmpId && (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl shadow-sm py-24 flex flex-col items-center gap-4 text-center relative z-10">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 text-3xl shadow-inner">
                        <i className="fa-solid fa-user-magnifying-glass" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-slate-700">No Profile Selected</p>
                        <p className="text-sm text-slate-500 font-medium mt-1">Please select an employee from the dropdown above to manage records.</p>
                    </div>
                </div>
            )}

            {/* ── Active Workspace ── */}
            {selectedEmpId && (
                <div className="space-y-6 animate-in fade-in duration-300 relative z-10">

                    {/* Selected Employee Banner */}
                    {selectedEmployee && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-sm font-black shadow-md border-2 border-white shrink-0">
                                    {selectedEmployee.fullName
                                        ?.split(" ")
                                        .map((w) => w[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-base font-bold text-slate-900">{selectedEmployee.fullName}</p>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {selectedEmployee.empCode}</p>
                                </div>
                            </div>

                            {/* Section Tabs */}
                            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 w-full sm:w-auto overflow-x-auto">
                                {[
                                    { key: "bank", label: "Bank Details", icon: "fa-building-columns" },
                                    { key: "documents", label: "Documents", icon: "fa-file-lines" },
                                ].map((sec) => (
                                    <button
                                        key={sec.key}
                                        onClick={() => setActiveSection(sec.key)}
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${activeSection === sec.key
                                                ? "bg-white text-amber-600 shadow-sm border border-slate-200/50"
                                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                                            }`}
                                    >
                                        <i className={`fa-solid ${sec.icon}`} /> {sec.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm py-20 flex flex-col items-center gap-4 text-center">
                            <i className="fa-solid fa-spinner animate-spin text-3xl text-amber-500" />
                            <p className="text-slate-500 font-semibold text-sm animate-pulse">Loading employee data...</p>
                        </div>
                    )}

                    {/* ──────────────── BANK SECTION ──────────────── */}
                    {!loading && activeSection === "bank" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                            {/* Form Panel */}
                            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                                    <i className="fa-solid fa-building-columns text-amber-500" />
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                        {bankForm.bankId ? "Edit Bank Detail" : "Add Bank Detail"}
                                    </h3>
                                </div>
                                <form onSubmit={handleBankSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Bank Name *</label>
                                        <input
                                            required
                                            maxLength={100}
                                            value={bankForm.bankName}
                                            onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                            className={inputClass}
                                            placeholder="e.g. State Bank of India"
                                        />
                                        {errors.BankName && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.BankName[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Account No *</label>
                                        <input
                                            required
                                            maxLength={50}
                                            value={bankForm.accountNo}
                                            onChange={(e) => setBankForm({ ...bankForm, accountNo: e.target.value })}
                                            className={inputClass}
                                            placeholder="Enter account number"
                                        />
                                        {errors.AccountNo && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.AccountNo[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">IFSC Code *</label>
                                        <input
                                            required
                                            maxLength={11}
                                            value={bankForm.ifscCode}
                                            onChange={(e) => {
                                                const value = e.target.value.toUpperCase();
                                                setBankForm({ ...bankForm, ifscCode: value });
                                                const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
                                                if (value && !ifscRegex.test(value)) {
                                                    setErrors((prev) => ({ ...prev, IfscCode: ["Invalid format (e.g. SBIN0001234)"] }));
                                                } else {
                                                    setErrors((prev) => {
                                                        const updated = { ...prev };
                                                        delete updated.IfscCode;
                                                        return updated;
                                                    });
                                                }
                                            }}
                                            className={`${inputClass} uppercase`}
                                            placeholder="SBIN0001234"
                                        />
                                        {errors.IfscCode && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.IfscCode[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Branch Name</label>
                                        <input
                                            maxLength={100}
                                            value={bankForm.branchName}
                                            onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                                            className={inputClass}
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Account Type *</label>
                                        <select
                                            value={bankForm.accountType}
                                            onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                                            className={`${inputClass} cursor-pointer appearance-none`}
                                        >
                                            <option value="Savings">Savings Account</option>
                                            <option value="Current">Current Account</option>
                                            <option value="Salary">Salary Account</option>
                                        </select>
                                    </div>

                                    <label className="flex items-center gap-3 pt-2 pb-1 cursor-pointer group w-max">
                                        <input
                                            type="checkbox"
                                            checked={bankForm.isPrimary}
                                            onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                                            className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer border-slate-300 transition-colors"
                                        />
                                        <span className="text-xs font-bold text-slate-600 group-hover:text-amber-700 uppercase tracking-wider transition-colors">Set as Primary Account</span>
                                    </label>

                                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="w-full py-3 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] transition-all shadow-lg shadow-[#0b2836]/20 disabled:opacity-50 disabled:hover:translate-y-0 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                        >
                                            {saving ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-floppy-disk" />}
                                            {saving ? "Processing..." : bankForm.bankId ? "Update Details" : "Save Bank Details"}
                                        </button>
                                        {bankForm.bankId && (
                                            <button
                                                type="button"
                                                onClick={() => setBankForm(emptyBankForm)}
                                                className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* List Panel */}
                            <div className="lg:col-span-8 space-y-4">
                                {bankList.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {bankList.map((bank) => (
                                            <div
                                                key={bank.bankId}
                                                className={`p-5 bg-white border-2 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${bank.isPrimary ? "border-amber-400" : "border-slate-200 hover:border-amber-200"}`}
                                            >
                                                {bank.isPrimary && (
                                                    <div className="absolute -right-6 top-3 bg-amber-400 text-[#0b2836] text-[9px] font-black uppercase tracking-widest px-8 py-1 rotate-45 shadow-sm">
                                                        Primary
                                                    </div>
                                                )}
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${bank.isPrimary ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors"}`}>
                                                        <i className="fa-solid fa-building-columns" />
                                                    </div>
                                                    <div className="min-w-0 flex-1 pr-4">
                                                        <h4 className="font-bold text-slate-900 text-base truncate">{bank.bankName}</h4>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1 mb-2">{bank.accountType}</p>

                                                        <div className="space-y-1.5 mt-3">
                                                            <div className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">A/C No</span>
                                                                <span className="text-sm font-mono font-bold text-slate-700">{bank.accountNo}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">IFSC</span>
                                                                <span className="text-xs font-mono font-bold text-slate-700">{bank.ifscCode}</span>
                                                            </div>
                                                            {bank.branchName && (
                                                                <div className="flex justify-between items-center px-3 py-1 mt-1">
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Branch</span>
                                                                    <span className="text-xs font-medium text-slate-600 truncate max-w-[120px]">{bank.branchName}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-2 mt-5 border-t border-slate-100 pt-4">
                                                    <button
                                                        onClick={() => handleBankEdit(bank)}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-100/50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleBankDelete(bank.bankId)}
                                                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100/50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl py-24 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 text-2xl shadow-sm mb-4">
                                            <i className="fa-solid fa-piggy-bank" />
                                        </div>
                                        <p className="text-base font-bold text-slate-600">No Bank Details Registered</p>
                                        <p className="text-sm text-slate-400 mt-1">Use the form to add account configurations.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ──────────────── DOCUMENTS SECTION ──────────────── */}
                    {!loading && activeSection === "documents" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                            {/* Form Panel */}
                            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100">
                                    <i className="fa-solid fa-file-circle-plus text-amber-500" />
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                        {docForm.docId ? "Edit Document" : "Upload Document"}
                                    </h3>
                                </div>
                                <form onSubmit={handleDocSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Document Category *</label>
                                        <select
                                            required
                                            value={docForm.docType}
                                            onChange={(e) => setDocForm({ ...docForm, docType: e.target.value })}
                                            className={`${inputClass} cursor-pointer appearance-none`}
                                        >
                                            <option value="" disabled>-- Select Type --</option>
                                            <option value="Aadhaar Card">Aadhaar Card</option>
                                            <option value="PAN Card">PAN Card</option>
                                            <option value="Passport">Passport</option>
                                            <option value="Driving License">Driving License</option>
                                            <option value="Voter ID">Voter ID</option>
                                            <option value="Offer Letter">Offer Letter</option>
                                            <option value="Appointment Letter">Appointment Letter</option>
                                            <option value="Resume">Resume</option>
                                            <option value="Educational Certificate">Educational Certificate</option>
                                            <option value="Experience Letter">Experience Letter</option>
                                            <option value="Bank Passbook">Bank Passbook</option>
                                            <option value="Photograph">Photograph</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {errors.DocType && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.DocType[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Document Reference No *</label>
                                        <input
                                            required
                                            maxLength={200}
                                            value={docForm.docName}
                                            onChange={(e) => setDocForm({ ...docForm, docName: e.target.value })}
                                            className={inputClass}
                                            placeholder="e.g. 1234 5678 9012"
                                        />
                                        {errors.DocName && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.DocName[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                                            Attach File {docForm.docId ? "(Leave empty to keep existing)" : "*"}
                                        </label>
                                        <input
                                            type="file"
                                            required={!docForm.docId}
                                            onChange={handleFileChange}
                                            className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:uppercase file:tracking-wider file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 transition-all cursor-pointer border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-400 p-2"
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="w-full py-3 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] transition-all shadow-lg shadow-[#0b2836]/20 disabled:opacity-50 disabled:hover:translate-y-0 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                        >
                                            {saving ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-cloud-arrow-up" />}
                                            {saving ? "Uploading..." : docForm.docId ? "Update Document" : "Upload Document"}
                                        </button>
                                        {docForm.docId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDocForm(emptyDocForm);
                                                    setSelectedFile(null);
                                                }}
                                                className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            {/* List Panel */}
                            <div className="lg:col-span-8 space-y-4">
                                {docList.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {docList.map((doc) => (
                                            <div
                                                key={doc.docId}
                                                className="p-5 bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-200 transition-all group flex flex-col justify-between"
                                            >
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                        <i className="fa-regular fa-file-pdf" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-bold text-slate-900 text-base truncate">{doc.docType}</h4>
                                                        <p className="text-xs font-mono font-bold text-slate-500 mt-1 truncate bg-slate-50 px-2 py-1 rounded inline-block border border-slate-100">ID: {doc.docName}</p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center mt-auto border-t border-slate-100 pt-4">
                                                    <div>
                                                        {doc.filePath ? (
                                                            <a
                                                                href={getDocumentUrl(doc.filePath)}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold rounded-lg transition-colors border border-blue-100/50"
                                                            >
                                                                <i className="fa-regular fa-eye" /> View File
                                                            </a>
                                                        ) : (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">No File</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleDocEdit(doc)}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                                            title="Edit Document Info"
                                                        >
                                                            <i className="fa-solid fa-pen text-[13px]" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDocDelete(doc.docId)}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                                                            title="Delete Document"
                                                        >
                                                            <i className="fa-solid fa-trash-can text-[13px]" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl py-24 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-300 text-2xl shadow-sm mb-4">
                                            <i className="fa-solid fa-folder-open" />
                                        </div>
                                        <p className="text-base font-bold text-slate-600">No Documents Uploaded</p>
                                        <p className="text-sm text-slate-400 mt-1">Use the panel to attach verification documents.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}