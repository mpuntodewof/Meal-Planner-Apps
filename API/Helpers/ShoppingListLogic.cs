using FoodFestAPI.Data;
using FoodFestAPI.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace FoodFestAPI.Helpers
{
    // Builds a grouped shopping list from the meal-plan days scheduled within a
    // date range for a user. Grouping is by normalized ingredient name; there is
    // no quantity summation (Ingredient has no numeric quantity).
    //
    // Note: MealPlanDays' navigation to MealPlans is not wired to the real
    // MealPlanId FK column (EF convention created a separate shadow FK
    // "MealPlansId" that is never populated). We therefore join MealPlanDays to
    // MealPlans explicitly on the MealPlanId scalar rather than relying on the
    // navigation property.
    public static class ShoppingListLogic
    {
        public static async Task<List<ShoppingListItemDTO>> GenerateAsync(
            ApplicationDbContext ctx, string userId, DateTime start, DateTime end)
        {
            var plans = await (
                from d in ctx.MealPlanDays
                where d.Date >= start && d.Date <= end
                join m in ctx.MealPlans
                        .Include(m => m.Recipe).ThenInclude(r => r.Ingredients)
                    on d.MealPlanId equals m.Id
                where m.UserID == userId
                select m).ToListAsync();

            var recipes = plans
                .Select(m => m.Recipe)
                .Where(r => r != null)
                .GroupBy(r => r.Id)
                .Select(g => g.First())
                .ToList();

            var pairs = recipes
                .SelectMany(r => (r.Ingredients ?? new List<Models.Ingredient>())
                    .Select(i => new { RecipeName = r.Name, Ingredient = i }))
                .Where(p => !string.IsNullOrWhiteSpace(p.Ingredient?.Name))
                .ToList();

            var groups = pairs
                .GroupBy(p => p.Ingredient.Name.Trim().ToLower())
                .Select(g => new ShoppingListItemDTO
                {
                    Name = g.First().Ingredient.Name.Trim(),
                    Units = g.Select(p => p.Ingredient.Unit)
                             .Where(u => !string.IsNullOrWhiteSpace(u))
                             .Distinct().ToList(),
                    FromRecipes = g.Select(p => p.RecipeName).Distinct().ToList()
                })
                .OrderBy(i => i.Name)
                .ToList();

            return groups;
        }
    }
}
