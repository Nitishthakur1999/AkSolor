namespace AkerpSuite.Server.Constants
{
    public static class Roles
    {
        public const string CMD = "CMD";
        public const string Admin = "Admin";
        public const string HR = "HR";
        public const string Manager = "Manager";
        public const string Accounts = "Accounts";
        public const string Sales = "Sales";
        public const string Inventory = "Inventory";
        public const string Employee = "Employee";

        public static readonly Dictionary<string, int> HierarchyLevel = new()
        {
            { CMD, 1 },
            { Admin, 2 },
            { HR, 3 },
            { Manager, 4 },
            { Accounts, 4 },
            { Sales, 4 },
            { Inventory, 4 },
            { Employee, 5 }
        };

        public static int GetLevel(string role) =>
            HierarchyLevel.TryGetValue(role, out var level) ? level : int.MaxValue;

        public static bool CanView(string viewerRole, string targetRole) =>
            GetLevel(targetRole) >= GetLevel(viewerRole);
    }
}