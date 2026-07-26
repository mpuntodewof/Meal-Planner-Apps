import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetUserDashboardQuery, useGetAdminDashboardQuery } from "../../../api/dashboardApi";
import { DashboardSummary, AdminDashboard, WeeklyPoint, NameCount } from "../../../interfaces/dashboardModel";
import { Roles } from "../../../interfaces/enum";
import InsightLine from "../components/InsightLine";
import KpiTile from "../components/KpiTile";
import StackedWeeklyChart from "../components/StackedWeeklyChart";
import CategoryDonut from "../components/CategoryDonut";
import TopRecipesBar from "../components/TopRecipesBar";
import NutritionTrendLine from "../components/NutritionTrendLine";
import EmptyState from "../components/EmptyState";

const sparkFrom = (vals: number[]): number[] => {
  const max = Math.max(1, ...vals);
  const s = vals.map((v) => v / max);
  return s.some((h) => h > 0) ? s : vals.map(() => 0.12);
};

const arr = <T,>(v: any): T[] => (Array.isArray(v) ? v : v?.$values ?? []);

interface Props {
  userId: string;
  role: string;
}

const OverviewTab: React.FC<Props> = ({ userId, role }) => {
  const navigate = useNavigate();
  const isAdmin = role === Roles.ADMIN;
  const [view, setView] = useState<"user" | "admin">("user");

  const userQ = useGetUserDashboardQuery({ userId, weeks: 6 }, { skip: view !== "user" || !userId });
  const adminQ = useGetAdminDashboardQuery({ weeks: 6 }, { skip: view !== "admin" });

  const loading = view === "user" ? userQ.isLoading : adminQ.isLoading;
  const data: DashboardSummary | AdminDashboard | undefined =
    (view === "user" ? userQ.data?.result : adminQ.data?.result) as any;

  const weekly: WeeklyPoint[] = arr<WeeklyPoint>(data?.weekly);
  const categoryMix: NameCount[] = arr<NameCount>(data?.categoryMix);
  const topRecipes: NameCount[] = arr<NameCount>(data?.topRecipes);

  const mealsSpark = sparkFrom(weekly.map((w) => w.totalMeals));
  const kcalSpark = sparkFrom(weekly.map((w) => w.avgCalories ?? 0));

  return (
    <>
      {isAdmin && (
        <div className="ds-controls">
          <div className="roletoggle" role="group" aria-label="View">
            <button aria-pressed={view === "user"} onClick={() => setView("user")}>My dashboard</button>
            <button aria-pressed={view === "admin"} onClick={() => setView("admin")}>Platform</button>
          </div>
        </div>
      )}

      {loading && <div className="ds-loading">Loading your dashboard…</div>}

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

            <div className="ds-card ds-col-8">
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

            <div className="ds-card ds-col-4">
              <h3>Category mix</h3>
              <div className="sub">What you gravitate toward</div>
              <CategoryDonut data={categoryMix} />
            </div>

            <div className="ds-card ds-col-6">
              <h3>Your most-planned recipes</h3>
              <div className="sub">Repetition is the variety story, told plainly</div>
              <TopRecipesBar data={topRecipes} />
            </div>

            <div className="ds-card ds-col-6">
              <h3>Planned nutrition drift</h3>
              <div className="sub">Avg kcal/serving of planned meals · null-nutrition recipes excluded</div>
              <NutritionTrendLine weekly={weekly} />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default OverviewTab;
