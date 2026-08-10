using AkerpSuite.Server.DTOs.Hr;

namespace AkerpSuite.Server.Repositories
{
    public interface IHRRepository
    {
        #region Employee Documents

        Task<EmployeeDocumentResponseDto> UploadDocumentAsync(EmployeeDocumentRequestDto request);
        Task<IEnumerable<EmployeeDocumentResponseDto>> GetEmployeeDocumentsAsync(int empId);
        Task<EmployeeDocumentResponseDto?> GetDocumentByIdAsync(int docId);
        Task<bool> UpdateDocumentAsync(EmployeeDocumentRequestDto request);
        Task<bool> DeleteDocumentAsync(int docId);

        #endregion

        #region Employee Bank Details

        Task<EmployeeBankDetailResponseDto> CreateBankDetailAsync(EmployeeBankDetailRequestDto request);
        Task<IEnumerable<EmployeeBankDetailResponseDto>> GetBankDetailsByEmployeeAsync(int empId);
        Task<EmployeeBankDetailResponseDto?> GetBankDetailByIdAsync(int bankId);
        Task<bool> UpdateBankDetailAsync(EmployeeBankDetailRequestDto request);
        Task<bool> DeleteBankDetailAsync(int bankId);

        #endregion

        #region Self profile

        Task<SelfProfileResponseDto?> GetProfileAsync(int empId);
        Task<int> UpdateProfileAsync(SelfProfileResponseDto current, SelfProfileRequestDto request);

        Task<IEnumerable<SelfLeaveBalanceResponseDto>> GetLeaveBalanceAsync(int empId, int year);
        Task<IEnumerable<SelfLeaveResponseDto>> GetMyLeaveRequestsAsync(int empId, string? status, int? month, int? year);
        Task<SelfLeaveResponseDto> ApplyLeaveAsync(int empId, SelfLeaveRequestDto request);

        Task<IEnumerable<SelfAttendanceResponseDto>> GetMyAttendanceAsync(int empId, DateTime? fromDate, DateTime? toDate);
        Task<int> CreateRegularizationRequestAsync(int empId, SelfAttendanceRegularizationRequestDto request);
        Task<IEnumerable<SelfAttendanceRegularizationResponseDto>> GetMyRegularizationRequestsAsync(int empId, string? status, string? requestType = null);
        Task<SelfPayslipResponseDto?> GetMyPayslipAsync(int empId, int month, int year);
        Task<IEnumerable<SelfLoanResponseDto>> GetMyLoansAsync(int empId);

        Task<IEnumerable<AkerpSuite.Server.DTOs.Hr.EmployeeDocumentResponseDto>> GetMyDocumentsAsync(int empId);
        Task<IEnumerable<AkerpSuite.Server.DTOs.Hr.EmployeeBankDetailResponseDto>> GetMyBankDetailsAsync(int empId);

        #endregion

        #region Sales
        // Segments
        Task<int> CreateSegmentAsync(SalesSegmentRequestDto request);
        Task<IEnumerable<SalesSegmentResponseDto>> GetAllSegmentsAsync();
        Task<bool> UpdateSegmentAsync(SalesSegmentUpdateRequestDto request);

        // Leads
        Task<int> CreateLeadAsync(SalesLeadRequestDto request);
        Task<bool> UpdateLeadAsync(SalesLeadUpdateRequestDto request);
        Task<bool> MarkLeadNotFeasibleAsync(int leadId, string? remarks);
        Task<SalesLeadResponseDto?> GetLeadByIdAsync(int leadId);
        Task<IEnumerable<SalesLeadResponseDto>> SearchLeadsAsync(SalesLeadSearchRequestDto filter);

        // Followups
        Task<int> CreateFollowupAsync(SalesFollowupRequestDto request);
        Task<IEnumerable<SalesFollowupResponseDto>> GetFollowupsByLeadAsync(int leadId);

        // Survey
        Task<int> CreateSurveyAsync(SalesSurveyRequestDto request);
        Task<int> UpdateSurveyFeasibilityAsync(SalesSurveyFeasibilityRequestDto request);
        Task<IEnumerable<SalesSurveyResponseDto>> GetSurveysByLeadAsync(int leadId);

        // Proposals
        Task<int> CreateProposalAsync(SalesProposalRequestDto request, string proposalNo);
        Task<int?> ActionProposalAsync(SalesProposalActionDto request);
        Task<IEnumerable<SalesProposalResponseDto>> GetProposalsByLeadAsync(int leadId);

        // Payments
        Task<int> CreatePaymentAsync(SalesPaymentRequestDto request);
        Task<IEnumerable<SalesPaymentResponseDto>> GetPaymentsByLeadAsync(int leadId);

        // BOM / Material Booking
        Task<SalesBomCreateResultDto> CreateBomAsync(SalesBomRequestDto request);
        Task<bool> UpdateBomBookingAsync(SalesBomBookingUpdateDto request);
        Task<IEnumerable<SalesBomResponseDto>> GetBomByLeadAsync(int leadId);

        // Dispatch
        Task<int> CreateDispatchAsync(SalesDispatchRequestDto request);
        Task<bool> UpdateDispatchStatusAsync(SalesDispatchStatusUpdateDto request);
        Task<IEnumerable<SalesDispatchResponseDto>> GetDispatchByLeadAsync(int leadId);

        // Documents
        Task<int> CreateDocumentAsync(SalesDocumentRequestDto request);
        Task<IEnumerable<SalesDocumentResponseDto>> GetDocumentsByLeadAsync(int leadId);

        // Reminders
        Task<int> CreateReminderAsync(SalesReminderRequestDto request);
        Task<IEnumerable<SalesReminderResponseDto>> GetPendingRemindersAsync(int? assignedTo);
        Task<bool> MarkReminderDoneAsync(int reminderId);
        #endregion

        #region Inventory
        // Items
        Task<int> CreateItemAsync(InventoryItemRequestDto request);
        Task<bool> UpdateItemAsync(InventoryItemUpdateRequestDto request);
        Task<bool> ToggleItemStatusAsync(int itemId);
        Task<InventoryItemResponseDto?> GetItemByIdAsync(int itemId);
        Task<IEnumerable<InventoryItemResponseDto>> GetAllItemsAsync(InventoryItemSearchRequestDto filter);

        // Stock transactions
        Task<StockTransactionResultDto> StockInAsync(StockInRequestDto request);
        Task<StockTransactionResultDto> StockOutAsync(StockOutRequestDto request);
        Task<StockTransactionResultDto> StockAdjustmentAsync(StockAdjustmentRequestDto request);
        Task<IEnumerable<InventoryTransactionResponseDto>> GetTransactionsByItemAsync(int itemId, DateTime? fromDate, DateTime? toDate);
        Task<IEnumerable<InventoryTransactionResponseDto>> GetAllTransactionsAsync(InventoryTransactionSearchRequestDto filter);

        // Reports
        Task<IEnumerable<InventoryItemResponseDto>> GetLowStockItemsAsync();

        #endregion

        #region Employee Milestone Notifications (Probation / Anniversary)
        Task<IEnumerable<EmployeeMilestoneResponseDto>> GetUpcomingProbationAlertsAsync(int daysAhead);
        Task<IEnumerable<EmployeeMilestoneResponseDto>> GetUpcomingAnniversaryAlertsAsync(int daysAhead);
        Task<int> LogNotificationSentAsync(int empId, string notifType, DateTime notifDate, string? message);
        Task<int> LogNotificationAsync(int empId, string notifType, DateTime notifDate, string? message);
        Task<bool> MarkSentAsync(int notifId);
        Task<IEnumerable<EmployeeNotificationLogResponseDto>> GetHistoryAsync(string? notifType, bool? isSent);
        Task MarkNotificationSentAsync(int empId, string notifType, DateTime notifDate, string message);
        Task<int> GetOrCreatePendingNotificationAsync(int empId, string notifType, DateTime notifDate, string? message);
        #endregion

        #region EmployeePromotion
        Task<int> PromoteAsync(PromoteEmployeeRequestDto request);
        Task<IEnumerable<EmployeePromotionResponseDto>> GetHistoryByEmpAsync(int empId);
        Task<IEnumerable<EmployeePromotionResponseDto>> GetAllAsync(DateTime? fromDate, DateTime? toDate);
        Task<int> SetHierarchyAsync(int empId, int? parentEmpId);
        Task<IEnumerable<OrgChartNodeResponseDto>> GetDirectReportsAsync(int empId);
        Task<IEnumerable<OrgChartNodeResponseDto>> GetOrgChartAsync(int? rootEmpId);

        #endregion

        #region SalaryIncrement
        Task<int> AddIncrementAsync(AddSalaryIncrementRequestDto request);
        Task<EmployeeSalaryVersionResponseDto?> GetCurrentAsync(int empId);
        Task<IEnumerable<SalaryHistoryResponseDto>> GetHistoryAsync(int empId);
        Task<EmployeeSalaryVersionResponseDto?> GetAsOfDateAsync(int empId, DateTime asOfDate);
        Task<IEnumerable<SalaryHistoryResponseDto>> GetAllIncrementsAsync(DateTime? fromDate, DateTime? toDate);

        #endregion

        #region Public Site – Banner
        Task<BannerResponseDto> CreateBannerAsync(BannerRequestDto request, string? imagePath);
        Task<BannerResponseDto?> GetBannerByIdAsync(int id);
        Task<IEnumerable<BannerResponseDto>> GetAllBannersAsync();
        Task<IEnumerable<BannerResponseDto>> GetActiveBannersAsync();
        Task<bool> UpdateBannerAsync(BannerUpdateRequestDto request, string? imagePath);
        Task<bool> DeleteBannerAsync(int id);
        #endregion

        #region Public Site – Gallery
        Task<GalleryResponseDto> CreateGalleryAsync(GalleryRequestDto request, string? imagePath);
        Task<GalleryResponseDto?> GetGalleryByIdAsync(int id);
        Task<IEnumerable<GalleryResponseDto>> GetAllGalleryAsync();
        Task<IEnumerable<GalleryResponseDto>> GetActiveGalleryAsync();
        Task<bool> UpdateGalleryAsync(GalleryUpdateRequestDto request, string? imagePath);
        Task<bool> DeleteGalleryAsync(int id);
        #endregion

        #region Public Site – Team
        Task<TeamResponseDto> CreateTeamAsync(TeamRequestDto request, string? imagePath);
        Task<TeamResponseDto?> GetTeamByIdAsync(int id);
        Task<IEnumerable<TeamResponseDto>> GetAllTeamAsync();
        Task<IEnumerable<TeamResponseDto>> GetActiveTeamAsync();
        Task<bool> UpdateTeamAsync(TeamUpdateRequestDto request, string? imagePath);
        Task<bool> DeleteTeamAsync(int id);
        #endregion

        #region Public Site – Projects (multi-image)
        Task<ProjectResponseDto> CreateProjectAsync(ProjectRequestDto request, List<string> imagePaths);
        Task<ProjectResponseDto?> GetProjectByIdAsync(int id);
        Task<IEnumerable<ProjectResponseDto>> GetAllProjectsAsync();
        Task<IEnumerable<ProjectResponseDto>> GetActiveProjectsAsync();
        Task<(bool Success, List<string> RemovedImagePaths)> UpdateProjectAsync(ProjectUpdateRequestDto request, List<string> newImagePaths);
        Task<(bool Success, List<string> DeletedImagePaths)> DeleteProjectAsync(int id);
        #endregion

        #region Public Site – Highlights
        Task<HighlightResponseDto> CreateHighlightAsync(HighlightRequestDto request, string? imagePath);
        Task<HighlightResponseDto?> GetHighlightByIdAsync(int id);
        Task<IEnumerable<HighlightResponseDto>> GetAllHighlightsAsync();
        Task<IEnumerable<HighlightResponseDto>> GetActiveHighlightsAsync();
        Task<bool> UpdateHighlightAsync(HighlightUpdateRequestDto request, string? imagePath);
        Task<bool> DeleteHighlightAsync(int id);
        #endregion

        #region Public Site – Career
        Task<CareerResponseDto> CreateCareerAsync(CareerRequestDto request);
        Task<CareerResponseDto?> GetCareerByIdAsync(int id);
        Task<IEnumerable<CareerResponseDto>> GetAllCareersAsync();
        Task<IEnumerable<CareerResponseDto>> GetOpenCareersAsync();
        Task<bool> UpdateCareerAsync(CareerUpdateRequestDto request);
        Task<bool> DeleteCareerAsync(int id);
        #endregion

        #region Public Site – Contact Query
        Task<int> CreateContactQueryAsync(ContactQueryRequestDto request);
        Task<IEnumerable<ContactQueryResponseDto>> GetAllContactQueriesAsync(bool? isRead);
        Task<bool> MarkQueryReadAsync(int id);
        Task<bool> DeleteContactQueryAsync(int id);
        #endregion

        #region Suppliers
        Task<int> CreateSupplierAsync(SupplierRequestDto request);
        Task<bool> UpdateSupplierAsync(SupplierUpdateRequestDto request);
        Task<bool> ToggleSupplierStatusAsync(int supplierId);
        Task<SupplierResponseDto?> GetSupplierByIdAsync(int supplierId);
        Task<IEnumerable<SupplierResponseDto>> SearchSuppliersAsync(SupplierSearchRequestDto filter);
        #endregion

        #region PO Consignee
        Task<int> CreateConsigneeAsync(PoConsigneeRequestDto request);
        Task<IEnumerable<PoConsigneeResponseDto>> GetAllConsigneesAsync();
        #endregion

        #region Purchase Order
        Task<int> CreatePurchaseOrderAsync(PurchaseOrderRequestDto request);
        Task<bool> UpdatePoStatusAsync(int poId, string status);
        Task<PurchaseOrderResponseDto?> GetPurchaseOrderByIdAsync(int poId);
        Task<IEnumerable<PurchaseOrderResponseDto>> SearchPurchaseOrdersAsync(PurchaseOrderSearchRequestDto filter);
        #endregion

        #region GRN (Goods Receipt)
        Task<GrnResponseDto> CreateGrnAsync(GrnRequestDto request);
        Task<IEnumerable<GrnResponseDto>> GetGrnsByPoAsync(int poId);
        #endregion
    }
}