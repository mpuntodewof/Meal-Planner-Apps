# Meal Rating — Technical Design

**Date:** 2026-07-02
**App:** FoodRecipe Integrated Workspace (ASP.NET Core 8 API + React/TS SPA + MySQL)
**Phase:** Roadmap Phase 6 / §3.7 (pulled forward — see `2026-07-01-meal-planner-feature-roadmap-design.md`)
**Goal driving this work:** User engagement / retention — social proof now; clean signal for the future AI recommender.

---

## 1. Summary

Let logged-in users give a recipe a 1–5 star rating (one per user per recipe,
editable). Show the average rating + count on the recipe detail page and as a
small read-only average on recipe cards.

Pulled forward from Phase 6 because it is **cheap to build** and starts
**accumulating rating signal early** — avoiding a cold start when the AI Meal
Recommendation feature (Phase 6, §3.6) is built. The unique (User, Recipe)
constraint keeps that signal clean: one honest vote per user.

---

## 2. Scope & key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Who can rate | **Logged-in users only, client-gated** | The widget only submits if a `userId` exists in the auth store. Anonymous visitors see the average but cannot rate. Matches existing convention (no server-side `[Authorize]`). |
| Auth mechanism | **`userId` passed as a param** | Every existing controller (`MealPlanController`, `FavoriteController`) takes `userId`; new code follows suit rather than introducing claims-based enforcement. |
| Uniqueness | **Unique index on (UserId, RecipeId)** | One rating per user per recipe; submitting again updates it (upsert). This is the first explicit `HasIndex` in `OnModelCreating`. |
| Card averages | **Batch summary endpoint** | Cards need averages for a list of recipes; a single `GET api/rating/summary?recipeIds=…` avoids the N+1 problem. No schema denormalization. |
| Display | **Detail: interactive + average; cards: read-only average** | Full "social proof everywhere" per roadmap §3.7. |

### Considered and rejected

- **Denormalize `AvgRating`/`RatingCount` onto `Recipe`** — fastest card reads, but
  adds columns + a migration + sync-on-every-write. Not worth it at current
  scale; the batch endpoint is simpler and correct. Revisit if rating volume
  makes aggregation slow.
- **Per-recipe average endpoint called per card** — simplest, but N requests per
  catalog render. Rejected for the batch endpoint.
- **Anonymous rating** — no per-user uniqueness, invites spam, weakens recommender
  signal. Rejected.

---

## 3. Data model

New entity, modeled closely on the existing `UserFavorite`
(`{ Id, UserId(string), RecipeId(int), FavoriteOn, Recipe }`).

```csharp
public class RecipeRating
{
    public int Id { get; set; }
    public string UserId { get; set; }    // AppUser.Id — ASP.NET Identity string
    public int RecipeId { get; set; }
    public int Stars { get; set; }         // 1–5, validated in the controller
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    [ForeignKey("RecipeId")]
    public Recipe Recipe { get; set; }
}
```

**DbContext changes** (`API/Data/ApplicationDbContext.cs`):

- Add `public DbSet<RecipeRating> RecipeRatings { get; set; }`.
- In `OnModelCreating` (after `base.OnModelCreating`):
  ```csharp
  builder.Entity<RecipeRating>()
      .HasIndex(r => new { r.UserId, r.RecipeId })
      .IsUnique();
  ```

**Migration:** `dotnet ef migrations add AddRecipeRating` → `dotnet ef database update`.
(EF Core 8 CLI; migrations live in `API/Migrations/`, snapshot
`ApplicationDbContextModelSnapshot.cs`.)

---

## 4. Backend — `RatingController`

- Route `[Route("api/rating")]`, `[ApiController]`, derives `ControllerBase`.
- Constructor-injects `ApplicationDbContext` and `ILogger<RatingController>`;
  instantiates `ApiResponse` in the ctor — matching existing controllers.

### 4.1 `POST api/rating` — upsert

- Body: `RatingRequestDTO { string UserId; int RecipeId; int Stars; }`.
- Validate `Stars` ∈ [1, 5]; else `400` + `ApiResponse` error.
- Look up existing row by `(UserId, RecipeId)`:
  - exists → update `Stars`, `UpdatedAt = UtcNow`;
  - none → insert with `CreatedAt = UpdatedAt = UtcNow`.
- `SaveChangesAsync`, return the saved rating in `ApiResponse.Result`, `200`.

### 4.2 `GET api/rating/summary?recipeIds=1,2,3` — batch averages

- Parse the comma-separated `recipeIds`.
- Single query:
  ```csharp
  var summary = await _ctx.RecipeRatings
      .Where(r => ids.Contains(r.RecipeId))
      .GroupBy(r => r.RecipeId)
      .Select(g => new RatingSummaryDTO {
          RecipeId = g.Key,
          Average  = Math.Round(g.Average(x => (double)x.Stars), 1),
          Count    = g.Count()
      })
      .ToListAsync();
  ```
- Recipes with no ratings are simply absent from the result (frontend renders
  them as unrated — honest, not zero).
- Return `List<RatingSummaryDTO>` in `ApiResponse.Result`.

### 4.3 `GET api/rating/mine?userId=&recipeId=` — the user's own rating

- Return the caller's rating for that recipe (so the detail widget pre-fills),
  or `null` if they haven't rated it. `200` either way.

### 4.4 DTOs

```csharp
public class RatingRequestDTO { public string UserId; public int RecipeId; public int Stars; }
public class RatingSummaryDTO { public int RecipeId; public double Average; public int Count; }
```

### 4.5 Error handling

- Invalid stars → `400`.
- Exceptions → log + `StatusCode(500, _response)` with `IsSuccess = false`.
- Rating is orthogonal to core flows; a failure here never affects recipe or
  meal-plan data.

---

## 5. Frontend

### 5.1 New RTK Query module — `ratingApi.ts`

- `createApi({ reducerPath: "ratingApi", baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5128/api/" }), tagTypes: ["Rating"], ... })`.
- Endpoints:
  - `rateRecipe` mutation → `POST rating`, `invalidatesTags: ["Rating"]`.
  - `getRatingSummary` query → `GET rating/summary?recipeIds=…`, `providesTags: ["Rating"]`.
  - `getMyRating` query → `GET rating/mine?userId=&recipeId=`, `providesTags: ["Rating"]`.
- Register in `Frontend/src/redux/store/storeRedux.ts` (reducer + middleware),
  same as `mealPlanApi`.

### 5.2 Recipe detail — `SingleProduct.tsx`

- Replace the hard-coded placeholder (currently ~lines 160-163, already marked
  `TODO … wired to real ratings in the Meal Rating phase`) with RSuite's `Rate`
  component (`rsuite@^5.64.0` is already a dependency; currently unused).
- Behavior:
  - Pre-fill the widget from `getMyRating` (userId from the auth store + recipeId).
  - On change → `rateRecipe`. If no `userData.id`, render the widget read-only
    (or prompt to log in) — do not submit.
  - Show the average + count (from `getRatingSummary` for this recipe) beside the
    interactive widget.
- Errors: show a toast and revert the optimistic value; never crash the page.

### 5.3 Recipe cards — `Product.tsx` & `ProductCatalog.tsx`

- After the recipe list loads, call `getRatingSummary` once with all visible
  recipe ids (single batch request — no N+1).
- Render a small **read-only** average per card (reuse `.bm-stars` styling in
  `Frontend/src/styles/bold-modern.css`).
- Recipes absent from the summary render as unrated.

---

## 6. Success criteria

- A logged-in user can rate a recipe 1–5 stars on its detail page; re-rating
  updates their existing rating (never creates a duplicate — enforced by the
  unique index).
- The detail page shows the average rating and count; recipe cards show a small
  read-only average, loaded in a single batch request.
- Anonymous visitors see averages but cannot submit.
- Rating failures surface a toast and never break the recipe or meal-plan flows.

---

## 7. Out of scope (this pass)

- Consuming ratings in AI Meal Recommendation (Phase 6, §3.6) — this feature only
  *produces* the signal.
- Denormalized rating columns on `Recipe`.
- Written reviews / comments (stars only).
- Sorting/filtering the catalog by rating.
