# Meal Rating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let logged-in users give a recipe a 1–5 star rating (one per user per recipe, editable), and surface the average on the detail page and recipe cards.

**Architecture:** New `RecipeRating` entity with a unique `(UserId, RecipeId)` index (upsert semantics). A `RatingController` (route `api/rating`) exposes upsert, a batch average-summary endpoint, and a "my rating" lookup — all following the existing `userId`-as-param convention (no `[Authorize]`). Frontend adds a `ratingApi` RTK Query module; `SingleProduct.tsx` gets an interactive RSuite `Rate` widget replacing its TODO placeholder, and recipe cards render a read-only average via a single batch call.

**Tech Stack:** ASP.NET Core 8, EF Core 8 (MySQL/Pomelo at runtime), xUnit + EF Core Sqlite in-memory for tests, React + TypeScript + RTK Query, RSuite 5.

**Spec:** `docs/superpowers/specs/2026-07-02-meal-rating-design.md`

> **Note:** Task 1 stands up the shared xUnit test project used by BOTH this plan and the Shopping List plan. If the test project already exists (Shopping List built first), skip Task 1 and reuse `API.Tests`.

---

### Task 1: Stand up the xUnit test project (shared)

**Files:**
- Create: `API.Tests/API.Tests.csproj`
- Create: `API.Tests/TestDbContextFactory.cs`
- Create: `API.Tests/SmokeTest.cs`
- Modify: `FoodFest.sln` if a solution file exists (none currently — skip if absent)

- [ ] **Step 1: Create the test project**

Run from repo root:
```bash
dotnet new xunit -n API.Tests -o API.Tests
dotnet add API.Tests/API.Tests.csproj reference API/FoodFestAPI.csproj
dotnet add API.Tests/API.Tests.csproj package Microsoft.EntityFrameworkCore.Sqlite --version 8.0.2
dotnet add API.Tests/API.Tests.csproj package Microsoft.EntityFrameworkCore.InMemory --version 8.0.2
```

- [ ] **Step 2: Add a DbContext factory helper using Sqlite in-memory**

Sqlite in-memory (not the InMemory provider) is used because it enforces the unique index we add for ratings; the InMemory provider ignores indexes.

Create `API.Tests/TestDbContextFactory.cs`:
```csharp
using FoodFestAPI.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace API.Tests;

// Creates an ApplicationDbContext backed by a fresh Sqlite in-memory database.
// The caller must keep the returned connection open for the DB's lifetime and
// dispose it when done. Sqlite enforces unique indexes (unlike the EF InMemory
// provider), so uniqueness constraints are actually exercised by tests.
public static class TestDbContextFactory
{
    public static (ApplicationDbContext ctx, SqliteConnection conn) Create()
    {
        var conn = new SqliteConnection("DataSource=:memory:");
        conn.Open();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(conn)
            .Options;

        var ctx = new ApplicationDbContext(options);
        ctx.Database.EnsureCreated();
        return (ctx, conn);
    }
}
```

- [ ] **Step 3: Add a smoke test that proves the harness works**

Create `API.Tests/SmokeTest.cs`:
```csharp
using API.Tests;
using Xunit;

public class SmokeTest
{
    [Fact]
    public void Can_create_context_and_seeded_categories_exist()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            // OnModelCreating seeds 6 categories via HasData.
            Assert.Equal(6, ctx.Categories.Count());
        }
        finally
        {
            conn.Dispose();
        }
    }
}
```

- [ ] **Step 4: Run the smoke test**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: PASS (1 test passed).

If it fails because `ApplicationDbContext` requires a non-generic `DbContextOptions` ctor, note that its ctor is `ApplicationDbContext(DbContextOptions optionts)` — the `DbContextOptionsBuilder<ApplicationDbContext>.Options` is assignable to `DbContextOptions`, so this works as written.

- [ ] **Step 5: Commit**

```bash
git add API.Tests
git commit -m "test: add xUnit project with Sqlite in-memory DbContext factory

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `RecipeRating` entity + DbSet + unique index

**Files:**
- Create: `API/Models/RecipeRating.cs`
- Modify: `API/Data/ApplicationDbContext.cs` (add DbSet at line 19; add index config in `OnModelCreating`)
- Test: `API.Tests/RecipeRatingModelTests.cs`

- [ ] **Step 1: Write the failing test for the unique constraint**

Create `API.Tests/RecipeRatingModelTests.cs`:
```csharp
using API.Tests;
using FoodFestAPI.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class RecipeRatingModelTests
{
    [Fact]
    public async Task Duplicate_user_recipe_rating_is_rejected_by_unique_index()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            ctx.RecipeRatings.Add(new RecipeRating { UserId = "u1", RecipeId = 1, Stars = 5, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            await ctx.SaveChangesAsync();

            ctx.RecipeRatings.Add(new RecipeRating { UserId = "u1", RecipeId = 1, Stars = 3, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });

            await Assert.ThrowsAnyAsync<DbUpdateException>(() => ctx.SaveChangesAsync());
        }
        finally
        {
            conn.Dispose();
        }
    }
}
```

- [ ] **Step 2: Run it to verify it fails to compile**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: FAIL — `RecipeRating` / `ctx.RecipeRatings` do not exist (compile error).

- [ ] **Step 3: Create the entity**

Create `API/Models/RecipeRating.cs`:
```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodFestAPI.Models
{
    public class RecipeRating
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }   // AppUser.Id (ASP.NET Identity string)

        [Required]
        public int RecipeId { get; set; }

        [Required]
        public int Stars { get; set; }        // 1–5, validated in the controller

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("RecipeId")]
        public Recipe Recipe { get; set; }
    }
}
```

- [ ] **Step 4: Register the DbSet and unique index**

In `API/Data/ApplicationDbContext.cs`, add after line 19 (`public DbSet<MealPlanDays> MealPlanDays { get; set; }`):
```csharp
        public DbSet<RecipeRating> RecipeRatings { get; set; }
```

In the same file, inside `OnModelCreating`, after the `HasData` block (before the closing brace of the method), add:
```csharp
            builder.Entity<RecipeRating>()
                .HasIndex(r => new { r.UserId, r.RecipeId })
                .IsUnique();
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add API/Models/RecipeRating.cs API/Data/ApplicationDbContext.cs API.Tests/RecipeRatingModelTests.cs
git commit -m "feat(rating): add RecipeRating entity with unique (UserId, RecipeId) index

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: EF migration `AddRecipeRating`

**Files:**
- Create: `API/Migrations/<timestamp>_AddRecipeRating.cs` (generated)
- Modify: `API/Migrations/ApplicationDbContextModelSnapshot.cs` (generated)

- [ ] **Step 1: Generate the migration**

Run from repo root:
```bash
dotnet ef migrations add AddRecipeRating --project API/FoodFestAPI.csproj
```
Expected: a new migration file appears under `API/Migrations/` creating a `RecipeRatings` table and a unique index on `(UserId, RecipeId)`.

- [ ] **Step 2: Inspect the generated migration**

Open the generated `*_AddRecipeRating.cs`. Confirm `Up()` calls `migrationBuilder.CreateTable(name: "RecipeRatings", ...)` with columns `Id, UserId, RecipeId, Stars, CreatedAt, UpdatedAt` and a `CreateIndex(..., unique: true)` on `UserId, RecipeId`. Confirm `Down()` drops the table. If the columns/index are wrong, fix the entity/config in Task 2 and regenerate.

- [ ] **Step 3: Apply the migration to the dev database**

Run: `dotnet ef database update --project API/FoodFestAPI.csproj`
Expected: "Done." and the `RecipeRatings` table exists in the MySQL dev DB. (Requires the dev DB connection configured in `appsettings`/env.)

- [ ] **Step 4: Commit**

```bash
git add API/Migrations
git commit -m "feat(rating): EF migration AddRecipeRating

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Rating DTOs

**Files:**
- Create: `API/Models/DTO/RatingDTO.cs`

- [ ] **Step 1: Create the DTOs**

Create `API/Models/DTO/RatingDTO.cs`:
```csharp
namespace FoodFestAPI.Models.DTO
{
    public class RatingRequestDTO
    {
        public string UserId { get; set; }
        public int RecipeId { get; set; }
        public int Stars { get; set; }
    }

    public class RatingSummaryDTO
    {
        public int RecipeId { get; set; }
        public double Average { get; set; }
        public int Count { get; set; }
    }
}
```

- [ ] **Step 2: Build to verify it compiles**

Run: `dotnet build API/FoodFestAPI.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Commit**

```bash
git add API/Models/DTO/RatingDTO.cs
git commit -m "feat(rating): add rating request/summary DTOs

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: Rating aggregation logic (test-first) + `RatingController`

The controller's own EF calls are thin; the logic worth testing is (a) upsert (insert then update, never duplicate) and (b) the batch summary grouping/rounding. We test these against the real `ApplicationDbContext` (Sqlite) by exercising a small static helper the controller also calls, keeping the controller a thin HTTP wrapper.

**Files:**
- Create: `API/Helpers/RatingLogic.cs`
- Create: `API/Controllers/RatingController.cs`
- Test: `API.Tests/RatingLogicTests.cs`

- [ ] **Step 1: Write failing tests for upsert + summary**

Create `API.Tests/RatingLogicTests.cs`:
```csharp
using API.Tests;
using FoodFestAPI.Helpers;
using Xunit;

public class RatingLogicTests
{
    [Fact]
    public async Task Upsert_inserts_then_updates_same_row()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            await RatingLogic.UpsertAsync(ctx, "u1", 1, 4);
            await RatingLogic.UpsertAsync(ctx, "u1", 1, 2);

            var all = ctx.RecipeRatings.Where(r => r.UserId == "u1" && r.RecipeId == 1).ToList();
            Assert.Single(all);
            Assert.Equal(2, all[0].Stars);
        }
        finally { conn.Dispose(); }
    }

    [Fact]
    public async Task Summary_averages_and_counts_per_recipe()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            await RatingLogic.UpsertAsync(ctx, "u1", 1, 5);
            await RatingLogic.UpsertAsync(ctx, "u2", 1, 4);
            await RatingLogic.UpsertAsync(ctx, "u1", 2, 3);

            var summary = await RatingLogic.SummaryAsync(ctx, new[] { 1, 2, 99 });

            var r1 = summary.Single(s => s.RecipeId == 1);
            Assert.Equal(4.5, r1.Average);
            Assert.Equal(2, r1.Count);
            var r2 = summary.Single(s => s.RecipeId == 2);
            Assert.Equal(3.0, r2.Average);
            Assert.Equal(1, r2.Count);
            // recipe 99 has no ratings → absent from result
            Assert.DoesNotContain(summary, s => s.RecipeId == 99);
        }
        finally { conn.Dispose(); }
    }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: FAIL — `RatingLogic` does not exist (compile error).

- [ ] **Step 3: Implement `RatingLogic`**

Create `API/Helpers/RatingLogic.cs`:
```csharp
using FoodFestAPI.Data;
using FoodFestAPI.Models;
using FoodFestAPI.Models.DTO;
using Microsoft.EntityFrameworkCore;

namespace FoodFestAPI.Helpers
{
    // Pure-ish rating operations over the DbContext, extracted so they can be
    // unit-tested against a Sqlite in-memory DB without going through HTTP.
    public static class RatingLogic
    {
        public static async Task<RecipeRating> UpsertAsync(ApplicationDbContext ctx, string userId, int recipeId, int stars)
        {
            var existing = await ctx.RecipeRatings
                .FirstOrDefaultAsync(r => r.UserId == userId && r.RecipeId == recipeId);

            if (existing != null)
            {
                existing.Stars = stars;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existing = new RecipeRating
                {
                    UserId = userId,
                    RecipeId = recipeId,
                    Stars = stars,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                ctx.RecipeRatings.Add(existing);
            }

            await ctx.SaveChangesAsync();
            return existing;
        }

        public static async Task<List<RatingSummaryDTO>> SummaryAsync(ApplicationDbContext ctx, IEnumerable<int> recipeIds)
        {
            var ids = recipeIds.ToList();
            return await ctx.RecipeRatings
                .Where(r => ids.Contains(r.RecipeId))
                .GroupBy(r => r.RecipeId)
                .Select(g => new RatingSummaryDTO
                {
                    RecipeId = g.Key,
                    Average = Math.Round(g.Average(x => (double)x.Stars), 1),
                    Count = g.Count()
                })
                .ToListAsync();
        }
    }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: PASS (all rating tests green).

- [ ] **Step 5: Implement `RatingController` (thin HTTP wrapper)**

Create `API/Controllers/RatingController.cs`:
```csharp
using FoodFestAPI.Data;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models;
using FoodFestAPI.Models.DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace FoodFestAPI.Controllers
{
    [Route("api/rating")]
    [ApiController]
    public class RatingController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private ApiResponse _response;
        private readonly ILogger<RatingController> _log;

        public RatingController(ApplicationDbContext ctx, ILogger<RatingController> log)
        {
            _ctx = ctx;
            _response = new ApiResponse();
            _log = log;
        }

        // Upsert the caller's rating for a recipe. One row per (UserId, RecipeId).
        [HttpPost]
        public async Task<ActionResult<ApiResponse>> Rate([FromBody] RatingRequestDTO request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.UserId) || request.RecipeId == 0)
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessages = new List<string>() { "userId and recipeId are required." };
                    return BadRequest(_response);
                }

                if (request.Stars < 1 || request.Stars > 5)
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessages = new List<string>() { "stars must be between 1 and 5." };
                    return BadRequest(_response);
                }

                var saved = await RatingLogic.UpsertAsync(_ctx, request.UserId, request.RecipeId, request.Stars);

                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
                _response.Result = saved;
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

        // Batch average + count for a comma-separated list of recipe ids.
        [HttpGet("summary")]
        public async Task<ActionResult<ApiResponse>> Summary([FromQuery] string recipeIds)
        {
            try
            {
                var ids = (recipeIds ?? "")
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Where(s => int.TryParse(s, out _))
                    .Select(int.Parse)
                    .Distinct()
                    .ToList();

                var summary = await RatingLogic.SummaryAsync(_ctx, ids);

                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
                _response.Result = summary;
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

        // The caller's own rating for a recipe (null if none), for pre-filling the widget.
        [HttpGet("mine")]
        public async Task<ActionResult<ApiResponse>> Mine([FromQuery] string userId, [FromQuery] int recipeId)
        {
            try
            {
                var mine = await _ctx.RecipeRatings
                    .FirstOrDefaultAsync(r => r.UserId == userId && r.RecipeId == recipeId);

                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
                _response.Result = mine; // null when not yet rated
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

- [ ] **Step 6: Build the API**

Run: `dotnet build API/FoodFestAPI.csproj`
Expected: Build succeeded.

- [ ] **Step 7: Commit**

```bash
git add API/Helpers/RatingLogic.cs API/Controllers/RatingController.cs API.Tests/RatingLogicTests.cs
git commit -m "feat(rating): RatingLogic (upsert + summary) + RatingController

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Manual API verification

**Files:** none (verification only).

- [ ] **Step 1: Run the API**

Run: `dotnet run --project API/FoodFestAPI.csproj`
Expected: listening on `http://localhost:5128`. Use a real `recipeId` that exists in the dev DB, and a real user id string for `userId`.

- [ ] **Step 2: Upsert a rating**

```bash
curl -s -X POST http://localhost:5128/api/rating \
  -H "Content-Type: application/json" \
  -d '{"userId":"<real-user-id>","recipeId":<real-recipe-id>,"stars":5}'
```
Expected: JSON with `isSuccess: true` and a `result` containing the saved rating (Stars = 5).

- [ ] **Step 3: Re-rate (verify update, not duplicate)**

Repeat Step 2 with `"stars":3`. Then:
```bash
curl -s "http://localhost:5128/api/rating/mine?userId=<real-user-id>&recipeId=<real-recipe-id>"
```
Expected: `result.stars == 3` (single row updated, not a second row).

- [ ] **Step 4: Invalid stars rejected**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5128/api/rating \
  -H "Content-Type: application/json" \
  -d '{"userId":"<real-user-id>","recipeId":<real-recipe-id>,"stars":9}'
```
Expected: `400`.

- [ ] **Step 5: Batch summary**

```bash
curl -s "http://localhost:5128/api/rating/summary?recipeIds=<real-recipe-id>,999999"
```
Expected: `result` array with one entry for the real recipe (`average`, `count`); the nonexistent id absent.

No commit (verification only).

---

### Task 7: Frontend `ratingApi` RTK Query module

**Files:**
- Create: `Frontend/src/api/ratingApi.ts`
- Modify: `Frontend/src/redux/store/storeRedux.ts` (import line ~10, reducer ~34, middleware ~42)

- [ ] **Step 1: Create the API module**

Create `Frontend/src/api/ratingApi.ts` (mirrors `mealPlanApi.ts`):
```ts
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const ratingApi = createApi({
  reducerPath: "ratingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5128/api/",
  }),
  tagTypes: ["Rating"],
  endpoints: (builder) => ({
    rateRecipe: builder.mutation({
      query: (data) => ({
        url: "rating",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Rating"],
    }),
    getRatingSummary: builder.query({
      query: (recipeIds) => ({
        url: "rating/summary",
        params: { recipeIds: recipeIds.join(",") },
      }),
      providesTags: ["Rating"],
    }),
    getMyRating: builder.query({
      query: ({ userId, recipeId }) => ({
        url: "rating/mine",
        params: { userId, recipeId },
      }),
      providesTags: ["Rating"],
    }),
  }),
});

export const {
  useRateRecipeMutation,
  useGetRatingSummaryQuery,
  useGetMyRatingQuery,
} = ratingApi;

export default ratingApi;
```

- [ ] **Step 2: Register in the store**

In `Frontend/src/redux/store/storeRedux.ts`:

Add import after the `mealPlanApi` import (line 10):
```ts
import ratingApi from "../../api/ratingApi";
```

Add to the `reducer` object after the `mealPlanApi` line (line 34):
```ts
        [ratingApi.reducerPath]: ratingApi.reducer,
```

Add to the middleware chain after `.concat(mealPlanApi.middleware)` (line 42):
```ts
        .concat(ratingApi.middleware),
```
(Move the trailing `,`/`;` so the chain still ends correctly — the last `.concat(...)` should be followed by the `;` that closes the `middleware:` arrow function.)

- [ ] **Step 3: Verify the frontend builds**

Run from `Frontend/`: `npm run build`
Expected: build succeeds (no TS errors).

- [ ] **Step 4: Commit**

```bash
git add Frontend/src/api/ratingApi.ts Frontend/src/redux/store/storeRedux.ts
git commit -m "feat(rating): add ratingApi RTK Query module and register in store

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Interactive rating widget on `SingleProduct.tsx`

**Files:**
- Modify: `Frontend/src/pages/product/SingleProduct.tsx` (replace placeholder ~lines 160-163)

- [ ] **Step 1: Import the hooks, the RSuite `Rate` component, and read the current user**

At the top of `SingleProduct.tsx`, add:
```tsx
import { Rate } from "rsuite";
import { useSelector } from "react-redux";
import {
  useGetMyRatingQuery,
  useGetRatingSummaryQuery,
  useRateRecipeMutation,
} from "../../api/ratingApi";
```
Read the logged-in user id from the auth store (same selector pattern used elsewhere, e.g. `MealPlanner.tsx`):
```tsx
const userData = useSelector((state: any) => state.userAuthStore);
const userId = userData?.id;
```
Confirm the component already has the recipe id in scope (it uses the `id` route param to fetch the recipe); reuse that as `recipeId`.

- [ ] **Step 2: Wire the queries + mutation**

Inside the component body:
```tsx
const { data: myRatingResp } = useGetMyRatingQuery(
  { userId, recipeId },
  { skip: !userId || !recipeId }
);
const { data: summaryResp } = useGetRatingSummaryQuery(
  recipeId ? [recipeId] : [],
  { skip: !recipeId }
);
const [rateRecipe] = useRateRecipeMutation();

const myStars = myRatingResp?.result?.stars ?? 0;
const summary = summaryResp?.result?.find((s: any) => s.recipeId === recipeId);
const average = summary?.average ?? 0;
const count = summary?.count ?? 0;
```

- [ ] **Step 3: Replace the placeholder markup**

Replace the placeholder block (currently around lines 160-163, the `{/* Static rating for now … */}` span + `★★★★★`) with:
```tsx
<span style={{ color: "var(--bm-faint)" }}>Rating</span>
{userId ? (
  <Rate
    value={myStars}
    max={5}
    size="sm"
    onChange={async (value: number) => {
      try {
        await rateRecipe({ userId, recipeId, stars: value }).unwrap();
      } catch {
        // swallow — RTK invalidation refetches; optionally surface a toast here
      }
    }}
  />
) : (
  <Rate value={average} max={5} size="sm" readOnly />
)}
<span style={{ color: "var(--bm-faint)", fontSize: 13 }}>
  {count > 0 ? `${average} (${count})` : "No ratings yet"}
</span>
```

- [ ] **Step 4: Verify build**

Run from `Frontend/`: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manual check in the browser**

Start the API (`dotnet run --project API/FoodFestAPI.csproj`) and the frontend (`npm run dev` in `Frontend/`). Log in, open a recipe detail page.
Expected: an interactive 5-star widget pre-filled with your existing rating (if any); clicking a star submits and the average/count text updates. Logged out → the widget is read-only showing the average.

- [ ] **Step 6: Commit**

```bash
git add Frontend/src/pages/product/SingleProduct.tsx
git commit -m "feat(rating): interactive Rate widget + average on recipe detail

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: Read-only average on recipe cards

**Files:**
- Modify: `Frontend/src/pages/product/Product.tsx`
- Modify: `Frontend/src/pages/product/ProductCatalog.tsx`

- [ ] **Step 1: Add batch summary to `Product.tsx`**

In `Product.tsx`, after the recipes query result is available (around line 45 where `useGetRecipesQuery` results are mapped), collect the visible recipe ids and fetch summaries in one call:
```tsx
import { useGetRatingSummaryQuery } from "../../api/ratingApi";
import { Rate } from "rsuite";

// after recipes are loaded (recipes is the array rendered in the map):
const recipeIds = (recipes ?? []).map((r: any) => r.id);
const { data: summaryResp } = useGetRatingSummaryQuery(recipeIds, {
  skip: recipeIds.length === 0,
});
const summaries: any[] = summaryResp?.result ?? [];
```

- [ ] **Step 2: Render a read-only average per card in `Product.tsx`**

Inside the card map (each `recipe`), add:
```tsx
{(() => {
  const s = summaries.find((x) => x.recipeId === recipe.id);
  return (
    <span className="bm-stars" style={{ fontSize: 13 }}>
      <Rate value={s?.average ?? 0} max={5} size="xs" readOnly />
      {s?.count ? ` ${s.average} (${s.count})` : ""}
    </span>
  );
})()}
```

- [ ] **Step 3: Repeat for `ProductCatalog.tsx`**

`ProductCatalog.tsx` maps favorites into `bm-card` elements (around line 134) linking to `/singleProduct/${fav.recipeId}`. Collect `fav.recipeId` values and use the identical pattern:
```tsx
import { useGetRatingSummaryQuery } from "../../api/ratingApi";
import { Rate } from "rsuite";

const recipeIds = (favorites ?? []).map((f: any) => f.recipeId);
const { data: summaryResp } = useGetRatingSummaryQuery(recipeIds, {
  skip: recipeIds.length === 0,
});
const summaries: any[] = summaryResp?.result ?? [];
```
And inside each `bm-card`:
```tsx
{(() => {
  const s = summaries.find((x) => x.recipeId === fav.recipeId);
  return (
    <span className="bm-stars" style={{ fontSize: 13 }}>
      <Rate value={s?.average ?? 0} max={5} size="xs" readOnly />
      {s?.count ? ` ${s.average} (${s.count})` : ""}
    </span>
  );
})()}
```
(Adjust the local variable name — `recipes`/`favorites` — to whatever each file actually calls its rendered array.)

- [ ] **Step 4: Verify build**

Run from `Frontend/`: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manual check**

In the browser, open the catalog / product listing.
Expected: each card shows a small read-only star average (empty stars + no count text when a recipe has no ratings). A single network request to `rating/summary` covers all visible cards (verify in the Network tab — no per-card calls).

- [ ] **Step 6: Commit**

```bash
git add Frontend/src/pages/product/Product.tsx Frontend/src/pages/product/ProductCatalog.tsx
git commit -m "feat(rating): read-only average stars on recipe cards (batch summary)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Done criteria

- `dotnet test API.Tests/API.Tests.csproj` — all green (smoke, unique-index, upsert, summary).
- A logged-in user can rate a recipe on its detail page; re-rating updates the same row (no duplicates).
- Detail page shows average + count; cards show read-only averages via a single batch request.
- Anonymous users see averages but cannot submit.
- Invalid stars are rejected with 400.
