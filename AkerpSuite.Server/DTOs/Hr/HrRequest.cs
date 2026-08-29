using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace AkerpSuite.Server.DTOs.Hr
{
    public class EmployeeDocumentRequestDto
    {
        public int? DocId { get; set; }

        [Required(ErrorMessage = "Employee is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Invalid employee.")]
        public int EmpId { get; set; }

        [Required(ErrorMessage = "Document type is required.")]
        [StringLength(100, ErrorMessage = "Document type cannot exceed 100 characters.")]
        public string DocType { get; set; } = string.Empty;

        [Required(ErrorMessage = "Document name is required.")]
        [StringLength(200, ErrorMessage = "Document name cannot exceed 200 characters.")]
        public string DocName { get; set; } = string.Empty;
        public string? FileBase64 { get; set; }

        [StringLength(10, ErrorMessage = "Invalid file extension.")]
        public string? FileExtension { get; set; }

        [JsonIgnore]
        public string? FilePath { get; set; }

        [Required(ErrorMessage = "Uploaded by is required.")]
        public int UploadedBy { get; set; }
    }
    public class EmployeeBankDetailRequestDto
    {
        public int? BankId { get; set; }

        [Required(ErrorMessage = "Employee is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Invalid employee.")]
        public int EmpId { get; set; }

        [Required(ErrorMessage = "Bank name is required.")]
        [StringLength(100, ErrorMessage = "Bank name cannot exceed 100 characters.")]
        public string BankName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Account number is required.")]
        [StringLength(50, ErrorMessage = "Account number cannot exceed 50 characters.")]
        public string AccountNo { get; set; } = string.Empty;

        [Required(ErrorMessage = "IFSC code is required.")]
        [StringLength(20, ErrorMessage = "IFSC code cannot exceed 20 characters.")]
        [RegularExpression(@"^[A-Z]{4}0[A-Z0-9]{6}$", ErrorMessage = "Invalid IFSC code format.")]
        public string IfscCode { get; set; } = string.Empty;

        [StringLength(100, ErrorMessage = "Branch name cannot exceed 100 characters.")]
        public string? BranchName { get; set; }

        [Required(ErrorMessage = "Account type is required.")]
        [RegularExpression("^(Savings|Current|Salary)$", ErrorMessage = "Account type must be Savings, Current, or Salary.")]
        public string AccountType { get; set; } = string.Empty;
        public bool IsPrimary { get; set; } = true;
    }
    public class SelfProfileRequestDto
    {
        public string? PersonalEmail { get; set; }
        public string? Mobile { get; set; }
        public string? AlternateMobile { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? Pincode { get; set; }
        public string? Country { get; set; }
        public string? BloodGroup { get; set; }
        public string? MaritalStatus { get; set; }
    }
    public class SelfLeaveRequestDto
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

    public class SelfAttendanceRegularizationRequestDto
    {
        public DateTime RequestDate { get; set; }
        public string Reason { get; set; } = string.Empty;
    }
    public class SalesLeadRequestDto
    {
        public DateTime LeadDate { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContactNo { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? Reference { get; set; }
        public int SegmentId { get; set; }
        public string? QueryType { get; set; }
        public string? Remarks { get; set; }
        public int? AssignedTo { get; set; }
        public int CreatedBy { get; set; }
        public string? AlternateContactNo { get; set; }
    }

    public class SalesLeadUpdateRequestDto
    {
        public int LeadId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ContactNo { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? Reference { get; set; }
        public int SegmentId { get; set; }
        public string? QueryType { get; set; }
        public string? Remarks { get; set; }
        public string? Label { get; set; }
        public DateTime? NextFollowup { get; set; }
        public string? Status { get; set; }
        public int? AssignedTo { get; set; }
        public string? AlternateContactNo { get; set; }
    }

    public class SalesLeadSearchRequestDto
    {
        public int? SegmentId { get; set; }
        public string? Status { get; set; }
        public int? AssignedTo { get; set; }
        public string? Label { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? Keyword { get; set; }
    }

    public class SalesLeadNotFeasibleRequestDto
    {
        public int LeadId { get; set; }
        public string? Remarks { get; set; }
    }
    public class SalesSegmentRequestDto
    {
        public string SegmentCode { get; set; } = string.Empty;
        public string SegmentName { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public class SalesSegmentUpdateRequestDto
    {
        public int SegmentId { get; set; }
        public string SegmentName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
    }
    public class SalesFollowupRequestDto
    {
        public int LeadId { get; set; }
        public DateTime FollowupDate { get; set; }
        public string? Remarks { get; set; }
        public string? Label { get; set; }
        public DateTime? NextFollowup { get; set; }
        public int DoneBy { get; set; }
    }
    public class SalesSurveyRequestDto
    {
        public int LeadId { get; set; }
        public DateTime? SurveyDate { get; set; }
        public int? SurveyorId { get; set; }
        public string? SiteAddress { get; set; }
        public decimal? LoadKw { get; set; }
        public decimal? RoofAreaSqft { get; set; }
        public bool? ShadowFree { get; set; }
        public string? GridType { get; set; }
        public string? OtherDetails { get; set; }
        public string? DocPath { get; set; }
    }

    public class SalesSurveyFeasibilityRequestDto
    {
        public int SurveyId { get; set; }
        public bool IsFeasible { get; set; }
        public string? Remarks { get; set; }
    }
    public class SalesProposalRequestDto
    {
        public int LeadId { get; set; }
        public DateTime? ProposalDate { get; set; }
        public decimal? SystemSizeKw { get; set; }
        public decimal? TotalAmount { get; set; }
        public decimal SubsidyAmount { get; set; } = 0;
        public int ValidityDays { get; set; } = 30;
        public string? DocPath { get; set; }
        public bool IsFinal { get; set; } = false;
        public int CreatedBy { get; set; }
    }

    public class SalesProposalActionDto
    {
        public int ProposalId { get; set; }
        public string Status { get; set; } = string.Empty;
    }
    public class SalesPaymentRequestDto
    {
        public int LeadId { get; set; }
        public int? ProposalId { get; set; }
        public DateTime? PaymentDate { get; set; }
        public decimal Amount { get; set; }
        public string? PaymentMode { get; set; }
        public string? ReferenceNo { get; set; }
        public string? Remarks { get; set; }
        public int CreatedBy { get; set; }
    }
    public class SalesBomRequestDto
    {
        public int LeadId { get; set; }
        public int ItemId { get; set; }
        public decimal RequiredQty { get; set; }
    }

    public class SalesBomBookingUpdateDto
    {
        public int BomId { get; set; }
        public decimal AdditionalBookedQty { get; set; }
    }
    public class SalesDispatchRequestDto
    {
        public int LeadId { get; set; }
        public DateTime? DispatchDate { get; set; }
        public int DispatchBy { get; set; }
        public string? Transporter { get; set; }
        public string? TrackingNo { get; set; }
        public string? Remarks { get; set; }
    }

    public class SalesDispatchStatusUpdateDto
    {
        public int DispatchId { get; set; }
        public string Status { get; set; } = string.Empty;
    }
    public class SalesDocumentRequestDto
    {
        public int LeadId { get; set; }
        public string? DocType { get; set; }
        public string? DocName { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public int UploadedBy { get; set; }
    }
    public class SalesDocumentUploadRequestDto
    {
        public int LeadId { get; set; }
        public string? DocType { get; set; }
        public string? DocName { get; set; }
        public string Base64File { get; set; } = string.Empty;
        public string Extension { get; set; } = string.Empty;
        public int UploadedBy { get; set; }
    }
    public class SalesReminderRequestDto
    {
        public int? LeadId { get; set; }
        public string? ReminderType { get; set; }
        public DateTime ReminderDate { get; set; }
        public string? Message { get; set; }
        public int? AssignedTo { get; set; }
    }

    public class InventoryItemRequestDto
    {
        public string ItemCode { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Unit { get; set; }
        public decimal OpeningStock { get; set; } = 0;
        public decimal ReorderLevel { get; set; } = 0;
        public int CreatedBy { get; set; }
    }

    public class InventoryItemUpdateRequestDto
    {
        public int ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Unit { get; set; }
        public decimal ReorderLevel { get; set; }
    }

    public class InventoryItemSearchRequestDto
    {
        public string? Category { get; set; }
        public bool? IsActive { get; set; }
        public string? Keyword { get; set; }
    }

    public class StockInRequestDto
    {
        public int ItemId { get; set; }
        public decimal Quantity { get; set; }
        public string? ReferenceType { get; set; }
        public string? ReferenceNo { get; set; }
        public string? Remarks { get; set; }
        public int CreatedBy { get; set; }
    }

    public class StockOutRequestDto
    {
        public int ItemId { get; set; }
        public decimal Quantity { get; set; }
        public string? ReferenceType { get; set; }
        public string? ReferenceNo { get; set; }
        public string? Remarks { get; set; }
        public int CreatedBy { get; set; }
    }

    public class StockAdjustmentRequestDto
    {
        public int ItemId { get; set; }
        public decimal AdjustedQuantity { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Remarks { get; set; }
        public int CreatedBy { get; set; }
    }
    public class StockTransactionResultDto
    {
        public int TxnId { get; set; }
        public decimal NewBalance { get; set; }
    }
    public class InventoryTransactionSearchRequestDto
    {
        public string? TxnType { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
    public class MarkNotificationSentRequestDto
    {
        public int NotifId { get; set; }
    }
    public class PromoteEmployeeRequestDto
    {
        public int EmpId { get; set; }
        public int NewDesigId { get; set; }
        public int NewDeptId { get; set; }
        public decimal NewCtc { get; set; }
        public DateTime PromotionDate { get; set; }
        public string? Remarks { get; set; }
        public int ApprovedBy { get; set; }
    }
    public class SetHierarchyRequestDto
    {
        public int EmpId { get; set; }
        public int? ParentEmpId { get; set; }
    }
    public class AddSalaryIncrementRequestDto
    {
        public int EmpId { get; set; }
        public int? StructureId { get; set; }
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

    // ── Banner ──
    public class BannerRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string? SubTitle { get; set; }
        public string? Base64Image { get; set; }
        public string? Extension { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class BannerUpdateRequestDto : BannerRequestDto
    {
        public int Id { get; set; }
    }

    // ── Gallery ──
    public class GalleryRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Base64Image { get; set; }
        public string? Extension { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class GalleryUpdateRequestDto : GalleryRequestDto
    {
        public int Id { get; set; }
    }

    // ── Our Team ──
    public class TeamRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? Base64Image { get; set; }
        public string? Extension { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class TeamUpdateRequestDto : TeamRequestDto
    {
        public int Id { get; set; }
    }

    // ── Completed Projects ──
    public class ProjectRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? CapacityKw { get; set; }
        public string? Description { get; set; }
        public DateTime? CompletedOn { get; set; }
        public List<string> Base64Images { get; set; } = new();
        public string? Extension { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class ProjectUpdateRequestDto : ProjectRequestDto
    {
        public int Id { get; set; }
        public List<string> ExistingImagePaths { get; set; } = new();
    }

    // ── Highlights ──
    public class HighlightRequestDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Base64Image { get; set; }
        public string? Extension { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class HighlightUpdateRequestDto : HighlightRequestDto
    {
        public int Id { get; set; }
    }

    // ── Career ──
    public class CareerRequestDto
    {
        public string JobTitle { get; set; } = string.Empty;
        public string? Location { get; set; }
        public string? ExperienceRequired { get; set; }
        public string? Description { get; set; }
        public bool IsOpen { get; set; } = true;
    }

    public class CareerUpdateRequestDto : CareerRequestDto
    {
        public int Id { get; set; }
    }

    // ── Contact Query ──
    public class ContactQueryRequestDto
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Subject { get; set; }
        public string Message { get; set; } = string.Empty;
    }

    public enum PoStatus
    {
        Draft,
        Approved,
        PartiallyReceived,
        Completed,
        Cancelled
    }

    // ============================================================
    // SUPPLIER — REQUESTS
    // ============================================================

    public class SupplierRequestDto
    {
        public string SupplierName { get; set; }
        public string Gstin { get; set; }
        public string PanNo { get; set; }
        public string Address { get; set; }
        public string StateName { get; set; }
        public string StateCode { get; set; }
        public string ContactNo { get; set; }
        public string Email { get; set; }
    }

    public class SupplierUpdateRequestDto : SupplierRequestDto
    {
        public int SupplierId { get; set; }
    }

    public class SupplierSearchRequestDto
    {
        public string? Keyword { get; set; }
        public bool? IsActive { get; set; }
    }

    // ============================================================
    // PO CONSIGNEE — REQUESTS
    // ============================================================

    public class PoConsigneeRequestDto
    {
        public string ConsigneeName { get; set; }
        public string SiteAddress { get; set; }
        public string Gstin { get; set; }
        public string StateName { get; set; }
        public string StateCode { get; set; }
        public int? LeadId { get; set; }
    }

    // ============================================================
    // PURCHASE ORDER (header) — REQUESTS
    // ============================================================

    public class PurchaseOrderRequestDto
    {
        public string? VoucherNo { get; set; }
        public DateTime? PoDate { get; set; }
        public int SupplierId { get; set; }
        public int? ConsigneeId { get; set; }
        public string ReferenceNo { get; set; }
        public DateTime? ReferenceDate { get; set; }
        public string DispatchedThrough { get; set; }
        public string Destination { get; set; }
        public string TermsOfDelivery { get; set; }
        public string ModeOfPayment { get; set; }
        public int? CreatedBy { get; set; }
        public List<PurchaseOrderItemRequestDto> Items { get; set; }
    }

    public class PurchaseOrderStatusUpdateDto
    {
        public int PoId { get; set; }
        public PoStatus Status { get; set; }
    }

    public class PurchaseOrderSearchRequestDto
    {
        public int? SupplierId { get; set; }
        public PoStatus? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? Keyword { get; set; }
    }

    // ============================================================
    // PURCHASE ORDER ITEM (line) — REQUESTS
    // ============================================================

    public class PurchaseOrderItemRequestDto
    {
        public int? ItemId { get; set; }
        public string NewItemName { get; set; }
        public string NewItemCategory { get; set; }
        public string Description { get; set; }
        public string HsnSac { get; set; }
        public decimal GstRate { get; set; }
        public decimal Quantity { get; set; }
        public string Unit { get; set; }
        public decimal Rate { get; set; }
    }

    // ============================================================
    // GRN (Goods Receipt Note) — REQUESTS
    // ============================================================

    public class GrnRequestDto
    {
        public int PoId { get; set; }
        public DateTime? GrnDate { get; set; }
        public int? ReceivedBy { get; set; }
        public string Remarks { get; set; }
        public List<GrnItemRequestDto> Items { get; set; }
    }

    public class GrnItemRequestDto
    {
        public int PoItemId { get; set; }
        public int ItemId { get; set; }
        public decimal ReceivedQty { get; set; }
    }
    public class PurchaseInvoiceRequestDto
    {
        public int PoId { get; set; }              
        public string InvoiceNo { get; set; }     
        public DateTime? InvoiceDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string DispatchedThrough { get; set; }
        public string Destination { get; set; }
        public string TermsOfDelivery { get; set; }
        public string ModeOfPayment { get; set; }
        public string Remarks { get; set; }
        public int? CreatedBy { get; set; }
        public List<PurchaseInvoiceItemRequestDto> Items { get; set; }
    }

    public class PurchaseInvoiceItemRequestDto
    {
        public int PoItemId { get; set; }
        public int ItemId { get; set; }
        public string Description { get; set; }
        public string HsnSac { get; set; }
        public decimal GstRate { get; set; }
        public DateTime? DueOn { get; set; }
        public decimal InvoicedQty { get; set; }
        public string Unit { get; set; }           
        public decimal Rate { get; set; }
        public decimal DiscountPercent { get; set; }
    }
    public class PurchaseInvoiceStatusUpdateDto
    {
        public int InvoiceId { get; set; }
        public PurchaseInvoiceStatus Status { get; set; }
    }

    public class PurchaseInvoiceSearchRequestDto
    {
        public int? SupplierId { get; set; }
        public int? PoId { get; set; }
        public PurchaseInvoiceStatus? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? Keyword { get; set; }
    }

    public enum PurchaseInvoiceStatus
    {
        Draft,
        Approved,
        Paid,
        Cancelled
    }
}