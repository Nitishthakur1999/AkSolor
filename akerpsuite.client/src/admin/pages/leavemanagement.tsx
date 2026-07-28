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

    useEffect(() => {
        loadData();
        setCurrentPage(1);
    }, [activeTab]);

    // getEmployees() only runs once on mount — the employee list never
    // changes with the tab, so there's no need to re-fetch on every switch.
    useEffect(() => {
        adminService.getEmployees().then(res => {
            if (res.Success || res.success) setEmployees(res.Data || res.data || []);
        });
    }, []);

    // 🆕 leaveTypes is also needed on the "balances" tab now (to build the
    // pivoted column headers), so it's fetched once on mount independent of
    // which tab is active — not just when the user visits the "types" tab.
    useEffect(() => {
        adminService.getLeaveTypes().then(res => {
            if (res.Success || res.success) setLeaveTypes(res.Data || res.data || []);
        }).catch(err => console.error("Error fetching leave types:", err));
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === "balances") {
                const res = await adminService.getAllLeaveBalances();
                if (res.Success || res.success) setLeaveBalances(res.Data || res.data || []);
            } else if (activeTab === "types") {
                const res = await adminService.getLeaveTypes();
                if (res.Success || res.success) setLeaveTypes(res.Data || res.data || []);
            }
        } catch (err) {
            console.error(err);
            // "balance/all" is CMD/Admin/HR only on the backend. A Manager
            // hitting this tab previously just got an empty table with no
            // explanation — indistinguishable from "no data exists".
            if (activeTab === "balances") {
                alert("Failed to load leave balances. You may not have permission to view this data.");
            } else {
                alert("Failed to load leave types.");
            }
        } finally {
            setLoading(false);
        }
    };

    // 🆕 Pivot leaveBalances (one row per emp+leaveType) into one row per
    // employee, with each leave type's total/used/balance keyed by leaveTypeId.
    // This is what lets the table show a single row per person instead of a
    // separate row for every leave type they have a balance for.
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

    // 🎯 Filter Data with useMemo for performance
    // Restrict search to sensible text fields per tab, rather than matching
    // against every field (which previously matched numeric ids too).
    const SEARCHABLE_FIELDS = {
        balances: ["fullName", "empCode"], // 🆕 leaveName removed — no longer a per-row field
        types: ["leaveCode", "leaveName"],
    };
    const filteredData = useMemo(() => {
        const currentData = activeTab === "balances" ? groupedBalances : leaveTypes;
        if (!searchTerm) return currentData;
        const q = searchTerm.toLowerCase();
        const fields = SEARCHABLE_FIELDS[activeTab] || [];
        return currentData.filter(item => fields.some(f => (item[f] ?? "").toString().toLowerCase().includes(q)));
    }, [activeTab, groupedBalances, leaveTypes, searchTerm]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentItems = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // 🎯 Actions
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
            // 🆕 FK constraint error — leave type already has balances/requests tied
            // to it, so it can't be hard-deleted. Offer to deactivate instead.
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

    // 🆕 Sub-component: Balances table header — one column per leave type
    // (built dynamically from leaveTypes), instead of a single "Leave Type" column.
    const BalancesTableHeader = () => (
        <thead className="bg-white border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wide">
            <tr>
                <th className="px-6 py-4">Employee</th>
                {leaveTypes.map((t) => (
                    <th key={t.leaveTypeId} className="px-6 py-4 text-center">{t.leaveName}</th>
                ))}
            </tr>
        </thead>
    );

    const TypesTableHeader = () => (
        <thead className="bg-white border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wide">
            <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Leave Name</th>
                <th className="px-6 py-4">Max/Year</th>
                <th className="px-6 py-4">Carry Fwd</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
            </tr>
        </thead>
    );

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Leave Settings & Balances</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Manage leave types and employee balances.</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === "types" && (
                        <button onClick={() => setShowTypeModal(true)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition">
                            + Add Leave Type
                        </button>
                    )}
                    {activeTab === "balances" && (
                        <button onClick={() => setShowInitModal(true)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition">
                            Initialize Balance
                        </button>
                    )}
                </div>
            </div>

            {/* Core Workspace */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">

                {/* Tabs & Search */}
                <div className="flex flex-col sm:flex-row justify-between items-center border-b border-slate-200 p-2">
                    <div className="flex overflow-x-auto w-full sm:w-auto">
                        {[{ key: "balances", label: "Balances" }, { key: "types", label: "Leave Types" }].map(tab => (
                            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(""); setCurrentPage(1); }}
                                className={`px-6 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeTab === tab.key ? "border-b-2 border-slate-800 text-slate-800" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-2 w-full sm:w-64">
                        <input type="text" placeholder="Search records..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all bg-white" />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[300px]">
                    <table className="w-full text-left border-collapse">
                        {activeTab === "balances" ? <BalancesTableHeader /> : <TypesTableHeader />}
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                            {loading ? (
                                <tr><td colSpan={activeTab === "balances" ? leaveTypes.length + 1 : 6} className="px-6 py-8 text-center text-sm font-medium text-slate-500">Loading data...</td></tr>
                            ) : currentItems.length === 0 ? (
                                <tr><td colSpan={activeTab === "balances" ? leaveTypes.length + 1 : 6} className="px-6 py-8 text-center text-slate-400 font-medium">{searchTerm ? "No matching records found." : "No records found."}</td></tr>
                            ) : activeTab === "balances" ? (
                                // 🆕 One row per employee — a cell per leave type showing
                                // used/total and remaining balance, or a placeholder dash
                                // if that employee has no balance initialized for that type.
                                currentItems.map((emp) => (
                                    <tr key={`emp-${emp.empId}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3.5 font-semibold text-slate-800">{emp.fullName || emp.empCode}</td>
                                        {leaveTypes.map((t) => {
                                            const bal = emp.byType[t.leaveTypeId];
                                            return (
                                                <td key={t.leaveTypeId} className="px-6 py-3.5 text-center">
                                                    {bal ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-bold text-slate-700">{bal.balanceLeaves}</span>
                                                            <span className="text-[11px] text-slate-400">{bal.usedLeaves}/{bal.totalLeaves} used</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300">—</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                currentItems.map((item) => (
                                    <tr key={`type-${item.leaveTypeId}`} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3.5 font-medium text-slate-800">{item.leaveCode}</td>
                                        <td className="px-6 py-3.5 text-slate-500">{item.leaveName}</td>
                                        <td className="px-6 py-3.5">{item.maxPerYear} Days</td>
                                        <td className="px-6 py-3.5">{item.carryForward ? "Yes" : "No"}</td>
                                        <td className="px-6 py-3.5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                                                {item.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-center">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => handleEditClick(item)} className="px-4 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold rounded-2xl text-sm transition-colors">Edit</button>
                                                <button onClick={() => handleDeleteType(item.leaveTypeId)} className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl text-sm transition-colors">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex justify-between items-center p-4 border-t border-slate-100 bg-white">
                        <span className="text-sm text-slate-500 font-medium">Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50 transition">Prev</button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm hover:bg-slate-50 disabled:opacity-50 transition">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Add Leave Type */}
            {showTypeModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Add Leave Type</h3>
                            <button onClick={() => setShowTypeModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 text-lg font-bold transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleAddType} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Code *</label><input type="text" required value={typeForm.leaveCode} onChange={e => setTypeForm({ ...typeForm, leaveCode: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Max Per Year *</label><input type="number" required min="0" value={typeForm.maxPerYear} onChange={e => setTypeForm({ ...typeForm, maxPerYear: parseInt(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all" /></div>
                            </div>
                            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Leave Name *</label><input type="text" required value={typeForm.leaveName} onChange={e => setTypeForm({ ...typeForm, leaveName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all" /></div>
                            <div className="flex items-center gap-2 pt-2"><input type="checkbox" id="carry" checked={typeForm.carryForward} onChange={e => setTypeForm({ ...typeForm, carryForward: e.target.checked })} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" /><label htmlFor="carry" className="text-sm font-medium text-slate-700 select-none">Allow Carry Forward</label></div>
                            <div className="pt-2"><button type="submit" disabled={actionLoading} className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm transition disabled:opacity-60">{actionLoading ? "Saving..." : "Create Leave Type"}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Leave Type */}
            {showEditTypeModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Edit Leave Type</h3>
                            <button onClick={() => setShowEditTypeModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 text-lg font-bold transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleUpdateType} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Code *</label><input type="text" required value={typeForm.leaveCode} onChange={e => setTypeForm({ ...typeForm, leaveCode: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Max Per Year *</label><input type="number" required min="0" value={typeForm.maxPerYear} onChange={e => setTypeForm({ ...typeForm, maxPerYear: parseInt(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all" /></div>
                            </div>
                            <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Leave Name *</label><input type="text" required value={typeForm.leaveName} onChange={e => setTypeForm({ ...typeForm, leaveName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all" /></div>
                            <div className="flex justify-between items-center pt-2">
                                <div className="flex items-center gap-2"><input type="checkbox" id="edit-carry" checked={typeForm.carryForward} onChange={e => setTypeForm({ ...typeForm, carryForward: e.target.checked })} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" /><label htmlFor="edit-carry" className="text-sm font-medium text-slate-700 select-none">Carry Forward</label></div>
                                <div className="flex items-center gap-2"><input type="checkbox" id="edit-active" checked={typeForm.isActive} onChange={e => setTypeForm({ ...typeForm, isActive: e.target.checked })} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" /><label htmlFor="edit-active" className="text-sm font-medium text-slate-700 select-none">Active</label></div>
                            </div>
                            <div className="pt-2"><button type="submit" disabled={actionLoading} className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm transition disabled:opacity-60">{actionLoading ? "Updating..." : "Update Type"}</button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Initialize Balance */}
            {showInitModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Initialize Balances</h3>
                            <button onClick={() => setShowInitModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 text-lg font-bold transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleInitBalance} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Employee *</label>
                                <select required value={initForm.empId} onChange={e => setInitForm({ ...initForm, empId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all bg-white">
                                    <option value="" disabled>-- Select Employee --</option>
                                    {employees.map(emp => <option key={emp.empId} value={emp.empId}>{emp.firstName} {emp.lastName} ({emp.empCode})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Year *</label>

                                <input type="number" required min="2020" max={new Date().getFullYear() + 1} value={initForm.year} onChange={e => setInitForm({ ...initForm, year: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all" />
                            </div>
                            <div className="pt-2"><button type="submit" disabled={actionLoading} className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm transition disabled:opacity-60">{actionLoading ? "Processing..." : "Initialize Balance"}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}