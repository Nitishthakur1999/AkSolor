import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [designations, setDesignations] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const loggedInRoleId = (() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return 999;
            const payload = JSON.parse(atob(token.split(".")[1]));
            return Number(payload.RoleId) || 999;
        } catch {
            return 999;
        }
    })();

    // 🆕 Logged-in employee's own empId — used as approvedBy/createdBy for
    // Promote / Increment / Mark-sent actions instead of hardcoding a user id.
    // Backend already has a claim-based fallback (`emp_id` claim) if 0/blank is sent.
    const loggedInEmpId = (() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return 0;
            const payload = JSON.parse(atob(token.split(".")[1]));
            return Number(payload.EmpId || payload.emp_id) || 0;
        } catch {
            return 0;
        }
    })();

    // 🔍 Live Search Query State
    const [searchQuery, setSearchQuery] = useState("");

    // 🔢 Pagination Configurations State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modals Control Toggles
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // 🔒 Credentials reveal popup state
    const [createdCredentials, setCreatedCredentials] = useState(null);

    // Active tab inside modals
    const [activeTab, setActiveTab] = useState("personal");
    const [copied, setCopied] = useState(false);

    // ── 🆕 Reveal Credentials Modal ─────────────────────────────────────
    const [showRevealModal, setShowRevealModal] = useState(false);
    const [revealTarget, setRevealTarget] = useState(null);
    const [secretKeyInput, setSecretKeyInput] = useState("");
    const [revealedCreds, setRevealedCreds] = useState(null);
    const [revealLoading, setRevealLoading] = useState(false);

    // ── 🆕 Milestone Notifications (Probation ending / Work anniversary) ──
    const [milestones, setMilestones] = useState([]);
    const [milestonesLoading, setMilestonesLoading] = useState(false);
    const [showMilestones, setShowMilestones] = useState(true);

    // ── 🆕 Promotion Modal ──────────────────────────────────────────────
    const [showPromoteModal, setShowPromoteModal] = useState(false);
    const [promoteTarget, setPromoteTarget] = useState(null);
    const [promoteForm, setPromoteForm] = useState({
        newDesigId: "", newDeptId: "", newCtc: "", effectiveDate: "", remarks: ""
    });

    // ── 🆕 Salary Increment Modal ───────────────────────────────────────
    const [showIncrementModal, setShowIncrementModal] = useState(false);
    const [incrementTarget, setIncrementTarget] = useState(null);
    const [incrementForm, setIncrementForm] = useState({
        structureId: "",
        basic: "", hra: "", ta: "", da: "", specialAllow: "",
        pfEmployee: "", pfEmployer: "", esicEmployee: "", esicEmployer: "",
        tds: "", professionalTax: "",
        effectiveFrom: ""
    });

    // ── 🆕 History Modal (Promotions + Salary Increments, tabbed) ───────
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyTarget, setHistoryTarget] = useState(null);
    const [historyTab, setHistoryTab] = useState("promotions");
    const [promotionHistory, setPromotionHistory] = useState([]);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // ✅ Cleaned Form State
    const initialFormState = {
        firstName: "",
        lastName: "",
        gender: "Male",
        dateOfBirth: "",
        bloodGroup: "",
        maritalStatus: "Single",
        personalEmail: "",
        officialEmail: "",
        mobile: "",
        alternateMobile: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
        aadharNo: "",
        panNo: "",
        passportNo: "",
        uanNo: "",
        esicNo: "",
        deptId: "",
        desigId: "",
        reportingManager: "",
        dateOfJoining: "",
        employmentType: "Permanent",
        employmentStatus: "Active",
        currentCtc: "",
        roleId: "",
        probationEndDate: "",
        confirmationDate: ""
    };

    const [createForm, setCreateForm] = useState(initialFormState);
    const [editForm, setEditForm] = useState({ empId: "", ...initialFormState });

    // ✅ Real-time duplicate-field check state (Mobile, Personal Email, Aadhar, PAN, Official Email)
    const emptyFieldCheckMessages = {
        mobile: { type: "", text: "" },
        personalEmail: { type: "", text: "" },
        aadharNo: { type: "", text: "" },
        panNo: { type: "", text: "" },
        officialEmail: { type: "", text: "" },
    };
    const [fieldCheckMessages, setFieldCheckMessages] = useState(emptyFieldCheckMessages);

    const fieldLabels = {
        mobile: "Mobile number",
        personalEmail: "Personal email",
        aadharNo: "Aadhar number",
        panNo: "PAN number",
        officialEmail: "Official email",
    };

    // Generic duplicate-check function — compares against already-loaded employees list
    const checkFieldDuplicate = (fieldName, value, excludeEmpId = null) => {
        const trimmedValue = (value || "").toString().trim().toLowerCase();

        if (!trimmedValue) {
            setFieldCheckMessages(prev => ({ ...prev, [fieldName]: { type: "", text: "" } }));
            return;
        }

        const isDuplicate = employees.some(emp =>
            (emp[fieldName] || "").toString().trim().toLowerCase() === trimmedValue &&
            emp.empId !== excludeEmpId
        );

        setFieldCheckMessages(prev => ({
            ...prev,
            [fieldName]: isDuplicate
                ? { type: "error", text: `${fieldLabels[fieldName]} is already registered with another employee!` }
                : { type: "success", text: "Available ✓" }
        }));
    };

    useEffect(() => {
        loadInitialData();
        loadMilestones();
    }, []);

    // 🔄 Reset current page to 1 when typing search queries
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [empRes, depRes, desigRes, roleRes] = await Promise.all([
                adminService.getEmployees(),
                adminService.getDepartments(),
                adminService.getDesignations(),
                adminService.getRoles()
            ]);

            if (empRes.success) {
                console.log("Sample employee:", empRes.data?.[0]); // 🔍 temp debug — hata dena baad mein
                setEmployees(empRes.data || []);
            }
            if (depRes.success) setDepartments(depRes.data || []);
            if (desigRes.success) setDesignations(desigRes.data || []);
            if (roleRes.success) setRoles(roleRes.data || []);
        } catch (err) {
            console.error("Error loading employee pipeline:", err);
        } finally {
            setLoading(false);
        }
    };

    // 🆕 Load upcoming probation / anniversary milestone alerts (next 7 days)
    const loadMilestones = async () => {
        setMilestonesLoading(true);
        try {
            const res = await adminService.getAllMilestoneAlerts(7);
            if (res.success) setMilestones(res.data || []);
        } catch (err) {
            console.error("Failed to load milestone alerts:", err);
        } finally {
            setMilestonesLoading(false);
        }
    };

    // 🆕 Mark a milestone notification as sent (removes it from the banner)
    const handleMarkMilestoneSent = async (notifId) => {
        try {
            const res = await adminService.markNotificationSent({
                notifId,
                sentBy: loggedInEmpId || 0
            });
            if (res.success) {
                setMilestones(prev => prev.filter(m => m.notifId !== notifId));
            } else {
                alert(res.message || "Failed to mark notification as sent.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error while marking notification sent.");
        }
    };

    // ➕ Add/Create Functionality
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.deptId || !createForm.desigId || !createForm.roleId) {
            return alert("Please map valid Department, Designation, and Role targets!");
        }

        // ✅ NEW: Probation End Date is mandatory when Employment Type is 'Probation'
        if (createForm.employmentType === "Probation" && !createForm.probationEndDate) {
            return alert("Probation End Date is required when Employment Type is 'Probation'.");
        }

        // ✅ Block submit if any duplicate field detected
        const hasDuplicate = Object.values(fieldCheckMessages).some(msg => msg.type === "error");
        if (hasDuplicate) {
            return alert("Please resolve the duplicate field warnings (highlighted in red) before submitting.");
        }

        setActionLoading(true);
        try {
            const payload = {
                firstName: createForm.firstName ? createForm.firstName.trim() : "",
                lastName: createForm.lastName ? createForm.lastName.trim() : "",
                gender: createForm.gender,
                bloodGroup: createForm.bloodGroup || null,
                maritalStatus: createForm.maritalStatus,
                personalEmail: createForm.personalEmail || null,
                officialEmail: createForm.officialEmail ? createForm.officialEmail.trim() : "",
                mobile: createForm.mobile,
                alternateMobile: createForm.alternateMobile || null,
                addressLine1: createForm.addressLine1 || null,
                addressLine2: createForm.addressLine2 || null,
                city: createForm.city || null,
                state: createForm.state || null,
                pincode: createForm.pincode || null,
                country: createForm.country || "India",
                aadharNo: createForm.aadharNo || null,
                panNo: createForm.panNo || null,
                passportNo: createForm.passportNo || null,
                uanNo: createForm.uanNo || null,
                esicNo: createForm.esicNo || null,

                deptId: parseInt(createForm.deptId, 10),
                desigId: parseInt(createForm.desigId, 10),
                roleId: parseInt(createForm.roleId, 10),
                reportingManager: createForm.reportingManager ? parseInt(createForm.reportingManager, 10) : null,
                currentCtc: createForm.currentCtc ? parseFloat(createForm.currentCtc) : 0,

                employmentType: createForm.employmentType,
                employmentStatus: "Active",

                dateOfBirth: createForm.dateOfBirth ? new Date(createForm.dateOfBirth).toISOString() : null,
                dateOfJoining: createForm.dateOfJoining ? new Date(createForm.dateOfJoining).toISOString() : null,
                probationEndDate: createForm.probationEndDate ? new Date(createForm.probationEndDate).toISOString() : null,
                confirmationDate: createForm.confirmationDate ? new Date(createForm.confirmationDate).toISOString() : null
            };

            const res = await adminService.createEmployee(payload);
            if (res.success) {
                setShowCreateModal(false);
                setCreateForm(initialFormState);
                setActiveTab("personal");
                setFieldCheckMessages(emptyFieldCheckMessages);

                if (res.data && res.data.generatedPassword) {
                    setCreatedCredentials({
                        username: res.data.username || createForm.officialEmail,
                        password: res.data.generatedPassword
                    });
                } else {
                    loadInitialData();
                }
            } else {
                alert(res.message || "Failed to register employee.");
            }
        } catch (err) {
            console.error("Pipeline breakdown tracking:", err);
            alert("Submission error tracking triggered. Verify payload schemas configurations.");
        } finally {
            setActionLoading(false);
        }
    };

    // ✏️ Edit Click Trigger Handler
    const openEditModal = (emp) => {
        setEditForm({
            empId: emp.empId,
            firstName: emp.firstName || "",
            lastName: emp.lastName || "",
            gender: emp.gender || "Male",
            dateOfBirth: emp.dateOfBirth ? emp.dateOfBirth.split("T")[0] : "",
            bloodGroup: emp.bloodGroup || "",
            maritalStatus: emp.maritalStatus || "Single",
            personalEmail: emp.personalEmail || "",
            officialEmail: emp.officialEmail || "",
            mobile: emp.mobile || "",
            alternateMobile: emp.alternateMobile || "",
            addressLine1: emp.addressLine1 || "",
            addressLine2: emp.addressLine2 || "",
            city: emp.city || "",
            state: emp.state || "",
            pincode: emp.pincode || "",
            country: emp.country || "India",
            aadharNo: emp.aadharNo || "",
            panNo: emp.panNo || "",
            passportNo: emp.passportNo || "",
            uanNo: emp.uanNo || "",
            esicNo: emp.esicNo || "",

            deptId: emp.deptId ? emp.deptId.toString() : "",
            desigId: emp.desigId ? emp.desigId.toString() : "",
            roleId: emp.roleId ? emp.roleId.toString() : "",
            reportingManager: emp.reportingManager ? emp.reportingManager.toString() : "",

            dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.split("T")[0] : "",
            employmentType: emp.employmentType || "Permanent",
            employmentStatus: emp.employmentStatus || "Active",
            currentCtc: emp.currentCtc ? emp.currentCtc.toString() : "",

            probationEndDate: emp.probationEndDate ? emp.probationEndDate.split("T")[0] : "",
            confirmationDate: emp.confirmationDate ? emp.confirmationDate.split("T")[0] : ""
        });

        // ✅ Reset field check messages before opening edit modal
        setFieldCheckMessages(emptyFieldCheckMessages);

        setActiveTab("personal");
        setShowEditModal(true);
    };

    // 💾 Update/Save Functionality
    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!editForm.empId) {
            return alert("Employee target identity could not be verified!");
        }

        // ✅ NEW: Probation End Date is mandatory when Employment Type is 'Probation'
        if (editForm.employmentType === "Probation" && !editForm.probationEndDate) {
            return alert("Probation End Date is required when Employment Type is 'Probation'.");
        }

        // ✅ Block submit if any duplicate field detected
        const hasDuplicate = Object.values(fieldCheckMessages).some(msg => msg.type === "error");
        if (hasDuplicate) {
            return alert("Please resolve the duplicate field warnings (highlighted in red) before submitting.");
        }

        setActionLoading(true);
        try {
            const payload = {
                firstName: editForm.firstName ? editForm.firstName.trim() : "",
                lastName: editForm.lastName ? editForm.lastName.trim() : "",
                gender: editForm.gender,
                bloodGroup: editForm.bloodGroup || null,
                maritalStatus: editForm.maritalStatus,
                personalEmail: editForm.personalEmail || null,
                officialEmail: editForm.officialEmail ? editForm.officialEmail.trim() : "",
                mobile: editForm.mobile,
                alternateMobile: editForm.alternateMobile || null,
                addressLine1: editForm.addressLine1 || null,
                addressLine2: editForm.addressLine2 || null,
                city: editForm.city || null,
                state: editForm.state || null,
                pincode: editForm.pincode || null,
                country: editForm.country || "India",
                aadharNo: editForm.aadharNo || null,
                panNo: editForm.panNo || null,
                passportNo: editForm.passportNo || null,
                uanNo: editForm.uanNo || null,
                esicNo: editForm.esicNo || null,

                deptId: editForm.deptId ? parseInt(editForm.deptId, 10) : null,
                desigId: editForm.desigId ? parseInt(editForm.desigId, 10) : null,
                roleId: editForm.roleId ? parseInt(editForm.roleId, 10) : null,
                reportingManager: editForm.reportingManager ? parseInt(editForm.reportingManager, 10) : null,
                currentCtc: editForm.currentCtc ? parseFloat(editForm.currentCtc) : 0,

                employmentType: editForm.employmentType || "Permanent",
                employmentStatus: editForm.employmentStatus || "Active",

                dateOfBirth: editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toISOString() : null,
                dateOfJoining: editForm.dateOfJoining ? new Date(editForm.dateOfJoining).toISOString() : null,
                probationEndDate: editForm.probationEndDate ? new Date(editForm.probationEndDate).toISOString() : null,
                confirmationDate: editForm.confirmationDate ? new Date(editForm.confirmationDate).toISOString() : null
            };

            const res = await adminService.updateEmployee(parseInt(editForm.empId, 10), payload);

            if (res && res.success) {
                setShowEditModal(false);
                loadInitialData();
            } else {
                alert(res?.message || "Failed to update corporate profile mappings.");
            }
        } catch (err) {
            console.error("Critical execution loop break during update:", err);
            alert("Server validation connection timed out. Open browser network logs for diagnostics.");
        } finally {
            setActionLoading(false);
        }
    };

    // ❌ Delete Functionality
    const handleDelete = async (empId) => {
        if (!window.confirm("Are you sure you want to completely remove this employee profile?")) return;

        try {
            const res = await adminService.deleteEmployee(empId);
            if (res.success) {
                setEmployees(prev => prev.filter(item => item.empId !== empId));
            } else {
                alert(res.message || "Failed to drop staff profile.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // 🆕 Promotion — open modal, prefilled with employee's current designation/CTC
    const openPromoteModal = (emp) => {
        setPromoteTarget(emp);
        setPromoteForm({
            newDesigId: emp.desigId ? emp.desigId.toString() : "",
            newDeptId: "",
            newCtc: emp.currentCtc ? emp.currentCtc.toString() : "",
            effectiveDate: new Date().toISOString().split("T")[0],
            remarks: ""
        });
        setShowPromoteModal(true);
    };

    const handlePromote = async (e) => {
        e.preventDefault();
        if (!promoteForm.newDesigId || !promoteForm.effectiveDate) {
            return alert("New Designation and Effective Date are required.");
        }

        setActionLoading(true);
        try {
            const res = await adminService.promoteEmployee({
                empId: promoteTarget.empId,
                newDesigId: parseInt(promoteForm.newDesigId, 10),
                newDeptId: promoteForm.newDeptId ? parseInt(promoteForm.newDeptId, 10) : null,
                newCtc: promoteForm.newCtc ? parseFloat(promoteForm.newCtc) : null,
                effectiveDate: promoteForm.effectiveDate,
                remarks: promoteForm.remarks || null,
                approvedBy: loggedInEmpId || 0
            });

            if (res.success) {
                alert(res.message || "Employee promoted successfully!");
                setShowPromoteModal(false);
                setPromoteTarget(null);
                loadInitialData();
            } else {
                alert(res.message || "Failed to promote employee.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error while promoting employee.");
        } finally {
            setActionLoading(false);
        }
    };

    // 🆕 Salary Increment — open modal, prefilled with current CTC
    const openIncrementModal = async (emp) => {
        setIncrementTarget(emp);
        setShowIncrementModal(true);
        setActionLoading(true);

        // Default empty form — safe values (never undefined) taaki controlled-input warning na aaye
        const blankForm = {
            structureId: "", basic: "", hra: "", ta: "", da: "", specialAllow: "",
            pfEmployee: "", pfEmployer: "", esicEmployee: "", esicEmployer: "",
            tds: "", professionalTax: "",
            effectiveFrom: new Date().toISOString().split("T")[0]
        };

        try {
            const res = await adminService.getCurrentSalary(emp.empId);
            if (res.success && res.data) {
                const cur = res.data;
                setIncrementForm({
                    structureId: cur.structureId ? cur.structureId.toString() : "",
                    basic: cur.basic ?? "",
                    hra: cur.hra ?? "",
                    ta: cur.ta ?? "",
                    da: cur.da ?? "",
                    specialAllow: cur.specialAllow ?? "",
                    pfEmployee: cur.pfEmployee ?? "",
                    pfEmployer: cur.pfEmployer ?? "",
                    esicEmployee: cur.esicEmployee ?? "",
                    esicEmployer: cur.esicEmployer ?? "",
                    tds: cur.tds ?? "",
                    professionalTax: cur.professionalTax ?? "",
                    effectiveFrom: blankForm.effectiveFrom
                });
            } else {
                // 404 / no active record — naya salary set karne do, empty form se
                setIncrementForm(blankForm);
            }
        } catch (err) {
            console.error("Failed to load current salary:", err);
            setIncrementForm(blankForm);
        } finally {
            setActionLoading(false);
        }
    };

    const handleIncrement = async (e) => {
        e.preventDefault();
        if (!incrementForm.basic || !incrementForm.effectiveFrom) {
            return alert("Basic salary and Effective Date are required.");
        }

        setActionLoading(true);
        try {
            const res = await adminService.addSalaryIncrement({
                empId: incrementTarget.empId,
                structureId: incrementForm.structureId ? parseInt(incrementForm.structureId, 10) : null,
                basic: parseFloat(incrementForm.basic) || 0,
                hra: parseFloat(incrementForm.hra) || 0,
                ta: parseFloat(incrementForm.ta) || 0,
                da: parseFloat(incrementForm.da) || 0,
                specialAllow: parseFloat(incrementForm.specialAllow) || 0,
                pfEmployee: parseFloat(incrementForm.pfEmployee) || 0,
                pfEmployer: parseFloat(incrementForm.pfEmployer) || 0,
                esicEmployee: parseFloat(incrementForm.esicEmployee) || 0,
                esicEmployer: parseFloat(incrementForm.esicEmployer) || 0,
                tds: parseFloat(incrementForm.tds) || 0,
                professionalTax: parseFloat(incrementForm.professionalTax) || 0,
                effectiveFrom: incrementForm.effectiveFrom,
                createdBy: loggedInEmpId || 0
            });

            if (res.success) {
                alert(res.message || "Salary increment added successfully!");
                setShowIncrementModal(false);
                setIncrementTarget(null);
                loadInitialData();
            } else {
                alert(res.message || "Failed to add salary increment.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error while adding salary increment.");
        } finally {
            setActionLoading(false);
        }
    };

    // 🆕 History modal — loads both promotion history & salary increment history together
    const openHistoryModal = async (emp) => {
        setHistoryTarget(emp);
        setHistoryTab("promotions");
        setShowHistoryModal(true);
        setHistoryLoading(true);
        try {
            const [promoRes, salRes] = await Promise.all([
                adminService.getPromotionHistory(emp.empId),
                adminService.getSalaryHistory(emp.empId)
            ]);
            if (promoRes.success) setPromotionHistory(promoRes.data || []);
            if (salRes.success) setSalaryHistory(salRes.data || []);
        } catch (err) {
            console.error("Failed to load employee history:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const query = searchQuery.toLowerCase();
        return (
            (emp.firstName || "").toLowerCase().includes(query) ||
            (emp.lastName || "").toLowerCase().includes(query) ||
            (emp.officialEmail || "").toLowerCase().includes(query) ||
            (emp.empCode || "").toLowerCase().includes(query)
        );
    });

    // 🔢 Pagination Calculation
    const totalItems = filteredEmployees.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "Active":
                return "bg-emerald-50 text-emerald-700 border-emerald-200";
            case "Resigned":
                return "bg-amber-50 text-amber-700 border-amber-200";
            default:
                return "bg-rose-50 text-rose-700 border-rose-200";
        }
    };

    const getStatusDotClass = (status) => {
        return status === "Active" ? "bg-emerald-500" : (status === "Resigned" ? "bg-amber-500" : "bg-rose-500");
    };

    // 🔄 Toggle Employee Status (Active/Resigned Status Handler)
    const handleToggleStatus = async (empId, currentStatus) => {
        const nextStatus = currentStatus === "Active" ? "Resigned" : "Active";
        if (!window.confirm(`Are you sure you want to change employee status to ${nextStatus}?`)) return;

        try {
            const res = await adminService.updateEmployee(empId, { employmentStatus: nextStatus });
            if (res.success) {
                loadInitialData();
            } else {
                alert(res.message || "Failed to update employment status pipeline.");
            }
        } catch (err) {
            console.error("Error toggling operational tracking status:", err);
            alert("API execution breakdown. Check backend logging network nodes.");
        }
    };
    // 🆕 Open Reveal Credentials modal
    const openRevealModal = (emp) => {
        setRevealTarget(emp);
        setSecretKeyInput("");
        setRevealedCreds(null);
        setShowRevealModal(true);
    };

    const handleRevealCredentials = async (e) => {
        e.preventDefault();
        setRevealLoading(true);
        try {
            const res = await adminService.revealEmployeeCredentials(revealTarget.empId, secretKeyInput);
            if (res.success || res.Success) {
                const data = res.data || res.Data;
                setRevealedCreds({ username: data.username, password: data.password });
            } else {
                alert(res.message || res.Message || "Invalid key.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setRevealLoading(false);
        }
    };
    return (
        <div className="space-y-6 text-slate-800">
            {/* Header Module Section */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Employees Registry</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Manage complete workforce parameters, system accounts, and job identities.</p>
                </div>
                <button
                    onClick={() => {
                        setShowCreateModal(true);
                        setCreateForm(initialFormState);
                        setActiveTab("personal");
                        setFieldCheckMessages(emptyFieldCheckMessages);
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm"
                >
                    Add Employee
                </button>
            </div>

            {/* 🆕 Upcoming Milestones Banner (Probation ending / Work anniversaries, next 7 days) */}
            {!milestonesLoading && milestones.length > 0 && showMilestones && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
                            🔔 Upcoming Milestones (next 7 days) — {milestones.length}
                        </p>
                        <button onClick={() => setShowMilestones(false)} className="text-amber-500 hover:text-amber-700 text-xs font-bold">
                            Hide
                        </button>
                    </div>
                    <div className="grid gap-2">
                        {milestones.map((m, i) => (
                            <div key={m.notifId ?? i} className="flex flex-wrap items-center justify-between gap-2 bg-white border border-amber-100 rounded-xl px-4 py-2.5">
                                <div>
                                    <span className="text-sm font-semibold text-slate-800">
                                        {m.empName ?? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() ?? `EMP-${m.empId}`}
                                    </span>
                                    <span className="text-xs text-slate-500 ml-2">
                                        {m.notifType === "ProbationEnd" ? "Probation ending" : "Work anniversary"} on{" "}
                                        {m.milestoneDate ? new Date(m.milestoneDate).toLocaleDateString("en-IN") : "—"}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleMarkMilestoneSent(m.notifId)}
                                    className="text-xs font-bold text-indigo-600 hover:underline"
                                >
                                    Mark as sent
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 🔍 Search Utilities Control Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider pl-1">Search Profile:</span>
                <input
                    type="text"
                    placeholder="Search by name, email, or employee code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                />
            </div>

            {/* Core Records Table Wrapper Grid */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-16 flex flex-col justify-center items-center gap-3">
                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-sm font-semibold text-indigo-600 animate-pulse tracking-wide">
                            Synchronizing employee nodes...
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col justify-between">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1150px]">
                                <thead>
                                    <tr className="bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                                        <th className="px-6 py-4">Code / Username</th>
                                        <th className="px-6 py-4">Full Name</th>
                                        <th className="px-6 py-4">Official Email</th>
                                        <th className="px-6 py-4">Mobile Contact</th>
                                        <th className="px-6 py-4">Gender</th>
                                        <th className="px-6 py-4">City & State</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-center">Actions operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {currentItems.map((emp) => (
                                        <tr
                                            key={emp.empId}
                                            className="hover:bg-slate-50/40 transition-colors duration-150 group"
                                        >
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                                                <div className="text-indigo-600 group-hover:text-indigo-700 transition-colors">
                                                    {emp.empCode || "PENDING"}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                                                    {emp.username || "no-login"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                <div className="flex items-center gap-2">
                                                    <span>{emp.firstName} {emp.lastName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {emp.officialEmail}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                {emp.mobile}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${emp.gender === "Male"
                                                        ? "bg-blue-50 text-blue-700 border border-blue-100/50"
                                                        : "bg-purple-50 text-purple-700 border border-purple-100/50"
                                                        }`}
                                                >
                                                    {emp.gender}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 max-w-[160px] truncate" title={emp.city ? `${emp.city}, ${emp.state}` : emp.state}>
                                                {emp.city
                                                    ? `${emp.city}, ${emp.state || ""}`
                                                    : emp.state || "N/A"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleStatus(emp.empId, emp.employmentStatus)}
                                                    title="Click to toggle status (Active <-> Resigned)"
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-200 active:scale-95 hover:brightness-95 shadow-sm ${getStatusBadgeClass(emp.employmentStatus)}`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(emp.employmentStatus)}`} />
                                                    {emp.employmentStatus || "Active"}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <div className="flex flex-wrap items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(emp)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/40 active:scale-95 transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    {/* 🆕 Promote */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openPromoteModal(emp)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/40 active:scale-95 transition-all"
                                                    >
                                                        Promote
                                                    </button>
                                                    {/* 🆕 Increment */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openIncrementModal(emp)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100/40 active:scale-95 transition-all"
                                                    >
                                                        Increment
                                                    </button>
                                                    {/* 🆕 History (Promotions + Salary) */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openHistoryModal(emp)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 active:scale-95 transition-all"
                                                    >
                                                        History
                                                    </button>
                                                    
                                                    
                                                    {/* 🆕 Credentials */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openRevealModal(emp)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/40 active:scale-95 transition-all"
                                                    >
                                                        Credentials
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(emp.empId)}
                                                        ></button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(emp.empId)}
                                                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100/40 active:scale-95 transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {totalItems === 0 && (
                                        <tr>
                                            <td colSpan={8} className="text-center py-10 text-slate-400 italic">
                                                No worker dashboard registry matching data found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* 🔢 PAGINATION BAR LOGIC CONTROLS */}
                        {totalItems > 0 && (
                            <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-500">
                                <div>
                                    Showing <span className="text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                                    <span className="text-slate-800">{Math.min(indexOfLastItem, totalItems)}</span> of{" "}
                                    <span className="text-slate-800">{totalItems}</span> entries
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        className="px-2.5 py-1.5 rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Previous
                                    </button>
                                    {[...Array(totalPages)].map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentPage(index + 1)}
                                            className={`px-3 py-1.5 rounded-lg border transition-all ${currentPage === index + 1 ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        className="px-2.5 py-1.5 rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ➕ Modal popup: CREATE EMPLOYEE */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-bold text-slate-900">Register New Staff Profile</h3>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 text-xl font-bold">×</button>
                        </div>

                        <div className="flex gap-2 border-b border-slate-100 pb-1 text-xs font-bold uppercase tracking-wider">
                            <button type="button" onClick={() => setActiveTab("personal")} className={`pb-2 px-1 border-b-2 ${activeTab === "personal" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"}`}>Personal</button>
                            <button type="button" onClick={() => setActiveTab("contact")} className={`pb-2 px-1 border-b-2 ${activeTab === "contact" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"}`}>Contact/Docs</button>
                            <button type="button" onClick={() => setActiveTab("corporate")} className={`pb-2 px-1 border-b-2 ${activeTab === "corporate" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"}`}>Corporate/HR</button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4 pt-2">
                            {activeTab === "personal" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name *</label><input type="text" required value={createForm.firstName} onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name *</label><input type="text" required value={createForm.lastName} onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender *</label><select value={createForm.gender} onChange={e => setCreateForm({ ...createForm, gender: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white"><option>Male</option><option>Female</option><option>Other</option></select></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Birth *</label><input type="date" required value={createForm.dateOfBirth} onChange={e => setCreateForm({ ...createForm, dateOfBirth: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Blood Group</label><input type="text" placeholder="e.g., O+" value={createForm.bloodGroup} onChange={e => setCreateForm({ ...createForm, bloodGroup: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marital Status</label><select value={createForm.maritalStatus} onChange={e => setCreateForm({ ...createForm, maritalStatus: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white"><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select></div>
                                </div>
                            )}

                            {activeTab === "contact" && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Contact *</label>
                                            <input
                                                type="text"
                                                required
                                                value={createForm.mobile}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    setCreateForm({ ...createForm, mobile: value });
                                                    checkFieldDuplicate("mobile", value);
                                                }}
                                                className={`w-full px-3 py-2 rounded-xl border text-sm ${fieldCheckMessages.mobile.type === "error" ? "border-rose-400" : ""}`}
                                            />
                                            {fieldCheckMessages.mobile.text && (
                                                <p className={`text-xs mt-1 font-semibold ${fieldCheckMessages.mobile.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                    {fieldCheckMessages.mobile.text}
                                                </p>
                                            )}
                                        </div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alternate Mobile</label><input type="text" value={createForm.alternateMobile} onChange={e => setCreateForm({ ...createForm, alternateMobile: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Personal Email</label>
                                            <input
                                                type="email"
                                                value={createForm.personalEmail}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    setCreateForm({ ...createForm, personalEmail: value });
                                                    checkFieldDuplicate("personalEmail", value);
                                                }}
                                                className={`w-full px-3 py-2 rounded-xl border text-sm ${fieldCheckMessages.personalEmail.type === "error" ? "border-rose-400" : ""}`}
                                            />
                                            {fieldCheckMessages.personalEmail.text && (
                                                <p className={`text-xs mt-1 font-semibold ${fieldCheckMessages.personalEmail.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                    {fieldCheckMessages.personalEmail.text}
                                                </p>
                                            )}
                                        </div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Country</label><input type="text" value={createForm.country} onChange={e => setCreateForm({ ...createForm, country: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        <div className="sm:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address Line 1</label><input type="text" value={createForm.addressLine1} onChange={e => setCreateForm({ ...createForm, addressLine1: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        <div className="sm:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address Line 2</label><input type="text" value={createForm.addressLine2} onChange={e => setCreateForm({ ...createForm, addressLine2: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label><input type="text" value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">State</label><input type="text" value={createForm.state} onChange={e => setCreateForm({ ...createForm, state: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pincode</label><input type="text" value={createForm.pincode} onChange={e => setCreateForm({ ...createForm, pincode: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">
                                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Government Verification IDs</h4>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aadhar Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="12-digit number"
                                                    value={createForm.aadharNo}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setCreateForm({ ...createForm, aadharNo: value });
                                                        checkFieldDuplicate("aadharNo", value);
                                                    }}
                                                    className={`w-full px-3 py-2 rounded-xl border text-sm ${fieldCheckMessages.aadharNo.type === "error" ? "border-rose-400" : ""}`}
                                                />
                                                {fieldCheckMessages.aadharNo.text && (
                                                    <p className={`text-xs mt-1 font-semibold ${fieldCheckMessages.aadharNo.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                        {fieldCheckMessages.aadharNo.text}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PAN Card Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="10-digit alphanumeric"
                                                    value={createForm.panNo}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setCreateForm({ ...createForm, panNo: value });
                                                        checkFieldDuplicate("panNo", value);
                                                    }}
                                                    className={`w-full px-3 py-2 rounded-xl border text-sm ${fieldCheckMessages.panNo.type === "error" ? "border-rose-400" : ""}`}
                                                />
                                                {fieldCheckMessages.panNo.text && (
                                                    <p className={`text-xs mt-1 font-semibold ${fieldCheckMessages.panNo.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                        {fieldCheckMessages.panNo.text}
                                                    </p>
                                                )}
                                            </div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Passport Number</label><input type="text" value={createForm.passportNo} onChange={e => setCreateForm({ ...createForm, passportNo: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">PF UAN Account</label><input type="text" value={createForm.uanNo} onChange={e => setCreateForm({ ...createForm, uanNo: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">ESIC Insurance Number</label><input type="text" value={createForm.esicNo} onChange={e => setCreateForm({ ...createForm, esicNo: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "corporate" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Official Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={createForm.officialEmail}
                                            onChange={e => {
                                                const value = e.target.value;
                                                setCreateForm({ ...createForm, officialEmail: value });
                                                checkFieldDuplicate("officialEmail", value);
                                            }}
                                            className={`w-full px-3 py-2 rounded-xl border text-sm ${fieldCheckMessages.officialEmail.type === "error" ? "border-rose-400" : ""}`}
                                        />
                                        {fieldCheckMessages.officialEmail.text && (
                                            <p className={`text-xs mt-1 font-semibold ${fieldCheckMessages.officialEmail.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                {fieldCheckMessages.officialEmail.text}
                                            </p>
                                        )}
                                    </div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Joining *</label><input type="date" required value={createForm.dateOfJoining} onChange={e => setCreateForm({ ...createForm, dateOfJoining: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department *</label>
                                        <select required value={createForm.deptId} onChange={e => setCreateForm({ ...createForm, deptId: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                                            <option value="">-- Choose Dept --</option>
                                            {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.departmentName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Designation *</label>
                                        <select required value={createForm.desigId} onChange={e => setCreateForm({ ...createForm, desigId: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                                            <option value="">-- Choose Designation --</option>
                                            {designations.map(ds => <option key={ds.desigId} value={ds.desigId}>{ds.designationName}</option>)}
                                        </select>
                                    </div>

                                    {/* ✅ NEW: Reporting Manager dropdown — needed so company_hierarchy syncs on create   */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reporting Manager</label>
                                        <select
                                            value={createForm.reportingManager}
                                            onChange={e => setCreateForm({ ...createForm, reportingManager: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                        >
                                            <option value="">-- No Reporting Manager --</option>
                                            {employees
                                                .filter(emp => emp.employmentStatus === "Active" && emp.roleName === "HR")
                                                .map(emp => (
                                                    <option key={emp.empId} value={emp.empId}>
                                                        {emp.firstName} {emp.lastName} ({emp.empCode})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                  
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Security Role *</label>
                                        <select
                                            required
                                            value={createForm.roleId}
                                            onChange={e => setCreateForm({ ...createForm, roleId: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                        >
                                            <option value="">-- Assign Login Role Tiers --</option>
                                            {roles
                                                .filter(r => Number(r.roleId) > loggedInRoleId)
                                                .map(r => (
                                                    <option key={r.roleId} value={r.roleId}>
                                                        {r.roleName}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employment Type</label>
                                        <select
                                            value={createForm.employmentType}
                                            onChange={e => {
                                                const newType = e.target.value;
                                                let updatedProbationDate = createForm.probationEndDate;

                                                // ✅ NEW: auto-suggest Probation End Date = DOJ + 3 months (editable after)
                                                if (newType === "Probation" && createForm.dateOfJoining && !createForm.probationEndDate) {
                                                    const doj = new Date(createForm.dateOfJoining);
                                                    doj.setMonth(doj.getMonth() + 3);
                                                    updatedProbationDate = doj.toISOString().split("T")[0];
                                                }

                                                setCreateForm({ ...createForm, employmentType: newType, probationEndDate: updatedProbationDate });
                                            }}
                                            className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                        >
                                            <option>Permanent</option>
                                            <option>Probation</option>
                                            <option>Contract</option>
                                            <option>Part-Time</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Probation End Date{createForm.employmentType === "Probation" ? " *" : ""}
                                        </label>
                                        <input
                                            type="date"
                                            required={createForm.employmentType === "Probation"}
                                            value={createForm.probationEndDate}
                                            onChange={e => setCreateForm({ ...createForm, probationEndDate: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm"
                                        />
                                    </div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmation Date</label><input type="date" value={createForm.confirmationDate} onChange={e => setCreateForm({ ...createForm, confirmationDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                </div>
                            )}

                            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                                <div className="text-xs text-slate-400 font-semibold italic">Ensure mandatory * components are mapped.</div>
                                <div className="flex gap-2">
                                    {activeTab !== "corporate" ? (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab(activeTab === "personal" ? "contact" : "corporate")}
                                            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl whitespace-nowrap"
                                        >
                                            Next Segment
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={actionLoading}
                                            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md whitespace-nowrap"
                                        >
                                            {actionLoading ? "Saving Profile..." : "Register Employee Profile"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✏️ Modal popup: EDIT EMPLOYEE */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-bold text-slate-900">Modify Employee Parameters</h3>
                            <button type="button" onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 text-xl font-bold">×</button>
                        </div>

                        <div className="flex gap-2 border-b border-slate-100 pb-1 text-xs font-bold uppercase tracking-wider">
                            <button type="button" onClick={() => setActiveTab("personal")} className={`pb-2 px-1 border-b-2 ${activeTab === "personal" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"}`}>Personal</button>
                            <button type="button" onClick={() => setActiveTab("contact")} className={`pb-2 px-1 border-b-2 ${activeTab === "contact" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"}`}>Contact/Docs</button>
                            <button type="button" onClick={() => setActiveTab("corporate")} className={`pb-2 px-1 border-b-2 ${activeTab === "corporate" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"}`}>Corporate/HR</button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4 pt-2">
                            {activeTab === "personal" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name *</label><input type="text" required value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name *</label><input type="text" required value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender *</label><select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white"><option>Male</option><option>Female</option><option>Other</option></select></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Birth *</label><input type="date" required value={editForm.dateOfBirth} onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Marital Status</label><select value={editForm.maritalStatus} onChange={e => setEditForm({ ...editForm, maritalStatus: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white"><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select></div>
                                </div>
                            )}

                            {activeTab === "contact" && (
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile Contact *</label>
                                            <input
                                                type="text"
                                                required
                                                value={editForm.mobile}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    setEditForm({ ...editForm, mobile: value });
                                                    checkFieldDuplicate("mobile", value, parseInt(editForm.empId, 10));
                                                }}
                                                className={`w-full px-3 py-2 rounded-xl border text-sm ${fieldCheckMessages.mobile.type === "error" ? "border-rose-400" : ""}`}
                                            />
                                            {fieldCheckMessages.mobile.text && (
                                                <p className={`text-xs mt-1 font-semibold ${fieldCheckMessages.mobile.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                    {fieldCheckMessages.mobile.text}
                                                </p>
                                            )}
                                        </div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alternate Mobile</label><input type="text" value={editForm.alternateMobile} onChange={e => setEditForm({ ...editForm, alternateMobile: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Personal Email</label>
                                            <input
                                                type="email"
                                                value={editForm.personalEmail}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    setEditForm({ ...editForm, personalEmail: value });
                                                    checkFieldDuplicate("personalEmail", value, parseInt(editForm.empId, 10));
                                                }}
                                                className={`w-full px-3 py-2 rounded-xl border text-sm ${fieldCheckMessages.personalEmail.type === "error" ? "border-rose-400" : ""}`}
                                            />
                                            {fieldCheckMessages.personalEmail.text && (
                                                <p className={`text-xs mt-1 font-semibold ${fieldCheckMessages.personalEmail.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                    {fieldCheckMessages.personalEmail.text}
                                                </p>
                                            )}
                                        </div>
                                        <div className="sm:col-span-2"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address Line 1</label><input type="text" value={editForm.addressLine1} onChange={e => setEditForm({ ...editForm, addressLine1: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">City</label><input type="text" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">State</label><input type="text" value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">
                                        <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Government Verification IDs</h4>
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Aadhar Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="12-digit number"
                                                    value={editForm.aadharNo}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setEditForm({ ...editForm, aadharNo: value });
                                                        checkFieldDuplicate("aadharNo", value, parseInt(editForm.empId, 10));
                                                    }}
                                                    className={`w-full px-3 py-2 rounded-xl border text-sm ${fieldCheckMessages.aadharNo.type === "error" ? "border-rose-400" : ""}`}
                                                />
                                                {fieldCheckMessages.aadharNo.text && (
                                                    <p className={`text-xs mt-1 font-semibold ${fieldCheckMessages.aadharNo.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                        {fieldCheckMessages.aadharNo.text}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PAN Card Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="10-digit alphanumeric"
                                                    value={editForm.panNo}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setEditForm({ ...editForm, panNo: value });
                                                        checkFieldDuplicate("panNo", value, parseInt(editForm.empId, 10));
                                                    }}
                                                    className={`w-full px-3 py-2 rounded-xl border text-sm ${fieldCheckMessages.panNo.type === "error" ? "border-rose-400" : ""}`}
                                                />
                                                {fieldCheckMessages.panNo.text && (
                                                    <p className={`text-xs mt-1 font-semibold ${fieldCheckMessages.panNo.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                        {fieldCheckMessages.panNo.text}
                                                    </p>
                                                )}
                                            </div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Passport Number</label><input type="text" value={editForm.passportNo} onChange={e => setEditForm({ ...editForm, passportNo: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">PF UAN Account</label><input type="text" value={editForm.uanNo} onChange={e => setEditForm({ ...editForm, uanNo: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">ESIC Insurance Number</label><input type="text" value={editForm.esicNo} onChange={e => setEditForm({ ...editForm, esicNo: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "corporate" && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Official Corporate Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={editForm.officialEmail}
                                            onChange={e => {
                                                const value = e.target.value;
                                                setEditForm({ ...editForm, officialEmail: value });
                                                checkFieldDuplicate("officialEmail", value, parseInt(editForm.empId, 10));
                                            }}
                                            className={`w-full px-3 py-2 rounded-xl border text-sm ${fieldCheckMessages.officialEmail.type === "error" ? "border-rose-400" : ""}`}
                                        />
                                        {fieldCheckMessages.officialEmail.text && (
                                            <p className={`text-xs mt-1 font-semibold ${fieldCheckMessages.officialEmail.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                {fieldCheckMessages.officialEmail.text}
                                            </p>
                                        )}
                                    </div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Joining *</label><input type="date" required value={editForm.dateOfJoining} onChange={e => setEditForm({ ...editForm, dateOfJoining: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Department *</label>
                                        <select required value={editForm.deptId} onChange={e => setEditForm({ ...editForm, deptId: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                                            {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.departmentName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Designation *</label>
                                        <select required value={editForm.desigId} onChange={e => setEditForm({ ...editForm, desigId: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                                            {designations.map(ds => <option key={ds.desigId} value={ds.desigId}>{ds.designationName}</option>)}
                                        </select>
                                    </div>

                                    {/* ✅ NEW: Reporting Manager dropdown — self-selection blocked via filter */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reporting Manager</label>
                                        <select
                                            value={editForm.reportingManager}
                                            onChange={e => setEditForm({ ...editForm, reportingManager: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                        >
                                            <option value="">-- No Reporting Manager --</option>
                                            {employees
                                                .filter(emp => emp.empId !== parseInt(editForm.empId, 10) && emp.employmentStatus === "Active" && emp.roleName === "HR")
                                                .map(emp => (
                                                    <option key={emp.empId} value={emp.empId}>
                                                        {emp.firstName} {emp.lastName} ({emp.empCode})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">System Security Role *</label>
                                        <select required value={editForm.roleId} onChange={e => setEditForm({ ...editForm, roleId: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                                            <option value="">-- Assign Login Role Tiers --</option>
                                            {roles
                                                .filter(r => Number(r.roleId) > loggedInRoleId)
                                                .map(r => (
                                                    <option key={r.roleId} value={r.roleId}>
                                                        {r.roleName}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employment Status</label><select value={editForm.employmentStatus} onChange={e => setEditForm({ ...editForm, employmentStatus: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm bg-white"><option>Active</option><option>Resigned</option><option>Terminated</option><option>Retired</option></select></div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current CTC</label><input type="number" value={editForm.currentCtc} onChange={e => setEditForm({ ...editForm, currentCtc: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                            Probation End Date{editForm.employmentType === "Probation" ? " *" : ""}
                                        </label>
                                        <input
                                            type="date"
                                            required={editForm.employmentType === "Probation"}
                                            value={editForm.probationEndDate}
                                            onChange={e => setEditForm({ ...editForm, probationEndDate: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm"
                                        />
                                    </div>
                                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmation Date</label><input type="date" value={editForm.confirmationDate} onChange={e => setEditForm({ ...editForm, confirmationDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border text-sm" /></div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md">{actionLoading ? "Updating..." : "Save Changes"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🆕 Modal popup: PROMOTE EMPLOYEE */}
            {showPromoteModal && promoteTarget && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-bold text-slate-900">Promote Employee</h3>
                            <button type="button" onClick={() => setShowPromoteModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 text-xl font-bold">×</button>
                        </div>
                        <p className="text-xs text-slate-500">
                            {promoteTarget.firstName} {promoteTarget.lastName} ({promoteTarget.empCode})
                        </p>

                        <form onSubmit={handlePromote} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Designation *</label>
                                <select
                                    required
                                    value={promoteForm.newDesigId}
                                    onChange={e => setPromoteForm({ ...promoteForm, newDesigId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                >
                                    <option value="">-- Select --</option>
                                    {designations.map(ds => <option key={ds.desigId} value={ds.desigId}>{ds.designationName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Department (optional)</label>
                                <select
                                    value={promoteForm.newDeptId}
                                    onChange={e => setPromoteForm({ ...promoteForm, newDeptId: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border text-sm bg-white"
                                >
                                    <option value="">-- Keep current department --</option>
                                    {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.departmentName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New CTC (optional)</label>
                                <input
                                    type="number"
                                    value={promoteForm.newCtc}
                                    onChange={e => setPromoteForm({ ...promoteForm, newCtc: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Effective Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={promoteForm.effectiveDate}
                                    onChange={e => setPromoteForm({ ...promoteForm, effectiveDate: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks</label>
                                <textarea
                                    rows={2}
                                    value={promoteForm.remarks}
                                    onChange={e => setPromoteForm({ ...promoteForm, remarks: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border text-sm resize-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                <button type="button" onClick={() => setShowPromoteModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md">
                                    {actionLoading ? "Saving..." : "Confirm Promotion"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🆕 Modal popup: SALARY INCREMENT */}
            {showIncrementModal && incrementTarget && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-bold text-slate-900">Add Salary Increment</h3>
                            <button type="button" onClick={() => setShowIncrementModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 text-xl font-bold">×</button>
                        </div>
                        <p className="text-xs text-slate-500">
                            {incrementTarget.firstName} {incrementTarget.lastName} ({incrementTarget.empCode}) — Current CTC: {incrementTarget.currentCtc ?? "—"}
                        </p>

                        <form onSubmit={handleIncrement} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Salary Structure ID</label>
                                    <input
                                        type="number"
                                        value={incrementForm.structureId}
                                        onChange={e => setIncrementForm({ ...incrementForm, structureId: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Effective From *</label>
                                    <input
                                        type="date"
                                        required
                                        value={incrementForm.effectiveFrom}
                                        onChange={e => setIncrementForm({ ...incrementForm, effectiveFrom: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Basic *</label>
                                    <input
                                        type="number"
                                        required
                                        value={incrementForm.basic}
                                        onChange={e => setIncrementForm({ ...incrementForm, basic: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">HRA</label>
                                    <input
                                        type="number"
                                        value={incrementForm.hra}
                                        onChange={e => setIncrementForm({ ...incrementForm, hra: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TA</label>
                                    <input
                                        type="number"
                                        value={incrementForm.ta}
                                        onChange={e => setIncrementForm({ ...incrementForm, ta: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">DA</label>
                                    <input
                                        type="number"
                                        value={incrementForm.da}
                                        onChange={e => setIncrementForm({ ...incrementForm, da: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Special Allowance</label>
                                    <input
                                        type="number"
                                        value={incrementForm.specialAllow}
                                        onChange={e => setIncrementForm({ ...incrementForm, specialAllow: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Deductions & Contributions</h4>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PF (Employee)</label>
                                        <input
                                            type="number"
                                            value={incrementForm.pfEmployee}
                                            onChange={e => setIncrementForm({ ...incrementForm, pfEmployee: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PF (Employer)</label>
                                        <input
                                            type="number"
                                            value={incrementForm.pfEmployer}
                                            onChange={e => setIncrementForm({ ...incrementForm, pfEmployer: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ESIC (Employee)</label>
                                        <input
                                            type="number"
                                            value={incrementForm.esicEmployee}
                                            onChange={e => setIncrementForm({ ...incrementForm, esicEmployee: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ESIC (Employer)</label>
                                        <input
                                            type="number"
                                            value={incrementForm.esicEmployer}
                                            onChange={e => setIncrementForm({ ...incrementForm, esicEmployer: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">TDS</label>
                                        <input
                                            type="number"
                                            value={incrementForm.tds}
                                            onChange={e => setIncrementForm({ ...incrementForm, tds: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Professional Tax</label>
                                        <input
                                            type="number"
                                            value={incrementForm.professionalTax}
                                            onChange={e => setIncrementForm({ ...incrementForm, professionalTax: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                <button type="button" onClick={() => setShowIncrementModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md">
                                    {actionLoading ? "Saving..." : "Add Increment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🆕 Modal popup: HISTORY (Promotions + Salary Increments, tabbed) */}
            {showHistoryModal && historyTarget && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Employee History</h3>
                                <p className="text-xs text-slate-500">{historyTarget.firstName} {historyTarget.lastName} ({historyTarget.empCode})</p>
                            </div>
                            <button type="button" onClick={() => setShowHistoryModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 text-xl font-bold">×</button>
                        </div>

                        <div className="flex gap-2 border-b border-slate-100 pb-1 text-xs font-bold uppercase tracking-wider">
                            <button type="button" onClick={() => setHistoryTab("promotions")} className={`pb-2 px-1 border-b-2 ${historyTab === "promotions" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"}`}>Promotions</button>
                            <button type="button" onClick={() => setHistoryTab("salary")} className={`pb-2 px-1 border-b-2 ${historyTab === "salary" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"}`}>Salary Increments</button>
                        </div>

                        {historyLoading ? (
                            <div className="py-10 text-center text-indigo-500 text-sm font-semibold animate-pulse">Loading history...</div>
                        ) : (
                            <>
                                {historyTab === "promotions" && (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm border-collapse">
                                            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                                <tr>
                                                    <th className="px-4 py-2.5 text-left">Effective Date</th>
                                                    <th className="px-4 py-2.5 text-left">Old Designation</th>
                                                    <th className="px-4 py-2.5 text-left">New Designation</th>
                                                    <th className="px-4 py-2.5 text-left">New CTC</th>
                                                    <th className="px-4 py-2.5 text-left">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {promotionHistory.length === 0 ? (
                                                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No promotion history found.</td></tr>
                                                ) : promotionHistory.map((p, i) => (
                                                    <tr key={p.promoId ?? i}>
                                                        <td className="px-4 py-2.5 text-slate-600">{p.promotionDate ? new Date(p.promotionDate).toLocaleDateString("en-IN") : "—"}</td>
                                                        <td className="px-4 py-2.5 text-slate-500">{p.oldDesignation || "—"}</td>
                                                        <td className="px-4 py-2.5 font-semibold text-slate-800">{p.newDesignation || "—"}</td>
                                                        <td className="px-4 py-2.5 text-slate-600">{p.newCtc ?? "—"}</td>
                                                        <td className="px-4 py-2.5 text-slate-500 max-w-[200px] truncate" title={p.remarks}>{p.remarks || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                    {historyTab === "salary" && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">
                                                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-left">Effective From</th>
                                                        <th className="px-4 py-2.5 text-left">Effective To</th>
                                                        <th className="px-4 py-2.5 text-left">Gross Salary</th>
                                                        <th className="px-4 py-2.5 text-left">Net Salary</th>
                                                        <th className="px-4 py-2.5 text-left">Increment Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {salaryHistory.length === 0 ? (
                                                        <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No salary increment history found.</td></tr>
                                                    ) : salaryHistory.map((s, i) => (
                                                        <tr key={s.salId ?? i}>
                                                            <td className="px-4 py-2.5 text-slate-600">{s.effectiveFrom ? new Date(s.effectiveFrom).toLocaleDateString("en-IN") : "—"}</td>
                                                            <td className="px-4 py-2.5 text-slate-500">{s.effectiveTo ? new Date(s.effectiveTo).toLocaleDateString("en-IN") : "Current"}</td>
                                                            <td className="px-4 py-2.5 text-slate-600">{s.grossSalary ?? "—"}</td>
                                                            <td className="px-4 py-2.5 font-semibold text-slate-800">{s.netSalary ?? "—"}</td>
                                                            <td className="px-4 py-2.5">
                                                                {s.incrementAmount != null ? (
                                                                    <span className={s.incrementAmount >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                                                                        {s.incrementAmount >= 0 ? "+" : ""}{s.incrementAmount}
                                                                    </span>
                                                                ) : "—"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                            </>
                        )}
                    </div>
                </div>
            )}
            {/* 🆕 Modal popup: REVEAL EXISTING EMPLOYEE CREDENTIALS */}
            {showRevealModal && revealTarget && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h3 className="text-lg font-bold text-slate-900">Employee Login Credentials</h3>
                            <button type="button" onClick={() => setShowRevealModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 text-xl font-bold">×</button>
                        </div>
                        <p className="text-xs text-slate-500">
                            {revealTarget.firstName} {revealTarget.lastName} ({revealTarget.empCode})
                        </p>

                        {!revealedCreds ? (
                            <form onSubmit={handleRevealCredentials} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Security Key *</label>
                                    <input
                                        type="password"
                                        required
                                        value={secretKeyInput}
                                        onChange={e => setSecretKeyInput(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border text-sm"
                                        placeholder="Enter the shared credentials key"
                                    />
                                </div>
                                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    A new password will be generated automatically, and the previous password will be reset for security reasons.
                                </p>
                                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                                    <button type="button" onClick={() => setShowRevealModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500 border border-slate-200 rounded-xl">Cancel</button>
                                    <button type="submit" disabled={revealLoading} className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md">
                                        {revealLoading ? "Verifying..." : "Reveal Credentials"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-left font-mono text-sm space-y-2 text-slate-700">
                                    <div>
                                        <span className="text-slate-400 font-sans font-bold text-xs uppercase block mb-0.5">Username:</span>
                                        {revealedCreds.username}
                                    </div>
                                    <div className="pt-2 border-t border-slate-200/60">
                                        <span className="text-slate-400 font-sans font-bold text-xs uppercase block mb-0.5">New Password:</span>
                                        <span className="text-emerald-600 font-bold text-base tracking-wide select-all">{revealedCreds.password}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(`Username: ${revealedCreds.username}\nPassword: ${revealedCreds.password}`)}
                                    className="w-full py-2.5 font-semibold rounded-xl text-sm bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
                                >
                                    Copy Both Credentials
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRevealModal(false)}
                                    className="w-full py-2.5 bg-blue-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 🔒 Success Credentials Reveal Modal Popup Window */}
            {createdCredentials && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Profile Registered Successfully</h3>
                            <p className="text-xs text-slate-500 mt-1">Copy these credentials safely. The auto-generated password is displayed below only once.</p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl text-left font-mono text-sm space-y-2 text-slate-700 relative">
                            <div>
                                <span className="text-slate-400 font-sans font-bold text-xs uppercase block mb-0.5">User Sign-in ID:</span>
                                {createdCredentials.username}
                            </div>
                            <div className="pt-2 border-t border-slate-200/60">
                                <span className="text-slate-400 font-sans font-bold text-xs uppercase block mb-0.5">Auto Generated Password:</span>
                                <span className="text-emerald-600 font-bold text-base tracking-wide select-all">{createdCredentials.password}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                const textToCopy = `User Sign-in ID: ${createdCredentials.username}\nAuto Generated Password: ${createdCredentials.password}`;
                                navigator.clipboard.writeText(textToCopy);
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                            }}
                            className={`w-full py-2.5 font-semibold rounded-xl text-sm transition-all border flex items-center justify-center gap-2 ${copied
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
                                }`}
                        >
                            {copied ? (
                                <>
                                    <span>Copied!</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </>
                            ) : (
                                <>
                                    <span>Copy Both Credentials</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setCreatedCredentials(null); loadInitialData(); }}
                            className="w-full py-2.5 bg-blue-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
                        >
                            Done & Close Workspace
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}