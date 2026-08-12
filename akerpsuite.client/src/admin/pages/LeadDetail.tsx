import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService, getDocumentUrl } from "@/services/adminService";

const TABS = [
    { key: "overview", label: "1. Overview", icon: "fa-solid fa-address-card" },
    { key: "followups", label: "2. Follow-ups", icon: "fa-solid fa-phone-volume" },
    { key: "survey", label: "3. Site Survey & Feasibility", icon: "fa-solid fa-map-location-dot" },
    { key: "proposal", label: "4. Proposal & Payment", icon: "fa-solid fa-file-invoice-dollar" },
    { key: "bom", label: "5. BOM & Booking", icon: "fa-solid fa-boxes-stacked" },
    { key: "dispatch", label: "6. Dispatch & Docs", icon: "fa-solid fa-truck-fast" },
];

const todayISO = () => new Date().toISOString().split("T")[0];

const nowLocalISO = () => {
    const d = new Date();
    d.setSeconds(0, 0);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
};

// Common Input/Label Styles
const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-400";
const labelClass = "block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5 ml-1";

export default function LeadDetail() {
    const { id: leadId } = useParams();
    const navigate = useNavigate(); // <-- Added to fix 'navigate' error
    const [activeTab, setActiveTab] = useState("overview");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Header data (name, phone, status) — shared across all tabs
    const [lead, setLead] = useState<any>(null);
    const [headerLoading, setHeaderLoading] = useState(true);

    // Per-tab data — only fetched once, when that tab is first opened
    const [followups, setFollowups] = useState<any>(null);
    const [surveys, setSurveys] = useState<any>(null);
    const [proposals, setProposals] = useState<any>(null);
    const [payments, setPayments] = useState<any>(null);
    const [bom, setBom] = useState<any>(null);
    const [dispatch, setDispatch] = useState<any>(null);
    const [documents, setDocuments] = useState<any>(null);
    const [inventoryItems, setInventoryItems] = useState<any[]>([]);

    const [tabLoading, setTabLoading] = useState(false);

    // Form states
    const [followupNote, setFollowupNote] = useState("");
    const [followupDate, setFollowupDate] = useState(todayISO());
    const [nextFollowupDate, setNextFollowupDate] = useState("");
    const [surveyDateTime, setSurveyDateTime] = useState(nowLocalISO());
    const [minDateTime, setMinDateTime] = useState(nowLocalISO());

    useEffect(() => {
        const interval = setInterval(() => setMinDateTime(nowLocalISO()), 60000);
        return () => clearInterval(interval);
    }, []);

    const [newMaterial, setNewMaterial] = useState({ itemId: "", quantity: "" });
    const [materialError, setMaterialError] = useState<Record<string, any>>({});
    const [dispatchStatus, setDispatchStatus] = useState("Pending Packing");
    const [actionLoading, setActionLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [systemSizeKw, setSystemSizeKw] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [subsidyAmount, setSubsidyAmount] = useState("");

    // Reminder modal state
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderForm, setReminderForm] = useState({ note: "", reminderDate: "", reminderType: "Follow-up" });

    // ── Add Item (Inventory Master) modal state ──
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
        } catch (err: any) {
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

    const loadTabData = async (tab: string) => {
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
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err?.message || "Could not load data for this tab.");
            setTabLoading(false);
        }
    };

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
        } catch (err: any) {
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
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while scheduling survey.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleFeasibility = async (isFeasible: boolean) => {
        if (!surveys || surveys.length === 0) {
            setErrorMsg("No survey found to update.");
            return;
        }
        const latestSurveyId = surveys[0].surveyId;

        setActionLoading(true);
        setErrorMsg("");
        try {
            const res = await adminService.updateFeasibility({
                surveyId: latestSurveyId,
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
        } catch (err: any) {
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
            const createdBy = storedUser.empId;

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
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while generating proposal.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleProposalAction = async (proposalId: number, status: string) => {
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
        } catch (err: any) {
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
        } catch (err: any) {
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

        if (newMaterial.itemId && bom.some((b: any) => String(b.itemId) === String(newMaterial.itemId))) {
            errors.itemId = "This item is already added.";
        }

        setMaterialError(errors);

        if (Object.keys(errors).length > 0) return;

        setMaterialError({});
        handleAddMaterial();
    };

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
                await refreshInventoryItems();
            } else {
                setErrorMsg(res?.message || "Could not add item.");
            }
        } catch (err: any) {
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
        } catch (err: any) {
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
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while updating dispatch status.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleUploadDocument = async (e: any) => {
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
        } catch (err: any) {
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
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err?.message || "Something went wrong while creating reminder.");
        } finally {
            setActionLoading(false);
        }
    };

    if (headerLoading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Loading lead details...</div>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="m-6 rounded-2xl bg-rose-50 border border-rose-100 px-6 py-6 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
                    <i className="fa-solid fa-triangle-exclamation" />
                </div>
                <p className="text-slate-700 text-sm font-bold">{errorMsg || "Lead not found."}</p>
                <button
                    onClick={() => navigate('/sales/leads')}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                    Go Back to Leads
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans relative z-0 pb-10">

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 border-4 border-[#0b2532] shadow-xl text-[#0b2532] text-xl font-black uppercase">
                        {(lead.name || "?").trim().charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{lead.name}</h2>
                            <span className="px-2.5 py-1 bg-white/10 border border-white/20 text-white rounded-lg text-[10px] font-bold tracking-wider shadow-sm">
                                #{lead.leadId}
                            </span>
                        </div>
                        <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-3">
                            <span><i className="fa-solid fa-phone text-amber-500 mr-1.5" /> {lead.contactNo}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span className="flex items-center gap-1.5">
                                <span className="uppercase tracking-wider font-bold">Stage:</span>
                                <span className="text-white px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-bold">{lead.status}</span>
                            </span>
                        </p>
                    </div>
                </div>

                <div className="relative z-10 w-full sm:w-auto">
                    <button
                        onClick={() => setShowReminderModal(true)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-amber-400 text-[#0b2836] font-bold rounded-xl text-xs shadow-md shadow-amber-400/20 hover:bg-amber-500 transition-all flex items-center justify-center gap-2"
                    >
                        <i className="fa-regular fa-bell" /> Create Reminder
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold px-5 py-3.5 rounded-xl shadow-sm flex items-center gap-2 animate-in fade-in">
                    <i className="fa-solid fa-triangle-exclamation" /> {errorMsg}
                </div>
            )}
            {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold px-5 py-3.5 rounded-xl shadow-sm flex items-center gap-2 animate-in fade-in">
                    <i className="fa-solid fa-circle-check" /> {successMsg}
                </div>
            )}

            {/* ── Main Container (Tabs + Content) ── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

                {/* ── Tabs Navigation ── */}
                <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/50">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap flex items-center gap-2 focus:outline-none ${activeTab === tab.key
                                    ? "border-amber-500 text-amber-600 bg-white"
                                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                }`}
                        >
                            {tab.icon && <i className={`${tab.icon} text-[13px]`} />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6 sm:p-8 min-h-[400px]">
                    {tabLoading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-4">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Loading data...</div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300">
                            {/* TAB 1: OVERVIEW */}
                            {activeTab === "overview" && (
                                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                                    <div className="flex items-center gap-3 mb-6 border-b border-slate-200/80 pb-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <i className="fa-solid fa-address-card" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Client Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Client Name</p>
                                            <p className="text-sm font-bold text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-xl">{lead.name || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phone Number</p>
                                            <p className="text-sm font-mono font-bold text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-xl">{lead.contactNo || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email Address</p>
                                            <p className="text-sm font-medium text-slate-800 bg-white border border-slate-200 px-4 py-2.5 rounded-xl">{lead.email || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Site Address</p>
                                            <p className="text-sm font-medium text-slate-800 bg-white border border-slate-200 px-4 py-2.5 rounded-xl break-words">{lead.address || "—"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: FOLLOW-UPS */}
                            {activeTab === "followups" && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="border border-slate-200 rounded-2xl p-6 shadow-sm bg-white self-start">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                                            <i className="fa-solid fa-plus-circle text-amber-500" />
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Add Follow-up Note</h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                                            <div>
                                                <label className={labelClass}>
                                                    Follow-up Date *
                                                </label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={followupDate}
                                                    onChange={e => setFollowupDate(e.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>
                                                    Next Reminder (Optional)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={nextFollowupDate}
                                                    min={todayISO()}
                                                    onChange={e => setNextFollowupDate(e.target.value)}
                                                    className={inputClass}
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium ml-1">Auto-creates a reminder notification.</p>
                                            </div>
                                        </div>

                                        <label className={labelClass}>Discussion Notes</label>
                                        <textarea
                                            placeholder="What was discussed with the client?"
                                            value={followupNote}
                                            onChange={e => setFollowupNote(e.target.value)}
                                            rows={4}
                                            className={`${inputClass} resize-y mb-5`}
                                        />
                                        <button
                                            onClick={handleAddFollowup}
                                            disabled={actionLoading}
                                            className="w-full px-6 py-3 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-md hover:bg-[#0f3345] disabled:opacity-60 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                                        >
                                            {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-paper-plane" />}
                                            {actionLoading ? "Submitting..." : "Submit Follow-up"}
                                        </button>
                                    </div>

                                    <div className="border border-slate-200 rounded-2xl p-6 shadow-sm bg-slate-50">
                                        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 mb-5">
                                            <i className="fa-solid fa-clock-rotate-left text-blue-500" />
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Interaction Timeline</h3>
                                        </div>
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {(followups || []).length === 0 ? (
                                                <div className="text-center py-10">
                                                    <i className="fa-regular fa-comments text-3xl text-slate-300 mb-2" />
                                                    <p className="text-sm font-bold text-slate-500">No follow-ups recorded yet.</p>
                                                </div>
                                            ) : followups.map((f: any, idx: number) => (
                                                <div key={f.followupId || idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative">
                                                    <div className="absolute top-5 right-5">
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                                                            By {f.createdBy || "System"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1.5">
                                                        <i className="fa-regular fa-calendar" /> {f.followupDate?.split("T")[0]}
                                                    </p>
                                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{f.notes}</p>
                                                    {f.nextFollowupDate && (
                                                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-600">
                                                            <i className="fa-regular fa-bell" />
                                                            Reminder Set: {f.nextFollowupDate?.split("T")[0]}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: SITE SURVEY & FEASIBILITY */}
                            {activeTab === "survey" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="border border-slate-200 rounded-2xl p-6 shadow-sm bg-white self-start space-y-8">

                                        <div>
                                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                                                <i className="fa-solid fa-calendar-check text-amber-500" />
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Schedule Site Survey</h3>
                                            </div>
                                            <label className={labelClass}>Survey Date & Time *</label>
                                            <input
                                                type="datetime-local"
                                                value={surveyDateTime}
                                                min={minDateTime}
                                                onChange={e => setSurveyDateTime(e.target.value)}
                                                className={inputClass}
                                            />
                                            <button
                                                onClick={handleScheduleSurvey}
                                                disabled={actionLoading}
                                                className="mt-4 w-full px-6 py-3 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-md hover:bg-[#0f3345] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                                            >
                                                {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-regular fa-calendar-plus" />}
                                                {actionLoading ? "Scheduling..." : "Schedule Survey"}
                                            </button>
                                        </div>

                                        <div className="pt-6 border-t border-slate-200">
                                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                                                <i className="fa-solid fa-clipboard-check text-emerald-500" />
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Feasibility Decision</h3>
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 leading-relaxed">After survey completion, mark whether the project site is feasible for installation.</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleFeasibility(true)}
                                                    disabled={actionLoading || !surveys || surveys.length === 0}
                                                    className="flex-1 px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-xs shadow-sm hover:bg-emerald-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <i className="fa-solid fa-check" /> {actionLoading ? "..." : "Accept Feasibility"}
                                                </button>
                                                <button
                                                    onClick={() => handleFeasibility(false)}
                                                    disabled={actionLoading || !surveys || surveys.length === 0}
                                                    className="flex-1 px-4 py-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold rounded-xl text-xs shadow-sm hover:bg-rose-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <i className="fa-solid fa-xmark" /> {actionLoading ? "..." : "Reject Feasibility"}
                                                </button>
                                            </div>
                                        </div>

                                    </div>

                                    <div className="border border-slate-200 rounded-2xl p-6 shadow-sm bg-slate-50">
                                        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 mb-5">
                                            <i className="fa-solid fa-clock-rotate-left text-blue-500" />
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Survey History</h3>
                                        </div>
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {(surveys || []).length === 0 ? (
                                                <div className="text-center py-10">
                                                    <i className="fa-solid fa-map-location-dot text-3xl text-slate-300 mb-2" />
                                                    <p className="text-sm font-bold text-slate-500">No surveys scheduled yet.</p>
                                                </div>
                                            ) : surveys.map((s: any, idx: number) => (
                                                <div key={s.surveyId || idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Scheduled Date</p>
                                                            <p className="text-sm font-bold text-amber-600">
                                                                {s.surveyDate ? new Date(s.surveyDate).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : "Not scheduled"}
                                                            </p>
                                                        </div>
                                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                                                            {s.status}
                                                        </span>
                                                    </div>

                                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2">
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Result</p>
                                                        <div className="text-sm font-bold">
                                                            {s.isFeasible === true && <span className="text-emerald-600 flex items-center gap-1.5"><i className="fa-solid fa-circle-check" /> Feasible for Installation</span>}
                                                            {s.isFeasible === false && <span className="text-rose-600 flex items-center gap-1.5"><i className="fa-solid fa-circle-xmark" /> Not Feasible</span>}
                                                            {(s.isFeasible === null || s.isFeasible === undefined) && <span className="text-amber-600 flex items-center gap-1.5"><i className="fa-solid fa-clock" /> Pending Decision</span>}
                                                        </div>
                                                    </div>

                                                    {s.surveyorName && (
                                                        <p className="text-[11px] font-semibold text-slate-400 mt-3 flex items-center gap-1.5">
                                                            <i className="fa-solid fa-user-tie" /> Surveyor: <span className="text-slate-700">{s.surveyorName}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: PROPOSAL & PAYMENT */}
                            {activeTab === "proposal" && (
                                <div className="space-y-8">
                                    {/* Generate Proposal form */}
                                    <div className="border border-slate-200 rounded-2xl p-6 shadow-sm bg-white">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                                            <i className="fa-solid fa-file-invoice text-amber-500" />
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Generate New Proposal</h3>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 items-end">
                                            <div>
                                                <label className={labelClass}>System Size (kW) *</label>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 5"
                                                    value={systemSizeKw}
                                                    onChange={e => setSystemSizeKw(e.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Total Amount (₹) *</label>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 250000"
                                                    value={totalAmount}
                                                    onChange={e => setTotalAmount(e.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Subsidy Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 78000"
                                                    value={subsidyAmount}
                                                    onChange={e => setSubsidyAmount(e.target.value)}
                                                    className={inputClass}
                                                />
                                            </div>
                                            <div className="w-full">
                                                <button
                                                    onClick={handleGenerateProposal}
                                                    disabled={actionLoading}
                                                    className="w-full px-4 py-2.5 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-md shadow-[#0b2836]/20 hover:bg-[#0f3345] disabled:opacity-60 transition-all flex items-center justify-center gap-2 h-[42px]"
                                                >
                                                    {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-plus" />}
                                                    {actionLoading ? "Generating..." : "Generate"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Proposals table */}
                                    <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
                                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Proposal History</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left border-collapse min-w-[800px]">
                                                <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-6 py-4">System Size</th>
                                                        <th className="px-6 py-4">Total Amount</th>
                                                        <th className="px-6 py-4">Subsidy Amount</th>
                                                        <th className="px-6 py-4">Status</th>
                                                        <th className="px-6 py-4 text-right">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                                    {(proposals || []).length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                                    <i className="fa-solid fa-file-circle-xmark text-3xl text-slate-300 mb-1" />
                                                                    <p className="text-sm font-bold text-slate-500">No proposals generated yet.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : proposals.map((p: any, idx: number) => (
                                                        <tr key={p.proposalId || idx} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-slate-900">{p.systemSizeKw || "-"} kW</td>
                                                            <td className="px-6 py-4 font-mono font-bold text-slate-900">₹ {Number(p.totalAmount || 0).toLocaleString("en-IN")}</td>
                                                            <td className="px-6 py-4 font-mono font-bold text-emerald-600">₹ {Number(p.subsidyAmount || 0).toLocaleString("en-IN")}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${p.status === "Accepted"
                                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                                                                        : p.status === "Rejected"
                                                                            ? "bg-rose-50 text-rose-700 border-rose-200/60"
                                                                            : "bg-amber-50 text-amber-700 border-amber-200/60"
                                                                    }`}>
                                                                    {p.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {(p.status === "Draft" || p.status === "Pending") ? (
                                                                    <div className="flex gap-2 justify-end">
                                                                        <button
                                                                            onClick={() => handleProposalAction(p.proposalId, "Accepted")}
                                                                            disabled={actionLoading}
                                                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold rounded-lg text-[10px] uppercase tracking-wider hover:bg-emerald-100 disabled:opacity-60 transition-all shadow-sm"
                                                                        >
                                                                            Accept
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleProposalAction(p.proposalId, "Rejected")}
                                                                            disabled={actionLoading}
                                                                            className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200/60 font-bold rounded-lg text-[10px] uppercase tracking-wider hover:bg-rose-100 disabled:opacity-60 transition-all shadow-sm"
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-300 text-xs font-bold">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: BOM & BOOKING */}
                            {activeTab === "bom" && (
                                <div className="space-y-6">
                                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4 mb-5">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-solid fa-boxes-stacked text-amber-500" />
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Material Requirements (BOM)</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowItemModal(true)}
                                                className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200/60 font-bold rounded-xl text-xs hover:bg-amber-100 transition-all shadow-sm flex items-center gap-2"
                                            >
                                                <i className="fa-solid fa-plus" /> New Inventory Item
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end mb-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                            <div>
                                                <label className={labelClass}>Select Material *</label>
                                                <select
                                                    value={newMaterial.itemId}
                                                    onChange={e => setNewMaterial({ ...newMaterial, itemId: e.target.value })}
                                                    className={`${inputClass} appearance-none cursor-pointer ${materialError.itemId ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500" : ""}`}
                                                >
                                                    <option value="" disabled>-- Select Item --</option>
                                                    {inventoryItems.map(item => (
                                                        <option key={item.itemId} value={item.itemId}>{item.itemName}</option>
                                                    ))}
                                                </select>
                                                {materialError.itemId && (
                                                    <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{materialError.itemId}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className={labelClass}>Required Quantity *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    placeholder="e.g. 10"
                                                    value={newMaterial.quantity}
                                                    onChange={e => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                                                    className={`${inputClass} ${materialError.quantity ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500" : ""}`}
                                                />
                                                {materialError.quantity && (
                                                    <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{materialError.quantity}</p>
                                                )}
                                            </div>

                                            <div className="w-full">
                                                <button
                                                    onClick={handleAddMaterialValidated}
                                                    disabled={actionLoading}
                                                    className="w-full px-4 py-2.5 bg-[#0b2836] text-white font-bold rounded-xl text-sm hover:bg-[#0f3345] shadow-md shadow-[#0b2836]/20 disabled:opacity-60 transition-all h-[42px] flex items-center justify-center gap-2"
                                                >
                                                    {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-plus" />}
                                                    {actionLoading ? "Adding..." : "Add to BOM"}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                                            <table className="w-full text-left border-collapse min-w-[700px]">
                                                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                                    <tr>
                                                        <th className="px-6 py-4">Item Name</th>
                                                        <th className="px-6 py-4 text-center">Req. Qty</th>
                                                        <th className="px-6 py-4">Unit</th>
                                                        <th className="px-6 py-4 text-right">Availability Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                                    {(bom || []).length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                                                    <i className="fa-solid fa-box-open text-3xl text-slate-300 mb-1" />
                                                                    <p className="text-sm font-bold text-slate-500">No materials added to BOM yet.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : bom.map((item: any, idx: number) => (
                                                        <tr key={item.bomId || idx} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-slate-900">{item.itemName || "-"}</td>
                                                            <td className="px-6 py-4 text-center font-mono font-bold text-slate-700 bg-slate-50/50">{item.requiredQty ?? "-"}</td>
                                                            <td className="px-6 py-4 font-medium text-slate-500">{item.unit || "-"}</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${item.shortageQty > 0
                                                                        ? "bg-rose-50 text-rose-700 border-rose-200/50"
                                                                        : "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                                                    }`}>
                                                                    {item.shortageQty > 0 ? (
                                                                        <><i className="fa-solid fa-circle-exclamation" /> Needs Booking</>
                                                                    ) : (
                                                                        <><i className="fa-solid fa-circle-check" /> In Stock</>
                                                                    )}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 6: DISPATCH & DOCS */}
                            {activeTab === "dispatch" && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                    {/* LEFT COLUMN: Dispatch Info */}
                                    <div className="space-y-8">

                                        {/* Create Dispatch Entry */}
                                        <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
                                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                                                <i className="fa-solid fa-truck-fast text-amber-500" />
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                                    Create Dispatch Entry
                                                </h3>
                                            </div>

                                            <div className="space-y-5 mb-6">
                                                <div>
                                                    <label className={labelClass}>Dispatch Date *</label>
                                                    <input
                                                        type="date"
                                                        value={dispatchForm.dispatchDate}
                                                        onChange={e => setDispatchForm({ ...dispatchForm, dispatchDate: e.target.value })}
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Transporter Name</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Blue Dart, Delhivery"
                                                        value={dispatchForm.transporter}
                                                        onChange={e => setDispatchForm({ ...dispatchForm, transporter: e.target.value })}
                                                        className={inputClass}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Tracking Number</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. TRK123456"
                                                        value={dispatchForm.trackingNo}
                                                        onChange={e => setDispatchForm({ ...dispatchForm, trackingNo: e.target.value })}
                                                        className={inputClass}
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleCreateDispatch}
                                                disabled={actionLoading}
                                                className="w-full px-6 py-3 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-md shadow-[#0b2836]/20 hover:bg-[#0f3345] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                                            >
                                                {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-truck-ramp-box" />}
                                                {actionLoading ? "Creating..." : "Create Dispatch Entry"}
                                            </button>
                                        </div>

                                        {/* Dispatch Status update */}
                                        <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm">
                                            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                                                <i className="fa-solid fa-route text-blue-500" />
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                                    Update Dispatch Status
                                                </h3>
                                            </div>
                                            <div className="mb-5">
                                                <label className={labelClass}>New Status</label>
                                                <select
                                                    value={dispatchStatus}
                                                    onChange={e => setDispatchStatus(e.target.value)}
                                                    className={`${inputClass} cursor-pointer appearance-none`}
                                                >
                                                    <option value="Pending Packing">Pending Packing</option>
                                                    <option value="Dispatched">Dispatched</option>
                                                    <option value="Delivered">Delivered</option>
                                                </select>
                                            </div>
                                            <button
                                                onClick={handleUpdateDispatchStatus}
                                                disabled={actionLoading}
                                                className="w-full px-6 py-3 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:bg-amber-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                                            >
                                                {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-rotate" />}
                                                {actionLoading ? "Updating..." : "Update Status"}
                                            </button>
                                        </div>

                                        {/* Dispatch History */}
                                        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 shadow-sm">
                                            <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 mb-5">
                                                <i className="fa-solid fa-clock-rotate-left text-slate-500" />
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                                    Dispatch History
                                                </h3>
                                            </div>
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                {(dispatch || []).length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <i className="fa-solid fa-box text-3xl text-slate-300 mb-2" />
                                                        <p className="text-sm font-bold text-slate-500">No dispatch entries yet.</p>
                                                    </div>
                                                ) : dispatch.map((d: any, idx: number) => (
                                                    <div
                                                        key={d.dispatchId ?? idx}
                                                        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                                                    >
                                                        <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Date</p>
                                                                <p className="text-sm font-bold text-amber-600">
                                                                    {d.dispatchDate ? new Date(d.dispatchDate).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : "Not set"}
                                                                </p>
                                                            </div>
                                                            <span className="shrink-0 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/50 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                                {d.status}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Transporter</p>
                                                                <p className="font-semibold text-slate-800 truncate">{d.transporter || "—"}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Tracking #</p>
                                                                <p className="font-mono font-bold text-slate-700 truncate">{d.trackingNo || "—"}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </div>

                                    {/* RIGHT COLUMN: Documents */}
                                    <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm self-start">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                                            <div className="flex items-center gap-2">
                                                <i className="fa-regular fa-folder-open text-amber-500" />
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                                                    Documents & Files
                                                </h3>
                                            </div>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={actionLoading}
                                                className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/50 rounded-lg text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 shadow-sm"
                                            >
                                                {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-cloud-arrow-up" />}
                                                {actionLoading ? "Uploading..." : "Upload File"}
                                            </button>
                                            <input type="file" ref={fileInputRef} onChange={handleUploadDocument} className="hidden" />
                                        </div>

                                        <div className="space-y-3">
                                            {(documents || []).length === 0 ? (
                                                <div className="text-center py-12 bg-slate-50 border border-slate-100 border-dashed rounded-xl">
                                                    <i className="fa-regular fa-file-pdf text-3xl text-slate-300 mb-2" />
                                                    <p className="text-sm font-bold text-slate-500">No documents uploaded yet.</p>
                                                    <p className="text-xs text-slate-400 mt-1 font-medium">Upload agreements, ID proofs, or site photos.</p>
                                                </div>
                                            ) : documents.map((doc: any, idx: number) => (
                                                <div
                                                    key={doc.docId ?? idx}
                                                    onClick={() => window.open(getDocumentUrl(doc.filePath || doc.docPath || doc.path), "_blank")}
                                                    className="p-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between gap-4 shadow-sm group"
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                                                            <i className="fa-regular fa-file-lines text-lg" />
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-amber-700 transition-colors">
                                                                {doc.docName || "Untitled Document"}
                                                            </p>
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                                                                Tap to view/download
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600 flex items-center justify-center shrink-0 transition-colors">
                                                        <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Reminder Modal ── */}
            {showReminderModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-7 w-full max-w-md relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                            <h3 className="text-lg font-bold text-slate-900">Create Reminder</h3>
                            <button onClick={() => setShowReminderModal(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className={labelClass}>Reminder Type</label>
                                <select
                                    value={reminderForm.reminderType || "Follow-up"}
                                    onChange={e => setReminderForm({ ...reminderForm, reminderType: e.target.value })}
                                    className={`${inputClass} cursor-pointer appearance-none`}
                                >
                                    <option value="Follow-up">Follow-up</option>
                                    <option value="Call">Call</option>
                                    <option value="Visit">Visit</option>
                                    <option value="Payment">Payment</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Note *</label>
                                <textarea
                                    value={reminderForm.note}
                                    onChange={e => setReminderForm({ ...reminderForm, note: e.target.value })}
                                    rows={3}
                                    placeholder="What should be remembered?"
                                    className={`${inputClass} resize-y`}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Reminder Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    min={nowLocalISO()}
                                    value={reminderForm.reminderDate}
                                    onChange={e => setReminderForm({ ...reminderForm, reminderDate: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-6">
                            <button onClick={() => setShowReminderModal(false)} className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleCreateReminder} disabled={actionLoading} className="px-6 py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md shadow-amber-600/20 hover:bg-amber-700 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 transition-all flex items-center gap-2">
                                {actionLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-regular fa-bell" />}
                                {actionLoading ? "Saving..." : "Save Reminder"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Add Item (Inventory Master) MODAL ── */}
            {showItemModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl p-7 w-full max-w-md relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5">
                            <h3 className="text-lg font-bold text-slate-900">Add New Inventory Item</h3>
                            <button
                                type="button"
                                onClick={() => { setShowItemModal(false); setItemForm({ ...itemForm, itemName: "", unit: "" }); setErrorMsg(""); }}
                                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
                                <i className="fa-solid fa-circle-exclamation" /> {errorMsg}
                            </div>
                        )}

                        <form className="space-y-5">
                            <div>
                                <label className={labelClass}>Item Code</label>
                                <input
                                    type="text"
                                    placeholder="e.g. PNL-550"
                                    value={itemForm.itemCode}
                                    onChange={e => setItemForm({ ...itemForm, itemCode: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Item Name *</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="e.g. Solar Panel 550W Mono PERC"
                                    value={itemForm.itemName}
                                    onChange={e => setItemForm({ ...itemForm, itemName: e.target.value })}
                                    className={inputClass}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Category</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Panels"
                                        value={itemForm.category}
                                        onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Unit *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Nos, Mtr, Kg"
                                        value={itemForm.unit}
                                        onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Opening Stock</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={itemForm.currentStock}
                                        onChange={e => setItemForm({ ...itemForm, currentStock: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Reorder Level</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={itemForm.reorderLevel}
                                        onChange={e => setItemForm({ ...itemForm, reorderLevel: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-5 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowItemModal(false); setItemForm({ ...itemForm, itemName: "", unit: "" }); setErrorMsg(""); }}
                                    className="px-5 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    disabled={itemLoading}
                                    className="px-6 py-2.5 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-md shadow-[#0b2836]/20 hover:bg-[#0f3345] hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 transition-all flex items-center gap-2"
                                >
                                    {itemLoading ? <i className="fa-solid fa-spinner animate-spin" /> : <i className="fa-solid fa-floppy-disk" />}
                                    {itemLoading ? "Saving..." : "Save Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}