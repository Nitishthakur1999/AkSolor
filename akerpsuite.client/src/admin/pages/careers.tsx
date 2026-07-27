import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";

export default function Careers() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedJob, setSelectedJob] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "", email: "", phone: "", experience: "", skills: "", cvPath: ""
    });

    useEffect(() => {
        adminService.getAllJobPostings(true)
            .then(res => {
                if (res.Success || res.success) setJobs(res.Data || res.data || []);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleApply = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await adminService.applyForJob({
                jobPostingId: selectedJob.postingId,
                name: form.name,
                email: form.email,
                phone: form.phone,
                experience: form.experience || null,
                skills: form.skills || null,
                cvPath: form.cvPath || null
            });
            if (res.Success || res.success) {
                alert(res.Message || "Application submitted successfully!");
                setSelectedJob(null);
                setForm({ name: "", email: "", phone: "", experience: "", skills: "", cvPath: "" });
            } else {
                alert(res.Message || "Failed to submit application.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Join Our Team</h1>
                    <p className="mt-4 text-lg text-slate-500">Discover your next career opportunity with us.</p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-indigo-500 animate-pulse font-medium text-lg">Loading open positions...</div>
                ) : jobs.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500">
                        There are currently no open positions. Please check back later.
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {jobs.map(job => (
                            <div key={job.postingId} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">{job.title}</h3>
                                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">📍 {job.location}</span>
                                            <span className="flex items-center gap-1">💼 {job.employmentType}</span>
                                            {job.salaryRange && <span className="flex items-center gap-1">💰 {job.salaryRange}</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedJob(job)}
                                        className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm w-full sm:w-auto"
                                    >
                                        Apply Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedJob && (
                <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg my-8 relative">
                        <button onClick={() => setSelectedJob(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 text-xl">✕</button>

                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Apply for {selectedJob.title}</h2>
                        <p className="text-sm text-slate-500 mb-6">{selectedJob.location} • {selectedJob.employmentType}</p>

                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Full Name *</label>
                                <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Email *</label>
                                <input type="email" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Phone *</label>
                                <input type="text" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Experience (years)</label>
                                <input type="text" placeholder="e.g. 3.5" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Key Skills</label>
                                <textarea rows={2} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Resume Link (Google Drive, LinkedIn, etc) *</label>
                                <input type="url" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none" placeholder="https://" value={form.cvPath} onChange={e => setForm({ ...form, cvPath: e.target.value })} />
                            </div>

                            <button type="submit" disabled={submitting} className="w-full py-3.5 mt-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-all text-sm shadow-md">
                                {submitting ? "Submitting Application..." : "Submit Application"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}