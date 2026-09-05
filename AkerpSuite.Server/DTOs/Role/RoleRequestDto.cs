using System.Text.Json.Serialization;

namespace AkerpSuite.Server.DTOs.Role
{
    public class RoleRequestDto
    {
        public string RoleName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsCmdEqual { get; set; }
    }
    public class PermissionRequestDto
    {
        public string ModuleName { get; set; } = string.Empty;
        public string PermissionName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
    public class RolePermissionRequestDto
    {
        public int RoleId { get; set; }
        public List<int> PermissionIds { get; set; } = new();
    }
    public class EmployeeRequestDto
    {
        [JsonPropertyName("empCode")]
        public string? EmpCode { get; set; }

        [JsonPropertyName("username")]
        public string? Username { get; set; }

        [JsonPropertyName("password")]
        public string? Password { get; set; }

        [JsonPropertyName("firstName")]
        public string FirstName { get; set; } = string.Empty;

        [JsonPropertyName("lastName")]
        public string LastName { get; set; } = string.Empty;

        [JsonPropertyName("fatherHusbandName")]
        public string? FatherHusbandName { get; set; }

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = string.Empty;

        [JsonPropertyName("dateOfBirth")]
        public DateTime DateOfBirth { get; set; }

        [JsonPropertyName("bloodGroup")]
        public string? BloodGroup { get; set; }

        [JsonPropertyName("maritalStatus")]
        public string? MaritalStatus { get; set; }

        [JsonPropertyName("personalEmail")]
        public string? PersonalEmail { get; set; }

        [JsonPropertyName("officialEmail")]
        public string OfficialEmail { get; set; } = string.Empty;

        [JsonPropertyName("mobile")]
        public string Mobile { get; set; } = string.Empty;

        [JsonPropertyName("alternateMobile")]
        public string? AlternateMobile { get; set; }

        [JsonPropertyName("addressLine1")]
        public string? AddressLine1 { get; set; }

        [JsonPropertyName("addressLine2")]
        public string? AddressLine2 { get; set; }

        [JsonPropertyName("city")]
        public string? City { get; set; }

        [JsonPropertyName("state")]
        public string? State { get; set; }

        [JsonPropertyName("pincode")]
        public string? Pincode { get; set; }

        [JsonPropertyName("country")]
        public string? Country { get; set; }

        [JsonPropertyName("aadharNo")]
        public string? AadharNo { get; set; }

        [JsonPropertyName("panNo")]
        public string? PanNo { get; set; }

        [JsonPropertyName("passportNo")]
        public string? PassportNo { get; set; }

        [JsonPropertyName("uanNo")]
        public string? UanNo { get; set; }

        [JsonPropertyName("esicNo")]
        public string? EsicNo { get; set; }

        [JsonPropertyName("deptId")]
        public int DeptId { get; set; }

        [JsonPropertyName("desigId")]
        public int DesigId { get; set; }

        [JsonPropertyName("reportingManager")]
        public int? ReportingManager { get; set; }

        [JsonPropertyName("roleId")]
        public int RoleId { get; set; }

        [JsonPropertyName("dateOfJoining")]
        public DateTime DateOfJoining { get; set; }

        [JsonPropertyName("employmentType")]
        public string EmploymentType { get; set; } = string.Empty;

        [JsonPropertyName("employmentStatus")]
        public string EmploymentStatus { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string? Category { get; set; }

        [JsonPropertyName("currentCtc")]
        public decimal? CurrentCtc { get; set; }

        [JsonPropertyName("probationEndDate")]
        public DateTime? ProbationEndDate { get; set; }

        [JsonPropertyName("confirmationDate")]
        public DateTime? ConfirmationDate { get; set; }

        [JsonPropertyName("resignationDate")]
        public DateTime? ResignationDate { get; set; }

        [JsonPropertyName("lastWorkingDate")]
        public DateTime? LastWorkingDate { get; set; }

        [JsonPropertyName("exitReason")]
        public string? ExitReason { get; set; }

        [JsonPropertyName("photoBase64")]
        public string? PhotoBase64 { get; set; }

        [JsonPropertyName("photoExtension")]
        public string? PhotoExtension { get; set; }
    }

    public class AttendanceRequestDto
    {
        public int EmpId { get; set; }
        public DateTime AttDate { get; set; }
        public string? CheckIn { get; set; }
        public string? CheckOut { get; set; }
        public string? Status { get; set; }
        public string? Source { get; set; } = "Manual";
        public string? Remarks { get; set; }
        public int? CreatedBy { get; set; }
        public decimal? Latitude { get; set; }      
        public decimal? Longitude { get; set; }
        public string? LocationAddress { get; set; }
        public decimal? CheckOutLatitude { get; set; }
        public decimal? CheckOutLongitude { get; set; }
        public string? CheckOutLocationAddress { get; set; }
    }
    public class AttendanceRegRequestDto
    {
        public int EmpId { get; set; }
        public DateTime RequestDate { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
    public class AttendanceSummaryRequestDto
    {
        public int EmpId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
    }
    public class DepartmentRequestDto
    {
        public string DepartmentName { get; set; } = string.Empty;
        public string DepartmentCode { get; set; } = string.Empty;
        public int? ParentDepartmentId { get; set; }
    }
    public class DesignationRequestDto
    {
        public string DesignationName { get; set; } = string.Empty;
        public int DesignationLevel { get; set; }
        public int DeptId { get; set; }
    }
    public class RolePageUpdateRequestDto
    {
        public int RoleId { get; set; }
        public string PageIds { get; set; } = string.Empty;
    }
    public class PageMasterRequestDto
    {
        public string PageName { get; set; } = string.Empty;
        public string PageLink { get; set; } = string.Empty;
        public string PageIcon { get; set; } = string.Empty;
        public string PageType { get; set; } = string.Empty;
    }
    public class PageMasterUpdateRequestDto
    {
        public int PageId { get; set; }
        public string PageName { get; set; } = string.Empty;
        public string PageLink { get; set; } = string.Empty;
        public string PageIcon { get; set; } = string.Empty;
        public string PageType { get; set; } = string.Empty;
    }
    public class LeaveTypeRequestDto
    {
        public string LeaveCode { get; set; } = string.Empty;
        public string LeaveName { get; set; } = string.Empty;
        public int MaxPerYear { get; set; }
        public bool CarryForward { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class LeaveRequestDto
    {
        public int EmpId { get; set; }
        public int LeaveTypeId { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public decimal TotalDays { get; set; }
        public string? Reason { get; set; }
    }

    public class LeaveActionRequestDto
    {
        public string Status { get; set; } = string.Empty;
        public int ApprovedBy { get; set; }
        public string? Remarks { get; set; }
        public int? ForwardedTo { get; set; }
        public string? ForwardedToRole { get; set; }
        public int? LeaveTypeId { get; set; }
    }

    public class LeaveBalanceInitRequestDto
    {
        public int EmpId { get; set; }
        public int Year { get; set; }
    }

    public class LeaveBalanceCreateRequestDto
    {
        public int EmpId { get; set; }
        public int LeaveTypeId { get; set; }
        public int Year { get; set; }
        public int TotalLeaves { get; set; }
        public decimal UsedLeaves { get; set; }
    }

    public class LeaveBalanceUpdateRequestDto
    {
        public int TotalLeaves { get; set; }
        public decimal UsedLeaves { get; set; }
    }


    public class EmployeeSalaryRequestDto
    {
        public int EmpId { get; set; }
        public int? StructureId { get; set; }
        public decimal EpfBasic { get; set; }
        public decimal Basic { get; set; }
        public decimal Hra { get; set; }
        public decimal Ta { get; set; }
        public decimal Da { get; set; }
        public decimal SpecialAllow { get; set; }
        public decimal PfEmployee { get; set; }
        public decimal PfEmployer { get; set; }
        public decimal EsicEmployee { get; set; }
        public decimal EsicEmployer { get; set; }
        public decimal Tds { get; set; }
        public decimal ProfessionalTax { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public int CreatedBy { get; set; }
    }

    public class PayrollGenerateRequestDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public int CreatedBy { get; set; }
    }
    public class PayrollFinalizeRequestDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public int ApprovedBy { get; set; }
    }
    public class SalaryDeductionRequestDto
    {
        public int EmpId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public string DeductionType { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public DateTime EntryDate { get; set; }
        public int CreatedBy { get; set; }
    }
    public class SalaryDeductionActionDto
    {
        public int DeductionId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ApprovedBy { get; set; }
        public string? Remarks { get; set; }

    }
    public class EmployeeSalaryListResponseDto
    {
        public int SalId { get; set; }
        public int EmpId { get; set; }
        public string EmpCode { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int? StructureId { get; set; }
        public string? StructureName { get; set; }
        public decimal Basic { get; set; }
        public decimal Hra { get; set; }
        public decimal Ta { get; set; }
        public decimal Da { get; set; }
        public decimal SpecialAllow { get; set; }
        public decimal PfEmployee { get; set; }
        public decimal PfEmployer { get; set; }
        public decimal EsicEmployee { get; set; }
        public decimal EsicEmployer { get; set; }
        public decimal Tds { get; set; }
        public decimal ProfessionalTax { get; set; }
        public DateTime EffectiveFrom { get; set; }
    }
    public class LoanRequestDto
    {
        public int EmpId { get; set; }
        public string LoanType { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal EmiAmount { get; set; }
        public DateTime LoanDate { get; set; }
        public string? Remarks { get; set; }
    }
    public class LoanActionDto
    {
        public int LoanId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ApprovedBy { get; set; }
    }
    public class LoanCloseDto
    {
        public int LoanId { get; set; }
        public string? Remarks { get; set; }
    }
    public class OvertimeRequestDto
    {
        public int EmpId { get; set; }
        public DateTime OtDate { get; set; }
        public decimal OtHours { get; set; }
        public string? Reason { get; set; }
    }
    public class OvertimeActionDto
    {
        public int OtId { get; set; }
        public string Status { get; set; } = string.Empty;
        public int ApprovedBy { get; set; }
    }
    public class LateMarkRuleRequestDto
    {
        public int LatesCount { get; set; }
        public string PenaltyType { get; set; } = string.Empty;
    }
    public class JobRequisitionRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public int DepartmentId { get; set; }
        public int DesignationId { get; set; }
        public int Vacancies { get; set; }
        public string? ExperienceRequired { get; set; }
        public string? Description { get; set; }
        public int RequestedBy { get; set; }
    }
    public class JobRequisitionActionDto
    {
        public int RequisitionId { get; set; }
        public string Stage { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int ApprovedBy { get; set; }
        public string? Remarks { get; set; }
    }

    public class OfferRequestDto
    {
        public int CandidateId { get; set; }
        public int OfferedDesignationId { get; set; }
        public int OfferedDepartmentId { get; set; }
        public decimal OfferedSalary { get; set; }
        public DateTime OfferDate { get; set; }
        public DateTime ExpectedJoiningDate { get; set; }
        public int CreatedBy { get; set; }
    }
    public class JoiningConfirmationRequestDto
    {
        public int OfferId { get; set; }
        public int CandidateId { get; set; }
        public DateTime ActualJoiningDate { get; set; }
        public int ConfirmedBy { get; set; }
        public string? EmployeeCode { get; set; }
    }
    public class JobPostingRequestDto
    {
        public int RequisitionId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string EmploymentType { get; set; } = string.Empty;
        public string? SalaryRange { get; set; }
        public DateTime? ClosingDate { get; set; }
        public bool IsPublished { get; set; }
        public int CreatedBy { get; set; }
    }
    public class RecruitmentStatusReportDto
    {
        public int RequisitionId { get; set; }
        public string? RequisitionTitle { get; set; }
        public string? DepartmentName { get; set; }
        public string? DesignationName { get; set; }
        public int Vacancies { get; set; }
        public string? RequisitionStatus { get; set; }
        public string? RequisitionStage { get; set; }
        public DateTime RequisitionDate { get; set; }
        public int? PostingId { get; set; }
        public string? PostingStatus { get; set; }
        public bool? IsPublished { get; set; }
        public string? ShareableLink { get; set; }
        public DateTime? PostingDate { get; set; }
        public int TotalApplied { get; set; }
        public int TotalShortlisted { get; set; }
        public int TotalInterview { get; set; }
        public int TotalSelected { get; set; }
        public int TotalRejected { get; set; }
        public int TotalOffer { get; set; }
        public int TotalJoined { get; set; }
    }

    public class JobPostingUpdateRequestDto : JobPostingRequestDto
    {
        public int PostingId { get; set; }
    }
    public class CandidateSearchRequestDto
    {
        public int? JobPostingId { get; set; }
        public string? Status { get; set; }
        public string? Name { get; set; }
        public string? Skills { get; set; }
    }

    public class InterviewScheduleRequestDto
    {
        public int CandidateId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string Mode { get; set; } = string.Empty; 
        public string? Location { get; set; }
        public string? Interviewers { get; set; }
        public int RoundNo { get; set; } = 1;
    }

    public class InterviewFeedbackRequestDto
    {
        public int InterviewId { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Result { get; set; } = string.Empty;
        public int RoundNo { get; set; } = 1;
        public int ApprovedBy { get; set; }
    }

    public class OfferCreateRequestDto
    {
        public int CandidateId { get; set; }
        public decimal OfferedCtc { get; set; }
        public DateTime JoiningDate { get; set; }
        public DateTime? OfferExpiry { get; set; }
        public int ApprovedBy { get; set; }
    }
    public class ConfirmJoiningRequestDto
    {
        public int CandidateId { get; set; }
        public DateTime JoiningDate { get; set; }
    }
    public class SundayDutyRequestDto
    {
        public int EmpId { get; set; }
        public DateTime DutyDate { get; set; }
        public string Status { get; set; } = "OFF";
        public string? Location { get; set; }
        public bool CountsAsDuty { get; set; } = true;
    }
}