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
        <div className="bm-label">🍽 Browse</div>
        <h2 className="bm-title">All Recipes</h2>
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
