import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "../../redux/store/storeRedux";
import { useGetUserDashboardQuery, useGetAdminDashboardQuery } from "../../api/dashboardApi";
import { DashboardSummary, AdminDashboard } from "../../interfaces/dashboardModel";
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

const spark = (weekly: { totalMeals: number }[]) => {
  const max = Math.max(1, ...weekly.map((w) => w.totalMeals));
  return weekly.map((w) => w.totalMeals / max);
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Auth state: userAuthStore is a flat userModel { id, name, email, role }.
  // Same selector pattern used by MealPlanner.tsx / Navbar.tsx.
  const userData: userModel = useSelector((state: RootState) => state.userAuthStore);
  const userId: string = userData.id ?? "";
  const role: string = (userData.role ?? "").toLowerCase();

  const isAdmin = role === Roles.ADMIN;
  const [view, setView] = useState<"user" | "admin">("user");

  const userQ = useGetUserDashboardQuery({ userId, weeks: 6 }, { skip: view !== "user" || !userId });
  const adminQ = useGetAdminDashboardQuery({ weeks: 6 }, { skip: view !== "admin" });

  const loading = view === "user" ? userQ.isLoading : adminQ.isLoading;
  const data: DashboardSummary | AdminDashboard | undefined =
    (view === "user" ? userQ.data?.result : adminQ.data?.result) as any;

  return (
    <div className="dashboard-root">
      <div className="ds-head">
        <div>
          <div className="ds-kicker">Meal Planner</div>
          <h1 className="ds-title">{view === "user" ? "Your planning behavior" : "Platform behavior"}</h1>
        </div>
        {isAdmin && (
          <div className="roletoggle" role="group" aria-label="View">
            <button aria-pressed={view === "user"} onClick={() => setView("user")}>My dashboard</button>
            <button aria-pressed={view === "admin"} onClick={() => setView("admin")}>Platform</button>
          </div>
        )}
      </div>

      {loading && <div className="ds-loading">Loading…</div>}

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
              spark={spark(data.weekly)}
            />
            <KpiTile
              label="Recipe variety"
              value={`${data.uniqueRecipes} of ${data.totalMealsPlanned}`}
              delta={`${data.varietyBand} variety`}
            />
            <KpiTile
              label="Avg rating"
              value={data.ratingCount ? `${data.avgRating}★` : "—"}
              delta={`across ${data.ratingCount} ratings`}
              empty={!data.ratingCount}
              emptyText="No ratings yet"
            />
            <KpiTile
              label="Avg planned kcal /serving"
              value={data.avgCalories ?? "—"}
              delta={data.avgCalories
                ? `P ${data.avgProteinG}g · F ${data.avgFatG}g · C ${data.avgCarbsG}g`
                : `${data.recipesWithNutrition}/${data.recipesPlanned} recipes analyzed`}
              empty={data.avgCalories === null}
              emptyText={`${data.recipesWithNutrition}/${data.recipesPlanned} recipes analyzed`}
            />

            <div className="card col-8">
              <h3>Meals planned per week, by slot</h3>
              <div className="sub">From scheduled days × meal type</div>
              <div className="scroll-x"><StackedWeeklyChart weekly={data.weekly} /></div>
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
              <CategoryDonut data={data.categoryMix} />
            </div>

            <div className="card col-6">
              <h3>Most-planned recipes</h3>
              <div className="sub">Repetition, told plainly</div>
              <TopRecipesBar data={data.topRecipes} />
            </div>

            <div className="card col-6">
              <h3>Planned nutrition drift</h3>
              <div className="sub">Avg kcal/serving · analyzed recipes only</div>
              <NutritionTrendLine weekly={data.weekly} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
