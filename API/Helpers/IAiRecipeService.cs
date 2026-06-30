using FoodFestAPI.Models.DTO;

namespace FoodFestAPI.Helpers
{
    public interface IAiRecipeService
    {
        // Generates a recipe from a free-text prompt.
        // Returns null if generation is not configured (no API key) or fails.
        Task<RecipeGenerateResult> GenerateAsync(string prompt);
    }
}
