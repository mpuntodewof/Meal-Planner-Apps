using FoodFestAPI.Data;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models;
using FoodFestAPI.Models.DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace FoodFestAPI.Controllers
{
    [Route("api/rating")]
    [ApiController]
    public class RatingController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private ApiResponse _response;
        private readonly ILogger<RatingController> _log;

        public RatingController(ApplicationDbContext ctx, ILogger<RatingController> log)
        {
            _ctx = ctx;
            _response = new ApiResponse();
            _log = log;
        }

        // Upsert the caller's rating for a recipe. One row per (UserId, RecipeId).
        [HttpPost]
        public async Task<ActionResult<ApiResponse>> Rate([FromBody] RatingRequestDTO request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.UserId) || request.RecipeId == 0)
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessages = new List<string>() { "userId and recipeId are required." };
                    return BadRequest(_response);
                }

                if (request.Stars < 1 || request.Stars > 5)
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessages = new List<string>() { "stars must be between 1 and 5." };
                    return BadRequest(_response);
                }

                var saved = await RatingLogic.UpsertAsync(_ctx, request.UserId, request.RecipeId, request.Stars);

                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
                _response.Result = saved;
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _log.LogError($"Internal server error, {ex.Message}");
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessages = new List<string>() { ex.ToString() };
                return StatusCode(500, _response);
            }
        }

        // Batch average + count for a comma-separated list of recipe ids.
        [HttpGet("summary")]
        public async Task<ActionResult<ApiResponse>> Summary([FromQuery] string recipeIds)
        {
            try
            {
                var ids = (recipeIds ?? "")
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Where(s => int.TryParse(s, out _))
                    .Select(int.Parse)
                    .Distinct()
                    .ToList();

                var summary = await RatingLogic.SummaryAsync(_ctx, ids);

                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
                _response.Result = summary;
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _log.LogError($"Internal server error, {ex.Message}");
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessages = new List<string>() { ex.ToString() };
                return StatusCode(500, _response);
            }
        }

        // The caller's own rating for a recipe (null if none), for pre-filling the widget.
        [HttpGet("mine")]
        public async Task<ActionResult<ApiResponse>> Mine([FromQuery] string userId, [FromQuery] int recipeId)
        {
            try
            {
                var mine = await _ctx.RecipeRatings
                    .FirstOrDefaultAsync(r => r.UserId == userId && r.RecipeId == recipeId);

                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
                _response.Result = mine; // null when not yet rated
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _log.LogError($"Internal server error, {ex.Message}");
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessages = new List<string>() { ex.ToString() };
                return StatusCode(500, _response);
            }
        }
    }
}
