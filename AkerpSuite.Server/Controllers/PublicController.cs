using AkerpSuite.Server.DTOs;
using AkerpSuite.Server.DTOs.Hr;
using AkerpSuite.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace AkerpSuite.Server.Controllers
{
    [Route("api/public")]
    [ApiController]
    public class PublicController : ControllerBase
    {
        private readonly IHRService _service;

        public PublicController(IHRService service)
        {
            _service = service;
        }

        #region Banners

        [HttpGet("banner")]
        public async Task<IActionResult> GetActiveBanners()
        {
            var data = await _service.GetAllBannersAsync();
            var active = data.Where(b => b.IsActive);
            return Ok(ApiResponseDto<IEnumerable<BannerResponseDto>>.Ok(active));
        }

        #endregion

        #region Gallery

        [HttpGet("gallery")]
        public async Task<IActionResult> GetActiveGallery()
        {
            var data = await _service.GetAllGalleryAsync();
            var active = data.Where(g => g.IsActive);
            return Ok(ApiResponseDto<IEnumerable<GalleryResponseDto>>.Ok(active));
        }

        #endregion

        #region Our Team

        [HttpGet("team")]
        public async Task<IActionResult> GetActiveTeam()
        {
            var data = await _service.GetAllTeamAsync();
            var active = data.Where(t => t.IsActive);
            return Ok(ApiResponseDto<IEnumerable<TeamResponseDto>>.Ok(active));
        }

        #endregion

        #region Projects

        [HttpGet("projects")]
        public async Task<IActionResult> GetActiveProjects()
        {
            var data = await _service.GetAllProjectsAsync();
            var active = data.Where(p => p.IsActive);
            return Ok(ApiResponseDto<IEnumerable<ProjectResponseDto>>.Ok(active));
        }

        #endregion

        #region Highlights

        [HttpGet("highlights")]
        public async Task<IActionResult> GetActiveHighlights()
        {
            var data = await _service.GetAllHighlightsAsync();
            var active = data.Where(h => h.IsActive);
            return Ok(ApiResponseDto<IEnumerable<HighlightResponseDto>>.Ok(active));
        }

        #endregion

        #region Careers

        [HttpGet("career")]
        public async Task<IActionResult> GetOpenCareers()
        {
            var data = await _service.GetAllCareersAsync();
            var open = data.Where(c => c.IsOpen);
            return Ok(ApiResponseDto<IEnumerable<CareerResponseDto>>.Ok(open));
        }

        #endregion

        #region Contact Query (public submits, no auth)

        [HttpPost("contact-query")]
        public async Task<IActionResult> SubmitContactQuery([FromBody] ContactQueryRequestDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ApiResponseDto<object>.Fail("Invalid request."));

            var newId = await _service.CreateContactQueryAsync(request);
            return Ok(ApiResponseDto<int>.Ok(newId, "Your query has been submitted successfully."));
        }

        #endregion

    }
}