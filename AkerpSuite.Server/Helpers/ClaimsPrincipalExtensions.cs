using System.Security.Claims;

namespace AkerpSuite.Server.Helpers
{
    public static class ClaimsPrincipalExtensions
    {
        private const string EmployeeIdClaimType = "EmployeeId";

        public static int GetEmpId(this ClaimsPrincipal user)
        {
            var claim = user.FindFirst(EmployeeIdClaimType);

            if (claim == null || !int.TryParse(claim.Value, out var empId) || empId <= 0)
                throw new InvalidOperationException("This account is not linked to an employee record, so Self-Service is not available.");

            return empId;
        }

        public static bool TryGetEmpId(this ClaimsPrincipal user, out int empId)
        {
            empId = 0;
            var claim = user.FindFirst(EmployeeIdClaimType);
            return claim != null && int.TryParse(claim.Value, out empId) && empId > 0;
        }

        public static int GetUserId(this ClaimsPrincipal user)
        {
            var claim = user.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null || !int.TryParse(claim.Value, out var userId))
                throw new UnauthorizedAccessException("User identity not found in token.");

            return userId;
        }
        public static string GetRole(this ClaimsPrincipal user)
        {
            var claim = user.FindFirst(ClaimTypes.Role);

            if (claim == null || string.IsNullOrWhiteSpace(claim.Value))
                throw new UnauthorizedAccessException("Role claim not found in token.");

            return claim.Value;
        }
    }
}