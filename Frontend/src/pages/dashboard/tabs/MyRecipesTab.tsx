import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetRecipesByUserIdQuery } from "../../../api/recipeApi";
import EmptyState from "../components/EmptyState";

// API serializes arrays as { $values: [...] } — unwrap at the boundary.
const arr = <T,>(v: any): T[] => (Array.isArray(v) ? v : v?.$values ?? []);

interface RecipeItem { id: number; name: string; imageUrl?: string; }

interface Props { userId: string; }

const MyRecipesTab: React.FC<Props> = ({ userId }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetRecipesByUserIdQuery(userId, { skip: !userId });
  const recipes: RecipeItem[] = arr<RecipeItem>(data?.result);

  if (isLoading) return <div className="ds-loading">Loading your recipes…</div>;

  if (!recipes.length) {
    return (
      <EmptyState
        message="You haven't created any recipes yet."
        ctaLabel="Create New Recipe"
        onCta={() => navigate("/addProduct")}
      />
    );
  }

  return (
    <div className="ds-card">
      <h3>Your recipes</h3>
      <div className="sub">Recipes you've created</div>
      <div className="ds-recipe-grid">
        {recipes.map((r) => (
          <div className="ds-recipe-card" key={r.id}>
            <img src={r.imageUrl || ""} alt={r.name} />
            <div className="ds-recipe-body">
              <h5>{r.name}</h5>
              <a className="ds-recipe-link" onClick={() => navigate(`/singleProduct/${r.id}`)}>Detail</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyRecipesTab;
