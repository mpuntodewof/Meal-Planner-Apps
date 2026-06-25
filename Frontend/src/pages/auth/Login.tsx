import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jwt_decode from "jwt-decode";
import { useLoginMutation } from "../../api/authApi";
import { useDispatch } from "react-redux";
import { setLoggedInUser } from "../../redux/reducerAction/userAuthSlice";

import inputHelper from "../../helper/inputHelper";
import userModel from "../../interfaces/userModel";
import Loader from "../../components/sub-comp/Loader";
import apiResponse from "../../interfaces/apiResponseModel";
import toastNotify from "../../helper/toastNotify";

let bgImg = require("../../img/Food-bg.jpg");

function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [login] = useLoginMutation();
  const dispatch = useDispatch();
  const [userInput, setUserInput] = useState({
    email: "",
    password: "",
  });

  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tempData = inputHelper(e, userInput);
    setUserInput(tempData);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const response: apiResponse = await login({
      email: userInput.email,
      password: userInput.password,
    });

    if (response.data) {
      const { token } = response.data.result;
      const { id, name, email, role }: userModel = jwt_decode(token);
      localStorage.setItem("token", token);
      dispatch(setLoggedInUser({ id, name, email, role }));
      navigate("/");
    } else if (response.error) {
      toastNotify("Login gagal, silahkan cek kembali username dan password anda !", "error");
      console.log(response);
      // setError(response.error);
    }

    setLoading(false);
  };

  return (
    <>
      {loading && <Loader />}
      <div className="card-bg">
        <div className="container mt-100 mb-100">
          <div className="col-lg-12">
            <div className="card shadow bg-white rounded">
              <div className="row">
                <div className="col-md-6">
                  <img
                    src={bgImg}
                    alt=""
                    style={{ padding: 0, height: "100%", width: "150%" }}
                  />
                </div>
                <div className="col-md-6">
                  <h5
                    className="card-title text-center"
                    style={{ fontFamily: "Poppins", marginTop: "15px" }}
                  >
                    Login Card
                  </h5>
                  <div className="card-body">
                    <div className="billing-address-form">
                      <form action="index.html" onSubmit={handleSubmit}>
                        <p>
                          <input
                            type="email"
                            placeholder="Email"
                            required
                            name="email"
                            value={userInput.email}
                            onChange={handleUserInput}
                          />
                        </p>
                        <p>
                          <input
                            type="password"
                            placeholder="Password"
                            required
                            name="password"
                            value={userInput.password}
                            onChange={handleUserInput}
                          />
                        </p>
                        <div className="mt-2" style={{ marginLeft: '328px' }}>
                          <a onClick={() => navigate("/forgotPassword")}>
                            Forgot Password ?
                          </a>
                        </div>
                        <div className="d-flex justify-content-center mt-4">
                          {error && <p className="text-danger">{error}</p>}
                          <button
                            type="submit"
                            className="boxed-btn text-center"
                            style={{ width: "200px" }}
                          >
                            Login
                          </button>
                          <a
                            onClick={() => navigate("/")}
                            className="boxed-btn text-center ml-3"
                            style={{ width: "200px", backgroundColor: "grey" }}
                          >
                            Home
                          </a>
                        </div>{" "}
                        <br />
                        <div className="d-flex justify-content-center">
                          <p style={{ color: "grey" }}>
                            Dont have any account ? &nbsp;
                            <a onClick={() => navigate("/register")}>
                              Register Here
                            </a> <br />
                          </p>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
