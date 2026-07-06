using System;
using System.Collections.Generic;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models;
using Xunit;

public class BuildSummaryTests
{
    private static Recipe R(int id, string name, int? cal, int? catId) => new Recipe
    {
        Id = id, Name = name, Calories = cal, CategoriesId = catId,
        ProteinG = cal.HasValue ? 30 : null, FatG = cal.HasValue ? 20 : null, CarbsG = cal.HasValue ? 50 : null,
    };

    [Fact]
    public void BuildSummary_ComputesCoreMetrics()
    {
        var start = DateTime.UtcNow.Date.AddDays(-35);
        var rendang = R(1, "Beef Rendang", 600, 4);
        var salad = R(2, "Caesar Salad", null, 5); // no nutrition

        var plans = new List<MealPlans>
        {
            new() { Id = 1, MealType = "Dinner", RecipeId = 1, Recipe = rendang,
                    MealPlanDays = new List<MealPlanDays> { new() { Date = start.AddDays(2) } } },
            new() { Id = 2, MealType = "Dinner", RecipeId = 1, Recipe = rendang,
                    MealPlanDays = new List<MealPlanDays> { new() { Date = start.AddDays(9) } } },
            new() { Id = 3, MealType = "Lunch", RecipeId = 2, Recipe = salad,
                    MealPlanDays = new List<MealPlanDays> { new() { Date = start.AddDays(3) } } },
        };
        var ratings = new List<RecipeRating> { new() { Stars = 4 }, new() { Stars = 5 } };

        var s = DashboardLogic.BuildSummary(plans, ratings, start, weeks: 6);

        Assert.True(s.HasData);
        Assert.Equal(3, s.TotalMealsPlanned);        // 3 scheduled days
        Assert.Equal(2, s.UniqueRecipes);            // rendang + salad
        Assert.Equal(4.5, s.AvgRating);
        Assert.Equal(2, s.RatingCount);
        Assert.Equal(600, s.AvgCalories);            // only rendang analyzed
        Assert.Equal(2, s.RecipesPlanned);
        Assert.Equal(1, s.RecipesWithNutrition);
        Assert.Equal("Beef Rendang", s.TopRecipes[0].Name);
        Assert.Equal(2, s.TopRecipes[0].Count);
        Assert.NotEqual("", s.InsightLine);
    }

    [Fact]
    public void BuildSummary_ExcludesOutOfWindowDays()
    {
        var windowStart = DateTime.UtcNow.Date.AddDays(-35); // 6-week window: [-35, +7)
        var rendang = R(1, "Beef Rendang", 600, 4);

        var plans = new List<MealPlans>
        {
            new() { Id = 1, MealType = "Dinner", RecipeId = 1, Recipe = rendang,
                    MealPlanDays = new List<MealPlanDays> { new() { Date = windowStart.AddDays(1) } } },
            new() { Id = 2, MealType = "Dinner", RecipeId = 1, Recipe = rendang,
                    MealPlanDays = new List<MealPlanDays> { new() { Date = windowStart.AddDays(-40) } } },
        };

        var s = DashboardLogic.BuildSummary(plans, new(), windowStart, weeks: 6);

        Assert.Equal(1, s.TotalMealsPlanned);
        Assert.Equal(1, s.UniqueRecipes);
        Assert.Contains("100%", s.InsightLine);
    }

    [Fact]
    public void BuildSummary_EmptyWhenNoPlans()
    {
        var s = DashboardLogic.BuildSummary(new(), new(), DateTime.UtcNow.Date, weeks: 6);
        Assert.False(s.HasData);
        Assert.Equal(0, s.TotalMealsPlanned);
        Assert.Equal("", s.InsightLine);
    }
}
