using API.Tests;
using FoodFestAPI.Data;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models;
using Xunit;

public class ShoppingListLogicTests
{
    private static (ApplicationDbContext ctx, Microsoft.Data.Sqlite.SqliteConnection conn) Seed()
    {
        var (ctx, conn) = TestDbContextFactory.Create();

        Recipe MkRecipe(string name)
        {
            var r = new Recipe { Name = name, Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = "u1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            ctx.Recipes.Add(r);
            ctx.SaveChanges();
            return r;
        }
        void MkIngredient(int recipeId, string nm, string unit)
        {
            ctx.Ingredients.Add(new Ingredient { Name = nm, Unit = unit, Description = "", RecipeId = recipeId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            ctx.SaveChanges();
        }
        MealPlans MkPlan(int recipeId, string mealType, DateTime day)
        {
            var mp = new MealPlans { MealType = mealType, PlanName = "P", StartDate = day, EndDate = day, RecipeId = recipeId, UserID = "u1" };
            ctx.MealPlans.Add(mp);
            ctx.SaveChanges();
            ctx.MealPlanDays.Add(new MealPlanDays { MealPlanId = mp.Id, Date = day });
            ctx.SaveChanges();
            return mp;
        }

        var carbonara = MkRecipe("Carbonara");
        MkIngredient(carbonara.Id, "Eggs", "pcs");
        MkIngredient(carbonara.Id, "Bacon", "g");
        var omelette = MkRecipe("Omelette");
        MkIngredient(omelette.Id, "eggs", "pcs"); // different casing on purpose
        var cake = MkRecipe("Cake");
        MkIngredient(cake.Id, "Flour", "g");

        MkPlan(carbonara.Id, "Dinner", new DateTime(2026, 7, 5));
        MkPlan(omelette.Id, "Breakfast", new DateTime(2026, 7, 6));
        MkPlan(cake.Id, "Dessert", new DateTime(2026, 7, 20)); // out of range

        return (ctx, conn);
    }

    [Fact]
    public async Task Groups_by_normalized_name_within_range_and_excludes_out_of_range()
    {
        var (ctx, conn) = Seed();
        try
        {
            var list = await ShoppingListLogic.GenerateAsync(ctx, "u1", new DateTime(2026, 7, 5), new DateTime(2026, 7, 11));

            Assert.Equal(2, list.Count); // Eggs (both recipes, case-insensitive) + Bacon; Flour excluded
            var eggs = list.Single(i => i.Name.ToLower() == "eggs");
            Assert.Equal(new[] { "pcs" }, eggs.Units.ToArray());
            Assert.Equal(2, eggs.FromRecipes.Count);
            Assert.Contains("Carbonara", eggs.FromRecipes);
            Assert.Contains("Omelette", eggs.FromRecipes);
            Assert.Contains(list, i => i.Name == "Bacon");
            Assert.DoesNotContain(list, i => i.Name == "Flour");
        }
        finally { conn.Dispose(); }
    }

    [Fact]
    public async Task Empty_range_returns_empty_list()
    {
        var (ctx, conn) = Seed();
        try
        {
            var list = await ShoppingListLogic.GenerateAsync(ctx, "u1", new DateTime(2026, 1, 1), new DateTime(2026, 1, 2));
            Assert.Empty(list);
        }
        finally { conn.Dispose(); }
    }

    [Fact]
    public async Task Recipe_scheduled_twice_in_range_lists_ingredient_once()
    {
        var (ctx, conn) = Seed();
        try
        {
            var carb = ctx.Recipes.Single(r => r.Name == "Carbonara");
            var mp = ctx.MealPlans.First(m => m.RecipeId == carb.Id);
            ctx.MealPlanDays.Add(new MealPlanDays { MealPlanId = mp.Id, Date = new DateTime(2026, 7, 7) });
            ctx.SaveChanges();

            var list = await ShoppingListLogic.GenerateAsync(ctx, "u1", new DateTime(2026, 7, 5), new DateTime(2026, 7, 11));
            var bacon = list.Single(i => i.Name == "Bacon");
            Assert.Single(bacon.FromRecipes); // Carbonara listed once, not twice
        }
        finally { conn.Dispose(); }
    }
}
