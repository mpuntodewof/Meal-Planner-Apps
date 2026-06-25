import recipeModel from "./recipeModel";

export interface mealPlanDaysModel {
    id: number;
    mealPlanId: number;
    date: string;
}

export default interface mealPlanModel {
    id: number;
    planName: string;
    mealType: string;
    startDate: string;
    endDate: string;
    recipeId: number;
    userID: string;
    recipe?: recipeModel;
    mealPlanDays: {
        $values: mealPlanDaysModel[];
    };
}
