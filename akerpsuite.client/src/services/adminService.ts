const BASE = import.meta.env.VITE_API_BASE_URL || "";
const API_BASE = `${BASE}/api/admin`;
const ATTENDANCE_API_BASE = `${BASE}/api/admin`;
const SALES_API_BASE = `${BASE}/api/hr`;
const SITE_API_BASE = `${BASE}/api/admin/site`;

const getHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
});

// // Centralized helper function to handle fetch and JSON parsing
// const apiCall = async (url: string, method: string = "GET", body: any = null): Promise<any> => {
//     const options: RequestInit = { method, headers: getHeaders() };
//     if (body) options.body = JSON.stringify(body);

//     const res = await fetch(url, options);
//     const text = await res.text();
//     const data = text ? JSON.parse(text) : null;

//     if (!res.ok) {
//         const message = data?.Message || data?.message || data?.title || `Request failed (${res.status})`;
//         throw new Error(message);
//     }

//     return data;
// };

const handleUnauthorized = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("Session expired, please login again.");
    window.location.href = "/login"; 
};

const apiCall = async (url: string, method: string = "GET", body: any = null): Promise<any> => {
    const options: RequestInit = { method, headers: getHeaders() };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);

    if (res.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired, please login again.");
    }

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        const message = data?.Message || data?.message || data?.title || `Request failed (${res.status})`;
        throw new Error(message);
    }

    return data;
};

export const getDocumentUrl = (path?: string): string => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const root = BASE.replace(/\/api\/?$/, ""); 
    return `${root}/${path.replace(/^\//, "")}`;
};

// Helper for generating query strings
const buildQuery = (filters: Record<string, any> = {}): string => {
    const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null && v !== ''))
    );
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
};

const downloadFile = async (url: string, filename: string): Promise<void> => {
    const res = await fetch(url, { headers: getHeaders() });

    if (res.status === 401) {
        handleUnauthorized();
        throw new Error("Session expired, please login again.");
    }

    if (!res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : null;
        throw new Error(data?.Message || data?.message || `Request failed (${res.status})`);
    }
    const blob = await res.blob();
    const objUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(objUrl);
};

// const downloadFile = async (url: string, filename: string): Promise<void> => {
//     const res = await fetch(url, { headers: getHeaders() });
//     if (!res.ok) {
//         const text = await res.text();
//         const data = text ? JSON.parse(text) : null;
//         throw new Error(data?.Message || data?.message || `Request failed (${res.status})`);
//     }
//     const blob = await res.blob();
//     const objUrl = window.URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = objUrl;
//     a.download = filename;
//     a.click();
//     window.URL.revokeObjectURL(objUrl);
// };

export const adminService = {

    // 1. Dashboard
    getDashboard: () => apiCall(`${API_BASE}/dashboard`),

    // 2. Roles
    getRoles: () => apiCall(`${API_BASE}/getallroles`),
    createRole: (data?: any) => apiCall(`${API_BASE}/creteroles`, "POST", data),
    updateRole: (id?: any, data?: any) => apiCall(`${API_BASE}/updateroles/${id}`, "PUT", data),
    deleteRole: (id?: any) => apiCall(`${API_BASE}/deleteroles/${id}`, "DELETE"),

    // 3. Permissions
    getAllPermissions: () => apiCall(`${API_BASE}/getallpermissions`),
    getPermissionById: (id?: any) => apiCall(`${API_BASE}/getpermissions/${id}`),
    createPermission: (data?: any) => apiCall(`${API_BASE}/createpermissions`, "POST", data),
    updatePermission: (id?: any, data?: any) => apiCall(`${API_BASE}/updatepermissions/${id}`, "PUT", data),
    deletePermission: (id?: any) => apiCall(`${API_BASE}/deletepermissions/${id}`, "DELETE"),
    togglePermissionStatus: (id?: any) => apiCall(`${API_BASE}/permissions/${id}/toggle-status`, "PATCH"),

    // 4. Role-Permission Mapping
    assignRolePermissions: (data?: any) => apiCall(`${API_BASE}/assignpermissions`, "POST", data),
    getRolePermissions: (roleId?: any) => apiCall(`${API_BASE}/getrolepermissions/${roleId}`),
    removeRolePermission: (roleId?: any, permissionId?: any) => apiCall(`${API_BASE}/removerolepermission/${roleId}/${permissionId}`, "DELETE"),

    // 5. Employee
    getEmployees: (filters?: any) => apiCall(`${API_BASE}/getallemployees${buildQuery(filters)}`),
    createEmployee: (data?: any) => apiCall(`${API_BASE}/CreateEmployee`, "POST", data),
    updateEmployee: (id?: any, data?: any) => apiCall(`${API_BASE}/updateemployee/${id}`, "PUT", data),
    toggleEmployeeStatus: (id?: any, status?: any) => apiCall(`${API_BASE}/employees/${id}/toggle-status`, "PATCH", { status }),
    deleteEmployee: (id?: any) => apiCall(`${API_BASE}/deleteemployee/${id}`, "DELETE"),

    // 6. Department
    getDepartments: () => apiCall(`${API_BASE}/GetDepartments`),
    createDepartment: (data?: any) => apiCall(`${API_BASE}/CreateDepartment`, "POST", data),
    updateDepartment: (id?: any, data?: any) => apiCall(`${API_BASE}/UpdateDepartment/${id}`, "PUT", data),
    deleteDepartment: (id?: any) => apiCall(`${API_BASE}/DeleteDepartment/${id}`, "DELETE"),

    // 7. Designation
    getDesignations: () => apiCall(`${API_BASE}/GetDesignations`),
    createDesignation: (data?: any) => apiCall(`${API_BASE}/CreateDesignation`, "POST", data),
    updateDesignation: (id?: any, data?: any) => apiCall(`${API_BASE}/UpdateDesignation/${id}`, "PUT", data),
    deleteDesignation: (id?: any) => apiCall(`${API_BASE}/DeleteDesignation/${id}`, "DELETE"),

    // 8. Attendance
    getDashboardStats: () => apiCall(`${ATTENDANCE_API_BASE}/dashboard-stats`),
    getAttendanceAll: (filters?: any) => apiCall(`${ATTENDANCE_API_BASE}/all${buildQuery(filters)}`),
    markAttendance: (payload?: any) => apiCall(`${ATTENDANCE_API_BASE}/mark`, "POST", payload),
    getRegRequests: (filters?: any) => apiCall(`${ATTENDANCE_API_BASE}/regularization${buildQuery(filters)}`),
    updateRegStatus: (reqId?: any, status?: any, approvedBy?: any) => apiCall(`${ATTENDANCE_API_BASE}/regularization/${reqId}/action?status=${status}&approvedBy=${approvedBy}`, "PATCH"),
    generateSummary: (payload?: any) => apiCall(`${ATTENDANCE_API_BASE}/summary/generate`, "POST", payload),
    getSummary: (filters?: any) => apiCall(`${ATTENDANCE_API_BASE}/summary${buildQuery(filters)}`),
    createRegRequest: (payload?: any) => apiCall(`${ATTENDANCE_API_BASE}/regularization`, "POST", payload), // 🆕 FIXED
    getSundayHolidayStatus: (month?: any, year?: any) => apiCall(`${ATTENDANCE_API_BASE}/sunday-holiday-status?month=${month}&year=${year}`),
    downloadSundayHolidayStatusPdf: (month?: any, year?: any) =>downloadFile(`${ATTENDANCE_API_BASE}/sunday-holiday-status/pdf?month=${month}&year=${year}`,
        `Sunday_Holiday_Working_Status_${String(month).padStart(2, "0")}_${year}.pdf`),
    markSundayDuty: (payload?: any) =>apiCall(`${ATTENDANCE_API_BASE}/sunday-holiday-status/mark`, "POST", payload),

    // 9. Leave Management
    getLeaveTypes: () => apiCall(`${API_BASE}/types`),
    createLeaveType: (data?: any) => apiCall(`${API_BASE}/types`, "POST", data),
    updateLeaveType: (id?: any, data?: any) => apiCall(`${API_BASE}/types/${id}`, "PUT", data),
    deleteLeaveType: (id?: any) => apiCall(`${API_BASE}/types/${id}`, "DELETE"),
    getAllLeaveBalances: (year = new Date().getFullYear()) => apiCall(`${API_BASE}/balance/all?year=${year}`),
    initializeBalance: (data?: any) => apiCall(`${API_BASE}/balance/initialize`, "POST", data),
    getAllLeaveRequests: (filters?: any) => apiCall(`${API_BASE}/requests${buildQuery(filters)}`),
    createLeaveRequest: (data?: any) => apiCall(`${API_BASE}/request`, "POST", data),
    actionLeaveRequest: (leaveId?: any, payload?: any) => apiCall(`${API_BASE}/requests/${leaveId}/action`, "PATCH", payload),

    // 10. Page Master
    getAllPages: () => apiCall(`${API_BASE}/getallpages`),
    getRolePages: (roleId?: any) => apiCall(`${API_BASE}/getrolepages/${roleId}`),
    updateRolePages: (payload?: any) => apiCall(`${API_BASE}/updaterolepages`, "PUT", payload),
    createPage: (payload?: any) => apiCall(`${API_BASE}/addpage`, "POST", payload),
    updatePage: (payload?: any) => apiCall(`${API_BASE}/updatepage`, "PUT", payload),
    deletePage: (pageId?: any) => apiCall(`${API_BASE}/deletepage/${pageId}`, "DELETE"),

    // 11. Payroll & Salary Pipeline
    setEmployeeSalary: (payload?: any) => apiCall(`${API_BASE}/salary/set`, "POST", payload),
    getEmployeeSalary: (empId?: any) => apiCall(`${API_BASE}/salary/${empId}`),
    getSalaryStructures: () => apiCall(`${API_BASE}/structures`),
    generatePayroll: (payload?: any) => apiCall(`${API_BASE}/generate`, "POST", payload),
    getPayrollMonths: () => apiCall(`${API_BASE}/months`),
    getPayrollDetails: (month?: any, year?: any, empId: any = "") => apiCall(`${API_BASE}/details?month=${month}&year=${year}${empId ? `&empId=${empId}` : ''}`),
    finalizePayroll: (payload?: any) => apiCall(`${API_BASE}/finalize`, "POST", payload),
    markPayrollPaid: (month?: any, year?: any) => apiCall(`${API_BASE}/markpaid?month=${month}&year=${year}`, "POST"),
    getPayslip: (empId?: any, month?: any, year?: any) => apiCall(`${API_BASE}/payslip/${empId}?month=${month}&year=${year}`),
    addDeduction: (payload?: any) => apiCall(`${API_BASE}/deductions/add`, "POST", payload),
    actionDeduction: (payload?: any) => apiCall(`${API_BASE}/deductions/action`, "PATCH", payload),
    getDeductions: (status: any = "") => apiCall(`${API_BASE}/deductions${status ? `?status=${status}` : ''}`),
    getAllEmployeeSalaries: () => apiCall(`${API_BASE}/salary/all`),

    // 12. Employee Loans / Advances
    createLoan: (payload?: any) => apiCall(`${API_BASE}/loans`, "POST", payload),
    getLoansByEmployee: (empId?: any) => apiCall(`${API_BASE}/loans/employee/${empId}`),
    getAllLoans: (status: any = "") => apiCall(`${API_BASE}/loans${status ? `?status=${status}` : ''}`),
    actionLoan: (payload?: any) => apiCall(`${API_BASE}/loans/action`, "PATCH", payload),
    closeLoan: (payload?: any) => apiCall(`${API_BASE}/loans/close`, "PATCH", payload),

    // 13. Overtime
    createOvertime: (payload?: any) => apiCall(`${API_BASE}/overtime`, "POST", payload),
    getAllOvertime: (filters?: any) => apiCall(`${API_BASE}/overtime${buildQuery(filters)}`),
    actionOvertime: (payload?: any) => apiCall(`${API_BASE}/overtime/action`, "PATCH", payload),

    // 14. Late Mark Rules
    createLateMarkRule: (payload?: any) => apiCall(`${API_BASE}/late-mark-rule`, "POST", payload),
    getActiveLateMarkRule: () => apiCall(`${API_BASE}/late-mark-rule/active`),
    getLateMarkRuleHistory: () => apiCall(`${API_BASE}/late-mark-rule/history`),

    // 15 A. Job Requisition
    createRequisition: (data?: any) => apiCall(`${API_BASE}/requisitions`, "POST", data),
    actionRequisition: (data?: any) => apiCall(`${API_BASE}/requisitions/action`, "PATCH", data),
    getAllRequisitions: (status: any = "") => apiCall(`${API_BASE}/requisitions${status ? `?status=${status}` : ''}`),
    getRequisitionById: (id?: any) => apiCall(`${API_BASE}/requisitions/${id}`),

    // B. Job Posting
    createJobPosting: (data?: any) => apiCall(`${API_BASE}/postings`, "POST", data),
    updateJobPosting: (data?: any) => apiCall(`${API_BASE}/postings`, "PUT", data),
    getAllJobPostings: (publishedOnly: any = null) => apiCall(`${API_BASE}/postings${publishedOnly !== null ? `?publishedOnly=${publishedOnly}` : ''}`),
    getJobPostingById: (id?: any) => apiCall(`${API_BASE}/postings/${id}`),
    getRecruitmentStatusReport: (filters: any = {}) => apiCall(`${API_BASE}/reports/recruitment-status${buildQuery(filters)}`),

    // C. Application System
    applyForJob: (data?: any) => apiCall(`${BASE}/api/admin/apply`, "POST", data),

    // D. Candidate Management
    searchCandidates: (filters?: any) => apiCall(`${API_BASE}/candidates${buildQuery(filters)}`),
    getCandidateById: (id?: any) => apiCall(`${API_BASE}/candidates/${id}`),
    updateCandidateStatus: (data?: any) => apiCall(`${API_BASE}/candidates/status`, "PATCH", data),

    // E. Interview Management
    scheduleInterview: (data?: any) => apiCall(`${API_BASE}/interviews`, "POST", data),
    submitInterviewFeedback: (data?: any) => apiCall(`${API_BASE}/interviews/feedback`, "PATCH", data),
    getInterviewsByCandidate: (candidateId?: any) => apiCall(`${API_BASE}/interviews/candidate/${candidateId}`),
    approveSelection: (data?: any) => apiCall(`${API_BASE}/interviews/selection-approval`, "PATCH", data),

    // F. Offer & Joining
    createOffer: (data?: any) => apiCall(`${API_BASE}/offers`, "POST", data),
    actionOffer: (data?: any) => apiCall(`${API_BASE}/offers/action`, "PATCH", data),
    getOfferByCandidate: (candidateId?: any) => apiCall(`${API_BASE}/offers/candidate/${candidateId}`),
    confirmJoining: (data?: any) => apiCall(`${API_BASE}/joining/confirm`, "POST", data),
    downloadOfferLetter: (candidateId?: any) => downloadFile(`${API_BASE}/candidates/${candidateId}/offer-letter`, `Offer_Letter_${candidateId}.docx`),
    downloadAppointmentLetter: (candidateId?: any) => downloadFile(`${API_BASE}/candidates/${candidateId}/appointment-letter`, `Appointment_Letter_${candidateId}.docx`),
    downloadRegularizationLetter: (candidateId?: any, effectiveDate?: any) => downloadFile(`${API_BASE}/candidates/${candidateId}/regularization-letter?effectiveDate=${effectiveDate}`,`Regularization_Letter_${candidateId}.docx`),
    downloadRelievingLetter: (candidateId?: any) => downloadFile(`${API_BASE}/candidates/${candidateId}/relieving-letter`, `Relieving_Letter_${candidateId}.docx`),

    // 17. Self Service (Profile)
    getMyProfile: () => apiCall(`${BASE}/api/hr/profile`),
    getMyLeaveBalance: (year?: any) => apiCall(`${BASE}/api/hr/leave/balance?year=${year}`),
    getMyLeaveRequests: (params?: any) => apiCall(`${BASE}/api/hr/leave/requests?${new URLSearchParams(params)}`),
    applyLeave: (data?: any) => apiCall(`${BASE}/api/hr/leave/apply`, "POST", data),

    // 18. Self Service (Attendance)
    getMyAttendance: (params?: any) => apiCall(`${BASE}/api/hr/attendance?${new URLSearchParams(params)}`),
    requestRegularization: (data?: any) => apiCall(`${BASE}/api/hr/attendance/regularize`, "POST", data),
    getMyRegularizations: (params?: any) => apiCall(`${BASE}/api/hr/attendance/regularize?${new URLSearchParams(params)}`),

    // 19. Self Service (Payslip & Loans)
    getMyPayslip: (month?: any, year?: any) => apiCall(`${BASE}/api/hr/payslip?month=${month}&year=${year}`),
    getMyLoans: () => apiCall(`${BASE}/api/hr/loans`),

    // 20. Self Service (Documents & Bank)
    getMyDocuments: () => apiCall(`${BASE}/api/hr/documents`),
    getMyBankDetails: () => apiCall(`${BASE}/api/hr/bank-details`),

    // 21. Reports
    getEmployeeReportData: (filters?: any) => apiCall(`${BASE}/api/hr/employees${buildQuery(filters)}`),
    getAttendanceReportData: (filters?: any) => apiCall(`${BASE}/api/hr/attendancereport${buildQuery(filters)}`),
    getLeaveReportData: (filters?: any) => apiCall(`${BASE}/api/hr/leave${buildQuery(filters)}`),
    getPayrollReportData: (filters?: any) => apiCall(`${BASE}/api/hr/payroll${buildQuery(filters)}`),

    // ── 22. Sales & Lead Pipeline (FULLY ALIGNED WITH C# CONTROLLER) ──────

    // Segments
    getSegments: () => apiCall(`${SALES_API_BASE}/segments`),
    createSegment: (data?: any) => apiCall(`${SALES_API_BASE}/segments`, "POST", data),
    updateSegment: (data?: any) => apiCall(`${SALES_API_BASE}/segments`, "PUT", data),

    // Leads
    getLeads: (filters: any = {}) => apiCall(`${SALES_API_BASE}/leads${buildQuery(filters)}`),
    createLead: (data?: any) => apiCall(`${SALES_API_BASE}/leads`, "POST", data),
    getLeadById: (id?: any) => apiCall(`${SALES_API_BASE}/leads/${id}`),
    updateLead: (data?: any) => apiCall(`${SALES_API_BASE}/leads`, "PUT", data),

    // Follow-ups
    getFollowups: (leadId?: any) => apiCall(`${SALES_API_BASE}/followups/lead/${leadId}`),
    createFollowup: (data?: any) => apiCall(`${SALES_API_BASE}/followups`, "POST", data),

    // Survey & Feasibility
    getSurveys: (leadId?: any) => apiCall(`${SALES_API_BASE}/surveys/lead/${leadId}`),
    createSurvey: (data?: any) => apiCall(`${SALES_API_BASE}/surveys`, "POST", data),
    // FIXED: Changed to PATCH as per C# [HttpPatch("surveys/feasibility")]
    updateFeasibility: (data?: any) => apiCall(`${SALES_API_BASE}/surveys/feasibility`, "PATCH", data),

    // Proposals
    getProposalsByLead: (leadId?: any) => apiCall(`${SALES_API_BASE}/proposals/lead/${leadId}`),
    createProposal: (data?: any) => apiCall(`${SALES_API_BASE}/proposals`, "POST", data),
    // FIXED: Changed to PATCH as per C# [HttpPatch("proposals/action")]
    proposalAction: (data?: any) => apiCall(`${SALES_API_BASE}/proposals/action`, "PATCH", data),

    // Payments
    getPaymentsByLead: (leadId?: any) => apiCall(`${SALES_API_BASE}/payments/lead/${leadId}`),
    createPayment: (data?: any) => apiCall(`${SALES_API_BASE}/payments`, "POST", data),

    // BOM (Material Booking)
    getBomByLead: (leadId?: any) => apiCall(`${SALES_API_BASE}/bom/lead/${leadId}`),
    createBom: (data?: any) => apiCall(`${SALES_API_BASE}/bom`, "POST", data),

    // FIXED: Changed to PATCH as per C# [HttpPatch("bom/booking")]
    updateBomBooking: (data?: any) => apiCall(`${SALES_API_BASE}/bom/booking`, "PATCH", data),

    // Dispatch
    getDispatchByLead: (leadId?: any) => apiCall(`${SALES_API_BASE}/dispatch/lead/${leadId}`),
    createDispatch: (data?: any) => apiCall(`${SALES_API_BASE}/dispatch`, "POST", data),

    // FIXED: Changed to PATCH as per C# [HttpPatch("dispatch/status")]
    updateDispatchStatus: (data?: any) => apiCall(`${SALES_API_BASE}/dispatch/status`, "PATCH", data),

    // 22f. Documents
    getDocumentsByLead: (leadId?: any) => apiCall(`${SALES_API_BASE}/documents/lead/${leadId}`),
    saveDocument: (data?: any) => apiCall(`${SALES_API_BASE}/documents`, "POST", data),
    uploadDocument: (data?: any) => apiCall(`${SALES_API_BASE}/documents/upload`, "POST", data),

    // 22g. Reminders — create + mark done
    createReminder: (data?: any) => apiCall(`${SALES_API_BASE}/reminders`, "POST", data),
    getPendingReminders: (assignedTo?: any) => apiCall(`${SALES_API_BASE}/reminders/pending${assignedTo ? `?assignedTo=${assignedTo}` : ''}`),
    markReminderDone: (id?: any) => apiCall(`${SALES_API_BASE}/reminders/${id}/done`, "PATCH"),

    // ── 23. Inventory Module (Exact Routes) ──────────────────────────────

    // 1-5: Item Master
    createItem: (data?: any) => apiCall(`${BASE}/api/hr/items`, "POST", data),
    updateItem: (data?: any) => apiCall(`${BASE}/api/hr/items`, "PUT", data), //
    getAllItems: (filters?: any) => apiCall(`${BASE}/api/hr/items${buildQuery(filters)}`),
    getItemById: (id?: any) => apiCall(`${BASE}/api/hr/items/${id}`),
    toggleItemStatus: (id?: any) => apiCall(`${BASE}/api/hr/items/${id}/toggle-status`, "PATCH"),

    // 6-8: Stock Operations
    stockIn: (data?: any) => apiCall(`${BASE}/api/hr/stock-in`, "POST", data),
    stockOut: (data?: any) => apiCall(`${BASE}/api/hr/stock-out`, "POST", data),
    stockAdjustment: (data?: any) => apiCall(`${BASE}/api/hr/stock-adjustment`, "POST", data),

    // 9-10: Transactions / Ledger
    getItemHistory: (itemId?: any) => apiCall(`${BASE}/api/hr/transactions/item/${itemId}`),
    getGlobalHistory: (filters?: any) => apiCall(`${BASE}/api/hr/transactions${buildQuery(filters)}`),

    // 11: Reports
    getLowStockReport: () => apiCall(`${BASE}/api/hr/reports/low-stock`),

    // ── 24. HR — Milestone Notifications (Probation / Anniversary) ────────
    getProbationAlerts: (daysAhead: any = 7) => apiCall(`${BASE}/api/hr/milestones/probation?daysAhead=${daysAhead}`),
    getAnniversaryAlerts: (daysAhead: any = 7) => apiCall(`${BASE}/api/hr/milestones/anniversary?daysAhead=${daysAhead}`),
    getAllMilestoneAlerts: (daysAhead: any = 7) => apiCall(`${BASE}/api/hr/milestones/all?daysAhead=${daysAhead}`),
    markNotificationSent: (payload?: any) => apiCall(`${BASE}/api/hr/milestones/mark-sent`, "PATCH", payload),
    getMilestoneHistory: (filters?: any) => apiCall(`${BASE}/api/hr/milestones/history${buildQuery(filters)}`),

    // ── 25. HR — Employee Promotion & Hierarchy ────────────────────────────
    promoteEmployee: (payload?: any) => apiCall(`${BASE}/api/hr/employees/promote`, "POST", payload),
    getPromotionHistory: (empId?: any) => apiCall(`${BASE}/api/hr/employees/${empId}/promotions`),
    getAllPromotions: (filters?: any) => apiCall(`${BASE}/api/hr/promotions${buildQuery(filters)}`),
    setHierarchy: (payload?: any) => apiCall(`${BASE}/api/hr/hierarchy`, "PUT", payload),
    getDirectReports: (empId?: any) => apiCall(`${BASE}/api/hr/hierarchy/${empId}/reports`),
    getOrgChart: (rootEmpId?: any) => apiCall(`${BASE}/api/hr/hierarchy/orgchart${rootEmpId ? `?rootEmpId=${rootEmpId}` : ''}`),

    // ── 26. HR — Salary Increment History ──────────────────────────────────
    addSalaryIncrement: (payload?: any) => apiCall(`${BASE}/api/hr/salary/increment`, "POST", payload),
    getCurrentSalary: (empId?: any) => apiCall(`${BASE}/api/hr/salary/current/${empId}`),
    getSalaryHistory: (empId?: any) => apiCall(`${BASE}/api/hr/salary/history/${empId}`),
    getSalaryAsOfDate: (empId?: any, asOfDate?: any) => apiCall(`${BASE}/api/hr/salary/as-of/${empId}?asOfDate=${asOfDate}`),
    getAllIncrements: (filters?: any) => apiCall(`${BASE}/api/hr/salary/increments${buildQuery(filters)}`),

    //--27-- Employee Documents & Bank Details (HRController → /api/hr)

    // ── Employee Documents ──
    getEmployeeDocuments: (empId?: any) => apiCall(`${SALES_API_BASE}/document/${empId}`),
    getEmployeeDocumentById: (docId?: any) => apiCall(`${SALES_API_BASE}/document/details/${docId}`),
    uploadEmployeeDocument: (data?: any) => apiCall(`${SALES_API_BASE}/document/upload`, "POST", data),
    updateEmployeeDocument: (data?: any) => apiCall(`${SALES_API_BASE}/document/update`, "PUT", data),
    deleteEmployeeDocument: (docId?: any) => apiCall(`${SALES_API_BASE}/document/delete/${docId}`, "DELETE"),

    // ── Employee Bank Details ──
    getBankDetails: (empId?: any) => apiCall(`${SALES_API_BASE}/bank/${empId}`),
    getBankDetailById: (bankId?: any) => apiCall(`${SALES_API_BASE}/bank/details/${bankId}`),
    createBankDetail: (data?: any) => apiCall(`${SALES_API_BASE}/bank/create`, "POST", data),
    updateBankDetail: (data?: any) => apiCall(`${SALES_API_BASE}/bank/update`, "PUT", data),
    deleteBankDetail: (bankId?: any) => apiCall(`${SALES_API_BASE}/bank/delete/${bankId}`, "DELETE"),

    // ── Password ──
    revealEmployeeCredentials: (empId?: any, secretKey?: any) => apiCall(`${API_BASE}/employees/${empId}/reveal-credentials`, "POST", { secretKey }),
    // ── 28. Public Site  ──

    // Banners 
    getBanners: () => apiCall(`${SITE_API_BASE}/banner`),
    createBanner: (data?: any) => apiCall(`${SITE_API_BASE}/banner`, "POST", data),
    updateBanner: (data?: any) => apiCall(`${SITE_API_BASE}/banner`, "PUT", data),
    deleteBanner: (id?: any) => apiCall(`${SITE_API_BASE}/banner/${id}`, "DELETE"),

    // Gallery
    getGallery: () => apiCall(`${SITE_API_BASE}/gallery`),
    createGallery: (data?: any) => apiCall(`${SITE_API_BASE}/gallery`, "POST", data),
    updateGallery: (data?: any) => apiCall(`${SITE_API_BASE}/gallery`, "PUT", data),
    deleteGallery: (id?: any) => apiCall(`${SITE_API_BASE}/gallery/${id}`, "DELETE"),

    // Team
    getTeam: () => apiCall(`${SITE_API_BASE}/team`),
    createTeam: (data?: any) => apiCall(`${SITE_API_BASE}/team`, "POST", data),
    updateTeam: (data?: any) => apiCall(`${SITE_API_BASE}/team`, "PUT", data),
    deleteTeam: (id?: any) => apiCall(`${SITE_API_BASE}/team/${id}`, "DELETE"),

    // Projects (multi-image)
    getProjects: () => apiCall(`${SITE_API_BASE}/projects`),
    createProject: (data?: any) => apiCall(`${SITE_API_BASE}/projects`, "POST", data),
    updateProject: (data?: any) => apiCall(`${SITE_API_BASE}/projects`, "PUT", data),
    deleteProject: (id?: any) => apiCall(`${SITE_API_BASE}/projects/${id}`, "DELETE"),

    // Highlights
    getHighlights: () => apiCall(`${SITE_API_BASE}/highlights`),
    createHighlight: (data?: any) => apiCall(`${SITE_API_BASE}/highlights`, "POST", data),
    updateHighlight: (data?: any) => apiCall(`${SITE_API_BASE}/highlights`, "PUT", data),
    deleteHighlight: (id?: any) => apiCall(`${SITE_API_BASE}/highlights/${id}`, "DELETE"),

    // Career
    getCareers: () => apiCall(`${SITE_API_BASE}/career`),
    createCareer: (data?: any) => apiCall(`${SITE_API_BASE}/career`, "POST", data),
    updateCareer: (data?: any) => apiCall(`${SITE_API_BASE}/career`, "PUT", data),
    deleteCareer: (id?: any) => apiCall(`${SITE_API_BASE}/career/${id}`, "DELETE"),

    // Contact Queries (read / mark-read / delete only — no create)
    getContactQueries: (isRead?: any) => apiCall(`${SITE_API_BASE}/contact-query${isRead !== undefined && isRead !== null ? `?isRead=${isRead}` : ''}`),
    markQueryRead: (id?: any) => apiCall(`${SITE_API_BASE}/contact-query/${id}/mark-read`, "PATCH"),
    deleteContactQuery: (id?: any) => apiCall(`${SITE_API_BASE}/contact-query/${id}`, "DELETE"),

    // SUPPLIY
    createSupplier: (data?: any) => apiCall(`${SALES_API_BASE}/suppliers`, "POST", data),
    updateSupplier: (data?: any) => apiCall(`${SALES_API_BASE}/suppliers`, "PUT", data),
    toggleSupplierStatus: (id?: any) => apiCall(`${SALES_API_BASE}/suppliers/${id}/toggle-status`, "PATCH"),
    getSupplierById: (id?: any) => apiCall(`${SALES_API_BASE}/suppliers/${id}`),
    searchSuppliers: (filters?: any) => apiCall(`${SALES_API_BASE}/suppliers${buildQuery(filters)}`), 

    // PO Consignees
    createConsignee: (data?: any) => apiCall(`${SALES_API_BASE}/consignees`, "POST", data),
    getAllConsignees: () => apiCall(`${SALES_API_BASE}/consignees`),

    // Purchase Orders
    createPurchaseOrder: (data?: any) => apiCall(`${SALES_API_BASE}/orders`, "POST", data),
    updatePoStatus: (data?: any) => apiCall(`${SALES_API_BASE}/orders/status`, "PATCH", data), 
    getPurchaseOrderById: (id?: any) => apiCall(`${SALES_API_BASE}/orders/${id}`),
    searchPurchaseOrders: (filters?: any) => apiCall(`${SALES_API_BASE}/orders${buildQuery(filters)}`), 

    // GRN (Goods Receipt Note)
    createGrn: (data?: any) => apiCall(`${SALES_API_BASE}/grn`, "POST", data),
    getGrnsByPo: (poId?: any) => apiCall(`${SALES_API_BASE}/grn/po/${poId}`),

    // Purchase Invoices
    createPurchaseInvoice: (data?: any) => apiCall(`${SALES_API_BASE}/invoices`, "POST", data),
    updateInvoiceStatus: (data?: any) => apiCall(`${SALES_API_BASE}/invoices/status`, "PATCH", data), 
    getPurchaseInvoiceById: (id?: any) => apiCall(`${SALES_API_BASE}/invoices/${id}`),
    searchPurchaseInvoices: (filters?: any) => apiCall(`${SALES_API_BASE}/invoices${buildQuery(filters)}`), 
    getInvoicesByPo: (poId?: any) => apiCall(`${SALES_API_BASE}/invoices/po/${poId}`),
};

