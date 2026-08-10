using AkerpSuite.Server.DTOs.Hr;
using AkerpSuite.Server.Helpers;
using AkerpSuite.Server.Repositories;
using Microsoft.Extensions.Logging;

namespace AkerpSuite.Server.Services
{
    public class HRService : IHRService
    {
        private readonly IHRRepository _repository;
        private readonly FileUploadHelper _fileUploadHelper;
        private readonly ILogger<HRService> _logger;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private const string DocumentFolder = "EmployeeDocuments";

        public HRService(
            IHRRepository repository,
            FileUploadHelper fileUploadHelper,
            ILogger<HRService> logger,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _repository = repository;
            _fileUploadHelper = fileUploadHelper;
            _logger = logger;
            _emailService = emailService;
            _configuration = configuration;
        }

        #region Employee Documents

        public async Task<EmployeeDocumentResponseDto> UploadDocumentAsync(EmployeeDocumentRequestDto request, CancellationToken cancellationToken = default)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (request.EmpId <= 0)
                throw new InvalidOperationException("Invalid employee.");

            if (string.IsNullOrWhiteSpace(request.DocType))
                throw new InvalidOperationException("Document type is required.");

            if (string.IsNullOrWhiteSpace(request.DocName))
                throw new InvalidOperationException("Document name is required.");

            if (string.IsNullOrWhiteSpace(request.FileBase64))
                throw new InvalidOperationException("Document file is required.");

            var filePath = await _fileUploadHelper.SaveBase64FileAsync(
                request.FileBase64,
                request.FileExtension,
                DocumentFolder);

            try
            {
                request.FilePath = filePath;
                var result = await _repository.UploadDocumentAsync(request);

                _logger.LogInformation(
                    "Document '{DocName}' uploaded for employee {EmpId}.",
                    request.DocName, request.EmpId);

                return result;
            }
            catch (Exception ex)
            {
                // DB insert failed after the file was already saved to disk — clean it up
                // so we don't leave orphaned files behind.
                _logger.LogError(ex, "Failed to persist document record for employee {EmpId}. Rolling back saved file.", request.EmpId);
                _fileUploadHelper.DeleteFile(filePath);
                throw;
            }
        }

        public async Task<IEnumerable<EmployeeDocumentResponseDto>> GetEmployeeDocumentsAsync(int empId, CancellationToken cancellationToken = default)
        {
            if (empId <= 0)
                throw new InvalidOperationException("Invalid employee.");

            return await _repository.GetEmployeeDocumentsAsync(empId);
        }

        public async Task<EmployeeDocumentResponseDto?> GetDocumentByIdAsync(int docId, CancellationToken cancellationToken = default)
        {
            if (docId <= 0)
                throw new InvalidOperationException("Invalid document.");

            return await _repository.GetDocumentByIdAsync(docId);
        }

        public async Task<bool> UpdateDocumentAsync(EmployeeDocumentRequestDto request, CancellationToken cancellationToken = default)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (request.DocId is null || request.DocId <= 0)
                throw new InvalidOperationException("Invalid document.");

            var existing = await _repository.GetDocumentByIdAsync(request.DocId.Value);
            if (existing == null)
                throw new KeyNotFoundException("Document not found.");

            string? newFilePath = null;

            if (!string.IsNullOrWhiteSpace(request.FileBase64))
            {
                newFilePath = await _fileUploadHelper.SaveBase64FileAsync(
                    request.FileBase64,
                    request.FileExtension,
                    DocumentFolder);

                request.FilePath = newFilePath;
            }
            else
            {
                // No new file supplied — keep the existing one.
                request.FilePath = existing.FilePath;
            }

            try
            {
                var result = await _repository.UpdateDocumentAsync(request);

                // Only remove the old file once the DB update succeeded and a new file actually replaced it.
                if (result && newFilePath != null &&
                    !string.Equals(existing.FilePath, newFilePath, StringComparison.OrdinalIgnoreCase))
                {
                    _fileUploadHelper.DeleteFile(existing.FilePath);
                }

                _logger.LogInformation("Document {DocId} updated.", request.DocId);

                return result;
            }
            catch (Exception ex)
            {
                if (newFilePath != null)
                    _fileUploadHelper.DeleteFile(newFilePath);

                _logger.LogError(ex, "Failed to update document {DocId}.", request.DocId);
                throw;
            }
        }

        public async Task<bool> DeleteDocumentAsync(int docId, CancellationToken cancellationToken = default)
        {
            if (docId <= 0)
                throw new InvalidOperationException("Invalid document.");

            var existing = await _repository.GetDocumentByIdAsync(docId);
            if (existing == null)
                throw new KeyNotFoundException("Document not found.");

            var result = await _repository.DeleteDocumentAsync(docId);

            if (result)
            {
                _fileUploadHelper.DeleteFile(existing.FilePath);
                _logger.LogInformation("Document {DocId} deleted.", docId);
            }

            return result;
        }

        #endregion

        #region Employee Bank Details

        public async Task<EmployeeBankDetailResponseDto> CreateBankDetailAsync(EmployeeBankDetailRequestDto request, CancellationToken cancellationToken = default)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (request.EmpId <= 0)
                throw new InvalidOperationException("Invalid employee.");

            if (string.IsNullOrWhiteSpace(request.BankName))
                throw new InvalidOperationException("Bank name is required.");

            if (string.IsNullOrWhiteSpace(request.AccountNo))
                throw new InvalidOperationException("Account number is required.");

            if (string.IsNullOrWhiteSpace(request.IfscCode))
                throw new InvalidOperationException("IFSC code is required.");

            var result = await _repository.CreateBankDetailAsync(request);

            _logger.LogInformation(
                "Bank detail added for employee {EmpId} (bank {BankId}).",
                request.EmpId, result.BankId);

            return result;
        }

        public async Task<IEnumerable<EmployeeBankDetailResponseDto>> GetBankDetailsByEmployeeAsync(int empId, CancellationToken cancellationToken = default)
        {
            if (empId <= 0)
                throw new InvalidOperationException("Invalid employee.");

            return await _repository.GetBankDetailsByEmployeeAsync(empId);
        }

        public async Task<EmployeeBankDetailResponseDto?> GetBankDetailByIdAsync(int bankId, CancellationToken cancellationToken = default)
        {
            if (bankId <= 0)
                throw new InvalidOperationException("Invalid bank detail.");

            return await _repository.GetBankDetailByIdAsync(bankId);
        }

        public async Task<bool> UpdateBankDetailAsync(EmployeeBankDetailRequestDto request, CancellationToken cancellationToken = default)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (request.BankId is null || request.BankId <= 0)
                throw new InvalidOperationException("Invalid bank detail.");

            var existing = await _repository.GetBankDetailByIdAsync(request.BankId.Value);
            if (existing == null)
                throw new KeyNotFoundException("Bank detail not found.");

            var result = await _repository.UpdateBankDetailAsync(request);

            _logger.LogInformation("Bank detail {BankId} updated.", request.BankId);

            return result;
        }

        public async Task<bool> DeleteBankDetailAsync(int bankId, CancellationToken cancellationToken = default)
        {
            if (bankId <= 0)
                throw new InvalidOperationException("Invalid bank detail.");

            var existing = await _repository.GetBankDetailByIdAsync(bankId);
            if (existing == null)
                throw new KeyNotFoundException("Bank detail not found.");

            var result = await _repository.DeleteBankDetailAsync(bankId);

            if (result)
                _logger.LogInformation("Bank detail {BankId} deleted.", bankId);

            return result;
        }

        #endregion

        #region Self profile

        public async Task<SelfProfileResponseDto> GetMyProfileAsync(int empId)
        {
            var profile = await _repository.GetProfileAsync(empId);

            if (profile == null)
                throw new KeyNotFoundException("Profile not found.");

            return profile;
        }

        public async Task<bool> UpdateMyProfileAsync(int empId, SelfProfileRequestDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            var current = await _repository.GetProfileAsync(empId);
            if (current == null)
                throw new KeyNotFoundException("Profile not found.");

            await _repository.UpdateProfileAsync(current, request);

            _logger.LogInformation("Employee {EmpId} updated their own profile.", empId);

            return true;
        }

        // Leave

        public async Task<IEnumerable<SelfLeaveBalanceResponseDto>> GetMyLeaveBalanceAsync(int empId, int year)
        {
            return await _repository.GetLeaveBalanceAsync(empId, year);
        }

        public async Task<IEnumerable<SelfLeaveResponseDto>> GetMyLeaveRequestsAsync(int empId, string? status, int? month, int? year)
        {
            return await _repository.GetMyLeaveRequestsAsync(empId, status, month, year);
        }

        public async Task<SelfLeaveResponseDto> ApplyLeaveAsync(int empId, SelfLeaveRequestDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (request.ToDate < request.FromDate)
                throw new InvalidOperationException("To date cannot be before from date.");

            if (request.TotalDays <= 0)
                throw new InvalidOperationException("Total days must be greater than zero.");

            var result = await _repository.ApplyLeaveAsync(empId, request);

            if (result.LeaveId <= 0)
                throw new InvalidOperationException(result.ErrorMessage ?? "Leave request could not be created.");

            _logger.LogInformation("Employee {EmpId} applied for leave {LeaveId}.", empId, result.LeaveId);

            return result;
        }

        // Attendance

        public async Task<IEnumerable<SelfAttendanceResponseDto>> GetMyAttendanceAsync(int empId, DateTime? fromDate, DateTime? toDate)
        {
            return await _repository.GetMyAttendanceAsync(empId, fromDate, toDate);
        }

        public async Task<int> RequestRegularizationAsync(int empId, SelfAttendanceRegularizationRequestDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (string.IsNullOrWhiteSpace(request.Reason))
                throw new InvalidOperationException("Reason is required.");

            var requestId = await _repository.CreateRegularizationRequestAsync(empId, request);

            _logger.LogInformation("Employee {EmpId} raised attendance regularization {RequestId}.", empId, requestId);

            return requestId;
        }

        public async Task<IEnumerable<SelfAttendanceRegularizationResponseDto>> GetMyRegularizationRequestsAsync(int empId, string? status)
        {
            return await _repository.GetMyRegularizationRequestsAsync(empId, status);
        }

        //Payslip & Loans

        public async Task<SelfPayslipResponseDto> GetMyPayslipAsync(int empId, int month, int year)
        {
            var payslip = await _repository.GetMyPayslipAsync(empId, month, year);

            if (payslip == null)
                throw new KeyNotFoundException("Payslip not found for the selected month.");

            return payslip;
        }

        public async Task<IEnumerable<SelfLoanResponseDto>> GetMyLoansAsync(int empId)
        {
            return await _repository.GetMyLoansAsync(empId);
        }

        // Documents / Bank

        public async Task<IEnumerable<EmployeeDocumentResponseDto>> GetMyDocumentsAsync(int empId)
        {
            return await _repository.GetMyDocumentsAsync(empId);
        }

        public async Task<IEnumerable<EmployeeBankDetailResponseDto>> GetMyBankDetailsAsync(int empId)
        {
            return await _repository.GetMyBankDetailsAsync(empId);
        }

        #endregion

        #region Sales

        // ---------------- Segments ----------------
        public Task<int> CreateSegmentAsync(SalesSegmentRequestDto request) =>
            _repository.CreateSegmentAsync(request);

        public Task<IEnumerable<SalesSegmentResponseDto>> GetAllSegmentsAsync() =>
            _repository.GetAllSegmentsAsync();

        public Task<bool> UpdateSegmentAsync(SalesSegmentUpdateRequestDto request) =>
            _repository.UpdateSegmentAsync(request);

        // ---------------- Leads ----------------

        public Task<int> CreateLeadAsync(SalesLeadRequestDto request) =>
            _repository.CreateLeadAsync(request);

        public Task<bool> UpdateLeadAsync(SalesLeadUpdateRequestDto request) =>
            _repository.UpdateLeadAsync(request);

        public Task<SalesLeadResponseDto?> GetLeadByIdAsync(int leadId) =>
            _repository.GetLeadByIdAsync(leadId);

        public Task<IEnumerable<SalesLeadResponseDto>> SearchLeadsAsync(SalesLeadSearchRequestDto filter) =>
            _repository.SearchLeadsAsync(filter);

        // ---------------- Followups ----------------

        public Task<int> CreateFollowupAsync(SalesFollowupRequestDto request) =>
            _repository.CreateFollowupAsync(request);

        public Task<IEnumerable<SalesFollowupResponseDto>> GetFollowupsByLeadAsync(int leadId) =>
            _repository.GetFollowupsByLeadAsync(leadId);

        // ---------------- Survey ----------------

        public Task<int> CreateSurveyAsync(SalesSurveyRequestDto request) =>
            _repository.CreateSurveyAsync(request);

        public Task<int> UpdateSurveyFeasibilityAsync(SalesSurveyFeasibilityRequestDto request) =>
            _repository.UpdateSurveyFeasibilityAsync(request);

        public Task<IEnumerable<SalesSurveyResponseDto>> GetSurveysByLeadAsync(int leadId) =>
            _repository.GetSurveysByLeadAsync(leadId);

        // ---------------- Proposals ----------------
        public async Task<int> CreateProposalAsync(SalesProposalRequestDto request)
        {
            // Auto-generate a human-readable proposal number: PRO-{leadId}-{yyMMddHHmmss}
            var proposalNo = $"PRO-{request.LeadId}-{DateTime.UtcNow:yyMMddHHmmss}";
            return await _repository.CreateProposalAsync(request, proposalNo);
        }

        public Task<int?> ActionProposalAsync(SalesProposalActionDto request) =>
            _repository.ActionProposalAsync(request);

        public Task<IEnumerable<SalesProposalResponseDto>> GetProposalsByLeadAsync(int leadId) =>
            _repository.GetProposalsByLeadAsync(leadId);

        // ---------------- Payments ----------------

        public Task<int> CreatePaymentAsync(SalesPaymentRequestDto request) =>
            _repository.CreatePaymentAsync(request);

        public Task<IEnumerable<SalesPaymentResponseDto>> GetPaymentsByLeadAsync(int leadId) =>
            _repository.GetPaymentsByLeadAsync(leadId);

        // ---------------- BOM / Material Booking ----------------

        public Task<SalesBomCreateResultDto> CreateBomAsync(SalesBomRequestDto request) =>
            _repository.CreateBomAsync(request);

        public Task<bool> UpdateBomBookingAsync(SalesBomBookingUpdateDto request) =>
            _repository.UpdateBomBookingAsync(request);

        public Task<IEnumerable<SalesBomResponseDto>> GetBomByLeadAsync(int leadId) =>
            _repository.GetBomByLeadAsync(leadId);

        // ---------------- Dispatch ----------------

        public Task<int> CreateDispatchAsync(SalesDispatchRequestDto request) =>
            _repository.CreateDispatchAsync(request);

        public Task<bool> UpdateDispatchStatusAsync(SalesDispatchStatusUpdateDto request) =>
            _repository.UpdateDispatchStatusAsync(request);

        public Task<IEnumerable<SalesDispatchResponseDto>> GetDispatchByLeadAsync(int leadId) =>
            _repository.GetDispatchByLeadAsync(leadId);

        // ---------------- Documents ----------------

        public Task<int> CreateDocumentAsync(SalesDocumentRequestDto request) =>
            _repository.CreateDocumentAsync(request);

        public Task<IEnumerable<SalesDocumentResponseDto>> GetDocumentsByLeadAsync(int leadId) =>
            _repository.GetDocumentsByLeadAsync(leadId);

        // ---------------- Reminders ----------------

        public Task<int> CreateReminderAsync(SalesReminderRequestDto request) =>
            _repository.CreateReminderAsync(request);

        public Task<IEnumerable<SalesReminderResponseDto>> GetPendingRemindersAsync(int? assignedTo) =>
            _repository.GetPendingRemindersAsync(assignedTo);

        public Task<bool> MarkReminderDoneAsync(int reminderId) =>
            _repository.MarkReminderDoneAsync(reminderId);

        #endregion

        #region Inventory
        // ---------------- Items ----------------
        public Task<int> CreateItemAsync(InventoryItemRequestDto request) =>
            _repository.CreateItemAsync(request);

        public Task<bool> UpdateItemAsync(InventoryItemUpdateRequestDto request) =>
            _repository.UpdateItemAsync(request);

        public Task<bool> ToggleItemStatusAsync(int itemId) =>
            _repository.ToggleItemStatusAsync(itemId);

        public Task<InventoryItemResponseDto?> GetItemByIdAsync(int itemId) =>
            _repository.GetItemByIdAsync(itemId);

        public Task<IEnumerable<InventoryItemResponseDto>> GetAllItemsAsync(InventoryItemSearchRequestDto filter) =>
            _repository.GetAllItemsAsync(filter);

        // ---------------- Stock transactions ----------------

        public Task<StockTransactionResultDto> StockInAsync(StockInRequestDto request) =>
            _repository.StockInAsync(request);

        public Task<StockTransactionResultDto> StockOutAsync(StockOutRequestDto request) =>
            _repository.StockOutAsync(request);

        public Task<StockTransactionResultDto> StockAdjustmentAsync(StockAdjustmentRequestDto request) =>
            _repository.StockAdjustmentAsync(request);

        public Task<IEnumerable<InventoryTransactionResponseDto>> GetTransactionsByItemAsync(
            int itemId, DateTime? fromDate, DateTime? toDate) =>
            _repository.GetTransactionsByItemAsync(itemId, fromDate, toDate);

        public Task<IEnumerable<InventoryTransactionResponseDto>> GetAllTransactionsAsync(
            InventoryTransactionSearchRequestDto filter) =>
            _repository.GetAllTransactionsAsync(filter);

        // ---------------- Reports ----------------
        public Task<IEnumerable<InventoryItemResponseDto>> GetLowStockItemsAsync() =>
            _repository.GetLowStockItemsAsync();

        #endregion

        #region Employee Milestone Notifications (Probation / Anniversary)
        public async Task<IEnumerable<EmployeeMilestoneResponseDto>> GetProbationAlertsAsync(int daysAhead = 7)
        {
            var data = (await _repository.GetUpcomingProbationAlertsAsync(daysAhead)).ToList();
            foreach (var item in data)
            {
                item.NotifId = await _repository.GetOrCreatePendingNotificationAsync(
                    item.EmpId, "ProbationEnd", item.MilestoneDate,
                    $"{item.EmpName}'s probation ends on {item.MilestoneDate:dd-MMM-yyyy}");
            }
            return data;
        }

        public async Task<IEnumerable<EmployeeMilestoneResponseDto>> GetAnniversaryAlertsAsync(int daysAhead = 7)
        {
            var data = (await _repository.GetUpcomingAnniversaryAlertsAsync(daysAhead)).ToList();
            foreach (var item in data)
            {
                item.NotifId = await _repository.GetOrCreatePendingNotificationAsync(
                    item.EmpId, "Anniversary", item.MilestoneDate,
                    $"{item.EmpName} completes 1 year on {item.MilestoneDate:dd-MMM-yyyy}");
            }
            return data;
        }

        public async Task<IEnumerable<EmployeeMilestoneResponseDto>> GetAllUpcomingAsync(int daysAhead = 7)
        {
            var probation = await GetProbationAlertsAsync(daysAhead);
            var anniversary = await GetAnniversaryAlertsAsync(daysAhead);
            return probation.Concat(anniversary).OrderBy(x => x.DaysRemaining);
        }

        public Task<bool> MarkSentAsync(MarkNotificationSentRequestDto request)
            => _repository.MarkSentAsync(request.NotifId);

        public Task<IEnumerable<EmployeeNotificationLogResponseDto>> GetHistoryAsync(string? notifType, bool? isSent)
            => _repository.GetHistoryAsync(notifType, isSent);
        public async Task<int> SendProbationCompletionRemindersAsync()
        {
            var completedToday = await GetProbationAlertsAsync(0);

            if (completedToday == null || !completedToday.Any())
                return 0;

            var hrEmails = _configuration.GetSection("Notifications:HrEmails").Get<List<string>>()
                           ?? new List<string>();

            if (!hrEmails.Any())
            {
                _logger.LogWarning("No HR email configured under Notifications:HrEmails — probation reminder skipped.");
                return 0;
            }

            int sentCount = 0;

            foreach (var item in completedToday)
            {
                var subject = $"Probation Completed – {item.EmpName}";
                var body = $@"
                <p>Employee <b>{item.EmpName}</b> (ID: {item.EmpId})'s probation period 
                completed today ({item.MilestoneDate:dd-MMM-yyyy}).</p>
                <p>Please initiate the confirmation process.</p>";

                try
                {
                    foreach (var hrEmail in hrEmails)
                    {
                        await _emailService.SendEmailAsync(hrEmail, subject, body);
                    }

                    // ✅ Email successfully bhejne ke BAAD hi log karo (is_sent = 1 ke saath)
                    await _repository.LogNotificationSentAsync(item.EmpId, "ProbationEnd", item.MilestoneDate,
                        $"{item.EmpName}'s probation ends on {item.MilestoneDate:dd-MMM-yyyy}");

                    sentCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send probation reminder for EmpId {EmpId}", item.EmpId);
                }
            }
            _logger.LogInformation("Probation completion reminder emails sent for {Count} employee(s).", sentCount);
            return sentCount;
        }
        #endregion

        #region EmployeePromotion
        public Task<int> PromoteAsync(PromoteEmployeeRequestDto request)
            => _repository.PromoteAsync(request);
        public Task<IEnumerable<EmployeePromotionResponseDto>> GetHistoryByEmpAsync(int empId)
            => _repository.GetHistoryByEmpAsync(empId);
        public Task<IEnumerable<EmployeePromotionResponseDto>> GetAllAsync(DateTime? fromDate, DateTime? toDate)
            => _repository.GetAllAsync(fromDate, toDate);
        public Task<int> SetHierarchyAsync(SetHierarchyRequestDto request)
            => _repository.SetHierarchyAsync(request.EmpId, request.ParentEmpId);
        public Task<IEnumerable<OrgChartNodeResponseDto>> GetDirectReportsAsync(int empId)
            => _repository.GetDirectReportsAsync(empId);
        public Task<IEnumerable<OrgChartNodeResponseDto>> GetOrgChartAsync(int? rootEmpId)
            => _repository.GetOrgChartAsync(rootEmpId);
        #endregion

        #region SalaryIncrement
        public Task<int> AddIncrementAsync(AddSalaryIncrementRequestDto request)
            => _repository.AddIncrementAsync(request);

        public Task<EmployeeSalaryVersionResponseDto?> GetCurrentAsync(int empId)
            => _repository.GetCurrentAsync(empId);

        public Task<IEnumerable<SalaryHistoryResponseDto>> GetHistoryAsync(int empId)
            => _repository.GetHistoryAsync(empId);

        public Task<EmployeeSalaryVersionResponseDto?> GetAsOfDateAsync(int empId, DateTime asOfDate)
            => _repository.GetAsOfDateAsync(empId, asOfDate);

        public Task<IEnumerable<SalaryHistoryResponseDto>> GetAllIncrementsAsync(DateTime? fromDate, DateTime? toDate)
            => _repository.GetAllIncrementsAsync(fromDate, toDate);
        #endregion

        #region Public Site – Banner

        public async Task<BannerResponseDto> CreateBannerAsync(BannerRequestDto request, string? imagePath)
            => await _repository.CreateBannerAsync(request, imagePath);

        public async Task<IEnumerable<BannerResponseDto>> GetAllBannersAsync()
            => await _repository.GetAllBannersAsync();

        public async Task<IEnumerable<BannerResponseDto>> GetActiveBannersAsync()
            => await _repository.GetActiveBannersAsync();

        public async Task<bool> UpdateBannerAsync(BannerUpdateRequestDto request, string? newImagePath, FileUploadHelper fileHelper)
        {
            var existing = await _repository.GetBannerByIdAsync(request.Id);

            var finalImagePath = !string.IsNullOrWhiteSpace(newImagePath)
                ? DeleteOldAndReturnNew(existing?.ImagePath, newImagePath, fileHelper)
                : existing?.ImagePath;

            return await _repository.UpdateBannerAsync(request, finalImagePath);
        }

        public async Task<bool> DeleteBannerAsync(int id, FileUploadHelper fileHelper)
        {
            var existing = await _repository.GetBannerByIdAsync(id);
            if (existing != null && !string.IsNullOrWhiteSpace(existing.ImagePath))
                fileHelper.DeleteFile(existing.ImagePath);

            return await _repository.DeleteBannerAsync(id);
        }

        #endregion

        #region Public Site – Gallery

        public async Task<GalleryResponseDto> CreateGalleryAsync(GalleryRequestDto request, string? imagePath)
            => await _repository.CreateGalleryAsync(request, imagePath);

        public async Task<IEnumerable<GalleryResponseDto>> GetAllGalleryAsync()
            => await _repository.GetAllGalleryAsync();

        public async Task<IEnumerable<GalleryResponseDto>> GetActiveGalleryAsync()
            => await _repository.GetActiveGalleryAsync();

        public async Task<bool> UpdateGalleryAsync(GalleryUpdateRequestDto request, string? newImagePath, FileUploadHelper fileHelper)
        {
            var all = await _repository.GetAllGalleryAsync();
            var current = all.FirstOrDefault(g => g.Id == request.Id);

            var finalImagePath = !string.IsNullOrWhiteSpace(newImagePath)
                ? DeleteOldAndReturnNew(current?.ImagePath, newImagePath, fileHelper)
                : current?.ImagePath;

            return await _repository.UpdateGalleryAsync(request, finalImagePath);
        }

        public async Task<bool> DeleteGalleryAsync(int id, FileUploadHelper fileHelper)
        {
            var all = await _repository.GetAllGalleryAsync();
            var current = all.FirstOrDefault(g => g.Id == id);
            if (current != null && !string.IsNullOrWhiteSpace(current.ImagePath))
                fileHelper.DeleteFile(current.ImagePath);

            return await _repository.DeleteGalleryAsync(id);
        }

        #endregion

        #region Public Site – Team

        public async Task<TeamResponseDto> CreateTeamAsync(TeamRequestDto request, string? imagePath)
            => await _repository.CreateTeamAsync(request, imagePath);

        public async Task<IEnumerable<TeamResponseDto>> GetAllTeamAsync()
            => await _repository.GetAllTeamAsync();

        public async Task<IEnumerable<TeamResponseDto>> GetActiveTeamAsync()
            => await _repository.GetActiveTeamAsync();

        public async Task<bool> UpdateTeamAsync(TeamUpdateRequestDto request, string? newImagePath, FileUploadHelper fileHelper)
        {
            var all = await _repository.GetAllTeamAsync();
            var current = all.FirstOrDefault(t => t.Id == request.Id);

            var finalImagePath = !string.IsNullOrWhiteSpace(newImagePath)
                ? DeleteOldAndReturnNew(current?.ImagePath, newImagePath, fileHelper)
                : current?.ImagePath;

            return await _repository.UpdateTeamAsync(request, finalImagePath);
        }

        public async Task<bool> DeleteTeamAsync(int id, FileUploadHelper fileHelper)
        {
            var all = await _repository.GetAllTeamAsync();
            var current = all.FirstOrDefault(t => t.Id == id);
            if (current != null && !string.IsNullOrWhiteSpace(current.ImagePath))
                fileHelper.DeleteFile(current.ImagePath);

            return await _repository.DeleteTeamAsync(id);
        }

        #endregion

        #region Public Site – Projects (multi-image)

        public async Task<ProjectResponseDto> CreateProjectAsync(ProjectRequestDto request, List<string> imagePaths)
            => await _repository.CreateProjectAsync(request, imagePaths);

        public async Task<IEnumerable<ProjectResponseDto>> GetAllProjectsAsync()
            => await _repository.GetAllProjectsAsync();

        public async Task<IEnumerable<ProjectResponseDto>> GetActiveProjectsAsync()
            => await _repository.GetActiveProjectsAsync();

        public async Task<bool> UpdateProjectAsync(ProjectUpdateRequestDto request, List<string> newImagePaths, FileUploadHelper fileHelper)
        {
            var (success, removedPaths) = await _repository.UpdateProjectAsync(request, newImagePaths);
            removedPaths.ForEach(fileHelper.DeleteFile);
            return success;
        }

        public async Task<bool> DeleteProjectAsync(int id, FileUploadHelper fileHelper)
        {
            var (success, deletedPaths) = await _repository.DeleteProjectAsync(id);
            deletedPaths.ForEach(fileHelper.DeleteFile);
            return success;
        }

        #endregion

        #region Public Site – Highlights
        public async Task<HighlightResponseDto> CreateHighlightAsync(HighlightRequestDto request, string? imagePath)
            => await _repository.CreateHighlightAsync(request, imagePath);

        public async Task<IEnumerable<HighlightResponseDto>> GetAllHighlightsAsync()
            => await _repository.GetAllHighlightsAsync();

        public async Task<IEnumerable<HighlightResponseDto>> GetActiveHighlightsAsync()
            => await _repository.GetActiveHighlightsAsync();

        public async Task<bool> UpdateHighlightAsync(HighlightUpdateRequestDto request, string? newImagePath, FileUploadHelper fileHelper)
        {
            var all = await _repository.GetAllHighlightsAsync();
            var current = all.FirstOrDefault(h => h.Id == request.Id);

            var finalImagePath = !string.IsNullOrWhiteSpace(newImagePath)
                ? DeleteOldAndReturnNew(current?.ImagePath, newImagePath, fileHelper)
                : current?.ImagePath;

            return await _repository.UpdateHighlightAsync(request, finalImagePath);
        }

        public async Task<bool> DeleteHighlightAsync(int id, FileUploadHelper fileHelper)
        {
            var all = await _repository.GetAllHighlightsAsync();
            var current = all.FirstOrDefault(h => h.Id == id);
            if (current != null && !string.IsNullOrWhiteSpace(current.ImagePath))
                fileHelper.DeleteFile(current.ImagePath);

            return await _repository.DeleteHighlightAsync(id);
        }

        #endregion

        #region Public Site – Career (no images)

        public async Task<CareerResponseDto> CreateCareerAsync(CareerRequestDto request)
            => await _repository.CreateCareerAsync(request);

        public async Task<IEnumerable<CareerResponseDto>> GetAllCareersAsync()
            => await _repository.GetAllCareersAsync();

        public async Task<IEnumerable<CareerResponseDto>> GetOpenCareersAsync()
            => await _repository.GetOpenCareersAsync();

        public async Task<bool> UpdateCareerAsync(CareerUpdateRequestDto request)
            => await _repository.UpdateCareerAsync(request);

        public async Task<bool> DeleteCareerAsync(int id)
            => await _repository.DeleteCareerAsync(id);

        #endregion

        #region Public Site – Contact Query (no images)

        public async Task<int> CreateContactQueryAsync(ContactQueryRequestDto request)
            => await _repository.CreateContactQueryAsync(request);

        public async Task<IEnumerable<ContactQueryResponseDto>> GetAllContactQueriesAsync(bool? isRead)
            => await _repository.GetAllContactQueriesAsync(isRead);

        public async Task<bool> MarkQueryReadAsync(int id)
            => await _repository.MarkQueryReadAsync(id);

        public async Task<bool> DeleteContactQueryAsync(int id)
            => await _repository.DeleteContactQueryAsync(id);

        #endregion

        #region Private Helper

        // Deletes the old image (if present) and returns the new path — keeps update methods short & arrow-friendly
        private string? DeleteOldAndReturnNew(string? oldPath, string? newPath, FileUploadHelper fileHelper)
        {
            if (!string.IsNullOrWhiteSpace(oldPath))
                fileHelper.DeleteFile(oldPath);

            return newPath;
        }

        #endregion

        #region Suppliers

        public async Task<int> CreateSupplierAsync(SupplierRequestDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (string.IsNullOrWhiteSpace(request.SupplierName))
                throw new InvalidOperationException("Supplier name is required.");

            var id = await _repository.CreateSupplierAsync(request);

            _logger.LogInformation("Supplier '{Name}' created with Id {SupplierId}.", request.SupplierName, id);

            return id;
        }

        public async Task<bool> UpdateSupplierAsync(SupplierUpdateRequestDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            var existing = await _repository.GetSupplierByIdAsync(request.SupplierId);
            if (existing == null)
                throw new KeyNotFoundException("Supplier not found.");

            var result = await _repository.UpdateSupplierAsync(request);

            _logger.LogInformation("Supplier {SupplierId} updated.", request.SupplierId);

            return result;
        }

        public async Task<bool> ToggleSupplierStatusAsync(int supplierId)
        {
            var existing = await _repository.GetSupplierByIdAsync(supplierId);
            if (existing == null)
                throw new KeyNotFoundException("Supplier not found.");

            return await _repository.ToggleSupplierStatusAsync(supplierId);
        }

        public Task<SupplierResponseDto?> GetSupplierByIdAsync(int supplierId) =>
            _repository.GetSupplierByIdAsync(supplierId);

        public Task<IEnumerable<SupplierResponseDto>> SearchSuppliersAsync(SupplierSearchRequestDto filter) =>
            _repository.SearchSuppliersAsync(filter);

        #endregion

        #region PO Consignee

        public async Task<int> CreateConsigneeAsync(PoConsigneeRequestDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (string.IsNullOrWhiteSpace(request.ConsigneeName))
                throw new InvalidOperationException("Consignee name is required.");

            return await _repository.CreateConsigneeAsync(request);
        }

        public Task<IEnumerable<PoConsigneeResponseDto>> GetAllConsigneesAsync() =>
            _repository.GetAllConsigneesAsync();

        #endregion

        #region Purchase Order

        public async Task<int> CreatePurchaseOrderAsync(PurchaseOrderRequestDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            if (request.SupplierId <= 0)
                throw new InvalidOperationException("Supplier is required.");

            if (request.Items == null || request.Items.Count == 0)
                throw new InvalidOperationException("At least one item is required to create a Purchase Order.");

            foreach (var item in request.Items)
            {
                if (item.Quantity <= 0)
                    throw new InvalidOperationException($"Quantity must be greater than zero for '{item.Description}'.");

                if (item.Rate < 0)
                    throw new InvalidOperationException($"Rate cannot be negative for '{item.Description}'.");

                if (item.ItemId == null && string.IsNullOrWhiteSpace(item.NewItemName))
                    throw new InvalidOperationException(
                        $"Item '{item.Description}' must either reference an existing inventory item or provide NewItemName.");
            }

            var poId = await _repository.CreatePurchaseOrderAsync(request);

            _logger.LogInformation(
                "Purchase Order {PoId} created for supplier {SupplierId} with {ItemCount} item(s).",
                poId, request.SupplierId, request.Items.Count);

            return poId;
        }

        public async Task<bool> UpdatePoStatusAsync(PurchaseOrderStatusUpdateDto request)
        {
            // request.Status is a PoStatus enum, so it's always one of the 5 valid values
            // by construction — no need to re-validate against a string allow-list.
            var existing = await _repository.GetPurchaseOrderByIdAsync(request.PoId);
            if (existing == null)
                throw new KeyNotFoundException("Purchase Order not found.");

            // The SQL column is a VARCHAR ENUM, so convert once here at the service/repo boundary.
            var statusText = request.Status.ToString();

            var result = await _repository.UpdatePoStatusAsync(request.PoId, statusText);

            _logger.LogInformation("PO {PoId} status changed to {Status}.", request.PoId, statusText);

            return result;
        }

        public Task<PurchaseOrderResponseDto?> GetPurchaseOrderByIdAsync(int poId) =>
            _repository.GetPurchaseOrderByIdAsync(poId);

        public Task<IEnumerable<PurchaseOrderResponseDto>> SearchPurchaseOrdersAsync(PurchaseOrderSearchRequestDto filter) =>
            _repository.SearchPurchaseOrdersAsync(filter);

        #endregion

        #region GRN (Goods Receipt)

        public async Task<GrnResponseDto> CreateGrnAsync(GrnRequestDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            var po = await _repository.GetPurchaseOrderByIdAsync(request.PoId);
            if (po == null)
                throw new KeyNotFoundException("Purchase Order not found.");

            if (po.Status is "Completed" or "Cancelled")
                throw new InvalidOperationException($"Cannot receive stock — PO is already '{po.Status}'.");

            if (request.Items == null || request.Items.Count == 0)
                throw new InvalidOperationException("At least one item must be received.");

            foreach (var item in request.Items)
            {
                var poItem = po.Items.FirstOrDefault(i => i.PoItemId == item.PoItemId);
                if (poItem == null)
                    throw new InvalidOperationException($"PO item {item.PoItemId} does not belong to this PO.");

                if (item.ReceivedQty <= 0)
                    throw new InvalidOperationException("Received quantity must be greater than zero.");

                if (poItem.ReceivedQty + item.ReceivedQty > poItem.Quantity)
                    throw new InvalidOperationException(
                        $"Received quantity for '{poItem.Description}' exceeds pending quantity ({poItem.PendingQty}).");
            }

            var result = await _repository.CreateGrnAsync(request);

            _logger.LogInformation("GRN {GrnId} created for PO {PoId}.", result.GrnId, request.PoId);

            return result;
        }

        public Task<IEnumerable<GrnResponseDto>> GetGrnsByPoAsync(int poId) =>
            _repository.GetGrnsByPoAsync(poId);

        #endregion

    }
}