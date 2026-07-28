import { useState, useEffect } from "react";
//import { adminService } from "../../services/adminService";
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
    "border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm w-full bg-slate-50/50 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 focus:bg-white";

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
                showMsg("Bank detail saved.");
            } else {
                await adminService.createBankDetail(payload);
                showMsg("Bank detail saved.");
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
        if (!window.confirm("Delete this bank detail?")) return;
        try {
            await adminService.deleteBankDetail(bankId);
            showMsg("Bank detail deleted.");
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
                showMsg("Document saved.");
            } else {
                await adminService.uploadEmployeeDocument(payload);
                showMsg("Document saved.");
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
        if (!window.confirm("Delete this document?")) return;
        try {
            await adminService.deleteEmployeeDocument(docId);
            showMsg("Document deleted.");
            loadEmployeeData(selectedEmpId);
        } catch (err) {
            console.error(err);
            showMsg("Failed to delete document.", "error");
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Header + Employee Selector ── */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Bank Details & Documents</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Select an employee to manage their records.</p>
                </div>
                <div className="relative min-w-[240px]">
                    <select
                        value={selectedEmpId}
                        onChange={(e) => {
                            setSelectedEmpId(e.target.value);
                            setBankForm(emptyBankForm);
                            setDocForm(emptyDocForm);
                            setSelectedFile(null);
                        }}
                        className="appearance-none w-full border border-amber-200 bg-amber-50 rounded-xl pl-4 pr-9 py-2.5 text-sm text-amber-800 font-semibold cursor-pointer transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                    >
                        <option value="">-- Select Employee --</option>
                        {employeeList.map((emp) => (
                            <option key={emp.empId} value={emp.empId}>
                                {emp.fullName} ({emp.empCode})
                            </option>
                        ))}
                    </select>
                    <svg
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* ── Toast message ── */}
            {msg && (
                <div
                    className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${msgType === "error"
                            ? "bg-red-50 border-red-200 text-red-700"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700"
                        }`}
                >
                    <span>{msgType === "error" ? "⚠️" : "✅"}</span>
                    {msg}
                </div>
            )}

            {!selectedEmpId && (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl shadow-sm py-20 flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-400 text-xl">
                        👤
                    </div>
                    <p className="text-slate-500 font-medium text-sm">Please select an employee to continue.</p>
                </div>
            )}

            {selectedEmpId && (
                <>
                    {selectedEmployee && (
                        <div className="flex items-center gap-3 px-1">
                            <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {selectedEmployee.fullName
                                    ?.split(" ")
                                    .map((w) => w[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">{selectedEmployee.fullName}</p>
                                <p className="text-xs text-slate-400">{selectedEmployee.empCode}</p>
                            </div>
                        </div>
                    )}

                    {/* ── Section Tabs ── */}
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
                        {[
                            { key: "bank", label: "Bank Details" },
                            { key: "documents", label: "Documents" },
                        ].map((sec) => (
                            <button
                                key={sec.key}
                                onClick={() => setActiveSection(sec.key)}
                                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeSection === sec.key
                                        ? "bg-white text-amber-700 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {sec.label}
                            </button>
                        ))}
                    </div>

                    {loading && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm py-14 text-center text-slate-400 text-sm">
                            Loading...
                        </div>
                    )}

                    {/* ---------- BANK SECTION ---------- */}
                    {!loading && activeSection === "bank" && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <form onSubmit={handleBankSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Bank Name *</label>
                                        <input
                                            required
                                            maxLength={100}
                                            value={bankForm.bankName}
                                            onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                                            className={inputClass}
                                            placeholder="e.g. State Bank of India"
                                        />
                                        {errors.BankName && <p className="text-xs text-red-500 mt-1">{errors.BankName[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Account No *</label>
                                        <input
                                            required
                                            maxLength={50}
                                            value={bankForm.accountNo}
                                            onChange={(e) => setBankForm({ ...bankForm, accountNo: e.target.value })}
                                            className={inputClass}
                                            placeholder="Account number"
                                        />
                                        {errors.AccountNo && <p className="text-xs text-red-500 mt-1">{errors.AccountNo[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">IFSC Code *</label>
                                        <input
                                            required
                                            maxLength={20}
                                            value={bankForm.ifscCode}
                                            onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                                            className={`${inputClass} uppercase`}
                                            placeholder="SBIN0001234"
                                        />
                                        {errors.IfscCode && <p className="text-xs text-red-500 mt-1">{errors.IfscCode[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Branch Name</label>
                                        <input
                                            maxLength={100}
                                            value={bankForm.branchName}
                                            onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                                            className={inputClass}
                                            placeholder="Optional"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Account Type *</label>
                                        <select
                                            value={bankForm.accountType}
                                            onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value })}
                                            className={inputClass}
                                        >
                                            <option value="Savings">Savings</option>
                                            <option value="Current">Current</option>
                                            <option value="Salary">Salary</option>
                                        </select>
                                    </div>
                                    <label className="flex items-center gap-2 mt-6 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={bankForm.isPrimary}
                                            onChange={(e) => setBankForm({ ...bankForm, isPrimary: e.target.checked })}
                                            className="w-4 h-4 accent-amber-600 rounded"
                                        />
                                        <span className="text-sm text-slate-600 font-medium">Primary account</span>
                                    </label>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm shadow-amber-200"
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                    {bankForm.bankId && (
                                        <button
                                            type="button"
                                            onClick={() => setBankForm(emptyBankForm)}
                                            className="px-6 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="border-t border-slate-100 pt-5 space-y-3">
                                {bankList.length > 0 ? (
                                    bankList.map((bank) => (
                                        <div
                                            key={bank.bankId}
                                            className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:border-amber-200 hover:bg-amber-50/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 text-sm font-bold shrink-0">
                                                    🏦
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                                                        {bank.bankName}
                                                        {bank.isPrimary && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold">
                                                                PRIMARY
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        A/C {bank.accountNo} • IFSC {bank.ifscCode} • {bank.accountType}
                                                    </p>
                                                    {bank.branchName && (
                                                        <p className="text-xs text-slate-400 mt-0.5">{bank.branchName}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-3 shrink-0">
                                                <button
                                                    onClick={() => handleBankEdit(bank)}
                                                    className="text-amber-600 text-xs font-bold hover:text-amber-800"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleBankDelete(bank.bankId)}
                                                    className="text-red-500 text-xs font-bold hover:text-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm text-center py-6">No bank details added yet.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ---------- DOCUMENTS SECTION ---------- */}
                    {!loading && activeSection === "documents" && (
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <form onSubmit={handleDocSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Document Type *</label>
                                        <select
                                            required
                                            value={docForm.docType}
                                            onChange={(e) => setDocForm({ ...docForm, docType: e.target.value })}
                                            className={inputClass}
                                        >
                                            <option value="">-- Select Type --</option>
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
                                        {errors.DocType && <p className="text-xs text-red-500 mt-1">{errors.DocType[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">Document Number *</label>
                                        <input
                                            required
                                            maxLength={200}
                                            value={docForm.docName}
                                            onChange={(e) => setDocForm({ ...docForm, docName: e.target.value })}
                                            className={inputClass}
                                            placeholder="e.g. 1234 5678 9012"
                                        />
                                        {errors.DocName && <p className="text-xs text-red-500 mt-1">{errors.DocName[0]}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 mb-1 block">
                                            File {docForm.docId ? "(leave empty to keep existing)" : "*"}
                                        </label>
                                        <input
                                            type="file"
                                            required={!docForm.docId}
                                            onChange={handleFileChange}
                                            className={`${inputClass} file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700 file:text-xs file:font-semibold hover:file:bg-amber-100`}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2.5 bg-amber-600 text-white text-sm font-bold rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 shadow-sm shadow-amber-200"
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                    {docForm.docId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDocForm(emptyDocForm);
                                                setSelectedFile(null);
                                            }}
                                            className="px-6 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>

                            <div className="border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                                {docList.length > 0 ? (
                                    docList.map((doc) => (
                                        <div
                                            key={doc.docId}
                                            className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:border-amber-200 hover:bg-amber-50/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 text-sm shrink-0">
                                                    📄
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="font-semibold text-slate-800 text-sm block truncate">
                                                        {doc.docType}
                                                    </span>
                                                    <span className="text-xs text-slate-400 block truncate">{doc.docName}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 items-center shrink-0">

                                                {doc.filePath && (

                                                   <a href = { getDocumentUrl(doc.filePath)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-amber-600 text-xs font-bold hover:text-amber-800"
                                                  >
                                                View
                                            </a>
                                                )}
                                                <button
                                                    onClick={() => handleDocEdit(doc)}
                                                    className="text-slate-600 text-xs font-bold hover:text-slate-800"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDocDelete(doc.docId)}
                                                    className="text-red-500 text-xs font-bold hover:text-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm text-center py-6 md:col-span-2">
                                        No documents uploaded yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}