using API.Tests;
using FoodFestAPI.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class RecipeRatingModelTests
{
    [Fact]
    public async Task Duplicate_user_recipe_rating_is_rejected_by_unique_index()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            var recipe = new Recipe { Name = "R", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = "u1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            ctx.Recipes.Add(recipe);
            await ctx.SaveChangesAsync();

            ctx.RecipeRatings.Add(new RecipeRating { UserId = "u1", RecipeId = recipe.Id, Stars = 5, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            await ctx.SaveChangesAsync();

            ctx.RecipeRatings.Add(new RecipeRating { UserId = "u1", RecipeId = recipe.Id, Stars = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });

            await Assert.ThrowsAnyAsync<DbUpdateException>(() => ctx.SaveChangesAsync());
        }
        finally
        {
            conn.Dispose();
        }
    }
}
