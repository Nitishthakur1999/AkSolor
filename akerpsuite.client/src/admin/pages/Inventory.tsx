import { useState, useEffect, useMemo } from "react";
import { adminService } from "@/services/adminService"; // Apna correct path yahan daalein

export default function Inventory() {
    // ── MAIN TAB STATE ──
    const [activeMainTab, setActiveMainTab] = useState("items");

    // ── SUB-TAB STATES ──
    const [itemSubTab, setItemSubTab] = useState("table"); // 'table' | 'form'
    const [opsSubTab, setOpsSubTab] = useState("in"); // 'in' | 'out' | 'adjust'
    const [ledgerSubTab, setLedgerSubTab] = useState("global"); // 'global' | 'item'

    // ── DATA STATES (Real API Data) ──
    const [itemsList, setItemsList] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [lowStockItems, setLowStockItems] = useState([]);

    // ── SEARCH & PAGINATION STATES ──
    const [itemSearchTerm, setItemSearchTerm] = useState("");
    const [itemCurrentPage, setItemCurrentPage] = useState(1);

    const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
    const [ledgerCurrentPage, setLedgerCurrentPage] = useState(1);

    const itemsPerPage = 10;

    // ── LOADING STATES ──
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // ── FORM STATES ──
    const [itemForm, setItemForm] = useState({
        itemCode: "", itemName: "", category: "Raw Material", unit: "Nos", openingStock: 0, reorderLevel: 5
    });
    const [opsForm, setOpsForm] = useState<{ itemId: string; quantity: string | number; reference: string; remarks: string }>({
        itemId: "", quantity: "", reference: "", remarks: ""
    });

    // ── INITIAL DATA LOAD FROM APIs ──
    useEffect(() => {
        loadInventoryData();
    }, []);

    const loadInventoryData = async () => {
        setLoading(true);
        try {
            const [itemsRes, txnsRes, lowStockRes] = await Promise.all([
                adminService.getAllItems(),
                adminService.getGlobalHistory(),
                adminService.getLowStockReport()
            ]);

            if (itemsRes.Success || itemsRes.success) setItemsList(itemsRes.Data || itemsRes.data || []);
            if (txnsRes.Success || txnsRes.success) setTransactions(txnsRes.Data || txnsRes.data || []);
            if (lowStockRes.Success || lowStockRes.success) setLowStockItems(lowStockRes.Data || lowStockRes.data || []);
        } catch (error) {
            console.error("Failed to load inventory data:", error);
        } finally {
            setLoading(false);
        }
    };

    // ── SEARCH & PAGINATION LOGIC (ITEMS) ──
    const filteredItems = useMemo(() => {
        if (!itemSearchTerm) return itemsList;
        const term = itemSearchTerm.toLowerCase();
        return itemsList.filter(item =>
            (item.itemCode || "").toLowerCase().includes(term) ||
            (item.itemName || "").toLowerCase().includes(term) ||
            (item.category || "").toLowerCase().includes(term)
        );
    }, [itemsList, itemSearchTerm]);

    const totalItemsCount = filteredItems.length;
    const totalItemPages = Math.ceil(totalItemsCount / itemsPerPage) || 1;
    const currentItems = filteredItems.slice((itemCurrentPage - 1) * itemsPerPage, itemCurrentPage * itemsPerPage);

    // ── SEARCH & PAGINATION LOGIC (LEDGER) ──
    const filteredLedger = useMemo(() => {
        if (!ledgerSearchTerm) return transactions;
        const term = ledgerSearchTerm.toLowerCase();
        return transactions.filter(txn =>
            (txn.itemCode || "").toLowerCase().includes(term) ||
            (txn.itemName || "").toLowerCase().includes(term) ||
            (txn.type || txn.transactionType || "").toLowerCase().includes(term) ||
            (txn.referenceNumber || txn.ref || "").toLowerCase().includes(term)
        );
    }, [transactions, ledgerSearchTerm]);

    const totalLedgerCount = filteredLedger.length;
    const totalLedgerPages = Math.ceil(totalLedgerCount / itemsPerPage) || 1;
    const currentLedger = filteredLedger.slice((ledgerCurrentPage - 1) * itemsPerPage, ledgerCurrentPage * itemsPerPage);


    // ── HANDLERS (API INTEGRATED) ──
    const handleSaveItem = async (e: any) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await adminService.createItem(itemForm);
            if (res.Success || res.success) {
                alert("Item Created Successfully!");
                setItemForm({ itemCode: "", itemName: "", category: "Raw Material", unit: "Nos", openingStock: 0, reorderLevel: 5 });
                loadInventoryData();
                setItemSubTab("table");
            } else {
                alert(res.Message || "Failed to create item.");
            }
        } catch (error) {
            console.error("Error creating item:", error);
            alert("API Error: Check console.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleStockOperation = async (e: any) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            let res;
            if (opsSubTab === "in") {
                res = await adminService.stockIn(opsForm);
            } else if (opsSubTab === "out") {
                res = await adminService.stockOut(opsForm);
            } else if (opsSubTab === "adjust") {
                res = await adminService.stockAdjustment(opsForm);
            }

            if (res.Success || res.success) {
                alert(`Stock ${opsSubTab.toUpperCase()} Processed Successfully!`);
                setOpsForm({ itemId: "", quantity: "", reference: "", remarks: "" });
                loadInventoryData();
            } else {
                alert(res.Message || `Failed to process Stock ${opsSubTab.toUpperCase()}.`);
            }
        } catch (error) {
            console.error("Error in stock operation:", error);
            alert("API Error: Check console.");
        } finally {
            setActionLoading(false);
        }
    };

    const getLedgerBadgeStyle = (type: string) => {
        const typeStr = (type || "").toUpperCase();
        if (typeStr === "IN") return "bg-emerald-50 text-emerald-600 border-emerald-200/60";
        if (typeStr === "OUT") return "bg-rose-50 text-rose-600 border-rose-200/60";
        return "bg-amber-50 text-amber-600 border-amber-200/60";
    };

    // Helper for pagination UI to keep code clean
    const renderPagination = (currentPage: number, totalPages: number, totalCount: number, setPageFn: Function) => {
        if (totalCount === 0) return null;
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalCount);
        const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

        return (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4 mt-5 rounded-2xl">
                <div>
                    Showing <span className="font-bold text-slate-800">{start}</span> to <span className="font-bold text-slate-800">{end}</span> of <span className="font-bold text-slate-800">{totalCount}</span> entries
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setPageFn((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5">
                        <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                    </button>
                    <div className="hidden sm:flex items-center gap-1">
                        {pageNumbers.filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((number, idx, arr) => (
                            <>
                                {idx > 0 && number - arr[idx - 1] > 1 && <span key={`dots-${number}`} className="px-2 text-xs text-slate-400 font-bold">...</span>}
                                <button key={number} onClick={() => setPageFn(number)} className={`w-9 h-9 flex items-center justify-center rounded-xl border text-sm font-bold transition-all shadow-sm ${currentPage === number ? "bg-amber-500 border-amber-500 text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                    {number}
                                </button>
                            </>
                        ))}
                    </div>
                    <button onClick={() => setPageFn((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5">
                        Next <i className="fa-solid fa-chevron-right text-[10px]" />
                    </button>
                </div>
            </div>
        );
    };

    const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm";
    const labelClass = "block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1";

    return (
        <div className="space-y-6 pb-10 font-sans relative z-0">
            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-boxes-stacked text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Inventory Management</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Manage items, stock operations, and track complete ledger.</p>
                    </div>
                </div>
                <div className="flex gap-3 relative z-10 w-full md:w-auto">
                    <div className="flex-1 md:flex-none bg-white/10 px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3 backdrop-blur-sm">
                        <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400"><i className="fa-solid fa-box text-sm"></i></div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Total Items</span>
                            <span className="text-lg font-black text-white leading-none tabular-nums">{itemsList.length}</span>
                        </div>
                    </div>
                    <div className="flex-1 md:flex-none bg-rose-500/10 px-4 py-3 rounded-2xl border border-rose-500/20 flex items-center gap-3 backdrop-blur-sm">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400"><i className="fa-solid fa-triangle-exclamation text-sm"></i></div>
                        <div>
                            <span className="text-[10px] font-bold text-rose-400/80 uppercase block tracking-wider">Low Stock</span>
                            <span className="text-lg font-black text-rose-400 leading-none tabular-nums">{lowStockItems.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN TABS ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">

                <div className="flex overflow-x-auto bg-slate-50/50 border-b border-slate-200 hide-scrollbar">
                    <button onClick={() => setActiveMainTab("items")} className={`flex-1 min-w-[160px] py-4 px-4 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 flex flex-col items-center gap-2 focus:outline-none ${activeMainTab === "items" ? "border-amber-500 text-amber-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>
                        <i className="fa-solid fa-boxes-stacked text-lg mb-1"></i> Item Master
                    </button>
                    <button onClick={() => setActiveMainTab("operations")} className={`flex-1 min-w-[160px] py-4 px-4 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 flex flex-col items-center gap-2 focus:outline-none ${activeMainTab === "operations" ? "border-amber-500 text-amber-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>
                        <i className="fa-solid fa-right-left text-lg mb-1"></i> Stock Operations
                    </button>
                    <button onClick={() => setActiveMainTab("ledger")} className={`flex-1 min-w-[160px] py-4 px-4 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 flex flex-col items-center gap-2 focus:outline-none ${activeMainTab === "ledger" ? "border-amber-500 text-amber-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>
                        <i className="fa-solid fa-clipboard-list text-lg mb-1"></i> Transaction Ledger
                    </button>
                    <button onClick={() => setActiveMainTab("alerts")} className={`flex-1 min-w-[160px] py-4 px-4 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 flex flex-col items-center gap-2 focus:outline-none ${activeMainTab === "alerts" ? "border-rose-500 text-rose-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>
                        <i className="fa-solid fa-triangle-exclamation text-lg mb-1"></i> Low Stock Alerts
                    </button>
                </div>

                {/* ── TAB CONTENT AREA ── */}
                <div className="p-6 sm:p-8 min-h-[400px]">

                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-4">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Loading live inventory data...</div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300">
                            {/* ==================== 1. ITEM MASTER TAB ==================== */}
                            {activeMainTab === "items" && (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                                        <div className="flex bg-slate-100 p-1.5 rounded-xl">
                                            <button onClick={() => setItemSubTab("table")} className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${itemSubTab === "table" ? "bg-white text-amber-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}>All Items</button>
                                            <button onClick={() => setItemSubTab("form")} className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${itemSubTab === "form" ? "bg-white text-amber-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}><i className="fa-solid fa-plus" /> Create Item</button>
                                        </div>
                                        {itemSubTab === "table" && (
                                            <div className="relative group w-full sm:w-72">
                                                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Search item code, name..."
                                                    value={itemSearchTerm}
                                                    onChange={(e) => { setItemSearchTerm(e.target.value); setItemCurrentPage(1); }}
                                                    className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors shadow-sm"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {itemSubTab === "table" && (
                                        <div className="space-y-4">
                                            <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                                                <table className="w-full text-left min-w-[700px]">
                                                    <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        <tr>
                                                            <th className="px-6 py-4">Item Code</th>
                                                            <th className="px-6 py-4">Item Name</th>
                                                            <th className="px-6 py-4">Category</th>
                                                            <th className="px-6 py-4 text-center">Current Stock</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                                        {currentItems.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={4} className="px-6 py-16 text-center">
                                                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                                                                        <i className="fa-solid fa-box-open" />
                                                                    </div>
                                                                    <p className="text-base font-bold text-slate-700">No Items Found</p>
                                                                    <p className="text-sm text-slate-400 mt-1 font-medium">Try adjusting your search criteria.</p>
                                                                </td>
                                                            </tr>
                                                        ) : currentItems.map((item: any) => (
                                                            <tr key={item.id || item.itemId} className="hover:bg-slate-50/60 transition-colors">
                                                                <td className="px-6 py-4 font-mono font-bold text-amber-600">{item.itemCode}</td>
                                                                <td className="px-6 py-4 font-bold text-slate-900">{item.itemName}</td>
                                                                <td className="px-6 py-4">
                                                                    <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">{item.category}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${item.currentStock <= item.reorderLevel ? "bg-rose-50 text-rose-700 border-rose-200/50" : "bg-emerald-50 text-emerald-700 border-emerald-200/50"}`}>
                                                                        {item.currentStock <= item.reorderLevel ? <i className="fa-solid fa-arrow-down" /> : <i className="fa-solid fa-check" />}
                                                                        {item.currentStock} {item.unit}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {renderPagination(itemCurrentPage, totalItemPages, totalItemsCount, setItemCurrentPage)}
                                        </div>
                                    )}

                                    {itemSubTab === "form" && (
                                        <div className="max-w-4xl mx-auto animate-in fade-in duration-200">
                                            <form onSubmit={handleSaveItem} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                        <i className="fa-solid fa-boxes-stacked" />
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-800">Add New Inventory Item</h3>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className={labelClass}>Item Code *</label>
                                                        <input type="text" required value={itemForm.itemCode} onChange={e => setItemForm({ ...itemForm, itemCode: e.target.value })} className={inputClass} placeholder="e.g. ITM-001" />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Item Name *</label>
                                                        <input type="text" required value={itemForm.itemName} onChange={e => setItemForm({ ...itemForm, itemName: e.target.value })} className={inputClass} placeholder="e.g. Solar Panel 400W" />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Category *</label>
                                                        <select value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} className={`${inputClass} cursor-pointer appearance-none`}>
                                                            <option>Raw Material</option>
                                                            <option>Consumables</option>
                                                            <option>Hardware</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Unit of Measurement *</label>
                                                        <select value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} className={`${inputClass} cursor-pointer appearance-none`}>
                                                            <option>Nos</option>
                                                            <option>Meters</option>
                                                            <option>Kg</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Opening Stock</label>
                                                        <input type="number" value={itemForm.openingStock} onChange={e => setItemForm({ ...itemForm, openingStock: Number(e.target.value) })} className={inputClass} />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Reorder Level *</label>
                                                        <input type="number" required value={itemForm.reorderLevel} onChange={e => setItemForm({ ...itemForm, reorderLevel: Number(e.target.value) })} className={inputClass} />
                                                    </div>
                                                </div>
                                                <div className="pt-5 flex justify-end border-t border-slate-100 mt-6">
                                                    <button type="submit" disabled={actionLoading} className="w-full sm:w-auto px-8 py-3 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#0b2836]/20 hover:bg-[#0f3345] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 transition-all flex items-center justify-center gap-2">
                                                        {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-floppy-disk" />}
                                                        {actionLoading ? "Saving..." : "Save Item"}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ==================== 2. STOCK OPERATIONS TAB ==================== */}
                            {activeMainTab === "operations" && (
                                <div className="max-w-4xl mx-auto space-y-6">
                                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                        <button onClick={() => setOpsSubTab("in")} className={`flex-1 py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${opsSubTab === "in" ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}>
                                            <i className="fa-solid fa-arrow-down" /> Stock IN
                                        </button>
                                        <button onClick={() => setOpsSubTab("out")} className={`flex-1 py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${opsSubTab === "out" ? "bg-rose-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}>
                                            <i className="fa-solid fa-arrow-up" /> Stock OUT
                                        </button>
                                        <button onClick={() => setOpsSubTab("adjust")} className={`flex-1 py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${opsSubTab === "adjust" ? "bg-amber-500 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}>
                                            <i className="fa-solid fa-sliders" /> Adjustment
                                        </button>
                                    </div>

                                    <form onSubmit={handleStockOperation} className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
                                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${opsSubTab === "in" ? "bg-emerald-600" : opsSubTab === "out" ? "bg-rose-600" : "bg-amber-500"}`}>
                                                <i className={`fa-solid ${opsSubTab === "in" ? "fa-arrow-down" : opsSubTab === "out" ? "fa-arrow-up" : "fa-sliders"}`} />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-800">Process {opsSubTab.toUpperCase()} Transaction</h3>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Select Item *</label>
                                            <select required value={opsForm.itemId} onChange={e => setOpsForm({ ...opsForm, itemId: e.target.value })} className={`${inputClass} cursor-pointer appearance-none`}>
                                                <option value="" disabled>-- Choose Item --</option>
                                                {itemsList.map((item: any) => (
                                                    <option key={item.id || item.itemId} value={item.id || item.itemId}>{item.itemCode} - {item.itemName} (Stock: {item.currentStock})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelClass}>
                                                    {opsSubTab === "adjust" ? "Delta Quantity (+/-) *" : "Quantity *"}
                                                </label>
                                                <input type="number" required value={opsForm.quantity} onChange={e => setOpsForm({ ...opsForm, quantity: Number(e.target.value) })} placeholder={opsSubTab === "adjust" ? "e.g. -2 or 5" : "Enter quantity"} className={inputClass} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Reference / Lead No.</label>
                                                <input type="text" value={opsForm.reference} onChange={e => setOpsForm({ ...opsForm, reference: e.target.value })} placeholder="e.g. LD-1001" className={inputClass} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Remarks / Reason</label>
                                            <textarea rows={3} value={opsForm.remarks} onChange={e => setOpsForm({ ...opsForm, remarks: e.target.value })} placeholder="Details for audit trail..." className={`${inputClass} resize-y`}></textarea>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100">
                                            <button type="submit" disabled={actionLoading} className={`w-full py-3.5 text-white font-bold rounded-xl text-sm shadow-lg transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0 ${opsSubTab === "in" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : opsSubTab === "out" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20" : "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"}`}>
                                                {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-check-double" />}
                                                {actionLoading ? "Processing..." : `Process ${opsSubTab.toUpperCase()} Transaction`}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ==================== 3. TRANSACTION LEDGER TAB ==================== */}
                            {activeMainTab === "ledger" && (
                                <div className="space-y-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                                        <div className="flex bg-slate-100 p-1.5 rounded-xl">
                                            <button onClick={() => setLedgerSubTab("global")} className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${ledgerSubTab === "global" ? "bg-white text-amber-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}>Global History</button>
                                            <button onClick={() => setLedgerSubTab("item")} className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${ledgerSubTab === "item" ? "bg-white text-amber-600 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}>Item-wise</button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                            {ledgerSubTab === "item" && (
                                                <select className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm cursor-pointer appearance-none w-full sm:w-48">
                                                    <option>-- Select Item --</option>
                                                    {itemsList.map((item: any) => <option key={item.id}>{item.itemCode} - {item.itemName}</option>)}
                                                </select>
                                            )}
                                            <div className="relative group w-full sm:w-64">
                                                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Search ref, remarks, item..."
                                                    value={ledgerSearchTerm}
                                                    onChange={(e) => { setLedgerSearchTerm(e.target.value); setLedgerCurrentPage(1); }}
                                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                                        <table className="w-full text-left border-collapse min-w-[900px]">
                                            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Item Details</th>
                                                    <th className="px-6 py-4">Type</th>
                                                    <th className="px-6 py-4 text-right">Qty</th>
                                                    <th className="px-6 py-4 text-right">Balance</th>
                                                    <th className="px-6 py-4">Ref & Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                                {currentLedger.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-16 text-center">
                                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                                                                <i className="fa-solid fa-clipboard-list" />
                                                            </div>
                                                            <p className="text-base font-bold text-slate-700">No Transactions Found</p>
                                                            <p className="text-sm text-slate-400 mt-1 font-medium">Try adjusting your search criteria.</p>
                                                        </td>
                                                    </tr>
                                                ) : currentLedger.map((txn: any) => (
                                                    <tr key={txn.id || txn.transactionId} className="hover:bg-slate-50/60 transition-colors align-top">
                                                        <td className="px-6 py-4 font-mono font-bold text-slate-600 whitespace-nowrap">{new Date(txn.createdDate || txn.date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                                                        <td className="px-6 py-4">
                                                            <p className="font-bold text-slate-900">{txn.itemName}</p>
                                                            <p className="text-[11px] font-mono font-bold text-amber-600 mt-0.5">{txn.itemCode}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getLedgerBadgeStyle(txn.type || txn.transactionType)}`}>
                                                                {txn.type || txn.transactionType}
                                                            </span>
                                                        </td>
                                                        <td className={`px-6 py-4 text-right font-mono font-bold ${(txn.type || txn.transactionType) === 'IN' ? 'text-emerald-600' : (txn.type || txn.transactionType) === 'OUT' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                            {txn.quantity || txn.qty}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-mono font-black text-slate-800 bg-slate-50/30">{txn.balanceAfter || txn.balance}</td>
                                                        <td className="px-6 py-4 max-w-[250px]">
                                                            <p className="font-bold text-slate-800 truncate">{txn.referenceNumber || txn.ref || "—"}</p>
                                                            {txn.remarks && <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed truncate" title={txn.remarks}>{txn.remarks}</p>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {renderPagination(ledgerCurrentPage, totalLedgerPages, totalLedgerCount, setLedgerCurrentPage)}
                                </div>
                            )}

                            {/* ==================== 4. LOW STOCK ALERTS TAB ==================== */}
                            {activeMainTab === "alerts" && (
                                <div className="space-y-6">
                                    <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-200 flex items-start gap-4 shadow-sm">
                                        <div className="w-12 h-12 rounded-full bg-white text-rose-500 flex items-center justify-center shrink-0 border border-rose-100 shadow-sm text-xl">
                                            <i className="fa-solid fa-triangle-exclamation" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-rose-800">Critical Alerts</h3>
                                            <p className="text-sm font-medium text-rose-600/80 mt-1 leading-relaxed">The following items are at or below their designated reorder levels. Immediate procurement action is highly advised to prevent operational delays.</p>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                <tr>
                                                    <th className="px-6 py-4">Item Code</th>
                                                    <th className="px-6 py-4">Item Name</th>
                                                    <th className="px-6 py-4 text-center">Reorder Level</th>
                                                    <th className="px-6 py-4 text-center">Current Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {lowStockItems.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-16 text-center">
                                                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 text-2xl shadow-sm mb-4 border border-emerald-100">
                                                                <i className="fa-solid fa-check-double" />
                                                            </div>
                                                            <p className="text-base font-bold text-slate-700">All Stock Levels Healthy!</p>
                                                            <p className="text-sm text-slate-400 mt-1 font-medium">No items currently require immediate procurement.</p>
                                                        </td>
                                                    </tr>
                                                ) : lowStockItems.map((item: any) => (
                                                    <tr key={item.id || item.itemId} className="hover:bg-rose-50/40 transition-colors">
                                                        <td className="px-6 py-4 font-mono font-bold text-amber-600">{item.itemCode}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-900">{item.itemName}</td>
                                                        <td className="px-6 py-4 text-center font-mono font-semibold text-slate-500">
                                                            {item.reorderLevel} <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200/60 shadow-sm text-xs">
                                                                <i className="fa-solid fa-arrow-down" /> {item.currentStock} {item.unit}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}