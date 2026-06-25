import React, { useEffect, useState } from 'react'
import Footer from '../../components/Footer'
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import userModel from '../../interfaces/userModel';
import { RootState } from '../../redux/store/storeRedux';
import { emptyUserState, setLoggedInUser } from "../../redux/reducerAction/userAuthSlice";
import { Roles } from '../../interfaces/enum';
import styled from 'styled-components';
import { useGetFavRecipeByUserIdQuery, useGetUserByIdQuery, useUpdateUserMutation } from '../../api/userApi';
import { Loader } from '../../components/sub-comp';
import { Nav, Tab } from 'react-bootstrap';
import inputHelper from '../../helper/inputHelper';
import toastNotify from '../../helper/toastNotify';
import apiResponse from '../../interfaces/apiResponseModel';
import favoriteModel from '../../interfaces/favoriteModel';

let avatarImg = require("../../img/avatar-img.png");
let logoImg = require("../../img/food-re-logo.png");
let cardImg = require("../../img/dessert-img.jpg");

const userInputData = {
    id: "",
    name: "",
    email: "",
    phoneNumber: "",
    imageUrl: "",
    city: "",
    country: "",
    socialMedia: "",
    gender: ""
};

function UserProfile() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [scroll, setScroll] = useState(false);
    const { userId } = useParams();
    const { data, isLoading } = useGetUserByIdQuery(userId);
    const { data: favoriteRecipes, isLoading: favLoading } = useGetFavRecipeByUserIdQuery(userId);
    const [updateUser] = useUpdateUserMutation();
    const [userInputs, setUserInputs] = useState(userInputData);
    const [imgUrl, setImgUrl] = useState<any>("");
    const [imgStore, setImgStore] = useState<any>();
    const [loading, setLoading] = useState(false);
    const [favRecipes, setFavRecipes] = useState<favoriteModel[]>([]);

    const Li = styled.li`
        font-size: 18px
    `;


    useEffect(() => {
        if(!isLoading) {
            setFavRecipes(favoriteRecipes.result.$values);
        }
    }, [favoriteRecipes]);

    console.log(favoriteRecipes);

    const userData: userModel = useSelector(
        (state: RootState) => state.userAuthStore
    );

    const handleLogout = () => {
        localStorage.removeItem("token");
        dispatch(setLoggedInUser({ ...emptyUserState }));
        navigate("/");
    };

    useEffect(() => {
        if (data && data.result) {
            const tempData = {
                id: data.result.id,
                name: data.result.name,
                email: data.result.email,
                phoneNumber: data.result.phoneNumber,
                city: data.result.city,
                country: data.result.country,
                socialMedia: data.result.socialMedia,
                gender: data.result.gender,
                imageUrl: data.result.imageUrl
            };
            setUserInputs(tempData);
            setImgUrl(data.result.imageUrl);
        }
    }, [data]);

    const handleUserInput = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const tempData = inputHelper(e, userInputs);
        setUserInputs(tempData);
    };

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

        const payload = {
            id: userId,
            name: userInputs.name,
            email: userInputs.email,
            phoneNumber: userInputs.phoneNumber,
            imageUrl: splitImg,
            city: userInputs.city,
            country: userInputs.country,
            socialMedia: userInputs.socialMedia,
            gender: userInputs.gender
        };

        console.log(userId);

        if (userId) {
            const response: apiResponse = await updateUser({ data: payload, id: userId });

            if (response.error) {
                toastNotify(response.error.data.title, "error");
            } else {
                toastNotify("Successfully update user", "success");
            }

            if (response) {
                setLoading(false);
            }
        }

        setLoading(false);
    }

    return (
        <>
            {!isLoading ? (
                <>
                    <div className="user-profile-header">
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-12 col-sm-12 text-center">
                                    <div className="site-logo">
                                        <a onClick={() => navigate("/")}>
                                            <img src={logoImg} alt="" style={{ padding: 0, height: '70px' }} />
                                        </a>
                                    </div>

                                    <div className="main-menu-wrap">
                                        <nav className="main-menu">
                                            <ul>
                                                <Li>
                                                    <a className="mobile-hide search-bar-icon" href="#">
                                                        <i className="fas fa-search"></i>
                                                    </a>
                                                </Li>
                                                <Li className="current-List-item">
                                                    <a onClick={() => navigate("/")}>Home</a>
                                                </Li>
                                                <Li>
                                                    <a onClick={() => navigate("/productCatalog")}>Recipe</a>
                                                </Li>
                                                <Li>
                                                    <a href="news.html">News</a>
                                                </Li>
                                                <Li>
                                                    <a href="#">About</a>
                                                </Li>

                                                {userData.role == Roles.ADMIN && (
                                                    <Li>
                                                        <a href="#">Pages</a>
                                                        <ul className="sub-menu">
                                                            <Li>
                                                                <a onClick={() => navigate("/addProduct")}>Create Recipe</a>
                                                            </Li>
                                                            <Li>
                                                                <a href="404.html">404 page</a>
                                                            </Li>

                                                        </ul>
                                                    </Li>
                                                )}
                                                <Li>
                                                    {userData.id && (
                                                        <>
                                                            <div className="header-icons">
                                                                <a>Welcome, {userData.email}</a>
                                                                <ul className="sub-menu">
                                                                    <li>
                                                                        <a onClick={() => navigate("/addProduct")}>Create Recipe</a>
                                                                    </li>
                                                                    <li>
                                                                        <a className="btn-area btn-outlined rounded-pill" onClick={handleLogout}>Logout</a>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        </>
                                                    )}

                                                    {!userData.id && (
                                                        <div className="header-icons">
                                                            <a onClick={() => navigate("/login")}>Login</a>
                                                            <a onClick={() => navigate("/register")}>Register</a>
                                                        </div>
                                                    )}
                                                </Li>
                                            </ul>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="contact-from-section mt-150 mb-150">
                        <div className="container">
                            <Tab.Container id="left-tabs-example" defaultActiveKey="first">
                                <div className="row">
                                    <div className="col-lg-4">
                                        <div className="contact-form-wrap">
                                            {
                                                !imgUrl ? (
                                                    <img
                                                        src={avatarImg}
                                                        alt=""
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            textAlign: 'center',
                                                            objectFit: 'contain',
                                                            marginBottom: '40px',
                                                            borderRadius: '50%',
                                                            backgroundImage: 'none !important'
                                                        }}
                                                    />
                                                ) : (
                                                    <img
                                                        src={imgUrl}
                                                        alt=""
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            textAlign: 'center',
                                                            objectFit: 'contain',
                                                            marginBottom: '40px',
                                                            borderRadius: '50%',
                                                            backgroundImage: 'none !important'
                                                        }}
                                                    />
                                                )
                                            }

                                            <div className="contact-form-box">
                                                <h4>
                                                    <i className="fas fa-user"></i> Personal Info
                                                </h4>
                                                <p>
                                                    {data.result.name} <br />
                                                    Join date - {new Date(data.result.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {/* <div className="contact-form-box"></div> */}
                                            <div className="contact-form-box">
                                                <h4><i className="fas fa-address-book"></i> Contact</h4>
                                                <p>Phone: {data.result.phoneNumber} <br /> Email: {data.result.email} <br />  </p>
                                            </div>
                                            <Nav variant="pills" className="flex-column">
                                                <Nav.Item>
                                                    <Nav.Link eventKey="first" ><p>Personal Info Detail</p></Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="second" ><p>Your Collection</p></Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="third" ><p>Favorite Recipes</p></Nav.Link>
                                                </Nav.Item>
                                                <Nav.Item>
                                                    <Nav.Link eventKey="fourth" ><p>Reset Password</p></Nav.Link>
                                                </Nav.Item>
                                            </Nav>
                                        </div>
                                    </div>

                                    <div className="col-lg-8 mb-5 mb-lg-0">
                                        <Tab.Content>
                                            <Tab.Pane eventKey="first">
                                                <div className="form-title">
                                                    <h2>Personal Info Detail</h2>
                                                    {/* <p>your recipe list</p> */}
                                                </div>
                                                <div id="form_status"></div>
                                                <div className="contact-form">
                                                    <form method="POST" encType="multipart/form-data" onSubmit={handleSubmit} id="fruitkha-contact">
                                                        <p>
                                                            <input className="form-group" type="text" placeholder="Name" name="name" id="name" value={userInputs.name} onChange={handleUserInput} />
                                                            <input className="form-group ml-2" type="email" placeholder="Email" name="email" id="email" value={userInputs.email} onChange={handleUserInput} />
                                                        </p>
                                                        <p>
                                                            <input className="form-group" type="text" placeholder="City" name="city" id="city" value={userInputs.city} onChange={handleUserInput} />
                                                            <input className="form-group ml-2" type="text" placeholder="Country" name="country" id="country" value={userInputs.country} onChange={handleUserInput} />
                                                        </p>
                                                        <p>
                                                            <input className="form-group" type="text" placeholder="Social Media" name="socialMedia" id="socialMedia" style={{ width: '99%' }} value={userInputs.socialMedia} onChange={handleUserInput} />
                                                        </p>
                                                        <p>
                                                            <input className="form-group" type="tel" placeholder="Phone Number" name="phoneNumber" id="phoneNumber" style={{ width: '99%' }} value={userInputs.phoneNumber} onChange={handleUserInput} />
                                                        </p>
                                                        <p>
                                                            <input type="file" className="form-group" onChange={handleFileChange} />
                                                            <select aria-label="Default select example"
                                                                name="gender"
                                                                className="form-group selectUserProfile ml-5"
                                                                value={userInputs.gender}
                                                                onChange={handleUserInput}
                                                            >
                                                                <option>Select gender</option>
                                                                <option value="male">Male</option>
                                                                <option value="female">Female</option>
                                                            </select>
                                                        </p>
                                                        <input type="hidden" name="token" value="FsWga4&@f6aw" />
                                                        <p style={{ textAlign: 'center', paddingTop: '20px' }}>
                                                            <input type="submit" value="update" />
                                                        </p>
                                                    </form>
                                                </div>
                                            </Tab.Pane>
                                            <Tab.Pane eventKey="second">
                                                <div className="form-title">
                                                    <h2>Your Own Recipe</h2>
                                                    <p>
                                                        <a onClick={() => navigate("/addProduct")} className="btn btn-success" style={{ color: 'white' }}>
                                                            Create New Recipe
                                                        </a>
                                                    </p>
                                                </div>
                                                <div id="form_status"></div>
                                                <div className="row">
                                                    <div className="profile-recipe-card">
                                                        <img className="card-img-top" src={cardImg} alt="Card image cap" />
                                                        <div className="card-body">
                                                            <h5
                                                                className="card-title"
                                                                style={{
                                                                    textWrap: 'wrap',
                                                                    overflow: 'hidden',
                                                                    display: '-webkit-box', WebkitBoxOrient: "vertical",
                                                                    height: 100
                                                                }}
                                                            >
                                                                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid, fuga quas itaque eveniet beatae optio.
                                                                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid, fuga quas itaque eveniet beatae optio.
                                                            </h5>
                                                            <span
                                                                style={{
                                                                    overflow: 'hidden',
                                                                    display: "-webkit-box",
                                                                    WebkitLineClamp: 4,
                                                                    WebkitBoxOrient: "vertical",
                                                                }}
                                                            >
                                                                <a href="#" className="btn btn-primary">
                                                                    Go somewhere
                                                                </a>
                                                            </span>

                                                        </div>
                                                    </div>
                                                    <div className="profile-recipe-card">
                                                        <img className="card-img-top" src={cardImg} alt="Card image cap" />
                                                        <div className="card-body">
                                                            <h5
                                                                className="card-title"
                                                                style={{
                                                                    textWrap: 'wrap',
                                                                    overflow: 'hidden',
                                                                    display: '-webkit-box', WebkitBoxOrient: "vertical",
                                                                    height: 100
                                                                }}
                                                            >
                                                                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid, fuga quas itaque eveniet beatae optio.
                                                                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid, fuga quas itaque eveniet beatae optio.
                                                            </h5>
                                                            <span
                                                                style={{
                                                                    overflow: 'hidden',
                                                                    display: "-webkit-box",
                                                                    WebkitLineClamp: 4,
                                                                    WebkitBoxOrient: "vertical",
                                                                }}
                                                            >
                                                                <a
                                                                    // onClick={() => navigate(`/singleProduct/${recipe.id}`)}
                                                                    href="#"
                                                                    className="btn btn-primary"

                                                                >
                                                                    Go somewhere
                                                                </a>
                                                            </span>

                                                        </div>
                                                    </div>
                                                    <div className="profile-recipe-card">
                                                        <img className="card-img-top" src={cardImg} alt="" />
                                                        <div className="card-body">
                                                            <h5
                                                                className="card-title"
                                                                style={{
                                                                    textWrap: 'wrap',
                                                                    overflow: 'hidden',
                                                                    display: '-webkit-box', WebkitBoxOrient: "vertical",
                                                                    height: 100
                                                                }}
                                                            >
                                                                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid, fuga quas itaque eveniet beatae optio.
                                                                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Aliquid, fuga quas itaque eveniet beatae optio.
                                                            </h5>
                                                            <span
                                                                style={{
                                                                    overflow: 'hidden',
                                                                    display: "-webkit-box",
                                                                    WebkitLineClamp: 4,
                                                                    WebkitBoxOrient: "vertical",
                                                                }}
                                                            >
                                                                <a
                                                                    // onClick={() => navigate(`/singleProduct/${recipe.id}`)}
                                                                    href="#"
                                                                    className="btn btn-primary"

                                                                >
                                                                    Go somewhere
                                                                </a>
                                                            </span>

                                                        </div>
                                                    </div>
                                                </div>
                                            </Tab.Pane>
                                            <Tab.Pane eventKey="third">
                                                <div className="form-title">
                                                    <h2>Favorite Recipe</h2>
                                                </div>
                                                <div className="row">
                                                    {favRecipes.map((favRecipe: favoriteModel, index: number) => (
                                                        <div className="profile-recipe-card" style={{ marginBottom: '3rem' }}>
                                                            <img className="card-img-top" src={favRecipe.imageUrl} alt="Card image cap" />
                                                            <div className="card-body">
                                                                <h5
                                                                    className="card-title"
                                                                    style={{
                                                                        textWrap: 'wrap',
                                                                        overflow: 'hidden',
                                                                        display: '-webkit-box', 
                                                                        WebkitBoxOrient: "vertical",
                                                                        height: 'fit-content'
                                                                    }}
                                                                >
                                                                    {favRecipe.recipeName}
                                                                </h5>
                                                                <span
                                                                    style={{
                                                                        overflow: 'hidden',
                                                                        display: "-webkit-box",
                                                                        WebkitLineClamp: 4,
                                                                        WebkitBoxOrient: "vertical",
                                                                    }}
                                                                >
                                                                    <a onClick={() => navigate(`/singleProduct/${favRecipe.recipeId}`)} className="btn btn-primary" style={{ color:'white' }}>
                                                                        Detail
                                                                    </a>
                                                                </span>

                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Tab.Pane>
                                            <Tab.Pane eventKey="fourth">
                                                <h2>Reset Password</h2>
                                            </Tab.Pane>
                                        </Tab.Content>
                                    </div>
                                </div>
                            </Tab.Container>

                        </div>
                    </div>

                    <Footer />
                </>
            ) : (<Loader />)}
        </>
    )
}

export default UserProfile;