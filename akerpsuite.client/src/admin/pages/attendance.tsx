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
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [showRegModal, setShowRegModal] = useState(false); // Regularization request modal
    const [actionLoading, setActionLoading] = useState(false);

    const [markForm, setMarkForm] = useState({
        empId: "", attDate: "", checkIn: "", checkOut: "", status: "Present", remarks: ""
    });
    const [summaryForm, setSummaryForm] = useState<{ empId: string; month: string | number; year: string | number }>({
        empId: "", month: new Date().getMonth() + 1, year: new Date().getFullYear()
    });
    // Regularization request form
    const [regForm, setRegForm] = useState({
        empId: "", attDate: "", requestedCheckIn: "", requestedCheckOut: "", reason: ""
    });

    // Employee role ko sirf apna naam dikhna chahiye dropdown mein;
    // HR/Admin/CMD ko poori list.
    const selectableEmployees = isAdminLevel
        ? employees
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
    useEffect(() => {
        if (!isAdminLevel && activeTab === "summaries") {
            setActiveTab("logs");
        }
    }, [activeTab, isAdminLevel]);

    const loadAttendanceData = async () => {
        // Non-admin users ke liye summaries data load hi mat karo —
        // upar wala guard tab ko turant reset kar dega, lekin ye extra safety hai
        // taaki galti se bhi ek network call na jaaye jiska access nahi hai.
        if (!isAdminLevel && activeTab === "summaries") {
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
        setMarkForm(prev => ({
            ...prev,
            empId: isAdminLevel ? "" : loggedInEmpId.toString()
        }));
        setShowMarkModal(true);
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

    const handleMarkAttendance = async (e) => {
        e.preventDefault();

        // Basic sanity check: checkout should not be before checkin (same-day shift).
        if (markForm.checkIn && markForm.checkOut && markForm.checkOut < markForm.checkIn) {
            alert("Check-out time can't be before check-in time.");
            return;
        }

        setActionLoading(true);
        try {
            // Attendance submit hone se pehle current location + address capture karo
            const { latitude, longitude, address } = await getCurrentLocation();

            const payload = {
                empId: parseInt(markForm.empId, 10),
                attDate: markForm.attDate ? `${markForm.attDate}T00:00:00` : null,
                checkIn: markForm.checkIn ? markForm.checkIn + ":00" : null,
                checkOut: markForm.checkOut ? markForm.checkOut + ":00" : null,
                status: markForm.status,
                source: "Manual",
                remarks: markForm.remarks,
                createdBy: user?.userId ?? user?.UserId ?? 1,
                latitude,
                longitude,
                locationAddress: address,
            };

            const res = await adminService.markAttendance(payload);
            if (res.Success || res.success) {
                setShowMarkModal(false);
                setMarkForm({ empId: "", attDate: "", checkIn: "", checkOut: "", status: "Present", remarks: "" });
                setLocationStatus("idle");
                setCapturedLocation({ latitude: null, longitude: null, address: null });
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

    // Monthly Summary tab sirf HR/Admin/CMD ko dikhta hai — Employee role ko nahi
    const tabsList = [
        ...(isCMD ? [{ key: "dashboard", label: "Executive Dashboard" }] : []),
        { key: "logs", label: "Attendance Logs" },
        { key: "requests", label: "Regularization Requests" },
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

    // Employee role ko sirf apna hi data dikhna chahiye — HR/Admin/CMD ko sabka.
    // Note: backend abhi bhi poora list bhejta hai Employee ko bhi (endpoint access
    // khula hai), isliye ye sirf UI-level filter hai. Asli fix backend service-layer
    // mein empId-scoping hai — wo bina iske bhi network response mein poora data
    // expose karta rahega.
    const scopeToEmployee = (list) =>
        isAdminLevel ? list : list.filter((row) => Number(row.empId) === loggedInEmpId);

    // Field lists to search against, per tab
    const filteredLogs = filterBySearch(scopeToEmployee(attendanceLogs), ["fullName", "status", "source"]);
    const filteredRequests = filterBySearch(scopeToEmployee(regRequests), ["fullName", "reason", "status"]);
    const filteredSummaries = filterBySearch(scopeToEmployee(summaries), ["fullName"]);

    const pagedLogs = paginate(filteredLogs);
    const pagedRequests = paginate(filteredRequests);
    const pagedSummaries = paginate(filteredSummaries);

    // Total count + total pages for whichever tab is active — drives the
    // search placeholder and the pagination controls below the table.
    const activeListMeta = {
        logs: { total: filteredLogs.length, placeholder: "Search by employee, status, or source..." },
        requests: { total: filteredRequests.length, placeholder: "Search by employee, reason, or status..." },
        summaries: { total: filteredSummaries.length, placeholder: "Search by employee name..." },
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
                    className="w-full max-w-sm px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
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
                        <button onClick={openMarkModal} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all">
                            Mark Attendance
                        </button>
                        {/* Request Regularization — sab roles ko dikhta hai (Employee apni date ke liye, admin kisi ke liye) */}
                        <button onClick={openRegModal} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border transition-all">
                            Request Regularization
                        </button>
                        {/* Generate Summary button sirf HR/Admin ko dikhta hai — Employee role ko nahi */}
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
                            ? "border-indigo-600 text-indigo-600 font-extrabold"
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
                    <div className="p-12 text-center text-sm font-semibold text-indigo-600 animate-pulse">
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
                                        <td className="px-6 py-4 text-slate-500">{new Date(log.attDate).toLocaleDateString()}</td>
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
                                            dikhte hain; Employee ko sirf read-only badge. */}
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
                                            Employee ko apni khud ki request pe status ke alawa kuch
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
                ) : activeTab === "summaries" && isAdminLevel ? (
                    // Monthly Summary — sirf isAdminLevel true hone par render hota hai
                    // (tab list se bhi hidden hai Employee role ke liye, ye double-safety hai)
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
                                        <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{sum.overtimeHours} hrs</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <PaginationBar />
                    </div>
                ) : (
                    // Fallback — agar Employee role ka user kisi tarah "summaries"
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
                                <select
                                    required
                                    value={markForm.empId}
                                    onChange={(e) => setMarkForm({ ...markForm, empId: e.target.value })}
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
                                // Employee role — dropdown ki jagah apna khud ka naam read-only dikhado
                                <input
                                    type="text"
                                    disabled
                                    value={
                                        selectableEmployees[0]
                                            ? `${selectableEmployees[0].firstName} ${selectableEmployees[0].lastName} (${selectableEmployees[0].empCode})`
                                            : "You"
                                    }
                                    className="w-full px-3 py-2 border rounded-xl text-sm bg-slate-50 text-slate-500"
                                />
                            )}
                        </div>
                        <form onSubmit={handleMarkAttendance} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date *</label>
                                <input type="date" required value={markForm.attDate}
                                    onChange={e => setMarkForm({ ...markForm, attDate: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Check In</label>
                                    <input type="time" value={markForm.checkIn}
                                        onChange={e => setMarkForm({ ...markForm, checkIn: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Check Out</label>
                                    <input type="time" value={markForm.checkOut}
                                        onChange={e => setMarkForm({ ...markForm, checkOut: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                <select value={markForm.status}
                                    onChange={e => setMarkForm({ ...markForm, status: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border text-sm bg-white">
                                    <option>Present</option>
                                    <option>Absent</option>
                                    <option>Half-Day</option>
                                    <option>Holiday</option>
                                    <option>Leave</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks</label>
                                <input type="text" placeholder="Reason for manual entry" value={markForm.remarks}
                                    onChange={e => setMarkForm({ ...markForm, remarks: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border text-sm" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                                <div className="w-full px-3 py-2 rounded-xl border text-xs bg-slate-50 text-slate-500 flex items-center gap-2 overflow-hidden">
                                    {locationStatus === "idle" && (
                                        <span> Location will be captured automatically on submit</span>
                                    )}
                                    {locationStatus === "fetching" && (
                                        <span className="text-indigo-500 animate-pulse"> Getting your location...</span>
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
                                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-60 transition-opacity">
                                {actionLoading ? "Saving..." : "Mark Attendance"}
                            </button>
                        </form>
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
                                            selectableEmployees[0]
                                                ? `${selectableEmployees[0].firstName} ${selectableEmployees[0].lastName} (${selectableEmployees[0].empCode})`
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
                                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-60 transition-opacity">
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
                                    {/* Backend rejects any year greater than the current
                                        year (see AttendanceService.GenerateSummaryAsync), so this
                                        input is capped at the current year to prevent a silent
                                        failure for any future year. */}
                                    <input type="number" required min="2020" max={new Date().getFullYear()} value={summaryForm.year}
                                        onChange={e => setSummaryForm({ ...summaryForm, year: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border text-sm" />
                                </div>
                            </div>
                            <button type="submit" disabled={actionLoading}
                                className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-60">
                                {actionLoading ? "Generating..." : "Generate Summary"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}