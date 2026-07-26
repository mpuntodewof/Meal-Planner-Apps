import React, { useState } from "react";
import { useChangePasswordMutation } from "../../../api/authApi";
import inputHelper from "../../../helper/inputHelper";
import toastNotify from "../../../helper/toastNotify";
import apiResponse from "../../../interfaces/apiResponseModel";

interface Props { email: string; }

const emptyInputs = { currentPassword: "", newPassword: "", confirmPassword: "" };

const SecurityTab: React.FC<Props> = ({ email }) => {
  const [changePassword] = useChangePasswordMutation();
  const [inputs, setInputs] = useState(emptyInputs);
  const [loading, setLoading] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs(inputHelper(e, inputs));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputs.newPassword !== inputs.confirmPassword) {
      toastNotify("New password and confirmation do not match", "error");
      return;
    }
    setLoading(true);
    const payload = {
      email,
      currentPassword: inputs.currentPassword,
      newPassword: inputs.newPassword,
      confirmPassword: inputs.confirmPassword,
    };
    const response: apiResponse = await changePassword(payload);
    if (response.data) {
      toastNotify("Your password has been changed", "success");
      setInputs(emptyInputs);
    } else {
      toastNotify("Could not change password. Check your current password.", "error");
    }
    setLoading(false);
  };

  return (
    <div className="ds-card">
      <h3>Change password</h3>
      <div className="sub">Update the password for {email}</div>
      <form className="ds-form" onSubmit={handleSubmit}>
        <input type="password" placeholder="Current password" name="currentPassword" value={inputs.currentPassword} onChange={handleInput} required />
        <input type="password" placeholder="New password" name="newPassword" value={inputs.newPassword} onChange={handleInput} required />
        <input type="password" placeholder="Confirm new password" name="confirmPassword" value={inputs.confirmPassword} onChange={handleInput} required />
        <button className="ds-submit" type="submit" disabled={loading}>
          {loading ? "Saving…" : "Change password"}
        </button>
      </form>
    </div>
  );
};

export default SecurityTab;
