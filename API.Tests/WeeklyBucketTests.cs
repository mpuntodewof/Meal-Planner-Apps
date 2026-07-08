using System;
using System.Collections.Generic;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models.DTO;
using Xunit;

public class WeeklyBucketTests
{
    // A scheduled meal: the day it lands on, its meal type, and its calories (nullable).
    private static (DateTime, string, int?) Meal(string date, string type, int? kcal)
        => (DateTime.Parse(date), type, kcal);

    [Fact]
    public void BucketByWeek_GroupsAndCountsBySlot()
    {
        var start = DateTime.Parse("2026-06-08"); // a Monday
        var meals = new List<(DateTime, string, int?)>
        {
            Meal("2026-06-09", "Dinner", 600),
            Meal("2026-06-10", "Lunch", 400),
            Meal("2026-06-16", "Dinner", null), // next week, no nutrition
        };

        var weeks = DashboardLogic.BucketByWeek(meals, start, weeks: 2);

        Assert.Equal(2, weeks.Count);
        Assert.Equal(1, weeks[0].Dinner);
        Assert.Equal(1, weeks[0].Lunch);
        Assert.Equal(500, weeks[0].AvgCalories);   // (600+400)/2
        Assert.Equal(1, weeks[1].Dinner);
        Assert.Null(weeks[1].AvgCalories);          // no analyzed recipes that week
    }
}
