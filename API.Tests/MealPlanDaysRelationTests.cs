using API.Tests;
using FoodFestAPI.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class MealPlanDaysRelationTests
{
    // Reproduces the shadow-FK bug: a MealPlanDays row is created setting only the
    // real scalar FK (MealPlanId). Traversing the MealPlans navigation must return
    // the parent (and its Recipe). Before the fix, the nav binds to the unpopulated
    // shadow column MealPlansId and returns null.
    [Fact]
    public async Task MealPlanDays_navigation_resolves_via_MealPlanId()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            var recipe = new Recipe { Name = "R", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = "u1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            ctx.Recipes.Add(recipe);
            await ctx.SaveChangesAsync();

            var plan = new MealPlans { MealType = "Dinner", PlanName = "P", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow, RecipeId = recipe.Id, UserID = "u1" };
            ctx.MealPlans.Add(plan);
            await ctx.SaveChangesAsync();

            // set ONLY the real scalar FK, exactly like MealPlanController.CreateMealPlan does
            ctx.MealPlanDays.Add(new MealPlanDays { MealPlanId = plan.Id, Date = DateTime.UtcNow });
            await ctx.SaveChangesAsync();

            // fresh context to force a DB read (no identity-map caching)
            ctx.ChangeTracker.Clear();

            var day = await ctx.MealPlanDays
                .Include(d => d.MealPlans).ThenInclude(m => m.Recipe)
                .SingleAsync();

            Assert.NotNull(day.MealPlans);                 // nav must resolve
            Assert.Equal(plan.Id, day.MealPlans.Id);
            Assert.NotNull(day.MealPlans.Recipe);          // and chain to Recipe
            Assert.Equal("R", day.MealPlans.Recipe.Name);
        }
        finally { conn.Dispose(); }
    }
}
