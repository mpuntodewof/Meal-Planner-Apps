# Shopping List — Technical Design

**Date:** 2026-07-02
**App:** FoodRecipe Integrated Workspace (ASP.NET Core 8 API + React/TS SPA + MySQL)
**Phase:** Roadmap Phase 3 (see `2026-07-01-meal-planner-feature-roadmap-design.md` §3.3)
**Goal driving this work:** User engagement / retention — turn the app into a weekly grocery-store utility.

---

## 1. Summary

Generate a deduplicated grocery list from the recipes a user has scheduled in a
given date range. The list is **computed on demand** from the meal plan — there
is no server-side storage of the list itself. Check-off state lives in the
browser (`localStorage`) with a self-expiring window, so a list survives reloads
without any new infrastructure.

This is the **MVP first cut** ("group, don't sum") from the roadmap. It ships
with **no new database table, no migration, and no new infrastructure**.

---

## 2. Scope & key decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Which recipes are "in range" | **By scheduled day** — a recipe is included if any of its `MealPlanDays.Date` falls within `[start, end]` | Correct "what am I actually cooking these days" semantic. Deliberately does **not** reuse `GET api/mealPlan/range`, which filters on `MealPlans.StartDate` and can miss/misinclude recipes. |
| Quantities | **Group, don't sum** | `Ingredient` has no numeric `Quantity` field (only `Name`, `Unit`, `Description`, `RecipeId`). Summing is impossible without a schema change. Grouping is still useful and ships now. |
| Grouping key | **Normalized name** (`Name.Trim().ToLower()`) | One line per ingredient. Distinct unit strings and source recipes are listed within the group. |
| List persistence | **None (computed on demand)** | The source of truth (recipes + scheduled days) already persists in MySQL forever; the list is a pure function of it and cheap to recompute. |
| Check-off state | **Browser `localStorage`**, keyed by `userId` + range | The only genuinely ephemeral data is which items are ticked. Zero backend, correct lifetime. |
| Check-state expiry | **3 days** (self-expiring stamp) | Browser-side equivalent of a TTL. Long enough to plan-then-shop within a few days; short enough not to keep stale lists around. |
| Auth | **`userId` passed as a query param; no `[Authorize]`** | Matches every existing controller (`MealPlanController`, `FavoriteController`). The app does not enforce identity server-side today; new code follows the established convention rather than introducing a divergent pattern. |

### Explicitly deferred (documented, NOT built in this pass)

- **`ShoppingListItem` MySQL table** — for cross-device check-state sync. Uses the
  DB already in use (no new container). The right upgrade if cross-device matters.
- **Redis with server-side TTL** — a true expiring cache. Better suited to the
  Phase-6 recommendation caching than to a small, cheaply-recomputed list.
- **`Ingredient.Quantity` column** — enables real summation per (name, unit).
  Requires a migration + recipe-form field + backfill of existing rows.

---

## 3. Backend design

### 3.1 New controller — `ShoppingListController`

- Route `[Route("api/shoppingList")]`, `[ApiController]`, derives `ControllerBase`.
- Constructor-injects `ApplicationDbContext` and `ILogger<ShoppingListController>`,
  instantiates `ApiResponse` in the ctor — matching existing controllers.
- **No new `DbSet`, no entity, no migration.**

**Endpoint:** `GET api/shoppingList?userId={id}&start={date}&end={date}`
→ `Generate(string userId, DateTime start, DateTime end)`
returning `Task<ActionResult<ApiResponse>>`.

### 3.2 Query (by scheduled day)

```csharp
var days = await _ctx.MealPlanDays
    .Include(d => d.MealPlans).ThenInclude(m => m.Recipe).ThenInclude(r => r.Ingredients)
    .Where(d => d.MealPlans.UserID == userId
             && d.Date >= start && d.Date <= end)
    .ToListAsync();
```

Note the entity naming from source: the child is `MealPlanDays` with nav
`MealPlans MealPlans` (singular parent, plural type name), and the parent's owner
field is `MealPlans.UserID` (capital `ID`).

### 3.3 Aggregation (in memory)

1. Flatten `days` → distinct parent `MealPlans` → their `Recipe.Ingredients`.
   (A plan can own several scheduled days; dedupe recipes so ingredients aren't
   double-listed just because a recipe is cooked on two days in the range.)
2. Group ingredients by `Name.Trim().ToLower()`.
3. Per group build a `ShoppingListItemDTO`:
   - `Name` — display name using first-seen casing.
   - `Units` — distinct non-empty `Unit` strings across the group.
   - `FromRecipes` — distinct recipe names the ingredient came from.
4. Order groups alphabetically by name for a stable list.

### 3.4 Response DTO

```csharp
public class ShoppingListItemDTO
{
    public string Name { get; set; }
    public List<string> Units { get; set; }        // distinct unit strings
    public List<string> FromRecipes { get; set; }  // source recipe names
}
```

Returned as `ApiResponse.Result` = `List<ShoppingListItemDTO>`.

### 3.5 Error / empty handling

- Empty range (no scheduled days) → `Result = []`, `IsSuccess = true`, `200`.
  Honest empty state, not an error.
- Exception → log + `StatusCode(500, _response)` with `IsSuccess = false` and an
  error message, matching existing controllers.
- Read-only: the endpoint never mutates plan data, so there is no risk to the
  core meal-plan flow.

---

## 4. Frontend design

### 4.1 New RTK Query module — `shoppingListApi.ts`

- `createApi({ reducerPath: "shoppingListApi", baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5128/api/" }), tagTypes: ["ShoppingList"], ... })`.
- One endpoint: `generateShoppingList` query taking `{ userId, start, end }`,
  URL `shoppingList?userId=&start=&end=`, `providesTags: ["ShoppingList"]`.
- Export generated hook + default the api. Register in
  `Frontend/src/redux/store/storeRedux.ts` (add `[api.reducerPath]: api.reducer`
  to `reducer` and `.concat(api.middleware)` to middleware) — same as `mealPlanApi`.

### 4.2 UI

- **Entry point:** a "Generate shopping list" action on `MealPlanner.tsx`, using
  the currently-viewed week/date range and `userData.id`.
- **View:** a new `ShoppingList.tsx` (page or panel) rendering the grouped,
  checkable list with RSuite components, consistent with existing screens.
  Each row: checkbox, ingredient name, its unit strings, and a subtle
  "from: recipe A, recipe B" source line.
- Loading / empty / error states via RSuite, matching existing screens.

### 4.3 Check-off state (localStorage, 3-day expiry)

- Storage key: `shoppingList:{userId}:{start}_{end}`.
- Value: `{ checked: string[], expiresAt: number }` where `checked` holds the
  normalized ingredient names that are ticked and `expiresAt = now + 3 days`
  (in ms).
- On load: if `Date.now() > expiresAt`, drop the entry and start fresh.
- On toggle: update `checked` and refresh `expiresAt` to `now + 3 days`.
- State is per device; it is not synced to the server in this pass.

---

## 5. Success criteria

- From a week with recipes scheduled on specific days, a user gets a
  deduplicated grocery list grouped by ingredient name, showing each
  ingredient's unit strings and which recipes it came from.
- Items can be checked off; the checked state survives a page reload on the same
  device and self-clears after 3 days.
- An empty range yields an honest empty list, not an error.
- No new database table, migration, or infrastructure is introduced.

---

## 6. Out of scope (this pass)

- Quantity summation (needs `Ingredient.Quantity`).
- Cross-device check-state sync (needs `ShoppingListItem` table).
- Server-side TTL cache (Redis).
- Category grouping of the list (could later use `Recipe.CategoriesId` as a proxy).
- Editing/adding ad-hoc items to the list.
