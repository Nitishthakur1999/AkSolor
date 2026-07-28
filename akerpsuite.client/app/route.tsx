import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import HomeLayout from "@/layout/HomeLayout";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ServicesPage from "@/pages/ServicesPage";
import GalleryPage from "@/pages/GalleryPage";
import ContactPage from "@/pages/ContactPage";
import CmdLayout from "@/layout/cmdlayout";
import Login from "@/admin/pages/LoginPage";

// ── Built pages ────────────────────────────────────────────────────────────
import Dashboard from "@/admin/pages/dashboard";
import Employees from "@/admin/pages/employees";
import EmployeeMasterData from "@/admin/pages/EmployeeMasterData";
import Departments from "@/admin/pages/departments";
import Designations from "@/admin/pages/designations";
import Roles from "@/admin/pages/roles";
import Attendance from "@/admin/pages/attendance";
import AddPages from "@/admin/pages/addpages";
import LeaveManagement from "@/admin/pages/leavemanagement";
import LeaveRequests from "@/admin/pages/leaverequests";
import PayrollManagement from "@/admin/pages/payrollmanagement";
import PayslipViewer from "@/admin/pages/payslipviewer";

// 🆕 Recruitment Pages
import JobRequisitions from "@/admin/pages/jobrequisitions";
import JobPostings from "@/admin/pages/jobpostings";
import CandidateManagement from "@/admin/pages/candidatemanagement";
import Careers from "@/components/careers";
import RecruitmentMaster from "../src/admin/pages/recruitmentmaster";
import MyLeaves from "@/admin/pages/MyLeaves";
import MyProfile from "@/admin/pages/MyProfile";
import MyAttendance from "@/admin/pages/Myattendance";
import MyPayslip from "@/admin/pages/Mypayslip";
import ReportsPage from "@/admin/pages/ReportsPage";

// 🆕 Sales & Pipeline Pages
import Segments from "@/admin/pages/Segments";
import Leads from "@/admin/pages/Leads";
import LeadDetail from "@/admin/pages/LeadDetail";



// 🆕 Inventory Single Page
import Inventory from "@/admin/pages/Inventory";
import PublicSitePage from "@/admin/pages/Publicsitepage";
 

function ComingSoon({ title = "Page", icon = "fa-solid fa-circle" }) {
    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500 mt-0.5">This module is under development.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center py-24 gap-4">
                <i className={`${icon} text-slate-200`} style={{ fontSize: 56 }} />
                <p className="text-slate-400 font-medium text-sm">Coming soon</p>
                <p className="text-slate-300 text-xs">This page will be available in the next release.</p>
            </div>
        </div>
    );
}

//  COMPONENT MAP  —  pageLink (from DB)  →  JSX element
//  Add new pages here as they get built.
const COMPONENT_MAP = {

    // ── General ───────────────────────────────────────────────────────────
    "/dashboard": <Dashboard />,

    // ── HR ────────────────────────────────────────────────────────────────
    "/employees": <Employees />,
    "/employees/add": <Employees />,
    "/attendance": <Attendance />,
    "/hr/leave": <LeaveManagement />,
    "/hr/leave/requests": <LeaveRequests />,
    "/admin/employee-records": <EmployeeMasterData />,

    // ── Payroll ───────────────────────────────────────────────────────────
    "/payroll": <PayrollManagement />,
    "/payroll/salary": <PayrollManagement />,
    "/payroll/deductions": <PayrollManagement />,
    "/payroll/payslip": <PayslipViewer />,

    // ── Recruitment (🆕 Updated) ─────────────────────────────────────────
    "/recruitment/requisitions": <JobRequisitions />,
    "/recruitment/postings": <JobPostings />,
    "/recruitment/interviews": <RecruitmentMaster />,

    // ── Sales (Extra pages removed, only main views kept) ─────────────────
    "/sales/segments": <Segments />,
    "/sales/leads": <Leads />,

    // ── Inventory ─────────────────────────────────────────────────────────
    "/inventory": <Inventory />, 

    // ── Admin ─────────────────────────────────────────────────────────────
    "/roles": <Roles />,
    "/departments": <Departments />,
    "/designations": <Designations />,
    "/admin/page-access": <AddPages />,

    // ── Reports ───────────────────────────────────────────────────────────
    "/reports/employees": <ReportsPage initialTab="employees" />,
    "/reports/attendance": <ReportsPage initialTab="attendance" />,
    "/reports/leave": <ReportsPage initialTab="leave" />,
    "/reports/payroll": <ReportsPage initialTab="payroll" />,

    // ── Self-service ──────────────────────────────────────────────────────
    "/self/profile": <MyProfile />,
    "/self/leave": <MyLeaves />,
    "/self/attendance": <MyAttendance />,
    "/self/payslip": <MyPayslip />,
    "/public-site": <PublicSitePage />,
 
};

// ─────────────────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const PageGuard = ({ path, children }) => {
    const pages = JSON.parse(localStorage.getItem("pages") || "[]");
    const hasAccess = pages.some(p => p.pageLink === path);
    if (!hasAccess) return <Navigate to="/unauthorized" replace />;
    return children;
};

function Router() {
    const [pages] = useState(() =>
        JSON.parse(localStorage.getItem("pages") || "[]")
    );

    const sortedPages = [...pages].sort((a, b) =>
        b.pageLink.length - a.pageLink.length
    );

    return (
        <BrowserRouter>
            <Routes>
                {/* ── Public Routes (multi-page site, shared Navbar/Footer via HomeLayout) ── */}
                <Route element={<HomeLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/gallery" element={<GalleryPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/careers" element={<Careers />} />
                </Route>

                <Route path="/login" element={<Login />} />

                <Route path="/unauthorized" element={
                    <div style={{ textAlign: "center", marginTop: "100px" }}>
                        <h2>🔒 Access Denied</h2>
                        <p>Aapko is page ka access nahi hai.</p>
                        <a href="/dashboard">Dashboard pe Wapas Jao</a>
                    </div>
                } />

                {/* ── Protected Admin Routes ── */}
                <Route element={
                    <ProtectedRoute>
                        <CmdLayout />
                    </ProtectedRoute>
                }>
                    {/* ── Dashboard — always accessible if logged in ── */}
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* 🆕 LEAD DETAIL PIPELINE ROUTE */}
                    {/* Ise map se bahar rakha hai kyunki ye direct DB list mein nahi hota */}
                    <Route path="/sales/leads/:id" element={<LeadDetail />} />

                    {/* ── Dynamic pages from DB ── */}
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
                                        {component}
                                    </PageGuard>
                                }
                            />
                        );
                    })}
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default Router;