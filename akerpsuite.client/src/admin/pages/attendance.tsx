import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

// 🆕 Status badge — Present=green, Half-Day=amber, Leave=sky, Holiday=violet, baaki (Absent)=rose
const STATUS_STYLES: Record<string, { box: string; dot: string }> = {
    Present: { box: "bg-emerald-50 text-emerald-700 border-emerald-200/50", dot: "bg-emerald-500" },
    "Half-Day": { box: "bg-amber-50 text-amber-700 border-amber-200/50", dot: "bg-amber-500" },
    Leave: { box: "bg-sky-50 text-sky-700 border-sky-200/50", dot: "bg-sky-500" },
    Holiday: { box: "bg-violet-50 text-violet-700 border-violet-200/50", dot: "bg-violet-500" },
    Absent: { box: "bg-rose-50 text-rose-700 border-rose-200/50", dot: "bg-rose-500" },
};
const StatusBadge = ({ status }: { status: string }) => {
    const s = STATUS_STYLES[status] || STATUS_STYLES.Absent;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${s.box}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {status}
        </span>
    );
};

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

    // DB-driven "CMD-equal" flag — roles list se resolve hota hai
    const [rolesList, setRolesList] = useState<any[]>([]);
    useEffect(() => {
        adminService.getRoles().then((res: any) => {
            if (res.success || res.Success) setRolesList(res.data || res.Data || []);
        }).catch((err: any) => console.error("Failed to load roles for access check:", err));
    }, []);

    const currentRoleData = rolesList.find(
        (r) => String(r.roleName ?? r.RoleName ?? "").toUpperCase() === userRole
    );
    const isCmdEqual = currentRoleData?.isCmdEqual ?? currentRoleData?.IsCmdEqual ?? false;

    const isCMD = userRole === "CMD" || isCmdEqual;
    const isAdminLevel = isCmdEqual || ["CMD", "ADMIN", "HR"].includes(userRole);
    const isManager = userRole === "MANAGER" || userRole === "SR MANAGER" || userRole === "SR. MANAGER";
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

    const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
    const [resignedEmpIds, setResignedEmpIds] = useState<Set<number>>(new Set());
    const [regRequests, setRegRequests] = useState<any[]>([]);
    const [summaries, setSummaries] = useState<any[]>([]);
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
    const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
        setToast({ message, type });
    };
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(t);
    }, [toast]);
    const [sundayHolidayData, setSundayHolidayData] = useState<any[]>([]);
    const [sundayHolidayPeriod, setSundayHolidayPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });
    const [sundayHolidayMeta, setSundayHolidayMeta] = useState<any>(null);
    const [pdfDownloading, setPdfDownloading] = useState(false);
    const [activeTab, setActiveTab] = useState(isCMD ? "dashboard" : "logs");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFilter, setDateFilter] = useState("");

    // 🆕🆕 Monthly Attendance Report state
    const [monthlyReportData, setMonthlyReportData] = useState<any[]>([]);
    const [monthlyReportPeriod, setMonthlyReportPeriod] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        empId: ""
    });

    // Dashboard card click → inline list
    const [dashboardFilter, setDashboardFilter] = useState<{ label: string; status: string; date: string } | null>(null);
    const [dashboardLogsLoading, setDashboardLogsLoading] = useState(false);

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
    const [dutyCapturedLocation, setDutyCapturedLocation] = useState<any>({ latitude: null, longitude: null, address: null });
    const [checkoutLocationStatus, setCheckoutLocationStatus] = useState("idle");
    const [checkoutCapturedLocation, setCheckoutCapturedLocation] = useState<any>({ latitude: null, longitude: null, address: null });

    // 🆕 FIX: location + punch state upar le aaye (pehle neeche declare the, readability/TDZ risk)
    const [locationStatus, setLocationStatus] = useState("idle");
    const [capturedLocation, setCapturedLocation] = useState<any>({ latitude: null, longitude: null, address: null });
    const [punchMode, setPunchMode] = useState<any>(null);
    const [todaysRecord, setTodaysRecord] = useState<any>(null);

    // Edit Attendance modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState<any>({ attId: null, empName: "", attDate: "", status: "", checkIn: "", checkOut: "", remarks: "" });

    // Back Date Attendance (HR direct entry) state
    const [showBackDateModal, setShowBackDateModal] = useState(false);
    const [backDateEmpSearchOpen, setBackDateEmpSearchOpen] = useState(false);
    const [backDateEmpSearchText, setBackDateEmpSearchText] = useState("");
    const [backDateForm, setBackDateForm] = useState({
        empId: "", attDate: "", checkIn: "", checkOut: "", status: "Present", remarks: ""
    });

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
    const toMinutes = (t: string) => {
        if (!t) return null;
        const [h, m] = t.slice(0, 5).split(":").map(Number);
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        return h * 60 + m;
    };
    const LATE_CUTOFF_MIN = toMinutes(LATE_CUTOFF) as number;

    const isSunday = (dateStr: string) => {
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
        if (activeTab !== "dashboard") {
            setDashboardFilter(null);
        }
    }, [activeTab]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        adminService.getEmployees().then((res: any) => {
            if (res.Success || res.success) {
                const all = res.Data || res.data || [];

                // Resigned employees ki list — inki attendance logs/dashboard/report se hide karni hai
                const resignedIds = new Set<number>(
                    all
                        .filter((emp: any) => String(emp.employmentStatus ?? emp.EmploymentStatus ?? "").toUpperCase() === "RESIGNED")
                        .map((emp: any) => Number(emp.empId ?? emp.EmpId))
                );
                setResignedEmpIds(resignedIds);

                const filtered = all.filter((emp: any) => {
                    const empRole = String(emp.role ?? emp.Role ?? emp.roleName ?? emp.RoleName ?? "").toUpperCase();
                    const empStatus = String(emp.employmentStatus ?? emp.EmploymentStatus ?? "").toUpperCase();
                    return empRole !== "DIRECTOR" && empRole !== "CMD" && empStatus !== "RESIGNED";
                });
                setEmployees(filtered);
            }
        });
    }, []);

    useEffect(() => {
        if (!isAdminLevel && activeTab === "summaries") {
            setActiveTab("logs");
        }
        if (!isTeamLevel && activeTab === "sundayWorking") {
            setActiveTab("logs");
        }
        if (!isAdminLevel && activeTab === "backDate") {
            setActiveTab("logs");
        }
        // 🆕🆕 monthlyReport bhi admin-only
        if (!isAdminLevel && activeTab === "monthlyReport") {
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
        if (!isAdminLevel && activeTab === "backDate") {
            setLoading(false);
            return;
        }
        // 🆕🆕
        if (!isAdminLevel && activeTab === "monthlyReport") {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            if (activeTab === "dashboard") {
                const res = await adminService.getDashboardStats();
                if (res.Success || res.success) setDashboardStats(res.Data || res.data || {});
                const logsRes = await adminService.getAttendanceAll();
                if (logsRes.Success || logsRes.success) setAttendanceLogs(logsRes.Data || logsRes.data || []);
            } else if (activeTab === "logs") {
                const res = await adminService.getAttendanceAll();
                if (res.Success || res.success) setAttendanceLogs(res.Data || res.data || []);
            } else if (activeTab === "backDate") {
                const res = await adminService.getAttendanceAll();
                if (res.Success || res.success) setAttendanceLogs(res.Data || res.data || []);
            } else if (activeTab === "monthlyReport") {
                // 🆕🆕 Monthly Attendance Report
                const res = await adminService.getMonthlyAttendanceReport(
                    monthlyReportPeriod.month,
                    monthlyReportPeriod.year,
                    monthlyReportPeriod.empId ? Number(monthlyReportPeriod.empId) : undefined
                );
                if (res.Success || res.success) {
                    const rows = res.Data || res.data || [];
                    setMonthlyReportData(Array.isArray(rows) ? rows : []);
                } else {
                    setMonthlyReportData([]);
                    showToast(res.Message || "Failed to load monthly report.", "error");
                }
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
        } catch (err: any) {
            console.error("Attendance data load error:", err);
            if (activeTab === "monthlyReport") {
                setMonthlyReportData([]);
                showToast(err?.message || "Failed to load monthly report.", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // Dashboard card click handler — tab change nahi karta, inline list dikhata hai
    const openDashboardFilter = async (label: string, status: string) => {
        // 🆕 FIX: toISOString() UTC deta hai → IST me subah ko kal ki date aa jaati thi. Local date use karo.
        const today = getTodayDateStr();
        setDashboardFilter({ label, status, date: today });
        setCurrentPage(1);
        if (attendanceLogs.length === 0) {
            setDashboardLogsLoading(true);
            try {
                const res = await adminService.getAttendanceAll();
                if (res.Success || res.success) setAttendanceLogs(res.Data || res.data || []);
            } catch (err) {
                console.error("Dashboard logs load error:", err);
            } finally {
                setDashboardLogsLoading(false);
            }
        }
    };

    const determinePunchMode = async (empId: any) => {
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
                (r: any) => Number(r.empId) === Number(empId) && (r.attDate || "").slice(0, 10) === today
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
            showToast("Your account is not linked to an employee record, so you can't mark attendance. Please contact HR/Admin.", "error");
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
        setCheckoutLocationStatus("idle");
        setCheckoutCapturedLocation({ latitude: null, longitude: null, address: null });
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

    const handleMarkEmployeeChange = (empId: string) => {
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
            showToast("Your account is not linked to an employee record, so you can't submit a request. Please contact HR/Admin.", "error");
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

    // Edit Attendance handlers
    const openEditModal = (log: any) => {
        setEditForm({
            attId: log.attId,
            empName: log.fullName || `EMP-${log.empId}`,
            attDate: (log.attDate || "").slice(0, 10),
            status: log.status,
            checkIn: (log.checkIn || "").slice(0, 5),
            checkOut: (log.checkOut || "").slice(0, 5),
            remarks: log.remarks || ""
        });
        setShowEditModal(true);
    };

    const handleEditAttendance = async (e: any) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                status: editForm.status,
                checkIn: editForm.checkIn ? editForm.checkIn + ":00" : null,
                checkOut: editForm.checkOut ? editForm.checkOut + ":00" : null,
                remarks: editForm.remarks,
                createdBy: user?.userId ?? user?.UserId ?? 1,
            };
            const res = await adminService.editAttendance(editForm.attId, payload);
            if (res.Success || res.success) {
                setShowEditModal(false);
                loadAttendanceData();
                showToast("Attendance updated successfully", "success");
            } else {
                showToast(res.Message || "Failed to update attendance.", "error");
            }
        } catch (err: any) {
            console.error("Edit attendance error:", err);
            showToast(err?.message || "Something went wrong while updating.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    // Back Date Attendance handlers (HR/Admin direct entry, no GPS, no approval)
    const openBackDateModal = () => {
        setBackDateForm({
            empId: "",
            attDate: "",
            checkIn: "",
            checkOut: "",
            status: "Present",
            remarks: ""
        });
        setBackDateEmpSearchOpen(false);
        setBackDateEmpSearchText("");
        setShowBackDateModal(true);
    };

    const handleBackDateAttendance = async (e: any) => {
        e.preventDefault();

        if (!backDateForm.empId) {
            showToast("Please select an employee.", "error");
            return;
        }
        if (!backDateForm.attDate) {
            showToast("Please select a date.", "error");
            return;
        }
        if (backDateForm.attDate > getTodayDateStr()) {
            showToast("Future date is not allowed for back-date entry.", "error");
            return;
        }
        if (backDateForm.checkIn && backDateForm.checkOut && backDateForm.checkOut < backDateForm.checkIn) {
            showToast("Punch-out time can't be before punch-in time.", "error");
            return;
        }

        setActionLoading(true);
        try {
            const payload = {
                empId: parseInt(backDateForm.empId, 10),
                attDate: `${backDateForm.attDate}T00:00:00`,
                checkIn: backDateForm.checkIn ? backDateForm.checkIn + ":00" : null,
                checkOut: backDateForm.checkOut ? backDateForm.checkOut + ":00" : null,
                status: backDateForm.status,
                remarks: backDateForm.remarks,
                createdBy: user?.userId ?? user?.UserId ?? 1,
                source: "Manual",
                latitude: null,
                longitude: null,
                locationAddress: null,
                checkOutLatitude: null,
                checkOutLongitude: null,
                checkOutLocationAddress: null,
            };
            const res = await adminService.markAttendance(payload);
            if (res.Success || res.success) {
                setShowBackDateModal(false);
                setBackDateForm({ empId: "", attDate: "", checkIn: "", checkOut: "", status: "Present", remarks: "" });
                loadAttendanceData();
                showToast("Back-date attendance added successfully", "success");
            } else {
                showToast(res.Message || "Failed to add back-date attendance.", "error");
            }
        } catch (err: any) {
            console.error("Back-date attendance error:", err);
            showToast(err?.message || "Something went wrong while adding back-date attendance.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const reverseGeocode = async (latitude: number, longitude: number) => {
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

    type LocationResult = { latitude: number | null; longitude: number | null; address: string | null };

    // IP-based fallback — jab GPS bilkul fail ho jaye
    const getIpBasedLocation = async (): Promise<LocationResult> => {
        try {
            const res = await fetch("https://ipapi.co/json/");
            const data = await res.json();
            if (data?.latitude && data?.longitude) {
                return {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    address: `${data.city || ""}, ${data.region || ""} (approx, IP-based)`.trim(),
                };
            }
        } catch (err) {
            console.warn("IP-based location fallback failed:", err);
        }
        return { latitude: null, longitude: null, address: "Location unavailable" };
    };

    const captureLocation = (
        setStatus: (s: string) => void,
        setLoc: (l: LocationResult) => void
    ): Promise<LocationResult> => {
        setStatus("fetching");
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                getIpBasedLocation().then((loc) => {
                    setLoc(loc);
                    setStatus(loc.latitude ? "captured" : "denied");
                    resolve(loc);
                });
                return;
            }

            const onSuccess = async (pos: GeolocationPosition) => {
                const { latitude, longitude, accuracy } = pos.coords;
                console.log(`Location captured with accuracy: ${accuracy}m`);
                const address = await reverseGeocode(latitude, longitude);
                const loc = { latitude, longitude, address };
                setLoc(loc);
                setStatus("captured");
                resolve(loc);
            };

            // Attempt 1: High accuracy GPS (25s)
            navigator.geolocation.getCurrentPosition(
                onSuccess,
                (err) => {
                    console.warn("High-accuracy attempt 1 failed, retrying high-accuracy once more:", err.message);

                    // Attempt 2: high accuracy ek aur baar (20s)
                    navigator.geolocation.getCurrentPosition(
                        onSuccess,
                        (err2) => {
                            console.warn("High-accuracy attempt 2 failed, trying low-accuracy (network-based):", err2.message);

                            // Attempt 3: low accuracy, no stale cache
                            navigator.geolocation.getCurrentPosition(
                                onSuccess,
                                async (err3) => {
                                    console.warn("GPS fully failed, falling back to IP location:", err3.message);
                                    const loc = await getIpBasedLocation();
                                    setLoc(loc);
                                    setStatus(loc.latitude ? "captured" : "denied");
                                    resolve(loc);
                                },
                                { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
                            );
                        },
                        { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
                    );
                },
                { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
            );
        });
    };

    const getCurrentLocation = (): Promise<LocationResult> =>
        captureLocation(setLocationStatus, setCapturedLocation);

    const getCheckoutLocation = (): Promise<LocationResult> =>
        captureLocation(setCheckoutLocationStatus, setCheckoutCapturedLocation);

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
        setCheckoutLocationStatus("idle");
        getCheckoutLocation();
    };

    const handleMarkAttendance = async (e: any) => {
        e.preventDefault();

        if (punchMode === "done") {
            showToast("Attendance has already been marked for today (both Punch In and Punch Out are completed).", "info");
            return;
        }

        const noPunchStatus = ["Absent", "Leave", "Holiday"].includes(markForm.status);
        if (punchMode === "in" && !noPunchStatus && !markForm.checkIn) {
            showToast("Please tap Punch In before submitting.", "error");
            return;
        }
        if (punchMode === "out" && !markForm.checkOut) {
            showToast("Please tap Punch Out before submitting.", "error");
            return;
        }
        if (markForm.checkIn && markForm.checkOut && markForm.checkOut < markForm.checkIn) {
            showToast("Punch-out time can't be before punch-in time.", "error");
            return;
        }

        const isLatePunchIn = punchMode === "in" && !noPunchStatus && !!markForm.checkIn && (toMinutes(markForm.checkIn) as number) > LATE_CUTOFF_MIN;

        setActionLoading(true);
        try {
            const { latitude, longitude, address } =
                locationStatus === "captured" ? capturedLocation : await getCurrentLocation();

            const checkInForPayload = punchMode === "out"
                ? (todaysRecord?.checkIn || (markForm.checkIn ? markForm.checkIn + ":00" : null))
                : (markForm.checkIn ? markForm.checkIn + ":00" : null);

            const checkoutLoc: any = markForm.checkOut
                ? (checkoutLocationStatus === "captured" ? checkoutCapturedLocation : await getCheckoutLocation())
                : { latitude: null, longitude: null, address: null };

            const payload = {
                empId: parseInt(markForm.empId, 10),
                attDate: markForm.attDate ? `${markForm.attDate}T00:00:00` : null,
                checkIn: checkInForPayload,
                checkOut: markForm.checkOut ? markForm.checkOut + ":00" : null,
                status: markForm.status,
                remarks: "",
                createdBy: user?.userId ?? user?.UserId ?? 1,
                latitude,
                longitude,
                locationAddress: address,
                checkOutLatitude: checkoutLoc.latitude,
                checkOutLongitude: checkoutLoc.longitude,
                checkOutLocationAddress: checkoutLoc.address,
            };

            const res = await adminService.markAttendance(payload);
            if (res.Success || res.success) {
                setShowMarkModal(false);
                setMarkForm({ empId: "", attDate: getTodayDateStr(), checkIn: "", checkOut: "", status: "Present", remarks: "" });
                setLocationStatus("idle");
                setCapturedLocation({ latitude: null, longitude: null, address: null });
                setPunchMode(null);
                setTodaysRecord(null);
                loadAttendanceData();

                if (isLatePunchIn) {
                    showToast(
                        `Your Punch In was recorded at ${markForm.checkIn}, after the designated cutoff time of ${LATE_CUTOFF}. Your attendance has been marked as Present; however, it is pending approval from Admin/HR due to the late arrival.`,
                        "info"
                    );
                }
            } else {
                showToast(res.Message || "Failed to mark attendance.", "error");
            }
        } catch (err: any) {
            console.error("Mark attendance error:", err);
            showToast(err?.message || "Something went wrong while marking attendance.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRegAction = async (requestId: any, statusAction: string) => {
        if (!isAdminLevel) {
            showToast("You don't have permission to approve or reject regularization requests.", "error");
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
                showToast(res.Message || "Failed to update request.", "error");
            }
        } catch (err: any) {
            console.error("Reg action error:", err);
            showToast(err?.message || "Something went wrong while updating the request.", "error");
        }
    };

    const handleLateApprovalAction = async (requestId: any, statusAction: string) => {
        if (!isAdminLevel) {
            showToast("You don't have permission to approve or reject attendance.", "error");
            return;
        }
        try {
            const approvedBy = user?.userId ?? user?.UserId ?? 1;
            const res = await adminService.updateRegStatus(requestId, statusAction, approvedBy);
            if (res.Success || res.success) {
                loadAttendanceData();
            } else {
                showToast(res.Message || "Failed to update approval.", "error");
            }
        } catch (err: any) {
            console.error("Late approval action error:", err);
            showToast(err?.message || "Something went wrong while updating approval.", "error");
        }
    };

    const handleCreateRegRequest = async (e: any) => {
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
                showToast(res.Message || "Failed to submit regularization request.", "error");
            }
        } catch (err: any) {
            console.error("Create reg request error:", err);
            showToast(err?.message || "Something went wrong while submitting the request.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleGenerateSummary = async (e: any) => {
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
                showToast(res.Message || "Failed to generate summary.", "error");
            }
        } catch (err: any) {
            console.error("Generate summary error:", err);
            showToast(err?.message || "Something went wrong while generating the summary.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkSundayDuty = async (e: any) => {
        e.preventDefault();
        if (!dutyForm.empId) {
            showToast("Please select an employee.", "error");
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
                showToast(res.Message || "Failed to save Sunday/Holiday duty status.", "error");
            }
        } catch (err: any) {
            console.error("Mark Sunday duty error:", err);
            showToast(err?.message || "Something went wrong while saving duty status.", "error");
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
        } catch (err: any) {
            console.error("Download Sunday/Holiday PDF error:", err);
            showToast(err?.message || "Failed to download PDF.", "error");
        } finally {
            setPdfDownloading(false);
        }
    };

    const tabsList = [
        ...(isCMD ? [{ key: "dashboard", label: "Attendance Dashboard" }] : []),
        { key: "logs", label: "Attendance Logs" },
        { key: "requests", label: "Attendance Approval Requests" },
        ...(isTeamLevel ? [{ key: "sundayWorking", label: "Sunday Working" }] : []),
        ...(isAdminLevel ? [{ key: "summaries", label: "Monthly Summary" }] : []),
        ...(isAdminLevel ? [{ key: "backDate", label: "Back Date Attendance" }] : []),
        // 🆕🆕 Monthly Attendance Report tab — HR/Admin only
        ...(isAdminLevel ? [{ key: "monthlyReport", label: "Monthly Report" }] : [])
    ];

    const filterBySearch = (list: any[], fields: string[]) => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return list;
        return list.filter((row) =>
            fields.some((f) => (row[f] ?? "").toString().toLowerCase().includes(q))
        );
    };

    const paginate = (list: any[]) => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return list.slice(start, start + ITEMS_PER_PAGE);
    };

    const scopeToEmployee = (list: any[]) => {
        if (isAdminLevel) return list;
        if (isManager) {
            const teamIds = new Set(selectableEmployees.map((e) => Number(e.empId)));
            return list.filter((row) => teamIds.has(Number(row.empId)));
        }
        return list.filter((row) => Number(row.empId) === loggedInEmpId);
    };

    const filteredLogsBase = attendanceLogs.filter((log) => {
        if (resignedEmpIds.has(Number(log.empId))) return false;
        const statusMatch = !statusFilter || log.status === statusFilter;
        const dateMatch = !dateFilter || (log.attDate || "").slice(0, 10) === dateFilter;
        return statusMatch && dateMatch;
    });

    const filteredLogs = filterBySearch(scopeToEmployee(filteredLogsBase), ["fullName", "status", "source"])
        .slice()
        .sort((a, b) => {
            const ad = (a.attDate || "").slice(0, 10);
            const bd = (b.attDate || "").slice(0, 10);
            if (ad !== bd) return bd.localeCompare(ad); // naya date pehle

            const at = a.checkIn ? a.checkIn.slice(0, 5) : "";
            const bt = b.checkIn ? b.checkIn.slice(0, 5) : "";
            if (!at && !bt) return 0;
            if (!at) return 1;
            if (!bt) return -1;
            return bt.localeCompare(at); // late time pehle
        });
    const filteredRequests = filterBySearch(scopeToEmployee(regRequests), ["fullName", "reason", "status"]);
    const filteredSummaries = filterBySearch(scopeToEmployee(summaries), ["fullName"]);
    const sundayDateColumns = (
        sundayHolidayMeta?.sundayDates ||
        sundayHolidayMeta?.SundayDates ||
        []
    ).map((d: any) => new Date(d));

    const filteredSundayHolidayData = filterBySearch(
        scopeToEmployee((sundayHolidayData || []).map(r => ({
            ...r,
            fullName: r.employeeName || r.EmployeeName || `EMP-${r.empId || r.EmpId}`,
            empId: r.empId ?? r.EmpId,
        }))),
        ["fullName"]
    );

    // Back Date tab — sirf past-date entries
    const todayStrForBackDate = getTodayDateStr();
    const backDateLogsBase = attendanceLogs.filter((log) =>
        (log.attDate || "").slice(0, 10) < todayStrForBackDate && !resignedEmpIds.has(Number(log.empId))
    );
    const filteredBackDateLogs = filterBySearch(scopeToEmployee(backDateLogsBase), ["fullName", "status", "source"])
        .slice()
        .sort((a, b) => (b.attDate || "").slice(0, 10).localeCompare((a.attDate || "").slice(0, 10)));

    // 🆕🆕 Monthly Report — camel/Pascal dono handle, resigned hide, search by name/code
    const filteredMonthlyReport = filterBySearch(
        scopeToEmployee(
            (monthlyReportData || [])
                .map((r: any) => ({
                    empId: r.empId ?? r.EmpId,
                    empCode: r.empCode ?? r.EmpCode ?? "",
                    empName: r.empName ?? r.EmpName ?? "",
                    daysPresent: r.daysPresent ?? r.DaysPresent ?? 0,
                    halfDays: r.halfDays ?? r.HalfDays ?? 0,
                    absentDays: r.absentDays ?? r.AbsentDays ?? 0,
                    leaveDays: r.leaveDays ?? r.LeaveDays ?? 0,
                    weekOffDays: r.weekOffDays ?? r.WeekOffDays ?? 0,
                    holidayDays: r.holidayDays ?? r.HolidayDays ?? 0,
                    lateCount: r.lateCount ?? r.LateCount ?? 0,
                    totalWorkingHours: r.totalWorkingHours ?? r.TotalWorkingHours ?? 0,
                    overtimeHours: r.overtimeHours ?? r.OvertimeHours ?? 0,
                    sundaysWorked: r.sundaysWorked ?? r.SundaysWorked ?? 0,
                    sundayHours: r.sundayHours ?? r.SundayHours ?? 0,
                }))
                .filter((r: any) => !resignedEmpIds.has(Number(r.empId)))
        ),
        ["empName", "empCode"]
    );

    const handleExportMonthlyCsv = () => {
        const head = ["Code", "Employee", "Present", "Half Days", "Absent", "Leave", "Week Off", "Holiday", "Late", "Work Hrs", "OT Hrs", "Sundays Worked", "Sunday Hrs"];
        const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const lines = filteredMonthlyReport.map((r: any) =>
            [
                r.empCode, r.empName, r.daysPresent, r.halfDays, r.absentDays, r.leaveDays,
                r.weekOffDays, r.holidayDays, r.lateCount, r.totalWorkingHours, r.overtimeHours,
                r.sundaysWorked, r.sundayHours
            ].map(esc).join(",")
        );
        const csv = [head.map(esc).join(","), ...lines].join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `Attendance_Report_${String(monthlyReportPeriod.month).padStart(2, "0")}_${monthlyReportPeriod.year}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const isDashboardAbsentFilter = dashboardFilter?.status === "Absent";
    const isDashboardLateFilter = dashboardFilter?.label === "Late Arrivals";

    // 🆕 FIX: local date (UTC nahi)
    const todayStr = getTodayDateStr();
    const lateArrivalsCount = attendanceLogs.filter(
        (log) => (log.attDate || "").slice(0, 10) === todayStr && log.checkIn && log.checkIn.slice(0, 5) > LATE_CUTOFF && !resignedEmpIds.has(Number(log.empId))
    ).length;
    const onHolidayCount = attendanceLogs.filter(
        (log) => (log.attDate || "").slice(0, 10) === todayStr && log.status === "Holiday" && !resignedEmpIds.has(Number(log.empId))
    ).length;
    // 🆕 FIX: resigned filter yahan bhi lagaya (pehle missing tha)
    const onLeaveCount = attendanceLogs.filter(
        (log) => (log.attDate || "").slice(0, 10) === todayStr && log.status === "Leave" && !resignedEmpIds.has(Number(log.empId))
    ).length;

    const dashboardAbsentEmployees = isDashboardAbsentFilter
        ? scopeToEmployee(
            employees.filter((emp) => {
                const rec = attendanceLogs.find(
                    (log) => Number(log.empId) === Number(emp.empId) && (log.attDate || "").slice(0, 10) === dashboardFilter!.date
                );
                // record nahi mila YA explicitly "Absent"
                return !rec || rec.status === "Absent";
            })
        )
        : [];

    const dashboardFilteredLogs = dashboardFilter && !isDashboardAbsentFilter
        ? scopeToEmployee(
            attendanceLogs.filter((log) => {
                if (resignedEmpIds.has(Number(log.empId))) return false;
                const dateMatch = (log.attDate || "").slice(0, 10) === dashboardFilter.date;
                if (!dateMatch) return false;
                // Late Arrivals: 09:05 cutoff ke baad checkIn wale
                if (isDashboardLateFilter) {
                    return !!log.checkIn && log.checkIn.slice(0, 5) > LATE_CUTOFF;
                }
                const statusMatch = !dashboardFilter.status || log.status === dashboardFilter.status;
                return statusMatch;
            })
        )
        : [];

    const dashboardRows = isDashboardAbsentFilter ? dashboardAbsentEmployees : dashboardFilteredLogs;

    const pagedLogs = paginate(filteredLogs);
    const pagedRequests = paginate(filteredRequests);
    const pagedSummaries = paginate(filteredSummaries);
    const pagedSundayHoliday = paginate(filteredSundayHolidayData);
    const pagedDashboardLogs = dashboardFilter ? paginate(dashboardRows) : [];
    const pagedBackDateLogs = paginate(filteredBackDateLogs);
    const pagedMonthlyReport = paginate(filteredMonthlyReport);

    const activeListMeta: { total: number; placeholder: string } | undefined = ({
        logs: { total: filteredLogs.length, placeholder: "Search by employee, status, or source..." },
        requests: { total: filteredRequests.length, placeholder: "Search by employee, reason, or status..." },
        summaries: { total: filteredSummaries.length, placeholder: "Search by employee name..." },
        sundayWorking: { total: filteredSundayHolidayData.length, placeholder: "Search by employee name..." },
        backDate: { total: filteredBackDateLogs.length, placeholder: "Search by employee, status..." },
        // 🆕🆕
        monthlyReport: { total: filteredMonthlyReport.length, placeholder: "Search by employee name or code..." },
    } as any)[activeTab];

    const totalPages = activeListMeta ? Math.max(1, Math.ceil(activeListMeta.total / ITEMS_PER_PAGE)) : 1;
    const dashboardTotalPages = dashboardFilter ? Math.max(1, Math.ceil(dashboardRows.length / ITEMS_PER_PAGE)) : 1;

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

    const DashboardPaginationBar = () => {
        if (!dashboardFilter || dashboardRows.length === 0) return null;
        const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
        const end = Math.min(currentPage * ITEMS_PER_PAGE, dashboardRows.length);
        return (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-200 text-sm text-slate-500 gap-4">
                <div>
                    Showing <span className="font-bold text-slate-800">{start}</span> to{" "}
                    <span className="font-bold text-slate-800">{end}</span> of{" "}
                    <span className="font-bold text-slate-800">{dashboardRows.length}</span> entries
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
                        Page {currentPage} of {dashboardTotalPages}
                    </div>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(dashboardTotalPages, p + 1))}
                        disabled={currentPage === dashboardTotalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-40 transition-all shadow-sm flex items-center gap-1.5"
                    >
                        Next <i className="fa-solid fa-chevron-right text-[10px]" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-5 pb-10 font-sans">

            {/* ── Toast Notification ── */}
            {toast && (
                <div className="fixed top-6 right-6 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div
                        className={`flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl border max-w-sm ${toast.type === "success"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : toast.type === "error"
                                ? "bg-rose-50 border-rose-200 text-rose-800"
                                : "bg-slate-800 border-slate-700 text-white"
                            }`}
                    >
                        <i
                            className={`fa-solid mt-0.5 ${toast.type === "success"
                                ? "fa-circle-check text-emerald-500"
                                : toast.type === "error"
                                    ? "fa-circle-exclamation text-rose-500"
                                    : "fa-circle-info text-amber-400"
                                }`}
                        />
                        <p className="text-sm font-semibold flex-1">{toast.message}</p>
                        <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
                            <i className="fa-solid fa-xmark text-xs" />
                        </button>
                    </div>
                </div>
            )}

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
                {userRole !== "CMD" && userRole !== "DIRECTOR" && (
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
                        ) : activeTab === "backDate" && isAdminLevel ? (
                            <button
                                onClick={openBackDateModal}
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-2"
                            >
                                <i className="fa-solid fa-clock-rotate-left" /> Add Back Date Attendance
                            </button>
                        ) : activeTab === "monthlyReport" && isAdminLevel ? (
                            // 🆕🆕 Monthly Report tab ka header action
                            <button
                                onClick={handleExportMonthlyCsv}
                                disabled={filteredMonthlyReport.length === 0}
                                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#0b2836] bg-amber-400 hover:bg-amber-500 transition-colors shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <i className="fa-solid fa-file-csv" /> Export CSV
                            </button>
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
                                    <i className="fa-solid fa-code-pull-request" /> Request Attendance Approval
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

                {/* 🆕🆕 Period + Employee Picker for Monthly Report */}
                {!loading && activeTab === "monthlyReport" && isAdminLevel && (
                    <div className="px-6 pt-5 flex flex-wrap items-center gap-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Period Selector:</label>
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={monthlyReportPeriod.month}
                                onChange={(e) => setMonthlyReportPeriod(prev => ({ ...prev, month: Number(e.target.value) }))}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}</option>
                                ))}
                            </select>
                            <select
                                value={monthlyReportPeriod.year}
                                onChange={(e) => setMonthlyReportPeriod(prev => ({ ...prev, year: Number(e.target.value) }))}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <select
                                value={monthlyReportPeriod.empId}
                                onChange={(e) => setMonthlyReportPeriod(prev => ({ ...prev, empId: e.target.value }))}
                                className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium bg-slate-50 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer max-w-[240px]"
                            >
                                <option value="">All Employees</option>
                                {employees.map((emp) => (
                                    <option key={emp.empId} value={emp.empId}>{emp.firstName} {emp.lastName} ({emp.empCode})</option>
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

                {/* Search bar — inline JSX (component bana ke define karne se input focus lose hota tha) */}
                {!loading && activeListMeta && (
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
                )}

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
                        <h3 className="text-lg font-bold text-slate-800 mb-5">Today's Attendance Overview</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                            <button
                                type="button"
                                onClick={() => openDashboardFilter("Total Employees", "")}
                                className={`p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow text-left cursor-pointer ${dashboardFilter?.label === "Total Employees" ? "border-slate-400 ring-2 ring-slate-200" : "border-slate-200"}`}
                            >
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Employees</p>
                                <p className="text-3xl font-black text-slate-800">{dashboardStats?.totalEmployees || 0}</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => openDashboardFilter("Present Today", "Present")}
                                className={`p-5 rounded-2xl border bg-emerald-50/50 shadow-sm hover:shadow-md hover:bg-emerald-50 transition-all text-left cursor-pointer ${dashboardFilter?.label === "Present Today" ? "border-emerald-400 ring-2 ring-emerald-200" : "border-emerald-100"}`}
                            >
                                <p className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Present Today</p>
                                <p className="text-3xl font-black text-emerald-700">{dashboardStats?.presentToday || 0}</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => openDashboardFilter("Absent Today", "Absent")}
                                className={`p-5 rounded-2xl border bg-rose-50/50 shadow-sm hover:shadow-md hover:bg-rose-50 transition-all text-left cursor-pointer ${dashboardFilter?.label === "Absent Today" ? "border-rose-400 ring-2 ring-rose-200" : "border-rose-100"}`}
                            >
                                <p className="text-[11px] text-rose-600 font-bold uppercase tracking-wider mb-1">Absent Today</p>
                                <p className="text-3xl font-black text-rose-700">{dashboardStats?.absentToday || 0}</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => openDashboardFilter("Late Arrivals", "Present")}
                                className={`p-5 rounded-2xl border bg-amber-50/50 shadow-sm hover:shadow-md hover:bg-amber-50 transition-all text-left cursor-pointer ${dashboardFilter?.label === "Late Arrivals" ? "border-amber-400 ring-2 ring-amber-200" : "border-amber-100"}`}
                            >
                                <p className="text-[11px] text-amber-600 font-bold uppercase tracking-wider mb-1">Late Arrivals</p>
                                <p className="text-3xl font-black text-amber-700">{lateArrivalsCount}</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => openDashboardFilter("On Holiday", "Holiday")}
                                className={`p-5 rounded-2xl border bg-violet-50/50 shadow-sm hover:shadow-md hover:bg-violet-50 transition-all text-left cursor-pointer ${dashboardFilter?.label === "On Holiday" ? "border-violet-400 ring-2 ring-violet-200" : "border-violet-100"}`}
                            >
                                <p className="text-[11px] text-violet-600 font-bold uppercase tracking-wider mb-1">On Holiday</p>
                                <p className="text-3xl font-black text-violet-700">{onHolidayCount}</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => openDashboardFilter("On Leave", "Leave")}
                                className={`p-5 rounded-2xl border bg-sky-50/50 shadow-sm hover:shadow-md hover:bg-sky-50 transition-all text-left cursor-pointer ${dashboardFilter?.label === "On Leave" ? "border-sky-400 ring-2 ring-sky-200" : "border-sky-100"}`}
                            >
                                <p className="text-[11px] text-sky-600 font-bold uppercase tracking-wider mb-1">On Leave</p>
                                <p className="text-3xl font-black text-sky-700">{onLeaveCount}</p>
                            </button>
                        </div>

                        {/* Card click ka result — same page, neeche inline list */}
                        {dashboardFilter ? (
                            <div className="border border-slate-200 rounded-2xl overflow-hidden">
                                <div className="flex justify-between items-center px-6 py-4 bg-slate-50/80 border-b border-slate-200">
                                    <h4 className="font-bold text-slate-800 text-sm">
                                        {dashboardFilter.label} — {new Date(dashboardFilter.date).toLocaleDateString("en-IN")}
                                    </h4>
                                    <button
                                        onClick={() => setDashboardFilter(null)}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1.5"
                                    >
                                        <i className="fa-solid fa-xmark" /> Close
                                    </button>
                                </div>

                                {dashboardLogsLoading ? (
                                    <div className="p-16 flex flex-col items-center justify-center gap-3">
                                        <div className="relative w-10 h-10 flex items-center justify-center">
                                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                                        </div>
                                        <div className="text-sm font-semibold text-slate-400 tracking-wide animate-pulse">Loading employees...</div>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                                    <th className="px-6 py-4">Employee</th>
                                                    <th className="px-6 py-4">Date</th>
                                                    <th className="px-6 py-4">Check In</th>
                                                    <th className="px-6 py-4">Check Out</th>
                                                    <th className="px-6 py-4">Location</th>
                                                    <th className="px-6 py-4">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                                {dashboardRows.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium">
                                                            No records found for this filter
                                                        </td>
                                                    </tr>
                                                ) : isDashboardAbsentFilter ? (
                                                    // Absent rows employee-master se aati hai, isliye alag field names
                                                    pagedDashboardLogs.map((emp) => (
                                                        <tr key={emp.empId} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                                {emp.firstName} {emp.lastName} <span className="text-slate-400 font-normal text-xs">({emp.empCode})</span>
                                                            </td>
                                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                                {new Date(dashboardFilter.date).toLocaleDateString("en-IN")}
                                                            </td>
                                                            <td className="px-6 py-4 font-mono font-medium text-slate-400">--:--</td>
                                                            <td className="px-6 py-4 font-mono font-medium text-slate-400">--:--</td>
                                                            <td className="px-6 py-4 text-[13px] text-slate-300">—</td>
                                                            <td className="px-6 py-4">
                                                                <StatusBadge status="Absent" />
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    pagedDashboardLogs.map((log) => (
                                                        <tr key={log.attId} className="hover:bg-slate-50/60 transition-colors">
                                                            <td className="px-6 py-4 font-bold text-slate-900">
                                                                {log.fullName || `EMP-${log.empId}`}
                                                            </td>
                                                            <td className="px-6 py-4 font-medium text-slate-600">
                                                                {new Date(log.attDate).toLocaleDateString("en-IN")}
                                                            </td>
                                                            <td className="px-6 py-4 font-mono font-medium text-slate-600">{log.checkIn || "--:--"}</td>
                                                            <td className="px-6 py-4 font-mono font-medium text-slate-600">{log.checkOut || "--:--"}</td>
                                                            <td className="px-6 py-4 text-[13px] text-slate-500 max-w-[200px] truncate" title={log.locationAddress || ""}>
                                                                {log.locationAddress ? log.locationAddress : log.latitude && log.longitude ? `${Number(log.latitude).toFixed(5)}, ${Number(log.longitude).toFixed(5)}` : <span className="text-slate-300">—</span>}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <StatusBadge status={log.status} />
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                        <DashboardPaginationBar />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-10 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                <i className="fa-solid fa-chart-line text-2xl mb-2 text-slate-300"></i>
                                <p>More executive charts and operational trends will appear here...</p>
                            </div>
                        )}
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
                                    <th className="px-6 py-4">Checkout Location</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Approval</th>
                                    <th className="px-6 py-4">Source</th>
                                    {/* 🆕 FIX: Actions header sirf admin ko (td bhi sirf admin ko tha → misalignment) */}
                                    {isAdminLevel && <th className="px-6 py-4">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdminLevel ? 10 : 9} className="px-6 py-16 text-center text-slate-400 font-medium">
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
                                        <td className="px-6 py-4 text-[13px] text-slate-500 max-w-[200px] truncate" title={log.checkOutLocationAddress || ""}>
                                            {log.checkOutLocationAddress ? log.checkOutLocationAddress : log.checkOutLatitude && log.checkOutLongitude ? `${Number(log.checkOutLatitude).toFixed(5)}, ${Number(log.checkOutLongitude).toFixed(5)}` : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={log.status} />
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
                                        {isAdminLevel && (
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => openEditModal(log)}
                                                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                                >
                                                    <i className="fa-solid fa-pen" /> Edit
                                                </button>
                                            </td>
                                        )}
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
                    <div className="flex-1 flex flex-col">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                        <th className="px-4 py-4 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Employee</th>
                                        {sundayDateColumns.map((d: Date, i: number) => (
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
                                        // 🆕 Duty count cells se: Present / ON-DUTY = 1, Half-Day = 0.5
                                        const computedDuty = sundayDateColumns.reduce((sum: number, d: Date) => {
                                            const cell = cells.find((c: any) => new Date(c.date || c.Date).toDateString() === d.toDateString());
                                            const st = String(cell?.status || cell?.Status || "").toUpperCase();
                                            if (st.startsWith("ON-DUTY") || st === "PRESENT") return sum + 1;
                                            if (st === "HALF-DAY") return sum + 0.5;
                                            return sum;
                                        }, 0);
                                        const backendDuty = Number(row.monthDutyCount ?? row.MonthDutyCount ?? 0);
                                        const dutyCount = Math.max(computedDuty, backendDuty);
                                        return (
                                            <tr key={row.empId ?? row.EmpId ?? idx} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-4 py-3 font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                                                    {empName}
                                                </td>
                                                {sundayDateColumns.map((d: Date, i: number) => {
                                                    const cell = cells.find((c: any) => new Date(c.date || c.Date).toDateString() === d.toDateString());
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
                                                <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 border-l border-slate-100">{dutyCount}</td>
                                                <td className="px-4 py-3 text-center font-mono font-bold text-amber-600 border-l border-slate-100">{row.monthCompOff ?? row.MonthCompOff ?? 0}</td>
                                                <td className="px-4 py-3 text-center font-mono font-semibold text-slate-500 border-l border-slate-100">{row.previousBalance ?? row.PreviousBalance ?? 0}</td>
                                                <td className="px-4 py-3 text-center font-mono font-black text-[#0b2836] border-l border-slate-100 bg-slate-50/50">{row.finalDues ?? row.FinalDues ?? 0}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {filteredSummaries.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-medium">
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : activeTab === "backDate" && isAdminLevel ? (
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Check In</th>
                                    <th className="px-6 py-4">Check Out</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Source</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {filteredBackDateLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium">
                                            {searchTerm ? "No matching records found" : "No back-date entries yet. Use \"Add Back Date Attendance\" above."}
                                        </td>
                                    </tr>
                                ) : pagedBackDateLogs.map((log) => (
                                    <tr key={log.attId} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {log.fullName || `EMP-${log.empId}`}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600">
                                            {new Date(log.attDate).toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-600">{log.checkIn || "--:--"}</td>
                                        <td className="px-6 py-4 font-mono font-medium text-slate-600">{log.checkOut || "--:--"}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={log.status} />
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold">
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500">{log.source}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => openEditModal(log)}
                                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                            >
                                                <i className="fa-solid fa-pen" /> Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : activeTab === "monthlyReport" && isAdminLevel ? (
                    // 🆕🆕 Monthly Attendance Report tab
                    <div className="flex-1 flex flex-col">
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                                        <th className="px-4 py-4 sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Employee</th>
                                        <th className="px-3 py-4 text-center text-emerald-600">Present</th>
                                        <th className="px-3 py-4 text-center">Half Days</th>
                                        <th className="px-3 py-4 text-center text-rose-600">Absent</th>
                                        <th className="px-3 py-4 text-center text-sky-600">Leave</th>
                                        <th className="px-3 py-4 text-center">Week Off</th>
                                        <th className="px-3 py-4 text-center text-violet-600">Holiday</th>
                                        <th className="px-3 py-4 text-center text-amber-600">Late</th>
                                        <th className="px-3 py-4 text-center border-l border-slate-200/50">Work Hrs</th>
                                        <th className="px-3 py-4 text-center">OT Hrs</th>
                                        <th className="px-3 py-4 text-center border-l border-slate-200/50">Sundays</th>
                                        <th className="px-3 py-4 text-center">Sun Hrs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {filteredMonthlyReport.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="px-6 py-16 text-center text-slate-400 font-medium">
                                                {searchTerm ? "No matching employees found" : "No report data found for this period"}
                                            </td>
                                        </tr>
                                    ) : pagedMonthlyReport.map((r: any) => (
                                        <tr key={r.empId} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-4 py-3 font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                                                {r.empName || `EMP-${r.empId}`}{" "}
                                                <span className="text-slate-400 font-normal text-xs">({r.empCode || "-"})</span>
                                            </td>
                                            <td className="px-3 py-3 text-center font-mono font-bold text-emerald-600 bg-emerald-50/30">{r.daysPresent}</td>
                                            <td className="px-3 py-3 text-center font-mono font-semibold text-slate-600">{r.halfDays}</td>
                                            <td className="px-3 py-3 text-center font-mono font-bold text-rose-600 bg-rose-50/30">{r.absentDays}</td>
                                            <td className="px-3 py-3 text-center font-mono font-semibold text-sky-600">{r.leaveDays}</td>
                                            <td className="px-3 py-3 text-center font-mono font-semibold text-slate-500">{r.weekOffDays}</td>
                                            <td className="px-3 py-3 text-center font-mono font-semibold text-violet-600">{r.holidayDays}</td>
                                            <td className="px-3 py-3 text-center font-mono font-bold text-amber-600 bg-amber-50/30">{r.lateCount}</td>
                                            <td className="px-3 py-3 text-center font-mono font-bold text-slate-700 border-l border-slate-100">{Number(r.totalWorkingHours).toFixed(2)}</td>
                                            <td className="px-3 py-3 text-center font-mono font-semibold text-slate-600">{Number(r.overtimeHours).toFixed(2)}</td>
                                            <td className="px-3 py-3 text-center font-mono font-bold text-slate-700 border-l border-slate-100">{r.sundaysWorked}</td>
                                            <td className="px-3 py-3 text-center font-mono font-semibold text-slate-600">{Number(r.sundayHours).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                                            {(() => {
                                                const status = punchMode === "out" ? checkoutLocationStatus : locationStatus;
                                                const loc = punchMode === "out" ? checkoutCapturedLocation : capturedLocation;
                                                if (status === "idle") return "Captured automatically";
                                                if (status === "fetching") return <span className="text-amber-500 animate-pulse flex items-center gap-1.5"><i className="fa-solid fa-location-crosshairs animate-spin" /> Fetching...</span>;
                                                if (status === "captured") return <span className="text-emerald-600 truncate px-1 flex items-center gap-1.5"><i className="fa-solid fa-location-dot" /> {loc.address ? loc.address : "Location Pinned"}</span>;
                                                if (status === "denied") return <span className="text-rose-500 flex items-center gap-1.5"><i className="fa-solid fa-location-dot" /> Unavailable</span>;
                                                return null;
                                            })()}
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
                            <h3 className="text-xl font-bold text-slate-900">Request Attendance Approval</h3>
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

            {/* Edit Attendance Modal (Admin Only) */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-[24px] p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold text-slate-900">Edit Attendance</h3>
                            <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>
                        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700">
                            {editForm.empName} — {editForm.attDate}
                        </div>
                        <form onSubmit={handleEditAttendance} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Check In</label>
                                    <input
                                        type="time"
                                        value={editForm.checkIn}
                                        onChange={e => setEditForm({ ...editForm, checkIn: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Check Out</label>
                                    <input
                                        type="time"
                                        value={editForm.checkOut}
                                        onChange={e => setEditForm({ ...editForm, checkOut: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Status</label>
                                <select
                                    value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all cursor-pointer shadow-sm"
                                >
                                    <option>Present</option><option>Absent</option><option>Half-Day</option><option>Holiday</option><option>Leave</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Remarks</label>
                                <textarea
                                    rows={2}
                                    value={editForm.remarks}
                                    onChange={e => setEditForm({ ...editForm, remarks: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all resize-none shadow-sm"
                                />
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-3 text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-3.5 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#0b2836]/20 disabled:opacity-60 transition-all hover:bg-[#0f3345]"
                                >
                                    {actionLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Back Date Attendance Modal (HR/Admin Only) */}
            {showBackDateModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-[24px] p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold text-slate-900">Add Back Date Attendance</h3>
                            <button onClick={() => setShowBackDateModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <form onSubmit={handleBackDateAttendance} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Employee *</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        required={!backDateForm.empId}
                                        value={backDateEmpSearchOpen ? backDateEmpSearchText : (() => {
                                            const sel = employees.find((emp) => String(emp.empId) === String(backDateForm.empId));
                                            return sel ? `${sel.firstName} ${sel.lastName} (${sel.empCode})` : "";
                                        })()}
                                        onFocus={() => { setBackDateEmpSearchOpen(true); setBackDateEmpSearchText(""); }}
                                        onChange={(e) => setBackDateEmpSearchText(e.target.value)}
                                        onBlur={() => setTimeout(() => setBackDateEmpSearchOpen(false), 200)}
                                        placeholder="-- Search Employee --"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-slate-50 focus:bg-white transition-all shadow-sm"
                                    />
                                    {backDateEmpSearchOpen && (
                                        <div className="absolute z-50 mt-2 w-full max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl">
                                            {(() => {
                                                const q = backDateEmpSearchText.trim().toLowerCase();
                                                const filtered = employees.filter((emp) => `${emp.firstName} ${emp.lastName} ${emp.empCode}`.toLowerCase().includes(q));
                                                if (filtered.length === 0) return <div className="px-4 py-3 text-sm text-slate-400 font-medium italic">No employees found</div>;
                                                return filtered.map((emp) => (
                                                    <div
                                                        key={emp.empId}
                                                        onMouseDown={() => {
                                                            setBackDateForm(prev => ({ ...prev, empId: emp.empId.toString() }));
                                                            setBackDateEmpSearchText("");
                                                            setBackDateEmpSearchOpen(false);
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

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Date * (past dates only)</label>
                                <input
                                    type="date"
                                    required
                                    max={getTodayDateStr()}
                                    value={backDateForm.attDate}
                                    onChange={e => setBackDateForm({ ...backDateForm, attDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Check In</label>
                                    <input
                                        type="time"
                                        value={backDateForm.checkIn}
                                        onChange={e => setBackDateForm({ ...backDateForm, checkIn: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Check Out</label>
                                    <input
                                        type="time"
                                        value={backDateForm.checkOut}
                                        onChange={e => setBackDateForm({ ...backDateForm, checkOut: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Status</label>
                                <select
                                    value={backDateForm.status}
                                    onChange={e => setBackDateForm({ ...backDateForm, status: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-bold focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all cursor-pointer shadow-sm"
                                >
                                    <option>Present</option><option>Absent</option><option>Half-Day</option><option>Holiday</option><option>Leave</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Remarks</label>
                                <textarea
                                    rows={2}
                                    placeholder="Reason for back-date entry..."
                                    value={backDateForm.remarks}
                                    onChange={e => setBackDateForm({ ...backDateForm, remarks: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 bg-white transition-all resize-none shadow-sm"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBackDateModal(false)}
                                    className="flex-1 py-3 text-xs font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-3.5 bg-[#0b2836] text-white font-bold rounded-xl text-sm shadow-lg shadow-[#0b2836]/20 disabled:opacity-60 transition-all hover:bg-[#0f3345]"
                                >
                                    {actionLoading ? "Saving..." : "Add Attendance"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}