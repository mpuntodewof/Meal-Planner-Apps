import recipeModel from "./recipeModel";

export default interface instructionModel {
    id?: number;
    stepNumber: number;
    description: string;
    recipeId?: number;
};