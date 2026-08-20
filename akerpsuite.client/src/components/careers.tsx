import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";

const ALLOWED_CV_EXTENSIONS = ["pdf", "doc", "docx"];
const MAX_CV_SIZE_MB = 5;

const inputCls =
    "w-full border border-line-strong bg-mist px-4 py-2.5 text-charcoal placeholder:text-slate-light transition-colors duration-200 rounded-xl focus:border-gold-deep focus:bg-paper focus:outline-none";
const labelCls =
    "mb-1 block font-mono text-[0.7rem] font-bold uppercase tracking-wide text-slate";

// File -> { base64, extension } (base64 WITHOUT the "data:...;base64," prefix)
function fileToBase64(file: File): Promise<{ base64: string; extension: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
            const extension = (file.name.split(".").pop() || "").toLowerCase();
            resolve({ base64, extension });
        };
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
    });
}

export default function Careers() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedJob, setSelectedJob] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "", email: "", phone: "", experience: "", skills: ""
    });
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [cvError, setCvError] = useState("");
    const [applicationResult, setApplicationResult] = useState<{ code: string; email: string } | null>(null);

    useEffect(() => {
        adminService.getAllJobPostings(true)
            .then(res => {
                if (res.Success || res.success) setJobs(res.Data || res.data || []);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) { setCvFile(null); return; }

        const ext = (file.name.split(".").pop() || "").toLowerCase();
        if (!ALLOWED_CV_EXTENSIONS.includes(ext)) {
            setCvError("Only PDF or Word (.doc/.docx) files are allowed.");
            setCvFile(null);
            e.target.value = "";
            return;
        }
        if (file.size > MAX_CV_SIZE_MB * 1024 * 1024) {
            setCvError(`File size must be under ${MAX_CV_SIZE_MB}MB.`);
            setCvFile(null);
            e.target.value = "";
            return;
        }
        setCvError("");
        setCvFile(file);
    }

    function resetForm() {
        setForm({ name: "", email: "", phone: "", experience: "", skills: "" });
        setCvFile(null);
        setCvError("");
        setApplicationResult(null);
    }

    const handleApply = async (e) => {
        e.preventDefault();
        if (!cvFile) {
            setCvError("Please attach your resume.");
            return;
        }

        setSubmitting(true);
        try {
            const { base64, extension } = await fileToBase64(cvFile);
            const res = await adminService.applyForJob({
                jobPostingId: selectedJob.postingId,
                name: form.name,
                email: form.email,
                phone: form.phone,
                experience: form.experience || null,
                skills: form.skills || null,
                cvBase64: base64,
                cvExtension: extension
            });
            if (res.Success || res.success) {
                const code = res.ApplicationCode || res.applicationCode || "";
                setApplicationResult({ code, email: form.email });
            } else {
                alert(res.Message || res.message || "Failed to submit application.");
            }
        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-paper py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="font-display text-4xl font-extrabold text-charcoal tracking-tight">Join Our Team</h1>
                    <p className="mt-4 text-lg text-charcoal-soft">Discover your next career opportunity with us.</p>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gold-deep animate-pulse font-medium text-lg">Loading open positions...</div>
                ) : jobs.length === 0 ? (
                    <div className="bg-chalk p-12 rounded-2xl border border-line-strong text-center text-charcoal-soft">
                        There are currently no open positions. Please check back later.
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {jobs.map(job => (
                            <div key={job.postingId} className="bg-chalk p-6 rounded-2xl border border-line-strong hover:border-gold/50 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-charcoal">{job.title}</h3>
                                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-charcoal-soft">
                                            <span className="flex items-center gap-1">📍 {job.location}</span>
                                            <span className="flex items-center gap-1">💼 {job.employmentType}</span>
                                            {job.salaryRange && <span className="flex items-center gap-1">💰 {job.salaryRange}</span>}
                                        </div>
                                        {job.description && (
                                            <p className="mt-3 text-sm text-charcoal-soft leading-relaxed line-clamp-3">
                                                {job.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => { setSelectedJob(job); resetForm(); }}
                                        className="px-6 py-2.5 bg-gold-deep text-chalk font-bold rounded-xl hover:-translate-y-0.5 hover:bg-gold transition-all shadow-sm w-full sm:w-auto shrink-0"
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
                <div className="fixed inset-0 bg-charcoal/60 z-50 overflow-y-auto flex justify-center items-start p-3 pt-6 pb-16 sm:p-4 sm:pt-16 sm:pb-24">
                    <div className="bg-paper rounded-3xl border border-line-strong shadow-2xl w-full max-w-lg relative">
                        <button
                            onClick={() => { setSelectedJob(null); resetForm(); }}
                            className="absolute top-4 right-4 text-charcoal-soft hover:text-charcoal text-xl sm:top-6 sm:right-6"
                        >
                            ✕
                        </button>

                        {applicationResult ? (
                            <div className="px-5 pt-10 pb-8 text-center sm:px-8">
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10 border border-gold/30">
                                    <svg className="h-8 w-8 text-gold-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-charcoal mb-2">Application Submitted</h2>
                                <p className="text-sm text-charcoal-soft mb-6">
                                    Thanks for applying to <span className="font-semibold text-charcoal">{selectedJob.title}</span>. An acknowledgement email has been sent to <span className="font-semibold text-charcoal">{applicationResult.email}</span>.
                                </p>

                                {applicationResult.code && (
                                    <div className="mb-6 rounded-2xl border border-line-strong bg-mist px-5 py-4">
                                        <p className="font-mono text-[0.7rem] uppercase tracking-wide text-slate mb-1">Your Application ID</p>
                                        <p className="font-mono text-xl font-bold tracking-wide text-gold-deep">{applicationResult.code}</p>
                                        <p className="mt-1 text-xs text-charcoal-soft">Save this ID to track your application status.</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => { setSelectedJob(null); resetForm(); }}
                                    className="w-full py-3.5 bg-gold-deep text-chalk font-bold rounded-xl hover:bg-gold transition-all text-sm shadow-md"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="px-5 pt-8 pb-2 sm:px-8">
                                    <h2 className="text-2xl font-bold text-charcoal mb-2">Apply for {selectedJob.title}</h2>
                                    <p className="text-sm text-charcoal-soft mb-2">{selectedJob.location} • {selectedJob.employmentType}</p>
                                </div>

                                <form onSubmit={handleApply} className="space-y-2 px-4 pb-4">
                                    <div>
                                        <label className={labelCls}>Full Name *</label>
                                        <input type="text" required className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Email *</label>
                                        <input type="email" required className={inputCls} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Phone *</label>
                                        <input type="text" required className={inputCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Experience (years)</label>
                                        <input type="text" placeholder="e.g. 3.5" className={inputCls} value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} />
                                    </div>

                                    <div>
                                        <label className={labelCls}>Key Skills</label>
                                        <textarea rows={2} className={inputCls} value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })}></textarea>
                                    </div>

                                    <div>
                                        <label className={labelCls}>
                                            Resume (PDF or Word) *
                                        </label>
                                        <input
                                            type="file"
                                            accept=".pdf,.doc,.docx"
                                            required
                                            className="w-full text-sm text-charcoal-soft file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gold/10 file:text-gold-deep file:font-semibold hover:file:bg-gold/20"
                                            onChange={handleCvChange}
                                        />
                                        {cvFile && (
                                            <p className="mt-1 text-xs text-charcoal-soft">Selected: {cvFile.name}</p>
                                        )}
                                        {cvError && (
                                            <p className="mt-1 text-xs text-red-500">{cvError}</p>
                                        )}
                                    </div>

                                    <button type="submit" disabled={submitting} className="w-full py-3.5 mt-2 bg-gold-deep text-chalk font-bold rounded-xl hover:bg-gold disabled:opacity-60 transition-all text-sm shadow-md">
                                        {submitting ? "Submitting Application..." : "Submit Application"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}