import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5128/api/",
  }),
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    getUserDashboard: builder.query({
      query: ({ userId, weeks = 6 }) => ({
        url: "dashboard/user",
        params: { userId, weeks },
      }),
      providesTags: ["Dashboard"],
    }),
    getAdminDashboard: builder.query({
      query: (arg: { weeks?: number } = {}) => ({
        url: "dashboard/admin",
        params: { weeks: arg.weeks ?? 6 },
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetUserDashboardQuery, useGetAdminDashboardQuery } = dashboardApi;
export default dashboardApi;
