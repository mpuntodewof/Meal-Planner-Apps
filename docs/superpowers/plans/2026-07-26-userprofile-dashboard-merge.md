# UserProfile × Dashboard Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the legacy UserProfile feature into the Behavior Dashboard as a single, design-system-consistent, tabbed account page (Overview / Profile / My Recipes / Favorites / Security).

**Architecture:** `Dashboard.tsx` becomes a thin shell (Navbar → per-tab masthead → design-system tab bar → active tab → Footer), self-scoped to the logged-in user. The existing analytics move verbatim into an `OverviewTab`. Profile, favorites, and a new real-data "My Recipes" tab are lifted from the old UserProfile and restyled. Two new backend endpoints are added: `GET /api/recipe/by-user/{userId}` and `POST /api/auth/change-password`.

**Tech Stack:** ASP.NET Core (`FoodFestAPI`, .NET), EF Core, ASP.NET Identity; React + TypeScript + Redux Toolkit Query; xUnit + Sqlite-in-memory for backend tests.

**Reference spec:** `docs/superpowers/specs/2026-07-26-userprofile-dashboard-merge-design.md`

---

## Conventions to follow (verified against the codebase)

- **API responses** use `ApiResponse` (`{ IsSuccess, StatusCode, Result, ErrorMessages }`) and serialize arrays as `{ $values: [...] }` (ReferenceHandler.Preserve). Frontend unwraps with the `arr()` helper already in `Dashboard.tsx`.
- **Recipe** has a `UserId` (string) scalar. `GetAllRecipe` includes `Ingredients` + `Instructions`.
- **AuthController** resolves users via `_userManager.FindByEmailAsync(email)` and uses Identity methods (`ResetPasswordAsync`, and for us `ChangePasswordAsync`).
- **DTOs** live in `API/Models/DTO/` under namespace `FoodFestAPI.Models.DTO`, using `System.ComponentModel.DataAnnotations`.
- **Tests** live in `API.Tests/` (xUnit `[Fact]`), using `TestDbContextFactory.Create()` which returns `(ApplicationDbContext ctx, SqliteConnection conn)`; keep `conn` open, dispose in `finally`.
- **Frontend RTK Query** modules live in `Frontend/src/api/*.ts`; each is registered in `Frontend/src/redux/store/storeRedux.ts` (reducer + middleware). Existing recipe module is `recipeApi.ts`; auth module is `authApi.ts`.
- **Roles**: `Roles.ADMIN === "admin"` (lowercased comparison already done in `Dashboard.tsx`).
- **Dashboard CSS** classes are namespaced `ds-*` to avoid Bootstrap `.card`/`.col-*`/`.kpi` collisions. All new classes MUST follow this.

**Build/test commands:**
- Backend tests: `dotnet test API.Tests/API.Tests.csproj`
- Frontend build/type-check: `cd Frontend && npm run build`
- Frontend dev run (manual verification): `cd Frontend && npm start`

---

## File Structure

**Backend — create:**
- `API/Models/DTO/ChangePasswordDTO.cs` — change-password request DTO.

**Backend — modify:**
- `API/Controllers/RecipeController.cs` — add `GET by-user/{userId}`.
- `API/Controllers/AuthController.cs` — add `POST change-password`.

**Backend tests — create:**
- `API.Tests/RecipeByUserTests.cs` — filter-by-user query behavior.
- `API.Tests/ChangePasswordTests.cs` — Identity change-password success/failure.

**Frontend — create:**
- `Frontend/src/pages/dashboard/components/DashboardTabs.tsx` — DS tab bar.
- `Frontend/src/pages/dashboard/tabs/OverviewTab.tsx` — lifted analytics.
- `Frontend/src/pages/dashboard/tabs/ProfileTab.tsx` — edit form + avatar.
- `Frontend/src/pages/dashboard/tabs/MyRecipesTab.tsx` — user's own recipes (real).
- `Frontend/src/pages/dashboard/tabs/FavoritesTab.tsx` — favorites grid.
- `Frontend/src/pages/dashboard/tabs/SecurityTab.tsx` — change-password form.

**Frontend — modify:**
- `Frontend/src/api/recipeApi.ts` — add `getRecipesByUserId`.
- `Frontend/src/api/authApi.ts` — add `changePassword`.
- `Frontend/src/pages/dashboard/Dashboard.tsx` — becomes the shell.
- `Frontend/src/pages/dashboard/dashboard.css` — tab + form styles (namespaced).
- `Frontend/src/App.tsx` — redirect `/userProfile/:userId` → `/dashboard`.
- `Frontend/src/components/sub-comp/Navbar.tsx` — collapse two links into one.

**Frontend — retire (delete after cutover):**
- `Frontend/src/pages/auth/UserProfile.tsx`

---

## Phase 1 — Backend: Recipes-by-user endpoint

### Task 1: `GET /api/recipe/by-user/{userId}` returns only that user's recipes

**Files:**
- Modify: `API/Controllers/RecipeController.cs` (add action after `GetRecipeById`, ~line 155)
- Test: `API.Tests/RecipeByUserTests.cs` (create)

- [ ] **Step 1: Write the failing test**

Create `API.Tests/RecipeByUserTests.cs`:

```csharp
using API.Tests;
using FoodFestAPI.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

public class RecipeByUserTests
{
    // The by-user query must return only recipes whose UserId matches, and an
    // empty list (not an error) when the user has none.
    [Fact]
    public async Task Recipes_are_filtered_by_UserId()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            ctx.Recipes.Add(new Recipe { Name = "Mine1", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = "u1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            ctx.Recipes.Add(new Recipe { Name = "Mine2", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = "u1", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            ctx.Recipes.Add(new Recipe { Name = "Theirs", Description = "", CookingTime = "", ServiceSize = "", ImageUrl = "", VideoUrl = "", UserId = "u2", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            await ctx.SaveChangesAsync();
            ctx.ChangeTracker.Clear();

            var mine = await ctx.Recipes.Where(r => r.UserId == "u1").ToListAsync();
            var none = await ctx.Recipes.Where(r => r.UserId == "nobody").ToListAsync();

            Assert.Equal(2, mine.Count);
            Assert.All(mine, r => Assert.Equal("u1", r.UserId));
            Assert.Empty(none);
        }
        finally { conn.Dispose(); }
    }
}
```

- [ ] **Step 2: Run the test to verify it passes**

This test asserts the EF filter behavior the endpoint relies on (proves the query semantics before wiring the controller).

Run: `dotnet test API.Tests/API.Tests.csproj --filter RecipeByUserTests`
Expected: PASS (1 test).

- [ ] **Step 3: Add the controller action**

In `API/Controllers/RecipeController.cs`, insert directly after the `GetRecipeById` method (after its closing brace, ~line 155):

```csharp
        [HttpGet("by-user/{userId}")]
        public async Task<ActionResult> GetRecipesByUserId(string userId)
        {
            try
            {
                var result = await _ctx
                    .Recipes.Include(i => i.Ingredients)
                    .Include(i => i.Instructions)
                    .Where(r => r.UserId == userId)
                    .ToListAsync();

                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
                _response.Result = result;
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessages = new List<string>() { ex.Message };
                return StatusCode(500, _response);
            }
        }
```

- [ ] **Step 4: Build to verify it compiles**

Run: `dotnet build API/FoodFestAPI.csproj`
Expected: Build succeeded, 0 errors.

- [ ] **Step 5: Commit**

```bash
git add API/Controllers/RecipeController.cs API.Tests/RecipeByUserTests.cs
git commit -m "feat(recipe): GET by-user/{userId} endpoint + filter test"
```

---

## Phase 2 — Backend: Change-password endpoint

### Task 2: `ChangePasswordDTO`

**Files:**
- Create: `API/Models/DTO/ChangePasswordDTO.cs`

- [ ] **Step 1: Create the DTO**

Create `API/Models/DTO/ChangePasswordDTO.cs`:

```csharp
using System.ComponentModel.DataAnnotations;

namespace FoodFestAPI.Models.DTO
{
    public class ChangePasswordDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [DataType(DataType.Password)]
        public string CurrentPassword { get; set; }

        [Required]
        [StringLength(100, ErrorMessage = "The {0} must be at least {2} characters long.", MinimumLength = 6)]
        [DataType(DataType.Password)]
        public string NewPassword { get; set; }

        [DataType(DataType.Password)]
        [Display(Name = "Confirm password")]
        [Compare("NewPassword", ErrorMessage = "The password and confirmation password do not match.")]
        public string ConfirmPassword { get; set; }
    }
}
```

- [ ] **Step 2: Build to verify it compiles**

Run: `dotnet build API/FoodFestAPI.csproj`
Expected: Build succeeded, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add API/Models/DTO/ChangePasswordDTO.cs
git commit -m "feat(auth): ChangePasswordDTO"
```

### Task 3: `POST /api/auth/change-password`

**Files:**
- Modify: `API/Controllers/AuthController.cs` (add action after `ResetPassword`)
- Test: `API.Tests/ChangePasswordTests.cs` (create)

- [ ] **Step 1: Write the failing test**

This test exercises Identity's `ChangePasswordAsync` directly (the controller is a thin wrapper over it), proving the success and wrong-current-password paths without spinning up the full MVC pipeline.

Create `API.Tests/ChangePasswordTests.cs`:

```csharp
using FoodFestAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

public class ChangePasswordTests
{
    // Builds a minimal UserManager<AppUser> over an in-memory EF store so we can
    // exercise ChangePasswordAsync exactly as the controller does.
    private static UserManager<AppUser> BuildUserManager()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<FoodFestAPI.Data.ApplicationDbContext>(o =>
            o.UseInMemoryDatabase("change-pwd-" + System.Guid.NewGuid()));
        services.AddIdentityCore<AppUser>(o =>
        {
            o.Password.RequireNonAlphanumeric = false;
            o.Password.RequireUppercase = false;
            o.Password.RequiredLength = 6;
        }).AddEntityFrameworkStores<FoodFestAPI.Data.ApplicationDbContext>();
        return services.BuildServiceProvider().GetRequiredService<UserManager<AppUser>>();
    }

    [Fact]
    public async Task Correct_current_password_changes_it()
    {
        var mgr = BuildUserManager();
        var user = new AppUser { UserName = "a@b.com", Email = "a@b.com", Name = "A" };
        await mgr.CreateAsync(user, "OldPass1");

        var result = await mgr.ChangePasswordAsync(user, "OldPass1", "NewPass1");

        Assert.True(result.Succeeded);
        Assert.True(await mgr.CheckPasswordAsync(user, "NewPass1"));
    }

    [Fact]
    public async Task Wrong_current_password_is_rejected()
    {
        var mgr = BuildUserManager();
        var user = new AppUser { UserName = "a@b.com", Email = "a@b.com", Name = "A" };
        await mgr.CreateAsync(user, "OldPass1");

        var result = await mgr.ChangePasswordAsync(user, "WrongPass", "NewPass1");

        Assert.False(result.Succeeded);
        Assert.True(await mgr.CheckPasswordAsync(user, "OldPass1"));
    }
}
```

> NOTE: this test uses the EF InMemory provider (`AddDbContext ... UseInMemoryDatabase`). If `Microsoft.EntityFrameworkCore.InMemory` is not already referenced by `API.Tests`, add it first: `dotnet add API.Tests/API.Tests.csproj package Microsoft.EntityFrameworkCore.InMemory`. (The `Microsoft.Extensions.DependencyInjection` and Identity packages are transitively available via the API project reference.)

- [ ] **Step 2: Run the test to verify it passes**

Run: `dotnet test API.Tests/API.Tests.csproj --filter ChangePasswordTests`
Expected: PASS (2 tests).

- [ ] **Step 3: Add the controller action**

In `API/Controllers/AuthController.cs`, insert directly after the `ResetPassword` method's closing brace:

```csharp
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.BadRequest;
                _response.ErrorMessages.Add("User not found.");
                return BadRequest(_response);
            }

            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
            if (result.Succeeded)
            {
                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                return Ok(_response);
            }

            _response.IsSuccess = false;
            _response.StatusCode = HttpStatusCode.BadRequest;
            foreach (var error in result.Errors)
            {
                _response.ErrorMessages.Add(error.Description);
            }
            return BadRequest(_response);
        }
```

- [ ] **Step 4: Build to verify it compiles**

Run: `dotnet build API/FoodFestAPI.csproj`
Expected: Build succeeded, 0 errors. (`ChangePasswordDTO` resolves via the existing `using FoodFestAPI.Models.DTO;` at the top of the controller.)

- [ ] **Step 5: Commit**

```bash
git add API/Controllers/AuthController.cs API.Tests/ChangePasswordTests.cs API.Tests/API.Tests.csproj
git commit -m "feat(auth): POST change-password endpoint + Identity tests"
```

---

## Phase 3 — Frontend API wiring

### Task 4: `getRecipesByUserId` query

**Files:**
- Modify: `Frontend/src/api/recipeApi.ts`

- [ ] **Step 1: Add the endpoint**

In `Frontend/src/api/recipeApi.ts`, add this endpoint inside the `endpoints` builder object, after `getRecipeById` (before `createRecipe`):

```typescript
    getRecipesByUserId: builder.query({
      query: (userId) => ({
        url: `recipe/by-user/${userId}`,
      }),
      providesTags: ["Recipes"],
    }),
```

- [ ] **Step 2: Export the hook**

In the `export const { ... }` block, add `useGetRecipesByUserIdQuery`:

```typescript
export const {
  useGetRecipesQuery,
  useGetRecipeByIdQuery,
  useGetRecipesByUserIdQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  useGenerateRecipeMutation,
} = recipeApi;
```

- [ ] **Step 3: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles (no TypeScript errors from this file).

- [ ] **Step 4: Commit**

```bash
git add Frontend/src/api/recipeApi.ts
git commit -m "feat(recipe-api): getRecipesByUserId query"
```

### Task 5: `changePassword` mutation

**Files:**
- Modify: `Frontend/src/api/authApi.ts`

- [ ] **Step 1: Add the mutation**

In `Frontend/src/api/authApi.ts`, add this mutation inside the `endpoints` builder, after `resetPassword`:

```typescript
        changePassword: builder.mutation({
            query: (changeData) => ({
                url: "auth/change-password",
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: changeData
            })
        })
```

(Add a comma after the previous `resetPassword` mutation's closing `}` so the object stays valid.)

- [ ] **Step 2: Export the hook**

Update the export line:

```typescript
export const { useRegisterMutation, useLoginMutation, useForgotPasswordMutation, useResetPasswordMutation, useChangePasswordMutation } = authApi;
```

- [ ] **Step 3: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles.

- [ ] **Step 4: Commit**

```bash
git add Frontend/src/api/authApi.ts
git commit -m "feat(auth-api): changePassword mutation"
```

---

## Phase 4 — Frontend: DS tab bar

### Task 6: `DashboardTabs` component + styles

**Files:**
- Create: `Frontend/src/pages/dashboard/components/DashboardTabs.tsx`
- Modify: `Frontend/src/pages/dashboard/dashboard.css`

- [ ] **Step 1: Create the component**

Create `Frontend/src/pages/dashboard/components/DashboardTabs.tsx`:

```tsx
import React from "react";

export type TabKey = "overview" | "profile" | "recipes" | "favorites" | "security";

export interface TabDef {
  key: TabKey;
  label: string;
}

interface Props {
  tabs: TabDef[];
  active: TabKey;
  onChange: (key: TabKey) => void;
}

// Accessible design-system tab bar. All classes are namespaced ds-* so Bootstrap
// cannot restyle them (same collision-avoidance the dashboard already relies on).
const DashboardTabs: React.FC<Props> = ({ tabs, active, onChange }) => {
  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = (idx + dir + tabs.length) % tabs.length;
    onChange(tabs[next].key);
  };

  return (
    <div className="ds-tabs scroll-x" role="tablist" aria-label="Dashboard sections">
      {tabs.map((t, idx) => (
        <button
          key={t.key}
          role="tab"
          type="button"
          aria-selected={active === t.key}
          tabIndex={active === t.key ? 0 : -1}
          className={`ds-tab ${active === t.key ? "is-active" : ""}`}
          onClick={() => onChange(t.key)}
          onKeyDown={(e) => onKeyDown(e, idx)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default DashboardTabs;
```

- [ ] **Step 2: Append styles**

Append to `Frontend/src/pages/dashboard/dashboard.css`:

```css
/* --- Merged dashboard: tab bar --- */
.ds-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  margin: 8px 0 24px;
}
.ds-tab {
  appearance: none;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  color: var(--ds-muted, #9aa0aa);
  padding: 10px 16px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.ds-tab:hover { color: var(--ds-fg, #e8eaed); }
.ds-tab.is-active {
  color: var(--ds-fg, #e8eaed);
  border-bottom-color: var(--s1, #6ea8fe);
}
.ds-tab:focus-visible {
  outline: 2px solid var(--s1, #6ea8fe);
  outline-offset: 2px;
}

/* --- Merged dashboard: forms --- */
.ds-form { display: flex; flex-direction: column; gap: 14px; max-width: 640px; }
.ds-form label { font-weight: 600; font-size: 14px; margin-bottom: 4px; display: block; }
.ds-form input,
.ds-form select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.04);
  color: var(--ds-fg, #e8eaed);
  font: inherit;
}
.ds-form .ds-row { display: flex; gap: 12px; flex-wrap: wrap; }
.ds-form .ds-row > * { flex: 1 1 220px; }
.ds-avatar {
  width: 140px; height: 140px; border-radius: 50%;
  object-fit: cover; display: block; margin: 0 auto 20px;
}
.ds-submit {
  align-self: flex-start;
  padding: 10px 22px; border-radius: 999px; border: 0;
  background: var(--s1, #6ea8fe); color: #0b0d10; font-weight: 700; cursor: pointer;
}
.ds-submit:disabled { opacity: 0.6; cursor: default; }

/* --- Merged dashboard: recipe card grid --- */
.ds-recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
.ds-recipe-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;
}
.ds-recipe-card img { width: 100%; height: 150px; object-fit: cover; }
.ds-recipe-card .ds-recipe-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
.ds-recipe-card h5 { margin: 0; font-size: 15px; line-height: 1.35; }
.ds-recipe-link {
  align-self: flex-start; margin-top: auto;
  padding: 6px 14px; border-radius: 999px;
  background: var(--s1, #6ea8fe); color: #0b0d10; font-weight: 600; text-decoration: none; cursor: pointer;
}
```

- [ ] **Step 3: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles (component is unused so far — that's fine; it just must type-check).

- [ ] **Step 4: Commit**

```bash
git add Frontend/src/pages/dashboard/components/DashboardTabs.tsx Frontend/src/pages/dashboard/dashboard.css
git commit -m "feat(dashboard): DS tab bar component + tab/form/card styles"
```

---

## Phase 5 — Frontend: Tab components

### Task 7: `OverviewTab` (lift analytics verbatim)

**Files:**
- Create: `Frontend/src/pages/dashboard/tabs/OverviewTab.tsx`

- [ ] **Step 1: Create the component**

Create `Frontend/src/pages/dashboard/tabs/OverviewTab.tsx`. Move the analytics rendering out of the current `Dashboard.tsx` (the `sparkFrom`, `arr`, the queries, the `view` toggle, and the whole `data.hasData` block) into this component. It owns the admin platform toggle.

```tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetUserDashboardQuery, useGetAdminDashboardQuery } from "../../../api/dashboardApi";
import { DashboardSummary, AdminDashboard, WeeklyPoint, NameCount } from "../../../interfaces/dashboardModel";
import { Roles } from "../../../interfaces/enum";
import InsightLine from "../components/InsightLine";
import KpiTile from "../components/KpiTile";
import StackedWeeklyChart from "../components/StackedWeeklyChart";
import CategoryDonut from "../components/CategoryDonut";
import TopRecipesBar from "../components/TopRecipesBar";
import NutritionTrendLine from "../components/NutritionTrendLine";
import EmptyState from "../components/EmptyState";

const sparkFrom = (vals: number[]): number[] => {
  const max = Math.max(1, ...vals);
  const s = vals.map((v) => v / max);
  return s.some((h) => h > 0) ? s : vals.map(() => 0.12);
};

const arr = <T,>(v: any): T[] => (Array.isArray(v) ? v : v?.$values ?? []);

interface Props {
  userId: string;
  role: string;
}

const OverviewTab: React.FC<Props> = ({ userId, role }) => {
  const navigate = useNavigate();
  const isAdmin = role === Roles.ADMIN;
  const [view, setView] = useState<"user" | "admin">("user");

  const userQ = useGetUserDashboardQuery({ userId, weeks: 6 }, { skip: view !== "user" || !userId });
  const adminQ = useGetAdminDashboardQuery({ weeks: 6 }, { skip: view !== "admin" });

  const loading = view === "user" ? userQ.isLoading : adminQ.isLoading;
  const data: DashboardSummary | AdminDashboard | undefined =
    (view === "user" ? userQ.data?.result : adminQ.data?.result) as any;

  const weekly: WeeklyPoint[] = arr<WeeklyPoint>(data?.weekly);
  const categoryMix: NameCount[] = arr<NameCount>(data?.categoryMix);
  const topRecipes: NameCount[] = arr<NameCount>(data?.topRecipes);

  const mealsSpark = sparkFrom(weekly.map((w) => w.totalMeals));
  const kcalSpark = sparkFrom(weekly.map((w) => w.avgCalories ?? 0));

  return (
    <>
      {isAdmin && (
        <div className="ds-controls">
          <div className="roletoggle" role="group" aria-label="View">
            <button aria-pressed={view === "user"} onClick={() => setView("user")}>My dashboard</button>
            <button aria-pressed={view === "admin"} onClick={() => setView("admin")}>Platform</button>
          </div>
        </div>
      )}

      {loading && <div className="ds-loading">Loading your dashboard…</div>}

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
              delta="last 6 weeks"
              spark={mealsSpark}
            />
            <KpiTile
              label="Recipe variety"
              value={`${data.uniqueRecipes} of ${data.totalMealsPlanned}`}
              delta={`${data.varietyBand} variety`}
              deltaKind={data.varietyBand === "High" ? "up" : "flat"}
              spark={sparkFrom(weekly.map((w) => (w.totalMeals > 0 ? 1 : 0)))}
            />
            <KpiTile
              label="Avg rating"
              value={data.ratingCount ? `${data.avgRating}★` : "—"}
              delta={`across ${data.ratingCount} ratings`}
              empty={!data.ratingCount}
              emptyText="No ratings yet"
              spark={sparkFrom(weekly.map(() => (data.ratingCount ? data.avgRating / 5 : 0)))}
            />
            <KpiTile
              label="Avg planned kcal /serving"
              value={data.avgCalories ?? "—"}
              delta={data.avgCalories
                ? `P ${data.avgProteinG}g · F ${data.avgFatG}g · C ${data.avgCarbsG}g`
                : `${data.recipesWithNutrition}/${data.recipesPlanned} recipes analyzed`}
              empty={data.avgCalories === null}
              emptyText={`${data.recipesWithNutrition}/${data.recipesPlanned} recipes analyzed`}
              spark={kcalSpark}
            />

            <div className="ds-card ds-col-8">
              <h3>Meals planned per week, by slot</h3>
              <div className="sub">Stacked from MealPlanDays.Date × MealType</div>
              <div className="scroll-x"><StackedWeeklyChart weekly={weekly} /></div>
              <div className="legend">
                <span><span className="swatch" style={{ background: "var(--s1)" }} />Breakfast</span>
                <span><span className="swatch" style={{ background: "var(--s2)" }} />Lunch</span>
                <span><span className="swatch" style={{ background: "var(--s3)" }} />Dinner</span>
                <span><span className="swatch" style={{ background: "var(--s6)" }} />Snack</span>
              </div>
            </div>

            <div className="ds-card ds-col-4">
              <h3>Category mix</h3>
              <div className="sub">What you gravitate toward</div>
              <CategoryDonut data={categoryMix} />
            </div>

            <div className="ds-card ds-col-6">
              <h3>Your most-planned recipes</h3>
              <div className="sub">Repetition is the variety story, told plainly</div>
              <TopRecipesBar data={topRecipes} />
            </div>

            <div className="ds-card ds-col-6">
              <h3>Planned nutrition drift</h3>
              <div className="sub">Avg kcal/serving of planned meals · null-nutrition recipes excluded</div>
              <NutritionTrendLine weekly={weekly} />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default OverviewTab;
```

- [ ] **Step 2: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles. (Import paths go up three levels: `tabs/` → `dashboard/` → `pages/` → `src/`.)

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/dashboard/tabs/OverviewTab.tsx
git commit -m "feat(dashboard): OverviewTab — analytics lifted into a tab"
```

### Task 8: `ProfileTab` (edit form + avatar)

**Files:**
- Create: `Frontend/src/pages/dashboard/tabs/ProfileTab.tsx`

- [ ] **Step 1: Create the component**

Port the form logic from `Frontend/src/pages/auth/UserProfile.tsx` (userInputs state, `handleUserInput`, `handleFileChange` with the ≤1MB + jpg/jpeg/png validation, `handleSubmit` with the base64 split and `updateUser` call), re-expressed with `ds-*` classes. Create `Frontend/src/pages/dashboard/tabs/ProfileTab.tsx`:

```tsx
import React, { useEffect, useState } from "react";
import { useGetUserByIdQuery, useUpdateUserMutation } from "../../../api/userApi";
import inputHelper from "../../../helper/inputHelper";
import toastNotify from "../../../helper/toastNotify";
import apiResponse from "../../../interfaces/apiResponseModel";
const avatarImg = require("../../../img/avatar-img.png");

const emptyInputs = {
  id: "", name: "", email: "", phoneNumber: "",
  imageUrl: "", city: "", country: "", socialMedia: "", gender: "",
};

interface Props { userId: string; }

const ProfileTab: React.FC<Props> = ({ userId }) => {
  const { data } = useGetUserByIdQuery(userId);
  const [updateUser] = useUpdateUserMutation();
  const [userInputs, setUserInputs] = useState(emptyInputs);
  const [imgUrl, setImgUrl] = useState<any>("");
  const [imgStore, setImgStore] = useState<any>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data && data.result) {
      const r = data.result;
      setUserInputs({
        id: r.id, name: r.name, email: r.email, phoneNumber: r.phoneNumber,
        city: r.city, country: r.country, socialMedia: r.socialMedia,
        gender: r.gender, imageUrl: r.imageUrl,
      });
      setImgUrl(r.imageUrl);
    }
  }, [data]);

  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserInputs(inputHelper(e, userInputs));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const imgType = file.type.split("/")[1];
    const valid = ["jpeg", "jpg", "png"].includes(imgType);
    if (file.size > 1000 * 1024) {
      setImgStore("");
      toastNotify("File must be less then 1 MB", "error");
      return;
    }
    if (!valid) {
      setImgStore("");
      toastNotify("File must be in jpeg, jpg, or png", "error");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    setImgStore(file);
    reader.onload = (ev) => setImgUrl(ev.target?.result as string);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!imgStore) {
      toastNotify("Please upload an image", "error");
      setLoading(false);
      return;
    }
    const splitImg = imgUrl.split(",")[1];
    const payload = {
      id: userId, name: userInputs.name, email: userInputs.email,
      phoneNumber: userInputs.phoneNumber, imageUrl: splitImg,
      city: userInputs.city, country: userInputs.country,
      socialMedia: userInputs.socialMedia, gender: userInputs.gender,
    };
    const response: apiResponse = await updateUser({ data: payload, id: userId });
    if (response.error) toastNotify(response.error.data.title, "error");
    else toastNotify("Successfully update user", "success");
    setLoading(false);
  };

  return (
    <div className="ds-card">
      <h3>Personal info</h3>
      <div className="sub">Update your account details</div>
      <img className="ds-avatar" src={imgUrl || avatarImg} alt="avatar" />
      <form className="ds-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="ds-row">
          <input type="text" placeholder="Name" name="name" value={userInputs.name} onChange={handleUserInput} />
          <input type="email" placeholder="Email" name="email" value={userInputs.email} onChange={handleUserInput} />
        </div>
        <div className="ds-row">
          <input type="text" placeholder="City" name="city" value={userInputs.city} onChange={handleUserInput} />
          <input type="text" placeholder="Country" name="country" value={userInputs.country} onChange={handleUserInput} />
        </div>
        <input type="text" placeholder="Social Media" name="socialMedia" value={userInputs.socialMedia} onChange={handleUserInput} />
        <input type="tel" placeholder="Phone Number" name="phoneNumber" value={userInputs.phoneNumber} onChange={handleUserInput} />
        <div className="ds-row">
          <input type="file" onChange={handleFileChange} />
          <select name="gender" value={userInputs.gender} onChange={handleUserInput}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <button className="ds-submit" type="submit" disabled={loading}>
          {loading ? "Updating…" : "Update"}
        </button>
      </form>
    </div>
  );
};

export default ProfileTab;
```

- [ ] **Step 2: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/dashboard/tabs/ProfileTab.tsx
git commit -m "feat(dashboard): ProfileTab — restyled edit form + avatar"
```

### Task 9: `MyRecipesTab` (real data)

**Files:**
- Create: `Frontend/src/pages/dashboard/tabs/MyRecipesTab.tsx`

- [ ] **Step 1: Create the component**

Create `Frontend/src/pages/dashboard/tabs/MyRecipesTab.tsx`:

```tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetRecipesByUserIdQuery } from "../../../api/recipeApi";
import EmptyState from "../components/EmptyState";

// API serializes arrays as { $values: [...] } — unwrap at the boundary.
const arr = <T,>(v: any): T[] => (Array.isArray(v) ? v : v?.$values ?? []);

interface RecipeItem { id: number; name: string; imageUrl?: string; }

interface Props { userId: string; }

const MyRecipesTab: React.FC<Props> = ({ userId }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetRecipesByUserIdQuery(userId, { skip: !userId });
  const recipes: RecipeItem[] = arr<RecipeItem>(data?.result);

  if (isLoading) return <div className="ds-loading">Loading your recipes…</div>;

  if (!recipes.length) {
    return (
      <EmptyState
        message="You haven't created any recipes yet."
        ctaLabel="Create New Recipe"
        onCta={() => navigate("/addProduct")}
      />
    );
  }

  return (
    <div className="ds-card">
      <h3>Your recipes</h3>
      <div className="sub">Recipes you've created</div>
      <div className="ds-recipe-grid">
        {recipes.map((r) => (
          <div className="ds-recipe-card" key={r.id}>
            <img src={r.imageUrl || ""} alt={r.name} />
            <div className="ds-recipe-body">
              <h5>{r.name}</h5>
              <a className="ds-recipe-link" onClick={() => navigate(`/singleProduct/${r.id}`)}>Detail</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyRecipesTab;
```

- [ ] **Step 2: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/dashboard/tabs/MyRecipesTab.tsx
git commit -m "feat(dashboard): MyRecipesTab — user's own recipes (real data)"
```

### Task 10: `FavoritesTab`

**Files:**
- Create: `Frontend/src/pages/dashboard/tabs/FavoritesTab.tsx`

- [ ] **Step 1: Create the component**

Port the favorites grid from `UserProfile.tsx` (the `useGetFavRecipeByUserIdQuery` + `favRecipes.map`) into DS styling. Create `Frontend/src/pages/dashboard/tabs/FavoritesTab.tsx`:

```tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetFavRecipeByUserIdQuery } from "../../../api/userApi";
import favoriteModel from "../../../interfaces/favoriteModel";
import EmptyState from "../components/EmptyState";

const arr = <T,>(v: any): T[] => (Array.isArray(v) ? v : v?.$values ?? []);

interface Props { userId: string; }

const FavoritesTab: React.FC<Props> = ({ userId }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetFavRecipeByUserIdQuery(userId, { skip: !userId });
  const favs: favoriteModel[] = arr<favoriteModel>(data?.result);

  if (isLoading) return <div className="ds-loading">Loading your favorites…</div>;

  if (!favs.length) {
    return (
      <EmptyState
        message="No favorites yet. Heart a recipe and it shows up here."
        ctaLabel="Browse recipes"
        onCta={() => navigate("/productCatalog")}
      />
    );
  }

  return (
    <div className="ds-card">
      <h3>Favorite recipes</h3>
      <div className="sub">Recipes you've hearted</div>
      <div className="ds-recipe-grid">
        {favs.map((f) => (
          <div className="ds-recipe-card" key={f.favoriteId ?? f.recipeId}>
            <img src={f.imageUrl || ""} alt={f.recipeName || ""} />
            <div className="ds-recipe-body">
              <h5>{f.recipeName}</h5>
              <a className="ds-recipe-link" onClick={() => navigate(`/singleProduct/${f.recipeId}`)}>Detail</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesTab;
```

> NOTE: the existing UserProfile reads `favoriteRecipes.result.$values` directly; the `arr()` helper handles both that wrapped shape and a plain array, so this is safe.

- [ ] **Step 2: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/dashboard/tabs/FavoritesTab.tsx
git commit -m "feat(dashboard): FavoritesTab — restyled favorites grid"
```

### Task 11: `SecurityTab` (change password)

**Files:**
- Create: `Frontend/src/pages/dashboard/tabs/SecurityTab.tsx`

- [ ] **Step 1: Create the component**

Create `Frontend/src/pages/dashboard/tabs/SecurityTab.tsx`:

```tsx
import React, { useState } from "react";
import { useChangePasswordMutation } from "../../../api/authApi";
import inputHelper from "../../../helper/inputHelper";
import toastNotify from "../../../helper/toastNotify";
import apiResponse from "../../../interfaces/apiResponseModel";

interface Props { email: string; }

const emptyInputs = { currentPassword: "", newPassword: "", confirmPassword: "" };

const SecurityTab: React.FC<Props> = ({ email }) => {
  const [changePassword] = useChangePasswordMutation();
  const [inputs, setInputs] = useState(emptyInputs);
  const [loading, setLoading] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs(inputHelper(e, inputs));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputs.newPassword !== inputs.confirmPassword) {
      toastNotify("New password and confirmation do not match", "error");
      return;
    }
    setLoading(true);
    const payload = {
      email,
      currentPassword: inputs.currentPassword,
      newPassword: inputs.newPassword,
      confirmPassword: inputs.confirmPassword,
    };
    const response: apiResponse = await changePassword(payload);
    if (response.data) {
      toastNotify("Your password has been changed", "success");
      setInputs(emptyInputs);
    } else {
      toastNotify("Could not change password. Check your current password.", "error");
    }
    setLoading(false);
  };

  return (
    <div className="ds-card">
      <h3>Change password</h3>
      <div className="sub">Update the password for {email}</div>
      <form className="ds-form" onSubmit={handleSubmit}>
        <input type="password" placeholder="Current password" name="currentPassword" value={inputs.currentPassword} onChange={handleInput} required />
        <input type="password" placeholder="New password" name="newPassword" value={inputs.newPassword} onChange={handleInput} required />
        <input type="password" placeholder="Confirm new password" name="confirmPassword" value={inputs.confirmPassword} onChange={handleInput} required />
        <button className="ds-submit" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Change password"}
        </button>
      </form>
    </div>
  );
};

export default SecurityTab;
```

- [ ] **Step 2: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/dashboard/tabs/SecurityTab.tsx
git commit -m "feat(dashboard): SecurityTab — in-app change-password form"
```

---

## Phase 6 — Frontend: Assemble the shell

### Task 12: Rewrite `Dashboard.tsx` as the tabbed shell

**Files:**
- Modify: `Frontend/src/pages/dashboard/Dashboard.tsx` (full rewrite)

- [ ] **Step 1: Replace the file contents**

Replace the entire contents of `Frontend/src/pages/dashboard/Dashboard.tsx` with:

```tsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../redux/store/storeRedux";
import userModel from "../../interfaces/userModel";
import Navbar from "../../components/sub-comp/Navbar";
import Footer from "../../components/Footer";
import DashboardTabs, { TabDef, TabKey } from "./components/DashboardTabs";
import OverviewTab from "./tabs/OverviewTab";
import ProfileTab from "./tabs/ProfileTab";
import MyRecipesTab from "./tabs/MyRecipesTab";
import FavoritesTab from "./tabs/FavoritesTab";
import SecurityTab from "./tabs/SecurityTab";
import "./dashboard.css";

const TABS: TabDef[] = [
  { key: "overview", label: "Overview" },
  { key: "profile", label: "Profile" },
  { key: "recipes", label: "My Recipes" },
  { key: "favorites", label: "Favorites" },
  { key: "security", label: "Security" },
];

// Per-tab masthead so the analytics-specific data note never sits over an edit form.
const MASTHEAD: Record<TabKey, { title: string; lead: string }> = {
  overview: { title: "Your planning behavior", lead: "How you plan, and what your plans reveal about your tastes and habits — at a glance." },
  profile: { title: "Your account", lead: "Update your personal details and profile photo." },
  recipes: { title: "Your recipes", lead: "Everything you've created, in one place." },
  favorites: { title: "Your favorites", lead: "Recipes you've hearted across the app." },
  security: { title: "Security", lead: "Manage your password." },
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const userData: userModel = useSelector((state: RootState) => state.userAuthStore);
  const userId: string = userData.id ?? "";
  const email: string = userData.email ?? "";
  const role: string = (userData.role ?? "").toLowerCase();

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");
  const authResolving = !userId && hasToken;
  const loggedOut = !userId && !hasToken;

  const [active, setActive] = useState<TabKey>("overview");
  const mast = MASTHEAD[active];

  return (
    <>
      <Navbar />
      <div className="dashboard-root">
        <header className="ds-masthead">
          <div className="ds-kicker">Meal Planner · Account</div>
          <h1 className="ds-title">{mast.title}</h1>
          <p className="ds-lead">{mast.lead}</p>
        </header>

        {loggedOut && (
          <div className="ds-loading">
            Please <button className="ds-linkbtn" onClick={() => navigate("/login")}>log in</button> to view your account.
          </div>
        )}
        {authResolving && <div className="ds-loading">Loading your account…</div>}

        {userId && (
          <>
            <DashboardTabs tabs={TABS} active={active} onChange={setActive} />
            {active === "overview" && <OverviewTab userId={userId} role={role} />}
            {active === "profile" && <ProfileTab userId={userId} />}
            {active === "recipes" && <MyRecipesTab userId={userId} />}
            {active === "favorites" && <FavoritesTab userId={userId} />}
            {active === "security" && <SecurityTab email={email} />}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
```

- [ ] **Step 2: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles with no errors.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/dashboard/Dashboard.tsx
git commit -m "feat(dashboard): rewrite as tabbed account shell"
```

---

## Phase 7 — Routing & navigation cutover

### Task 13: Redirect `/userProfile/:userId` → `/dashboard`

**Files:**
- Modify: `Frontend/src/App.tsx`

- [ ] **Step 1: Add the Navigate import**

In `Frontend/src/App.tsx`, change the react-router import (line 2) to include `Navigate`:

```tsx
import { Navigate, Route, Routes } from 'react-router-dom';
```

- [ ] **Step 2: Replace the UserProfile route with a redirect**

Replace the line `<Route path="/userProfile/:userId" element={<UserProfile />} />` (line 64) with:

```tsx
          <Route path="/userProfile/:userId" element={<Navigate to="/dashboard" replace />} />
```

- [ ] **Step 3: Remove the now-unused import**

Delete the `import UserProfile from './pages/auth/UserProfile';` line (line 17).

- [ ] **Step 4: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles (no "unused import" hard error; the import is gone).

- [ ] **Step 5: Commit**

```bash
git add Frontend/src/App.tsx
git commit -m "feat(routing): redirect /userProfile/:userId to /dashboard"
```

### Task 14: Collapse the two Navbar links into one

**Files:**
- Modify: `Frontend/src/components/sub-comp/Navbar.tsx`

- [ ] **Step 1: Desktop dropdown — remove the separate User Profile link**

In `Frontend/src/components/sub-comp/Navbar.tsx`, in the desktop sub-menu (~lines 124-129), the "Dashboard" and "User Profile" entries currently point to `/dashboard` and `/userProfile/${userData.id}`. Replace both `<li>` entries with a single one:

```tsx
                                <li>
                                  <a onClick={() => navigate("/dashboard")}>My Account</a>
                                </li>
```

- [ ] **Step 2: Mobile overlay — same collapse**

In the mobile overlay secondary block (~lines 186-188), replace the two lines:

```tsx
                <a onClick={() => go("/dashboard")}>Dashboard</a>
                <a onClick={() => go(`/userProfile/${userData.id}`)}>User Profile</a>
```

with a single line:

```tsx
                <a onClick={() => go("/dashboard")}>My Account</a>
```

- [ ] **Step 3: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles.

- [ ] **Step 4: Commit**

```bash
git add Frontend/src/components/sub-comp/Navbar.tsx
git commit -m "feat(nav): collapse Dashboard + User Profile into one My Account link"
```

### Task 15: Retire the old `UserProfile.tsx`

**Files:**
- Delete: `Frontend/src/pages/auth/UserProfile.tsx`

- [ ] **Step 1: Confirm no remaining references**

Run: `cd Frontend && grep -rn "UserProfile" src/ || echo "no references"`
Expected: no references (App.tsx import already removed in Task 13; Navbar links removed in Task 14). If any remain, fix them before deleting.

- [ ] **Step 2: Delete the file**

Run: `git rm Frontend/src/pages/auth/UserProfile.tsx`

- [ ] **Step 3: Type-check**

Run: `cd Frontend && npm run build`
Expected: Compiles.

- [ ] **Step 4: Commit**

```bash
git commit -m "chore: retire legacy UserProfile page (merged into dashboard)"
```

---

## Phase 8 — Full verification

### Task 16: End-to-end verification

- [ ] **Step 1: Backend tests all pass**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: All tests pass, including `RecipeByUserTests` and `ChangePasswordTests`.

- [ ] **Step 2: Frontend builds clean**

Run: `cd Frontend && npm run build`
Expected: Compiled successfully, 0 errors.

- [ ] **Step 3: Manual smoke (dev server)**

Run the API, then `cd Frontend && npm start`. Log in and verify:
- `/dashboard` shows the tab bar; **Overview** renders the analytics (and the admin toggle if logged in as admin).
- **Profile** loads current details, avatar preview works, update saves.
- **My Recipes** shows the logged-in user's own recipes (or the empty state → Create New Recipe).
- **Favorites** shows hearted recipes (or the empty state → Browse recipes).
- **Security** changes the password with the correct current password; rejects a wrong one.
- Visiting `/userProfile/<id>` redirects to `/dashboard`.
- The navbar shows a single **My Account** link (desktop dropdown + mobile overlay).

- [ ] **Step 4: Final commit (if any manual fixups were needed)**

```bash
git add -A
git commit -m "fix: address issues found during merged-dashboard verification"
```

---

## Self-Review Notes

- **Spec coverage:** Overview (Task 7), Profile (Task 8), My Recipes real data (Tasks 1, 4, 9), Favorites (Task 10), Security/change-password (Tasks 2, 3, 5, 11), DS tabs (Task 6), shell + per-tab masthead (Task 12), routing redirect (Task 13), nav collapse (Task 14), retire old page (Task 15). All spec sections mapped.
- **Self-only / admin toggle:** shell is keyed off `userData.id`; admin platform toggle lives inside OverviewTab only (Task 7).
- **Bootstrap collision avoidance:** every new class is `ds-*`; no react-bootstrap `Tab.Container` used.
- **Type consistency:** `TabKey`/`TabDef` defined in Task 6 and imported unchanged in Tasks 12; `arr()` helper repeated intentionally per-file (DRY within a file, not across — matches existing codebase where each consumer defines it locally); `useGetRecipesByUserIdQuery` (Task 4) and `useChangePasswordMutation` (Task 5) names match their usages in Tasks 9 and 11.
- **Out of scope confirmed:** no admin-view-others, no `?tab=` deep-linking, existing forgot/reset flow untouched.
