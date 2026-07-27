using AkerpSuite.Server.Dtos.Auth;

namespace AkerpSuite.Server.Repositories
{
    public interface IAuthRepository
    {
        Task<UserDto?> GetUserByUsernameAsync(string username);
        Task UpdateLastLoginAsync(int userId);
        Task InsertAuditLogAsync(int? userId, string action, string? ipAddress);

        // ✅ NAYA ADD — forgot/reset password ke liye
        Task<UserDto?> GetUserByEmailAsync(string email);
        Task SavePasswordResetTokenAsync(int userId, string token, DateTime expiresAt);
        Task<PasswordResetTokenDto?> GetValidPasswordResetTokenAsync(string token);
        Task UpdateUserPasswordAsync(int userId, string passwordHash);
        Task MarkResetTokenUsedAsync(int tokenId);
    }
}