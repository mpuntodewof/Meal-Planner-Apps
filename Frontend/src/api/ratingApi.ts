import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const ratingApi = createApi({
  reducerPath: "ratingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5128/api/",
  }),
  tagTypes: ["Rating"],
  endpoints: (builder) => ({
    rateRecipe: builder.mutation({
      query: (data) => ({
        url: "rating",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Rating"],
    }),
    getRatingSummary: builder.query({
      query: (recipeIds) => ({
        url: "rating/summary",
        params: { recipeIds: recipeIds.join(",") },
      }),
      providesTags: ["Rating"],
    }),
    getMyRating: builder.query({
      query: ({ userId, recipeId }) => ({
        url: "rating/mine",
        params: { userId, recipeId },
      }),
      providesTags: ["Rating"],
    }),
  }),
});

export const {
  useRateRecipeMutation,
  useGetRatingSummaryQuery,
  useGetMyRatingQuery,
} = ratingApi;

export default ratingApi;
