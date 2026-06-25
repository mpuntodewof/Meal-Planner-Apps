import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:5128/api",
    }),
    endpoints: (builder) => ({
        register: builder.mutation({            
            query: (userData) => ({
                url: "auth/register",
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: userData
            }),
        }),
        login: builder.mutation({
            query: (userCredentials) => ({
                url: "auth/login",
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: userCredentials
            }),
        }),
        forgotPassword: builder.mutation({
            query: (email) => ({
                url: "auth/forgot-password",
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: email
            })
        }),
        resetPassword: builder.mutation({
            query: (resetData) => ({
                url: "auth/reset-password",
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: resetData
            })
        })
    }),
});

export const { useRegisterMutation, useLoginMutation, useForgotPasswordMutation, useResetPasswordMutation } = authApi;
export default authApi;