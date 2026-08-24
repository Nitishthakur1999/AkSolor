import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

export default function Attendance() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = (() => {
        const fromUserObj = user?.role || user?.Role || user?.userRole || user?.UserRole;
        if (fromUserObj) return String(fromUserObj).toUpperCase();
        try {
            const token = localStorage.getItem("token");
            if (!token) return "";
            const payload = JSON.parse(atob(token.split(".")[1]));
            const roleFromToken =
                payload.role ||
                payload.Role ||
                payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"] ||
                payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
            return String(roleFromToken || "").toUpperCase();
        } catch {
            return "";
        }
    })();

    // 🆕 DB-driven "CMD-equal" flag — roles list se resolve hota hai, hardcoded string list nahi
    const [rolesList, setRolesList] = useState([]);
    useEffect(() => {
        adminService.getRoles().then(res => {
            if (res.success || res.Success) setRolesList(res.data || res.Data || []);
        }).catch(err => console.error("Failed to load roles for access check:", err));
    }, []);

    const currentRoleData = rolesList.find(
        r => String(r.roleName ?? r.RoleName ?? "").toUpperCase() === userRole
    );
    const isCmdEqual = currentRoleData?.isCmdEqual ?? currentRoleData?.IsCmdEqual ?? false;

    // 🆕 isCmdEqual OR purani hardcoded list — dono me se ek true ho to full access
    const isCMD = userRole === "CMD" || isCmdEqual;
    const isAdminLevel = isCmdEqual || ["CMD", "ADMIN", "HR"].includes(userRole);
    const isManager = userRole === "MANAGER";
    const isTeamLevel = isAdminLevel || isManager;
    const loggedInEmpId = (() => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return 0;
            const payload = JSON.parse(atob(token.split(".")[1]));
            return Number(payload.EmployeeId || payload.EmpId || payload.emp_id) || 0;
        } catch {
            return 0;
        }
    })();

    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [regRequests, setRegRequests] = useState([]);
    const [summaries, setSummaries] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sundayHolidayData, setSundayHolidayData] = useState([]);
    const [sundayHolidayPeriod, setSundayHolidayPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const [sundayHolidayMeta, setSundayHolidayMeta] = useState(null);
    const [pdfDownloading, setPdfDownloading] = useState(false);
    const [activeTab, setActiveTab] = useState(isCMD ? "dashboard" : "logs");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [showMarkModal, setShowMarkModal] = useState(false);
    const [empSearchOpen, setEmpSearchOpen] = useState(false);
    const [empSearchText, setEmpSearchText] = useState("");
    const [dutyEmpSearchOpen, setDutyEmpSearchOpen] = useState(false);
    const [dutyEmpSearchText, setDutyEmpSearchText] = useState("");
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [showRegModal, setShowRegModal] = useState(false);
    const [showDutyModal, setShowDutyModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [dutyLocationStatus, setDutyLocationStatus] = useState("idle");
    const [dutyCapturedLocation, setDutyCapturedLocation] = useState({ latitude: null, longitude: null, address: null });

    const getTodayDateStr = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };
    const getCurrentTimeStr = () => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    };

    const LATE_CUTOFF = "09:05";

    const isSunday = (dateStr) => {
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) && d.getDay() === 0;
    };

    const [markForm, setMarkForm] = useState({
        empId: "", attDate: getTodayDateStr(), checkIn: "", checkOut: "", status: "Present", remarks: ""
    });
    const [summaryForm, setSummaryForm] = useState<{ empId: string; month: string | number; year: string | number }>({
        empId: "", month: new Date().getMonth() + 1, year: new Date().getFullYear()
    });
    const [regForm, setRegForm] = useState({
        empId: "", attDate: "", requestedCheckIn: "", requestedCheckOut: "", reason: ""
    });
    const [dutyForm, setDutyForm] = useState<{ empId: string; attDate: string; status: string; location: string; countsAsDuty: boolean; remarks: string }>({
        empId: "", attDate: getTodayDateStr(), status: "Present", location: "", countsAsDuty: true, remarks: ""
    });

    const selectableEmployees = isAdminLevel
        ? employees
        : isManager
            ? employees.filter((emp) => {
                const mgrId = Number(
                    emp.managerId ?? emp.ManagerId ?? emp.reportingManagerId ?? emp.ReportingManagerId ?? emp.reportsTo ?? emp.ReportsTo
                );
                return mgrId === loggedInEmpId || emp.empId === loggedInEmpId;
            })
            : employees.filter((emp) => emp.empId === loggedInEmpId);

    useEffect(() => {
        loadAttendanceData();
    }, [activeTab]);

    useEffect(() => {
        setSearchTerm("");
        setCurrentPage(1);
        if (activeTab !== "logs") {
            setStatusFilter("");
            setDateFilter("");
        }
    }, [activeTab]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        adminService.getEmployees().then(res => {
            if (res.Success || res.success) setEmployees(res.Data || res.data || []);
        });
    }, []);

    useEffect(() => {
        if (!isAdminLevel && activeTab === "summaries") {
            setActiveTab("logs");
        }
        if (!isTeamLevel && activeTab === "sundayWorking") {
            setActiveTab("logs");
        }
    }, [activeTab, isAdminLevel, isTeamLevel]);

    const loadAttendanceData = async () => {
        if (!isAdminLevel && activeTab === "summaries") {
            setLoading(false);
            return;
        }
        if (!isTeamLevel && activeTab === "sundayWorking") {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            if (activeTab === "dashboard") {
                const res = await adminService.getDashboardStats();
                if (res.Success || res.success) setDashboardStats(res.Data || res.data || {});
            } else if (activeTab === "logs") {
                const res = await adminService.getAttendanceAll();
                if (res.Success || res.success) setAttendanceLogs(res.Data || res.data || []);
            } else if (activeTab === "sundayWorking") {
                const res = await adminService.getSundayHolidayStatus(
                    sundayHolidayPeriod.month,
                    sundayHolidayPeriod.year
                );
                if (res.Success || res.success) {
                    const data = res.Data || res.data || {};
                    const rows = data.rows || data.Rows || [];
                    setSundayHolidayData(Array.isArray(rows) ? rows : []);
                    setSundayHolidayMeta(data);
                }
            } else if (activeTab === "requests") {
                const res = await adminService.getRegRequests();
                if (res.Success || res.success) setRegRequests(res.Data || res.data || []);
            } else if (activeTab === "summaries") {
                const res = await adminService.getSummary({ year: new Date().getFullYear() });
                if (res.Success || res.success) setSummaries(res.Data || res.data || []);
            }
        } catch (err) {
            console.error("Attendance data load error:", err);
        } finally {
            setLoading(false);
        }
    };

    const determinePunchMode = async (empId) => {
        if (!empId) {
            setPunchMode(null);
            setTodaysRecord(null);
            return;
        }
        setPunchMode("checking");
        try {
            const res = await adminService.getAttendanceAll();
            const list = res.Data || res.data || [];
            const today = getTodayDateStr();
            const rec = list.find(
                (r) => Number(r.empId) === Number(empId) && (r.attDate || "").slice(0, 10) === today
            );
            if (!rec) {
                setTodaysRecord(null);
                setPunchMode("in");
            } else if (rec.checkIn && rec.checkOut) {
                setTodaysRecord(rec);
                setPunchMode("done");
            } else if (rec.checkIn && !rec.checkOut) {
                setTodaysRecord(rec);
                setPunchMode("out");
            } else {
                setTodaysRecord(rec);
                setPunchMode("in");
            }
        } catch (err) {
            setTodaysRecord(null);
            setPunchMode("in");
        }
    };

    const openMarkModal = () => {
        if (!isAdminLevel && loggedInEmpId <= 0) {
            alert("Your account is not linked to an employee record, so you can't mark attendance. Please contact HR/Admin.");
            return;
        }
        setMarkForm({
            empId: isAdminLevel ? "" : loggedInEmpId.toString(),
            attDate: getTodayDateStr(),
            checkIn: "",
            checkOut: "",
            status: "Present",
            remarks: ""
        });
        setLocationStatus("idle");
        setCapturedLocation({ latitude: null, longitude: null, address: null });
        setTodaysRecord(null);
        setEmpSearchOpen(false);
        setEmpSearchText("");

        if (!isAdminLevel) {
            determinePunchMode(loggedInEmpId);
        } else {
            setPunchMode(null);
        }
        setShowMarkModal(true);
    };

    const handleMarkEmployeeChange = (empId) => {
        setMarkForm(prev => ({ ...prev, empId }));
        determinePunchMode(empId);
    };

    const openSummaryModal = () => {
        setSummaryForm(prev => ({
            ...prev,
            empId: isAdminLevel ? "" : loggedInEmpId.toString()
        }));
        setShowSummaryModal(true);
    };

    const openRegModal = () => {
        if (!isAdminLevel && loggedInEmpId <= 0) {
            alert("Your account is not linked to an employee record, so you can't submit a request. Please contact HR/Admin.");
            return;
        }
        setRegForm(prev => ({
            ...prev,
            empId: isAdminLevel ? "" : loggedInEmpId.toString()
        }));
        setShowRegModal(true);
    };

    const openDutyModal = () => {
        setDutyForm({
            empId: "",
            attDate: getTodayDateStr(),
            status: "Present",
            location: "",
            countsAsDuty: true,
            remarks: ""
        });
        setDutyLocationStatus("idle");
        setDutyCapturedLocation({ latitude: null, longitude: null, address: null });
        setDutyEmpSearchOpen(false);
        setDutyEmpSearchText("");
        setShowDutyModal(true);
    };

    const reverseGeocode = async (latitude, longitude) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
            );
            const data = await res.json();
            return data?.display_name || null;
        } catch (err) {
            console.warn("Reverse geocode failed:", err);
            return null;
        }
    };

    const handleGetDutyLocation = async () => {
        setDutyLocationStatus("fetching");
        if (!navigator.geolocation) {
            setDutyLocationStatus("denied");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const address = await reverseGeocode(latitude, longitude);
                setDutyCapturedLocation({ latitude, longitude, address });
                setDutyLocationStatus("captured");

                setDutyForm(prev => ({ ...prev, location: address || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
            },
            (err) => {
                console.warn("Duty location access denied or failed:", err);
                setDutyLocationStatus("denied");
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const getCurrentLocation = (): Promise<{ latitude: number | null; longitude: number | null; address: string | null }> => {
        setLocationStatus("fetching");
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                setLocationStatus("denied");
                resolve({ latitude: null, longitude: null, address: null });
                return;
            }
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const address = await reverseGeocode(latitude, longitude);
                    const loc = { latitude, longitude, address };
                    setCapturedLocation(loc);
                    setLocationStatus("captured");
                    resolve(loc);
                },
                (err) => {
                    console.warn("Location access denied or failed:", err);
                    setLocationStatus("denied");
                    resolve({ latitude: null, longitude: null, address: null });
                },
                { enableHighAccuracy: true, timeout: 8000 }
            );
        });
    };

    const [locationStatus, setLocationStatus] = useState("idle");
    const [capturedLocation, setCapturedLocation] = useState({ latitude: null, longitude: null, address: null });

    const [punchMode, setPunchMode] = useState(null);
    const [todaysRecord, setTodaysRecord] = useState(null);

    useEffect(() => {
        if (punchMode === "out" && todaysRecord) {
            setMarkForm(prev => ({
                ...prev,
                checkIn: (todaysRecord.checkIn || "").slice(0, 5),
                status: todaysRecord.status || prev.status
            }));
        }
    }, [punchMode, todaysRecord]);

    const handlePunchIn = () => {
        const time = getCurrentTimeStr();
        setMarkForm(prev => ({ ...prev, checkIn: time, status: "Present" }));
        if (locationStatus === "idle" || locationStatus === "denied") {
            getCurrentLocation();
        }
    };

    const handlePunchOut = () => {
        const time = getCurrentTimeStr();
        setMarkForm(prev => ({ ...prev, checkOut: time }));
        if (locationStatus === "idle" || locationStatus === "denied") {
            getCurrentLocation();
        }
    };

    const handleMarkAttendance = async (e) => {
        e.preventDefault();

        if (punchMode === "done") {
            alert("Aaj ke liye attendance already mark ho chuka hai (Punch In + Punch Out dono).");
            return;
        }

        const noPunchStatus = ["Absent", "Leave", "Holiday"].includes(markForm.status);
        if (punchMode === "in" && !noPunchStatus && !markForm.checkIn) {
            alert("Please tap Punch In before submitting.");
            return;
        }
        if (punchMode === "out" && !markForm.checkOut) {
            alert("Please tap Punch Out before submitting.");
            return;
        }
        if (markForm.checkIn && markForm.checkOut && markForm.checkOut < markForm.checkIn) {
            alert("Punch-out time can't be before punch-in time.");
            return;
        }

        setActionLoading(true);
        try {
            const { latitude, longitude, address } =
                locationStatus === "captured" ? capturedLocation : await getCurrentLocation();

            const checkInForPayload = punchMode === "out"
                ? (todaysRecord?.checkIn || (markForm.checkIn ? markForm.checkIn + ":00" : null))
                : (markForm.checkIn ? markForm.checkIn + ":00" : null);

            const payload = {
                empId: parseInt(markForm.empId, 10),
                attDate: markForm.attDate ? `${markForm.attDate}T00:00:00` : null,
                checkIn: checkInForPayload,
                checkOut: markForm.checkOut ? markForm.checkOut + ":00" : null,
                status: markForm.status,
                source: "Manual",
                remarks: "",
                createdBy: user?.userId ?? user?.UserId ?? 1,
                latitude,
                longitude,
                locationAddress: address,
            };

            const res = await adminService.markAttendance(payload);
            if (res.Success || res.success) {
                const isLatePunchIn = punchMode === "in" && !noPunchStatus && markForm.checkIn > LATE_CUTOFF;
                if (isLatePunchIn) {
                    try {
                        await adminService.createRegRequest({
                            empId: parseInt(markForm.empId, 10),
                            attDate: `${markForm.attDate}T00:00:00`,
                            requestedCheckIn: markForm.checkIn + ":00",
                            requestedCheckOut: null,
                            reason: `Late arrival — punched in at ${markForm.checkIn} (after ${LATE_CUTOFF} cutoff)`,
                        });
                    } catch (regErr) {
                        console.error("Auto regularization request failed:", regErr);
                    }
                }

                setShowMarkModal(false);
                setMarkForm({ empId: "", attDate: getTodayDateStr(), checkIn: "", checkOut: "", status: "Present", remarks: "" });
                setLocationStatus("idle");
                setCapturedLocation({ latitude: null, longitude: null, address: null });
                setPunchMode(null);
                setTodaysRecord(null);
                loadAttendanceData();

            } else {
                alert(res.Message || "Failed to mark attendance.");
            }
        } catch (err) {
            console.error("Mark attendance error:", err);
            alert(err?.message || "Something went wrong while marking attendance.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRegAction = async (requestId, statusAction) => {
        if (!isAdminLevel) {
            alert("You don't have permission to approve or reject regularization requests.");
            return;
        }
        try {
            const approvedBy = user?.userId ?? user?.UserId ?? 1;
            const res = await adminService.updateRegStatus(requestId, statusAction, approvedBy);
            if (res.Success || res.success) {
                setRegRequests(prev =>
                    prev.map(req => req.requestId === requestId ? { ...req, status: statusAction } : req)
                );
            } else {
                alert(res.Message || "Failed to update request.");
            }
        } catch (err) {
            console.error("Reg action error:", err);
            alert(err?.message || "Something went wrong while updating the request.");
        }
    };

    const handleLateApprovalAction = async (requestId, statusAction) => {
        if (!isAdminLevel) {
            alert("You don't have permission to approve or reject attendance.");
            return;
        }
        try {
            const approvedBy = user?.userId ?? user?.UserId ?? 1;
            const res = await adminService.updateRegStatus(requestId, statusAction, approvedBy);
            if (res.Success || res.success) {
                loadAttendanceData();
            } else {
                alert(res.Message || "Failed to update approval.");
            }
        } catch (err) {
            console.error("Late approval action error:", err);
            alert(err?.message || "Something went wrong while updating approval.");
        }
    };

    const handleCreateRegRequest = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                empId: parseInt(regForm.empId, 10),
                attDate: regForm.attDate ? `${regForm.attDate}T00:00:00` : null,
                requestedCheckIn: regForm.requestedCheckIn ? regForm.requestedCheckIn + ":00" : null,
                requestedCheckOut: regForm.requestedCheckOut ? regForm.requestedCheckOut + ":00" : null,
                reason: regForm.reason,
            };
            const res = await adminService.createRegRequest(payload);
            if (res.Success || res.success) {
                setShowRegModal(false);
                setRegForm({ empId: "", attDate: "", requestedCheckIn: "", requestedCheckOut: "", reason: "" });
                setActiveTab("requests");
                loadAttendanceData();
            } else {
                alert(res.Message || "Failed to submit regularization request.");
            }
        } catch (err) {
            console.error("Create reg request error:", err);
            alert(err?.message || "Something went wrong while submitting the request.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleGenerateSummary = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                empId: parseInt(summaryForm.empId, 10),
                month: parseInt(String(summaryForm.month), 10),
                year: parseInt(String(summaryForm.year), 10)
            };
            const res = await adminService.generateSummary(payload);
            if (res.Success || res.success) {
                setShowSummaryModal(false);
                setActiveTab("summaries");
            } else {
                alert(res.Message || "Failed to generate summary.");
            }
        } catch (err) {
            console.error("Generate summary error:", err);
            alert(err?.message || "Something went wrong while generating the summary.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkSundayDuty = async (e) => {
        e.preventDefault();
        if (!dutyForm.empId) {
            alert("Please select an employee.");
            return;
        }
        setActionLoading(true);
        try {
            const payload = {
                empId: parseInt(dutyForm.empId, 10),
                dutyDate: dutyForm.attDate,
                status: dutyForm.status,
                location: dutyForm.location || null,
                countsAsDuty: dutyForm.countsAsDuty,
                remarks: dutyForm.remarks,
            };
            const res = await adminService.markSundayDuty(payload);
            if (res.Success || res.success) {
                setShowDutyModal(false);
                setDutyForm({ empId: "", attDate: getTodayDateStr(), status: "Present", location: "", countsAsDuty: true, remarks: "" });
                loadAttendanceData();
            } else {
                alert(res.Message || "Failed to save Sunday/Holiday duty status.");
            }
        } catch (err) {
            console.error("Mark Sunday duty error:", err);
            alert(err?.message || "Something went wrong while saving duty status.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadSundayHolidayPdf = async () => {
        setPdfDownloading(true);
        try {
            await adminService.downloadSundayHolidayStatusPdf(
                sundayHolidayPeriod.month,
                sundayHolidayPeriod.year
            );
        } catch (err) {
            console.error("Download Sunday/Holiday PDF error:", err);
            alert(err?.message || "Failed to download PDF.");
        } finally {
            setPdfDownloading(false);
        }
    };

    const tabsList = [
        ...(isCMD ? [{ key: "dashboard", label: "Executive Dashboard" }] : []),
        { key: "logs", label: "Attendance Logs" },
        { key: "requests", label: "Regularization Requests" },
        ...(isTeamLevel ? [{ key: "sundayWorking", label: "Sunday Working" }] : []),
        ...(isAdminLevel ? [{ key: "summaries", label: "Monthly Summary" }] : [])
    ];

    const filterBySearch = (list, fields) => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return list;
        return list.filter((row) =>
            fields.some((f) => (row[f] ?? "").toString().toLowerCase().includes(q))
        );
    };

    const paginate = (list) => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return list.slice(start, start + ITEMS_PER_PAGE);
    };

    const scopeToEmployee = (list) => {
        if (isAdminLevel) return list;
        if (isManager) {
            const teamIds = new Set(selectableEmployees.map((e) => Number(e.empId)));
            return list.filter((row) => teamIds.has(Number(row.empId)));
        }
        return list.filter((row) => Number(row.empId) === loggedInEmpId);
    };

    const filteredLogsBase = attendanceLogs.filter((log) => {
        const statusMatch = !statusFilter || log.status === statusFilter;
        const dateMatch = !dateFilter || (log.attDate || "").slice(0, 10) === dateFilter;
        return statusMatch && dateMatch;
    });
    const filteredLogs = filterBySearch(scopeToEmployee(filteredLogsBase), ["fullName", "status", "source"]);
    const filteredRequests = filterBySearch(scopeToEmployee(regRequests), ["fullName", "reason", "status"]);
    const filteredSummaries = filterBySearch(scopeToEmployee(summaries), ["fullName"]);
    const sundayDateColumns = (
        sundayHolidayMeta?.sundayDates ||
        sundayHolidayMeta?.SundayDates ||
        []
    ).map(d => new Date(d));

    const filteredSundayHolidayData = filterBySearch(
        scopeToEmployee((sundayHolidayData || []).map(r => ({
            ...r,
            fullName: r.employeeName || r.EmployeeName || `EMP-${r.empId || r.EmpId}`,
            empId: r.empId ?? r.EmpId,
        }))),
        ["fullName"]
    );
    const pagedLogs = paginate(filteredLogs);
    const pagedRequests = paginate(filteredRequests);
    const pagedSummaries = paginate(filteredSummaries);
    const pagedSundayHoliday = paginate(filteredSundayHolidayData);

    const activeListMeta = {
        logs: { total: filteredLogs.length, placeholder: "Search by employee, status, or source..." },
        requests: { total: filteredRequests.length, placeholder: "Search by employee, reason, or status..." },
        summaries: { total: filteredSummaries.length, placeholder: "Search by employee name..." },
        sundayWorking: { total: filteredSundayHolidayData.length, placeholder: "Search by employee name..." },
    }[activeTab];

    const totalPages = activeListMeta ? Math.max(1, Math.ceil(activeListMeta.total / ITEMS_PER_PAGE)) : 1;

    const PaginationBar = () => {
        if (!activeListMeta || activeListMeta.total === 0) return null;
        const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
        const end = Math.min(currentPage * ITEMS_PER_PAGE, activeListMeta.total);
        return (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4">
                <div>
                    Showing <span className="font-bold text-slate-800">{start}</span> to{" "}
                    <span className="font-bold text-slate-800">{end}</span> of{" "}
                    <span className="font-bold text-slate-800">{activeListMeta.total}</span> entries
                </div>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                    >
                        <i className="fa-solid fa-chevron-left text-[10px]" /> Prev
                    </button>
                    <div className="hidden sm:flex items-center px-3 font-bold text-slate-700">
                        Page {currentPage} of {totalPages}
                    </div>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                    >
                        Next <i className="fa-solid fa-chevron-right text-[10px]" />
                    </button>
                </div>
            </div>
        );
    };

    const SearchBar = () => {
        if (!activeListMeta) return null;
        return (
            <div className="bg-white px-6 pt-5 pb-2">
                <div className="relative group max-w-sm">
                    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={activeListMeta.placeholder}
                        className="w-full pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-slate-50 focus:bg-white transition-all shadow-sm"
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-5 pb-10 font-sans">

            {/* ── Compact Header Section ── */}
            <div className="bg-[#0b2532] rounded-2xl px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                        <i className="fa-solid fa-calendar-check text-lg text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Attendance Management</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Track attendance, manage regularization requests, and generate monthly summaries.
                        </p>
                    </div>
                </div>
                {!isCMD && (
                    <div className="flex flex-wrap gap-2">
                        {activeTab === "sundayWorking" && isAdminLevel ? (
                            <>
                                <button
                                    onClick={openDutyModal}
                                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-plus" /> Mark Sunday/Holiday Duty
                                </button>
                                <button
                                    onClick={handleDownloadSundayHolidayPdf}
                                    disabled={pdfDownloading}
                                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-white border-transparent hover:border-slate-200 transition-all disabled:opacity-60 flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-file-pdf" /> {pdfDownloading ? "Downloading..." : "Download PDF"}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={openMarkModal}
                                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-2"
                                >
                                    <i className="fa-regular fa-clock" /> Mark Attendance
                                </button>
                                <button
                                    onClick={openRegModal}
                                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center gap-2"
                                >
                                    <i className="fa-solid fa-code-pull-request" /> Request Regularization
                                </button>
                                {isAdminLevel && (
                                    <button
                                        onClick={openSummaryModal}
                                        className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center gap-2"
                                    >
                                        <i className="fa-solid fa-chart-pie" /> Generate Summary
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Tabs Navigation ── */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-white rounded-t-2xl px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {tabsList.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-4 border-b-2 transition-colors whitespace-nowrap focus:outline-none ${activeTab === tab.key
                            ? "border-amber-500 text-amber-600"
                            : "border-transparent hover:text-slate-700"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Main Container (Table Area) ── */}
            <div className="bg-white border border-slate-200 border-t-0 rounded-b-2xl overflow-hidden shadow-sm min-h-[300px] flex flex-col">

                {/* Period Picker for Sunday/Holiday */}
                {!loading && activeTab === "sundayWorking" && (
                    <div className="px-6 pt-5 flex flex-wrap items-center gap-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Period Selector:</label>
                        <div className="flex items-center gap-2">
                            <select
                                value={sundayHolidayPeriod.month}
                                onChange={(e) => setSundayHolidayPeriod(prev => ({ ...prev, month: Number(e.target.value) }))}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}</option>
                                ))}
                            </select>
                            <select
                                value={sundayHolidayPeriod.year}
                                onChange={(e) => setSundayHolidayPeriod(prev => ({ ...prev, year: Number(e.target.value) }))}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <button
                                onClick={loadAttendanceData}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-all"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                )}

                {/* Search & Loading States */}
                {!loading && <SearchBar />}

                {loading ? (
                    <div className="p-24 flex flex-col items-center justify-center gap-4">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Syncing attendance data...</div>
                    </div>
                ) : activeTab === "dashboard" && isCMD ? (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-5">Today's Executive Overview</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab("logs");
                                    setStatusFilter("");
                                    setDateFilter(new Date().toISOString().split("T")[0]);
                                }}
                                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow text-left cursor-pointer"
                            >
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Employees</p>
                                <p className="text-3xl font-black text-slate-800">{dashboardStats?.totalEmployees || 0}</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab("logs");
                                    setStatusFilter("Present");
                                    setDateFilter(new Date().toISOString().split("T")[0]);
                                }}
                                className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 shadow-sm hover:shadow-md hover:bg-emerald-50 transition-all text-left cursor-pointer"
                            >
                                <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Present Today</p>
                                <p className="text-3xl font-black text-emerald-700">{dashboardStats?.presentToday || 0}</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab("logs");
                                    setStatusFilter("Absent");
                                    setDateFilter(new Date().toISOString().split("T")[0]);
                                }}
                                className="p-5 rounded-2xl border border-rose-100 bg-rose-50/50 shadow-sm hover:shadow-md hover:bg-rose-50 transition-all text-left cursor-pointer"
                            >
                                <p className="text-[11px] text-rose-600 font-bold uppercase tracking-wider mb-1">Absent Today</p>
                                <p className="text-3xl font-black text-rose-700">{dashboardStats?.absentToday || 0}</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab("logs");
                                    setStatusFilter("Late");
                                    setDateFilter(new Date().toISOString().split("T")[0]);
                                }}
                                className="p-5 rounded-2xl border border-amber-100 bg-amber-50/50 shadow-sm hover:shadow-md hover:bg-amber-50 transition-all text-left cursor-pointer"
                            >
                                <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider mb-1">Late Arrivals</p>
                                <p className="text-3xl font-black text-amber-700">{dashboardStats?.lateToday || 0}</p>
                            </button>
                        </div>
                        <div className="p-10 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                            <i className="fa-solid fa-chart-line text-2xl mb-2 text-slate-300"></i>
                            <p>More executive charts and operational trends will appear here...</p>
                        </div>
                    </div>
                ) : activeTab === "logs" ? (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Check In</th>
                                    <th className="px-6 py-4">Check Out</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Approval</th>
                                    <th className="px-6 py-4">Source</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-16 text-center text-slate-400 font-medium">
                                            {searchTerm ? "No matching attendance records found" : "No attendance records found"}
                                        </td>
                                    </tr>
                                ) : pagedLogs.map((log) => (
                                    <tr key={log.attId} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {log.fullName || `EMP-${log.empId}`}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-600">{new Date(log.attDate).toLocaleDateString("en-IN")}</span>
                                                {isSunday(log.attDate) && log.checkIn && (
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-violet-50 text-violet-600 border border-violet-200">
                                                        Sunday Duty
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-600">{log.checkIn || "--:--"}</td>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-600">{log.checkOut || "--:--"}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-500 max-w-[200px] truncate" title={log.locationAddress || ""}>
                                            {log.locationAddress ? log.locationAddress : log.latitude && log.longitude ? `${Number(log.latitude).toFixed(5)}, ${Number(log.longitude).toFixed(5)}` : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${log.status === "Present" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-rose-50 text-rose-700 border-rose-200/50"}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${log.status === "Present" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.approvalStatus === "Pending Approval" ? (
                                                isAdminLevel ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleLateApprovalAction(log.approvalRequestId, "Approved")}
                                                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/50 text-[11px] font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleLateApprovalAction(log.approvalRequestId, "Rejected")}
                                                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200/50 text-[11px] font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-100 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200/50">
                                                        Pending
                                                    </span>
                                                )
                                            ) : log.approvalStatus === "Approved" ? (
                                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                                                    Approved
                                                </span>
                                            ) : log.approvalStatus === "Rejected" ? (
                                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-200/50">
                                                    Rejected
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500">{log.source}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : activeTab === "requests" ? (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Requested Date</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-medium">
                                            {searchTerm ? "No matching requests found" : "No regularization requests found"}
                                        </td>
                                    </tr>
                                ) : pagedRequests.map((req) => (
                                    <tr key={req.requestId} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{req.fullName || `EMP-${req.empId}`}</td>
                                        <td className="px-6 py-4 font-medium text-slate-600">{new Date(req.requestDate).toLocaleDateString("en-IN")}</td>
                                        <td className="px-6 py-4 text-[13px] text-slate-500 max-w-xs truncate" title={req.reason}>{req.reason}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${req.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : req.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200/50" : "bg-rose-50 text-rose-700 border-rose-200/50"}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {req.status === "Pending" && isAdminLevel ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleRegAction(req.requestId, "Approved")} className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/50 text-[11px] font-bold uppercase tracking-wider text-emerald-700 hover:bg-emerald-100 transition-colors">Approve</button>
                                                    <button onClick={() => handleRegAction(req.requestId, "Rejected")} className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200/50 text-[11px] font-bold uppercase tracking-wider text-rose-700 hover:bg-rose-100 transition-colors">Reject</button>
                                                </div>
                                            ) : req.status === "Pending" ? (
                                                <span className="text-[11px] text-amber-500 font-semibold italic">Awaiting HR Review</span>
                                            ) : (
                                                <span className="text-[11px] text-slate-400 font-semibold italic">Resolved</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : activeTab === "sundayWorking" && isTeamLevel ? (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                    <th className="px-4 py-4 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Employee</th>
                                    {sundayDateColumns.map((d, i) => (
                                        <th key={i} className="px-3 py-4 text-center whitespace-nowrap border-l border-slate-200/50">
                                            {d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                        </th>
                                    ))}
                                    <th className="px-4 py-4 text-center border-l border-slate-200/50">Duty</th>
                                    <th className="px-4 py-4 text-center border-l border-slate-200/50">Comp-Off</th>
                                    <th className="px-4 py-4 text-center border-l border-slate-200/50">Prev Bal</th>
                                    <th className="px-4 py-4 text-center border-l border-slate-200/50">Final Dues</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredSundayHolidayData.length === 0 ? (
                                    <tr>
                                        <td colSpan={sundayDateColumns.length + 5} className="px-6 py-16 text-center text-slate-400 font-medium">
                                            {searchTerm ? "No matching employees found" : "No Sunday/Holiday data found for this period"}
                                        </td>
                                    </tr>
                                ) : pagedSundayHoliday.map((row, idx) => {
                                    const cells = row.cells || row.Cells || [];
                                    const empName = row.employeeName || row.EmployeeName || `EMP-${row.empId ?? row.EmpId}`;
                                    return (
                                        <tr key={row.empId ?? row.EmpId ?? idx} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3 font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                                                {empName}
                                            </td>
                                            {sundayDateColumns.map((d, i) => {
                                                const cell = cells.find(c => new Date(c.date || c.Date).toDateString() === d.toDateString());
                                                const status = cell?.status || cell?.Status || "OFF";
                                                const isOnDuty = status.startsWith("ON-DUTY") || status === "Present";
                                                const isAbsent = status === "Absent";
                                                const isHalfDay = status === "Half-Day";
                                                return (
                                                    <td key={i} className="px-3 py-3 text-center border-l border-slate-100">
                                                        <span
                                                            title={status}
                                                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider whitespace-nowrap border ${isOnDuty ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                                                : isAbsent ? "bg-rose-50 text-rose-700 border-rose-200/50"
                                                                    : isHalfDay ? "bg-amber-50 text-amber-700 border-amber-200/50"
                                                                        : "bg-slate-50 text-slate-400 border-slate-200"
                                                                }`}
                                                        >
                                                            {status === "N/A" ? "N/A" : status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 border-l border-slate-100">{row.monthDutyCount ?? row.MonthDutyCount ?? 0}</td>
                                            <td className="px-4 py-3 text-center font-mono font-bold text-amber-600 border-l border-slate-100">{row.monthCompOff ?? row.MonthCompOff ?? 0}</td>
                                            <td className="px-4 py-3 text-center font-mono font-semibold text-slate-500 border-l border-slate-100">{row.previousBalance ?? row.PreviousBalance ?? 0}</td>
                                            <td className="px-4 py-3 text-center font-mono font-black text-[#0b2836] border-l border-slate-100 bg-slate-50/50">{row.finalDues ?? row.FinalDues ?? 0}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : activeTab === "summaries" && isAdminLevel ? (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4 text-center">Period</th>
                                    <th className="px-6 py-4 text-center">Working Days</th>
                                    <th className="px-6 py-4 text-center text-emerald-600">Present</th>
                                    <th className="px-6 py-4 text-center text-rose-600">Absent</th>
                                    <th className="px-6 py-4 text-center text-amber-600">Late Marks</th>
                                    <th className="px-6 py-4 text-center">Overtime</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredSummaries.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium">
                                            {searchTerm ? "No matching summaries found" : "No summaries found. Generate one using the button above."}
                                        </td>
                                    </tr>
                                ) : pagedSummaries.map((sum) => (
                                    <tr key={sum.summaryId} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{sum.fullName || `EMP-${sum.empId}`}</td>
                                        <td className="px-6 py-4 text-center font-semibold text-slate-500 bg-slate-50/30">{sum.month}/{sum.year}</td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">{sum.totalWorkingDays}</td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-emerald-600 bg-emerald-50/30">{sum.presentDays}</td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-rose-600 bg-rose-50/30">{sum.absentDays}</td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-amber-600 bg-amber-50/30">{sum.lateMarks}</td>
                                        <td className="px-6 py-4 text-center font-mono font-semibold text-slate-600">{sum.overtimeHours} hrs</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : (
                    <div className="p-16 text-center text-slate-400 font-semibold flex flex-col items-center gap-3">
                        <i className="fa-solid fa-lock text-3xl text-slate-300"></i>
                        You don't have access to this section.
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {/* Mark Attendance */}
            {showMarkModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-[24px] p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold text-slate-900">Mark Attendance</h3>
                            <button onClick={() => setShowMarkModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Employee *</label>
                            {isAdminLevel ? (
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required={!markForm.empId}
                                        value={empSearchOpen ? empSearchText : (() => {
                                            const sel = selectableEmployees.find((emp) => String(emp.empId) === String(markForm.empId));
                                            return sel ? `${sel.firstName} ${sel.lastName} (${sel.empCode})` : "";
                                        })()}
                                        onFocus={() => { setEmpSearchOpen(true); setEmpSearchText(""); }}
                                        onChange={(e) => setEmpSearchText(e.target.value)}
                                        onBlur={() => setTimeout(() => setEmpSearchOpen(false), 200)}
                                        placeholder="-- Search Employee --"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                    />
                                    {empSearchOpen && (
                                        <div className="absolute z-50 mt-2 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl">
                                            {(() => {
                                                const q = empSearchText.trim().toLowerCase();
                                                const filtered = selectableEmployees.filter((emp) => `${emp.firstName} ${emp.lastName} ${emp.empCode}`.toLowerCase().includes(q));
                                                if (filtered.length === 0) return <div className="px-4 py-3 text-sm text-slate-400 font-medium italic">No employees found</div>;
                                                return filtered.map((emp) => (
                                                    <div
                                                        key={emp.empId}
                                                        onMouseDown={() => {
                                                            handleMarkEmployeeChange(emp.empId.toString());
                                                            setEmpSearchText("");
                                                            setEmpSearchOpen(false);
                                                        }}
                                                        className="px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                                    >
                                                        {emp.firstName} {emp.lastName} <span className="text-slate-400 text-xs ml-1">({emp.empCode})</span>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    disabled
                                    value={employees.find((emp) => emp.empId === loggedInEmpId) ? (() => {
                                        const self = employees.find((emp) => emp.empId === loggedInEmpId);
                                        return `${self.firstName} ${self.lastName} (${self.empCode})`;
                                    })() : "You"}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold bg-slate-50 text-slate-500 cursor-not-allowed"
                                />
                            )}
                        </div>

                        {isAdminLevel && punchMode === null ? (
                            <div className="py-8 text-center text-sm font-medium text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                Select an employee to continue
                            </div>
                        ) : punchMode === "checking" ? (
                            <div className="py-8 flex flex-col items-center gap-3 text-sm font-bold text-amber-600 animate-pulse border-2 border-dashed border-amber-100 rounded-xl bg-amber-50/30">
                                <i className="fa-solid fa-circle-notch animate-spin text-2xl" /> Checking today's status...
                            </div>
                        ) : punchMode === "done" ? (
                            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2 shadow-sm">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-3">
                                    <i className="fa-solid fa-check text-2xl text-emerald-500" />
                                </div>
                                <p className="font-bold text-emerald-800 text-base">Attendance Completed</p>
                                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                                    In: {(todaysRecord?.checkIn || "").slice(0, 5) || "--:--"} • Out: {(todaysRecord?.checkOut || "").slice(0, 5) || "--:--"}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleMarkAttendance} className="space-y-5">
                                {isSunday(markForm.attDate) && (
                                    <div className="px-4 py-3 rounded-xl bg-violet-50 border border-violet-200 flex gap-3 items-start shadow-sm">
                                        <i className="fa-solid fa-calendar-day text-violet-500 mt-0.5" />
                                        <p className="text-[11px] text-violet-700 font-bold leading-relaxed">
                                            Today is Sunday. This punch will be logged under "Sunday Working" for HR review.
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Date</label>
                                    <input
                                        type="date"
                                        disabled
                                        value={markForm.attDate}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold bg-slate-50 text-slate-500 cursor-not-allowed"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 text-center">Punch In</label>
                                        <button
                                            type="button"
                                            onClick={handlePunchIn}
                                            disabled={punchMode !== "in" || !!markForm.checkIn}
                                            className={`w-full py-3.5 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${markForm.checkIn
                                                ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20"
                                                : "bg-white border-slate-200 hover:border-amber-400 hover:text-amber-600 text-slate-700"}`}
                                        >
                                            {markForm.checkIn ? (
                                                <span className="flex items-center justify-center gap-2"><i className="fa-solid fa-check" /> {markForm.checkIn}</span>
                                            ) : "Punch In"}
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 text-center">Punch Out</label>
                                        <button
                                            type="button"
                                            onClick={handlePunchOut}
                                            disabled={punchMode !== "out" || !!markForm.checkOut}
                                            className={`w-full py-3.5 rounded-xl border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${markForm.checkOut
                                                ? "bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/20"
                                                : "bg-white border-slate-200 hover:border-amber-400 hover:text-amber-600 text-slate-700"}`}
                                        >
                                            {markForm.checkOut ? (
                                                <span className="flex items-center justify-center gap-2"><i className="fa-solid fa-check" /> {markForm.checkOut}</span>
                                            ) : "Punch Out"}
                                        </button>
                                    </div>
                                </div>
                                {punchMode === "in" && (
                                    <p className="text-[10px] text-slate-400 font-semibold text-center italic mt-1">Note: Punch In first, then return later to Punch Out.</p>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Status</label>
                                        <select
                                            value={markForm.status}
                                            onChange={e => setMarkForm({ ...markForm, status: e.target.value })}
                                            disabled={punchMode === "out"}
                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer shadow-sm"
                                        >
                                            <option>Present</option><option>Absent</option><option>Half-Day</option><option>Holiday</option><option>Leave</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">GPS Location</label>
                                        <div className="w-full h-[46px] px-3 rounded-xl border-2 border-slate-100 text-xs font-semibold bg-slate-50 text-slate-500 flex items-center justify-center text-center overflow-hidden">
                                            {locationStatus === "idle" && "Captured automatically"}
                                            {locationStatus === "fetching" && <span className="text-amber-500 animate-pulse flex items-center gap-1.5"><i className="fa-solid fa-location-crosshairs animate-spin" /> Fetching...</span>}
                                            {locationStatus === "captured" && <span className="text-emerald-600 truncate px-1 flex items-center gap-1.5"><i className="fa-solid fa-location-dot" /> {capturedLocation.address ? capturedLocation.address : "Location Pinned"}</span>}
                                            {locationStatus === "denied" && <span className="text-rose-500 flex items-center gap-1.5"><i className="fa-solid fa-location-dot" /> Unavailable</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3">
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="w-full py-3.5 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#0b2836]/20 disabled:opacity-60 transition-all hover:bg-[#0f3345] hover:-translate-y-0.5"
                                    >
                                        {actionLoading ? "Processing..." : punchMode === "out" ? "Submit Punch Out Data" : "Submit Attendance"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Request Regularization Modal */}
            {showRegModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-[24px] p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold text-slate-900">Request Regularization</h3>
                            <button onClick={() => setShowRegModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateRegRequest} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Employee *</label>
                                {isAdminLevel ? (
                                    <select
                                        required
                                        value={regForm.empId}
                                        onChange={(e) => setRegForm({ ...regForm, empId: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-400 bg-white transition-all cursor-pointer shadow-sm text-slate-700"
                                    >
                                        <option value="" disabled>-- Select Employee --</option>
                                        {selectableEmployees.map((emp) => (
                                            <option key={emp.empId} value={emp.empId}>{emp.firstName} {emp.lastName} ({emp.empCode})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        disabled
                                        value={employees.find((emp) => emp.empId === loggedInEmpId) ? (() => {
                                            const self = employees.find((emp) => emp.empId === loggedInEmpId);
                                            return `${self.firstName} ${self.lastName} (${self.empCode})`;
                                        })() : "You"}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold bg-slate-50 text-slate-500 cursor-not-allowed"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Target Date *</label>
                                <input
                                    type="date"
                                    required
                                    value={regForm.attDate}
                                    onChange={e => setRegForm({ ...regForm, attDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Req. Check In</label>
                                    <input
                                        type="time"
                                        value={regForm.requestedCheckIn}
                                        onChange={e => setRegForm({ ...regForm, requestedCheckIn: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Req. Check Out</label>
                                    <input
                                        type="time"
                                        value={regForm.requestedCheckOut}
                                        onChange={e => setRegForm({ ...regForm, requestedCheckOut: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Justification Reason *</label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Explain why regularization is needed..."
                                    value={regForm.reason}
                                    onChange={e => setRegForm({ ...regForm, reason: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all resize-none shadow-sm"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-3.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-amber-600/20 disabled:opacity-60 transition-all hover:bg-amber-500 hover:-translate-y-0.5"
                                >
                                    {actionLoading ? "Submitting..." : "Submit Request to HR"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Summary Modal (Admin Only) */}
            {showSummaryModal && isAdminLevel && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-[24px] p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold text-slate-900">Generate Summary</h3>
                            <button onClick={() => setShowSummaryModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleGenerateSummary} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Employee *</label>
                                <select
                                    required
                                    value={summaryForm.empId}
                                    onChange={(e) => setSummaryForm({ ...summaryForm, empId: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-amber-400 bg-white transition-all cursor-pointer shadow-sm text-slate-700"
                                >
                                    <option value="" disabled>-- Select Target Employee --</option>
                                    {selectableEmployees.map((emp) => (
                                        <option key={emp.empId} value={emp.empId}>{emp.firstName} {emp.lastName} ({emp.empCode})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Month *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="12"
                                        value={summaryForm.month}
                                        onChange={e => setSummaryForm({ ...summaryForm, month: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Year *</label>
                                    <input
                                        type="number"
                                        required
                                        min="2020"
                                        max={new Date().getFullYear()}
                                        value={summaryForm.year}
                                        onChange={e => setSummaryForm({ ...summaryForm, year: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="w-full py-3.5 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#0b2836]/20 disabled:opacity-60 transition-all hover:bg-[#0f3345] hover:-translate-y-0.5"
                                >
                                    {actionLoading ? "Processing..." : "Process Report"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Mark Sunday/Holiday Duty Modal (Admin Only) */}
            {showDutyModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-[24px] p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold text-slate-900">Log Sunday Duty</h3>
                            <button onClick={() => setShowDutyModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <form onSubmit={handleMarkSundayDuty} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Employee *</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required={!dutyForm.empId}
                                        value={dutyEmpSearchOpen ? dutyEmpSearchText : (() => {
                                            const sel = employees.find((emp) => String(emp.empId) === String(dutyForm.empId));
                                            return sel ? `${sel.firstName} ${sel.lastName} (${sel.empCode})` : "";
                                        })()}
                                        onFocus={() => { setDutyEmpSearchOpen(true); setDutyEmpSearchText(""); }}
                                        onChange={(e) => setDutyEmpSearchText(e.target.value)}
                                        onBlur={() => setTimeout(() => setDutyEmpSearchOpen(false), 200)}
                                        placeholder="-- Search Employee --"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                    />
                                    {dutyEmpSearchOpen && (
                                        <div className="absolute z-50 mt-2 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl">
                                            {(() => {
                                                const q = dutyEmpSearchText.trim().toLowerCase();
                                                const filtered = employees.filter((emp) => `${emp.firstName} ${emp.lastName} ${emp.empCode}`.toLowerCase().includes(q));
                                                if (filtered.length === 0) return <div className="px-4 py-3 text-sm text-slate-400 font-medium italic">No employees found</div>;
                                                return filtered.map((emp) => (
                                                    <div
                                                        key={emp.empId}
                                                        onMouseDown={() => {
                                                            setDutyForm(prev => ({ ...prev, empId: emp.empId.toString() }));
                                                            setDutyEmpSearchText("");
                                                            setDutyEmpSearchOpen(false);
                                                        }}
                                                        className="px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                                                    >
                                                        {emp.firstName} {emp.lastName} <span className="text-slate-400 text-xs ml-1">({emp.empCode})</span>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={dutyForm.attDate}
                                        onChange={e => setDutyForm({ ...dutyForm, attDate: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                    />
                                    {isSunday(dutyForm.attDate) && (
                                        <p className="text-[10px] text-violet-600 mt-1 font-bold tracking-wide uppercase px-1">📅 Sunday Selected</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Status *</label>
                                    <select
                                        value={dutyForm.status}
                                        onChange={e => setDutyForm({ ...dutyForm, status: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all cursor-pointer shadow-sm"
                                    >
                                        <option>Present</option><option>Absent</option><option>Half-Day</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">GPS Location</label>
                                <button
                                    type="button"
                                    onClick={handleGetDutyLocation}
                                    disabled={dutyLocationStatus === "fetching"}
                                    className={`w-full py-3.5 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${dutyLocationStatus === "captured" ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-amber-400"}`}
                                >
                                    {dutyLocationStatus === "fetching" ? (
                                        <span className="text-amber-500 animate-pulse flex items-center gap-2"><i className="fa-solid fa-location-crosshairs animate-spin" /> Fetching Loc...</span>
                                    ) : dutyLocationStatus === "captured" ? (
                                        <span className="truncate max-w-[280px] flex items-center gap-2"><i className="fa-solid fa-location-dot" /> {dutyForm.location}</span>
                                    ) : (
                                        <span className="flex items-center gap-2"><i className="fa-solid fa-location-crosshairs" /> Capture Location</span>
                                    )}
                                </button>
                                {dutyLocationStatus === "denied" && (
                                    <p className="text-[10px] text-amber-600 mt-1.5 font-bold uppercase tracking-wide px-1"><i className="fa-solid fa-triangle-exclamation" /> Location access denied</p>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowDutyModal(false)}
                                    className="flex-1 py-3 text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-lg shadow-amber-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                                >
                                    {actionLoading ? "Saving..." : "Log Duty"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}