using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AkerpSuite.Server.Services
{
 
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            await SendEmailAsync(new[] { toEmail }, subject, htmlBody);
        }

        public async Task SendEmailAsync(IEnumerable<string> toEmails, string subject, string htmlBody)
        {
            var recipients = toEmails?.Where(e => !string.IsNullOrWhiteSpace(e)).ToList();

            if (recipients == null || !recipients.Any())
            {
                _logger.LogWarning("SendEmailAsync called with no recipients. Subject: {Subject}", subject);
                return;
            }

            var host = _configuration["Smtp:Host"];
            var port = int.Parse(_configuration["Smtp:Port"] ?? "587");
            var enableSsl = bool.Parse(_configuration["Smtp:EnableSsl"] ?? "true");
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var fromEmail = _configuration["Smtp:FromEmail"] ?? username;
            var fromName = _configuration["Smtp:FromName"] ?? "AkerpSuite";

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username))
            {
                _logger.LogError("SMTP settings are missing in configuration (Smtp:Host / Smtp:Username). Email not sent.");
                return;
            }

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail!, fromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };

            foreach (var recipient in recipients)
                message.To.Add(recipient);

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Credentials = new NetworkCredential(username, password)
            };

            try
            {
                await client.SendMailAsync(message);
                _logger.LogInformation("Email sent successfully to {Recipients}. Subject: {Subject}",
                    string.Join(", ", recipients), subject);
            }
            catch (Exception ex)
            {
                // Email failures should not crash the calling operation (e.g. a scheduled job) —
                // log it so it can be investigated/retried, but don't throw.
                _logger.LogError(ex, "Failed to send email to {Recipients}. Subject: {Subject}",
                    string.Join(", ", recipients), subject);
            }
        }
    }
}