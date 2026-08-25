using AkerpSuite.Server.Data;
using AkerpSuite.Server.Dtos.Auth;
using AkerpSuite.Server.DTOs.Role;
using AkerpSuite.Server.Services;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;
using System.Data;

namespace AkerpSuite.Server.Repositories
{
    public class AdminRepositories : IAdminRepositories
    {
        private readonly DapperContext _context;

        public AdminRepositories(DapperContext context)
        {
            _context = context;
        }

        #region Dashboard
        public async Task<IEnumerable<DashboardCardDto>> GetDashboardByRoleAsync(int roleId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_role_id", roleId);

            return await connection.QueryAsync<DashboardCardDto>(
                "sp_GetDashboardByRole",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }

        #endregion

        #region Role Management
        public async Task<int> CreateRoleAsync(RoleRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_role_name", request.RoleName);
            parameters.Add("p_description", request.Description);
            parameters.Add("p_is_cmd_equal", request.IsCmdEqual);
            return await connection.ExecuteScalarAsync<int>(
                "sp_role_create",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<RoleResponseDto>> GetRolesAsync()
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<RoleResponseDto>(
                "sp_role_list",
                commandType: CommandType.StoredProcedure);
        }

        public async Task<RoleResponseDto?> GetRoleByIdAsync(int roleId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_role_id", roleId);

            return await connection.QueryFirstOrDefaultAsync<RoleResponseDto>(
                "sp_role_get_by_id",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateRoleAsync(int roleId, RoleRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_role_id", roleId);
            parameters.Add("p_role_name", request.RoleName);
            parameters.Add("p_description", request.Description);
            parameters.Add("p_is_cmd_equal", request.IsCmdEqual);
            var rows = await connection.ExecuteAsync(
                "sp_role_update",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> DeleteRoleAsync(int roleId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_role_id", roleId);

            var rows = await connection.ExecuteAsync(
                "sp_role_delete",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        #endregion

        #region Role Permission
        public async Task<int> CreatePermissionAsync(PermissionRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_module_name", request.ModuleName);
            parameters.Add("p_permission_name", request.PermissionName);
            parameters.Add("p_description", request.Description);

            return await connection.ExecuteScalarAsync<int>(
                "sp_permission_create",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<PermissionResponseDto>> GetPermissionsAsync()
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<PermissionResponseDto>(
                "sp_permission_list",
                commandType: CommandType.StoredProcedure);
        }

        public async Task<PermissionResponseDto?> GetPermissionByIdAsync(int permissionId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_permission_id", permissionId);

            return await connection.QueryFirstOrDefaultAsync<PermissionResponseDto>(
                "sp_permission_get_by_id",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdatePermissionAsync(int permissionId, PermissionRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_permission_id", permissionId);
            parameters.Add("p_module_name", request.ModuleName);
            parameters.Add("p_permission_name", request.PermissionName);
            parameters.Add("p_description", request.Description);

            var rows = await connection.ExecuteAsync(
                "sp_permission_update",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> DeletePermissionAsync(int permissionId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_permission_id", permissionId);

            var rows = await connection.ExecuteAsync(
                "sp_permission_delete",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> ToggleStatusAsync(int permissionId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_permission_id", permissionId);
            var rows = await connection.ExecuteAsync(
                "sp_permission_toggle_status",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        /// Role Permission Mapping
        public async Task<bool> AssignPermissionsAsync(RolePermissionRequestDto request)
        {
            using var connection = _context.CreateConnection();

            foreach (var permissionId in request.PermissionIds)
            {
                var parameters = new DynamicParameters();

                parameters.Add("p_role_id", request.RoleId);
                parameters.Add("p_permission_id", permissionId);

                await connection.ExecuteAsync(
                    "sp_role_permission_assign",
                    parameters,
                    commandType: CommandType.StoredProcedure);
            }

            return true;
        }
        public async Task<IEnumerable<RolePermissionResponseDto>> GetRolePermissionsAsync(int roleId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_role_id", roleId);

            return await connection.QueryAsync<RolePermissionResponseDto>(
                "sp_role_permission_list",
                parameters,
                commandType: CommandType.StoredProcedure);
        }
        public async Task<bool> RemovePermissionAsync(int roleId, int permissionId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();

            parameters.Add("p_role_id", roleId);
            parameters.Add("p_permission_id", permissionId);

            var rows = await connection.ExecuteAsync(
                "sp_role_permission_delete",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        #endregion

        #region Employee Management
        public async Task<int> CreateEmployeeAsync(EmployeeRequestDto request, string passwordHash, string photoPath)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();

            // Core details
            parameters.Add("p_emp_code", request.EmpCode?.Trim());
            parameters.Add("p_first_name", request.FirstName?.Trim());
            parameters.Add("p_last_name", request.LastName?.Trim());
            parameters.Add("p_father_husband_name", request.FatherHusbandName?.Trim());
            parameters.Add("p_gender", request.Gender?.Trim());
            parameters.Add("p_date_of_birth", request.DateOfBirth);
            parameters.Add("p_blood_group", request.BloodGroup?.Trim());
            parameters.Add("p_marital_status", request.MaritalStatus?.Trim());

            // Contact
            parameters.Add("p_personal_email", request.PersonalEmail?.Trim());
            parameters.Add("p_official_email", request.OfficialEmail?.Trim());
            parameters.Add("p_mobile", request.Mobile?.Trim());
            parameters.Add("p_alternate_mobile", request.AlternateMobile?.Trim());

            // Address
            parameters.Add("p_address_line1", request.AddressLine1?.Trim());
            parameters.Add("p_address_line2", request.AddressLine2?.Trim());
            parameters.Add("p_city", request.City?.Trim());
            parameters.Add("p_state", request.State?.Trim());
            parameters.Add("p_pincode", request.Pincode?.Trim());
            parameters.Add("p_country", request.Country?.Trim());

            // Identity Documents
            parameters.Add("p_aadhar_no", request.AadharNo?.Trim());
            parameters.Add("p_pan_no", request.PanNo?.Trim());
            parameters.Add("p_passport_no", request.PassportNo?.Trim());
            parameters.Add("p_uan_no", request.UanNo?.Trim());
            parameters.Add("p_esic_no", request.EsicNo?.Trim());

            // Org
            parameters.Add("p_dept_id", request.DeptId);
            parameters.Add("p_desig_id", request.DesigId);
            parameters.Add("p_reporting_manager", request.ReportingManager);
            parameters.Add("p_date_of_joining", request.DateOfJoining);
            parameters.Add("p_employment_type", request.EmploymentType?.Trim());
            parameters.Add("p_employment_status", request.EmploymentStatus?.Trim());
            parameters.Add("p_category", request.Category?.Trim());
            parameters.Add("p_current_ctc", request.CurrentCtc);

            // Photo
            parameters.Add("p_photo_path", photoPath?.Trim());

            // Lifecycle
            parameters.Add("p_probation_end_date", request.ProbationEndDate);
            parameters.Add("p_confirmation_date", request.ConfirmationDate);
            parameters.Add("p_resignation_date", request.ResignationDate);
            parameters.Add("p_last_working_date", request.LastWorkingDate);
            parameters.Add("p_exit_reason", request.ExitReason?.Trim());

            // Auth
            parameters.Add("p_username", request.Username?.Trim());
            parameters.Add("p_password_hash", passwordHash);
            parameters.Add("p_role_id", request.RoleId);

            return await connection.ExecuteScalarAsync<int>(
                "sp_employee_create",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateEmployeeAsync(int employeeId, EmployeeRequestDto request, string photoPath)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();

            parameters.Add("p_emp_id", employeeId);
            parameters.Add("p_emp_code", request.EmpCode?.Trim());
            parameters.Add("p_first_name", request.FirstName?.Trim());
            parameters.Add("p_last_name", request.LastName?.Trim());
            parameters.Add("p_father_husband_name", request.FatherHusbandName?.Trim());
            parameters.Add("p_gender", request.Gender?.Trim());
            parameters.Add("p_date_of_birth", request.DateOfBirth);
            parameters.Add("p_blood_group", request.BloodGroup?.Trim());
            parameters.Add("p_marital_status", request.MaritalStatus?.Trim());
            parameters.Add("p_personal_email", request.PersonalEmail?.Trim());
            parameters.Add("p_official_email", request.OfficialEmail?.Trim());
            parameters.Add("p_mobile", request.Mobile?.Trim());
            parameters.Add("p_alternate_mobile", request.AlternateMobile?.Trim());
            parameters.Add("p_address_line1", request.AddressLine1?.Trim());
            parameters.Add("p_address_line2", request.AddressLine2?.Trim());
            parameters.Add("p_city", request.City?.Trim());
            parameters.Add("p_state", request.State?.Trim());
            parameters.Add("p_pincode", request.Pincode?.Trim());
            parameters.Add("p_country", request.Country?.Trim());

            // Documents Mapping parameters execution
            parameters.Add("p_aadhar_no", request.AadharNo?.Trim());
            parameters.Add("p_pan_no", request.PanNo?.Trim());
            parameters.Add("p_passport_no", request.PassportNo?.Trim());
            parameters.Add("p_uan_no", request.UanNo?.Trim());
            parameters.Add("p_esic_no", request.EsicNo?.Trim());

            parameters.Add("p_dept_id", request.DeptId);
            parameters.Add("p_desig_id", request.DesigId);
            parameters.Add("p_reporting_manager", request.ReportingManager);
            parameters.Add("p_date_of_joining", request.DateOfJoining);
            parameters.Add("p_employment_type", request.EmploymentType?.Trim());
            parameters.Add("p_employment_status", request.EmploymentStatus?.Trim());
            parameters.Add("p_category", request.Category?.Trim());
            parameters.Add("p_current_ctc", request.CurrentCtc);
            parameters.Add("p_photo_path", photoPath?.Trim());
            parameters.Add("p_role_id", request.RoleId);

            // Lifecycle edits
            parameters.Add("p_probation_end_date", request.ProbationEndDate);
            parameters.Add("p_confirmation_date", request.ConfirmationDate);
            parameters.Add("p_resignation_date", request.ResignationDate);
            parameters.Add("p_last_working_date", request.LastWorkingDate);
            parameters.Add("p_exit_reason", request.ExitReason?.Trim());

            var affectedRows = await connection.ExecuteScalarAsync<int>(
                "sp_employee_update",
                parameters,
                commandType: CommandType.StoredProcedure);

            return affectedRows > 0;
        }

        public async Task<IEnumerable<EmployeeResponseDto>> GetAllEmployeesAsync(
            int? departmentId, int? roleId, string? status, int? designationId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_dept_id", departmentId);
            parameters.Add("p_role_id", roleId);
            parameters.Add("p_status", status);
            parameters.Add("p_desig_id", designationId);
            return await connection.QueryAsync<EmployeeResponseDto>(
                "sp_employee_list",
                parameters,
                commandType: CommandType.StoredProcedure);
        }
        public async Task<bool> EmailExistsAsync(string email)
        {
            using var connection = _context.CreateConnection();
            const string sql = "SELECT COUNT(1) FROM employees WHERE official_email = @Email";
            var count = await connection.ExecuteScalarAsync<int>(sql, new { Email = email });
            return count > 0;
        }

        public async Task<int> GetNextEmpCodeNumberAsync()
        {
            using var connection = _context.CreateConnection();
            const string sql = @"
            SELECT COALESCE(MAX(CAST(SUBSTRING(emp_code, 5) AS UNSIGNED)), 0) + 1 
            FROM employees 
            WHERE emp_code LIKE 'AKS-%'";
            return await connection.ExecuteScalarAsync<int>(sql);
        }

        public async Task<string> GenerateUniqueUsernameAsync(string baseUsername)
        {
            using var connection = _context.CreateConnection();
            string finalUsername = baseUsername;
            int counter = 1;

            while (true)
            {
                const string sql = "SELECT COUNT(1) FROM users WHERE username = @Username";
                var exists = await connection.ExecuteScalarAsync<int>(sql, new { Username = finalUsername }) > 0;
                if (!exists) break;

                finalUsername = $"{baseUsername}{counter}";
                counter++;
            }

            return finalUsername;
        }

        public async Task InitializeLeaveBalancesAsync(int empId, int year)
        {
            using var connection = _context.CreateConnection();
            const string sql = @"
            INSERT INTO leave_balances (emp_id, leave_type_id, year, total_leaves, used_leaves, balance_leaves)
            SELECT @EmpId, leave_type_id, @Year, max_per_year, 0, max_per_year
            FROM leave_types
            WHERE is_active = 1";

            await connection.ExecuteAsync(sql, new { EmpId = empId, Year = year });
        }


        public async Task<EmployeeResponseDto?> GetEmployeeByIdAsync(int employeeId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", employeeId);
            return await connection.QueryFirstOrDefaultAsync<EmployeeResponseDto>(
                "sp_employee_get_by_id",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> DeleteEmployeeAsync(int employeeId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", employeeId);

            var affectedRows = await connection.ExecuteScalarAsync<int>(
                "sp_employee_delete", parameters,
                commandType: CommandType.StoredProcedure);

            return affectedRows > 0;
        }

        public async Task<bool> ToggleEmployeeStatusAsync(int employeeId, string status)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", employeeId);
            parameters.Add("p_status", status);

            // ✅ ExecuteScalarAsync — SP ka SELECT AffectedRows read karega
            var affectedRows = await connection.ExecuteScalarAsync<int>(
                "sp_employee_toggle_status", parameters,
                commandType: CommandType.StoredProcedure);

            return affectedRows > 0;
        }

        public async Task<bool> EmpCodeExistsAsync(string empCode, int excludeEmpId)
        {
            using var connection = _context.CreateConnection();
            const string sql = "SELECT COUNT(1) FROM employees WHERE emp_code = @EmpCode AND emp_id != @ExcludeEmpId";
            var count = await connection.ExecuteScalarAsync<int>(sql, new { EmpCode = empCode, ExcludeEmpId = excludeEmpId });
            return count > 0;
        }

        #endregion

        #region Department Management

        public async Task<int> CreateDepartmentAsync(
            DepartmentRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_dept_name", request.DepartmentName);
            parameters.Add("p_dept_code", request.DepartmentCode);
            parameters.Add("p_parent_dept_id", request.ParentDepartmentId);

            return await connection.ExecuteScalarAsync<int>(
                "sp_department_create",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<DepartmentResponseDto>>
            GetDepartmentsAsync()
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<DepartmentResponseDto>(
                "sp_department_getall",
                commandType: CommandType.StoredProcedure);
        }

        public async Task<DepartmentResponseDto?> GetDepartmentByIdAsync(int deptId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_dept_id", deptId);

            return await connection.QueryFirstOrDefaultAsync<DepartmentResponseDto>(
                "sp_department_getbyid",  // ✅ underscore fix
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateDepartmentAsync(
            int deptId,
            DepartmentRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_dept_id", deptId);
            parameters.Add("p_dept_name", request.DepartmentName);
            parameters.Add("p_dept_code", request.DepartmentCode);
            parameters.Add("p_parent_dept_id", request.ParentDepartmentId);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_department_update",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> DeleteDepartmentAsync(int deptId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_dept_id", deptId);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_department_delete",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        #endregion

        #region Designation Management
        public async Task<int> CreateDesignationAsync(DesignationRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_desig_name", request.DesignationName);
            parameters.Add("p_desig_level", request.DesignationLevel);
            parameters.Add("p_dept_id", request.DeptId);

            return await connection.ExecuteScalarAsync<int>(
                "sp_designation_create",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<DesignationResponseDto>> GetDesignationsAsync()
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<DesignationResponseDto>(
                "sp_designation_getall",
                commandType: CommandType.StoredProcedure);
        }

        public async Task<DesignationResponseDto?> GetDesignationByIdAsync(int desigId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_desig_id", desigId);

            return await connection.QueryFirstOrDefaultAsync<DesignationResponseDto>(
                "sp_designation_getbyid",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateDesignationAsync(int desigId, DesignationRequestDto request)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_desig_id", desigId);
            parameters.Add("p_desig_name", request.DesignationName);
            parameters.Add("p_desig_level", request.DesignationLevel);
            parameters.Add("p_dept_id", request.DeptId);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_designation_update",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> DeleteDesignationAsync(int desigId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_desig_id", desigId);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_designation_delete",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        #endregion

        #region Page Master
        public async Task<IEnumerable<PageMasterResponseDto>> GetAllPagesAsync()
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<PageMasterResponseDto>(
                "sp_page_master_getall",
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<PageMasterResponseDto>> GetPagesByRoleAsync(int roleId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_role_id", roleId);
            return await connection.QueryAsync<PageMasterResponseDto>(
                "sp_role_pages_get",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<PageMasterResponseDto>> GetRolePageListAsync(int roleId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_role_id", roleId);
            return await connection.QueryAsync<PageMasterResponseDto>(
                "sp_role_page_list",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateRolePagesAsync(RolePageUpdateRequestDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_role_id", request.RoleId);
            parameters.Add("p_page_ids", request.PageIds);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_role_update_pages",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows >= 0;
        }
        public async Task<bool> AddPageAsync(PageMasterRequestDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_page_name", request.PageName);
            parameters.Add("p_page_link", request.PageLink);
            parameters.Add("p_page_icon", request.PageIcon);
            parameters.Add("p_page_type", request.PageType);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_page_master_insert",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }
        public async Task<bool> UpdatePageAsync(PageMasterUpdateRequestDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_page_id", request.PageId);
            parameters.Add("p_page_name", request.PageName);
            parameters.Add("p_page_link", request.PageLink);
            parameters.Add("p_page_icon", request.PageIcon);
            parameters.Add("p_page_type", request.PageType);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_page_master_update",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }
        public async Task<bool> DeletePageAsync(int pageId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_page_id", pageId);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_page_master_delete",
                parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        #endregion

        #region Attendance Management   
        public async Task<MarkAttendanceResultDto> MarkAttendanceAsync(AttendanceRequestDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", request.EmpId);
            parameters.Add("p_att_date", request.AttDate);
            parameters.Add("p_check_in", request.CheckIn);
            parameters.Add("p_check_out", request.CheckOut);
            parameters.Add("p_status", request.Status);
            parameters.Add("p_source", request.Source);
            parameters.Add("p_remarks", request.Remarks);
            parameters.Add("p_created_by", request.CreatedBy);
            parameters.Add("p_latitude", request.Latitude);
            parameters.Add("p_longitude", request.Longitude);
            parameters.Add("p_location_address", request.LocationAddress);
            parameters.Add("p_latitude", request.Latitude);
            parameters.Add("p_longitude", request.Longitude);
            parameters.Add("p_location_address", request.LocationAddress);
            parameters.Add("p_checkout_latitude", request.CheckOutLatitude);
            parameters.Add("p_checkout_longitude", request.CheckOutLongitude);
            parameters.Add("p_checkout_location_address", request.CheckOutLocationAddress);

            return await connection.QuerySingleAsync<MarkAttendanceResultDto>(
                "sp_attendance_mark", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<AttendanceResponseDto>> GetAttendanceByEmpAsync(
            int empId, DateTime? fromDate, DateTime? toDate)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_from_date", fromDate);
            parameters.Add("p_to_date", toDate);

            return await connection.QueryAsync<AttendanceResponseDto>(
                "sp_attendance_get_by_emp", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<AttendanceResponseDto>> GetAllAttendanceAsync(
            int? empId, DateTime? attDate, string? status, DateTime? fromDate, DateTime? toDate)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_att_date", attDate);
            parameters.Add("p_status", status);
            parameters.Add("p_from_date", fromDate);
            parameters.Add("p_to_date", toDate);

            return await connection.QueryAsync<AttendanceResponseDto>(
                "sp_attendance_get_all", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> CreateRegRequestAsync(AttendanceRegRequestDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", request.EmpId);
            parameters.Add("p_request_date", request.RequestDate);
            parameters.Add("p_reason", request.Reason);

            return await connection.ExecuteScalarAsync<int>(
                "sp_attendance_reg_create", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<AttendanceRegResponseDto>> GetAllRegRequestsAsync(
      int? empId, string? status, string? requestType)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_status", status);
            parameters.Add("p_request_type", requestType);

            return await connection.QueryAsync<AttendanceRegResponseDto>(
                "sp_attendance_reg_get_all", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> RegActionAsync(int requestId, string status, int approvedBy)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_request_id", requestId);
            parameters.Add("p_status", status);
            parameters.Add("p_approved_by", approvedBy);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_attendance_reg_action", parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<int> GenerateSummaryAsync(int empId, int month, int year)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);

            return await connection.ExecuteScalarAsync<int>(
                "sp_attendance_summary_generate", parameters,
                commandType: CommandType.StoredProcedure);
        }
        public async Task<string> GenerateAllSummariesAsync(int month, int year)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);

            return await connection.ExecuteScalarAsync<string?>(
            "sp_attendance_summary_generate_bulk", parameters,
            commandType: CommandType.StoredProcedure,
            commandTimeout: 120) ?? string.Empty;

            //return await connection.ExecuteScalarAsync<string>(
            //    "sp_attendance_summary_generate_bulk", parameters,
            //    commandType: CommandType.StoredProcedure,
            //    commandTimeout: 120);
        }

        public async Task<IEnumerable<AttendanceSummaryResponseDto>> GetSummaryAsync(
            int? empId, int? month, int? year)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);

            return await connection.QueryAsync<AttendanceSummaryResponseDto>(
                "sp_attendance_summary_get", parameters,
                commandType: CommandType.StoredProcedure);
        }
        #endregion

        #region Leave Types

        public async Task<int> CreateLeaveTypeAsync(LeaveTypeRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QueryFirstOrDefaultAsync<int>(
                "sp_leave_type_create",
                new
                {
                    p_leave_code = request.LeaveCode,
                    p_leave_name = request.LeaveName,
                    p_max_per_year = request.MaxPerYear,
                    p_carry_forward = request.CarryForward ? 1 : 0
                },
                commandType: System.Data.CommandType.StoredProcedure);
            return result;
        }

        public async Task<IEnumerable<LeaveTypeResponseDto>> GetAllLeaveTypesAsync()
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<LeaveTypeResponseDto>(
                "sp_leave_type_getall",
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<LeaveTypeResponseDto?> GetLeaveTypeByIdAsync(int id)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<LeaveTypeResponseDto>(
                "sp_leave_type_getbyid",
                new { p_id = id },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateLeaveTypeAsync(int id, LeaveTypeRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QueryFirstOrDefaultAsync<int>(
                "sp_leave_type_update",
                new
                {
                    p_id = id,
                    p_leave_code = request.LeaveCode,
                    p_leave_name = request.LeaveName,
                    p_max_per_year = request.MaxPerYear,
                    p_carry_forward = request.CarryForward ? 1 : 0,
                    p_is_active = request.IsActive ? 1 : 0
                },
                commandType: System.Data.CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<bool> DeleteLeaveTypeAsync(int id)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QueryFirstOrDefaultAsync<int>(
                "sp_leave_type_delete",
                new { p_id = id },
                commandType: System.Data.CommandType.StoredProcedure);
            return rows > 0;
        }

        //  Leave Balance

        public async Task<bool> InitializeBalanceAsync(int empId, int year)
        {
            using var conn = _context.CreateConnection();
            await conn.ExecuteAsync(
                "sp_leave_balance_initialize",
                new { p_emp_id = empId, p_year = year },
                commandType: System.Data.CommandType.StoredProcedure);
            return true;
        }

        public async Task<IEnumerable<LeaveBalanceResponseDto>> GetLeaveBalanceAsync(int empId, int year)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<LeaveBalanceResponseDto>(
                "sp_leave_balance_get",
                new { p_emp_id = empId, p_year = year },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<LeaveBalanceResponseDto>> GetAllLeaveBalancesAsync(int year)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<LeaveBalanceResponseDto>(
                "sp_leave_balance_getall",
                new { p_year = year },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        // Leave Requests

        public async Task<LeaveRequestResponseDto> CreateLeaveRequestAsync(LeaveRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QueryFirstOrDefaultAsync<LeaveRequestResponseDto>(
                "sp_leave_request_create",
                new
                {
                    p_emp_id = request.EmpId,
                    p_leave_type_id = request.LeaveTypeId,
                    p_from_date = request.FromDate.Date,
                    p_to_date = request.ToDate.Date,
                    p_total_days = request.TotalDays,
                    p_reason = request.Reason
                },
                commandType: System.Data.CommandType.StoredProcedure);

            return result ?? new LeaveRequestResponseDto { LeaveId = -1, ErrorMessage = "Failed to create request." };
        }

        public async Task<IEnumerable<LeaveRequestResponseDto>> GetAllLeaveRequestsAsync(
            int? empId, string? status, int? month, int? year)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<LeaveRequestResponseDto>(
                "sp_leave_request_getall",
                new
                {
                    p_emp_id = empId,
                    p_status = status,
                    p_month = month,
                    p_year = year
                },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<LeaveRequestResponseDto?> GetLeaveRequestByIdAsync(int leaveId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync<LeaveRequestResponseDto>(
                "sp_leave_request_getbyid",
                new { p_leave_id = leaveId },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        public async Task<bool> LeaveActionAsync(int leaveId, LeaveActionRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QueryFirstOrDefaultAsync<int>(
                "sp_leave_request_action",
                new
                {
                    p_leave_id = leaveId,
                    p_status = request.Status,
                    p_approved_by = request.ApprovedBy,
                    p_remarks = request.Remarks
                },
                commandType: System.Data.CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<IEnumerable<LeaveRequestResponseDto>> GetLeaveHistoryAsync(int empId, int? year)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<LeaveRequestResponseDto>(
                "sp_leave_history_get",
                new { p_emp_id = empId, p_year = year },
                commandType: System.Data.CommandType.StoredProcedure);
        }

        #endregion

        #region Salary Structure 
        public async Task<int> SetEmployeeSalaryAsync(EmployeeSalaryRequestDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", request.EmpId);
            parameters.Add("p_structure_id", request.StructureId);
            parameters.Add("p_epf_basic", request.EpfBasic);   // ✅ NEW
            parameters.Add("p_basic", request.Basic);
            parameters.Add("p_hra", request.Hra);
            parameters.Add("p_ta", request.Ta);
            parameters.Add("p_da", request.Da);
            parameters.Add("p_special_allow", request.SpecialAllow);
            parameters.Add("p_pf_employee", request.PfEmployee);
            parameters.Add("p_pf_employer", request.PfEmployer);
            parameters.Add("p_esic_employee", request.EsicEmployee);
            parameters.Add("p_esic_employer", request.EsicEmployer);
            parameters.Add("p_tds", request.Tds);
            parameters.Add("p_professional_tax", request.ProfessionalTax);
            parameters.Add("p_effective_from", request.EffectiveFrom);
            parameters.Add("p_created_by", request.CreatedBy);

            return await connection.ExecuteScalarAsync<int>(
                "sp_employee_salary_set", parameters,
                commandType: CommandType.StoredProcedure);
        }


        public async Task<EmployeeSalaryResponseDto?> GetEmployeeSalaryAsync(int empId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);

            return await connection.QueryFirstOrDefaultAsync<EmployeeSalaryResponseDto>(
                "sp_employee_salary_get", parameters,
                commandType: CommandType.StoredProcedure);
        }
        public async Task<int> GeneratePayrollAsync(int month, int year, int createdBy)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);
            parameters.Add("p_created_by", createdBy);

            return await connection.ExecuteScalarAsync<int>(
                "sp_payroll_generate", parameters,
                commandType: CommandType.StoredProcedure,
                commandTimeout: 120);
        }

        public async Task<IEnumerable<PayrollMonthResponseDto>> GetPayrollMonthsAsync()
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<PayrollMonthResponseDto>(
                "sp_payroll_months_get",
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<PayrollDetailResponseDto>> GetPayrollDetailsAsync(
    int month, int year, int? empId)
        {
            using var connection = _context.CreateConnection();

            var parameters = new DynamicParameters();
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);
            parameters.Add("p_emp_id", empId);

            var result = (await connection.QueryAsync<PayrollDetailResponseDto>(
                "sp_payroll_get",
                parameters,
                commandType: CommandType.StoredProcedure)).ToList();

            Console.WriteLine($"Rows Returned = {result.Count}");

            return result;
        }

        public async Task<int> FinalizePayrollAsync(int month, int year, int approvedBy)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);
            parameters.Add("p_approved_by", approvedBy);

            return await connection.ExecuteScalarAsync<int>(
                "sp_payroll_finalize", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> MarkPaidAsync(int month, int year)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_payroll_mark_paid", parameters,
                commandType: CommandType.StoredProcedure);

            return rows >= 0;
        }
        public async Task<PayslipResponseDto?> GetPayslipAsync(int empId, int month, int year)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);

            return await connection.QueryFirstOrDefaultAsync<PayslipResponseDto>(
                "sp_payslip_get", parameters,
                commandType: CommandType.StoredProcedure);
        }
        public async Task<int> AddDeductionAsync(SalaryDeductionRequestDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", request.EmpId);
            parameters.Add("p_month", request.Month);
            parameters.Add("p_year", request.Year);
            parameters.Add("p_deduction_type", request.DeductionType);
            parameters.Add("p_amount", request.Amount);
            parameters.Add("p_reason", request.Reason);
            parameters.Add("p_entry_date", request.EntryDate);
            parameters.Add("p_created_by", request.CreatedBy);

            return await connection.ExecuteScalarAsync<int>(
                "sp_salary_deduction_add", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> DeductionActionAsync(SalaryDeductionActionDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_deduction_id", request.DeductionId);
            parameters.Add("p_status", request.Status);
            parameters.Add("p_approved_by", request.ApprovedBy);
            parameters.Add("p_remarks", request.Remarks);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_salary_deduction_action", parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<IEnumerable<SalaryDeductionResponseDto>> GetDeductionsAsync(
            int? empId, int? month, int? year, string? status)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);
            parameters.Add("p_status", status);

            return await connection.QueryAsync<SalaryDeductionResponseDto>(
                "sp_salary_deductions_get", parameters,
                commandType: CommandType.StoredProcedure);
        }
        public async Task<IEnumerable<SalaryStructureResponseDto>> GetSalaryStructuresAsync()
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<SalaryStructureResponseDto>(
                "sp_salary_structures_get",
                commandType: CommandType.StoredProcedure);
        }
        public async Task<IEnumerable<EmployeeSalaryListResponseDto>> GetAllEmployeeSalariesAsync()
        {
            using var connection = _context.CreateConnection();

            return await connection.QueryAsync<EmployeeSalaryListResponseDto>(
                "sp_employee_salary_getall",
                commandType: CommandType.StoredProcedure);
        }
        #endregion

        #region Employee Loans

        public async Task<int> CreateLoanAsync(LoanRequestDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", request.EmpId);
            parameters.Add("p_loan_type", request.LoanType);
            parameters.Add("p_total_amount", request.TotalAmount);
            parameters.Add("p_emi_amount", request.EmiAmount);
            parameters.Add("p_loan_date", request.LoanDate);
            parameters.Add("p_remarks", request.Remarks);

            return await connection.ExecuteScalarAsync<int>(
                "sp_loan_create", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<LoanResponseDto>> GetLoansByEmpAsync(int empId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);

            return await connection.QueryAsync<LoanResponseDto>(
                "sp_loan_get_by_emp", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<LoanResponseDto>> GetAllLoansAsync(string? status)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_status", status);

            return await connection.QueryAsync<LoanResponseDto>(
                "sp_loan_get_all", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> LoanActionAsync(LoanActionDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_loan_id", request.LoanId);
            parameters.Add("p_status", request.Status);
            parameters.Add("p_approved_by", request.ApprovedBy);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_loan_action", parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        public async Task<bool> CloseLoanAsync(LoanCloseDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_loan_id", request.LoanId);
            parameters.Add("p_remarks", request.Remarks);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_loan_close", parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        #endregion

        #region Overtime Requests

        public async Task<int> CreateOvertimeAsync(OvertimeRequestDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", request.EmpId);
            parameters.Add("p_ot_date", request.OtDate);
            parameters.Add("p_ot_hours", request.OtHours);
            parameters.Add("p_reason", request.Reason);

            return await connection.ExecuteScalarAsync<int>(
                "sp_overtime_create", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<OvertimeResponseDto>> GetAllOvertimeAsync(
            int? empId, string? status, DateTime? fromDate, DateTime? toDate)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_emp_id", empId);
            parameters.Add("p_status", status);
            parameters.Add("p_from_date", fromDate);
            parameters.Add("p_to_date", toDate);

            return await connection.QueryAsync<OvertimeResponseDto>(
                "sp_overtime_get_all", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> OvertimeActionAsync(OvertimeActionDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_ot_id", request.OtId);
            parameters.Add("p_status", request.Status);
            parameters.Add("p_approved_by", request.ApprovedBy);

            var rows = await connection.ExecuteScalarAsync<int>(
                "sp_overtime_action", parameters,
                commandType: CommandType.StoredProcedure);

            return rows > 0;
        }

        #endregion

        #region Late Mark Rules

        public async Task<int> CreateLateMarkRuleAsync(LateMarkRuleRequestDto request)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_lates_count", request.LatesCount);
            parameters.Add("p_penalty_type", request.PenaltyType);

            return await connection.ExecuteScalarAsync<int>(
                "sp_late_mark_rule_create", parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<LateMarkRuleResponseDto?> GetActiveLateMarkRuleAsync()
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryFirstOrDefaultAsync<LateMarkRuleResponseDto>(
                "sp_late_mark_rule_get_active",
                commandType: CommandType.StoredProcedure);
        }

        public async Task<IEnumerable<LateMarkRuleResponseDto>> GetAllLateMarkRulesAsync()
        {
            using var connection = _context.CreateConnection();
            return await connection.QueryAsync<LateMarkRuleResponseDto>(
                "sp_late_mark_rule_get_all",
                commandType: CommandType.StoredProcedure);
        }

        #endregion

        #region Payroll Loan Integration

        public async Task<int> ApplyLoanEmiAsync(int month, int year)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_month", month);
            parameters.Add("p_year", year);

            return await connection.ExecuteScalarAsync<int>(
                "sp_loan_apply_emi", parameters,
                commandType: CommandType.StoredProcedure);
        }

        #endregion

        #region Job Requisition 
        public async Task<int> CreateRequisitionAsync(JobRequisitionRequestDto request)
        {
            using var conn = _context.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateJobRequisition",
                new
                {
                    p_Title = request.Title,
                    p_DepartmentId = request.DepartmentId,
                    p_DesignationId = request.DesignationId,
                    p_Vacancies = request.Vacancies,
                    p_ExperienceRequired = request.ExperienceRequired,
                    p_Description = request.Description,
                    p_RequestedBy = request.RequestedBy
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> ActionRequisitionAsync(JobRequisitionActionDto request)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.ExecuteAsync(
                "sp_ActionJobRequisition",
                new
                {
                    p_RequisitionId = request.RequisitionId,
                    p_Stage = request.Stage,
                    p_Status = request.Status,
                    p_Remarks = request.Remarks
                },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<IEnumerable<dynamic>> GetAllRequisitionsAsync(string? status)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync(
                "sp_GetAllJobRequisitions",
                new { p_Status = status },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<dynamic?> GetRequisitionByIdAsync(int id)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync(
                "sp_GetJobRequisitionById",
                new { p_Id = id },
                commandType: CommandType.StoredProcedure);
        }
        #endregion

        #region Job Posting 
        public async Task<int> CreateJobPostingAsync(JobPostingRequestDto request, string shareableLink)
        {
            using var conn = _context.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateJobPosting",
                new
                {
                    p_RequisitionId = request.RequisitionId,
                    p_Title = request.Title,
                    p_Location = request.Location,
                    p_EmploymentType = request.EmploymentType,
                    p_SalaryRange = request.SalaryRange,
                    p_ClosingDate = request.ClosingDate,
                    p_IsPublished = request.IsPublished,
                    p_ShareableLink = shareableLink,
                    p_CreatedBy = request.CreatedBy
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateJobPostingAsync(JobPostingUpdateRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.ExecuteAsync(
                "sp_UpdateJobPosting",
                new
                {
                    p_PostingId = request.PostingId,
                    p_Title = request.Title,
                    p_Description = request.Description,
                    p_Location = request.Location,
                    p_EmploymentType = request.EmploymentType,
                    p_SalaryRange = request.SalaryRange,
                    p_ClosingDate = request.ClosingDate,
                    p_IsPublished = request.IsPublished
                },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        public async Task<IEnumerable<dynamic>> GetAllJobPostingsAsync(bool? publishedOnly)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync(
                "sp_GetAllJobPostings",
                new { p_PublishedOnly = publishedOnly },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<dynamic?> GetJobPostingByIdAsync(int id)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync(
                "sp_GetJobPostingById",
                new { p_Id = id },
                commandType: CommandType.StoredProcedure);
        }

        // Recruitment Status Report
        public async Task<IEnumerable<RecruitmentStatusReportDto>> GetRecruitmentStatusReportAsync(
            DateTime? fromDate, DateTime? toDate)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync<RecruitmentStatusReportDto>(
                "sp_GetRecruitmentStatusReport",
                new { p_FromDate = fromDate, p_ToDate = toDate },
                commandType: CommandType.StoredProcedure);
        }

        #endregion

        #region Application System 
        public async Task<(int Id, string ApplicationCode)> CreateApplicationAsync(CandidateApplicationRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var applicationCode = $"APP-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

            var nameParts = request.Name.Trim().Split(' ', 2);
            var firstName = nameParts[0];
            var lastName = nameParts.Length > 1 ? nameParts[1] : "";

            decimal? experience = null;
            if (decimal.TryParse(request.Experience, out var parsedExp))
                experience = parsedExp;

            var id = await conn.ExecuteScalarAsync<int>(
                "sp_CreateApplication",
                new
                {
                    p_PostingId = request.JobPostingId,
                    p_ApplicationNo = applicationCode,
                    p_FirstName = firstName,
                    p_LastName = lastName,
                    p_Email = request.Email,
                    p_Phone = request.Phone,
                    p_TotalExperience = experience,
                    p_Skills = request.Skills,
                    p_CvPath = request.CvPath
                },
                commandType: CommandType.StoredProcedure);

            return (id, applicationCode);
        }

        public async Task MarkAcknowledgementSentAsync(int candidateId)
        {
            using var conn = _context.CreateConnection();
            await conn.ExecuteAsync(
                "sp_MarkAcknowledgementSent",
                new { p_CandidateId = candidateId },
                commandType: CommandType.StoredProcedure);
        }

        // ===================== D. Candidate Management =====================

        public async Task<IEnumerable<dynamic>> SearchCandidatesAsync(CandidateSearchRequestDto filter)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync(
                "sp_SearchCandidates",
                new
                {
                    p_PostingId = filter.JobPostingId,
                    p_Status = filter.Status
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<dynamic?> GetCandidateByIdAsync(int id)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync(
                "sp_GetCandidateById",
                new { p_Id = id },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> UpdateCandidateStatusAsync(CandidateStatusUpdateDto request)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.ExecuteAsync(
                "sp_UpdateCandidateStatus",
                new
                {
                    p_CandidateId = request.CandidateId,
                    p_Status = request.Status,
                    p_UpdatedBy = request.UpdatedBy,
                    p_Remarks = request.Remarks
                },
                commandType: CommandType.StoredProcedure);
            return rows > 0;
        }

        #endregion

        #region Interview Management 
        public async Task<int> ScheduleInterviewAsync(InterviewScheduleRequestDto request)
        {
            using var conn = _context.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(
                "sp_ScheduleInterview",
                new
                {
                    p_CandidateId = request.CandidateId,
                    p_ScheduledDate = request.ScheduledDate,
                    p_Mode = request.Mode,
                    p_Location = request.Location,
                    p_Interviewers = request.Interviewers,   // ✅ fixed
                    p_RoundNo = request.RoundNo
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> SubmitInterviewFeedbackAsync(InterviewFeedbackRequestDto request)
        {
            using var conn = _context.CreateConnection();
            var exists = await conn.QueryFirstOrDefaultAsync<int>(
                "SELECT COUNT(*) FROM interviews WHERE interview_id = @InterviewId",
                new { InterviewId = request.InterviewId });

            if (exists == 0) return false;
            await conn.ExecuteAsync(
                "sp_SubmitInterviewFeedback",
                new
                {
                    p_InterviewId = request.InterviewId,
                    p_Feedback = request.Feedback,
                    p_Rating = request.Rating,
                    p_Result = request.Result,
                    p_ApprovedBy = request.ApprovedBy
                },
                commandType: CommandType.StoredProcedure);

            return true;
        }

        public async Task<IEnumerable<dynamic>> GetInterviewsByCandidateAsync(int candidateId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryAsync(
                "sp_GetInterviewsByCandidate",
                new { p_CandidateId = candidateId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> SelectionApprovalAsync(InterviewSelectionApprovalDto request)
        {
            using var conn = _context.CreateConnection();
            var exists = await conn.ExecuteScalarAsync<int>(
                "sp_SelectionApproval",
                new
                {
                    p_CandidateId = request.CandidateId,
                    p_Status = request.Status,
                    p_ApprovedBy = request.ApprovedBy,
                    p_Remarks = request.Remarks
                },
                commandType: CommandType.StoredProcedure);
            return exists > 0;
        }

        #endregion

        #region  Offer & Joining 
        public async Task<int> CreateOfferAsync(OfferCreateRequestDto request)
        {
            using var conn = _context.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(
                "sp_CreateOffer",
                new
                {
                    p_CandidateId = request.CandidateId,
                    p_OfferedCtc = request.OfferedCtc,      // ✅ fixed
                    p_JoiningDate = request.JoiningDate,     // ✅ fixed
                    p_OfferExpiry = request.OfferExpiry,
                    p_ApprovedBy = request.ApprovedBy        // ✅ fixed
                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<bool> OfferActionAsync(OfferActionDto request)
        {
            using var conn = _context.CreateConnection();
            var rowsAffected = await conn.ExecuteScalarAsync<int>(
                "sp_OfferAction",
                new
                {
                    p_OfferId = request.OfferId,
                    p_Status = request.Status,
                    p_ApprovedBy = request.ApprovedBy,
                    p_Remarks = request.Remarks
                },
                commandType: CommandType.StoredProcedure);

            return rowsAffected > 0;
        }

        public async Task<dynamic?> GetOfferByCandidateAsync(int candidateId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync(
                "sp_GetOfferByCandidate",
                new { p_CandidateId = candidateId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> ConfirmJoiningAsync(JoiningConfirmationRequestDto request)
        {
            using var conn = _context.CreateConnection();

            return await conn.ExecuteScalarAsync<int>(
                "sp_ConfirmJoining",
                new
                {
                    p_CandidateId = request.CandidateId,
                    p_JoiningDate = request.ActualJoiningDate,

                },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<int> ConvertCandidateToEmployeeAsync(int candidateId, int offerId, string? employeeCode)
        {
            using var conn = _context.CreateConnection();
            return await conn.ExecuteScalarAsync<int>(
                "sp_ConvertCandidateToEmployee",
                new
                {
                    p_CandidateId = candidateId,
                    p_OfferId = offerId,
                    p_EmployeeCode = employeeCode
                },
                commandType: CommandType.StoredProcedure);
        }
        public async Task<CandidateJoiningDataDto?> GetCandidateJoiningDataAsync(int candidateId)
        {
            using var conn = _context.CreateConnection();
            var sql = @"
        SELECT
            c.first_name     AS FirstName,
            c.last_name      AS LastName,
            c.email          AS Email,
            c.mobile         AS Mobile,
            req.dept_id      AS DeptId,
            req.desig_id     AS DesigId,
            NULLIF(req.requested_by, 0) AS ReportingManager,
            ol.offered_ctc   AS OfferedCtc
        FROM candidates c
        JOIN job_postings jp ON jp.posting_id = c.posting_id
        JOIN job_requisitions req ON req.req_id = jp.req_id
        LEFT JOIN offer_letters ol ON ol.candidate_id = c.candidate_id
        WHERE c.candidate_id = @CandidateId
        ORDER BY ol.offer_id DESC
        LIMIT 1";

            return await conn.QueryFirstOrDefaultAsync<CandidateJoiningDataDto>(sql, new { CandidateId = candidateId });
        }

        public async Task<int?> GetEmployeeIdByCandidateIdAsync(int candidateId)
        {
            using var conn = _context.CreateConnection();
            return await conn.ExecuteScalarAsync<int?>(
                "SELECT emp_id FROM employees WHERE source_candidate_id = @CandidateId LIMIT 1",
                new { CandidateId = candidateId });
        }

        public async Task LinkEmployeeToCandidateAsync(int empId, int candidateId)
        {
            using var conn = _context.CreateConnection();
            await conn.ExecuteAsync(
                "UPDATE employees SET source_candidate_id = @CandidateId WHERE emp_id = @EmpId",
                new { CandidateId = candidateId, EmpId = empId });
        }

        public async Task MarkCandidateJoinedAsync(int candidateId)
        {
            using var conn = _context.CreateConnection();
            await conn.ExecuteAsync(
                "UPDATE candidates SET status = 'Joined' WHERE candidate_id = @CandidateId",
                new { CandidateId = candidateId });
        }
        #endregion

        #region Password
        public async Task<(string Username, int UserId)?> GetUserCredsInfoByEmpIdAsync(int empId)
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QueryFirstOrDefaultAsync(
                "SELECT username AS Username, user_id AS UserId FROM users WHERE employee_id = @EmpId",
                new { EmpId = empId });

            if (result == null) return null;
            return ((string)result.Username, (int)result.UserId);
        }

        public async Task UpdateUserPasswordAsync(int userId, string passwordHash)
        {
            using var conn = _context.CreateConnection();
            await conn.ExecuteAsync(
                "UPDATE users SET password_hash = @PasswordHash WHERE user_id = @UserId",
                new { PasswordHash = passwordHash, UserId = userId });
        }

        #endregion

        #region Issue offer latter and appointemt latter
        public async Task<dynamic?> GetCandidateLetterDataAsync(int candidateId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync(
                "sp_GetCandidateLetterData",
                new { p_CandidateId = candidateId },
                commandType: CommandType.StoredProcedure);
        }

        public async Task<dynamic?> GetEmployeeLetterDataByCandidateAsync(int candidateId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync(
                "sp_GetEmployeeLetterDataByCandidate",
                new { p_CandidateId = candidateId },
                commandType: CommandType.StoredProcedure);
        }
        public async Task<dynamic?> GetEmployeeLetterDataByEmployeeIdAsync(int employeeId)
        {
            using var conn = _context.CreateConnection();
            return await conn.QueryFirstOrDefaultAsync(
                "sp_GetEmployeeLetterDataByEmployeeId",
                new { p_EmployeeId = employeeId },
                commandType: CommandType.StoredProcedure);
        }

        #endregion

        #region Sunday work
        public async Task<List<EmployeeBasicDto>> GetActiveEmployeesBasicAsync()
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QueryAsync<EmployeeBasicDto>(
                "sp_GetActiveEmployeesBasic",
                commandType: CommandType.StoredProcedure);
            return result.ToList();
        }

        public async Task<List<SundayDutyRecord>> GetSundayDutyRecordsAsync(DateTime monthStart, DateTime monthEnd)
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QueryAsync<SundayDutyRecord>(
                "sp_GetSundayDutyRecords",
                new { p_MonthStart = monthStart.Date, p_MonthEnd = monthEnd.Date },
                commandType: CommandType.StoredProcedure);
            return result.ToList();
        }

        public async Task<List<SundayLedgerRecord>> GetSundayLedgerAsync(int month, int year)
        {
            using var conn = _context.CreateConnection();
            var result = await conn.QueryAsync<SundayLedgerRecord>(
                "sp_GetSundayLedger",
                new { p_Month = month, p_Year = year },
                commandType: CommandType.StoredProcedure);
            return result.ToList();
        }

      
        public async Task UpsertSundayDutyAsync(SundayDutyRequestDto request, int createdBy)
        {
            using var conn = _context.CreateConnection();
            await conn.ExecuteAsync(
                "sp_UpsertSundayDuty",
                new
                {
                    p_EmpId = request.EmpId,
                    p_DutyDate = request.DutyDate.Date,
                    p_Status = request.Status,
                    p_Location = request.Location,
                    p_CountsAsDuty = request.CountsAsDuty ? (byte)1 : (byte)0,
                    p_CreatedBy = createdBy
                },
                commandType: CommandType.StoredProcedure);
        }


        public async Task RecalculateLedgerAsync(int empId, int month, int year)
        {
            using var conn = _context.CreateConnection();
            await conn.ExecuteAsync(
                "sp_RecalculateSundayLedger",
                new { p_EmpId = empId, p_Month = month, p_Year = year },
                commandType: CommandType.StoredProcedure);
        }

        #endregion


    }
}