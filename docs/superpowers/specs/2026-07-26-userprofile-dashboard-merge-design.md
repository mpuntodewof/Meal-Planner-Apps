# UserProfile × Dashboard Merge — Design

**Date:** 2026-07-26
**Status:** Approved (pending spec review)
**Approach:** A — Tabbed shell around the existing Dashboard

## Goal

Merge the legacy `UserProfile` feature into the new Behavior Dashboard so there is a
single, design-system-consistent account page. The Dashboard becomes the shell; the
profile capabilities (edit info, own recipes, favorites, password change) become tabs
alongside the existing analytics.

## Decisions (from brainstorming)

| Topic | Decision |
| --- | --- |
| Merge shape | Dashboard is the shell; profile features become tabs inside it |
| Sections carried over | Behavior analytics, Personal Info edit, Your Collection (My Recipes), Favorites |
| "Your Collection" data | Wire to **real** data now (new backend endpoint) |
| Whose data | **Self only** — logged-in user; admins keep the platform-analytics toggle |
| Tab styling | **New design-system tabs** (namespaced `ds-*`), not react-bootstrap |
| Endpoint scoping | **Param-based** (`by-user/{userId}`), matching existing endpoints |
| Reset Password | **Make it functional** via a new in-app change-password flow → **Security** tab |
| Masthead | **Swaps per active tab** so the title/lead/data-note stay truthful per tab |

## Architecture

`Dashboard.tsx` becomes a thin shell:

```
Navbar (shared)
  → masthead (per-tab title/lead/note)
  → DashboardTabs (DS tab bar)
  → active tab content
  → Footer (shared)
```

- Self-scoped to `userData.id` from `userAuthStore`.
- The auth-rehydration guard (loader while `authResolving`, login prompt when
  `loggedOut`) lives **once** in the shell. Tabs receive `userId` as a prop and never
  read auth state themselves.
- Tab state is local (`useState`), default **Overview**. No route nesting; `?tab=`
  deep-linking is explicitly out of scope.

### File layout

```
pages/dashboard/
  Dashboard.tsx                  (shell: navbar, masthead, tab bar, footer)
  components/
    DashboardTabs.tsx            (DS tab bar — role="tablist", arrow-key nav)
    ... (existing chart components unchanged)
  tabs/
    OverviewTab.tsx              (lifted analytics — behavior unchanged)
    ProfileTab.tsx               (restyled edit form + avatar upload)
    MyRecipesTab.tsx             (user's own recipes — real data)
    FavoritesTab.tsx             (favorites grid — real data)
    SecurityTab.tsx              (change-password form)
  dashboard.css                  (+ tab + form styles, all ds-*/namespaced)
```

## Tabs

1. **Overview** — the current analytics JSX moved verbatim into `OverviewTab.tsx`
   (KPI tiles, charts, empty state). The **admin platform toggle lives here only**.
   Uses `useGetUserDashboardQuery` / `useGetAdminDashboardQuery` (unchanged).
2. **Profile** — `useGetUserByIdQuery(userId)` + `useUpdateUserMutation`. Same fields
   (name, email, city, country, social media, phone, gender), same avatar upload with
   client-side validation (≤1MB; jpg/jpeg/png), re-expressed in `ds-card` containers.
3. **My Recipes** — `useGetRecipesByUserIdQuery(userId)` → **new** endpoint. Real recipe
   cards (`recipeName`, `imageUrl`, `id`), with an `EmptyState` + "Create New Recipe" CTA
   when empty. Replaces the current lorem-ipsum placeholders.
4. **Favorites** — `useGetFavRecipeByUserIdQuery(userId)` (unchanged), restyled cards,
   `EmptyState` when empty.
5. **Security** — change-password form (current + new + confirm) →
   `useChangePasswordMutation` → **new** endpoint.

## Data flow

- Each tab's query uses RTK Query `skip` so data loads only when the tab is first
  opened. Overview loads immediately.
- The API serializes with `ReferenceHandler.Preserve`, so arrays arrive wrapped as
  `{ $values: [...] }`. Unwrap at the data boundary with the existing `arr()` helper
  pattern already used in the dashboard.

## Backend additions

### `RecipeController` — recipes by user

- `GET /api/recipe/by-user/{userId}` — returns recipes where `Recipe.UserId == userId`.
- Mirrors `GetAllRecipe`'s `ApiResponse` shape and `$values` serialization so the
  frontend unwraps it with the same helper.
- **Param-based scoping** (trusts the client to pass its own id), consistent with the
  existing `get-favorite-byUserId` and profile endpoints.
- Empty result → normal empty state in the tab, not an error.

### `AuthController` — change password

- `POST /api/auth/change-password` — for an **authenticated** user, verify the current
  password and set a new one via ASP.NET Identity `ChangePasswordAsync`.
- Distinct from the existing token/email `reset-password` flow (which is for
  logged-out users who forgot their password). That flow remains untouched at
  `/forgotPassword` and `/resetPassword`.
- Payload: `{ email, currentPassword, newPassword, confirmPassword }`. The user is
  resolved by `email` (mirroring how `reset-password` looks the user up), then
  `ChangePasswordAsync(user, currentPassword, newPassword)` enforces the current
  password. `confirmPassword` is validated equal to `newPassword` before the call.

## Frontend additions

- `useGetRecipesByUserIdQuery` on the recipe API module (matching the existing recipe
  API pattern).
- `useChangePasswordMutation` on `authApi`.
- `DashboardTabs` DS component: `role="tablist"`, `role="tab"` buttons with
  `aria-selected`, arrow-key navigation, active indicator using the dashboard's `--s*`
  tokens, horizontally scrollable on mobile (reuse `scroll-x`).
- Four new tab components + one new `SecurityTab`.
- Tab + form styles appended to `dashboard.css`, all namespaced `ds-*` to avoid the
  Bootstrap `.card` / `.col-*` / `.kpi` collisions the dashboard already guards against.

## Routing

- `/dashboard` stays the canonical route (self-only, no `:userId`).
- `/userProfile/:userId` → **redirects** to `/dashboard` so existing links/bookmarks
  don't break.
- Navbar's separate "User Profile" and "Dashboard" links collapse into **one** entry
  → `/dashboard` (both desktop dropdown and mobile overlay).

## Styling & chrome

- Design-system tabs; no react-bootstrap `Tab.Container`.
- Shared `Navbar` + `Footer` wrap the whole page; the old UserProfile's hand-rolled
  inline header is retired.
- Masthead title/lead/data-note swap per active tab (small lookup keyed by active tab),
  so the analytics-specific data note never appears over the edit form.

## Testing

- **Backend:** unit/integration tests for the two new endpoints in `API.Tests` —
  `by-user/{userId}` returns only that user's recipes (and an empty set cleanly);
  `change-password` succeeds with a correct current password and rejects a wrong one.
- **Frontend:** tab switching renders the correct panel; lazy `skip` prevents premature
  fetches; empty states render for no-recipes / no-favorites; the `/userProfile/:userId`
  → `/dashboard` redirect works.

## Out of scope (YAGNI)

- Admin viewing/editing **other** users' profiles or analytics.
- `?tab=` deep-linking / route-nested tabs.
- Refactoring pages unrelated to this merge.
- Any change to the existing forgot/reset (email-token) password flow.

## Retired

- The old `UserProfile.tsx` inline header and its empty, non-functional
  "Reset Password" tab stub.
