namespace FoodFestAPI.Helpers
{
    public static class DashboardLogic
    {
        // Ratio of distinct recipes to total plans, banded for humans.
        // < 0.5 Low, 0.5..0.75 Balanced, > 0.75 High. Empty => Low.
        public static string VarietyBand(int uniqueRecipes, int totalPlans)
        {
            if (totalPlans <= 0) return "Low";
            var ratio = (double)uniqueRecipes / totalPlans;
            if (ratio > 0.75) return "High";
            if (ratio >= 0.5) return "Balanced";
            return "Low";
        }
    }
}
