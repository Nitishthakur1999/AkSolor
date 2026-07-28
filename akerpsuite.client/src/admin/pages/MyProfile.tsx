import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService"; // Apna correct path check kar lein

export default function MyProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await adminService.getMyProfile();
            if (res.success || res.Success) {
                setProfile(res.data || res.Data);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper for generating initials if photo is missing
    const getInitials = (name) => {
        if (!name) return "U";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    // Helper for formatting dates
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500 font-medium">Loading profile details...</div>;
    }

    if (!profile) {
        return <div className="p-8 text-center text-red-500 font-medium">Failed to load profile.</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">

            {/* ── Header Card ── */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-amber-100 border-4 border-white shadow-lg flex items-center justify-center text-amber-600 text-3xl font-bold shrink-0">
                    {profile.photoPath ? (
                        <img src={profile.photoPath} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        getInitials(profile.fullName)
                    )}
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-800">{profile.fullName}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><i className="fa-solid fa-briefcase text-amber-500"></i> {profile.desigName}</span>
                        <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full"><i className="fa-solid fa-building text-amber-500"></i> {profile.deptName}</span>
                        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200"><i className="fa-solid fa-circle-check"></i> {profile.employmentStatus}</span>
                    </div>
                </div>
            </div>

            {/* ── Details Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Employment Information */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Employment Information</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <InfoItem label="Employee Code" value={profile.empCode} />
                        <InfoItem label="Employment Type" value={profile.employmentType} />
                        <InfoItem label="Date of Joining" value={formatDate(profile.dateOfJoining)} />
                        <InfoItem label="Reporting Manager" value={profile.reportingManager || "Not Assigned"} />
                        <InfoItem label="System Role" value={profile.roleName} />
                        <InfoItem label="Username" value={profile.username} />
                    </div>
                </div>

                {/* Personal & Contact Details */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Personal & Contact</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <InfoItem label="Mobile Number" value={profile.mobile} />
                        <InfoItem label="Alternate Mobile" value={profile.alternateMobile || "N/A"} />
                        <InfoItem label="Official Email" value={profile.officialEmail} className="col-span-2 break-all" />
                        <InfoItem label="Personal Email" value={profile.personalEmail} className="col-span-2 break-all" />
                        <InfoItem label="Date of Birth" value={formatDate(profile.dateOfBirth)} />
                        <InfoItem label="Gender / Blood Group" value={`${profile.gender} / ${profile.bloodGroup}`} />
                        <InfoItem label="Marital Status" value={profile.maritalStatus} />
                    </div>
                </div>

                {/* Statutory & Identity */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Statutory Details</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <InfoItem label="Aadhar Number" value={profile.aadharNo} />
                        <InfoItem label="PAN Number" value={profile.panNo} />
                        <InfoItem label="UAN Number" value={profile.uanNo || "N/A"} />
                        <InfoItem label="ESIC Number" value={profile.esicNo || "N/A"} />
                        <InfoItem label="Passport Number" value={profile.passportNo || "N/A"} className="col-span-2" />
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                    <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Address Information</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                        <InfoItem label="Address Line 1" value={profile.addressLine1} className="col-span-2" />
                        <InfoItem label="Address Line 2" value={profile.addressLine2 || "N/A"} className="col-span-2" />
                        <InfoItem label="City" value={profile.city} />
                        <InfoItem label="State" value={profile.state} />
                        <InfoItem label="Country" value={profile.country} />
                        <InfoItem label="Pincode" value={profile.pincode} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component for displaying key-value pairs cleanly
function InfoItem({ label, value, className = "" }) {
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
            <span className="text-sm font-semibold text-slate-700">{value || "-"}</span>
        </div>
    );
}