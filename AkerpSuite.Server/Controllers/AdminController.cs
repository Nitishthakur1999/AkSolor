using AkerpSuite.Server.Constants;
using AkerpSuite.Server.Dtos.Auth;
using AkerpSuite.Server.DTOs.Role;
using AkerpSuite.Server.Helpers;
using AkerpSuite.Server.Services;
using DocumentFormat.OpenXml.Bibliography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Net.NetworkInformation;
using System.Security.Claims;
using System.Text.Json;

namespace AkerpSuite.Server.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _service;
        //   private const string SuperAdminRoles = Roles.CMD + "," + Roles.Admin;
        private const string SuperAdminRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR;
        // ── HR Core management (Employee, Department, Designation, Attendance, Leave, Payroll) ──
        private const string HrManageRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR;

        // ── Recruitment (HR + Manager for requisitions/interviews) ──
        private const string HrRecruitRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Manager;

        // ── Payroll views that Accounts also needs ──
        private const string PayrollViewRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Accounts;

        // ── Payroll finalize/markpaid: tighter control ──
        private const string PayrollFinalizeRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR;
        private const string PayrollMarkPaidRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.Accounts + "," + Roles.HR;

        // ── Leave/Overtime actions that Manager also approves for their team ──
        private const string HrManagerApprovalRoles = Roles.CMD + "," + Roles.Admin + "," + Roles.HR + "," + Roles.Manager;

        public AdminController(IAdminService service)
        {
            _service = service;
        }

        #region Dashboard – Role-based Summary

        [HttpGet("dashboard")]
        [Authorize]
        public async Task<IActionResult> Dashboard()
        {
            // JWT token se RoleId nikalo
            var roleIdClaim = User.FindFirst("RoleId")?.Value;

            if (string.IsNullOrEmpty(roleIdClaim))
                return Unauthorized(new { Success = false, Message = "Invalid token — RoleId missing" });

            int roleId = int.Parse(roleIdClaim);

            var data = await _service.GetDashboardAsync(roleId);

            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Role Management (CRUD)

        [HttpPost("creteroles")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> CreateRole([FromBody] RoleRequestDto request)
        {
            var data = await _service.CreateRoleAsync(request);
            return Ok(new { Success = true, Message = "Role created successfully", Data = data });
        }

        [HttpGet("getallroles")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> GetRoles()
        {
            var data = await _service.GetRolesAsync();
            return Ok(new { Success = true, Data = data });
        }

        [HttpGet("getrolesbyid/{id}")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> GetRole(int id)
        {
            var data = await _service.GetRoleByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Role not found" });
            return Ok(new { Success = true, Data = data });
        }

        [HttpPut("updateroles/{id}")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] RoleRequestDto request)
        {
            var updated = await _service.UpdateRoleAsync(id, request);
            if (!updated)
                return NotFound(new { Success = false, Message = "Role not found" });
            return Ok(new { Success = true, Message = "Role updated successfully" });
        }

        [HttpDelete("deleteroles/{id}")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var deleted = await _service.DeleteRoleAsync(id);
            if (!deleted)
                return NotFound(new { Success = false, Message = "Role not found" });
            return Ok(new { Success = true, Message = "Role deleted successfully" });
        }

        #endregion

        #region Role–Permission Mapping (CRUD + Assign/Remove)

        [HttpPost("createpermissions")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> CreatePermission([FromBody] PermissionRequestDto request)
        {
            var data = await _service.CreatePermissionAsync(request);
            return Ok(new { Success = true, Message = "Permission created successfully", Data = data });
        }

        [HttpGet("getallpermissions")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> GetPermissions()
        {
            var data = await _service.GetPermissionsAsync();
            return Ok(new { Success = true, Data = data });
        }

        [HttpGet("getpermissions/{id}")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> GetPermission(int id)
        {
            var data = await _service.GetPermissionByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Permission not found" });
            return Ok(new { Success = true, Data = data });
        }

        [HttpPut("updatepermissions/{id}")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> UpdatePermission(int id, [FromBody] PermissionRequestDto request)
        {
            var updated = await _service.UpdatePermissionAsync(id, request);
            if (!updated)
                return NotFound(new { Success = false, Message = "Permission not found" });
            return Ok(new { Success = true, Message = "Permission updated successfully" });
        }

        [HttpDelete("deletepermissions/{id}")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> DeletePermission(int id)
        {
            var deleted = await _service.DeletePermissionAsync(id);
            if (!deleted)
                return NotFound(new { Success = false, Message = "Permission not found" });
            return Ok(new { Success = true, Message = "Permission deleted successfully" });
        }

        [HttpPatch("permissions/{id}/toggle-status")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> TogglePermissionStatus(int id)
        {
            var updated = await _service.ToggleStatusAsync(id);
            if (!updated)
                return NotFound(new { Success = false, Message = "Permission not found" });
            return Ok(new { Success = true, Message = "Permission status updated successfully" });
        }

        // Role Permission Mapping

        [HttpPost("assignpermissions")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> AssignPermissions([FromBody] RolePermissionRequestDto request)
        {
            var result = await _service.AssignPermissionsAsync(request);
            return Ok(new { Success = result, Message = "Permissions assigned successfully" });
        }

        [HttpGet("getrolepermissions/{roleId}")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> GetRolePermissions(int roleId)
        {
            var data = await _service.GetRolePermissionsAsync(roleId);
            return Ok(new { Success = true, Data = data });
        }

        [HttpDelete("removerolepermission/{roleId}/{permissionId}")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> RemovePermission(int roleId, int permissionId)
        {
            var result = await _service.RemovePermissionAsync(roleId, permissionId);
            if (!result)
                return NotFound(new { Success = false, Message = "Permission mapping not found" });
            return Ok(new { Success = result, Message = "Permission removed successfully" });
        }

        #endregion

        #region Employee Management (CRUD + Status Toggle)

        [HttpPost("CreateEmployee")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> CreateEmployee([FromBody] EmployeeRequestDto request)
        {
            var creatorRole = User.FindFirst(ClaimTypes.Role)?.Value
                ?? throw new UnauthorizedAccessException("Role not found in token.");

            var data = await _service.CreateEmployeeAsync(request, creatorRole);
            return Ok(new { Success = true, Message = "Employee created successfully", Data = data });
        }

        [HttpGet("getallemployees")]
        [Authorize]
        public async Task<IActionResult> GetAllEmployees(
                    [FromQuery] int? departmentId,
                    [FromQuery] int? roleId,
                    [FromQuery] string? status,
                    [FromQuery] int? designationId)
        {
            var viewerRole = User.FindFirst(ClaimTypes.Role)?.Value
                ?? throw new UnauthorizedAccessException("Role not found in token.");

            var data = await _service.GetAllEmployeesAsync(departmentId, roleId, status, designationId, viewerRole);
            return Ok(new { Success = true, Data = data });
        }

        [HttpGet("getemployee/{id}")]
        public async Task<IActionResult> GetEmployee(int id)
        {
            var data = await _service.GetEmployeeByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Employee not found" });
            return Ok(new { Success = true, Data = data });
        }

        [HttpPut("updateemployee/{id}")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] EmployeeRequestDto request)
        {
            var existingEmployee = await _service.GetEmployeeByIdAsync(id);
            if (existingEmployee == null)
                return NotFound(new { Success = false, Message = "Employee not found" });

            var updated = await _service.UpdateEmployeeAsync(id, request, existingEmployee.PhotoPath ?? string.Empty);
            if (!updated)
                return NotFound(new { Success = false, Message = "Employee could not be updated" });

            return Ok(new { Success = true, Message = "Employee updated successfully" });
        }

        [HttpDelete("deleteemployee/{id}")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var deleted = await _service.DeleteEmployeeAsync(id);
            if (!deleted)
                return NotFound(new { Success = false, Message = "Employee not found" });
            return Ok(new { Success = true, Message = "Employee deleted successfully" });
        }

        [HttpPatch("employees/{id}/toggle-status")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> ToggleEmployeeStatus(int id, [FromBody] EmployeeRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.EmploymentStatus))
                return BadRequest(new { Success = false, Message = "Employment status is required" });

            var updated = await _service.ToggleEmployeeStatusAsync(id, request.EmploymentStatus);
            if (!updated)
                return NotFound(new { Success = false, Message = "Employee not found" });

            return Ok(new { Success = true, Message = $"Employee status changed to {request.EmploymentStatus}" });
        }

        #endregion

        #region Department Management (CRUD)

        // POST /api/department
        [HttpPost("CreateDepartment")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> CreateDepartment([FromBody] DepartmentRequestDto request)
        {
            var data = await _service.CreateDepartmentAsync(request);
            return Ok(new { Success = true, Message = "Department created successfully", Data = data });
        }

        // GET /api/department
        [HttpGet("GetDepartments")]
        public async Task<IActionResult> GetDepartments()
        {
            var data = await _service.GetDepartmentsAsync();
            return Ok(new { Success = true, Data = data });
        }

        // GET /api/department/{id}
        [HttpGet("GetDepartmentById/{id}")]
        public async Task<IActionResult> GetDepartment(int id)
        {
            var data = await _service.GetDepartmentByIdAsync(id);

            if (data == null)
                return NotFound(new { Success = false, Message = "Department not found" });

            return Ok(new { Success = true, Data = data });
        }

        // PUT /api/department/{id}
        [HttpPut("UpdateDepartment/{id}")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> UpdateDepartment(int id, [FromBody] DepartmentRequestDto request)
        {
            var updated = await _service.UpdateDepartmentAsync(id, request);

            if (!updated)
                return NotFound(new { Success = false, Message = "Department not found" });

            return Ok(new { Success = true, Message = "Department updated successfully" });
        }

        // DELETE /api/department/{id}
        [HttpDelete("DeleteDepartment/{id}")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var deleted = await _service.DeleteDepartmentAsync(id);

            if (!deleted)
                return NotFound(new { Success = false, Message = "Department not found" });

            return Ok(new { Success = true, Message = "Department deleted successfully" });
        }

        #endregion

        #region Designation Management (CRUD)

        // POST /api/admin/CreateDesignation
        [HttpPost("CreateDesignation")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> CreateDesignation([FromBody] DesignationRequestDto request)
        {
            var data = await _service.CreateDesignationAsync(request);
            return Ok(new { Success = true, Message = "Designation created successfully", Data = data });
        }

        // GET /api/admin/GetDesignations
        [HttpGet("GetDesignations")]
        public async Task<IActionResult> GetDesignations()
        {
            var data = await _service.GetDesignationsAsync();
            return Ok(new { Success = true, Data = data });
        }

        // GET /api/admin/GetDesignationById/1
        [HttpGet("GetDesignationById/{id}")]
        public async Task<IActionResult> GetDesignationById(int id)
        {
            var data = await _service.GetDesignationByIdAsync(id);

            if (data == null)
                return NotFound(new { Success = false, Message = "Designation not found" });

            return Ok(new { Success = true, Data = data });
        }

        // PUT /api/admin/UpdateDesignation/1
        [HttpPut("UpdateDesignation/{id}")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> UpdateDesignation(int id, [FromBody] DesignationRequestDto request)
        {
            var updated = await _service.UpdateDesignationAsync(id, request);

            if (!updated)
                return NotFound(new { Success = false, Message = "Designation not found" });

            return Ok(new { Success = true, Message = "Designation updated successfully" });
        }

        // DELETE /api/admin/DeleteDesignation/1
        [HttpDelete("DeleteDesignation/{id}")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> DeleteDesignation(int id)
        {
            var deleted = await _service.DeleteDesignationAsync(id);

            if (!deleted)
                return NotFound(new { Success = false, Message = "Designation not found" });

            return Ok(new { Success = true, Message = "Designation deleted successfully" });
        }

        #endregion

        #region Page Master & Role-Page Access Mapping

        // POST: api/admin/addpage
        [HttpPost("addpage")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> AddPage([FromBody] PageMasterRequestDto request)
        {
            var result = await _service.AddPageAsync(request);
            if (!result)
                return BadRequest(new { Success = false, Message = "Failed to add page" });

            return Ok(new { Success = true, Message = "Page added successfully" });
        }
        // GET: api/admin/getallpages
        [HttpGet("getallpages")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> GetAllPages()
        {
            var data = await _service.GetAllPagesAsync();
            return Ok(new { Success = true, Data = data });
        }

        // GET: api/admin/getrolepages/3
        [HttpGet("getrolepages/{roleId}")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> GetRolePages(int roleId)
        {
            var data = await _service.GetPagesByRoleAsync(roleId);
            return Ok(new { Success = true, Data = data });
        }

        // PUT: api/admin/updaterolepages
        [HttpPut("updaterolepages")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> UpdateRolePages([FromBody] RolePageUpdateRequestDto request)
        {
            var result = await _service.UpdateRolePagesAsync(request);
            if (!result)
                return BadRequest(new { Success = false, Message = "Failed to update pages" });

            return Ok(new { Success = true, Message = "Pages updated successfully" });
        }
        // PUT: api/admin/updatepage
        [HttpPut("updatepage")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> UpdatePage([FromBody] PageMasterUpdateRequestDto request)
        {
            var result = await _service.UpdatePageAsync(request);
            if (!result)
                return BadRequest(new { Success = false, Message = "Failed to update page" });

            return Ok(new { Success = true, Message = "Page updated successfully" });
        }
        // DELETE: api/admin/deletepage/3
        [HttpDelete("deletepage/{pageId}")]
        [Authorize(Roles = SuperAdminRoles)]
        public async Task<IActionResult> DeletePage(int pageId)
        {
            var result = await _service.DeletePageAsync(pageId);
            if (!result)
                return BadRequest(new { Success = false, Message = "Failed to delete page" });

            return Ok(new { Success = true, Message = "Page deleted successfully" });
        }
        #endregion

        #region Attendance dashbord,Marking, History, Regularization & Summary 

        [HttpPost("mark")]
        [Authorize(Roles = HrManageRoles + "," + Roles.Employee)]
        public async Task<IActionResult> MarkAttendance([FromBody] AttendanceRequestDto request)
        {
            if (User.IsInRole(Roles.Employee))
            {
                request.EmpId = User.GetEmpId();
            }
            var result = await _service.MarkAttendanceAsync(request);
            var isLate = result.LateMinutes > 0;
            var message = isLate
                ? $"Attendance marked as Late by {result.LateMinutes} minute(s). " +
                $"Sent for HR approval." : "Attendance marked successfully";

            return Ok(new
            {
                Success = true,
                Message = message,
                AttId = result.AttId,
                IsLate = isLate,
                LateMinutes = result.LateMinutes
            });
        }
        // GET /api/attendance/employee/{empId}?fromDate=&toDate=
        [HttpGet("employee/{empId}")]
        public async Task<IActionResult> GetByEmployee(
            int empId,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var data = await _service.GetAttendanceByEmpAsync(empId, fromDate, toDate);
            return Ok(new { Success = true, Data = data });
        }

        // GET /api/attendance/all?empId=&attDate=&status=&fromDate=&toDate=
        [HttpGet("all")]
        [Authorize(Roles = HrManageRoles + "," + Roles.Employee)]
        public async Task<IActionResult> GetAll(
            [FromQuery] int? empId,
            [FromQuery] DateTime? attDate,
            [FromQuery] string? status,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var data = await _service.GetAllAttendanceAsync(empId, attDate, status, fromDate, toDate);
            return Ok(new { Success = true, Data = data });
        }

        // POST /api/attendance/regularization
        [HttpPost("regularization")]
        public async Task<IActionResult> CreateRegRequest([FromBody] AttendanceRegRequestDto request)
        {
            var requestId = await _service.CreateRegRequestAsync(request);
            return Ok(new { Success = true, Message = "Regularization request submitted", RequestId = requestId });
        }

        // GET /api/attendance/regularization?empId=&status=
        [HttpGet("regularization")]
        [Authorize(Roles = HrManageRoles + "," + Roles.Employee)]
        public async Task<IActionResult> GetRegRequests(
            [FromQuery] int? empId,
            [FromQuery] string? status,
            [FromQuery] string? requestType)
        {
            var data = await _service.GetAllRegRequestsAsync(empId, status, requestType);
            return Ok(new { Success = true, Data = data });
        }

        // PATCH /api/attendance/regularization/{requestId}/action?status=Approved&approvedBy=5
        [HttpPatch("regularization/{requestId}/action")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> RegAction(int requestId, [FromQuery] string status, [FromQuery] int approvedBy)
        {
            var result = await _service.RegActionAsync(requestId, status, approvedBy);
            return Ok(new { Success = result, Message = $"Request {status} successfully" });
        }

        // POST /api/attendance/summary/generate
        [HttpPost("summary/generate")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> GenerateSummary([FromBody] AttendanceSummaryRequestDto request)
        {
            var summaryId = await _service.GenerateSummaryAsync(request.EmpId, request.Month, request.Year);
            return Ok(new { Success = true, Message = "Summary generated successfully", SummaryId = summaryId });
        }

        // GET /api/attendance/summary?empId=&month=&year=
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary(
            [FromQuery] int? empId,
            [FromQuery] int? month,
            [FromQuery] int? year)
        {
            var data = await _service.GetSummaryAsync(empId, month, year);
            return Ok(new { Success = true, Data = data });
        }

        [HttpGet("dashboard-stats")]
        [Authorize(Roles = HrManageRoles + "," + Roles.Employee)]
        public async Task<IActionResult> GetDashboardStats()
        {
            var data = await _service.GetAttendanceDashboardStatsAsync();
            return Ok(new { Success = true, Data = data });
        }

        [HttpGet("sunday-holiday-status")]
        [Authorize(Roles = HrManageRoles + "," + Roles.Manager)]
        public async Task<IActionResult> GetSundayHolidayStatus([FromQuery] int month, [FromQuery] int year)
        {
            var data = await _service.GetSundayHolidayStatusAsync(month, year);
            return Ok(new { Success = true, Data = data });
        }


        [HttpGet("sunday-holiday-status/pdf")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> DownloadSundayHolidayStatusPdf([FromQuery] int month, [FromQuery] int year)
        {
            var bytes = await _service.GetSundayHolidayStatusPdfAsync(month, year);
            var fileName = $"Sunday_Holiday_Working_Status_{month:D2}_{year}.pdf";
            return File(bytes, "application/pdf", fileName);
        }

        [HttpPost("sunday-holiday-status/mark")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> MarkSundayDuty([FromBody] SundayDutyRequestDto request)
        {
            var empIdClaim = User.FindFirst("emp_id")?.Value;
            int.TryParse(empIdClaim, out int createdBy);

            await _service.MarkSundayDutyAsync(request, createdBy);
            return Ok(new { Success = true, Message = "Sunday/Holiday duty status saved" });
        }


        #endregion

        #region Leave – Types, Balance & Requests

        // POST api/leave/types
        [HttpPost("types")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> CreateLeaveType([FromBody] LeaveTypeRequestDto request)
        {
            var data = await _service.CreateLeaveTypeAsync(request);
            return Ok(new { Success = true, Message = "Leave type created successfully", Data = data });
        }

        // GET api/leave/types
        [HttpGet("types")]
        [Authorize(Roles = HrManageRoles + "," + Roles.Employee)]
        public async Task<IActionResult> GetAllLeaveTypes()
        {
            var data = await _service.GetAllLeaveTypesAsync();
            return Ok(new { Success = true, Data = data });
        }

        // GET api/leave/types/1
        [HttpGet("types/{id}")]
        public async Task<IActionResult> GetLeaveTypeById(int id)
        {
            var data = await _service.GetLeaveTypeByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Leave type not found" });
            return Ok(new { Success = true, Data = data });
        }

        // PUT api/leave/types/1
        [HttpPut("types/{id}")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> UpdateLeaveType(int id, [FromBody] LeaveTypeRequestDto request)
        {
            var updated = await _service.UpdateLeaveTypeAsync(id, request);
            if (!updated)
                return NotFound(new { Success = false, Message = "Leave type not found" });
            return Ok(new { Success = true, Message = "Leave type updated successfully" });
        }

        // DELETE api/leave/types/1
        [HttpDelete("types/{id}")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> DeleteLeaveType(int id)
        {
            var deleted = await _service.DeleteLeaveTypeAsync(id);
            if (!deleted)
                return NotFound(new { Success = false, Message = "Leave type not found" });
            return Ok(new { Success = true, Message = "Leave type deleted successfully" });
        }

        // Leave Balance

        // POST api/leave/balance/initialize
        [HttpPost("balance/initialize")]
        [Authorize(Roles = HrManageRoles + "," + Roles.Employee)]
        public async Task<IActionResult> InitializeBalance([FromBody] LeaveBalanceInitRequestDto request)
        {
            var result = await _service.InitializeBalanceAsync(request.EmpId, request.Year);
            return Ok(new { Success = result, Message = "Leave balance initialized successfully" });
        }

        // GET api/leave/balance?empId=1&year=2025
        [HttpGet("balance")]
        public async Task<IActionResult> GetLeaveBalance([FromQuery] int empId, [FromQuery] int? year)
        {
            var currentYear = year ?? DateTime.Now.Year;
            var data = await _service.GetLeaveBalanceAsync(empId, currentYear);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/leave/balance/all?year=2025
        [HttpGet("balance/all")]
        [Authorize(Roles = HrManageRoles + "," + Roles.Employee)]
        public async Task<IActionResult> GetAllLeaveBalances([FromQuery] int? year)
        {
            var currentYear = year ?? DateTime.Now.Year;
            var data = await _service.GetAllLeaveBalancesAsync(currentYear);
            return Ok(new { Success = true, Data = data });
        }
        // Leave Requests

        // POST api/leave/request
        [HttpPost("request")]
        public async Task<IActionResult> CreateLeaveRequest([FromBody] LeaveRequestDto request)
        {
            var data = await _service.CreateLeaveRequestAsync(request);
            return Ok(new { Success = true, Message = "Leave request submitted successfully", Data = data });
        }

        // GET api/leave/requests?empId=&status=&month=&year=
        [HttpGet("requests")]
        [Authorize(Roles = HrManagerApprovalRoles)]
        public async Task<IActionResult> GetAllLeaveRequests([FromQuery] int? empId, [FromQuery] string? status,
            [FromQuery] int? month, [FromQuery] int? year)
        {
            var data = await _service.GetAllLeaveRequestsAsync(empId, status, month, year);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/leave/requests/5
        [HttpGet("requests/{leaveId}")]
        public async Task<IActionResult> GetLeaveRequestById(int leaveId)
        {
            var data = await _service.GetLeaveRequestByIdAsync(leaveId);
            if (data == null)
                return NotFound(new { Success = false, Message = "Leave request not found" });
            return Ok(new { Success = true, Data = data });
        }

        // PATCH api/leave/requests/5/action
        [HttpPatch("requests/{leaveId}/action")]
        [Authorize(Roles = HrManagerApprovalRoles)]
        public async Task<IActionResult> LeaveAction(int leaveId, [FromBody] LeaveActionRequestDto request)
        {
            // Auto-fill approvedBy from JWT token if not provided
            if (request.ApprovedBy <= 0)
            {
                var empIdClaim = User.FindFirst("emp_id")?.Value;
                if (int.TryParse(empIdClaim, out int empId))
                    request.ApprovedBy = empId;
            }

            var result = await _service.LeaveActionAsync(leaveId, request);
            if (!result)
                return BadRequest(new { Success = false, Message = "Action could not be performed" });

            return Ok(new { Success = true, Message = $"Leave request {request.Status} successfully" });
        }

        // GET api/leave/history/{empId}?year=2025
        [HttpGet("history/{empId}")]
        public async Task<IActionResult> GetLeaveHistory(int empId, [FromQuery] int? year)
        {
            var data = await _service.GetLeaveHistoryAsync(empId, year);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Payroll – Salary Structure, Processing, Payslip & Deductions

        // POST api/payroll/salary/set
        [HttpPost("salary/set")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> SetSalary([FromBody] EmployeeSalaryRequestDto request)
        {
            var salId = await _service.SetEmployeeSalaryAsync(request);
            return Ok(new { Success = true, Message = "Salary structure saved successfully", SalId = salId });
        }

        // GET api/payroll/salary/{empId}
        [HttpGet("salary/{empId}")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetSalary(int empId)
        {
            var data = await _service.GetEmployeeSalaryAsync(empId);
            if (data == null)
                return NotFound(new { Success = false, Message = "Salary structure not found for this employee" });
            return Ok(new { Success = true, Data = data });
        }

        // GET api/payroll/structures
        [HttpGet("structures")]
        public async Task<IActionResult> GetStructures()
        {
            var data = await _service.GetSalaryStructuresAsync();
            return Ok(new { Success = true, Data = data });
        }

        // ── Payroll Processing ────────────────────────────────

        // POST api/payroll/generate
        [HttpPost("generate")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GeneratePayroll([FromBody] PayrollGenerateRequestDto request)
        {
            var payrollId = await _service.GeneratePayrollAsync(request);
            return Ok(new { Success = true, Message = "Payroll generated successfully", PayrollId = payrollId });
        }

        // GET api/payroll/months
        [HttpGet("months")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetPayrollMonths()
        {
            var data = await _service.GetPayrollMonthsAsync();
            return Ok(new { Success = true, Data = data });
        }

        // GET api/payroll/details?month=6&year=2026&empId=
        [HttpGet("details")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetPayrollDetails(
            [FromQuery] int month,
            [FromQuery] int year,
            [FromQuery] int? empId)
        {
            var data = await _service.GetPayrollDetailsAsync(month, year, empId);
            return Ok(new { Success = true, Data = data });
        }

        // POST api/payroll/finalize
        [HttpPost("finalize")]
        [Authorize(Roles = PayrollFinalizeRoles)]
        public async Task<IActionResult> FinalizePayroll([FromBody] PayrollFinalizeRequestDto request)
        {
            if (request.ApprovedBy <= 0)
            {
                var empIdClaim = User.FindFirst("emp_id")?.Value;
                if (int.TryParse(empIdClaim, out int empId))
                    request.ApprovedBy = empId;
            }

            var count = await _service.FinalizePayrollAsync(request);
            return Ok(new { Success = true, Message = $"Payroll finalized for {count} employees" });
        }

        // POST api/payroll/markpaid?month=6&year=2026
        [HttpPost("markpaid")]
        [Authorize(Roles = PayrollMarkPaidRoles)]
        public async Task<IActionResult> MarkPaid(
            [FromQuery] int month,
            [FromQuery] int year)
        {
            var result = await _service.MarkPaidAsync(month, year);
            return Ok(new { Success = result, Message = "Payroll marked as paid" });
        }

        // ── Payslip ───────────────────────────────────────────

        // GET api/payroll/payslip/{empId}?month=6&year=2026
        [HttpGet("payslip/{empId}")]
        public async Task<IActionResult> GetPayslip(
            int empId,
            [FromQuery] int month,
            [FromQuery] int year)
        {
            var data = await _service.GetPayslipAsync(empId, month, year);
            if (data == null)
                return NotFound(new { Success = false, Message = "Payslip not found" });
            return Ok(new { Success = true, Data = data });
        }

        // ── Salary Deductions (Penalties) ─────────────────────

        // POST api/payroll/deductions/add
        [HttpPost("deductions/add")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> AddDeduction([FromBody] SalaryDeductionRequestDto request)
        {
            if (request.CreatedBy <= 0)
            {
                var empIdClaim = User.FindFirst("emp_id")?.Value;
                if (int.TryParse(empIdClaim, out int empId))
                    request.CreatedBy = empId;
            }

            var deductionId = await _service.AddDeductionAsync(request);
            return Ok(new { Success = true, Message = "Deduction added successfully", DeductionId = deductionId });
        }

        // PATCH api/payroll/deductions/action
        [HttpPatch("deductions/action")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> DeductionAction([FromBody] SalaryDeductionActionDto request)
        {
            if (request.ApprovedBy <= 0)
            {
                var empIdClaim = User.FindFirst("emp_id")?.Value;
                if (int.TryParse(empIdClaim, out int empId))
                    request.ApprovedBy = empId;
            }

            var result = await _service.DeductionActionAsync(request);
            if (!result)
                return NotFound(new { Success = false, Message = "Deduction not found" });

            return Ok(new { Success = true, Message = $"Deduction {request.Status} successfully" });
        }

        // GET api/payroll/deductions?empId=&month=&year=&status=
        [HttpGet("deductions")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetDeductions([FromQuery] int? empId, [FromQuery] int? month, [FromQuery] int? year, [FromQuery] string? status)
        {
            var data = await _service.GetDeductionsAsync(empId, month, year, status);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/admin/salary/all
        [HttpGet("salary/all")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetAllEmployeeSalaries()
        {
            var data = await _service.GetAllEmployeeSalariesAsync();
            return Ok(new { Success = true, Data = data });
        }
        #endregion

        #region Employee Loans / Advances (CRUD + Approval + Closure)

        // POST api/payroll/loans
        [HttpPost("loans")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> CreateLoan([FromBody] LoanRequestDto request)
        {
            var loanId = await _service.CreateLoanAsync(request);
            return Ok(new { Success = true, Message = "Loan/Advance request created successfully", LoanId = loanId });
        }

        // GET api/payroll/loans/employee/{empId}
        [HttpGet("loans/employee/{empId}")]
        public async Task<IActionResult> GetLoansByEmp(int empId)
        {
            var data = await _service.GetLoansByEmpAsync(empId);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/payroll/loans?status=Active
        [HttpGet("loans")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> GetAllLoans([FromQuery] string? status)
        {
            var data = await _service.GetAllLoansAsync(status);
            return Ok(new { Success = true, Data = data });
        }

        // PATCH api/payroll/loans/action
        [HttpPatch("loans/action")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> LoanAction([FromBody] LoanActionDto request)
        {
            if (request.ApprovedBy <= 0)
            {
                var empIdClaim = User.FindFirst("emp_id")?.Value;
                if (int.TryParse(empIdClaim, out int empId))
                    request.ApprovedBy = empId;
            }

            var result = await _service.LoanActionAsync(request);
            return Ok(new { Success = result, Message = $"Loan {request.Status} successfully" });
        }

        // PATCH api/payroll/loans/close
        [HttpPatch("loans/close")]
        [Authorize(Roles = PayrollViewRoles)]
        public async Task<IActionResult> CloseLoan([FromBody] LoanCloseDto request)
        {
            var result = await _service.CloseLoanAsync(request);
            return Ok(new { Success = result, Message = "Loan closed successfully" });
        }

        #endregion

        #region Overtime – Requests & Approval
        // (Place in Attendance controller, alongside regularization endpoints)

        // POST api/attendance/overtime
        [HttpPost("overtime")]
        public async Task<IActionResult> CreateOvertime([FromBody] OvertimeRequestDto request)
        {
            var otId = await _service.CreateOvertimeAsync(request);
            return Ok(new { Success = true, Message = "Overtime request submitted successfully", OtId = otId });
        }

        // GET api/attendance/overtime?empId=&status=&fromDate=&toDate=
        [HttpGet("overtime")]
        // [Authorize(Roles = HrManagerApprovalRoles)]
        [Authorize(Roles = HrManageRoles + "," + Roles.Employee)]
        public async Task<IActionResult> GetAllOvertime(
            [FromQuery] int? empId,
            [FromQuery] string? status,
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var data = await _service.GetAllOvertimeAsync(empId, status, fromDate, toDate);
            return Ok(new { Success = true, Data = data });
        }

        // PATCH api/attendance/overtime/action
        [HttpPatch("overtime/action")]
        [Authorize(Roles = HrManagerApprovalRoles)]
        public async Task<IActionResult> OvertimeAction([FromBody] OvertimeActionDto request)
        {
            if (request.ApprovedBy <= 0)
            {
                var empIdClaim = User.FindFirst("emp_id")?.Value;
                if (int.TryParse(empIdClaim, out int empId))
                    request.ApprovedBy = empId;
            }

            var result = await _service.OvertimeActionAsync(request);
            return Ok(new { Success = result, Message = $"Overtime request {request.Status} successfully" });
        }

        #endregion

        #region Attendance – Late Mark Rule Configuration
        // (Place in Payroll or Attendance controller — your call)

        // POST api/payroll/late-mark-rule
        [HttpPost("late-mark-rule")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> CreateLateMarkRule([FromBody] LateMarkRuleRequestDto request)
        {
            var ruleId = await _service.CreateLateMarkRuleAsync(request);
            return Ok(new { Success = true, Message = "Late mark rule saved successfully", RuleId = ruleId });
        }

        // GET api/payroll/late-mark-rule/active
        [HttpGet("late-mark-rule/active")]
        public async Task<IActionResult> GetActiveLateMarkRule()
        {
            var data = await _service.GetActiveLateMarkRuleAsync();
            if (data == null)
                return NotFound(new { Success = false, Message = "No active late mark rule configured" });
            return Ok(new { Success = true, Data = data });
        }

        // GET api/payroll/late-mark-rule/history
        [HttpGet("late-mark-rule/history")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> GetAllLateMarkRules()
        {
            var data = await _service.GetAllLateMarkRulesAsync();
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Recruitment – Job Requisition (Create + Approval Workflow)

        // POST api/recruitment/requisitions
        [HttpPost("requisitions")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> CreateRequisition([FromBody] JobRequisitionRequestDto request)
        {
            var id = await _service.CreateRequisitionAsync(request);
            return Ok(new { Success = true, Message = "Requisition submitted successfully", RequisitionId = id });
        }

        // PATCH api/recruitment/requisitions/action
        [HttpPatch("requisitions/action")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> ActionRequisition([FromBody] JobRequisitionActionDto request)
        {
            var result = await _service.ActionRequisitionAsync(request);
            if (!result)
                return NotFound(new { Success = false, Message = "Requisition not found" });
            return Ok(new { Success = true, Message = $"Requisition {request.Status} at {request.Stage} stage" });
        }

        // GET api/recruitment/requisitions?status=Pending
        [HttpGet("requisitions")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> GetAllRequisitions([FromQuery] string? status)
        {
            var data = await _service.GetAllRequisitionsAsync(status);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/recruitment/requisitions/5
        [HttpGet("requisitions/{id}")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> GetRequisitionById(int id)
        {
            var data = await _service.GetRequisitionByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Requisition not found" });
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Recruitment – Job Posting (Public Career Page + Reports)

        [HttpPost("postings")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> CreateJobPosting([FromBody] JobPostingRequestDto request)
        {
            request.CreatedBy = int.Parse(User.FindFirst("UserId")?.Value ?? "0");
            var id = await _service.CreateJobPostingAsync(request);
            return Ok(new { Success = true, Message = "Job posted successfully", PostingId = id });
        }
        // PUT api/recruitment/postings
        [HttpPut("postings")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> UpdateJobPosting([FromBody] JobPostingUpdateRequestDto request)
        {
            var updated = await _service.UpdateJobPostingAsync(request);
            if (!updated)
                return NotFound(new { Success = false, Message = "Job posting not found" });
            return Ok(new { Success = true, Message = "Job posting updated successfully" });
        }

        // GET api/recruitment/postings?publishedOnly=true  (public career page)
        [HttpGet("postings")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllJobPostings([FromQuery] bool? publishedOnly)
        {
            var data = await _service.GetAllJobPostingsAsync(publishedOnly);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/recruitment/postings/5  (public)
        [HttpGet("postings/{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetJobPostingById(int id)
        {
            var data = await _service.GetJobPostingByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Job posting not found" });
            return Ok(new { Success = true, Data = data });
        }

        // Recruitment Status Report
        // GET api/admin/reports/recruitment-status?fromDate=&toDate=

        [HttpGet("reports/recruitment-status")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> GetRecruitmentStatusReport(
            [FromQuery] DateTime? fromDate,
            [FromQuery] DateTime? toDate)
        {
            var data = await _service.GetRecruitmentStatusReportAsync(fromDate, toDate);
            return Ok(new { Success = true, Data = data });
        }

        #endregion

        #region Recruitment – Candidate Application (Public)

        // POST api/recruitment/apply  (public — candidate facing)
        [HttpPost("apply")]
        [AllowAnonymous]
        public async Task<IActionResult> Apply([FromBody] CandidateApplicationRequestDto request)
        {
            var (id, applicationCode) = await _service.ApplyAsync(request);
            return Ok(new
            {
                Success = true,
                Message = "Application submitted successfully. Acknowledgement email sent.",
                CandidateId = id,
                ApplicationCode = applicationCode
            });
        }

        #endregion

        #region Recruitment – Candidate Search & Status Update

        // GET api/recruitment/candidates?status=Shortlisted&jobPostingId=3
        [HttpGet("candidates")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> SearchCandidates([FromQuery] CandidateSearchRequestDto filter)
        {
            var data = await _service.SearchCandidatesAsync(filter);
            return Ok(new { Success = true, Data = data });
        }

        // GET api/recruitment/candidates/5
        [HttpGet("candidates/{id}")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> GetCandidateById(int id)
        {
            var data = await _service.GetCandidateByIdAsync(id);
            if (data == null)
                return NotFound(new { Success = false, Message = "Candidate not found" });
            return Ok(new { Success = true, Data = data });
        }

        // PATCH api/recruitment/candidates/status
        [HttpPatch("candidates/status")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> UpdateCandidateStatus([FromBody] CandidateStatusUpdateDto request)
        {
            var updated = await _service.UpdateCandidateStatusAsync(request);
            if (!updated)
                return NotFound(new { Success = false, Message = "Candidate not found" });
            return Ok(new { Success = true, Message = $"Candidate status updated to {request.Status}" });
        }

        #endregion

        #region Recruitment – Interview Scheduling, Feedback & Selection Approval

        // POST api/recruitment/interviews
        [HttpPost("interviews")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> ScheduleInterview([FromBody] InterviewScheduleRequestDto request)
        {
            var id = await _service.ScheduleInterviewAsync(request);
            return Ok(new { Success = true, Message = "Interview scheduled successfully", InterviewId = id });
        }

        // PATCH api/recruitment/interviews/feedback
        [HttpPatch("interviews/feedback")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> SubmitInterviewFeedback([FromBody] InterviewFeedbackRequestDto request)
        {
            var updated = await _service.SubmitInterviewFeedbackAsync(request);

            return Ok(new { Success = true, Message = "Feedback submitted successfully" });
        }

        // GET api/recruitment/interviews/candidate/5
        [HttpGet("interviews/candidate/{candidateId}")]
        [Authorize(Roles = HrRecruitRoles)]
        public async Task<IActionResult> GetInterviewsByCandidate(int candidateId)
        {
            var data = await _service.GetInterviewsByCandidateAsync(candidateId);
            return Ok(new { Success = true, Data = data });
        }

        // PATCH api/recruitment/interviews/selection-approval
        [HttpPatch("interviews/selection-approval")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> SelectionApproval([FromBody] InterviewSelectionApprovalDto request)
        {
            if (request.ApprovedBy <= 0)
            {
                var empIdClaim = User.FindFirst("emp_id")?.Value;
                if (int.TryParse(empIdClaim, out int empId))
                    request.ApprovedBy = empId;
            }

            var result = await _service.SelectionApprovalAsync(request);
            if (!result)
                return NotFound(new { Success = false, Message = "Candidate not found" });
            return Ok(new { Success = true, Message = $"Candidate {request.Status} successfully" });
        }

        #endregion

        #region Recruitment – Offer Letter & Joining Confirmation

        // POST api/recruitment/offers
        [HttpPost("offers")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> CreateOffer([FromBody] OfferCreateRequestDto request)
        {
            var id = await _service.CreateOfferAsync(request);
            return Ok(new { Success = true, Message = "Offer created successfully", OfferId = id });
        }

        // PATCH api/recruitment/offers/action
        [HttpPatch("offers/action")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> ActionOffer([FromBody] OfferActionDto request)
        {
            var updated = await _service.OfferActionAsync(request);   // was ActionOfferAsync
            if (!updated)
                return NotFound(new { Success = false, Message = "Offer not found" });
            return Ok(new { Success = true, Message = $"Offer marked as {request.Status}" });
        }

        // GET api/recruitment/offers/candidate/5
        [HttpGet("offers/candidate/{candidateId}")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> GetOfferByCandidate(int candidateId)
        {
            var data = await _service.GetOfferByCandidateAsync(candidateId);
            if (data == null)
                return NotFound(new { Success = false, Message = "Offer not found" });
            return Ok(new { Success = true, Data = data });
        }


        [HttpPost("joining/confirm")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> ConfirmJoining(JoiningConfirmationRequestDto request)
        {
            var creatorRole = User.FindFirst(ClaimTypes.Role)?.Value
                ?? throw new UnauthorizedAccessException("Role claim missing.");

            var result = await _service.ConfirmJoiningAndConvertAsync(request, creatorRole);
            return Ok(new { Success = true, Data = result });
        }
        #endregion

        #region Employee Credential Reveal (Secret-Key Protected)

        [HttpPost("employees/{empId}/reveal-credentials")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> RevealCredentials(int empId, RevealCredentialsRequestDto request)
        {
            try
            {
                var (username, password) = await _service.RevealEmployeeCredentialsAsync(empId, request.SecretKey);
                return Ok(new { Success = true, Data = new { username, password } });
            }
            catch (UnauthorizedAccessException)
            {
                return Ok(new { Success = false, Message = "Invalid key." });
            }
        }
        #endregion

        #region Issue offer latter and appointemt latter

        // GET api/admin/candidates/5/offer-letter
        [HttpGet("candidates/{candidateId}/offer-letter")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> GetOfferLetter(int candidateId)
        {
            var bytes = await _service.GenerateOfferLetterAsync(candidateId);
            if (bytes == null)
                return NotFound(new { Success = false, Message = "Offer not found for this candidate" });

            return File(bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"Offer_Letter_{candidateId}.docx");
        }

        // GET api/admin/candidates/5/appointment-letter
        [HttpGet("candidates/{candidateId}/appointment-letter")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> GetAppointmentLetter(int candidateId)
        {
            var bytes = await _service.GenerateAppointmentLetterAsync(candidateId);
            if (bytes == null)
                return NotFound(new { Success = false, Message = "Offer not found for this candidate" });

            return File(bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"Appointment_Letter_{candidateId}.docx");
        }

        // GET api/admin/candidates/5/regularization-letter?effectiveDate=2026-08-08
        [HttpGet("candidates/{candidateId}/regularization-letter")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> GetRegularizationLetter(int candidateId, [FromQuery] DateTime effectiveDate)
        {
            var bytes = await _service.GenerateRegularizationLetterAsync(candidateId, effectiveDate);
            if (bytes == null)
                return NotFound(new { Success = false, Message = "Employee not found for this candidate" });

            return File(bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"Regularization_Letter_{candidateId}.docx");
        }

        // GET api/admin/candidates/5/relieving-letter
        [HttpGet("candidates/{candidateId}/relieving-letter")]
        [Authorize(Roles = HrManageRoles)]
        public async Task<IActionResult> GetRelievingLetter(int candidateId)
        {
            var bytes = await _service.GenerateRelievingLetterAsync(candidateId);
            if (bytes == null)
                return NotFound(new { Success = false, Message = "Employee not found or exit details missing" });

            return File(bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                $"Relieving_Letter_{candidateId}.docx");
        }

        #endregion

    }
}