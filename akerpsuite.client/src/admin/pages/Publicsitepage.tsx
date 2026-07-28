import { useEffect, useMemo, useState } from "react";
import { adminService } from "@/services/adminService";

// ────────────────────────────────────────────────────────────────────────────
// Image URL helper
// ────────────────────────────────────────────────────────────────────────────
// This must match the ORIGIN of SITE_API_BASE (no /api/site path, just protocol+host+port).
// Backend confirmed running at https://localhost:7272 (see Swagger at /swagger/index.html)
const IMAGE_BASE_URL = "https://localhost:7272";

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
        icon: "ti-photo",
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
        icon: "ti-library-photo",
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
        icon: "ti-users",
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
        icon: "ti-solar-panel",
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
        icon: "ti-star",
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
        icon: "ti-mail",
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
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
            )}
        >
            {ok ? trueLabel : falseLabel}
        </span>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div className="py-16 text-center text-sm text-slate-400">
            No {label.toLowerCase()} yet — use "Add" to create the first one.
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-80 rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm text-slate-500">{body}</p>
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={busy}
                        onClick={onConfirm}
                        className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                    >
                        {busy ? "Deleting…" : "Delete"}
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            >
                <h3 className="text-lg font-semibold text-slate-900">
                    {isEdit ? `Edit ${module.singularLabel}` : `Add ${module.singularLabel}`}
                </h3>

                <div className="mt-5 space-y-4">
                    {(module.fields || []).map((f) => (
                        <div key={f.name}>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                {f.label}
                                {f.required && <span className="text-red-500"> *</span>}
                            </label>

                            {f.type === "textarea" && (
                                <textarea
                                    rows={3}
                                    required={f.required}
                                    value={values[f.name]}
                                    onChange={(e) => setField(f.name, e.target.value)}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                                />
                            )}

                            {f.type === "checkbox" && (
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(values[f.name])}
                                        onChange={(e) => setField(f.name, e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Yes
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
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                                />
                            )}
                        </div>
                    ))}

                    {module.image === "single" && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Image</label>
                            {isEdit && initial?.imagePath && (
                                <img
                                    src={resolveImageUrl(initial.imagePath)}
                                    alt=""
                                    className="mb-2 h-16 w-16 rounded-md object-cover"
                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFiles(e.target.files ? [e.target.files[0]] : [])}
                                className="w-full text-sm text-slate-600"
                            />
                            {isEdit && <p className="mt-1 text-xs text-slate-400">Leave empty to keep the current image.</p>}
                        </div>
                    )}

                    {module.image === "multi" && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Images</label>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                className="w-full text-sm text-slate-600"
                            />
                            {isEdit && <p className="mt-1 text-xs text-slate-400">Leave empty to keep the current images.</p>}
                        </div>
                    )}
                </div>

                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                <div className="mt-6 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                    >
                        {saving ? "Saving…" : isEdit ? "Save changes" : "Create"}
                    </button>
                </div>
            </form>
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
        <div>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-semibold text-slate-900">{module.label}</h2>
                    <p className="text-xs text-slate-400">
                        {rows.length} record{rows.length === 1 ? "" : "s"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {module.key === "contact-query" && (
                        <select
                            value={readFilter}
                            onChange={(e) => setReadFilter(e.target.value as "" | "read" | "unread")}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                        >
                            <option value="">All</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                        </select>
                    )}
                    {!module.readOnly && (
                        <button
                            onClick={() => setModalRecord({})}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            <i className="ti ti-plus text-base" />
                            Add
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

            <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
                        <tr>
                            {module.columns.map((c) => (
                                <th key={c.key} className="px-4 py-3">
                                    {c.label}
                                </th>
                            ))}
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && (
                            <tr>
                                <td colSpan={module.columns.length + 1} className="px-4 py-8 text-center text-slate-400">
                                    Loading…
                                </td>
                            </tr>
                        )}

                        {!loading && rows.length === 0 && (
                            <tr>
                                <td colSpan={module.columns.length + 1}>
                                    <EmptyState label={module.label} />
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            pagedRows.map((row) => (
                                <tr key={row[module.idField]} className="hover:bg-slate-50">
                                    {module.columns.map((c) => (
                                        <td key={c.key} className="px-4 py-3 align-middle text-slate-700">
                                            {c.type === "image" &&
                                                (row[c.key] ? (
                                                    <img
                                                        src={resolveImageUrl(row[c.key])}
                                                        alt=""
                                                        className="h-10 w-10 rounded-md object-cover bg-slate-100"
                                                        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                                                    />
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                ))}
                                            {c.type === "bool" && <Badge ok={Boolean(row[c.key])} />}
                                            {c.type === "date" && (row[c.key] ? new Date(row[c.key]).toLocaleDateString() : "—")}
                                            {!c.type && (row[c.key] ?? "—")}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            {module.key === "contact-query" && !row.isRead && (
                                                <button
                                                    onClick={() => handleMarkRead(row[module.idField])}
                                                    className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                                                >
                                                    Mark read
                                                </button>
                                            )}
                                            {!module.readOnly && (
                                                <button
                                                    onClick={() => setModalRecord(row)}
                                                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setPendingDelete(row)}
                                                className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {!loading && rows.length > 0 && (
                <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-400">
                        Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, rows.length)} of {rows.length}
                    </p>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Prev
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                            .reduce<(number | "ellipsis")[]>((acc, n, idx, arr) => {
                                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                                acc.push(n);
                                return acc;
                            }, [])
                            .map((n, idx) =>
                                n === "ellipsis" ? (
                                    <span key={`e-${idx}`} className="px-1.5 text-xs text-slate-400">
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={n}
                                        onClick={() => setPage(n)}
                                        className={cx(
                                            "min-w-[28px] rounded-md px-2 py-1.5 text-xs font-medium",
                                            n === safePage
                                                ? "bg-indigo-600 text-white"
                                                : "text-slate-600 hover:bg-slate-100"
                                        )}
                                    >
                                        {n}
                                    </button>
                                )
                            )}

                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

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
                title={`Delete this ${module.singularLabel.toLowerCase()}?`}
                body="This can't be undone."
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
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900">Public Site</h1>
                <p className="text-sm text-slate-500">Manage the content shown on the public website.</p>
            </div>

            <div className="mb-6 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                {MODULES.map((m) => (
                    <button
                        key={m.key}
                        onClick={() => setActiveKey(m.key)}
                        className={cx(
                            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                            activeKey === m.key ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <i className={`ti ${m.icon} text-base`} />
                        {m.label}
                    </button>
                ))}
            </div>

            <ModuleTable key={activeModule.key} module={activeModule} />
        </div>
    );
}