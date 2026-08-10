namespace AkerpSuite.Server.DTOs.Hr
{
    public class EmployeeDocumentResponseDto
    {
        public int DocId { get; set; }
        public int EmpId { get; set; }
        public string DocType { get; set; } = string.Empty;
        public string DocName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public DateTime UploadedAt { get; set; }
        public int UploadedBy { get; set; }
        public string? EmpCode { get; set; }
        public string? FullName { get; set; }
    }

    public class EmployeeBankDetailResponseDto
    {
        public int BankId { get; set; }
        public int EmpId { get; set; }
        public string BankName { get; set; } = string.Empty;
        public string AccountNo { get; set; } = string.Empty;
        public string IfscCode { get; set; } = string.Empty;
        public string? BranchName { get; set; }
        public string AccountType { get; set; } = string.Empty;
        public bool IsPrimary { get; set; }
        public string? EmpCode { get; set; }
        public string? FullName { get; set; }
    }
    public class SelfProfileResponseDto
    {
        public int EmpId { get; set; }
        public string EmpCode { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
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
        public decimal? CurrentCtc { get; set; }
        public string? PhotoPath { get; set; }
        public DateTime? ProbationEndDate { get; set; }
        public DateTime? ConfirmationDate { get; set; }
        public int? UserId { get; set; }
        public string? Username { get; set; }
        public int? RoleId { get; set; }
        public string? RoleName { get; set; }
        public bool IsActive { get; set; }
    }
    public class SelfLeaveBalanceResponseDto
    {
        public int BalanceId { get; set; }
        public int EmpId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int LeaveTypeId { get; set; }
        public string LeaveCode { get; set; } = string.Empty;
        public string LeaveName { get; set; } = string.Empty;
        public int Year { get; set; }
        public int TotalLeaves { get; set; }
        public decimal UsedLeaves { get; set; }
        public decimal BalanceLeaves { get; set; }
    }
    public class SelfAttendanceResponseDto
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
        public int LateMinutes { get; set; }
        public decimal OvertimeHours { get; set; }
        public string? Remarks { get; set; }
    }
    public class SelfAttendanceRegularizationResponseDto
    {
        public int RequestId { get; set; }
        public int EmpId { get; set; }
        public string? FullName { get; set; }
        public DateTime RequestDate { get; set; }
        public string? Reason { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
    public class SelfPayslipResponseDto
    {
        public int DetailId { get; set; }
        public int PayrollId { get; set; }
        public int EmpId { get; set; }
        public string? EmpCode { get; set; }
        public string? FullName { get; set; }
        public string? DeptName { get; set; }
        public string? DesigName { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public int WorkingDays { get; set; }
        public int PresentDays { get; set; }
        public int AbsentDays { get; set; }
        public int HalfDays { get; set; }
        public int LateMarks { get; set; }
        public decimal OvertimeHours { get; set; }
        public decimal Basic { get; set; }
        public decimal Hra { get; set; }
        public decimal Ta { get; set; }
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
        public string? PayrollStatus { get; set; }
        public string? BankName { get; set; }
        public string? AccountNo { get; set; }
        public string? IfscCode { get; set; }
    }
    public class SelfLoanResponseDto
    {
        public int LoanId { get; set; }
        public int EmpId { get; set; }
        public string? LoanType { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal EmiAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public DateTime LoanDate { get; set; }
        public string? Status { get; set; }
        public int? ApprovedBy { get; set; }
        public string? Remarks { get; set; }
    }
    public class SelfLeaveResponseDto
    {
        public int LeaveId { get; set; }
        public int EmpId { get; set; }
        public string? EmpCode { get; set; }
        public string? FullName { get; set; }
        public string? Department { get; set; }
        public int LeaveTypeId { get; set; }
        public string? LeaveCode { get; set; }
        public string? LeaveName { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public decimal TotalDays { get; set; }
        public string? Reason { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? ApprovedBy { get; set; }
        public string? ApprovedByName { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? Remarks { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? ErrorMessage { get; set; }
    }
    public class SalesLeadResponseDto
    {
        public int LeadId { get; set; }
        public DateTime LeadDate { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContactNo { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? Reference { get; set; }
        public int SegmentId { get; set; }
        public string? SegmentName { get; set; }
        public string? QueryType { get; set; }
        public string? Remarks { get; set; }
        public string? Label { get; set; }
        public DateTime? NextFollowup { get; set; }
        public int? AssignedTo { get; set; }
        public string? AssignedToName { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool NotFeasibleFlag { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class SalesSegmentResponseDto
    {
        public int SegmentId { get; set; }
        public string SegmentCode { get; set; } = string.Empty;
        public string SegmentName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }
    public class SalesFollowupResponseDto
    {
        public int FollowupId { get; set; }
        public int LeadId { get; set; }
        public DateTime FollowupDate { get; set; }
        public string? Remarks { get; set; }
        public string? Label { get; set; }
        public DateTime? NextFollowup { get; set; }
        public int? DoneBy { get; set; }
        public string? DoneByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class SalesSurveyResponseDto
    {
        public int SurveyId { get; set; }
        public int LeadId { get; set; }
        public DateTime? SurveyDate { get; set; }
        public int? SurveyorId { get; set; }
        public string? SurveyorName { get; set; }
        public string? SiteAddress { get; set; }
        public decimal? LoadKw { get; set; }
        public decimal? RoofAreaSqft { get; set; }
        public bool? ShadowFree { get; set; }
        public string? GridType { get; set; }
        public string? OtherDetails { get; set; }
        public string? DocPath { get; set; }
        public bool? IsFeasible { get; set; }
        public string? Remarks { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
    public class SalesProposalResponseDto
    {
        public int ProposalId { get; set; }
        public int LeadId { get; set; }
        public string ProposalNo { get; set; } = string.Empty;
        public DateTime? ProposalDate { get; set; }
        public decimal? SystemSizeKw { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal SubsidyAmount { get; set; }
        public decimal? NetAmount { get; set; }
        public int ValidityDays { get; set; }
        public string? DocPath { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool IsFinal { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class SalesPaymentResponseDto
    {
        public int PaymentId { get; set; }
        public int LeadId { get; set; }
        public int? ProposalId { get; set; }
        public DateTime? PaymentDate { get; set; }
        public decimal Amount { get; set; }
        public string? PaymentMode { get; set; }
        public string? ReferenceNo { get; set; }
        public string? Remarks { get; set; }
        public bool BomForwarded { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class SalesBomResponseDto
    {
        public int BomId { get; set; }
        public int LeadId { get; set; }
        public int ItemId { get; set; }
        public string? ItemName { get; set; }
        public string? ItemCode { get; set; }
        public decimal? RequiredQty { get; set; }
        public decimal? AvailableQty { get; set; }
        public decimal? ShortageQty { get; set; }
        public decimal BookedQty { get; set; }
    }

    public class SalesBomCreateResultDto
    {
        public int BomId { get; set; }
        public decimal ShortageQty { get; set; }
    }
    public class SalesDispatchResponseDto
    {
        public int DispatchId { get; set; }
        public int LeadId { get; set; }
        public DateTime? DispatchDate { get; set; }
        public int? DispatchBy { get; set; }
        public string? DispatchByName { get; set; }
        public string? Transporter { get; set; }
        public string? TrackingNo { get; set; }
        public string? Remarks { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
    public class SalesDocumentResponseDto
    {
        public int DocId { get; set; }
        public int LeadId { get; set; }
        public string? DocType { get; set; }
        public string? DocName { get; set; }
        public string? FilePath { get; set; }
        public int? UploadedBy { get; set; }
        public string? UploadedByName { get; set; }
        public DateTime UploadedAt { get; set; }
    }
    public class SalesReminderResponseDto
    {
        public int ReminderId { get; set; }
        public int? LeadId { get; set; }
        public string? ReminderType { get; set; }
        public DateTime ReminderDate { get; set; }
        public string? Message { get; set; }
        public int? AssignedTo { get; set; }
        public string? AssignedToName { get; set; }
        public bool IsDone { get; set; }
        public DateTime? DoneAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class InventoryItemResponseDto
    {
        public int ItemId { get; set; }
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Unit { get; set; }
        public decimal CurrentStock { get; set; }
        public decimal ReorderLevel { get; set; }
        public bool IsActive { get; set; }
    }
    public class InventoryTransactionResponseDto
    {
        public int TxnId { get; set; }
        public int ItemId { get; set; }
        public string? ItemName { get; set; }
        public string? ItemCode { get; set; }
        public string TxnType { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal BalanceAfter { get; set; }
        public string? ReferenceType { get; set; }
        public string? ReferenceNo { get; set; }
        public string? Remarks { get; set; }
        public int? CreatedBy { get; set; }
        public string? CreatedByName { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class EmployeeMilestoneResponseDto
    {
        public int NotifId { get; set; }
        public int EmpId { get; set; }
        public string EmpName { get; set; } = string.Empty;
        public DateTime DOJ { get; set; }
        public DateTime MilestoneDate { get; set; }
        public int DaysRemaining { get; set; }
        public string? DeptName { get; set; }
        public string? DesignationName { get; set; }
        public string NotifType { get; set; } = string.Empty;
    }
    //public class EmployeeMilestoneResponseDto
    //{
    //    public int EmpId { get; set; }
    //    public string EmpName { get; set; } = string.Empty;
    //    public DateTime DOJ { get; set; }
    //    public DateTime MilestoneDate { get; set; }
    //    public int DaysRemaining { get; set; }
    //    public string? DeptName { get; set; }
    //    public string? DesignationName { get; set; }
    //    public string NotifType { get; set; } = string.Empty; 
    //}

    public class EmployeeNotificationLogResponseDto
    {
        public int NotifId { get; set; }
        public int EmpId { get; set; }
        public string EmpName { get; set; } = string.Empty;
        public string NotifType { get; set; } = string.Empty;
        public DateTime NotifDate { get; set; }
        public string? Message { get; set; }
        public bool IsSent { get; set; }
        public DateTime? SentAt { get; set; }
    }
    public class OrgChartNodeResponseDto
    {
        public int EmpId { get; set; }
        public string EmpName { get; set; } = string.Empty;
        public int? ParentEmpId { get; set; }
        public int Level { get; set; }
        public string? DesignationName { get; set; }
        public string? DeptName { get; set; }
    }
    public class EmployeePromotionResponseDto
    {
        public int PromoId { get; set; }
        public int EmpId { get; set; }
        public string EmpName { get; set; } = string.Empty;
        public string? OldDesignation { get; set; }
        public string? NewDesignation { get; set; }
        public string? OldDepartment { get; set; }
        public string? NewDepartment { get; set; }
        public DateTime PromotionDate { get; set; }
        public decimal? OldCtc { get; set; }
        public decimal? NewCtc { get; set; }
        public string? Remarks { get; set; }
        public int? ApprovedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }
    public class EmployeeSalaryVersionResponseDto
    {
        public int SalId { get; set; }
        public int EmpId { get; set; }
        public string EmpName { get; set; } = string.Empty;
        public int? StructureId { get; set; }
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
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SalaryHistoryResponseDto : EmployeeSalaryVersionResponseDto
    {
        public decimal? IncrementAmount { get; set; }
    }
    // ── Banner ──
    public class BannerResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? SubTitle { get; set; }
        public string? ImagePath { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedOn { get; set; }
    }

    // ── Gallery ──
    public class GalleryResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? ImagePath { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedOn { get; set; }
    }

    // ── Our Team ──
    public class TeamResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? ImagePath { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }

    // ── Completed Projects ──
    public class ProjectResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? CapacityKw { get; set; }
        public string? Description { get; set; }
        public DateTime? CompletedOn { get; set; }
        public List<string> ImagePaths { get; set; } = new();
        public bool IsActive { get; set; }
    }

    // ── Highlights ──
    public class HighlightResponseDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImagePath { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }

    // ── Career ──
    public class CareerResponseDto
    {
        public int Id { get; set; }
        public string JobTitle { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? ExperienceRequired { get; set; }
        public string? Description { get; set; }
        public bool IsOpen { get; set; }
        public DateTime PostedOn { get; set; }
    }

    // ── Contact Query ──
    public class ContactQueryResponseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Subject { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime SubmittedOn { get; set; }
    }

    public class SupplierResponseDto
    {
        public int SupplierId { get; set; }
        public string SupplierName { get; set; }
        public string Gstin { get; set; }
        public string PanNo { get; set; }
        public string Address { get; set; }
        public string StateName { get; set; }
        public string StateCode { get; set; }
        public string ContactNo { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // ============================================================
    // PO CONSIGNEE — RESPONSE
    // ============================================================

    public class PoConsigneeResponseDto
    {
        public int ConsigneeId { get; set; }
        public string ConsigneeName { get; set; }
        public string SiteAddress { get; set; }
        public string Gstin { get; set; }
        public string StateName { get; set; }
        public string StateCode { get; set; }
        public int? LeadId { get; set; }
        public bool IsActive { get; set; }
    }

    // ============================================================
    // PURCHASE ORDER (header) — RESPONSE
    // ============================================================

    public class PurchaseOrderResponseDto
    {
        public int PoId { get; set; }
        public int VoucherNo { get; set; }
        public DateTime? PoDate { get; set; }
        public int SupplierId { get; set; }
        public string SupplierName { get; set; }
        public int? ConsigneeId { get; set; }
        public string ConsigneeName { get; set; }
        public string ReferenceNo { get; set; }
        public DateTime? ReferenceDate { get; set; }
        public string DispatchedThrough { get; set; }
        public string Destination { get; set; }
        public string TermsOfDelivery { get; set; }
        public string ModeOfPayment { get; set; }
        public string Status { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal IgstAmount { get; set; }
        public decimal RoundOff { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<PurchaseOrderItemResponseDto> Items { get; set; } = new();
    }

    // ============================================================
    // PURCHASE ORDER ITEM (line) — RESPONSE
    // ============================================================

    public class PurchaseOrderItemResponseDto
    {
        public int PoItemId { get; set; }
        public int PoId { get; set; }
        public int? ItemId { get; set; }
        public string ItemCode { get; set; }
        public string Description { get; set; }
        public string HsnSac { get; set; }
        public decimal GstRate { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; }
        public decimal Rate { get; set; }
        public decimal Amount { get; set; }
        public decimal ReceivedQty { get; set; }
        public decimal PendingQty => Quantity - ReceivedQty;
    }

    // ============================================================
    // GRN (Goods Receipt Note) — RESPONSE
    // ============================================================

    public class GrnResponseDto
    {
        public int GrnId { get; set; }
        public int PoId { get; set; }
        public DateTime? GrnDate { get; set; }
        public int? ReceivedBy { get; set; }
        public string Remarks { get; set; }
        public string PoStatus { get; set; }
        public List<GrnItemResponseDto> Items { get; set; } = new();
    }

    public class GrnItemResponseDto
    {
        public int GrnItemId { get; set; }
        public int PoItemId { get; set; }
        public int ItemId { get; set; }
        public string ItemName { get; set; }
        public decimal ReceivedQty { get; set; }
        public decimal NewStockBalance { get; set; }
    }
}