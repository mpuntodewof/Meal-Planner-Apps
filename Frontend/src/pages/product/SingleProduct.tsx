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

          <div className="breadcrumb-section" style={{ backgroundImage: `url(${data.result.imageUrl})` }}>
            <div className="container">
              <div className="row">
                <div className="col-lg-8 offset-lg-2 text-center">
                  <div className="breadcrumb-text">
                    <h1>{data.result.name}</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="single-product mt-150 mb-150">
            <div className="container">
              <div className="row">
                <div className="col-md-5">
                  <div className="single-product-img">
                    <img src={data.result.imageUrl} alt="" />
                  </div>
                </div>
                <div className="col-md-7">
                  <div className="single-product-content">
                    <h3>{data.result.description}</h3> <br />
                    <div className="row">
                      <div className="col-4">
                        <p className="single-product-pricing" style={{ fontSize: "25px" }}><span>Cooking Time: </span>{data.result.cookingTime}</p>
                      </div>
                      <div className="col-4">
                        <p className="single-product-pricing" style={{ fontSize: "25px" }}><span>Serving Size: </span>{data.result.serviceSize}</p>
                      </div>
                      <div className="col-4">
                        <p className="single-product-pricing" style={{ fontSize: "25px" }}>
                          <span>Rating: </span>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="single-product mt-150 mb-150">
            <div className="container">
              <div className="row">

                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header" id="headingTwo">
                      <i className="fas fa-solid fa-list-check">
                        <h2 className="text-center">
                          Ingredients
                        </h2>
                      </i><br />
                    </div>
                    <div aria-labelledby="headingTwo" data-parent="#accordionExample">
                      <div className="card-body">
                        {ingredients.map((ingredient: ingredientModel, index: number) => (
                          <ul className="list-group list-group-flush" key={index}>
                            <li key={index} className="list-group-item">
                              <p><i className="fas fa-check-circle"></i>  {ingredient.name}, {ingredient.description}</p>
                            </li>
                          </ul>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card">
                    <div className="card-header" id="headingTwo">
                      <i className="fas fa-solid fa-list-check">
                        <h2 className="text-center">
                          Instructions
                        </h2>
                      </i>
                      <br />
                    </div>
                    <div aria-labelledby="headingTwo" data-parent="#accordionExample">
                      <div className="card-body">
                        {instructions.map((instruction: instructionModel, index: number) => (
                          <ul className="list-group list-group-flush" key={index}>
                            <li key={index} className="list-group-item">
                              Step {instruction.stepNumber}, {instruction.description}
                            </li>
                          </ul>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {userData.role == Roles.ADMIN && (
            <div className="col-lg-12 mt-4 text-center">
              <a className="boxed-btn text-center mr-2 mb-5" type="button" onClick={(() => navigate(`/addProduct/${data.result.id}`))}><i className="fas fa-edit"></i> Edit</a>
              <a className="boxed-btn text-center mr-2 mb-5" type="button" style={{ backgroundColor: "red" }} onClick={(() => navigate(`/addProduct/${data.result.id}`))}><i className="fas fa-delete"></i> Delete</a>
            </div>
          )}

          <Footer />
        </>
      ) : (<Loader />)}
    </>
  )
}

export default SingleProduct;