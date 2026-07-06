using System.Net;
using FoodFestAPI.Data;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodFestAPI.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private ApiResponse _response;
        private const int DefaultWeeks = 6;

        public DashboardController(ApplicationDbContext ctx)
        {
            _ctx = ctx;
            _response = new ApiResponse();
        }

        // GET api/dashboard/user?userId=...&weeks=6
        [HttpGet("user")]
        public async Task<ActionResult<ApiResponse>> GetUserDashboard(string userId, int weeks = DefaultWeeks)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                _response.StatusCode = HttpStatusCode.BadRequest;
                _response.IsSuccess = false;
                _response.ErrorMessages = new() { "userId is required" };
                return BadRequest(_response);
            }

            var windowStart = DateTime.UtcNow.Date.AddDays(-7 * (weeks - 1));

            var plans = await _ctx.MealPlans
                .Include(m => m.MealPlanDays)
                .Include(m => m.Recipe)
                .Where(m => m.UserID == userId)
                .ToListAsync();

            var ratings = await _ctx.RecipeRatings
                .Where(r => r.UserId == userId)
                .ToListAsync();

            var summary = DashboardLogic.BuildSummary(plans, ratings, windowStart, weeks);
            _response.Result = summary;
            _response.StatusCode = HttpStatusCode.OK;
            _response.IsSuccess = true;
            return Ok(_response);
        }
    }
}
