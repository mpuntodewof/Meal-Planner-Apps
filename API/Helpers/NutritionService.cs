using System.Text;
using System.Text.Json;
using FoodFestAPI.Models;
using FoodFestAPI.Models.DTO;
using OpenAI.Chat;

namespace FoodFestAPI.Helpers
{
    public class NutritionService : INutritionService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<NutritionService> _log;

        public NutritionService(IConfiguration config, ILogger<NutritionService> log)
        {
            _config = config;
            _log = log;
        }

        // Config-driven so the provider/model can be switched via .env.
        private string Model => _config["OpenAI:Model"] ?? "gpt-4o-mini";

        private const string SystemPrompt =
            "You are a nutrition estimator. Given a recipe name, serving size, and " +
            "ingredient list, estimate the nutrition PER SERVING. Respond with ONLY a " +
            "JSON object (no markdown, no code fences, no prose) of this exact shape: " +
            "{\"calories\":number,\"proteinG\":number,\"fatG\":number,\"carbsG\":number}. " +
            "calories is kilocalories per serving; proteinG, fatG, carbsG are grams per " +
            "serving. Estimate conservatively; if uncertain, give a reasonable midpoint. " +
            "Never return null — always provide numeric estimates.";

        public async Task<NutritionResult> EstimateAsync(Recipe recipe)
        {
            var apiKey = _config["OpenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _log.LogWarning("OpenAI API key not configured; nutrition estimation unavailable.");
                return null;
            }

            try
            {
                // Compact, structured description of the recipe for the model.
                var ingredients = recipe.Ingredients?
                    .Select(i => new { i.Name, i.Unit, i.Description })
                    .ToList();

                var userPayload = JsonSerializer.Serialize(new
                {
                    name = recipe.Name,
                    serviceSize = recipe.ServiceSize,
                    ingredients
                });

                ChatClient client = OpenAiClientFactory.CreateChatClient(apiKey, Model, _config["OpenAI:BaseUrl"]);

                List<ChatMessage> messages =
                [
                    new SystemChatMessage(SystemPrompt),
                    new UserChatMessage(userPayload),
                ];

                // JsonObject response format guarantees the model returns valid JSON.
                ChatCompletionOptions options = new()
                {
                    ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat(),
                };

                ChatCompletion completion = await client.CompleteChatAsync(messages, options);

                var sb = new StringBuilder();
                foreach (var part in completion.Content)
                {
                    if (!string.IsNullOrEmpty(part.Text))
                        sb.Append(part.Text);
                }
                var raw = sb.ToString().Trim();

                // Defensive: strip accidental code fences if present.
                if (raw.StartsWith("```"))
                {
                    int firstBrace = raw.IndexOf('{');
                    int lastBrace = raw.LastIndexOf('}');
                    if (firstBrace >= 0 && lastBrace > firstBrace)
                        raw = raw.Substring(firstBrace, lastBrace - firstBrace + 1);
                }

                var result = JsonSerializer.Deserialize<NutritionResult>(
                    raw,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (result == null)
                {
                    _log.LogWarning("Nutrition estimation returned an empty or malformed result.");
                    return null;
                }

                return result;
            }
            catch (Exception ex)
            {
                _log.LogError($"Nutrition estimation failed: {ex.Message}");
                return null;
            }
        }
    }
}
