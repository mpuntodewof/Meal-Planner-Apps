using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.ClientModel;
using Microsoft.Extensions.Logging;

namespace FoodFestAPI.Helpers
{
    // Runs a chat completion across an ordered list of models, advancing to the
    // next model only on RETRYABLE failures (rate limit / out-of-credit / provider
    // 5xx). Non-retryable failures (bad request, auth) rethrow immediately. If all
    // models fail with retryable errors, returns default(T) (null for ref types),
    // matching the callers' "null = unavailable" contract.
    public class ChatCompletionRunner
    {
        private readonly ILogger _log;

        public ChatCompletionRunner(ILogger log) => _log = log;

        // Retryable: 429 (rate limit), 402 (payment/credit), 5xx (provider errors).
        public static bool IsRetryableStatus(int status) =>
            status == 429 || status == 402 || (status >= 500 && status <= 599);

        // Reads an HTTP status from a thrown exception, whether it's the SDK's
        // ClientResultException or any exception exposing an int Status property.
        // Returns null if no status can be determined (treated as non-retryable).
        private static int? StatusOf(Exception ex)
        {
            if (ex is ClientResultException cre)
                return cre.Status;
            var prop = ex.GetType().GetProperty("Status");
            if (prop != null && prop.PropertyType == typeof(int))
                return (int)prop.GetValue(ex);
            return null;
        }

        public async Task<T> RunAsync<T>(List<string> models, Func<string, Task<T>> invoke)
        {
            for (int i = 0; i < models.Count; i++)
            {
                var model = models[i];
                try
                {
                    var result = await invoke(model);
                    _log.LogInformation("LLM request served by model '{Model}'.", model);
                    return result;
                }
                catch (Exception ex)
                {
                    var status = StatusOf(ex);
                    var retryable = status.HasValue && IsRetryableStatus(status.Value);
                    if (!retryable)
                    {
                        _log.LogError(ex, "LLM request failed non-retryably on model '{Model}' (status {Status}).", model, status);
                        throw;
                    }
                    var hasNext = i < models.Count - 1;
                    _log.LogWarning("Model '{Model}' failed retryably (status {Status}); {Action}.",
                        model, status, hasNext ? $"falling back to '{models[i + 1]}'" : "no more fallbacks");
                }
            }
            return default;
        }
    }
}
