import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/services/adminService";

const IMAGE_BASE_URL = import.meta.env.VITE_API_BASE_URL;
function resolveImageUrl(path?: string | null): string {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    // ensure exactly one slash between base and path, no matter how the backend sends it
    return `${IMAGE_BASE_URL}/${path.replace(/^\/+/, "")}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────
type FieldType = "text" | "number" | "date" | "textarea" | "checkbox";
interface FieldConfig {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    default?: string | number | boolean;
}

type ColumnType = "image" | "bool" | "date";

interface ColumnConfig {
    key: string;
    label: string;
    type?: ColumnType;
}

interface ModuleConfig {
    key: string;
    label: string;
    singularLabel: string; // explicit singular form, used in modal titles / confirm dialogs
    icon: string;
    image: "single" | "multi" | "none";
    idField: string;
    readOnly?: boolean;
    list: (...args: any[]) => Promise<any>;
    create?: (data: any) => Promise<any>;
    update?: (data: any) => Promise<any>;
    remove?: (id: any) => Promise<any>;
    columns: ColumnConfig[];
    fields?: FieldConfig[];
}

type RecordRow = Record<string, any>;

// Converts a browser File -> { base64, extension } (base64 WITHOUT the "data:...;base64," prefix)
function fileToBase64(file: File): Promise<{ base64: string; extension: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string; // data:<mime>;base64,<data>
            const base64 = result.split(",")[1];
            const extension = (file.name.split(".").pop() || "").toLowerCase();
            resolve({ base64, extension });
        };
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
    });
}

// ────────────────────────────────────────────────────────────────────────────
// Module configuration — this drives the whole page.
// ────────────────────────────────────────────────────────────────────────────
const MODULES: ModuleConfig[] = [
    {
        key: "banner",
        label: "Banners",
        singularLabel: "Banner",
        icon: "fa-solid fa-images", // updated to font-awesome
        image: "single",
        idField: "id",
        list: adminService.getBanners,
        create: adminService.createBanner,
        update: adminService.updateBanner,
        remove: adminService.deleteBanner,
        columns: [
            { key: "imagePath", label: "Image", type: "image" },
            { key: "title", label: "Title" },
            { key: "subTitle", label: "Sub Title" },
            { key: "displayOrder", label: "Order" },
            { key: "isActive", label: "Active", type: "bool" },
        ],
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "subTitle", label: "Sub Title", type: "text" },
            { name: "displayOrder", label: "Display Order", type: "number", default: 0 },
            { name: "isActive", label: "Active", type: "checkbox", default: true },
        ],
    },
    {
        key: "gallery",
        label: "Gallery",
        singularLabel: "Gallery Item",
        icon: "fa-solid fa-photo-film", // updated to font-awesome
        image: "single",
        idField: "id",
        list: adminService.getGallery,
        create: adminService.createGallery,
        update: adminService.updateGallery,
        remove: adminService.deleteGallery,
        columns: [
            { key: "imagePath", label: "Image", type: "image" },
            { key: "title", label: "Title" },
            { key: "category", label: "Category" },
            { key: "isActive", label: "Active", type: "bool" },
        ],
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "category", label: "Category", type: "text" },
            { name: "isActive", label: "Active", type: "checkbox", default: true },
        ],
    },
    {
        key: "team",
        label: "Our Team",
        singularLabel: "Team Member",
        icon: "fa-solid fa-users", // updated to font-awesome
        image: "single",
        idField: "id",
        list: adminService.getTeam,
        create: adminService.createTeam,
        update: adminService.updateTeam,
        remove: adminService.deleteTeam,
        columns: [
            { key: "imagePath", label: "Photo", type: "image" },
            { key: "name", label: "Name" },
            { key: "designation", label: "Designation" },
            { key: "displayOrder", label: "Order" },
            { key: "isActive", label: "Active", type: "bool" },
        ],
        fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "designation", label: "Designation", type: "text", required: true },
            { name: "bio", label: "Bio", type: "textarea" },
            { name: "linkedInUrl", label: "LinkedIn URL", type: "text" },
            { name: "displayOrder", label: "Display Order", type: "number", default: 0 },
            { name: "isActive", label: "Active", type: "checkbox", default: true },
        ],
    },
    {
        key: "projects",
        label: "Projects",
        singularLabel: "Project",
        icon: "fa-solid fa-solar-panel", // updated to font-awesome
        image: "multi",
        idField: "id",
        list: adminService.getProjects,
        create: adminService.createProject,
        update: adminService.updateProject,
        remove: adminService.deleteProject,
        columns: [
            { key: "title", label: "Title" },
            { key: "location", label: "Location" },
            { key: "capacityKw", label: "Capacity (kW)" },
            { key: "completedOn", label: "Completed On", type: "date" },
            { key: "isActive", label: "Active", type: "bool" },
        ],
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "location", label: "Location", type: "text" },
            { name: "capacityKw", label: "Capacity (kW)", type: "text" },
            { name: "description", label: "Description", type: "textarea" },
            { name: "completedOn", label: "Completed On", type: "date" },
            { name: "isActive", label: "Active", type: "checkbox", default: true },
        ],
    },
    {
        key: "highlights",
        label: "Highlights",
        singularLabel: "Highlight",
        icon: "fa-solid fa-star", // updated to font-awesome
        image: "single",
        idField: "id",
        list: adminService.getHighlights,
        create: adminService.createHighlight,
        update: adminService.updateHighlight,
        remove: adminService.deleteHighlight,
        columns: [
            { key: "imagePath", label: "Image", type: "image" },
            { key: "title", label: "Title" },
            { key: "displayOrder", label: "Order" },
            { key: "isActive", label: "Active", type: "bool" },
        ],
        fields: [
            { name: "title", label: "Title", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "displayOrder", label: "Display Order", type: "number", default: 0 },
            { name: "isActive", label: "Active", type: "checkbox", default: true },
        ],
    },
    {
        key: "contact-query",
        label: "Contact Queries",
        singularLabel: "Contact Query",
        icon: "fa-solid fa-envelope-open-text", // updated to font-awesome
        image: "none",
        readOnly: true, // no create
        idField: "id",
        list: () => adminService.getContactQueries(),
        columns: [
            { key: "name", label: "Name" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "subject", label: "Subject" },
            { key: "isRead", label: "Read", type: "bool" },
            { key: "submittedOn", label: "Submitted", type: "date" },
        ],
    },
];

// ────────────────────────────────────────────────────────────────────────────
// Small shared pieces
// ────────────────────────────────────────────────────────────────────────────
function cx(...c: Array<string | false | undefined | null>) {
    return c.filter(Boolean).join(" ");
}

function Badge({
    ok,
    trueLabel = "Active",
    falseLabel = "Inactive",
}: {
    ok: boolean;
    trueLabel?: string;
    falseLabel?: string;
}) {
    return (
        <span
            className={cx(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border",
                ok ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-50 text-slate-600 border-slate-200"
            )}
        >
            <span className={cx("w-1.5 h-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-slate-400")} />
            {ok ? trueLabel : falseLabel}
        </span>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="py-24 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 text-2xl shadow-sm mb-4 border border-slate-100">
                <i className="fa-solid fa-box-open" />
            </div>
            <p className="text-base font-bold text-slate-700">No {label.toLowerCase()} found</p>
            <p className="text-sm text-slate-400 font-medium mt-1">Use the Add button to create a new record.</p>
        </div>
    );
}

function ConfirmDialog({
    open,
    title,
    body,
    onCancel,
    onConfirm,
    busy,
}: {
    open: boolean;
    title: string;
    body: string;
    onCancel: () => void;
    onConfirm: () => void;
    busy: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-[24px] bg-white p-7 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-2xl mb-4 border border-rose-100">
                    <i className="fa-solid fa-triangle-exclamation" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">{body}</p>
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={busy}
                        onClick={onConfirm}
                        className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60 transition-all shadow-md shadow-rose-600/20"
                    >
                        {busy ? "Deleting…" : "Yes, Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Generic create/edit form modal, driven by module.fields
// ────────────────────────────────────────────────────────────────────────────
function RecordFormModal({
    module,
    initial,
    onClose,
    onSaved,
}: {
    module: ModuleConfig;
    initial: RecordRow | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const isEdit = Boolean(initial);
    const [values, setValues] = useState<RecordRow>(() => {
        const base: RecordRow = {};
        (module.fields || []).forEach((f) => {
            base[f.name] = initial ? initial[f.name] ?? "" : f.default ?? "";
        });
        return base;
    });
    const [files, setFiles] = useState<File[]>([]); // 1 for single-image, N for multi
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const setField = (name: string, val: any) => setValues((v) => ({ ...v, [name]: val }));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const payload: RecordRow = { ...values };

            if (module.image === "single" && files[0]) {
                const { base64, extension } = await fileToBase64(files[0]);
                payload.base64Image = base64;
                payload.extension = extension;
            }
            if (module.image === "multi" && files.length) {
                const converted = await Promise.all(files.map(fileToBase64));
                payload.base64Images = converted.map((c) => c.base64);
                payload.extension = converted[0]?.extension;
            }

            if (isEdit && initial) {
                payload[module.idField] = initial[module.idField];
                await module.update?.(payload);
            } else {
                await module.create?.(payload);
            }
            onSaved();
        } catch (err: any) {
            setError(err?.message || "Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-7 shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">

                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
                            <i className={`${module.icon} text-amber-500 text-lg`} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">
                            {isEdit ? `Edit ${module.singularLabel}` : `Add New ${module.singularLabel}`}
                        </h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                        <i className="fa-solid fa-xmark text-lg" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {(module.fields || []).map((f) => (
                        <div key={f.name}>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                                {f.label} {f.required && <span className="text-rose-500">*</span>}
                            </label>

                            {f.type === "textarea" && (
                                <textarea
                                    rows={3}
                                    required={f.required}
                                    value={values[f.name]}
                                    onChange={(e) => setField(f.name, e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm resize-none"
                                />
                            )}

                            {f.type === "checkbox" && (
                                <label className="flex items-center gap-3 cursor-pointer p-2 w-max group">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(values[f.name])}
                                        onChange={(e) => setField(f.name, e.target.checked)}
                                        className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer transition-all"
                                    />
                                    <span className="text-sm font-bold text-slate-700 group-hover:text-amber-700 transition-colors">Enabled (Active)</span>
                                </label>
                            )}

                            {["text", "number", "date"].includes(f.type) && (
                                <input
                                    type={f.type}
                                    required={f.required}
                                    value={values[f.name]}
                                    onChange={(e) =>
                                        setField(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                />
                            )}
                        </div>
                    ))}

                    {module.image === "single" && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Media Image</label>
                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {isEdit && initial?.imagePath ? (
                                    <img
                                        src={resolveImageUrl(initial.imagePath)}
                                        alt=""
                                        className="h-14 w-14 rounded-lg object-cover shadow-sm border border-slate-200"
                                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                                    />
                                ) : (
                                    <div className="h-14 w-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm shrink-0">
                                        <i className="fa-solid fa-image text-xl" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setFiles(e.target.files ? [e.target.files[0]] : [])}
                                        className="w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-700 file:font-bold hover:file:bg-amber-200 cursor-pointer"
                                    />
                                    {isEdit && <p className="mt-1 text-[10px] text-slate-400 font-medium">Leave empty to keep current image.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {module.image === "multi" && (
                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Multiple Images</label>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                    className="w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-700 file:font-bold hover:file:bg-amber-200 cursor-pointer"
                                />
                                {isEdit && <p className="mt-2 text-[10px] text-slate-400 font-medium">Select new files to replace the existing gallery.</p>}
                            </div>
                        </div>
                    )}

                    {error && <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-sm font-semibold text-rose-600 flex items-center gap-2"><i className="fa-solid fa-circle-exclamation" /> {error}</div>}

                    <div className="pt-3 flex gap-3 border-t border-slate-100 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-white text-slate-600 border border-slate-300 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3.5 bg-[#0b2836] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#0b2836]/20 hover:bg-[#0f3345] transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                        >
                            {saving ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-floppy-disk" />}
                            {saving ? "Saving..." : isEdit ? "Update Record" : "Save Record"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Table for one module's records
// ────────────────────────────────────────────────────────────────────────────
function ModuleTable({ module }: { module: ModuleConfig }) {
    const [rows, setRows] = useState<RecordRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalRecord, setModalRecord] = useState<RecordRow | null>(null); // null = closed, {} = create, {...} = edit
    const [pendingDelete, setPendingDelete] = useState<RecordRow | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [readFilter, setReadFilter] = useState<"" | "read" | "unread">(""); // contact-query only

    // ── Pagination ──
    const PAGE_SIZE = 10;
    const [page, setPage] = useState(1);

    async function load() {
        setLoading(true);
        setError("");
        try {
            const raw =
                module.key === "contact-query"
                    ? await adminService.getContactQueries(readFilter === "" ? undefined : readFilter === "read")
                    : await module.list();

            // backend wraps everything in { success, message, data }
            const data = Array.isArray(raw) ? raw : raw?.data;
            setRows(Array.isArray(data) ? data : []);
        } catch (err: any) {
            setError(err?.message || "Could not load data.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        setPage(1); // reset to first page whenever module or filter changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [module.key, readFilter]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    async function handleDelete() {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
            const id = pendingDelete[module.idField];
            if (module.key === "contact-query") {
                await adminService.deleteContactQuery(id);
            } else {
                await module.remove?.(id);
            }
            setPendingDelete(null);
            load();
        } catch (err: any) {
            setError(err?.message || "Delete failed.");
            setPendingDelete(null);
        } finally {
            setDeleting(false);
        }
    }

    async function handleMarkRead(id: any) {
        try {
            await adminService.markQueryRead(id);
            load();
        } catch (err: any) {
            setError(err?.message || "Could not update.");
        }
    }

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-300">

            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <i className={`${module.icon} text-lg`} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-800">{module.label} List</h2>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                            Total: {rows.length} Record{rows.length === 1 ? "" : "s"}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {module.key === "contact-query" && (
                        <div className="relative w-full sm:w-auto">
                            <select
                                value={readFilter}
                                onChange={(e) => setReadFilter(e.target.value as "" | "read" | "unread")}
                                className="w-full appearance-none rounded-xl border border-slate-200 pl-4 pr-10 py-2.5 text-sm font-bold text-slate-600 bg-slate-50 focus:outline-none focus:border-amber-400 cursor-pointer shadow-sm"
                            >
                                <option value="">View All Queries</option>
                                <option value="unread">Unread Only</option>
                                <option value="read">Read Only</option>
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none" />
                        </div>
                    )}
                    {!module.readOnly && (
                        <button
                            onClick={() => setModalRecord({})}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-[#0b2836] hover:bg-amber-500 transition-colors shadow-sm"
                        >
                            <i className="fa-solid fa-plus" />
                            Add {module.singularLabel}
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="m-5 rounded-xl bg-rose-50 border border-rose-100 px-5 py-3 text-sm font-semibold text-rose-600 flex items-center gap-2"><i className="fa-solid fa-triangle-exclamation" /> {error}</div>}

            <div className="overflow-x-auto min-h-[300px] flex flex-col justify-between">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                    <thead className="bg-slate-50/80 border-b border-slate-200">
                        <tr>
                            {module.columns.map((c) => (
                                <th key={c.key} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    {c.label}
                                </th>
                            ))}
                            <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {loading ? (
                            <tr>
                                <td colSpan={module.columns.length + 1} className="py-24 text-center">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <i className="fa-solid fa-spinner text-3xl text-amber-500 animate-spin" />
                                        <div className="text-sm font-medium text-slate-500 animate-pulse">Fetching records...</div>
                                    </div>
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={module.columns.length + 1}>
                                    <EmptyState label={module.label} />
                                </td>
                            </tr>
                        ) : (
                            pagedRows.map((row) => (
                                <tr key={row[module.idField]} className="hover:bg-slate-50/60 transition-colors">
                                    {module.columns.map((c) => (
                                        <td key={c.key} className="px-6 py-4 align-middle">
                                            {c.type === "image" && (
                                                row[c.key] ? (
                                                    <img
                                                        src={resolveImageUrl(row[c.key])}
                                                        alt=""
                                                        className="h-10 w-10 rounded-lg object-cover border border-slate-200 shadow-sm bg-white"
                                                        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                                                        <i className="fa-regular fa-image" />
                                                    </div>
                                                )
                                            )}
                                            {c.type === "bool" && <Badge ok={Boolean(row[c.key])} />}
                                            {c.type === "date" && (
                                                <span className="font-medium text-slate-600">
                                                    {row[c.key] ? new Date(row[c.key]).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                                                </span>
                                            )}
                                            {!c.type && (
                                                <span className="font-semibold text-slate-800 truncate max-w-[250px] inline-block" title={row[c.key]}>
                                                    {row[c.key] ?? "—"}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {module.key === "contact-query" && !row.isRead && (
                                                <button
                                                    onClick={() => handleMarkRead(row[module.idField])}
                                                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50 transition-colors"
                                                >
                                                    Mark Read
                                                </button>
                                            )}
                                            {!module.readOnly && (
                                                <button
                                                    onClick={() => setModalRecord(row)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                                    title="Edit Record"
                                                >
                                                    <i className="fa-solid fa-pen text-[13px]" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setPendingDelete(row)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors"
                                                title="Delete Record"
                                            >
                                                <i className="fa-solid fa-trash-can text-[13px]" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* ── Pagination ── */}
                {!loading && rows.length > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4 mt-auto">
                        <div>
                            Showing <span className="font-bold text-slate-800">{(safePage - 1) * PAGE_SIZE + 1}</span> to{" "}
                            <span className="font-bold text-slate-800">{Math.min(safePage * PAGE_SIZE, rows.length)}</span> of{" "}
                            <span className="font-bold text-slate-800">{rows.length}</span> entries
                        </div>

                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={safePage === 1}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                            </button>

                            <div className="hidden sm:flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                                    .reduce<(number | "ellipsis")[]>((acc, n, idx, arr) => {
                                        if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                                        acc.push(n);
                                        return acc;
                                    }, [])
                                    .map((n, idx) =>
                                        n === "ellipsis" ? (
                                            <span key={`e-${idx}`} className="px-2 text-xs text-slate-400 font-bold">…</span>
                                        ) : (
                                            <button
                                                key={n}
                                                onClick={() => setPage(n)}
                                                className={cx(
                                                    "w-8 h-8 flex items-center justify-center rounded-lg border text-sm font-bold transition-all shadow-sm",
                                                    n === safePage
                                                        ? "bg-amber-500 text-white border-amber-500"
                                                        : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
                                                )}
                                            >
                                                {n}
                                            </button>
                                        )
                                    )}
                            </div>

                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safePage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                Next <i className="fa-solid fa-chevron-right text-[10px]" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {modalRecord !== null && !module.readOnly && (
                <RecordFormModal
                    module={module}
                    initial={Object.keys(modalRecord).length ? modalRecord : null}
                    onClose={() => setModalRecord(null)}
                    onSaved={() => {
                        setModalRecord(null);
                        load();
                    }}
                />
            )}

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title={`Delete ${module.singularLabel}?`}
                body={`Are you sure you want to permanently delete this ${module.singularLabel.toLowerCase()}? This action cannot be undone.`}
                busy={deleting}
                onCancel={() => setPendingDelete(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Page shell — tabs across the top, active module's table below
// ────────────────────────────────────────────────────────────────────────────
export default function PublicSitePage() {
    const [activeKey, setActiveKey] = useState(MODULES[0].key);
    const activeModule = useMemo(() => MODULES.find((m) => m.key === activeKey)!, [activeKey]);

    return (
        <div className="space-y-5 pb-10 font-sans relative z-0">

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-globe text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Public Website Content</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Manage banners, galleries, team members, and incoming queries.</p>
                    </div>
                </div>
            </div>

            {/* ── Tabs Navigation ── */}
            <div className="flex overflow-x-auto bg-slate-100 rounded-2xl p-1.5 border border-slate-200/60 shadow-sm w-full">
                {MODULES.map((m) => (
                    <button
                        key={m.key}
                        onClick={() => setActiveKey(m.key)}
                        className={cx(
                            "flex-1 sm:flex-none flex justify-center items-center gap-2 px-5 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap",
                            activeKey === m.key
                                ? "bg-white text-amber-600 shadow-sm border border-slate-200/50"
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent"
                        )}
                    >
                        <i className={`${m.icon} text-[13px]`} />
                        {m.label}
                    </button>
                ))}
            </div>

            {/* ── Render Active Module ── */}
            <ModuleTable key={activeModule.key} module={activeModule} />
        </div>
    );
}