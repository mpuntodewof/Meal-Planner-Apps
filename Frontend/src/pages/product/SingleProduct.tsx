import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { Loader, Navbar } from '../../components/sub-comp';
import { useGetRecipeByIdQuery } from '../../api/recipeApi';
import Footer from '../../components/Footer'
import ingredientModel from '../../interfaces/ingredientModel';
import { useDispatch, useSelector } from 'react-redux';
import instructionModel from '../../interfaces/instructionModel';
import userModel from '../../interfaces/userModel';
import { Roles } from '../../interfaces/enum';
import { RootState } from '../../redux/store/storeRedux';

function SingleProduct() {
  const { recipeId } = useParams();
  const { data, isLoading } = useGetRecipeByIdQuery(recipeId);
  const [ingredients, setIngredient] = useState<ingredientModel[]>([]);
  const [instructions, setInstruction] = useState<instructionModel[]>([]);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userData: userModel = useSelector(
    (state: RootState) => state.userAuthStore
  );

  useEffect(() => {
    if (!isLoading) {
      setIngredient(data.result.ingredients.$values);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      setInstruction(data.result.instructions.$values);
    }
  }, [isLoading]);

  // console.log(data.result.imageUrl);

  return (
    <>
      {!isLoading ? (
        <>
          <Navbar />

          <div className="breadcrumb-section" style={{ position: "relative", backgroundImage: `url(${data.result.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: 320 }}>
            <div className="bm-overlay" />
            <div className="container" style={{ position: "relative" }}>
              <div className="row">
                <div className="col-lg-8 offset-lg-2 text-center">
                  <div className="breadcrumb-text">
                    <h1 style={{ color: "#fff", fontWeight: 900 }}>{data.result.name}</h1>
                    <p style={{ color: "#ffce8a" }}>⏱ {data.result.cookingTime} · 🍽 {data.result.serviceSize} · ★★★★★</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bm-section">
            <div className="container">

              {/* Quick facts — derived from real recipe data */}
              <div className="bm-facts">
                <div className="bm-fact">
                  <div className="bm-fact-ico"><i className="fas fa-clock"></i></div>
                  <div className="bm-fact-val">{data.result.cookingTime || "—"}</div>
                  <div className="bm-fact-lbl">Cooking Time</div>
                </div>
                <div className="bm-fact">
                  <div className="bm-fact-ico"><i className="fas fa-utensils"></i></div>
                  <div className="bm-fact-val">{data.result.serviceSize || "—"}</div>
                  <div className="bm-fact-lbl">Serving Size</div>
                </div>
                <div className="bm-fact">
                  <div className="bm-fact-ico"><i className="fas fa-carrot"></i></div>
                  <div className="bm-fact-val">{ingredients.length}</div>
                  <div className="bm-fact-lbl">Ingredients</div>
                </div>
                <div className="bm-fact">
                  <div className="bm-fact-ico"><i className="fas fa-list-ol"></i></div>
                  <div className="bm-fact-val">{instructions.length}</div>
                  <div className="bm-fact-lbl">Steps</div>
                </div>
              </div>

              {/* Rating + About */}
              <div className="row mb-2 align-items-start">
                <div className="col-md-8 mb-4">
                  <div className="bm-label">About this dish</div>
                  <h2 className="bm-title" style={{ fontSize: 28 }}>{data.result.name}</h2>
                  <p style={{ color: "var(--bm-muted)", maxWidth: 760 }}>{data.result.description}</p>
                  {data.result.createdAt && (
                    <p style={{ color: "var(--bm-faint)", fontSize: 13 }}>
                      <i className="far fa-calendar"></i> Added {new Date(data.result.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  )}
                </div>
                <div className="col-md-4 mb-4">
                  <div className="bm-card" style={{ padding: 20, textAlign: "center" }}>
                    <div style={{ fontSize: 40, fontWeight: 900, color: "var(--bm-text)", lineHeight: 1 }}>4.6</div>
                    <div className="bm-stars" aria-label="4.6 out of 5">★★★★★</div>
                    <div style={{ color: "var(--bm-faint)", fontSize: 12, marginTop: 6 }}>Community rating · 128 reviews</div>
                  </div>
                </div>
              </div>

              <div className="row mt-2">
                <div className="col-md-5 mb-4">
                  <div className="bm-card" style={{ padding: 20, height: "100%" }}>
                    <div className="bm-label">Ingredients</div>
                    <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
                      {ingredients.map((ingredient: ingredientModel, index: number) => (
                        <li key={index} style={{ color: "var(--bm-text)", padding: "8px 0", borderBottom: "1px solid var(--bm-border)" }}>
                          <i className="fas fa-check-circle" style={{ color: "var(--bm-accent)" }}></i> {ingredient.name}{ingredient.description ? `, ${ingredient.description}` : ""}{ingredient.unit ? ` (${ingredient.unit})` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="col-md-7 mb-4">
                  <div className="bm-card" style={{ padding: 20, height: "100%" }}>
                    <div className="bm-label">Cooking Steps</div>
                    <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
                      {instructions.map((instruction: instructionModel, index: number) => (
                        <li key={index} style={{ display: "flex", color: "var(--bm-text)", padding: "10px 0", borderBottom: "1px solid var(--bm-border)" }}>
                          <span className="bm-step-num">{instruction.stepNumber}</span>
                          <span>{instruction.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {userData.role == Roles.ADMIN && (
                <div className="text-center mt-2">
                  <a className="bm-btn bm-btn--outline" style={{ marginRight: 8 }} onClick={() => navigate(`/addProduct/${data.result.id}`)}><i className="fas fa-edit"></i> Edit</a>
                  <a className="bm-btn" style={{ background: "#c0392b" }} onClick={() => navigate(`/addProduct/${data.result.id}`)}><i className="fas fa-trash"></i> Delete</a>
                </div>
              )}
            </div>
          </div>

          <Footer />
        </>
      ) : (<Loader />)}
    </>
  )
}

export default SingleProduct;