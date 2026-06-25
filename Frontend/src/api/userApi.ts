import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5128/api/user/",
  }),
  tagTypes: ["Users"],
  endpoints: (builder) => ({
    getUserById: builder.query({
      query: (id) => ({
        url: `${id}`,
      }),
      providesTags: ["Users"],
    }),
    updateUser: builder.mutation({
      query: ({ data, id }) => ({
        url: `${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Users"],
    }),
    getFavRecipeByUserId: builder.query({
      query: (userId) => ({
        url: `get-favorite-byUserId`,
        params: { userId },
      }),
      providesTags: ["Users"],
    }),
  }),
});

export const {
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useGetFavRecipeByUserIdQuery,
} = userApi;
export default userApi;
