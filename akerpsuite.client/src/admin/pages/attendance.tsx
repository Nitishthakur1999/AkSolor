import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";

export default function Attendance() {
    // ✅ Role check (Case insensitive)
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userRole = (() => {
        // 1) Try localStorage "user" object first (fast path, no decoding needed)
        const fromUserObj = user?.role || user?.Role || user?.userRole || user?.UserRole;
        if (fromUserObj) return String(fromUserObj).toUpperCase();

        // 2) Fall back to decoding the JWT token itself
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

    const isCMD = userRole === "CMD";
    // HR / Admin / CMD ko "admin-level" access — poori employee list, sab tabs
    const isAdminLevel = ["CMD", "ADMIN", "HR"].includes(userRole);
    // Manager — Employee jaisa hi base access (apni attendance khud punch karta hai),
    // lekin iske saath-saath apni team (direct reports) ki attendance/records bhi
    // dekh sakta hai. Poori employee list ya HR-level actions (approve/reject,
    // summary generate) manager ko nahi milte — sirf apni + team ki visibility.
    const isManager = userRole === "MANAGER";
    // isTeamLevel = "employee se zyada dikh sakta hai" (admin ko sabka, manager ko apni team ka)
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

    const [activeTab, setActiveTab] = useState(isCMD ? "dashboard" : "logs");

    // Search + Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [showMarkModal, setShowMarkModal] = useState(false);
    const [empSearchOpen, setEmpSearchOpen] = useState(false);
    const [empSearchText, setEmpSearchText] = useState("");
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [showRegModal, setShowRegModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Helper: today's date as yyyy-mm-dd (for <input type="date"> value + payload)
    const getTodayDateStr = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const dd = String(now.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    // Helper: current time as HH:mm (24hr) — used for punch in/out capture
    const getCurrentTimeStr = () => {
        const now = new Date();
        return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    };

    // Client-specified rule: Punch In by 9:05 AM = auto Present, no approval needed.
    const LATE_CUTOFF = "09:05";

    // Helper: kya diya gaya date Sunday hai? (getDay() === 0 → Sunday)

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
    // Regularization request form
    const [regForm, setRegForm] = useState({
        empId: "", attDate: "", requestedCheckIn: "", requestedCheckOut: "", reason: ""
    });

    // Employee role ko sirf apna naam dikhna chahiye dropdown mein;
    // HR/Admin/CMD ko poori list; Manager ko apni team (direct reports) + khud.
    // Team match kai possible field names try karta hai kyunki backend ka exact
    // naming pata nahi (managerId / ManagerId / reportingManagerId / ReportingManagerId).
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

    // Reset search + page whenever the tab changes, so a search typed on
    // one tab doesn't silently filter (or hide all rows on) another tab.
    useEffect(() => {
        setSearchTerm("");
        setCurrentPage(1);
    }, [activeTab]);

    // Reset to page 1 whenever the search term changes, otherwise you can
    // get stuck on page 4 of a search that now only has 1 page of results.
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        adminService.getEmployees().then(res => {
            if (res.Success || res.success) setEmployees(res.Data || res.data || []);
        });
    }, []);

    // Guard: agar Employee role ka user kisi tarah (stale state / direct
    // state manipulation) "summaries" tab pe pahunch jaaye,
    // to unhe turant "logs" tab pe wapas bhej do — sirf render-level check
    // kaafi nahi tha, kyunki loadAttendanceData() us tab ka data fetch bhi
    // kar deta tha. Ye effect data-fetch hone se pehle hi tab ko reset kar deta hai.
    // "sundayWorking" admin + manager dono dekh sakte hain, isliye uska guard
    // sirf un logon ke liye jo team-level bhi nahi hain.
    useEffect(() => {
        if (!isAdminLevel && activeTab === "summaries") {
            setActiveTab("logs");
        }
        if (!isTeamLevel && activeTab === "sundayWorking") {
            setActiveTab("logs");
        }
    }, [activeTab, isAdminLevel, isTeamLevel]);

    const loadAttendanceData = async () => {
        // Non-admin users ke liye summaries data load hi mat karo —
        // upar wala guard tab ko turant reset kar dega, lekin ye extra safety hai
        // taaki galti se bhi ek network call na jaaye jiska access nahi hai.
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
            } else if (activeTab === "logs" || activeTab === "sundayWorking") {
                // "sundayWorking" tab isi attendanceLogs data se derive hota hai
                // (Date.getDay() === 0 wale records) — alag endpoint ki zaroorat nahi.
                const res = await adminService.getAttendanceAll();
                if (res.Success || res.success) setAttendanceLogs(res.Data || res.data || []);
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

    // Aaj (attDate === today) ke liye is empId ka attendance record already
    // maujood hai ya nahi — isi se decide hota hai ki modal me Punch In dikhana
    // hai ya Punch Out. getAttendanceAll() poori list deta hai, usme se aaj +
    // empId match karke dhoondte hain (koi alag "today's status" endpoint
    // nahi hai, isliye existing data hi reuse kar rahe hain).
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
                // Record hai lekin checkIn khaali (e.g. Absent/Leave/Holiday manually mark
                // kiya gaya tha) — Punch In abhi bhi allow karo.
                setTodaysRecord(rec);
                setPunchMode("in");
            }
        } catch (err) {
            console.error("Failed to check today's attendance status:", err);
            // Fail-open: check fail ho jaaye to bhi Punch In allow karo, form block mat karo.
            setTodaysRecord(null);
            setPunchMode("in");
        }
    };

    // Modal openers — Employee role ka empId auto-select ho jaata hai,
    // admin-level users ke liye dropdown khaali khulta hai (unhe choose karna hota hai)
    const openMarkModal = () => {
        // Guard: Employee role ka user agar apne employee-record se link hi nahi hai
        // (loggedInEmpId 0 reh gaya — token claim missing/mismatch), to modal khulne se
        // pehle hi clear message do, silently empId:0 submit hone se better hai.
        if (!isAdminLevel && loggedInEmpId <= 0) {
            alert("Your account is not linked to an employee record, so you can't mark attendance. Please contact HR/Admin.");
            return;
        }
        // Fresh state har baar modal khulne par — date aaj ki, punch times/location clear
        // Mark Attendance sirf khud ke liye — Manager ho ya Employee, dono apni hi
        // attendance punch karte hain (team ke liye punch karna admin-level ka kaam hai).
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
        // Employee role ke liye empId turant maloom hai, to abhi hi punch-mode check kar lo.
        // Admin-level ke liye employee dropdown khaali khulta hai — jab tak koi select na
        // kare, punchMode null rehta hai (form neeche khud-ba-khud hidden rahega).
        if (!isAdminLevel) {
            determinePunchMode(loggedInEmpId);
        } else {
            setPunchMode(null);
        }
        setShowMarkModal(true);
    };

    // Admin-level user ne employee dropdown me koi employee select/change kiya —
    // uske liye bhi aaj ka punch-status turant check karo.
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

    // Regularization request modal — Employee apni khud ki date ke liye
    // request karega; admin-level bhi kisi ke liye submit kar sakta hai.
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

    // Lat/long se readable address nikalta hai (OpenStreetMap Nominatim — free, no key)
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

    // Browser se current GPS location capture karta hai + address resolve karta hai.
    // Agar permission deny ho jaaye ya browser support na kare, toh null return karta hai —
    // attendance marking block nahi hoti, location bas save nahi hoti.
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

    const [locationStatus, setLocationStatus] = useState("idle"); // idle | fetching | captured | denied
    const [capturedLocation, setCapturedLocation] = useState({ latitude: null, longitude: null, address: null });

    // punchMode drives what the Mark Attendance modal shows:
    // null = admin hasn't picked an employee yet | "checking" = looking up today's record |
    // "in" = no record yet today, show Punch In | "out" = checked in, not out yet, show Punch Out |
    // "done" = both already done today, show a message instead of the form
    const [punchMode, setPunchMode] = useState(null);
    const [todaysRecord, setTodaysRecord] = useState(null);

    // Jab punchMode "out" ban jaata hai (matlab aaj subah ka Punch In record
    // mil gaya), uska checkIn time form me dikhane ke liye sync kar do —
    // display ke liye hi hai, submit ke waqt original todaysRecord.checkIn
    // hi payload me jaayega (raw format preserve karne ke liye).
    useEffect(() => {
        if (punchMode === "out" && todaysRecord) {
            setMarkForm(prev => ({
                ...prev,
                checkIn: (todaysRecord.checkIn || "").slice(0, 5),
                status: todaysRecord.status || prev.status
            }));
        }
    }, [punchMode, todaysRecord]);

    // Punch In — sirf tab chalta hai jab punchMode "in" ho (matlab aaj ka koi
    // record nahi mila). Current time ko checkIn me capture karta hai + turant
    // location fetch karna shuru kar deta hai (taaki submit se pehle hi
    // location dikh jaaye). Status bhi "Present" set kar deta hai.
    const handlePunchIn = () => {
        const time = getCurrentTimeStr();
        setMarkForm(prev => ({ ...prev, checkIn: time, status: "Present" }));
        if (locationStatus === "idle" || locationStatus === "denied") {
            getCurrentLocation();
        }
    };

    // Punch Out — sirf tab chalta hai jab punchMode "out" ho (matlab subah
    // Punch In already ho chuka hai). Current time ko checkOut me capture karta hai.
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

        // Ab check-in/check-out manually type nahi hote — Punch In/Punch Out
        // buttons se hi aate hain. Har mode me sirf uska apna punch zaroori hai
        // (sirf Absent/Leave/Holiday jaise no-punch statuses ke liye chhod diya gaya hai).
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
            // Agar location punch ke waqt already capture ho chuki hai to usi ko reuse karo,
            // warna (denied ho gayi thi ya kisi wajah se miss ho gayi) submit se pehle ek aakhri try.
            const { latitude, longitude, address } =
                locationStatus === "captured" ? capturedLocation : await getCurrentLocation();

            // Punch Out mode me subah wala checkIn raw format me (jaisa backend se aaya tha)
            // wapas bhejo — display ke liye truncate kiya gaya HH:mm nahi. Isi empId+attDate
            // ke record ko backend match karke update karega (naya row insert nahi hoga).
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
                // Client rule: agar Punch In cutoff (9:05 AM) ke baad hua hai, to attendance
                // record ke saath-saath ek regularization request bhi khud-ba-khud ban jaani
                // chahiye taaki HR use "Regularization Requests" tab me Approve/Reject kar sake.
                // Ye poori tarah frontend se hi handle ho raha hai — koi backend change nahi.
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
                        // Attendance khud successfully mark ho chuki hai — regularization
                        // request banane me koi glitch aaye to bhi user ko block mat karo,
                        // bas console me log kar do taaki HR ko manually pata chal sake agar zaroorat pade.
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

    // Guard: sirf admin-level roles hi regularization request approve/reject
    // kar sakte hain. Buttons already UI mein isAdminLevel se hidden hain
    // (Employee dekh hi nahi payega), lekin ye function-level check double-safety
    // hai — agar kabhi is function ko kisi aur jagah se bhi call kiya jaaye.
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

    // Late-attendance approval action — Attendance Logs tab se seedha approve/reject.
    // Yeh "Regularization Requests" tab wale handleRegAction se alag hai — wahan wale
    // requests employee khud manually banata hai, jabki yeh late_minutes se auto-detect
    // hokar backend ne khud attendance_requests table me daali hoti hain.
    const handleLateApprovalAction = async (requestId, statusAction) => {
        if (!isAdminLevel) {
            alert("You don't have permission to approve or reject attendance.");
            return;
        }
        try {
            const approvedBy = user?.userId ?? user?.UserId ?? 1;
            const res = await adminService.updateRegStatus(requestId, statusAction, approvedBy);
            if (res.Success || res.success) {
                // List refresh — updated approvalStatus backend se dobara fetch hoga
                loadAttendanceData();
            } else {
                alert(res.Message || "Failed to update approval.");
            }
        } catch (err) {
            console.error("Late approval action error:", err);
            alert(err?.message || "Something went wrong while updating approval.");
        }
    };

    // Submit a new regularization request (available to Employee + admin-level)
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
                // Backend throws for invalid month/year (e.g. year > current year) —
                // this was silently failing with no feedback before.
                alert(res.Message || "Failed to generate summary.");
            }
        } catch (err) {
            console.error("Generate summary error:", err);
            alert(err?.message || "Something went wrong while generating the summary.");
        } finally {
            setActionLoading(false);
        }
    };

    // Monthly Summary tab sirf HR/Admin/CMD ko dikhta hai — Employee/Manager role ko nahi.
    // Sunday Working — HR/Admin/CMD + Manager, dono ko dikhta hai (manager apni team
    // ki Sunday working dekh sakta hai, poori company ki nahi).
    const tabsList = [
        ...(isCMD ? [{ key: "dashboard", label: "Executive Dashboard" }] : []),
        { key: "logs", label: "Attendance Logs" },
        { key: "requests", label: "Regularization Requests" },
        ...(isTeamLevel ? [{ key: "sundayWorking", label: "Sunday Working" }] : []),
        ...(isAdminLevel ? [{ key: "summaries", label: "Monthly Summary" }] : [])
    ];

    // Search + Pagination helpers
    // Client-side filter: checks the search term against a list of fields on
    // each row (case-insensitive substring match). Empty search = show all.
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

    // Employee role ko sirf apna hi data dikhna chahiye — HR/Admin/CMD ko sabka,
    // Manager ko apni + apni team (direct reports) ka.
    // Note: backend abhi bhi poora list bhejta hai Employee/Manager ko bhi (endpoint
    // access khula hai), isliye ye sirf UI-level filter hai. Asli fix backend
    // service-layer mein empId/team-scoping hai — wo bina iske bhi network response
    // mein poora data expose karta rahega.
    const scopeToEmployee = (list) => {
        if (isAdminLevel) return list;
        if (isManager) {
            const teamIds = new Set(selectableEmployees.map((e) => Number(e.empId)));
            return list.filter((row) => teamIds.has(Number(row.empId)));
        }
        return list.filter((row) => Number(row.empId) === loggedInEmpId);
    };

    // Field lists to search against, per tab
    const filteredLogs = filterBySearch(scopeToEmployee(attendanceLogs), ["fullName", "status", "source"]);
    const filteredRequests = filterBySearch(scopeToEmployee(regRequests), ["fullName", "reason", "status"]);
    const filteredSummaries = filterBySearch(scopeToEmployee(summaries), ["fullName"]);

    // Sunday Working — attendanceLogs me se sirf wo records jinka attDate Sunday
    // hai AUR jisme actually punch (checkIn) hua hai — sirf date Sunday hone se
    // record nahi bante, kaam karna zaroori hai.
    const sundayWorkingRaw = attendanceLogs.filter((log) => isSunday(log.attDate) && log.checkIn);
    const filteredSundayWorking = filterBySearch(scopeToEmployee(sundayWorkingRaw), ["fullName", "status", "source"]);

    const pagedLogs = paginate(filteredLogs);
    const pagedRequests = paginate(filteredRequests);
    const pagedSummaries = paginate(filteredSummaries);
    const pagedSundayWorking = paginate(filteredSundayWorking);

    // Total count + total pages for whichever tab is active — drives the
    // search placeholder and the pagination controls below the table.
    const activeListMeta = {
        logs: { total: filteredLogs.length, placeholder: "Search by employee, status, or source..." },
        requests: { total: filteredRequests.length, placeholder: "Search by employee, reason, or status..." },
        summaries: { total: filteredSummaries.length, placeholder: "Search by employee name..." },
        sundayWorking: { total: filteredSundayWorking.length, placeholder: "Search by employee name..." },
    }[activeTab];

    const totalPages = activeListMeta ? Math.max(1, Math.ceil(activeListMeta.total / ITEMS_PER_PAGE)) : 1;

    // Small reusable pagination control, rendered under whichever table is active
    const PaginationBar = () => {
        if (!activeListMeta || activeListMeta.total === 0) return null;
        const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
        const end = Math.min(currentPage * ITEMS_PER_PAGE, activeListMeta.total);
        return (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-6 py-4 border-t border-slate-100 text-xs text-slate-500">
                <span>
                    Showing <span className="font-bold text-slate-700">{start}-{end}</span> of{" "}
                    <span className="font-bold text-slate-700">{activeListMeta.total}</span>
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg border font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                        Prev
                    </button>
                    <span className="px-2 font-bold text-slate-700">
                        Page {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg border font-bold text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    // Search bar, shown above the table for any non-dashboard tab
    const SearchBar = () => {
        if (!activeListMeta) return null;
        return (
            <div className="px-6 pt-5 pb-1">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={activeListMeta.placeholder}
                    className="w-full max-w-sm px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Attendance Management</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Track attendance, manage regularization requests, and generate monthly summaries.</p>
                </div>
                {!isCMD && (
                    <div className="flex flex-wrap gap-2">
                        <button onClick={openMarkModal} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all">
                            Mark Attendance
                        </button>
                        {/* Request Regularization — sab roles ko dikhta hai (Employee apni date ke liye, admin kisi ke liye) */}
                        <button onClick={openRegModal} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border transition-all">
                            Request Regularization
                        </button>
                        {/* Generate Summary button sirf HR/Admin ko dikhta hai — Employee/Manager role ko nahi */}
                        {isAdminLevel && (
                            <button onClick={openSummaryModal} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border transition-all">
                                Generate Summary
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                {tabsList.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-4 border-b-2 focus:outline-none ${activeTab === tab.key
                            ? "border-amber-600 text-amber-600 font-extrabold"
                            : "border-transparent hover:text-slate-700"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table Area */}
            <div className="bg-white border border-slate-200 border-t-0 rounded-b-2xl overflow-hidden shadow-sm min-h-[300px]">
                {/* Search bar (hidden on dashboard tab, and while loading) */}
                {!loading && <SearchBar />}
                {loading ? (
                    <div className="p-12 text-center text-sm font-semibold text-amber-600 animate-pulse">
                        Loading...
                    </div>
                ) : activeTab === "dashboard" && isCMD ? (
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Today's Overview</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 shadow-sm">
                                <p className="text-xs text-slate-500 font-bold uppercase">Total Employees</p>
                                <p className="text-2xl font-black text-slate-800">{dashboardStats?.totalEmployees || 0}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50 shadow-sm">
                                <p className="text-xs text-emerald-600 font-bold uppercase">Present Today</p>
                                <p className="text-2xl font-black text-emerald-700">{dashboardStats?.presentToday || 0}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-rose-100 bg-rose-50 shadow-sm">
                                <p className="text-xs text-rose-600 font-bold uppercase">Absent Today</p>
                                <p className="text-2xl font-black text-rose-700">{dashboardStats?.absentToday || 0}</p>
                            </div>
                            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50 shadow-sm">
                                <p className="text-xs text-amber-600 font-bold uppercase">Late Arrivals</p>
                                <p className="text-2xl font-black text-amber-700">{dashboardStats?.lateToday || 0}</p>
                            </div>
                        </div>
                        <div className="p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                            More executive charts and trends will appear here...
                        </div>
                    </div>
                ) : activeTab === "logs" ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b">
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
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            {searchTerm ? "No matching attendance records found" : "No attendance records found"}
                                        </td>
                                    </tr>
                                ) : pagedLogs.map((log) => (
                                    <tr key={log.attId} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {log.fullName || `EMP-${log.empId}`}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <span>{new Date(log.attDate).toLocaleDateString()}</span>
                                                {/* Sunday ko punch kiya gaya record — employee ko khud apne
                                                    log me dikhega ki aaj usne Sunday working ki hai, aur yehi
                                                    record HR/Manager ke "Sunday Working" tab me bhi alag se aayega. */}
                                                {isSunday(log.attDate) && log.checkIn && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 whitespace-nowrap">
                                                        Sunday Working
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{log.checkIn || "--:--"}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{log.checkOut || "--:--"}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500 max-w-[220px] truncate" title={log.locationAddress || ""}>
                                            {log.locationAddress
                                                ? log.locationAddress
                                                : log.latitude && log.longitude
                                                    ? `${Number(log.latitude).toFixed(5)}, ${Number(log.longitude).toFixed(5)}`
                                                    : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${log.status === "Present" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        {/* Approval badge — sirf late attendance ke liye dikhta hai
                                            (backend se aane wala approvalStatus: "Pending Approval" |
                                            "Approved" | "Rejected" | null).
                                            HR/Admin/CMD ko Pending state me seedha Approve/Reject buttons
                                            dikhte hain; Employee/Manager ko sirf read-only badge. */}
                                        <td className="px-6 py-4">
                                            {log.approvalStatus === "Pending Approval" ? (
                                                isAdminLevel ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => handleLateApprovalAction(log.approvalRequestId, "Approved")}
                                                            className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleLateApprovalAction(log.approvalRequestId, "Rejected")}
                                                            className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                        Pending Approval
                                                    </span>
                                                )
                                            ) : log.approvalStatus === "Approved" ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Approved
                                                </span>
                                            ) : log.approvalStatus === "Rejected" ? (
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                    Rejected
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 border text-slate-500">{log.source}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : activeTab === "requests" ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Requested Date</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {filteredRequests.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            {searchTerm ? "No matching requests found" : "No regularization requests found"}
                                        </td>
                                    </tr>
                                ) : pagedRequests.map((req) => (
                                    <tr key={req.requestId} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-semibold text-slate-900">{req.fullName || `EMP-${req.empId}`}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(req.requestDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{req.reason}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${req.status === "Approved" ? "bg-emerald-50 text-emerald-700" : req.status === "Pending" ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        {/* Approve/Reject sirf HR/Admin/CMD ko dikhte hain.
                                            Employee/Manager ko apni team ki request pe status ke alawa kuch
                                            control nahi milna chahiye */}
                                        <td className="px-6 py-4 text-center space-x-2">
                                            {req.status === "Pending" && isAdminLevel ? (
                                                <>
                                                    <button onClick={() => handleRegAction(req.requestId, "Approved")} className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 hover:bg-emerald-100">Approve</button>
                                                    <button onClick={() => handleRegAction(req.requestId, "Rejected")} className="px-2 py-1 rounded bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100">Reject</button>
                                                </>
                                            ) : req.status === "Pending" ? (
                                                <span className="text-xs text-amber-500 italic">Awaiting HR review</span>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Done</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : activeTab === "sundayWorking" && isTeamLevel ? (
                    // Sunday Working — HR/Admin/CMD ko poori company ki, Manager ko sirf apni
                    // team ki (scopeToEmployee upar hi is filtering ko handle kar chuka hai).
                    // Yahan sirf wo attendance records aate hain jo Sunday (off-day) ko punch hue hain.
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Check In</th>
                                    <th className="px-6 py-4">Check Out</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {filteredSundayWorking.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            {searchTerm ? "No matching Sunday working records found" : "No one has worked on a Sunday yet"}
                                        </td>
                                    </tr>
                                ) : pagedSundayWorking.map((log) => (
                                    <tr key={log.attId} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-semibold text-slate-900">
                                            {log.fullName || `EMP-${log.empId}`}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <span>{new Date(log.attDate).toLocaleDateString()}</span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200 whitespace-nowrap">
                                                    Sunday
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{log.checkIn || "--:--"}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{log.checkOut || "--:--"}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500 max-w-[220px] truncate" title={log.locationAddress || ""}>
                                            {log.locationAddress
                                                ? log.locationAddress
                                                : log.latitude && log.longitude
                                                    ? `${Number(log.latitude).toFixed(5)}, ${Number(log.longitude).toFixed(5)}`
                                                    : <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${log.status === "Present" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : activeTab === "summaries" && isAdminLevel ? (
                    // Monthly Summary — sirf isAdminLevel true hone par render hota hai
                    // (tab list se bhi hidden hai Employee/Manager role ke liye, ye double-safety hai)
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b">
                                    <th className="px-6 py-4">Employee</th>
                                    <th className="px-6 py-4">Period</th>
                                    <th className="px-6 py-4">Working Days</th>
                                    <th className="px-6 py-4 text-emerald-600">Present</th>
                                    <th className="px-6 py-4 text-rose-600">Absent</th>
                                    <th className="px-6 py-4 text-amber-600">Late Marks</th>
                                    <th className="px-6 py-4">Overtime</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                {filteredSummaries.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                                            {searchTerm ? "No matching summaries found" : "No summaries found. Generate one using the button above."}
                                        </td>
                                    </tr>
                                ) : pagedSummaries.map((sum) => (
                                    <tr key={sum.summaryId} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4 font-semibold text-slate-900">{sum.fullName || `EMP-${sum.empId}`}</td>
                                        <td className="px-6 py-4 text-slate-500">{sum.month}/{sum.year}</td>
                                        <td className="px-6 py-4 font-mono font-bold">{sum.totalWorkingDays}</td>
                                        <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{sum.presentDays}</td>
                                        <td className="px-6 py-4 font-mono text-rose-600 font-bold">{sum.absentDays}</td>
                                        <td className="px-6 py-4 font-mono text-amber-600 font-bold">{sum.lateMarks}</td>
                                        <td className="px-6 py-4 font-mono text-amber-600 font-bold">{sum.overtimeHours} hrs</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : (
                    // Fallback — agar Employee/Manager role ka user kisi tarah "summaries"
                    // tab pe pahunch jaye (e.g. stale state), to unhe access-denied dikhao empty
                    // table ki jagah
                    <div className="p-12 text-center text-slate-400 text-sm">
                        You don't have access to this section.
                    </div>
                )}
            </div>

            {/* Modal: Mark Attendance */}
            {showMarkModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Mark Attendance</h3>
                            <button
                                onClick={() => setShowMarkModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl font-bold transition-colors"
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee *</label>
                            {isAdminLevel ? (
                                <div className="relative">
                                    <input
                                        type="text"
                                        required={!markForm.empId}
                                        value={
                                            empSearchOpen
                                                ? empSearchText
                                                : (() => {
                                                    const sel = selectableEmployees.find((emp) => String(emp.empId) === String(markForm.empId));
                                                    return sel ? `${sel.firstName} ${sel.lastName} (${sel.empCode})` : "";
                                                })()
                                        }
                                        onFocus={() => { setEmpSearchOpen(true); setEmpSearchText(""); }}
                                        onChange={(e) => setEmpSearchText(e.target.value)}
                                        onBlur={() => setTimeout(() => setEmpSearchOpen(false), 150)}
                                        placeholder="-- Select Employee --"
                                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                                    />
                                    {empSearchOpen && (
                                        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white border rounded-xl shadow-lg">
                                            {(() => {
                                                const q = empSearchText.trim().toLowerCase();
                                                const filtered = selectableEmployees.filter((emp) =>
                                                    `${emp.firstName} ${emp.lastName} ${emp.empCode}`.toLowerCase().includes(q)
                                                );
                                                if (filtered.length === 0) {
                                                    return <div className="px-3 py-2 text-sm text-slate-400">No employees found</div>;
                                                }
                                                return filtered.map((emp) => (
                                                    <div
                                                        key={emp.empId}
                                                        onMouseDown={() => {
                                                            handleMarkEmployeeChange(emp.empId.toString());
                                                            setEmpSearchText("");
                                                            setEmpSearchOpen(false);
                                                        }}
                                                        className="px-3 py-2 text-sm hover:bg-amber-50 cursor-pointer"
                                                    >
                                                        {emp.firstName} {emp.lastName} ({emp.empCode})
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Employee/Manager role — dropdown ki jagah apna khud ka naam read-only
                                // dikhado. Manager bhi sirf apni hi attendance punch karta hai; team
                                // members ki attendance sirf "view" ke liye hai, punch karne ke liye nahi.
                                <input
                                    type="text"
                                    disabled
                                    value={
                                        employees.find((emp) => emp.empId === loggedInEmpId)
                                            ? (() => {
                                                const self = employees.find((emp) => emp.empId === loggedInEmpId);
                                                return `${self.firstName} ${self.lastName} (${self.empCode})`;
                                            })()
                                            : "You"
                                    }
                                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 text-slate-500"
                                />
                            )}
                        </div>

                        {/* Admin ne abhi tak employee select nahi kiya — form hidden rehta hai
                            jab tak koi employee choose na ho, warna galat empId pe punch lag sakta hai */}
                        {isAdminLevel && punchMode === null ? (
                            <div className="p-6 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                Select an employee to continue
                            </div>
                        ) : punchMode === "checking" ? (
                            <div className="p-6 text-center text-sm text-amber-600 animate-pulse">
                                Checking today's attendance status...
                            </div>
                        ) : punchMode === "done" ? (
                            // Aaj ke liye Punch In + Punch Out dono ho chuke hain — dobara punch
                            // ki zaroorat nahi, form ki jagah sirf summary dikhado
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 space-y-1">
                                <p className="font-bold">Attendance already marked for today ✅</p>
                                <p className="text-xs">
                                    Punch In: {(todaysRecord?.checkIn || "").slice(0, 5) || "--:--"} · Punch Out: {(todaysRecord?.checkOut || "").slice(0, 5) || "--:--"}
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleMarkAttendance} className="space-y-4">
                                {/* Aaj Sunday hai — user ko batado ki ye off-day working ke tor
                                    par record hoga aur HR/Manager ko "Sunday Working" tab me dikhega. */}
                                {isSunday(markForm.attDate) && (
                                    <div className="px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 text-xs text-violet-700 font-semibold">
                                        📅 Aaj Sunday hai — ye attendance "Sunday Working" ke tor par HR ko alag se dikhayi jayegi.
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                                    {/* Date ab manual pick nahi hoti — hamesha aaj ki date auto-fill
                                        hoti hai (read-only), taaki koi purani/future date galti se select na ho jaaye. */}
                                    <input
                                        type="date"
                                        disabled
                                        value={markForm.attDate}
                                        className="w-full px-3 py-2 rounded-xl border text-sm bg-slate-50 text-slate-500"
                                    />
                                </div>

                                {/* Punch In / Punch Out — manual time-type ki jagah ab ek tap se
                                    current system time capture hoti hai. Sirf ek hi button active
                                    hota hai ek waqt me:
                                    - punchMode "in"  → sirf Punch In tap kiya ja sakta hai (Punch Out disabled — subah abhi punch-in hi nahi hua)
                                    - punchMode "out" → Punch In already ho chuka (read-only ✅), sirf Punch Out tap kiya ja sakta hai */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Punch In</label>
                                        <button
                                            type="button"
                                            onClick={handlePunchIn}
                                            disabled={punchMode !== "in" || !!markForm.checkIn}
                                            className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${markForm.checkIn
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                : "bg-white hover:bg-slate-50 text-slate-700"}`}
                                        >
                                            {markForm.checkIn ? `✅ ${markForm.checkIn}` : "Punch In"}
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Punch Out</label>
                                        <button
                                            type="button"
                                            onClick={handlePunchOut}
                                            disabled={punchMode !== "out" || !!markForm.checkOut}
                                            className={`w-full px-3 py-2.5 rounded-xl border text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${markForm.checkOut
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                : "bg-white hover:bg-slate-50 text-slate-700"}`}
                                        >
                                            {markForm.checkOut ? `✅ ${markForm.checkOut}` : "Punch Out"}
                                        </button>
                                    </div>
                                </div>
                                {punchMode === "in" && (
                                    <p className="text-xs text-slate-400 -mt-2">Punch Out tap karne ke liye pehle Punch In karo, phir dobara Mark Attendance kholo shaam ko.</p>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select value={markForm.status}
                                        onChange={e => setMarkForm({ ...markForm, status: e.target.value })}
                                        disabled={punchMode === "out"}
                                        className="w-full px-3 py-2 rounded-xl border text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500">
                                        <option>Present</option>
                                        <option>Absent</option>
                                        <option>Half-Day</option>
                                        <option>Holiday</option>
                                        <option>Leave</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                                    <div className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 text-slate-500 flex items-center gap-2 overflow-hidden">
                                        {locationStatus === "idle" && (
                                            <span> Location will be captured automatically on Punch {punchMode === "out" ? "Out" : "In"}</span>
                                        )}
                                        {locationStatus === "fetching" && (
                                            <span className="text-amber-500 animate-pulse"> Getting your location...</span>
                                        )}
                                        {locationStatus === "captured" && (
                                            <span className="text-emerald-600 font-medium truncate">
                                                📍 {capturedLocation.address
                                                    ? capturedLocation.address
                                                    : `${capturedLocation.latitude?.toFixed(5)}, ${capturedLocation.longitude?.toFixed(5)}`}
                                            </span>
                                        )}
                                        {locationStatus === "denied" && (
                                            <span className="text-amber-600"> Location unavailable — attendance will still be marked</span>
                                        )}
                                    </div>
                                </div>

                                <button type="submit" disabled={actionLoading}
                                    className="w-full py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-60 transition-opacity">
                                    {actionLoading ? "Saving..." : punchMode === "out" ? "Confirm Punch Out" : "Mark Attendance"}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Request Regularization — sab roles ko available (Employee apni date ke liye, admin kisi ke liye) */}
            {showRegModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Request Regularization</h3>
                            <button
                                onClick={() => setShowRegModal(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl font-bold transition-colors"
                                aria-label="Close modal"
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateRegRequest} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee *</label>
                                {isAdminLevel ? (
                                    <select
                                        required
                                        value={regForm.empId}
                                        onChange={(e) => setRegForm({ ...regForm, empId: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                                    >
                                        <option value="" disabled>-- Select Employee --</option>
                                        {selectableEmployees.map((emp) => (
                                            <option key={emp.empId} value={emp.empId}>
                                                {emp.firstName} {emp.lastName} ({emp.empCode})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        disabled
                                        value={
                                            employees.find((emp) => emp.empId === loggedInEmpId)
                                                ? (() => {
                                                    const self = employees.find((emp) => emp.empId === loggedInEmpId);
                                                    return `${self.firstName} ${self.lastName} (${self.empCode})`;
                                                })()
                                                : "You"
                                        }
                                        className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 text-slate-500"
                                    />
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date *</label>
                                <input type="date" required value={regForm.attDate}
                                    onChange={e => setRegForm({ ...regForm, attDate: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Requested Check In</label>
                                    <input type="time" value={regForm.requestedCheckIn}
                                        onChange={e => setRegForm({ ...regForm, requestedCheckIn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Requested Check Out</label>
                                    <input type="time" value={regForm.requestedCheckOut}
                                        onChange={e => setRegForm({ ...regForm, requestedCheckOut: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason *</label>
                                <input type="text" required placeholder="Reason for regularization" value={regForm.reason}
                                    onChange={e => setRegForm({ ...regForm, reason: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border text-sm" />
                            </div>
                            <button type="submit" disabled={actionLoading}
                                className="w-full py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-60 transition-opacity">
                                {actionLoading ? "Submitting..." : "Submit Request"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Generate Summary — sirf HR/Admin/CMD ke liye render hoga (button khud hi non-admin ko nahi dikhta) */}
            {showSummaryModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Generate Monthly Summary</h3>
                            <button onClick={() => setShowSummaryModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xl font-bold">×</button>
                        </div>
                        <form onSubmit={handleGenerateSummary} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee *</label>
                                <select
                                    required
                                    value={summaryForm.empId}
                                    onChange={(e) => setSummaryForm({ ...summaryForm, empId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                                >
                                    <option value="" disabled>-- Select Employee --</option>
                                    {selectableEmployees.map((emp) => (
                                        <option key={emp.empId} value={emp.empId}>
                                            {emp.firstName} {emp.lastName} ({emp.empCode})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Month *</label>
                                    <input type="number" required min="1" max="12" value={summaryForm.month}
                                        onChange={e => setSummaryForm({ ...summaryForm, month: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year *</label>

                                    <input type="number" required min="2020" max={new Date().getFullYear()} value={summaryForm.year}
                                        onChange={e => setSummaryForm({ ...summaryForm, year: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                            </div>
                            <button type="submit" disabled={actionLoading}
                                className="w-full py-2.5 bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-60">
                                {actionLoading ? "Generating..." : "Generate Summary"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}