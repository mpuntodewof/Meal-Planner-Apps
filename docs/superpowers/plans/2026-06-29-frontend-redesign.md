# Frontend Redesign (Bold & Modern) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the FoodRecipe frontend in a "Bold & Modern" dark/coral visual language — rebuild Home as a single-scroll page (Hero, Trending, Local Spotlight, Recipes, News, About, Footer), restyle the recipe pages, and replace the jQuery mobile menu with a pure-React full-screen hamburger overlay.

**Architecture:** A shared theme stylesheet (`bold-modern.css`) defines design tokens as CSS variables. New presentational section components live under `src/pages/home/sections/` and are composed by a thin `Home.tsx`. Recipe pages are restyled in place (JSX/className only — all hooks/state/effects unchanged). The Navbar gains React-driven hamburger state. Trending ranking and News content are isolated behind a hook and a static data module respectively, so a future backend swaps in with a one-file change.

**Tech Stack:** React 18 + TypeScript, React Router v6, Redux Toolkit / RTK Query, Bootstrap classes + custom CSS. No test framework exists; verification is `npm run build` (clean compile) + manual responsive check per task.

---

## Verification Convention (read once)

This is a visual redesign with **no existing test infrastructure**. Per task, the verification step is:

- **Build check:** from `Frontend/`, run `CI=false npm run build` → expect `Compiled` (warnings OK if pre-existing; **no new errors**).
- **Manual check:** the specific thing to look at, stated per task.
- **Commit** after each task.

Do NOT add a test framework — it is out of scope. Frequent commits replace the red/green loop here.

All paths below are relative to repo root. Frontend lives in `Frontend/`.

---

## File Structure

```
Frontend/src/
  styles/bold-modern.css            (NEW — design tokens + shared classes)
  index.tsx                         (MODIFY — import bold-modern.css once)
  data/newsData.ts                  (NEW — typed static news items)
  interfaces/newsModel.ts           (NEW — NewsItem type, future-API-shaped)
  hooks/useTrendingRecipes.ts       (NEW — ranking isolation)
  pages/Home.tsx                    (REWRITE — compose sections)
  pages/home/sections/
    Hero.tsx                        (NEW)
    TrendingNow.tsx                 (NEW)
    LocalSpotlight.tsx              (NEW)
    RecipeGrid.tsx                  (NEW — refactor of Product.tsx markup)
    NewsSection.tsx                 (NEW)
    AboutSection.tsx                (NEW)
  components/sub-comp/Navbar.tsx    (MODIFY — React hamburger + overlay)
  components/Footer.tsx             (MODIFY — restyle)
  pages/product/ProductCatalog.tsx  (MODIFY — restyle only)
  pages/product/SingleProduct.tsx   (MODIFY — restyle only)
```

---

### Task 1: Shared theme stylesheet & design tokens

**Files:**
- Create: `Frontend/src/styles/bold-modern.css`
- Modify: `Frontend/src/index.tsx`

- [ ] **Step 1: Create the theme stylesheet**

Create `Frontend/src/styles/bold-modern.css`:

```css
/* Bold & Modern theme layer. Scoped via .bm-* classes so it does not
   override the existing theme globally. Tokens are CSS variables. */
:root {
  --bm-bg: #0f0f12;
  --bm-panel: #16161a;
  --bm-card: #1c1c22;
  --bm-border: #26262c;
  --bm-accent: #ff5a3c;
  --bm-text: #e7e7ea;
  --bm-muted: #9a9aa2;
  --bm-faint: #6f6f78;
}

.bm-section { background: var(--bm-bg); color: var(--bm-text); padding: 80px 0; border-top: 1px solid var(--bm-border); }
.bm-section--panel { background: var(--bm-panel); }
.bm-label { color: var(--bm-accent); font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; }
.bm-title { font-size: clamp(24px, 4vw, 40px); font-weight: 900; letter-spacing: -1px; line-height: 1.05; margin: 8px 0 16px; }
.bm-btn { display: inline-block; background: var(--bm-accent); color: #fff; font-weight: 800; padding: 12px 22px; border-radius: 4px; border: 0; text-decoration: none; cursor: pointer; }
.bm-btn--outline { background: transparent; border: 1px solid var(--bm-border); color: var(--bm-text); }
.bm-card { background: var(--bm-card); border: 1px solid var(--bm-border); border-radius: 10px; overflow: hidden; }
.bm-overlay { background: linear-gradient(90deg, rgba(15,15,18,.85), rgba(15,15,18,.45)); position: absolute; inset: 0; }
.bm-rank { position: absolute; top: 8px; left: 8px; background: var(--bm-accent); color: #fff; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 12px; }
.bm-heart { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 0; cursor: pointer; background: rgba(15,15,18,.8); color: var(--bm-accent); }
.bm-heart--on { background: var(--bm-accent); color: #fff; }
```

- [ ] **Step 2: Import the stylesheet once in index.tsx**

In `Frontend/src/index.tsx`, add this import after the existing `react-toastify` CSS import (around line 8):

```tsx
import "./styles/bold-modern.css";
```

- [ ] **Step 3: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors.

- [ ] **Step 4: Commit**

```bash
git add Frontend/src/styles/bold-modern.css Frontend/src/index.tsx
git commit -m "feat(ui): add Bold & Modern theme tokens stylesheet"
```

---

### Task 2: News type + static data module

**Files:**
- Create: `Frontend/src/interfaces/newsModel.ts`
- Create: `Frontend/src/data/newsData.ts`

- [ ] **Step 1: Create the NewsItem interface**

Create `Frontend/src/interfaces/newsModel.ts`:

```ts
// Shaped to mirror a future News API model so wiring a real backend later
// is a drop-in replacement for the static data in data/newsData.ts.
export default interface newsModel {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;      // ISO string
  imageUrl: string;
}
```

- [ ] **Step 2: Create the static news data**

Create `Frontend/src/data/newsData.ts`. Uses existing bundled news images:

```ts
import newsModel from "../interfaces/newsModel";
import news1 from "../img/latest-news/news-bg-1.jpg";
import news2 from "../img/latest-news/news-bg-2.jpg";
import news3 from "../img/latest-news/news-bg-3.jpg";
import news4 from "../img/latest-news/news-bg-4.jpg";

const newsData: newsModel[] = [
  { id: 1, title: "5 Pantry Staples Every Home Cook Needs", excerpt: "Build a kitchen that lets you cook anything, any night of the week.", author: "Editorial", date: "2026-06-20", imageUrl: news1 },
  { id: 2, title: "The Rise of Nusantara Flavors", excerpt: "How Indonesian spice blends are winning over global kitchens.", author: "Editorial", date: "2026-06-18", imageUrl: news2 },
  { id: 3, title: "Meal Prep Without the Burnout", excerpt: "A realistic weekly rhythm that keeps weeknight dinners easy.", author: "Editorial", date: "2026-06-15", imageUrl: news3 },
  { id: 4, title: "Seasonal Produce: What to Cook Now", excerpt: "Eat with the season for better flavor and lower cost.", author: "Editorial", date: "2026-06-10", imageUrl: news4 },
];

export default newsData;
```

- [ ] **Step 3: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors. (If any `news-bg-*.jpg` is missing, the build fails on the import — confirm filenames in `Frontend/src/img/latest-news/` first; they were verified present.)

- [ ] **Step 4: Commit**

```bash
git add Frontend/src/interfaces/newsModel.ts Frontend/src/data/newsData.ts
git commit -m "feat(ui): add News type and static news data"
```

---

### Task 3: Trending ranking hook

**Files:**
- Create: `Frontend/src/hooks/useTrendingRecipes.ts`

**Note:** The recipes list does not expose a global favorite count, so the reliable client-side signal is **newest by `createdAt`**. The hook isolates this so a future `/api/recipe/trending` endpoint is a one-file swap. Label in UI will say "Trending" but rank by recency.

- [ ] **Step 1: Create the hook**

Create `Frontend/src/hooks/useTrendingRecipes.ts`:

```ts
import { useGetRecipesQuery } from "../api/recipeApi";
import recipeModel from "../interfaces/recipeModel";

// Returns recipes ranked for the "Trending Now" rail. Currently ranks by
// recency (newest createdAt first) since no favorite-count is exposed to the
// client. Swap the sort here when a real trending endpoint exists.
export default function useTrendingRecipes(limit: number = 6) {
  const { data, isLoading } = useGetRecipesQuery(null);
  const all: recipeModel[] = data?.result?.$values ?? [];
  const trending = [...all]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
  return { trending, isLoading };
}
```

- [ ] **Step 2: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/hooks/useTrendingRecipes.ts
git commit -m "feat(ui): add useTrendingRecipes ranking hook"
```

---

### Task 4: Hero section

**Files:**
- Create: `Frontend/src/pages/home/sections/Hero.tsx`

- [ ] **Step 1: Create Hero.tsx**

Create `Frontend/src/pages/home/sections/Hero.tsx`:

```tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import heroBg from "../../../img/food-bg-3.webp";

function Hero() {
  const navigate = useNavigate();
  return (
    <div style={{ position: "relative", minHeight: 460, display: "flex", alignItems: "center", backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="bm-overlay" />
      <div className="container" style={{ position: "relative" }}>
        <div className="bm-label">Cooking Ideas</div>
        <h1 className="bm-title" style={{ color: "#fff", maxWidth: 620 }}>Cook bold.<br />Eat better.</h1>
        <p style={{ color: "var(--bm-muted)", maxWidth: 460, marginBottom: 20 }}>
          Curated recipes, meal plans, and food stories — all in one place.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="bm-btn" onClick={() => navigate("/productCatalog")}>Browse Recipes</button>
          <a className="bm-btn bm-btn--outline" href="#news">Read News</a>
        </div>
      </div>
    </div>
  );
}

export default Hero;
```

- [ ] **Step 2: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/home/sections/Hero.tsx
git commit -m "feat(ui): add Bold & Modern Hero section"
```

---

### Task 5: TrendingNow section

**Files:**
- Create: `Frontend/src/pages/home/sections/TrendingNow.tsx`

- [ ] **Step 1: Create TrendingNow.tsx**

Create `Frontend/src/pages/home/sections/TrendingNow.tsx`:

```tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import useTrendingRecipes from "../../../hooks/useTrendingRecipes";
import recipeModel from "../../../interfaces/recipeModel";
import imgDef from "../../../img/istockphoto-174914813-612x612.jpg";

function TrendingNow() {
  const navigate = useNavigate();
  const { trending, isLoading } = useTrendingRecipes(6);

  if (isLoading || trending.length === 0) return null;

  return (
    <div className="bm-section bm-section--panel">
      <div className="container">
        <div className="bm-label">🔥 Trending Now</div>
        <h2 className="bm-title">Hot in the kitchen</h2>
        <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
          {trending.map((recipe: recipeModel, i: number) => (
            <div key={recipe.id} className="bm-card" style={{ minWidth: 240, flex: "0 0 auto", cursor: "pointer" }} onClick={() => navigate(`/singleProduct/${recipe.id}`)}>
              <div style={{ position: "relative", height: 150 }}>
                <span className="bm-rank">#{i + 1}</span>
                <img src={recipe.imageUrl || imgDef} alt={recipe.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontWeight: 700 }}>{recipe.name}</div>
                <div style={{ color: "var(--bm-faint)", fontSize: 12, marginTop: 4 }}>⏱ {recipe.cookingTime}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TrendingNow;
```

- [ ] **Step 2: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/home/sections/TrendingNow.tsx
git commit -m "feat(ui): add Trending Now rail section"
```

---

### Task 6: LocalSpotlight section

**Files:**
- Create: `Frontend/src/pages/home/sections/LocalSpotlight.tsx`

- [ ] **Step 1: Create LocalSpotlight.tsx**

Create `Frontend/src/pages/home/sections/LocalSpotlight.tsx`. Uses the existing `masakan-nusantara.jpg` asset:

```tsx
import React from "react";
import nusantara from "../../../img/masakan-nusantara.jpg";
import beef from "../../../img/beef-img.jpg";
import dessert from "../../../img/dessert-img.jpg";

function LocalSpotlight() {
  return (
    <div className="bm-section">
      <div className="container">
        <div className="bm-label">🏠 Local Spotlight</div>
        <h2 className="bm-title">Nusantara dish of the week</h2>
        <div className="row">
          <div className="col-lg-8 mb-4">
            <div className="bm-card" style={{ position: "relative", minHeight: 320 }}>
              <img src={nusantara} alt="Dish of the week" style={{ width: "100%", height: 320, objectFit: "cover" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, background: "linear-gradient(transparent, rgba(15,15,18,.95))" }}>
                <h3 style={{ color: "#fff", fontWeight: 800 }}>Rendang &amp; Regional Classics</h3>
                <p style={{ color: "var(--bm-muted)", margin: 0 }}>Slow-cooked, spice-forward dishes that define Indonesian home cooking.</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="bm-card mb-3" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={beef} alt="" style={{ width: 90, height: 90, objectFit: "cover" }} />
              <div style={{ fontWeight: 700, padding: "0 8px" }}>Beef Specialties</div>
            </div>
            <div className="bm-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={dessert} alt="" style={{ width: 90, height: 90, objectFit: "cover" }} />
              <div style={{ fontWeight: 700, padding: "0 8px" }}>Traditional Desserts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocalSpotlight;
```

- [ ] **Step 2: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors. (If `beef-img.jpg` / `dessert-img.jpg` differ, confirm names in `Frontend/src/img/`; both verified present.)

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/home/sections/LocalSpotlight.tsx
git commit -m "feat(ui): add Local Spotlight section"
```

---

### Task 7: RecipeGrid section (refactor of Product.tsx)

**Files:**
- Create: `Frontend/src/pages/home/sections/RecipeGrid.tsx`

This reproduces `Product.tsx`'s data logic (fetch recipes, store in redux) with the new dark card styling and a `#recipes` anchor. `Product.tsx` itself is left untouched (it is still routed at `/product`); Home will use this new section instead.

- [ ] **Step 1: Create RecipeGrid.tsx**

Create `Frontend/src/pages/home/sections/RecipeGrid.tsx`:

```tsx
import React, { useEffect, useState } from "react";
import { useGetRecipesQuery } from "../../../api/recipeApi";
import { useNavigate } from "react-router-dom";
import recipeModel from "../../../interfaces/recipeModel";
import { Loader } from "../../../components/sub-comp";
import { useDispatch } from "react-redux";
import { setRecipe } from "../../../redux/reducerAction/recipeSlice";
import imgDef from "../../../img/istockphoto-174914813-612x612.jpg";

function RecipeGrid() {
  const [recipes, setRecipes] = useState<recipeModel[]>([]);
  const dispatch = useDispatch();
  const { data, isLoading } = useGetRecipesQuery(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && data) {
      dispatch(setRecipe(data.result));
      setRecipes(data.result?.$values ?? []);
    }
  }, [isLoading, data]);

  return (
    <div id="recipes" className="bm-section bm-section--panel">
      <div className="container">
        <div className="bm-label">Recipes</div>
        <h2 className="bm-title">Most Viewed Recipes</h2>
        {isLoading ? <Loader /> : (
          <div className="row">
            {recipes.map((recipe: recipeModel, index: number) => (
              <div className="col-lg-4 col-md-6 mb-4" key={index}>
                <div className="bm-card" style={{ height: "100%", cursor: "pointer" }} onClick={() => navigate(`/singleProduct/${recipe.id}`)}>
                  <img src={recipe.imageUrl || imgDef} alt={recipe.name} style={{ width: "100%", height: 220, objectFit: "cover" }} />
                  <div style={{ padding: 16 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 700 }}>{recipe.name}</h3>
                    <p style={{ color: "var(--bm-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{recipe.description}</p>
                    <span className="bm-btn" style={{ fontSize: 13, padding: "8px 16px" }}>View Recipe</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecipeGrid;
```

- [ ] **Step 2: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/home/sections/RecipeGrid.tsx
git commit -m "feat(ui): add restyled RecipeGrid home section"
```

---

### Task 8: NewsSection

**Files:**
- Create: `Frontend/src/pages/home/sections/NewsSection.tsx`

- [ ] **Step 1: Create NewsSection.tsx**

Create `Frontend/src/pages/home/sections/NewsSection.tsx`:

```tsx
import React from "react";
import newsData from "../../../data/newsData";
import newsModel from "../../../interfaces/newsModel";

function NewsSection() {
  return (
    <div id="news" className="bm-section">
      <div className="container">
        <div className="bm-label">News</div>
        <h2 className="bm-title">Latest Food Stories</h2>
        <div className="row">
          {newsData.map((item: newsModel) => (
            <div className="col-lg-3 col-md-6 mb-4" key={item.id}>
              <div className="bm-card" style={{ height: "100%" }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{item.title}</h3>
                  <p style={{ color: "var(--bm-muted)", fontSize: 13 }}>{item.excerpt}</p>
                  <div style={{ color: "var(--bm-faint)", fontSize: 12 }}>
                    {new Date(item.date).toLocaleDateString()} · {item.author}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewsSection;
```

- [ ] **Step 2: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/home/sections/NewsSection.tsx
git commit -m "feat(ui): add News section (static)"
```

---

### Task 9: AboutSection

**Files:**
- Create: `Frontend/src/pages/home/sections/AboutSection.tsx`

- [ ] **Step 1: Create AboutSection.tsx**

Create `Frontend/src/pages/home/sections/AboutSection.tsx`. Uses existing `abt.jpg`:

```tsx
import React from "react";
import abt from "../../../img/abt.jpg";

function AboutSection() {
  return (
    <div id="about" className="bm-section bm-section--panel">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-7 mb-4">
            <div className="bm-label">About</div>
            <h2 className="bm-title">Who we are</h2>
            <p style={{ color: "var(--bm-muted)", maxWidth: 520 }}>
              FoodRecipe is a home for curated recipes, meal planning, and food stories.
              We help home cooks discover great dishes, plan their week, and cook with confidence.
            </p>
            <div style={{ display: "flex", gap: 32, marginTop: 16 }}>
              <div><div style={{ color: "var(--bm-accent)", fontSize: 28, fontWeight: 900 }}>500+</div><div style={{ color: "var(--bm-faint)" }}>Recipes</div></div>
              <div><div style={{ color: "var(--bm-accent)", fontSize: 28, fontWeight: 900 }}>6</div><div style={{ color: "var(--bm-faint)" }}>Categories</div></div>
              <div><div style={{ color: "var(--bm-accent)", fontSize: 28, fontWeight: 900 }}>1k+</div><div style={{ color: "var(--bm-faint)" }}>Home cooks</div></div>
            </div>
          </div>
          <div className="col-lg-5">
            <img src={abt} alt="About FoodRecipe" className="bm-card" style={{ width: "100%", height: 300, objectFit: "cover" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutSection;
```

- [ ] **Step 2: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors.

- [ ] **Step 3: Commit**

```bash
git add Frontend/src/pages/home/sections/AboutSection.tsx
git commit -m "feat(ui): add About section"
```

---

### Task 10: Restyle Footer

**Files:**
- Modify: `Frontend/src/components/Footer.tsx`

- [ ] **Step 1: Read the current Footer**

Read `Frontend/src/components/Footer.tsx` in full to preserve any existing structure/links before replacing markup.

- [ ] **Step 2: Replace Footer body with Bold & Modern markup**

Replace the component's returned JSX with the following (keep the existing import lines and `export default`; only swap the returned markup):

```tsx
  return (
    <footer style={{ background: "#16161a", color: "var(--bm-text)", borderTop: "1px solid var(--bm-border)", padding: "60px 0 24px" }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-4 mb-4">
            <div style={{ fontWeight: 900, fontSize: 22 }}>FOOD<span style={{ color: "var(--bm-accent)" }}>.</span></div>
            <p style={{ color: "var(--bm-muted)", marginTop: 8 }}>Curated recipes, meal plans, and food stories.</p>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="bm-label">Explore</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
              <li><a href="#recipes" style={{ color: "var(--bm-muted)", textDecoration: "none" }}>Recipes</a></li>
              <li><a href="#news" style={{ color: "var(--bm-muted)", textDecoration: "none" }}>News</a></li>
              <li><a href="#about" style={{ color: "var(--bm-muted)", textDecoration: "none" }}>About</a></li>
            </ul>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="bm-label">Newsletter</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input className="form-control" placeholder="Your email" style={{ background: "var(--bm-card)", border: "1px solid var(--bm-border)", color: "var(--bm-text)" }} />
              <button className="bm-btn">Join</button>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--bm-border)", paddingTop: 16, color: "var(--bm-faint)", fontSize: 13 }}>
          © {new Date().getFullYear()} FoodRecipe. All rights reserved.
        </div>
      </div>
    </footer>
  );
```

- [ ] **Step 3: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors.

- [ ] **Step 4: Commit**

```bash
git add Frontend/src/components/Footer.tsx
git commit -m "feat(ui): restyle Footer to Bold & Modern"
```

---

### Task 11: Recompose Home.tsx

**Files:**
- Modify: `Frontend/src/pages/Home.tsx`

- [ ] **Step 1: Replace Home.tsx**

Replace the entire contents of `Frontend/src/pages/Home.tsx` with:

```tsx
import React from "react";
import { Navbar } from "../components/sub-comp";
import Footer from "../components/Footer";
import Hero from "./home/sections/Hero";
import TrendingNow from "./home/sections/TrendingNow";
import LocalSpotlight from "./home/sections/LocalSpotlight";
import RecipeGrid from "./home/sections/RecipeGrid";
import NewsSection from "./home/sections/NewsSection";
import AboutSection from "./home/sections/AboutSection";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <TrendingNow />
      <LocalSpotlight />
      <RecipeGrid />
      <NewsSection />
      <AboutSection />
      <Footer />
    </>
  );
}

export default Home;
```

- [ ] **Step 2: Remove the now-redundant Header/Footer wrapper around Home in App.tsx**

In `Frontend/src/App.tsx`, the `/` route currently wraps `<Home />` with `<Header />` and `<Footer />`. Since `Home` now renders its own `Navbar` and `Footer`, change the `/` route element from:

```tsx
          <Route path="/" element={
            <>
              <Header />
              <Home />
              <Footer />
            </>
          } />
```

to:

```tsx
          <Route path="/" element={<Home />} />
```

- [ ] **Step 3: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors. `Header` may now be an unused import in App.tsx — if the build warns about it, remove the `import Header from './components/Header';` line.

- [ ] **Step 4: Manual check**

From `Frontend/`: `npm start`, open `http://localhost:3000/`. Verify the section order top-to-bottom: Navbar → Hero → Trending → Local Spotlight → Recipes → News → About → Footer. Confirm hero shows a food photo with dark overlay and readable text.

- [ ] **Step 5: Commit**

```bash
git add Frontend/src/pages/Home.tsx Frontend/src/App.tsx
git commit -m "feat(ui): recompose Home as single-scroll Bold & Modern page"
```

---

### Task 12: Navbar — React hamburger + full-screen overlay

**Files:**
- Modify: `Frontend/src/components/sub-comp/Navbar.tsx`

**Goal:** Add `useState` open/close for a mobile menu; below 992px show a hamburger button; when open, render a full-screen centered overlay with the four main links + a secondary group for auth/admin items; lock body scroll while open; fix dead links (News→`#news`, About→`#about`). Desktop markup stays but is hidden under 992px via inline media logic using a CSS class in `bold-modern.css`.

- [ ] **Step 1: Add responsive nav CSS to bold-modern.css**

Append to `Frontend/src/styles/bold-modern.css`:

```css
/* Responsive nav */
.bm-hamburger { display: none; flex-direction: column; gap: 4px; background: none; border: 0; cursor: pointer; padding: 8px; }
.bm-hamburger span { width: 24px; height: 2px; background: var(--bm-text); display: block; }
.bm-overlay-menu { position: fixed; inset: 0; background: rgba(15,15,18,.97); z-index: 2000; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; }
.bm-overlay-menu a { color: var(--bm-text); font-size: 28px; font-weight: 800; text-decoration: none; }
.bm-overlay-menu .bm-secondary { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 16px; }
.bm-overlay-menu .bm-secondary a { font-size: 16px; font-weight: 600; color: var(--bm-muted); }
.bm-overlay-close { position: absolute; top: 18px; right: 22px; background: none; border: 0; color: var(--bm-accent); font-size: 28px; cursor: pointer; }
@media (max-width: 992px) {
  .bm-hamburger { display: flex; }
  .bm-desktop-menu { display: none !important; }
}
```

- [ ] **Step 2: Add open/close state and body-scroll lock to Navbar**

In `Frontend/src/components/sub-comp/Navbar.tsx`, add after the existing `const [scroll, setScroll] = useState(false);` line:

```tsx
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const go = (path: string) => { setMenuOpen(false); navigate(path); };
```

(`useEffect` and `useState` are already imported in this file.)

- [ ] **Step 3: Add the desktop-menu class and the hamburger button**

In the existing desktop `<nav className="main-menu">`, add the `bm-desktop-menu` class so it hides under 992px:

```tsx
                <nav className="main-menu bm-desktop-menu">
```

Then, immediately AFTER the closing `</nav>` of that desktop menu, add the hamburger button:

```tsx
                <button className="bm-hamburger" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
                  <span></span><span></span><span></span>
                </button>
```

- [ ] **Step 4: Render the full-screen overlay**

Just before the final closing of the component's returned markup (before the last `</div>` that closes `sticky-wrapper`), insert the overlay. It renders only when `menuOpen` is true:

```tsx
      {menuOpen && (
        <div className="bm-overlay-menu">
          <button className="bm-overlay-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>✕</button>
          <a onClick={() => go("/")}>Home</a>
          <a onClick={() => go("/productCatalog")}>Recipe</a>
          <a onClick={() => { setMenuOpen(false); window.location.hash = "#news"; }}>News</a>
          <a onClick={() => { setMenuOpen(false); window.location.hash = "#about"; }}>About</a>
          <div className="bm-secondary">
            {userData.id ? (
              <>
                <a onClick={() => go("/addProduct")}>Create Recipe</a>
                <a onClick={() => go(`/userProfile/${userData.id}`)}>User Profile</a>
                <a onClick={() => { setMenuOpen(false); handleLogout(); }}>Logout</a>
              </>
            ) : (
              <>
                <a onClick={() => go("/login")}>Login</a>
                <a onClick={() => go("/register")}>Register</a>
              </>
            )}
          </div>
        </div>
      )}
```

- [ ] **Step 5: Fix the desktop dead links**

In the desktop menu list, change the News and About items from dead links to anchors:

Change `<a href="news.html">News</a>` to:
```tsx
                      <a href="#news">News</a>
```
Change `<a href="#">About</a>` to:
```tsx
                      <a href="#about">About</a>
```

- [ ] **Step 6: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors.

- [ ] **Step 7: Manual responsive check**

From `Frontend/`: `npm start`. In the browser devtools, toggle device toolbar / resize below 992px:
- Desktop links hide; hamburger shows.
- Click hamburger → full-screen overlay with Home/Recipe/News/About centered + secondary group.
- Selecting a link closes the overlay and navigates/scrolls.
- ✕ closes it. Body does not scroll while open.
Above 992px: desktop menu shows, hamburger hidden.

- [ ] **Step 8: Commit**

```bash
git add Frontend/src/components/sub-comp/Navbar.tsx Frontend/src/styles/bold-modern.css
git commit -m "feat(ui): React hamburger full-screen overlay nav, fix dead links"
```

---

### Task 13: Restyle ProductCatalog (Recipe catalog page)

**Files:**
- Modify: `Frontend/src/pages/product/ProductCatalog.tsx`

**Constraint:** Logic, hooks, state, effects, and the favorites deferred-sync are UNCHANGED. Only the banner, card markup, heart button, and pagination styling change.

- [ ] **Step 1: Restyle the breadcrumb banner**

In `ProductCatalog.tsx`, the banner currently uses `style={{ backgroundImage: url(${salmon}) }}`. Add the overlay + Bold tokens. Replace the existing `<div className="breadcrumb-section" ...>` block with:

```tsx
						<div className="breadcrumb-section" style={{ position: "relative", backgroundImage: `url(${salmon})`, backgroundSize: "cover", backgroundPosition: "center" }}>
							<div className="bm-overlay" />
							<div className="container" style={{ position: "relative" }}>
								<div className="row">
									<div className="col-lg-8 offset-lg-2 text-center">
										<div className="breadcrumb-text">
											<p className="bm-label">Food Recipe Apps</p>
											<h1 style={{ color: "#fff", fontWeight: 900 }}>Recipe Catalog</h1>
										</div>
									</div>
								</div>
							</div>
						</div>
```

- [ ] **Step 2: Restyle the recipe card and heart toggle**

Replace the inner card markup (the `<div className="single-latest-news">` block) with the Bold card + coral heart. The heart uses the existing `fav.isFavorited` and `toggleLiked`:

```tsx
											<div className="bm-card" style={{ height: "100%" }}>
												<div style={{ position: "relative", height: 200 }}>
													<div className="latest-news-bg" style={{ backgroundImage: `url(${fav.imageUrl})`, width: "100%", height: "100%", backgroundSize: "cover", backgroundPosition: "center" }}></div>
													<button className={`bm-heart ${fav.isFavorited ? "bm-heart--on" : ""}`} style={{ position: "absolute", top: 10, right: 10 }} onClick={() => toggleLiked(fav.recipeId)}>
														<i className="fas fa-heart"></i>
													</button>
												</div>
												<div style={{ padding: 16 }}>
													<h3 style={{ fontSize: 18, fontWeight: 700, minHeight: 50 }}>{fav.recipeName}</h3>
													<p style={{ color: "var(--bm-faint)", fontSize: 13 }}>
														<i className="fas fa-calendar"></i> {fav.createdAt && new Date(fav.createdAt).toLocaleDateString()}
													</p>
													<p style={{ color: "var(--bm-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", height: 66 }}>{fav.description}</p>
													<a onClick={() => navigate(`/singleProduct/${fav.recipeId}`)} className="bm-btn" style={{ fontSize: 13, padding: "8px 16px" }}>Read more</a>
												</div>
											</div>
```

Keep the surrounding `<div className="col-lg-4 col-md-6" key={index}>` wrapper unchanged.

- [ ] **Step 3: Restyle pagination**

Replace the `pagination-wrap` `<ul>` content with Bold styling (keep `handlePageChange` calls):

```tsx
												<ul style={{ listStyle: "none", display: "flex", gap: 12, justifyContent: "center", alignItems: "center", padding: 0 }}>
													<li><a style={{ color: "var(--bm-muted)", cursor: "pointer" }} onClick={() => handlePageChange(pageNumber - 1)}>‹ Previous</a></li>
													<li><span className="bm-btn" style={{ padding: "4px 12px" }}>{pageNumber}</span> <span style={{ color: "var(--bm-faint)" }}>of {totalPages}</span></li>
													<li><a style={{ color: "var(--bm-muted)", cursor: "pointer" }} onClick={() => handlePageChange(pageNumber + 1)}>Next ›</a></li>
												</ul>
```

- [ ] **Step 4: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors.

- [ ] **Step 5: Manual check**

From `Frontend/`: `npm start`, log in, open `/productCatalog`. Verify: dark cards, coral heart fills when favorited and clears when unfavorited (existing toggle), pagination works. Grid collapses to one column on a narrow viewport.

- [ ] **Step 6: Commit**

```bash
git add Frontend/src/pages/product/ProductCatalog.tsx
git commit -m "feat(ui): restyle Recipe Catalog to Bold & Modern"
```

---

### Task 14: Restyle SingleProduct (single recipe page)

**Files:**
- Modify: `Frontend/src/pages/product/SingleProduct.tsx`

**Constraint:** Logic/hooks/guards unchanged (keep the `data?.result` guards added earlier). Only markup/styling changes.

- [ ] **Step 1: Restyle the hero/breadcrumb with image overlay**

Replace the `<div className="breadcrumb-section" ...>` block with an image hero carrying title + meta:

```tsx
          <div className="breadcrumb-section" style={{ position: "relative", backgroundImage: `url(${data.result.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: 320 }}>
            <div className="bm-overlay" />
            <div className="container" style={{ position: "relative" }}>
              <div className="row">
                <div className="col-lg-8 offset-lg-2 text-center">
                  <div className="breadcrumb-text">
                    <h1 style={{ color: "#fff", fontWeight: 900 }}>{data.result.name}</h1>
                    <p style={{ color: "#ffce8a" }}>⏱ {data.result.cookingTime} · 🍽 {data.result.serviceSize} · ★★★★★</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
```

- [ ] **Step 2: Wrap description + put Ingredients/Steps in side-by-side panels**

Replace the `single-product` content sections (the description block and the two ingredient/instruction card blocks) with:

```tsx
          <div className="bm-section">
            <div className="container">
              <p style={{ color: "var(--bm-muted)", maxWidth: 800 }}>{data.result.description}</p>
              <div className="row mt-4">
                <div className="col-md-6 mb-4">
                  <div className="bm-card" style={{ padding: 20, height: "100%" }}>
                    <div className="bm-label">Ingredients</div>
                    <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
                      {ingredients.map((ingredient: ingredientModel, index: number) => (
                        <li key={index} style={{ color: "var(--bm-text)", padding: "6px 0", borderBottom: "1px solid var(--bm-border)" }}>
                          <i className="fas fa-check-circle" style={{ color: "var(--bm-accent)" }}></i> {ingredient.name}, {ingredient.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="bm-card" style={{ padding: 20, height: "100%" }}>
                    <div className="bm-label">Steps</div>
                    <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
                      {instructions.map((instruction: instructionModel, index: number) => (
                        <li key={index} style={{ color: "var(--bm-text)", padding: "6px 0", borderBottom: "1px solid var(--bm-border)" }}>
                          Step {instruction.stepNumber}, {instruction.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
```

- [ ] **Step 3: Restyle the admin actions and close the wrappers**

Immediately after the ingredients/steps `row` div from Step 2, replace the existing admin `Roles.ADMIN` block with:

```tsx
              {userData.role == Roles.ADMIN && (
                <div className="text-center mt-2">
                  <a className="bm-btn bm-btn--outline" style={{ marginRight: 8 }} onClick={() => navigate(`/addProduct/${data.result.id}`)}><i className="fas fa-edit"></i> Edit</a>
                  <a className="bm-btn" style={{ background: "#c0392b" }} onClick={() => navigate(`/addProduct/${data.result.id}`)}><i className="fas fa-trash"></i> Delete</a>
                </div>
              )}
            </div>
          </div>
```

**Important:** This Step 2 + Step 3 replacement collapses the original two separate `single-product` section `<div>`s into one `bm-section`. When editing, ensure the original two `<div className="single-product ...">` blocks and their closing tags are fully replaced by the single block spanning Step 2's opening `<div className="bm-section">` through Step 3's closing `</div></div>`. Verify brace/tag balance after editing.

- [ ] **Step 4: Build check**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` with no new errors. If JSX tag-balance errors appear, re-read the file and confirm the `bm-section` wrapper opens once and closes once around both panels and the admin block.

- [ ] **Step 5: Manual check**

From `Frontend/`: `npm start`, open a recipe via `/singleProduct/:id`. Verify: image hero with title/meta overlay, Ingredients and Steps in two dark panels side-by-side (stacked on mobile), admin Edit/Delete visible only as admin.

- [ ] **Step 6: Commit**

```bash
git add Frontend/src/pages/product/SingleProduct.tsx
git commit -m "feat(ui): restyle single recipe page to Bold & Modern"
```

---

### Task 15: Final full-app verification

**Files:** none (verification only)

- [ ] **Step 1: Clean production build**

From `Frontend/`: `CI=false npm run build`
Expected: `Compiled` (only pre-existing warnings; no errors). Confirm route chunks still split (code-splitting from earlier work intact).

- [ ] **Step 2: Run and walk the app**

From repo root ensure API + DB are up (`npm run db:up`, API running), then `Frontend/` → `npm start`. Walk through:
- `/` — all 7 Home bands render in order; hero/banners show food photos with overlay; nav anchors (#recipes/#news/#about) scroll correctly.
- Resize < 992px — hamburger → full-screen overlay works; body scroll locks.
- `/productCatalog` (logged in) — dark cards, heart toggle, pagination.
- `/singleProduct/:id` — image hero, ingredients/steps panels.
- News/About nav links no longer 404 (scroll to sections).

- [ ] **Step 3: Commit any final tweaks**

```bash
git add -A
git commit -m "chore(ui): final redesign verification pass"
```

---

## Self-Review Notes

- **Spec coverage:** §2 theme → Task 1; §4 Home sections → Tasks 4–9, 11; §5 recipe pages → Tasks 13–14; §6 navbar/hamburger → Task 12; §7 trending hook → Task 3, news data → Task 2; footer → Task 10; verification §10 → Task 15. All spec sections mapped.
- **Deferred items respected:** News stays static (Task 2/8); trending isolated in a hook (Task 3) ranking by recency with a comment to swap later; no backend changes.
- **Type consistency:** `newsModel` fields (id/title/excerpt/author/date/imageUrl) used identically in Tasks 2 and 8. `useTrendingRecipes(limit)` returns `{ trending, isLoading }`, consumed exactly that way in Task 5. `recipeModel` fields used (id/name/description/cookingTime/imageUrl/createdAt) all exist in the interface.
- **Behavior-preservation:** Tasks 13–14 explicitly constrain changes to markup; favorites deferred-sync and null-guards untouched.
```
