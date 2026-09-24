using AkerpSuite.Server.Dtos.Auth;
using AkerpSuite.Server.DTOs.Role;
using AkerpSuite.Server.Helpers;
using AkerpSuite.Server.Repositories;
using System.Security.Cryptography;
using System.Text;

namespace AkerpSuite.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly IAuthRepository _authRepository;
        private readonly JwtHelper _jwtHelper;
        private readonly IAdminRepositories _adminRepository;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public AuthService(
            IAuthRepository authRepository,
            JwtHelper jwtHelper,
            IAdminRepositories adminRepository,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _authRepository = authRepository;
            _jwtHelper = jwtHelper;
            _adminRepository = adminRepository;
            _emailService = emailService;
            _configuration = configuration;
        }


        //public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, string? ipAddress)
        //{
        //    var trimmedUsername = request.Username?.Trim() ?? string.Empty;
        //    var trimmedPassword = request.Password?.Trim() ?? string.Empty;

        //    var user = await _authRepository.GetUserByUsernameAsync(trimmedUsername);
        //    if (user == null) return null;

        //    bool isValid = BCrypt.Net.BCrypt.Verify(trimmedPassword, user.PasswordHash);
        //    if (!isValid) return null;
        //    if (!user.IsActive) return null;

        //    await _authRepository.UpdateLastLoginAsync(user.UserId);
        //    await _authRepository.InsertAuditLogAsync(user.UserId, "LOGIN", ipAddress);
        //    var (token, expiresAt) = _jwtHelper.GenerateToken(user);
        //    var pages = await _adminRepository.GetPagesByRoleAsync(user.RoleId);

        //    return new LoginResponseDto
        //    {
        //        Token = token,
        //        UserId = user.UserId,
        //        Username = user.Username,
        //        Role = user.RoleName,
        //        EmployeeId = user.EmployeeId,
        //        ExpiresAt = expiresAt,
        //        Pages = pages.ToList()
        //    };
        //}

        public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, string? ipAddress)
        {
            var trimmedUsername = request.Username?.Trim() ?? string.Empty;
            var trimmedPassword = request.Password?.Trim() ?? string.Empty;

            var user = await _authRepository.GetUserByUsernameAsync(trimmedUsername);
            if (user == null) return null;

            bool isValid = BCrypt.Net.BCrypt.Verify(trimmedPassword, user.PasswordHash);
            if (!isValid) return null;
            if (!user.IsActive) return null;

            await _authRepository.UpdateLastLoginAsync(user.UserId);
            await _authRepository.InsertAuditLogAsync(user.UserId, "LOGIN", ipAddress);

            return await IssueTokensAsync(user, ipAddress);
        }

        public async Task<bool> ForgotPasswordAsync(string email)
        {
            var user = await _authRepository.GetUserByEmailAsync(email);

            if (user == null || !user.IsActive)
                return true;

            var token = GenerateSecureToken();
            var expiresAt = DateTime.UtcNow.AddMinutes(30);

            await _authRepository.SavePasswordResetTokenAsync(user.UserId, token, expiresAt);

            var frontendUrl = _configuration["AppSettings:FrontendUrl"] ?? "https://localhost:4200";
            var resetLink = $"{frontendUrl}/reset-password?token={token}";

            var subject = "Password Reset Request – AkerpSuite";
            var body = $@"
            <p>Hello {user.Username},</p>
            <p>We received a request to reset your password. Click the link below:</p>
            <p><a href='{resetLink}'>Reset Password</a></p>
            <p>This link will expire in 30 minutes. If you didn't request this, please ignore this email.</p>";

            await _emailService.SendEmailAsync(email, subject, body);

            return true;
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            var resetEntry = await _authRepository.GetValidPasswordResetTokenAsync(token);
            if (resetEntry == null)
                throw new InvalidOperationException("Invalid or expired reset token.");

            var passwordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

            await _authRepository.UpdateUserPasswordAsync(resetEntry.UserId, passwordHash);
            await _authRepository.MarkResetTokenUsedAsync(resetEntry.TokenId);

            return true;
        }

        private static string GenerateSecureToken()
        {
            var bytes = new byte[32];
            using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes)
                .Replace("+", "-").Replace("/", "_").Replace("=", "");
        }

        public async Task<LoginResponseDto?> RefreshTokenAsync(string refreshToken, string? ipAddress)
        {
            var oldHash = HashToken(refreshToken);
            var stored = await _authRepository.GetRefreshTokenAsync(oldHash);
            if (stored == null) return null;

            // Revoked token dobara aaya = chori ka shak, saare sessions band
            if (stored.RevokedAt != null)
            {
                await _authRepository.RevokeAllUserRefreshTokensAsync(stored.UserId);
                return null;
            }

            if (stored.ExpiresAt < DateTime.UtcNow) return null;

            var user = await _authRepository.GetUserByIdAsync(stored.UserId);
            if (user == null || !user.IsActive) return null;

            // Rotation: purana revoke, naya issue
            return await IssueTokensAsync(user, ipAddress, oldHashToRevoke: oldHash);
        }

        public async Task LogoutAsync(string refreshToken, string? ipAddress)
        {
            var hash = HashToken(refreshToken);
            var stored = await _authRepository.GetRefreshTokenAsync(hash);
            if (stored == null) return;

            await _authRepository.RevokeRefreshTokenAsync(hash);
            await _authRepository.InsertAuditLogAsync(stored.UserId, "LOGOUT", ipAddress);
        }

        public Task CleanupExpiredRefreshTokensAsync() =>
            _authRepository.DeleteExpiredRefreshTokensAsync();
    
    private async Task<LoginResponseDto> IssueTokensAsync(
    UserDto user, string? ipAddress, string? oldHashToRevoke = null)
        {
            var (token, expiresAt) = _jwtHelper.GenerateToken(user);
            var pages = await _adminRepository.GetPagesByRoleAsync(user.RoleId);

            var refreshDays = int.Parse(_configuration["Jwt:RefreshTokenDays"] ?? "7");
            var refreshToken = GenerateRefreshToken();
            var refreshHash = HashToken(refreshToken);
            var refreshExpires = DateTime.UtcNow.AddDays(refreshDays);

            await _authRepository.SaveRefreshTokenAsync(user.UserId, refreshHash, refreshExpires, ipAddress);

            if (oldHashToRevoke != null)
                await _authRepository.RevokeRefreshTokenAsync(oldHashToRevoke, refreshHash);

            return new LoginResponseDto
            {
                Token = token,
                ExpiresAt = expiresAt,
                RefreshToken = refreshToken,
                RefreshTokenExpiresAt = refreshExpires,
                UserId = user.UserId,
                Username = user.Username,
                Role = user.RoleName,
                EmployeeId = user.EmployeeId,
                Pages = pages.ToList()
            };
        }

        private static string GenerateRefreshToken() =>
            Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        private static string HashToken(string token) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }

}