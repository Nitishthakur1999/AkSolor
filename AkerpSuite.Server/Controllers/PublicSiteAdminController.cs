using AkerpSuite.Server.Constants;
using AkerpSuite.Server.DTOs;
using AkerpSuite.Server.DTOs.Hr;
using AkerpSuite.Server.Helpers;
using AkerpSuite.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AkerpSuite.Server.Controllers
{
    [Route("api/admin/site")]
    [ApiController]
    [Authorize]
    public class PublicSiteAdminController : ControllerBase
    {
        private readonly IHRService _service;

        private const string SiteWriteRoles = Roles.CMD + "," + Roles.Director + "," + Roles.HR;
        private const string SiteViewRoles = Roles.CMD + "," + Roles.Director + "," + Roles.HR;

        public PublicSiteAdminController(IHRService service)
        {
            _service = service;
        }

        #region Banner

        [HttpPost("banner")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> CreateBanner(
            [FromBody] BannerRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            string? imagePath = null;
            if (!string.IsNullOrWhiteSpace(request.Base64Image))
                imagePath = await fileHelper.SaveBase64FileAsync(request.Base64Image, request.Extension, "Banners");

            var result = await _service.CreateBannerAsync(request, imagePath);
            return Ok(ApiResponseDto<BannerResponseDto>.Ok(result, "Banner created successfully."));
        }

        [HttpGet("banner")]
        [Authorize(Roles = SiteViewRoles)]
        public async Task<IActionResult> GetAllBanners()
        {
            var data = await _service.GetAllBannersAsync();
            return Ok(ApiResponseDto<IEnumerable<BannerResponseDto>>.Ok(data));
        }

        [HttpPut("banner")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> UpdateBanner(
            [FromBody] BannerUpdateRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            string? newImagePath = null;
            if (!string.IsNullOrWhiteSpace(request.Base64Image))
                newImagePath = await fileHelper.SaveBase64FileAsync(request.Base64Image, request.Extension, "Banners");

            var updated = await _service.UpdateBannerAsync(request, newImagePath, fileHelper);
            if (!updated)
                return NotFound(ApiResponseDto<object>.Fail("Banner not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Banner updated successfully."));
        }

        [HttpDelete("banner/{id:int}")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> DeleteBanner(int id, [FromServices] FileUploadHelper fileHelper)
        {
            var deleted = await _service.DeleteBannerAsync(id, fileHelper);
            if (!deleted)
                return NotFound(ApiResponseDto<object>.Fail("Banner not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Banner deleted successfully."));
        }

        #endregion

        #region Gallery

        [HttpPost("gallery")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> CreateGallery(
            [FromBody] GalleryRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            string? imagePath = null;
            if (!string.IsNullOrWhiteSpace(request.Base64Image))
                imagePath = await fileHelper.SaveBase64FileAsync(request.Base64Image, request.Extension, "Gallery");

            var result = await _service.CreateGalleryAsync(request, imagePath);
            return Ok(ApiResponseDto<GalleryResponseDto>.Ok(result, "Gallery item created successfully."));
        }

        [HttpGet("gallery")]
        [Authorize(Roles = SiteViewRoles)]
        public async Task<IActionResult> GetAllGallery()
        {
            var data = await _service.GetAllGalleryAsync();
            return Ok(ApiResponseDto<IEnumerable<GalleryResponseDto>>.Ok(data));
        }

        [HttpPut("gallery")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> UpdateGallery(
            [FromBody] GalleryUpdateRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            string? newImagePath = null;
            if (!string.IsNullOrWhiteSpace(request.Base64Image))
                newImagePath = await fileHelper.SaveBase64FileAsync(request.Base64Image, request.Extension, "Gallery");

            var updated = await _service.UpdateGalleryAsync(request, newImagePath, fileHelper);
            if (!updated)
                return NotFound(ApiResponseDto<object>.Fail("Gallery item not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Gallery item updated successfully."));
        }

        [HttpDelete("gallery/{id:int}")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> DeleteGallery(int id, [FromServices] FileUploadHelper fileHelper)
        {
            var deleted = await _service.DeleteGalleryAsync(id, fileHelper);
            if (!deleted)
                return NotFound(ApiResponseDto<object>.Fail("Gallery item not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Gallery item deleted successfully."));
        }

        #endregion

        #region Our Team

        [HttpPost("team")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> CreateTeam(
            [FromBody] TeamRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            string? imagePath = null;
            if (!string.IsNullOrWhiteSpace(request.Base64Image))
                imagePath = await fileHelper.SaveBase64FileAsync(request.Base64Image, request.Extension, "Team");

            var result = await _service.CreateTeamAsync(request, imagePath);
            return Ok(ApiResponseDto<TeamResponseDto>.Ok(result, "Team member added successfully."));
        }

        [HttpGet("team")]
        [Authorize(Roles = SiteViewRoles)]
        public async Task<IActionResult> GetAllTeam()
        {
            var data = await _service.GetAllTeamAsync();
            return Ok(ApiResponseDto<IEnumerable<TeamResponseDto>>.Ok(data));
        }

        [HttpPut("team")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> UpdateTeam(
            [FromBody] TeamUpdateRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            string? newImagePath = null;
            if (!string.IsNullOrWhiteSpace(request.Base64Image))
                newImagePath = await fileHelper.SaveBase64FileAsync(request.Base64Image, request.Extension, "Team");

            var updated = await _service.UpdateTeamAsync(request, newImagePath, fileHelper);
            if (!updated)
                return NotFound(ApiResponseDto<object>.Fail("Team member not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Team member updated successfully."));
        }

        [HttpDelete("team/{id:int}")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> DeleteTeam(int id, [FromServices] FileUploadHelper fileHelper)
        {
            var deleted = await _service.DeleteTeamAsync(id, fileHelper);
            if (!deleted)
                return NotFound(ApiResponseDto<object>.Fail("Team member not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Team member deleted successfully."));
        }

        #endregion

        #region Completed Projects (multi-image)

        [HttpPost("projects")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> CreateProject(
            [FromBody] ProjectRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var imagePaths = new List<string>();
            foreach (var base64 in request.Base64Images)
            {
                var path = await fileHelper.SaveBase64FileAsync(base64, request.Extension, "Projects");
                if (path != null) imagePaths.Add(path);
            }

            var result = await _service.CreateProjectAsync(request, imagePaths);
            return Ok(ApiResponseDto<ProjectResponseDto>.Ok(result, "Project created successfully."));
        }

        [HttpGet("projects")]
        [Authorize(Roles = SiteViewRoles)]
        public async Task<IActionResult> GetAllProjects()
        {
            var data = await _service.GetAllProjectsAsync();
            return Ok(ApiResponseDto<IEnumerable<ProjectResponseDto>>.Ok(data));
        }

        [HttpPut("projects")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> UpdateProject(
            [FromBody] ProjectUpdateRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var newImagePaths = new List<string>();
            foreach (var base64 in request.Base64Images)
            {
                var path = await fileHelper.SaveBase64FileAsync(base64, request.Extension, "Projects");
                if (path != null) newImagePaths.Add(path);
            }

            var updated = await _service.UpdateProjectAsync(request, newImagePaths, fileHelper);
            if (!updated)
                return NotFound(ApiResponseDto<object>.Fail("Project not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Project updated successfully."));
        }

        [HttpDelete("projects/{id:int}")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> DeleteProject(int id, [FromServices] FileUploadHelper fileHelper)
        {
            var deleted = await _service.DeleteProjectAsync(id, fileHelper);
            if (!deleted)
                return NotFound(ApiResponseDto<object>.Fail("Project not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Project deleted successfully."));
        }

        #endregion

        #region Highlights

        [HttpPost("highlights")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> CreateHighlight(
            [FromBody] HighlightRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            string? imagePath = null;
            if (!string.IsNullOrWhiteSpace(request.Base64Image))
                imagePath = await fileHelper.SaveBase64FileAsync(request.Base64Image, request.Extension, "Highlights");

            var result = await _service.CreateHighlightAsync(request, imagePath);
            return Ok(ApiResponseDto<HighlightResponseDto>.Ok(result, "Highlight created successfully."));
        }

        [HttpGet("highlights")]
        [Authorize(Roles = SiteViewRoles)]
        public async Task<IActionResult> GetAllHighlights()
        {
            var data = await _service.GetAllHighlightsAsync();
            return Ok(ApiResponseDto<IEnumerable<HighlightResponseDto>>.Ok(data));
        }

        [HttpPut("highlights")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> UpdateHighlight(
            [FromBody] HighlightUpdateRequestDto request,
            [FromServices] FileUploadHelper fileHelper)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            string? newImagePath = null;
            if (!string.IsNullOrWhiteSpace(request.Base64Image))
                newImagePath = await fileHelper.SaveBase64FileAsync(request.Base64Image, request.Extension, "Highlights");

            var updated = await _service.UpdateHighlightAsync(request, newImagePath, fileHelper);
            if (!updated)
                return NotFound(ApiResponseDto<object>.Fail("Highlight not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Highlight updated successfully."));
        }

        [HttpDelete("highlights/{id:int}")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> DeleteHighlight(int id, [FromServices] FileUploadHelper fileHelper)
        {
            var deleted = await _service.DeleteHighlightAsync(id, fileHelper);
            if (!deleted)
                return NotFound(ApiResponseDto<object>.Fail("Highlight not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Highlight deleted successfully."));
        }

        #endregion

        #region Career (no images)

        [HttpPost("career")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> CreateCareer([FromBody] CareerRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var result = await _service.CreateCareerAsync(request);
            return Ok(ApiResponseDto<CareerResponseDto>.Ok(result, "Job posted successfully."));
        }

        [HttpGet("career")]
        [Authorize(Roles = SiteViewRoles)]
        public async Task<IActionResult> GetAllCareers()
        {
            var data = await _service.GetAllCareersAsync();
            return Ok(ApiResponseDto<IEnumerable<CareerResponseDto>>.Ok(data));
        }

        [HttpPut("career")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> UpdateCareer([FromBody] CareerUpdateRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var updated = await _service.UpdateCareerAsync(request);
            if (!updated)
                return NotFound(ApiResponseDto<object>.Fail("Job posting not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Job posting updated successfully."));
        }

        [HttpDelete("career/{id:int}")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> DeleteCareer(int id)
        {
            var deleted = await _service.DeleteCareerAsync(id);
            if (!deleted)
                return NotFound(ApiResponseDto<object>.Fail("Job posting not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Job posting deleted successfully."));
        }

        #endregion

        #region Contact Query (Admin only VIEWS, mark-read, delete — no create)

        [HttpGet("contact-query")]
        [Authorize(Roles = SiteViewRoles)]
        public async Task<IActionResult> GetAllQueries([FromQuery] bool? isRead)
        {
            var data = await _service.GetAllContactQueriesAsync(isRead);
            return Ok(ApiResponseDto<IEnumerable<ContactQueryResponseDto>>.Ok(data));
        }

        [HttpPatch("contact-query/{id:int}/mark-read")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> MarkQueryRead(int id)
        {
            var updated = await _service.MarkQueryReadAsync(id);
            if (!updated)
                return NotFound(ApiResponseDto<object>.Fail("Query not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Query marked as read."));
        }

        [HttpDelete("contact-query/{id:int}")]
        [Authorize(Roles = SiteWriteRoles)]
        public async Task<IActionResult> DeleteQuery(int id)
        {
            var deleted = await _service.DeleteContactQueryAsync(id);
            if (!deleted)
                return NotFound(ApiResponseDto<object>.Fail("Query not found."));

            return Ok(ApiResponseDto<bool>.Ok(true, "Query deleted successfully."));
        }

        #endregion
    }
}