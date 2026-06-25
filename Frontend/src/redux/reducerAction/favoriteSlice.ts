import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  favorite: [],
  search: "",
};

export const favoriteSlice = createSlice({
  name: "Favorites",
  initialState: initialState,
  reducers: {
    setFavorite: (state, action) => {
      state.favorite = action.payload;
    },
    setSearchFavorite: (state, action) => {
      state.search = action.payload;
    },
  },
});

export const { setFavorite, setSearchFavorite } = favoriteSlice.actions;
export const favoriteReducer = favoriteSlice.reducer;
