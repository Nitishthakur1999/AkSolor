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
    const itemsPerPage = 10;

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
        <div className="space-y-5 pb-10 font-sans">

            {/* ── Compact Header Section (Matched with Sidebar & Dashboard Theme) ── */}
            <div className="bg-[#0b2532] rounded-2xl px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-user-shield text-lg text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Role Management</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Manage system roles and their access scope across the organization.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowRoleModal(true)}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-2"
                >
                    <i className="fa-solid fa-plus" />
                    Add Role
                </button>
            </div>

            {/* ── Search Bar ── */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Search Role</label>
                <div className="relative group">
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by role name or description..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* ── Main Table Card ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                            <div className="text-sm font-medium text-slate-500 animate-pulse">Fetching roles...</div>
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
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role Name</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-1/2">Description</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {currentItems.map((r) => (
                                    <tr key={r.roleId} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-800">{r.roleName}</span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 whitespace-normal line-clamp-2">
                                            {r.description || <span className="text-slate-400 italic text-xs">No description mapped.</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${r.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${r.isActive ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                                                {r.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => { setEditRoleForm({ roleId: r.roleId, roleName: r.roleName, description: r.description || "" }); setShowEditRoleModal(true); }}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                                                    title="Edit Role"
                                                >
                                                    <i className="fa-solid fa-pen text-[13px]" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRole(r.roleId)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                                                    title="Delete Role"
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

                {/* 🔢 PAGINATION CONTROL BAR */}
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

            {/* ➕ Modal popup: ADD ROLE */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-slate-900">Create Role</h3>
                            <button type="button" onClick={() => setShowRoleModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRole} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Role Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Audit Team, HR Intern"
                                    value={roleForm.roleName}
                                    onChange={e => setRoleForm({ ...roleForm, roleName: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe the access level for this role..."
                                    value={roleForm.description}
                                    onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all resize-none"
                                />
                            </div>
                            <div className="pt-2">
                                <button type="submit" className="w-full py-2.5 bg-[#0b2836] text-white rounded-xl text-sm font-bold hover:bg-[#0f3345] transition-colors">
                                    Save Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✏️ Modal popup: EDIT ROLE */}
            {showEditRoleModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-bold text-slate-900">Edit Role</h3>
                            <button type="button" onClick={() => setShowEditRoleModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateRole} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Role Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editRoleForm.roleName}
                                    onChange={e => setEditRoleForm({ ...editRoleForm, roleName: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Description</label>
                                <textarea
                                    rows={3}
                                    value={editRoleForm.description}
                                    onChange={e => setEditRoleForm({ ...editRoleForm, description: e.target.value })}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all resize-none"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => setShowEditRoleModal(false)} className="flex-1 py-2.5 bg-white text-slate-600 border border-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors">
                                    Update Role
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}