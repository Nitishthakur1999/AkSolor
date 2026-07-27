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
    const totalItemPages = Math.ceil(totalItemsCount / itemsPerPage);
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
    const totalLedgerPages = Math.ceil(totalLedgerCount / itemsPerPage);
    const currentLedger = filteredLedger.slice((ledgerCurrentPage - 1) * itemsPerPage, ledgerCurrentPage * itemsPerPage);


    // ── HANDLERS (API INTEGRATED) ──
    const handleSaveItem = async (e) => {
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

    const handleStockOperation = async (e) => {
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

    const getLedgerBadgeStyle = (type) => {
        const typeStr = (type || "").toUpperCase();
        if (typeStr === "IN") return "bg-emerald-50 text-emerald-600 border-emerald-200";
        if (typeStr === "OUT") return "bg-rose-50 text-rose-600 border-rose-200";
        return "bg-amber-50 text-amber-600 border-amber-200";
    };

    // Helper for pagination UI to keep code clean
    const renderPagination = (currentPage, totalPages, totalCount, setPageFn) => {
        if (totalCount === 0) return null;
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(currentPage * itemsPerPage, totalCount);
        const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

        return (
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-2 gap-4 border-t border-slate-100">
                <div className="text-sm text-slate-500 font-medium">
                    Showing <span className="font-bold text-slate-700">{start}</span> to <span className="font-bold text-slate-700">{end}</span> of <span className="font-bold text-slate-700">{totalCount}</span> entries
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setPageFn(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all">Previous</button>
                    {pageNumbers.map(number => (
                        <button key={number} onClick={() => setPageFn(number)} className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${currentPage === number ? "bg-indigo-600 text-white shadow-md border-indigo-600" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                            {number}
                        </button>
                    ))}
                    <button onClick={() => setPageFn(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all">Next</button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-10">
            {/* ── HEADER & GLOBAL STATS ── */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Inventory Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage items, stock operations, and track complete ledger.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-indigo-50 px-5 py-2.5 rounded-xl border border-indigo-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><i className="ti ti-box text-xl"></i></div>
                        <div>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase block tracking-wider">Total Items</span>
                            <span className="text-lg font-black text-indigo-700 leading-none">{itemsList.length}</span>
                        </div>
                    </div>
                    <div className="bg-rose-50 px-5 py-2.5 rounded-xl border border-rose-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><i className="ti ti-alert-triangle text-xl"></i></div>
                        <div>
                            <span className="text-[10px] font-bold text-rose-400 uppercase block tracking-wider">Low Stock</span>
                            <span className="text-lg font-black text-rose-700 leading-none">{lowStockItems.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MAIN TABS ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex overflow-x-auto bg-slate-50 border-b border-slate-200 [scrollbar-width:none]">
                    <button onClick={() => setActiveMainTab("items")} className={`flex-1 min-w-[160px] py-4 px-4 text-xs font-bold uppercase tracking-wide transition-all border-b-2 flex flex-col items-center gap-2 ${activeMainTab === "items" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                        <i className="ti ti-boxes text-lg mb-1"></i> 1. Item Master
                    </button>
                    <button onClick={() => setActiveMainTab("operations")} className={`flex-1 min-w-[160px] py-4 px-4 text-xs font-bold uppercase tracking-wide transition-all border-b-2 flex flex-col items-center gap-2 ${activeMainTab === "operations" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                        <i className="ti ti-arrows-exchange-2 text-lg mb-1"></i> 2. Stock Operations
                    </button>
                    <button onClick={() => setActiveMainTab("ledger")} className={`flex-1 min-w-[160px] py-4 px-4 text-xs font-bold uppercase tracking-wide transition-all border-b-2 flex flex-col items-center gap-2 ${activeMainTab === "ledger" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                        <i className="ti ti-clipboard-list text-lg mb-1"></i> 3. Transaction Ledger
                    </button>
                    <button onClick={() => setActiveMainTab("alerts")} className={`flex-1 min-w-[160px] py-4 px-4 text-xs font-bold uppercase tracking-wide transition-all border-b-2 flex flex-col items-center gap-2 ${activeMainTab === "alerts" ? "border-rose-500 text-rose-600 bg-white" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                        <i className="ti ti-alert-circle text-lg mb-1"></i> 4. Low Stock Alerts
                    </button>
                </div>

                {/* ── TAB CONTENT AREA ── */}
                <div className="p-6 min-h-[400px]">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-sm font-medium text-slate-500">Loading live inventory data...</p>
                        </div>
                    ) : (
                        <>
                            {/* ==================== 1. ITEM MASTER TAB ==================== */}
                            {activeMainTab === "items" && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                            <button onClick={() => setItemSubTab("table")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${itemSubTab === "table" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>All Items</button>
                                            <button onClick={() => setItemSubTab("form")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${itemSubTab === "form" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>+ Create Item</button>
                                        </div>
                                        {itemSubTab === "table" && (
                                            <input
                                                type="text"
                                                placeholder="Search item code, name..."
                                                value={itemSearchTerm}
                                                onChange={(e) => { setItemSearchTerm(e.target.value); setItemCurrentPage(1); }}
                                                className="w-full sm:w-64 px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400"
                                            />
                                        )}
                                    </div>

                                    {itemSubTab === "table" && (
                                        <div className="space-y-4">
                                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                                <table className="w-full text-left">
                                                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                        <tr>
                                                            <th className="px-6 py-4">Item Code</th>
                                                            <th className="px-6 py-4">Item Name</th>
                                                            <th className="px-6 py-4">Category</th>
                                                            <th className="px-6 py-4 text-center">Current Stock</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                                        {currentItems.length === 0 ? (
                                                            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No items found matching your search.</td></tr>
                                                        ) : currentItems.map((item) => (
                                                            <tr key={item.id || item.itemId} className="hover:bg-slate-50/50">
                                                                <td className="px-6 py-4 font-bold text-indigo-600">{item.itemCode}</td>
                                                                <td className="px-6 py-4 font-semibold text-slate-800">{item.itemName}</td>
                                                                <td className="px-6 py-4 text-xs font-bold uppercase">{item.category}</td>
                                                                <td className="px-6 py-4 text-center font-bold">
                                                                    <span className={`px-3 py-1 rounded-lg ${item.currentStock <= item.reorderLevel ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
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
                                        <div className="max-w-3xl mx-auto mt-4">
                                            <form onSubmit={handleSaveItem} className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Item Code *</label>
                                                        <input type="text" required value={itemForm.itemCode} onChange={e => setItemForm({ ...itemForm, itemCode: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 bg-white" placeholder="e.g. ITM-001" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Item Name *</label>
                                                        <input type="text" required value={itemForm.itemName} onChange={e => setItemForm({ ...itemForm, itemName: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 bg-white" placeholder="e.g. Solar Panel 400W" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category *</label>
                                                        <select value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 bg-white">
                                                            <option>Raw Material</option>
                                                            <option>Consumables</option>
                                                            <option>Hardware</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Unit of Measurement *</label>
                                                        <select value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 bg-white">
                                                            <option>Nos</option>
                                                            <option>Meters</option>
                                                            <option>Kg</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Opening Stock</label>
                                                        <input type="number" value={itemForm.openingStock} onChange={e => setItemForm({ ...itemForm, openingStock: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 bg-white" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Reorder Level *</label>
                                                        <input type="number" required value={itemForm.reorderLevel} onChange={e => setItemForm({ ...itemForm, reorderLevel: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 bg-white" />
                                                    </div>
                                                </div>
                                                <div className="pt-4 flex justify-end border-t border-slate-200">
                                                    <button type="submit" disabled={actionLoading} className="mt-4 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-indigo-700 disabled:opacity-60 transition-all">
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
                                <div className="max-w-3xl mx-auto space-y-6">
                                    <div className="flex bg-slate-100 p-1 rounded-xl">
                                        <button onClick={() => setOpsSubTab("in")} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${opsSubTab === "in" ? "bg-emerald-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}>Stock IN</button>
                                        <button onClick={() => setOpsSubTab("out")} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${opsSubTab === "out" ? "bg-rose-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}>Stock OUT</button>
                                        <button onClick={() => setOpsSubTab("adjust")} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${opsSubTab === "adjust" ? "bg-amber-500 text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}>Adjustment</button>
                                    </div>

                                    <form onSubmit={handleStockOperation} className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Item *</label>
                                            <select required value={opsForm.itemId} onChange={e => setOpsForm({ ...opsForm, itemId: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 bg-white">
                                                <option value="">-- Choose Item --</option>
                                                {itemsList.map(item => (
                                                    <option key={item.id || item.itemId} value={item.id || item.itemId}>{item.itemCode} - {item.itemName} (Stock: {item.currentStock})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                                                    {opsSubTab === "adjust" ? "Delta Quantity (+/-) *" : "Quantity *"}
                                                </label>
                                                <input type="number" required value={opsForm.quantity} onChange={e => setOpsForm({ ...opsForm, quantity: Number(e.target.value) })} placeholder={opsSubTab === "adjust" ? "e.g. -2 or 5" : "Enter quantity"} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 bg-white" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Reference / Lead No.</label>
                                                <input type="text" value={opsForm.reference} onChange={e => setOpsForm({ ...opsForm, reference: e.target.value })} placeholder="e.g. LD-1001" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 bg-white" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Remarks / Reason</label>
                                            <textarea rows={3} value={opsForm.remarks} onChange={e => setOpsForm({ ...opsForm, remarks: e.target.value })} placeholder="Details for audit trail..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 bg-white"></textarea>
                                        </div>

                                        <div className="pt-2 border-t border-slate-200">
                                            <button type="submit" disabled={actionLoading} className={`w-full mt-4 py-3.5 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-60 ${opsSubTab === "in" ? "bg-emerald-600 hover:bg-emerald-700" : opsSubTab === "out" ? "bg-rose-600 hover:bg-rose-700" : "bg-amber-600 hover:bg-amber-700"}`}>
                                                {actionLoading ? "Processing..." : `Process ${opsSubTab.toUpperCase()} Transaction`}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* ==================== 3. TRANSACTION LEDGER TAB ==================== */}
                            {activeMainTab === "ledger" && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                            <button onClick={() => setLedgerSubTab("global")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${ledgerSubTab === "global" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>Global History</button>
                                            <button onClick={() => setLedgerSubTab("item")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${ledgerSubTab === "item" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}>Item-wise</button>
                                        </div>
                                        <div className="flex gap-3">
                                            {ledgerSubTab === "item" && (
                                                <select className="px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white">
                                                    <option>-- Select Item --</option>
                                                    {itemsList.map(item => <option key={item.id}>{item.itemCode} - {item.itemName}</option>)}
                                                </select>
                                            )}
                                            <input
                                                type="text"
                                                placeholder="Search ref, remarks, item..."
                                                value={ledgerSearchTerm}
                                                onChange={(e) => { setLedgerSearchTerm(e.target.value); setLedgerCurrentPage(1); }}
                                                className="w-full sm:w-64 px-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                <tr>
                                                    <th className="px-4 py-4">Date</th>
                                                    <th className="px-4 py-4">Item Details</th>
                                                    <th className="px-4 py-4">Type</th>
                                                    <th className="px-4 py-4 text-right">Qty</th>
                                                    <th className="px-4 py-4 text-right">Balance</th>
                                                    <th className="px-4 py-4">Ref & Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                                {currentLedger.length === 0 ? (
                                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No transactions found.</td></tr>
                                                ) : currentLedger.map((txn) => (
                                                    <tr key={txn.id || txn.transactionId} className="hover:bg-slate-50/50">
                                                        <td className="px-4 py-4 whitespace-nowrap">{new Date(txn.createdDate || txn.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-4">
                                                            <p className="font-bold text-slate-800">{txn.itemName}</p>
                                                            <p className="text-xs text-indigo-500">{txn.itemCode}</p>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold uppercase tracking-wider ${getLedgerBadgeStyle(txn.type || txn.transactionType)}`}>
                                                                {txn.type || txn.transactionType}
                                                            </span>
                                                        </td>
                                                        <td className={`px-4 py-4 text-right font-bold ${(txn.type || txn.transactionType) === 'IN' ? 'text-emerald-600' : (txn.type || txn.transactionType) === 'OUT' ? 'text-rose-600' : 'text-amber-600'}`}>
                                                            {txn.quantity || txn.qty}
                                                        </td>
                                                        <td className="px-4 py-4 text-right font-bold text-slate-800">{txn.balanceAfter || txn.balance}</td>
                                                        <td className="px-4 py-4">
                                                            <p className="font-semibold text-slate-700">{txn.referenceNumber || txn.ref || "N/A"}</p>
                                                            <p className="text-xs text-slate-400">{txn.remarks}</p>
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
                                <div className="space-y-4">
                                    <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 mb-6">
                                        <h3 className="text-sm font-bold text-rose-900">Critical Alerts</h3>
                                        <p className="text-xs text-rose-600 mt-1">The following items are at or below their reorder levels. Immediate procurement is advised.</p>
                                    </div>
                                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wide">
                                                <tr>
                                                    <th className="px-6 py-4">Item Code</th>
                                                    <th className="px-6 py-4">Item Name</th>
                                                    <th className="px-6 py-4 text-center">Reorder Level</th>
                                                    <th className="px-6 py-4 text-center">Current Stock</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm">
                                                {lowStockItems.length === 0 ? (
                                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">All stock levels are healthy! No action needed.</td></tr>
                                                ) : lowStockItems.map((item) => (
                                                    <tr key={item.id || item.itemId} className="hover:bg-rose-50/30 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-slate-600">{item.itemCode}</td>
                                                        <td className="px-6 py-4 font-bold text-slate-900">{item.itemName}</td>
                                                        <td className="px-6 py-4 text-center font-semibold text-slate-500">
                                                            {item.reorderLevel} {item.unit}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className="px-3 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200">
                                                                {item.currentStock} {item.unit}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}