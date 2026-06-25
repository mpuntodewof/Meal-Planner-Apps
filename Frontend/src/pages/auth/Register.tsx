import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import inputHelper from "../../helper/inputHelper";
import { useRegisterMutation } from "../../api/authApi";
import { Roles } from "../../interfaces/enum";
import toastNotify from "../../helper/toastNotify";
import Loader from "../../components/sub-comp/Loader";
import apiResponse from "../../interfaces/apiResponseModel";

let bgImg = require("../../img/Food-bg.jpg");

function Register() {
  const [register] = useRegisterMutation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userInput, setUserInput] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tempData = inputHelper(e, userInput);
    setUserInput(tempData);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const response: apiResponse = await register({
      name: userInput.name,
      email: userInput.email,
      password: userInput.password,
      role: Roles.USER,
    });

    if (response.data) {
      toastNotify("Successfully registered!");
      navigate("/login");
    } else if (response.error) {
      toastNotify("Registrasi tidak berhasil!", "error");
      console.log(response);
    }

    setLoading(false);
  }

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
                    Register
                  </h5>
                  <div className="card-body">
                    <div className="billing-address-form">
                      <form action="index.html" onSubmit={handleSubmit}>
                        <p>
                          <input
                            className="form-control"
                            type="text"
                            placeholder="Enter Name"
                            required
                            name="name"
                            value={userInput.name}
                            onChange={handleUserInput}
                          />
                        </p>
                        <p>
                          <input
                            className="form-control"
                            type="email"
                            placeholder="Enter Email"
                            required
                            name="email"
                            value={userInput.email}
                            onChange={handleUserInput}
                          />
                        </p>
                        <p>
                          <input
                            className="form-control"
                            type="password"
                            name="password"
                            placeholder="Enter Password"
                            required
                            value={userInput.password}
                            onChange={handleUserInput}
                          />
                        </p>
                        <div className="d-flex justify-content-center mb-3 mt-4">
                          <button
                            type="submit"
                            className="boxed-btn"
                            style={{ width: "150px" }}
                          >
                            Register
                          </button>
                          <button
                            className="boxed-btn text-center ml-1"
                            onClick={() => navigate("/login")}
                            style={{ width: "150px", backgroundColor: "grey" }}
                          >
                            Login
                          </button>
                        </div>
                        <p className="text-center mt-3">
                          <a
                            onClick={() => navigate("/")}
                            style={{ color: "grey" }}
                          >
                            Back to Home
                          </a>
                        </p>
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

export default Register;
