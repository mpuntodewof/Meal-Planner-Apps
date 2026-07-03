import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const shoppingListApi = createApi({
  reducerPath: "shoppingListApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5128/api/",
  }),
  tagTypes: ["ShoppingList"],
  endpoints: (builder) => ({
    generateShoppingList: builder.query({
      query: ({ userId, start, end }) => ({
        url: "shoppingList",
        params: { userId, start, end },
      }),
      providesTags: ["ShoppingList"],
    }),
  }),
});

export const { useGenerateShoppingListQuery } = shoppingListApi;

export default shoppingListApi;
