using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using FoodFestAPI.Models;
using FoodFestAPI.Models.DTO;

namespace FoodFestAPI.Helpers
{
    public static class DashboardLogic
    {
        private static readonly Dictionary<int, string> CategoryNames = new()
        {
            { 1, "Dessert" }, { 2, "Brunch" }, { 3, "Breakfast" },
            { 4, "Dinner" }, { 5, "Lunch" }, { 6, "Snack" },
        };

        // Aggregates a user's (or a filtered set of) meal plans + ratings into the DTO.
        // A "meal" is one MealPlanDays row (a recipe scheduled on a day). Nutrition
        // metrics count only recipes with non-null Calories.
        public static DashboardSummaryDTO BuildSummary(
            List<MealPlans> plans,
            List<RecipeRating> ratings,
            DateTime windowStart,
            int weeks)
        {
            var summary = new DashboardSummaryDTO();

            var meals = plans
                .SelectMany(p => (p.MealPlanDays ?? new List<MealPlanDays>())
                    .Select(d => new { d.Date, p.MealType, p.Recipe }))
                .ToList();

            summary.TotalMealsPlanned = meals.Count;
            if (summary.TotalMealsPlanned == 0)
            {
                summary.VarietyBand = VarietyBand(0, 0);
                return summary; // HasData stays false
            }

            var distinctRecipes = plans.Select(p => p.RecipeId).Distinct().Count();
            summary.UniqueRecipes = distinctRecipes;
            summary.VarietyScore = Math.Round((double)distinctRecipes / summary.TotalMealsPlanned, 2);
            summary.VarietyBand = VarietyBand(distinctRecipes, summary.TotalMealsPlanned);

            if (ratings.Count > 0)
            {
                summary.AvgRating = Math.Round(ratings.Average(r => r.Stars), 1);
                summary.RatingCount = ratings.Count;
            }

            var plannedRecipes = plans.Where(p => p.Recipe != null).Select(p => p.Recipe!).ToList();
            var distinctPlannedRecipes = plannedRecipes
                .GroupBy(r => r.Id).Select(g => g.First()).ToList();
            summary.RecipesPlanned = distinctPlannedRecipes.Count;
            var analyzed = distinctPlannedRecipes.Where(r => r.Calories.HasValue).ToList();
            summary.RecipesWithNutrition = analyzed.Count;
            if (analyzed.Count > 0)
            {
                summary.AvgCalories = (int)Math.Round(analyzed.Average(r => r.Calories!.Value));
                summary.AvgProteinG = Math.Round(analyzed.Average(r => r.ProteinG ?? 0), 1);
                summary.AvgFatG = Math.Round(analyzed.Average(r => r.FatG ?? 0), 1);
                summary.AvgCarbsG = Math.Round(analyzed.Average(r => r.CarbsG ?? 0), 1);
            }

            var weeklyInput = meals
                .Select(m => ((DateTime)m.Date, (string)m.MealType, (int?)m.Recipe?.Calories))
                .ToList();
            summary.Weekly = BucketByWeek(weeklyInput, windowStart, weeks);

            summary.CategoryMix = meals
                .Select(m => m.Recipe?.CategoriesId)
                .Where(id => id.HasValue)
                .GroupBy(id => id!.Value)
                .Select(g => new NameCountDTO
                {
                    Name = CategoryNames.TryGetValue(g.Key, out var n) ? n : "Other",
                    Count = g.Count(),
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            summary.TopRecipes = meals
                .Where(m => m.Recipe != null)
                .GroupBy(m => m.Recipe!.Name)
                .Select(g => new NameCountDTO { Name = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(6)
                .ToList();

            var slotCounts = new List<(string Slot, int Count)>
            {
                ("Breakfast", summary.Weekly.Sum(w => w.Breakfast)),
                ("Lunch", summary.Weekly.Sum(w => w.Lunch)),
                ("Dinner", summary.Weekly.Sum(w => w.Dinner)),
                ("Snack", summary.Weekly.Sum(w => w.Snack)),
            };
            var topSlot = slotCounts.OrderByDescending(s => s.Count).First();
            var slotTotal = slotCounts.Sum(s => s.Count);
            var topSlotPct = slotTotal > 0 ? (int)Math.Round(100.0 * topSlot.Count / slotTotal) : 0;
            summary.InsightLine = BuildInsightLine(summary, topSlot.Slot, topSlotPct);

            summary.HasData = true;
            return summary;
        }
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

        // A single human sentence summarizing the dominant behavior. Empty string when
        // there is no data (caller shows an empty state instead).
        public static string BuildInsightLine(DashboardSummaryDTO s, string topSlot, int topSlotPct)
        {
            if (s.TotalMealsPlanned <= 0 || string.IsNullOrEmpty(topSlot)) return "";
            var varietyClause = s.VarietyBand switch
            {
                "Low" => " and your recipe variety is low — you keep repeating the same meals",
                "High" => " with high recipe variety",
                _ => " with balanced recipe variety",
            };
            return $"{topSlot} is {topSlotPct}% of your plans{varietyClause}.";
        }
    }
}
