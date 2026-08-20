using AkerpSuite.Server.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AkerpSuite.Server.Helpers
{
    public class RequirePermissionAttribute : TypeFilterAttribute
    {
        public RequirePermissionAttribute(string moduleName, string permissionName)
            : base(typeof(PermissionAuthFilter))
        {
            Arguments = new object[] { moduleName, permissionName };
        }
    }

    public class PermissionAuthFilter : IAsyncActionFilter
    {
        private readonly string _moduleName;
        private readonly string _permissionName;
        private readonly IPermissionRepository _permissionRepo;

        public PermissionAuthFilter(string moduleName, string permissionName, IPermissionRepository permissionRepo)
        {
            _moduleName = moduleName;
            _permissionName = permissionName;
            _permissionRepo = permissionRepo;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var roleIdClaim = context.HttpContext.User.FindFirst("RoleId")?.Value;
            if (string.IsNullOrEmpty(roleIdClaim) || !int.TryParse(roleIdClaim, out int roleId))
            {
                context.Result = new UnauthorizedObjectResult(new { Success = false, Message = "Invalid token — RoleId missing" });
                return;
            }

            bool allowed = await _permissionRepo.HasPermissionAsync(roleId, _moduleName, _permissionName);
            if (!allowed)
            {
                context.Result = new ObjectResult(new { Success = false, Message = "Access denied" }) { StatusCode = 403 };
                return;
            }

            await next();
        }
    }
}