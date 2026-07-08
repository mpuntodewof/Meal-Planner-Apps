using FoodFestAPI.Helpers;
using FoodFestAPI.Models.DTO;
using Xunit;

public class InsightLineTests
{
    [Fact]
    public void BuildInsight_NamesTopSlotAndVariety()
    {
        var s = new DashboardSummaryDTO
        {
            TotalMealsPlanned = 28,
            CategoryMix = new() { new() { Name = "Dinner", Count = 15 } },
            VarietyBand = "Low",
        };
        var line = DashboardLogic.BuildInsightLine(s, topSlot: "Dinner", topSlotPct: 54);
        Assert.Contains("Dinner", line);
        Assert.Contains("54%", line);
        Assert.Contains("variety", line, System.StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void BuildInsight_EmptyWhenNoData()
    {
        var s = new DashboardSummaryDTO { TotalMealsPlanned = 0 };
        Assert.Equal("", DashboardLogic.BuildInsightLine(s, topSlot: "", topSlotPct: 0));
    }
}
