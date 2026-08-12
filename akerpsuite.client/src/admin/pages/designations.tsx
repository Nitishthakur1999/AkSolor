import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

export default function Designations() {
    const [designations, setDesignations] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔍 Live Search Query State
    const [searchQuery, setSearchQuery] = useState("");

    // 🔢 NEW: Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Ek page par 10 records dikhenge

    // Modals Control Toggles
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Forms Management States
    const [createForm, setCreateForm] = useState<{ designationName: string; designationLevel: string | number; deptId: string }>({ designationName: "", designationLevel: 1, deptId: "" });
    const [editForm, setEditForm] = useState<{ desigId: string; designationName: string; designationLevel: string | number; deptId: string }>({ desigId: "", designationName: "", designationLevel: 1, deptId: "" });

    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    // 🔄 Jab bhi user kuch search kare, page reset karke 1 par le jao
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [desigRes, depRes] = await Promise.all([
                adminService.getDesignations(),
                adminService.getDepartments()
            ]);

            if (desigRes.success) setDesignations(desigRes.data || []);
            if (depRes.success) setDepartments(depRes.data || []);
        } catch (err) {
            console.error("Error connecting structural management backend nodes:", err);
        } finally {
            setLoading(false);
        }
    };

    // ➕ Add/Create Functionality
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.deptId) return alert("Please map a valid Department target.");

        setActionLoading(true);
        try {
            const payload = {
                designationName: createForm.designationName,
                designationLevel: parseInt(String(createForm.designationLevel), 10),
                deptId: parseInt(createForm.deptId, 10)
            };

            const res = await adminService.createDesignation(payload);
            if (res.success) {
                setShowCreateModal(false);
                setCreateForm({ designationName: "", designationLevel: 1, deptId: "" });
                loadInitialData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    // ✏️ Edit Click Trigger Handler
    const openEditModal = (desig) => {
        setEditForm({
            desigId: desig.desigId,
            designationName: desig.designationName,
            designationLevel: desig.designationLevel,
            deptId: desig.deptId.toString()
        });
        setShowEditModal(true);
    };

    // 💾 Update/Save Functionality
    const handleUpdate = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                designationName: editForm.designationName,
                designationLevel: parseInt(String(editForm.designationLevel), 10),
                deptId: parseInt(editForm.deptId, 10)
            };

            const result = await adminService.updateDesignation(editForm.desigId, payload);

            if (result.success || result.Success) {
                setShowEditModal(false);
                loadInitialData();
            } else {
                alert(result.message || result.Message || "Failed to update designation node.");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong while updating the designation.");
        } finally {
            setActionLoading(false);
        }
    };

    // ❌ Delete Functionality
    const handleDelete = async (desigId) => {
        if (!window.confirm("Are you sure you want to completely delete this designation?")) return;

        try {
            const result = await adminService.deleteDesignation(desigId);

            if (result.success || result.Success) {
                loadInitialData(); // fresh list — optimistic filter pe bharosa mat karo
            } else {
                alert(result.message || result.Message || "Failed to drop current designation mapping target configuration node.");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong while deleting the designation.");
        }
    };

    // Helper: ID se Department Name map karne ke liye (ताकि UI par directly string search bhi kaam kare)
    const getDepartmentName = (deptId) => {
        const dept = departments.find(d => d.deptId === deptId);
        return dept ? dept.departmentName : `DEPT-${deptId}`;
    };

    // 🔍 Real-time Filter Processing Engine (Enhanced for better accuracy)
    const filteredDesignations = designations.filter(desig => {
        const query = searchQuery.toLowerCase();
        const deptName = getDepartmentName(desig.deptId).toLowerCase();
        const desigName = (desig.designationName || "").toLowerCase();
        const tierString = `tier level ${desig.designationLevel}`;

        return desigName.includes(query) || deptName.includes(query) || tierString.includes(query);
    });

    // 🔢 NEW: Pagination Calculation Matrix
    const totalItems = filteredDesignations.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDesignations.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-5 pb-10 font-sans">

            {/* ── Compact Header Section (Matched with Roles & Dept Theme) ── */}
            <div className="bg-[#0b2532] rounded-2xl px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-id-badge text-lg text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Designations Management</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Manage hierarchical professional matrix settings and operational tiers.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus" />
                    Add Designation
                </button>
            </div>

            {/* ── Live Search Utilities Bar ── */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Search Designation</label>
                <div className="relative group flex items-center gap-3">
                    <div className="relative flex-1">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by designation name, department, or tier level..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ── Core Pipeline Records Grid Container Table ── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                            <div className="text-sm font-medium text-slate-500 animate-pulse">Syncing matrix data...</div>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                <i className="fa-solid fa-magnifying-glass-minus text-xl text-slate-400" />
                            </div>
                            <p className="text-base text-slate-700 font-bold">No results found</p>
                            <p className="text-sm text-slate-400 mt-1">Try adjusting your search query.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Designation Name</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Department Target</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Hierarchical Level</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {currentItems.map((desig) => (
                                    <tr key={desig.desigId} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-800">{desig.designationName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-md bg-slate-100 font-sans text-xs font-bold border border-slate-200/60 text-slate-600">
                                                {getDepartmentName(desig.deptId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold text-amber-700 bg-amber-50/60 border border-amber-200/50 px-2.5 py-1 rounded-md">
                                                Tier Level {desig.designationLevel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${desig.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${desig.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                {desig.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(desig)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                                                    title="Edit Designation"
                                                >
                                                    <i className="fa-solid fa-pen text-[13px]" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(desig.desigId)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                                                    title="Delete Designation"
                                                >
                                                    <i className="fa-solid fa-trash-can text-[13px]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 🔢 PAGINATION WIDGET BAR */}
                {!loading && totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4">
                        <div>
                            Showing <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                            <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, totalItems)}</span> of{" "}
                            <span className="font-bold text-slate-800">{totalItems}</span> entries
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                            </button>
                            <div className="hidden sm:flex gap-1.5">
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPage(index + 1)}
                                        className={`w-8 h-8 rounded-lg border text-sm font-bold transition-all shadow-sm flex items-center justify-center ${currentPage === index + 1
                                                ? "bg-amber-500 border-amber-500 text-white"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                Next <i className="fa-solid fa-chevron-right text-[10px]" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ➕ Modal popup: ADD NEW DESIGNATION */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-slate-900">Create System Designation</h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Designation Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Senior Developer"
                                    value={createForm.designationName}
                                    onChange={e => setCreateForm({ ...createForm, designationName: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Assign Corporate Department</label>
                                <select
                                    required
                                    value={createForm.deptId}
                                    onChange={e => setCreateForm({ ...createForm, deptId: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                                >
                                    <option value="">-- Choose department map segment --</option>
                                    {departments
                                        .filter(dep => dep.isActive)
                                        .map(dep => (
                                            <option key={dep.deptId} value={dep.deptId}>
                                                {dep.departmentName}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Hierarchy Level Tier</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={createForm.designationLevel}
                                    onChange={e => setCreateForm({ ...createForm, designationLevel: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-2.5 bg-[#0b2836] text-white rounded-xl text-sm font-bold hover:bg-[#0f3345] disabled:opacity-50 transition-colors"
                                >
                                    {actionLoading ? "Saving..." : "Save System Designation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✏️ Modal popup: EDIT/UPDATE DESIGNATION */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-slate-900">Edit System Designation</h3>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Designation Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.designationName}
                                    onChange={e => setEditForm({ ...editForm, designationName: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Assign Corporate Department</label>
                                <select
                                    required
                                    value={editForm.deptId}
                                    onChange={e => setEditForm({ ...editForm, deptId: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                                >
                                    {departments
                                        .filter(dep => dep.isActive)
                                        .map(dep => (
                                            <option key={dep.deptId} value={dep.deptId}>
                                                {dep.departmentName}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Hierarchy Level Tier</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={editForm.designationLevel}
                                    onChange={e => setEditForm({ ...editForm, designationLevel: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-2.5 bg-white text-slate-600 border border-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                                >
                                    {actionLoading ? "Updating..." : "Update Designation"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}