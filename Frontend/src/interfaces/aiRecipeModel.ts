// Result shape returned by POST /api/recipe/generate (matches the backend RecipeGenerateResult).
// Purpose-built; does NOT reuse the legacy recipeGenerateModel.ts.
export interface AiGenIngredient {
  name: string;
  unit: string;
  description: string;
}

export interface AiGenInstruction {
  stepNumber: number;
  description: string;
}

export default interface aiRecipeModel {
  name: string;
  description: string;
  cookingTime: string;
  serviceSize: string;
  ingredient: AiGenIngredient[];
  instructions: AiGenInstruction[];
}
