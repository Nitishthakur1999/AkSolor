using System.Net;
using System.Text.Json;

namespace AkerpSuite.Server.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;
        private readonly IWebHostEnvironment _environment;

        public GlobalExceptionMiddleware(
            RequestDelegate next,
            ILogger<GlobalExceptionMiddleware> logger,
            IWebHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ex.Message);

                var (statusCode, message) = MapException(ex);

                await HandleException(context, statusCode, message);
            }
        }

        private (HttpStatusCode statusCode, string message) MapException(Exception ex)
        {
            return ex switch
            {
                InvalidOperationException => (HttpStatusCode.BadRequest, ex.Message),
                ArgumentException => (HttpStatusCode.BadRequest, ex.Message),
                KeyNotFoundException => (HttpStatusCode.NotFound, ex.Message),
                UnauthorizedAccessException => (HttpStatusCode.Forbidden, ex.Message),

                // ✅ SIGNAL se aane wali custom SP errors (45000)
                MySqlConnector.MySqlException mysqlEx when mysqlEx.SqlState == "45000"
                    => (HttpStatusCode.BadRequest, mysqlEx.Message),

                // ✅ Duplicate entry errors
                MySqlConnector.MySqlException mysqlEx when mysqlEx.Message.Contains("Duplicate entry")
                    => (HttpStatusCode.BadRequest, ParseMySqlDuplicateError(mysqlEx.Message)),

                _ => (HttpStatusCode.InternalServerError,
                      _environment.IsDevelopment() ? ex.Message : "Internal Server Error")
            };
        }

        // ✅ Yeh new method add karo class ke andar
        private static string ParseMySqlDuplicateError(string mysqlMessage)
        {
            if (mysqlMessage.Contains("username"))
                return "This username already exists.";
            if (mysqlMessage.Contains("official_email") || mysqlMessage.Contains("email"))
                return "This email already exists.";
            if (mysqlMessage.Contains("emp_code"))
                return "This employee code already exists.";
            if (mysqlMessage.Contains("role_name"))
                return "A role with this name already exists.";
            if (mysqlMessage.Contains("dept_name") || mysqlMessage.Contains("dept_code"))
                return "This department already exists.";

            return "A duplicate entry already exists.";
        }

        private static async Task HandleException(
            HttpContext context,
            HttpStatusCode statusCode,
            string message)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var response = new
            {
                Success = false,
                StatusCode = (int)statusCode,
                Message = message
            };

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(response));
        }
    }
}