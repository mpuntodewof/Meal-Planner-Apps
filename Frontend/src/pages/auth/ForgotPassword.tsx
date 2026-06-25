import React, { useState } from 'react'
import { Loader } from '../../components/sub-comp';
import inputHelper from '../../helper/inputHelper';
import { useForgotPasswordMutation } from '../../api/authApi';
import apiResponse from '../../interfaces/apiResponseModel';
import toastNotify from '../../helper/toastNotify';
import { useNavigate } from 'react-router-dom';

let cardImg = require("../../img/dessert-img.jpg");
let bgBody = require("../../img/Food-bg.jpg");

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotPassword] = useForgotPasswordMutation();
  const [userInput, setUserInput] = useState({ email: "" });
  const navigate = useNavigate();

  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tempData = inputHelper(e, userInput);
    setUserInput(tempData);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const response: apiResponse = await forgotPassword({ email: userInput.email });

    if (response.data) {
      toastNotify("Reset password has been sent to your email", "success");
      console.log(response);
    } else if (response.error) {
      toastNotify(response.error.data, "error");
      console.log(response);
    }

    setLoading(false);
  };

  // style={{ backgroundImage: `url(${bgBody})` }}

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
                  <h5 className="card-title" style={{ fontFamily: "Poppins", marginTop: "15px" }}>Forgot Password</h5>
                  <div className="card-body">
                    <div className="billing-address-form">
                      <form onSubmit={handleSubmit}>
                        <p>
                          <input
                            type="email"
                            placeholder="your email address here..."
                            name="email"
                            value={userInput.email}
                            onChange={handleUserInput}
                            required
                          />
                        </p>
                        <div className="d-flex justify-content-center mt-4">
                          {error && <p className="text-danger">{error}</p>}
                          <button type="submit" className="boxed-btn" style={{ width: "200px" }}>
                            Send Mail
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

export default ForgotPassword