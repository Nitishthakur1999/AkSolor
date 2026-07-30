using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
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

        // Max Size = 10 MB
        private const long MaxFileSize = 10 * 1024 * 1024;
        // Default allowed extensions (used when no custom list is passed in)
        private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".pdf" };

        public FileUploadHelper(IWebHostEnvironment environment, ILogger<FileUploadHelper> logger)
        {
            _environment = environment;
            _logger = logger;
        }

        // 1. Existing Standard Method (For FormData/IFormFile if needed elsewhere)
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

        // 2. Handles Base64 JSON payloads (used by HR document upload/update, and public job applications).
        // Pass a custom `allowedExtensions` list (e.g. CV uploads allow .pdf/.doc/.docx) —
        // if omitted, falls back to the default image/PDF list.
        public async Task<string?> SaveBase64FileAsync(string? base64String, string? extension, string folderName, string[]? allowedExtensions = null)
        {
            if (string.IsNullOrWhiteSpace(base64String))
                return null;

            if (string.IsNullOrWhiteSpace(extension))
                throw new InvalidOperationException("File extension is required.");

            // Strip data URI prefix if present (e.g. "data:image/png;base64,....")
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

        // 3. Deletes a previously saved file given its stored relative path (e.g. "EmployeeDocuments/xxx.pdf").
       
        public void DeleteFile(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return;

            try
            {
                var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");

                // Normalize and guard against path traversal outside the web root.
                var fullPath = Path.GetFullPath(Path.Combine(webRoot, relativePath.Replace("/", Path.DirectorySeparatorChar.ToString())));

                if (!fullPath.StartsWith(Path.GetFullPath(webRoot), StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogWarning("Skipped deleting file outside web root: {RelativePath}", relativePath);
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

        private string GetFolderPath(string folderName)
        {
            var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var folderPath = Path.Combine(webRoot, folderName);

            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            return folderPath;
        }
    }
}