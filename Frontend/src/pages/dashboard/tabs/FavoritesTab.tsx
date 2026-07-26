import React from "react";
import { useNavigate } from "react-router-dom";
import { useGetFavRecipeByUserIdQuery } from "../../../api/userApi";
import favoriteModel from "../../../interfaces/favoriteModel";
import EmptyState from "../components/EmptyState";

const arr = <T,>(v: any): T[] => (Array.isArray(v) ? v : v?.$values ?? []);

interface Props { userId: string; }

const FavoritesTab: React.FC<Props> = ({ userId }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetFavRecipeByUserIdQuery(userId, { skip: !userId });
  const favs: favoriteModel[] = arr<favoriteModel>(data?.result);

  if (isLoading) return <div className="ds-loading">Loading your favorites…</div>;

  if (!favs.length) {
    return (
      <EmptyState
        message="No favorites yet. Heart a recipe and it shows up here."
        ctaLabel="Browse recipes"
        onCta={() => navigate("/productCatalog")}
      />
    );
  }

  return (
    <div className="ds-card">
      <h3>Favorite recipes</h3>
      <div className="sub">Recipes you've hearted</div>
      <div className="ds-recipe-grid">
        {favs.map((f) => (
          <div className="ds-recipe-card" key={f.favoriteId ?? f.recipeId}>
            <img src={f.imageUrl || ""} alt={f.recipeName || ""} />
            <div className="ds-recipe-body">
              <h5>{f.recipeName}</h5>
              <a className="ds-recipe-link" onClick={() => navigate(`/singleProduct/${f.recipeId}`)}>Detail</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesTab;
