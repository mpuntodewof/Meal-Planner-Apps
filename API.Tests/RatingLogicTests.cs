using API.Tests;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models;
using Xunit;

public class RatingLogicTests
{
    private static Recipe SeedRecipe(FoodFestAPI.Data.ApplicationDbContext ctx, string name)
    {
        var r = new Recipe { Name = name, Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = "owner", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        ctx.Recipes.Add(r);
        ctx.SaveChanges();
        return r;
    }

    [Fact]
    public async Task Upsert_inserts_then_updates_same_row()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            var recipe = SeedRecipe(ctx, "R1");
            await RatingLogic.UpsertAsync(ctx, "u1", recipe.Id, 4);
            await RatingLogic.UpsertAsync(ctx, "u1", recipe.Id, 2);

            var all = ctx.RecipeRatings.Where(r => r.UserId == "u1" && r.RecipeId == recipe.Id).ToList();
            Assert.Single(all);
            Assert.Equal(2, all[0].Stars);
        }
        finally { conn.Dispose(); }
    }

    [Fact]
    public async Task Summary_averages_and_counts_per_recipe()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            var r1 = SeedRecipe(ctx, "R1");
            var r2 = SeedRecipe(ctx, "R2");
            await RatingLogic.UpsertAsync(ctx, "u1", r1.Id, 5);
            await RatingLogic.UpsertAsync(ctx, "u2", r1.Id, 4);
            await RatingLogic.UpsertAsync(ctx, "u1", r2.Id, 3);

            var summary = await RatingLogic.SummaryAsync(ctx, new[] { r1.Id, r2.Id, 999999 });

            var s1 = summary.Single(s => s.RecipeId == r1.Id);
            Assert.Equal(4.5, s1.Average);
            Assert.Equal(2, s1.Count);
            var s2 = summary.Single(s => s.RecipeId == r2.Id);
            Assert.Equal(3.0, s2.Average);
            Assert.Equal(1, s2.Count);
            Assert.DoesNotContain(summary, s => s.RecipeId == 999999);
        }
        finally { conn.Dispose(); }
    }
}
