namespace AkerpSuite.Server.Repositories
{
    public interface IPermissionRepository
    {
        Task<bool> HasPermissionAsync(int roleId, string moduleName, string permissionName);
        Task<List<string>> GetPermissionKeysByRoleAsync(int roleId);
    }
}
