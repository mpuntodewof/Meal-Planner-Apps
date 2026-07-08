using System.ClientModel;
using System.Text;
using System.Text.Json;
using FoodFestAPI.Models.DTO;
using OpenAI;
using OpenAI.Chat;

namespace FoodFestAPI.Helpers
{
    public interface IAiRecipeService
    {
        // Generates a recipe from a free-text prompt.
        // Returns null if generation is not configured (no API key) or fails.
        Task<RecipeGenerateResult> GenerateAsync(string prompt);
    }

    public class AiRecipeService : IAiRecipeService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<AiRecipeService> _log;

        public AiRecipeService(IConfiguration config, ILogger<AiRecipeService> log)
        {
            _config = config;
            _log = log;
        }

        // Model is config-driven so the provider can be switched via .env without
        // recompiling. Falls back to OpenAI's gpt-4o-mini when not set.
        private string Model => _config["OpenAI:Model"] ?? "gpt-4o-mini";

        private const string SystemPrompt =
            "You are a recipe author. Given the user's request, produce exactly one complete, " +
            "realistic recipe. Respond with ONLY a JSON object (no markdown, no code fences, no prose) " +
            "of this exact shape: " +
            "{\"name\":string,\"description\":string,\"cookingTime\":string,\"serviceSize\":string," +
            "\"ingredient\":[{\"name\":string,\"unit\":string,\"description\":string}]," +
            "\"instructions\":[{\"stepNumber\":number,\"description\":string}]}. " +
            "cookingTime is like \"30 min\". serviceSize is a number of servings as a string like \"2\". " +
            "Provide 3-8 ingredients and 2-8 numbered steps.";

        public async Task<RecipeGenerateResult> GenerateAsync(string prompt)
        {
            var apiKey = _config["OpenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _log.LogWarning("OpenAI API key not configured; recipe generation unavailable.");
                return null;
            }

            var baseUrl = _config["OpenAI:BaseUrl"];
            var models = ModelListParser.Parse(_config["OpenAI:Models"], _config["OpenAI:Model"]);
            var referer = _config["OpenAI:Referer"];
            var title = _config["OpenAI:Title"];

            try
            {
                List<ChatMessage> messages =
                [
                    new SystemChatMessage(SystemPrompt),
                    new UserChatMessage(prompt),
                ];

                // JsonObject response format guarantees the model returns valid JSON.
                ChatCompletionOptions options = new()
                {
                    ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat(),
                };

                var runner = new ChatCompletionRunner(_log);
                var result = await runner.RunAsync<RecipeGenerateResult>(models, async (model) =>
                {
                    ChatClient client = OpenAiClientFactory.CreateChatClient(apiKey, model, baseUrl, referer, title);
                    ChatCompletion completion = await client.CompleteChatAsync(messages, options);

                    var sb = new StringBuilder();
                    foreach (var part in completion.Content)
                        if (!string.IsNullOrEmpty(part.Text)) sb.Append(part.Text);
                    var raw = sb.ToString().Trim();

                    if (raw.StartsWith("```"))
                    {
                        int firstBrace = raw.IndexOf('{');
                        int lastBrace = raw.LastIndexOf('}');
                        if (firstBrace >= 0 && lastBrace > firstBrace)
                            raw = raw.Substring(firstBrace, lastBrace - firstBrace + 1);
                    }

                    return JsonSerializer.Deserialize<RecipeGenerateResult>(
                        raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                });

                if (result == null || string.IsNullOrWhiteSpace(result.Name))
                {
                    _log.LogWarning("Recipe generation returned an empty or malformed result.");
                    return null;
                }

                return result;
            }
            catch (Exception ex)
            {
                _log.LogError($"Recipe generation failed: {ex.Message}");
                return null;
            }
        }
    }
}
