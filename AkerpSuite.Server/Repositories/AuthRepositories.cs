using System.Data;
using AkerpSuite.Server.Data;
using AkerpSuite.Server.Dtos.Auth;
using Dapper;
using Microsoft.Extensions.Logging;

namespace AkerpSuite.Server.Repositories
{
    public class AuthRepositories : IAuthRepository
    {
        private readonly DapperContext _context;
        private readonly ILogger<AuthRepositories> _logger;

        public AuthRepositories(DapperContext context, ILogger<AuthRepositories> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<UserDto?> GetUserByUsernameAsync(string username)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_Username", username);

            return await connection.QueryFirstOrDefaultAsync<UserDto>(
                "sp_GetUserByUsername",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task UpdateLastLoginAsync(int userId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_UserId", userId);

            await connection.ExecuteAsync(
                "sp_UpdateLastLogin",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task InsertAuditLogAsync(int? userId, string action, string? ipAddress)
        {
            try
            {
                using var connection = _context.CreateConnection();
                var parameters = new DynamicParameters();
                parameters.Add("p_UserId", userId);
                parameters.Add("p_TableName", "users");
                parameters.Add("p_RecordId", userId);
                parameters.Add("p_Action", action);
                parameters.Add("p_IpAddress", ipAddress);

                await connection.ExecuteAsync(
                    "sp_InsertAuditLog",
                    parameters,
                    commandType: CommandType.StoredProcedure);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to insert audit log for UserId {UserId}, Action {Action}", userId, action);
            }
        }
        public async Task<UserDto?> GetUserByEmailAsync(string email)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_Email", email);

            return await connection.QueryFirstOrDefaultAsync<UserDto>(
                "sp_GetUserByEmail",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task SavePasswordResetTokenAsync(int userId, string token, DateTime expiresAt)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_UserId", userId);
            parameters.Add("p_Token", token);
            parameters.Add("p_ExpiresAt", expiresAt);

            await connection.ExecuteAsync(
                "sp_SavePasswordResetToken",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task<PasswordResetTokenDto?> GetValidPasswordResetTokenAsync(string token)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_Token", token);

            return await connection.QueryFirstOrDefaultAsync<PasswordResetTokenDto>(
                "sp_GetValidPasswordResetToken",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task UpdateUserPasswordAsync(int userId, string passwordHash)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_UserId", userId);
            parameters.Add("p_PasswordHash", passwordHash);

            await connection.ExecuteAsync(
                "sp_UpdateUserPassword",
                parameters,
                commandType: CommandType.StoredProcedure);
        }

        public async Task MarkResetTokenUsedAsync(int tokenId)
        {
            using var connection = _context.CreateConnection();
            var parameters = new DynamicParameters();
            parameters.Add("p_TokenId", tokenId);

            await connection.ExecuteAsync(
                "sp_MarkResetTokenUsed",
                parameters,
                commandType: CommandType.StoredProcedure);
        }
    }
}