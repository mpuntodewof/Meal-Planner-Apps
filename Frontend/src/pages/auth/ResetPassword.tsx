import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import inputHelper from '../../helper/inputHelper';
import { useResetPasswordMutation } from '../../api/authApi';
import apiResponse from '../../interfaces/apiResponseModel';
import { Loader } from '../../components/sub-comp';
import toastNotify from '../../helper/toastNotify';
let cardImg = require("../../img/burger.jpg");

function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [resetPassword] = useResetPasswordMutation();
  const navigate = useNavigate();
  // const [getParams, setGetParams] = useSearchParams();
  const getParams = new URLSearchParams(window.location.search);
  const [error, setError] = useState("");
  const [userInput, setUserInput] = useState({ password: "", confirmPassword: "" });

  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tempData = inputHelper(e, userInput);
    setUserInput(tempData);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      token: getParams.get("token"),
      email: getParams.get("email"),
      password: userInput.password,
      confirmPassword: userInput.confirmPassword
    }

    // if (payload.password != payload.confirmPassword) {
    //   toastNotify("Password and confirm password field not match", "error");
    // }

    const response: apiResponse = await resetPassword(payload);

    if (response.data) {
      toastNotify("Your password has been change", "success");
      console.log(response.data);
    } else if (response.error) {
      toastNotify("Reset password error", "error");
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
                    src={cardImg}
                    alt=""
                    style={{ padding: 0, height: "100%", width: "150%" }}
                  />
                </div>
                <div className="col-md-6 text-center">
                  <h5 className="card-title" style={{ fontFamily: "Poppins", marginTop: "15px" }}>Reset Password</h5>
                  <div className="card-body">
                    <div className="billing-address-form">
                      <form onSubmit={handleSubmit}>
                        <div className="form-group">
                          <p>
                            <input
                              type="password"
                              placeholder="Password"
                              name="password"
                              value={userInput.password}
                              onChange={handleUserInput}
                              required
                            />
                          </p>

                        </div>

                        <p>
                          <input
                            type="password"
                            placeholder="Password Confirmation"
                            name="confirmPassword"
                            value={userInput.confirmPassword}
                            onChange={handleUserInput}
                            required
                          />
                        </p>
                        <div className="d-flex justify-content-center mt-4">
                          {error && <p className="text-danger">{error}</p>}
                          <button type="submit" className="boxed-btn" style={{ width: "200px" }}>
                            Reset Password
                          </button>
                          <a
                            onClick={() => navigate("/")}
                            className="boxed-btn text-center ml-3"
                            style={{ width: "200px", backgroundColor: "grey" }}
                          >
                            Home
                          </a>
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
  )
}

export default ResetPassword