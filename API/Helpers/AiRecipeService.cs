using System.Text.Json;
using Anthropic;
using Anthropic.Core;
using Anthropic.Models.Messages;
using FoodFestAPI.Models.DTO;

namespace FoodFestAPI.Helpers
{
    public class AiRecipeService : IAiRecipeService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<AiRecipeService> _log;

        public AiRecipeService(IConfiguration config, ILogger<AiRecipeService> log)
        {
            _config = config;
            _log = log;
        }

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
            var apiKey = _config["Anthropic:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _log.LogWarning("Anthropic API key not configured; recipe generation unavailable.");
                return null;
            }

            try
            {
                AnthropicClient client = new(new ClientOptions { ApiKey = apiKey });

                MessageCreateParams parameters = new()
                {
                    Model = "claude-opus-4-8",
                    MaxTokens = 2000,
                    System = SystemPrompt,
                    Messages =
                    [
                        new()
                        {
                            Role = Role.User,
                            Content = prompt,
                        },
                    ],
                };

                var message = await client.Messages.Create(parameters);

                var sb = new System.Text.StringBuilder();
                foreach (var block in message.Content)
                {
                    if (block.TryPickText(out var textBlock) && textBlock is not null)
                        sb.Append(textBlock.Text);
                }
                var raw = sb.ToString().Trim();

                if (raw.StartsWith("```"))
                {
                    int firstBrace = raw.IndexOf('{');
                    int lastBrace = raw.LastIndexOf('}');
                    if (firstBrace >= 0 && lastBrace > firstBrace)
                        raw = raw.Substring(firstBrace, lastBrace - firstBrace + 1);
                }

                var result = JsonSerializer.Deserialize<RecipeGenerateResult>(
                    raw,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

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
