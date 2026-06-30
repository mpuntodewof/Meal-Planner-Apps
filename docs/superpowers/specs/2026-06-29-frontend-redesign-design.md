# Frontend Redesign — Home, Recipe, News, About (Bold & Modern)

**Date:** 2026-06-29
**Scope:** Visual redesign of the FoodRecipe React frontend plus building out missing
sections, in a new "Bold & Modern" visual direction. Covers the four surfaces the user
named — Home, Recipe, News, About — mapped onto the existing app structure.

---

## 1. Goal & Context

The current Home page is sparse (a 4-icon feature strip + a recipe grid), there is no hero,
and the navbar's **News** (`news.html`) and **About** (`#`) links are dead. This redesign:

- Applies a consistent **Bold & Modern** visual language across the public pages.
- Builds the missing **Hero**, **Trending**, **Local Spotlight**, **News**, and **About** sections.
- Makes News & About work as **scroll-anchor sections on the Home page** (one-page marketing style).
- Replaces the fragile jQuery `meanmenu` mobile nav with a **pure-React hamburger → full-screen overlay**.

This is a **frontend-only** effort except for one small, explicitly-deferred backend item (see §7).

### Page mapping (as agreed)
| User's term | Maps to |
| --- | --- |
| Home | `pages/Home.tsx` (recomposed) |
| Recipe | `pages/product/ProductCatalog.tsx` + `SingleProduct.tsx` (restyled) |
| News | New **section** on Home (`#news`), static content for now |
| About | New **section** on Home (`#about`) |

---

## 2. Visual Language (Bold & Modern)

A small shared style layer, applied via a new stylesheet so we don't fight the existing theme CSS.

- **Backgrounds:** primary `#0f0f12`, panel `#16161a`, card `#1c1c22`, border `#26262c`.
- **Accent:** coral `#ff5a3c` (CTAs, active links, rank badges, the `FOOD.` dot, section labels).
- **Text:** `#e7e7ea` primary, `#9a9aa2` muted, `#6f6f78` faint.
- **Type:** heavy weights (800–900) and tight letter-spacing on headings; existing Poppins/Open Sans body.
- **Shape:** rounded cards (8–10px), geometric accents, generous section padding, 1px top borders between bands.
- **Section label pattern:** small uppercase coral label above each section title (e.g. "COOKING IDEAS").

### Where the food imagery goes (decided)
- **Navbar:** solid dark (`#16161a`) — NOT a photo, for legibility. Accent dot only.
- **Hero & page banners:** real food photos from existing assets
  (`src/img/food-bg-3.webp`, `public/assets/image/hero-bg.jpg`, `src/img/masakan-nusantara.jpg`)
  with a **dark gradient overlay** (`linear-gradient(90deg,rgba(15,15,18,.85),rgba(15,15,18,.45))`)
  so white/coral text stays readable.

---

## 3. Component Architecture

New/changed components, each with one clear purpose. New presentational sections live under
`src/pages/home/sections/` and are composed by `Home.tsx`.

```
src/
  pages/
    Home.tsx                      (RECOMPOSED — orders the sections below)
    home/
      sections/
        Hero.tsx                  (NEW)
        TrendingNow.tsx           (NEW — consumes favorites aggregate, see §7)
        LocalSpotlight.tsx        (NEW — static editorial content)
        RecipeGrid.tsx            (REFACTOR of existing Product.tsx markup)
        NewsSection.tsx           (NEW — static cards, data-shaped for future API)
        AboutSection.tsx          (NEW — mission + stats)
    product/
      ProductCatalog.tsx          (RESTYLE only — logic unchanged)
      SingleProduct.tsx           (RESTYLE only — logic unchanged)
  components/
    sub-comp/
      Navbar.tsx                  (REWORK — React hamburger + full-screen overlay)
      Footer.tsx / Footer move    (RESTYLE — footer is currently components/Footer.tsx)
  data/
    newsData.ts                   (NEW — static news items, typed)
  styles/
    bold-modern.css               (NEW — shared theme layer, imported once)
```

**Boundaries:**
- Each section component is self-contained, takes minimal props, and can be understood/tested alone.
- `Home.tsx` becomes a thin composition layer (ordering + section anchors), not logic.
- Restyled pages (`ProductCatalog`, `SingleProduct`) keep all existing hooks/state/effects;
  only JSX/className/inline-style changes.

---

## 4. Home Page — Section Stack (approved)

Single scroll page. Navbar links scroll to anchors; "Recipe" also routes to `/productCatalog`.

1. **Hero** (`Hero.tsx`) — food photo + overlay, label "COOKING IDEAS", H1 "Cook bold. Eat better.",
   subtext, two CTAs: **Browse Recipes** (→ `/productCatalog`, coral) and **Read News** (→ `#news`, outline).
2. **Trending Now** (`TrendingNow.tsx`) — "🔥 Trending Now" horizontal rail of recipe cards ranked by
   **most favorited**, with `#1/#2/#3` coral rank badges. Data: see §7.
3. **Local Spotlight** (`LocalSpotlight.tsx`) — "🏠 Local Spotlight", a featured Nusantara
   dish-of-the-week (large editorial image + short blurb) plus 2 supporting dish tiles. Static content.
4. **Recipes** (`RecipeGrid.tsx`, anchor `#recipes`) — "Most Viewed Recipes" grid from the real
   recipes API (`useGetRecipesQuery`), restyled dark cards; card → `/singleProduct/:id`.
5. **News** (`NewsSection.tsx`, anchor `#news`) — "Latest Food Stories" cards. **Static** for now.
6. **About** (`AboutSection.tsx`, anchor `#about`) — mission statement, stat figures
   (e.g. recipe count, 6 categories), CTA.
7. **Footer** — restyled: links, social, newsletter input (visual only).

### Anchor-scroll behavior
- Navbar items use in-page scroll to `#recipes` / `#news` / `#about` when already on `/`,
  otherwise navigate to `/#anchor`. Smooth scroll, accounting for the sticky navbar height.

---

## 5. Recipe Pages — Restyle (approved)

**Catalog (`ProductCatalog.tsx`):**
- Food-photo banner ("Recipe Catalog") with overlay.
- Responsive dark card grid (3-up desktop → 1-up mobile).
- **Coral heart toggle**: filled coral = favorited, outline = not. Wired to existing
  `toggleLiked` / favorites state — no behavior change.
- Restyled pagination bar (Prev · active page coral · Next).
- **Deferred batch-sync of favorites stays exactly as-is** (every 3 min, on pagination, on unload).

**Single recipe (`SingleProduct.tsx`):**
- Full-width image hero with gradient overlay carrying title + cooking time / serving / rating.
- **Ingredients** and **Steps** in side-by-side dark panels (stack on mobile).
- Admin Edit/Delete as outlined coral buttons (existing role-gating unchanged).
- Keeps the null-guards added earlier (`data?.result?...`).

---

## 6. Navbar & Responsive Hamburger (approved)

- **Desktop (>992px):** solid dark horizontal bar — `FOOD.` logo, links (Home/Recipe/News/About),
  auth area (Login/Register OR Welcome ▸ Create Recipe/Profile/Logout), admin "Pages" submenu.
- **Mobile (≤992px):** links collapse into a **hamburger button**. Tapping it opens a
  **full-screen centered overlay** (option B):
  - Four main links large and centered.
  - Logged-in/admin items (Create Recipe, User Profile, Logout / admin Pages) rendered as a
    **smaller secondary group** below the main links so the overlay stays clean.
  - Close via ✕ (top-right) or selecting a link.
  - **Body scroll locked** while open; overlay state via `useState` (pure React).
- **Removes dependency on jQuery `meanmenu`** for navigation. The existing scroll-sticky behavior
  (already fixed to a single passive listener with cleanup) is preserved.
- Existing dead links fixed: News → `#news`, About → `#about`, "Recipe Catalog"/"Contact Us"
  hero buttons in old `Banner.tsx` are superseded by the new Hero CTAs.

---

## 7. Data & The One Deferred Backend Item

- **Recipes grid & Trending** consume the existing `recipeApi` (`useGetRecipesQuery`) and
  favorites data. No new recipe endpoint.
- **Trending = most favorited.** The recipes API has no view-count. We need a favorite-count
  per recipe. Two options, lightest first:
  1. **Client-side aggregate (preferred for this redesign):** derive ranking from data already
     available (favorites/recipe lists) without a new endpoint. If a global favorite count isn't
     available to anonymous users, fall back to **newest recipes** labeled appropriately.
  2. **Small new API endpoint** (`/api/recipe/trending` returning recipes ordered by favorite
     count) — cleaner, but a backend task.
  The redesign will implement option 1 with a clearly-isolated data hook
  (`useTrendingRecipes`) so swapping to option 2 later is a one-file change.
- **News content** has **no backend** (user-confirmed). Ships as typed static data in
  `src/data/newsData.ts`, shaped like a future `NewsItem` API model so wiring a real
  News API later is a drop-in. **Building the News backend is explicitly OUT OF SCOPE** here
  and noted as a separate future task.

---

## 8. Performance Considerations

Consistent with the optimizations already applied (route lazy-loading, deferred scripts,
compressed images):
- New section components are part of the (already lazy-loaded) Home chunk; keep imagery using
  the compressed assets.
- Use existing compressed hero/spotlight images; no new large originals introduced.
- Hamburger overlay is CSS-transform animated (no layout thrash).

---

## 9. Out of Scope

- News backend / CMS (static data only).
- Figma or Stitch export / MCP integration (not connected; user chose direct React redesign).
- Meal Planner page redesign (remains WIP per SystemArchitecture.md).
- Auth, recipe CRUD, favorites sync **logic** changes (visual-only on those surfaces).

---

## 10. Testing & Verification

- `npm run build` compiles clean (no new TS/lint errors beyond pre-existing).
- Manual responsive check at >992px and ≤992px: hamburger opens/closes, body scroll locks,
  links navigate/scroll, overlay closes on selection.
- Anchor links scroll correctly from `/` and from other routes (`/#news`).
- Recipe catalog: heart toggle still favorites/unfavorites; pagination still works; deferred
  sync still fires (unchanged logic).
- Single recipe: renders ingredients/steps; admin actions gated; null-guards hold when API slow.
- Visual spot-check of each Home section against the approved mockups.
```
