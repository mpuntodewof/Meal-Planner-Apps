# Meal Planner Feature Roadmap & Technical Design

**Date:** 2026-07-01
**Author:** Product/engineering brainstorm
**App:** FoodRecipe Integrated Workspace (ASP.NET Core 8 API + React/TS SPA + MySQL)
**Goal driving this work:** **User engagement / retention**
**AI status:** OpenAI already integrated (`AiRecipeService`, `gpt-4o-mini`, JSON-object response format)

---

## 1. Executive Summary

Six feature areas were proposed for adjustment:

1. Background Jobs (generate recommendations, cleanup expired tokens, email reminders)
2. AI Nutrition Analysis (calories, protein, fat, carbs)
3. AI Meal Recommendation
4. Meal Rating
5. Nutrition Dashboard
6. Shopping List

**Verdict: all are worth doing, but not all worth doing *now*.** With retention as the goal, the deciding test for each feature is: *does it create a reason to come back tomorrow, and does it depend on something not yet built?*

The critical insight: **most of these are "leaf" features that hang off a working Meal Planner.** A Nutrition Dashboard with nothing planned is empty. A Shopping List with no plan has nothing to buy. Reminders with no plan have nothing to remind about. The Meal Planner frontend — currently a mockup — is the load-bearing wall.

A second insight: **"Background Jobs" is not one feature.** It is a delivery mechanism for three unrelated things (recommendations, token cleanup, reminders) with wildly different value. They are ranked separately below.

---

## 2. Priority Ranking

### Tier 1 — Foundation (do first, unlocks everything else)

| # | Feature | Why first | Effort | Retention value |
|---|---------|-----------|--------|-----------------|
| 1 | **Finish Meal Planner frontend** | Backend is done; frontend is a mockup. It is the daily-habit surface every other feature attaches to. Lowest-cost, highest-leverage. | Low (wire UI to existing endpoints) | ★★★★★ (it *is* the loop) |
| 2 | **AI Nutrition Analysis** | AI already wired; marginal cost low. Nutrition is *why* people meal-plan. Estimate once at save time, store on recipe → cheap + powers the dashboard. | Low–Med | ★★★★☆ |

### Tier 2 — High engagement, depends on Tier 1

| # | Feature | Why | Effort | Retention value |
|---|---------|-----|--------|-----------------|
| 3 | **Shopping List** | Turns the app into a weekly *utility* opened in the grocery store. Strongest pure-retention feature. No AI required. | Med | ★★★★★ |
| 4 | **Nutrition Dashboard** | High perceived value, but a *consumer* of #2's data — near-worthless until #2 + real plans exist. | Med (charting) | ★★★★☆ |

### Tier 3 — Supporting cast

| # | Feature | Why | Effort | Retention value |
|---|---------|-----|--------|-----------------|
| 5a | **Email reminders** (background job) | Genuinely retention-driving, but needs plans + shopping list to remind about. Introduces the job host. | Med | ★★★★☆ |
| 5b | **Cleanup expired tokens** (background job) | Pure hygiene. Bundle free with 5a once the host exists. | Trivial | ★☆☆☆☆ |
| 7 | **Meal Rating** | Low standalone value, but cheapest to build; its purpose is to generate signal for #6. Prerequisite, not a standalone win. | Low | ★★☆☆☆ (derivative) |
| 6 | **AI Meal Recommendation** | Highest effort, most speculative payoff. Users forgive a missing rec more than a bad one. Needs favorites + rating signal. Great phase-2 showcase. | High | ★★★☆☆ |

### Dependency chain

```
1. Meal Planner frontend  ──┬──> 3. Shopping List (ingredients from plan)
   (foundation)            │
                           ├──> 5a. Email reminders (remind about plan)
                           │
2. AI Nutrition (store) ───┴──> 4. Nutrition Dashboard (visualize stored data)

7. Meal Rating ────────────────> 6. AI Meal Recommendation (needs signal)
5b. Token cleanup (independent, trivial — bundle with 5a)
```

### Recommended build sequence

| Phase | Ship | Rationale |
|-------|------|-----------|
| 1 | Meal Planner frontend | Unlocks the whole product loop |
| 2 | AI Nutrition Analysis (store-on-save) | Cheap now, powers the dashboard |
| 3 | Shopping List | Strongest standalone retention utility |
| 4 | Nutrition Dashboard | Data now exists; high visible value |
| 5 | Background jobs (reminders + token cleanup) | Now there's a plan worth reminding about |
| 6 | Meal Rating → AI Recommendation | Rating feeds the recommender; do together |

**If scope must be cut:** ship phases 1–4 as a coherent "meal planning that actually helps you eat" release; defer 5–6.

---

## 3. Deep Technical Designs

The current schema (confirmed from source):
- `Recipe`: `Id, Name, Description, CookingTime, ServiceSize, ImageUrl, VideoUrl, UserId, CategoriesId, CreatedAt, UpdatedAt` + nav collections `Ingredients`, `Instructions`, `UserFavorites`, `MealPlans`. **No nutrition columns.**
- `Ingredient`: `Id, Name, Description, Unit, RecipeId`. **No quantity field** — important for Shopping List.
- `MealPlans`: `Id, MealType, PlanName, StartDate, EndDate, RecipeId, UserID` + `MealPlanDays` (specific dates).
- `AiRecipeService`: `OpenAI.Chat.ChatClient`, model `gpt-4o-mini`, `ChatResponseFormat.CreateJsonObjectFormat()`, deserialize to DTO, null-on-failure. Reuse this exact pattern.

---

### 3.1 — Meal Planner Frontend (Phase 1)

**What exists:** `MealPlanController` (schedule/retrieve), `MealPlanDTO`, `MealPlans` + `MealPlanDays` entities, and a UI mockup/placeholder on the React side.

**Goal:** Wire the placeholder to the real API so users can build and view weekly plans.

**Frontend work:**
- Add a `mealPlanApi` RTK Query module mirroring the existing `recipeApi`/`favoriteApi` pattern (base query → local ASP.NET server, cache tag `["MealPlans"]`, invalidate on create/update/delete).
- Calendar/week view: for the selected `StartDate..EndDate` range, render a grid of days × meal types (Breakfast/Lunch/Dinner).
- "Add to plan" flow from the recipe catalog: pick a recipe → pick date + meal type → POST to `MealPlanController`.
- Empty/loading/error states (RSuite components, consistent with existing screens).

**Data-shape note / possible backend adjustment:**
Current `MealPlans` binds **one** `RecipeId` per plan row with a date *range*, and `MealPlanDays` holds dates. For a real weekly planner where each (day, meal type) slot holds a recipe, the cleaner model is **one row per slot**:

```
MealPlanEntry { Id, UserId, Date, MealType, RecipeId }
```

Recommendation: introduce `MealPlanEntry` (day+mealtype+recipe) as the unit the frontend reads/writes. Keep `MealPlans` as an optional "named plan" grouping if desired, or migrate to the flatter model. **Decide this before building the grid** — it dictates the API contract. This is the one place Phase 1 may require a backend change rather than pure wiring.

**Success criteria:** a user can add recipes to specific day/meal slots, see the week populated, remove entries, and have it persist across sessions.

---

### 3.2 — AI Nutrition Analysis (Phase 2)

**Principle: estimate once, store forever.** One LLM call per recipe at create/update time, cached on the row. Never call per-view. This makes the Dashboard (3.4) a pure DB read.

**Schema change — add nullable columns to `Recipe`:**

```csharp
// Recipe.cs — nutrition (AI-estimated, per serving)
public int?     Calories   { get; set; }  // kcal per serving
public decimal? ProteinG   { get; set; }  // grams per serving
public decimal? FatG       { get; set; }
public decimal? CarbsG     { get; set; }
public DateTime? NutritionEstimatedAt { get; set; }  // null = not yet analyzed
```

Nullable so existing rows and estimation failures degrade gracefully (Dashboard shows "not analyzed" instead of zero). Add an EF migration.

**Service — mirror `AiRecipeService`:**

```csharp
public interface INutritionService
{
    Task<NutritionResult?> EstimateAsync(Recipe recipe);  // null on failure
}
```

Prompt design (reuse the JSON-object pattern):
- **System:** "You are a nutrition estimator. Given a recipe name, serving size, and ingredient list, estimate per-serving nutrition. Respond with ONLY a JSON object: `{\"calories\":number,\"proteinG\":number,\"fatG\":number,\"carbsG\":number}`. Estimate conservatively; if uncertain, give a reasonable midpoint."
- **User:** serialized `{ name, serviceSize, ingredients: [{name, unit, description}] }`.
- `ChatResponseFormat.CreateJsonObjectFormat()`, deserialize to `NutritionResult`, return null on empty/malformed/exception — exactly like `AiRecipeService.GenerateAsync`.

**Where to call it:**
- In `RecipeController` **after** create and after ingredient-affecting updates, populate the columns and set `NutritionEstimatedAt`.
- Two options for *when*: (a) inline (adds ~1–2s to the save request) or (b) fire-and-forget via the background job host from Phase 5. **Recommend inline for Phase 2** (simpler, correctness over latency for an admin-only create flow), migrate to the job queue if latency becomes a problem.

**Cost note:** `gpt-4o-mini`, ~one call per recipe ever. With 10s–100s of recipes this is cents total. Re-estimate only when ingredients change (`NutritionEstimatedAt < UpdatedAt`).

**Success criteria:** every new/edited recipe gets stored per-serving macros; failures leave nulls and are logged, never blocking the save.

---

### 3.3 — Shopping List (Phase 3)

**The strongest retention feature.** Aggregate ingredients across a plan's recipes into a checkable grocery list.

**The quantity problem (must resolve first):**
`Ingredient` currently has `Name`, `Unit`, `Description` — **no numeric quantity**. Aggregation ("3 eggs + 2 eggs = 5 eggs") is impossible without one. Three options, cheapest first:

1. **Group without summing (MVP):** list each ingredient grouped by normalized name, showing source recipes and their unit strings ("Eggs — from Carbonara, from Omelette"). No math, ships immediately, still useful. **Recommended for first cut.**
2. **Add `Quantity decimal?` to `Ingredient`:** enables real summation per (name, unit). Requires a migration + form field + backfill of existing rows. Best long-term.
3. **AI parse of the `Unit`/`Description` free-text** into (quantity, unit) at list-generation time. Avoids schema change but adds LLM cost/latency to every list view — **not recommended** (violates the estimate-once principle).

Recommend **shipping option 1**, then upgrading to option 2 when adding recipe-form quantity becomes worthwhile.

**Backend:**
- `ShoppingListController.GenerateAsync(dateRange or planId)`:
  1. Resolve the recipes scheduled in that range for the current user (from Meal Planner entries — see 3.1).
  2. Load their `Ingredients`.
  3. Group by normalized name (lowercase/trim); collect units + source recipes; sum quantity if option 2 is in place.
  4. Return `[{ name, unit, quantity?, fromRecipes: [names] }]`.
- Optional persistence: a `ShoppingListItem { Id, UserId, Name, IsChecked, GeneratedForRange }` table so checkbox state survives reloads. MVP can keep check state client-side.

**Frontend:**
- "Generate shopping list" button on the plan/week view.
- Checkable list grouped by category if desired (categories can come from recipe category as a rough proxy).
- Client-side check state for MVP; persist later.

**Success criteria:** from a populated week, a user gets a deduplicated grocery list they can check off.

---

### 3.4 — Nutrition Dashboard (Phase 4)

**A pure consumer of 3.2's stored data — build only after nutrition columns are populated and the planner has real plans.**

**Backend:**
- `NutritionController.GetSummary(dateRange)`:
  1. Resolve scheduled recipes for the range (same query as Shopping List).
  2. Read the stored `Calories/ProteinG/FatG/CarbsG` (no LLM calls).
  3. Aggregate per day and for the range total; flag recipes with null nutrition as "not analyzed."
  - Return `{ perDay: [{date, calories, proteinG, fatG, carbsG}], total: {...}, unanalyzedCount }`.

**Frontend:**
- Daily calorie bar/line chart across the week; macro breakdown (protein/fat/carbs) as stacked bars or a donut per day.
- Charting: a lightweight React chart lib (e.g. Recharts) fits the existing stack; keep it to 1–2 chart types.
- Show "N recipes not yet analyzed" so gaps are honest, not silently zeroed.

**Success criteria:** for a planned week, the user sees daily calories and macro split at a glance, with clear handling of unanalyzed recipes.

---

### 3.5 — Background Jobs (Phase 5)

**Not one feature — a host plus three unrelated jobs.** Introduce the host when building **email reminders** (the one with real value), and fold token cleanup in for free.

**Host options:**
- **`BackgroundService` / `IHostedService` + a timer (`PeriodicTimer`)** — zero new dependencies, fine for a handful of periodic jobs. **Recommended** for this app's scale.
- **Hangfire** — dashboard, retries, persistence, cron. Worth it only if job volume/observability grows. Overkill now.

**Job 5a — Email reminders (real value):**
- Reuse the existing `SendEmailService` (`IEmailSender`) already used for password reset.
- Daily timer: find plan entries for *today* (or tomorrow morning) per user → send "Your dinner today is *X* — need groceries? [link]".
- Add a per-user opt-in flag (`AppUser.ReminderOptIn`) to avoid unsolicited mail. Respect it.
- **Retention payload**: link straight into the plan/shopping list, closing the loop back into the app.

**Job 5b — Cleanup expired tokens (hygiene, trivial):**
- If reset tokens/refresh tokens are persisted, a nightly sweep deletes expired rows. If tokens are stateless JWTs with no server store, this job may be unnecessary — **verify what's actually persisted before building it.**

**Job 5c — Generate recommendations:**
- Only meaningful once 3.6 exists. Precompute per-user recommendations on a schedule so the UI reads them instantly. Defer until recommendations ship.

**Success criteria:** opted-in users receive a daily meal reminder linking back into the app; expired persisted tokens (if any) are swept nightly.

---

### 3.6 — AI Meal Recommendation + 3.7 Meal Rating (Phase 6, together)

**Built as a pair:** rating produces the signal; recommendation consumes it.

**Meal Rating (3.7) — cheap, do first within this phase:**
- New entity `RecipeRating { Id, UserId, RecipeId, Stars (1–5), CreatedAt }`, unique per (User, Recipe).
- `RatingController`: upsert a rating, get average + count per recipe.
- Frontend: star widget on the recipe detail/card; show average.
- Immediate secondary benefit: social proof (avg rating) on the catalog, mild engagement lift on its own.

**AI Meal Recommendation (3.6):**
- **Signal inputs:** user favorites (`UserFavorite`), ratings (new), category affinity, past plan history.
- **Approach A — LLM-based (on-brand, reuse `AiRecipeService` pattern):** send the user's liked/highly-rated recipe names + available catalog → ask for N recommendations from the catalog with reasons. JSON-object response. Precompute via job 5c; store per-user.
- **Approach B — heuristic (cheaper, no LLM):** rank catalog by category affinity + rating, exclude already-planned/favorited. Good baseline; can ship before the LLM version.
- **Recommend:** ship heuristic B first as the fallback, layer LLM A on top as the "smart" version. Never show an empty state — fall back to popular/highly-rated.
- **Quality guard:** recommendation quality is the risk. Start with a small, visible "Recommended for you" strip, measure click-through, iterate. Do not make it the app's centerpiece until it earns trust.

**Success criteria:** users can rate recipes; a "Recommended for you" strip surfaces relevant recipes with a sensible non-empty fallback.

---

## 4. Cross-Cutting Notes

- **Reuse the `AiRecipeService` pattern** for every AI feature: `gpt-4o-mini`, `CreateJsonObjectFormat()`, deserialize-to-DTO, return null on failure, log and degrade gracefully. Never let an AI call block or break a core flow.
- **Estimate-once discipline:** any AI-derived data (nutrition, recommendations) is computed on write or on schedule and stored — never recomputed per page view.
- **Honest empty states:** unanalyzed nutrition, empty recommendations, and quantity-less shopping items should be shown truthfully, not silently zeroed or hidden.
- **The Meal Planner data model (3.1) is the one open architectural decision** that gates the most downstream work (shopping list + dashboard both query "recipes scheduled in a range"). Settle `MealPlanEntry` vs. the current `MealPlans` + `MealPlanDays` shape before Phase 1 UI work.

---

## 5. Open Decisions to Resolve Before Building

1. **Meal Planner data model:** flat `MealPlanEntry (Date, MealType, RecipeId)` vs. current range-based `MealPlans`? (Gates Phases 1, 3, 4.)
2. **Ingredient quantity:** ship Shopping List without summing (option 1) first, or add `Quantity` now (option 2)?
3. **Nutrition estimation timing:** inline on save vs. background job?
4. **Token cleanup necessity:** are reset/refresh tokens actually persisted server-side? (Verify before building 5b.)
5. **Recommendation approach:** heuristic-first with LLM layered on, or LLM-only?
