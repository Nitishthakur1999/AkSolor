using AkerpSuite.Server.Dtos.Auth;
using AkerpSuite.Server.DTOs.Role;

namespace AkerpSuite.Server.Services
{
    public interface IAdminService
    {

        #region Dashboard
        Task<IEnumerable<DashboardCardDto>> GetDashboardAsync(int roleId);

        #endregion

        #region Role Management
        Task<RoleResponseDto> CreateRoleAsync(RoleRequestDto request);
        Task<IEnumerable<RoleResponseDto>> GetRolesAsync();
        Task<RoleResponseDto?> GetRoleByIdAsync(int id);
        Task<bool> UpdateRoleAsync(int id, RoleRequestDto request);
        Task<bool> DeleteRoleAsync(int id);

        #endregion

        #region Role Permission
        Task<PermissionResponseDto> CreatePermissionAsync(PermissionRequestDto request);
        Task<IEnumerable<PermissionResponseDto>> GetPermissionsAsync();
        Task<PermissionResponseDto?> GetPermissionByIdAsync(int permissionId);
        Task<bool> UpdatePermissionAsync(int permissionId, PermissionRequestDto request);
        Task<bool> DeletePermissionAsync(int permissionId);
        Task<bool> ToggleStatusAsync(int permissionId);
        Task<bool> AssignPermissionsAsync(RolePermissionRequestDto request);
        Task<IEnumerable<RolePermissionResponseDto>> GetRolePermissionsAsync(int roleId);
        Task<bool> RemovePermissionAsync(int roleId, int permissionId);

        #endregion

        #region Employee Management
        Task<EmployeeResponseDto> CreateEmployeeAsync(EmployeeRequestDto request, string creatorRole);
        Task<bool> UpdateEmployeeAsync(int employeeId, EmployeeRequestDto request, string currentPhotoPath);
        Task<IEnumerable<EmployeeResponseDto>> GetAllEmployeesAsync(int? departmentId, int? roleId, string? status, int? designationId, string viewerRole);
        Task<EmployeeResponseDto?> GetEmployeeByIdAsync(int employeeId);
        Task<bool> DeleteEmployeeAsync(int employeeId);
        Task<bool> ToggleEmployeeStatusAsync(int employeeId, string status);

        #endregion

        #region Department Management
        Task<DepartmentResponseDto> CreateDepartmentAsync(DepartmentRequestDto request);
        Task<IEnumerable<DepartmentResponseDto>> GetDepartmentsAsync();
        Task<DepartmentResponseDto?> GetDepartmentByIdAsync(int deptId);
        Task<bool> UpdateDepartmentAsync(int deptId, DepartmentRequestDto request);
        Task<bool> DeleteDepartmentAsync(int deptId);

        #endregion

        #region Designation Management
        Task<DesignationResponseDto> CreateDesignationAsync(DesignationRequestDto request);
        Task<IEnumerable<DesignationResponseDto>> GetDesignationsAsync();
        Task<DesignationResponseDto?> GetDesignationByIdAsync(int desigId);
        Task<bool> UpdateDesignationAsync(int desigId, DesignationRequestDto request);
        Task<bool> DeleteDesignationAsync(int desigId);

        #endregion

        #region Page Master
        Task<bool> AddPageAsync(PageMasterRequestDto request);
        Task<bool> DeletePageAsync(int pageId);
        Task<bool> UpdatePageAsync(PageMasterUpdateRequestDto request);
        Task<IEnumerable<PageMasterResponseDto>> GetAllPagesAsync();
        Task<IEnumerable<PageMasterResponseDto>> GetPagesByRoleAsync(int roleId);
        Task<IEnumerable<PageMasterResponseDto>> GetRolePageListAsync(int roleId);
        Task<bool> UpdateRolePagesAsync(RolePageUpdateRequestDto request);
        #endregion

        #region Attendance Management
        Task<MarkAttendanceResultDto> MarkAttendanceAsync(AttendanceRequestDto request);
        Task<IEnumerable<AttendanceResponseDto>> GetAttendanceByEmpAsync(int empId, DateTime? fromDate, DateTime? toDate);
        Task<IEnumerable<AttendanceResponseDto>> GetAllAttendanceAsync(int? empId, DateTime? attDate, string? status, DateTime? fromDate, DateTime? toDate);
        Task<int> CreateRegRequestAsync(AttendanceRegRequestDto request);
        //  Task<IEnumerable<AttendanceRegResponseDto>> GetAllRegRequestsAsync(int? empId, string? status);
        Task<IEnumerable<AttendanceRegResponseDto>> GetAllRegRequestsAsync(int? empId, string? status, string? requestType);
        Task<bool> RegActionAsync(int requestId, string status, int approvedBy);
        Task<int> GenerateSummaryAsync(int empId, int month, int year);
        Task<IEnumerable<AttendanceSummaryResponseDto>> GetSummaryAsync(int? empId, int? month, int? year);
        Task<AttendanceDashboardStatsDto> GetAttendanceDashboardStatsAsync();
        #endregion

        #region Leave Management
        Task<LeaveTypeResponseDto> CreateLeaveTypeAsync(LeaveTypeRequestDto request);
        Task<IEnumerable<LeaveTypeResponseDto>> GetAllLeaveTypesAsync();
        Task<LeaveTypeResponseDto?> GetLeaveTypeByIdAsync(int id);
        Task<bool> UpdateLeaveTypeAsync(int id, LeaveTypeRequestDto request);
        Task<bool> DeleteLeaveTypeAsync(int id);
        Task<LeaveRequestResponseDto> UpdateLeaveRequestAsync(int leaveId, int empId, LeaveRequestDto request);
        Task<bool> CancelLeaveRequestAsync(int leaveId, int empId);

        // Leave Balance
        Task<bool> InitializeBalanceAsync(int empId, int year);
        Task<IEnumerable<LeaveBalanceResponseDto>> GetLeaveBalanceAsync(int empId, int year);
        Task<IEnumerable<LeaveBalanceResponseDto>> GetAllLeaveBalancesAsync(int year);

        // Leave Requests
        Task<LeaveRequestResponseDto> CreateLeaveRequestAsync(LeaveRequestDto request);
        Task<IEnumerable<LeaveRequestResponseDto>> GetAllLeaveRequestsAsync(int? empId, string? status, int? month, int? year);
        Task<LeaveRequestResponseDto?> GetLeaveRequestByIdAsync(int leaveId);
        Task<bool> LeaveActionAsync(int leaveId, LeaveActionRequestDto request, int roleId);
        Task<IEnumerable<LeaveRequestResponseDto>> GetLeaveHistoryAsync(int empId, int? year);

        #endregion

        #region Salary Structure
        Task<int> SetEmployeeSalaryAsync(EmployeeSalaryRequestDto request);
        Task<EmployeeSalaryResponseDto?> GetEmployeeSalaryAsync(int empId);

        // Payroll
        Task<int> GeneratePayrollAsync(PayrollGenerateRequestDto request);
        Task<IEnumerable<PayrollMonthResponseDto>> GetPayrollMonthsAsync();
        Task<IEnumerable<PayrollDetailResponseDto>> GetPayrollDetailsAsync(int month, int year, int? empId);
        Task<int> FinalizePayrollAsync(PayrollFinalizeRequestDto request);
        Task<bool> MarkPaidAsync(int month, int year);

        // Payslip
        Task<PayslipResponseDto?> GetPayslipAsync(int empId, int month, int year);

        // Salary Deductions
        Task<int> AddDeductionAsync(SalaryDeductionRequestDto request);
        Task<bool> DeductionActionAsync(SalaryDeductionActionDto request);
        Task<IEnumerable<SalaryDeductionResponseDto>> GetDeductionsAsync(int? empId, int? month, int? year, string? status);

        // Salary Structures Master
        Task<IEnumerable<SalaryStructureResponseDto>> GetSalaryStructuresAsync();
        Task<IEnumerable<EmployeeSalaryListResponseDto>> GetAllEmployeeSalariesAsync();

        #endregion

        #region Employee Loans

        Task<int> CreateLoanAsync(LoanRequestDto request);
        Task<IEnumerable<LoanResponseDto>> GetLoansByEmpAsync(int empId);
        Task<IEnumerable<LoanResponseDto>> GetAllLoansAsync(string? status);
        Task<bool> LoanActionAsync(LoanActionDto request);
        Task<bool> CloseLoanAsync(LoanCloseDto request);

        #endregion

        #region Overtime Requests

        Task<int> CreateOvertimeAsync(OvertimeRequestDto request);
        Task<IEnumerable<OvertimeResponseDto>> GetAllOvertimeAsync(
            int? empId,
            string? status,
            DateTime? fromDate,
            DateTime? toDate);
        Task<bool> OvertimeActionAsync(OvertimeActionDto request);

        #endregion

        #region Late Mark Rules
        Task<int> CreateLateMarkRuleAsync(LateMarkRuleRequestDto request);
        Task<LateMarkRuleResponseDto?> GetActiveLateMarkRuleAsync();
        Task<IEnumerable<LateMarkRuleResponseDto>> GetAllLateMarkRulesAsync();

        #endregion

        #region Payroll Loan Integration
        Task<int> ApplyLoanEmiAsync(int month, int year);

        #endregion

        #region Job Requisition
        Task<int> CreateRequisitionAsync(JobRequisitionRequestDto request);
        Task<bool> ActionRequisitionAsync(JobRequisitionActionDto request);
        Task<IEnumerable<dynamic>> GetAllRequisitionsAsync(string? status);
        Task<dynamic?> GetRequisitionByIdAsync(int id);

        #endregion

        #region Job Posting
        Task<int> CreateJobPostingAsync(JobPostingRequestDto request);
        Task<bool> UpdateJobPostingAsync(JobPostingUpdateRequestDto request);
        Task<IEnumerable<dynamic>> GetAllJobPostingsAsync(bool? publishedOnly);
        Task<dynamic?> GetJobPostingByIdAsync(int id);
        Task<IEnumerable<RecruitmentStatusReportDto>> GetRecruitmentStatusReportAsync(DateTime? fromDate, DateTime? toDate);
        #endregion

        #region Candidate Application
        // Candidate Management
        Task<IEnumerable<dynamic>> SearchCandidatesAsync(CandidateSearchRequestDto filter);
        Task<dynamic?> GetCandidateByIdAsync(int id);
        Task<bool> UpdateCandidateStatusAsync(CandidateStatusUpdateDto request);

        // Application System
        Task<(int Id, string ApplicationCode)> ApplyAsync(CandidateApplicationRequestDto request);

        #endregion

        #region Interview Management
        Task<int> ScheduleInterviewAsync(InterviewScheduleRequestDto request);
        Task<bool> SubmitInterviewFeedbackAsync(InterviewFeedbackRequestDto request);
        Task<IEnumerable<dynamic>> GetInterviewsByCandidateAsync(int candidateId);
        Task<bool> SelectionApprovalAsync(InterviewSelectionApprovalDto request);
        #endregion

        #region Offer & Joining
        Task<int> CreateOfferAsync(OfferCreateRequestDto request);
        Task<bool> OfferActionAsync(OfferActionDto request);
        Task<dynamic?> GetOfferByCandidateAsync(int candidateId);
        //  Task<int> ConfirmJoiningAndConvertAsync(JoiningConfirmationRequestDto request);
        Task<EmployeeResponseDto> ConfirmJoiningAndConvertAsync(JoiningConfirmationRequestDto request, string creatorRole);

        #endregion

        #region Password
        Task<(string Username, string NewPassword)> RevealEmployeeCredentialsAsync(int empId, string secretKey);
        #endregion

        #region Issue offer latter and appointemt latter
        Task<byte[]?> GenerateOfferLetterAsync(int candidateId);
        Task<byte[]?> GenerateAppointmentLetterAsync(int candidateId);
        Task<byte[]?> GenerateRegularizationLetterAsync(int candidateId, DateTime effectiveDate);
        Task<byte[]?> GenerateRelievingLetterAsync(int candidateId);

        #endregion

        #region Sunday duty
        Task<SundayHolidayStatusReportDto> GetSundayHolidayStatusAsync(int month, int year);
        Task<byte[]> GetSundayHolidayStatusPdfAsync(int month, int year);
        Task MarkSundayDutyAsync(SundayDutyRequestDto request, int createdBy);
        #endregion

    }
}
