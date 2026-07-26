import React, { useEffect, useState } from "react";
import { useGetUserByIdQuery, useUpdateUserMutation } from "../../../api/userApi";
import inputHelper from "../../../helper/inputHelper";
import toastNotify from "../../../helper/toastNotify";
import apiResponse from "../../../interfaces/apiResponseModel";
const avatarImg = require("../../../img/avatar-img.png");

const emptyInputs = {
  id: "", name: "", email: "", phoneNumber: "",
  imageUrl: "", city: "", country: "", socialMedia: "", gender: "",
};

interface Props { userId: string; }

const ProfileTab: React.FC<Props> = ({ userId }) => {
  const { data } = useGetUserByIdQuery(userId);
  const [updateUser] = useUpdateUserMutation();
  const [userInputs, setUserInputs] = useState(emptyInputs);
  const [imgUrl, setImgUrl] = useState<any>("");
  const [imgStore, setImgStore] = useState<any>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data && data.result) {
      const r = data.result;
      setUserInputs({
        id: r.id, name: r.name, email: r.email, phoneNumber: r.phoneNumber,
        city: r.city, country: r.country, socialMedia: r.socialMedia,
        gender: r.gender, imageUrl: r.imageUrl,
      });
      setImgUrl(r.imageUrl);
    }
  }, [data]);

  const handleUserInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setUserInputs(inputHelper(e, userInputs));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const imgType = file.type.split("/")[1];
    const valid = ["jpeg", "jpg", "png"].includes(imgType);
    if (file.size > 1000 * 1024) {
      setImgStore("");
      toastNotify("File must be less then 1 MB", "error");
      return;
    }
    if (!valid) {
      setImgStore("");
      toastNotify("File must be in jpeg, jpg, or png", "error");
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    setImgStore(file);
    reader.onload = (ev) => setImgUrl(ev.target?.result as string);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    if (!imgStore) {
      toastNotify("Please upload an image", "error");
      setLoading(false);
      return;
    }
    const splitImg = imgUrl.split(",")[1];
    const payload = {
      id: userId, name: userInputs.name, email: userInputs.email,
      phoneNumber: userInputs.phoneNumber, imageUrl: splitImg,
      city: userInputs.city, country: userInputs.country,
      socialMedia: userInputs.socialMedia, gender: userInputs.gender,
    };
    const response: apiResponse = await updateUser({ data: payload, id: userId });
    if (response.error) toastNotify(response.error.data.title, "error");
    else toastNotify("Successfully update user", "success");
    setLoading(false);
  };

  return (
    <div className="ds-card">
      <h3>Personal info</h3>
      <div className="sub">Update your account details</div>
      <img className="ds-avatar" src={imgUrl || avatarImg} alt="avatar" />
      <form className="ds-form" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="ds-row">
          <input type="text" placeholder="Name" name="name" value={userInputs.name} onChange={handleUserInput} />
          <input type="email" placeholder="Email" name="email" value={userInputs.email} onChange={handleUserInput} />
        </div>
        <div className="ds-row">
          <input type="text" placeholder="City" name="city" value={userInputs.city} onChange={handleUserInput} />
          <input type="text" placeholder="Country" name="country" value={userInputs.country} onChange={handleUserInput} />
        </div>
        <input type="text" placeholder="Social Media" name="socialMedia" value={userInputs.socialMedia} onChange={handleUserInput} />
        <input type="tel" placeholder="Phone Number" name="phoneNumber" value={userInputs.phoneNumber} onChange={handleUserInput} />
        <div className="ds-row">
          <input type="file" onChange={handleFileChange} />
          <select name="gender" value={userInputs.gender} onChange={handleUserInput}>
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <button className="ds-submit" type="submit" disabled={loading}>
          {loading ? "Updating…" : "Update"}
        </button>
      </form>
    </div>
  );
};

export default ProfileTab;
