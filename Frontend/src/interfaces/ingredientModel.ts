import recipeModel from "./recipeModel";

export default interface ingredientModel {
    id?: number;
    name: string;
    description?: string;
    unit?: string;
    createdAt?: string;
    updatedAt?: string;
    recipeId?: number;
}