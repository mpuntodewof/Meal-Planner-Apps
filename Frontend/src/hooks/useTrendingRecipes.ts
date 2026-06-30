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
