using AkerpSuite.Server.Dtos.Auth;
using AkerpSuite.Server.DTOs;
using AkerpSuite.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace AkerpSuite.Server.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        #region Login 

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request"));

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var result = await _authService.LoginAsync(request, ipAddress);

            if (result == null)
                return Unauthorized(ApiResponseDto<object>.Fail("Invalid username or password"));

            return Ok(ApiResponseDto<LoginResponseDto>.Ok(result, "Login successful"));
        }

        #endregion

        #region Forgot / Reset Password

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request"));

            await _authService.ForgotPasswordAsync(request.Email);

            // Generic message — security best practice, email exist kare ya na kare
            return Ok(ApiResponseDto<object>.Ok(null, "If this email is registered, a reset link has been sent."));
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request"));

            if (request.NewPassword != request.ConfirmPassword)
                return BadRequest(ApiResponseDto<object>.Fail("Passwords do not match"));

            try
            {
                await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
                return Ok(ApiResponseDto<object>.Ok(null, "Password reset successful"));
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ApiResponseDto<object>.Fail(ex.Message));
            }
        }

        #endregion

    }
}