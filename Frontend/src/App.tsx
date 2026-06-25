import React, { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLoggedInUser } from './redux/reducerAction/userAuthSlice';

import AddProduct from './pages/product/AddProduct';
import SingleProduct from './pages/product/SingleProduct';
import Header from './components/Header';
import Footer from './components/Footer';
import Product from './pages/product/Product';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import jwt_decode from "jwt-decode";
import userModel from './interfaces/userModel';
import ProductCatalog from './pages/product/ProductCatalog';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import UserProfile from './pages/auth/UserProfile';
import MealPlanner from './pages/mealPlan/MealPlanner';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const localToken = localStorage.getItem("token");
    if (localToken) {
      const { id, name, email, role }: userModel = jwt_decode(localToken);
      dispatch(setLoggedInUser({ id, name, email, role }));
    }
  }, []);

  return (
    <div className="App">
      {/* <> */}
        {/* <Header /> */}
        <Routes>
          <Route path="/" element={
            <>
              <Header />
              <Home />
              <Footer />
            </>
          } />

          <Route path="/product" element={<Product />} />
          <Route path="/addProduct" element={<AddProduct />} />
          <Route path="/addProduct/:id" element={<AddProduct />} />
          <Route path="/singleProduct/:recipeId" element={<SingleProduct />} />
          <Route path="/productCatalog" element={<ProductCatalog />} />

          <Route path="/mealPlan" element={<MealPlanner />} />

          <Route path="/login" element={
            <>
              <Login />
            </>
          } />

          <Route path="/register" element={<Register />} />
          <Route path="/forgotPassword" element={<ForgotPassword />} />
          <Route path="/resetPassword" element={<ResetPassword />} />

          <Route path="/userProfile/:userId" element={<UserProfile />} />
        </Routes>
      {/* </> */}
    </div>
  );
}

export default App;
