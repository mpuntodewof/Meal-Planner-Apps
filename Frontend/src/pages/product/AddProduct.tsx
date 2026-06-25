/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react'
import { Navbar } from '../../components/sub-comp';
import Footer from '../../components/Footer';
import toastNotify from '../../helper/toastNotify';
import { useCreateRecipeMutation, useGetRecipeByIdQuery, useGetRecipesQuery, useUpdateRecipeMutation } from '../../api/recipeApi';
import { useNavigate, useParams } from 'react-router-dom';
import inputHelper from '../../helper/inputHelper';
import "rsuite/dist/rsuite.min.css";
import ingredientModel from '../../interfaces/ingredientModel';
import instructionModel from '../../interfaces/instructionModel';
import apiResponse from '../../interfaces/apiResponseModel';
import salmon from '../../img/food-bg-2.webp';

const InstructionData: instructionModel[] = [
  {
    stepNumber: 0,
    description: ""
  }
];

const IngredientData: ingredientModel[] = [
  {
    name: "",
    description: "",
    unit: ""
  }
];

const recipeData = {
  name: "",
  description: "",
  cookingTime: "",
  serviceSize: "",
  imageUrl: "",
  videoUrl: "",
  userId: "",
  // categoriesId: "",
  ingredient: IngredientData,
  instructions: InstructionData
};


export default function AddProduct() {
  const [imgUrl, setImgUrl] = useState<any>("");
  const [imgStore, setImgStore] = useState<any>();
  const [insData, setInstructionData] = useState<any[]>([{ description: "", id: 0 }]);
  const [ingData, setIngredientData] = useState<any[]>([{ name: "", unit: "", description: "", id: 0 }]);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const { data } = useGetRecipeByIdQuery(id);
  const [updateRecipe] = useUpdateRecipeMutation();
  const [createRecipe] = useCreateRecipeMutation();
  const [recipeInputs, setRecipeInputs] = useState(recipeData);
  const navigate = useNavigate();

  useEffect(() => {
    setRecipeInputs(curr => ({ ...curr, instructions: insData }))
  }, [insData]);

  useEffect(() => {
    setRecipeInputs(curr => ({ ...curr, ingredient: ingData }));
  }, [ingData]);

  // Render Recipe Data
  useEffect(() => {
    if (data && data.result) {
      const tempData = {
        name: data.result.name,
        description: data.result.description,
        cookingTime: data.result.cookingTime,
        serviceSize: data.result.serviceSize,
        imageUrl: data.result.imageUrl,
        videoUrl: data.result.videoUrl,
        userId: data.result.userId,
        // categoriesId: data.result.categoriesId,
        ingredient: data.result.ingredients.$values.map((ingredient: ingredientModel) => ({
          id: ingredient.id,
          name: ingredient.name,
          unit: ingredient.unit,
          description: ingredient.description
        })),
        instructions: data.result.instructions.$values.map((instruction: instructionModel) => ({
          id: instruction.id,
          stepNumber: instruction.stepNumber,
          description: instruction.description
        }))
      };
      setRecipeInputs(tempData);
      setIngredientData(tempData.ingredient.length === 0 ? IngredientData : tempData.ingredient);
      setInstructionData(tempData.instructions.length === 0 ? InstructionData : tempData.instructions);
      setImgUrl(data.result.imageUrl);
    }
  }, [data]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];

    if (file) {
      const imgType = file.type.split("/")[1];
      const validImgTypes = ["jpeg", "jpg", "png"];

      const isImageTypeValid = validImgTypes.filter((e) => {
        return e === imgType;
      });

      if (file.size > 1000 * 1024) {
        setImgStore("");
        toastNotify("File must be less then 1 MB", "error");
        return;
      } else if (isImageTypeValid.length === 0) {
        setImgStore("");
        toastNotify("File must be in jpeg, jpg, or png", "error");
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      setImgStore(file);
      reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        setImgUrl(imgUrl);
      }
    }
  };

  const handleRecipeInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const tempData = inputHelper(e, recipeInputs);
    setRecipeInputs(tempData);
  };

  const handleInstructionInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    setInstructionData((curr) => {
      const newArr = [...curr];
      insData[index][e.target.name] = e.target.value;

      return newArr;
    })
  };

  const handleIngredientInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    idx: number,
    type: "name" | "unit" | "description"
  ) => {
    setIngredientData((curr) => {
      const ingArr = [...curr];
      ingData[idx][type] = e.target.value;

      return ingArr;
    })
  }

  const removeInstructionList = (index: number) => {
    const array = [...insData];
    array.splice(index, 1);
    setInstructionData(array);
  }

  const rmIngrdntList = (idx: number) => {
    const array = [...ingData];
    array.splice(idx, 1);
    setIngredientData(array);
  }

  const handleSubmit = async (
    e: any
  ) => {
    e.preventDefault();
    setLoading(true);

    if (!imgStore) {
      toastNotify("Please upload an image", "error");
      setLoading(false);
      return;
    }

    const splitImg = imgUrl.split(",")[1];

    const mapInstructions = insData.map((item, i) => ({
      id: item.id,
      stepNumber: i + 1,
      description: item.description
    }));

    const mapIngredients = ingData.map((item, i) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      unit: item.unimmm,
    }));

    const payload = {
      name: recipeInputs.name,
      description: recipeInputs.description,
      cookingTime: recipeInputs.cookingTime,
      serviceSize: recipeInputs.serviceSize,
      imageUrl: splitImg,
      imageVideo: "",
      instructions: mapInstructions,
      ingredient: mapIngredients,
    };

    if (id) {
      console.log(payload);
      const response: apiResponse = await updateRecipe({ data: payload, id });

      if (response.error != null) {
        toastNotify(response.error.data, "error");
      } else {
        toastNotify("Successfully update recipes", "success");
      }

      if (response) {
        setLoading(false);
        navigate("/");
      }
    } else {
      const response: apiResponse = await createRecipe(payload);

      if (response.error) {
        toastNotify(response.error, "error");
      } else {
        toastNotify("Successfully create recipes", "success");
      }

      if (response) {
        setLoading(false);
        navigate("/");
      }
    }

    setLoading(false);
  }

  return (
    <div>
      <Navbar />

      <div className="breadcrumb-section" style={{ backgroundImage: `url(${salmon})` }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-8 offset-lg-2 text-center">
              <div className="breadcrumb-text">
                <p>Create Recipe Page</p>
                <h1>create your own recipe</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Form Section */}
      <div className="checkout-section mt-150 mb-150">
        <div className="container">
          <form method="post" encType="multipart/form-data" onSubmit={handleSubmit}>
            <div className="checkout-accordion-wrap">
              <div className="accordion" id="accordionExample">
                <div className="row mb-3">
                  <div className="col-lg-7">
                    {/* Recipe Section */}
                    <div className="card single-accordion">
                      <div className="card-header" id="headingOne">
                        <h5 className="mb-0">
                          <button className="btn btn-link" type="button">
                            Recipe
                          </button>
                        </h5>
                      </div>
                      {/* Recipe Form */}
                      <div aria-labelledby="headingOne" data-parent="#accordionExample">
                        <div className="card-body">
                          <div className="billing-address-form">
                            <p>
                              <input
                                type="text"
                                placeholder="Name"
                                className="form-control"
                                name="name"
                                value={recipeInputs.name}
                                onChange={handleRecipeInput}
                              />
                            </p>
                            <p>
                              <input
                                type="text"
                                placeholder="Cooking Time"
                                className="form-control"
                                name="cookingTime"
                                value={recipeInputs.cookingTime}
                                onChange={handleRecipeInput}
                              />
                            </p>
                            <p>
                              <input
                                type="text"
                                placeholder="Service Size"
                                className="form-control"
                                name="serviceSize"
                                value={recipeInputs.serviceSize}
                                onChange={handleRecipeInput}
                              />
                            </p>
                            <p>
                              <textarea
                                className="form-control"
                                name="description"
                                cols={15} rows={4}
                                placeholder="description"
                                value={recipeInputs.description}
                                onChange={handleRecipeInput}
                              />
                            </p>
                            <p>
                              <input type="file" className="form-control mt-3" onChange={handleFileChange} />
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-5">
                    {/* <pre>{JSON.stringify(ingData, null, 2)}</pre> */}
                    {/* Image Perview */}
                    <div className="card single-accordion" style={{ height: "100%" }}>
                      <div className="card-header" id="headingOne">
                        <h5 className="mb-0">
                          <button className="btn btn-link" type="button">
                            Recipe Image Perview
                          </button>
                        </h5>
                      </div>

                      <div aria-labelledby="headingOne" data-parent="#accordionExample">
                        <div className="card-body">
                          <div className="billing-address-form text-center justify-content-center">
                            <img
                              src={imgUrl}
                              style={{ width: "100%", borderRadius: "30px" }} alt=""
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ingredient Section */}
                <div className="card single-accordion">
                  <div className="card-header" id="headingTwo">
                    <h5 className="mb-0">
                      <button className="btn btn-link" type="button" >
                        Ingredient
                      </button>
                    </h5>
                  </div>
                  <div aria-labelledby="headingTwo" data-parent="#accordionExample">
                    <div className="card-body">
                      {ingData.map((ingredient, idx) => {
                        return (
                          <div className="billing-address-form mt-4" key={idx} id="ingredientForm">
                            <div className="row">
                              <div className="form-group col-md-8">
                                <p>
                                  <input
                                    type="hidden"
                                    placeholder="id"
                                    className="form-control"
                                    name="id"
                                    value={recipeInputs.ingredient[idx]?.id}
                                    onChange={handleRecipeInput}
                                    readOnly
                                  />
                                </p>
                                <p>
                                  <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Add ingredient"
                                    name="name"
                                    value={recipeInputs.ingredient[idx]?.name}
                                    onChange={(e) => {
                                      handleIngredientInput(e, idx, "name")
                                    }}
                                  />
                                </p>
                              </div>
                              <div className="form-group col-md-4">
                                <p>
                                  <input
                                    className="form-control"
                                    type="text"
                                    placeholder="Add unit ex: kg,gr,etc..."
                                    name="unit"
                                    value={recipeInputs.ingredient[idx]?.unit}
                                    onChange={(e) => {
                                      handleIngredientInput(e, idx, "unit")
                                    }}
                                  />
                                </p>
                              </div>
                            </div>
                            <p>
                              <textarea
                                className="form-control"
                                name="description"
                                cols={15} rows={2}
                                placeholder="Add your ingredient notes here..."
                                value={recipeInputs.ingredient[idx]?.description}
                                onChange={(e) => {
                                  handleIngredientInput(e, idx, "description")
                                }}
                              />
                            </p>

                            <div className="row justify-content-center">
                              <button
                                type="button"
                                className="btn btn-outline-primary mt-3"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setIngredientData((curr) => [...curr, { name: "", unit: "", description: "" }])
                                }}>
                                Add
                              </button>

                              {ingData.length > 1 && (
                                <button
                                  type="button"
                                  className="btn btn-outline-danger mt-3 ml-2"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    rmIngrdntList(idx)
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Instruction Section */}
                <div className="card single-accordion">
                  <div className="card-header" id="headingTwo">
                    <h5 className="mb-0">
                      <button className="btn btn-link" type="button" >
                        Instructions
                      </button>
                    </h5>
                  </div>
                  <div aria-labelledby="headingTwo" data-parent="#accordionExample">
                    <div className="card-body">
                      {insData.map((instruction, index) => {
                        return (
                          <div className="shipping-address-form mt-4" key={index}>
                            <p>
                              <input
                                type="hidden"
                                placeholder="id"
                                className="form-control"
                                name="id"
                                value={recipeInputs.instructions[index]?.id}
                                onChange={(e) => {
                                  handleInstructionInput(e, index)
                                }}
                                readOnly
                              />
                            </p>
                            <p>
                              <strong>Step Number: {index + 1}</strong>
                            </p>
                            <p>
                              <textarea
                                className="form-control"
                                name="description"
                                cols={5} rows={4}
                                placeholder="Write your instruction here..."
                                value={recipeInputs.instructions[index]?.description}
                                onChange={(e) => {
                                  handleInstructionInput(e, index)
                                }}
                              />
                            </p>

                            <button
                              type="button"
                              className="btn btn-outline-primary mt-3"
                              onClick={(e) => {
                                e.preventDefault();
                                setInstructionData((curr) => [...curr, { description: "" }])
                              }}>
                              Add
                            </button>

                            {insData.length > 1 && (
                              <button
                                type="button"
                                className="btn btn-outline-danger mt-3 ml-2"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeInstructionList(index)
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* <pre>{JSON.stringify(recipeInputs, null, 2)}</pre> */}
            <div className="col-lg-12 mt-4 text-center">
              <a className="boxed-btn text-center mr-2" type="submit" onClick={handleSubmit}>
                {id ? "Update Recipe" : "Create Recipe"}
              </a>
              <a className="boxed-btn text-center mg-4" style={{ backgroundColor: "grey" }} onClick={() => navigate("/")}>back recipes</a>
            </div>
          </form>
        </div>

      </div >

      {/* End Recipe Form Section */}

      < Footer />
    </div >
  );
}
