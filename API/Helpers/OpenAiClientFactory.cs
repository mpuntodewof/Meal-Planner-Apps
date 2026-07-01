using System.ClientModel;
using OpenAI;
using OpenAI.Chat;

namespace FoodFestAPI.Helpers
{
    // Builds an OpenAI-SDK ChatClient that can target any OpenAI-compatible
    // provider (OpenAI, Groq, Gemini's compat endpoint, OpenRouter, local Ollama)
    // based on config, so the provider is switchable via .env without recompiling.
    //
    // Config keys:
    //   OpenAI:ApiKey  - required
    //   OpenAI:BaseUrl - optional; when set, points the client at that provider
    //                    (e.g. https://api.groq.com/openai/v1). Empty = OpenAI.
    //   OpenAI:Model   - the model id (read by the caller).
    public static class OpenAiClientFactory
    {
        public static ChatClient CreateChatClient(string apiKey, string model, string baseUrl)
        {
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                // Default: OpenAI's own endpoint.
                return new ChatClient(model: model, apiKey: apiKey);
            }

            var options = new OpenAIClientOptions { Endpoint = new Uri(baseUrl) };
            return new ChatClient(model, new ApiKeyCredential(apiKey), options);
        }
    }
}
