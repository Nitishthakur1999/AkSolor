import { lazy, Suspense, useEffect, useState, type ReactElement, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

// ── Eager (Home ke liye zaroori) ───────────────────────────────────────────
import HomeLayout from "@/layout/HomeLayout";
import HomePage from "@/pages/HomePage";

// ── Lazy: public pages ─────────────────────────────────────────────────────
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const GalleryPage = lazy(() => import("@/pages/GalleryPage"));
const Videos = lazy(() => import("@/components/Videos"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const Careers = lazy(() => import("@/components/careers"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicyPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const FoundersMessage = lazy(() => import("@/pages/FounderPage"));
const CmdMessage = lazy(() => import("@/pages/CmdmassagePage"));
const DirectorMessage = lazy(() => import("@/pages/DirectormassagePage"));

// ── Lazy: admin / ERP ──────────────────────────────────────────────────────
const CmdLayout = lazy(() => import("@/layout/cmdlayout"));
const Login = lazy(() => import("@/admin/pages/LoginPage"));
const Dashboard = lazy(() => import("@/admin/pages/dashboard"));
const Employees = lazy(() => import("@/admin/pages/employees"));
const EmployeeMasterData = lazy(() => import("@/admin/pages/EmployeeMasterData"));
const Departments = lazy(() => import("@/admin/pages/departments"));
const Designations = lazy(() => import("@/admin/pages/designations"));
const Roles = lazy(() => import("@/admin/pages/roles"));
const Attendance = lazy(() => import("@/admin/pages/attendance"));
const AddPages = lazy(() => import("@/admin/pages/addpages"));
const LeaveManagement = lazy(() => import("@/admin/pages/leavemanagement"));
const LeaveRequests = lazy(() => import("@/admin/pages/leaverequests"));
const PayrollManagement = lazy(() => import("@/admin/pages/payrollmanagement"));
const PayslipViewer = lazy(() => import("@/admin/pages/payslipviewer"));
const JobRequisitions = lazy(() => import("@/admin/pages/jobrequisitions"));
const JobPostings = lazy(() => import("@/admin/pages/jobpostings"));
const RecruitmentMaster = lazy(() => import("@/admin/pages/recruitmentmaster"));
const MyLeaves = lazy(() => import("@/admin/pages/MyLeaves"));
const MyProfile = lazy(() => import("@/admin/pages/MyProfile"));
const MyAttendance = lazy(() => import("@/admin/pages/Myattendance"));
const MyPayslip = lazy(() => import("@/admin/pages/Mypayslip"));
const ReportsPage = lazy(() => import("@/admin/pages/ReportsPage"));
const Segments = lazy(() => import("@/admin/pages/Segments"));
const Leads = lazy(() => import("@/admin/pages/Leads"));
const LeadDetail = lazy(() => import("@/admin/pages/LeadDetail"));
const Inventory = lazy(() => import("@/admin/pages/Inventory"));
const PublicSitePage = lazy(() => import("@/admin/pages/Publicsitepage"));
const SalarySheet = lazy(() => import("@/admin/pages/SalarySheet"));
const PurchaseModule = lazy(() => import("@/admin/pages/Purchasemodule"));

function PageLoader() {
    return (
        <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
        </div>
    );
}

// Suspense wrapper: layout visible rehta hai, sirf page area me loader
function L({ children }: { children: ReactNode }) {
    return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const COMPONENT_MAP: Record<string, ReactElement> = {
    // General
    "/dashboard": <Dashboard />,

    // HR
    "/employees": <Employees />,
    "/employees/add": <Employees />,
    "/attendance": <Attendance />,
    "/hr/leave": <LeaveManagement />,
    "/hr/leave/requests": <LeaveRequests />,
    "/admin/employee-records": <EmployeeMasterData />,

    // Payroll
    "/payroll": <PayrollManagement />,
    "/payroll/salary": <PayrollManagement />,
    "/payroll/deductions": <PayrollManagement />,
    "/payroll/payslip": <PayslipViewer />,
    "/payroll/salary-sheet": <SalarySheet />,

    // Recruitment
    "/recruitment/requisitions": <JobRequisitions />,
    "/recruitment/postings": <JobPostings />,
    "/recruitment/interviews": <RecruitmentMaster />,

    // Sales
    "/sales/segments": <Segments />,
    "/sales/leads": <Leads />,

    // Inventory
    "/inventory": <Inventory />,

    // Purchase
    "/purchase": <PurchaseModule />,

    // Admin
    "/roles": <Roles />,
    "/departments": <Departments />,
    "/designations": <Designations />,
    "/admin/page-access": <AddPages />,

    // Reports
    "/reports/employees": <ReportsPage initialTab="employees" />,
    "/reports/attendance": <ReportsPage initialTab="attendance" />,
    "/reports/leave": <ReportsPage initialTab="leave" />,
    "/reports/payroll": <ReportsPage initialTab="payroll" />,

    // Self-service
    "/self/profile": <MyProfile />,
    "/self/leave": <MyLeaves />,
    "/self/attendance": <MyAttendance />,
    "/self/payslip": <MyPayslip />,
    "/public-site": <PublicSitePage />,
};

interface PageItem {
    pageId: number | string;
    pageLink: string;
}

const readPages = (): PageItem[] => {
    try {
        return JSON.parse(localStorage.getItem("pages") || "[]");
    } catch {
        return [];
    }
};

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const PageGuard = ({ path, children }: { path: string; children: ReactElement }) => {
    const hasAccess = readPages().some((p) => p.pageLink === path);
    if (!hasAccess) return <Navigate to="/unauthorized" replace />;
    return children;
};

function Router() {
    const [pages] = useState<PageItem[]>(readPages);

    const sortedPages = [...pages].sort((a, b) => b.pageLink.length - a.pageLink.length);

    // Home render hone ke BAAD, idle time pe public pages background me download.
    // LCP pe koi asar nahi, click pe page instant khulta hai.
    useEffect(() => {
        const warm = () => {
            import("@/pages/ServicesPage");
            import("@/pages/ContactPage");
            import("@/pages/AboutPage");
        };
        const w = window as Window & {
            requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
            cancelIdleCallback?: (id: number) => void;
        };
        if (w.requestIdleCallback) {
            const id = w.requestIdleCallback(warm, { timeout: 5000 });
            return () => w.cancelIdleCallback?.(id);
        }
        const t = window.setTimeout(warm, 3000);
        return () => window.clearTimeout(t);
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route element={<HomeLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<L><AboutPage /></L>} />
                    <Route path="/services" element={<L><ServicesPage /></L>} />
                    <Route path="/gallery" element={<L><GalleryPage /></L>} />
                    <Route path="/videos" element={<L><Videos /></L>} />
                    <Route path="/contact" element={<L><ContactPage /></L>} />
                    <Route path="/careers" element={<L><Careers /></L>} />
                    <Route path="/terms-and-conditions" element={<L><TermsPage /></L>} />
                    <Route path="/privacy-policy" element={<L><PrivacyPolicyPage /></L>} />
                    <Route path="/messages/founder" element={<L><FoundersMessage /></L>} />
                    <Route path="/messages/cmd" element={<L><CmdMessage /></L>} />
                    <Route path="/messages/director" element={<L><DirectorMessage /></L>} />
                </Route>

                <Route path="/login" element={<L><Login /></L>} />

                <Route
                    path="/unauthorized"
                    element={
                        <div style={{ textAlign: "center", marginTop: "100px" }}>
                            <h2>🔒 Access Denied</h2>
                            <p>Aapko is page ka access nahi hai.</p>
                            <Link to="/dashboard">Dashboard pe Wapas Jao</Link>
                        </div>
                    }
                />

                {/* Protected admin routes */}
                <Route
                    element={
                        <ProtectedRoute>
                            <L><CmdLayout /></L>
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<L><Dashboard /></L>} />
                    <Route path="/sales/leads/:id" element={<L><LeadDetail /></L>} />

                    {/* Dynamic pages from DB */}
                    {sortedPages.map((page) => {
                        if (page.pageLink === "/dashboard") return null;
                        const component = COMPONENT_MAP[page.pageLink];
                        if (!component) return null;
                        return (
                            <Route
                                key={page.pageId}
                                path={page.pageLink}
                                element={
                                    <PageGuard path={page.pageLink}>
                                        <L>{component}</L>
                                    </PageGuard>
                                }
                            />
                        );
                    })}
                </Route>

                {/* 404 */}
                <Route element={<HomeLayout />}>
                    <Route path="*" element={<L><NotFoundPage /></L>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default Router;