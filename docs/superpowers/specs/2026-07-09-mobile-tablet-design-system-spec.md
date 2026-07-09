# Meal Planner — Mobile & Tablet Design System Spec

> **Portable prompt-spec** for generative design tools (Stitch.ai, Lovable, Trae).
> This document is the source of truth. It describes a **design system + high-fidelity
> screens** for a meal-planner web app, optimized for mobile and tablet.

---

## 0. How to use this spec (read first)

You are producing a **design system and a set of high-fidelity, responsive screens**
suitable for assembly into a **Figma prototype**. Follow these rules:

1. **This is a refinement, not a redesign.** The app already exists with a defined
   visual identity (warm cream background, white cards, orange accent, heavy
   typography). Preserve that identity exactly. Do **not** invent a new color
   language, new fonts, or a new brand feel.
2. **Honor the design tokens in §2 verbatim.** Every color, radius, and shadow is
   taken from the live application. Use these exact values.
3. **Define each component once (see §5) and reuse it** across every screen. Do not
   re-style the same component differently per screen. Consistency is the goal.
4. **Design mobile-first**, then tablet, then desktop. All three breakpoints are
   required for every screen (§3, §6).
5. **Light theme only.** Do not generate a dark theme.
6. **Deliverable:** a component library + the 8 screens in §6, each shown at mobile,
   tablet, and desktop widths, wired into a navigable Figma prototype.

---

## 1. Context & goals

**Product:** A meal-planning web app. Users browse recipes, view detailed recipe
pages (with nutrition), plan meals across a week, generate shopping lists, and track
their habits on a dashboard. There is a marketing/home surface and authentication.

**Existing stack (for context — the returned design will be re-implemented here):**
React 18 + Bootstrap 5, with a token-based custom CSS layer. Icons: Bootstrap Icons.

**Users:** Home cooks and meal-planners on phones and tablets, plus desktop. Mobile
is the primary target; tablet must be first-class (not stretched mobile); desktop
should be a graceful, refined version of what exists today.

**Mandate:**
- **Refine, don't redesign.** Keep the current identity; make mobile & tablet excellent.
- **Tablet gets its own optimized layouts**, not scaled-up mobile.
- **Consistency via a real design system** — tokens defined once, components reused.

**Non-goals:** No dark mode. No new brand/logo. No new feature scope — same screens,
better responsive design.

---

## 2. Design tokens

> These values are extracted from the live application. Use them exactly.

### 2.1 Color

| Token | Value | Role |
|---|---|---|
| `color.bg` | `#f9f6ee` | Warm cream — page background |
| `color.panel` | `#ffffff` | Alternating section band |
| `color.card` | `#ffffff` | Card / surface |
| `color.border` | `#e6e2d8` | Hairline borders, dividers |
| `color.accent` | `#f28123` | Orange — primary actions, active nav, highlights |
| `color.text` | `#1f1d1a` | Primary text |
| `color.muted` | `#5f5a52` | Secondary text |
| `color.faint` | `#908a80` | Meta / caption text |
| `color.onAccent` | `#ffffff` | Text/icons on orange |
| `color.macro.protein` | `#c0562b` | Nutrition — protein (distinct from accent) |
| `color.macro.fat` | `#d8a13a` | Nutrition — fat |
| `color.macro.carbs` | `#6b8f5e` | Nutrition — carbs |
| `color.track` | `#eee7d8` | Progress/bar track background |

Overlay gradient (over hero photos, for white-text legibility):
`linear-gradient(90deg, rgba(15,15,18,.78), rgba(15,15,18,.35))`.

Token naming is **semantic** (role-based, not raw hex names) so the system stays
extensible. Do not introduce colors outside this table except pure white/black for
edge cases already implied above.

### 2.2 Typography

- **Weights:** eyebrow labels **700**, titles **800–900**, body **400–600**.
- **Headings:** tight letter-spacing (`-1px` on large titles); heavy and confident.
- **Eyebrow labels:** UPPERCASE, letter-spacing `+2px`, 13px, color `accent`.
- **Fluid title sizing:** large titles use `clamp(24px, 4vw, 40px)`.

Type scale (define as styles; sizes are mobile → desktop):

| Style | Mobile | Desktop | Weight | Notes |
|---|---|---|---|---|
| Display / H1 | 28px | 40px | 900 | `clamp(24px,4vw,40px)`, ls `-1px`, lh 1.05 |
| H2 | 22px | 30px | 800 | ls `-0.5px` |
| H3 | 18px | 20px | 800 | card / section titles |
| H4 | 16px | 17px | 700 | |
| Body | 15px | 16px | 400–500 | lh 1.6 |
| Small | 13px | 14px | 500 | |
| Meta / caption | 11px | 12px | 600 | color `faint`, often uppercase ls `+1px` |
| Eyebrow label | 13px | 13px | 700 | UPPERCASE, ls `+2px`, color `accent` |

Use a clean, modern sans-serif with strong heavy weights (e.g. system UI /
Inter-like). Do not use decorative or serif display fonts.

### 2.3 Spacing (8px base scale)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 80`

- Card padding: **16–18px**.
- Section vertical padding: **80px** desktop, **48px** tablet, **32–40px** mobile.
- Grid gutters: **12px** mobile, **16–20px** tablet+.

### 2.4 Radius

| Token | Value | Applies to |
|---|---|---|
| `radius.sm` | `4px` | Buttons |
| `radius.md` | `8px` | Chips, small tiles, inputs |
| `radius.lg` | `10px` | Cards, fact tiles, nutrition panel |
| `radius.xl` | `12px` | Large cards, list rows |
| `radius.pill` | `999px` | Pills, badges, avatars |

### 2.5 Elevation / shadow

| Token | Value | Use |
|---|---|---|
| `shadow.card` | `0 6px 22px rgba(31,29,26,.08)` | Card at rest |
| `shadow.hover` | `0 12px 30px rgba(31,29,26,.14)` | Card hover-lift |
| `shadow.badge` | `0 2px 8px rgba(31,29,26,.18)` | Floating icon buttons |

### 2.6 Motion

- Hover lift: `transform: translateY(-3 to -4px)` + shadow swap, `transition .18s ease`.
- Keep motion subtle and functional. No large or bouncy animations.
- Respect `prefers-reduced-motion`.

---

## 3. Breakpoints & responsive model

Bootstrap-compatible breakpoints (so the design maps cleanly back to the codebase):

| Name | Range | Primary layout intent |
|---|---|---|
| **Mobile** | `< 768px` | Single column. **Bottom tab bar** navigation. |
| **Tablet** | `768–1023px` | **Own optimized layouts:** 2-col grids, side-by-side panels, sidebar rail in landscape. |
| **Desktop** | `≥ 1024px` | Current layout, refined for spacing & consistency. |

Bootstrap reference breakpoints available for finer control: `sm 576 / md 768 /
lg 992 / xl 1200`. Treat **768** and **1024** as the primary design boundaries.

**Rules that apply everywhere:**
- Touch targets ≥ **44×44px** on mobile/tablet.
- Respect safe-area insets (notches, home indicator) — especially the bottom tab bar.
- Content max-width on desktop ≈ 1140–1200px, centered.
- Never require horizontal page scroll; wide content (charts, tables) scrolls inside
  its own container.

---

## 4. Navigation system

A **hybrid** model, chosen deliberately per context.

### 4.1 Mobile — Bottom Tab Bar (primary)

- Persistent, fixed to bottom, ~**56px** tall + safe-area inset, background `card`,
  top hairline `border`, subtle top shadow.
- **Logged-in items (5):** **Recipes · Planner · Shopping · Dashboard · Profile.**
- **Anonymous items (4):** **Home · Recipes · News · Login.**
- Each item: icon (Bootstrap Icons) + short label beneath.
  - Active: icon + label in `accent`.
  - Inactive: `muted`.
- **Home** (logged-in) is reached via the header logo, not the tab bar.
- **Secondary links** (News, About, Create Recipe, Logout, and any admin pages) live
  behind a **"More"** affordance and on the **Profile** screen — not in the tab bar.

### 4.2 Tablet

- **Landscape:** left **icon + label sidebar rail** (collapsible), reclaiming
  horizontal space. Active item marked with `accent`.
- **Portrait:** condensed **top nav** bar.
- Bottom tab bar is **not** used on tablet.

### 4.3 Desktop

- Current **top navigation bar**, refined: consistent spacing, clear active state
  (`accent`), logo left, primary links center/right, user menu on the right.

### 4.4 Overlay menu (secondary, all sizes)

- Retain the existing full-screen overlay for secondary/marketing links, triggered
  from **"More"** (mobile) or the top nav (desktop). Cream background `rgba(249,246,238,.98)`,
  large centered links (28px, weight 800), secondary links smaller/muted, close "✕"
  in `accent` top-right.

---

## 5. Component catalog

> Each component is defined **once** here and reused across all screens (§6).
> For every component honor: token usage (§2), states, responsive behavior, and
> ≥44px touch targets on mobile/tablet.

### 5.1 Foundational

- **Button** — Primary: `accent` fill, `onAccent` text, weight 800, padding
  `12×22px`, `radius.sm`. Outline variant: transparent fill, `accent` 1px border +
  text. Full-width variant on mobile forms. Disabled: reduced opacity.
- **Card** — `card` surface, 1px `border`, `radius.lg`, `shadow.card`, clipped
  overflow. **Link-card** variant adds hover lift (`translateY(-4px)` + `shadow.hover`).
- **Eyebrow label** — UPPERCASE tracked text in `accent` (see type scale).
- **Section band** — full-width band, `bg` or `panel` (alternating), top `border`,
  vertical padding per breakpoint (§2.3).
- **Chip / Badge** — small pill, `radius.pill` or `md`; used for tags, counts, ranks.
- **Icon button** — 36px circle, white/`accent`, `shadow.badge`; e.g. favorite heart
  (filled `accent` when active).

### 5.2 Navigation

- **Bottom Tab Bar** (mobile) — §4.1.
- **Sidebar Rail** (tablet landscape) — §4.2; collapsible, icon+label, active `accent`.
- **Top Nav** (desktop) — §4.3.
- **Overlay Menu** — §4.4.
- **Search affordance** — icon that expands to an input; on mobile a full-width
  search field at top of Recipe Catalog.

### 5.3 Domain-specific

- **Recipe Card** — image (16:9 or 4:3), optional **rank badge** (top-left, `accent`
  pill, e.g. "#1"), **favorite heart** (top-right icon button), title (2-line clamp),
  **meta row** (divider on top; e.g. time · rating · calories) at the bottom.
- **Quick-Facts tiles** — row of tiles (`flex: 1 1 140px`), each with an `accent`
  icon, a large bold value, and an UPPERCASE faint label (e.g. Time, Servings,
  Difficulty, Calories). Wraps on mobile.
- **Nutrition Facts panel** — FDA-style: 2px `text` border, heavy title, thick rules,
  calories row with a large number, per-nutrient rows with color swatches (macro
  colors), "per serving" note in `faint`.
- **Calorie ring + macro bars** — circular calorie ring (SVG, ~168px) with kcal value
  centered; beside it, stacked macro bars (protein/fat/carbs) each with a labeled
  track (`track` bg) and colored fill (macro colors) + grams.
- **Macro chip strip** — compact 3-chip row (protein/fat/carbs), each chip: value,
  UPPERCASE label, thin colored bar. Used where the full ring won't fit (mobile).
- **Calorie badge** — inline `accent` pill with big kcal number + unit; for sticky
  rails / headers.
- **KPI tile** (Dashboard) — label + large metric value + optional delta/trend
  indicator; `card` surface.
- **Chart container** — titled `card` wrapping a chart. Chart types used: **donut**
  (category split), **line** (nutrition trend / insight), **stacked bar** (weekly),
  **horizontal bar** (top recipes). On mobile, charts are full-width and may scroll
  horizontally inside the container; never overflow the page.
- **List row** — horizontal row (thumbnail left, content right) in a `radius.xl` card
  with hover lift; **stacks to vertical on mobile** (image on top). Base pattern for
  news rows and **shopping-list items** (with a checkbox + quantity).
- **Checklist item** (Shopping) — list row variant with a large (≥44px) checkbox,
  item name, quantity/unit, and checked state (strike-through + muted).
- **Star rating** — `accent` stars, 18px, `+2px` letter-spacing; read-only and
  interactive variants.
- **Step number** — 26px `accent` circle with white number; precedes each
  instruction step.
- **Form controls** — text input, textarea, select, **date picker** (meal planner),
  with clear labels, ≥44px height on touch, `radius.md`, `border`, focus ring in
  `accent`. Validation/error state with a red-tinted message.
- **Empty state** — centered icon/illustration + message + primary action; used when
  no recipes/plans/list items/dashboard data exist.
- **Loader** — brand-consistent spinner/skeleton for async loads.
- **Toast** — transient notification (success/error), top of viewport.
- **Modal / Sheet** — dialog (e.g. "Schedule Meal"). On mobile, present as a
  **bottom sheet**; on tablet/desktop as a centered modal.
- **Day switcher** (Meal Planner mobile) — horizontal scrollable row of day chips
  (Mon–Sun), active day in `accent`.
- **Progress bar** (Shopping) — sticky "X of Y items" progress using `track` + `accent`.

---

## 6. Screen specifications

> Template per screen: **Purpose · Nav context · Layout (Mobile / Tablet / Desktop) ·
> Components · Interactions · States.**

### 6.1 Home

- **Purpose:** Marketing + entry point; showcase trending & local recipes, about, news.
- **Nav context:** Anonymous tab bar (or top nav). Logo prominent.
- **Mobile:** Stacked single column — hero (photo + overlay + heading + CTA), trending
  recipes as a **horizontal-scroll carousel** of Recipe Cards, local spotlight
  section, about block, news teaser (List rows). Section padding 32–40px.
- **Tablet:** Hero full-width; trending as a **2-column** Recipe Card grid; about as a
  side-by-side (image + text); news teaser 2-col.
- **Desktop:** Current layout refined — 3–4 col recipe grids, generous 80px sections.
- **Components:** Hero (Section band + overlay + Button), Recipe Card, List row,
  Eyebrow label.
- **Interactions:** CTA → catalog/register; card tap → single recipe.
- **States:** Loading skeletons for recipe rows.

### 6.2 Recipe Catalog

- **Purpose:** Browse/search/filter all recipes.
- **Nav context:** **Recipes** tab active.
- **Mobile:** Full-width **search field** at top; filter controls in a **bottom-sheet**
  triggered by a "Filters" button; **1-column** Recipe Card list. Sticky search on scroll.
- **Tablet:** **Left filter rail** + **2-column** Recipe Card grid.
- **Desktop:** Left filter rail + **3-column** grid.
- **Components:** Search affordance, Chip (active filters), Recipe Card, Empty state,
  Loader, Modal/Sheet (filters on mobile).
- **Interactions:** Filter/search updates grid; favorite heart toggles; card → detail.
- **States:** Empty ("no recipes match"), loading skeleton grid.

### 6.3 Single Recipe

- **Purpose:** Full recipe detail with nutrition and "add to plan".
- **Nav context:** Back affordance in header; **Recipes** tab active.
- **Mobile:** Stacked — hero image, title + star rating, **Quick-Facts tiles** (wrap),
  ingredients (clean list with `accent` checks), steps (Step number list), nutrition
  as **Macro chip strip** + collapsible Nutrition Facts panel. **Sticky bottom action
  bar**: "Add to Meal Plan" (primary Button) + favorite.
- **Tablet:** **2-column** — main content left (facts, ingredients, steps), **sticky
  nutrition rail** right (Calorie ring + macro bars or Nutrition Facts panel).
- **Desktop:** Current 2-col detail, refined; sticky rail at `top: 90px`.
- **Components:** Quick-Facts tiles, Star rating, Nutrition Facts panel / Calorie ring
  + macro bars / Macro chip strip / Calorie badge, Step number, Button, Icon button.
- **Interactions:** Rate; favorite; "Add to Meal Plan" opens Schedule Meal sheet/modal.
- **States:** Loading skeleton; nutrition "estimated" note in `faint`.

### 6.4 Meal Planner

- **Purpose:** Plan meals across a week.
- **Nav context:** **Planner** tab active.
- **Mobile (hard case — deliberate solution):** **Day-focused view** — a horizontal
  **Day switcher** (Mon–Sun chips) at top; below it, the selected day's meals as a
  vertical list of slots (Breakfast/Lunch/Dinner/Snack) with add buttons. A 7-day grid
  does **not** fit a phone, so we show one day at a time.
- **Tablet:** **Landscape** → full **7-column week grid** (days as columns, meal slots
  as rows). **Portrait** → 2-column (e.g. 3–4 days visible, scroll) or the day-focused
  view widened.
- **Desktop:** Full **week grid** + Schedule Meal modal.
- **Components:** Day switcher (mobile), grid cells (recipe chips), Button (add meal),
  Modal/Sheet (Schedule Meal), Empty state (no meals planned).
- **Interactions:** Add meal → opens recipe picker / Schedule sheet; drag or tap to
  move (desktop drag optional, tap-to-move on touch); remove meal.
- **States:** Empty day, loading week.

### 6.5 Shopping List

- **Purpose:** Checklist of ingredients grouped by category, generated from the plan.
- **Nav context:** **Shopping** tab active.
- **Mobile:** **Sticky progress bar** ("X of Y") at top; category headers; full-width
  **Checklist items** (large checkbox, name, quantity). Checked items strike through
  and mute; option to hide checked. Bottom action: "Add item" / "Clear checked".
- **Tablet:** **2-column** by category (columns of category groups).
- **Desktop:** **Multi-column** masonry of category groups.
- **Components:** Progress bar, Checklist item, Chip (category count), Button, Empty
  state ("your list is empty — plan meals to generate it").
- **Interactions:** Check/uncheck; add/remove item; regenerate from plan.
- **States:** Empty, loading.

### 6.6 Dashboard

- **Purpose:** Habit/behavior metrics — KPIs and charts.
- **Nav context:** **Dashboard** tab active.
- **Mobile:** Single column — **KPI tiles 2-up** (2 per row), then chart containers
  **full-width**, stacked. Wide charts scroll horizontally inside their container.
- **Tablet:** **2-column** grid of KPI tiles and charts.
- **Desktop:** Current **cockpit** layout — KPI row across the top, charts in a
  multi-column grid, refined spacing.
- **Components:** KPI tile, Chart container (donut, line, stacked bar, horizontal bar),
  Empty state (no data yet), Loader.
- **Interactions:** Time-range / filter controls; tap chart legend to toggle series.
- **States:** Empty (no activity yet), loading skeletons per tile/chart.

### 6.7 User Profile

- **Purpose:** Account info, settings, and the home for secondary links + logout.
- **Nav context:** **Profile** tab active. Hosts the **"More"** links on mobile.
- **Mobile:** Stacked — avatar + name/email header, editable info section, settings,
  then a **secondary links list** (News, About, Create Recipe [if admin], and
  **Logout**). Logout is clearly separated (outline/destructive styling).
- **Tablet / Desktop:** **2-column** — profile/avatar left, settings & links right.
- **Components:** Avatar, Form controls, Button (save / logout), List row (links),
  Chip (role, e.g. Admin).
- **Interactions:** Edit & save profile; navigate secondary links; logout.
- **States:** Saving, success toast, validation errors.

### 6.8 Auth (Login / Register / Forgot / Reset)

- **Purpose:** Authentication flows.
- **Nav context:** Minimal — logo only; no tab bar.
- **Mobile:** **Full-width centered card**, large ≥44px inputs, full-width primary
  Button, secondary links (forgot / switch to register) below. Branded cream
  background.
- **Tablet / Desktop:** **Centered narrow card** (~400–440px) on a branded background
  (optional hero photo with overlay to one side on desktop).
- **Components:** Card, Form controls, Button (full-width), Eyebrow label, Toast,
  Loader.
- **Interactions:** Submit; inline validation; error toast on failure; success routes
  into the app.
- **States:** Loading (submitting), field errors, auth error.

---

## 6.9 Data & content reference (use realistic content, not lorem ipsum)

> Field names and shapes are taken from the live app's data models. Use realistic
> sample content so the generated screens and Figma review are meaningful. Do **not**
> use lorem ipsum for domain content.

### Recipe (Recipe Card, Single Recipe)
Fields: `name`, `description`, `cookingTime` (e.g. "35 min"), `serviceSize`
(e.g. "4 servings"), `imageUrl`, `isFavorited`, and AI-estimated **per-serving**
nutrition: `calories`, `proteinG`, `fatG`, `carbsG` (any may be `null` = "not yet
analyzed" — show the estimated/absent state), plus `ingredients[]` and
`instructions[]`.

- **Ingredient:** `name`, `unit` (e.g. "2 cloves", "200 g"), optional `description`.
- **Instruction:** ordered steps (paired with the Step-number component).
- Sample recipes: *"Nasi Goreng Special"*, *"Grilled Salmon with Herbs"*,
  *"Beef Rendang"*, *"Avocado Toast"*, *"Chicken Caesar Salad"*.
- Sample quick-facts: **Time** 35 min · **Servings** 4 · **Calories** 520 kcal.
- Sample macros (per serving): **Protein** 28 g · **Fat** 18 g · **Carbs** 46 g.

### Meal Plan (Planner, Schedule Meal)
- Meal types (slots): **Breakfast · Lunch · Dinner · Snack**.
- A plan entry has `planName`, `mealType`, `startDate`, `endDate`, a `recipe`, and
  the day(s) it applies to. Planner cells reference recipes by name/thumbnail.
- Week model: 7 days (Mon–Sun), each with the four meal slots above.

### Shopping List (generated from the plan for a date range)
- Items are grouped and de-duplicated by ingredient `name`, each with its `unit(s)`
  (e.g. "Eggs — 6", "Olive oil — 4 tbsp", "Chicken breast — 800 g").
- Suggested category groups for headers: **Produce, Meat & Seafood, Dairy & Eggs,
  Pantry, Spices, Other.**
- Progress example: "7 of 18 items".

### Dashboard (KPIs + charts)
- **KPI tiles:** Total Meals Planned (`totalMealsPlanned`), Unique Recipes
  (`uniqueRecipes`), Variety Score (`varietyScore`, band **Low / Balanced / High**),
  Avg Rating (`avgRating` + `ratingCount`), Avg Calories (`avgCalories`), Avg macros
  (`avgProteinG` / `avgFatG` / `avgCarbsG`).
- **Weekly stacked bar** (`weekly[]`): per week `weekLabel`, and counts for
  `breakfast / lunch / dinner / snack / other`, plus `totalMeals`, `avgCalories`.
- **Category donut** (`categoryMix[]`): `{ name, count }` — e.g. Indonesian 12,
  Salads 6, Grilled 5, Dessert 3.
- **Top recipes horizontal bar** (`topRecipes[]`): `{ name, count }`.
- **Insight line** (`insightLine`): a short sentence, e.g. *"You planned 22% more
  dinners this week than last."*
- **Empty state** driven by `hasData: false` — show the "no activity yet" empty state.
- Admin variant adds: Weekly Active Users, Recipes Created, New Users.

### User / Profile
- Fields: `name`, `email`, `role` (**admin** / **user** — show an "Admin" chip for
  admins, which reveals Create Recipe).
- Sample: *"Henoch Hernanda — henoch@example.com — User"*.

### Auth
- Login: email + password. Register: name + email + password (+ confirm). Forgot:
  email. Reset: new password + confirm. Realistic labels, not lorem.

---

## 7. Accessibility & touch

- **Touch targets:** ≥ 44×44px for all interactive elements on mobile/tablet.
- **Contrast:** Meet WCAG AA. Note: `accent` orange on white is acceptable for large
  text/icons and UI elements, but **not** for small body text — use `text`/`muted` for
  body copy. White text on `accent` is fine for buttons.
- **Focus:** Visible focus ring (`accent`) on all interactive elements.
- **Safe areas:** Bottom tab bar and sticky bottom action bars respect
  `env(safe-area-inset-bottom)`.
- **Motion:** Respect `prefers-reduced-motion` (disable hover lifts / transitions).
- **Semantics:** Proper headings, labelled form fields, `aria-current` on active nav,
  accessible names on icon-only buttons.
- **Text scaling:** Layouts tolerate up to 200% text zoom without breakage.

---

## 8. Slice-back appendix (implementation mapping)

> Not needed to generate the Figma. Included so the returned design maps cleanly back
> to the existing React + Bootstrap codebase.

- **Tokens → CSS variables** already present as `--bm-*` (e.g. `--bm-bg`, `--bm-accent`,
  `--bm-text`, `--bm-border`, `--macro-protein/fat/carbs`). Keep names aligned.
- **Existing component classes to reuse/extend:**
  - Button → `.bm-btn`, `.bm-btn--outline`
  - Card → `.bm-card`, link-hover → `.bm-card--link`
  - Eyebrow label → `.bm-label`; Section → `.bm-section`, `.bm-section--panel`
  - Recipe Card bits → `.bm-rank`, `.bm-heart`, `.bm-meta-row`, `.bm-clamp-2`
  - Quick-Facts → `.bm-facts`, `.bm-fact`
  - Nutrition Facts panel → `.bm-nf*`
  - Calorie ring + macro bars → `.bm-ring`, `.bm-macro-bars`, `.bm-mbar*`
  - Macro chip strip → `.bm-macro-strip`, `.bm-macro-chip`; badge → `.bm-kcal-badge`
  - Sticky rail → `.bm-rail`; star → `.bm-stars`; step → `.bm-step-num`
  - List row → `.bm-news-row` pattern (generalize for shopping items)
  - Overlay menu → `.bm-overlay-menu`, `.bm-hamburger`, `.bm-overlay-close`
- **New components to add:** Bottom Tab Bar, Sidebar Rail (tablet), Day switcher,
  Checklist item, Progress bar, bottom-sheet Modal variant. Namespace them `.bm-*` to
  avoid Bootstrap global collisions (Bootstrap overrides `.card`/`.col-*`).
- **Breakpoints** map to Bootstrap: mobile `< md (768)`, tablet `md–lg (768–991)`,
  desktop `≥ lg (992/1024)`.
- **Dashboard** charts already exist as React components
  (`CategoryDonut`, `InsightLine`, `NutritionTrendLine`, `StackedWeeklyChart`,
  `TopRecipesBar`, `KpiTile`); the returned design should match their data shapes.

---

## 9. Deliverable checklist (for the generating tool)

- [ ] Design tokens defined as reusable styles/variables (§2), light theme only.
- [ ] Component library covering every item in §5, each with states + responsive behavior.
- [ ] All 8 screens (§6) at **mobile / tablet / desktop**, using realistic domain
      content from §6.9 (no lorem ipsum).
- [ ] Bottom tab bar (mobile) + sidebar rail (tablet) + top nav (desktop) + overlay.
- [ ] Navigable Figma prototype linking the core flows
      (Recipes → Single Recipe → Add to Plan → Planner → Shopping List; plus Dashboard,
      Profile, Auth).
- [ ] Accessibility notes honored (§7).
