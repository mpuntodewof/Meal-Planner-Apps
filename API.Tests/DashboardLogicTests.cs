using FoodFestAPI.Helpers;
using Xunit;

public class DashboardLogicTests
{
    [Theory]
    [InlineData(0, 0, "Low")]        // no plans -> Low (avoids divide-by-zero)
    [InlineData(4, 10, "Low")]       // 0.40
    [InlineData(6, 10, "Balanced")]  // 0.60
    [InlineData(9, 10, "High")]      // 0.90
    public void VarietyBand_ClassifiesCorrectly(int unique, int total, string expected)
    {
        Assert.Equal(expected, DashboardLogic.VarietyBand(unique, total));
    }
}
