import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../redux/store/storeRedux";
import { useGetUserDashboardQuery, useGetAdminDashboardQuery } from "../../api/dashboardApi";
import { DashboardSummary, AdminDashboard, WeeklyPoint, NameCount } from "../../interfaces/dashboardModel";
import userModel from "../../interfaces/userModel";
import { Roles } from "../../interfaces/enum";
import InsightLine from "./components/InsightLine";
import KpiTile from "./components/KpiTile";
import StackedWeeklyChart from "./components/StackedWeeklyChart";
import CategoryDonut from "./components/CategoryDonut";
import TopRecipesBar from "./components/TopRecipesBar";
import NutritionTrendLine from "./components/NutritionTrendLine";
import EmptyState from "./components/EmptyState";
import "./dashboard.css";

// Sparkline heights (0..1) from a numeric series; falls back to a flat faint row
// when there's nothing to show so the tile never looks broken with one lone bar.
const sparkFrom = (vals: number[]): number[] => {
  const max = Math.max(1, ...vals);
  const s = vals.map((v) => v / max);
  return s.some((h) => h > 0) ? s : vals.map(() => 0.12);
};

// The API serializes with ReferenceHandler.Preserve, so arrays arrive wrapped as
// { $values: [...] } rather than plain arrays. Normalize at the data boundary so
// the chart components can stay pure array consumers. Same pattern as
// ShoppingList.tsx / MealPlanner.tsx.
const arr = <T,>(v: any): T[] => (Array.isArray(v) ? v : v?.$values ?? []);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Auth state: userAuthStore is a flat userModel { id, name, email, role }.
  // Same selector pattern used by MealPlanner.tsx / Navbar.tsx.
  const userData: userModel = useSelector((state: RootState) => state.userAuthStore);
  const userId: string = userData.id ?? "";
  const role: string = (userData.role ?? "").toLowerCase();

  // On a hard load, App.tsx rehydrates userAuthStore from the localStorage token
  // AFTER first render. Until userId is populated, treat the page as "resolving"
  // (show a loader) rather than rendering blank. If there's no token at all, the
  // user is genuinely logged out.
  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("token");
  const authResolving = !userId && hasToken;
  const loggedOut = !userId && !hasToken;

  const isAdmin = role === Roles.ADMIN;
  const [view, setView] = useState<"user" | "admin">("user");

  const userQ = useGetUserDashboardQuery({ userId, weeks: 6 }, { skip: view !== "user" || !userId });
  const adminQ = useGetAdminDashboardQuery({ weeks: 6 }, { skip: view !== "admin" });

  const loading = view === "user" ? userQ.isLoading : adminQ.isLoading;
  const data: DashboardSummary | AdminDashboard | undefined =
    (view === "user" ? userQ.data?.result : adminQ.data?.result) as any;

  // Unwrap the $values-wrapped arrays once, so every consumer below gets a real array.
  const weekly: WeeklyPoint[] = arr<WeeklyPoint>(data?.weekly);
  const categoryMix: NameCount[] = arr<NameCount>(data?.categoryMix);
  const topRecipes: NameCount[] = arr<NameCount>(data?.topRecipes);

  // Sparkline data per KPI, derived from the weekly series.
  const mealsSpark = sparkFrom(weekly.map((w) => w.totalMeals));
  const kcalSpark = sparkFrom(weekly.map((w) => w.avgCalories ?? 0));

  // Go back to the previous page if there is history, otherwise fall back home.
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  return (
    <div className="dashboard-root">
      {/* Masthead — mirrors the concept's kicker + title + description + data note */}
      <header className="ds-masthead">
        <div className="ds-kicker">Meal Planner · Behavior Dashboard</div>
        <h1 className="ds-title">
          {view === "user" ? "Your planning behavior" : "Platform behavior"}
        </h1>
        <p className="ds-lead">
          {view === "user"
            ? "How you plan, and what your plans reveal about your tastes and habits — at a glance."
            : "Aggregate meal-planning activity across all users this window."}
        </p>
        <div className="ds-note">
          Every tile and chart maps to real data:{" "}
          <b>MealPlanDays.Date × MealType</b>, recipe frequency, category joins,
          ratings, and planned per-serving nutrition (null-nutrition recipes excluded).
        </div>
      </header>

      {/* Controls row — back/home + admin view toggle */}
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

      {loggedOut && (
        <div className="ds-loading">
          Please <button className="ds-linkbtn" onClick={() => navigate("/login")}>log in</button> to view your dashboard.
        </div>
      )}
      {(authResolving || (userId && loading)) && <div className="ds-loading">Loading your dashboard…</div>}

      {userId && !loading && data && !data.hasData && (
        <EmptyState
          message={view === "user"
            ? "You haven't planned any meals yet. Plan a few and your behavior dashboard comes to life."
            : "No user activity in this window yet."}
          ctaLabel={view === "user" ? "Plan a meal" : undefined}
          onCta={() => navigate("/mealPlan")}
        />
      )}

      {userId && !loading && data && data.hasData && (
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

            <div className="card col-8">
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

            <div className="card col-4">
              <h3>Category mix</h3>
              <div className="sub">What you gravitate toward</div>
              <CategoryDonut data={categoryMix} />
            </div>

            <div className="card col-6">
              <h3>Your most-planned recipes</h3>
              <div className="sub">Repetition is the variety story, told plainly</div>
              <TopRecipesBar data={topRecipes} />
            </div>

            <div className="card col-6">
              <h3>Planned nutrition drift</h3>
              <div className="sub">Avg kcal/serving of planned meals · null-nutrition recipes excluded</div>
              <NutritionTrendLine weekly={weekly} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
