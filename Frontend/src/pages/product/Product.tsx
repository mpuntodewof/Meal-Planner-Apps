import React, { useEffect, useState } from 'react'
import { useGetRecipesQuery } from '../../api/recipeApi';
import { Link, useNavigate } from 'react-router-dom';
import recipeModel from '../../interfaces/recipeModel';
import { Loader } from '../../components/sub-comp';
import { useDispatch } from 'react-redux';
import { setRecipe } from '../../redux/reducerAction/recipeSlice';
import imgDef from '../../img/istockphoto-174914813-612x612.jpg';

function Product() {
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

	console.log(recipes);

	if (isLoading) {
		return <Loader />;
	}

	return (
		<div className="product-section mt-100 mb-150">
			<div className="container">
				<div className="row">
					<div className="col-lg-8 offset-lg-2 text-center">
						<div className="section-title">
							<h3><span className="orange-text">Most</span> View Recipes</h3>
							<p>
								Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid, fuga quas itaque eveniet beatae optio.
							</p>
						</div>
					</div>
				</div>

				<div className="row">
					{setRecipes.length > 0 &&
						recipes.map((recipe: recipeModel, index: number) => (
							<div className="col-lg-4 col-md-6 text-center" key={index} style={{ boxSizing: "border-box" }}>
								<div className="single-product-item" style={{ height: "96.3%" }}>
									<div className="product-image" style={{ padding: "0" }}>
										<a onClick={() => navigate(`/singleProduct/${recipe.id}`)}>
											{
												!recipe.imageUrl ? (
													<img src={imgDef} alt="" style={{ width: "100%", height: 350, objectFit: "cover" }} />
												) : (
													<img src={recipe.imageUrl} alt="" style={{ width: "100%", height: "100%" }} />
												)
											}
										</a>
									</div>
									<h3 style={{ textWrap: 'wrap', padding: '10px', height: 70, alignContent: 'center' }}>{recipe.name}</h3>
									<p
										className="product-price p-4"
									>
										<span style={{
											overflow: 'hidden',
											display: "-webkit-box",
											WebkitLineClamp: 4,
											WebkitBoxOrient: "vertical",
											height: 100,
										}}>{recipe.description}</span>
									</p>
									<a onClick={() => navigate(`/singleProduct/${recipe.id}`)} className="cart-btn">View Recipe</a>
								</div>
							</div>
						))}
				</div>
			</div>
		</div >
	)
}

export default Product