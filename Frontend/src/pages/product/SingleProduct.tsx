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
              <p style={{ color: "var(--bm-muted)", maxWidth: 800 }}>{data.result.description}</p>
              <div className="row mt-4">
                <div className="col-md-6 mb-4">
                  <div className="bm-card" style={{ padding: 20, height: "100%" }}>
                    <div className="bm-label">Ingredients</div>
                    <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
                      {ingredients.map((ingredient: ingredientModel, index: number) => (
                        <li key={index} style={{ color: "var(--bm-text)", padding: "6px 0", borderBottom: "1px solid var(--bm-border)" }}>
                          <i className="fas fa-check-circle" style={{ color: "var(--bm-accent)" }}></i> {ingredient.name}, {ingredient.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="col-md-6 mb-4">
                  <div className="bm-card" style={{ padding: 20, height: "100%" }}>
                    <div className="bm-label">Steps</div>
                    <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
                      {instructions.map((instruction: instructionModel, index: number) => (
                        <li key={index} style={{ color: "var(--bm-text)", padding: "6px 0", borderBottom: "1px solid var(--bm-border)" }}>
                          Step {instruction.stepNumber}, {instruction.description}
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