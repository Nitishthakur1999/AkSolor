using AkerpSuite.Server.DTOs.Role;

namespace AkerpSuite.Server.Dtos.Auth
{
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int? EmployeeId { get; set; }
        public DateTime ExpiresAt { get; set; }
        public List<PageMasterResponseDto> Pages { get; set; } = new();

    }
}