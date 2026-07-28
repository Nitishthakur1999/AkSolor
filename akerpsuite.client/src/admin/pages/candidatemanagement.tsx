import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";

// Helper to get logged in user's ID
const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.userId ?? user?.UserId ?? user?.emp_id ?? 1;
};

// Matches DB enum: candidates.status
function Badge({ status }) {
    const map = {
        Applied: "bg-slate-100 text-slate-600 border-slate-200",
        Shortlisted: "bg-blue-50 text-blue-700 border-blue-200",
        Interview: "bg-amber-50 text-amber-700 border-amber-200",
        Selected: "bg-emerald-50 text-emerald-700 border-emerald-200",
        Offer: "bg-amber-50 text-amber-700 border-amber-200",
        Joined: "bg-green-50 text-green-700 border-green-200",
        Rejected: "bg-red-50 text-red-700 border-red-200",
    };
    const cls = map[status] ?? "bg-slate-100 text-slate-600 border-slate-200";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${cls}`}>
            {status}
        </span>
    );
}

function Field({ label, children }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</label>
            {children}
        </div>
    );
}

function Input(props) {
    return (
        <input
            {...props}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white disabled:bg-slate-50 disabled:text-slate-500"
        />
    );
}

function Select({ children, ...props }) {
    return (
        <select
            {...props}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white"
        >
            {children}
        </select>
    );
}

function TextArea(props) {
    return (
        <textarea
            {...props}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white resize-none"
        />
    );
}

// ─── NEW: single dropdown menu instead of scattered inline text-buttons ─────
// Each row now shows ONE "Actions ▾" trigger. Clicking it reveals only the
// actions valid for that candidate's current stage, as a clean list.
function ActionsMenu({ actions }) {
    const [open, setOpen] = useState(false);

    if (!actions || actions.length === 0) {
        return <span className="text-xs text-slate-400">—</span>;
    }

    return (
        <div className="relative inline-block text-left">
            <button
                onClick={() => setOpen(o => !o)}
                className="text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1"
            >
                Actions <span className="text-[9px] mt-px">▾</span>
            </button>

            {open && (
                <>
                    {/* click-away layer */}
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden py-1">
                        {actions.map((a, i) => (
                            <button
                                key={i}
                                onClick={() => { setOpen(false); a.onClick(); }}
                                className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-slate-50 ${a.danger ? "text-red-500" : "text-slate-700"
                                    }`}
                            >
                                {a.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

// Config: which fields each modal type needs, and the label/button text
const MODAL_CONFIG = {
    interview: {
        title: "Schedule Interview",
        submitLabel: "Schedule",
    },
    feedback: {
        title: "Submit Interview Feedback",
        submitLabel: "Submit Feedback",
    },
    selection: {
        title: "Selection Approval",
        submitLabel: "Confirm Decision",
    },
    offer: {
        title: "Create Offer",
        submitLabel: "Create Offer",
    },
    joining: {
        title: "Confirm Joining",
        submitLabel: "Confirm Joining",
    },
};

export default function CandidateManagement() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [statusFilter, setStatusFilter] = useState("");
    const [searchName, setSearchName] = useState("");

    // Modal States
    const [activeModal, setActiveModal] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [dependentData, setDependentData] = useState(null);

    // tracks each "Offer" stage candidate's actual offer.status (Pending/Approved/Rejected)
    // separately from candidate.status, since candidate.status stays "Offer" throughout.
    const [offerStatusMap, setOfferStatusMap] = useState<Record<string, any>>({});

    useEffect(() => { loadCandidates(); }, [statusFilter]);

    const loadCandidates = async () => {
        setLoading(true);
        try {
            const filter: Record<string, any> = {};
            if (statusFilter) filter.status = statusFilter;
            if (searchName) filter.name = searchName;

            const res = await adminService.searchCandidates(filter);
            if (res.Success || res.success) {
                const list = res.Data || res.data || [];
                setCandidates(list);
                loadOfferStatuses(list);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // fetch offer.status for every candidate currently at the "Offer" stage
    const loadOfferStatuses = async (candidateList) => {
        const offerCandidates = candidateList.filter(c => c.status === "Offer");
        if (offerCandidates.length === 0) return;

        const results = await Promise.all(
            offerCandidates.map(async (c) => {
                try {
                    const res = await adminService.getOfferByCandidate(c.candidateId);
                    const offer = res.Data || res.data;
                    return [c.candidateId, offer?.status || "Pending"];
                } catch {
                    return [c.candidateId, "Pending"];
                }
            })
        );
        setOfferStatusMap(prev => ({ ...prev, ...Object.fromEntries(results) }));
    };

    const handleSimpleStatusUpdate = async (candidateId, status) => {
        if (!window.confirm(`Mark this candidate as ${status}?`)) return;
        setActionLoading(true);
        try {
            const res = await adminService.updateCandidateStatus({
                candidateId,
                status,
                updatedBy: getUserId(),
                remarks: `Status updated to ${status}`
            });
            if (res.Success || res.success) {
                loadCandidates();
            } else {
                alert(res.Message || "Action failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setActionLoading(false);
        }
    };

    // Approve / Reject an offer
    const handleOfferAction = async (candidate, status) => {
        if (!window.confirm(`${status === "Approved" ? "Approve" : "Reject"} this offer?`)) return;
        setActionLoading(true);
        try {
            const offerRes = await adminService.getOfferByCandidate(candidate.candidateId);
            const offer = offerRes.Data || offerRes.data;
            if (!offer?.offerId) {
                alert("No offer found for this candidate.");
                return;
            }
            const res = await adminService.actionOffer({
                offerId: offer.offerId,
                status,
                approvedBy: getUserId(),
                remarks: `Offer ${status} via Candidate Tracking`
            });
            if (res.Success || res.success) {
                alert(res.Message || `Offer ${status.toLowerCase()} successfully.`);
                setOfferStatusMap(prev => ({ ...prev, [candidate.candidateId]: status }));
                loadCandidates();
            } else {
                alert(res.Message || "Action failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setActionLoading(false);
        }
    };

    const openModal = async (type, candidate) => {
        setSelectedCandidate(candidate);
        setFormData(type === "selection" ? { status: "Selected" } : {});
        setDependentData(null);
        setActiveModal(type);

        try {
            if (type === "feedback") {
                const res = await adminService.getInterviewsByCandidate(candidate.candidateId);
                if (res.Success || res.success) {
                    const interviews = res.Data || res.data || [];
                    if (interviews.length > 0) {
                        const last = interviews[interviews.length - 1];
                        setDependentData({ interviewId: last.interviewId });
                        setFormData(f => ({ ...f, roundNo: last.roundNo || 1 }));
                    } else {
                        alert("No interview records found.");
                        setActiveModal(null);
                    }
                }
            } else if (type === "joining") {
                const res = await adminService.getOfferByCandidate(candidate.candidateId);
                if (res.Success || res.success) {
                    const offer = res.Data || res.data;
                    if (offer && offer.offerId) {
                        if (offer.status !== "Approved") {
                            alert(`Offer must be Approved first. Current status: ${offer.status}`);
                            setActiveModal(null);
                            return;
                        }
                        setDependentData({ offerId: offer.offerId });
                    } else {
                        alert("No valid offer found.");
                        setActiveModal(null);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load dependent data:", err);
            setActiveModal(null);
        }
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedCandidate(null);
        setFormData({});
        setDependentData(null);
    };

    const submitModal = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            let res;
            const currentUserId = getUserId();

            if (activeModal === "interview") {
                res = await adminService.scheduleInterview({
                    candidateId: selectedCandidate.candidateId,
                    scheduledDate: `${formData.date}T${formData.time}:00`,
                    mode: formData.mode || "Online",
                    location: formData.location || null,
                    interviewers: formData.interviewers,
                    roundNo: formData.roundNo ? parseInt(formData.roundNo) : 1
                });
            } else if (activeModal === "feedback") {
                res = await adminService.submitInterviewFeedback({
                    interviewId: dependentData.interviewId,
                    feedback: formData.feedback,
                    rating: parseInt(formData.rating),
                    result: formData.result || "Pending",
                    roundNo: formData.roundNo ? parseInt(formData.roundNo) : 1,
                    approvedBy: currentUserId
                });
            } else if (activeModal === "selection") {
                res = await adminService.approveSelection({
                    candidateId: selectedCandidate.candidateId,
                    status: formData.status || "Selected",
                    remarks: formData.remarks,
                    approvedBy: currentUserId
                });
            } else if (activeModal === "offer") {
                res = await adminService.createOffer({
                    candidateId: selectedCandidate.candidateId,
                    offeredCtc: parseFloat(formData.offeredCtc),
                    joiningDate: formData.joiningDate,
                    offerExpiry: formData.offerExpiry ? `${formData.offerExpiry}T00:00:00` : null,
                    approvedBy: currentUserId
                });
            } else if (activeModal === "joining") {
                res = await adminService.confirmJoining({
                    offerId: dependentData.offerId,
                    candidateId: selectedCandidate.candidateId,
                    actualJoiningDate: formData.actualJoiningDate,
                    confirmedBy: currentUserId,
                    employeeCode: formData.employeeCode || null
                });
            }

            if (res.Success || res.success) {
                alert(res.Message || "Action completed successfully!");
                closeModal();
                loadCandidates();
            } else {
                alert(res.Message || "Action failed.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Builds the list of valid actions for a candidate's current stage ────
    // Same business logic as before — just returns data now instead of JSX,
    // so ActionsMenu can render it as ONE clean dropdown per row.
    const getActionsFor = (c) => {
        const actions = [];

        if (c.status === "Applied") {
            actions.push({ label: "Shortlist", onClick: () => handleSimpleStatusUpdate(c.candidateId, "Shortlisted") });
        }

        if (c.status === "Shortlisted") {
            actions.push({ label: "Schedule Interview", onClick: () => openModal("interview", c) });
        }

        if (c.status === "Interview") {
            actions.push({ label: "Add Feedback", onClick: () => openModal("feedback", c) });
            actions.push({ label: "Selection Approval", onClick: () => openModal("selection", c) });
        }

        if (c.status === "Selected") {
            actions.push({ label: "Create Offer", onClick: () => openModal("offer", c) });
        }

        if (c.status === "Offer") {
            const offerStatus = offerStatusMap[c.candidateId] || "Pending";

            if (offerStatus === "Approved") {
                actions.push({ label: "Confirm Joining", onClick: () => openModal("joining", c) });
            } else if (offerStatus === "Rejected") {
                // no actionable next step — ActionsMenu will show "—"
            } else {
                actions.push({ label: "Approve Offer", onClick: () => handleOfferAction(c, "Approved") });
                actions.push({ label: "Reject Offer", onClick: () => handleOfferAction(c, "Rejected"), danger: true });
            }
        }

        if (!["Rejected", "Joined", "Offer"].includes(c.status)) {
            actions.push({ label: "Reject Candidate", onClick: () => handleSimpleStatusUpdate(c.candidateId, "Rejected"), danger: true });
        }

        return actions;
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white"
                    >
                        <option value="">All Statuses</option>
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Interview">Interview</option>
                        <option value="Selected">Selected</option>
                        <option value="Offer">Offer</option>
                        <option value="Joined">Joined</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchName}
                        onChange={e => setSearchName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && loadCandidates()}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-400 bg-white"
                    />
                    <button onClick={loadCandidates}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200">
                        Search
                    </button>
                </div>
                <span className="text-xs text-slate-400">{candidates.length} candidate(s)</span>
            </div>

            {/* Candidates Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Email</th>
                            <th className="px-4 py-3 text-left">Phone</th>
                            <th className="px-4 py-3 text-left">Experience</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-400">Loading...</td></tr>
                        ) : candidates.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-slate-400">No candidates found</td></tr>
                        ) : (
                            candidates.map(c => (
                                <tr key={c.candidateId} className="hover:bg-slate-50/60">
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                        {c.firstName} {c.lastName}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{c.email}</td>
                                    <td className="px-4 py-3 text-slate-500">{c.phone}</td>
                                    <td className="px-4 py-3 text-slate-500">{c.experience || "-"}</td>
                                    <td className="px-4 py-3"><Badge status={c.status} /></td>
                                    <td className="px-4 py-3">
                                        <ActionsMenu actions={getActionsFor(c)} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Action Modal */}
            {activeModal && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg my-8 relative">
                        <button onClick={closeModal}
                            className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 text-xl">✕</button>

                        <h2 className="text-xl font-bold text-slate-900 mb-1">{MODAL_CONFIG[activeModal].title}</h2>
                        <p className="text-sm text-slate-500 mb-6">{selectedCandidate?.name}</p>

                        <form onSubmit={submitModal} className="space-y-4">

                            {/* ---- Schedule Interview ---- */}
                            {activeModal === "interview" && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Date *">
                                            <Input type="date" required
                                                value={formData.date || ""}
                                                onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                        </Field>
                                        <Field label="Time *">
                                            <Input type="time" required
                                                value={formData.time || ""}
                                                onChange={e => setFormData({ ...formData, time: e.target.value })} />
                                        </Field>
                                    </div>
                                    <Field label="Mode *">
                                        <Select required value={formData.mode || "Online"}
                                            onChange={e => setFormData({ ...formData, mode: e.target.value })}>
                                            <option value="Online">Online</option>
                                            <option value="In-Person">In-Person</option>
                                            <option value="Telephonic">Telephonic</option>
                                        </Select>
                                    </Field>
                                    {formData.mode === "In-Person" && (
                                        <Field label="Location">
                                            <Input type="text"
                                                value={formData.location || ""}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                        </Field>
                                    )}
                                    <Field label="Interviewer(s) *">
                                        <Input type="text" required placeholder="Names, comma separated"
                                            value={formData.interviewers || ""}
                                            onChange={e => setFormData({ ...formData, interviewers: e.target.value })} />
                                    </Field>
                                    <Field label="Round No.">
                                        <Input type="number" min="1"
                                            value={formData.roundNo || 1}
                                            onChange={e => setFormData({ ...formData, roundNo: e.target.value })} />
                                    </Field>
                                </>
                            )}

                            {/* ---- Interview Feedback ---- */}
                            {activeModal === "feedback" && (
                                <>
                                    <Field label="Rating (1-5) *">
                                        <Input type="number" min="1" max="5" required
                                            value={formData.rating || ""}
                                            onChange={e => setFormData({ ...formData, rating: e.target.value })} />
                                    </Field>
                                    <Field label="Recommendation *">
                                        <Select required value={formData.result || ""}
                                            onChange={e => setFormData({ ...formData, result: e.target.value })}>
                                            <option value="">Select...</option>
                                            <option value="Selected">Recommend for Selection</option>
                                            <option value="NextRound">Move to Next Round</option>
                                            <option value="Rejected">Reject</option>
                                        </Select>
                                    </Field>
                                    <Field label="Feedback Notes *">
                                        <TextArea rows={4} required
                                            value={formData.feedback || ""}
                                            onChange={e => setFormData({ ...formData, feedback: e.target.value })} />
                                    </Field>
                                </>
                            )}

                            {/* ---- Selection Approval ---- */}
                            {activeModal === "selection" && (
                                <>
                                    <Field label="Decision *">
                                        <Select required value={formData.status || "Selected"}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                            <option value="Selected">Selected</option>
                                            <option value="Rejected">Rejected</option>
                                        </Select>
                                    </Field>
                                    <Field label="Remarks">
                                        <TextArea rows={3}
                                            value={formData.remarks || ""}
                                            onChange={e => setFormData({ ...formData, remarks: e.target.value })} />
                                    </Field>
                                </>
                            )}

                            {/* ---- Create Offer ---- */}
                            {activeModal === "offer" && (
                                <>
                                    <Field label="Offered CTC (per annum) *">
                                        <Input type="number" required step="0.01"
                                            value={formData.offeredCtc || ""}
                                            onChange={e => setFormData({ ...formData, offeredCtc: e.target.value })} />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Joining Date *">
                                            <Input type="date" required
                                                value={formData.joiningDate || ""}
                                                onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
                                        </Field>
                                        <Field label="Offer Expiry">
                                            <Input type="date"
                                                value={formData.offerExpiry || ""}
                                                onChange={e => setFormData({ ...formData, offerExpiry: e.target.value })} />
                                        </Field>
                                    </div>
                                </>
                            )}

                            {/* ---- Confirm Joining ---- */}
                            {activeModal === "joining" && (
                                <>
                                    <Field label="Actual Joining Date *">
                                        <Input type="date" required
                                            value={formData.actualJoiningDate || ""}
                                            onChange={e => setFormData({ ...formData, actualJoiningDate: e.target.value })} />
                                    </Field>
                                    <p className="text-xs text-slate-400 -mt-1">
                                        The employee code, username, and password will be generated automatically.
                                    </p>
                                </>
                            )}

                            <button type="submit" disabled={actionLoading}
                                className="w-full py-3 mt-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 disabled:opacity-60 transition-all text-sm shadow-md">
                                {actionLoading ? "Processing..." : MODAL_CONFIG[activeModal].submitLabel}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}