import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

export default function Departments() {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔍 Live Search Query State
    const [searchQuery, setSearchQuery] = useState("");

    // 🔢 NEW: Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Ek page par max 5 rows dikhenge

    // Modals Control Toggles
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Forms Management States (Matching DepartmentRequestDto structure)
    const [createForm, setCreateForm] = useState({ departmentName: "", departmentCode: "", parentDepartmentId: null });
    const [editForm, setEditForm] = useState({ deptId: "", departmentName: "", departmentCode: "", parentDepartmentId: null });

    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadDeps();
    }, []);

    // 🔄 Jab bhi user kuch type karega, page 1 par reset ho jayega
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const loadDeps = async () => {
        setLoading(true);
        try {
            const res = await adminService.getDepartments();
            if (res.success) {
                setDepartments(res.data || []);
            }
        } catch (err) {
            console.error("Error connecting departments node:", err);
        } finally {
            setLoading(false);
        }
    };

    // ➕ Add/Create Functionality
    const handleCreate = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                departmentName: createForm.departmentName,
                departmentCode: createForm.departmentCode,
                parentDepartmentId: createForm.parentDepartmentId ? parseInt(createForm.parentDepartmentId, 10) : null
            };

            const res = await adminService.createDepartment(payload);
            if (res.success) {
                setShowCreateModal(false);
                setCreateForm({ departmentName: "", departmentCode: "", parentDepartmentId: null });
                loadDeps();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    // ✏️ Edit Click Trigger Handler
    const openEditModal = (dep) => {
        setEditForm({
            deptId: dep.deptId,
            departmentName: dep.departmentName,
            departmentCode: dep.departmentCode || "",
            parentDepartmentId: dep.parentDeptId ? dep.parentDeptId.toString() : ""
        });
        setShowEditModal(true);
    };

    // 💾 Update/Save Functionality
    // 💾 Update/Save Functionality
    const handleUpdate = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                departmentName: editForm.departmentName,
                departmentCode: editForm.departmentCode,
                parentDepartmentId: editForm.parentDepartmentId ? parseInt(editForm.parentDepartmentId, 10) : null
            };

            const result = await adminService.updateDepartment(editForm.deptId, payload);

            if (result.success || result.Success) {
                setShowEditModal(false);
                loadDeps();
            } else {
                alert(result.message || result.Message || "Failed to update department node.");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong while updating the department.");
        } finally {
            setActionLoading(false);
        }
    };

    // ❌ Delete Functionality
    const handleDelete = async (deptId) => {
        if (!window.confirm("Are you sure you want to completely delete this department?")) return;

        try {
            const result = await adminService.deleteDepartment(deptId);

            if (result.success || result.Success) {
                loadDeps(); // fresh list — optimistic filter pe bharosa mat karo
            } else {
                alert(result.message || result.Message || "Failed to delete target department branch.");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong while deleting the department.");
        }
    };

    // Helper: ID to Parent Department Name mapper
    const getParentDeptName = (parentDeptId) => {
        if (!parentDeptId) return null;
        const parent = departments.find(d => d.deptId === parentDeptId);
        return parent ? parent.departmentName : `ID: ${parentDeptId}`;
    };

    // 🔍 Real-time Filter Processing
    const filteredDepartments = departments.filter(dep => {
        const query = searchQuery.toLowerCase();
        const parentName = getParentDeptName(dep.parentDeptId)?.toLowerCase() || "";
        return (
            (dep.departmentName || "").toLowerCase().includes(query) ||
            (dep.departmentCode || "").toLowerCase().includes(query) ||
            parentName.includes(query)
        );
    });

    // 🔢 NEW: Pagination Calculation Matrix
    const totalItems = filteredDepartments.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredDepartments.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-6">
            {/* Header Module Section */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Departments Hub</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage organizational core operational departments and system structural zones.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm"
                >
                    Add Department
                </button>
            </div>

            {/* Live Search Utilities Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">Search Department:</span>
                <input
                    type="text"
                    placeholder="Search by department name, short code, or parent division..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
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

            {/* Core Pipeline Records Table Layout */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="text-sm font-semibold text-indigo-600 animate-pulse">Syncing nodes...</div>
                    </div>
                ) : (
                    <div className="flex flex-col justify-between">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                                    <th className="px-6 py-4">Department Name</th>
                                    <th className="px-6 py-4">Code</th>
                                    <th className="px-6 py-4">Parent Dept Mapping</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Actions Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {currentItems.map((dep) => (
                                    <tr key={dep.deptId} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {dep.departmentName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded bg-slate-100 font-mono text-xs text-slate-600 border border-slate-200/60">
                                                {dep.departmentCode || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                            {dep.parentDeptId ? (
                                                <span className="px-2 py-1 rounded bg-indigo-50/60 border border-indigo-100/40 text-indigo-700 font-semibold">
                                                    {getParentDeptName(dep.parentDeptId)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">Root Layer node</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${dep.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${dep.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                                                {dep.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(dep)}
                                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100/50 focus:outline-none"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(dep.deptId)}
                                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100/50 focus:outline-none"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {totalItems === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-slate-400 italic">
                                            No structural organizational department records registered.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* 🔢 PAGINATION MATRIX CONTROLS */}
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
                                            className={`px-3 py-1.5 rounded-lg border transition-all ${currentPage === index + 1 ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
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

            {/* Modals Logic Structures (Add & Edit) */}
            {/* ➕ Modal popup: ADD NEW DEPARTMENT */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Add New Department</h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl font-bold transition-all focus:outline-none"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Human Resources"
                                    value={createForm.departmentName}
                                    onChange={e => setCreateForm({ ...createForm, departmentName: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., HR"
                                    value={createForm.departmentCode}
                                    onChange={e => setCreateForm({ ...createForm, departmentCode: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/10"
                            >
                                Save Department
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ✏️ Modal popup: EDIT/UPDATE DEPARTMENT */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Edit Corporate Department</h3>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl font-bold transition-all focus:outline-none"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.departmentName}
                                    onChange={e => setEditForm({ ...editForm, departmentName: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department Code</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.departmentCode}
                                    onChange={e => setEditForm({ ...editForm, departmentCode: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hierarchical Parent Department</label>
                                <select
                                    value={editForm.parentDepartmentId || ""}
                                    onChange={e => setEditForm({ ...editForm, parentDepartmentId: e.target.value || null })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- No Parent (Root Division Layer) --</option>
                                    {departments.filter(d => d.deptId !== editForm.deptId).map(d => (
                                        <option key={d.deptId} value={d.deptId}>{d.departmentName}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/10"
                            >
                                Update Department
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}