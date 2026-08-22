using AkerpSuite.Server.Dtos.Auth;
using AkerpSuite.Server.DTOs.Role;
using AkerpSuite.Server.Helpers;
using AkerpSuite.Server.Repositories;

namespace AkerpSuite.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly IAuthRepository _authRepository;
        private readonly JwtHelper _jwtHelper;
        private readonly IAdminRepositories _adminRepository;
        private readonly IEmailService _emailService;       // ✅ ADD
        private readonly IConfiguration _configuration;      // ✅ ADD

        public AuthService(
            IAuthRepository authRepository,
            JwtHelper jwtHelper,
            IAdminRepositories adminRepository,
            IEmailService emailService,                       // ✅ ADD
            IConfiguration configuration)                      // ✅ ADD
        {
            _authRepository = authRepository;
            _jwtHelper = jwtHelper;
            _adminRepository = adminRepository;
            _emailService = emailService;                     // ✅ ADD
            _configuration = configuration;                    // ✅ ADD
        }

        //public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto request,string? ipAddress)
        //{
        //    var user = await _authRepository.GetUserByUsernameAsync(request.Username);
        //    if (user == null)return null;
        //    bool isValid = BCrypt.Net.BCrypt.Verify(request.Password,user.PasswordHash);
        //    if (!isValid)return null;
        //    if (!user.IsActive)return null;

        //    await _authRepository.UpdateLastLoginAsync(user.UserId);
        //    await _authRepository.InsertAuditLogAsync(user.UserId,"LOGIN",ipAddress);
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
            var (token, expiresAt) = _jwtHelper.GenerateToken(user);
            var pages = await _adminRepository.GetPagesByRoleAsync(user.RoleId);

            return new LoginResponseDto
            {
                Token = token,
                UserId = user.UserId,
                Username = user.Username,
                Role = user.RoleName,
                EmployeeId = user.EmployeeId,
                ExpiresAt = expiresAt,
                Pages = pages.ToList()
            };
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
    }
}