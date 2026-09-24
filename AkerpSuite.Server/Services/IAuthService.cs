using AkerpSuite.Server.Dtos.Auth;

namespace AkerpSuite.Server.Services
{
    public interface IAuthService
    {
        Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, string? ipAddress);
        Task<bool> ForgotPasswordAsync(string email);
        Task<bool> ResetPasswordAsync(string token, string newPassword);

        Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken, string? ipAddress);
        Task LogoutAsync(string refreshToken, string? ipAddress);
        Task CleanupExpiredRefreshTokensAsync();
    }
}