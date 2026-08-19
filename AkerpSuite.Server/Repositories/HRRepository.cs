using AkerpSuite.Server.Data;
using AkerpSuite.Server.DTOs.Hr;
using Dapper;
using Microsoft.AspNetCore.Connections;
using MySqlConnector;
using System.Data;

namespace AkerpSuite.Server.Repositories
{
    public class HRRepository : IHRRepository
    {
        private readonly DapperContext _context;

        public HRRepository(DapperContext context)
        {
            _context = context;
        }

        #region Employee Documents

        public async Task<EmployeeDocumentResponseDto> UploadDocumentAsync(EmployeeDocumentRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", request.EmpId);
            parameters.Add("p_doc_type", request.DocType);
            parameters.Add("p_doc_name", request.DocName);
            parameters.Add("p_file_path", request.FilePath);
            parameters.Add("p_uploaded_by", request.UploadedBy);

            return await connection.QueryFirstAsync<EmployeeDocumentResponseDto>(
                "sp_employee_document_create",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<EmployeeDocumentResponseDto>> GetEmployeeDocumentsAsync(int empId)
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<EmployeeDocumentResponseDto>(
                "sp_employee_document_get_by_employee",
                new { p_emp_id = empId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<EmployeeDocumentResponseDto?> GetDocumentByIdAsync(int docId)
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<EmployeeDocumentResponseDto>(
                "sp_employee_document_get_by_id",
                new { p_doc_id = docId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateDocumentAsync(EmployeeDocumentRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_doc_id", request.DocId);
            parameters.Add("p_doc_type", request.DocType);
            parameters.Add("p_doc_name", request.DocName);
            parameters.Add("p_file_path", request.FilePath);

            // The Postgres function returns the number of affected rows.
            var rows = await connection.QueryFirstOrDefaultAsync<int>(
                "sp_employee_document_update",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> DeleteDocumentAsync(int docId)
        {
            using var connection = _context.CreateConnection();

            var rows = await connection.QueryFirstOrDefaultAsync<int>(
                "sp_employee_document_delete",
                new { p_doc_id = docId },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        #endregion

        #region Employee Bank Details

        public async Task<EmployeeBankDetailResponseDto> CreateBankDetailAsync(EmployeeBankDetailRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", request.EmpId);
            parameters.Add("p_bank_name", request.BankName);
            parameters.Add("p_account_no", request.AccountNo);
            parameters.Add("p_ifsc_code", request.IfscCode);
            parameters.Add("p_branch_name", request.BranchName);
            parameters.Add("p_account_type", request.AccountType);
            parameters.Add("p_is_primary", request.IsPrimary);

            return await connection.QueryFirstAsync<EmployeeBankDetailResponseDto>(
                "sp_employee_bank_create",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<EmployeeBankDetailResponseDto>> GetBankDetailsByEmployeeAsync(int empId)
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<EmployeeBankDetailResponseDto>(
                "sp_employee_bank_get_by_employee",
                new { p_emp_id = empId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<EmployeeBankDetailResponseDto?> GetBankDetailByIdAsync(int bankId)
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<EmployeeBankDetailResponseDto>(
                "sp_employee_bank_get_by_id",
                new { p_bank_id = bankId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateBankDetailAsync(EmployeeBankDetailRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_bank_id", request.BankId);
            parameters.Add("p_bank_name", request.BankName);
            parameters.Add("p_account_no", request.AccountNo);
            parameters.Add("p_ifsc_code", request.IfscCode);
            parameters.Add("p_branch_name", request.BranchName);
            parameters.Add("p_account_type", request.AccountType);
            parameters.Add("p_is_primary", request.IsPrimary);

            var rows = await connection.QueryFirstOrDefaultAsync<int>(
                "sp_employee_bank_update",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> DeleteBankDetailAsync(int bankId)
        {
            using var connection = _context.CreateConnection();

            var rows = await connection.QueryFirstOrDefaultAsync<int>(
                "sp_employee_bank_delete",
                new { p_bank_id = bankId },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        #endregion

        #region Self profile
        public async Task<SelfProfileResponseDto?> GetProfileAsync(int empId)
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryFirstOrDefaultAsync<SelfProfileResponseDto>(
                "sp_employee_get_by_id",
                new { p_emp_id = empId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> UpdateProfileAsync(SelfProfileResponseDto current, SelfProfileRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", current.EmpId);
            parameters.Add("p_first_name", current.FirstName);
            parameters.Add("p_last_name", current.LastName);
            parameters.Add("p_gender", current.Gender);
            parameters.Add("p_date_of_birth", current.DateOfBirth);
            parameters.Add("p_blood_group", request.BloodGroup ?? current.BloodGroup);
            parameters.Add("p_marital_status", request.MaritalStatus ?? current.MaritalStatus);
            parameters.Add("p_personal_email", request.PersonalEmail ?? current.PersonalEmail);
            parameters.Add("p_official_email", current.OfficialEmail);
            parameters.Add("p_mobile", request.Mobile ?? current.Mobile);
            parameters.Add("p_alternate_mobile", request.AlternateMobile ?? current.AlternateMobile);
            parameters.Add("p_address_line1", request.AddressLine1 ?? current.AddressLine1);
            parameters.Add("p_address_line2", request.AddressLine2 ?? current.AddressLine2);
            parameters.Add("p_city", request.City ?? current.City);
            parameters.Add("p_state", request.State ?? current.State);
            parameters.Add("p_pincode", request.Pincode ?? current.Pincode);
            parameters.Add("p_country", request.Country ?? current.Country);
            parameters.Add("p_aadhar_no", current.AadharNo);
            parameters.Add("p_pan_no", current.PanNo);
            parameters.Add("p_passport_no", current.PassportNo);
            parameters.Add("p_uan_no", current.UanNo);
            parameters.Add("p_esic_no", current.EsicNo);
            parameters.Add("p_dept_id", current.DeptId);
            parameters.Add("p_desig_id", current.DesigId);
            parameters.Add("p_reporting_manager", current.ReportingManager);
            parameters.Add("p_date_of_joining", current.DateOfJoining);
            parameters.Add("p_employment_type", current.EmploymentType);
            parameters.Add("p_employment_status", current.EmploymentStatus);
            parameters.Add("p_current_ctc", current.CurrentCtc);
            parameters.Add("p_photo_path", current.PhotoPath);
            parameters.Add("p_probation_end_date", current.ProbationEndDate);
            parameters.Add("p_confirmation_date", current.ConfirmationDate);
            parameters.Add("p_resignation_date", (DateTime?)null);
            parameters.Add("p_last_working_date", (DateTime?)null);
            parameters.Add("p_exit_reason", (string?)null);
            parameters.Add("p_role_id", current.RoleId);

            return await connection.QueryFirstOrDefaultAsync<int>(
                "sp_employee_update",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        // Leave

        public async Task<IEnumerable<SelfLeaveBalanceResponseDto>> GetLeaveBalanceAsync(int empId, int year)
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<SelfLeaveBalanceResponseDto>(
                "sp_leave_balance_get",
                new { p_emp_id = empId, p_year = year },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SelfLeaveResponseDto>> GetMyLeaveRequestsAsync(int empId, string? status, int? month, int? year)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_status", status);
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);

            return await connection.QueryAsync<SelfLeaveResponseDto>(
                "sp_leave_request_getall",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<SelfLeaveResponseDto> ApplyLeaveAsync(int empId, SelfLeaveRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_leave_type_id", request.LeaveTypeId);
            parameters.Add("p_from_date", request.FromDate);
            parameters.Add("p_to_date", request.ToDate);
            parameters.Add("p_total_days", request.TotalDays);
            parameters.Add("p_reason", request.Reason);

            return await connection.QueryFirstAsync<SelfLeaveResponseDto>(
                "sp_leave_request_create",
                parameters,
                commandType: CommandType.StoredProcedure);
        }
        // Attendance

        public async Task<IEnumerable<SelfAttendanceResponseDto>> GetMyAttendanceAsync(int empId, DateTime? fromDate, DateTime? toDate)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_from_date", fromDate);
            parameters.Add("p_to_date", toDate);

            return await connection.QueryAsync<SelfAttendanceResponseDto>(
                "sp_attendance_get_by_emp",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> CreateRegularizationRequestAsync(int empId, SelfAttendanceRegularizationRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_request_date", request.RequestDate);
            parameters.Add("p_reason", request.Reason);

            return await connection.QueryFirstAsync<int>(
                "sp_attendance_reg_create",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SelfAttendanceRegularizationResponseDto>> GetMyRegularizationRequestsAsync(
           int empId, string? status, string? requestType = null)   // 🆕 optional param
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_status", status);
            parameters.Add("p_request_type", requestType);

            return await connection.QueryAsync<SelfAttendanceRegularizationResponseDto>(
                "sp_attendance_reg_get_all",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        //  Payslip

        public async Task<SelfPayslipResponseDto?> GetMyPayslipAsync(int empId, int month, int year)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);

            var row = await connection.QueryFirstOrDefaultAsync(
                "sp_payslip_get",
                parameters,
                commandType: CommandType.StoredProcedure);

            if (row == null) return null;

            var r = (IDictionary<string, object?>)row;

            T Get<T>(string key, T fallback = default!) =>
                r.TryGetValue(key, out var val) && val != null && val != DBNull.Value
                    ? (T)Convert.ChangeType(val, typeof(T))
                    : fallback;

            string? GetStr(string key) =>
                r.TryGetValue(key, out var val) && val != DBNull.Value ? val?.ToString() : null;

            return new SelfPayslipResponseDto
            {
                DetailId = Get<int>("detail_id"),
                PayrollId = Get<int>("payroll_id"),
                EmpId = Get<int>("emp_id"),
                EmpCode = GetStr("emp_code"),
                FullName = $"{GetStr("first_name")} {GetStr("last_name")}".Trim(),
                DeptName = GetStr("dept_name"),
                DesigName = GetStr("desig_name"),
                Month = Get<int>("month"),
                Year = Get<int>("year"),
                WorkingDays = Get<int>("working_days"),
                PresentDays = Get<int>("present_days"),
                AbsentDays = Get<int>("absent_days"),
                HalfDays = Get<int>("half_days"),
                LateMarks = Get<int>("late_marks"),
                OvertimeHours = Get<decimal>("overtime_hours"),
                Basic = Get<decimal>("basic"),
                Hra = Get<decimal>("hra"),
                Ta = Get<decimal>("ta"),
                SpecialAllow = Get<decimal>("special_allow"),
                OvertimeAmount = Get<decimal>("overtime_amount"),
                GrossEarning = Get<decimal>("gross_earning"),
                PfDeduction = Get<decimal>("pf_deduction"),
                EsicDeduction = Get<decimal>("esic_deduction"),
                TdsDeduction = Get<decimal>("tds_deduction"),
                PtDeduction = Get<decimal>("pt_deduction"),
                AbsentDeduction = Get<decimal>("absent_deduction"),
                LateDeduction = Get<decimal>("late_deduction"),
                LoanDeduction = Get<decimal>("loan_deduction"),
                PenaltyDeduction = Get<decimal>("penalty_deduction"),
                TotalDeduction = Get<decimal>("total_deduction"),
                NetSalary = Get<decimal>("net_salary"),
                PayrollStatus = GetStr("payroll_status"),
                BankName = GetStr("bank_name"),
                AccountNo = GetStr("account_no"),
                IfscCode = GetStr("ifsc_code")
            };
        }

        //Loans

        public async Task<IEnumerable<SelfLoanResponseDto>> GetMyLoansAsync(int empId)
        {
            using var connection = _context.CreateConnection();

            var rows = await connection.QueryAsync(
                "sp_loan_get_by_emp",
                new { p_emp_id = empId },
                commandType: CommandType.StoredProcedure);

            return rows.Select(row =>
            {
                var r = (IDictionary<string, object?>)row;

                T Get<T>(string key, T fallback = default!) =>
                    r.TryGetValue(key, out var val) && val != null && val != DBNull.Value
                        ? (T)Convert.ChangeType(val, typeof(T))
                        : fallback;

                string? GetStr(string key) =>
                    r.TryGetValue(key, out var val) && val != DBNull.Value ? val?.ToString() : null;

                return new SelfLoanResponseDto
                {
                    LoanId = Get<int>("loan_id"),
                    EmpId = Get<int>("emp_id"),
                    LoanType = GetStr("loan_type"),
                    TotalAmount = Get<decimal>("total_amount"),
                    EmiAmount = Get<decimal>("emi_amount"),
                    RemainingAmount = Get<decimal>("remaining_amount"),
                    LoanDate = Get<DateTime>("loan_date"),
                    Status = GetStr("status"),
                    ApprovedBy = r.TryGetValue("approved_by", out var ab) && ab != DBNull.Value ? Convert.ToInt32(ab) : (int?)null,
                    Remarks = GetStr("remarks")
                };
            });
        }

        //  Documents / Bank

        public async Task<IEnumerable<EmployeeDocumentResponseDto>> GetMyDocumentsAsync(int empId)
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<EmployeeDocumentResponseDto>(
                "sp_employee_document_get_by_employee",
                new { p_emp_id = empId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<EmployeeBankDetailResponseDto>> GetMyBankDetailsAsync(int empId)
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<EmployeeBankDetailResponseDto>(
                "sp_employee_bank_get_by_employee",
                new { p_emp_id = empId },
                commandType: CommandType.StoredProcedure);
        }

        #endregion

        #region Sales
        // ---------------- Segments ----------------
        public async Task<int> CreateSegmentAsync(SalesSegmentRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_SegmentCode", request.SegmentCode);
            p.Add("p_SegmentName", request.SegmentName);
            p.Add("p_Description", request.Description);

            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateSalesSegment", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SalesSegmentResponseDto>> GetAllSegmentsAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<SalesSegmentResponseDto>(
                "sp_GetAllSalesSegments", commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateSegmentAsync(SalesSegmentUpdateRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_SegmentId", request.SegmentId);
            p.Add("p_SegmentName", request.SegmentName);
            p.Add("p_Description", request.Description);
            p.Add("p_IsActive", request.IsActive);

            var rows = await conn.ExecuteScalarAsync<int>(
                "sp_UpdateSalesSegment", p, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        // ---------------- Leads ----------------

        public async Task<int> CreateLeadAsync(SalesLeadRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadDate", request.LeadDate);
            p.Add("p_Name", request.Name);
            p.Add("p_ContactNo", request.ContactNo);
            p.Add("p_Email", request.Email);
            p.Add("p_Address", request.Address);
            p.Add("p_Reference", request.Reference);
            p.Add("p_SegmentId", request.SegmentId);
            p.Add("p_QueryType", request.QueryType);
            p.Add("p_Remarks", request.Remarks);
            p.Add("p_AssignedTo", request.AssignedTo);
            p.Add("p_CreatedBy", request.CreatedBy);

            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateSalesLead", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateLeadAsync(SalesLeadUpdateRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", request.LeadId);
            p.Add("p_Name", request.Name);
            p.Add("p_ContactNo", request.ContactNo);
            p.Add("p_Email", request.Email);
            p.Add("p_Address", request.Address);
            p.Add("p_Reference", request.Reference);
            p.Add("p_SegmentId", request.SegmentId);
            p.Add("p_QueryType", request.QueryType);
            p.Add("p_Remarks", request.Remarks);
            p.Add("p_Label", request.Label);
            p.Add("p_NextFollowup", request.NextFollowup);
            p.Add("p_Status", request.Status);
            p.Add("p_AssignedTo", request.AssignedTo);

            var rows = await conn.ExecuteScalarAsync<int>(
                "sp_UpdateSalesLead", p, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> MarkLeadNotFeasibleAsync(int leadId, string? remarks)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", leadId);
            p.Add("p_Remarks", remarks);

            var rows = await conn.ExecuteScalarAsync<int>(
                "sp_MarkLeadNotFeasible", p, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<SalesLeadResponseDto?> GetLeadByIdAsync(int leadId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", leadId);

            return await conn.QueryFirstOrDefaultAsync<SalesLeadResponseDto>(
                "sp_GetSalesLeadById", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SalesLeadResponseDto>> SearchLeadsAsync(SalesLeadSearchRequestDto filter)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_SegmentId", filter.SegmentId);
            p.Add("p_Status", filter.Status);
            p.Add("p_AssignedTo", filter.AssignedTo);
            p.Add("p_Label", filter.Label);
            p.Add("p_FromDate", filter.FromDate);
            p.Add("p_ToDate", filter.ToDate);
            p.Add("p_Keyword", filter.Keyword);

            return await conn.QueryAsync<SalesLeadResponseDto>(
                "sp_SearchSalesLeads", p, commandType: CommandType.StoredProcedure);
        }

        // ---------------- Followups ----------------

        public async Task<int> CreateFollowupAsync(SalesFollowupRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", request.LeadId);
            // p.Add("p_FollowupDate", request.FollowupDate);
            p.Add("p_FollowupDate", DateTime.UtcNow);
            p.Add("p_Remarks", request.Remarks);
            p.Add("p_Label", request.Label);
            p.Add("p_NextFollowup", request.NextFollowup);
            p.Add("p_DoneBy", request.DoneBy);

            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateSalesFollowup", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SalesFollowupResponseDto>> GetFollowupsByLeadAsync(int leadId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", leadId);

            return await conn.QueryAsync<SalesFollowupResponseDto>(
                "sp_GetFollowupsByLead", p, commandType: CommandType.StoredProcedure);
        }

        // ---------------- Survey ----------------

        public async Task<int> CreateSurveyAsync(SalesSurveyRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", request.LeadId);
            p.Add("p_SurveyDate", request.SurveyDate);
            p.Add("p_SurveyorId", request.SurveyorId);
            p.Add("p_SiteAddress", request.SiteAddress);
            p.Add("p_LoadKw", request.LoadKw);
            p.Add("p_RoofAreaSqft", request.RoofAreaSqft);
            p.Add("p_ShadowFree", request.ShadowFree);
            p.Add("p_GridType", request.GridType);
            p.Add("p_OtherDetails", request.OtherDetails);
            p.Add("p_DocPath", request.DocPath);

            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateSalesSurvey", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<int> UpdateSurveyFeasibilityAsync(SalesSurveyFeasibilityRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_SurveyId", request.SurveyId);
            p.Add("p_IsFeasible", request.IsFeasible);
            p.Add("p_Remarks", request.Remarks);

            // sp_UpdateSurveyFeasibility returns the affected LeadId
            return await conn.ExecuteScalarAsync<int>(
                "sp_UpdateSurveyFeasibility", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SalesSurveyResponseDto>> GetSurveysByLeadAsync(int leadId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", leadId);

            return await conn.QueryAsync<SalesSurveyResponseDto>(
                "sp_GetSurveysByLead", p, commandType: CommandType.StoredProcedure);
        }

        // ---------------- Proposals ----------------

        public async Task<int> CreateProposalAsync(SalesProposalRequestDto request, string proposalNo)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", request.LeadId);
            p.Add("p_ProposalNo", proposalNo);
            p.Add("p_ProposalDate", request.ProposalDate);
            p.Add("p_SystemSizeKw", request.SystemSizeKw);
            p.Add("p_TotalAmount", request.TotalAmount);
            p.Add("p_SubsidyAmount", request.SubsidyAmount);
            p.Add("p_ValidityDays", request.ValidityDays);
            p.Add("p_DocPath", request.DocPath);
            p.Add("p_IsFinal", request.IsFinal);
            p.Add("p_CreatedBy", request.CreatedBy);

            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateSalesProposal", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<int?> ActionProposalAsync(SalesProposalActionDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_ProposalId", request.ProposalId);
            p.Add("p_Status", request.Status);

            // Returns affected LeadId
            return await conn.ExecuteScalarAsync<int?>(
                "sp_ActionSalesProposal", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SalesProposalResponseDto>> GetProposalsByLeadAsync(int leadId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", leadId);

            return await conn.QueryAsync<SalesProposalResponseDto>(
                "sp_GetProposalsByLead", p, commandType: CommandType.StoredProcedure);
        }

        // ---------------- Payments ----------------

        public async Task<int> CreatePaymentAsync(SalesPaymentRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", request.LeadId);
            p.Add("p_ProposalId", request.ProposalId);
            p.Add("p_PaymentDate", request.PaymentDate);
            p.Add("p_Amount", request.Amount);
            p.Add("p_PaymentMode", request.PaymentMode);
            p.Add("p_ReferenceNo", request.ReferenceNo);
            p.Add("p_Remarks", request.Remarks);
            p.Add("p_CreatedBy", request.CreatedBy);

            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateSalesPayment", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SalesPaymentResponseDto>> GetPaymentsByLeadAsync(int leadId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", leadId);

            return await conn.QueryAsync<SalesPaymentResponseDto>(
                "sp_GetPaymentsByLead", p, commandType: CommandType.StoredProcedure);
        }

        // ---------------- BOM / Material Booking ----------------

        public async Task<SalesBomCreateResultDto> CreateBomAsync(SalesBomRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", request.LeadId);
            p.Add("p_ItemId", request.ItemId);
            p.Add("p_RequiredQty", request.RequiredQty);

            var result = await conn.QueryFirstAsync<SalesBomCreateResultDto>(
                "sp_CreateSalesBom", p, commandType: CommandType.StoredProcedure);
            return result;
        }

        public async Task<bool> UpdateBomBookingAsync(SalesBomBookingUpdateDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_BomId", request.BomId);
            p.Add("p_AdditionalBookedQty", request.AdditionalBookedQty);

            var rows = await conn.ExecuteScalarAsync<int>(
                "sp_UpdateSalesBomBooking", p, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<IEnumerable<SalesBomResponseDto>> GetBomByLeadAsync(int leadId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", leadId);

            return await conn.QueryAsync<SalesBomResponseDto>(
                "sp_GetBomByLead", p, commandType: CommandType.StoredProcedure);
        }

        // ---------------- Dispatch ----------------

        public async Task<int> CreateDispatchAsync(SalesDispatchRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", request.LeadId);
            p.Add("p_DispatchDate", request.DispatchDate);
            p.Add("p_DispatchBy", request.DispatchBy);
            p.Add("p_Transporter", request.Transporter);
            p.Add("p_TrackingNo", request.TrackingNo);
            p.Add("p_Remarks", request.Remarks);

            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateSalesDispatch", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateDispatchStatusAsync(SalesDispatchStatusUpdateDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_DispatchId", request.DispatchId);
            p.Add("p_Status", request.Status);

            var rows = await conn.ExecuteScalarAsync<int>(
                "sp_UpdateSalesDispatchStatus", p, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<IEnumerable<SalesDispatchResponseDto>> GetDispatchByLeadAsync(int leadId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", leadId);

            return await conn.QueryAsync<SalesDispatchResponseDto>(
                "sp_GetDispatchByLead", p, commandType: CommandType.StoredProcedure);
        }

        // ---------------- Documents ----------------

        public async Task<int> CreateDocumentAsync(SalesDocumentRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", request.LeadId);
            p.Add("p_DocType", request.DocType);
            p.Add("p_DocName", request.DocName);
            p.Add("p_FilePath", request.FilePath);
            p.Add("p_UploadedBy", request.UploadedBy);

            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateSalesDocument", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SalesDocumentResponseDto>> GetDocumentsByLeadAsync(int leadId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", leadId);

            return await conn.QueryAsync<SalesDocumentResponseDto>(
                "sp_GetDocumentsByLead", p, commandType: CommandType.StoredProcedure);
        }

        // ---------------- Reminders ----------------

        public async Task<int> CreateReminderAsync(SalesReminderRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_LeadId", request.LeadId);
            p.Add("p_ReminderType", request.ReminderType);
            p.Add("p_ReminderDate", request.ReminderDate);
            p.Add("p_Message", request.Message);
            p.Add("p_AssignedTo", request.AssignedTo);

            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateSalesReminder", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SalesReminderResponseDto>> GetPendingRemindersAsync(int? assignedTo)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_AssignedTo", assignedTo);

            return await conn.QueryAsync<SalesReminderResponseDto>(
                "sp_GetPendingReminders", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> MarkReminderDoneAsync(int reminderId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_ReminderId", reminderId);

            var rows = await conn.ExecuteScalarAsync<int>(
                "sp_MarkReminderDone", p, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }
        #endregion

        #region Inventory
        // ---------------- Items ----------------

        public async Task<int> CreateItemAsync(InventoryItemRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_ItemCode", request.ItemCode);
            p.Add("p_ItemName", request.ItemName);
            p.Add("p_Category", request.Category);
            p.Add("p_Unit", request.Unit);
            p.Add("p_OpeningStock", request.OpeningStock);
            p.Add("p_ReorderLevel", request.ReorderLevel);
            p.Add("p_CreatedBy", request.CreatedBy);

            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateInventoryItem", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateItemAsync(InventoryItemUpdateRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_ItemId", request.ItemId);
            p.Add("p_ItemName", request.ItemName);
            p.Add("p_Category", request.Category);
            p.Add("p_Unit", request.Unit);
            p.Add("p_ReorderLevel", request.ReorderLevel);

            var rows = await conn.ExecuteScalarAsync<int>(
                "sp_UpdateInventoryItem", p, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> ToggleItemStatusAsync(int itemId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_ItemId", itemId);

            var rows = await conn.ExecuteScalarAsync<int>(
                "sp_ToggleInventoryItemStatus", p, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<InventoryItemResponseDto?> GetItemByIdAsync(int itemId)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_ItemId", itemId);

            return await conn.QueryFirstOrDefaultAsync<InventoryItemResponseDto>(
                "sp_GetInventoryItemById", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<InventoryItemResponseDto>> GetAllItemsAsync(InventoryItemSearchRequestDto filter)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_Category", filter.Category);
            p.Add("p_IsActive", filter.IsActive);
            p.Add("p_Keyword", filter.Keyword);

            return await conn.QueryAsync<InventoryItemResponseDto>(
                "sp_GetAllInventoryItems", p, commandType: CommandType.StoredProcedure);
        }

        // ---------------- Stock transactions ----------------

        public async Task<StockTransactionResultDto> StockInAsync(StockInRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_ItemId", request.ItemId);
            p.Add("p_Quantity", request.Quantity);
            p.Add("p_ReferenceType", request.ReferenceType);
            p.Add("p_ReferenceNo", request.ReferenceNo);
            p.Add("p_Remarks", request.Remarks);
            p.Add("p_CreatedBy", request.CreatedBy);

            return await conn.QueryFirstAsync<StockTransactionResultDto>(
                "sp_StockIn", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<StockTransactionResultDto> StockOutAsync(StockOutRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_ItemId", request.ItemId);
            p.Add("p_Quantity", request.Quantity);
            p.Add("p_ReferenceType", request.ReferenceType);
            p.Add("p_ReferenceNo", request.ReferenceNo);
            p.Add("p_Remarks", request.Remarks);
            p.Add("p_CreatedBy", request.CreatedBy);

            try
            {
                return await conn.QueryFirstAsync<StockTransactionResultDto>(
                    "sp_StockOut", p, commandType: CommandType.StoredProcedure);
            }
            catch (MySqlException ex) when (ex.Message.Contains("Insufficient stock"))
            {
                // Translate the SP's SIGNAL into a clean exception your
                // GlobalExceptionMiddleware can map to a 400 response.
                throw new InvalidOperationException("Insufficient stock for this issue quantity");
            }
        }

        public async Task<StockTransactionResultDto> StockAdjustmentAsync(StockAdjustmentRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_ItemId", request.ItemId);
            p.Add("p_AdjustedQuantity", request.AdjustedQuantity);
            p.Add("p_Reason", request.Reason);
            p.Add("p_Remarks", request.Remarks);
            p.Add("p_CreatedBy", request.CreatedBy);

            return await conn.QueryFirstAsync<StockTransactionResultDto>(
                "sp_StockAdjustment", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<InventoryTransactionResponseDto>> GetTransactionsByItemAsync(
            int itemId, DateTime? fromDate, DateTime? toDate)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_ItemId", itemId);
            p.Add("p_FromDate", fromDate);
            p.Add("p_ToDate", toDate);

            return await conn.QueryAsync<InventoryTransactionResponseDto>(
                "sp_GetTransactionsByItem", p, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<InventoryTransactionResponseDto>> GetAllTransactionsAsync(
            InventoryTransactionSearchRequestDto filter)
        {
            using var conn = _context.CreateConnection();
            var p = new DynamicParameters();
            p.Add("p_TxnType", filter.TxnType);
            p.Add("p_FromDate", filter.FromDate);
            p.Add("p_ToDate", filter.ToDate);

            return await conn.QueryAsync<InventoryTransactionResponseDto>(
                "sp_GetAllTransactions", p, commandType: CommandType.StoredProcedure);
        }

        // ---------------- Reports ----------------

        public async Task<IEnumerable<InventoryItemResponseDto>> GetLowStockItemsAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<InventoryItemResponseDto>(
                "sp_GetLowStockItems", commandType: CommandType.StoredProcedure);
        }
        #endregion

        #region Employee Milestone Notifications (Probation / Anniversary)
        public async Task<IEnumerable<EmployeeMilestoneResponseDto>> GetUpcomingProbationAlertsAsync(int daysAhead)
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QueryAsync<EmployeeMilestoneResponseDto>(
                "sp_GetUpcomingProbationAlerts",
                new { p_DaysAhead = daysAhead },
                commandType: CommandType.StoredProcedure);

            foreach (var r in result) r.NotifType = "ProbationEnd";
            return result;
        }

        public async Task<IEnumerable<EmployeeMilestoneResponseDto>> GetUpcomingAnniversaryAlertsAsync(int daysAhead)
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QueryAsync<EmployeeMilestoneResponseDto>(
                "sp_GetUpcomingAnniversaryAlerts",
                new { p_DaysAhead = daysAhead },
                commandType: CommandType.StoredProcedure);

            foreach (var r in result) r.NotifType = "Anniversary";
            return result;
        }

        public async Task<int> LogNotificationSentAsync(int empId, string notifType, DateTime notifDate, string? message)
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QuerySingleAsync<int>(
                "sp_LogEmployeeNotificationSent",
                new { p_EmpId = empId, p_NotifType = notifType, p_NotifDate = notifDate, p_Message = message },
                commandType: CommandType.StoredProcedure);
            return result;
        }
        public async Task<int> GetOrCreatePendingNotificationAsync(int empId, string notifType, DateTime notifDate, string? message)
        {
            using var conn = _context.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "sp_GetOrCreatePendingNotification",
                new { p_EmpId = empId, p_NotifType = notifType, p_NotifDate = notifDate, p_Message = message },
                commandType: CommandType.StoredProcedure);
        }
        public async Task<int> LogNotificationAsync(int empId, string notifType, DateTime notifDate, string? message)
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QuerySingleAsync<int>(
                "sp_LogEmployeeNotification",
                new { p_EmpId = empId, p_NotifType = notifType, p_NotifDate = notifDate, p_Message = message },
                commandType: CommandType.StoredProcedure);
            return result;
        }
        public async Task<bool> MarkSentAsync(int notifId)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_MarkNotificationSent",
                new { p_NotifId = notifId },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<IEnumerable<EmployeeNotificationLogResponseDto>> GetHistoryAsync(string? notifType, bool? isSent)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<EmployeeNotificationLogResponseDto>(
                "sp_GetNotificationHistory",
                new { p_NotifType = notifType, p_IsSent = isSent },
                commandType: CommandType.StoredProcedure);
        }
        // Repository class mein implement karo
        public async Task MarkNotificationSentAsync(int empId, string notifType, DateTime notifDate, string message)
        {
            using var conn = _context.CreateConnection();
            await conn.ExecuteAsync(
                @"INSERT INTO employee_notifications (emp_id, notif_type, notif_date, message, is_sent, sent_at)
          VALUES (@EmpId, @NotifType, @NotifDate, @Message, 1, NOW())",
                new { EmpId = empId, NotifType = notifType, NotifDate = notifDate, Message = message });
        }
        #endregion

        #region EmployeePromotion
        public async Task<int> PromoteAsync(PromoteEmployeeRequestDto request)
        {
            using var conn = _context.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "sp_PromoteEmployee",
                new
                {
                    p_EmpId = request.EmpId,
                    p_NewDesigId = request.NewDesigId,
                    p_NewDeptId = request.NewDeptId,
                    p_NewCtc = request.NewCtc,
                    p_PromotionDate = request.PromotionDate,
                    p_Remarks = request.Remarks,
                    p_ApprovedBy = request.ApprovedBy
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<EmployeePromotionResponseDto>> GetHistoryByEmpAsync(int empId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<EmployeePromotionResponseDto>(
                "sp_GetPromotionHistoryByEmp",
                new { p_EmpId = empId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<EmployeePromotionResponseDto>> GetAllAsync(DateTime? fromDate, DateTime? toDate)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<EmployeePromotionResponseDto>(
                "sp_GetAllPromotions",
                new { p_FromDate = fromDate, p_ToDate = toDate },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> SetHierarchyAsync(int empId, int? parentEmpId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "sp_SetEmployeeHierarchy",
                new { p_EmpId = empId, p_ParentEmpId = parentEmpId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<OrgChartNodeResponseDto>> GetDirectReportsAsync(int empId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<OrgChartNodeResponseDto>(
                "sp_GetDirectReports",
                new { p_EmpId = empId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<OrgChartNodeResponseDto>> GetOrgChartAsync(int? rootEmpId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<OrgChartNodeResponseDto>(
                "sp_GetOrgChart",
                new { p_RootEmpId = rootEmpId },
                commandType: CommandType.StoredProcedure);
        }
        #endregion

        #region SalaryIncrement
        public async Task<int> AddIncrementAsync(AddSalaryIncrementRequestDto r)
        {
            using var conn = _context.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "sp_AddSalaryIncrement",
                new
                {
                    p_EmpId = r.EmpId,
                    p_StructureId = r.StructureId,
                    p_Basic = r.Basic,
                    p_Hra = r.Hra,
                    p_Ta = r.Ta,
                    p_Da = r.Da,
                    p_SpecialAllow = r.SpecialAllow,
                    p_PfEmployee = r.PfEmployee,
                    p_PfEmployer = r.PfEmployer,
                    p_EsicEmployee = r.EsicEmployee,
                    p_EsicEmployer = r.EsicEmployer,
                    p_Tds = r.Tds,
                    p_ProfessionalTax = r.ProfessionalTax,
                    p_EffectiveFrom = r.EffectiveFrom,
                    p_CreatedBy = r.CreatedBy
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<EmployeeSalaryVersionResponseDto?> GetCurrentAsync(int empId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<EmployeeSalaryVersionResponseDto>(
                "sp_GetCurrentSalary",
                new { p_EmpId = empId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SalaryHistoryResponseDto>> GetHistoryAsync(int empId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<SalaryHistoryResponseDto>(
                "sp_GetSalaryHistory",
                new { p_EmpId = empId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<EmployeeSalaryVersionResponseDto?> GetAsOfDateAsync(int empId, DateTime asOfDate)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<EmployeeSalaryVersionResponseDto>(
                "sp_GetSalaryAsOfDate",
                new { p_EmpId = empId, p_AsOfDate = asOfDate },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SalaryHistoryResponseDto>> GetAllIncrementsAsync(DateTime? fromDate, DateTime? toDate)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<SalaryHistoryResponseDto>(
                "sp_GetAllIncrements",
                new { p_FromDate = fromDate, p_ToDate = toDate },
                commandType: CommandType.StoredProcedure);
        }
        #endregion

        #region Public Site – Banner

        public async Task<BannerResponseDto> CreateBannerAsync(BannerRequestDto request, string? imagePath)
        {
            using var conn = _context.CreateConnection();
            var newId = await conn.QuerySingleAsync<int>(
                "sp_Banner_Create",
                new
                {
                    p_Title = request.Title,
                    p_SubTitle = request.SubTitle,
                    p_ImagePath = imagePath,
                    p_DisplayOrder = request.DisplayOrder,
                    p_IsActive = request.IsActive
                },
                commandType: CommandType.StoredProcedure);

            return await GetBannerByIdAsync(newId) ?? throw new InvalidOperationException("Banner creation failed.");
        }

        public async Task<BannerResponseDto?> GetBannerByIdAsync(int id)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<BannerResponseDto>(
                "sp_Banner_GetById", new { p_Id = id }, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<BannerResponseDto>> GetAllBannersAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<BannerResponseDto>(
                "sp_Banner_GetAll", commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<BannerResponseDto>> GetActiveBannersAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<BannerResponseDto>(
                "sp_Banner_GetActive", commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateBannerAsync(BannerUpdateRequestDto request, string? imagePath)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Banner_Update",
                new
                {
                    p_Id = request.Id,
                    p_Title = request.Title,
                    p_SubTitle = request.SubTitle,
                    p_ImagePath = imagePath,
                    p_DisplayOrder = request.DisplayOrder,
                    p_IsActive = request.IsActive
                },
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> DeleteBannerAsync(int id)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Banner_Delete", new { p_Id = id }, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        #endregion

        #region Public Site – Gallery

        public async Task<GalleryResponseDto> CreateGalleryAsync(GalleryRequestDto request, string? imagePath)
        {
            using var conn = _context.CreateConnection();
            var newId = await conn.QuerySingleAsync<int>(
                "sp_Gallery_Create",
                new { p_Title = request.Title, p_Category = request.Category, p_ImagePath = imagePath, p_IsActive = request.IsActive },
                commandType: CommandType.StoredProcedure);

            return await conn.QueryFirstAsync<GalleryResponseDto>(
                "sp_Gallery_GetById", new { p_Id = newId }, commandType: CommandType.StoredProcedure);
        }
        public async Task<GalleryResponseDto?> GetGalleryByIdAsync(int id)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<GalleryResponseDto>(
                "sp_Gallery_GetById", new { p_Id = id }, commandType: CommandType.StoredProcedure);
        }
        public async Task<IEnumerable<GalleryResponseDto>> GetAllGalleryAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<GalleryResponseDto>(
                "sp_Gallery_GetAll", commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<GalleryResponseDto>> GetActiveGalleryAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<GalleryResponseDto>(
                "sp_Gallery_GetActive", commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateGalleryAsync(GalleryUpdateRequestDto request, string? imagePath)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Gallery_Update",
                new { p_Id = request.Id, p_Title = request.Title, p_Category = request.Category, p_ImagePath = imagePath, p_IsActive = request.IsActive },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> DeleteGalleryAsync(int id)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Gallery_Delete", new { p_Id = id }, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        #endregion

        #region Public Site – Team

        public async Task<TeamResponseDto> CreateTeamAsync(TeamRequestDto request, string? imagePath)
        {
            using var conn = _context.CreateConnection();
            var newId = await conn.QuerySingleAsync<int>(
                "sp_Team_Create",
                new
                {
                    p_Name = request.Name,
                    p_Designation = request.Designation,
                    p_Bio = request.Bio,
                    p_LinkedInUrl = request.LinkedInUrl,
                    p_ImagePath = imagePath,
                    p_DisplayOrder = request.DisplayOrder,
                    p_IsActive = request.IsActive
                },
                commandType: CommandType.StoredProcedure);

            return await conn.QueryFirstAsync<TeamResponseDto>(
                "sp_Team_GetById", new { p_Id = newId }, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<TeamResponseDto>> GetAllTeamAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<TeamResponseDto>(
                "sp_Team_GetAll", commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<TeamResponseDto>> GetActiveTeamAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<TeamResponseDto>(
                "sp_Team_GetActive", commandType: CommandType.StoredProcedure);
        }

        public async Task<TeamResponseDto?> GetTeamByIdAsync(int id)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<TeamResponseDto>(
                "sp_Team_GetById", new { p_Id = id }, commandType: CommandType.StoredProcedure);
        }

        public async Task<HighlightResponseDto?> GetHighlightByIdAsync(int id)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<HighlightResponseDto>(
                "sp_Highlight_GetById", new { p_Id = id }, commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateTeamAsync(TeamUpdateRequestDto request, string? imagePath)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Team_Update",
                new
                {
                    p_Id = request.Id,
                    p_Name = request.Name,
                    p_Designation = request.Designation,
                    p_Bio = request.Bio,
                    p_LinkedInUrl = request.LinkedInUrl,
                    p_ImagePath = imagePath,
                    p_DisplayOrder = request.DisplayOrder,
                    p_IsActive = request.IsActive
                },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> DeleteTeamAsync(int id)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Team_Delete", new { p_Id = id }, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        #endregion

        #region Public Site – Projects (multi-image)

        public async Task<ProjectResponseDto> CreateProjectAsync(ProjectRequestDto request, List<string> imagePaths)
        {
            using var conn = _context.CreateConnection();
            conn.Open();
            using var txn = conn.BeginTransaction();

            var newId = await conn.QuerySingleAsync<int>(
                "sp_Project_Create",
                new
                {
                    p_Title = request.Title,
                    p_Location = request.Location,
                    p_CapacityKw = request.CapacityKw,
                    p_Description = request.Description,
                    p_CompletedOn = request.CompletedOn,
                    p_IsActive = request.IsActive
                },
                transaction: txn, commandType: CommandType.StoredProcedure);

            foreach (var path in imagePaths)
            {
                await conn.ExecuteAsync(
                    "sp_ProjectImage_Add",
                    new { p_ProjectId = newId, p_ImagePath = path },
                    transaction: txn, commandType: CommandType.StoredProcedure);
            }

            txn.Commit();

            return await GetProjectByIdInternalAsync(conn, newId);
        }

        public async Task<ProjectResponseDto?> GetProjectByIdAsync(int id)
        {
            using var conn = _context.CreateConnection();
            var project = await conn.QueryFirstOrDefaultAsync<ProjectResponseDto>(
                "sp_Project_GetById", new { p_Id = id }, commandType: CommandType.StoredProcedure);

            if (project == null) return null;

            var images = await conn.QueryAsync<string>(
                "sp_ProjectImage_GetByProject", new { p_ProjectId = id }, commandType: CommandType.StoredProcedure);
            project.ImagePaths = images.ToList();

            return project;
        }

        private async Task<ProjectResponseDto> GetProjectByIdInternalAsync(IDbConnection conn, int id)
        {
            var project = await conn.QueryFirstAsync<ProjectResponseDto>(
                "sp_Project_GetById", new { p_Id = id }, commandType: CommandType.StoredProcedure);

            var images = await conn.QueryAsync<string>(
                "sp_ProjectImage_GetByProject", new { p_ProjectId = id }, commandType: CommandType.StoredProcedure);

            project.ImagePaths = images.ToList();
            return project;
        }

        public async Task<IEnumerable<ProjectResponseDto>> GetAllProjectsAsync()
        {
            using var conn = _context.CreateConnection();
            var projects = (await conn.QueryAsync<ProjectResponseDto>(
                "sp_Project_GetAll", commandType: CommandType.StoredProcedure)).ToList();

            foreach (var p in projects)
            {
                var images = await conn.QueryAsync<string>(
                    "sp_ProjectImage_GetByProject", new { p_ProjectId = p.Id }, commandType: CommandType.StoredProcedure);
                p.ImagePaths = images.ToList();
            }

            return projects;
        }

        public async Task<IEnumerable<ProjectResponseDto>> GetActiveProjectsAsync()
        {
            using var conn = _context.CreateConnection();
            var projects = (await conn.QueryAsync<ProjectResponseDto>(
                "sp_Project_GetActive", commandType: CommandType.StoredProcedure)).ToList();

            foreach (var p in projects)
            {
                var images = await conn.QueryAsync<string>(
                    "sp_ProjectImage_GetByProject", new { p_ProjectId = p.Id }, commandType: CommandType.StoredProcedure);
                p.ImagePaths = images.ToList();
            }

            return projects;
        }

        // Returns old image paths that were removed, so the service layer can delete them from disk
        public async Task<(bool Success, List<string> RemovedImagePaths)> UpdateProjectAsync(
            ProjectUpdateRequestDto request, List<string> newImagePaths)
        {
            using var conn = _context.CreateConnection();
            conn.Open();
            using var txn = conn.BeginTransaction();

            var rows = await conn.QuerySingleAsync<int>(
                "sp_Project_Update",
                new
                {
                    p_Id = request.Id,
                    p_Title = request.Title,
                    p_Location = request.Location,
                    p_CapacityKw = request.CapacityKw,
                    p_Description = request.Description,
                    p_CompletedOn = request.CompletedOn,
                    p_IsActive = request.IsActive
                },
                transaction: txn, commandType: CommandType.StoredProcedure);

            var removedPaths = new List<string>();

            if (newImagePaths.Count > 0)
            {
                // remove old images not kept, add new ones
                var oldPaths = (await conn.QueryAsync<string>(
                    "sp_ProjectImage_DeleteByProject", new { p_ProjectId = request.Id },
                    transaction: txn, commandType: CommandType.StoredProcedure)).ToList();

                removedPaths = oldPaths.Except(request.ExistingImagePaths).ToList();

                foreach (var path in request.ExistingImagePaths)
                {
                    await conn.ExecuteAsync("sp_ProjectImage_Add",
                        new { p_ProjectId = request.Id, p_ImagePath = path },
                        transaction: txn, commandType: CommandType.StoredProcedure);
                }

                foreach (var path in newImagePaths)
                {
                    await conn.ExecuteAsync("sp_ProjectImage_Add",
                        new { p_ProjectId = request.Id, p_ImagePath = path },
                        transaction: txn, commandType: CommandType.StoredProcedure);
                }
            }

            txn.Commit();
            return (rows > 0, removedPaths);
        }

        public async Task<(bool Success, List<string> DeletedImagePaths)> DeleteProjectAsync(int id)
        {
            using var conn = _context.CreateConnection();
            var deletedPaths = (await conn.QueryAsync<string>(
                "sp_Project_Delete", new { p_Id = id }, commandType: CommandType.StoredProcedure)).ToList();

            return (deletedPaths.Count >= 0, deletedPaths); // rows check optional, SP already deletes
        }

        #endregion

        #region Public Site – Highlights

        public async Task<HighlightResponseDto> CreateHighlightAsync(HighlightRequestDto request, string? imagePath)
        {
            using var conn = _context.CreateConnection();
            var newId = await conn.QuerySingleAsync<int>(
                "sp_Highlight_Create",
                new { p_Title = request.Title, p_Description = request.Description, p_ImagePath = imagePath, p_DisplayOrder = request.DisplayOrder, p_IsActive = request.IsActive },
                commandType: CommandType.StoredProcedure);

            return await conn.QueryFirstAsync<HighlightResponseDto>(
                "sp_Highlight_GetById", new { p_Id = newId }, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<HighlightResponseDto>> GetAllHighlightsAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<HighlightResponseDto>(
                "sp_Highlight_GetAll", commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<HighlightResponseDto>> GetActiveHighlightsAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<HighlightResponseDto>(
                "sp_Highlight_GetActive", commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateHighlightAsync(HighlightUpdateRequestDto request, string? imagePath)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Highlight_Update",
                new { p_Id = request.Id, p_Title = request.Title, p_Description = request.Description, p_ImagePath = imagePath, p_DisplayOrder = request.DisplayOrder, p_IsActive = request.IsActive },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> DeleteHighlightAsync(int id)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Highlight_Delete", new { p_Id = id }, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        #endregion

        #region Public Site – Career

        public async Task<CareerResponseDto> CreateCareerAsync(CareerRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var newId = await conn.QuerySingleAsync<int>(
                "sp_Career_Create",
                new { p_JobTitle = request.JobTitle, p_Location = request.Location, p_ExperienceRequired = request.ExperienceRequired, p_Description = request.Description, p_IsOpen = request.IsOpen },
                commandType: CommandType.StoredProcedure);

            return await conn.QueryFirstAsync<CareerResponseDto>(
                "sp_Career_GetById", new { p_Id = newId }, commandType: CommandType.StoredProcedure);
        }

        public async Task<CareerResponseDto?> GetCareerByIdAsync(int id)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<CareerResponseDto>(
                "sp_Career_GetById", new { p_Id = id }, commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<CareerResponseDto>> GetAllCareersAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<CareerResponseDto>(
                "sp_Career_GetAll", commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<CareerResponseDto>> GetOpenCareersAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<CareerResponseDto>(
                "sp_Career_GetOpen", commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateCareerAsync(CareerUpdateRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Career_Update",
                new { p_Id = request.Id, p_JobTitle = request.JobTitle, p_Location = request.Location, p_ExperienceRequired = request.ExperienceRequired, p_Description = request.Description, p_IsOpen = request.IsOpen },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> DeleteCareerAsync(int id)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Career_Delete", new { p_Id = id }, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        #endregion

        #region Public Site – Contact Query

        public async Task<int> CreateContactQueryAsync(ContactQueryRequestDto request)
        {
            using var conn = _context.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "sp_ContactQuery_Create",
                new { p_Name = request.Name, p_Phone = request.Phone, p_Email = request.Email, p_Subject = request.Subject, p_Message = request.Message },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<ContactQueryResponseDto>> GetAllContactQueriesAsync(bool? isRead)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<ContactQueryResponseDto>(
                "sp_ContactQuery_GetAll", new { p_IsRead = isRead }, commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> MarkQueryReadAsync(int id)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_ContactQuery_MarkRead", new { p_Id = id }, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> DeleteContactQueryAsync(int id)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_ContactQuery_Delete", new { p_Id = id }, commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        #endregion

        #region Suppliers
        public async Task<int> CreateSupplierAsync(SupplierRequestDto request)
        {
            using var conn = _context.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "sp_Supplier_Create",
                new
                {
                    p_SupplierName = request.SupplierName,
                    p_Gstin = request.Gstin,
                    p_PanNo = request.PanNo,
                    p_Address = request.Address,
                    p_StateName = request.StateName,
                    p_StateCode = request.StateCode,
                    p_ContactNo = request.ContactNo,
                    p_Email = request.Email
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateSupplierAsync(SupplierUpdateRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Supplier_Update",
                new
                {
                    p_SupplierId = request.SupplierId,
                    p_SupplierName = request.SupplierName,
                    p_Gstin = request.Gstin,
                    p_PanNo = request.PanNo,
                    p_Address = request.Address,
                    p_StateName = request.StateName,
                    p_StateCode = request.StateCode,
                    p_ContactNo = request.ContactNo,
                    p_Email = request.Email
                },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> ToggleSupplierStatusAsync(int supplierId)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Supplier_ToggleStatus",
                new { p_SupplierId = supplierId },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<SupplierResponseDto?> GetSupplierByIdAsync(int supplierId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<SupplierResponseDto>(
                "sp_Supplier_GetById",
                new { p_SupplierId = supplierId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<SupplierResponseDto>> SearchSuppliersAsync(SupplierSearchRequestDto filter)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<SupplierResponseDto>(
                "sp_Supplier_Search",
                new { p_Keyword = filter.Keyword, p_IsActive = filter.IsActive },
                commandType: CommandType.StoredProcedure);
        }

        #endregion

        #region PO Consignee

        public async Task<int> CreateConsigneeAsync(PoConsigneeRequestDto request)
        {
            using var conn = _context.CreateConnection();
            return await conn.QuerySingleAsync<int>(
                "sp_Consignee_Create",
                new
                {
                    p_ConsigneeName = request.ConsigneeName,
                    p_SiteAddress = request.SiteAddress,
                    p_Gstin = request.Gstin,
                    p_StateName = request.StateName,
                    p_StateCode = request.StateCode,
                    p_LeadId = request.LeadId
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<PoConsigneeResponseDto>> GetAllConsigneesAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<PoConsigneeResponseDto>(
                "sp_Consignee_GetAll", commandType: CommandType.StoredProcedure);
        }

        #endregion

        #region Purchase Order
        public async Task<int> CreatePurchaseOrderAsync(PurchaseOrderRequestDto request)
        {
            using var conn = _context.CreateConnection();
            conn.Open();
            using var txn = conn.BeginTransaction();

            try
            {
                var poId = await conn.QuerySingleAsync<int>(
                    "sp_PurchaseOrder_Create",
                    new
                    {
                     //   p_VoucherNo = request.VoucherNo,
                        p_PoDate = request.PoDate,
                        p_SupplierId = request.SupplierId,
                        p_ConsigneeId = request.ConsigneeId,
                        p_ReferenceNo = request.ReferenceNo,
                        p_ReferenceDate = request.ReferenceDate,
                        p_DispatchedThrough = request.DispatchedThrough,
                        p_Destination = request.Destination,
                        p_TermsOfDelivery = request.TermsOfDelivery,
                        p_ModeOfPayment = request.ModeOfPayment,
                        p_CreatedBy = request.CreatedBy
                    },
                    transaction: txn, commandType: CommandType.StoredProcedure);

                foreach (var item in request.Items)
                {
                    var itemId = item.ItemId;

                    // Auto-create the inventory item master row if the person picked "new item"
                    if (itemId == null)
                    {
                        itemId = await conn.QuerySingleAsync<int>(
                            "sp_CreateInventoryItem",
                            new
                            {
                                p_ItemCode = (string?)null,
                                p_ItemName = item.NewItemName,
                                p_Category = item.NewItemCategory,
                                p_Unit = item.Unit,
                                p_OpeningStock = 0m,
                                p_ReorderLevel = 0m,
                                p_CreatedBy = request.CreatedBy
                            },
                            transaction: txn, commandType: CommandType.StoredProcedure);
                    }

                    await conn.ExecuteAsync(
                        "sp_PurchaseOrderItem_Add",
                        new
                        {
                            p_PoId = poId,
                            p_ItemId = itemId,
                            p_Description = item.Description,
                            p_HsnSac = item.HsnSac,
                            p_GstRate = item.GstRate,
                            p_Quantity = item.Quantity,
                            p_Unit = item.Unit,
                            p_Rate = item.Rate
                        },
                        transaction: txn, commandType: CommandType.StoredProcedure);
                }

                // Recomputes total_amount / igst_amount on the header from its item rows
                await conn.ExecuteAsync(
                    "sp_PurchaseOrder_RecalculateTotals",
                    new { p_PoId = poId },
                    transaction: txn, commandType: CommandType.StoredProcedure);

                txn.Commit();
                return poId;
            }
            catch
            {
                txn.Rollback();
                throw;
            }
        }

        public async Task<bool> UpdatePoStatusAsync(int poId, string status)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_PurchaseOrder_UpdateStatus",
                new { p_PoId = poId, p_Status = status },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<PurchaseOrderResponseDto?> GetPurchaseOrderByIdAsync(int poId)
        {
            using var conn = _context.CreateConnection();

            var header = await conn.QueryFirstOrDefaultAsync<PurchaseOrderResponseDto>(
                "sp_PurchaseOrder_GetById",
                new { p_PoId = poId },
                commandType: CommandType.StoredProcedure);

            if (header == null) return null;

            var items = await conn.QueryAsync<PurchaseOrderItemResponseDto>(
                "sp_PurchaseOrderItem_GetByPo",
                new { p_PoId = poId },
                commandType: CommandType.StoredProcedure);

            header.Items = items.ToList();
            return header;
        }

        public async Task<IEnumerable<PurchaseOrderResponseDto>> SearchPurchaseOrdersAsync(PurchaseOrderSearchRequestDto filter)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<PurchaseOrderResponseDto>(
                "sp_PurchaseOrder_Search",
                new
                {
                    p_SupplierId = filter.SupplierId,
                    p_Status = filter.Status,
                    p_FromDate = filter.FromDate,
                    p_ToDate = filter.ToDate,
                    p_Keyword = filter.Keyword
                },
                commandType: CommandType.StoredProcedure);
        }

        #endregion

        #region Purchase Invoice

        public async Task<int> CreatePurchaseInvoiceAsync(PurchaseInvoiceRequestDto request)
        {
            using var conn = _context.CreateConnection();
            conn.Open();
            using var txn = conn.BeginTransaction();

            try
            {
                var invoiceId = await conn.QuerySingleAsync<int>(
                    "sp_Invoice_Create",
                    new
                    {
                        p_PoId = request.PoId,
                        p_InvoiceNo = request.InvoiceNo,
                        p_InvoiceDate = request.InvoiceDate,
                        p_DueDate = request.DueDate,
                        p_DispatchedThrough = request.DispatchedThrough,
                        p_Destination = request.Destination,
                        p_TermsOfDelivery = request.TermsOfDelivery,
                        p_ModeOfPayment = request.ModeOfPayment,
                        p_Remarks = request.Remarks,
                        p_CreatedBy = request.CreatedBy
                    },
                    transaction: txn, commandType: CommandType.StoredProcedure);

                foreach (var item in request.Items)
                {
                    await conn.ExecuteAsync(
                        "sp_InvoiceItem_Add",
                        new
                        {
                            p_InvoiceId = invoiceId,
                            p_PoItemId = item.PoItemId,
                            p_ItemId = item.ItemId,
                            p_Description = item.Description,
                            p_HsnSac = item.HsnSac,
                            p_GstRate = item.GstRate,
                            p_DueOn = item.DueOn,
                            p_InvoicedQty = item.InvoicedQty,
                            p_Unit = item.Unit,
                            p_Rate = item.Rate,
                            p_DiscountPercent = item.DiscountPercent
                        },
                        transaction: txn, commandType: CommandType.StoredProcedure);
                }

                // Recomputes taxable/SGST/CGST/IGST/total on header from item rows + supplier state match
                await conn.ExecuteAsync(
                    "sp_Invoice_RecalculateTotals",
                    new { p_InvoiceId = invoiceId },
                    transaction: txn, commandType: CommandType.StoredProcedure);

                txn.Commit();
                return invoiceId;
            }
            catch
            {
                txn.Rollback();
                throw;
            }
        }

        public async Task<bool> UpdateInvoiceStatusAsync(int invoiceId, string status)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QuerySingleAsync<int>(
                "sp_Invoice_UpdateStatus",
                new { p_InvoiceId = invoiceId, p_Status = status },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<PurchaseInvoiceResponseDto?> GetPurchaseInvoiceByIdAsync(int invoiceId)
        {
            using var conn = _context.CreateConnection();

            var header = await conn.QueryFirstOrDefaultAsync<PurchaseInvoiceResponseDto>(
                "sp_Invoice_GetById",
                new { p_InvoiceId = invoiceId },
                commandType: CommandType.StoredProcedure);

            if (header == null) return null;

            var items = await conn.QueryAsync<PurchaseInvoiceItemResponseDto>(
                "sp_InvoiceItem_GetByInvoice",
                new { p_InvoiceId = invoiceId },
                commandType: CommandType.StoredProcedure);

            header.Items = items.ToList();
            return header;
        }

        public async Task<IEnumerable<PurchaseInvoiceResponseDto>> SearchPurchaseInvoicesAsync(PurchaseInvoiceSearchRequestDto filter)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<PurchaseInvoiceResponseDto>(
                "sp_Invoice_Search",
                new
                {
                    p_SupplierId = filter.SupplierId,
                    p_PoId = filter.PoId,
                    p_Status = filter.Status,
                    p_FromDate = filter.FromDate,
                    p_ToDate = filter.ToDate,
                    p_Keyword = filter.Keyword
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<PurchaseInvoiceResponseDto>> GetInvoicesByPoAsync(int poId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<PurchaseInvoiceResponseDto>(
                "sp_Invoice_GetByPo",
                new { p_PoId = poId },
                commandType: CommandType.StoredProcedure);
        }

        #endregion

        #region GRN (Goods Receipt)

        public async Task<GrnResponseDto> CreateGrnAsync(GrnRequestDto request)
        {
            using var conn = _context.CreateConnection();
            conn.Open();
            using var txn = conn.BeginTransaction();

            try
            {
                var grnId = await conn.QuerySingleAsync<int>(
                    "sp_Grn_Create",
                    new
                    {
                        p_PoId = request.PoId,
                        p_GrnDate = request.GrnDate,
                        p_ReceivedBy = request.ReceivedBy,
                        p_Remarks = request.Remarks
                    },
                    transaction: txn, commandType: CommandType.StoredProcedure);

                var responseItems = new List<GrnItemResponseDto>();

                foreach (var item in request.Items)
                {
                    var result = await conn.QueryFirstAsync<GrnItemResponseDto>(
                        "sp_GrnItem_Add",
                        new
                        {
                            p_GrnId = grnId,
                            p_PoItemId = item.PoItemId,
                            p_ItemId = item.ItemId,
                            p_ReceivedQty = item.ReceivedQty,
                            p_CreatedBy = request.ReceivedBy
                        },
                        transaction: txn, commandType: CommandType.StoredProcedure);

                    responseItems.Add(result);
                }

                var poStatus = await conn.QuerySingleAsync<string>(
                    "sp_PurchaseOrder_RecalculateStatus",
                    new { p_PoId = request.PoId },
                    transaction: txn, commandType: CommandType.StoredProcedure);

                txn.Commit();

                return new GrnResponseDto
                {
                    GrnId = grnId,
                    PoId = request.PoId,
                    GrnDate = request.GrnDate,
                    ReceivedBy = request.ReceivedBy,
                    Remarks = request.Remarks,
                    PoStatus = poStatus,
                    Items = responseItems
                };
            }
            catch
            {
                txn.Rollback();
                throw;
            }
        }

        public async Task<IEnumerable<GrnResponseDto>> GetGrnsByPoAsync(int poId)
        {
            using var conn = _context.CreateConnection();

            var headers = (await conn.QueryAsync<GrnResponseDto>(
                "sp_Grn_GetByPo",
                new { p_PoId = poId },
                commandType: CommandType.StoredProcedure)).ToList();

            foreach (var h in headers)
            {
                var items = await conn.QueryAsync<GrnItemResponseDto>(
                    "sp_GrnItem_GetByGrn",
                    new { p_GrnId = h.GrnId },
                    commandType: CommandType.StoredProcedure);
                h.Items = items.ToList();
            }

            return headers;
        }

        #endregion
    }
}