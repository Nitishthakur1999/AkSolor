using AkerpSuite.Server.Constants;
using AkerpSuite.Server.DTOs;
using AkerpSuite.Server.DTOs.Hr;
using AkerpSuite.Server.Helpers;
using AkerpSuite.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AkerpSuite.Server.Controllers
{
    [Route("api/hr")]
    [ApiController]
    [Authorize]
    public class HRController : ControllerBase
    {
        private readonly IHRService _service;
        private readonly ILogger<HRController> _logger;
        private readonly IAdminService _adminService;

        // ── HR Module (documents, bank details, employee/attendance/leave/payroll reports) ──
        private const string HrWriteRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR;
        private const string HrDeleteRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR;
        private const string HrViewRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR;
        private const string PayrollViewRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Accounts;
        private const string PayrollWriteRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Accounts;


        // ── Sales Pipeline (segments, leads, followups, surveys, proposals, dispatch, sales docs/reminders) ──
        private const string SalesWriteRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Sales + "," + Roles.Manager;
        private const string SalesViewRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Sales + "," + Roles.Manager;

        // Payment step: keep tighter — Accounts handles verification, Sales shouldn't record payments.
        private const string PaymentWriteRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.Accounts + "," + Roles.Sales + "," + Roles.Manager;
        private const string PaymentViewRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Sales + "," + Roles.Manager;

        // BOM: Sales creates the request, stock/booking action belongs to Inventory.
        private const string BomWriteRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Sales + "," + Roles.Inventory + "," + Roles.Manager;
        private const string BomViewRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Sales + "," + Roles.Inventory + "," + Roles.Manager;

        // ── Inventory Module (item master, stock in/out/adjustment, transactions, reports) ──
        private const string InventoryWriteRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Sales + "," + Roles.Manager;
        private const string InventoryViewRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Sales + "," + Roles.Manager;

        // team wants a different split.
        private const string PurchaseWriteRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Manager;
        private const string PurchaseViewRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Manager + "," + Roles.Accounts;

        // Status changes (Approved/Cancelled) are a step above regular write access.
        private const string PurchaseApproveRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Manager;
        public HRController(IHRService service, ILogger<HRController> logger, IAdminService adminService)
        {
            _service = service;
            _logger = logger;
            _adminService = adminService;
        }

        #region HR – Employee Documents (Upload/Update/Delete)

        [HttpPost("document/upload")]
        [Authorize(Roles = HrWriteRoles)]
        public async Task<IActionResult> UploadDocument([FromBody] EmployeeDocumentRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var result = await _service.UploadDocumentAsync(request);

            return Ok(ApiResponseDto<EmployeeDocumentResponseDto>.Ok(
                result,
                "Employee document uploaded successfully."
            ));
        }

        [HttpGet("document/{empId:int}")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetEmployeeDocuments(int empId)
        {
            var result = await _service.GetEmployeeDocumentsAsync(empId);

            return Ok(ApiResponseDto<IEnumerable<EmployeeDocumentResponseDto>>.Ok(result));
        }

        [HttpGet("document/details/{docId:int}")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetDocumentById(int docId)
        {
            var result = await _service.GetDocumentByIdAsync(docId);

            if (result == null)
                return NotFound(ApiResponseDto<object>.Fail("Employee document not found."));

            return Ok(ApiResponseDto<EmployeeDocumentResponseDto>.Ok(result));
        }

        [HttpPut("document/update")]
        [Authorize(Roles = HrWriteRoles)]
        public async Task<IActionResult> UpdateDocument([FromBody] EmployeeDocumentRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var result = await _service.UpdateDocumentAsync(request);

            return Ok(ApiResponseDto<bool>.Ok(result, "Employee document updated successfully."));
        }

        [HttpDelete("document/delete/{docId:int}")]
        [Authorize(Roles = HrDeleteRoles)]
        public async Task<IActionResult> DeleteDocument(int docId)
        {
            var result = await _service.DeleteDocumentAsync(docId);

            return Ok(ApiResponseDto<bool>.Ok(
                result,
                "Employee document deleted successfully."
            ));
        }

        #endregion

        #region HR – Employee Bank Details (CRUD)

        [HttpPost("bank/create")]
        [Authorize(Roles = HrWriteRoles)]
        public async Task<IActionResult> CreateBankDetail([FromBody] EmployeeBankDetailRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var result = await _service.CreateBankDetailAsync(request);

            return Ok(ApiResponseDto<EmployeeBankDetailResponseDto>.Ok(
                result,
                "Bank detail added successfully."
            ));
        }

        [HttpGet("bank/{empId:int}")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetBankDetails(int empId)
        {
            var result = await _service.GetBankDetailsByEmployeeAsync(empId);

            return Ok(ApiResponseDto<IEnumerable<EmployeeBankDetailResponseDto>>.Ok(result));
        }

        [HttpGet("bank/details/{bankId:int}")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetBankDetailById(int bankId)
        {
            var result = await _service.GetBankDetailByIdAsync(bankId);

            if (result == null)
                return NotFound(ApiResponseDto<object>.Fail("Bank detail not found."));

            return Ok(ApiResponseDto<EmployeeBankDetailResponseDto>.Ok(result));
        }

        [HttpPut("bank/update")]
        [Authorize(Roles = HrWriteRoles)]
        public async Task<IActionResult> UpdateBankDetail([FromBody] EmployeeBankDetailRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var result = await _service.UpdateBankDetailAsync(request);

            return Ok(ApiResponseDto<bool>.Ok(result, "Bank detail updated successfully."));
        }

        [HttpDelete("bank/delete/{bankId:int}")]
        [Authorize(Roles = HrDeleteRoles)]
        public async Task<IActionResult> DeleteBankDetail(int bankId)
        {
            var result = await _service.DeleteBankDetailAsync(bankId);

            return Ok(ApiResponseDto<bool>.Ok(
                result,
                "Bank detail deleted successfully."
            ));
        }

        #endregion

        #region Self-Service – Profile, Leave, Attendance, Payslip, Loans, Documents & HR Reports

        //[HttpGet("profile")]
        //public async Task<IActionResult> GetMyProfile()
        //{
        //    var empId = User.GetEmpId();
        //    var result = await _service.GetMyProfileAsync(empId);

        //    return Ok(ApiResponseDto<SelfProfileResponseDto>.Ok(result));
        //}
        [HttpGet("profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            if (!User.TryGetEmpId(out var empId))
                return StatusCode(403, ApiResponseDto<SelfProfileResponseDto>.Fail(
                    "This account is not linked to an employee record, so Self-Service is not available."));

            var result = await _service.GetMyProfileAsync(empId);

            return Ok(ApiResponseDto<SelfProfileResponseDto>.Ok(result));
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] SelfProfileRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var empId = User.GetEmpId();
            var result = await _service.UpdateMyProfileAsync(empId, request);

            return Ok(ApiResponseDto<bool>.Ok(result, "Profile updated successfully."));
        }

        // Leave

        [HttpGet("leave/balance")]
        public async Task<IActionResult> GetMyLeaveBalance([FromQuery] int? year)
        {
            var empId = User.GetEmpId();
            var result = await _service.GetMyLeaveBalanceAsync(empId, year ?? DateTime.UtcNow.Year);

            return Ok(ApiResponseDto<IEnumerable<SelfLeaveBalanceResponseDto>>.Ok(result));
        }

        [HttpGet("leave/requests")]
        public async Task<IActionResult> GetMyLeaveRequests([FromQuery] string? status, [FromQuery] int? month, [FromQuery] int? year)
        {
            var empId = User.GetEmpId();
            var result = await _service.GetMyLeaveRequestsAsync(empId, status, month, year);

            return Ok(ApiResponseDto<IEnumerable<SelfLeaveResponseDto>>.Ok(result));
        }

        [HttpPost("leave/apply")]
        public async Task<IActionResult> ApplyLeave([FromBody] SelfLeaveRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var empId = User.GetEmpId();
            var result = await _service.ApplyLeaveAsync(empId, request);

            return Ok(ApiResponseDto<SelfLeaveResponseDto>.Ok(result, "Leave request submitted successfully."));
        }

        // Attendance

        [HttpGet("attendance")]
        public async Task<IActionResult> GetMyAttendance([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var empId = User.GetEmpId();
            var result = await _service.GetMyAttendanceAsync(empId, fromDate, toDate);

            return Ok(ApiResponseDto<IEnumerable<SelfAttendanceResponseDto>>.Ok(result));
        }

        [HttpPost("attendance/regularize")]
        public async Task<IActionResult> RequestRegularization([FromBody] SelfAttendanceRegularizationRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var empId = User.GetEmpId();
            var requestId = await _service.RequestRegularizationAsync(empId, request);

            return Ok(ApiResponseDto<int>.Ok(requestId, "Regularization request submitted successfully."));
        }

        [HttpGet("attendance/regularize")]
        public async Task<IActionResult> GetMyRegularizationRequests([FromQuery] string? status)
        {
            var empId = User.GetEmpId();
            var result = await _service.GetMyRegularizationRequestsAsync(empId, status);

            return Ok(ApiResponseDto<IEnumerable<SelfAttendanceRegularizationResponseDto>>.Ok(result));
        }

        // Payslip & Loans

        [HttpGet("payslip")]
        public async Task<IActionResult> GetMyPayslip([FromQuery] int month, [FromQuery] int year)
        {
            var empId = User.GetEmpId();
            var result = await _service.GetMyPayslipAsync(empId, month, year);

            return Ok(ApiResponseDto<SelfPayslipResponseDto>.Ok(result));
        }

        [HttpGet("loans")]
        public async Task<IActionResult> GetMyLoans()
        {
            var empId = User.GetEmpId();
            var result = await _service.GetMyLoansAsync(empId);

            return Ok(ApiResponseDto<IEnumerable<SelfLoanResponseDto>>.Ok(result));
        }

        // Documents & Bank

        [HttpGet("documents")]
        public async Task<IActionResult> GetMyDocuments()
        {
            var empId = User.GetEmpId();
            var result = await _service.GetMyDocumentsAsync(empId);

            return Ok(ApiResponseDto<IEnumerable<AkerpSuite.Server.DTOs.Hr.EmployeeDocumentResponseDto>>.Ok(result));
        }

        [HttpGet("bank-details")]
        public async Task<IActionResult> GetMyBankDetails()
        {
            var empId = User.GetEmpId();
            var result = await _service.GetMyBankDetailsAsync(empId);

            return Ok(ApiResponseDto<IEnumerable<AkerpSuite.Server.DTOs.Hr.EmployeeBankDetailResponseDto>>.Ok(result));
        }

        // Employee Report
        [HttpGet("employees")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetEmployeeReport(
                [FromQuery] int? departmentId,
                [FromQuery] int? roleId,
                [FromQuery] string? status,
                [FromQuery] int? designationId)
        {
            var viewerRole = User.FindFirst(ClaimTypes.Role)?.Value
                ?? throw new UnauthorizedAccessException("Role not found in token.");

            var data = await _adminService.GetAllEmployeesAsync(departmentId, roleId, status, designationId, viewerRole);
            return Ok(new { Success = true, Data = data });
        }

        [HttpGet("attendancereport")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetAttendanceReport(
            [FromQuery] int? empId,
            [FromQuery] DateTime? attDate,
            [FromQuery] string? status,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var data = await _adminService.GetAllAttendanceAsync(empId, attDate, status, fromDate, toDate);
            return Ok(new { Success = true, Data = data });
        }

        [HttpGet("leave")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetLeaveReport(
                [FromQuery] int? empId,
                [FromQuery] string? status,
                [FromQuery] int? month,
                [FromQuery] int? year)
        {
            var data = await _adminService.GetAllLeaveRequestsAsync(empId, status, month, year);
            return Ok(new { Success = true, Data = data });
        }

        [HttpGet("payroll")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetPayrollReport(
            [FromQuery] int month,
            [FromQuery] int year,
            [FromQuery] int? empId)
        {
            var data = await _adminService.GetPayrollDetailsAsync(month, year, empId);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Sales – Segments (Master Categories: PMSGY, Industrial, Commercial, etc.)

        [HttpPost("segments")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> CreateSegment([FromBody] SalesSegmentRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateSegmentAsync(request);
            return Ok(new { Success = true, Message = "Segment created successfully", SegmentId = id });
        }

        [HttpGet("segments")]
        public async Task<IActionResult> GetAllSegments()
        {
            var data = await _service.GetAllSegmentsAsync();
            return Ok(new { Success = true, Data = data });
        }

        [HttpPut("segments")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> UpdateSegment([FromBody] SalesSegmentUpdateRequestDto request)
        {
            var updated = await _service.UpdateSegmentAsync(request);
            if (!updated)
                return NotFound(new { Success = false, Message = "Segment not found" });

            return Ok(new { Success = true, Message = "Segment updated successfully" });
        }

        #endregion

        #region Sales – Leads (Step 1: General Entry, Step 2: Master Sheet)

        [HttpPost("leads")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> CreateLead([FromBody] SalesLeadRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateLeadAsync(request);
            return Ok(new { Success = true, Message = "Lead created successfully", LeadId = id });
        }

        [HttpPut("leads")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> UpdateLead([FromBody] SalesLeadUpdateRequestDto request)
        {
            var updated = await _service.UpdateLeadAsync(request);
            if (!updated)
                return NotFound(new { Success = false, Message = "Lead not found" });

            return Ok(new { Success = true, Message = "Lead updated successfully" });
        }

        [HttpGet("leads/{id:int}")]
        [Authorize(Roles = SalesViewRoles)]
        public async Task<IActionResult> GetLeadById(int id)
        {
            var data = await _service.GetLeadByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Lead not found" });

            return Ok(new { Success = true, Data = data });
        }

        // GET api/sales/leads? segmentId = &status = &assignedTo = &label = &fromDate = &toDate = &keyword =
        [HttpGet("leads")]
        [Authorize(Roles = SalesViewRoles)]
        public async Task<IActionResult> SearchLeads([FromQuery] SalesLeadSearchRequestDto filter)
        {
            var data = await _service.SearchLeadsAsync(filter);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Sales – Follow-ups (Follow-up Sheet + Labels like "Hot Lead")

        [HttpPost("followups")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> CreateFollowup([FromBody] SalesFollowupRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateFollowupAsync(request);
            return Ok(new { Success = true, Message = "Follow-up recorded successfully", FollowupId = id });
        }

        [HttpGet("followups/lead/{leadId:int}")]
        [Authorize(Roles = SalesViewRoles)]
        public async Task<IActionResult> GetFollowupsByLead(int leadId)
        {
            var data = await _service.GetFollowupsByLeadAsync(leadId);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Sales – Step 3: Site Survey

        [HttpPost("surveys")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> CreateSurvey([FromBody] SalesSurveyRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateSurveyAsync(request);
            return Ok(new { Success = true, Message = "Survey scheduled successfully", SurveyId = id });
        }

        [HttpPatch("surveys/feasibility")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> UpdateSurveyFeasibility([FromBody] SalesSurveyFeasibilityRequestDto request)
        {
            var leadId = await _service.UpdateSurveyFeasibilityAsync(request);
            return Ok(new
            {
                Success = true,
                Message = request.IsFeasible ? "Site marked feasible" : "Site marked not feasible",
                LeadId = leadId
            });
        }

        [HttpGet("surveys/lead/{leadId:int}")]
        [Authorize(Roles = SalesViewRoles)]
        public async Task<IActionResult> GetSurveysByLead(int leadId)
        {
            var data = await _service.GetSurveysByLeadAsync(leadId);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Sales – Step 4: Financial Proposal (Tentative → Final)

        [HttpPost("proposals")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> CreateProposal([FromBody] SalesProposalRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateProposalAsync(request);
            return Ok(new { Success = true, Message = "Proposal created successfully", ProposalId = id });
        }

        // Accepted -> lead auto-moves to Negotiation stage
        [HttpPatch("proposals/action")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> ActionProposal([FromBody] SalesProposalActionDto request)
        {
            var leadId = await _service.ActionProposalAsync(request);
            if (leadId == null)
                return NotFound(new { Success = false, Message = "Proposal not found" });

            return Ok(new { Success = true, Message = $"Proposal marked as {request.Status}", LeadId = leadId });
        }

        [HttpGet("proposals/lead/{leadId:int}")]
        [Authorize(Roles = SalesViewRoles)]
        public async Task<IActionResult> GetProposalsByLead(int leadId)
        {
            var data = await _service.GetProposalsByLeadAsync(leadId);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Sales – Step 5: Payment (Auto-forwards BOM as per Doc)

        [HttpPost("payments")]
        [Authorize(Roles = PaymentWriteRoles)]
        public async Task<IActionResult> CreatePayment([FromBody] SalesPaymentRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreatePaymentAsync(request);
            return Ok(new { Success = true, Message = "Payment recorded and BOM forwarded", PaymentId = id });
        }

        [HttpGet("payments/lead/{leadId:int}")]
        [Authorize(Roles = PaymentViewRoles)]
        public async Task<IActionResult> GetPaymentsByLead(int leadId)
        {
            var data = await _service.GetPaymentsByLeadAsync(leadId);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Sales – Step 6: Material Booking / BOM (Auto Stock Check)

        [HttpPost("bom")]
        [Authorize(Roles = BomWriteRoles)]
        public async Task<IActionResult> CreateBom([FromBody] SalesBomRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var result = await _service.CreateBomAsync(request);

            var message = result.ShortageQty > 0
                ? $"Material booked with a shortage of {result.ShortageQty} units"
                : "Material fully booked from available stock";

            return Ok(new { Success = true, Message = message, Data = result });
        }

        [HttpPatch("bom/booking")]
        [Authorize(Roles = BomWriteRoles)]
        public async Task<IActionResult> UpdateBomBooking([FromBody] SalesBomBookingUpdateDto request)
        {
            var updated = await _service.UpdateBomBookingAsync(request);
            if (!updated)
                return NotFound(new { Success = false, Message = "BOM entry not found" });

            return Ok(new { Success = true, Message = "Booking updated successfully" });
        }

        [HttpGet("bom/lead/{leadId:int}")]
        [Authorize(Roles = BomViewRoles)]
        public async Task<IActionResult> GetBomByLead(int leadId)
        {
            var data = await _service.GetBomByLeadAsync(leadId);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Sales – Step 7: Dispatch / Documents

        [HttpPost("dispatch")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> CreateDispatch([FromBody] SalesDispatchRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateDispatchAsync(request);
            return Ok(new { Success = true, Message = "Dispatch entry created", DispatchId = id });
        }

        [HttpPatch("dispatch/status")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> UpdateDispatchStatus([FromBody] SalesDispatchStatusUpdateDto request)
        {
            var updated = await _service.UpdateDispatchStatusAsync(request);
            if (!updated)
                return NotFound(new { Success = false, Message = "Dispatch entry not found" });

            return Ok(new { Success = true, Message = $"Dispatch marked as {request.Status}" });
        }

        [HttpGet("dispatch/lead/{leadId:int}")]
        [Authorize(Roles = SalesViewRoles)]
        public async Task<IActionResult> GetDispatchByLead(int leadId)
        {
            var data = await _service.GetDispatchByLeadAsync(leadId);
            return Ok(new { Success = true, Data = data });
        }

        //  Documents (Upload/Download handling)

        [HttpPost("documents/upload")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> UploadDocument(
            [FromBody] SalesDocumentUploadRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (string.IsNullOrWhiteSpace(request.Base64File))
                return BadRequest(new { Success = false, Message = "No file data provided" });

            string? relativePath;
            try
            {
                relativePath = await fileHelper.SaveBase64FileAsync(
                    request.Base64File, request.Extension, "SalesDocuments");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }

            var docRequest = new SalesDocumentRequestDto
            {
                LeadId = request.LeadId,
                DocType = request.DocType,
                DocName = request.DocName,
                FilePath = relativePath ?? string.Empty,
                UploadedBy = request.UploadedBy,
            };

            var docId = await _service.CreateDocumentAsync(docRequest);
            return Ok(new { Success = true, Message = "Document uploaded successfully", DocId = docId });
        }

        [HttpPost("documents")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> CreateDocument([FromBody] SalesDocumentRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateDocumentAsync(request);
            return Ok(new { Success = true, Message = "Document uploaded successfully", DocId = id });
        }

        [HttpGet("documents/lead/{leadId:int}")]
        [Authorize(Roles = SalesViewRoles)]
        public async Task<IActionResult> GetDocumentsByLead(int leadId)
        {
            var data = await _service.GetDocumentsByLeadAsync(leadId);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Sales – Reminders (Pop-up / Notification Till Query Attended)

        [HttpPost("reminders")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> CreateReminder([FromBody] SalesReminderRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateReminderAsync(request);
            return Ok(new { Success = true, Message = "Reminder created successfully", ReminderId = id });
        }

        // GET api/sales/reminders/pending?assignedTo=5
        [HttpGet("reminders/pending")]
        [Authorize(Roles = SalesViewRoles)]
        public async Task<IActionResult> GetPendingReminders([FromQuery] int? assignedTo)
        {
            var data = await _service.GetPendingRemindersAsync(assignedTo);
            return Ok(new { Success = true, Data = data });
        }

        [HttpPatch("reminders/{id:int}/done")]
        [Authorize(Roles = SalesWriteRoles)]
        public async Task<IActionResult> MarkReminderDone(int id)
        {
            var updated = await _service.MarkReminderDoneAsync(id);
            if (!updated)
                return NotFound(new { Success = false, Message = "Reminder not found" });

            return Ok(new { Success = true, Message = "Reminder marked as done" });
        }

        #endregion

        #region Inventory – Item Master, Stock Transactions & Reports

        // Item Master
        [HttpPost("items")]
        [Authorize(Roles = InventoryWriteRoles)]
        public async Task<IActionResult> CreateItem([FromBody] InventoryItemRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateItemAsync(request);
            return Ok(new { Success = true, Message = "Item created successfully", ItemId = id });
        }

        [HttpPut("items")]
        [Authorize(Roles = InventoryWriteRoles)]
        public async Task<IActionResult> UpdateItem([FromBody] InventoryItemUpdateRequestDto request)
        {
            var updated = await _service.UpdateItemAsync(request);
            if (!updated)
                return NotFound(new { Success = false, Message = "Item not found" });

            return Ok(new { Success = true, Message = "Item updated successfully" });
        }

        [HttpPatch("items/{id:int}/toggle-status")]
        [Authorize(Roles = InventoryWriteRoles)]
        public async Task<IActionResult> ToggleItemStatus(int id)
        {
            var updated = await _service.ToggleItemStatusAsync(id);
            if (!updated)
                return NotFound(new { Success = false, Message = "Item not found" });

            return Ok(new { Success = true, Message = "Item status toggled successfully" });
        }

        [HttpGet("items/{id:int}")]
        [Authorize(Roles = InventoryViewRoles)]
        public async Task<IActionResult> GetItemById(int id)
        {
            var data = await _service.GetItemByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Item not found" });

            return Ok(new { Success = true, Data = data });
        }

        // GET api/inventory/items?category=&isActive=&keyword=
        [HttpGet("items")]
        [Authorize(Roles = InventoryViewRoles)]
        public async Task<IActionResult> GetAllItems([FromQuery] InventoryItemSearchRequestDto filter)
        {
            var data = await _service.GetAllItemsAsync(filter);
            return Ok(new { Success = true, Data = data });
        }

        // Stock Transactions

        [HttpPost("stock-in")]
        [Authorize(Roles = InventoryWriteRoles)]
        public async Task<IActionResult> StockIn([FromBody] StockInRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var result = await _service.StockInAsync(request);
            return Ok(new { Success = true, Message = "Stock added successfully", Data = result });
        }

        [HttpPost("stock-out")]
        [Authorize(Roles = InventoryWriteRoles)]
        public async Task<IActionResult> StockOut([FromBody] StockOutRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            try
            {
                var result = await _service.StockOutAsync(request);
                return Ok(new { Success = true, Message = "Stock issued successfully", Data = result });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpPost("stock-adjustment")]
        [Authorize(Roles = InventoryWriteRoles)]
        public async Task<IActionResult> StockAdjustment([FromBody] StockAdjustmentRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var result = await _service.StockAdjustmentAsync(request);
            return Ok(new { Success = true, Message = "Stock adjusted successfully", Data = result });
        }

        // GET api/inventory/transactions/item/5?fromDate=&toDate=
        [HttpGet("transactions/item/{itemId:int}")]
        [Authorize(Roles = InventoryViewRoles)]
        public async Task<IActionResult> GetTransactionsByItem(
            int itemId, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var data = await _service.GetTransactionsByItemAsync(itemId, fromDate, toDate);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/inventory/transactions?txnType=&fromDate=&toDate=
        [HttpGet("transactions")]
        [Authorize(Roles = InventoryViewRoles)]
        public async Task<IActionResult> GetAllTransactions([FromQuery] InventoryTransactionSearchRequestDto filter)
        {
            var data = await _service.GetAllTransactionsAsync(filter);
            return Ok(new { Success = true, Data = data });
        }

        // Reports

        [HttpGet("reports/low-stock")]
        [Authorize(Roles = InventoryViewRoles)]
        public async Task<IActionResult> GetLowStockItems()
        {
            var data = await _service.GetLowStockItemsAsync();
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region HR – Employee Milestone Notifications (Probation / Anniversary)

        // GET api/hr/milestones/probation?daysAhead=7
        [HttpGet("milestones/probation")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetProbationAlerts([FromQuery] int daysAhead = 7)
        {
            var data = await _service.GetProbationAlertsAsync(daysAhead);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/hr/milestones/anniversary?daysAhead=7
        [HttpGet("milestones/anniversary")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetAnniversaryAlerts([FromQuery] int daysAhead = 7)
        {
            var data = await _service.GetAnniversaryAlertsAsync(daysAhead);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/hr/milestones/all?daysAhead=7
        [HttpGet("milestones/all")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetAllMilestoneAlerts([FromQuery] int daysAhead = 7)
        {
            var data = await _service.GetAllUpcomingAsync(daysAhead);
            return Ok(new { Success = true, Data = data });
        }

        // PATCH api/hr/milestones/mark-sent
        [HttpPatch("milestones/mark-sent")]
        [Authorize(Roles = HrWriteRoles)]
        public async Task<IActionResult> MarkNotificationSent([FromBody] MarkNotificationSentRequestDto request)
        {
            var result = await _service.MarkSentAsync(request);
            if (!result)
                return NotFound(new { Success = false, Message = "Notification not found" });

            return Ok(new { Success = true, Message = "Notification marked as sent" });
        }

        // GET api/hr/milestones/history?notifType=ProbationEnd&isSent=false
        [HttpGet("milestones/history")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetMilestoneHistory([FromQuery] string? notifType, [FromQuery] bool? isSent)
        {
            var data = await _service.GetHistoryAsync(notifType, isSent);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region HR – Employee Promotion & Reporting Hierarchy

        // POST api/admin/employees/promote
        [HttpPost("employees/promote")]
        [Authorize(Roles = HrWriteRoles)]
        public async Task<IActionResult> PromoteEmployee([FromBody] PromoteEmployeeRequestDto request)
        {
            if (request.ApprovedBy <= 0)
            {
                var empIdClaim = User.FindFirst("emp_id")?.Value;
                if (int.TryParse(empIdClaim, out int empId))
                    request.ApprovedBy = empId;
            }

            var promoId = await _service.PromoteAsync(request);
            return Ok(new { Success = true, Message = "Employee promoted successfully", PromoId = promoId });
        }

        // GET api/admin/employees/{empId}/promotions
        [HttpGet("employees/{empId}/promotions")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetPromotionHistory(int empId)
        {
            var data = await _service.GetHistoryByEmpAsync(empId);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/admin/promotions?fromDate=&toDate=
        [HttpGet("promotions")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetAllPromotions([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var data = await _service.GetAllAsync(fromDate, toDate);
            return Ok(new { Success = true, Data = data });
        }

        // PUT api/admin/hierarchy
        [HttpPut("hierarchy")]
        [Authorize(Roles = HrWriteRoles)]
        public async Task<IActionResult> SetHierarchy([FromBody] SetHierarchyRequestDto request)
        {
            var level = await _service.SetHierarchyAsync(request);
            return Ok(new { Success = true, Message = "Hierarchy updated successfully", Level = level });
        }

        // GET api/admin/hierarchy/{empId}/reports
        [HttpGet("hierarchy/{empId}/reports")]
        [Authorize(Roles = HrViewRoles)]
        public async Task<IActionResult> GetDirectReports(int empId)
        {
            var data = await _service.GetDirectReportsAsync(empId);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/admin/hierarchy/orgchart?rootEmpId=
        [HttpGet("hierarchy/orgchart")]
        [Authorize]
        public async Task<IActionResult> GetOrgChart([FromQuery] int? rootEmpId)
        {
            var data = await _service.GetOrgChartAsync(rootEmpId);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Payroll – Salary Increment History

        // POST api/admin/salary/increment
        [HttpPost("salary/increment")]
        [Authorize(Roles = PayrollWriteRoles)]
        public async Task<IActionResult> AddSalaryIncrement([FromBody] AddSalaryIncrementRequestDto request)
        {
            if (request.CreatedBy <= 0)
            {
                var empIdClaim = User.FindFirst("emp_id")?.Value;
                if (int.TryParse(empIdClaim, out int empId))
                    request.CreatedBy = empId;
            }

            var salId = await _service.AddIncrementAsync(request);
            return Ok(new { Success = true, Message = "Salary increment added successfully", SalId = salId });
        }

        // GET api/admin/salary/current/{empId}
        [HttpGet("salary/current/{empId}")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetCurrentSalary(int empId)
        {
            var data = await _service.GetCurrentAsync(empId);
            if (data == null)
                return NotFound(new { Success = false, Message = "No active salary record found" });

            return Ok(new { Success = true, Data = data });
        }

        // GET api/admin/salary/history/{empId}
        [HttpGet("salary/history/{empId}")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetSalaryHistory(int empId)
        {
            var data = await _service.GetHistoryAsync(empId);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/admin/salary/as-of/{empId}?asOfDate=2026-01-01
        [HttpGet("salary/as-of/{empId}")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetSalaryAsOfDate(int empId, [FromQuery] DateTime asOfDate)
        {
            var data = await _service.GetAsOfDateAsync(empId, asOfDate);
            if (data == null)
                return NotFound(new { Success = false, Message = "No salary record found for the given date" });

            return Ok(new { Success = true, Data = data });
        }

        // GET api/admin/salary/increments?fromDate=&toDate=
        [HttpGet("salary/increments")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetAllIncrements([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
        {
            var data = await _service.GetAllIncrementsAsync(fromDate, toDate);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region HR – Employee Milestone Notifications

        [HttpPost("milestones/probation/test-send")]
        public async Task<IActionResult> TestSendProbationReminders()
        {
            var count = await _service.SendProbationCompletionRemindersAsync();
            return Ok(new { Success = true, Message = $"Reminder emails sent for {count} employee(s)." });
        }

        #endregion

        #region Suppliers

        [HttpPost("suppliers")]
        [Authorize(Roles = PurchaseWriteRoles)]
        public async Task<IActionResult> CreateSupplier([FromBody] SupplierRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateSupplierAsync(request);
            return Ok(new { Success = true, Message = "Supplier created successfully", SupplierId = id });
        }

        [HttpPut("suppliers")]
        [Authorize(Roles = PurchaseWriteRoles)]
        public async Task<IActionResult> UpdateSupplier([FromBody] SupplierUpdateRequestDto request)
        {
            var updated = await _service.UpdateSupplierAsync(request);
            if (!updated)
                return NotFound(new { Success = false, Message = "Supplier not found" });

            return Ok(new { Success = true, Message = "Supplier updated successfully" });
        }

        [HttpPatch("suppliers/{id:int}/toggle-status")]
        [Authorize(Roles = PurchaseWriteRoles)]
        public async Task<IActionResult> ToggleSupplierStatus(int id)
        {
            var updated = await _service.ToggleSupplierStatusAsync(id);
            if (!updated)
                return NotFound(new { Success = false, Message = "Supplier not found" });

            return Ok(new { Success = true, Message = "Supplier status toggled successfully" });
        }

        [HttpGet("suppliers/{id:int}")]
        [Authorize(Roles = PurchaseViewRoles)]
        public async Task<IActionResult> GetSupplierById(int id)
        {
            var data = await _service.GetSupplierByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Supplier not found" });

            return Ok(new { Success = true, Data = data });
        }

        // GET api/purchase/suppliers?keyword=&isActive=
        [HttpGet("suppliers")]
        [Authorize(Roles = PurchaseViewRoles)]
        public async Task<IActionResult> SearchSuppliers([FromQuery] SupplierSearchRequestDto filter)
        {
            var data = await _service.SearchSuppliersAsync(filter);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region PO Consignee

        [HttpPost("consignees")]
        [Authorize(Roles = PurchaseWriteRoles)]
        public async Task<IActionResult> CreateConsignee([FromBody] PoConsigneeRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            var id = await _service.CreateConsigneeAsync(request);
            return Ok(new { Success = true, Message = "Consignee created successfully", ConsigneeId = id });
        }

        [HttpGet("consignees")]
        [Authorize(Roles = PurchaseViewRoles)]
        public async Task<IActionResult> GetAllConsignees()
        {
            var data = await _service.GetAllConsigneesAsync();
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Purchase Order

        [HttpPost("orders")]
        [Authorize(Roles = PurchaseWriteRoles)]
        public async Task<IActionResult> CreatePurchaseOrder([FromBody] PurchaseOrderRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            try
            {
                var poId = await _service.CreatePurchaseOrderAsync(request);
                return Ok(new { Success = true, Message = "Purchase Order created successfully", PoId = poId });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpPatch("orders/status")]
        [Authorize(Roles = PurchaseApproveRoles)]
        public async Task<IActionResult> UpdatePoStatus([FromBody] PurchaseOrderStatusUpdateDto request)
        {
            try
            {
                var updated = await _service.UpdatePoStatusAsync(request);
                if (!updated)
                    return NotFound(new { Success = false, Message = "Purchase Order not found" });

                return Ok(new { Success = true, Message = $"Purchase Order marked as {request.Status}" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpGet("orders/{id:int}")]
        [Authorize(Roles = PurchaseViewRoles)]
        public async Task<IActionResult> GetPurchaseOrderById(int id)
        {
            var data = await _service.GetPurchaseOrderByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Purchase Order not found" });

            return Ok(new { Success = true, Data = data });
        }

        // GET api/purchase/orders?supplierId=&status=&fromDate=&toDate=&keyword=
        [HttpGet("orders")]
        [Authorize(Roles = PurchaseViewRoles)]
        public async Task<IActionResult> SearchPurchaseOrders([FromQuery] PurchaseOrderSearchRequestDto filter)
        {
            var data = await _service.SearchPurchaseOrdersAsync(filter);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region GRN (Goods Receipt Note)

        [HttpPost("grn")]
        [Authorize(Roles = PurchaseWriteRoles)]
        public async Task<IActionResult> CreateGrn([FromBody] GrnRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { Success = false, Message = "Invalid request" });

            try
            {
                var result = await _service.CreateGrnAsync(request);
                return Ok(new
                {
                    Success = true,
                    Message = $"Stock received successfully. PO status: {result.PoStatus}",
                    Data = result
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        [HttpGet("grn/po/{poId:int}")]
        [Authorize(Roles = PurchaseViewRoles)]
        public async Task<IActionResult> GetGrnsByPo(int poId)
        {
            var data = await _service.GetGrnsByPoAsync(poId);
            return Ok(new { Success = true, Data = data });
        }

        #endregion


    }
}