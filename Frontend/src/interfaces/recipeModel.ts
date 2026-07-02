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
    // AI-estimated per-serving nutrition; null = not yet analyzed.
    calories?: number | null;
    proteinG?: number | null;
    fatG?: number | null;
    carbsG?: number | null;
    nutritionEstimatedAt?: string | null;
    ingredients: ingredientModel[];
    instructions: instructionModel[];
}