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
}
