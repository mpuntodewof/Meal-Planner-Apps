# Behavior Dashboard (Metric Cockpit) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a "Metric Cockpit" behavior dashboard with a User view (personal planning behavior) and an Admin view (platform-wide aggregate), driven by two new server-side aggregation endpoints, with a computed insight line and first-class empty states.

**Architecture:** A new `DashboardController` on the API performs all aggregation server-side (per-user and platform-wide) and returns two flat DTOs. The frontend adds one RTK Query module (`dashboardApi`) and one page (`Dashboard.tsx`) composed of presentational cockpit components (KPI tiles + SVG charts) that render purely from the DTO. All metrics derive **only** from data that exists today: `MealPlanDays.Date`, `MealPlans.MealType`/`RecipeId`, `Recipe` nutrition + category, `RecipeRating`, `UserFavorite`, `AppUser`. Signals that need new columns (cooked-vs-planned, shopping check-offs, cost) are explicitly out of scope and shown as labelled "coming soon" placeholders.

**Tech Stack:** ASP.NET Core 8 + EF Core (API), React + TypeScript + Redux Toolkit Query (Frontend). Charts are hand-rolled inline SVG (no new chart dependency), matching the approved mockup `.superpowers/brainstorm/1408-1782705525/content/dashboard-concept-2-cockpit.html`.

---

## Design decisions locked in brainstorming

1. **Insight line** — one auto-generated sentence at the top of each view, computed from the same aggregated data. Not per-card.
2. **Variety metric** — never shown as a raw 0–1 score to users. Shown as `"{unique} unique recipes across {total} plans"` plus a band label (Low / Balanced / High).
3. **Empty states** — every tile and chart has a purposeful empty state with a CTA. Brand-new users (seeder ships zero plans/ratings) must never see a broken-looking wall of zeros.
4. **Nutrition** — only recipes with non-null `Calories` count toward nutrition metrics; the DTO reports coverage (`recipesWithNutrition / recipesPlanned`) so the UI can caveat the number.
5. **Time window** — default trailing 6 weeks (42 days), aligned to the mockup. Window is a query param so it is tunable later.

---

## Data source reference (verified against the codebase)

- `MealPlanController.GetMealPlansByRange` (`API/Controllers/MealPlanController.cs:96-113`) filters `MealPlans` on `StartDate` within `[start,end]`, `Include`s `MealPlanDays` and `Recipe` (Recipe carries nutrition). The comment there already anticipates a nutrition dashboard.
- All controllers wrap results in `ApiResponse` (`_response.Result`, `.StatusCode`, `.IsSuccess`). Match this.
- `RecipeRating` has `Stars` (int 1–5), `CreatedAt`. `UserFavorite` has `FavoriteOn`. `Recipe` has `Calories` (int?), `ProteinG/FatG/CarbsG` (decimal?), `CategoriesId` (nullable), `CreatedAt`, `UserId`.
- `Categories` fixed seed: 1 Dessert, 2 Brunch, 3 Breakfast, 4 Dinner, 5 Lunch, 6 Snack.
- **No** `CreatedAt` on `MealPlans`; date a plan by `MealPlanDays.Date`. **No** cooked/completed flag anywhere. **No** cost data. Shopping check-offs live only in browser localStorage (`Frontend/src/utils/shoppingListChecks.ts`) — not server-visible.
- Controllers are **not** `[Authorize]`-gated today; they take `userId` as a param. Match the existing (unprotected) pattern for consistency; note the security gap in Task 9 for follow-up, do not fix it here.

---

## File Structure

**API (create):**
- `API/Models/DTO/DashboardDTO.cs` — all dashboard response DTOs (one file, they change together).
- `API/Helpers/DashboardLogic.cs` — pure aggregation functions (unit-testable without a DB), mirroring the `ShoppingListLogic.cs` pattern.
- `API/Controllers/DashboardController.cs` — two endpoints: `GET api/dashboard/user`, `GET api/dashboard/admin`.

**API (test — create):**
- `API.Tests/DashboardLogicTests.cs` — if no test project exists, Task 0 creates it.

**Frontend (create):**
- `Frontend/src/api/dashboardApi.ts` — RTK Query module (mirrors `mealPlanApi.ts`).
- `Frontend/src/models/dashboardModel.ts` — TS interfaces matching the DTOs.
- `Frontend/src/pages/dashboard/Dashboard.tsx` — page shell, role switch, data fetch, empty-state gate.
- `Frontend/src/pages/dashboard/components/KpiTile.tsx` — one KPI tile (value, delta, sparkline, empty state).
- `Frontend/src/pages/dashboard/components/InsightLine.tsx` — the computed headline sentence.
- `Frontend/src/pages/dashboard/components/StackedWeeklyChart.tsx` — meals/week by slot.
- `Frontend/src/pages/dashboard/components/CategoryDonut.tsx` — category mix.
- `Frontend/src/pages/dashboard/components/TopRecipesBar.tsx` — most-planned recipes.
- `Frontend/src/pages/dashboard/components/NutritionTrendLine.tsx` — planned kcal trend.
- `Frontend/src/pages/dashboard/components/EmptyState.tsx` — reusable empty-state block with CTA.
- `Frontend/src/pages/dashboard/dashboard.css` — scoped styles lifted from the approved mockup.

**Frontend (modify):**
- `Frontend/src/redux/store/storeRedux.ts` — register `dashboardApi` reducer + middleware.
- `Frontend/src/App.tsx` (or the router file) — add the `/dashboard` route.

---

## Task 0: Ensure an API test project exists

**Files:**
- Create (if missing): `API.Tests/API.Tests.csproj`, `API.Tests/DashboardLogicTests.cs`

- [ ] **Step 1: Check for an existing test project**

Run: `ls API.Tests 2>/dev/null; ls *.sln`
If `API.Tests` already exists, skip to Task 1.

- [ ] **Step 2: Create the xUnit test project and reference the API**

```bash
dotnet new xunit -o API.Tests
dotnet add API.Tests/API.Tests.csproj reference API/API.csproj
```

- [ ] **Step 3: Verify it builds and runs**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: PASS (the template's placeholder test passes; 1 test run).

- [ ] **Step 4: Commit**

```bash
git add API.Tests
git commit -m "test: add API.Tests xunit project for dashboard aggregation"
```

---

## Task 1: DTOs for the dashboard response

**Files:**
- Create: `API/Models/DTO/DashboardDTO.cs`

- [ ] **Step 1: Write the DTO file**

```csharp
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
```

- [ ] **Step 2: Verify it compiles**

Run: `dotnet build API/API.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add API/Models/DTO/DashboardDTO.cs
git commit -m "feat(dashboard): add dashboard response DTOs"
```

---

## Task 2: Variety band helper (pure function, TDD)

**Files:**
- Create: `API/Helpers/DashboardLogic.cs`
- Test: `API.Tests/DashboardLogicTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test API.Tests/API.Tests.csproj --filter VarietyBand_ClassifiesCorrectly`
Expected: FAIL — `DashboardLogic` does not exist.

- [ ] **Step 3: Write minimal implementation**

```csharp
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test API.Tests/API.Tests.csproj --filter VarietyBand_ClassifiesCorrectly`
Expected: PASS (4 cases).

- [ ] **Step 5: Commit**

```bash
git add API/Helpers/DashboardLogic.cs API.Tests/DashboardLogicTests.cs
git commit -m "feat(dashboard): variety band classifier with tests"
```

---

## Task 3: Weekly bucketing helper (pure function, TDD)

**Files:**
- Modify: `API/Helpers/DashboardLogic.cs`
- Test: `API.Tests/DashboardLogicTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test API.Tests/API.Tests.csproj --filter BucketByWeek_GroupsAndCountsBySlot`
Expected: FAIL — `BucketByWeek` not defined.

- [ ] **Step 3: Implement `BucketByWeek`**

Add to `DashboardLogic`:

```csharp
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using FoodFestAPI.Models.DTO;

// ... inside DashboardLogic:

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test API.Tests/API.Tests.csproj --filter BucketByWeek_GroupsAndCountsBySlot`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add API/Helpers/DashboardLogic.cs API.Tests/DashboardLogicTests.cs
git commit -m "feat(dashboard): weekly bucketing helper with tests"
```

---

## Task 4: Insight line builder (pure function, TDD)

**Files:**
- Modify: `API/Helpers/DashboardLogic.cs`
- Test: `API.Tests/DashboardLogicTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test API.Tests/API.Tests.csproj --filter InsightLine`
Expected: FAIL — `BuildInsightLine` not defined.

- [ ] **Step 3: Implement `BuildInsightLine`**

Add to `DashboardLogic`:

```csharp
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test API.Tests/API.Tests.csproj --filter InsightLine`
Expected: PASS (2 cases).

- [ ] **Step 5: Commit**

```bash
git add API/Helpers/DashboardLogic.cs API.Tests/DashboardLogicTests.cs
git commit -m "feat(dashboard): insight-line builder with tests"
```

---

## Task 5: DashboardController — user endpoint

**Files:**
- Create: `API/Controllers/DashboardController.cs`

- [ ] **Step 1: Write the controller with the user endpoint**

```csharp
using System.Globalization;
using System.Net;
using FoodFestAPI.Data;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models.DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FoodFestAPI.Controllers
{
    [Route("api/dashboard")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private ApiResponse _response;
        private const int DefaultWeeks = 6;

        public DashboardController(ApplicationDbContext ctx)
        {
            _ctx = ctx;
            _response = new ApiResponse();
        }

        // GET api/dashboard/user?userId=...&weeks=6
        [HttpGet("user")]
        public async Task<ActionResult<ApiResponse>> GetUserDashboard(string userId, int weeks = DefaultWeeks)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                _response.StatusCode = HttpStatusCode.BadRequest;
                _response.IsSuccess = false;
                _response.ErrorMessages = new() { "userId is required" };
                return BadRequest(_response);
            }

            var windowStart = DateTime.UtcNow.Date.AddDays(-7 * (weeks - 1));
            var windowEnd = DateTime.UtcNow.Date.AddDays(1);

            // Pull this user's plans + their scheduled days + recipe (for nutrition/category).
            var plans = await _ctx.MealPlans
                .Include(m => m.MealPlanDays)
                .Include(m => m.Recipe)
                .Where(m => m.UserID == userId)
                .ToListAsync();

            var ratings = await _ctx.RecipeRatings
                .Where(r => r.UserId == userId)
                .ToListAsync();

            var summary = DashboardLogic.BuildSummary(plans, ratings, windowStart, weeks);
            _response.Result = summary;
            _response.StatusCode = HttpStatusCode.OK;
            _response.IsSuccess = true;
            return Ok(_response);
        }
    }
}
```

- [ ] **Step 2: Verify it does NOT yet compile (BuildSummary missing) — that's expected**

Run: `dotnet build API/API.csproj`
Expected: FAIL — `DashboardLogic.BuildSummary` not found. Proceed to Task 6 which adds it.

*(No commit yet — controller + BuildSummary land together in Task 6.)*

---

## Task 6: BuildSummary aggregation (TDD, then wire into controller)

**Files:**
- Modify: `API/Helpers/DashboardLogic.cs`
- Test: `API.Tests/DashboardLogicTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
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
    public void BuildSummary_EmptyWhenNoPlans()
    {
        var s = DashboardLogic.BuildSummary(new(), new(), DateTime.UtcNow.Date, weeks: 6);
        Assert.False(s.HasData);
        Assert.Equal(0, s.TotalMealsPlanned);
        Assert.Equal("", s.InsightLine);
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test API.Tests/API.Tests.csproj --filter BuildSummary`
Expected: FAIL — `BuildSummary` not defined.

- [ ] **Step 3: Implement `BuildSummary`**

Add to `DashboardLogic` (uses `BucketByWeek`, `VarietyBand`, `BuildInsightLine` from earlier tasks). Category id→name map matches the fixed seed:

```csharp
using FoodFestAPI.Models;

// ... inside DashboardLogic:

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

    // Flatten to scheduled meals, keeping recipe for nutrition/category.
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

    // Nutrition — analyzed recipes only.
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

    // Weekly series.
    var weeklyInput = meals
        .Select(m => (m.Date, m.MealType, m.Recipe?.Calories))
        .ToList();
    summary.Weekly = BucketByWeek(weeklyInput, windowStart, weeks);

    // Category mix (by scheduled meal).
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

    // Top recipes (by scheduled meal frequency).
    summary.TopRecipes = meals
        .Where(m => m.Recipe != null)
        .GroupBy(m => m.Recipe!.Name)
        .Select(g => new NameCountDTO { Name = g.Key, Count = g.Count() })
        .OrderByDescending(x => x.Count)
        .Take(6)
        .ToList();

    // Insight line from the dominant meal slot.
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `dotnet test API.Tests/API.Tests.csproj --filter BuildSummary`
Expected: PASS (2 cases).

- [ ] **Step 5: Verify the controller now compiles**

Run: `dotnet build API/API.csproj`
Expected: Build succeeded.

- [ ] **Step 6: Commit**

```bash
git add API/Helpers/DashboardLogic.cs API.Tests/DashboardLogicTests.cs API/Controllers/DashboardController.cs
git commit -m "feat(dashboard): BuildSummary aggregation + user endpoint"
```

---

## Task 7: DashboardController — admin endpoint

**Files:**
- Modify: `API/Controllers/DashboardController.cs`
- Modify: `API/Helpers/DashboardLogic.cs`
- Test: `API.Tests/DashboardLogicTests.cs`

- [ ] **Step 1: Write the failing test for the admin projector**

```csharp
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test API.Tests/API.Tests.csproj --filter ToAdmin`
Expected: FAIL — `ToAdmin` not defined.

- [ ] **Step 3: Implement `ToAdmin`**

Add to `DashboardLogic`:

```csharp
// Wraps a base summary into the admin DTO with platform-level counts.
public static AdminDashboardDTO ToAdmin(
    DashboardSummaryDTO b, int weeklyActive, int recipesCreated, int newUsers)
{
    return new AdminDashboardDTO
    {
        TotalMealsPlanned = b.TotalMealsPlanned,
        UniqueRecipes = b.UniqueRecipes,
        VarietyScore = b.VarietyScore,
        VarietyBand = b.VarietyBand,
        AvgRating = b.AvgRating,
        RatingCount = b.RatingCount,
        AvgCalories = b.AvgCalories,
        AvgProteinG = b.AvgProteinG,
        AvgFatG = b.AvgFatG,
        AvgCarbsG = b.AvgCarbsG,
        RecipesPlanned = b.RecipesPlanned,
        RecipesWithNutrition = b.RecipesWithNutrition,
        Weekly = b.Weekly,
        CategoryMix = b.CategoryMix,
        TopRecipes = b.TopRecipes,
        InsightLine = b.InsightLine,
        HasData = b.HasData,
        WeeklyActiveUsers = weeklyActive,
        RecipesCreated = recipesCreated,
        NewUsers = newUsers,
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test API.Tests/API.Tests.csproj --filter ToAdmin`
Expected: PASS.

- [ ] **Step 5: Add the admin endpoint to the controller**

Add inside `DashboardController` (after `GetUserDashboard`):

```csharp
        // GET api/dashboard/admin?weeks=6
        // Platform-wide aggregate across all users. NOTE: not role-gated yet
        // (matches existing unprotected controllers — see plan Task 9).
        [HttpGet("admin")]
        public async Task<ActionResult<ApiResponse>> GetAdminDashboard(int weeks = DefaultWeeks)
        {
            var windowStart = DateTime.UtcNow.Date.AddDays(-7 * (weeks - 1));

            var plans = await _ctx.MealPlans
                .Include(m => m.MealPlanDays)
                .Include(m => m.Recipe)
                .ToListAsync();

            var ratings = await _ctx.RecipeRatings.ToListAsync();

            var baseSummary = DashboardLogic.BuildSummary(plans, ratings, windowStart, weeks);

            // Weekly active = distinct users with a plan day in the window.
            var weeklyActive = plans
                .Where(p => (p.MealPlanDays ?? new List<MealPlanDays>())
                    .Any(d => d.Date >= windowStart))
                .Select(p => p.UserID)
                .Distinct()
                .Count();

            var recipesCreated = await _ctx.Recipes.CountAsync(r => r.CreatedAt >= windowStart);
            var newUsers = await _ctx.AppUsers.CountAsync(u => u.CreatedAt >= windowStart);

            var admin = DashboardLogic.ToAdmin(baseSummary, weeklyActive, recipesCreated, newUsers);
            _response.Result = admin;
            _response.StatusCode = HttpStatusCode.OK;
            _response.IsSuccess = true;
            return Ok(_response);
        }
```

- [ ] **Step 6: Build and smoke-test both endpoints**

Run: `dotnet build API/API.csproj`
Expected: Build succeeded.

Run the API (`dotnet run --project API`) and in another shell:
`curl "http://localhost:5128/api/dashboard/admin?weeks=6"`
Expected: JSON with `isSuccess:true` and an `AdminDashboardDTO` in `result` (mostly zeros on a fresh DB — that's correct; empty state is handled client-side).

- [ ] **Step 7: Commit**

```bash
git add API/Controllers/DashboardController.cs API/Helpers/DashboardLogic.cs API.Tests/DashboardLogicTests.cs
git commit -m "feat(dashboard): admin aggregate endpoint"
```

---

## Task 8: Frontend — model + RTK Query module + store registration

**Files:**
- Create: `Frontend/src/models/dashboardModel.ts`
- Create: `Frontend/src/api/dashboardApi.ts`
- Modify: `Frontend/src/redux/store/storeRedux.ts`

- [ ] **Step 1: Create the TS model**

```typescript
// Frontend/src/models/dashboardModel.ts
export interface WeeklyPoint {
  weekLabel: string;
  weekStart: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
  other: number;
  totalMeals: number;
  avgCalories: number | null;
}

export interface NameCount {
  name: string;
  count: number;
}

export interface DashboardSummary {
  totalMealsPlanned: number;
  uniqueRecipes: number;
  varietyScore: number;
  varietyBand: "Low" | "Balanced" | "High";
  avgRating: number;
  ratingCount: number;
  avgCalories: number | null;
  avgProteinG: number;
  avgFatG: number;
  avgCarbsG: number;
  recipesPlanned: number;
  recipesWithNutrition: number;
  weekly: WeeklyPoint[];
  categoryMix: NameCount[];
  topRecipes: NameCount[];
  insightLine: string;
  hasData: boolean;
}

export interface AdminDashboard extends DashboardSummary {
  weeklyActiveUsers: number;
  recipesCreated: number;
  newUsers: number;
}
```

- [ ] **Step 2: Create the RTK Query module (mirrors `mealPlanApi.ts`)**

```typescript
// Frontend/src/api/dashboardApi.ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5128/api/",
  }),
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    getUserDashboard: builder.query({
      query: ({ userId, weeks = 6 }) => ({
        url: "dashboard/user",
        params: { userId, weeks },
      }),
      providesTags: ["Dashboard"],
    }),
    getAdminDashboard: builder.query({
      query: ({ weeks = 6 } = {}) => ({
        url: "dashboard/admin",
        params: { weeks },
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetUserDashboardQuery, useGetAdminDashboardQuery } = dashboardApi;
export default dashboardApi;
```

- [ ] **Step 3: Register in the store**

In `Frontend/src/redux/store/storeRedux.ts`:
- Add import after the other api imports: `import dashboardApi from "../../api/dashboardApi";`
- Add to the `reducer` object: `[dashboardApi.reducerPath]: dashboardApi.reducer,`
- Add to the middleware chain: `.concat(dashboardApi.middleware)`

- [ ] **Step 4: Verify the frontend compiles**

Run: `cd Frontend && npm run build`
Expected: build succeeds (no TS errors from the new files).

- [ ] **Step 5: Commit**

```bash
git add Frontend/src/models/dashboardModel.ts Frontend/src/api/dashboardApi.ts Frontend/src/redux/store/storeRedux.ts
git commit -m "feat(dashboard): dashboardApi RTK Query module + model + store wiring"
```

---

## Task 9: Frontend — reusable EmptyState + KpiTile + InsightLine

**Files:**
- Create: `Frontend/src/pages/dashboard/dashboard.css`
- Create: `Frontend/src/pages/dashboard/components/EmptyState.tsx`
- Create: `Frontend/src/pages/dashboard/components/KpiTile.tsx`
- Create: `Frontend/src/pages/dashboard/components/InsightLine.tsx`

- [ ] **Step 1: Create `dashboard.css`**

Lift the cockpit styles from the approved mockup. Copy the `<style>` block contents of `.superpowers/brainstorm/1408-1782705525/content/dashboard-concept-2-cockpit.html` into this file, dropping the `.masthead`/`.controls`/`.roletoggle` rules (the page shell provides those) and keeping: the `:root` variables, `.metric-grid`, `.kpi`, `.spark`, `.card`, `.legend`, `.chart`, `.axis-label`, `.bar-label`, `.value-lg`, the `col-*` helpers, and the responsive `@media` blocks. Prefix the root variables under a `.dashboard-root {` selector so they don't leak globally.

- [ ] **Step 2: Create `EmptyState.tsx`**

```tsx
// Frontend/src/pages/dashboard/components/EmptyState.tsx
import React from "react";

interface Props {
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const EmptyState: React.FC<Props> = ({ message, ctaLabel, onCta }) => (
  <div className="ds-empty">
    <p>{message}</p>
    {ctaLabel && (
      <button className="ds-empty-cta" onClick={onCta} type="button">
        {ctaLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
```

Add to `dashboard.css`:

```css
.ds-empty { text-align:center; padding:24px 12px; color:var(--muted); }
.ds-empty p { margin:0 0 12px; font-size:13px; }
.ds-empty-cta { background:var(--accent); color:#fff; border:0; border-radius:8px; padding:8px 16px; font-weight:600; font-size:13px; cursor:pointer; }
```

- [ ] **Step 3: Create `KpiTile.tsx`**

```tsx
// Frontend/src/pages/dashboard/components/KpiTile.tsx
import React from "react";

interface Props {
  label: string;
  value: string | number;
  delta?: string;
  deltaKind?: "up" | "flat";
  spark?: number[];        // 0..1 heights
  empty?: boolean;
  emptyText?: string;
}

const KpiTile: React.FC<Props> = ({ label, value, delta, deltaKind = "flat", spark, empty, emptyText }) => {
  if (empty) {
    return (
      <div className="kpi">
        <div className="label">{label}</div>
        <div className="val" style={{ color: "var(--muted)" }}>—</div>
        <div className="delta flat">{emptyText ?? "No data yet"}</div>
      </div>
    );
  }
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="val">{value}</div>
      {delta && <div className={`delta ${deltaKind}`}>{delta}</div>}
      {spark && spark.length > 0 && (
        <div className="spark">
          {spark.map((h, i) => (
            <i key={i} style={{ height: `${Math.max(4, Math.round(h * 100))}%` }} />
          ))}
        </div>
      )}
    </div>
  );
};

export default KpiTile;
```

- [ ] **Step 4: Create `InsightLine.tsx`**

```tsx
// Frontend/src/pages/dashboard/components/InsightLine.tsx
import React from "react";

interface Props {
  text: string;
}

// Renders the server-computed headline sentence. Renders nothing when empty
// (empty-data users get the empty state instead).
const InsightLine: React.FC<Props> = ({ text }) => {
  if (!text) return null;
  return <div className="ds-insight">{text}</div>;
};

export default InsightLine;
```

Add to `dashboard.css`:

```css
.ds-insight { font-family:var(--display, Georgia, serif); font-size:clamp(18px,2.4vw,24px); line-height:1.35; color:var(--ink); margin:0 0 20px; padding:16px 20px; background:var(--surface); border:1px solid var(--border); border-left:4px solid var(--accent); border-radius:12px; }
```

- [ ] **Step 5: Verify the frontend compiles**

Run: `cd Frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add Frontend/src/pages/dashboard
git commit -m "feat(dashboard): EmptyState, KpiTile, InsightLine components + styles"
```

---

## Task 10: Frontend — chart components (SVG)

**Files:**
- Create: `Frontend/src/pages/dashboard/components/StackedWeeklyChart.tsx`
- Create: `Frontend/src/pages/dashboard/components/CategoryDonut.tsx`
- Create: `Frontend/src/pages/dashboard/components/TopRecipesBar.tsx`
- Create: `Frontend/src/pages/dashboard/components/NutritionTrendLine.tsx`

- [ ] **Step 1: `StackedWeeklyChart.tsx`**

Port the `#stacked` SVG builder from the mockup into a React component. It renders a stacked bar (Breakfast/Lunch/Dinner/Snack) per `WeeklyPoint`. Palette from CSS vars `--s1,--s2,--s3,--s6`. If `weekly.every(w => w.totalMeals === 0)`, render `<EmptyState message="Plan meals to see your weekly rhythm." />` instead.

```tsx
// Frontend/src/pages/dashboard/components/StackedWeeklyChart.tsx
import React from "react";
import { WeeklyPoint } from "../../../models/dashboardModel";
import EmptyState from "./EmptyState";

const COLORS = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s6)"];
const KEYS: (keyof WeeklyPoint)[] = ["breakfast", "lunch", "dinner", "snack"];

const StackedWeeklyChart: React.FC<{ weekly: WeeklyPoint[] }> = ({ weekly }) => {
  if (!weekly.length || weekly.every((w) => w.totalMeals === 0)) {
    return <EmptyState message="Plan meals across a few weeks to see your rhythm here." />;
  }
  const W = 620, H = 240, padL = 34, padB = 28, padT = 10, padR = 10;
  const max = Math.max(6, ...weekly.map((w) => w.totalMeals));
  const bw = (W - padL - padR) / weekly.length;
  const ph = H - padB - padT;
  const ticks = [0, 1, 2, 3].map((g) => ({ y: padT + ph - (ph * g) / 3, v: Math.round((max * g) / 3) }));

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Meals planned per week by slot">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="var(--grid)" />
          <text x={padL - 6} y={t.y + 3} textAnchor="end" className="axis-label">{t.v}</text>
        </g>
      ))}
      {weekly.map((w, i) => {
        const x = padL + i * bw + bw * 0.22;
        const bwidth = bw * 0.56;
        let y0 = padT + ph;
        const vals = KEYS.map((k) => w[k] as number);
        return (
          <g key={i}>
            {vals.map((v, si) => {
              const h = (v / max) * ph;
              if (h <= 0) return null;
              y0 -= h;
              const rect = <rect key={si} x={x} y={y0} width={bwidth} height={Math.max(h - 2, 1)} fill={COLORS[si]} rx={3} />;
              y0 -= 2;
              return rect;
            })}
            <text x={padL + i * bw + bw / 2} y={H - 8} textAnchor="middle" className="axis-label">{w.weekLabel}</text>
          </g>
        );
      })}
    </svg>
  );
};

export default StackedWeeklyChart;
```

- [ ] **Step 2: `CategoryDonut.tsx`**

Port the `#donut` builder. Input: `NameCount[]`. Empty when array is empty.

```tsx
// Frontend/src/pages/dashboard/components/CategoryDonut.tsx
import React from "react";
import { NameCount } from "../../../models/dashboardModel";
import EmptyState from "./EmptyState";

const COLORS = ["var(--s3)", "var(--s2)", "var(--s1)", "var(--s5)", "var(--s6)", "var(--s4)"];

const CategoryDonut: React.FC<{ data: NameCount[] }> = ({ data }) => {
  if (!data.length) return <EmptyState message="No categories yet — plan some recipes." />;
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  const cx = 110, cy = 110, r = 78, rin = 48;
  let a0 = -Math.PI / 2;
  const arcs = data.map((d, idx) => {
    const frac = d.count / total, a1 = a0 + frac * Math.PI * 2, gap = 0.03;
    const s = a0 + gap / 2, e = a1 - gap / 2;
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const xi1 = cx + rin * Math.cos(e), yi1 = cy + rin * Math.sin(e);
    const xi2 = cx + rin * Math.cos(s), yi2 = cy + rin * Math.sin(s);
    const large = e - s > Math.PI ? 1 : 0;
    a0 = a1;
    return <path key={idx} d={`M${x1} ${y1}A${r} ${r} 0 ${large} 1 ${x2} ${y2}L${xi1} ${yi1}A${rin} ${rin} 0 ${large} 0 ${xi2} ${yi2}Z`} fill={COLORS[idx % COLORS.length]} />;
  });
  const top = data[0];
  return (
    <svg className="chart" viewBox="0 0 220 220" role="img" aria-label="Recipe category mix">
      {arcs}
      <text x={cx} y={cy - 2} textAnchor="middle" className="value-lg" fontSize="22" fill="var(--ink)">{top.name}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="axis-label">{Math.round((top.count / total) * 100)}% · top</text>
    </svg>
  );
};

export default CategoryDonut;
```

- [ ] **Step 3: `TopRecipesBar.tsx`**

```tsx
// Frontend/src/pages/dashboard/components/TopRecipesBar.tsx
import React from "react";
import { NameCount } from "../../../models/dashboardModel";
import EmptyState from "./EmptyState";

const TopRecipesBar: React.FC<{ data: NameCount[] }> = ({ data }) => {
  if (!data.length) return <EmptyState message="Plan recipes to see your most-planned dishes." />;
  const W = 480, padL = 110, padR = 30, rowH = 28, top = 8;
  const max = Math.max(2, ...data.map((d) => d.count));
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${Math.max(120, top + data.length * rowH)}`} role="img" aria-label="Most planned recipes">
      {data.map((d, i) => {
        const y = top + i * rowH;
        const w = (d.count / max) * (W - padL - padR);
        return (
          <g key={i}>
            <text x={padL - 10} y={y + 13} textAnchor="end" className="axis-label">{d.name}</text>
            <rect x={padL} y={y} height={18} width={Math.max(w, 2)} rx={4} fill={i === 0 ? "var(--s3)" : "var(--s1)"} opacity={i === 0 ? 1 : 0.82} />
            <text x={padL + w + 7} y={y + 13} className="bar-label">{d.count}×</text>
          </g>
        );
      })}
    </svg>
  );
};

export default TopRecipesBar;
```

- [ ] **Step 4: `NutritionTrendLine.tsx`**

Uses `weekly[].avgCalories`, skipping null weeks. If every week is null, render an empty state that explains the nutrition-coverage caveat.

```tsx
// Frontend/src/pages/dashboard/components/NutritionTrendLine.tsx
import React from "react";
import { WeeklyPoint } from "../../../models/dashboardModel";
import EmptyState from "./EmptyState";

const NutritionTrendLine: React.FC<{ weekly: WeeklyPoint[] }> = ({ weekly }) => {
  const pts = weekly.map((w, i) => ({ i, v: w.avgCalories, label: w.weekLabel }));
  const known = pts.filter((p) => p.v !== null) as { i: number; v: number; label: string }[];
  if (known.length < 2) {
    return <EmptyState message="Not enough analyzed recipes yet. Nutrition appears once planned recipes have AI estimates." />;
  }
  const W = 480, H = 200, padL = 42, padR = 16, padT = 14, padB = 28;
  const vs = known.map((p) => p.v);
  const min = Math.min(...vs) - 40, max = Math.max(...vs) + 40;
  const pw = W - padL - padR, ph = H - padT - padB;
  const X = (i: number) => padL + (i * pw) / (weekly.length - 1);
  const Y = (v: number) => padT + ph - ((v - min) / (max - min)) * ph;
  const d = known.map((p, idx) => `${idx === 0 ? "M" : "L"}${X(p.i)} ${Y(p.v)}`).join(" ");
  const ticks = [0, 1, 2, 3].map((g) => ({ y: padT + ph - (ph * g) / 3, v: Math.round(min + (max - min) * g / 3) }));
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Average planned calories per week">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={t.y} x2={W - padR} y2={t.y} stroke="var(--grid)" />
          <text x={padL - 8} y={t.y + 3} textAnchor="end" className="axis-label">{t.v}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke="var(--s1)" strokeWidth={2.5} strokeLinejoin="round" />
      {known.map((p, i) => (
        <circle key={i} cx={X(p.i)} cy={Y(p.v)} r={4} fill="var(--surface)" stroke="var(--s1)" strokeWidth={2.5} />
      ))}
      {weekly.map((w, i) => (
        <text key={i} x={X(i)} y={H - 8} textAnchor="middle" className="axis-label">{w.weekLabel}</text>
      ))}
    </svg>
  );
};

export default NutritionTrendLine;
```

- [ ] **Step 5: Verify compile**

Run: `cd Frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add Frontend/src/pages/dashboard/components
git commit -m "feat(dashboard): SVG chart components with empty states"
```

---

## Task 11: Frontend — Dashboard page (role switch, fetch, compose)

**Files:**
- Create: `Frontend/src/pages/dashboard/Dashboard.tsx`

- [ ] **Step 1: Build the page**

Reads the logged-in user id from the auth store (match how other pages do it — grep `userAuthStore` usage, e.g. `useSelector((s: RootState) => s.userAuthStore...)`). Role toggle defaults to "user"; "admin" tab visible only when the user's role is admin (reuse the same role source the `withAuthAdmin` HOC uses).

```tsx
// Frontend/src/pages/dashboard/Dashboard.tsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../redux/store/storeRedux";
import { useGetUserDashboardQuery, useGetAdminDashboardQuery } from "../../api/dashboardApi";
import { DashboardSummary, AdminDashboard } from "../../models/dashboardModel";
import InsightLine from "./components/InsightLine";
import KpiTile from "./components/KpiTile";
import StackedWeeklyChart from "./components/StackedWeeklyChart";
import CategoryDonut from "./components/CategoryDonut";
import TopRecipesBar from "./components/TopRecipesBar";
import NutritionTrendLine from "./components/NutritionTrendLine";
import EmptyState from "./components/EmptyState";
import "./dashboard.css";

const spark = (weekly: { totalMeals: number }[]) => {
  const max = Math.max(1, ...weekly.map((w) => w.totalMeals));
  return weekly.map((w) => w.totalMeals / max);
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // NOTE: match the real shape of userAuthStore in this codebase when wiring.
  const auth = useSelector((s: RootState) => (s as any).userAuthStore);
  const userId: string = auth?.user?.id ?? auth?.id ?? "";
  const role: string = (auth?.user?.role ?? auth?.role ?? "user").toLowerCase();
  const isAdmin = role === "admin";

  const [view, setView] = useState<"user" | "admin">("user");

  const userQ = useGetUserDashboardQuery({ userId, weeks: 6 }, { skip: view !== "user" || !userId });
  const adminQ = useGetAdminDashboardQuery({ weeks: 6 }, { skip: view !== "admin" });

  const loading = view === "user" ? userQ.isLoading : adminQ.isLoading;
  const data: DashboardSummary | AdminDashboard | undefined =
    (view === "user" ? userQ.data?.result : adminQ.data?.result) as any;

  return (
    <div className="dashboard-root">
      <div className="ds-head">
        <div>
          <div className="ds-kicker">Meal Planner</div>
          <h1 className="ds-title">{view === "user" ? "Your planning behavior" : "Platform behavior"}</h1>
        </div>
        {isAdmin && (
          <div className="roletoggle" role="group" aria-label="View">
            <button aria-pressed={view === "user"} onClick={() => setView("user")}>My dashboard</button>
            <button aria-pressed={view === "admin"} onClick={() => setView("admin")}>Platform</button>
          </div>
        )}
      </div>

      {loading && <div className="ds-loading">Loading…</div>}

      {!loading && data && !data.hasData && (
        <EmptyState
          message={view === "user"
            ? "You haven't planned any meals yet. Plan a few and your behavior dashboard comes to life."
            : "No user activity in this window yet."}
          ctaLabel={view === "user" ? "Plan a meal" : undefined}
          onCta={() => navigate("/mealPlan")}
        />
      )}

      {!loading && data && data.hasData && (
        <>
          <InsightLine text={data.insightLine} />
          <div className="metric-grid">
            <KpiTile
              label={view === "user" ? "Meals planned" : "Weekly active users"}
              value={view === "user" ? data.totalMealsPlanned : (data as AdminDashboard).weeklyActiveUsers}
              spark={spark(data.weekly)}
            />
            <KpiTile
              label="Recipe variety"
              value={`${data.uniqueRecipes} of ${data.totalMealsPlanned}`}
              delta={`${data.varietyBand} variety`}
            />
            <KpiTile
              label="Avg rating"
              value={data.ratingCount ? `${data.avgRating}★` : "—"}
              delta={`across ${data.ratingCount} ratings`}
              empty={!data.ratingCount}
              emptyText="No ratings yet"
            />
            <KpiTile
              label="Avg planned kcal /serving"
              value={data.avgCalories ?? "—"}
              delta={data.avgCalories
                ? `P ${data.avgProteinG}g · F ${data.avgFatG}g · C ${data.avgCarbsG}g`
                : `${data.recipesWithNutrition}/${data.recipesPlanned} recipes analyzed`}
              empty={data.avgCalories === null}
              emptyText={`${data.recipesWithNutrition}/${data.recipesPlanned} recipes analyzed`}
            />

            <div className="card col-8">
              <h3>Meals planned per week, by slot</h3>
              <div className="sub">From scheduled days × meal type</div>
              <div className="scroll-x"><StackedWeeklyChart weekly={data.weekly} /></div>
              <div className="legend">
                <span><span className="swatch" style={{ background: "var(--s1)" }} />Breakfast</span>
                <span><span className="swatch" style={{ background: "var(--s2)" }} />Lunch</span>
                <span><span className="swatch" style={{ background: "var(--s3)" }} />Dinner</span>
                <span><span className="swatch" style={{ background: "var(--s6)" }} />Snack</span>
              </div>
            </div>

            <div className="card col-4">
              <h3>Category mix</h3>
              <div className="sub">What you gravitate toward</div>
              <CategoryDonut data={data.categoryMix} />
            </div>

            <div className="card col-6">
              <h3>Most-planned recipes</h3>
              <div className="sub">Repetition, told plainly</div>
              <TopRecipesBar data={data.topRecipes} />
            </div>

            <div className="card col-6">
              <h3>Planned nutrition drift</h3>
              <div className="sub">Avg kcal/serving · analyzed recipes only</div>
              <NutritionTrendLine weekly={data.weekly} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
```

- [ ] **Step 2: Add page-shell styles to `dashboard.css`**

```css
.dashboard-root { max-width:1180px; margin:0 auto; padding:32px 28px 80px; font-family:var(--sans, "Segoe UI", system-ui, sans-serif); }
.ds-head { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:22px; flex-wrap:wrap; }
.ds-kicker { font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); font-weight:700; }
.ds-title { font-family:var(--display, Georgia, serif); font-weight:400; font-size:clamp(24px,4vw,36px); margin:8px 0 0; }
.ds-loading { color:var(--muted); padding:40px 0; }
.roletoggle { display:inline-flex; gap:4px; background:var(--surface); border:1px solid var(--border); border-radius:999px; padding:4px; }
.roletoggle button { font-family:inherit; font-size:12.5px; font-weight:600; border:0; background:transparent; color:var(--muted); padding:8px 16px; border-radius:999px; cursor:pointer; }
.roletoggle button[aria-pressed="true"] { background:var(--accent); color:#fff; }
```

- [ ] **Step 3: Verify compile**

Run: `cd Frontend && npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add Frontend/src/pages/dashboard/Dashboard.tsx Frontend/src/pages/dashboard/dashboard.css
git commit -m "feat(dashboard): Dashboard page with role switch, fetch, empty states"
```

---

## Task 12: Route the dashboard + verify end-to-end

**Files:**
- Modify: the app router (find it: `grep -rl "createBrowserRouter\|<Routes>\|<Route " Frontend/src`)

- [ ] **Step 1: Locate the router**

Run: `grep -rl "<Routes>\|createBrowserRouter\|element={<" Frontend/src`
Open the file that defines the app routes (likely `Frontend/src/App.tsx`).

- [ ] **Step 2: Add the route**

Add an import and a route. Wrap with the existing auth HOC used by other logged-in pages (grep `withAuth` usages to match). Example if using `<Routes>`:

```tsx
import Dashboard from "./pages/dashboard/Dashboard";
// ...
<Route path="/dashboard" element={<Dashboard />} />
```

If the app wraps logged-in pages with `withAuth`, mirror that: `element={withAuth(Dashboard)}` or the pattern already in use.

- [ ] **Step 3: Add a nav link (optional but expected)**

Find the nav/header component (grep `to="/mealPlan"`) and add a `<Link to="/dashboard">Dashboard</Link>` next to the existing links, matching their markup.

- [ ] **Step 4: End-to-end verification**

1. Start API: `dotnet run --project API`
2. Start frontend: `cd Frontend && npm start`
3. Log in, navigate to `/dashboard`.
4. **Empty path:** with a fresh account (no plans) confirm the empty state + "Plan a meal" CTA appears — NOT a wall of zeros or blank charts.
5. Create a few meal plans across different days/slots, ensure at least one recipe has nutrition (create a recipe with an OpenAI key set, or `POST api/recipe/{id}/estimate-nutrition`).
6. Reload `/dashboard`: confirm insight line renders, KPI tiles populate, all four charts draw, and the nutrition chart either shows a line or the coverage caveat.
7. As an admin account, confirm the "Platform" toggle appears and loads aggregate numbers.

- [ ] **Step 5: Commit**

```bash
git add Frontend/src
git commit -m "feat(dashboard): route + nav link for behavior dashboard"
```

---

## Out of scope (explicitly — do NOT build here)

These need new data modeling and belong to a follow-up plan. Show them in the UI only as labelled "coming soon" placeholders if desired; never fabricate values:

- **Plan → cook adherence** — requires an `IsCooked`/`CompletedAt` column on `MealPlanDays`. This is the highest-value follow-up.
- **Shopping follow-through** — requires persisting shopping-list generation + check-offs server-side (today they're browser localStorage, 3-day TTL).
- **Cost / budget** — no price data exists anywhere in the model.
- **Calorie-goal adherence** — no per-user target (no height/weight/age/goal on `AppUser`).

## Known follow-up (security)

The new endpoints match the existing **unprotected** controller pattern (no `[Authorize]`, `userId` passed as a param). The admin endpoint therefore is not role-gated server-side. Frontend hides the admin toggle for non-admins, but that is not real enforcement. A follow-up should add `[Authorize(Roles = "admin")]` to `GetAdminDashboard` and derive `userId` from the JWT for `GetUserDashboard`, ideally across all controllers at once.

## Self-review notes

- Every spec section maps to a task: DTOs (T1), variety band (T2), weekly bucketing (T3), insight line (T4), user endpoint (T5), aggregation (T6), admin endpoint (T7), frontend api/model/store (T8), tiles/insight/empty (T9), charts (T10), page (T11), routing + e2e (T12).
- Type consistency: `DashboardSummaryDTO`/`AdminDashboardDTO` ↔ TS `DashboardSummary`/`AdminDashboard`; `WeeklyPointDTO` ↔ `WeeklyPoint`; `NameCountDTO` ↔ `NameCount`; method names `BuildSummary`, `BucketByWeek`, `VarietyBand`, `BuildInsightLine`, `ToAdmin` used identically across tasks.
- Empty states covered at both the page level (`hasData=false`) and per-chart level.
- No placeholders — all steps include concrete code and commands.
