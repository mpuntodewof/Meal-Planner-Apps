export interface WeeklyPoint {
  weekLabel: string;
  weekStart: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  snack: number;
  other: number;
  totalMeals: number;
  avgCalories: number | null;
}

export interface NameCount {
  name: string;
  count: number;
}

export interface DashboardSummary {
  totalMealsPlanned: number;
  uniqueRecipes: number;
  varietyScore: number;
  varietyBand: "Low" | "Balanced" | "High";
  avgRating: number;
  ratingCount: number;
  avgCalories: number | null;
  avgProteinG: number;
  avgFatG: number;
  avgCarbsG: number;
  recipesPlanned: number;
  recipesWithNutrition: number;
  weekly: WeeklyPoint[];
  categoryMix: NameCount[];
  topRecipes: NameCount[];
  insightLine: string;
  hasData: boolean;
}

export interface AdminDashboard extends DashboardSummary {
  weeklyActiveUsers: number;
  recipesCreated: number;
  newUsers: number;
}
