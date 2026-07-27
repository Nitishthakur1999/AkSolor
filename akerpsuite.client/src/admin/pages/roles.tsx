import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

export default function Roles() {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals Control Toggles
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showEditRoleModal, setShowEditRoleModal] = useState(false);

    // Forms States
    const [roleForm, setRoleForm] = useState({ roleName: "", description: "" });
    const [editRoleForm, setEditRoleForm] = useState({ roleId: "", roleName: "", description: "" });

    // 🔍 ---------------- SEARCH & PAGINATION STATES ----------------
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Matches Designations Management page layout

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const roleRes = await adminService.getRoles();
            if (roleRes.success || roleRes.Success) setRoles(roleRes.data || []);
        } catch (err) {
            console.error("Error linking security system parameters:", err);
        } finally {
            setLoading(false);
        }
    };

    // ➕ Create Role
    const handleCreateRole = async (e) => {
        e.preventDefault();
        try {
            const res = await adminService.createRole(roleForm);
            if (res.success || res.Success) {
                setShowRoleModal(false);
                setRoleForm({ roleName: "", description: "" });
                loadInitialData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // 💾 Update Role
    const handleUpdateRole = async (e) => {
        e.preventDefault();
        try {
            const result = await adminService.updateRole(editRoleForm.roleId, {
                roleName: editRoleForm.roleName,
                description: editRoleForm.description
            });

            if (result.success || result.Success) {
                setShowEditRoleModal(false);
                loadInitialData();
            }
        } catch (err) {
            console.error("Update Role Error:", err);
        }
    };

    // ❌ Delete Role
    const handleDeleteRole = async (roleId) => {
        if (!window.confirm("Are you sure you want to completely delete this role?")) return;
        try {
            await adminService.deleteRole(roleId);
            await loadInitialData();
        } catch (err) {
            console.error("Delete Role Error:", err);
            alert("Failed to delete role. Please try again.");
        }
    };

    // 🔍 ---------------- SEARCH & PAGINATION COMPUTATION ----------------
    const filteredRoles = roles
        .filter(r => r.roleId !== 1)
        .filter(r =>
            r.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    const totalItems = filteredRoles.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header Section — matches Designations Management page */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Role Management</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage system roles and their access scope across the organization.</p>
                </div>
                <button onClick={() => setShowRoleModal(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm ring-1 ring-inset ring-indigo-700">
                    Add Role
                </button>
            </div>

            {/* Search Bar — matches Designations Management page */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Role</label>
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by role name or description..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Main Table — matches Designations Management page */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <div className="h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                            <div className="text-sm font-medium text-slate-500 animate-pulse">Fetching authorization schemas...</div>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-base text-slate-600 font-medium">No results found</p>
                            <p className="text-sm text-slate-400 mt-1">Try adjusting your search query.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Role Name</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/2">Description</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-sm">
                                {currentItems.map((r) => (
                                    <tr key={r.roleId} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-semibold text-slate-900">{r.roleName}</td>
                                        <td className="px-6 py-4 text-slate-600 whitespace-normal line-clamp-2">
                                            {r.description || <span className="text-slate-400 italic">No description mapped.</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${r.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/10"}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${r.isActive ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                                                {r.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => { setEditRoleForm({ roleId: r.roleId, roleName: r.roleName, description: r.description || "" }); setShowEditRoleModal(true); }} className="px-3 py-1.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">Edit</button>
                                                <button onClick={() => handleDeleteRole(r.roleId)} className="px-3 py-1.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 🔢 PAGINATION CONTROL BAR — matches Designations Management page */}
                {!loading && totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-500 gap-4">
                        <div>
                            Showing <span className="font-semibold text-slate-900">{indexOfFirstItem + 1}</span> to{" "}
                            <span className="font-semibold text-slate-900">{Math.min(indexOfLastItem, totalItems)}</span> of{" "}
                            <span className="font-semibold text-slate-900">{totalItems}</span> entries
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Previous
                            </button>
                            <div className="hidden sm:flex gap-1.5">
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPage(index + 1)}
                                        className={`px-3.5 py-1.5 rounded-lg border text-sm font-medium transition-all shadow-sm ${currentPage === index + 1 ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ➕ Modal popup: ADD ROLE */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Create Role</h3>
                            <button type="button" onClick={() => setShowRoleModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleCreateRole} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Role Name</label>
                                <input type="text" required placeholder="e.g., Audit Team, HR Intern" value={roleForm.roleName} onChange={e => setRoleForm({ ...roleForm, roleName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                                <textarea rows={3} value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors">Save Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✏️ Modal popup: EDIT ROLE */}
            {showEditRoleModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-900">Edit Role</h3>
                            <button type="button" onClick={() => setShowEditRoleModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Role Name</label>
                                <input type="text" required value={editRoleForm.roleName} onChange={e => setEditRoleForm({ ...editRoleForm, roleName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                                <textarea rows={3} value={editRoleForm.description} onChange={e => setEditRoleForm({ ...editRoleForm, description: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-sm transition-colors">Update Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}