namespace FoodFestAPI.Models.DTO
{
    public class GenerateRecipeRequest
    {
        public string Prompt { get; set; }
    }

    public class RecipeGenerateResult
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string CookingTime { get; set; }
        public string ServiceSize { get; set; }
        public List<GenIngredient> Ingredient { get; set; } = new();
        public List<GenInstruction> Instructions { get; set; } = new();
    }

    public class GenIngredient
    {
        public string Name { get; set; }
        public string Unit { get; set; }
        public string Description { get; set; }
    }

    public class GenInstruction
    {
        public int StepNumber { get; set; }
        public string Description { get; set; }
    }

    // Per-serving nutrition estimate returned by the AI nutrition service.
    public class NutritionResult
    {
        public int Calories { get; set; }
        public decimal ProteinG { get; set; }
        public decimal FatG { get; set; }
        public decimal CarbsG { get; set; }
    }
}
