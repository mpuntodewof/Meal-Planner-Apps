import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const mealPlanApi = createApi({
  reducerPath: "mealPlanApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5128/api/",
  }),
  tagTypes: ["MealPlans"],
  endpoints: (builder) => ({
    getMealPlans: builder.query({
      query: (userId) => ({
        url: "mealPlan",
        params: { userId },
      }),
      providesTags: ["MealPlans"],
    }),
    getMealPlansByRange: builder.query({
      query: ({ userId, start, end }) => ({
        url: "mealPlan/range",
        params: { userId, start, end },
      }),
      providesTags: ["MealPlans"],
    }),
    createMealPlan: builder.mutation({
      query: (data) => ({
        url: "mealPlan",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["MealPlans"],
    }),
    deleteMealPlan: builder.mutation({
      query: ({ id, userId }) => ({
        url: `mealPlan/${id}`,
        method: "DELETE",
        params: { userId },
      }),
      invalidatesTags: ["MealPlans"],
    }),
  }),
});

export const {
  useGetMealPlansQuery,
  useGetMealPlansByRangeQuery,
  useCreateMealPlanMutation,
  useDeleteMealPlanMutation,
} = mealPlanApi;

export default mealPlanApi;
