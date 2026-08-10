import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/services/adminService";

// ---------------------------------------------------------------------------
// NOTE ON RESPONSE SHAPE
// Backend actions return `Ok(new { Success = true, Data = data })`. ASP.NET
// Core's default System.Text.Json options serialize anonymous/DTO properties
// as camelCase, so the wire shape is `{ success, data }` and DTO fields like
// `SupplierName` come back as `supplierName`. `rows()` reads camelCase first
// and falls back to PascalCase in case that ever changes.
// ---------------------------------------------------------------------------
const rows = (res) => res?.data ?? res?.Data ?? [];
const one = (res) => res?.data ?? res?.Data ?? null;

// ---------------------------------------------------------------------------
// Status stamp — PO status rendered like a physical approval stamp
// ---------------------------------------------------------------------------
const STAMP_STYLE = {
    Draft: "text-slate-500 border-slate-400 bg-slate-50",
    Approved: "text-emerald-700 border-emerald-600 bg-emerald-50",
    PartiallyReceived: "text-amber-700 border-amber-600 bg-amber-50",
    Completed: "text-emerald-700 border-emerald-600 bg-emerald-50",
    Cancelled: "text-rose-700 border-rose-600 bg-rose-50",
};
const STAMP_LABEL = {
    Draft: "DRAFT",
    Approved: "APPROVED",
    PartiallyReceived: "PARTIAL",
    Completed: "COMPLETE",
    Cancelled: "VOID",
};
function StatusStamp({ status }) {
    return (
        <span
            className={`inline-block border-2 rounded font-mono text-[11px] font-bold tracking-wider px-2 py-0.5 -rotate-2 whitespace-nowrap ${STAMP_STYLE[status] || STAMP_STYLE.Draft
                }`}
        >
            {STAMP_LABEL[status] || status?.toUpperCase()}
        </span>
    );
}

// Draft -> Approved -> PartiallyReceived -> Completed, or -> Cancelled
const NEXT_STATUS = {
    Draft: ["Approved", "Cancelled"],
    Approved: ["PartiallyReceived", "Completed", "Cancelled"],
    PartiallyReceived: ["Completed", "Cancelled"],
    Completed: [],
    Cancelled: [],
};

const fmtINR = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------
function Table({ head, rows: tableRows, empty, emptyText }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-slate-50">
                        {head.map((h, i) => (
                            <th
                                key={i}
                                className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tableRows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                            {row.map((cell, j) => (
                                <td key={j} className="px-4 py-3 text-sm text-slate-700">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {empty && (
                <div className="text-center py-12 px-5">
                    <p className="text-sm text-slate-400">{emptyText}</p>
                </div>
            )}
        </div>
    );
}

function Modal({ title, onClose, children, wide = false }) {
    return (
        <div className="fixed inset-0 bg-slate-900/45 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                onClick={(e) => e.stopPropagation()}
                className={`bg-white rounded-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
            >
                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200 shrink-0">
                    <h3 className="font-bold text-slate-900 text-[15px]">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <label className="block mb-3.5">
            <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{label}</span>
            {children}
        </label>
    );
}

const inputClass =
    "w-full box-border px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-300";
const inputSm =
    "w-full box-border px-2 py-1.5 rounded-md border border-slate-300 text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-300";

function SubmitButton({ children, ...props }) {
    return (
        <button
            {...props}
            className="w-full mt-1.5 py-2.5 rounded-lg bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
            {children}
        </button>
    );
}

function Toolbar({ search, onSearch, placeholder, ctaLabel, onCta }) {
    return (
        <div className="flex justify-between gap-3 mb-3.5 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-xs">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
                <input
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder={placeholder}
                    className={`${inputClass} pl-8 bg-white`}
                />
            </div>
            <button
                onClick={onCta}
                className="flex items-center gap-1.5 bg-blue-700 text-white rounded-lg px-4 py-2 font-bold text-sm hover:bg-blue-800"
            >
                <i className="fa-solid fa-plus text-xs" />
                {ctaLabel}
            </button>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Line-item editor — shared by the PO-create form and (read-only-ish) GRN form
// Mirrors PurchaseOrderItemRequestDto: itemId | (newItemName + newItemCategory),
// description, hsnSac, gstRate, quantity, unit, rate.
// ---------------------------------------------------------------------------
function emptyPoItem() {
    return {
        itemId: "",
        newItemName: "",
        newItemCategory: "",
        description: "",
        hsnSac: "",
        gstRate: "0",
        quantity: "1",
        unit: "Nos",
        rate: "0",
    };
}

function PoItemsEditor({ items, setItems }) {
    const update = (i, field, value) => {
        setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
    };
    const addRow = () => setItems((prev) => [...prev, emptyPoItem()]);
    const removeRow = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

    const lineTotal = (it) => (Number(it.quantity) || 0) * (Number(it.rate) || 0);
    const grandTotal = items.reduce((sum, it) => sum + lineTotal(it), 0);

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-3 py-2 flex justify-between items-center border-b border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Line items</span>
                <button type="button" onClick={addRow} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                    <i className="fa-solid fa-plus mr-1" />
                    Add item
                </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {items.map((it, i) => (
                    <div key={i} className="p-3 space-y-2 relative">
                        {items.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeRow(i)}
                                className="absolute top-2 right-2 text-slate-300 hover:text-rose-500"
                            >
                                <i className="fa-solid fa-trash text-xs" />
                            </button>
                        )}
                        <div className="grid grid-cols-2 gap-2 pr-6">
                            <input
                                placeholder="New item name (leave blank if picking existing)"
                                value={it.newItemName}
                                onChange={(e) => update(i, "newItemName", e.target.value)}
                                className={inputSm}
                            />
                            <input
                                placeholder="Category (if new item)"
                                value={it.newItemCategory}
                                onChange={(e) => update(i, "newItemCategory", e.target.value)}
                                className={inputSm}
                            />
                        </div>
                        <input
                            placeholder="Description"
                            value={it.description}
                            onChange={(e) => update(i, "description", e.target.value)}
                            className={inputSm}
                        />
                        <div className="grid grid-cols-5 gap-2">
                            <input
                                placeholder="HSN/SAC"
                                value={it.hsnSac}
                                onChange={(e) => update(i, "hsnSac", e.target.value)}
                                className={inputSm}
                            />
                            <input
                                type="number"
                                min="0"
                                placeholder="GST %"
                                value={it.gstRate}
                                onChange={(e) => update(i, "gstRate", e.target.value)}
                                className={inputSm}
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Qty"
                                value={it.quantity}
                                onChange={(e) => update(i, "quantity", e.target.value)}
                                className={inputSm}
                            />
                            <input
                                placeholder="Unit"
                                value={it.unit}
                                onChange={(e) => update(i, "unit", e.target.value)}
                                className={inputSm}
                            />
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Rate"
                                value={it.rate}
                                onChange={(e) => update(i, "rate", e.target.value)}
                                className={inputSm}
                            />
                        </div>
                        <div className="text-right text-xs font-mono text-slate-500">= {fmtINR(lineTotal(it))}</div>
                    </div>
                ))}
            </div>
            <div className="bg-slate-50 px-3 py-2 border-t border-slate-200 text-right text-sm font-bold text-slate-800">
                Total: {fmtINR(grandTotal)}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Status move select — its own component so it can track its own
// updating/error state per-row. Previously this was an inline <select> whose
// onChange just called handleStatusChange and swallowed failures with
// console.error only, so a rejected/failed update looked identical to a
// successful one from the UI ("status change not happening").
// ---------------------------------------------------------------------------
function StatusMoveSelect({ po, onChanged }) {
    const [value, setValue] = useState("");
    const [updating, setUpdating] = useState(false);
    const [err, setErr] = useState("");
    const options = NEXT_STATUS[po.status] || [];

    if (!options.length) return <span className="text-slate-300 text-xs">—</span>;

    const handleChange = async (e) => {
        const status = e.target.value;
        if (!status) return;
        setErr("");
        setUpdating(true);
        try {
            await adminService.updatePoStatus({ poId: po.poId, status });
            await onChanged();
        } catch (updateErr) {
            setErr(updateErr.message || "Couldn't update status.");
        } finally {
            setValue(""); // reset dropdown back to placeholder either way
            setUpdating(false);
        }
    };

    return (
        <div>
            <select
                value={value}
                disabled={updating}
                onChange={handleChange}
                className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white disabled:opacity-50 disabled:cursor-wait"
            >
                <option value="" disabled>
                    {updating ? "Updating…" : "Update status"}
                </option>
                {options.map((s) => (
                    <option key={s} value={s}>
                        {s}
                    </option>
                ))}
            </select>
            {err && <div className="text-[10px] text-rose-600 mt-1 max-w-[140px] leading-tight">{err}</div>}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Purchase Orders tab
// ---------------------------------------------------------------------------
function PurchaseOrdersTab() {
    const [orders, setOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [consignees, setConsignees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState([emptyPoItem()]);

    const load = async (keyword = "") => {
        setLoading(true);
        try {
            const res = await adminService.searchPurchaseOrders({ keyword });
            setOrders(rows(res));
        } catch (err) {
            console.error("Failed to load purchase orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        adminService
            .searchSuppliers({ isActive: true })
            .then((res) => setSuppliers(rows(res)))
            .catch((err) => console.error("Failed to load suppliers", err));
        adminService
            .getAllConsignees()
            .then((res) => setConsignees(rows(res)))
            .catch((err) => console.error("Failed to load consignees", err));
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const openModal = () => {
        setItems([emptyPoItem()]);
        setError("");
        setShowModal(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");

        const f = new FormData(e.target);
        const cleanItems = items
            .filter((it) => it.newItemName || it.itemId)
            .map((it) => ({
                itemId: it.itemId ? Number(it.itemId) : null,
                newItemName: it.itemId ? undefined : it.newItemName || undefined,
                newItemCategory: it.itemId ? undefined : it.newItemCategory || undefined,
                description: it.description || undefined,
                hsnSac: it.hsnSac || undefined,
                gstRate: Number(it.gstRate) || 0,
                quantity: Number(it.quantity) || 0,
                unit: it.unit || undefined,
                rate: Number(it.rate) || 0,
            }));

        if (cleanItems.length === 0) {
            setError("Add at least one line item.");
            return;
        }

        const payload = {
            poDate: f.get("poDate"),
            supplierId: Number(f.get("supplierId")),
            consigneeId: f.get("consigneeId") ? Number(f.get("consigneeId")) : null,
            referenceNo: f.get("referenceNo") || undefined,
            referenceDate: f.get("referenceDate") || null,
            dispatchedThrough: f.get("dispatchedThrough") || undefined,
            destination: f.get("destination") || undefined,
            termsOfDelivery: f.get("termsOfDelivery") || undefined,
            modeOfPayment: f.get("modeOfPayment") || undefined,
            items: cleanItems,
        };

        setSaving(true);
        try {
            await adminService.createPurchaseOrder(payload);
            setShowModal(false);
            load(search);
        } catch (err) {
            setError(err.message || "Couldn't create the purchase order.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <Toolbar
                search={search}
                onSearch={setSearch}
                placeholder="Search PO no. or supplier"
                ctaLabel="New purchase order"
                onCta={openModal}
            />

            <Table
                head={["Voucher No.", "Supplier", "Date", "Amount", "Status", "Move to"]}
                rows={orders.map((o) => [
                    <span className="font-mono font-semibold">{o.voucherNo}</span>,
                    o.supplierName,
                    fmtDate(o.poDate),
                    <span className="font-mono">{fmtINR(o.totalAmount)}</span>,
                    <StatusStamp status={o.status} />,
                    <StatusMoveSelect po={o} onChanged={() => load(search)} />,
                ])}
                empty={!loading && orders.length === 0}
                emptyText={search ? "No purchase orders match that search." : "No purchase orders yet."}
            />

            {showModal && (
                <Modal title="New purchase order" onClose={() => setShowModal(false)} wide>
                    <form onSubmit={handleCreate}>
                        <div className="grid grid-cols-2 gap-x-4">
                            <Field label="PO date">
                                <input name="poDate" type="date" required className={inputClass} />
                            </Field>
                            <Field label="Supplier">
                                <select name="supplierId" required defaultValue="" className={inputClass}>
                                    <option value="" disabled>
                                        Select supplier
                                    </option>
                                    {suppliers.map((s) => (
                                        <option key={s.supplierId} value={s.supplierId}>
                                            {s.supplierName}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Consignee (optional)">
                                <select name="consigneeId" defaultValue="" className={inputClass}>
                                    <option value="">None</option>
                                    {consignees.map((c) => (
                                        <option key={c.consigneeId} value={c.consigneeId}>
                                            {c.consigneeName}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Reference no. (optional)">
                                <input name="referenceNo" className={inputClass} />
                            </Field>
                            <Field label="Reference date (optional)">
                                <input name="referenceDate" type="date" className={inputClass} />
                            </Field>
                            <Field label="Dispatched through (optional)">
                                <input name="dispatchedThrough" className={inputClass} />
                            </Field>
                            <Field label="Destination (optional)">
                                <input name="destination" className={inputClass} />
                            </Field>
                            <Field label="Terms of delivery (optional)">
                                <input name="termsOfDelivery" className={inputClass} />
                            </Field>
                            <Field label="Mode of payment (optional)">
                                <input name="modeOfPayment" className={inputClass} />
                            </Field>
                        </div>

                        <div className="mb-3.5">
                            <PoItemsEditor items={items} setItems={setItems} />
                        </div>

                        {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}
                        <p className="text-xs text-slate-400 mb-2.5">
                            PO opens as Draft. Move it to Approved once line items are finalised.
                        </p>
                        <SubmitButton type="submit" disabled={saving}>
                            {saving ? "Creating…" : "Create purchase order"}
                        </SubmitButton>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Suppliers tab
// ---------------------------------------------------------------------------
function SuppliersTab() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(null); // null = create mode, object = edit mode

    const load = async (keyword = "") => {
        setLoading(true);
        try {
            const res = await adminService.searchSuppliers({ keyword });
            setSuppliers(rows(res));
        } catch (err) {
            console.error("Failed to load suppliers", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    // FIX: this was named `handleSubmit` but the <form> below called
    // `onSubmit={handleCreate}` — a name that didn't exist. React silently
    // failed to attach it, so submitting the form never hit the API at all.
    // Renamed to `handleCreate` and wired it up on both the "New supplier"
    // and "Edit supplier" entry points.
    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        const f = new FormData(e.target);
        const payload = {
            supplierName: f.get("supplierName"),
            gstin: f.get("gstin") || undefined,
            panNo: f.get("panNo") || undefined,
            address: f.get("address") || undefined,
            stateName: f.get("stateName") || undefined,
            stateCode: f.get("stateCode") || undefined,
            contactNo: f.get("contactNo") || undefined,
            email: f.get("email") || undefined,
        };
        setSaving(true);
        try {
            if (editing) {
                await adminService.updateSupplier({ ...payload, supplierId: editing.supplierId });
            } else {
                await adminService.createSupplier(payload);
            }
            setShowModal(false);
            setEditing(null);
            load(search);
        } catch (err) {
            setError(err.message || `Couldn't ${editing ? "update" : "create"} the supplier.`);
        } finally {
            setSaving(false);
        }
    };

    const openCreate = () => {
        setEditing(null);
        setError("");
        setShowModal(true);
    };

    const openEdit = async (supplierId) => {
        setError("");
        try {
            const res = await adminService.getSupplierById(supplierId);
            setEditing(one(res));
            setShowModal(true);
        } catch (err) {
            console.error("Failed to load supplier", err);
        }
    };

    const handleToggle = async (id) => {
        try {
            await adminService.toggleSupplierStatus(id);
            load(search);
        } catch (err) {
            console.error("Failed to toggle supplier status", err);
        }
    };

    return (
        <div>
            <Toolbar
                search={search}
                onSearch={setSearch}
                placeholder="Search supplier or GSTIN"
                ctaLabel="New supplier"
                onCta={openCreate}
            />

            <Table
                head={["Supplier", "GSTIN", "Contact no.", "State", "Status", ""]}
                rows={suppliers.map((s) => [
                    <div>
                        <div className="font-semibold text-slate-800">{s.supplierName}</div>
                        {s.email && <div className="text-xs text-slate-400">{s.email}</div>}
                    </div>,
                    <span className="font-mono text-xs">{s.gstin || "—"}</span>,
                    s.contactNo || "—",
                    s.stateName ? `${s.stateName}${s.stateCode ? " (" + s.stateCode + ")" : ""}` : "—",
                    <button
                        onClick={() => handleToggle(s.supplierId)}
                        className={`inline-flex items-center gap-1.5 font-semibold text-xs ${s.isActive ? "text-emerald-700" : "text-slate-400"
                            }`}
                    >
                        <i className="fa-solid fa-power-off text-[10px]" />
                        {s.isActive ? "Active" : "Inactive"}
                    </button>,
                    <button
                        onClick={() => openEdit(s.supplierId)}
                        className="text-slate-400 hover:text-blue-700 text-xs font-semibold"
                        title="Edit supplier"
                    >
                        <i className="fa-solid fa-pen" />
                    </button>,
                ])}
                empty={!loading && suppliers.length === 0}
                emptyText={search ? "No suppliers match that search." : "No suppliers added yet."}
            />

            {showModal && (
                <Modal
                    title={editing ? `Edit supplier — ${editing.supplierName}` : "New supplier"}
                    onClose={() => {
                        setShowModal(false);
                        setEditing(null);
                    }}
                >
                    {/* key forces a remount so defaultValue fields refresh whenever
                        we switch between create mode and a different supplier's edit mode */}
                    <form onSubmit={handleCreate} key={editing?.supplierId ?? "new"}>
                        <Field label="Supplier name">
                            <input name="supplierName" required defaultValue={editing?.supplierName || ""} className={inputClass} />
                        </Field>
                        <Field label="GSTIN">
                            <input name="gstin" defaultValue={editing?.gstin || ""} className={inputClass} />
                        </Field>
                        <Field label="PAN no.">
                            <input name="panNo" defaultValue={editing?.panNo || ""} className={inputClass} />
                        </Field>
                        <Field label="Address">
                            <input name="address" defaultValue={editing?.address || ""} className={inputClass} />
                        </Field>
                        <div className="grid grid-cols-2 gap-x-4">
                            <Field label="State">
                                <input name="stateName" defaultValue={editing?.stateName || ""} className={inputClass} />
                            </Field>
                            <Field label="State code">
                                <input name="stateCode" defaultValue={editing?.stateCode || ""} className={inputClass} />
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4">
                            <Field label="Contact no.">
                                <input name="contactNo" defaultValue={editing?.contactNo || ""} className={inputClass} />
                            </Field>
                            <Field label="Email">
                                <input name="email" type="email" defaultValue={editing?.email || ""} className={inputClass} />
                            </Field>
                        </div>
                        {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}
                        <SubmitButton type="submit" disabled={saving}>
                            {saving ? "Saving…" : editing ? "Save changes" : "Create supplier"}
                        </SubmitButton>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Consignees tab
// ---------------------------------------------------------------------------
function ConsigneesTab() {
    const [consignees, setConsignees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await adminService.getAllConsignees();
            setConsignees(rows(res));
        } catch (err) {
            console.error("Failed to load consignees", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        const f = new FormData(e.target);
        const payload = {
            consigneeName: f.get("consigneeName"),
            siteAddress: f.get("siteAddress"),
            gstin: f.get("gstin") || undefined,
            stateName: f.get("stateName") || undefined,
            stateCode: f.get("stateCode") || undefined,
        };
        setSaving(true);
        try {
            await adminService.createConsignee(payload);
            setShowModal(false);
            load();
        } catch (err) {
            setError(err.message || "Couldn't create the consignee.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="flex justify-end mb-3.5">
                <button
                    onClick={() => {
                        setError("");
                        setShowModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-blue-700 text-white rounded-lg px-4 py-2 font-bold text-sm hover:bg-blue-800"
                >
                    <i className="fa-solid fa-plus text-xs" />
                    New consignee
                </button>
            </div>

            <Table
                head={["Consignee", "Site address", "GSTIN", "State"]}
                rows={consignees.map((c) => [
                    c.consigneeName,
                    c.siteAddress,
                    <span className="font-mono text-xs">{c.gstin || "—"}</span>,
                    c.stateName ? `${c.stateName}${c.stateCode ? " (" + c.stateCode + ")" : ""}` : "—",
                ])}
                empty={!loading && consignees.length === 0}
                emptyText="No consignees added yet."
            />

            {showModal && (
                <Modal title="New consignee" onClose={() => setShowModal(false)}>
                    <form onSubmit={handleCreate}>
                        <Field label="Consignee name">
                            <input name="consigneeName" required className={inputClass} />
                        </Field>
                        <Field label="Site address">
                            <textarea name="siteAddress" required rows={3} className={`${inputClass} resize-y`} />
                        </Field>
                        <Field label="GSTIN (optional)">
                            <input name="gstin" className={inputClass} />
                        </Field>
                        <div className="grid grid-cols-2 gap-x-4">
                            <Field label="State">
                                <input name="stateName" className={inputClass} />
                            </Field>
                            <Field label="State code">
                                <input name="stateCode" className={inputClass} />
                            </Field>
                        </div>
                        {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}
                        <SubmitButton type="submit" disabled={saving}>
                            {saving ? "Creating…" : "Create consignee"}
                        </SubmitButton>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// GRN tab
// ---------------------------------------------------------------------------
function GrnTab() {
    const [orders, setOrders] = useState([]);
    const [selectedPoId, setSelectedPoId] = useState("");
    const [selectedPo, setSelectedPo] = useState(null); // full PO detail incl. items/pending qty
    const [grns, setGrns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [receiveQty, setReceiveQty] = useState({}); // { [poItemId]: qty }

    useEffect(() => {
        adminService
            .searchPurchaseOrders({})
            .then((res) => {
                const eligible = rows(res).filter((o) => ["Approved", "PartiallyReceived"].includes(o.status));
                setOrders(eligible);
            })
            .catch((err) => console.error("Failed to load purchase orders", err));
    }, []);

    const loadGrns = (poId) => {
        if (!poId) {
            setGrns([]);
            return;
        }
        setLoading(true);
        adminService
            .getGrnsByPo(poId)
            .then((res) => setGrns(rows(res)))
            .catch((err) => console.error("Failed to load GRNs", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadGrns(selectedPoId);
        if (selectedPoId) {
            adminService
                .getPurchaseOrderById(selectedPoId)
                .then((res) => setSelectedPo(one(res)))
                .catch((err) => console.error("Failed to load PO detail", err));
        } else {
            setSelectedPo(null);
        }
    }, [selectedPoId]);

    const pendingItems = (selectedPo?.items || []).filter((it) => it.pendingQty > 0);
    const canRecordGrn = Boolean(selectedPoId) && pendingItems.length > 0;

    const openModal = () => {
        // Belt-and-braces guard: even if the button's disabled attribute
        // somehow doesn't block the click, this stops the modal from
        // opening without a selected PO / pending items.
        if (!canRecordGrn) return;
        setReceiveQty({});
        setError("");
        setShowModal(true);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        const f = new FormData(e.target);

        const items = (selectedPo?.items || [])
            .map((it) => ({
                poItemId: it.poItemId,
                itemId: it.itemId,
                receivedQty: Number(receiveQty[it.poItemId]) || 0,
            }))
            .filter((it) => it.receivedQty > 0);

        if (items.length === 0) {
            setError("Enter a received quantity for at least one item.");
            return;
        }

        const payload = {
            poId: Number(selectedPoId),
            grnDate: f.get("date"),
            remarks: f.get("remarks") || undefined,
            items,
        };

        setSaving(true);
        try {
            const res = await adminService.createGrn(payload);
            setShowModal(false);
            loadGrns(selectedPoId);
            adminService.getPurchaseOrderById(selectedPoId).then((r) => setSelectedPo(one(r)));
            const msg = res?.message || res?.Message;
            if (msg) console.info(msg);
        } catch (err) {
            setError(err.message || "Couldn't record the GRN.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-3.5 flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-[240px]">
                    <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Purchase order
                    </span>
                    <select value={selectedPoId} onChange={(e) => setSelectedPoId(e.target.value)} className={inputClass}>
                        <option value="">Select a PO awaiting or partially received</option>
                        {orders.map((o) => (
                            <option key={o.poId} value={o.poId}>
                                {o.voucherNo} — {o.supplierName}
                            </option>
                        ))}
                    </select>
                </div>
                {selectedPo && <StatusStamp status={selectedPo.status} />}
                <button
                    disabled={!canRecordGrn}
                    onClick={openModal}
                    className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-bold text-sm text-white ${canRecordGrn ? "bg-blue-700 hover:bg-blue-800" : "bg-slate-300 cursor-not-allowed"
                        }`}
                >
                    <i className="fa-solid fa-plus text-xs" />
                    Record GRN
                </button>
            </div>

            {!selectedPoId ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm text-center py-12 px-5">
                    <p className="text-sm text-slate-400">Pick a purchase order above to see what's been received against it.</p>
                </div>
            ) : (
                <Table
                    head={["GRN No.", "Date received", "Received by", "Remarks"]}
                    rows={grns.map((g) => [
                        <span className="font-mono font-semibold">{g.grnId}</span>,
                        fmtDate(g.grnDate),
                        g.receivedBy ?? "—",
                        g.remarks || "—",
                    ])}
                    empty={!loading && grns.length === 0}
                    emptyText="Nothing received against this PO yet."
                />
            )}

            {showModal && (
                <Modal title={`Record GRN — ${selectedPo?.voucherNo || ""}`} onClose={() => setShowModal(false)} wide>
                    <form onSubmit={handleCreate}>
                        <Field label="Date received">
                            <input name="date" type="date" required className={inputClass} />
                        </Field>

                        <div className="mb-3.5 border border-slate-200 rounded-lg overflow-hidden">
                            <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                    Pending items
                                </span>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                                {pendingItems.map((it) => (
                                    <div key={it.poItemId} className="p-3 flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-slate-800 truncate">
                                                {it.description || it.itemCode}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                Ordered {it.quantity} {it.unit} · Pending {it.pendingQty} {it.unit}
                                            </div>
                                        </div>
                                        <input
                                            type="number"
                                            min="0"
                                            max={it.pendingQty}
                                            step="0.01"
                                            placeholder="Receiving qty"
                                            value={receiveQty[it.poItemId] || ""}
                                            onChange={(e) =>
                                                setReceiveQty((prev) => ({ ...prev, [it.poItemId]: e.target.value }))
                                            }
                                            className={`${inputSm} w-28`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Field label="Remarks (optional)">
                            <textarea name="remarks" rows={2} className={`${inputClass} resize-y`} />
                        </Field>
                        {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}
                        <SubmitButton type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save GRN"}
                        </SubmitButton>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main page — tab shell
// ---------------------------------------------------------------------------
const TABS = [
    { key: "orders", label: "Purchase Orders", icon: "fa-solid fa-file-invoice", Component: PurchaseOrdersTab },
    { key: "suppliers", label: "Suppliers", icon: "fa-solid fa-building", Component: SuppliersTab },
    { key: "consignees", label: "Consignees", icon: "fa-solid fa-truck", Component: ConsigneesTab },
    { key: "grn", label: "GRN", icon: "fa-solid fa-box-check", Component: GrnTab },
];

export default function PurchaseModule() {
    const [active, setActive] = useState("orders");
    const ActiveComponent = useMemo(() => TABS.find((t) => t.key === active).Component, [active]);

    return (
        <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Purchase Orders</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    Suppliers, consignees, orders, and goods receipts in one place.
                </p>

                <div className="flex gap-1.5 mt-4 border-b border-slate-200">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setActive(t.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${active === t.key
                                ? "border-blue-700 text-blue-700"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            <i className={`${t.icon} text-xs`} />
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <ActiveComponent />
        </div>
    );
}