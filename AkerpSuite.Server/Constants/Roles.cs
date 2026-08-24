using DocumentFormat.OpenXml.Bibliography;

namespace AkerpSuite.Server.Constants
{
    public static class Roles
    {
        public const string CMD = "CMD";
        public const string Employee = "Employee";

        public static bool CanView(bool viewerIsCmdEqual, string viewerRole, string targetRole)
        {
            if (viewerIsCmdEqual)
                return true;

            return string.Equals(viewerRole, targetRole, StringComparison.OrdinalIgnoreCase);
        }
    }
}
