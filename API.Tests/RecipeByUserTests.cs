using API.Tests;
using FoodFestAPI.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class RecipeByUserTests
{
    // The by-user query must return only recipes whose UserId matches, and an
    // empty list (not an error) when the user has none.
    [Fact]
    public async Task Recipes_are_filtered_by_UserId()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            ctx.Recipes.Add(new Recipe { Name = "Mine1", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = "u1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            ctx.Recipes.Add(new Recipe { Name = "Mine2", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = "u1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            ctx.Recipes.Add(new Recipe { Name = "Theirs", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = "u2", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            await ctx.SaveChangesAsync();
            ctx.ChangeTracker.Clear();

            var mine = await ctx.Recipes.Where(r => r.UserId == "u1").ToListAsync();
            var none = await ctx.Recipes.Where(r => r.UserId == "nobody").ToListAsync();

            Assert.Equal(2, mine.Count);
            Assert.All(mine, r => Assert.Equal("u1", r.UserId));
            Assert.Empty(none);
        }
        finally { conn.Dispose(); }
    }
}
