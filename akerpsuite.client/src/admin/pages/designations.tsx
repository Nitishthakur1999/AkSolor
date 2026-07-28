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
    const itemsPerPage = 10; // Ek page par 5 records dikhenge

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
        <div className="space-y-6">

            {/* Header Module Section */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Designations Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage hierarchical professional matrix settings and operational tiers.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all shadow-sm"
                >
                    Add Designation
                </button>
            </div>

            {/* 🔍 Search Utilities Control Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">Search Designation:</span>
                <input
                    type="text"
                    placeholder="Search by designation name, department, or tier level..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-bold transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Core Pipeline Records Grid Container Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="text-sm font-semibold text-amber-600 animate-pulse">Syncing matrix data...</div>
                    </div>
                ) : (
                    <div className="flex flex-col justify-between">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-4">Designation Name</th>
                                    <th className="px-6 py-4">Department Target</th>
                                    <th className="px-6 py-4">Hierarchical Level</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Actions Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {currentItems.map((desig) => (
                                    <tr key={desig.desigId} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {desig.designationName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-slate-100 font-sans text-xs font-bold border border-slate-200/60 text-slate-600">
                                                {getDepartmentName(desig.deptId)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                                                Tier Level {desig.designationLevel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${desig.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${desig.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                {desig.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(desig)}
                                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors border border-amber-100/50 focus:outline-none"
                                                title="Edit Designation"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(desig.desigId)}
                                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100/50 focus:outline-none"
                                                title="Delete Designation"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {totalItems === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-slate-400 italic">
                                            No designation records matched the filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* 🔢 PAGINATION WIDGET BAR */}
                        {totalItems > 0 && (
                            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-500">
                                <div>
                                    Showing <span className="text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                                    <span className="text-slate-800">{Math.min(indexOfLastItem, totalItems)}</span> of{" "}
                                    <span className="text-slate-800">{totalItems}</span> entries
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="px-2.5 py-1.5 rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentPage(index + 1)}
                                            className={`px-3 py-1.5 rounded-lg border transition-all ${currentPage === index + 1 ? "bg-amber-600 border-amber-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="px-2.5 py-1.5 rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals structure exactly same as provided */}
            {/* ➕ Modal popup: ADD NEW DESIGNATION */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Create System Designation</h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl font-bold transition-all focus:outline-none"
                                aria-label="Close Modal"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Designation Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Senior Developer"
                                    value={createForm.designationName}
                                    onChange={e => setCreateForm({ ...createForm, designationName: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign Corporate Department</label>
                                <select
                                    required
                                    value={createForm.deptId}
                                    onChange={e => setCreateForm({ ...createForm, deptId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-amber-500 transition-colors"
                                >
                                    <option value="">-- Choose department map segment --</option>
                                    {departments.map(dep => (
                                        <option key={dep.deptId} value={dep.deptId}>
                                            {dep.departmentName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hierarchy Level Tier</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={createForm.designationLevel}
                                    onChange={e => setCreateForm({ ...createForm, designationLevel: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-md shadow-amber-600/10 flex items-center justify-center gap-2"
                            >
                                Save System Designation
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ✏️ Modal popup: EDIT/UPDATE DESIGNATION */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Edit System Designation</h3>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl font-bold transition-all focus:outline-none"
                                aria-label="Close Modal"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Designation Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.designationName}
                                    onChange={e => setEditForm({ ...editForm, designationName: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign Corporate Department</label>
                                <select
                                    required
                                    value={editForm.deptId}
                                    onChange={e => setEditForm({ ...editForm, deptId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-amber-500 transition-colors"
                                >
                                    {departments.map(dep => (
                                        <option key={dep.deptId} value={dep.deptId}>
                                            {dep.departmentName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hierarchy Level Tier</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={editForm.designationLevel}
                                    onChange={e => setEditForm({ ...editForm, designationLevel: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-md shadow-amber-600/10 flex items-center justify-center gap-2"
                            >
                                Update Designation
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}