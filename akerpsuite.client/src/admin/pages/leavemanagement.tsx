import { useEffect, useState, useMemo } from "react";
import { adminService } from "@/services/adminService";

export default function LeaveManagement() {

    const [activeTab, setActiveTab] = useState("balances");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Data States
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [employees, setEmployees] = useState([]);

    // Search and Pagination States
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showEditTypeModal, setShowEditTypeModal] = useState(false);
    const [showInitModal, setShowInitModal] = useState(false);
    const [editingTypeId, setEditingTypeId] = useState(null);

    const [typeForm, setTypeForm] = useState({ leaveCode: "", leaveName: "", maxPerYear: 12, carryForward: false, isActive: true });
    const [initForm, setInitForm] = useState<{ empId: string; year: string | number }>({ empId: "", year: new Date().getFullYear() });

    const [showEntryModal, setShowEntryModal] = useState(false);
    const [showEditEntryModal, setShowEditEntryModal] = useState(false);
    const [editingBalanceId, setEditingBalanceId] = useState(null);
    const [entryForm, setEntryForm] = useState<{ empId: string; leaveTypeId: string; year: string | number; totalLeaves: string | number; usedLeaves: string | number }>({
        empId: "", leaveTypeId: "", year: new Date().getFullYear(), totalLeaves: "", usedLeaves: ""
    });
    const [entryEmpSearchOpen, setEntryEmpSearchOpen] = useState(false);
    const [entryEmpSearchText, setEntryEmpSearchText] = useState("");

    useEffect(() => {
        loadData();
        setCurrentPage(1);
    }, [activeTab]);

    useEffect(() => {
        adminService.getEmployees().then(res => {
            if (res.Success || res.success) setEmployees(res.Data || res.data || []);
        });
    }, []);

    useEffect(() => {
        adminService.getLeaveTypes().then(res => {
            if (res.Success || res.success) setLeaveTypes(res.Data || res.data || []);
        }).catch(err => console.error("Error fetching leave types:", err));
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === "balances" || activeTab === "entries") {
                const res = await adminService.getAllLeaveBalances();
                if (res.Success || res.success) setLeaveBalances(res.Data || res.data || []);
            } else if (activeTab === "types") {
                const res = await adminService.getLeaveTypes();
                if (res.Success || res.success) setLeaveTypes(res.Data || res.data || []);
            }
        } catch (err) {
            console.error(err);
            if (activeTab === "balances" || activeTab === "entries") {
                alert("Failed to load leave balances. You may not have permission to view this data.");
            } else {
                alert("Failed to load leave types.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Yeh 2 employee "Manual Entries" tab se hide (dropdown + table dono se)
    const HIDDEN_EMP_CODES = ["AKS-0000", "AKS-0001"];

    const visibleEmployees = useMemo(() => {
        return employees.filter((emp) => !HIDDEN_EMP_CODES.includes(emp.empCode));
    }, [employees]);

    const visibleLeaveBalances = useMemo(() => {
        return leaveBalances.filter((b) => !HIDDEN_EMP_CODES.includes(b.empCode));
    }, [leaveBalances]);

    const groupedBalances = useMemo(() => {
        const map = new Map();
        for (const b of leaveBalances) {
            const key = b.empId;
            if (!map.has(key)) {
                map.set(key, {
                    empId: b.empId,
                    fullName: b.fullName,
                    empCode: b.empCode,
                    byType: {},
                });
            }
            map.get(key).byType[b.leaveTypeId] = {
                totalLeaves: b.totalLeaves,
                usedLeaves: b.usedLeaves,
                balanceLeaves: b.balanceLeaves,
            };
        }
        return Array.from(map.values());
    }, [leaveBalances]);

    const SEARCHABLE_FIELDS = {
        balances: ["fullName", "empCode"],
        types: ["leaveCode", "leaveName"],
        entries: ["fullName", "empCode", "leaveName"],
    };

    const filteredData = useMemo(() => {
        const currentData = activeTab === "balances" ? groupedBalances : activeTab === "entries" ? visibleLeaveBalances : leaveTypes;
        if (!searchTerm) return currentData;
        const q = searchTerm.toLowerCase();
        const fields = SEARCHABLE_FIELDS[activeTab] || [];
        return currentData.filter(item => fields.some(f => (item[f] ?? "").toString().toLowerCase().includes(q)));
    }, [activeTab, groupedBalances, leaveTypes, searchTerm, visibleLeaveBalances]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const columnCount = activeTab === "balances" ? leaveTypes.length + 1 : activeTab === "entries" ? 7 : 6;

    const handleAddType = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await adminService.createLeaveType(typeForm);
            if (res.Success || res.success) {
                setShowTypeModal(false);
                setTypeForm({ leaveCode: "", leaveName: "", maxPerYear: 12, carryForward: false, isActive: true });
                loadData();
            } else {
                alert(res.Message || "Failed to create leave type");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong while creating the leave type.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditClick = (type) => {
        setEditingTypeId(type.leaveTypeId);
        setTypeForm({ leaveCode: type.leaveCode, leaveName: type.leaveName, maxPerYear: type.maxPerYear, carryForward: type.carryForward, isActive: type.isActive });
        setShowEditTypeModal(true);
    };

    const handleUpdateType = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await adminService.updateLeaveType(editingTypeId, typeForm);
            if (res.Success || res.success) {
                setShowEditTypeModal(false);
                setTypeForm({ leaveCode: "", leaveName: "", maxPerYear: 12, carryForward: false, isActive: true });
                setEditingTypeId(null);
                loadData();
            } else alert(res.Message || "Failed to update leave type");
        } catch (err) { console.error(err); } finally { setActionLoading(false); }
    };

    const handleDeleteType = async (id) => {
        if (!window.confirm("Are you sure you want to delete this leave type?")) return;
        try {
            const res = await adminService.deleteLeaveType(id);
            if (res.Success || res.success) {
                loadData();
            } else {
                handleDeleteFailure(id, res.Message);
            }
        } catch (err) {
            handleDeleteFailure(id, err.message);
        }
    };

    const handleDeleteFailure = (id, message) => {
        const isInUse = message?.toLowerCase().includes("foreign key") || message?.toLowerCase().includes("constraint");
        if (isInUse) {
            const wantsDeactivate = window.confirm(
                "This leave type can't be deleted because employees already have balances or requests against it.\n\nWould you like to deactivate it instead? (It will be hidden from new leave applications, but existing records stay intact.)"
            );
            if (wantsDeactivate) {
                deactivateType(id);
            }
        } else {
            alert(message || "Failed to delete leave type");
        }
    };

    const deactivateType = async (id) => {
        const type = leaveTypes.find((t) => t.leaveTypeId === id);
        if (!type) return;
        try {
            const res = await adminService.updateLeaveType(id, {
                leaveCode: type.leaveCode,
                leaveName: type.leaveName,
                maxPerYear: type.maxPerYear,
                carryForward: type.carryForward,
                isActive: false,
            });
            if (res.Success || res.success) {
                loadData();
            } else {
                alert(res.Message || "Failed to deactivate leave type");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong while deactivating the leave type.");
        }
    };

    const handleInitBalance = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = { empId: parseInt(initForm.empId), year: parseInt(String(initForm.year)) };
            const res = await adminService.initializeBalance(payload);
            if (res.Success || res.success) {
                setShowInitModal(false);
                setInitForm({ empId: "", year: new Date().getFullYear() });
                loadData();
            } else alert(res.Message || "Failed to initialize balance");
        } catch (err) { console.error(err); } finally { setActionLoading(false); }
    };

    const handleAddEntry = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                empId: parseInt(entryForm.empId, 10),
                leaveTypeId: parseInt(entryForm.leaveTypeId, 10),
                year: parseInt(String(entryForm.year), 10),
                totalLeaves: parseInt(String(entryForm.totalLeaves), 10),
                usedLeaves: parseFloat(String(entryForm.usedLeaves)) || 0,
            };
            const res = await adminService.createLeaveBalance(payload);
            if (res.Success || res.success) {
                setShowEntryModal(false);
                setEntryForm({ empId: "", leaveTypeId: "", year: new Date().getFullYear(), totalLeaves: "", usedLeaves: "" });
                loadData();
            } else {
                alert(res.Message || "Failed to create leave balance entry");
            }
        } catch (err) {
            console.error(err);
            alert(err?.response?.data?.Message || "Something went wrong while creating the entry.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditEntryClick = (entry) => {
        setEditingBalanceId(entry.balanceId);
        setEntryForm({
            empId: String(entry.empId),
            leaveTypeId: String(entry.leaveTypeId),
            year: entry.year,
            totalLeaves: entry.totalLeaves,
            usedLeaves: entry.usedLeaves,
        });
        setShowEditEntryModal(true);
    };

    const handleUpdateEntry = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                totalLeaves: parseInt(String(entryForm.totalLeaves), 10),
                usedLeaves: parseFloat(String(entryForm.usedLeaves)) || 0,
            };
            const res = await adminService.updateLeaveBalance(editingBalanceId, payload);
            if (res.Success || res.success) {
                setShowEditEntryModal(false);
                setEditingBalanceId(null);
                loadData();
            } else alert(res.Message || "Failed to update entry");
        } catch (err) { console.error(err); } finally { setActionLoading(false); }
    };

    const handleDeleteEntry = async (balanceId) => {
        if (!window.confirm("Are you sure you want to delete this leave balance entry?")) return;
        try {
            const res = await adminService.deleteLeaveBalance(balanceId);
            if (res.Success || res.success) {
                loadData();
            } else {
                alert(res.Message || "Failed to delete entry");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong while deleting the entry.");
        }
    };

    const BalancesTableHeader = () => (
        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <tr>
                <th className="px-6 py-4">Employee</th>
                {leaveTypes.map((t) => (
                    <th key={t.leaveTypeId} className="px-6 py-4 text-center">{t.leaveName}</th>
                ))}
            </tr>
        </thead>
    );

    const TypesTableHeader = () => (
        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Leave Name</th>
                <th className="px-6 py-4 text-center">Max/Year</th>
                <th className="px-6 py-4 text-center">Carry Fwd</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
            </tr>
        </thead>
    );

    const EntriesTableHeader = () => (
        <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Leave Type</th>
                <th className="px-6 py-4 text-center">Year</th>
                <th className="px-6 py-4 text-center">Total</th>
                <th className="px-6 py-4 text-center">Used</th>
                <th className="px-6 py-4 text-center">Balance</th>
                <th className="px-6 py-4 text-center">Actions</th>
            </tr>
        </thead>
    );

    return (
        <div className="space-y-5 pb-10 font-sans">

            {/* ── Compact Header Section ── */}
            <div className="bg-[#0b2532] rounded-2xl px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-umbrella-beach text-lg text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Leave Settings & Balances</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Manage leave types definitions and annual employee balances.
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activeTab === "types" && (
                        <button
                            onClick={() => setShowTypeModal(true)}
                            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-2 shadow-sm"
                        >
                            <i className="fa-solid fa-plus" /> Add Leave Type
                        </button>
                    )}
                    {activeTab === "balances" && (
                        <button
                            onClick={() => setShowInitModal(true)}
                            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-2 shadow-sm"
                        >
                            <i className="fa-solid fa-bolt" /> Initialize Balance
                        </button>
                    )}
                    {activeTab === "entries" && (
                        <button
                            onClick={() => {
                                setEntryForm({ empId: "", leaveTypeId: "", year: new Date().getFullYear(), totalLeaves: "", usedLeaves: "" });
                                setEntryEmpSearchOpen(false);
                                setEntryEmpSearchText("");
                                setShowEntryModal(true);
                            }}
                            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-2 shadow-sm"
                        >
                            <i className="fa-solid fa-plus" /> Add Entry
                        </button>
                    )}
                </div>
            </div>

            {/* ── Main Container (Tabs & Table) ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

                {/* ── Tabs Navigation ── */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50">
                    <button
                        onClick={() => { setActiveTab("balances"); setSearchTerm(""); setCurrentPage(1); }}
                        className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === "balances" ? "border-amber-500 text-amber-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <i className="fa-solid fa-scale-balanced"></i> Leave Balances
                    </button>
                    <button
                        onClick={() => { setActiveTab("types"); setSearchTerm(""); setCurrentPage(1); }}
                        className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === "types" ? "border-amber-500 text-amber-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <i className="fa-solid fa-tags"></i> Leave Types
                    </button>
                    <button
                        onClick={() => { setActiveTab("entries"); setSearchTerm(""); setCurrentPage(1); }}
                        className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === "entries" ? "border-amber-500 text-amber-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <i className="fa-solid fa-pen-to-square"></i> Manual Entries
                    </button>
                </div>

                {/* ── Live Search Utilities Bar ── */}
                <div className="px-6 py-5 border-b border-slate-100 bg-white">
                    <div className="relative group w-full max-w-md">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            placeholder={activeTab === "balances" || activeTab === "entries" ? "Search by employee name or code..." : "Search by leave name or code..."}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* ── Table Area ── */}
                <div className="overflow-x-auto min-h-[300px] flex flex-col justify-between">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        {activeTab === "balances" ? <BalancesTableHeader /> : activeTab === "entries" ? <EntriesTableHeader /> : <TypesTableHeader />}
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                            {loading ? (
                                <tr>
                                    <td colSpan={columnCount} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                                            <div className="text-sm font-medium text-slate-500 animate-pulse">Syncing data nodes...</div>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={columnCount} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                                <i className="fa-solid fa-magnifying-glass-minus text-xl text-slate-400" />
                                            </div>
                                            <p className="text-base text-slate-700 font-bold">No results found</p>
                                            <p className="text-sm text-slate-400">{searchTerm ? "Try adjusting your search query." : "No records available."}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : activeTab === "balances" ? (
                                currentItems.map((emp) => (
                                    <tr key={`emp-${emp.empId}`} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{emp.fullName || "Unknown"}</div>
                                            <div className="text-xs font-mono font-bold text-amber-600 mt-0.5">{emp.empCode}</div>
                                        </td>
                                        {leaveTypes.map((t) => {
                                            const bal = emp.byType[t.leaveTypeId];
                                            return (
                                                <td key={t.leaveTypeId} className="px-6 py-4 text-center">
                                                    {bal ? (
                                                        <div className="inline-flex flex-col items-center bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                                            <span className="font-bold text-slate-800 text-sm">{bal.balanceLeaves}</span>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">{bal.usedLeaves}/{bal.totalLeaves} used</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : activeTab === "entries" ? (
                                currentItems.map((entry) => (
                                    <tr key={`entry-${entry.balanceId}`} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{entry.fullName || `EMP-${entry.empId}`}</div>
                                            <div className="text-xs font-mono font-bold text-amber-600 mt-0.5">{entry.empCode}</div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700">{entry.leaveName || entry.leaveCode}</td>
                                        <td className="px-6 py-4 text-center font-mono font-medium text-slate-600">{entry.year}</td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">{entry.totalLeaves}</td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-rose-600">{entry.usedLeaves}</td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-emerald-600">{entry.balanceLeaves}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEditEntryClick(entry)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Edit Entry">
                                                    <i className="fa-solid fa-pen text-[13px]" />
                                                </button>
                                                <button onClick={() => handleDeleteEntry(entry.balanceId)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors" title="Delete Entry">
                                                    <i className="fa-solid fa-trash-can text-[13px]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                currentItems.map((item) => (
                                    <tr key={`type-${item.leaveTypeId}`} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-mono text-[13px] font-bold text-amber-600">{item.leaveCode}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800">{item.leaveName}</td>
                                        <td className="px-6 py-4 text-center font-mono font-medium text-slate-600">{item.maxPerYear} Days</td>
                                        <td className="px-6 py-4 text-center">
                                            {item.carryForward ? (
                                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">Yes</span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">No</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${item.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                {item.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleEditClick(item)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Edit Leave Type">
                                                    <i className="fa-solid fa-pen text-[13px]" />
                                                </button>
                                                <button onClick={() => handleDeleteType(item.leaveTypeId)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors" title="Delete Leave Type">
                                                    <i className="fa-solid fa-trash-can text-[13px]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!loading && filteredData.length > 0 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4 mt-auto">
                            <div>
                                Showing <span className="font-bold text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                                <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of{" "}
                                <span className="font-bold text-slate-800">{filteredData.length}</span> entries
                            </div>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                                </button>
                                <div className="hidden sm:flex items-center px-3 font-bold text-slate-700">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                                >
                                    Next <i className="fa-solid fa-chevron-right text-[10px]" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ➕ Modal popup: ADD LEAVE TYPE */}
            {showTypeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Add Leave Type</h3>
                            <button onClick={() => setShowTypeModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleAddType} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Leave Code *</label>
                                    <input type="text" required value={typeForm.leaveCode} onChange={e => setTypeForm({ ...typeForm, leaveCode: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all uppercase" placeholder="e.g. SL" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Max Per Year *</label>
                                    <input type="number" required min="0" value={typeForm.maxPerYear} onChange={e => setTypeForm({ ...typeForm, maxPerYear: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Leave Name *</label>
                                <input type="text" required value={typeForm.leaveName} onChange={e => setTypeForm({ ...typeForm, leaveName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" placeholder="e.g. Sick Leave" />
                            </div>
                            <div className="flex items-center gap-3 pt-2 pl-1">
                                <input type="checkbox" id="carry" checked={typeForm.carryForward} onChange={e => setTypeForm({ ...typeForm, carryForward: e.target.checked })} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" />
                                <label htmlFor="carry" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Allow Carry Forward</label>
                            </div>
                            <div className="pt-5 border-t border-slate-100">
                                <button type="submit" disabled={actionLoading} className="w-full py-3.5 bg-[#0b2836] hover:bg-[#0f3345] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#0b2836]/20 disabled:opacity-60 hover:-translate-y-0.5">
                                    {actionLoading ? "Saving..." : "Create Leave Type"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✏️ Modal popup: EDIT LEAVE TYPE */}
            {showEditTypeModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Edit Leave Type</h3>
                            <button onClick={() => setShowEditTypeModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateType} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Leave Code *</label>
                                    <input type="text" required value={typeForm.leaveCode} onChange={e => setTypeForm({ ...typeForm, leaveCode: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all uppercase" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Max Per Year *</label>
                                    <input type="number" required min="0" value={typeForm.maxPerYear} onChange={e => setTypeForm({ ...typeForm, maxPerYear: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Leave Name *</label>
                                <input type="text" required value={typeForm.leaveName} onChange={e => setTypeForm({ ...typeForm, leaveName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                            </div>
                            <div className="flex justify-between items-center pt-2 px-1">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={typeForm.carryForward} onChange={e => setTypeForm({ ...typeForm, carryForward: e.target.checked })} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" />
                                    <span className="text-sm font-bold text-slate-700 select-none">Carry Forward</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={typeForm.isActive} onChange={e => setTypeForm({ ...typeForm, isActive: e.target.checked })} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
                                    <span className="text-sm font-bold text-slate-700 select-none">Active</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-4">
                                <button type="button" onClick={() => setShowEditTypeModal(false)} className="flex-1 py-3 text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-3 bg-[#0b2836] hover:bg-[#0f3345] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#0b2836]/20 disabled:opacity-60 hover:-translate-y-0.5">
                                    {actionLoading ? "Updating..." : "Update Type"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ⚡ Modal popup: INITIALIZE BALANCE */}
            {showInitModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Initialize Balances</h3>
                            <button onClick={() => setShowInitModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleInitBalance} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Employee *</label>
                                <select required value={initForm.empId} onChange={e => setInitForm({ ...initForm, empId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all bg-white cursor-pointer">
                                    <option value="" disabled>-- Select Employee --</option>
                                    {employees.map(emp => <option key={emp.empId} value={emp.empId}>{emp.firstName} {emp.lastName} ({emp.empCode})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Year *</label>
                                <input type="number" required min="2020" max={new Date().getFullYear() + 1} value={initForm.year} onChange={e => setInitForm({ ...initForm, year: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                            </div>
                            <div className="pt-5 border-t border-slate-100">
                                <button type="submit" disabled={actionLoading} className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-600/20 disabled:opacity-60 hover:-translate-y-0.5">
                                    {actionLoading ? "Processing..." : "Initialize Balance"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ➕ Modal popup: ADD ENTRY */}
            {showEntryModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Add Leave Balance Entry</h3>
                            <button onClick={() => setShowEntryModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleAddEntry} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Employee *</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required={!entryForm.empId}
                                        value={entryEmpSearchOpen ? entryEmpSearchText : (() => {
                                            const sel = visibleEmployees.find((emp) => String(emp.empId) === String(entryForm.empId));
                                            return sel ? `${sel.firstName} ${sel.lastName} (${sel.empCode})` : "";
                                        })()}
                                        onFocus={() => { setEntryEmpSearchOpen(true); setEntryEmpSearchText(""); }}
                                        onChange={(e) => setEntryEmpSearchText(e.target.value)}
                                        onBlur={() => setTimeout(() => setEntryEmpSearchOpen(false), 200)}
                                        placeholder="-- Search Employee --"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                                    />
                                    {entryEmpSearchOpen && (
                                        <div className="absolute z-50 mt-2 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl">
                                            {(() => {
                                                const q = entryEmpSearchText.trim().toLowerCase();
                                                const filtered = visibleEmployees.filter((emp) => `${emp.firstName} ${emp.lastName} ${emp.empCode}`.toLowerCase().includes(q));
                                                if (filtered.length === 0) return <div className="px-4 py-3 text-sm text-slate-400 font-medium italic">No employees found</div>;
                                                return filtered.map((emp) => (
                                                    <div
                                                        key={emp.empId}
                                                        onMouseDown={() => {
                                                            setEntryForm(prev => ({ ...prev, empId: emp.empId.toString() }));
                                                            setEntryEmpSearchText("");
                                                            setEntryEmpSearchOpen(false);
                                                        }}
                                                        className="px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                                    >
                                                        {emp.firstName} {emp.lastName} <span className="text-slate-400 text-xs ml-1">({emp.empCode})</span>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Leave Type *</label>
                                <select required value={entryForm.leaveTypeId} onChange={e => setEntryForm({ ...entryForm, leaveTypeId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all bg-white cursor-pointer">
                                    <option value="" disabled>-- Select Leave Type --</option>
                                    {leaveTypes.map(t => <option key={t.leaveTypeId} value={t.leaveTypeId}>{t.leaveName} ({t.leaveCode})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Year *</label>
                                    <input type="number" required min="2020" max={new Date().getFullYear() + 1} value={entryForm.year} onChange={e => setEntryForm({ ...entryForm, year: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Total *</label>
                                    <input type="number" required min="0" value={entryForm.totalLeaves} onChange={e => setEntryForm({ ...entryForm, totalLeaves: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Used *</label>
                                    <input type="number" step="0.5" required min="0" value={entryForm.usedLeaves} onChange={e => setEntryForm({ ...entryForm, usedLeaves: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 font-medium ml-1">Balance = Total − Used, automatically calculated on save.</p>
                            <div className="pt-5 border-t border-slate-100">
                                <button type="submit" disabled={actionLoading} className="w-full py-3.5 bg-[#0b2836] hover:bg-[#0f3345] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#0b2836]/20 disabled:opacity-60 hover:-translate-y-0.5">
                                    {actionLoading ? "Saving..." : "Save Entry"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✏️ Modal popup: EDIT ENTRY */}
            {showEditEntryModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Edit Leave Balance Entry</h3>
                            <button onClick={() => setShowEditEntryModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateEntry} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Year</label>
                                    <input type="number" disabled value={entryForm.year} className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Total *</label>
                                    <input type="number" required min="0" value={entryForm.totalLeaves} onChange={e => setEntryForm({ ...entryForm, totalLeaves: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Used *</label>
                                    <input type="number" step="0.5" required min="0" value={entryForm.usedLeaves} onChange={e => setEntryForm({ ...entryForm, usedLeaves: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 font-medium ml-1">Balance = Total − Used, automatically recalculated on save.</p>
                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-4">
                                <button type="button" onClick={() => setShowEditEntryModal(false)} className="flex-1 py-3 text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-3 bg-[#0b2836] hover:bg-[#0f3345] text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-[#0b2836]/20 disabled:opacity-60 hover:-translate-y-0.5">
                                    {actionLoading ? "Updating..." : "Update Entry"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}