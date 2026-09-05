import { useEffect, useState, useMemo } from "react";
import { adminService } from "@/services/adminService";

const ROLE_HIERARCHY = {
    cmd: 1,
    admin: 2,
    hr: 3,
    manager: 4,
    accounts: 4,
    sales: 4,
    inventory: 4,
    employee: 5,
};

const getLevel = (role) => ROLE_HIERARCHY[role?.toLowerCase()] ?? Number.MAX_SAFE_INTEGER;

export default function PageManagement() {
    // 2 Tabs now: 'table' (All Pages), 'assign' (Assign Roles)
    const [activeTab, setActiveTab] = useState("table");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // 🆕 Non-blocking toast state (alert() ki jagah)
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(timer);
    }, [toast]);

    // Data States
    const [roles, setRoles] = useState([]);
    const [allPages, setAllPages] = useState<any[]>([]);

    // Table & Pagination States
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Assign Pages States
    const [selectedRole, setSelectedRole] = useState("");
    const [assignedPageIds, setAssignedPageIds] = useState([]);

    // 🔒 Current logged-in user's role
    const currentUserRole = useMemo(() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return "";
            const payload = JSON.parse(atob(token.split(".")[1]));
            return (
                payload.role ||
                payload.Role ||
                payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
                ""
            ).toLowerCase();
        } catch (err) {
            console.error("Failed to decode token for current role:", err);
            return "";
        }
    }, []);

    // Add/Edit Modal State
    const [showPageModal, setShowPageModal] = useState(false);
    const [editingPageId, setEditingPageId] = useState(null);
    const [pageForm, setPageForm] = useState({
        pageName: "", pageLink: "", pageIcon: "fa-solid fa-circle", pageType: "General"
    });

    // 🚀 INITIAL DATA LOAD
    useEffect(() => {
        loadInitialData();
    }, []);

    // 🚀 FETCH ROLE PAGES ON ROLE SELECTION
    useEffect(() => {
        if (selectedRole && activeTab === "assign") {
            fetchRolePages(selectedRole);
        } else {
            setAssignedPageIds([]);
        }
    }, [selectedRole, activeTab]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [rolesRes, pagesRes] = await Promise.all([
                adminService.getRoles(),
                adminService.getAllPages()
            ]);

            if (rolesRes.Success || rolesRes.success) {
                setRoles(rolesRes.Data || rolesRes.data || []);
            }

            if (pagesRes.Success || pagesRes.success) {
                const pagesArray = pagesRes.Data || pagesRes.data || [];
                setAllPages(pagesArray);
            }
        } catch (err) {
            console.error("Failed to load initial data", err);
        } finally {
            setLoading(false);
        }
    };

    // --- TABLE & SEARCH LOGIC ---
    const filteredPages = useMemo(() => {
        if (!searchTerm) return allPages;
        return allPages.filter(item => {
            const pName = item.pageName || item.PageName || item.name || item.Name || item.title || "";
            const pLink = item.pageLink || item.PageLink || item.link || item.Link || item.url || "";
            const pType = item.pageType || item.PageType || item.type || item.Type || item.module || "";

            const searchStr = `${pName} ${pLink} ${pType}`.toLowerCase();
            return searchStr.includes(searchTerm.toLowerCase());
        });
    }, [allPages, searchTerm]);

    const totalItems = filteredPages.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const currentPages = filteredPages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Pagination Calculations
    const startEntry = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endEntry = Math.min(currentPage * itemsPerPage, totalItems);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

    // --- ADD / EDIT LOGIC ---
    const handleSavePage = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            let res;
            if (editingPageId) {
                const updatePayload = {
                    pageId: editingPageId,
                    ...pageForm
                };
                res = await adminService.updatePage(updatePayload);
            } else {
                res = await adminService.createPage(pageForm);
            }

            if (res.Success || res.success) {
                setToast({ type: "success", message: `Page ${editingPageId ? 'updated' : 'added'} successfully!` });
                resetForm();
                setShowPageModal(false);
                loadInitialData();
            } else {
                setToast({ type: "error", message: res.Message || "Failed to save page" });
            }
        } catch (err) {
            console.error(err);
            setToast({ type: "error", message: "API Error: Please check console." });
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddClick = () => {
        resetForm();
        setShowPageModal(true);
    };

    const handleEditClick = (page) => {
        setEditingPageId(page.pageId || page.PageId || page.id || page.Id);
        setPageForm({
            pageName: page.pageName || page.PageName || page.name || page.Name || page.title || "",
            pageLink: page.pageLink || page.PageLink || page.link || page.Link || page.url || "",
            pageIcon: page.pageIcon || page.PageIcon || page.icon || page.Icon || "fa-solid fa-circle",
            pageType: page.pageType || page.PageType || page.type || page.Type || page.module || "General"
        });
        setShowPageModal(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm("Are you sure you want to delete this page?")) {
            try {
                const res = await adminService.deletePage(id);
                if (res.Success || res.success) loadInitialData();
                else setToast({ type: "error", message: res.Message || "Failed to delete page" });
            } catch (err) { console.error(err); }
        }
    };

    const resetForm = () => {
        setEditingPageId(null);
        setPageForm({ pageName: "", pageLink: "", pageIcon: "fa-solid fa-circle", pageType: "General" });
    };

    // --- ASSIGN LOGIC ---
    const fetchRolePages = async (roleId) => {
        try {
            const res = await adminService.getRolePages(roleId);
            if (res.Success || res.success) {
                const pages = res.Data || res.data || [];
                setAssignedPageIds(pages.map(p => Number(p.pageId || p.PageId || p.id || p.Id)));
            }
        } catch (err) { console.error("Error fetching role pages:", err); }
    };

    const handleCheckboxChange = (pageId) => {
        const id = Number(pageId);
        setAssignedPageIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const allPageIds = useMemo(() => allPages.map(p => Number(p.pageId || p.PageId || p.id || p.Id)), [allPages]);
    const isAllSelected = allPageIds.length > 0 && allPageIds.every(id => assignedPageIds.includes(id));

    const handleSelectAllChange = () => {
        if (isAllSelected) setAssignedPageIds([]);
        else setAssignedPageIds(allPageIds);
    };

    const handleSaveAssignment = async () => {
        if (!selectedRole) {
            setToast({ type: "error", message: "Please select a role first!" });
            return;
        }
        setActionLoading(true);
        try {
            const payload = {
                roleId: parseInt(selectedRole),
                pageIds: assignedPageIds.join(",")
            };
            const res = await adminService.updateRolePages(payload);
            if (res.Success || res.success) {
                setToast({ type: "success", message: "Pages assigned successfully!" });
                setSelectedRole("");
                setAssignedPageIds([]);
            } else {
                setToast({ type: "error", message: res.Message || "Failed to assign pages." });
            }
        } catch (err) {
            console.error(err);
            setToast({ type: "error", message: "Failed to assign pages. Please check console." });
        }
        finally { setActionLoading(false); }
    };

    // --- GROUP PAGES FOR UI ---
    const groupedPages = allPages.reduce((acc: Record<string, any[]>, page: any) => {
        const type = page.pageType || page.PageType || page.type || page.Type || page.module || "General";
        if (!acc[type]) acc[type] = [];
        acc[type].push(page);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="space-y-5 pb-10 font-sans relative">

            {/* 🆕 TOAST NOTIFICATION */}
            {toast && (
                <div className={`fixed top-8 right-8 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold text-white transition-all animate-in slide-in-from-top-5 duration-300 ${toast.type === "success" ? "bg-emerald-600 border border-emerald-500" : "bg-rose-600 border border-rose-500"}`}>
                    <i className={`fa-solid ${toast.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"} text-lg`} />
                    {toast.message}
                </div>
            )}

            {/* ── Compact Header Section ── */}
            <div className="bg-[#0b2532] rounded-2xl px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-file-shield text-lg text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Page Access Control</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Manage system pages and map module permissions dynamically.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Main Container With Tabs ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

                {/* ── Tabs Navigation ── */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50">
                    <button
                        onClick={() => setActiveTab("table")}
                        className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === "table" ? "border-amber-500 text-amber-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <i className="fa-solid fa-list-ul"></i> All Master Pages
                    </button>
                    <button
                        onClick={() => setActiveTab("assign")}
                        className={`px-6 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === "assign" ? "border-amber-500 text-amber-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <i className="fa-solid fa-user-check"></i> Assign Page Roles
                    </button>
                </div>

                <div className="min-h-[400px]">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-3">
                            <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                            <div className="text-sm font-medium text-slate-500 animate-pulse">Loading system structure...</div>
                        </div>
                    ) : (
                        <>
                            {/* ── TAB 1: ALL PAGES TABLE ── */}
                            {activeTab === "table" && (
                                <div className="flex flex-col h-full">
                                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
                                        <div className="relative group w-full sm:flex-1 max-w-md">
                                            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Search by page name, link, or module..."
                                                value={searchTerm}
                                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                                className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddClick}
                                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <i className="fa-solid fa-plus" /> Add Master Page
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse whitespace-nowrap">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Page Name</th>
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Link (URL)</th>
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Module Group</th>
                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions Operations</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {currentPages.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="py-20 text-center">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                                                    <i className="fa-solid fa-folder-open text-xl text-slate-400" />
                                                                </div>
                                                                <p className="text-base text-slate-700 font-bold">No pages found</p>
                                                                <p className="text-sm text-slate-400 mt-1">Try adjusting your search criteria.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : currentPages.map((page, idx) => {
                                                    const pId = page.pageId || page.PageId || page.id || page.Id;
                                                    const pName = page.pageName || page.PageName || page.name || page.Name || page.title;
                                                    const pLink = page.pageLink || page.PageLink || page.link || page.Link || page.url;
                                                    const pType = page.pageType || page.PageType || page.type || page.Type || page.module;
                                                    const pIcon = page.pageIcon || page.PageIcon || page.icon || page.Icon;

                                                    return (
                                                        <tr key={pId || idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                                                        <i className={`${pIcon || "fa-solid fa-file"} text-slate-400 text-sm`} />
                                                                    </div>
                                                                    <span className="font-bold text-slate-800">{pName || "Unknown Page"}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md font-mono text-[11px] text-slate-600 font-semibold">
                                                                    {pLink || "-"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-3 py-1 bg-amber-50/60 border border-amber-100 text-amber-700 rounded-full text-[11px] font-bold uppercase tracking-wider">
                                                                    {pType || "General"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleEditClick(page)}
                                                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                                                                        title="Edit Page"
                                                                    >
                                                                        <i className="fa-solid fa-pen text-[13px]" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteClick(pId)}
                                                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                                                                        title="Delete Page"
                                                                    >
                                                                        <i className="fa-solid fa-trash-can text-[13px]" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 🔢 PAGINATION WIDGET */}
                                    {!loading && totalItems > 0 && (
                                        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4 mt-auto">
                                            <div>
                                                Showing <span className="font-bold text-slate-800">{startEntry}</span> to{" "}
                                                <span className="font-bold text-slate-800">{endEntry}</span> of{" "}
                                                <span className="font-bold text-slate-800">{totalItems}</span> entries
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                                                >
                                                    <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                                                </button>
                                                <div className="hidden sm:flex gap-1.5">
                                                    {pageNumbers.map(number => (
                                                        <button
                                                            key={number}
                                                            onClick={() => setCurrentPage(number)}
                                                            className={`w-8 h-8 rounded-lg border text-sm font-bold transition-all shadow-sm flex items-center justify-center ${currentPage === number
                                                                ? "bg-amber-500 border-amber-500 text-white"
                                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                                }`}
                                                        >
                                                            {number}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                                                >
                                                    Next <i className="fa-solid fa-chevron-right text-[10px]" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── TAB 2: ASSIGN VIEW ── */}
                            {activeTab === "assign" && (
                                <div className="p-6 sm:p-8 space-y-6 bg-slate-50/30">
                                    <div className="max-w-md">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Select Target Role *</label>
                                        <select
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white transition-all cursor-pointer shadow-sm text-slate-700"
                                        >
                                            <option value="" disabled>-- Choose a Role to Manage Permissions --</option>
                                            {roles
                                                .map(r => (
                                                    <option key={r.roleId || r.RoleId} value={r.roleId || r.RoleId}>{r.roleName || r.RoleName}</option>
                                                ))
                                            }
                                        </select>
                                    </div>

                                    {selectedRole && (
                                        <div className="pt-6 border-t border-slate-200 animate-in fade-in duration-300">

                                            {/* Action Bar */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                <label className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-amber-400 transition-all shadow-sm w-max group">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer border-slate-300"
                                                        checked={isAllSelected}
                                                        onChange={handleSelectAllChange}
                                                    />
                                                    <span className="text-[11px] font-bold text-slate-600 group-hover:text-amber-700 uppercase tracking-wider transition-colors">
                                                        {isAllSelected ? "Uncheck All Pages" : "Select All Pages"}
                                                    </span>
                                                </label>
                                                <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                                                    <span className="text-amber-600 text-sm">{assignedPageIds.length}</span> / {allPageIds.length} Mapped
                                                </span>
                                            </div>

                                            {/* Modules Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                {(Object.entries(groupedPages) as [string, any[]][]).map(([group, pages]) => (
                                                    <div key={group} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase mb-4 tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                                                            <i className="fa-solid fa-layer-group text-slate-300"></i> {group} Module
                                                        </h4>

                                                        <div className="flex flex-col gap-2 flex-1">
                                                            {pages.map(page => {
                                                                const pId = page.pageId || page.PageId || page.id || page.Id;
                                                                const pName = page.pageName || page.PageName || page.name || page.Name || page.title || "Unnamed Page";
                                                                const pIcon = page.pageIcon || page.PageIcon || page.icon || page.Icon || "fa-solid fa-circle";
                                                                const isChecked = assignedPageIds.includes(Number(pId));

                                                                return (
                                                                    <label key={pId} className={`flex items-center justify-between px-4 py-3 border rounded-xl cursor-pointer transition-all group ${isChecked ? 'bg-amber-50/40 border-amber-200 shadow-sm' : 'bg-slate-50/50 border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isChecked ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-400 border border-slate-200 group-hover:text-slate-500'}`}>
                                                                                <i className={`${pIcon} text-[13px]`} />
                                                                            </div>
                                                                            <span className={`text-sm font-semibold transition-colors ${isChecked ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                                                                {pName}
                                                                            </span>
                                                                        </div>
                                                                        <input
                                                                            type="checkbox"
                                                                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer border-slate-300"
                                                                            checked={isChecked}
                                                                            onChange={() => handleCheckboxChange(pId)}
                                                                        />
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-8 flex justify-end">
                                                <button
                                                    onClick={handleSaveAssignment}
                                                    disabled={actionLoading}
                                                    className="px-6 py-3 bg-[#0b2532] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#0b2532]/20 hover:bg-[#0f3345] disabled:opacity-60 disabled:hover:translate-y-0 transition-all flex items-center gap-2"
                                                >
                                                    {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-floppy-disk" />}
                                                    {actionLoading ? "Processing..." : "Save Page Assignments"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ➕/✏️ MODAL: ADD OR EDIT PAGE */}
            {showPageModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">{editingPageId ? "Edit Master Page" : "Add New Page"}</h3>
                            <button
                                type="button"
                                onClick={() => { setShowPageModal(false); resetForm(); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleSavePage} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Page Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Leave Management"
                                        value={pageForm.pageName}
                                        onChange={e => setPageForm({ ...pageForm, pageName: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Page Link (URL) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. /leave"
                                        value={pageForm.pageLink}
                                        onChange={e => setPageForm({ ...pageForm, pageLink: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Module Group (Type) *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. HR, Payroll"
                                        value={pageForm.pageType}
                                        onChange={e => setPageForm({ ...pageForm, pageType: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Font Awesome Icon *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. fa-solid fa-users"
                                        value={pageForm.pageIcon}
                                        onChange={e => setPageForm({ ...pageForm, pageIcon: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => { setShowPageModal(false); resetForm(); }}
                                    className="flex-1 py-2.5 bg-white text-slate-600 border border-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-2.5 bg-[#0b2836] text-white rounded-xl text-sm font-bold hover:bg-[#0f3345] transition-colors"
                                >
                                    {actionLoading ? "Processing..." : (editingPageId ? "Update Page" : "Save Page")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}