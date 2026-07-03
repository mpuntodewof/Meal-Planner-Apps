import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { Loader, Navbar } from '../../components/sub-comp';
import { useGetRecipeByIdQuery } from '../../api/recipeApi';
import Footer from '../../components/Footer'
import ingredientModel from '../../interfaces/ingredientModel';
import { useSelector } from 'react-redux';
import instructionModel from '../../interfaces/instructionModel';
import userModel from '../../interfaces/userModel';
import { Roles } from '../../interfaces/enum';
import { RootState } from '../../redux/store/storeRedux';
import ScheduleMealModal from '../../components/ScheduleMealModal';
import toastNotify from '../../helper/toastNotify';
import { Rate } from "rsuite";
import {
  useGetMyRatingQuery,
  useGetRatingSummaryQuery,
  useRateRecipeMutation,
} from "../../api/ratingApi";

function SingleProduct() {
  const { recipeId } = useParams();
  const { data, isLoading } = useGetRecipeByIdQuery(recipeId);
  const [ingredients, setIngredient] = useState<ingredientModel[]>([]);
  const [instructions, setInstruction] = useState<instructionModel[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const navigate = useNavigate();

  const userData: userModel = useSelector(
    (state: RootState) => state.userAuthStore
  );

  const userId = userData?.id;
  const numericRecipeId = Number(recipeId);

  const { data: myRatingResp } = useGetMyRatingQuery(
    { userId, recipeId: numericRecipeId },
    { skip: !userId || !numericRecipeId }
  );
  const { data: summaryResp } = useGetRatingSummaryQuery(
    numericRecipeId ? [numericRecipeId] : [],
    { skip: !numericRecipeId }
  );
  const [rateRecipe] = useRateRecipeMutation();

  const myStars = myRatingResp?.result?.stars ?? 0;
  const ratingSummary = (summaryResp?.result?.$values ?? []).find(
    (s: any) => s.recipeId === numericRecipeId
  );
  const avgRating = ratingSummary?.average ?? 0;
  const ratingCount = ratingSummary?.count ?? 0;

  useEffect(() => {
    if (!isLoading) {
      setIngredient(data.result.ingredients.$values);
      setInstruction(data.result.instructions.$values);
    }
  }, [isLoading]);

  if (isLoading) return <Loader />;

  const r = data.result;
  const hasNutrition = r.nutritionEstimatedAt != null;
  const kcal = r.calories ?? 0;
  const protein = Number(r.proteinG ?? 0);
  const fat = Number(r.fatG ?? 0);
  const carbs = Number(r.carbsG ?? 0);
  const isAuthenticated = !!userData.id;

  // Scheduling requires an account. Guests are sent to login instead of the modal.
  const handleAddToMealPlan = () => {
    if (!isAuthenticated) {
      toastNotify("Please log in to add meals to your plan", "error");
      navigate("/login");
      return;
    }
    setShowSchedule(true);
  };

  return (
    <>
      <Navbar />

      {/* Hero: dish name only (facts live in the rail to avoid duplication) */}
      <div
        className="breadcrumb-section"
        style={{ position: "relative", backgroundImage: `url(${r.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: 320 }}
      >
        <div className="bm-overlay" />
        <div className="container" style={{ position: "relative" }}>
          <div className="row">
            <div className="col-lg-8 offset-lg-2 text-center">
              <div className="breadcrumb-text">
                <div className="bm-label" style={{ color: "var(--bm-accent)" }}>Recipe</div>
                <h1 style={{ color: "#fff", fontWeight: 900 }}>{r.name}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bm-section">
        <div className="container">
          <div className="row">
            {/* Main content column */}
            <div className="col-md-8 mb-4">
              <div className="bm-label">About this dish</div>
              <h2 className="bm-title" style={{ fontSize: 28 }}>{r.name}</h2>
              <p style={{ color: "var(--bm-muted)", maxWidth: 640, lineHeight: 1.7 }}>{r.description}</p>
              {r.createdAt && (
                <p style={{ color: "var(--bm-faint)", fontSize: 13 }}>
                  <i className="far fa-calendar"></i> Added {new Date(r.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}

              <div className="bm-label" style={{ marginTop: 24 }}>Ingredients</div>
              <ul className="bm-clean-list" style={{ maxWidth: 640 }}>
                {ingredients.map((ingredient: ingredientModel, index: number) => (
                  <li key={index}>
                    <i className="fas fa-check-circle bm-check"></i> {ingredient.name}
                    {ingredient.description ? `, ${ingredient.description}` : ""}
                    {ingredient.unit ? ` (${ingredient.unit})` : ""}
                  </li>
                ))}
              </ul>

              <div className="bm-label" style={{ marginTop: 24 }}>Cooking Steps</div>
              <ul className="bm-clean-list" style={{ maxWidth: 640 }}>
                {instructions.map((instruction: instructionModel, index: number) => (
                  <li key={index} style={{ display: "flex" }}>
                    <span className="bm-step-num">{instruction.stepNumber}</span>
                    <span>{instruction.description}</span>
                  </li>
                ))}
              </ul>

              {userData.role == Roles.ADMIN && (
                <div className="mt-2">
                  <a className="bm-btn bm-btn--outline" style={{ marginRight: 8 }} onClick={() => navigate(`/addProduct/${r.id}`)}><i className="fas fa-edit"></i> Edit</a>
                  <a className="bm-btn" style={{ background: "#c0392b" }} onClick={() => navigate(`/addProduct/${r.id}`)}><i className="fas fa-trash"></i> Delete</a>
                </div>
              )}
            </div>

            {/* Sticky rail: facts + nutrition + CTA */}
            <div className="col-md-4 mb-4">
              <div className="bm-rail">
                <div className="bm-card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="bm-label">Nutrition</div>
                    {hasNutrition && (
                      <span className="bm-kcal-badge"><span className="n">{kcal}</span><span className="u">kcal</span></span>
                    )}
                  </div>

                  {hasNutrition ? (
                    <div className="bm-macro-strip">
                      <div className="bm-macro-chip">
                        <div className="v" style={{ color: "var(--macro-protein)" }}>{protein}g</div>
                        <div className="l">Protein</div>
                        <div className="bar" style={{ background: "var(--macro-protein)" }} />
                      </div>
                      <div className="bm-macro-chip">
                        <div className="v" style={{ color: "var(--macro-fat)" }}>{fat}g</div>
                        <div className="l">Fat</div>
                        <div className="bar" style={{ background: "var(--macro-fat)" }} />
                      </div>
                      <div className="bm-macro-chip">
                        <div className="v" style={{ color: "var(--macro-carbs)" }}>{carbs}g</div>
                        <div className="l">Carbs</div>
                        <div className="bar" style={{ background: "var(--macro-carbs)" }} />
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: "var(--bm-faint)", fontSize: 13, marginTop: 10 }}>Not yet analyzed.</p>
                  )}

                  <div style={{ borderTop: "1px solid var(--bm-border)", marginTop: 16, paddingTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                      <span style={{ color: "var(--bm-faint)" }}>Cook time</span><strong>{r.cookingTime || "—"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                      <span style={{ color: "var(--bm-faint)" }}>Servings</span><strong>{r.serviceSize || "—"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", alignItems: "center" }}>
                      <span style={{ color: "var(--bm-faint)" }}>Rating</span>
                      {userId ? (
                        <Rate
                          value={myStars}
                          max={5}
                          size="sm"
                          onChange={async (value: number) => {
                            try {
                              await rateRecipe({
                                userId,
                                recipeId: numericRecipeId,
                                stars: value,
                              }).unwrap();
                            } catch {
                              // swallow — RTK cache invalidation refetches the summary/my-rating
                            }
                          }}
                        />
                      ) : (
                        <Rate value={avgRating} max={5} size="sm" readOnly />
                      )}
                      <span style={{ color: "var(--bm-faint)", fontSize: 13 }}>
                        {ratingCount > 0 ? `${avgRating} (${ratingCount})` : "No ratings yet"}
                      </span>
                    </div>
                  </div>

                  <a className="bm-btn" style={{ width: "100%", textAlign: "center", marginTop: 14, cursor: "pointer" }} onClick={handleAddToMealPlan}>
                    ＋ Add to Meal Plan
                  </a>
                </div>
                {hasNutrition && (
                  <p className="bm-est-note" style={{ textAlign: "center" }}>AI-estimated per serving</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScheduleMealModal
        show={showSchedule}
        onHide={() => setShowSchedule(false)}
        recipeId={r.id}
        recipeName={r.name}
      />

      <Footer />
    </>
  )
}

export default SingleProduct;
