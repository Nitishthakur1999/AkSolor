import { useState, useEffect } from "react";
import { adminService, getDocumentUrl } from "@/services/adminService";

export default function MyProfile() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [noEmployeeRecord, setNoEmployeeRecord] = useState(false);
    const [photoLoadFailed, setPhotoLoadFailed] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        setErrorMessage(null);
        setNoEmployeeRecord(false);
        setPhotoLoadFailed(false);
        try {
            const res = await adminService.getMyProfile();
            if (res.success || res.Success) {
                setProfile(res.data || res.Data);
            } else {
                setErrorMessage(res.message || res.Message || "Failed to load profile.");
            }
        } catch (error: any) {
            console.error("Error fetching profile:", error);

            const msg = error?.message || "";
            if (msg.includes("not linked to an employee record")) {
                setNoEmployeeRecord(true);
            } else {
                setErrorMessage("Failed to load profile. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper for generating initials if photo is missing
    const getInitials = (name: string) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    // Helper for formatting dates
    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
                <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-amber-400 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div className="text-sm font-semibold text-slate-500 tracking-wide animate-pulse">Loading profile details...</div>
            </div>
        );
    }

    // ── No Employee Record State ──
    if (noEmployeeRecord) {
        return (
            <div className="p-6 md:p-12 flex items-center justify-center min-h-[400px]">
                <div className="bg-white border border-slate-200 rounded-[24px] p-8 md:p-10 max-w-lg w-full text-center shadow-xl shadow-slate-200/40 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-[20px] bg-amber-50 flex items-center justify-center text-amber-500 text-3xl shadow-sm border border-amber-100">
                        <i className="fa-solid fa-user-slash"></i>
                    </div>

                    <h2 className="text-xl font-black text-[#0b2532] mb-3 tracking-tight">
                        Self-Service Unavailable
                    </h2>

                    <p className="text-slate-600 text-sm leading-relaxed font-semibold mb-6">
                        Your account is not currently linked to an employee profile. As a result, self-service features such as <strong className="text-[#0b2532]">My Profile, Attendance, and Leave</strong> are not available.
                    </p>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-slate-500 text-xs font-bold leading-relaxed">
                            If you believe this is incorrect, please contact your administrator to link your account with the appropriate employee record.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Generic error / profile missing ──
    if (errorMessage || !profile) {
        return (
            <div className="p-6 md:p-12 flex items-center justify-center min-h-[400px]">
                <div className="bg-white border border-slate-200 rounded-[24px] p-8 md:p-10 max-w-lg w-full text-center shadow-xl shadow-slate-200/40 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-[20px] bg-rose-50 flex items-center justify-center text-rose-500 text-3xl shadow-sm border border-rose-100">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h2 className="text-xl font-black text-[#0b2532] mb-3 tracking-tight">
                        Something Went Wrong
                    </h2>
                    <p className="text-rose-600 text-sm font-bold mb-8">
                        {errorMessage || "Failed to load profile data."}
                    </p>
                    <button
                        onClick={fetchProfile}
                        className="w-full py-3.5 bg-[#0b2836] text-white text-sm font-bold rounded-xl hover:bg-[#0f3345] transition-all shadow-lg shadow-[#0b2836]/20 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                    >
                        <i className="fa-solid fa-rotate-right" /> Retry Loading
                    </button>
                </div>
            </div>
        );
    }

    // ── Success: full profile UI ──
    return (
        <div className="space-y-6 pb-10 font-sans relative z-0">

            {/* ── Premium Header Section ── */}
            <div className="bg-[#0b2532] rounded-[24px] px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/5 backdrop-blur-sm">
                        <i className="fa-solid fa-address-card text-xl text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">My Profile</h2>
                        <p className="text-xs text-slate-400 mt-0.5">View your personal, employment, and statutory details.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">

                {/* ── Profile Identity Card ── */}
                <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-slate-50 to-slate-100 z-0"></div>

                    <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-amber-50 border-[6px] border-amber-200 shadow-xl flex items-center justify-center text-amber-600 text-4xl font-black shrink-0 overflow-hidden mt-4 sm:mt-0">
                        {profile.photoPath && !photoLoadFailed ? (
                            <img
                                src={getDocumentUrl(profile.photoPath)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={() => setPhotoLoadFailed(true)}
                            />
                        ) : (
                            getInitials(profile.fullName)
                        )}
                    </div>

                    <div className="relative z-10 flex-1 text-center sm:text-left space-y-3 mt-2 sm:mt-8">
                        <h1 className="text-2xl sm:text-3xl font-black text-[#0b2532] tracking-tight">{profile.fullName}</h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#0b2532] uppercase tracking-wider">
                                <i className="fa-solid fa-briefcase text-amber-500" /> {profile.desigName || "N/A"}
                            </span>
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-[#0b2532] uppercase tracking-wider">
                                <i className="fa-solid fa-building text-blue-500" /> {profile.deptName || "N/A"}
                            </span>
                            <span className="flex items-center gap-1.5 bg-emerald-50 px-3.5 py-1.5 rounded-lg border border-emerald-200/60 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                <i className="fa-solid fa-circle-check" /> {profile.employmentStatus || "N/A"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Details Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Employment Information */}
                    <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <i className="fa-solid fa-id-badge" />
                            </div>
                            <h3 className="text-sm font-black text-[#0b2532] uppercase tracking-wide">Employment Info</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                            <InfoItem label="Employee Code" value={profile.empCode} />
                            <InfoItem label="Employment Type" value={profile.employmentType} />
                            <InfoItem label="Date of Joining" value={formatDate(profile.dateOfJoining)} />
                            <InfoItem label="Reporting Manager" value={profile.reportingManager || "Not Assigned"} />
                            <InfoItem label="System Role" value={profile.roleName} />
                            <InfoItem label="Username" value={profile.username} />
                        </div>
                    </div>

                    {/* Personal & Contact Details */}
                    <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <i className="fa-solid fa-user-tag" />
                            </div>
                            <h3 className="text-sm font-black text-[#0b2532] uppercase tracking-wide">Personal & Contact</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                            <InfoItem label="Mobile Number" value={profile.mobile} />
                            <InfoItem label="Alternate Mobile" value={profile.alternateMobile || "N/A"} />
                            <InfoItem label="Official Email" value={profile.officialEmail} className="sm:col-span-2" />
                            <InfoItem label="Personal Email" value={profile.personalEmail} className="sm:col-span-2" />
                            <InfoItem label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
                            <InfoItem label="Gender / Blood Group" value={`${profile.gender || "-"} / ${profile.bloodGroup || "-"}`} />
                            <InfoItem label="Marital Status" value={profile.maritalStatus} />
                        </div>
                    </div>

                    {/* Statutory & Identity */}
                    <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <i className="fa-solid fa-file-shield" />
                            </div>
                            <h3 className="text-sm font-black text-[#0b2532] uppercase tracking-wide">Statutory Details</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                            <InfoItem label="Aadhar Number" value={profile.aadharNo} />
                            <InfoItem label="PAN Number" value={profile.panNo} />
                            <InfoItem label="UAN Number" value={profile.uanNo || "N/A"} />
                            <InfoItem label="ESIC Number" value={profile.esicNo || "N/A"} />
                            <InfoItem label="Passport Number" value={profile.passportNo || "N/A"} className="sm:col-span-2" />
                        </div>
                    </div>

                    {/* Address */}
                    <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                <i className="fa-solid fa-map-location-dot" />
                            </div>
                            <h3 className="text-sm font-black text-[#0b2532] uppercase tracking-wide">Address Information</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                            <InfoItem label="Address Line 1" value={profile.addressLine1} className="sm:col-span-2" />
                            <InfoItem label="Address Line 2" value={profile.addressLine2 || "N/A"} className="sm:col-span-2" />
                            <InfoItem label="City" value={profile.city} />
                            <InfoItem label="State" value={profile.state} />
                            <InfoItem label="Country" value={profile.country} />
                            <InfoItem label="Pincode" value={profile.pincode} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component for displaying key-value pairs cleanly (Sharpened Text)
function InfoItem({ label, value, className = "" }: any) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-500">{label}</span>
            <span className="text-[15px] font-bold text-[#0b2532] break-words">{value || "—"}</span>
        </div>
    );
}