# Shopping List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a deduplicated grocery list from the recipes a user has scheduled in a date range, computed on demand, with check-off state kept in the browser.

**Architecture:** A `ShoppingListController` (route `api/shoppingList`) queries `MealPlanDays.Date` within a range for a user, loads the scheduled recipes' ingredients, groups them by normalized name, and returns a grouped DTO. No new table, migration, or infrastructure. The frontend adds a `shoppingListApi` RTK Query module and a `ShoppingList` view triggered from `MealPlanner.tsx`; check-off state lives in `localStorage` with a 3-day self-expiry.

**Tech Stack:** ASP.NET Core 8, EF Core 8 (MySQL/Pomelo at runtime), xUnit + EF Core Sqlite in-memory for tests, React + TypeScript + RTK Query, RSuite 5.

**Spec:** `docs/superpowers/specs/2026-07-02-shopping-list-design.md`

> **Note:** This plan uses the shared `API.Tests` xUnit project. If it does not yet exist (Shopping List built before Meal Rating), first run **Task 1 of the Meal Rating plan** (`2026-07-02-meal-rating.md`) to stand it up, then continue here from Task 1 below.

---

### Task 1: Shopping list DTO

**Files:**
- Create: `API/Models/DTO/ShoppingListDTO.cs`

- [ ] **Step 1: Create the DTO**

Create `API/Models/DTO/ShoppingListDTO.cs`:
```csharp
using System.Collections.Generic;

namespace FoodFestAPI.Models.DTO
{
    public class ShoppingListItemDTO
    {
        public string Name { get; set; }              // display name (first-seen casing)
        public List<string> Units { get; set; }       // distinct unit strings across sources
        public List<string> FromRecipes { get; set; } // source recipe names
    }
}
```

- [ ] **Step 2: Build to verify it compiles**

Run: `dotnet build API/FoodFestAPI.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add API/Models/DTO/ShoppingListDTO.cs
git commit -m "feat(shopping): add ShoppingListItemDTO

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Aggregation logic (test-first)

The grouping/dedup logic is the part worth testing. Extract it into a static helper `ShoppingListLogic.Aggregate` that takes the loaded meal-plan-days graph and returns the grouped DTOs, so it can be unit-tested against a Sqlite in-memory DB.

**Files:**
- Create: `API/Helpers/ShoppingListLogic.cs`
- Test: `API.Tests/ShoppingListLogicTests.cs`

- [ ] **Step 1: Write failing tests**

Create `API.Tests/ShoppingListLogicTests.cs`:
```csharp
using API.Tests;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models;
using Xunit;

public class ShoppingListLogicTests
{
    // Builds: recipe "Carbonara" (Eggs pcs, Bacon g) scheduled 2026-07-05,
    //         recipe "Omelette"  (eggs pcs) scheduled 2026-07-06,
    //         recipe "Cake"      (Flour g) scheduled 2026-07-20 (out of range).
    private static (ApplicationDbContext ctx, Microsoft.Data.Sqlite.SqliteConnection conn) Seed()
    {
        var (ctx, conn) = TestDbContextFactory.Create();

        var carbonara = new Recipe { Name = "Carbonara", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", UserId = "u1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var omelette = new Recipe { Name = "Omelette", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", UserId = "u1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var cake = new Recipe { Name = "Cake", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", UserId = "u1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        ctx.Recipes.AddRange(carbonara, omelette, cake);
        ctx.SaveChanges();

        ctx.Ingredients.AddRange(
            new Ingredient { Name = "Eggs", Unit = "pcs", Description = "", RecipeId = carbonara.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Ingredient { Name = "Bacon", Unit = "g", Description = "", RecipeId = carbonara.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Ingredient { Name = "eggs", Unit = "pcs", Description = "", RecipeId = omelette.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Ingredient { Name = "Flour", Unit = "g", Description = "", RecipeId = cake.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        );
        ctx.SaveChanges();

        var mpCarb = new MealPlans { MealType = "Dinner", PlanName = "P", StartDate = new DateTime(2026, 7, 5), EndDate = new DateTime(2026, 7, 5), RecipeId = carbonara.Id, UserID = "u1" };
        var mpOmel = new MealPlans { MealType = "Breakfast", PlanName = "P", StartDate = new DateTime(2026, 7, 6), EndDate = new DateTime(2026, 7, 6), RecipeId = omelette.Id, UserID = "u1" };
        var mpCake = new MealPlans { MealType = "Dessert", PlanName = "P", StartDate = new DateTime(2026, 7, 20), EndDate = new DateTime(2026, 7, 20), RecipeId = cake.Id, UserID = "u1" };
        ctx.MealPlans.AddRange(mpCarb, mpOmel, mpCake);
        ctx.SaveChanges();

        ctx.MealPlanDays.AddRange(
            new MealPlanDays { MealPlanId = mpCarb.Id, Date = new DateTime(2026, 7, 5) },
            new MealPlanDays { MealPlanId = mpOmel.Id, Date = new DateTime(2026, 7, 6) },
            new MealPlanDays { MealPlanId = mpCake.Id, Date = new DateTime(2026, 7, 20) }
        );
        ctx.SaveChanges();

        return (ctx, conn);
    }

    [Fact]
    public async Task Groups_by_normalized_name_within_range_and_excludes_out_of_range()
    {
        var (ctx, conn) = Seed();
        try
        {
            var list = await ShoppingListLogic.GenerateAsync(ctx, "u1", new DateTime(2026, 7, 5), new DateTime(2026, 7, 11));

            // Eggs (from both recipes, case-insensitive) + Bacon = 2 groups; Flour excluded (out of range).
            Assert.Equal(2, list.Count);

            var eggs = list.Single(i => i.Name.ToLower() == "eggs");
            Assert.Equal(new[] { "pcs" }, eggs.Units.ToArray());
            Assert.Equal(2, eggs.FromRecipes.Count); // Carbonara + Omelette
            Assert.Contains("Carbonara", eggs.FromRecipes);
            Assert.Contains("Omelette", eggs.FromRecipes);

            Assert.Contains(list, i => i.Name == "Bacon");
            Assert.DoesNotContain(list, i => i.Name == "Flour");
        }
        finally { conn.Dispose(); }
    }

    [Fact]
    public async Task Empty_range_returns_empty_list()
    {
        var (ctx, conn) = Seed();
        try
        {
            var list = await ShoppingListLogic.GenerateAsync(ctx, "u1", new DateTime(2026, 1, 1), new DateTime(2026, 1, 2));
            Assert.Empty(list);
        }
        finally { conn.Dispose(); }
    }

    [Fact]
    public async Task Recipe_scheduled_twice_in_range_lists_ingredient_once()
    {
        var (ctx, conn) = Seed();
        try
        {
            // Add a second scheduled day for Carbonara within the range.
            var carb = ctx.Recipes.Single(r => r.Name == "Carbonara");
            var mp = ctx.MealPlans.First(m => m.RecipeId == carb.Id);
            ctx.MealPlanDays.Add(new MealPlanDays { MealPlanId = mp.Id, Date = new DateTime(2026, 7, 7) });
            ctx.SaveChanges();

            var list = await ShoppingListLogic.GenerateAsync(ctx, "u1", new DateTime(2026, 7, 5), new DateTime(2026, 7, 11));
            var bacon = list.Single(i => i.Name == "Bacon");
            Assert.Single(bacon.FromRecipes); // Carbonara listed once, not twice
        }
        finally { conn.Dispose(); }
    }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: FAIL — `ShoppingListLogic` does not exist (compile error).

- [ ] **Step 3: Implement `ShoppingListLogic`**

Create `API/Helpers/ShoppingListLogic.cs`:
```csharp
using FoodFestAPI.Data;
using FoodFestAPI.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace FoodFestAPI.Helpers
{
    // Builds a grouped shopping list from the meal-plan days scheduled within a
    // date range for a user. Grouping is by normalized ingredient name; there is
    // no quantity summation (Ingredient has no numeric quantity).
    public static class ShoppingListLogic
    {
        public static async Task<List<ShoppingListItemDTO>> GenerateAsync(
            ApplicationDbContext ctx, string userId, DateTime start, DateTime end)
        {
            // Recipes actually cooked on days within the range, for this user.
            var days = await ctx.MealPlanDays
                .Include(d => d.MealPlans).ThenInclude(m => m.Recipe).ThenInclude(r => r.Ingredients)
                .Where(d => d.MealPlans.UserID == userId
                         && d.Date >= start && d.Date <= end)
                .ToListAsync();

            // Distinct recipes (a recipe scheduled on several in-range days counts once).
            var recipes = days
                .Select(d => d.MealPlans?.Recipe)
                .Where(r => r != null)
                .GroupBy(r => r.Id)
                .Select(g => g.First())
                .ToList();

            // Flatten to (recipeName, ingredient) pairs.
            var pairs = recipes
                .SelectMany(r => (r.Ingredients ?? new List<Models.Ingredient>())
                    .Select(i => new { RecipeName = r.Name, Ingredient = i }))
                .Where(p => !string.IsNullOrWhiteSpace(p.Ingredient?.Name))
                .ToList();

            // Group by normalized name.
            var groups = pairs
                .GroupBy(p => p.Ingredient.Name.Trim().ToLower())
                .Select(g => new ShoppingListItemDTO
                {
                    Name = g.First().Ingredient.Name.Trim(), // first-seen casing
                    Units = g
                        .Select(p => p.Ingredient.Unit)
                        .Where(u => !string.IsNullOrWhiteSpace(u))
                        .Distinct()
                        .ToList(),
                    FromRecipes = g
                        .Select(p => p.RecipeName)
                        .Distinct()
                        .ToList()
                })
                .OrderBy(i => i.Name)
                .ToList();

            return groups;
        }
    }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: PASS (all three shopping-list tests green).

- [ ] **Step 5: Commit**

```bash
git add API/Helpers/ShoppingListLogic.cs API.Tests/ShoppingListLogicTests.cs
git commit -m "feat(shopping): aggregation logic grouping ingredients by normalized name

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `ShoppingListController`

**Files:**
- Create: `API/Controllers/ShoppingListController.cs`

- [ ] **Step 1: Implement the controller (thin HTTP wrapper)**

Create `API/Controllers/ShoppingListController.cs`:
```csharp
using FoodFestAPI.Data;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace FoodFestAPI.Controllers
{
    [Route("api/shoppingList")]
    [ApiController]
    public class ShoppingListController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private ApiResponse _response;
        private readonly ILogger<ShoppingListController> _log;

        public ShoppingListController(ApplicationDbContext ctx, ILogger<ShoppingListController> log)
        {
            _ctx = ctx;
            _response = new ApiResponse();
            _log = log;
        }

        // Grocery list for the recipes a user has scheduled within [start, end].
        [HttpGet]
        public async Task<ActionResult<ApiResponse>> Generate(
            [FromQuery] string userId, [FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessages = new List<string>() { "userId is required." };
                    return BadRequest(_response);
                }

                var list = await ShoppingListLogic.GenerateAsync(_ctx, userId, start, end);

                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
                _response.Result = list; // empty list when nothing scheduled — honest empty state
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _log.LogError($"Internal server error, {ex.Message}");
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessages = new List<string>() { ex.ToString() };
                return StatusCode(500, _response);
            }
        }
    }
}
```

- [ ] **Step 2: Build the API**

Run: `dotnet build API/FoodFestAPI.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add API/Controllers/ShoppingListController.cs
git commit -m "feat(shopping): ShoppingListController generating list by scheduled range

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Manual API verification

**Files:** none (verification only).

- [ ] **Step 1: Run the API**

Run: `dotnet run --project API/FoodFestAPI.csproj`
Expected: listening on `http://localhost:5128`. Ensure the dev DB has a user with at least one meal plan whose `MealPlanDays.Date` falls in a known range.

- [ ] **Step 2: Generate a list for a populated range**

```bash
curl -s "http://localhost:5128/api/shoppingList?userId=<real-user-id>&start=2026-07-05&end=2026-07-11"
```
Expected: `isSuccess: true`, `result` = array of `{ name, units, fromRecipes }`, ingredients deduped by name, sorted alphabetically.

- [ ] **Step 3: Empty range returns empty list**

```bash
curl -s "http://localhost:5128/api/shoppingList?userId=<real-user-id>&start=2020-01-01&end=2020-01-02"
```
Expected: `isSuccess: true`, `result: []` (200, not an error).

- [ ] **Step 4: Missing userId rejected**

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5128/api/shoppingList?start=2026-07-05&end=2026-07-11"
```
Expected: `400`.

No commit (verification only).

---

### Task 5: Frontend `shoppingListApi` RTK Query module

**Files:**
- Create: `Frontend/src/api/shoppingListApi.ts`
- Modify: `Frontend/src/redux/store/storeRedux.ts`

- [ ] **Step 1: Create the API module**

Create `Frontend/src/api/shoppingListApi.ts`:
```ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const shoppingListApi = createApi({
  reducerPath: "shoppingListApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5128/api/",
  }),
  tagTypes: ["ShoppingList"],
  endpoints: (builder) => ({
    generateShoppingList: builder.query({
      query: ({ userId, start, end }) => ({
        url: "shoppingList",
        params: { userId, start, end },
      }),
      providesTags: ["ShoppingList"],
    }),
  }),
});

export const { useGenerateShoppingListQuery } = shoppingListApi;

export default shoppingListApi;
```

- [ ] **Step 2: Register in the store**

In `Frontend/src/redux/store/storeRedux.ts`:

Add import after the `mealPlanApi` import:
```ts
import shoppingListApi from "../../api/shoppingListApi";
```
Add to the `reducer` object:
```ts
        [shoppingListApi.reducerPath]: shoppingListApi.reducer,
```
Add to the middleware chain (as the last `.concat`, keeping the closing `;`):
```ts
        .concat(shoppingListApi.middleware),
```

- [ ] **Step 3: Verify frontend build**

Run from `Frontend/`: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add Frontend/src/api/shoppingListApi.ts Frontend/src/redux/store/storeRedux.ts
git commit -m "feat(shopping): add shoppingListApi RTK Query module and register in store

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: `localStorage` check-off helper (3-day expiry)

**Files:**
- Create: `Frontend/src/utils/shoppingListChecks.ts`

- [ ] **Step 1: Create the helper**

Create `Frontend/src/utils/shoppingListChecks.ts`:
```ts
// Per-device check-off state for a generated shopping list, keyed by user +
// date range, with a self-expiring window (browser-side equivalent of a TTL).
const EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

type Stored = { checked: string[]; expiresAt: number };

function keyFor(userId: string, start: string, end: string) {
  return `shoppingList:${userId}:${start}_${end}`;
}

export function loadChecks(userId: string, start: string, end: string): string[] {
  try {
    const raw = localStorage.getItem(keyFor(userId, start, end));
    if (!raw) return [];
    const parsed: Stored = JSON.parse(raw);
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(keyFor(userId, start, end));
      return [];
    }
    return Array.isArray(parsed.checked) ? parsed.checked : [];
  } catch {
    return [];
  }
}

export function saveChecks(userId: string, start: string, end: string, checked: string[]) {
  try {
    const value: Stored = { checked, expiresAt: Date.now() + EXPIRY_MS };
    localStorage.setItem(keyFor(userId, start, end), JSON.stringify(value));
  } catch {
    // storage unavailable/full — check state is best-effort, ignore
  }
}

export function toggleCheck(current: string[], name: string): string[] {
  return current.includes(name)
    ? current.filter((n) => n !== name)
    : [...current, name];
}
```

- [ ] **Step 2: Verify build**

Run from `Frontend/`: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/utils/shoppingListChecks.ts
git commit -m "feat(shopping): localStorage check-off helper with 3-day expiry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: `ShoppingList` view + entry point on `MealPlanner.tsx`

**Files:**
- Create: `Frontend/src/pages/mealPlan/ShoppingList.tsx` (adjust folder to wherever `MealPlanner.tsx` lives — see Step 1)
- Modify: `Frontend/src/pages/.../MealPlanner.tsx`

- [ ] **Step 1: Locate `MealPlanner.tsx` and its current date-range state**

Confirm the path of `MealPlanner.tsx` (the source report references it and it reads `userData.id`). Note how it holds the currently-viewed range (start/end dates) — the shopping list reuses those. Place `ShoppingList.tsx` alongside it.

- [ ] **Step 2: Create the `ShoppingList` view**

Create `ShoppingList.tsx` in the same folder as `MealPlanner.tsx`:
```tsx
import { useEffect, useState } from "react";
import { Checkbox, Loader, Message } from "rsuite";
import { useGenerateShoppingListQuery } from "../../api/shoppingListApi";
import { loadChecks, saveChecks, toggleCheck } from "../../utils/shoppingListChecks";

type Props = { userId: string; start: string; end: string };

export default function ShoppingList({ userId, start, end }: Props) {
  const { data, isLoading, isError } = useGenerateShoppingListQuery(
    { userId, start, end },
    { skip: !userId }
  );
  const items: any[] = data?.result ?? [];
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    setChecked(loadChecks(userId, start, end));
  }, [userId, start, end]);

  const onToggle = (name: string) => {
    const next = toggleCheck(checked, name);
    setChecked(next);
    saveChecks(userId, start, end, next);
  };

  if (isLoading) return <Loader content="Building your list…" />;
  if (isError) return <Message type="error">Couldn't build the shopping list.</Message>;
  if (items.length === 0) return <Message type="info">Nothing scheduled in this range.</Message>;

  return (
    <div>
      {items.map((item) => {
        const key = item.name.trim().toLowerCase();
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Checkbox
              checked={checked.includes(key)}
              onChange={() => onToggle(key)}
            />
            <span style={{ textDecoration: checked.includes(key) ? "line-through" : "none" }}>
              {item.name}
              {item.units?.length ? ` — ${item.units.join(", ")}` : ""}
            </span>
            {item.fromRecipes?.length ? (
              <span style={{ color: "var(--bm-faint)", fontSize: 12 }}>
                from: {item.fromRecipes.join(", ")}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Add the entry point in `MealPlanner.tsx`**

In `MealPlanner.tsx`, import the view and add a "Generate shopping list" toggle (RSuite `Button` + conditional render). Reuse the existing `userData.id` and the current range state (format dates as `YYYY-MM-DD` strings to match the API's `DateTime` query binding). Example wiring:
```tsx
import { useState } from "react";
import { Button } from "rsuite";
import ShoppingList from "./ShoppingList";

// inside the component, alongside existing state:
const [showList, setShowList] = useState(false);
// `rangeStart`/`rangeEnd` = the component's current week range as YYYY-MM-DD strings
```
And in the JSX:
```tsx
<Button appearance="primary" onClick={() => setShowList((v) => !v)}>
  {showList ? "Hide shopping list" : "Generate shopping list"}
</Button>
{showList && (
  <ShoppingList userId={userData.id} start={rangeStart} end={rangeEnd} />
)}
```
(Match the actual variable names `MealPlanner.tsx` uses for the user id and the selected range; if the range is stored as `Date` objects, convert with `.toISOString().slice(0, 10)`.)

- [ ] **Step 4: Verify build**

Run from `Frontend/`: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manual check in the browser**

Start the API and frontend. Log in, open the Meal Planner, ensure the visible week has recipes scheduled, click "Generate shopping list".
Expected: a deduped, checkable list grouped by ingredient with unit + source-recipe text. Check some items, reload the page — checks persist. An empty week shows "Nothing scheduled in this range."

- [ ] **Step 6: Commit**

```bash
git add Frontend/src/pages
git commit -m "feat(shopping): ShoppingList view + Generate button on Meal Planner

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Done criteria

- `dotnet test API.Tests/API.Tests.csproj` — shopping-list logic tests green (grouping, empty range, dedup of a twice-scheduled recipe).
- `GET api/shoppingList?userId=&start=&end=` returns a grouped, alphabetized list by scheduled day; empty range → `[]` with 200; missing userId → 400.
- From a populated week, the user gets a checkable grocery list; checks persist across reloads on the same device and self-clear after 3 days.
- No new database table, migration, or infrastructure introduced.
