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
