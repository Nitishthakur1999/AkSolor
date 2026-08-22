import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

export default function Roles() {
    // ── Tab Control ──
    const [activeTab, setActiveTab] = useState("roles");

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

    // ── Assign Permissions Tab States ──
    const [allPermissions, setAllPermissions] = useState([]);
    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [assignedPermissionIds, setAssignedPermissionIds] = useState(new Set());
    const [originalPermissionIds, setOriginalPermissionIds] = useState(new Set());
    const [permLoading, setPermLoading] = useState(false);
    const [permSaving, setPermSaving] = useState(false);
    const [moduleSearch, setModuleSearch] = useState("");
    const [saveMsg, setSaveMsg] = useState(null); // { type: 'success'|'error', text }

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (activeTab === "assign" && allPermissions.length === 0) {
            loadPermissions();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedRoleId) {
            loadRolePermissions(selectedRoleId);
        } else {
            setAssignedPermissionIds(new Set());
            setOriginalPermissionIds(new Set());
        }
    }, [selectedRoleId]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const roleRes = await adminService.getRoles();
            if (roleRes.success || roleRes.Success) setRoles(roleRes.data || roleRes.Data || []);
        } catch (err) {
            console.error("Error linking security system parameters:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadPermissions = async () => {
        setPermLoading(true);
        try {
            const res = await adminService.getAllPermissions();
            const list = res.data || res.Data || [];
            setAllPermissions(list.filter(p => p.isActive ?? p.IsActive ?? true));
        } catch (err) {
            console.error("Error loading permissions:", err);
        } finally {
            setPermLoading(false);
        }
    };

    const loadRolePermissions = async (roleId) => {
        setPermLoading(true);
        setSaveMsg(null);
        try {
            const res = await adminService.getRolePermissions(roleId);
            const list = res.data || res.Data || [];
            const ids = new Set(list.map(p => p.permissionId ?? p.PermissionId));
            setAssignedPermissionIds(ids);
            setOriginalPermissionIds(new Set(ids));
        } catch (err) {
            console.error("Error loading role permissions:", err);
        } finally {
            setPermLoading(false);
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
        .filter(r =>
            r.roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    const totalItems = filteredRoles.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRoles.slice(indexOfFirstItem, indexOfLastItem);

    // ── Assign Permissions: group by module ──
    const groupedPermissions = allPermissions.reduce((acc, p) => {
        const mod = p.moduleName ?? p.ModuleName ?? "Other";
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push(p);
        return acc;
    }, {});

    const filteredModuleNames = Object.keys(groupedPermissions)
        .filter(mod => mod.toLowerCase().includes(moduleSearch.toLowerCase()))
        .sort();

    const togglePermission = (permissionId) => {
        setAssignedPermissionIds(prev => {
            const next = new Set(prev);
            if (next.has(permissionId)) next.delete(permissionId);
            else next.add(permissionId);
            return next;
        });
    };

    const toggleModuleAll = (mod, checked) => {
        setAssignedPermissionIds(prev => {
            const next = new Set(prev);
            groupedPermissions[mod].forEach(p => {
                const id = p.permissionId ?? p.PermissionId;
                if (checked) next.add(id);
                else next.delete(id);
            });
            return next;
        });
    };

    const isModuleFullyChecked = (mod) =>
        groupedPermissions[mod].every(p => assignedPermissionIds.has(p.permissionId ?? p.PermissionId));

    const isModulePartiallyChecked = (mod) =>
        !isModuleFullyChecked(mod) &&
        groupedPermissions[mod].some(p => assignedPermissionIds.has(p.permissionId ?? p.PermissionId));

    const moduleCheckedCount = (mod) =>
        groupedPermissions[mod].filter(p => assignedPermissionIds.has(p.permissionId ?? p.PermissionId)).length;

    // ── Global "Select All" across every module ──
    const isAllChecked = () =>
        allPermissions.length > 0 &&
        allPermissions.every(p => assignedPermissionIds.has(p.permissionId ?? p.PermissionId));

    const toggleAllPermissions = () => {
        if (isAllChecked()) {
            setAssignedPermissionIds(new Set());
        } else {
            setAssignedPermissionIds(new Set(allPermissions.map(p => p.permissionId ?? p.PermissionId)));
        }
    };

    const hasChanges = () => {
        if (assignedPermissionIds.size !== originalPermissionIds.size) return true;
        for (const id of assignedPermissionIds) {
            if (!originalPermissionIds.has(id)) return true;
        }
        return false;
    };

    const handleSavePermissions = async () => {
        if (!selectedRoleId) return;
        setPermSaving(true);
        setSaveMsg(null);
        try {
            const toAdd = [...assignedPermissionIds].filter(id => !originalPermissionIds.has(id));
            const toRemove = [...originalPermissionIds].filter(id => !assignedPermissionIds.has(id));

            if (toAdd.length > 0) {
                await adminService.assignRolePermissions({
                    roleId: Number(selectedRoleId),
                    permissionIds: toAdd
                });
            }

            for (const permissionId of toRemove) {
                await adminService.removeRolePermission(selectedRoleId, permissionId);
            }

            setOriginalPermissionIds(new Set(assignedPermissionIds));
            setSaveMsg({ type: "success", text: "Permissions updated successfully." });
        } catch (err) {
            console.error("Error saving permissions:", err);
            setSaveMsg({ type: "error", text: "Failed to save permissions. Please try again." });
        } finally {
            setPermSaving(false);
        }
    };

    // Color coding per action, so the eye can scan by permission type instead of hunting checkboxes
    const actionStyle = (name) => {
        const n = (name || "").toLowerCase();
        if (n.includes("delete")) return { dot: "bg-rose-500", ring: "ring-rose-200", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-300" };
        if (n.includes("approve") || n.includes("manage")) return { dot: "bg-violet-500", ring: "ring-violet-200", text: "text-violet-700", bg: "bg-violet-50", border: "border-violet-300" };
        if (n.includes("create")) return { dot: "bg-emerald-500", ring: "ring-emerald-200", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-300" };
        if (n.includes("update")) return { dot: "bg-sky-500", ring: "ring-sky-200", text: "text-sky-700", bg: "bg-sky-50", border: "border-sky-300" };
        return { dot: "bg-amber-500", ring: "ring-amber-200", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300" }; // View / default
    };

    const selectedRole = roles.find(r => String(r.roleId) === String(selectedRoleId));

    return (
        <div className="space-y-5 pb-10 font-sans">

            {/* ── Compact Header Section (Matched with Sidebar & Dashboard Theme) ── */}
            <div className="bg-[#0b2532] rounded-2xl px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-user-shield text-lg text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Role & Access Management</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Manage system roles and assign module-level permissions dynamically.
                        </p>
                    </div>
                </div>
                {activeTab === "roles" && (
                    <button
                        onClick={() => setShowRoleModal(true)}
                        className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-2"
                    >
                        <i className="fa-solid fa-plus" />
                        Add Role
                    </button>
                )}
            </div>

            {/* ── Tabs ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-1.5 flex gap-1.5 w-fit">
                <button
                    onClick={() => setActiveTab("roles")}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === "roles"
                        ? "bg-[#0b2532] text-white"
                        : "text-slate-500 hover:bg-slate-50"
                        }`}
                >
                    <i className="fa-solid fa-user-shield text-xs" />
                    Roles
                </button>
                <button
                    onClick={() => setActiveTab("assign")}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === "assign"
                        ? "bg-[#0b2532] text-white"
                        : "text-slate-500 hover:bg-slate-50"
                        }`}
                >
                    <i className="fa-solid fa-key text-xs" />
                    Assign Permissions
                </button>
            </div>

            {/* ══════════════════════ TAB: ROLES ══════════════════════ */}
            {activeTab === "roles" && (
                <>
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
                                                            onClick={() => {
                                                                setActiveTab("assign");
                                                                setSelectedRoleId(String(r.roleId));
                                                            }}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 transition-colors"
                                                            title="Assign Permissions"
                                                        >
                                                            <i className="fa-solid fa-key text-[13px]" />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditRoleForm({ roleId: r.roleId, roleName: r.roleName, description: r.description || "" }); setShowEditRoleModal(true); }}
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                                                            title="Edit Role"
                                                        >
                                                            <i className="fa-solid fa-pen text-[13px]" />
                                                        </button>
                                                        {r.roleId !== 1 && (
                                                            <button
                                                                onClick={() => handleDeleteRole(r.roleId)}
                                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                                                                title="Delete Role"
                                                            >
                                                                <i className="fa-solid fa-trash-can text-[13px]" />
                                                            </button>
                                                        )}
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
                </>
            )}

            {/* ══════════════════════ TAB: ASSIGN PERMISSIONS ══════════════════════ */}
            {activeTab === "assign" && (
                <div className="space-y-5">

                    {/* ── Role Selector Card ── */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Select Role</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                value={selectedRoleId}
                                onChange={(e) => setSelectedRoleId(e.target.value)}
                                className="flex-1 px-3.5 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                            >
                                <option value="">— Choose a role to configure —</option>
                                {roles.map(r => (
                                    <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                                ))}
                            </select>

                            {selectedRoleId && (
                                <div className="relative group sm:w-72">
                                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Filter modules..."
                                        value={moduleSearch}
                                        onChange={(e) => setModuleSearch(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                    />
                                </div>
                            )}
                        </div>

                        {selectedRole && (
                            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <i className="fa-solid fa-circle-info text-amber-500" />
                                    Configuring access for <span className="font-bold text-slate-700">{selectedRole.roleName}</span>
                                    {" "}— <span className="font-bold text-slate-700">{assignedPermissionIds.size}</span> / {allPermissions.length} permission(s) selected.
                                </div>

                                {/* Select-all as a switch, distinct look from the pill checkmarks below */}
                                <button
                                    type="button"
                                    onClick={toggleAllPermissions}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                                >
                                    <span className={`relative w-8 h-4.5 rounded-full transition-colors ${isAllChecked() ? "bg-amber-500" : "bg-slate-300"}`} style={{ height: "18px" }}>
                                        <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${isAllChecked() ? "translate-x-3.5" : ""}`} />
                                    </span>
                                    <span className="text-xs font-bold text-slate-600">
                                        {isAllChecked() ? "All selected" : "Select all"}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>

                    {!selectedRoleId ? (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                <i className="fa-solid fa-user-lock text-xl text-slate-400" />
                            </div>
                            <p className="text-base text-slate-700 font-bold">No role selected</p>
                            <p className="text-sm text-slate-400 mt-1">Pick a role above to view and edit its module permissions.</p>
                        </div>
                    ) : permLoading ? (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm py-20 flex flex-col items-center justify-center gap-3">
                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                            <div className="text-sm font-medium text-slate-500 animate-pulse">Loading permission matrix...</div>
                        </div>
                    ) : (
                        <>
                            {/* ── Legend: explains the color-coded action dots used below ── */}
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Legend</span>
                                {[
                                    { label: "View", cls: "bg-amber-500" },
                                    { label: "Create", cls: "bg-emerald-500" },
                                    { label: "Update", cls: "bg-sky-500" },
                                    { label: "Approve / Manage", cls: "bg-violet-500" },
                                    { label: "Delete", cls: "bg-rose-500" },
                                ].map(item => (
                                    <span key={item.label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                        <span className={`w-2 h-2 rounded-full ${item.cls}`} />
                                        {item.label}
                                    </span>
                                ))}
                            </div>

                            {/* ── Module Permission Cards ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredModuleNames.map(mod => {
                                    const total = groupedPermissions[mod].length;
                                    const checkedCount = moduleCheckedCount(mod);
                                    const fully = isModuleFullyChecked(mod);
                                    const partial = isModulePartiallyChecked(mod);

                                    return (
                                        <div key={mod} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-colors ${fully ? "border-amber-300" : "border-slate-200"}`}>
                                            <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-sm font-bold text-slate-800 truncate">{mod}</span>
                                                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/70 text-slate-500">
                                                        {checkedCount}/{total}
                                                    </span>
                                                </div>
                                                {/* Module-level control is a text action, not a second checkbox */}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleModuleAll(mod, !fully)}
                                                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md transition-colors ${fully
                                                        ? "text-amber-700 bg-amber-100 hover:bg-amber-200"
                                                        : partial
                                                            ? "text-slate-600 bg-slate-200 hover:bg-slate-300"
                                                            : "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                                        }`}
                                                >
                                                    {fully ? "Clear" : "Select all"}
                                                </button>
                                            </div>
                                            <div className="p-4 flex flex-wrap gap-2">
                                                {groupedPermissions[mod].map(p => {
                                                    const id = p.permissionId ?? p.PermissionId;
                                                    const name = p.permissionName ?? p.PermissionName;
                                                    const checked = assignedPermissionIds.has(id);
                                                    const style = actionStyle(name);
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={id}
                                                            onClick={() => togglePermission(id)}
                                                            aria-pressed={checked}
                                                            className={`flex items-center gap-1.5 pl-2 pr-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${checked
                                                                ? `${style.bg} ${style.border} ${style.text} ring-1 ${style.ring}`
                                                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                                                                }`}
                                                        >
                                                            <span className={`w-1.5 h-1.5 rounded-full ${checked ? style.dot : "bg-slate-300"}`} />
                                                            {checked && <i className="fa-solid fa-check text-[9px]" />}
                                                            {name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredModuleNames.length === 0 && (
                                    <div className="md:col-span-2 xl:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm py-16 flex flex-col items-center justify-center text-center">
                                        <i className="fa-solid fa-magnifying-glass-minus text-xl text-slate-400 mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">No modules match your filter.</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Sticky Save Bar ── */}
                            <div className="sticky bottom-4 z-10">
                                <div className="bg-[#0b2532] rounded-2xl px-6 py-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                        {saveMsg ? (
                                            <span className={`font-bold flex items-center gap-1.5 ${saveMsg.type === "success" ? "text-emerald-400" : "text-rose-400"}`}>
                                                <i className={`fa-solid ${saveMsg.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`} />
                                                {saveMsg.text}
                                            </span>
                                        ) : hasChanges() ? (
                                            <span className="text-amber-400 font-bold flex items-center gap-1.5">
                                                <i className="fa-solid fa-triangle-exclamation" />
                                                You have unsaved changes.
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-medium">No pending changes.</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSavePermissions}
                                        disabled={!hasChanges() || permSaving}
                                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-2"
                                    >
                                        {permSaving ? (
                                            <><i className="fa-solid fa-spinner animate-spin" /> Saving...</>
                                        ) : (
                                            <><i className="fa-solid fa-floppy-disk" /> Save Permissions</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

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