using System.Net;
using FoodFestAPI.Data;
using FoodFestAPI.Models;
using FoodFestAPI.Models.DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodFestAPI.Controllers
{
    [Route("api/mealPlan")]
    [ApiController]
    public class MealPlanController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private ApiResponse _response;
        private readonly ILogger<MealPlanController> _log;

        public MealPlanController(
            ApplicationDbContext ctx,
            IConfiguration config,
            ILogger<MealPlanController> log
        )
        {
            _ctx = ctx;
            _response = new ApiResponse();
            _log = log;
        }

        [HttpGet]
        public async Task<IActionResult> GetMealPlans(string userId)
        {
            // Flat projection: one self-contained object per meal plan. This avoids
            // serializing the circular MealPlan <-> Recipe <-> MealPlans object graph,
            // which (under ReferenceHandler.Preserve) emitted repeated plans as bare
            // {"$ref": N} stubs with no date -> the client silently dropped them,
            // causing meals to intermittently not appear after being added.
            var mealPlans = await _ctx
                .MealPlans.Where(mp => mp.UserID == userId)
                .OrderBy(mp => mp.StartDate)
                .Select(mp => new
                {
                    Id = mp.Id,
                    MealType = mp.MealType,
                    PlanName = mp.PlanName,
                    StartDate = mp.StartDate,
                    EndDate = mp.EndDate,
                    RecipeId = mp.RecipeId,
                    UserID = mp.UserID,
                    RecipeName = mp.Recipe.Name,
                    ImageUrl = mp.Recipe.ImageUrl,
                    CookingTime = mp.Recipe.CookingTime,
                    ServiceSize = mp.Recipe.ServiceSize,
                    Dates = mp.MealPlanDays.Select(d => d.Date).ToList(),
                })
                .ToListAsync();

            _response.Result = mealPlans;
            _response.IsSuccess = true;
            _response.StatusCode = HttpStatusCode.OK;
            return Ok(_response);
        }

        [HttpGet("getByDay")]
        public async Task<ActionResult<ApiResponse>> GetMealplanByDay(
            string userId,
            string mealDate
        )
        {
            var result = _ctx
                .MealPlanDays.Where(md =>
                    md.Date == Convert.ToDateTime(mealDate) && md.MealPlans.UserID == userId
                ) // Filter by date and user ID
                .Select(md => new
                {
                    MealPlanId = md.MealPlans.Id,
                    RecipeId = md.MealPlans.RecipeId,
                    UserId = md.MealPlans.UserID,
                    RecipeName = md.MealPlans.Recipe.Name,
                    ImageUrl = md.MealPlans.Recipe.ImageUrl,
                    CookingTime = md.MealPlans.Recipe.CookingTime,
                    ServiceSize = md.MealPlans.Recipe.ServiceSize,
                    MealType = md.MealPlans.MealType,
                    Date = md.Date,
                })
                .ToList();

            _response.Result = result;
            _response.StatusCode = HttpStatusCode.OK;
            _response.IsSuccess = true;
            return Ok(_response);
        }

        // Returns the user's meal plans whose day falls within [start, end].
        // Used by downstream features (shopping list, nutrition dashboard) that
        // need "recipes scheduled in a date range" without fetching every plan.
        [HttpGet("range")]
        public async Task<ActionResult<ApiResponse>> GetMealPlansByRange(
            string userId,
            DateTime start,
            DateTime end
        )
        {
            var plans = await _ctx
                .MealPlans.Include(m => m.MealPlanDays)
                .Include(m => m.Recipe)
                .Where(mp => mp.UserID == userId && mp.StartDate >= start && mp.StartDate <= end)
                .ToListAsync();

            _response.Result = plans;
            _response.StatusCode = HttpStatusCode.OK;
            _response.IsSuccess = true;
            return Ok(_response);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> CreateMealPlan([FromBody] MealPlanDTO request)
        {
            try
            {
                // Reject duplicates: the same recipe already scheduled for the same
                // user, on the same day, in the same meal type (e.g. Beef Burger for
                // Dinner on Jul 3 when it is already in Dinner on Jul 3). The same
                // recipe in a different meal type or on a different day is allowed.
                var day = request.StartDate.Date;
                bool exists = await _ctx.MealPlans.AnyAsync(mp =>
                    mp.UserID == request.UserID
                    && mp.RecipeId == request.RecipeId
                    && mp.MealType == request.MealType
                    && mp.StartDate.Date == day
                );

                if (exists)
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.Conflict;
                    _response.ErrorMessages = new List<string>
                    {
                        "This recipe is already scheduled for this meal on the selected day.",
                    };
                    return Conflict(_response);
                }

                MealPlans mealPlan = new()
                {
                    PlanName = request.PlanName,
                    MealType = request.MealType,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    RecipeId = request.RecipeId,
                    UserID = request.UserID,
                };

                _ctx.MealPlans.Add(mealPlan);

                foreach (var mealPDays in request.MealPlanDaysDTO)
                {
                    MealPlanDays mealPlanDays = new()
                    {
                        MealPlans = mealPlan,
                        Date = mealPDays.Date,
                    };
                    _ctx.MealPlanDays.Add(mealPlanDays);
                }

                await _ctx.SaveChangesAsync();

                _response.Result = mealPlan;
                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
            }
            catch (Exception ex)
            {
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.IsSuccess = false;
                _response.ErrorMessages = new List<string>() { ex.ToString() };
            }

            return _response;
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult<ApiResponse>> RemoveMealPlan(int id, string userId)
        {
            // Owner-scoped: a meal plan can only be removed by the user who owns it.
            var rmMealPlan = await _ctx
                .MealPlans.Include(md => md.MealPlanDays)
                .FirstOrDefaultAsync(mp => mp.Id == id && mp.UserID == userId);

            if (rmMealPlan == null)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.NotFound;
                return NotFound(_response);
            }

            _ctx.MealPlans.Remove(rmMealPlan);
            await _ctx.SaveChangesAsync();

            _response.IsSuccess = true;
            _response.StatusCode = HttpStatusCode.OK;
            return Ok(_response);
        }
    }
}
