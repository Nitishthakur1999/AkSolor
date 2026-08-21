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
    const [revealCopied, setRevealCopied] = useState(false);

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

    // ── 🆕 Photo Upload (Create Employee) ────────────────────────────────
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoBase64, setPhotoBase64] = useState(null);
    const [photoExtension, setPhotoExtension] = useState(null);
    const [photoError, setPhotoError] = useState("");

    // ── 🆕 Photo Upload (Edit Employee)
    const PHOTO_BASE_URL = "";
    const [editPhotoPreview, setEditPhotoPreview] = useState(null);
    const [editPhotoBase64, setEditPhotoBase64] = useState(null);
    const [editPhotoExtension, setEditPhotoExtension] = useState(null);
    const [editPhotoError, setEditPhotoError] = useState("");

    // 🆕 Category options
    const CATEGORY_OPTIONS = ["Unskilled", "Semi Skilled", "Skilled", "High Skilled"];

    // ✅ Cleaned Form State
    const initialFormState = {
        firstName: "",
        lastName: "",
        fatherHusbandName: "",
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
        category: "",
        currentCtc: "",
        roleId: "",
        probationEndDate: "",
        confirmationDate: ""
    };

    const [createForm, setCreateForm] = useState(initialFormState);
    const [editForm, setEditForm] = useState({ empId: "", empCode: "", ...initialFormState });
   // const [editForm, setEditForm] = useState({ empId: "", ...initialFormState });

    // ✅ Real-time duplicate-field check state
    const emptyFieldCheckMessages = {
        empCode: { type: "", text: "" },
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

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoError("");
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(file.type)) return setPhotoError("Only JPG, JPEG, or PNG files are allowed.");
        if (file.size > 2 * 1024 * 1024) return setPhotoError("Photo size must be under 2MB.");

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            setPhotoPreview(result);
            setPhotoBase64(result);
            setPhotoExtension(file.name.split(".").pop().toLowerCase());
        };
        reader.onerror = () => setPhotoError("Failed to read the file.");
        reader.readAsDataURL(file);
    };

    const clearPhoto = () => {
        setPhotoPreview(null); setPhotoBase64(null); setPhotoExtension(null); setPhotoError("");
    };

    const handleEditPhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setEditPhotoError("");
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
        if (!allowedTypes.includes(file.type)) return setEditPhotoError("Only JPG, JPEG, or PNG files are allowed.");
        if (file.size > 2 * 1024 * 1024) return setEditPhotoError("Photo size must be under 2MB.");

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            setEditPhotoPreview(result);
            setEditPhotoBase64(result);
            setEditPhotoExtension(file.name.split(".").pop().toLowerCase());
        };
        reader.onerror = () => setEditPhotoError("Failed to read the file.");
        reader.readAsDataURL(file);
    };

    const clearEditPhoto = () => {
        setEditPhotoPreview(null); setEditPhotoBase64(null); setEditPhotoExtension(null); setEditPhotoError("");
    };

    useEffect(() => {
        loadInitialData();
        loadMilestones();
    }, []);

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

            if (empRes.success) setEmployees(empRes.data || []);
            if (depRes.success) setDepartments(depRes.data || []);
            if (desigRes.success) setDesignations(desigRes.data || []);
            if (roleRes.success) setRoles(roleRes.data || []);
        } catch (err) {
            console.error("Error loading employee pipeline:", err);
        } finally {
            setLoading(false);
        }
    };

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

    const handleMarkMilestoneSent = async (notifId) => {
        try {
            const res = await adminService.markNotificationSent({ notifId, sentBy: loggedInEmpId || 0 });
            if (res.success) setMilestones(prev => prev.filter(m => m.notifId !== notifId));
            else alert(res.message || "Failed to mark notification as sent.");
        } catch (err) {
            console.error(err);
            alert("Network error while marking notification sent.");
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.deptId || !createForm.desigId || !createForm.roleId) return alert("Please map valid Department, Designation, and Role targets!");
        if (createForm.employmentType === "Probation" && !createForm.probationEndDate) return alert("Probation End Date is required when Employment Type is 'Probation'.");
        const hasDuplicate = Object.values(fieldCheckMessages).some(msg => msg.type === "error");
        if (hasDuplicate) return alert("Please resolve the duplicate field warnings (highlighted in red) before submitting.");

        setActionLoading(true);
        try {
            const payload = {
                firstName: createForm.firstName ? createForm.firstName.trim() : "",
                lastName: createForm.lastName ? createForm.lastName.trim() : "",
                fatherHusbandName: createForm.fatherHusbandName ? createForm.fatherHusbandName.trim() : null,
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
                category: createForm.category || null,

                dateOfBirth: createForm.dateOfBirth ? new Date(createForm.dateOfBirth).toISOString() : null,
                dateOfJoining: createForm.dateOfJoining ? new Date(createForm.dateOfJoining).toISOString() : null,
                probationEndDate: createForm.probationEndDate ? new Date(createForm.probationEndDate).toISOString() : null,
                confirmationDate: createForm.confirmationDate ? new Date(createForm.confirmationDate).toISOString() : null,

                photoBase64: photoBase64 || null,
                photoExtension: photoExtension || null
            };

            const res = await adminService.createEmployee(payload);
            if (res.success) {
                setShowCreateModal(false);
                setCreateForm(initialFormState);
                setActiveTab("personal");
                setFieldCheckMessages(emptyFieldCheckMessages);
                clearPhoto();

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

    const openEditModal = (emp) => {
        setEditForm({
            empId: emp.empId,
            empCode: emp.empCode || "",
            firstName: emp.firstName || "",
            lastName: emp.lastName || "",
            fatherHusbandName: emp.fatherHusbandName || "",
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
            category: emp.category || "",
            currentCtc: emp.currentCtc ? emp.currentCtc.toString() : "",
            probationEndDate: emp.probationEndDate ? emp.probationEndDate.split("T")[0] : "",
            confirmationDate: emp.confirmationDate ? emp.confirmationDate.split("T")[0] : ""
        });

        setFieldCheckMessages(emptyFieldCheckMessages);
        setEditPhotoBase64(null);
        setEditPhotoExtension(null);
        setEditPhotoError("");
        setEditPhotoPreview(emp.photoPath ? `${PHOTO_BASE_URL}${emp.photoPath}` : null);
        setActiveTab("personal");
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editForm.empId) return alert("Employee target identity could not be verified!");
        if (editForm.employmentType === "Probation" && !editForm.probationEndDate) return alert("Probation End Date is required when Employment Type is 'Probation'.");
        const hasDuplicate = Object.values(fieldCheckMessages).some(msg => msg.type === "error");
        if (hasDuplicate) return alert("Please resolve the duplicate field warnings (highlighted in red) before submitting.");

        setActionLoading(true);
        try {
            const payload = {
                empCode: editForm.empCode ? editForm.empCode.trim() : "",
                firstName: editForm.firstName ? editForm.firstName.trim() : "",
                lastName: editForm.lastName ? editForm.lastName.trim() : "",
                fatherHusbandName: editForm.fatherHusbandName ? editForm.fatherHusbandName.trim() : null,
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
                category: editForm.category || null,

                dateOfBirth: editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toISOString() : null,
                dateOfJoining: editForm.dateOfJoining ? new Date(editForm.dateOfJoining).toISOString() : null,
                probationEndDate: editForm.probationEndDate ? new Date(editForm.probationEndDate).toISOString() : null,
                confirmationDate: editForm.confirmationDate ? new Date(editForm.confirmationDate).toISOString() : null,

                photoBase64: editPhotoBase64 || null,
                photoExtension: editPhotoExtension || null
            };

            const res = await adminService.updateEmployee(parseInt(editForm.empId, 10), payload);

            if (res && res.success) {
                setShowEditModal(false);
                clearEditPhoto();
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

    const handleDelete = async (empId) => {
        if (!window.confirm("Are you sure you want to completely remove this employee profile?")) return;
        try {
            const res = await adminService.deleteEmployee(empId);
            if (res.success) setEmployees(prev => prev.filter(item => item.empId !== empId));
            else alert(res.message || "Failed to drop staff profile.");
        } catch (err) { console.error(err); }
    };

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
        if (!promoteForm.newDesigId || !promoteForm.effectiveDate) return alert("New Designation and Effective Date are required.");

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

    const openIncrementModal = async (emp) => {
        setIncrementTarget(emp);
        setShowIncrementModal(true);
        setActionLoading(true);

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
                    basic: cur.basic ?? "", hra: cur.hra ?? "", ta: cur.ta ?? "", da: cur.da ?? "", specialAllow: cur.specialAllow ?? "",
                    pfEmployee: cur.pfEmployee ?? "", pfEmployer: cur.pfEmployer ?? "", esicEmployee: cur.esicEmployee ?? "", esicEmployer: cur.esicEmployer ?? "",
                    tds: cur.tds ?? "", professionalTax: cur.professionalTax ?? "",
                    effectiveFrom: blankForm.effectiveFrom
                });
            } else {
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
        if (!incrementForm.basic || !incrementForm.effectiveFrom) return alert("Basic salary and Effective Date are required.");

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

    const totalItems = filteredEmployees.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "Active": return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
            case "Resigned": return "bg-amber-50 text-amber-700 border-amber-200/50";
            default: return "bg-rose-50 text-rose-700 border-rose-200/50";
        }
    };

    const getStatusDotClass = (status) => {
        return status === "Active" ? "bg-emerald-500" : (status === "Resigned" ? "bg-amber-500" : "bg-rose-500");
    };

    const handleToggleStatus = async (empId, currentStatus) => {
        const nextStatus = currentStatus === "Active" ? "Resigned" : "Active";
        if (!window.confirm(`Are you sure you want to change employee status to ${nextStatus}?`)) return;

        try {
            const res = await adminService.toggleEmployeeStatus(empId, nextStatus);
            if (res.success) loadInitialData();
            else alert(res.message || "Failed to update employment status pipeline.");
        } catch (err) {
            console.error("Error toggling operational tracking status:", err);
            alert("API execution breakdown. Check backend logging network nodes.");
        }
    };

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
        <div className="space-y-5 pb-10 font-sans">

            {/* ── Compact Header Section ── */}
            <div className="bg-[#0b2532] rounded-2xl px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-users-gear text-lg text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Employees Registry</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Manage complete workforce parameters, system accounts, and job identities.
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setShowCreateModal(true);
                        setCreateForm(initialFormState);
                        setActiveTab("personal");
                        setFieldCheckMessages(emptyFieldCheckMessages);
                        clearPhoto();
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center justify-center gap-2 shadow-sm"
                >
                    <i className="fa-solid fa-plus" />
                    Add Employee
                </button>
            </div>

            {/* ── Upcoming Milestones Banner ── */}
            {!milestonesLoading && milestones.length > 0 && showMilestones && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center">
                        <p className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-2">
                            <i className="fa-regular fa-bell"></i> Upcoming Milestones (next 7 days) — {milestones.length}
                        </p>
                        <button onClick={() => setShowMilestones(false)} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-amber-100 text-amber-600 transition-colors">
                            <i className="fa-solid fa-xmark text-sm" />
                        </button>
                    </div>
                    <div className="grid gap-2">
                        {milestones.map((m, i) => (
                            <div key={m.notifId ?? i} className="flex flex-wrap items-center justify-between gap-2 bg-white border border-amber-100 rounded-xl px-4 py-2.5 shadow-sm">
                                <div>
                                    <span className="text-sm font-bold text-slate-800">
                                        {m.empName ?? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() ?? `EMP-${m.empId}`}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500 ml-2">
                                        {m.notifType === "ProbationEnd" ? "Probation ending" : "Work anniversary"} on{" "}
                                        <span className="font-bold text-amber-600">{m.milestoneDate ? new Date(m.milestoneDate).toLocaleDateString("en-IN") : "—"}</span>
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleMarkMilestoneSent(m.notifId)}
                                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                                >
                                    Mark as sent
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Live Search Utilities Bar ── */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Search Profile</label>
                <div className="relative group flex items-center gap-3">
                    <div className="relative flex-1">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or employee code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                        />
                    </div>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* ── Core Records Table ── */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="py-24 flex flex-col items-center justify-center gap-4">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Synchronizing employee nodes...</div>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="py-24 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                                <i className="fa-solid fa-users-slash text-2xl text-slate-300" />
                            </div>
                            <p className="text-base text-slate-700 font-bold">No results found</p>
                            <p className="text-sm text-slate-400 mt-1 font-medium">Try adjusting your search query.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1150px]">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Code / Username</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Full Name</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Role</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Mobile Contact</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Gender</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">City & State</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Actions Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {currentItems.map((emp) => (
                                    <tr key={emp.empId} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs font-bold text-amber-600 group-hover:text-amber-700 transition-colors">
                                                {emp.empCode || "PENDING"}
                                            </div>
                                            <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                                {emp.username || "no-login"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-800">
                                            {emp.firstName} {emp.lastName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                                                {emp.roleName || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-[13px] font-medium text-slate-500">
                                            {emp.mobile}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${emp.gender === "Male" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"}`}>
                                                {emp.gender}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[13px] font-medium text-slate-500 max-w-[160px] truncate" title={emp.city ? `${emp.city}, ${emp.state}` : emp.state}>
                                            {emp.city ? `${emp.city}, ${emp.state || ""}` : emp.state || "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(emp.empId, emp.employmentStatus)}
                                                title="Click to toggle status (Active <-> Resigned)"
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border transition-all duration-200 active:scale-95 hover:shadow-sm ${getStatusBadgeClass(emp.employmentStatus)}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(emp.employmentStatus)}`} />
                                                {emp.employmentStatus || "Active"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <div className="flex flex-wrap items-center justify-center gap-2">
                                                <button onClick={() => openEditModal(emp)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors" title="Edit Profile">
                                                    <i className="fa-solid fa-pen text-[13px]" />
                                                </button>
                                                <button onClick={() => openPromoteModal(emp)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Promote">
                                                    <i className="fa-solid fa-arrow-trend-up text-[13px]" />
                                                </button>
                                                <button onClick={() => openIncrementModal(emp)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="Salary Increment">
                                                    <i className="fa-solid fa-indian-rupee-sign text-[13px]" />
                                                </button>
                                                <button onClick={() => openHistoryModal(emp)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors" title="View History">
                                                    <i className="fa-solid fa-clock-rotate-left text-[13px]" />
                                                </button>
                                                <button onClick={() => openRevealModal(emp)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors" title="Reveal Credentials">
                                                    <i className="fa-solid fa-key text-[13px]" />
                                                </button>
                                                <button onClick={() => handleDelete(emp.empId)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors" title="Delete Profile">
                                                    <i className="fa-solid fa-trash-can text-[13px]" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* 🔢 PAGINATION WIDGET BAR */}
                {!loading && totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4">
                        <div>
                            Showing <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                            <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, totalItems)}</span> of{" "}
                            <span className="font-bold text-slate-800">{totalItems}</span> entries
                        </div>
                        <div className="flex gap-1.5">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                            </button>
                            <div className="hidden sm:flex gap-1.5">
                                {[...Array(totalPages)].map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPage(index + 1)}
                                        className={`w-8 h-8 rounded-lg border text-sm font-bold transition-all shadow-sm flex items-center justify-center ${currentPage === index + 1
                                                ? "bg-amber-500 border-amber-500 text-white"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                            >
                                Next <i className="fa-solid fa-chevron-right text-[10px]" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ➕ Modal popup: CREATE EMPLOYEE */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold text-slate-900">Register New Staff Profile</h3>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <div className="flex gap-2 border-b border-slate-100 pb-1 text-[11px] font-bold uppercase tracking-wider">
                            <button type="button" onClick={() => setActiveTab("personal")} className={`pb-2 px-2 border-b-2 transition-colors ${activeTab === "personal" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Personal</button>
                            <button type="button" onClick={() => setActiveTab("contact")} className={`pb-2 px-2 border-b-2 transition-colors ${activeTab === "contact" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Contact/Docs</button>
                            <button type="button" onClick={() => setActiveTab("corporate")} className={`pb-2 px-2 border-b-2 transition-colors ${activeTab === "corporate" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Corporate/HR</button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-5 pt-1">
                            {activeTab === "personal" && (
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2 flex items-center gap-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <i className="fa-solid fa-user text-slate-300 text-2xl" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Employee Photo</label>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png"
                                                onChange={handlePhotoChange}
                                                className="w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-700 file:font-bold hover:file:bg-amber-200 cursor-pointer"
                                            />
                                            {photoError && <p className="text-[11px] text-rose-600 font-bold mt-1.5">{photoError}</p>}
                                            {photoPreview && !photoError && (
                                                <button type="button" onClick={clearPhoto} className="text-[11px] font-bold text-rose-500 hover:text-rose-600 mt-1.5 underline">Remove photo</button>
                                            )}
                                        </div>
                                    </div>

                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">First Name *</label><input type="text" required value={createForm.firstName} onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Last Name</label><input type="text" value={createForm.lastName} onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div> <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Father/Husband Name</label><input type="text" value={createForm.fatherHusbandName} onChange={e => setCreateForm({ ...createForm, fatherHusbandName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Gender *</label><select value={createForm.gender} onChange={e => setCreateForm({ ...createForm, gender: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"><option>Male</option><option>Female</option><option>Other</option></select></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date of Birth *</label><input type="date" required value={createForm.dateOfBirth} onChange={e => setCreateForm({ ...createForm, dateOfBirth: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Blood Group</label><input type="text" placeholder="e.g., O+" value={createForm.bloodGroup} onChange={e => setCreateForm({ ...createForm, bloodGroup: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Marital Status</label><select value={createForm.maritalStatus} onChange={e => setCreateForm({ ...createForm, maritalStatus: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select></div>
                                </div>
                            )}

                            {activeTab === "contact" && (
                                <div className="space-y-5">
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mobile Contact *</label>
                                            <input
                                                type="text"
                                                required
                                                value={createForm.mobile}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    setCreateForm({ ...createForm, mobile: value });
                                                    checkFieldDuplicate("mobile", value);
                                                }}
                                                className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldCheckMessages.mobile.type === "error" ? "border-rose-400 focus:ring-1 focus:ring-rose-400" : "border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"}`}
                                            />
                                            {fieldCheckMessages.mobile.text && (
                                                <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide ${fieldCheckMessages.mobile.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                    {fieldCheckMessages.mobile.text}
                                                </p>
                                            )}
                                        </div>
                                        <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Alternate Mobile</label><input type="text" value={createForm.alternateMobile} onChange={e => setCreateForm({ ...createForm, alternateMobile: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Personal Email</label>
                                            <input
                                                type="email"
                                                value={createForm.personalEmail}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    setCreateForm({ ...createForm, personalEmail: value });
                                                    checkFieldDuplicate("personalEmail", value);
                                                }}
                                                className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldCheckMessages.personalEmail.type === "error" ? "border-rose-400 focus:ring-1 focus:ring-rose-400" : "border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"}`}
                                            />
                                            {fieldCheckMessages.personalEmail.text && (
                                                <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide ${fieldCheckMessages.personalEmail.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                    {fieldCheckMessages.personalEmail.text}
                                                </p>
                                            )}
                                        </div>
                                        <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Country</label><input type="text" value={createForm.country} onChange={e => setCreateForm({ ...createForm, country: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        <div className="sm:col-span-2"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Address Line 1</label><input type="text" value={createForm.addressLine1} onChange={e => setCreateForm({ ...createForm, addressLine1: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        <div className="sm:col-span-2"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Address Line 2</label><input type="text" value={createForm.addressLine2} onChange={e => setCreateForm({ ...createForm, addressLine2: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">City</label><input type="text" value={createForm.city} onChange={e => setCreateForm({ ...createForm, city: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">State</label><input type="text" value={createForm.state} onChange={e => setCreateForm({ ...createForm, state: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Pincode</label><input type="text" value={createForm.pincode} onChange={e => setCreateForm({ ...createForm, pincode: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-5">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><i className="fa-regular fa-id-card"></i> Government Verification IDs</h4>
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Aadhar Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="12-digit number"
                                                    value={createForm.aadharNo}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setCreateForm({ ...createForm, aadharNo: value });
                                                        checkFieldDuplicate("aadharNo", value);
                                                    }}
                                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldCheckMessages.aadharNo.type === "error" ? "border-rose-400 focus:ring-1 focus:ring-rose-400" : "border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"}`}
                                                />
                                                {fieldCheckMessages.aadharNo.text && (
                                                    <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide ${fieldCheckMessages.aadharNo.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                        {fieldCheckMessages.aadharNo.text}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">PAN Card Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="10-digit alphanumeric"
                                                    value={createForm.panNo}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setCreateForm({ ...createForm, panNo: value });
                                                        checkFieldDuplicate("panNo", value);
                                                    }}
                                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldCheckMessages.panNo.type === "error" ? "border-rose-400 focus:ring-1 focus:ring-rose-400" : "border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"}`}
                                                />
                                                {fieldCheckMessages.panNo.text && (
                                                    <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide ${fieldCheckMessages.panNo.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                        {fieldCheckMessages.panNo.text}
                                                    </p>
                                                )}
                                            </div>
                                            <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Passport Number</label><input type="text" value={createForm.passportNo} onChange={e => setCreateForm({ ...createForm, passportNo: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                            <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">PF UAN Account</label><input type="text" value={createForm.uanNo} onChange={e => setCreateForm({ ...createForm, uanNo: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                            <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">ESIC Insurance Number</label><input type="text" value={createForm.esicNo} onChange={e => setCreateForm({ ...createForm, esicNo: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "corporate" && (
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Official Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={createForm.officialEmail}
                                            onChange={e => {
                                                const value = e.target.value;
                                                setCreateForm({ ...createForm, officialEmail: value });
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                        />
                                    </div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date of Joining *</label><input type="date" required value={createForm.dateOfJoining} onChange={e => setCreateForm({ ...createForm, dateOfJoining: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Department *</label>
                                        <select required value={createForm.deptId} onChange={e => setCreateForm({ ...createForm, deptId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer">
                                            <option value="">-- Choose Dept --</option>
                                            {departments.filter(d => d.isActive).map(d => <option key={d.deptId} value={d.deptId}>{d.departmentName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Designation *</label>
                                        <select required value={createForm.desigId} onChange={e => setCreateForm({ ...createForm, desigId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer">
                                            <option value="">-- Choose Designation --</option>
                                            {designations.filter(ds => ds.isActive).map(ds => <option key={ds.desigId} value={ds.desigId}>{ds.designationName}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reporting Manager</label>
                                        <select
                                            value={createForm.reportingManager}
                                            onChange={e => setCreateForm({ ...createForm, reportingManager: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                                        >
                                            <option value="">-- No Reporting Manager --</option>
                                            {employees
                                                .filter(emp =>
                                                    (emp.employmentStatus === "Active" && ![1, 2, 5].includes(emp.roleId)) ||
                                                    String(emp.empId) === String(createForm.reportingManager)
                                                )
                                                .map(emp => (
                                                    <option key={emp.empId} value={String(emp.empId)}>
                                                        {emp.firstName} {emp.lastName} ({emp.empCode})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                                        <select value={createForm.category} onChange={e => setCreateForm({ ...createForm, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer">
                                            <option value="">-- Select Category --</option>
                                            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">System Security Role *</label>
                                        <select required value={createForm.roleId} onChange={e => setCreateForm({ ...createForm, roleId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer">
                                            <option value="">-- Assign Login Role Tiers --</option>
                                            {roles.filter(r => Number(r.roleId) > loggedInRoleId).map(r => (
                                                <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Employment Type</label>
                                        <select
                                            value={createForm.employmentType}
                                            onChange={e => {
                                                const newType = e.target.value;
                                                let updatedProbationDate = createForm.probationEndDate;
                                                if (newType === "Probation" && createForm.dateOfJoining && !createForm.probationEndDate) {
                                                    const doj = new Date(createForm.dateOfJoining);
                                                    doj.setMonth(doj.getMonth() + 3);
                                                    updatedProbationDate = doj.toISOString().split("T")[0];
                                                }
                                                setCreateForm({ ...createForm, employmentType: newType, probationEndDate: updatedProbationDate });
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                                        >
                                            <option>Permanent</option><option>Probation</option><option>Contract</option><option>Part-Time</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Probation End Date{createForm.employmentType === "Probation" ? " *" : ""}</label>
                                        <input type="date" required={createForm.employmentType === "Probation"} value={createForm.probationEndDate} onChange={e => setCreateForm({ ...createForm, probationEndDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                                    </div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Confirmation Date</label><input type="date" value={createForm.confirmationDate} onChange={e => setCreateForm({ ...createForm, confirmationDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                </div>
                            )}

                            <div className="flex justify-between items-center border-t border-slate-100 pt-5 mt-4">
                                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Ensure mandatory * components are mapped.</div>
                                <div className="flex gap-3">
                                    {activeTab !== "corporate" ? (
                                        <button type="button" onClick={() => setActiveTab(activeTab === "personal" ? "contact" : "corporate")} className="px-6 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                                            Next Segment <i className="fa-solid fa-chevron-right text-[10px] ml-1" />
                                        </button>
                                    ) : (
                                        <button type="submit" disabled={actionLoading} className="px-6 py-2.5 text-xs font-bold text-white bg-[#0b2836] hover:bg-[#0f3345] rounded-xl shadow-lg shadow-[#0b2836]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                                            {actionLoading ? "Processing..." : "Register Employee Profile"}
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold text-slate-900">Modify Employee Parameters</h3>
                            <button type="button" onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <div className="flex gap-2 border-b border-slate-100 pb-1 text-[11px] font-bold uppercase tracking-wider">
                            <button type="button" onClick={() => setActiveTab("personal")} className={`pb-2 px-2 border-b-2 transition-colors ${activeTab === "personal" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Personal</button>
                            <button type="button" onClick={() => setActiveTab("contact")} className={`pb-2 px-2 border-b-2 transition-colors ${activeTab === "contact" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Contact/Docs</button>
                            <button type="button" onClick={() => setActiveTab("corporate")} className={`pb-2 px-2 border-b-2 transition-colors ${activeTab === "corporate" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Corporate/HR</button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-5 pt-1">
                            {activeTab === "personal" && (
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-2 flex items-center gap-5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden bg-white flex items-center justify-center shrink-0 shadow-sm">
                                            {editPhotoPreview ? (
                                                <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <i className="fa-solid fa-user text-slate-300 text-2xl" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Employee Photo</label>
                                            <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png"
                                                onChange={handleEditPhotoChange}
                                                className="w-full text-xs file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-700 file:font-bold hover:file:bg-amber-200 cursor-pointer"
                                            />
                                            {editPhotoError && <p className="text-[11px] text-rose-600 font-bold mt-1.5">{editPhotoError}</p>}
                                            {editPhotoBase64 && !editPhotoError && (
                                                <p className="text-[10px] text-emerald-600 font-bold mt-1.5 uppercase tracking-wide">New photo selected — will update on save.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">First Name *</label><input type="text" required value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Last Name</label><input type="text" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Father/Husband Name</label><input type="text" value={editForm.fatherHusbandName} onChange={e => setEditForm({ ...editForm, fatherHusbandName: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Gender *</label><select value={editForm.gender} onChange={e => setEditForm({ ...editForm, gender: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"><option>Male</option><option>Female</option><option>Other</option></select></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date of Birth *</label><input type="date" required value={editForm.dateOfBirth} onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Blood Group</label><input type="text" value={editForm.bloodGroup} onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Marital Status</label><select value={editForm.maritalStatus} onChange={e => setEditForm({ ...editForm, maritalStatus: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select></div>
                                </div>
                            )}

                            {activeTab === "contact" && (
                                <div className="space-y-5">
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mobile Contact *</label>
                                            <input
                                                type="text"
                                                required
                                                value={editForm.mobile}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    setEditForm({ ...editForm, mobile: value });
                                                    checkFieldDuplicate("mobile", value, parseInt(editForm.empId, 10));
                                                }}
                                                className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldCheckMessages.mobile.type === "error" ? "border-rose-400 focus:ring-1 focus:ring-rose-400" : "border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"}`}
                                            />
                                            {fieldCheckMessages.mobile.text && (
                                                <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide ${fieldCheckMessages.mobile.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                    {fieldCheckMessages.mobile.text}
                                                </p>
                                            )}
                                        </div>
                                        <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Alternate Mobile</label><input type="text" value={editForm.alternateMobile} onChange={e => setEditForm({ ...editForm, alternateMobile: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Personal Email</label>
                                            <input
                                                type="email"
                                                value={editForm.personalEmail}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    setEditForm({ ...editForm, personalEmail: value });
                                                    checkFieldDuplicate("personalEmail", value, parseInt(editForm.empId, 10));
                                                }}
                                                className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldCheckMessages.personalEmail.type === "error" ? "border-rose-400 focus:ring-1 focus:ring-rose-400" : "border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"}`}
                                            />
                                            {fieldCheckMessages.personalEmail.text && (
                                                <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide ${fieldCheckMessages.personalEmail.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                    {fieldCheckMessages.personalEmail.text}
                                                </p>
                                            )}
                                        </div>
                                        <div className="sm:col-span-2"><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Address Line 1</label><input type="text" value={editForm.addressLine1} onChange={e => setEditForm({ ...editForm, addressLine1: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">City</label><input type="text" value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">State</label><input type="text" value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    </div>

                                    <div className="border-t border-slate-100 pt-5">
                                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><i className="fa-regular fa-id-card"></i> Government Verification IDs</h4>
                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Aadhar Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="12-digit number"
                                                    value={editForm.aadharNo}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setEditForm({ ...editForm, aadharNo: value });
                                                        checkFieldDuplicate("aadharNo", value, parseInt(editForm.empId, 10));
                                                    }}
                                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldCheckMessages.aadharNo.type === "error" ? "border-rose-400 focus:ring-1 focus:ring-rose-400" : "border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"}`}
                                                />
                                                {fieldCheckMessages.aadharNo.text && (
                                                    <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide ${fieldCheckMessages.aadharNo.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                        {fieldCheckMessages.aadharNo.text}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">PAN Card Number</label>
                                                <input
                                                    type="text"
                                                    placeholder="10-digit alphanumeric"
                                                    value={editForm.panNo}
                                                    onChange={e => {
                                                        const value = e.target.value;
                                                        setEditForm({ ...editForm, panNo: value });
                                                        checkFieldDuplicate("panNo", value, parseInt(editForm.empId, 10));
                                                    }}
                                                    className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldCheckMessages.panNo.type === "error" ? "border-rose-400 focus:ring-1 focus:ring-rose-400" : "border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"}`}
                                                />
                                                {fieldCheckMessages.panNo.text && (
                                                    <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide ${fieldCheckMessages.panNo.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                        {fieldCheckMessages.panNo.text}
                                                    </p>
                                                )}
                                            </div>
                                            <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Passport Number</label><input type="text" value={editForm.passportNo} onChange={e => setEditForm({ ...editForm, passportNo: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                            <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">PF UAN Account</label><input type="text" value={editForm.uanNo} onChange={e => setEditForm({ ...editForm, uanNo: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                            <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">ESIC Insurance Number</label><input type="text" value={editForm.esicNo} onChange={e => setEditForm({ ...editForm, esicNo: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === "corporate" && (
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Employee Code *</label>
                                        <input
                                            type="text"
                                            required
                                            value={editForm.empCode}
                                            onChange={e => {
                                                const value = e.target.value.toUpperCase();
                                                setEditForm({ ...editForm, empCode: value });
                                                const isValidFormat = /^AKS-\d{3,}$/.test(value.trim());
                                                const isDuplicate = employees.some(emp =>
                                                    (emp.empCode || "").toUpperCase() === value.trim() &&
                                                    emp.empId !== parseInt(editForm.empId, 10)
                                                );
                                                setFieldCheckMessages(prev => ({
                                                    ...prev,
                                                    empCode: !value.trim()
                                                        ? { type: "", text: "" }
                                                        : !isValidFormat
                                                            ? { type: "error", text: "Format must be like AKS-001" }
                                                            : isDuplicate
                                                                ? { type: "error", text: "Employee code already in use!" }
                                                                : { type: "success", text: "Available ✓" }
                                                }));
                                            }}
                                            className={`w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none ${fieldCheckMessages.empCode?.type === "error" ? "border-rose-400 focus:ring-1 focus:ring-rose-400" : "border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"}`}
                                        />
                                        {fieldCheckMessages.empCode?.text && (
                                            <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wide ${fieldCheckMessages.empCode.type === "error" ? "text-rose-600" : "text-emerald-600"}`}>
                                                {fieldCheckMessages.empCode.text}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Official Corporate Email *</label>
                                        <input
                                            type="email"
                                            required
                                            value={editForm.officialEmail}
                                            onChange={e => {
                                                const value = e.target.value;
                                                setEditForm({ ...editForm, officialEmail: value });
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl border text-sm transition-all focus:outline-none border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                        />
                                    </div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Date of Joining *</label><input type="date" required value={editForm.dateOfJoining} onChange={e => setEditForm({ ...editForm, dateOfJoining: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Department *</label>
                                        <select required value={editForm.deptId} onChange={e => setEditForm({ ...editForm, deptId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer">
                                            {departments.filter(d => d.isActive || d.deptId.toString() === editForm.deptId).map(d => (
                                                <option key={d.deptId} value={d.deptId}>{d.departmentName}{!d.isActive ? " (Inactive)" : ""}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Designation *</label>
                                        <select required value={editForm.desigId} onChange={e => setEditForm({ ...editForm, desigId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer">
                                            {designations.filter(ds => ds.isActive || ds.desigId.toString() === editForm.desigId).map(ds => (
                                                <option key={ds.desigId} value={ds.desigId}>{ds.designationName}{!ds.isActive ? " (Inactive)" : ""}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Reporting Manager</label>
                                        <select
                                            value={editForm.reportingManager}
                                            onChange={e => setEditForm({ ...editForm, reportingManager: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                                        >
                                            <option value="">-- No Reporting Manager --</option>
                                            {employees
                                                .filter(emp =>
                                                    emp.empId !== parseInt(editForm.empId, 10) &&
                                                    ((emp.employmentStatus === "Active" && ![1, 2, 5].includes(emp.roleId)) ||
                                                        String(emp.empId) === String(editForm.reportingManager))
                                                )
                                                .map(emp => (
                                                    <option key={emp.empId} value={String(emp.empId)}>
                                                        {emp.firstName} {emp.lastName} ({emp.empCode})
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Category</label>
                                        <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer">
                                            <option value="">-- Select Category --</option>
                                            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">System Security Role *</label>
                                        <select required value={editForm.roleId} onChange={e => setEditForm({ ...editForm, roleId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer">
                                            {roles.filter(r => Number(r.roleId) > loggedInRoleId).map(r => (
                                                <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Employment Status</label><select value={editForm.employmentStatus} onChange={e => setEditForm({ ...editForm, employmentStatus: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"><option>Active</option><option>Resigned</option><option>Terminated</option><option>Retired</option></select></div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Probation End Date{editForm.employmentType === "Probation" ? " *" : ""}</label>
                                        <input type="date" required={editForm.employmentType === "Probation"} value={editForm.probationEndDate} onChange={e => setEditForm({ ...editForm, probationEndDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                                    </div>
                                    <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Confirmation Date</label><input type="date" value={editForm.confirmationDate} onChange={e => setEditForm({ ...editForm, confirmationDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-4">
                                <button type="button" onClick={() => { setShowEditModal(false); clearEditPhoto(); }} className="px-6 py-2.5 text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-6 py-2.5 text-xs font-bold text-white bg-[#0b2836] hover:bg-[#0f3345] rounded-xl shadow-lg shadow-[#0b2836]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                                    {actionLoading ? "Updating..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🆕 Modal popup: PROMOTE EMPLOYEE */}
            {showPromoteModal && promoteTarget && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-5">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Promote Employee</h3>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    {promoteTarget.firstName} {promoteTarget.lastName} ({promoteTarget.empCode})
                                </p>
                            </div>
                            <button type="button" onClick={() => setShowPromoteModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handlePromote} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">New Designation *</label>
                                <select required value={promoteForm.newDesigId} onChange={e => setPromoteForm({ ...promoteForm, newDesigId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white transition-all cursor-pointer">
                                    <option value="">-- Select --</option>
                                    {designations.filter(ds => ds.isActive).map(ds => <option key={ds.desigId} value={ds.desigId}>{ds.designationName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">New Department (optional)</label>
                                <select value={promoteForm.newDeptId} onChange={e => setPromoteForm({ ...promoteForm, newDeptId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-white transition-all cursor-pointer">
                                    <option value="">-- Keep current department --</option>
                                    {departments.filter(d => d.isActive).map(d => <option key={d.deptId} value={d.deptId}>{d.departmentName}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">New CTC (optional)</label>
                                <input type="number" value={promoteForm.newCtc} onChange={e => setPromoteForm({ ...promoteForm, newCtc: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Effective Date *</label>
                                <input type="date" required value={promoteForm.effectiveDate} onChange={e => setPromoteForm({ ...promoteForm, effectiveDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Remarks</label>
                                <textarea rows={2} value={promoteForm.remarks} onChange={e => setPromoteForm({ ...promoteForm, remarks: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none transition-all" />
                            </div>
                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <button type="button" onClick={() => setShowPromoteModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-colors disabled:opacity-50">
                                    {actionLoading ? "Saving..." : "Confirm Promotion"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🆕 Modal popup: SALARY INCREMENT */}
            {showIncrementModal && incrementTarget && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl p-6 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Add Salary Increment</h3>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    {incrementTarget.firstName} {incrementTarget.lastName} ({incrementTarget.empCode}) — Current CTC: <span className="font-bold text-amber-600">₹{incrementTarget.currentCtc ?? "—"}</span>
                                </p>
                            </div>
                            <button type="button" onClick={() => setShowIncrementModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleIncrement} className="space-y-4 pt-2">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Salary Structure ID</label><input type="number" value={incrementForm.structureId} onChange={e => setIncrementForm({ ...incrementForm, structureId: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Effective From *</label><input type="date" required value={incrementForm.effectiveFrom} onChange={e => setIncrementForm({ ...incrementForm, effectiveFrom: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>

                                <div className="sm:col-span-2 mt-2"><h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Earnings</h4></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Basic *</label><input type="number" required value={incrementForm.basic} onChange={e => setIncrementForm({ ...incrementForm, basic: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">HRA</label><input type="number" value={incrementForm.hra} onChange={e => setIncrementForm({ ...incrementForm, hra: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">TA</label><input type="number" value={incrementForm.ta} onChange={e => setIncrementForm({ ...incrementForm, ta: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">DA</label><input type="number" value={incrementForm.da} onChange={e => setIncrementForm({ ...incrementForm, da: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Special Allowance</label><input type="number" value={incrementForm.specialAllow} onChange={e => setIncrementForm({ ...incrementForm, specialAllow: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>

                                <div className="sm:col-span-2 mt-2"><h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Deductions & Contributions</h4></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">PF (Employee)</label><input type="number" value={incrementForm.pfEmployee} onChange={e => setIncrementForm({ ...incrementForm, pfEmployee: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">PF (Employer)</label><input type="number" value={incrementForm.pfEmployer} onChange={e => setIncrementForm({ ...incrementForm, pfEmployer: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">ESIC (Employee)</label><input type="number" value={incrementForm.esicEmployee} onChange={e => setIncrementForm({ ...incrementForm, esicEmployee: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">ESIC (Employer)</label><input type="number" value={incrementForm.esicEmployer} onChange={e => setIncrementForm({ ...incrementForm, esicEmployer: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">TDS</label><input type="number" value={incrementForm.tds} onChange={e => setIncrementForm({ ...incrementForm, tds: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                                <div><label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Professional Tax</label><input type="number" value={incrementForm.professionalTax} onChange={e => setIncrementForm({ ...incrementForm, professionalTax: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all" /></div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 mt-4">
                                <button type="button" onClick={() => setShowIncrementModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="px-5 py-2.5 text-xs font-bold text-white bg-[#0b2836] hover:bg-[#0f3345] rounded-xl shadow-lg shadow-[#0b2836]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0">
                                    {actionLoading ? "Saving..." : "Add Increment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 🆕 Modal popup: HISTORY */}
            {showHistoryModal && historyTarget && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Employee Profile History</h3>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">{historyTarget.firstName} {historyTarget.lastName} ({historyTarget.empCode})</p>
                            </div>
                            <button type="button" onClick={() => setShowHistoryModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <div className="flex gap-2 border-b border-slate-100 pb-1 text-[11px] font-bold uppercase tracking-wider">
                            <button type="button" onClick={() => setHistoryTab("promotions")} className={`pb-2 px-2 border-b-2 transition-colors ${historyTab === "promotions" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Promotions</button>
                            <button type="button" onClick={() => setHistoryTab("salary")} className={`pb-2 px-2 border-b-2 transition-colors ${historyTab === "salary" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>Salary Increments</button>
                        </div>

                        {historyLoading ? (
                            <div className="py-12 text-center flex flex-col items-center gap-3">
                                <i className="fa-solid fa-spinner animate-spin text-amber-500 text-2xl" />
                                <div className="text-slate-500 text-sm font-semibold animate-pulse">Loading temporal data...</div>
                            </div>
                        ) : (
                            <>
                                {historyTab === "promotions" && (
                                    <div className="overflow-x-auto border border-slate-200 rounded-xl mt-4">
                                        <table className="w-full text-sm border-collapse text-left whitespace-nowrap">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                                <tr>
                                                    <th className="px-5 py-3">Effective Date</th>
                                                    <th className="px-5 py-3">Old Designation</th>
                                                    <th className="px-5 py-3">New Designation</th>
                                                    <th className="px-5 py-3">New CTC</th>
                                                    <th className="px-5 py-3">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {promotionHistory.length === 0 ? (
                                                    <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 italic font-medium">No promotion records found.</td></tr>
                                                ) : promotionHistory.map((p, i) => (
                                                    <tr key={p.promoId ?? i} className="hover:bg-slate-50/50">
                                                        <td className="px-5 py-3 font-medium text-slate-600">{p.promotionDate ? new Date(p.promotionDate).toLocaleDateString("en-IN") : "—"}</td>
                                                        <td className="px-5 py-3 text-slate-500">{p.oldDesignation || "—"}</td>
                                                        <td className="px-5 py-3 font-bold text-amber-600">{p.newDesignation || "—"}</td>
                                                        <td className="px-5 py-3 font-mono text-slate-600">{p.newCtc ?? "—"}</td>
                                                        <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate" title={p.remarks}>{p.remarks || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {historyTab === "salary" && (
                                    <div className="overflow-x-auto border border-slate-200 rounded-xl mt-4">
                                        <table className="w-full text-sm border-collapse text-left whitespace-nowrap">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                                <tr>
                                                    <th className="px-5 py-3">Effective From</th>
                                                    <th className="px-5 py-3">Effective To</th>
                                                    <th className="px-5 py-3">Gross Salary</th>
                                                    <th className="px-5 py-3">Net Salary</th>
                                                    <th className="px-5 py-3">Increment Amt</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {salaryHistory.length === 0 ? (
                                                    <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400 italic font-medium">No salary increment history found.</td></tr>
                                                ) : salaryHistory.map((s, i) => (
                                                    <tr key={s.salId ?? i} className="hover:bg-slate-50/50">
                                                        <td className="px-5 py-3 font-medium text-slate-600">{s.effectiveFrom ? new Date(s.effectiveFrom).toLocaleDateString("en-IN") : "—"}</td>
                                                        <td className="px-5 py-3 font-medium text-slate-500">{s.effectiveTo ? new Date(s.effectiveTo).toLocaleDateString("en-IN") : <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">Current</span>}</td>
                                                        <td className="px-5 py-3 font-mono text-slate-600">₹{s.grossSalary ?? "—"}</td>
                                                        <td className="px-5 py-3 font-mono font-bold text-slate-800">₹{s.netSalary ?? "—"}</td>
                                                        <td className="px-5 py-3 font-mono font-bold">
                                                            {s.incrementAmount != null ? (
                                                                <span className={s.incrementAmount >= 0 ? "text-emerald-600" : "text-rose-600"}>
                                                                    {s.incrementAmount >= 0 ? "+" : ""}₹{s.incrementAmount}
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">System Login Credentials</h3>
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    {revealTarget.firstName} {revealTarget.lastName} ({revealTarget.empCode})
                                </p>
                            </div>
                            <button type="button" onClick={() => setShowRevealModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        {!revealedCreds ? (
                            <form onSubmit={handleRevealCredentials} className="space-y-5 pt-2">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Master Security Key *</label>
                                    <input
                                        type="password"
                                        required
                                        value={secretKeyInput}
                                        onChange={e => setSecretKeyInput(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                                        placeholder="Enter the shared administration key"
                                    />
                                </div>
                                <div className="bg-rose-50 border border-rose-200/50 rounded-xl p-3 flex gap-3 items-start">
                                    <i className="fa-solid fa-triangle-exclamation text-rose-500 mt-0.5" />
                                    <p className="text-[11px] text-rose-700 font-semibold leading-relaxed">
                                        Action triggers complete password regeneration. Old password strings will be purged immediately for security protocols.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                                    <button type="button" onClick={() => setShowRevealModal(false)} className="px-5 py-2.5 text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                                    <button type="submit" disabled={revealLoading} className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors">
                                        {revealLoading ? "Authenticating..." : "Regenerate & Reveal"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-5 pt-2">
                                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-left font-mono text-sm space-y-3 text-slate-700">
                                    <div>
                                        <span className="text-slate-400 font-sans font-bold text-[10px] uppercase tracking-wider block mb-1">Assigned Username:</span>
                                        <span className="font-bold text-slate-800">{revealedCreds.username}</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-200">
                                        <span className="text-slate-400 font-sans font-bold text-[10px] uppercase tracking-wider block mb-1">New Gen-Password:</span>
                                        <span className="text-emerald-600 font-bold text-base tracking-wide select-all">{revealedCreds.password}</span>
                                    </div>
                                </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(`Username: ${revealedCreds.username}\nPassword: ${revealedCreds.password}`);
                                            setRevealCopied(true);
                                            setTimeout(() => setRevealCopied(false), 2000);
                                        }}
                                        className="w-full py-3 font-bold rounded-xl text-xs uppercase tracking-wide bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <i className={revealCopied ? "fa-solid fa-check" : "fa-regular fa-copy"} />
                                        {revealCopied ? "Copied" : "Copy Identity Credentials"}
                                    </button>
                                <button
                                    type="button"
                                    onClick={() => setShowRevealModal(false)}
                                    className="w-full py-3 bg-[#0b2836] hover:bg-[#0f3345] text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-lg shadow-[#0b2836]/20 transition-all hover:-translate-y-0.5"
                                >
                                    Finish Processing
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 🔒 Success Credentials Reveal Modal Popup Window */}
            {createdCredentials && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl space-y-5 text-center relative overflow-hidden">
                        {/* Decorative background circle */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto text-2xl font-bold border-2 border-emerald-100 shadow-sm mb-4">
                                <i className="fa-solid fa-check" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">Profile Registered</h3>
                            <p className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed px-4">
                                Copy these credentials safely. The auto-generated security password is displayed below only once.
                            </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-left font-mono text-sm space-y-3 relative z-10">
                            <div>
                                <span className="text-slate-400 font-sans font-bold text-[10px] uppercase tracking-wider block mb-1">User Sign-in ID:</span>
                                <span className="font-bold text-slate-800">{createdCredentials.username}</span>
                            </div>
                            <div className="pt-3 border-t border-slate-200">
                                <span className="text-slate-400 font-sans font-bold text-[10px] uppercase tracking-wider block mb-1">Auto Generated Password:</span>
                                <span className="text-emerald-600 font-bold text-lg tracking-wider select-all">{createdCredentials.password}</span>
                            </div>
                        </div>

                        <div className="space-y-3 relative z-10 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const textToCopy = `User Sign-in ID: ${createdCredentials.username}\nAuto Generated Password: ${createdCredentials.password}`;
                                    navigator.clipboard.writeText(textToCopy);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className={`w-full py-3 font-bold rounded-xl text-xs uppercase tracking-wide transition-all border flex items-center justify-center gap-2 ${copied
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                    : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
                                    }`}
                            >
                                {copied ? (
                                    <>
                                        <i className="fa-solid fa-check" /> Copied to Clipboard
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-regular fa-copy" /> Copy Credentials
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setCreatedCredentials(null); loadInitialData(); }}
                                className="w-full py-3 bg-[#0b2836] hover:bg-[#0f3345] text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-lg shadow-[#0b2836]/20 transition-all hover:-translate-y-0.5"
                            >
                                Done & Close Workspace
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}