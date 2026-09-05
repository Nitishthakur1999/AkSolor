using System.Text.Json.Serialization;

namespace AkerpSuite.Server.DTOs.Role
{
    public class DashboardCardDto
    {
        public string CardKey { get; set; } = string.Empty;
        public string CardTitle { get; set; } = string.Empty;
        public string CardIcon { get; set; } = string.Empty;
        public string IconColor { get; set; } = string.Empty;
        public string BgColor { get; set; } = string.Empty;
        public string? Prefix { get; set; }
        public decimal CardValue { get; set; }
        public int SortOrder { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string? FullName { get; set; }   
    }

    public class RevealCredentialsRequestDto
    {
        public string SecretKey { get; set; } = string.Empty;
    }

    public class RoleResponseDto
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public bool IsCmdEqual { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class PermissionResponseDto
    {
        public int PermissionId { get; set; }
        public string ModuleName { get; set; } = string.Empty;
        public string PermissionName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class RolePermissionResponseDto
    {
        public int RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public int PermissionId { get; set; }
        public string ModuleName { get; set; } = string.Empty;
        public string PermissionName { get; set; } = string.Empty;
    }
    public class EmployeeResponseDto
    {
        public int EmpId { get; set; }
        public string EmpCode { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? FatherHusbandName { get; set; }
        public string Gender { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string? BloodGroup { get; set; }
        public string? MaritalStatus { get; set; }
        public string? PersonalEmail { get; set; }
        public string? OfficialEmail { get; set; }
        public string? Mobile { get; set; }
        public string? AlternateMobile { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string? Country { get; set; }
        public string? AadharNo { get; set; }
        public string? PanNo { get; set; }
        public string? PassportNo { get; set; }
        public string? UanNo { get; set; }
        public string? EsicNo { get; set; }
        public int? DeptId { get; set; }
        public string? DeptName { get; set; }
        public int? DesigId { get; set; }
        public string? DesigName { get; set; }
        public int? ReportingManager { get; set; }
        public DateTime? DateOfJoining { get; set; }
        public string? EmploymentType { get; set; }
        public string? EmploymentStatus { get; set; }
        public string? Category { get; set; }
        public DateTime? ProbationEndDate { get; set; }
        public DateTime? ConfirmationDate { get; set; }
        public DateTime? ResignationDate { get; set; }
        public DateTime? LastWorkingDate { get; set; }
        public string? ExitReason { get; set; }
        public decimal? CurrentCtc { get; set; }
        public string? PhotoPath { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int? UserId { get; set; }
        public string? Username { get; set; }
        public int? RoleId { get; set; }
        public string? RoleName { get; set; }
        public string? GeneratedUsername { get; set; }
        public string? GeneratedPassword { get; set; }
    }

    public class AttendanceResponseDto
    {
        public int AttId { get; set; }
        public int EmpId { get; set; }
        public string? EmpCode { get; set; }
        public string? FullName { get; set; }
        public DateTime AttDate { get; set; }
        public TimeSpan? CheckIn { get; set; }
        public TimeSpan? CheckOut { get; set; }
        public string? Status { get; set; }
        public string? Source { get; set; }
        public int? LateMinutes { get; set; }
        public decimal? OvertimeHours { get; set; }
        public string? Remarks { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? CreatedAt { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public string? LocationAddress { get; set; }
        public decimal? CheckOutLatitude { get; set; }
        public decimal? CheckOutLongitude { get; set; }
        public string? CheckOutLocationAddress { get; set; }
        public bool IsLate { get; set; }
        public string? ApprovalStatus { get; set; }
        public int? ApprovalRequestId { get; set; }
    }

    public class AttendanceRegResponseDto
    {
        public int RequestId { get; set; }
        public int EmpId { get; set; }
        public string? EmpCode { get; set; }
        public string? FullName { get; set; }
        public DateTime RequestDate { get; set; }
        public string? Reason { get; set; }
        public string? Status { get; set; }
        public string? RequestType { get; set; }   
        public int? AttId { get; set; }            
        public int? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
    public class AttendanceSummaryResponseDto
    {
        public int SummaryId { get; set; }
        public int EmpId { get; set; }
        public string? FullName { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public int TotalWorkingDays { get; set; }
        public int PresentDays { get; set; }
        public int AbsentDays { get; set; }
        public int HalfDays { get; set; }
        public int LeaveDays { get; set; }
        public int LateMarks { get; set; }
        public decimal OvertimeHours { get; set; }
        public DateTime? GeneratedAt { get; set; }
    }
    public class AttendanceDashboardStatsDto
    {
        public int TotalEmployees { get; set; }
        public int PresentToday { get; set; }
        public int AbsentToday { get; set; }
        public int LateArrivals { get; set; }
    }
    public class MarkAttendanceResultDto
    {
        public int AttId { get; set; }
        public int LateMinutes { get; set; }
    }
    public class DepartmentResponseDto
    {
        public int DeptId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string? DepartmentCode { get; set; }
        public int? ParentDeptId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class DesignationResponseDto
    {
        public int DesigId { get; set; }
        public string DesignationName { get; set; } = string.Empty;
        public int DesignationLevel { get; set; }
        public int DeptId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class PageMasterResponseDto
    {
        public int PageId { get; set; }
        public string PageName { get; set; } = string.Empty;
        public string PageLink { get; set; } = string.Empty;
        public string PageIcon { get; set; } = string.Empty;
        public string PageType { get; set; } = string.Empty;
    }
    public class LeaveTypeResponseDto
    {
        public int LeaveTypeId { get; set; }
        public string LeaveCode { get; set; } = string.Empty;
        public string LeaveName { get; set; } = string.Empty;
        public int MaxPerYear { get; set; }
        public bool CarryForward { get; set; }
        public bool IsActive { get; set; }
    }

    public class LeaveBalanceResponseDto
    {
        public int BalanceId { get; set; }
        public int EmpId { get; set; }
        public string? FullName { get; set; }
        public string? EmpCode { get; set; }
        public int LeaveTypeId { get; set; }
        public string LeaveCode { get; set; } = string.Empty;
        public string LeaveName { get; set; } = string.Empty;
        public int Year { get; set; }
        public int TotalLeaves { get; set; }
        public decimal UsedLeaves { get; set; }
        public decimal BalanceLeaves { get; set; }
    }

    public class LeaveRequestResponseDto
    {
        public int LeaveId { get; set; }
        public int EmpId { get; set; }
        public string? EmpCode { get; set; }
        public string? FullName { get; set; }
        public string? Department { get; set; }
        public int LeaveTypeId { get; set; }
        public string LeaveCode { get; set; } = string.Empty;
        public string LeaveName { get; set; } = string.Empty;
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public decimal TotalDays { get; set; }
        public string? Reason { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? ApprovedBy { get; set; }
        public string? ApprovedByName { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? ErrorMessage { get; set; }
        public int? ForwardedTo { get; set; }
        public string? ForwardedToRole { get; set; }
    }
    public class EmployeeSalaryResponseDto
    {
        public int SalId { get; set; }
        public int EmpId { get; set; }
        public string EmpCode { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? StructureName { get; set; }
        public decimal EpfBasic { get; set; }
        public decimal Basic { get; set; }
        public decimal Hra { get; set; }
        public decimal Ta { get; set; }
        public decimal Da { get; set; }
        public decimal SpecialAllow { get; set; }
        public decimal GrossSalary { get; set; }
        public decimal PfEmployee { get; set; }
        public decimal PfEmployer { get; set; }
        public decimal EsicEmployee { get; set; }
        public decimal EsicEmployer { get; set; }
        public decimal Tds { get; set; }
        public decimal ProfessionalTax { get; set; }
        public decimal NetSalary { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
    }

    public class PayrollMonthResponseDto
    {
        public int PayrollId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public string Status { get; set; } = string.Empty;
        public int EmpCount { get; set; }
        public decimal TotalNetSalary { get; set; }
        public DateTime? FinalizedAt { get; set; }
        public DateTime? PaidAt { get; set; }
    }
    public class PayrollDetailResponseDto
    {
        public int DetailId { get; set; }
        public int PayrollId { get; set; }
        public int EmpId { get; set; }
        public string EmpCode { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? FatherHusbandName { get; set; }   
        public string? Category { get; set; }              
        public string? EsicNo { get; set; }                 
        public string? UanNo { get; set; }                 
        public string? DeptName { get; set; }
        public string? DesigName { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public string PayrollStatus { get; set; } = string.Empty;
        public decimal WorkingDays { get; set; }
        public decimal PresentDays { get; set; }
        public decimal AbsentDays { get; set; }
        public decimal HalfDays { get; set; }
        public int LateMarks { get; set; }
        public decimal OvertimeHours { get; set; }
        public decimal EpfBasic { get; set; }
        public decimal Basic { get; set; }
        public decimal Hra { get; set; }
        public decimal Ta { get; set; }
        public decimal Da { get; set; }
        public decimal SpecialAllow { get; set; }
        public decimal OvertimeAmount { get; set; }
        public decimal GrossEarning { get; set; }
        public decimal PfDeduction { get; set; }
        public decimal EsicDeduction { get; set; }
        public decimal TdsDeduction { get; set; }
        public decimal PtDeduction { get; set; }
        public decimal AbsentDeduction { get; set; }
        public decimal LateDeduction { get; set; }
        public decimal LoanDeduction { get; set; }
        public decimal PenaltyDeduction { get; set; }
        public decimal TotalDeduction { get; set; }
        public decimal NetSalary { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class PayslipResponseDto : PayrollDetailResponseDto
    {
        public string? OfficialEmail { get; set; }
        public string? Mobile { get; set; }
        public string? PanNo { get; set; }
        public string? UanNo { get; set; }
        public string? EsicNo { get; set; }
        public string? BankName { get; set; }
        public string? AccountNo { get; set; }
        public string? IfscCode { get; set; }
    }
    public class SalaryDeductionResponseDto
    {
        public int DeductionId { get; set; }
        public int EmpId { get; set; }
        public string EmpCode { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? DeptName { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public string DeductionType { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime EntryDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? Remarks { get; set; }
    }
    public class SalaryStructureResponseDto
    {
        public int StructureId { get; set; }
        public string StructureName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }
    public class LoanResponseDto
    {
        public int LoanId { get; set; }
        public int EmpId { get; set; }
        public string LoanType { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal EmiAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public DateTime LoanDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? ApprovedBy { get; set; }
        public string? Remarks { get; set; }
    }

    public class OvertimeResponseDto
    {
        public int OtId { get; set; }
        public int EmpId { get; set; }
        public DateTime OtDate { get; set; }
        public decimal OtHours { get; set; }
        public string? Reason { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class LateMarkRuleResponseDto
    {
        public int RuleId { get; set; }
        public int LatesCount { get; set; }
        public string PenaltyType { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class JobRequisitionResponseDto
    {
        public int RequisitionId { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public int DesignationId { get; set; }
        public string DesignationName { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public decimal SalaryRangeMin { get; set; }
        public decimal SalaryRangeMax { get; set; }
        public int RequestedBy { get; set; }
        public string RequestedByName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class JobPostingResponseDto
    {
        public int JobPostingId { get; set; }
        public int RequisitionId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string JobDescription { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal? SalaryRangeMin { get; set; }
        public decimal? SalaryRangeMax { get; set; }
        public bool PublishOnWebsite { get; set; }
        public string Status { get; set; } = string.Empty;
        public int CreatedBy { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class CandidateProfileDto
    {
        public int CandidateId { get; set; }
        public string ApplicationCode { get; set; } = string.Empty;
        public int JobPostingId { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Experience { get; set; }
        public string? Skills { get; set; }
        public string? CvPath { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime AppliedDate { get; set; }
    }

    public class InterviewResponseDto
    {
        public int InterviewId { get; set; }
        public int CandidateId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public string Interviewer { get; set; } = string.Empty;
        public string Mode { get; set; } = string.Empty;
        public string FeedbackNotes { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Recommendation { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
    public class OfferResponseDto
    {
        public int OfferId { get; set; }
        public int CandidateId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public int OfferedDepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public int OfferedDesignationId { get; set; }
        public string DesignationName { get; set; } = string.Empty;
        public decimal OfferedSalary { get; set; }
        public DateTime OfferDate { get; set; }
        public DateTime ExpectedJoiningDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class JoiningResponseDto
    {
        public int JoiningId { get; set; }
        public int OfferId { get; set; }
        public int CandidateId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public string EmployeeCode { get; set; } = string.Empty;
        public DateTime ActualJoiningDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
    public class CandidateJoiningDataDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string? Mobile { get; set; }
        public int DeptId { get; set; }
        public int DesigId { get; set; }
        public int? ReportingManager { get; set; }
        public decimal? OfferedCtc { get; set; }
    }
    public class CandidateApplicationRequestDto
    {
        public int JobPostingId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Experience { get; set; }
        public string? Skills { get; set; }
        public string? CvBase64 { get; set; }
        public string? CvExtension { get; set; }
        public string? CvPath { get; set; }
    }

    public class CandidateStatusUpdateDto
    {
        public int CandidateId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int UpdatedBy { get; set; }
        public string? Remarks { get; set; }
    }
    public class InterviewSelectionApprovalDto
    {
        public int CandidateId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ApprovedBy { get; set; }
        public string? Remarks { get; set; }
    }
    public class OfferActionDto
    {
        public int OfferId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ApprovedBy { get; set; }
        public string? Remarks { get; set; }
    }

        public class SundayCellDto
        {
            public DateTime Date { get; set; }
            public string Status { get; set; } = "OFF"; 
        }

        public class SundayHolidayStatusRowDto
        {
            public int SrNo { get; set; }
            public int EmpId { get; set; }
            public string EmployeeName { get; set; } = string.Empty;

            public List<SundayCellDto> Cells { get; set; } = new();

            public decimal MonthDutyCount { get; set; }
            public decimal MonthCompOff { get; set; }
            public decimal PreviousBalance { get; set; }
            public decimal FinalDues { get; set; }
        }

        public class SundayHolidayStatusReportDto
        {
            public string CompanyName { get; set; } = "AKS SOLAR SYSTEMS PRIVATE LIMITED";
            public int Month { get; set; }
            public int Year { get; set; }
            public string MonthName { get; set; } = string.Empty;

            public List<DateTime> SundayDates { get; set; } = new();
            public List<SundayHolidayStatusRowDto> Rows { get; set; } = new();

            public string PreparedByName { get; set; } = "Asha Thakur";
            public string PreparedByDesignation { get; set; } = "Sr. Manager (HR & Social Media)";

            public string VerifiedByName { get; set; } = "Vivek Grover";
            public string VerifiedByDesignation { get; set; } = "Director-Operations, Sales & Marketing";

            public string FinalVerifiedByName { get; set; } = "Kapil Sharma";
            public string FinalVerifiedByDesignation { get; set; } = "Chairman Cum Managing Director";
        }

        public class SundayDutyRecord
       {
        public int EmpId { get; set; }
        [JsonPropertyName("attDate")]
        public DateTime DutyDate { get; set; }
        public string Status { get; set; } = "OFF";
        public string? Location { get; set; }
        }

        public class SundayLedgerRecord
        {
            public int EmpId { get; set; }
            public decimal OpeningBalance { get; set; }
            public decimal DutyCount { get; set; }
            public decimal CompOffUsed { get; set; }
        }

        public class EmployeeBasicDto
        {
            public int EmpId { get; set; }
            public string FullName { get; set; } = string.Empty;
            public DateTime? JoiningDate { get; set; }
        }
    
}
