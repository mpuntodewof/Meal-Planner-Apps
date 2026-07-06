using System;
using System.Collections.Generic;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models.DTO;
using Xunit;

public class AdminProjectionTests
{
    [Fact]
    public void ToAdmin_CopiesBaseAndAddsPlatformCounts()
    {
        var baseSummary = new DashboardSummaryDTO { TotalMealsPlanned = 50, HasData = true, InsightLine = "x" };
        var admin = DashboardLogic.ToAdmin(baseSummary, weeklyActive: 142, recipesCreated: 61, newUsers: 12);

        Assert.Equal(50, admin.TotalMealsPlanned);
        Assert.Equal("x", admin.InsightLine);
        Assert.Equal(142, admin.WeeklyActiveUsers);
        Assert.Equal(61, admin.RecipesCreated);
        Assert.Equal(12, admin.NewUsers);
    }
}
