using AkerpSuite.Server.Dtos.Auth;
using AkerpSuite.Server.DTOs.Role;

namespace AkerpSuite.Server.Repositories
{
    public interface IAdminRepositories
    {
        #region Cmd Dashboard
        Task<IEnumerable<DashboardCardDto>> GetDashboardByRoleAsync(int roleId);
        #endregion

        #region Role Management
        Task<int> CreateRoleAsync(RoleRequestDto request);
        Task<IEnumerable<RoleResponseDto>> GetRolesAsync();
        Task<RoleResponseDto?> GetRoleByIdAsync(int roleId);
        Task<bool> UpdateRoleAsync(int roleId, RoleRequestDto request);
        Task<bool> DeleteRoleAsync(int roleId);
        #endregion

        #region Role Permission
        Task<int> CreatePermissionAsync(PermissionRequestDto request);
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
        Task<int> CreateEmployeeAsync(EmployeeRequestDto request, string passwordHash, string photoPath);
        Task<bool> UpdateEmployeeAsync(int employeeId, EmployeeRequestDto request, string photoPath);
        Task<IEnumerable<EmployeeResponseDto>> GetAllEmployeesAsync(int? departmentId, int? roleId, string? status, int? designationId);
        Task<EmployeeResponseDto?> GetEmployeeByIdAsync(int employeeId);
        Task<bool> DeleteEmployeeAsync(int employeeId);
        Task<bool> ToggleEmployeeStatusAsync(int employeeId, string status);

        //new methods
        Task<bool> EmailExistsAsync(string email);
        Task<int> GetNextEmpCodeNumberAsync();
        Task<string> GenerateUniqueUsernameAsync(string baseUsername);
        Task InitializeLeaveBalancesAsync(int empId, int year);

        #endregion

        #region Department Management
        Task<int> CreateDepartmentAsync(DepartmentRequestDto request);
        Task<IEnumerable<DepartmentResponseDto>> GetDepartmentsAsync();
        Task<DepartmentResponseDto?> GetDepartmentByIdAsync(int deptId);
        Task<bool> UpdateDepartmentAsync(int deptId, DepartmentRequestDto request);
        Task<bool> DeleteDepartmentAsync(int deptId);

        #endregion

        #region Designation Management
        Task<int> CreateDesignationAsync(DesignationRequestDto request);
        Task<IEnumerable<DesignationResponseDto>> GetDesignationsAsync();
        Task<DesignationResponseDto?> GetDesignationByIdAsync(int desigId);
        Task<bool> UpdateDesignationAsync(int desigId, DesignationRequestDto request);
        Task<bool> DeleteDesignationAsync(int desigId);

        #endregion

        #region Page Master
        Task<IEnumerable<PageMasterResponseDto>> GetAllPagesAsync();
        Task<IEnumerable<PageMasterResponseDto>> GetPagesByRoleAsync(int roleId);
        Task<IEnumerable<PageMasterResponseDto>> GetRolePageListAsync(int roleId);
        Task<bool> AddPageAsync(PageMasterRequestDto request);
        Task<bool> UpdateRolePagesAsync(RolePageUpdateRequestDto request);
        Task<bool> UpdatePageAsync(PageMasterUpdateRequestDto request);
        Task<bool> DeletePageAsync(int pageId);
        #endregion

        #region Attendance Management
        //Task<int> MarkAttendanceAsync(AttendanceRequestDto request);
        Task<MarkAttendanceResultDto> MarkAttendanceAsync(AttendanceRequestDto request);
        Task<IEnumerable<AttendanceResponseDto>> GetAttendanceByEmpAsync(int empId, DateTime? fromDate, DateTime? toDate);
        Task<IEnumerable<AttendanceResponseDto>> GetAllAttendanceAsync(int? empId, DateTime? attDate, string? status, DateTime? fromDate, DateTime? toDate);
        Task<int> CreateRegRequestAsync(AttendanceRegRequestDto request);
        //  Task<IEnumerable<AttendanceRegResponseDto>> GetAllRegRequestsAsync(int? empId, string? status);
        Task<IEnumerable<AttendanceRegResponseDto>> GetAllRegRequestsAsync(int? empId, string? status, string? requestType);
        Task<bool> RegActionAsync(int requestId, string status, int approvedBy);
        Task<int> GenerateSummaryAsync(int empId, int month, int year);
        Task<string> GenerateAllSummariesAsync(int month, int year);
        Task<IEnumerable<AttendanceSummaryResponseDto>> GetSummaryAsync(int? empId, int? month, int? year);

        #endregion

        #region Leave Types
        Task<int> CreateLeaveTypeAsync(LeaveTypeRequestDto request);
        Task<IEnumerable<LeaveTypeResponseDto>> GetAllLeaveTypesAsync();
        Task<LeaveTypeResponseDto?> GetLeaveTypeByIdAsync(int id);
        Task<bool> UpdateLeaveTypeAsync(int id, LeaveTypeRequestDto request);
        Task<bool> DeleteLeaveTypeAsync(int id);

        // Leave Balance
        Task<bool> InitializeBalanceAsync(int empId, int year);
        Task<IEnumerable<LeaveBalanceResponseDto>> GetLeaveBalanceAsync(int empId, int year);
        Task<IEnumerable<LeaveBalanceResponseDto>> GetAllLeaveBalancesAsync(int year);

        // Leave Requests
        Task<LeaveRequestResponseDto> CreateLeaveRequestAsync(LeaveRequestDto request);
        Task<IEnumerable<LeaveRequestResponseDto>> GetAllLeaveRequestsAsync(int? empId, string? status, int? month, int? year);
        Task<LeaveRequestResponseDto?> GetLeaveRequestByIdAsync(int leaveId);
        Task<bool> LeaveActionAsync(int leaveId, LeaveActionRequestDto request);
        Task<IEnumerable<LeaveRequestResponseDto>> GetLeaveHistoryAsync(int empId, int? year);

        #endregion

        #region Salary Structure 
        // Salary Structure
        Task<int> SetEmployeeSalaryAsync(EmployeeSalaryRequestDto request);
        Task<EmployeeSalaryResponseDto?> GetEmployeeSalaryAsync(int empId);

        // Payroll
        Task<int> GeneratePayrollAsync(int month, int year, int createdBy);
        Task<IEnumerable<PayrollMonthResponseDto>> GetPayrollMonthsAsync();
        Task<IEnumerable<PayrollDetailResponseDto>> GetPayrollDetailsAsync(int month, int year, int? empId);
        Task<int> FinalizePayrollAsync(int month, int year, int approvedBy);
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
        //  Task<int> CreateJobPostingAsync(JobPostingRequestDto request);
        Task<int> CreateJobPostingAsync(JobPostingRequestDto request, string shareableLink);
        Task<bool> UpdateJobPostingAsync(JobPostingUpdateRequestDto request);
        Task<IEnumerable<dynamic>> GetAllJobPostingsAsync(bool? publishedOnly);
        Task<dynamic?> GetJobPostingByIdAsync(int id);
        Task<IEnumerable<RecruitmentStatusReportDto>> GetRecruitmentStatusReportAsync(DateTime? fromDate, DateTime? toDate);
        #endregion

        #region Application System
        Task<(int Id, string ApplicationCode)> CreateApplicationAsync(CandidateApplicationRequestDto request);
        Task MarkAcknowledgementSentAsync(int candidateId);
        // Candidate Management
        Task<IEnumerable<dynamic>> SearchCandidatesAsync(CandidateSearchRequestDto filter);
        Task<dynamic?> GetCandidateByIdAsync(int id);
        Task<bool> UpdateCandidateStatusAsync(CandidateStatusUpdateDto request);

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
        Task<int> ConfirmJoiningAsync(JoiningConfirmationRequestDto request);
        Task<int> ConvertCandidateToEmployeeAsync(int candidateId, int offerId, string? employeeCode);
        Task<CandidateJoiningDataDto?> GetCandidateJoiningDataAsync(int candidateId);
        Task<int?> GetEmployeeIdByCandidateIdAsync(int candidateId);
        Task LinkEmployeeToCandidateAsync(int empId, int candidateId);
        Task MarkCandidateJoinedAsync(int candidateId);

        #endregion

        #region Password
        Task<(string Username, int UserId)?> GetUserCredsInfoByEmpIdAsync(int empId);
        Task UpdateUserPasswordAsync(int userId, string passwordHash);
        #endregion

        #region Issue offer latter and appointemt latter
        Task<dynamic?> GetCandidateLetterDataAsync(int candidateId);
        Task<dynamic?> GetEmployeeLetterDataByCandidateAsync(int candidateId);

        #endregion

        #region Sunday work
        Task<List<EmployeeBasicDto>> GetActiveEmployeesBasicAsync();
        Task<List<SundayDutyRecord>> GetSundayDutyRecordsAsync(DateTime monthStart, DateTime monthEnd);
        Task<List<SundayLedgerRecord>> GetSundayLedgerAsync(int month, int year);
        Task UpsertSundayDutyAsync(SundayDutyRequestDto request, int createdBy);
        Task RecalculateLedgerAsync(int empId, int month, int year);
        #endregion











    }
}

