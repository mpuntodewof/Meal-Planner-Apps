using FoodFestAPI.Models;
using FoodFestAPI.Models.DTO;

namespace FoodFestAPI.Helpers
{
    public interface INutritionService
    {
        // Estimates per-serving nutrition for a recipe from its name, serving
        // size and ingredients. Returns null if estimation is not configured
        // (no API key) or fails — callers must not block the save on this.
        Task<NutritionResult> EstimateAsync(Recipe recipe);
    }
}
