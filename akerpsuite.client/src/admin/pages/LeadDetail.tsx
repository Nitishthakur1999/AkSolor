import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { adminService, getDocumentUrl } from "@/services/adminService";



const TABS = [
    { key: "overview", label: "1. Overview" },
    { key: "followups", label: "2. Follow-ups" },
    { key: "survey", label: "3. Site Survey & Feasibility" },
    { key: "proposal", label: "4. Proposal & Payment" },
    { key: "bom", label: "5. BOM & Booking" },
    { key: "dispatch", label: "6. Dispatch & Docs" },
];
const todayISO = () => new Date().toISOString().split("T")[0];
const nowLocalISO = () => {
    const d = new Date();
    d.setSeconds(0, 0);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
};
export default function LeadDetail() {
    const { id: leadId } = useParams();
    const [activeTab, setActiveTab] = useState("overview");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Header data (name, phone, status) — shared across all tabs
    const [lead, setLead] = useState(null);
    const [headerLoading, setHeaderLoading] = useState(true);

    // Per-tab data — only fetched once, when that tab is first opened
    const [followups, setFollowups] = useState(null);
    const [surveys, setSurveys] = useState(null);
    const [proposals, setProposals] = useState(null);
    const [payments, setPayments] = useState(null);
    const [bom, setBom] = useState(null);
    const [dispatch, setDispatch] = useState(null);
    const [documents, setDocuments] = useState(null);
    const [inventoryItems, setInventoryItems] = useState([]);

    const [tabLoading, setTabLoading] = useState(false);

    // Form states
    const [followupNote, setFollowupNote] = useState("");
    const [followupDate, setFollowupDate] = useState(todayISO()); // agar todayISO helper pehle se nahi hai to define kar lein
    const [nextFollowupDate, setNextFollowupDate] = useState("");
    const [surveyDateTime, setSurveyDateTime] = useState(nowLocalISO());
    const [minDateTime, setMinDateTime] = useState(nowLocalISO());   // 👈 naya

    useEffect(() => {
        const interval = setInterval(() => setMinDateTime(nowLocalISO()), 60000);
        return () => clearInterval(interval);
    }, []);

    const [newMaterial, setNewMaterial] = useState({ itemId: "", quantity: "" });
    const [materialError, setMaterialError] = useState<Record<string, any>>({});
    const [dispatchStatus, setDispatchStatus] = useState("Pending Packing");
    const [actionLoading, setActionLoading] = useState(false);
    const fileInputRef = useRef(null);

    const [systemSizeKw, setSystemSizeKw] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [subsidyAmount, setSubsidyAmount] = useState("");

    // Reminder modal state
    const [showReminderModal, setShowReminderModal] = useState(false);
    //const [reminderForm, setReminderForm] = useState({ note: "", reminderDate: "" });
    const [reminderForm, setReminderForm] = useState({ note: "", reminderDate: "", reminderType: "Follow-up" });

    // ── Add Item (Inventory Master) modal state — matches inventory_items table columns ──
    const [showItemModal, setShowItemModal] = useState(false);
    const [itemForm, setItemForm] = useState({
        itemCode: "",
        itemName: "",
        category: "",
        unit: "",
        currentStock: "",
        reorderLevel: "",
        isActive: true,
    });
    const [itemLoading, setItemLoading] = useState(false);

    useEffect(() => {
        loadHeader();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [leadId]);

    useEffect(() => {
        loadTabData(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, leadId]);

    // Auto-clear success message after a few seconds
    useEffect(() => {
        if (!successMsg) return;
        const t = setTimeout(() => setSuccessMsg(""), 3000);
        return () => clearTimeout(t);
    }, [successMsg]);

    const loadHeader = async () => {
        setHeaderLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.getLeadById(leadId);
            if (res?.success) {
                setLead(res.data);
            } else {
                setErrorMsg(res?.message || "Failed to load lead");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Could not reach the server. Please try again.");
        } finally {
            setHeaderLoading(false);
        }
    };

    const [dispatchForm, setDispatchForm] = useState({
        dispatchDate: "",
        transporter: "",
        trackingNo: "",
        remarks: "",
    });

    const loadTabData = async (tab) => {
        setErrorMsg("");
        try {
            if (tab === "followups" && followups === null) {
                setTabLoading(true);
                const res = await adminService.getFollowups(leadId);
                if (res?.success) setFollowups(res.data || []);
                setTabLoading(false);
            }
            if (tab === "survey" && surveys === null) {
                setTabLoading(true);
                const res = await adminService.getSurveys(leadId);
                if (res?.success) setSurveys(res.data || []);
                setTabLoading(false);
            }
            if (tab === "proposal" && (proposals === null || payments === null)) {
                setTabLoading(true);
                const [proposalRes, paymentRes] = await Promise.all([
                    adminService.getProposalsByLead(leadId),
                    adminService.getPaymentsByLead(leadId),
                ]);
                if (proposalRes?.success) setProposals(proposalRes.data || []);
                if (paymentRes?.success) setPayments(paymentRes.data || []);
                setTabLoading(false);
            }
            if (tab === "bom" && bom === null) {
                setTabLoading(true);
                const [bomRes, itemsRes] = await Promise.all([
                    adminService.getBomByLead(leadId),
                    adminService.getAllItems(),
                ]);
                if (bomRes?.success) setBom(bomRes.data || []);
                if (itemsRes?.success) setInventoryItems(itemsRes.data || []);
                setTabLoading(false);
            }
            if (tab === "dispatch" && dispatch === null) {
                setTabLoading(true);
                const [dispatchRes, docsRes] = await Promise.all([
                    adminService.getDispatchByLead(leadId),
                    adminService.getDocumentsByLead(leadId),
                ]);
                if (dispatchRes?.success) setDispatch(dispatchRes.data || []);
                if (docsRes?.success) setDocuments(docsRes.data || []);
                setTabLoading(false);
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Could not load data for this tab.");
            setTabLoading(false);
        }
    };

    // Re-fetch just the inventory item list (used after adding a new item)
    const refreshInventoryItems = async () => {
        try {
            const itemsRes = await adminService.getAllItems();
            if (itemsRes?.success) setInventoryItems(itemsRes.data || []);
        } catch (err) {
            console.error("Failed to refresh inventory items", err);
        }
    };

    // --- ACTIONS ---
    const handleAddFollowup = async () => {
        if (!followupNote.trim()) {
            setErrorMsg("Please write a follow-up note before submitting.");
            return;
        }
        if (!followupDate) {
            setErrorMsg("Please select the follow-up date.");
            return;
        }

        setActionLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.createFollowup({
                leadId: Number(leadId),
                notes: followupNote,
                followupDate,
                nextFollowupDate: nextFollowupDate || null
            });
            

            if (res?.success) {
                if (nextFollowupDate) {
                    try {
                        await adminService.createReminder({
                            leadId: Number(leadId),
                            reminderDate: nextFollowupDate,
                            message: `Follow-up due: ${followupNote.slice(0, 80)}`,
                            reminderType: "Follow-up"
                        });
                    } catch (remErr) {
                        console.error("Follow-up saved but reminder creation failed", remErr);
                        setErrorMsg("Follow-up saved, but the reminder could not be created automatically.");
                    }
                }

                setFollowupNote("");
                setNextFollowupDate("");
                setFollowupDate(todayISO());
                setSuccessMsg("Follow-up added successfully.");
                const refreshed = await adminService.getFollowups(leadId);
                if (refreshed?.success) setFollowups(refreshed.data || []);
            } else {
                setErrorMsg(res?.message || "Could not save follow-up.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while saving follow-up.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleScheduleSurvey = async () => {
        if (!surveyDateTime) {
            setErrorMsg("Please pick a survey date & time first.");
            return;
        }
        if (surveyDateTime < nowLocalISO()) {
            setErrorMsg("Survey date & time cannot be in the past.");
            return;
        }
        setActionLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.createSurvey({
                leadId: Number(leadId),
                surveyDate: surveyDateTime
            });
            if (res?.success) {
                setSurveyDateTime("");
                setSuccessMsg("Survey scheduled successfully.");
                const refreshed = await adminService.getSurveys(leadId);
                if (refreshed?.success) setSurveys(refreshed.data || []);
            } else {
                setErrorMsg(res?.message || "Could not schedule survey.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while scheduling survey.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleFeasibility = async (isFeasible) => {
        if (!surveys || surveys.length === 0) {
            setErrorMsg("No survey found to update.");
            return;
        }
        const latestSurveyId = surveys[0].surveyId;   // 👈 sabse latest survey

        setActionLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.updateFeasibility({
                surveyId: latestSurveyId,   // 👈 ye add kiya
                leadId: Number(leadId),
                isFeasible,
            });
            if (res?.success) {
                setSuccessMsg(isFeasible ? "Site marked feasible." : "Site marked not feasible.");
                await loadHeader();
                const refreshed = await adminService.getSurveys(leadId);
                if (refreshed?.success) setSurveys(refreshed.data || []);
            } else {
                setErrorMsg(res?.message || "Could not update feasibility.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while updating feasibility.");
        } finally {
            setActionLoading(false);
        }
    };
    const handleGenerateProposal = async () => {
        if (!systemSizeKw || !totalAmount) {
            setErrorMsg("Please enter system size and total amount.");
            return;
        }
        setActionLoading(true);
        setErrorMsg("");
        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const createdBy = storedUser.empId; // 👈 exact field name confirm karo localStorage output se

            const res = await adminService.createProposal({
                leadId: Number(leadId),
                systemSizeKw: Number(systemSizeKw),
                totalAmount: Number(totalAmount),
                subsidyAmount: Number(subsidyAmount) || 0,
                validityDays: 30,
                isFinal: false,
                createdBy,
            });
            if (res?.success) {
                setSuccessMsg("Proposal generated successfully.");
                setSystemSizeKw("");
                setTotalAmount("");
                setSubsidyAmount("");
                const refreshed = await adminService.getProposalsByLead(leadId);
                if (refreshed?.success) setProposals(refreshed.data || []);
            } else {
                setErrorMsg(res?.message || "Could not generate proposal.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while generating proposal.");
        } finally {
            setActionLoading(false);
        }
    };
    const handleProposalAction = async (proposalId, status) => {
        setActionLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.proposalAction({ proposalId, status });
            if (res?.success) {
                setSuccessMsg(`Proposal marked as ${status}.`);
                await loadHeader();
                const refreshed = await adminService.getProposalsByLead(leadId);
                if (refreshed?.success) setProposals(refreshed.data || []);
            } else {
                setErrorMsg(res?.message || "Could not update proposal.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while updating proposal.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleAddMaterial = async () => {
        if (!newMaterial.itemId || !newMaterial.quantity) {
            setErrorMsg("Please select an item and enter quantity before adding material.");
            return;
        }
        setActionLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.createBom({
                leadId: Number(leadId),
                itemId: Number(newMaterial.itemId),
                requiredQty: Number(newMaterial.quantity),
            });
            if (res?.success) {
                setNewMaterial({ itemId: "", quantity: "" });
                setSuccessMsg("Material added successfully.");
                const refreshed = await adminService.getBomByLead(leadId);
                if (refreshed?.success) setBom(refreshed.data || []);
            } else {
                setErrorMsg(res?.message || "Could not add material.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while adding material.");
        } finally {
            setActionLoading(false);
        }
    };
    const handleAddMaterialValidated = () => {
        const errors: Record<string, string> = {};

        if (!newMaterial.itemId) {
            errors.itemId = "Please select an item.";
        }

        const qty = Number(newMaterial.quantity);
        if (!newMaterial.quantity || isNaN(qty) || qty <= 0) {
            errors.quantity = "Enter a valid quantity greater than 0.";
        }

        // Optional: prevent duplicate item in BOM
        if (newMaterial.itemId && bom.some(b => String(b.itemId) === String(newMaterial.itemId))) {
            errors.itemId = "This item is already added.";
        }

        setMaterialError(errors);

        if (Object.keys(errors).length > 0) return;

        setMaterialError({});
        handleAddMaterial();
    };

    // ── Add Item (Inventory Master) handler ──
    const handleAddItem = async () => {
        if (!itemForm.itemName.trim() || !itemForm.unit.trim()) {
            setErrorMsg("Please enter at least Item Name and Unit before saving.");
            return;
        }
        setItemLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.createItem({
                itemCode: itemForm.itemCode.trim(),
                itemName: itemForm.itemName.trim(),
                category: itemForm.category.trim(),
                unit: itemForm.unit.trim(),
                currentStock: Number(itemForm.currentStock) || 0,
                reorderLevel: Number(itemForm.reorderLevel) || 0,
                isActive: itemForm.isActive,
            });
            if (res?.success) {
                setSuccessMsg("Item added successfully.");
                setItemForm({
                    itemCode: "",
                    itemName: "",
                    category: "",
                    unit: "",
                    currentStock: "",
                    reorderLevel: "",
                    isActive: true,
                });
                setShowItemModal(false);
                await refreshInventoryItems(); // dropdown turant refresh ho jayega
            } else {
                setErrorMsg(res?.message || "Could not add item.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while adding item.");
        } finally {
            setItemLoading(false);
        }
    };

    const handleCreateDispatch = async () => {
        if (!dispatchForm.dispatchDate) {
            setErrorMsg("Please pick a dispatch date first.");
            return;
        }
        setActionLoading(true);
        setErrorMsg("");
        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            const res = await adminService.createDispatch({
                leadId: Number(leadId),
                dispatchDate: dispatchForm.dispatchDate,
                dispatchBy: storedUser.empId,
                transporter: dispatchForm.transporter,
                trackingNo: dispatchForm.trackingNo,
                remarks: dispatchForm.remarks,
            });
            if (res?.success) {
                setSuccessMsg("Dispatch entry created.");
                setDispatchForm({ dispatchDate: "", transporter: "", trackingNo: "", remarks: "" });
                const refreshed = await adminService.getDispatchByLead(leadId);
                if (refreshed?.success) setDispatch(refreshed.data || []);
            } else {
                setErrorMsg(res?.message || "Could not create dispatch entry.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while creating dispatch entry.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateDispatchStatus = async () => {
        const latestDispatch = (dispatch || [])[0];
        if (!latestDispatch) {
            setErrorMsg("No dispatch entry found. Please create one first.");
            return;
        }
        setActionLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.updateDispatchStatus({
                dispatchId: latestDispatch.dispatchId,
                status: dispatchStatus,
            });
            if (res?.success) {
                setSuccessMsg("Dispatch status updated.");
                const refreshed = await adminService.getDispatchByLead(leadId);
                if (refreshed?.success) setDispatch(refreshed.data || []);
            } else {
                setErrorMsg(res?.message || "Could not update dispatch status.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while updating dispatch status.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUploadDocument = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setActionLoading(true);
        setErrorMsg("");
        try {
            const base64File = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(",")[1]);
                reader.onerror = () => reject(new Error("Could not read file"));
                reader.readAsDataURL(file);
            });

            const extension = "." + file.name.split(".").pop().toLowerCase();
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

            const res = await adminService.uploadDocument({
                leadId: Number(leadId),
                docType: "General",
                docName: file.name,
                base64File,
                extension,
                uploadedBy: storedUser.empId,
            });

            if (res?.success) {
                setSuccessMsg("Document uploaded successfully.");
                const refreshed = await adminService.getDocumentsByLead(leadId);
                if (refreshed?.success) setDocuments(refreshed.data || []);
            } else {
                setErrorMsg(res?.message || "Could not upload document.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while uploading document.");
        } finally {
            setActionLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleCreateReminder = async () => {
        if (!reminderForm.note.trim() || !reminderForm.reminderDate) {
            setErrorMsg("Please enter a note and reminder date.");
            return;
        }
        setActionLoading(true);
        setErrorMsg("");
        try {
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

            const res = await adminService.createReminder({
                leadId: Number(leadId),
                message: reminderForm.note,
                reminderDate: reminderForm.reminderDate,
                reminderType: reminderForm.reminderType || "Follow-up",
                assignedTo: storedUser.empId,
            });
            if (res?.success) {
                setSuccessMsg("Reminder created successfully.");
                setReminderForm({ note: "", reminderDate: "", reminderType: "Follow-up" });
                setShowReminderModal(false);
            } else {
                setErrorMsg(res?.message || "Could not create reminder.");
            }
        } catch (err) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while creating reminder.");
        } finally {
            setActionLoading(false);
        }
    };

    if (headerLoading) {
        return <div className="text-center text-amber-600 py-10 font-medium animate-pulse">Loading Data...</div>;
    }

    if (!lead) {
        return (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium px-4 py-3 rounded-xl">
                {errorMsg || "Lead not found."}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        {lead.name}
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs font-bold">#{lead.leadId}</span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Phone: {lead.contactNo} | Current Stage: <span className="font-bold text-slate-700">{lead.status}</span>
                    </p>
                </div>
                <button onClick={() => setShowReminderModal(true)} className="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-amber-700 transition-all">
                    Create Reminder
                </button>
            </div>

            {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium px-4 py-3 rounded-xl">
                    {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-medium px-4 py-3 rounded-xl">
                    {successMsg}
                </div>
            )}

            {/* REMINDER MODAL */}
            {showReminderModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">       <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Create Reminder</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reminder Type</label>
                                <select
                                    value={reminderForm.reminderType || "Follow-up"}
                                    onChange={e => setReminderForm({ ...reminderForm, reminderType: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400"
                                >
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Call">Call</option>
                                    <option value="Visit">Visit</option>
                                    <option value="Payment">Payment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Note *</label>
                                <textarea
                                    value={reminderForm.note}
                                    onChange={e => setReminderForm({ ...reminderForm, note: e.target.value })}
                                    rows={3}
                                    placeholder="What should be remembered?"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reminder Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={reminderForm.reminderDate}
                                    onChange={e => setReminderForm({ ...reminderForm, reminderDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                />
                            </div>
                        </div>
                        <div className="pt-5 flex justify-end gap-3">
                            <button onClick={() => setShowReminderModal(false)} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleCreateReminder} disabled={actionLoading} className="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-amber-700 disabled:opacity-60 transition-all">
                                {actionLoading ? "Saving..." : "Save Reminder"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── ADD ITEM (Inventory Master) MODAL ── */}
            {showItemModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 w-full max-w-md">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Add New Item</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Item Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ITM-001"
                                    value={itemForm.itemCode}
                                    onChange={e => setItemForm({ ...itemForm, itemCode: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Item Name *</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="e.g. Solar Panel 550W"
                                    value={itemForm.itemName}
                                    onChange={e => setItemForm({ ...itemForm, itemName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Panels, Cables"
                                        value={itemForm.category}
                                        onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Unit *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Nos, Mtr, Kg"
                                        value={itemForm.unit}
                                        onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Opening Stock</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={itemForm.currentStock}
                                        onChange={e => setItemForm({ ...itemForm, currentStock: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reorder Level</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={itemForm.reorderLevel}
                                        onChange={e => setItemForm({ ...itemForm, reorderLevel: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-5 flex justify-end gap-3">
                            <button
                                onClick={() => setShowItemModal(false)}
                                className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddItem}
                                disabled={itemLoading}
                                className="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-amber-700 disabled:opacity-60 transition-all"
                            >
                                {itemLoading ? "Saving..." : "Save Item"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTAINER */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                {/* TABS */}
                <div className="flex overflow-x-auto border-b border-slate-200 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-amber-600 text-amber-600" : "border-transparent hover:text-slate-600"}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 min-h-[400px]">
                    {tabLoading ? (
                        <div className="text-center text-amber-600 py-10 font-medium animate-pulse">Loading Data...</div>
                    ) : (
                        <>
                            {/* TAB 1: OVERVIEW */}
                            {activeTab === "overview" && (
                                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
                                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Client Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Client Name</p>
                                            <p className="text-sm font-semibold text-slate-800">{lead.name || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Phone</p>
                                            <p className="text-sm font-semibold text-slate-800">{lead.contactNo || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Email</p>
                                            <p className="text-sm font-semibold text-slate-800">{lead.email || "-"}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Address</p>
                                            <p className="text-sm font-semibold text-slate-800">{lead.address || "-"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                                {/* TAB 2: FOLLOW-UPS */}
                                {activeTab === "followups" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="border border-slate-200 rounded-2xl p-6">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Add Follow-up Note</h3>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                                        Follow-up Date *
                                                    </label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={followupDate}
                                                        onChange={e => setFollowupDate(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                                        Next Follow-up (Reminder)
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={nextFollowupDate}
                                                        min={todayISO()}
                                                        onChange={e => setNextFollowupDate(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                                    />
                                                    <p className="text-[11px] text-slate-400 mt-1">Set this to auto-create the next reminder.</p>
                                                </div>
                                            </div>

                                            <textarea
                                                placeholder="What was discussed with the client?"
                                                value={followupNote}
                                                onChange={e => setFollowupNote(e.target.value)}
                                                rows={4}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                            />
                                            <button onClick={handleAddFollowup} disabled={actionLoading} className="mt-4 w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-amber-700 disabled:opacity-60 transition-all">
                                                {actionLoading ? "Submitting..." : "Submit Follow-up"}
                                            </button>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">History Timeline</h3>
                                            <div className="space-y-3">
                                                {(followups || []).length === 0 ? (
                                                    <p className="text-sm text-slate-400">No follow-ups yet.</p>
                                                ) : followups.map((f, idx) => (
                                                    <div key={f.followupId || idx} className="border border-slate-100 rounded-xl p-4 flex justify-between items-start">
                                                        <div>
                                                            <p className="text-xs font-bold text-amber-600">{f.followupDate?.split("T")[0]}</p>
                                                            <p className="text-sm text-slate-700 mt-1">{f.notes}</p>
                                                            {f.nextFollowupDate && (
                                                                <p className="text-[11px] text-amber-600 font-semibold mt-1">
                                                                    Next reminder: {f.nextFollowupDate?.split("T")[0]}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                            Logged by {f.createdBy || "Unknown"}
                                                        </span> </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {/* TAB 3: SITE SURVEY & FEASIBILITY */}
                            {activeTab === "survey" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="border border-slate-200 rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Schedule Site Survey</h3>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Survey Date & Time *</label>
                                            <input
                                                type="datetime-local"
                                                value={surveyDateTime}
                                                min={minDateTime}
                                                onChange={e => setSurveyDateTime(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                            />
                                        <button onClick={handleScheduleSurvey} disabled={actionLoading} className="mt-4 w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-amber-700 disabled:opacity-60 transition-all">
                                            {actionLoading ? "Scheduling..." : "Schedule Survey"}
                                        </button>

                                        {/* NEW: Survey history list */}
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mt-8 mb-4">Survey History</h3>
                                        <div className="space-y-3">
                                            {(surveys || []).length === 0 ? (
                                                <p className="text-sm text-slate-400">No surveys scheduled yet.</p>
                                            ) : surveys.map((s, idx) => (
                                                <div key={s.surveyId || idx} className="border border-slate-100 rounded-xl p-4 flex justify-between items-start">
                                                    <div>
                                                        <p className="text-xs font-bold text-amber-600">
                                                            {s.surveyDate ? new Date(s.surveyDate).toLocaleString() : "Not scheduled"}
                                                        </p>
                                                        <p className="text-sm text-slate-700 mt-1">
                                                            {s.isFeasible === true && <span className="text-emerald-600 font-semibold">✓ Feasible</span>}
                                                            {s.isFeasible === false && <span className="text-rose-600 font-semibold">✕ Not Feasible</span>}
                                                            {(s.isFeasible === null || s.isFeasible === undefined) && <span className="text-amber-600 font-semibold">Pending decision</span>}
                                                        </p>
                                                        {s.surveyorName && (
                                                            <p className="text-[11px] text-slate-400 mt-1">Surveyor: {s.surveyorName}</p>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{s.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 rounded-2xl p-6">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2">Feasibility Decision</h3>
                                        <p className="text-xs text-slate-500 mb-4">After survey completion, mark whether the project site is feasible for installation.</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => handleFeasibility(true)} disabled={actionLoading} className="flex-1 px-4 py-3 border border-emerald-200 text-emerald-600 font-bold rounded-xl text-sm hover:bg-emerald-50 disabled:opacity-60 transition-all">
                                                {actionLoading ? "..." : "✓ Accept Feasibility"}
                                            </button>
                                            <button onClick={() => handleFeasibility(false)} disabled={actionLoading} className="flex-1 px-4 py-3 border border-rose-200 text-rose-600 font-bold rounded-xl text-sm hover:bg-rose-50 disabled:opacity-60 transition-all">
                                                {actionLoading ? "..." : "✕ Reject Feasibility"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: PROPOSAL & PAYMENT */}
                                {activeTab === "proposal" && (
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Proposal Details</h3>
                                        </div>

                                        {/* Generate Proposal form — unchanged */}
                                        <div className="border border-slate-200 rounded-2xl p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">System Size (kW) *</label>
                                                <input
                                                    type="number"
                                                    value={systemSizeKw}
                                                    onChange={e => setSystemSizeKw(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Total Amount (₹) *</label>
                                                <input
                                                    type="number"
                                                    value={totalAmount}
                                                    onChange={e => setTotalAmount(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Subsidy Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    value={subsidyAmount}
                                                    onChange={e => setSubsidyAmount(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400"
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <button onClick={handleGenerateProposal} disabled={actionLoading} className="w-full px-4 py-2 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 disabled:opacity-60 transition-all">
                                                    {actionLoading ? "Generating..." : "Generate New Proposal"}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Proposals table */}
                                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">System Size</th>
                                                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Total Amount</th>
                                                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Subsidy Amount</th>
                                                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                                                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(proposals || []).length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-8 text-sm text-slate-400 text-center">
                                                                No proposals yet.
                                                            </td>
                                                        </tr>
                                                    ) : proposals.map((p, idx) => (
                                                        <tr key={p.proposalId || idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-slate-800">{p.systemSizeKw || "-"} kW</td>
                                                            <td className="px-6 py-4 font-bold text-slate-800">₹ {Number(p.totalAmount || 0).toLocaleString("en-IN")}</td>
                                                            <td className="px-6 py-4 font-bold text-slate-800">₹ {Number(p.subsidyAmount || 0).toLocaleString("en-IN")}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${p.status === "Accepted"
                                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                                                        : p.status === "Rejected"
                                                                            ? "bg-red-50 text-red-600 border-red-200"
                                                                            : "bg-amber-50 text-amber-600 border-amber-200"
                                                                    }`}>
                                                                    {p.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {(p.status === "Draft" || p.status === "Pending") ? (
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => handleProposalAction(p.proposalId, "Accepted")} disabled={actionLoading} className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 disabled:opacity-60 transition-all">Accept</button>
                                                                        <button onClick={() => handleProposalAction(p.proposalId, "Rejected")} disabled={actionLoading} className="px-4 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50 disabled:opacity-60 transition-all">Reject</button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-300">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                                {/* TAB 5: BOM & BOOKING */}
                                {activeTab === "bom" && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Material Requirements (BOM)</h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowItemModal(true)}
                                                className="text-xs font-bold text-amber-600 hover:text-amber-800"
                                            >
                                                + Add Item
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                                            <div>
                                                <select
                                                    value={newMaterial.itemId}
                                                    onChange={e => setNewMaterial({ ...newMaterial, itemId: e.target.value })}
                                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-amber-400 ${materialError.itemId ? "border-red-400" : "border-slate-200"
                                                        }`}
                                                >
                                                    <option value="">-- Select Item --</option>
                                                    {inventoryItems.map(item => (
                                                        <option key={item.itemId} value={item.itemId}>{item.itemName}</option>
                                                    ))}
                                                </select>
                                                {materialError.itemId && (
                                                    <p className="text-xs text-red-500 mt-1">{materialError.itemId}</p>
                                                )}
                                            </div>

                                            <div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    placeholder="Quantity"
                                                    value={newMaterial.quantity}
                                                    onChange={e => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-amber-400 ${materialError.quantity ? "border-red-400" : "border-slate-200"
                                                        }`}
                                                />
                                                {materialError.quantity && (
                                                    <p className="text-xs text-red-500 mt-1">{materialError.quantity}</p>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleAddMaterialValidated}
                                                disabled={actionLoading}
                                                className="px-4 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-xs hover:bg-amber-700 disabled:opacity-60 transition-all h-[42px]"
                                            >
                                                {actionLoading ? "Adding..." : "+ Add Material"}
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wide">
                                                    <tr>
                                                        <th className="px-6 py-4">Item Name</th>
                                                        <th className="px-6 py-4">Quantity</th>
                                                        <th className="px-6 py-4">Unit</th>
                                                        <th className="px-6 py-4">Availability</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                                                    {(bom || []).length === 0 ? (
                                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No materials added yet.</td></tr>
                                                    ) : bom.map((item, idx) => (
                                                        <tr key={item.bomId || idx}>
                                                            <td className="px-6 py-4 font-semibold text-slate-800">{item.itemName || "-"}</td>
                                                            <td className="px-6 py-4">{item.requiredQty ?? "-"}</td>
                                                            <td className="px-6 py-4">{item.unit || "-"}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`font-bold text-xs ${item.shortageQty > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                                                                    {item.shortageQty > 0 ? "Needs Booking" : "In Stock"}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* TAB 6: DISPATCH & DOCS */}
                                {activeTab === "dispatch" && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                        {/* LEFT COLUMN */}
                                        <div className="space-y-6">

                                            {/* Create Dispatch Entry */}
                                            <div className="border border-slate-200 rounded-2xl p-6">
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
                                                    Create Dispatch Entry
                                                </h3>
                                                <div className="space-y-4 mb-5">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                                            Dispatch Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={dispatchForm.dispatchDate}
                                                            onChange={e => setDispatchForm({ ...dispatchForm, dispatchDate: e.target.value })}
                                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                                            Transporter Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. Blue Dart"
                                                            value={dispatchForm.transporter}
                                                            onChange={e => setDispatchForm({ ...dispatchForm, transporter: e.target.value })}
                                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                                            Tracking Number
                                                        </label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. TRK123456"
                                                            value={dispatchForm.trackingNo}
                                                            onChange={e => setDispatchForm({ ...dispatchForm, trackingNo: e.target.value })}
                                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleCreateDispatch}
                                                    disabled={actionLoading}
                                                    className="w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-xl text-sm hover:bg-amber-700 disabled:opacity-60 transition-all"
                                                >
                                                    {actionLoading ? "Creating..." : "Create Dispatch Entry"}
                                                </button>
                                            </div>

                                            {/* Dispatch Status update */}
                                            <div className="border border-slate-200 rounded-2xl p-6">
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
                                                    Dispatch Status
                                                </h3>
                                                <div className="mb-4">
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                                                        Update Status To
                                                    </label>
                                                    <select
                                                        value={dispatchStatus}
                                                        onChange={e => setDispatchStatus(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all"
                                                    >
                                                        <option value="Dispatched">Dispatched</option>
                                                        <option value="Delivered">Delivered</option>
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={handleUpdateDispatchStatus}
                                                    disabled={actionLoading}
                                                    className="w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-amber-700 disabled:opacity-60 transition-all"
                                                >
                                                    {actionLoading ? "Updating..." : "Update Status"}
                                                </button>
                                            </div>

                                            {/* Dispatch History */}
                                            <div className="border border-slate-200 rounded-2xl p-6">
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">
                                                    Dispatch History
                                                </h3>
                                                <div className="space-y-3">
                                                    {(dispatch || []).length === 0 ? (
                                                        <p className="text-sm text-slate-400">No dispatch entries yet.</p>
                                                    ) : dispatch.map((d, idx) => (
                                                        <div
                                                            key={d.dispatchId ?? idx}
                                                            className="border border-slate-100 rounded-xl p-4 flex justify-between items-start gap-3"
                                                        >
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-amber-600">
                                                                    {d.dispatchDate ? new Date(d.dispatchDate).toLocaleDateString() : "Not set"}
                                                                </p>
                                                                <p className="text-sm text-slate-700 mt-1 truncate">{d.transporter || "-"}</p>
                                                                {d.trackingNo && (
                                                                    <p className="text-xs text-slate-400 mt-1 truncate">Tracking: {d.trackingNo}</p>
                                                                )}
                                                            </div>
                                                            <span className="shrink-0 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg text-xs font-bold">
                                                                {d.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* RIGHT COLUMN */}
                                        <div className="border border-slate-200 rounded-2xl p-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                                    Documents
                                                </h3>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={actionLoading}
                                                    className="text-xs font-bold text-amber-600 hover:underline disabled:opacity-60"
                                                >
                                                    {actionLoading ? "Uploading..." : "+ Upload"}
                                                </button>
                                                <input type="file" ref={fileInputRef} onChange={handleUploadDocument} className="hidden" />
                                            </div>

                                            <div className="space-y-2">
                                                {(documents || []).length === 0 ? (
                                                    <p className="text-sm text-slate-400">No documents uploaded yet.</p>
                                                ) : documents.map((doc, idx) => (
                                                    <div
                                                        key={doc.docId ?? idx}
                                                        onClick={() => window.open(getDocumentUrl(doc.filePath || doc.docPath || doc.path), "_blank")}
                                                        className="px-4 py-3 border border-slate-100 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 hover:border-amber-200 transition-all flex items-center justify-between gap-3"
                                                    >
                                                        <span className="truncate">{doc.docName || "Untitled Document"}</span>
                                                        <span className="shrink-0 text-xs text-amber-500 font-bold">View →</span>
                                                    </div>
                                                ))}
                                            </div>
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