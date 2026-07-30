using AkerpSuite.Server.DTOs.Hr;
using AkerpSuite.Server.Helpers;
using AkerpSuite.Server.Repositories;
using System.Reflection;

namespace AkerpSuite.Server.Services
{
    public interface IHRService
    {

        #region Employee Documents
        Task<EmployeeDocumentResponseDto> UploadDocumentAsync(EmployeeDocumentRequestDto request, CancellationToken cancellationToken = default);
        Task<IEnumerable<EmployeeDocumentResponseDto>> GetEmployeeDocumentsAsync(int empId, CancellationToken cancellationToken = default);
        Task<EmployeeDocumentResponseDto?> GetDocumentByIdAsync(int docId, CancellationToken cancellationToken = default);
        Task<bool> UpdateDocumentAsync(EmployeeDocumentRequestDto request, CancellationToken cancellationToken = default);
        Task<bool> DeleteDocumentAsync(int docId, CancellationToken cancellationToken = default);

        #endregion

        #region Employee Bank Details

        Task<EmployeeBankDetailResponseDto> CreateBankDetailAsync(EmployeeBankDetailRequestDto request, CancellationToken cancellationToken = default);
        Task<IEnumerable<EmployeeBankDetailResponseDto>> GetBankDetailsByEmployeeAsync(int empId, CancellationToken cancellationToken = default);
        Task<EmployeeBankDetailResponseDto?> GetBankDetailByIdAsync(int bankId, CancellationToken cancellationToken = default);
        Task<bool> UpdateBankDetailAsync(EmployeeBankDetailRequestDto request, CancellationToken cancellationToken = default);
        Task<bool> DeleteBankDetailAsync(int bankId, CancellationToken cancellationToken = default);

        #endregion

        #region Self profile
        Task<SelfProfileResponseDto> GetMyProfileAsync(int empId);
        Task<bool> UpdateMyProfileAsync(int empId, SelfProfileRequestDto request);
        Task<IEnumerable<SelfLeaveBalanceResponseDto>> GetMyLeaveBalanceAsync(int empId, int year);
        Task<IEnumerable<SelfLeaveResponseDto>> GetMyLeaveRequestsAsync(int empId, string? status, int? month, int? year);
        Task<SelfLeaveResponseDto> ApplyLeaveAsync(int empId, SelfLeaveRequestDto request);
        Task<IEnumerable<SelfAttendanceResponseDto>> GetMyAttendanceAsync(int empId, DateTime? fromDate, DateTime? toDate);
        Task<int> RequestRegularizationAsync(int empId, SelfAttendanceRegularizationRequestDto request);
        Task<IEnumerable<SelfAttendanceRegularizationResponseDto>> GetMyRegularizationRequestsAsync(int empId, string? status);
        Task<SelfPayslipResponseDto> GetMyPayslipAsync(int empId, int month, int year);
        Task<IEnumerable<SelfLoanResponseDto>> GetMyLoansAsync(int empId);
        Task<IEnumerable<EmployeeDocumentResponseDto>> GetMyDocumentsAsync(int empId);
        Task<IEnumerable<EmployeeBankDetailResponseDto>> GetMyBankDetailsAsync(int empId);


        #endregion

        #region Sales
        // Segments
        Task<int> CreateSegmentAsync(SalesSegmentRequestDto request);
        Task<IEnumerable<SalesSegmentResponseDto>> GetAllSegmentsAsync();
        Task<bool> UpdateSegmentAsync(SalesSegmentUpdateRequestDto request);

        // Leads
        Task<int> CreateLeadAsync(SalesLeadRequestDto request);
        Task<bool> UpdateLeadAsync(SalesLeadUpdateRequestDto request);
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
        Task<int> CreateProposalAsync(SalesProposalRequestDto request);
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
        Task<IEnumerable<EmployeeMilestoneResponseDto>> GetProbationAlertsAsync(int daysAhead = 7);
        Task<IEnumerable<EmployeeMilestoneResponseDto>> GetAnniversaryAlertsAsync(int daysAhead = 7);
        Task<IEnumerable<EmployeeMilestoneResponseDto>> GetAllUpcomingAsync(int daysAhead = 7);
        Task<bool> MarkSentAsync(MarkNotificationSentRequestDto request);
        Task<IEnumerable<EmployeeNotificationLogResponseDto>> GetHistoryAsync(string? notifType, bool? isSent);
        Task<int> SendProbationCompletionRemindersAsync();
        #endregion

        #region EmployeePromotion
        Task<int> PromoteAsync(PromoteEmployeeRequestDto request);
        Task<IEnumerable<EmployeePromotionResponseDto>> GetHistoryByEmpAsync(int empId);
        Task<IEnumerable<EmployeePromotionResponseDto>> GetAllAsync(DateTime? fromDate, DateTime? toDate);
        Task<int> SetHierarchyAsync(SetHierarchyRequestDto request);
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
        Task<IEnumerable<BannerResponseDto>> GetAllBannersAsync();
        Task<IEnumerable<BannerResponseDto>> GetActiveBannersAsync();
        Task<bool> UpdateBannerAsync(BannerUpdateRequestDto request, string? newImagePath, FileUploadHelper fileHelper);
        Task<bool> DeleteBannerAsync(int id, FileUploadHelper fileHelper);
    
        #endregion

        #region Public Site – Gallery
        Task<GalleryResponseDto> CreateGalleryAsync(GalleryRequestDto request, string? imagePath);
        Task<IEnumerable<GalleryResponseDto>> GetAllGalleryAsync();
        Task<IEnumerable<GalleryResponseDto>> GetActiveGalleryAsync();
        Task<bool> UpdateGalleryAsync(GalleryUpdateRequestDto request, string? newImagePath, FileUploadHelper fileHelper);
        Task<bool> DeleteGalleryAsync(int id, FileUploadHelper fileHelper);
        #endregion

        #region Public Site – Team
        Task<TeamResponseDto> CreateTeamAsync(TeamRequestDto request, string? imagePath);
        Task<IEnumerable<TeamResponseDto>> GetAllTeamAsync();
        Task<IEnumerable<TeamResponseDto>> GetActiveTeamAsync();
        Task<bool> UpdateTeamAsync(TeamUpdateRequestDto request, string? newImagePath, FileUploadHelper fileHelper);
        Task<bool> DeleteTeamAsync(int id, FileUploadHelper fileHelper);
        #endregion

        #region Public Site – Projects (multi-image)
        Task<ProjectResponseDto> CreateProjectAsync(ProjectRequestDto request, List<string> imagePaths);
        Task<IEnumerable<ProjectResponseDto>> GetAllProjectsAsync();
        Task<IEnumerable<ProjectResponseDto>> GetActiveProjectsAsync();
        Task<bool> UpdateProjectAsync(ProjectUpdateRequestDto request, List<string> newImagePaths, FileUploadHelper fileHelper);
        Task<bool> DeleteProjectAsync(int id, FileUploadHelper fileHelper);
        #endregion

        #region Public Site – Highlights
        Task<HighlightResponseDto> CreateHighlightAsync(HighlightRequestDto request, string? imagePath);
        Task<IEnumerable<HighlightResponseDto>> GetAllHighlightsAsync();
        Task<IEnumerable<HighlightResponseDto>> GetActiveHighlightsAsync();
        Task<bool> UpdateHighlightAsync(HighlightUpdateRequestDto request, string? newImagePath, FileUploadHelper fileHelper);
        Task<bool> DeleteHighlightAsync(int id, FileUploadHelper fileHelper);
        #endregion

        #region Public Site – Career (no images)
        Task<CareerResponseDto> CreateCareerAsync(CareerRequestDto request);
        Task<IEnumerable<CareerResponseDto>> GetAllCareersAsync();
        Task<IEnumerable<CareerResponseDto>> GetOpenCareersAsync();
        Task<bool> UpdateCareerAsync(CareerUpdateRequestDto request);
        Task<bool> DeleteCareerAsync(int id);
        #endregion

        #region Public Site – Contact Query (no images)
        Task<int> CreateContactQueryAsync(ContactQueryRequestDto request);
        Task<IEnumerable<ContactQueryResponseDto>> GetAllContactQueriesAsync(bool? isRead);
        Task<bool> MarkQueryReadAsync(int id);
        Task<bool> DeleteContactQueryAsync(int id);

            #endregion

    }
}