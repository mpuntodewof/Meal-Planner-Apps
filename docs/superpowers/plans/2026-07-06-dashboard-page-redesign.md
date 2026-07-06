# Dashboard Page Redesign (match Metric Cockpit concept) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `/dashboard` page so it is a faithful, verified match of the approved concept `dashboard-concept-2-cockpit.html`, and fix the blank-page-on-direct-load bug caused by auth state not being ready at first render.

**Architecture:** The page keeps its existing data layer (dashboardApi, DashboardSummary/AdminDashboard model, the four SVG chart components). This plan rebuilds only the *page shell* (`Dashboard.tsx` markup + `dashboard.css`) to mirror the concept's structure — masthead, controls row, KPI grid with sparklines+deltas, and the 2-row chart grid — and adds an auth-ready guard so a direct load/refresh shows a loading state instead of a blank screen. Every visual task is verified against the concept using a Playwright screenshot harness (already built in the session scratchpad), not by eyeballing source.

**Tech Stack:** React + TypeScript, Redux Toolkit Query, plain CSS (`dashboard.css`), inline SVG charts. Verification via Playwright (installed in scratchpad) + Docker rebuild of the `frontend` service.

---

## Root causes this plan fixes (diagnosed live in-session)

1. **Blank dashboard on direct load / refresh.** `userAuthStore` is NOT persisted (only `favRecipe` is in `persist:root`). On a full page load, `App.tsx`'s `useEffect` decodes the localStorage `token` and dispatches `setLoggedInUser` — but that runs *after* first render. `Dashboard` mounts with `userId=""`, so both RTK queries are `skip`-ped and `data` is `undefined`; because `data?.hasData` is undefined, neither the empty state nor the grid renders → blank page. Fix: gate the page on an "auth resolving" state and keep the query enabled once `userId` arrives (it already re-fires when skip flips; the bug is the blank render while resolving).
2. **Visual drift from the concept.** The page must match the concept's masthead + controls + KPI-with-sparkline + card structure precisely. Verified by screenshot diff, not assertion.

## Reference (the build target)

`.superpowers/brainstorm/1408-1782705525/content/dashboard-concept-2-cockpit.html` — structural order:
`masthead (kicker → h1 → lead <p> → data-note)` → `controls (roletoggle + theme)` → `stage` → `metric-grid`:
- 4× `.kpi` (label, val, delta[up|flat], `.spark` with ~8 bars)
- `.card.col-8` (h3, sub, `.scroll-x`>chart, legend) + `.card.col-4` (h3, sub, donut chart)
- `.card.col-6` (top recipes) + `.card.col-6` (nutrition line)

## Verification harness (use for EVERY visual task)

A working harness exists at:
`C:/Users/USER/AppData/Local/Temp/claude/c--Users-USER-Documents-antigravity-MealPlannerApps/2209edb5-92ee-4a1f-8b68-bd80808b1f96/scratchpad/`
- `harness.html` — renders the exact card markup with inlined real admin data + real `dashboard.css`.
- `shot3.js` — screenshots `harness.html` at 1440px → `harness.png`, and dumps card geometry.
- `concept.png` — the reference screenshot of the concept.

After each visual change: `cp` the updated `dashboard.css` into the scratchpad, update `harness.html` markup to match the new `Dashboard.tsx` structure, run `node shot3.js`, then **Read `harness.png` and compare to `concept.png`**. Only proceed when they match.

---

## File Structure

**Modify:**
- `Frontend/src/pages/dashboard/Dashboard.tsx` — page shell rebuilt to concept structure + auth-ready guard.
- `Frontend/src/pages/dashboard/dashboard.css` — masthead/controls/kpi/card styles matching the concept.

**No changes needed to:** `dashboardApi.ts`, `dashboardModel.ts`, the four chart components, `DashboardController.cs`, or `DashboardLogic.cs` — the data layer is correct (verified: live `/api/dashboard/admin` returns correct populated JSON).

---

## Task 1: Fix the auth-ready blank-page bug

**Files:**
- Modify: `Frontend/src/pages/dashboard/Dashboard.tsx`

- [ ] **Step 1: Add an auth-resolving guard**

The page must distinguish "auth still hydrating from token" from "logged out". Read the token directly so a direct load/refresh doesn't render blank while `App.tsx`'s effect catches up.

In `Dashboard.tsx`, after the existing `userData`/`userId`/`role` lines, add:

```tsx
  // On a hard load, App.tsx rehydrates userAuthStore from the localStorage token
  // AFTER first render. Until userId is populated, treat the page as "resolving"
  // (show a loader) rather than rendering blank. If there's no token at all, the
  // user is genuinely logged out.
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");
  const authResolving = !userId && hasToken;
  const loggedOut = !userId && !hasToken;
```

- [ ] **Step 2: Use the guard in the render branches**

Replace the top of the render's conditional section (the `{loading && ...}` line) so the states are explicit and mutually exclusive. Find:

```tsx
      {loading && <div className="ds-loading">Loading…</div>}
```

Replace with:

```tsx
      {loggedOut && (
        <div className="ds-loading">
          Please <button className="ds-linkbtn" onClick={() => navigate("/login")}>log in</button> to view your dashboard.
        </div>
      )}
      {(authResolving || (userId && loading)) && <div className="ds-loading">Loading your dashboard…</div>}
```

- [ ] **Step 3: Guard the data branches so they only run once auth is resolved**

Ensure the empty-state and grid branches require a resolved user. Find the two branches beginning `{!loading && data && !data.hasData && (` and `{!loading && data && data.hasData && (` and change their leading condition from `!loading` to `userId && !loading`:

```tsx
      {userId && !loading && data && !data.hasData && (
```
```tsx
      {userId && !loading && data && data.hasData && (
```

- [ ] **Step 4: Add the loader/link styles**

In `Frontend/src/pages/dashboard/dashboard.css`, ensure these exist (add if missing):

```css
.ds-loading { color:var(--muted); padding:48px 0; text-align:center; font-size:14px; }
.ds-linkbtn { background:none; border:0; color:var(--accent); font:inherit; font-weight:600; cursor:pointer; padding:0; text-decoration:underline; }
```

- [ ] **Step 5: Typecheck**

Run: `cd Frontend && npx tsc --noEmit`
Expected: exit 0, no errors.

- [ ] **Step 6: Verify the fix live (this is the key acceptance test)**

Rebuild + restart the frontend, then screenshot a DIRECT dashboard load (simulating refresh) using Playwright from the scratchpad. Create `scratchpad/authcheck.js`:

```js
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 1400 } });
  await p.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await p.waitForSelector('input[name="email"]', { timeout: 15000 });
  await p.fill('input[name="email"]', "admin@foodfest.com");
  await p.fill('input[name="password"]', "Admin@123");
  await p.click('button[type="submit"]');
  await p.waitForTimeout(3000);
  // Hard-navigate to /dashboard (full reload → reproduces the blank-page path)
  await p.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
  await p.waitForTimeout(4000); // allow auth rehydrate + query
  const info = await p.evaluate(() => ({
    hasRoot: !!document.querySelector(".dashboard-root"),
    hasGrid: !!document.querySelector(".metric-grid"),
    text: (document.body.innerText||"").slice(0,120)
  }));
  console.log(JSON.stringify(info));
  await p.screenshot({ path: "authcheck.png", fullPage: true });
  await b.close();
})();
```

Run: `cd <scratchpad> && node authcheck.js`
Expected: `hasRoot:true` and EITHER `hasGrid:true` (data rendered) OR body text contains "Loading" then resolves — NEVER an empty body. Read `authcheck.png` to confirm the page is not blank.

- [ ] **Step 7: Commit**

```bash
git add Frontend/src/pages/dashboard/Dashboard.tsx Frontend/src/pages/dashboard/dashboard.css
git commit -m "fix(dashboard): guard against blank render while auth rehydrates on direct load"
```

---

## Task 2: Masthead + controls to match the concept

**Files:**
- Modify: `Frontend/src/pages/dashboard/Dashboard.tsx` (header region)
- Modify: `Frontend/src/pages/dashboard/dashboard.css`

- [ ] **Step 1: Rebuild the header markup**

Replace the current `<header className="ds-masthead">…</header>` + `<div className="ds-controls">…</div>` region with this exact structure (matches concept: kicker → serif h1 → lead → data-note, then a controls row with Home/Back and the admin toggle):

```tsx
      <header className="ds-masthead">
        <div className="ds-kicker">Meal Planner · Behavior Dashboard</div>
        <h1 className="ds-title">{view === "user" ? "Your planning behavior" : "Platform behavior"}</h1>
        <p className="ds-lead">
          {view === "user"
            ? "How you plan, and what your plans reveal about your tastes and habits — at a glance."
            : "Aggregate meal-planning activity across all users this window."}
        </p>
        <div className="ds-note">
          Every tile and chart maps to real data: <b>MealPlanDays.Date × MealType</b>, recipe
          frequency, category joins, ratings, and planned per-serving nutrition
          (null-nutrition recipes excluded).
        </div>
      </header>

      <div className="ds-controls">
        <button className="ds-btn" onClick={() => navigate("/")} type="button">
          <i className="fas fa-home" aria-hidden="true"></i> Home
        </button>
        <button className="ds-btn" onClick={goBack} type="button" aria-label="Go back">
          <i className="fas fa-arrow-left" aria-hidden="true"></i> Back
        </button>
        {isAdmin && (
          <div className="roletoggle" role="group" aria-label="View">
            <button aria-pressed={view === "user"} onClick={() => setView("user")}>My dashboard</button>
            <button aria-pressed={view === "admin"} onClick={() => setView("admin")}>Platform</button>
          </div>
        )}
      </div>
```

- [ ] **Step 2: Match the masthead/controls CSS to the concept**

In `dashboard.css`, ensure these rules exist exactly (replace any prior masthead/controls rules):

```css
.dashboard-root { max-width:1180px; margin:0 auto; padding:40px 28px 80px; font-family:var(--sans, "Segoe UI", system-ui, sans-serif); }
.ds-masthead { margin-bottom:24px; }
.ds-kicker { font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); font-weight:700; }
.ds-title { font-family:var(--display, Georgia, serif); font-weight:400; font-size:clamp(28px,4vw,44px); letter-spacing:-.01em; margin:10px 0 8px; }
.ds-lead { color:var(--ink-2); max-width:640px; line-height:1.55; margin:0; font-size:15px; }
.ds-note { font-size:13px; color:var(--muted); margin-top:14px; padding:12px 16px; border-left:3px solid var(--s3); background:color-mix(in srgb, var(--s3) 8%, transparent); border-radius:0 8px 8px 0; line-height:1.5; }
.ds-note b { color:var(--ink); }
.ds-controls { display:flex; align-items:center; gap:10px; margin-bottom:24px; flex-wrap:wrap; }
.ds-btn { display:inline-flex; align-items:center; gap:7px; background:var(--surface); border:1px solid var(--border); color:var(--ink-2); font-family:inherit; font-size:12.5px; font-weight:600; padding:8px 16px; border-radius:999px; cursor:pointer; transition:background .15s ease, color .15s ease; }
.ds-btn:hover { color:var(--ink); }
.roletoggle { display:inline-flex; gap:4px; background:var(--surface); border:1px solid var(--border); border-radius:999px; padding:4px; margin-left:auto; }
.roletoggle button { font-family:inherit; font-size:12.5px; font-weight:600; border:0; background:transparent; color:var(--muted); padding:8px 16px; border-radius:999px; cursor:pointer; }
.roletoggle button[aria-pressed="true"] { background:var(--accent); color:#fff; }
```

- [ ] **Step 3: Typecheck**

Run: `cd Frontend && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 4: Visual verify against concept**

`cp Frontend/src/pages/dashboard/dashboard.css <scratchpad>/dashboard.css`, ensure `harness.html`'s masthead/controls markup matches Step 1, run `node shot3.js`, Read `harness.png`, compare the masthead+controls region to `concept.png`. Confirm: kicker color/spacing, serif title size, lead width, amber note bar, control pills, toggle on the right. Adjust CSS only if they differ.

- [ ] **Step 5: Commit**

```bash
git add Frontend/src/pages/dashboard/Dashboard.tsx Frontend/src/pages/dashboard/dashboard.css
git commit -m "feat(dashboard): masthead + controls matching cockpit concept"
```

---

## Task 3: KPI tiles with sparklines + deltas

**Files:**
- Modify: `Frontend/src/pages/dashboard/Dashboard.tsx` (KPI region + spark helper)
- Modify: `Frontend/src/pages/dashboard/dashboard.css` (.kpi/.spark)

- [ ] **Step 1: Ensure the spark helper produces a non-empty row**

In `Dashboard.tsx`, confirm this helper exists (add if missing) — it falls back to a faint flat row so a tile never shows one lone bar:

```tsx
const sparkFrom = (vals: number[]): number[] => {
  const max = Math.max(1, ...vals);
  const s = vals.map((v) => v / max);
  return s.some((h) => h > 0) ? s : vals.map(() => 0.12);
};
```

- [ ] **Step 2: Build the four KPI tiles**

Replace the four `<KpiTile .../>` usages with these (each has a spark + delta, matching the concept's 4 tiles):

```tsx
            <KpiTile
              label={view === "user" ? "Meals planned" : "Weekly active users"}
              value={view === "user" ? data.totalMealsPlanned : (data as AdminDashboard).weeklyActiveUsers}
              delta="last 6 weeks"
              spark={sparkFrom(weekly.map((w) => w.totalMeals))}
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
              spark={sparkFrom(weekly.map((w) => w.avgCalories ?? 0))}
            />
```

- [ ] **Step 3: Match KPI/spark CSS to the concept**

In `dashboard.css` confirm:

```css
.kpi { grid-column: span 3; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; }
.kpi .label { font-size: 12px; color: var(--muted); font-weight: 600; letter-spacing: .02em; text-transform: uppercase; }
.kpi .val { font-size: 34px; font-weight: 700; letter-spacing: -.02em; margin: 8px 0 2px; font-variant-numeric: tabular-nums; }
.kpi .delta { font-size: 12.5px; font-weight: 600; }
.kpi .delta.up { color: var(--good); }
.kpi .delta.flat { color: var(--muted); }
.spark { display:flex; gap:2px; height:26px; align-items:flex-end; margin-top:10px; }
.spark i { flex:1; background: color-mix(in srgb, var(--s1) 55%, transparent); border-radius:2px 2px 0 0; }
```

- [ ] **Step 4: Typecheck**

Run: `cd Frontend && npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Visual verify**

Update harness KPI markup to include all four sparklines (see the session harness for the `sparkHtml` helper), `cp` css, `node shot3.js`, Read `harness.png`, compare the KPI row to `concept.png`: four tiles, each with label/value/delta/sparkline, equal height.

- [ ] **Step 6: Commit**

```bash
git add Frontend/src/pages/dashboard/Dashboard.tsx Frontend/src/pages/dashboard/dashboard.css
git commit -m "feat(dashboard): KPI tiles with sparklines and deltas per concept"
```

---

## Task 4: Chart card grid + equal-height alignment + breakpoint

**Files:**
- Modify: `Frontend/src/pages/dashboard/Dashboard.tsx` (grid region)
- Modify: `Frontend/src/pages/dashboard/dashboard.css` (.metric-grid, .card, breakpoints)

- [ ] **Step 1: Confirm the grid markup matches the concept's card order + copy**

The `.metric-grid` must contain, in order: `.card.col-8` (Meals per week, sub "Stacked from MealPlanDays.Date × MealType", `.scroll-x`>`StackedWeeklyChart`, legend) → `.card.col-4` (Category mix, "What you gravitate toward", `CategoryDonut`) → `.card.col-6` (Your most-planned recipes, "Repetition is the variety story, told plainly", `TopRecipesBar`) → `.card.col-6` (Planned nutrition drift, "Avg kcal/serving of planned meals · null-nutrition recipes excluded", `NutritionTrendLine`). Verify the current file matches; fix titles/subs if not.

- [ ] **Step 2: Grid + equal-height card CSS (the alignment that repeatedly regressed)**

In `dashboard.css`, ensure exactly:

```css
.metric-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
.col-6 { grid-column: span 6; } .col-4 { grid-column: span 4; } .col-8 { grid-column: span 8; } .col-12 { grid-column: span 12; }
/* Cards in the same grid row are equal-height by grid default (stretch). Make chart
   cards flex-columns so the plot area fills and the SVG centers — no dead space. */
.metric-grid > .card { display:flex; flex-direction:column; }
.metric-grid > .card .scroll-x { flex:1; display:flex; align-items:center; min-height:0; }
.metric-grid > .card > .chart { flex:1; min-height:0; margin:auto; max-height:300px; }
.metric-grid > .card .scroll-x > .chart { max-height:260px; }
```

- [ ] **Step 3: Responsive breakpoints (do NOT collapse too early — this was a real bug)**

In `dashboard.css` ensure:

```css
@media (max-width: 900px) { .kpi { grid-column: span 6; } }
@media (max-width: 680px) { .kpi { grid-column: span 6; } .col-6,.col-4,.col-8 { grid-column: span 12; } }
@media (max-width: 460px) { .kpi { grid-column: span 12; } }
```

- [ ] **Step 4: Verify equal-height + no-early-collapse via geometry**

Use `scratchpad/shot4.js` (dumps card x/width at widths [1200, 900, 861, 820, 700, 680]). `cp` css, run `node shot4.js`. Expected:
- At 1200/900/861/820/700: `col-8` and `col-4` have DIFFERENT x (side by side), and the two `col-6` share a row.
- At 680 and below: all cards width == container (stacked).
Confirm the ≥700px rows are multi-column (the earlier 860px over-collapse must not recur).

- [ ] **Step 5: Full visual verify**

`node shot3.js`, Read `harness.png`, compare the whole page to `concept.png`. Card rows must align in equal-height pairs; donut fills its card; bars slim; no floating/dead space.

- [ ] **Step 6: Commit**

```bash
git add Frontend/src/pages/dashboard/Dashboard.tsx Frontend/src/pages/dashboard/dashboard.css
git commit -m "feat(dashboard): equal-height card grid + forgiving responsive breakpoints"
```

---

## Task 5: Build in Docker + end-to-end visual acceptance

**Files:** none (build + verify only)

- [ ] **Step 1: Rebuild the frontend image and restart**

```bash
docker compose build frontend
docker compose up -d frontend
```
Expected: "Image mealplannerapps-frontend Built"; container Started.

- [ ] **Step 2: Confirm the served bundle contains the redesign**

```bash
docker compose exec -T frontend sh -c 'f=$(ls /usr/share/nginx/html/static/js/*.js); echo "masthead: $(grep -c -F "Behavior Dashboard" $f)"'
docker compose exec -T frontend sh -c 'f=$(ls /usr/share/nginx/html/static/css/*.css); echo "680bp: $(grep -c -F "max-width:680px" $f)"'
```
Expected: both counts ≥ 1.

- [ ] **Step 3: Live screenshot after login (real app, real data)**

Run `scratchpad/liveshot.js` (logs in as admin, navigates to /dashboard, full-page screenshot → `live.png`). Read `live.png`.
Expected: masthead + controls + 4 KPI tiles with sparklines + 2 aligned chart rows. `hasRoot:true`, `hasGrid:true` (admin has data). NOT blank.

- [ ] **Step 4: Compare live vs concept and record the honest gap**

Read `live.png` next to `concept.png`. Confirm structural + stylistic match. Note explicitly (do not treat as bugs): the live sparklines/stacked-chart/nutrition are sparser because real data has one populated week and no analyzed nutrition — this is correct, data-driven behavior, not a layout defect.

- [ ] **Step 5: (Optional) Seed demo data for a fully-populated look**

If a lush demo is wanted, seed meal plans + ratings across several weeks for user1/user2 via the API (same safe path used to create the users). This is optional and does not affect page correctness.

---

## Out of scope

- No changes to the data layer (endpoints, aggregation, model) — verified correct in-session.
- No new chart types beyond the concept's four.
- Persisting `userAuthStore` across reloads app-wide is a broader change; Task 1 handles the dashboard's own resilience without changing global auth architecture.

## Self-review notes

- Spec coverage: auth blank-page (T1), masthead+controls (T2), KPI sparklines+deltas (T3), card grid alignment + breakpoints (T4), Docker build + visual acceptance (T5). Every concept section maps to a task.
- No placeholders: all steps include exact code, CSS, commands, and expected output.
- Consistency: `sparkFrom`, `.ds-masthead/.ds-controls/.ds-btn/.ds-note`, `.metric-grid > .card` selectors, and the 680px breakpoint are used identically across tasks and match the live files already in progress.
- Verification is visual (harness/live screenshots vs `concept.png`) at every step — the discipline that was missing in the earlier reactive iterations.
