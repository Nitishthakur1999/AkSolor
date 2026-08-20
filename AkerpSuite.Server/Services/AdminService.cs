using AkerpSuite.Server.Constants;
using AkerpSuite.Server.Dtos.Auth;
using AkerpSuite.Server.DTOs.Hr;
using AkerpSuite.Server.DTOs.Role;
using AkerpSuite.Server.Helpers;
using AkerpSuite.Server.Reports;
using AkerpSuite.Server.Repositories;
using MySqlConnector;
using System.Globalization;
using System.Security.Claims;
using System.Security.Cryptography;

namespace AkerpSuite.Server.Services
{
    public class AdminService : IAdminService
    {
        private readonly IAdminRepositories _repository;
        private readonly FileUploadHelper _fileUploadHelper;
        private readonly IConfiguration _configuration;
        private readonly IHRService _hrService;
        private readonly IEmailService _emailService;
        private readonly DocxTemplateMergeService _letterMerge = new();
        private const string OfferTemplatePath = "Templates/Offer_Letter_Template.docx";
        private const string AppointmentTemplatePath = "Templates/Appointment_Letter_Template.docx";
        private const string RegularizationTemplatePath = "Templates/Regularization_of_Service_Template.docx";
        private const string RelievingTemplatePath = "Templates/Relieving_Letter_Template.docx";

        public AdminService(
            IAdminRepositories repository,
            FileUploadHelper fileUploadHelper,
            IConfiguration configuration,
            IHRService hrService,
            IEmailService emailService)
        {
            _repository = repository;
            _fileUploadHelper = fileUploadHelper;
            _configuration = configuration;
            _hrService = hrService;
            _emailService = emailService;
        }


        #region Cmd Dashboard
        public async Task<IEnumerable<DashboardCardDto>> GetDashboardAsync(int roleId)
            => await _repository.GetDashboardByRoleAsync(roleId);

        #endregion

        #region Role Management
        public async Task<RoleResponseDto> CreateRoleAsync(RoleRequestDto request)
        {
            var roleId = await _repository.CreateRoleAsync(request);

            // ✅ DB se fresh data fetch karo
            var createdRole = await _repository.GetRoleByIdAsync(roleId);

            if (createdRole == null)
                throw new InvalidOperationException("Role created but could not be retrieved.");

            return createdRole;
        }
        public async Task<IEnumerable<RoleResponseDto>> GetRolesAsync()
            => await _repository.GetRolesAsync();
        public async Task<RoleResponseDto?> GetRoleByIdAsync(int roleId)
            => await _repository.GetRoleByIdAsync(roleId);
        public async Task<bool> UpdateRoleAsync(int roleId, RoleRequestDto request)
        {
            var existingRoles = await _repository.GetRolesAsync();

            bool duplicateExists = existingRoles.Any(r =>
                r.RoleId != roleId &&
                string.Equals(r.RoleName, request.RoleName, StringComparison.OrdinalIgnoreCase));

            if (duplicateExists)
            {
                throw new InvalidOperationException(
                    $"A role named '{request.RoleName}' already exists.");
            }

            return await _repository.UpdateRoleAsync(roleId, request);
        }
        public async Task<bool> DeleteRoleAsync(int roleId)
            => await _repository.DeleteRoleAsync(roleId);

        #endregion

        #region Role Permission
        public async Task<PermissionResponseDto> CreatePermissionAsync(PermissionRequestDto request)
        {
            var existingPermissions = await _repository.GetPermissionsAsync();
            bool alreadyExists = existingPermissions.Any(p =>
                string.Equals(
                    p.PermissionName,
                    request.PermissionName,
                    StringComparison.OrdinalIgnoreCase));
            if (alreadyExists)
            {
                throw new InvalidOperationException(
                    $"A permission named '{request.PermissionName}' already exists.");
            }
            var permissionId = await _repository.CreatePermissionAsync(request);
            var createdPermission = await _repository.GetPermissionByIdAsync(permissionId);
            if (createdPermission == null)
            {
                throw new InvalidOperationException(
                    "Permission created but could not be retrieved.");
            }
            return createdPermission;
        }

        public Task<IEnumerable<PermissionResponseDto>> GetPermissionsAsync() =>
            _repository.GetPermissionsAsync();

        public Task<PermissionResponseDto?> GetPermissionByIdAsync(int permissionId) =>
            _repository.GetPermissionByIdAsync(permissionId);

        public async Task<bool> UpdatePermissionAsync(
            int permissionId,
            PermissionRequestDto request)
        {
            var existingPermissions = await _repository.GetPermissionsAsync();

            bool duplicateExists = existingPermissions.Any(p =>
                p.PermissionId != permissionId &&
                string.Equals(
                    p.PermissionName,
                    request.PermissionName,
                    StringComparison.OrdinalIgnoreCase));
            if (duplicateExists)
            {
                throw new InvalidOperationException(
                    $"A permission named '{request.PermissionName}' already exists.");
            }
            return await _repository.UpdatePermissionAsync(permissionId, request);
        }
        public Task<bool> DeletePermissionAsync(int permissionId) =>
            _repository.DeletePermissionAsync(permissionId);
        public Task<bool> ToggleStatusAsync(int permissionId) =>
            _repository.ToggleStatusAsync(permissionId);

        /// Role Permission Mapping ///

        public async Task<bool> AssignPermissionsAsync(RolePermissionRequestDto request)
        {
            if (request.RoleId <= 0)
            {
                throw new InvalidOperationException("Invalid Role Id.");
            }
            if (request.PermissionIds == null ||
                !request.PermissionIds.Any())
            {
                throw new InvalidOperationException(
                    "Please select at least one permission.");
            }
            return await _repository.AssignPermissionsAsync(request);
        }

        public Task<IEnumerable<RolePermissionResponseDto>> GetRolePermissionsAsync(int roleId)
            => _repository.GetRolePermissionsAsync(roleId);

        public Task<bool> RemovePermissionAsync(int roleId, int permissionId)
            => _repository.RemovePermissionAsync(roleId, permissionId);

        #endregion

        #region Employee Management            
        public async Task<EmployeeResponseDto> CreateEmployeeAsync(EmployeeRequestDto request, string creatorRole)
        {
            if (string.IsNullOrWhiteSpace(creatorRole))
                throw new UnauthorizedAccessException("Role claim is missing in the generated security token.");

            creatorRole = creatorRole.Trim();

            // ✅ NAYA ADD: Employment status default — form pe field nahi hai, khaali na rahe
            if (string.IsNullOrWhiteSpace(request.EmploymentStatus))
                request.EmploymentStatus = "Active";

            // ✅ NAYA ADD: Probation end date fallback — form pe optional hai
            // agar HR ne khaali chhoda to DateOfJoining + 3 months auto-set ho jaye
            if (!request.ProbationEndDate.HasValue)
                request.ProbationEndDate = request.DateOfJoining.AddMonths(1);

            // ✅ Target role ka naam DB se nikalo
            var targetRole = await _repository.GetRoleByIdAsync(request.RoleId);
            if (targetRole == null)
                throw new InvalidOperationException($"Invalid Role Id: {request.RoleId}.");

            // ✅ Rule 1: CMD kisi ko bhi assign nahi ho sakta
            if (string.Equals(targetRole.RoleName, Roles.CMD, StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException("CMD role cannot be assigned to any employee.");

            // ✅ Rule 2: Apna level ya usse neeche hi allowed
            if (!Roles.CanView(creatorRole, targetRole.RoleName))
                throw new UnauthorizedAccessException(
                    $"Logged in role '{creatorRole}' is not allowed to create a user with role '{targetRole.RoleName}'.");

            //// ✅ Fix 3: Targeted check, poora table fetch nahi
            //if (await _repository.EmailExistsAsync(request.OfficialEmail))
            //    throw new InvalidOperationException($"Email '{request.OfficialEmail}' is already registered.");

            // ✅ Fix 1: Atomic-ish next number DB se
            int nextNumber = await _repository.GetNextEmpCodeNumberAsync();
            request.EmpCode = $"AKS-{nextNumber:D3}";

            // Username generation (isko bhi DB check se optimize kar sakte ho, filhaal simple rakha)
            string baseUsername = $"{request.FirstName.ToLower().Trim()}.{request.LastName.ToLower().Trim()}".Replace(" ", "");
            request.Username = await _repository.GenerateUniqueUsernameAsync(baseUsername);

            // ✅ Fix 2: Secure random password
            string plainPassword = GenerateSecureTempPassword();
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(plainPassword);

            string savedPhotoPath = string.Empty;
            if (!string.IsNullOrWhiteSpace(request.PhotoBase64))
            {
                string ext = !string.IsNullOrWhiteSpace(request.PhotoExtension) ? request.PhotoExtension : ".jpg";
                var resultPath = await _fileUploadHelper.SaveBase64FileAsync(request.PhotoBase64, ext, "employee-profile");
                savedPhotoPath = resultPath != null ? $"/{resultPath}" : string.Empty;
            }

            int empId;
            int attempt = 0;
            const int maxAttempts = 5;

            while (true)
            {
                try
                {
                    empId = await _repository.CreateEmployeeAsync(request, passwordHash, savedPhotoPath);
                    break;
                }
                catch (MySqlException ex) when (ex.Number == 1062)
                {
                    attempt++;
                    if (attempt >= maxAttempts)
                        throw new InvalidOperationException("Failed to generate a unique employee code after multiple attempts.");

                    nextNumber++;
                    request.EmpCode = $"AKS-{nextNumber:D3}";
                }
            }


            // ✅ NEW: Leave balances auto-initialize
            await _repository.InitializeLeaveBalancesAsync(empId, request.DateOfJoining.Year);

            // ✅ NAYA ADD: Company hierarchy sync — reporting manager set hai to org-chart me turant reflect ho
            if (request.ReportingManager.HasValue)
            {
                await _hrService.SetHierarchyAsync(new SetHierarchyRequestDto
                {
                    EmpId = empId,
                    ParentEmpId = request.ReportingManager.Value
                });
            }

            var created = await _repository.GetEmployeeByIdAsync(empId);
            if (created == null)
                throw new InvalidOperationException("Failed to load freshly registered record configuration pipelines.");

            created.GeneratedUsername = request.Username;
            created.GeneratedPassword = plainPassword;

            return created;
        }
        private static string GenerateSecureTempPassword()
        {
            const string validChars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
            var bytes = new byte[10];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return new string(bytes.Select(b => validChars[b % validChars.Length]).ToArray());
        }

        public async Task<bool> UpdateEmployeeAsync(int employeeId, EmployeeRequestDto request, string currentPhotoPath)
        {
            var employee = await _repository.GetEmployeeByIdAsync(employeeId);
            if (employee == null)
                throw new InvalidOperationException("Employee record target not identified.");

            // ✅ NEW: EmpCode duplicate check (khud ko chhod ke)
            if (!string.IsNullOrWhiteSpace(request.EmpCode) &&
                await _repository.EmpCodeExistsAsync(request.EmpCode, employeeId))
                throw new InvalidOperationException($"Employee code '{request.EmpCode}' already in use.");

            // ✅ FIX: Purane request.Photo ki jagah naya Base64 logic laga diya hai
            string updatedPhotoPath = currentPhotoPath;

            if (!string.IsNullOrWhiteSpace(request.PhotoBase64))
            {
                string ext = !string.IsNullOrWhiteSpace(request.PhotoExtension) ? request.PhotoExtension : ".jpg";
                var resultPath = await _fileUploadHelper.SaveBase64FileAsync(request.PhotoBase64, ext, "employee-profile");
                updatedPhotoPath = resultPath != null ? $"/{resultPath}" : currentPhotoPath;
            }

            return await _repository.UpdateEmployeeAsync(employeeId, request, updatedPhotoPath);
        }

        public async Task<IEnumerable<EmployeeResponseDto>> GetAllEmployeesAsync(
             int? departmentId, int? roleId, string? status, int? designationId, string viewerRole)
        {
            var employees = await _repository.GetAllEmployeesAsync(departmentId, roleId, status, designationId);

            // RoleId -> RoleName lookup ek baar banao
            var allRoles = await _repository.GetRolesAsync();
            var roleNameById = allRoles.ToDictionary(r => r.RoleId, r => r.RoleName);

            return employees.Where(e =>
            {
                if (e.RoleId == null)
                    return false; // role hi assign nahi, safe-side hide karo

                if (!roleNameById.TryGetValue(e.RoleId.Value, out var empRoleName))
                    return false; // unknown role, safe-side hide karo

                if (string.Equals(empRoleName, Roles.CMD, StringComparison.OrdinalIgnoreCase))
                    return false; // CMD kisi ko dikhna hi nahi chahiye, viewer chahe koi bhi ho

                return Roles.CanView(viewerRole, empRoleName);
            });
        }

        public async Task<EmployeeResponseDto?> GetEmployeeByIdAsync(int employeeId)
            => await _repository.GetEmployeeByIdAsync(employeeId);

        public async Task<bool> DeleteEmployeeAsync(int employeeId)
        {
            var employee = await _repository.GetEmployeeByIdAsync(employeeId);
            if (employee == null)
                return false;

            return await _repository.DeleteEmployeeAsync(employeeId);
        }

        public async Task<bool> ToggleEmployeeStatusAsync(int employeeId, string status)
        {
            var validStatuses = new[] { "Active", "Inactive", "Resigned", "Terminated", "On Leave" };
            if (!validStatuses.Contains(status))
                throw new InvalidOperationException($"Invalid status '{status}'.");

            var employee = await _repository.GetEmployeeByIdAsync(employeeId);
            if (employee == null)
                throw new InvalidOperationException("Employee not found.");

            return await _repository.ToggleEmployeeStatusAsync(employeeId, status);
        }

        #endregion

        #region Department Management

        public async Task<DepartmentResponseDto> CreateDepartmentAsync(
            DepartmentRequestDto request)
        {
            var existingDepartments = await _repository.GetDepartmentsAsync();

            bool duplicateName = existingDepartments.Any(d =>
                string.Equals(
                    d.DepartmentName,
                    request.DepartmentName,
                    StringComparison.OrdinalIgnoreCase));

            if (duplicateName)
            {
                throw new InvalidOperationException(
                    $"Department '{request.DepartmentName}' already exists.");
            }

            bool duplicateCode = existingDepartments.Any(d =>
                string.Equals(
                    d.DepartmentCode,
                    request.DepartmentCode,
                    StringComparison.OrdinalIgnoreCase));

            if (duplicateCode)
            {
                throw new InvalidOperationException(
                    $"Department code '{request.DepartmentCode}' already exists.");
            }

            var deptId = await _repository.CreateDepartmentAsync(request);

            var createdDepartment =
                await _repository.GetDepartmentByIdAsync(deptId);

            if (createdDepartment == null)
            {
                throw new InvalidOperationException(
                    "Department created but could not be retrieved.");
            }

            return createdDepartment;
        }

        public async Task<IEnumerable<DepartmentResponseDto>> GetDepartmentsAsync()
            => await _repository.GetDepartmentsAsync();

        public async Task<DepartmentResponseDto?> GetDepartmentByIdAsync(int deptId)
          => await _repository.GetDepartmentByIdAsync(deptId);

        public async Task<bool> UpdateDepartmentAsync(int deptId, DepartmentRequestDto request)
        {
            var departments =
                await _repository.GetDepartmentsAsync();

            bool duplicateName = departments.Any(d =>
                d.DeptId != deptId &&
                string.Equals(
                    d.DepartmentName,
                    request.DepartmentName,
                    StringComparison.OrdinalIgnoreCase));

            if (duplicateName)
            {
                throw new InvalidOperationException(
                    $"Department '{request.DepartmentName}' already exists.");
            }

            bool duplicateCode = departments.Any(d =>
                d.DeptId != deptId &&
                string.Equals(
                    d.DepartmentCode,
                    request.DepartmentCode,
                    StringComparison.OrdinalIgnoreCase));

            if (duplicateCode)
            {
                throw new InvalidOperationException(
                    $"Department code '{request.DepartmentCode}' already exists.");
            }

            return await _repository.UpdateDepartmentAsync(
                deptId,
                request);
        }
        public async Task<bool> DeleteDepartmentAsync(int deptId)
            => await _repository.DeleteDepartmentAsync(deptId);

        #endregion

        #region Designation Management
        public async Task<DesignationResponseDto> CreateDesignationAsync(DesignationRequestDto request)
        {
            var existing = await _repository.GetDesignationsAsync();

            bool duplicateName = existing.Any(d =>
                string.Equals(d.DesignationName, request.DesignationName,
                    StringComparison.OrdinalIgnoreCase));

            if (duplicateName)
                throw new InvalidOperationException(
                    $"Designation '{request.DesignationName}' already exists.");

            var desigId = await _repository.CreateDesignationAsync(request);

            var created = await _repository.GetDesignationByIdAsync(desigId);

            if (created == null)
                throw new InvalidOperationException(
                    "Designation created but could not be retrieved.");

            return created;
        }

        public async Task<IEnumerable<DesignationResponseDto>> GetDesignationsAsync()
            => await _repository.GetDesignationsAsync();

        public async Task<DesignationResponseDto?> GetDesignationByIdAsync(int desigId)
            => await _repository.GetDesignationByIdAsync(desigId);

        public async Task<bool> UpdateDesignationAsync(int desigId, DesignationRequestDto request)
        {
            var existing = await _repository.GetDesignationsAsync();

            bool duplicateName = existing.Any(d =>
                d.DesigId != desigId &&
                d.DeptId == request.DeptId &&
                string.Equals(d.DesignationName, request.DesignationName,
                    StringComparison.OrdinalIgnoreCase));

            if (duplicateName)
                throw new InvalidOperationException(
                    $"Designation '{request.DesignationName}' already exists in this department.");

            return await _repository.UpdateDesignationAsync(desigId, request);
        }

        public async Task<bool> DeleteDesignationAsync(int desigId)
            => await _repository.DeleteDesignationAsync(desigId);

        #endregion

        #region Page Master
        public async Task<bool> AddPageAsync(PageMasterRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.PageName))
                throw new InvalidOperationException("Page name is required.");

            if (string.IsNullOrWhiteSpace(request.PageLink))
                throw new InvalidOperationException("Page link is required.");

            return await _repository.AddPageAsync(request);
        }
        public async Task<bool> UpdatePageAsync(PageMasterUpdateRequestDto request)
        {
            if (request.PageId <= 0)
                throw new InvalidOperationException("Invalid Page Id.");

            if (string.IsNullOrWhiteSpace(request.PageName))
                throw new InvalidOperationException("Page name is required.");

            if (string.IsNullOrWhiteSpace(request.PageLink))
                throw new InvalidOperationException("Page link is required.");

            return await _repository.UpdatePageAsync(request);
        }
        public async Task<bool> DeletePageAsync(int pageId)
        {
            if (pageId <= 0)
                throw new InvalidOperationException("Invalid Page Id.");

            return await _repository.DeletePageAsync(pageId);
        }
        public async Task<IEnumerable<PageMasterResponseDto>> GetAllPagesAsync()
            => await _repository.GetAllPagesAsync();

        public async Task<IEnumerable<PageMasterResponseDto>> GetPagesByRoleAsync(int roleId)
            => await _repository.GetPagesByRoleAsync(roleId);

        public async Task<IEnumerable<PageMasterResponseDto>> GetRolePageListAsync(int roleId)
            => await _repository.GetRolePageListAsync(roleId);

        public async Task<bool> UpdateRolePagesAsync(RolePageUpdateRequestDto request)
        {
            if (request.RoleId <= 0)
                throw new InvalidOperationException("Invalid Role Id.");

            if (string.IsNullOrWhiteSpace(request.PageIds))
                throw new InvalidOperationException("Please select at least one page.");

            return await _repository.UpdateRolePagesAsync(request);
        }

        #endregion

        #region Attendance Management
        public async Task<MarkAttendanceResultDto> MarkAttendanceAsync(AttendanceRequestDto request)
        {
            var validStatuses = new[] { "Present", "Absent", "Half-Day", "Holiday", "WeekOff", "Leave" };
            if (!validStatuses.Contains(request.Status))
                throw new InvalidOperationException($"Invalid status '{request.Status}'.");

            var validSources = new[] { "Manual", "Biometric", "System" };
            if (!validSources.Contains(request.Source))
                throw new InvalidOperationException($"Invalid source '{request.Source}'.");

            // ✅ String comparison ke liye TimeSpan.Parse use karo
            if (!string.IsNullOrEmpty(request.CheckIn) && !string.IsNullOrEmpty(request.CheckOut)
                && TimeSpan.Parse(request.CheckOut) < TimeSpan.Parse(request.CheckIn))
                throw new InvalidOperationException("Check-out time cannot be before check-in time.");

            return await _repository.MarkAttendanceAsync(request);
        }

        public async Task<IEnumerable<AttendanceResponseDto>> GetAttendanceByEmpAsync(
            int empId, DateTime? fromDate, DateTime? toDate)
            => await _repository.GetAttendanceByEmpAsync(empId, fromDate, toDate);

        public async Task<IEnumerable<AttendanceResponseDto>> GetAllAttendanceAsync(
            int? empId, DateTime? attDate, string? status, DateTime? fromDate, DateTime? toDate)
            => await _repository.GetAllAttendanceAsync(empId, attDate, status, fromDate, toDate);

        public async Task<int> CreateRegRequestAsync(AttendanceRegRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
                throw new InvalidOperationException("Reason is required for regularization request.");

            return await _repository.CreateRegRequestAsync(request);
        }

        public async Task<IEnumerable<AttendanceRegResponseDto>> GetAllRegRequestsAsync(
    int? empId, string? status, string? requestType)
        {
            var validTypes = new[] { "Regularization", "Late" };
            if (!string.IsNullOrEmpty(requestType) && !validTypes.Contains(requestType))
                throw new InvalidOperationException($"Invalid request type '{requestType}'. Use Regularization or Late.");

            var validStatuses = new[] { "Pending", "Approved", "Rejected" };
            if (!string.IsNullOrEmpty(status) && !validStatuses.Contains(status))
                throw new InvalidOperationException($"Invalid status '{status}'.");

            return await _repository.GetAllRegRequestsAsync(empId, status, requestType);
        }

        public async Task<bool> RegActionAsync(int requestId, string status, int approvedBy)
        {
            var validStatuses = new[] { "Approved", "Rejected" };
            if (!validStatuses.Contains(status))
                throw new InvalidOperationException($"Invalid action '{status}'. Use Approved or Rejected.");

            var result = await _repository.RegActionAsync(requestId, status, approvedBy);
            if (!result)
                throw new InvalidOperationException("Request not found or already processed.");

            return result;
        }

        public async Task<int> GenerateSummaryAsync(int empId, int month, int year)
        {
            if (month < 1 || month > 12)
                throw new InvalidOperationException("Invalid month. Must be between 1 and 12.");

            if (year < 2000 || year > DateTime.Now.Year)
                throw new InvalidOperationException("Invalid year.");

            return await _repository.GenerateSummaryAsync(empId, month, year);
        }

        public async Task<IEnumerable<AttendanceSummaryResponseDto>> GetSummaryAsync(
            int? empId, int? month, int? year)
            => await _repository.GetSummaryAsync(empId, month, year);

        public async Task<AttendanceDashboardStatsDto> GetAttendanceDashboardStatsAsync()
        {
            var today = DateTime.Today;

            var employees = await _repository.GetAllEmployeesAsync(null, null, "Active", null);
            int totalEmployees = employees.Count();

            var todaysAttendance = await _repository.GetAllAttendanceAsync(null, today, null, null, null);
            var attendanceList = todaysAttendance.ToList();

            int presentToday = attendanceList.Count(a => a.Status == "Present" || a.Status == "Half-Day");
            int absentToday = Math.Max(totalEmployees - presentToday, 0);
            int lateArrivals = attendanceList.Count(a => a.LateMinutes > 0);

            return new AttendanceDashboardStatsDto
            {
                TotalEmployees = totalEmployees,
                PresentToday = presentToday,
                AbsentToday = absentToday,
                LateArrivals = lateArrivals
            };
        }
        #endregion

        #region Leave Types
        public async Task<LeaveTypeResponseDto> CreateLeaveTypeAsync(LeaveTypeRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.LeaveCode))
                throw new InvalidOperationException("Leave code is required.");

            if (string.IsNullOrWhiteSpace(request.LeaveName))
                throw new InvalidOperationException("Leave name is required.");

            if (request.MaxPerYear <= 0)
                throw new InvalidOperationException("Max leaves per year must be greater than 0.");

            // Duplicate check
            var existing = await _repository.GetAllLeaveTypesAsync();
            if (existing.Any(l => string.Equals(l.LeaveCode, request.LeaveCode, StringComparison.OrdinalIgnoreCase)))
                throw new InvalidOperationException($"Leave type with code '{request.LeaveCode}' already exists.");

            var id = await _repository.CreateLeaveTypeAsync(request);
            var created = await _repository.GetLeaveTypeByIdAsync(id);

            if (created == null)
                throw new InvalidOperationException("Leave type created but could not be retrieved.");

            return created;
        }

        public async Task<IEnumerable<LeaveTypeResponseDto>> GetAllLeaveTypesAsync()
            => await _repository.GetAllLeaveTypesAsync();

        public async Task<LeaveTypeResponseDto?> GetLeaveTypeByIdAsync(int id)
            => await _repository.GetLeaveTypeByIdAsync(id);

        public async Task<bool> UpdateLeaveTypeAsync(int id, LeaveTypeRequestDto request)
        {
            var existing = await _repository.GetLeaveTypeByIdAsync(id);
            if (existing == null)
                throw new InvalidOperationException("Leave type not found.");

            // Duplicate code check (exclude self)
            var all = await _repository.GetAllLeaveTypesAsync();
            if (all.Any(l => l.LeaveTypeId != id &&
                string.Equals(l.LeaveCode, request.LeaveCode, StringComparison.OrdinalIgnoreCase)))
                throw new InvalidOperationException($"Leave code '{request.LeaveCode}' already exists.");

            return await _repository.UpdateLeaveTypeAsync(id, request);
        }
        public async Task<bool> DeleteLeaveTypeAsync(int id)
        {
            var existing = await _repository.GetLeaveTypeByIdAsync(id);
            if (existing == null)
                return false;

            return await _repository.DeleteLeaveTypeAsync(id);
        }

        // Leave Balance

        public async Task<bool> InitializeBalanceAsync(int empId, int year)
        {
            if (empId <= 0)
                throw new InvalidOperationException("Invalid employee ID.");

            if (year < 2000 || year > DateTime.Now.Year + 1)
                throw new InvalidOperationException("Invalid year.");

            return await _repository.InitializeBalanceAsync(empId, year);
        }

        public async Task<IEnumerable<LeaveBalanceResponseDto>> GetLeaveBalanceAsync(int empId, int year)
            => await _repository.GetLeaveBalanceAsync(empId, year);

        public async Task<IEnumerable<LeaveBalanceResponseDto>> GetAllLeaveBalancesAsync(int year)
            => await _repository.GetAllLeaveBalancesAsync(year);

        // Leave Requests

        public async Task<LeaveRequestResponseDto> CreateLeaveRequestAsync(LeaveRequestDto request)
        {
            if (request.FromDate.Date > request.ToDate.Date)
                throw new InvalidOperationException("From date cannot be after To date.");

            if (request.FromDate.Date < DateTime.Today)
                throw new InvalidOperationException("Cannot apply leave for past dates.");

            if (request.TotalDays <= 0)
                throw new InvalidOperationException("Total days must be greater than 0.");

            if (string.IsNullOrWhiteSpace(request.Reason))
                throw new InvalidOperationException("Reason is required.");

            var result = await _repository.CreateLeaveRequestAsync(request);

            // SP returns -1 or -2 for balance errors
            if (result.LeaveId < 0)
                throw new InvalidOperationException(result.ErrorMessage ?? "Failed to submit leave request.");

            return result;
        }

        public async Task<IEnumerable<LeaveRequestResponseDto>> GetAllLeaveRequestsAsync(
            int? empId, string? status, int? month, int? year)
            => await _repository.GetAllLeaveRequestsAsync(empId, status, month, year);

        public async Task<LeaveRequestResponseDto?> GetLeaveRequestByIdAsync(int leaveId)
            => await _repository.GetLeaveRequestByIdAsync(leaveId);

        public async Task<bool> LeaveActionAsync(int leaveId, LeaveActionRequestDto request)
        {
            var validStatuses = new[] { "Approved", "Rejected", "Cancelled" };
            if (!validStatuses.Contains(request.Status))
                throw new InvalidOperationException($"Invalid status '{request.Status}'. Use Approved, Rejected, or Cancelled.");

            var leave = await _repository.GetLeaveRequestByIdAsync(leaveId);
            if (leave == null)
                throw new InvalidOperationException("Leave request not found.");

            if (leave.Status != "Pending" && request.Status != "Cancelled")
                throw new InvalidOperationException($"Leave request is already {leave.Status}.");

            if (request.ApprovedBy <= 0)
                throw new InvalidOperationException("Approver ID is required.");

            return await _repository.LeaveActionAsync(leaveId, request);
        }

        public async Task<IEnumerable<LeaveRequestResponseDto>> GetLeaveHistoryAsync(int empId, int? year)
            => await _repository.GetLeaveHistoryAsync(empId, year);

        #endregion

        #region Salary Structure 
        public async Task<int> SetEmployeeSalaryAsync(EmployeeSalaryRequestDto request)
        {
            if (request.EmpId <= 0)
                throw new InvalidOperationException("Invalid Employee ID.");

            if (request.Basic <= 0)
                throw new InvalidOperationException("Basic salary must be greater than 0.");

            if (request.EffectiveFrom == default)
                throw new InvalidOperationException("Effective from date is required.");

            return await _repository.SetEmployeeSalaryAsync(request);
        }

        public async Task<EmployeeSalaryResponseDto?> GetEmployeeSalaryAsync(int empId)
        {
            if (empId <= 0)
                throw new InvalidOperationException("Invalid Employee ID.");

            return await _repository.GetEmployeeSalaryAsync(empId);
        }

        // ── Payroll ───────────────────────────────────────────

        public async Task<int> GeneratePayrollAsync(PayrollGenerateRequestDto request)
        {
            if (request.Month < 1 || request.Month > 12)
                throw new InvalidOperationException("Invalid month.");

            if (request.Year < 2020 || request.Year > DateTime.Now.Year)
                throw new InvalidOperationException("Invalid year.");

            // ✅ Safety: ensure attendance summaries exist for ALL active employees before payroll runs
            await _repository.GenerateAllSummariesAsync(request.Month, request.Year);

            return await _repository.GeneratePayrollAsync(request.Month, request.Year, request.CreatedBy);
        }

        public async Task<IEnumerable<PayrollMonthResponseDto>> GetPayrollMonthsAsync()
            => await _repository.GetPayrollMonthsAsync();

        public async Task<IEnumerable<PayrollDetailResponseDto>> GetPayrollDetailsAsync(
            int month, int year, int? empId)
        {
            if (month < 1 || month > 12)
                throw new InvalidOperationException("Invalid month.");

            return await _repository.GetPayrollDetailsAsync(month, year, empId);
        }

        public async Task<int> FinalizePayrollAsync(PayrollFinalizeRequestDto request)
        {
            if (request.Month < 1 || request.Month > 12)
                throw new InvalidOperationException("Invalid month.");

            if (request.ApprovedBy <= 0)
                throw new InvalidOperationException("Approver ID is required.");

            var count = await _repository.FinalizePayrollAsync(request.Month, request.Year, request.ApprovedBy);

            await _repository.ApplyLoanEmiAsync(request.Month, request.Year);

            return count;
        }

        public async Task<bool> MarkPaidAsync(int month, int year)
        {
            if (month < 1 || month > 12)
                throw new InvalidOperationException("Invalid month.");

            return await _repository.MarkPaidAsync(month, year);
        }

        // ── Payslip ───────────────────────────────────────────
        public async Task<PayslipResponseDto?> GetPayslipAsync(int empId, int month, int year)
        {
            if (empId <= 0)
                throw new InvalidOperationException("Invalid Employee ID.");

            if (month < 1 || month > 12)
                throw new InvalidOperationException("Invalid month.");

            return await _repository.GetPayslipAsync(empId, month, year);
        }

        // ── Salary Deductions ─────────────────────────────────
        public async Task<int> AddDeductionAsync(SalaryDeductionRequestDto request)
        {
            if (request.EmpId <= 0)
                throw new InvalidOperationException("Invalid Employee ID.");

            if (request.Amount <= 0)
                throw new InvalidOperationException("Amount must be greater than 0.");

            if (string.IsNullOrWhiteSpace(request.Reason))
                throw new InvalidOperationException("Reason is required.");

            var validTypes = new[]
            {
                "UniformViolation", "IDCardMissing", "Damage",
                "AssetLoss", "Fine", "Disciplinary", "AdvanceAdjustment", "Other"
            };

            if (!validTypes.Contains(request.DeductionType))
                throw new InvalidOperationException($"Invalid deduction type '{request.DeductionType}'.");

            return await _repository.AddDeductionAsync(request);
        }

        public async Task<bool> DeductionActionAsync(SalaryDeductionActionDto request)
        {
            var validStatuses = new[] { "Approved", "Rejected" };
            if (!validStatuses.Contains(request.Status))
                throw new InvalidOperationException("Status must be Approved or Rejected.");

            if (request.ApprovedBy <= 0)
                throw new InvalidOperationException("Approver ID is required.");

            return await _repository.DeductionActionAsync(request);
        }

        public async Task<IEnumerable<SalaryDeductionResponseDto>> GetDeductionsAsync(
            int? empId, int? month, int? year, string? status)
            => await _repository.GetDeductionsAsync(empId, month, year, status);

        // ── Salary Structures ─────────────────────────────────
        public async Task<IEnumerable<SalaryStructureResponseDto>> GetSalaryStructuresAsync()
            => await _repository.GetSalaryStructuresAsync();
        public async Task<IEnumerable<EmployeeSalaryListResponseDto>> GetAllEmployeeSalariesAsync()
          => await _repository.GetAllEmployeeSalariesAsync();

        #endregion

        #region Employee Loans

        public async Task<int> CreateLoanAsync(LoanRequestDto request)
        {
            if (request.EmpId <= 0)
                throw new InvalidOperationException("Invalid Employee ID.");

            var validTypes = new[] { "Loan", "Advance" };
            if (!validTypes.Contains(request.LoanType))
                throw new InvalidOperationException($"Invalid loan type '{request.LoanType}'. Use Loan or Advance.");

            if (request.TotalAmount <= 0)
                throw new InvalidOperationException("Total amount must be greater than 0.");

            if (request.EmiAmount <= 0)
                throw new InvalidOperationException("EMI amount must be greater than 0.");

            if (request.EmiAmount > request.TotalAmount)
                throw new InvalidOperationException("EMI amount cannot exceed total amount.");

            if (request.LoanDate == default)
                throw new InvalidOperationException("Loan date is required.");

            return await _repository.CreateLoanAsync(request);
        }

        public async Task<IEnumerable<LoanResponseDto>> GetLoansByEmpAsync(int empId)
        {
            if (empId <= 0)
                throw new InvalidOperationException("Invalid Employee ID.");

            return await _repository.GetLoansByEmpAsync(empId);
        }

        public async Task<IEnumerable<LoanResponseDto>> GetAllLoansAsync(string? status)
            => await _repository.GetAllLoansAsync(status);

        public async Task<bool> LoanActionAsync(LoanActionDto request)
        {
            var validStatuses = new[] { "Active", "Rejected" };
            if (!validStatuses.Contains(request.Status))
                throw new InvalidOperationException("Status must be Active (approve) or Rejected.");

            if (request.ApprovedBy <= 0)
                throw new InvalidOperationException("Approver ID is required.");

            var result = await _repository.LoanActionAsync(request);
            if (!result)
                throw new InvalidOperationException("Loan not found or already processed.");

            return result;
        }

        public async Task<bool> CloseLoanAsync(LoanCloseDto request)
        {
            var result = await _repository.CloseLoanAsync(request);
            if (!result)
                throw new InvalidOperationException("Loan not found or not currently Active.");

            return result;
        }

        #endregion

        #region Overtime Requests

        public async Task<int> CreateOvertimeAsync(OvertimeRequestDto request)
        {
            if (request.EmpId <= 0)
                throw new InvalidOperationException("Invalid Employee ID.");

            if (request.OtHours <= 0 || request.OtHours > 12)
                throw new InvalidOperationException("OT hours must be between 0 and 12.");

            if (request.OtDate.Date > DateTime.Today)
                throw new InvalidOperationException("Cannot log overtime for a future date.");

            var otId = await _repository.CreateOvertimeAsync(request);
            if (otId == -1)
                throw new InvalidOperationException("An overtime entry already exists for this employee on this date.");

            return otId;
        }

        public async Task<IEnumerable<OvertimeResponseDto>> GetAllOvertimeAsync(
            int? empId, string? status, DateTime? fromDate, DateTime? toDate)
            => await _repository.GetAllOvertimeAsync(empId, status, fromDate, toDate);

        public async Task<bool> OvertimeActionAsync(OvertimeActionDto request)
        {
            var validStatuses = new[] { "Approved", "Rejected" };
            if (!validStatuses.Contains(request.Status))
                throw new InvalidOperationException("Status must be Approved or Rejected.");

            if (request.ApprovedBy <= 0)
                throw new InvalidOperationException("Approver ID is required.");

            var result = await _repository.OvertimeActionAsync(request);
            if (!result)
                throw new InvalidOperationException("Overtime request not found or already processed.");

            return result;
        }

        #endregion

        #region Late Mark Rules

        public async Task<int> CreateLateMarkRuleAsync(LateMarkRuleRequestDto request)
        {
            if (request.LatesCount <= 0)
                throw new InvalidOperationException("Lates count must be greater than 0.");

            var validPenalties = new[] { "HalfDay", "FullDay" };
            if (!validPenalties.Contains(request.PenaltyType))
                throw new InvalidOperationException($"Invalid penalty type '{request.PenaltyType}'. Use HalfDay or FullDay.");

            return await _repository.CreateLateMarkRuleAsync(request);
        }

        public async Task<LateMarkRuleResponseDto?> GetActiveLateMarkRuleAsync()
            => await _repository.GetActiveLateMarkRuleAsync();

        public async Task<IEnumerable<LateMarkRuleResponseDto>> GetAllLateMarkRulesAsync()
            => await _repository.GetAllLateMarkRulesAsync();

        #endregion

        #region Payroll Loan Integration

        public async Task<int> ApplyLoanEmiAsync(int month, int year)
        {
            if (month < 1 || month > 12)
                throw new InvalidOperationException("Invalid month.");

            return await _repository.ApplyLoanEmiAsync(month, year);
        }

        #endregion

        #region Job Requisition
        public async Task<int> CreateRequisitionAsync(JobRequisitionRequestDto request)
        {
            return await _repository.CreateRequisitionAsync(request);
        }

        public async Task<bool> ActionRequisitionAsync(JobRequisitionActionDto request)
        {
            if (request.Status is not ("Approved" or "Rejected"))
                throw new ArgumentException("Status must be 'Approved' or 'Rejected'.");

            return await _repository.ActionRequisitionAsync(request);
        }

        public Task<IEnumerable<dynamic>> GetAllRequisitionsAsync(string? status)
            => _repository.GetAllRequisitionsAsync(status);

        public Task<dynamic?> GetRequisitionByIdAsync(int id)
            => _repository.GetRequisitionByIdAsync(id);

        #endregion

        #region Job Posting 
        public async Task<int> CreateJobPostingAsync(JobPostingRequestDto request)
        {
            var requisition = await _repository.GetRequisitionByIdAsync(request.RequisitionId)
                ?? throw new InvalidOperationException("Linked requisition not found.");

            // Only fully (Management) approved requisitions can be turned into a job posting
            var reqDict = (IDictionary<string, object>)requisition;
            string requisitionStatus = reqDict.TryGetValue("status", out var statusVal) && statusVal != null
                ? statusVal.ToString() ?? string.Empty
                : string.Empty;

            if (!string.Equals(requisitionStatus, "ApprovedByMgmt", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException(
                    $"Cannot create job posting. Requisition is currently '{requisitionStatus}' — it must be fully approved by Management first.");

            var shareableLink = $"{_configuration["App:CareerPageBaseUrl"]}/jobs/{Guid.NewGuid():N}";

            return await _repository.CreateJobPostingAsync(request, shareableLink);
        }

        public Task<bool> UpdateJobPostingAsync(JobPostingUpdateRequestDto request)
            => _repository.UpdateJobPostingAsync(request);
        public Task<IEnumerable<dynamic>> GetAllJobPostingsAsync(bool? publishedOnly)
            => _repository.GetAllJobPostingsAsync(publishedOnly);
        public Task<dynamic?> GetJobPostingByIdAsync(int id)
            => _repository.GetJobPostingByIdAsync(id);

        ///  Recruitment Status Report
        public async Task<IEnumerable<RecruitmentStatusReportDto>> GetRecruitmentStatusReportAsync(
            DateTime? fromDate, DateTime? toDate)
            => await _repository.GetRecruitmentStatusReportAsync(fromDate, toDate);

        #endregion

        #region Application System 
        //public async Task<(int Id, string ApplicationCode)> ApplyAsync(CandidateApplicationRequestDto request)
        //{
        //    var posting = await _repository.GetJobPostingByIdAsync(request.JobPostingId)
        //        ?? throw new InvalidOperationException("Job posting not found.");

        //    if (string.IsNullOrWhiteSpace(request.CvBase64))
        //        throw new InvalidOperationException("Resume file is required.");

        //    // Ab request.CvBase64 aur request.CvExtension properly bind honge
        //    request.CvPath = await _fileUploadHelper.SaveBase64FileAsync(
        //        request.CvBase64,
        //        request.CvExtension,
        //        "CandidateCVs",
        //        new[] { ".pdf", ".doc", ".docx" }
        //    );

        //    var result = await _repository.CreateApplicationAsync(request);
        //    return result;
        //}

        public async Task<(int Id, string ApplicationCode)> ApplyAsync(CandidateApplicationRequestDto request)
        {
            var posting = await _repository.GetJobPostingByIdAsync(request.JobPostingId)
                ?? throw new InvalidOperationException("Job posting not found.");

            if (string.IsNullOrWhiteSpace(request.CvBase64))
                throw new InvalidOperationException("Resume file is required.");

            request.CvPath = await _fileUploadHelper.SaveBase64FileAsync(
                request.CvBase64,
                request.CvExtension,
                "CandidateCVs",
                new[] { ".pdf", ".doc", ".docx" }
            );

            var result = await _repository.CreateApplicationAsync(request);

            // --- Candidate ko acknowledgement email ---
            string jobTitle = posting.Title as string ?? "the position";

            var candidateBody = $@"
                <p>Hi {request.Name},</p>
                <p>Thanks for applying to <strong>{jobTitle}</strong> at AKS Solar Systems Pvt. Ltd.</p>
                <p>Your application ID is: <strong>{result.ApplicationCode}</strong></p>
                <p>Please save this ID — you can use it to track your application status.</p>
                <p>We'll be in touch if your profile matches our requirements.</p>
                <p>— AKS Solar Systems HR Team</p>";

            await _emailService.SendEmailAsync(
                request.Email,
                $"We've received your application — {result.ApplicationCode}",
                candidateBody);

            // --- HR ko notification email (Notifications:HrEmails array from appsettings.json) ---
            var hrEmails = _configuration.GetSection("Notifications:HrEmails").Get<List<string>>();
            if (hrEmails != null && hrEmails.Any())
            {
                var hrBody = $@"
                <p>A new application has been submitted.</p>
                <ul>
                    <li><strong>Job:</strong> {jobTitle}</li>
                    <li><strong>Application ID:</strong> {result.ApplicationCode}</li>
                    <li><strong>Name:</strong> {request.Name}</li>
                    <li><strong>Email:</strong> {request.Email}</li>
                    <li><strong>Phone:</strong> {request.Phone}</li>
                    <li><strong>Experience:</strong> {request.Experience ?? "N/A"}</li>
                    <li><strong>Skills:</strong> {request.Skills ?? "N/A"}</li>
                </ul>
                <p>Log in to the admin panel to review the resume.</p>";

                await _emailService.SendEmailAsync(
                    hrEmails,
                    $"New application: {jobTitle} — {result.ApplicationCode}",
                    hrBody);
            }

            // Acknowledgement email chali gayi, ab DB flag update karo
            await _repository.MarkAcknowledgementSentAsync(result.Id);

            return result;
        }


        // D. Candidate Management =====================
        public Task<IEnumerable<dynamic>> SearchCandidatesAsync(CandidateSearchRequestDto filter)
            => _repository.SearchCandidatesAsync(filter);

        public Task<dynamic?> GetCandidateByIdAsync(int id)
            => _repository.GetCandidateByIdAsync(id);

        public Task<bool> UpdateCandidateStatusAsync(CandidateStatusUpdateDto request)
        {
            var allowed = new[] { "Applied", "Shortlisted", "Interview", "Selected", "Rejected" };
            if (!allowed.Contains(request.Status))
                throw new ArgumentException($"Status must be one of: {string.Join(", ", allowed)}");

            return _repository.UpdateCandidateStatusAsync(request);
        }

        #endregion

        #region Interview Management 
        public async Task<int> ScheduleInterviewAsync(InterviewScheduleRequestDto request)
        {
            var candidate = await _repository.GetCandidateByIdAsync(request.CandidateId)   // ← ye pehle chalta hai
                ?? throw new InvalidOperationException("Candidate not found.");

            if ((string)candidate.Status == "Rejected")
                throw new InvalidOperationException("Cannot schedule interview for a rejected candidate.");

            return await _repository.ScheduleInterviewAsync(request);
        }

        public Task<bool> SubmitInterviewFeedbackAsync(InterviewFeedbackRequestDto request)
        {
            if (request.Rating is < 1 or > 5)
                throw new ArgumentException("Rating must be between 1 and 5.");

            return _repository.SubmitInterviewFeedbackAsync(request);
        }

        public Task<IEnumerable<dynamic>> GetInterviewsByCandidateAsync(int candidateId)
            => _repository.GetInterviewsByCandidateAsync(candidateId);

        public Task<bool> SelectionApprovalAsync(InterviewSelectionApprovalDto request)
        {
            if (request.Status is not ("Selected" or "Rejected"))
                throw new ArgumentException("Status must be 'Selected' or 'Rejected'.");

            return _repository.SelectionApprovalAsync(request);
        }

        #endregion

        #region  Offer & Joining 
        public async Task<int> CreateOfferAsync(OfferCreateRequestDto request)
        {
            var candidate = await _repository.GetCandidateByIdAsync(request.CandidateId)
                ?? throw new InvalidOperationException("Candidate not found.");

            if ((string)candidate.Status != "Selected")
                throw new InvalidOperationException("Offer can only be created for a Selected candidate.");

            return await _repository.CreateOfferAsync(request);
        }

        public Task<bool> OfferActionAsync(OfferActionDto request)
        {
            if (request.Status is not ("Approved" or "Rejected"))
                throw new ArgumentException("Status must be 'Approved' or 'Rejected'.");

            return _repository.OfferActionAsync(request);
        }

        public Task<dynamic?> GetOfferByCandidateAsync(int candidateId)
            => _repository.GetOfferByCandidateAsync(candidateId);

        public async Task<EmployeeResponseDto> ConfirmJoiningAndConvertAsync(JoiningConfirmationRequestDto request, string creatorRole)
        {
            var offer = await _repository.GetOfferByCandidateAsync(request.CandidateId)
                ?? throw new InvalidOperationException("No offer found.");

            if (!string.Equals(Convert.ToString(offer.status), "Approved", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException($"Current Offer Status = {offer.status}");

            // Idempotency — pehle se convert ho chuka ho to wahi record wapas do
            var existingEmpId = await _repository.GetEmployeeIdByCandidateIdAsync(request.CandidateId);
            if (existingEmpId.HasValue)
                return await _repository.GetEmployeeByIdAsync(existingEmpId.Value)
                    ?? throw new InvalidOperationException("Linked employee record missing.");

            var candidateData = await _repository.GetCandidateJoiningDataAsync(request.CandidateId)
                ?? throw new InvalidOperationException("Candidate/requisition data not found.");

            const int DefaultEmployeeRoleId = 4; // "Employee" role

            var dto = new EmployeeRequestDto
            {
                FirstName = candidateData.FirstName,
                LastName = candidateData.LastName ?? string.Empty,
                Gender = "Other",
                DateOfBirth = new DateTime(1990, 1, 1),
                PersonalEmail = candidateData.Email,
                OfficialEmail = candidateData.Email ?? string.Empty,
                Mobile = candidateData.Mobile ?? string.Empty,
                DeptId = candidateData.DeptId,
                DesigId = candidateData.DesigId,
                ReportingManager = candidateData.ReportingManager,
                RoleId = DefaultEmployeeRoleId,
                DateOfJoining = request.ActualJoiningDate,
                EmploymentType = "Probation",
                EmploymentStatus = "Active",
                CurrentCtc = candidateData.OfferedCtc ?? 0
            };
            var created = await CreateEmployeeAsync(dto, creatorRole);

            await _repository.LinkEmployeeToCandidateAsync(created.EmpId, request.CandidateId);
            await _repository.MarkCandidateJoinedAsync(request.CandidateId);

            return created;
        }

        #endregion

        #region Password
        public async Task<(string Username, string NewPassword)> RevealEmployeeCredentialsAsync(int empId, string secretKey)
        {
            var configuredSecret = _configuration["CredentialsRevealSecret"];
            if (string.IsNullOrEmpty(configuredSecret) || secretKey != configuredSecret)
                throw new UnauthorizedAccessException("Invalid key.");

            var creds = await _repository.GetUserCredsInfoByEmpIdAsync(empId)
                ?? throw new InvalidOperationException("No login account found for this employee.");

            string newPlainPassword = GenerateSecureTempPassword(); // existing helper, already use ho raha hai CreateEmployeeAsync mein
            string newHash = BCrypt.Net.BCrypt.HashPassword(newPlainPassword);

            await _repository.UpdateUserPasswordAsync(creds.UserId, newHash);

            return (creds.Username, newPlainPassword);
        }

        #endregion

        #region Issue offer latter and appointemt latter
        public async Task<byte[]?> GenerateOfferLetterAsync(int candidateId)
        {
            var offer = await _repository.GetOfferByCandidateAsync(candidateId);
            if (offer == null) return null;

            var candidate = await _repository.GetCandidateLetterDataAsync(candidateId);
            if (candidate == null) return null;

            decimal ctc = SafeDecimal(offer.OfferedCtc);

            var fields = new Dictionary<string, string>
            {
                ["OfferNumber"] = $"AKS/HR/{FiscalYear()}/{offer.OfferId:D3}",
                ["OfferDate"] = DateTime.Now.ToString("dd-MM-yyyy"),
                ["CandidateName"] = $"{candidate.FirstName} {candidate.LastName}",
                ["FatherName"] = candidate.FatherName ?? "",
                ["AddressLine1"] = candidate.AddressLine1 ?? "",
                ["AddressLine2"] = candidate.AddressLine2 ?? "",
                ["Designation"] = candidate.DesignationName ?? "",
                ["JoiningDate"] = SafeDate(offer.JoiningDate, "MMMM d, yyyy"),
                ["SalaryNumeric"] = ctc.ToString("N0"),
                ["SalaryWords"] = IndianCurrencyWords.Convert((long)ctc),
                ["ReportingManagerName"] = candidate.ReportingManagerName ?? "",
                ["ReportingManagerDesignation"] = candidate.ReportingManagerDesignation ?? "",
                ["ReportingManagerContact"] = candidate.ReportingManagerContact ?? "",
            };

            return _letterMerge.Merge(OfferTemplatePath, fields);
        }

        public async Task<byte[]?> GenerateAppointmentLetterAsync(int candidateId)
        {
            var offer = await _repository.GetOfferByCandidateAsync(candidateId);
            if (offer == null) return null;

            var emp = await _repository.GetEmployeeLetterDataByCandidateAsync(candidateId);
            if (emp == null) return null;

            decimal ctc = SafeDecimal(offer.OfferedCtc);

            var fields = new Dictionary<string, string>
            {
                ["AppointmentNumber"] = $"AKS/HR/{FiscalYear()}/{offer.OfferId:D3}",
                ["AppointmentDate"] = DateTime.Now.ToString("dd-MM-yyyy"),
                ["CandidateName"] = $"{emp.FirstName} {emp.LastName}",
                ["FatherName"] = emp.FatherName ?? "",
                ["AddressLine1"] = emp.AddressLine1 ?? "",
                ["AddressLine2"] = emp.AddressLine2 ?? "",
                ["Phone"] = emp.Phone ?? "",
                ["DOB"] = SafeDate(emp.DateOfBirth, "dd-MM-yyyy"),
                ["BloodGroup"] = emp.BloodGroup ?? "",
                ["Designation"] = emp.DesignationName ?? "",
                ["JoiningDate"] = SafeDate(offer.JoiningDate, "dd-MM-yyyy"),
                ["ProbationMonths"] = "3",
                ["SalaryNumeric"] = ctc.ToString("N0"),
                ["SalaryWords"] = IndianCurrencyWords.Convert((long)ctc),
                ["PlaceOfPosting"] = emp.PlaceOfPosting ?? "",
            };

            return _letterMerge.Merge(AppointmentTemplatePath, fields);
        }

        // 🆕 add alongside SafeDate
        private static decimal SafeDecimal(dynamic value)
        {
            if (value == null) return 0;
            if (value is decimal d) return d;
            return Convert.ToDecimal(value);
        }

        private static string SafeDate(dynamic value, string format)
        {
            if (value == null) return "";
            if (value is DateTime dt) return dt.ToString(format);
            return value.ToString();
        }

        private string FiscalYear() =>
            DateTime.Now.Month >= 4
                ? $"{DateTime.Now.Year}-{(DateTime.Now.Year + 1) % 100}"
                : $"{DateTime.Now.Year - 1}-{DateTime.Now.Year % 100}";

        public async Task<byte[]?> GenerateRegularizationLetterAsync(int candidateId, DateTime effectiveDate)
        {
            var offer = await _repository.GetOfferByCandidateAsync(candidateId);
            if (offer == null) return null;

            var emp = await _repository.GetEmployeeLetterDataByCandidateAsync(candidateId);
            if (emp == null) return null;

            var fields = new Dictionary<string, string>
            {
                ["RegularizationNumber"] = $"AKS/HR/{FiscalYear()}/{offer.OfferId:D3}",
                ["RegularizationDate"] = DateTime.Now.ToString("dd-MM-yyyy"),
                ["EmployeeName"] = $"{emp.FirstName} {emp.LastName}",
                ["Address"] = $"{emp.AddressLine1} {emp.AddressLine2}".Trim(),
                ["AppointmentLetterNumber"] = $"AKS/HR/{FiscalYear()}/{offer.OfferId:D3}",
                ["AppointmentLetterDate"] = SafeDate(offer.JoiningDate, "dd-MM-yyyy"), // adjust if you store the actual appointment-letter issue date separately
                ["JoiningDate"] = SafeDate(offer.JoiningDate, "dd-MM-yyyy"),
                ["ProbationPeriod"] = "three (3) months",
                ["EffectiveDate"] = effectiveDate.ToString("dd-MM-yyyy"),
            };

            return _letterMerge.Merge(RegularizationTemplatePath, fields);
        }
        public async Task<byte[]?> GenerateRelievingLetterAsync(int candidateId)
        {
            var emp = await _repository.GetEmployeeLetterDataByCandidateAsync(candidateId);
            if (emp == null) return null;
            if (emp.LastWorkingDate == null) return null;  

            var fields = new Dictionary<string, string>
            {
                ["RelievingNumber"] = $"AKS/HR/{FiscalYear()}/{emp.EmpId:D3}",
                ["RelievingDate"] = DateTime.Now.ToString("dd-MM-yyyy"),
                ["EmployeeName"] = $"{emp.FirstName} {emp.LastName}",
                ["FatherName"] = emp.FatherName ?? "",
                ["AddressLine1"] = emp.AddressLine1 ?? "",
                ["AddressLine2"] = emp.AddressLine2 ?? "",
                ["Designation"] = emp.DesignationName ?? "",
                ["JoiningDate"] = SafeDate(emp.DateOfJoining, "dd-MM-yyyy"),
                ["LastWorkingDate"] = SafeDate(emp.LastWorkingDate, "dd-MM-yyyy"),
                ["ResignationDate"] = SafeDate(emp.ResignationDate, "dd-MM-yyyy"),
                ["ExitReason"] = emp.ExitReason ?? "",
            };

            return _letterMerge.Merge(RelievingTemplatePath, fields);
        }

        #endregion

        #region Sunday work
        public async Task<SundayHolidayStatusReportDto> GetSundayHolidayStatusAsync(int month, int year)
        {
            var sundayDates = GetSundaysInMonth(month, year);

            var employees = await _repository.GetActiveEmployeesBasicAsync();

            var monthStart = new DateTime(year, month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var dutyRecords = await _repository.GetSundayDutyRecordsAsync(monthStart, monthEnd);
            var ledgerRecords = await _repository.GetSundayLedgerAsync(month, year);

            var report = new SundayHolidayStatusReportDto
            {
                Month = month,
                Year = year,
                MonthName = $"{CultureInfo.InvariantCulture.DateTimeFormat.GetMonthName(month).ToUpper()} {year}",
                SundayDates = sundayDates
            };

            int sr = 1;
            foreach (var emp in employees)
            {
                var ledger = ledgerRecords.FirstOrDefault(l => l.EmpId == emp.EmpId);

                var row = new SundayHolidayStatusRowDto
                {
                    SrNo = sr++,
                    EmpId = emp.EmpId,
                    EmployeeName = emp.FullName.ToUpper(),
                    PreviousBalance = ledger?.OpeningBalance ?? 0,
                    MonthDutyCount = ledger?.DutyCount ?? 0,
                    MonthCompOff = ledger?.CompOffUsed ?? 0,
                };

                foreach (var date in sundayDates)
                {
                    var record = dutyRecords.FirstOrDefault(d => d.EmpId == emp.EmpId && d.DutyDate.Date == date.Date);

                    string cellStatus;
                    if (record != null)
                    {
                        cellStatus = record.Status == "ON-DUTY" && !string.IsNullOrWhiteSpace(record.Location)
                            ? $"ON-DUTY-{record.Location.ToUpper()}"
                            : record.Status;
                    }
                    else
                    {
                        cellStatus = (emp.JoiningDate == null || emp.JoiningDate <= date) ? "OFF" : "N/A";
                    }

                    row.Cells.Add(new SundayCellDto { Date = date, Status = cellStatus });
                }

                row.FinalDues = row.PreviousBalance + row.MonthDutyCount - row.MonthCompOff;
                report.Rows.Add(row);
            }

            return report;
        }

        public async Task<byte[]> GetSundayHolidayStatusPdfAsync(int month, int year)
        {
            var report = await GetSundayHolidayStatusAsync(month, year);
            return SundayHolidayStatusPdfBuilder.Build(report);
        }

        public async Task MarkSundayDutyAsync(SundayDutyRequestDto request, int createdBy)
            => await _repository.UpsertSundayDutyAsync(request, createdBy);

        private static List<DateTime> GetSundaysInMonth(int month, int year)
        {
            var result = new List<DateTime>();
            var date = new DateTime(year, month, 1);
            var lastDay = date.AddMonths(1).AddDays(-1);

            while (date <= lastDay)
            {
                if (date.DayOfWeek == DayOfWeek.Sunday)
                    result.Add(date);
                date = date.AddDays(1);
            }
            return result;
        }

        #endregion

    }
}