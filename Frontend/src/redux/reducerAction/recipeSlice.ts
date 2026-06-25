import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    recipe: [],
    search: ""
};

export const recipeSlice = createSlice({
    name: "Recipe",
    initialState: initialState, 
    reducers: {
        setRecipe: (state, action) => {
            state.recipe = action.payload;
        },
        setSearchRecipe: (state, action) => {
            state.search = action.payload;
        },
    }
});

export const { setRecipe, setSearchRecipe } = recipeSlice.actions;
export const recipeReducer = recipeSlice.reducer;