import React, { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/adminService";

const STATUS_STYLES = {
    Present: "bg-green-100 text-green-700",
    Absent: "bg-red-100 text-red-700",
    "Half-Day": "bg-orange-100 text-orange-700",
    Holiday: "bg-blue-100 text-blue-700",
    WeekOff: "bg-gray-100 text-gray-600",
    Leave: "bg-yellow-100 text-yellow-700",
};

// Separate badge styles for regularization request status
const REG_STATUS_STYLES = {
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
};

const firstDayOfMonth = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};
const today = () => new Date().toISOString().slice(0, 10);

export default function MyAttendance() {
    const [fromDate, setFromDate] = useState(firstDayOfMonth());
    const [toDate, setToDate] = useState(today());
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showRegularizeModal, setShowRegularizeModal] = useState(false);

    // --- New state for regularization requests ---
    const [regRequests, setRegRequests] = useState([]);
    const [regLoading, setRegLoading] = useState(false);
    const [regError, setRegError] = useState("");
    const [regStatusFilter, setRegStatusFilter] = useState(""); // "" = All, or Pending/Approved/Rejected

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await adminService.getMyAttendance({ fromDate, toDate });
            if (res.success) {
                setRecords(res.data || []);
            } else {
                setError(res.message || "Failed to load attendance");
            }
        } catch (err) {
            setError("Something went wrong, please try again");
        } finally {
            setLoading(false);
        }
    }, [fromDate, toDate]);

    // Function to fetch regularization requests
    // Backend: GET /api/hr/attendance/regularize?status=Pending (status is optional)
    const fetchRegularizations = useCallback(async () => {
        setRegLoading(true);
        setRegError("");
        try {
            const res = await adminService.getMyRegularizations(
                regStatusFilter ? { status: regStatusFilter } : {}
            );
            if (res.success) {
                setRegRequests(res.data || []);
            } else {
                setRegError(res.message || "Failed to load regularization requests");
            }
        } catch (err) {
            setRegError("Something went wrong, please try again");
        } finally {
            setRegLoading(false);
        }
    }, [regStatusFilter]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    useEffect(() => {
        fetchRegularizations();
    }, [fetchRegularizations]);

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h1 className="text-xl font-semibold text-gray-800">My Attendance</h1>
                <button
                    onClick={() => setShowRegularizeModal(true)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                >
                    + Regularize
                </button>
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm"
                    />
                </div>
                <button
                    onClick={fetchAttendance}
                    className="mt-5 px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
                >
                    Apply
                </button>
            </div>

            {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-left">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Punch In</th>
                            <th className="px-4 py-3">Punch Out</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Late (min)</th>
                            <th className="px-4 py-3">Overtime (hrs)</th>
                            <th className="px-4 py-3">Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : records.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                                    No records found for this date range
                                </td>
                            </tr>
                        ) : (
                            records.map((r) => (
                                <tr key={r.attId} className="border-t">
                                    <td className="px-4 py-3">{r.attDate?.slice(0, 10)}</td>
                                    <td className="px-4 py-3">{r.checkIn || "-"}</td>
                                    <td className="px-4 py-3">{r.checkOut || "-"}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] || "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{r.lateMinutes ?? "-"}</td>
                                    <td className="px-4 py-3">{r.overtimeHours ?? "-"}</td>
                                    <td className="px-4 py-3">{r.remarks || "-"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- New section: My Regularization Requests --- */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h2 className="text-lg font-semibold text-gray-800">My Regularization Requests</h2>
                <select
                    value={regStatusFilter}
                    onChange={(e) => setRegStatusFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                >
                    <option value="">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            {regError && <div className="text-red-600 text-sm mb-3">{regError}</div>}

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-left">
                        <tr>
                            <th className="px-4 py-3">Request Date</th>
                            <th className="px-4 py-3">Reason</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Approved By</th>
                            <th className="px-4 py-3">Approved At</th>
                            <th className="px-4 py-3">Submitted At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {regLoading ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : regRequests.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                                    No regularization requests found
                                </td>
                            </tr>
                        ) : (
                            regRequests.map((r) => (
                                <tr key={r.requestId} className="border-t">
                                    <td className="px-4 py-3">{r.requestDate?.slice(0, 10)}</td>
                                    <td className="px-4 py-3">{r.reason || "-"}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${REG_STATUS_STYLES[r.status] || "bg-gray-100 text-gray-600"
                                                }`}
                                        >
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{r.approvedBy || "-"}</td>
                                    <td className="px-4 py-3">
                                        {r.approvedAt ? r.approvedAt.slice(0, 10) : "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {r.createdAt ? r.createdAt.slice(0, 16).replace("T", " ") : "-"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showRegularizeModal && (
                <RegularizeModal
                    onClose={() => setShowRegularizeModal(false)}
                    onSuccess={() => {
                        setShowRegularizeModal(false);
                        fetchAttendance();
                        fetchRegularizations(); // Refresh the list after a new request is submitted
                    }}
                />
            )}
        </div>
    );
}

function RegularizeModal({ onClose, onSuccess }) {
    const [date, setDate] = useState(today());
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!reason.trim()) {
            setError("Reason is required");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const res = await adminService.requestRegularization({
                requestDate: date,
                reason,
            });
            if (res.success) {
                onSuccess();
            } else {
                setError(res.message || "Failed to submit request");
            }
        } catch (err) {
            setError("Something went wrong, please try again");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                <h2 className="text-lg font-semibold mb-4">Regularize Attendance</h2>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Reason</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            placeholder="Enter the reason for missed punch-in/out"
                        />
                    </div>
                </div>

                {error && <div className="text-red-600 text-sm mt-3">{error}</div>}

                <div className="flex justify-end gap-3 mt-5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border text-sm hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {submitting ? "Submitting..." : "Submit Request"}
                    </button>
                </div>
            </div>
        </div>
    );
}