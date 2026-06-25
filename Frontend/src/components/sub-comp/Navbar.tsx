/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import userModel from "../../interfaces/userModel";
import { RootState } from "../../redux/store/storeRedux";
import { emptyUserState, setLoggedInUser } from "../../redux/reducerAction/userAuthSlice";
import { Roles } from "../../interfaces/enum";
let logoImg = require("../../img/food-re-logo.png");

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [scroll, setScroll] = useState(false);

  const userData: userModel = useSelector(
    (state: RootState) => state.userAuthStore
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    dispatch(setLoggedInUser({ ...emptyUserState }));
    navigate("/");
  };

  useEffect(() => {
    window.addEventListener("scroll", () => {
      setScroll(window.scrollY > 10);
    });
  });

  return (
    <div className="sticky-wrapper" id="sticker-sticky-wrapper">
      {/* <div className="top-header-area sticky" id="sticker"> */}
      <div className={`top-header-area ${scroll ? "sticky-scroll-down" : "sticky-wrapper"}`}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-sm-12 text-center">
              <div
                className="main-menu-wrap"
                style={{
                  justifyContent: "center",
                  // alignItems: "center", 
                  // display:"flex" 
                }}>
                {/* <!-- logo --> */}
                <div className="site-logo">
                  <a onClick={() => navigate("/")}>
                    <img src={logoImg} alt="" style={{ padding: 0, height: '70px' }} />
                  </a>
                </div>
                {/* <!-- logo --> */}

                {/* <!-- menu start --> */}
                <nav className="main-menu">
                  <ul>
                    <li>
                      <a className="mobile-hide search-bar-icon" href="#">
                        <i className="fas fa-search"></i>
                      </a>
                    </li>
                    <li className="current-list-item">
                      <a onClick={() => navigate("/")}>Home</a>
                    </li>
                    <li>
                      <a onClick={() => navigate("/productCatalog")}>Recipe</a>
                    </li>
                    <li>
                      <a href="news.html">News</a>
                    </li>
                    <li>
                      <a href="#">About</a>
                    </li>

                    {userData.role == Roles.ADMIN && (
                      <li>
                        <a href="#">Pages</a>
                        <ul className="sub-menu">
                          <li>
                            <a onClick={() => navigate("/addProduct")}>Create Recipe</a>
                          </li>
                          <li>
                            <a href="404.html">404 page</a>
                          </li>

                        </ul>
                      </li>
                    )}

                    <li>
                      {userData.id && (
                        <>
                          <div className="header-icons">
                            <li>
                              <a>Welcome, {userData.email}</a>
                              <ul className="sub-menu">
                                <li>
                                  <a onClick={() => navigate("/addProduct")}>Create Recipe</a>
                                </li>
                                <li>
                                  <a onClick={() => navigate(`/userProfile/${userData.id}`)}>User Profile</a>
                                </li>
                                <li>
                                  <a className="btn-area btn-outlined rounded-pill" onClick={handleLogout}>Logout</a>
                                </li>
                              </ul>
                            </li>
                          </div>
                        </>
                      )}

                      {!userData.id && (
                        <div className="header-icons">
                          <a onClick={() => navigate("/login")}>Login</a>
                          <a onClick={() => navigate("/register")}>Register</a>
                        </div>
                      )}
                    </li>
                  </ul>
                </nav>

                {/* <nav className="main-menu">
                  <ul>
                    <li>
                      <div className="header-icons">
                        <a onClick={() => navigate("/login")}>Login</a>
                        <a onClick={() => navigate("/register")}>Register</a>
                      </div>
                    </li>
                  </ul>
                </nav> */}

                <a className="mobile-show search-bar-icon" href="#">
                  <i className="fas fa-search"></i>
                </a>
                <div className="mobile-menu"></div>
                {/* <!-- menu end --> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
