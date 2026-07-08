using FoodFestAPI.Data;
using FoodFestAPI.Models;
using FoodFestAPI.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace FoodFestAPI.Helpers
{
    // Rating operations over the DbContext, extracted so they can be unit-tested
    // against a Sqlite in-memory DB without going through HTTP.
    public static class RatingLogic
    {
        public static async Task<RecipeRating> UpsertAsync(ApplicationDbContext ctx, string userId, int recipeId, int stars)
        {
            var existing = await ctx.RecipeRatings
                .FirstOrDefaultAsync(r => r.UserId == userId && r.RecipeId == recipeId);

            if (existing != null)
            {
                existing.Stars = stars;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existing = new RecipeRating
                {
                    UserId = userId,
                    RecipeId = recipeId,
                    Stars = stars,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                ctx.RecipeRatings.Add(existing);
            }

            await ctx.SaveChangesAsync();
            return existing;
        }

        public static async Task<List<RatingSummaryDTO>> SummaryAsync(ApplicationDbContext ctx, IEnumerable<int> recipeIds)
        {
            var ids = recipeIds.ToList();
            return await ctx.RecipeRatings
                .Where(r => ids.Contains(r.RecipeId))
                .GroupBy(r => r.RecipeId)
                .Select(g => new RatingSummaryDTO
                {
                    RecipeId = g.Key,
                    Average = Math.Round(g.Average(x => (double)x.Stars), 1),
                    Count = g.Count()
                })
                .ToListAsync();
        }
    }
}
