using System;
using System.Collections.Generic;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
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
    //
    // When a referer/title are supplied (OpenRouter attribution) AND a custom
    // baseUrl is set, they are attached as default request headers on every call.
    public static class OpenAiClientFactory
    {
        public static ChatClient CreateChatClient(
            string apiKey, string model, string baseUrl,
            string referer = null, string title = null)
        {
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                // Default: OpenAI's own endpoint.
                return new ChatClient(model: model, apiKey: apiKey);
            }

            var options = new OpenAIClientOptions { Endpoint = new Uri(baseUrl) };

            if (!string.IsNullOrWhiteSpace(referer) || !string.IsNullOrWhiteSpace(title))
                options.AddPolicy(new AttributionHeaderPolicy(referer, title), PipelinePosition.PerCall);

            return new ChatClient(model, new ApiKeyCredential(apiKey), options);
        }

        // Adds OpenRouter attribution headers (HTTP-Referer, X-Title) to each request.
        private sealed class AttributionHeaderPolicy : PipelinePolicy
        {
            private readonly string _referer;
            private readonly string _title;
            public AttributionHeaderPolicy(string referer, string title)
            {
                _referer = referer;
                _title = title;
            }

            private void Apply(PipelineMessage message)
            {
                if (!string.IsNullOrWhiteSpace(_referer))
                    message.Request.Headers.Set("HTTP-Referer", _referer);
                if (!string.IsNullOrWhiteSpace(_title))
                    message.Request.Headers.Set("X-Title", _title);
            }

            public override void Process(PipelineMessage message, IReadOnlyList<PipelinePolicy> pipeline, int index)
            {
                Apply(message);
                ProcessNext(message, pipeline, index);
            }

            public override async ValueTask ProcessAsync(PipelineMessage message, IReadOnlyList<PipelinePolicy> pipeline, int index)
            {
                Apply(message);
                await ProcessNextAsync(message, pipeline, index);
            }
        }
    }
}
