using AkerpSuite.Server.Data;
using Dapper;

namespace AkerpSuite.Server.Repositories
{
    public class PermissionRepository : IPermissionRepository
    {
        private readonly DapperContext _context;
        public PermissionRepository(DapperContext context) => _context = context;

        public async Task<bool> HasPermissionAsync(int roleId, string moduleName, string permissionName)
        {
            using var conn = _context.CreateConnection();
            var count = await conn.ExecuteScalarAsync<int>(@"
                SELECT COUNT(1) FROM role_permissions rp
                INNER JOIN permissions p ON p.permission_id = rp.permission_id
                WHERE rp.role_id = @RoleId
                  AND p.module_name = @ModuleName
                  AND p.permission_name = @PermissionName
                  AND p.is_active = 1",
                new { RoleId = roleId, ModuleName = moduleName, PermissionName = permissionName });
            return count > 0;
        }

        public async Task<List<string>> GetPermissionKeysByRoleAsync(int roleId)
        {
            using var conn = _context.CreateConnection();
            var rows = await conn.QueryAsync<(string ModuleName, string PermissionName)>(@"
                SELECT p.module_name AS ModuleName, p.permission_name AS PermissionName
                FROM role_permissions rp
                INNER JOIN permissions p ON p.permission_id = rp.permission_id
                WHERE rp.role_id = @RoleId AND p.is_active = 1",
                new { RoleId = roleId });
            return rows.Select(r => $"{r.ModuleName}.{r.PermissionName}").ToList();
        }
    }
}