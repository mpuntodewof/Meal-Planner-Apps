import React, { useEffect, useMemo, useState } from 'react';
// import { Footer, Loader, Navbar } from 'rsuite'
import { useAddRemoveFavoriteMutation, useGetFavoriteByUserIdQuery } from '../../api/favoriteApi';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader, Navbar } from '../../components/sub-comp';
import storeRedux, { RootState } from '../../redux/store/storeRedux';
import { setFavorite } from '../../redux/reducerAction/favoriteSlice';
import salmon from '../../img/istockphoto-174914813-612x612.jpg';
import Footer from '../../components/Footer';
import userModel from '../../interfaces/userModel';
import favoriteModel from '../../interfaces/favoriteModel';
import { Rate } from "rsuite";
import { useGetRatingSummaryQuery } from "../../api/ratingApi";

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
			// Guard against undefined `data` (first load) and `result: null`
			// (API error responses) so an API failure doesn't crash the page.
			const favoriteRecipes = data?.result?.favoriteRecipes?.$values ?? [];
			dispatch(setFavorite(favoriteRecipes));
			setFavorites(favoriteRecipes);
		}
	}, [data, isLoading]);

	const recipeIds = (favorites ?? []).map((f: any) => f.recipeId);
	const { data: ratingSummaryResp } = useGetRatingSummaryQuery(recipeIds, {
		skip: recipeIds.length === 0,
	});
	const ratingSummaries: any[] = ratingSummaryResp?.result?.$values ?? [];

	const favData = useMemo(() => ({
		favoriteDTOs:
			favorites.map((item) => ({
				recipeId: item.recipeId,
				userId: item.userId,
				isFavorited: item.isFavorited
			})).filter(
				(fav) => fav.recipeId !== null && fav.userId !== null
			)
	}), [favorites]);

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
	}, [addRemoveFavorite, favData]);

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

	// Build a windowed list of page items around the current page. Always shows
	// first and last page; inserts "…" ellipsis markers where pages are skipped,
	// so the control never overflows no matter how many pages there are.
	const getPageItems = (current: number, total: number): (number | "…")[] => {
		if (total <= 7) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}
		const items: (number | "…")[] = [1];
		const start = Math.max(2, current - 1);
		const end = Math.min(total - 1, current + 1);
		if (start > 2) items.push("…");
		for (let p = start; p <= end; p++) items.push(p);
		if (end < total - 1) items.push("…");
		items.push(total);
		return items;
	};

	return (
		<>
			{!isLoading && !isFetching ? (
				<>
					<Navbar />

					<div className="breadcrumb-section" style={{ position: "relative", backgroundImage: `url(${salmon})`, backgroundSize: "cover", backgroundPosition: "center" }}>
						<div className="bm-overlay" />
						<div className="container" style={{ position: "relative" }}>
							<div className="row">
								<div className="col-lg-8 offset-lg-2 text-center">
									<div className="breadcrumb-text">
										<p className="bm-label">Food Recipe Apps</p>
										<h1 style={{ color: "#fff", fontWeight: 900 }}>Recipe Catalog</h1>
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
										<div className="col-lg-4 col-md-6 mb-4 d-flex" key={index}>
											<div className="bm-card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
												<div style={{ position: "relative", height: 200 }}>
													<div className="latest-news-bg" style={{ backgroundImage: `url(${fav.imageUrl})`, width: "100%", height: "100%", backgroundSize: "cover", backgroundPosition: "center" }}></div>
													<button className={`bm-heart ${fav.isFavorited ? "bm-heart--on" : ""}`} style={{ position: "absolute", top: 10, right: 10 }} onClick={() => toggleLiked(fav.recipeId)}>
														<i className="fas fa-heart"></i>
													</button>
												</div>
												<div style={{ padding: 16 }}>
													<h3 style={{ fontSize: 18, fontWeight: 700, minHeight: 50 }}>{fav.recipeName}</h3>
													{(() => {
														const s = ratingSummaries.find((x) => x.recipeId === fav.recipeId);
														return (
															<span className="bm-stars" style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}>
																<Rate value={s?.average ?? 0} max={5} size="xs" readOnly />
																{s?.count ? `${s.average} (${s.count})` : ""}
															</span>
														);
													})()}
													<p style={{ color: "var(--bm-faint)", fontSize: 13 }}>
														<i className="fas fa-calendar"></i> {fav.createdAt && new Date(fav.createdAt).toLocaleDateString()}
													</p>
													<p style={{ color: "var(--bm-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", height: 66 }}>{fav.description}</p>
													<a onClick={() => navigate(`/singleProduct/${fav.recipeId}`)} className="bm-btn" style={{ fontSize: 13, padding: "8px 16px" }}>Read more</a>
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
												<ul style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", alignItems: "center", padding: 0 }}>
													<li>
														<a
															style={{
																color: pageNumber <= 1 ? "var(--bm-faint)" : "var(--bm-muted)",
																cursor: pageNumber <= 1 ? "default" : "pointer",
																pointerEvents: pageNumber <= 1 ? "none" : "auto",
																padding: "4px 10px",
															}}
															onClick={() => handlePageChange(pageNumber - 1)}
														>
															‹ Previous
														</a>
													</li>

													{getPageItems(pageNumber, totalPages).map((item, idx) =>
														item === "…" ? (
															<li key={`ellipsis-${idx}`}>
																<span style={{ color: "var(--bm-faint)", padding: "4px 6px" }}>…</span>
															</li>
														) : (
															<li key={item}>
																<a
																	onClick={() => handlePageChange(item)}
																	aria-current={item === pageNumber ? "page" : undefined}
																	className={item === pageNumber ? "bm-btn" : ""}
																	style={{
																		cursor: "pointer",
																		padding: "4px 12px",
																		borderRadius: 6,
																		color: item === pageNumber ? undefined : "var(--bm-muted)",
																		fontWeight: item === pageNumber ? 700 : 400,
																	}}
																>
																	{item}
																</a>
															</li>
														)
													)}

													<li>
														<a
															style={{
																color: pageNumber >= totalPages ? "var(--bm-faint)" : "var(--bm-muted)",
																cursor: pageNumber >= totalPages ? "default" : "pointer",
																pointerEvents: pageNumber >= totalPages ? "none" : "auto",
																padding: "4px 10px",
															}}
															onClick={() => handlePageChange(pageNumber + 1)}
														>
															Next ›
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