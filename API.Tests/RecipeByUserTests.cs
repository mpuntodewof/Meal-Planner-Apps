using System.Net;
using API.Tests;
using FoodFestAPI.Controllers;
using FoodFestAPI.Data;
using FoodFestAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

public class RecipeByUserTests
{
    private static Recipe Rec(string name, string userId) =>
        new Recipe { Name = name, Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = userId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

    // Builds the controller under test. The by-user action only touches the
    // DbContext and its ApiResponse, so config / image / AI / nutrition
    // collaborators are never invoked and can be null; the logger uses the
    // framework's no-op instance.
    private static RecipeController BuildController(ApplicationDbContext ctx) =>
        new RecipeController(ctx, null!, null!, NullLogger<RecipeController>.Instance, null!, null!);

    private static ApiResponse UnwrapOk(ActionResult result)
    {
        var ok = Assert.IsType<OkObjectResult>(result);
        return Assert.IsType<ApiResponse>(ok.Value);
    }

    // The by-user query must return only recipes whose UserId matches, and an
    // empty list (not an error) when the user has none.
    [Fact]
    public async Task Recipes_are_filtered_by_UserId()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            ctx.Recipes.Add(Rec("Mine1", "u1"));
            ctx.Recipes.Add(Rec("Mine2", "u1"));
            ctx.Recipes.Add(Rec("Theirs", "u2"));
            await ctx.SaveChangesAsync();
            ctx.ChangeTracker.Clear();

            var mine = await ctx.Recipes.Where(r => r.UserId == "u1").ToListAsync();
            var none = await ctx.Recipes.Where(r => r.UserId == "nobody").ToListAsync();

            Assert.Equal(2, mine.Count);
            Assert.All(mine, r => Assert.Equal("u1", r.UserId));
            Assert.Empty(none);
        }
        finally { ctx.Dispose(); conn.Dispose(); }
    }

    // Exercises the actual controller action end-to-end (predicate, ApiResponse
    // shape, and status code), so a regression in the endpoint is caught.
    [Fact]
    public async Task Controller_returns_only_matching_users_recipes()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            ctx.Recipes.Add(Rec("Mine1", "u1"));
            ctx.Recipes.Add(Rec("Mine2", "u1"));
            ctx.Recipes.Add(Rec("Theirs", "u2"));
            await ctx.SaveChangesAsync();
            ctx.ChangeTracker.Clear();

            var controller = BuildController(ctx);

            var response = UnwrapOk(await controller.GetRecipesByUserId("u1"));

            Assert.True(response.IsSuccess);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var mine = Assert.IsType<List<Recipe>>(response.Result);
            Assert.Equal(2, mine.Count);
            Assert.All(mine, r => Assert.Equal("u1", r.UserId));
        }
        finally { ctx.Dispose(); conn.Dispose(); }
    }

    // A user with no recipes gets a successful, empty result — not an error.
    [Fact]
    public async Task Controller_returns_empty_list_for_unknown_user()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            ctx.Recipes.Add(Rec("Theirs", "u2"));
            await ctx.SaveChangesAsync();
            ctx.ChangeTracker.Clear();

            var controller = BuildController(ctx);

            var response = UnwrapOk(await controller.GetRecipesByUserId("nobody"));

            Assert.True(response.IsSuccess);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var none = Assert.IsType<List<Recipe>>(response.Result);
            Assert.Empty(none);
        }
        finally { ctx.Dispose(); conn.Dispose(); }
    }
}
