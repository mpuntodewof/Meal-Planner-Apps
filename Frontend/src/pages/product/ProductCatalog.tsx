import React, { useEffect, useState } from 'react';
// import { Footer, Loader, Navbar } from 'rsuite'
import { useAddRemoveFavoriteMutation, useGetFavoriteByUserIdQuery } from '../../api/favoriteApi';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader, Navbar } from '../../components/sub-comp';
import { Button } from 'react-bootstrap';
import storeRedux, { RootState } from '../../redux/store/storeRedux';
import { setFavorite } from '../../redux/reducerAction/favoriteSlice';
import salmon from '../../img/istockphoto-174914813-612x612.jpg';
import Footer from '../../components/Footer';
import userModel from '../../interfaces/userModel';
import favoriteModel from '../../interfaces/favoriteModel';

function ProductCatalog() {
	const userData: userModel = useSelector(
		(state: RootState) => state.userAuthStore
	);
	const favState = useSelector(
		(state: RootState) => state.persistedReducer.favRecipe
	);
	const [favorites, setFavorites] = useState<favoriteModel[]>([]);
	const [liked, setLiked] = useState(false);
	const [pageNumber, setPageNumber] = useState(1);
	const pageSize = 6;
	const { data, isLoading, refetch, isFetching } = useGetFavoriteByUserIdQuery({ userId: userData.id, pageNumber, pageSize });
	const [addRemoveFavorite] = useAddRemoveFavoriteMutation();
	const dispatch = useDispatch();
	const navigate = useNavigate();

	useEffect(() => {
		if (!isLoading && userData.id != null) {
			dispatch(setFavorite(data.result.favoriteRecipes.$values));
			setFavorites(data.result.favoriteRecipes.$values);
		}
	}, [data, isLoading]);

	const favData = {
		favoriteDTOs:
			favorites.map((item, i) => ({
				recipeId: item.recipeId,
				userId: item.userId,
				isFavorited: item.isFavorited
			})).filter(
				(fav) => fav.recipeId !== null && fav.userId !== null
			)
	};

	// post data when page refreshed
	useEffect(() => {
		const postData = async () => {
			try {
				const result = addRemoveFavorite({ data: favData }).unwrap();
				console.log('Success:', result);
			} catch (error) {
				console.error('Failed:', error);
			}
		}

		postData();
	}, [addRemoveFavorite]);

	// console.log({ favorites, data });

	// Insert favRecipe data with time interval
	useEffect(() => {
		const dataInterval = () => {
			try {
				const result = addRemoveFavorite({ data: favData }).unwrap();
				console.log('Success:', result);
			} catch (error) {
				console.error('Failed:', error);
			}
		};

		const postInterval = setInterval(dataInterval, 180000);

		return () => clearInterval(postInterval);
	}, [favData, addRemoveFavorite]);

	const toggleLiked = async (recId: any) => {
		const setIsFav = favorites.map(
			favorites => favorites.recipeId === recId ? {
				...favorites,
				isFavorited: !favorites.isFavorited ? 1 : 0,
				userId: userData.id
			} : favorites
		);

		storeRedux.dispatch(setFavorite(setIsFav));
		setFavorites(setIsFav);
	}

	// === Pagination Section ===
	const totalRecords = data?.result.totalRecords || 0;
	const totalPages = favorites ? Math.ceil(totalRecords / pageSize) : 0;

	const handlePageChange = (newPage: any) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setPageNumber(newPage);
		}

		try {
			const result = addRemoveFavorite({ data: favData }).unwrap();
			console.log('Success:', result);
		} catch (error) {
			console.error('Failed:', error);
		}
	}

	return (
		<>
			{!isLoading && !isFetching ? (
				<>
					<Navbar />

					<div className="breadcrumb-section" style={{ backgroundImage: `url(${salmon})` }}>
						<div className="container">
							<div className="row">
								<div className="col-lg-8 offset-lg-2 text-center">
									<div className="breadcrumb-text">
										<p>Food Recipe Apps</p>
										<h1>Recipe Catalog</h1>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="product-section mt-100 mb-150">
						<div className="container">
							<div className="row">
								{setFavorites.length > 0 ?
									favorites.map((fav: favoriteModel, index: number) => (
										<div className="col-lg-4 col-md-6" key={index}>
											<div className="single-latest-news">
												<a href="single-news.html">
													<div className="latest-news-bg news-bg-1" style={{ backgroundImage: `url(${fav.imageUrl})`, width: "100%", objectFit: "cover" }}></div>
												</a>
												<div className="news-text-box">
													<div className="row">
														<div className="col-lg-8">
															<h3 style={{ textWrap: 'wrap', height: 55, alignContent: 'center' }}>
																{fav.recipeName}
															</h3>
														</div>
														<div className="col-lg-4">
															<Button variant="danger" onClick={() => toggleLiked(fav.recipeId)} style={{ marginLeft: '50px', marginTop: '10px', borderRadius: '50%' }}>
																{
																	fav.isFavorited ? (<i className="fas fa-heart" style={{ color: 'red' }}></i>) : (<i className="fas fa-heart"></i>)
																}
															</Button>
														</div>
													</div>

													<p className="blog-meta">
														<span className="author"><i className="fas fa-user"></i> Recipes Author</span>
														<span className="date"><i className="fas fa-calendar"></i> {fav.createdAt && new Date(fav.createdAt).toLocaleDateString()}</span>
													</p>

													<p
														className="except"
														style={{
															overflow: 'hidden',
															display: "-webkit-box",
															WebkitLineClamp: 4,
															WebkitBoxOrient: "vertical",
															height: 100
														}}
													>
														{fav.description}
													</p>

													<a onClick={() => navigate(`/singleProduct/${fav.recipeId}`)} className="read-more-btn">read more <i className="fas fa-angle-right"></i></a>
												</div>
											</div>
										</div>
									))
									: <Loader />
								}
							</div>

							{/* Pagination Section */}
							<div className="row">
								<div className="container">
									<div className="row">
										<div className="col-lg-12 text-center">
											<div className="pagination-wrap">
												<ul>
													<li>
														<a onClick={() => handlePageChange(pageNumber - 1)}>
															Previous
														</a>
													</li>
													<li>
														<p> Page {pageNumber} of {totalPages} </p>
													</li>
													<li>
														<a onClick={() => handlePageChange(pageNumber + 1)}>
															Next
														</a>
													</li>
												</ul>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<Footer />
				</>
			) : (
				<Loader />
			)}
		</>
	)
}

export default ProductCatalog