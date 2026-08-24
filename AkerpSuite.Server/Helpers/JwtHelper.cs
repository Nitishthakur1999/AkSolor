using AkerpSuite.Server.Dtos.Auth;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AkerpSuite.Server.Helpers
{
    public class JwtHelper
    {
        private readonly IConfiguration _configuration;

        public JwtHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public (string token, DateTime expiresAt) GenerateToken(UserDto user)
        {
            if (string.IsNullOrWhiteSpace(user.RoleName))
            {
                throw new InvalidOperationException(
                    $"Cannot generate token: user {user.UserId} has no role assigned.");
            }

            var jwtSettings = _configuration.GetSection("Jwt");

            var keyString = jwtSettings["Key"]
                ?? throw new InvalidOperationException("Jwt:Key is not configured.");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var expiresAt = DateTime.UtcNow.AddHours(
                Convert.ToDouble(jwtSettings["ExpiryHours"] ?? "8"));

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.RoleName.Trim()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("RoleId", user.RoleId.ToString()),   
            };

            if (user.EmployeeId.HasValue)
            {
                claims.Add(new Claim("EmployeeId", user.EmployeeId.Value.ToString()));
            }

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            return (
                new JwtSecurityTokenHandler().WriteToken(token),
                expiresAt
            );
        }
    }
}