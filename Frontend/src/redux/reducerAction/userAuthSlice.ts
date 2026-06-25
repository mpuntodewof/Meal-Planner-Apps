import { createSlice } from "@reduxjs/toolkit";
import userModel from "../../interfaces/userModel";

export const emptyUserState: userModel = {
    id: "",
    name: "",
    email: "",
    role: ""
};

export const userAuthSlice = createSlice({
    name: "userAuth",
    initialState: emptyUserState,
    reducers: {
        setLoggedInUser: (state: any, action) => {
            state.id    = action.payload.id;
            state.name  = action.payload.name;
            state.email = action.payload.email;
            state.role  = action.payload.role;
        },
    },
});

export const { setLoggedInUser } = userAuthSlice.actions;
export const userAuthReducer = userAuthSlice.reducer;