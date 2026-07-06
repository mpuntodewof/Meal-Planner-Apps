using System.Collections.Generic;
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

            if (weeks < 1 || weeks > 52) weeks = DefaultWeeks;

            var windowStart = DateTime.UtcNow.Date.AddDays(-7 * (weeks - 1));
            var windowEnd = windowStart.AddDays(7 * weeks);

            // Efficiency guard: only pull plans with at least one day in the window.
            // BuildSummary re-applies the window per day, so boundary-straddling plans
            // are still trimmed correctly there.
            var plans = await _ctx.MealPlans
                .Include(m => m.MealPlanDays)
                .Include(m => m.Recipe)
                .Where(m => m.UserID == userId
                    && m.MealPlanDays.Any(d => d.Date >= windowStart && d.Date < windowEnd))
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

        // GET api/dashboard/admin?weeks=6
        // Platform-wide aggregate across all users. NOTE: not role-gated yet
        // (matches existing unprotected controllers — see plan Task 9).
        [HttpGet("admin")]
        public async Task<ActionResult<ApiResponse>> GetAdminDashboard(int weeks = DefaultWeeks)
        {
            if (weeks < 1 || weeks > 52) weeks = DefaultWeeks;

            var windowStart = DateTime.UtcNow.Date.AddDays(-7 * (weeks - 1));
            var windowEnd = windowStart.AddDays(7 * weeks);

            var plans = await _ctx.MealPlans
                .Include(m => m.MealPlanDays)
                .Include(m => m.Recipe)
                .ToListAsync();

            var ratings = await _ctx.RecipeRatings.ToListAsync();

            var baseSummary = DashboardLogic.BuildSummary(plans, ratings, windowStart, weeks);

            // Weekly active = distinct users with a plan day in the window.
            var weeklyActive = plans
                .Where(p => (p.MealPlanDays ?? new List<MealPlanDays>())
                    .Any(d => d.Date >= windowStart && d.Date < windowEnd))
                .Select(p => p.UserID)
                .Distinct()
                .Count();

            var recipesCreated = await _ctx.Recipes.CountAsync(r => r.CreatedAt >= windowStart);
            var newUsers = await _ctx.AppUsers.CountAsync(u => u.CreatedAt >= windowStart);

            var admin = DashboardLogic.ToAdmin(baseSummary, weeklyActive, recipesCreated, newUsers);
            _response.Result = admin;
            _response.StatusCode = HttpStatusCode.OK;
            _response.IsSuccess = true;
            return Ok(_response);
        }
    }
}
