using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using FoodFestAPI.Models.DTO;

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

        // Buckets scheduled meals into `weeks` consecutive 7-day windows starting at
        // `windowStart`. Each meal is (day, mealType, caloriesOrNull). Meals outside the
        // window are ignored. AvgCalories is over meals with non-null calories only.
        public static List<WeeklyPointDTO> BucketByWeek(
            List<(DateTime Day, string MealType, int? Calories)> meals,
            DateTime windowStart,
            int weeks)
        {
            var result = new List<WeeklyPointDTO>();
            for (var w = 0; w < weeks; w++)
            {
                var wkStart = windowStart.Date.AddDays(w * 7);
                var wkEnd = wkStart.AddDays(7);
                var inWeek = meals.Where(m => m.Day.Date >= wkStart && m.Day.Date < wkEnd).ToList();

                var kcals = inWeek.Where(m => m.Calories.HasValue).Select(m => m.Calories!.Value).ToList();
                var point = new WeeklyPointDTO
                {
                    WeekStart = wkStart,
                    WeekLabel = wkStart.ToString("MMM d", CultureInfo.InvariantCulture),
                    AvgCalories = kcals.Count > 0 ? (int)Math.Round(kcals.Average()) : (int?)null,
                };
                foreach (var m in inWeek)
                {
                    switch ((m.MealType ?? "").Trim().ToLowerInvariant())
                    {
                        case "breakfast": point.Breakfast++; break;
                        case "lunch": point.Lunch++; break;
                        case "dinner": point.Dinner++; break;
                        case "snack": point.Snack++; break;
                        default: point.Other++; break;
                    }
                }
                result.Add(point);
            }
            return result;
        }
    }
}
