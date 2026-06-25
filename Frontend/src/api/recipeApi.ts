import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const recipeApi = createApi({
  reducerPath: "recipeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5128/api/",
  }),
  tagTypes: ["Recipes"],
  endpoints: (builder) => ({
    getRecipes: builder.query({
      query: () => ({
        url: "recipe",
      }),
      providesTags: ["Recipes"],
    }),
    getRecipeById: builder.query({
      query: (id) => ({
        url: `recipe/${id}`,
      }),
      providesTags: ["Recipes"],
    }),
    createRecipe: builder.mutation({
      query: (data) => ({
        url: "recipe",
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: data,
      }),
      invalidatesTags: ["Recipes"],
    }),
    updateRecipe: builder.mutation({
      query: ({ data, id }) => ({
        url: "recipe/" + id,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Recipes"],
    }),
    deleteRecipe: builder.mutation({
      query: (id) => ({
        url: "recipe/" + id,
        method: "DELETE",
      }),
      invalidatesTags: ["Recipes"],
    }),
    

  }),
});

export const {
  useGetRecipesQuery,
  useGetRecipeByIdQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,  
} = recipeApi;
export default recipeApi;
