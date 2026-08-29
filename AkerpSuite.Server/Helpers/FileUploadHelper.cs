using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace AkerpSuite.Server.Helpers
{
    public class FileUploadHelper
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileUploadHelper> _logger;
        private readonly IConfiguration _configuration;

        private const long MaxFileSize = 10 * 1024 * 1024;
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".pdf" };

        public FileUploadHelper(
            IWebHostEnvironment environment,
            ILogger<FileUploadHelper> logger,
            IConfiguration configuration)
        {
            _environment = environment;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<string?> SaveFileAsync(IFormFile file, string folderName, string[]? allowedExtensions = null)
        {
            if (file == null || file.Length == 0)
                return null;

            if (file.Length > MaxFileSize)
                throw new InvalidOperationException("File size cannot exceed 10 MB.");

            var extension = Path.GetExtension(file.FileName).ToLower();
            var allowed = allowedExtensions ?? _allowedExtensions;

            if (!allowed.Contains(extension))
                throw new InvalidOperationException($"Only {string.Join(", ", allowed)} files are allowed.");

            var folderPath = GetFolderPath(folderName);

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(folderPath, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return $"{folderName}/{fileName}".Replace("\\", "/");
        }

        public async Task<string?> SaveBase64FileAsync(string? base64String, string? extension, string folderName, string[]? allowedExtensions = null)
        {
            if (string.IsNullOrWhiteSpace(base64String))
                return null;

            if (string.IsNullOrWhiteSpace(extension))
                throw new InvalidOperationException("File extension is required.");

            string base64Data = base64String.Contains(",")
                ? base64String.Split(',')[1]
                : base64String;

            byte[] fileBytes;
            try
            {
                fileBytes = Convert.FromBase64String(base64Data);
            }
            catch (FormatException)
            {
                throw new InvalidOperationException("Uploaded file data is not a valid base64 string.");
            }

            if (fileBytes.Length == 0)
                throw new InvalidOperationException("Uploaded file is empty.");

            if (fileBytes.Length > MaxFileSize)
                throw new InvalidOperationException("Uploaded file size cannot exceed 10 MB.");

            var cleanedExtension = extension.StartsWith(".") ? extension.ToLower() : $".{extension.ToLower()}";
            var allowed = allowedExtensions ?? _allowedExtensions;

            if (!allowed.Contains(cleanedExtension))
                throw new InvalidOperationException($"Only {string.Join(", ", allowed)} files are allowed.");

            var folderPath = GetFolderPath(folderName);

            var fileName = $"{Guid.NewGuid()}{cleanedExtension}";
            var filePath = Path.Combine(folderPath, fileName);

            await File.WriteAllBytesAsync(filePath, fileBytes);

            return $"{folderName}/{fileName}".Replace("\\", "/");
        }

        public void DeleteFile(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return;

            try
            {
                var uploadsRoot = GetUploadsRoot();

                var fullPath = Path.GetFullPath(Path.Combine(uploadsRoot, relativePath.Replace("/", Path.DirectorySeparatorChar.ToString())));

                if (!fullPath.StartsWith(Path.GetFullPath(uploadsRoot), StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Skipped deleting file outside uploads root: {RelativePath}", relativePath);
                    return;
                }

                if (File.Exists(fullPath))
                    File.Delete(fullPath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete file: {RelativePath}", relativePath);
            }
        }

        // 🆕 config se persistent uploads path resolve karta hai; agar config missing to wwwroot pe fallback
        private string GetUploadsRoot()
        {
            var configuredPath = _configuration["UploadsRootPath"];

            if (string.IsNullOrWhiteSpace(configuredPath))
                return _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");

            return Path.IsPathRooted(configuredPath)
                ? configuredPath
                : Path.Combine(_environment.ContentRootPath, configuredPath);
        }

        private string GetFolderPath(string folderName)
        {
            var uploadsRoot = GetUploadsRoot();
            var folderPath = Path.Combine(uploadsRoot, folderName);

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            return folderPath;
        }
    }
}