using System;
using System.Collections.Generic;

namespace FoodFestAPI.Models.DTO
{
    // One point in a weekly time series.
    public class WeeklyPointDTO
    {
        public string WeekLabel { get; set; } = "";   // e.g. "Jun 8"
        public DateTime WeekStart { get; set; }
        public int Breakfast { get; set; }
        public int Lunch { get; set; }
        public int Dinner { get; set; }
        public int Snack { get; set; }
        public int Other { get; set; }
        public int TotalMeals => Breakfast + Lunch + Dinner + Snack + Other;
        public int? AvgCalories { get; set; }          // null when no analyzed recipes that week
    }

    public class NameCountDTO
    {
        public string Name { get; set; } = "";
        public int Count { get; set; }
    }

    // Shared body for both user and admin views.
    public class DashboardSummaryDTO
    {
        public int TotalMealsPlanned { get; set; }
        public int UniqueRecipes { get; set; }
        public double VarietyScore { get; set; }        // unique/total, 0..1 (server-side; UI relabels)
        public string VarietyBand { get; set; } = "";   // "Low" | "Balanced" | "High"
        public double AvgRating { get; set; }
        public int RatingCount { get; set; }
        public int? AvgCalories { get; set; }           // across analyzed planned recipes; null if none
        public decimal AvgProteinG { get; set; }
        public decimal AvgFatG { get; set; }
        public decimal AvgCarbsG { get; set; }
        public int RecipesPlanned { get; set; }         // distinct planned recipes (nutrition denominator)
        public int RecipesWithNutrition { get; set; }   // of those, how many have Calories != null
        public List<WeeklyPointDTO> Weekly { get; set; } = new();
        public List<NameCountDTO> CategoryMix { get; set; } = new();
        public List<NameCountDTO> TopRecipes { get; set; } = new();
        public string InsightLine { get; set; } = "";
        public bool HasData { get; set; }               // false => UI shows empty state
    }

    // Admin adds platform-level counts on top of the shared body.
    public class AdminDashboardDTO : DashboardSummaryDTO
    {
        public int WeeklyActiveUsers { get; set; }
        public int RecipesCreated { get; set; }         // in-window Recipe.CreatedAt count
        public int NewUsers { get; set; }               // in-window AppUser.CreatedAt count
    }
}
