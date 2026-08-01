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

    // 🆕 Non-blocking toast state (alert() ki jagah — alert() UI thread ko block
    // karta hai jisse page "freeze" jaisa feel hota hai jab tak user OK na dabaye)
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

    // 🔒 Current logged-in user's role (taaki khud apna role dropdown mein na dikhe — self-lockout se bachne ke liye)
    const currentUserRole = useMemo(() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return "";
            const payload = JSON.parse(atob(token.split(".")[1]));
            // Alag-alag backend claim naming conventions cover karne ke liye
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
    const totalPages = Math.ceil(totalItems / itemsPerPage);
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
                alert(`Page ${editingPageId ? 'updated' : 'added'} successfully!`);
                resetForm();
                setShowPageModal(false);
                loadInitialData();
            } else {
                alert(res.Message || "Failed to save page");
            }
        } catch (err) {
            console.error(err);
            alert("API Error: Please check console.");
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
                else alert(res.Message || "Failed to delete page");
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

    // 🆕 Select All / Deselect All toggle
    const allPageIds = useMemo(() => allPages.map(p => Number(p.pageId || p.PageId || p.id || p.Id)), [allPages]);
    const isAllSelected = allPageIds.length > 0 && allPageIds.every(id => assignedPageIds.includes(id));

    const handleSelectAllChange = () => {
        if (isAllSelected) {
            setAssignedPageIds([]); // sab uncheck kar do
        } else {
            setAssignedPageIds(allPageIds); // sab check kar do
        }
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

                // 🆕 Reset role selection + checkboxes after successful save
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
        <div className="space-y-6">
            {/* 🆕 TOAST NOTIFICATION (non-blocking, alert() ki jagah) */}
            {toast && (
                <div
                    className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"
                        }`}
                >
                    {toast.message}
                </div>
            )}

            {/* HEADER */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Page Master & Assignment</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage system pages and assign them to roles for dynamic sidebar access.</p>
            </div>

            {/* MAIN CONTAINER */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">

                {/* 2 TABS */}
                <div className="flex overflow-x-auto border-b border-slate-200 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <button onClick={() => setActiveTab("table")} className={`px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === "table" ? "border-slate-800 text-slate-800" : "border-transparent hover:text-slate-600"}`}>All Pages</button>
                    <button onClick={() => setActiveTab("assign")} className={`px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === "assign" ? "border-slate-800 text-slate-800" : "border-transparent hover:text-slate-600"}`}>Assign Roles</button>
                </div>

                <div className="p-6 min-h-[400px]">
                    {loading ? (
                        <div className="text-center text-amber-600 py-10 font-medium animate-pulse">Loading Data...</div>
                    ) : (
                        <>
                            {/* TAB 1: TABLE VIEW */}
                            {activeTab === "table" && (
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
                                        <input type="text" placeholder="Search pages..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64 px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 transition-all" />
                                        <button
                                            onClick={handleAddClick}
                                            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all shadow-sm whitespace-nowrap"
                                        >
                                            + Add Page
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wide">
                                                <tr>
                                                    <th className="px-6 py-4">Page Name</th>
                                                    <th className="px-6 py-4">Link (URL)</th>
                                                    <th className="px-6 py-4">Module Type</th>
                                                    <th className="px-6 py-4 text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                                {currentPages.length === 0 ? (
                                                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">No pages found.</td></tr>
                                                ) : currentPages.map((page, idx) => {
                                                    const pId = page.pageId || page.PageId || page.id || page.Id;
                                                    const pName = page.pageName || page.PageName || page.name || page.Name || page.title;
                                                    const pLink = page.pageLink || page.PageLink || page.link || page.Link || page.url;
                                                    const pType = page.pageType || page.PageType || page.type || page.Type || page.module;
                                                    const pIcon = page.pageIcon || page.PageIcon || page.icon || page.Icon;

                                                    return (
                                                        <tr key={pId || idx} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-4 font-semibold text-slate-800 flex items-center gap-2">
                                                                <i className={`${pIcon || "fa-solid fa-file"} text-slate-400 text-lg w-5 text-center`} />
                                                                {pName || "Unknown Page"}
                                                            </td>
                                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                                {pLink || "-"}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                                                                    {pType || "General"}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <div className="flex justify-center gap-3">
                                                                    <button onClick={() => handleEditClick(page)} className="px-4 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold rounded-2xl text-xs transition-colors">Edit</button>
                                                                    <button onClick={() => handleDeleteClick(pId)} className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-2xl text-xs transition-colors">Delete</button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 🚀 PAGINATION UI */}
                                    {!loading && totalItems > 0 && (
                                        <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-2 gap-4">
                                            <div className="text-sm text-slate-500 font-medium">
                                                Showing <span className="font-bold text-slate-700">{startEntry}</span> to <span className="font-bold text-slate-700">{endEntry}</span> of <span className="font-bold text-slate-700">{totalItems}</span> entries
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                                                >
                                                    Previous
                                                </button>

                                                {pageNumbers.map(number => (
                                                    <button
                                                        key={number}
                                                        onClick={() => setCurrentPage(number)}
                                                        className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${currentPage === number
                                                            ? "bg-amber-600 text-white shadow-md border-amber-600"
                                                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                            }`}
                                                    >
                                                        {number}
                                                    </button>
                                                ))}

                                                <button
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: ASSIGN VIEW */}
                            {activeTab === "assign" && (
                                <div className="space-y-6 max-w-5xl mx-auto">
                                    <div className="max-w-md">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Role *</label>
                                        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white transition-all">
                                            <option value="" disabled>-- Choose Role --</option>
                                            {roles
                                                .filter(r => {
                                                    const roleName = (r.roleName || r.RoleName || "").toLowerCase();
                                                    const currentRole = currentUserRole?.toLowerCase();

                                                    // Apna khud ka exact role kabhi mat dikhao
                                                    if (roleName === currentRole) return false;

                                                    const currentLevel = getLevel(currentRole);
                                                    const targetLevel = getLevel(roleName);

                                                    // Backend jaisa hi logic: target level >= apna level (barabar ya neeche wale)
                                                    return targetLevel >= currentLevel;
                                                })
                                                .map(r => (
                                                    <option key={r.roleId || r.RoleId} value={r.roleId || r.RoleId}>{r.roleName || r.RoleName}</option>
                                                ))}
                                        </select>
                                    </div>

                                    {selectedRole && (
                                        <div className="pt-6 border-t border-slate-100">

                                            {/* 🆕 Select All / Deselect All */}
                                            <div className="flex items-center justify-between mb-4">
                                                <label className="flex items-center gap-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-all">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                                                        checked={isAllSelected}
                                                        onChange={handleSelectAllChange}
                                                    />
                                                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                                                        {isAllSelected ? "Deselect All Pages" : "Select All Pages"}
                                                    </span>
                                                </label>
                                                <span className="text-xs text-slate-400 font-medium">
                                                    {assignedPageIds.length} of {allPageIds.length} selected
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6">
                                                {(Object.entries(groupedPages) as [string, any[]][]).map(([group, pages]) => (
                                                    <div key={group} className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider border-b border-slate-200 pb-2">{group} Module</h4>

                                                        <div className="flex flex-wrap gap-3">
                                                            {pages.map(page => {
                                                                const pId = page.pageId || page.PageId || page.id || page.Id;
                                                                const pName = page.pageName || page.PageName || page.name || page.Name || page.title || "Unnamed Page";
                                                                const pIcon = page.pageIcon || page.PageIcon || page.icon || page.Icon || "fa-solid fa-circle";

                                                                return (
                                                                    <label key={pId} className="flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-200 rounded-xl hover:border-amber-300 hover:shadow-sm cursor-pointer transition-all">
                                                                        <input type="checkbox" className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" checked={assignedPageIds.includes(Number(pId))} onChange={() => handleCheckboxChange(pId)} />
                                                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                                            <i className={`${pIcon} text-slate-400 text-sm`} />
                                                                            {pName}
                                                                        </div>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-8 flex justify-end">
                                                <button onClick={handleSaveAssignment} disabled={actionLoading} className="px-8 py-3 bg-amber-600 text-white font-bold rounded-xl shadow-md hover:bg-amber-700 disabled:opacity-60 transition-all">{actionLoading ? "Saving..." : "Save Assignments"}</button>
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">{editingPageId ? "Edit Page" : "Add New Page"}</h3>
                            <button
                                type="button"
                                onClick={() => { setShowPageModal(false); resetForm(); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl font-bold transition-all focus:outline-none"
                                aria-label="Close Modal"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSavePage} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Page Name *</label>
                                    <input type="text" required placeholder="e.g. Leave Management" value={pageForm.pageName} onChange={e => setPageForm({ ...pageForm, pageName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Page Link (URL) *</label>
                                    <input type="text" required placeholder="e.g. /leave" value={pageForm.pageLink} onChange={e => setPageForm({ ...pageForm, pageLink: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 bg-white transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Module Group (Type) *</label>
                                    <input type="text" required placeholder="e.g. HR, Payroll" value={pageForm.pageType} onChange={e => setPageForm({ ...pageForm, pageType: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 bg-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Font Awesome Icon *</label>
                                    <input type="text" required placeholder="e.g. fa-solid fa-users" value={pageForm.pageIcon} onChange={e => setPageForm({ ...pageForm, pageIcon: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 bg-white transition-all" />
                                    <p className="text-[10px] text-slate-400 mt-1">Visit fontawesome.com for names</p>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-200/60 mt-4">
                                <button type="button" onClick={() => { setShowPageModal(false); resetForm(); }} className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-100 transition-all">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-8 py-3 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-amber-700 disabled:opacity-60 transition-all">
                                    {actionLoading ? "Saving..." : (editingPageId ? "Update Page" : "Add New Page")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}