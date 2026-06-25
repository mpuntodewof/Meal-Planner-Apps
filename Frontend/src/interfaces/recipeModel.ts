import ingredientModel from "./ingredientModel";
import instructionModel from "./instructionModel";

export default interface recipeModel {
    id: number;
    name: string;
    description: string;
    cookingTime: string;
    serviceSize: string;
    imageUrl?: string;
    videoUrl?: string;
    userId: string;
    categoriesId: number | null;
    createdAt: string;
    updatedAt: string;
    isFavorited: boolean;
    ingredients: ingredientModel[];
    instructions: instructionModel[];
}