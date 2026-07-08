# OpenRouter + Model Fallback Chain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch the app's LLM calls to OpenRouter (with attribution headers) and add an ordered, config-driven model fallback chain that automatically retries the next model on retryable failures (429 rate-limit, 402 out-of-credit, 5xx), while failing fast on non-retryable errors (400 bad request, 401/403 auth).

**Architecture:** The app already routes all AI calls through `OpenAiClientFactory` (config-driven, OpenAI-compatible; commit `e6776d5`). This plan (1) adds optional OpenRouter attribution headers to the factory, (2) introduces a new `ChatCompletionRunner` helper that owns the fallback loop — it takes an ordered model list and an invocation delegate, tries each model in turn, classifies exceptions as retryable/non-retryable via `ClientResultException.Status`, and logs which model served the request — and (3) rewires `NutritionService` and `AiRecipeService` to call the runner instead of the factory+client directly. Model list comes from `OpenAI:Models` (comma-separated, ordered), falling back to the single `OpenAI:Model` for backward compatibility.

**Tech Stack:** ASP.NET Core 8, OpenAI C# SDK `2.11.0` (`OpenAI.Chat.ChatClient`, `System.ClientModel.ClientResultException` which exposes `.Status`), xUnit (`API.Tests`), Docker Compose (`.env` config).

---

## Design decisions (locked with the user)

1. **Provider:** OpenRouter, `BaseUrl = https://openrouter.ai/api/v1`, with optional attribution headers `HTTP-Referer` + `X-Title`.
2. **Fallback trigger:** retryable failures only — HTTP **429** (rate limit), **402** (payment/credit), and **5xx** (provider errors). Non-retryable — **400** (bad request), **401/403** (auth) — fail fast; trying another model won't help.
3. **Config:** `OpenAI:Models` = comma-separated ordered list (first = primary). If unset/empty, use the single `OpenAI:Model` (default `gpt-4o-mini`). Backward compatible.
4. **Scope:** both `NutritionService` and `AiRecipeService`, via one shared runner.
5. **Observability:** log the model that served each request and each fallback hop.
6. **Testability:** the runner's loop + error classification are unit-tested without real network calls (inject a delegate that throws/returns). Live OpenRouter test happens in the final task with the user's key.

---

## Config reference (verified)

- `docker-compose.yml` already passes `OpenAI__ApiKey`, `OpenAI__BaseUrl`, `OpenAI__Model` from `.env`. We ADD `OpenAI__Models`.
- Services read config via `_config["OpenAI:Model"]` etc. (`AiRecipeService.cs:30`, `NutritionService.cs:29`). Model list read as `_config["OpenAI:Models"]`.
- Factory call sites: `NutritionService.cs:70-74` and `AiRecipeService.cs:53`.
- SDK: `OpenAI 2.11.0`. Errors surface as `System.ClientModel.ClientResultException` with an `int Status` property (the HTTP status). Confirm during Task 2 by reading the exception type in a quick test.

---

## File Structure

**Create:**
- `API/Helpers/ChatCompletionRunner.cs` — the fallback loop + error classification. One responsibility: "run a chat completion across an ordered model list with retry-on-retryable-error."
- `API/Helpers/ModelListParser.cs` — pure helper: parse `OpenAI:Models` / fall back to `OpenAI:Model` into an ordered `List<string>`. (Tiny, pure, unit-tested.)
- `API.Tests/ModelListParserTests.cs`, `API.Tests/ChatCompletionRunnerTests.cs`.

**Modify:**
- `API/Helpers/OpenAiClientFactory.cs` — add optional attribution headers when targeting OpenRouter.
- `API/Helpers/NutritionService.cs` — call the runner.
- `API/Helpers/AiRecipeService.cs` — call the runner.
- `docker-compose.yml` — add `OpenAI__Models` passthrough.
- `.env.example` (create if absent) — document the OpenRouter vars.

---

## Task 1: Model list parser (pure, TDD)

**Files:**
- Create: `API/Helpers/ModelListParser.cs`
- Test: `API.Tests/ModelListParserTests.cs`

- [ ] **Step 1: Write the failing test**

```csharp
using System.Collections.Generic;
using FoodFestAPI.Helpers;
using Xunit;

public class ModelListParserTests
{
    [Fact]
    public void Parse_UsesModelsListWhenPresent()
    {
        var r = ModelListParser.Parse(models: "a, b ,c", singleModel: "z");
        Assert.Equal(new List<string> { "a", "b", "c" }, r);
    }

    [Fact]
    public void Parse_FallsBackToSingleModelWhenListEmpty()
    {
        Assert.Equal(new List<string> { "z" }, ModelListParser.Parse(models: "", singleModel: "z"));
        Assert.Equal(new List<string> { "z" }, ModelListParser.Parse(models: null, singleModel: "z"));
    }

    [Fact]
    public void Parse_DropsBlanksAndTrims()
    {
        Assert.Equal(new List<string> { "a", "b" }, ModelListParser.Parse(models: "a,, ,b,", singleModel: "z"));
    }

    [Fact]
    public void Parse_DefaultsWhenAllEmpty()
    {
        Assert.Equal(new List<string> { "gpt-4o-mini" }, ModelListParser.Parse(models: null, singleModel: null));
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test API.Tests/API.Tests.csproj --filter ModelListParser`
Expected: FAIL — `ModelListParser` not defined.

- [ ] **Step 3: Implement**

```csharp
using System.Collections.Generic;
using System.Linq;

namespace FoodFestAPI.Helpers
{
    // Turns the OpenAI:Models (comma-separated, ordered) config into a priority
    // list. Falls back to the single OpenAI:Model, then to a hardcoded default,
    // so the app always has at least one model to try.
    public static class ModelListParser
    {
        private const string DefaultModel = "gpt-4o-mini";

        public static List<string> Parse(string models, string singleModel)
        {
            if (!string.IsNullOrWhiteSpace(models))
            {
                var list = models
                    .Split(',')
                    .Select(m => m.Trim())
                    .Where(m => m.Length > 0)
                    .ToList();
                if (list.Count > 0)
                    return list;
            }

            if (!string.IsNullOrWhiteSpace(singleModel))
                return new List<string> { singleModel.Trim() };

            return new List<string> { DefaultModel };
        }
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test API.Tests/API.Tests.csproj --filter ModelListParser`
Expected: PASS (4 cases).

- [ ] **Step 5: Commit**

```bash
git add API/Helpers/ModelListParser.cs API.Tests/ModelListParserTests.cs
git commit -m "feat(ai): model-list parser for ordered fallback chain"
```

---

## Task 2: Error classifier + fallback runner (TDD)

**Files:**
- Create: `API/Helpers/ChatCompletionRunner.cs`
- Test: `API.Tests/ChatCompletionRunnerTests.cs`

The runner takes an ordered model list and an async delegate `Func<string, Task<T>>` (given a model id, do the completion and return the parsed result). It tries each model; on a **retryable** exception it logs and advances to the next; on a **non-retryable** exception it rethrows immediately; if all models are exhausted it returns `default(T)` (null for reference types), matching the services' existing "return null on failure" contract.

- [ ] **Step 1: Write the failing test**

```csharp
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using FoodFestAPI.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

public class ChatCompletionRunnerTests
{
    // Helper to build a ClientResultException-like failure by status. We test the
    // classifier via the public IsRetryableStatus and the loop via RunAsync with a
    // delegate that throws a plain exception carrying a status code.
    [Theory]
    [InlineData(429, true)]
    [InlineData(402, true)]
    [InlineData(500, true)]
    [InlineData(503, true)]
    [InlineData(400, false)]
    [InlineData(401, false)]
    [InlineData(403, false)]
    [InlineData(404, false)]
    public void IsRetryableStatus_ClassifiesCorrectly(int status, bool expected)
    {
        Assert.Equal(expected, ChatCompletionRunner.IsRetryableStatus(status));
    }

    [Fact]
    public async Task RunAsync_ReturnsFirstSuccess()
    {
        var runner = new ChatCompletionRunner(NullLogger.Instance);
        var tried = new List<string>();
        var result = await runner.RunAsync(
            new List<string> { "m1", "m2" },
            async (model) => { tried.Add(model); await Task.CompletedTask; return "ok:" + model; });
        Assert.Equal("ok:m1", result);
        Assert.Equal(new List<string> { "m1" }, tried); // stopped after first success
    }

    [Fact]
    public async Task RunAsync_FallsThroughOnRetryable_ThenSucceeds()
    {
        var runner = new ChatCompletionRunner(NullLogger.Instance);
        var tried = new List<string>();
        var result = await runner.RunAsync(
            new List<string> { "m1", "m2" },
            async (model) =>
            {
                tried.Add(model);
                await Task.CompletedTask;
                if (model == "m1") throw new TestStatusException(429);
                return "ok:" + model;
            });
        Assert.Equal("ok:m2", result);
        Assert.Equal(new List<string> { "m1", "m2" }, tried);
    }

    [Fact]
    public async Task RunAsync_RethrowsOnNonRetryable()
    {
        var runner = new ChatCompletionRunner(NullLogger.Instance);
        await Assert.ThrowsAsync<TestStatusException>(() => runner.RunAsync(
            new List<string> { "m1", "m2" },
            async (model) => { await Task.CompletedTask; throw new TestStatusException(400); }));
    }

    [Fact]
    public async Task RunAsync_ReturnsDefaultWhenAllRetryableFail()
    {
        var runner = new ChatCompletionRunner(NullLogger.Instance);
        var result = await runner.RunAsync<string>(
            new List<string> { "m1", "m2" },
            async (model) => { await Task.CompletedTask; throw new TestStatusException(429); });
        Assert.Null(result);
    }
}

// A stand-in exception exposing a Status property so the runner's reflection-free
// classification path can read it in tests (the real path reads
// ClientResultException.Status).
public class TestStatusException : Exception
{
    public int Status { get; }
    public TestStatusException(int status) : base($"status {status}") { Status = status; }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `dotnet test API.Tests/API.Tests.csproj --filter ChatCompletionRunner`
Expected: FAIL — `ChatCompletionRunner` not defined.

- [ ] **Step 3: Implement the runner**

Note on status extraction: the real SDK throws `System.ClientModel.ClientResultException` which has `int Status`. The test throws `TestStatusException` which also has `int Status`. To read either without a hard dependency in the classification path, extract the status by checking for `ClientResultException` first, then any exception exposing an `int Status` property (duck-typed via a tiny helper). Implement:

```csharp
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
                return (int?)(int)prop.GetValue(ex);
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `dotnet test API.Tests/API.Tests.csproj --filter ChatCompletionRunner`
Expected: PASS (all cases — 8 classifier + 4 loop).

- [ ] **Step 5: Commit**

```bash
git add API/Helpers/ChatCompletionRunner.cs API.Tests/ChatCompletionRunnerTests.cs
git commit -m "feat(ai): fallback runner with retryable-error classification"
```

---

## Task 3: OpenRouter attribution headers in the factory

**Files:**
- Modify: `API/Helpers/OpenAiClientFactory.cs`

- [ ] **Step 1: Add optional headers**

The OpenAI SDK `OpenAIClientOptions` does not expose arbitrary default headers directly; use its `AddPolicy` / pipeline is heavy. Simpler and supported: pass the headers via the SDK's `OpenAIClientOptions` is NOT sufficient, so attach them using a lightweight `PipelinePolicy`. Implement a small policy that sets the two headers on every request when values are provided. Replace the file with:

```csharp
using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using OpenAI;
using OpenAI.Chat;

namespace FoodFestAPI.Helpers
{
    // Builds an OpenAI-SDK ChatClient that can target any OpenAI-compatible
    // provider (OpenAI, Groq, Gemini compat, OpenRouter, local Ollama) via config.
    // When a referer/title are supplied (OpenRouter attribution), they are attached
    // as default request headers.
    public static class OpenAiClientFactory
    {
        public static ChatClient CreateChatClient(
            string apiKey, string model, string baseUrl,
            string referer = null, string title = null)
        {
            if (string.IsNullOrWhiteSpace(baseUrl))
                return new ChatClient(model: model, apiKey: apiKey);

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
```

Add `using System.Collections.Generic;` at the top if the build complains about `IReadOnlyList`.

- [ ] **Step 2: Build to verify the SDK API surface compiles**

Run: `dotnet build API/FoodFestAPI.csproj`
Expected: Build succeeded. IF `PipelinePolicy`/`AddPolicy`/`PipelinePosition` signatures differ in SDK 2.11.0 and it does NOT compile, STOP and report the exact compiler error — do not guess. (Fallback if the policy API differs: the headers are optional; a valid alternative is to skip headers entirely and note it, since they are not required for OpenRouter to function. Only do this if the policy approach won't compile after a genuine attempt.)

- [ ] **Step 3: Commit**

```bash
git add API/Helpers/OpenAiClientFactory.cs
git commit -m "feat(ai): optional OpenRouter attribution headers in client factory"
```

---

## Task 4: Wire NutritionService through the runner

**Files:**
- Modify: `API/Helpers/NutritionService.cs`

- [ ] **Step 1: Replace the direct client call with the runner**

In `EstimateAsync`, the current body (lines ~70-118) creates the client and calls `client.CompleteChatAsync` once. Refactor so the "create client for model + complete + parse" logic is the delegate passed to a `ChatCompletionRunner`. Concretely:

1. Read config once near the top of `EstimateAsync` (after the apiKey check):

```csharp
            var baseUrl = _config["OpenAI:BaseUrl"];
            var models = ModelListParser.Parse(_config["OpenAI:Models"], _config["OpenAI:Model"]);
            var referer = _config["OpenAI:Referer"];
            var title = _config["OpenAI:Title"];
```

2. Keep the existing `ingredients`/`userPayload`/`messages`/`options` construction as-is (they don't depend on the model).

3. Replace the single `ChatClient client = ...; ChatCompletion completion = await client.CompleteChatAsync(...);` with a runner call whose delegate builds a per-model client and returns the parsed `NutritionResult`:

```csharp
                var runner = new ChatCompletionRunner(_log);
                var result = await runner.RunAsync<NutritionResult>(models, async (model) =>
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

                    return JsonSerializer.Deserialize<NutritionResult>(
                        raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                });

                if (result == null)
                {
                    _log.LogWarning("Nutrition estimation returned an empty or malformed result.");
                    return null;
                }
                return result;
```

The outer `try/catch (Exception ex) { _log.LogError(...); return null; }` stays — it now also catches a rethrown non-retryable error and preserves the existing "return null" contract so callers are unaffected.

- [ ] **Step 2: Build**

Run: `dotnet build API/FoodFestAPI.csproj`
Expected: Build succeeded. (`_log` is `ILogger<NutritionService>` which is an `ILogger` — passes to the runner fine.)

- [ ] **Step 3: Run the full test suite (nothing regressed)**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: all green (previous suite + Task 1 & 2 tests).

- [ ] **Step 4: Commit**

```bash
git add API/Helpers/NutritionService.cs
git commit -m "feat(ai): route nutrition estimation through model fallback runner"
```

---

## Task 5: Wire AiRecipeService through the runner

**Files:**
- Modify: `API/Helpers/AiRecipeService.cs`

- [ ] **Step 1: Apply the same refactor as Task 4**

In `GenerateAsync`, after the apiKey check add:

```csharp
            var baseUrl = _config["OpenAI:BaseUrl"];
            var models = ModelListParser.Parse(_config["OpenAI:Models"], _config["OpenAI:Model"]);
            var referer = _config["OpenAI:Referer"];
            var title = _config["OpenAI:Title"];
```

Keep `messages`/`options` construction. Replace the single client call with:

```csharp
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
```

Keep the outer `try/catch` returning null.

- [ ] **Step 2: Build**

Run: `dotnet build API/FoodFestAPI.csproj`
Expected: Build succeeded.

- [ ] **Step 3: Full test suite**

Run: `dotnet test API.Tests/API.Tests.csproj`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add API/Helpers/AiRecipeService.cs
git commit -m "feat(ai): route recipe generation through model fallback runner"
```

---

## Task 6: Config passthrough + documentation

**Files:**
- Modify: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Add the new env vars to docker-compose**

In `docker-compose.yml` under the `api` service `environment:` block, after the existing `OpenAI__Model` line, add:

```yaml
      # Ordered, comma-separated fallback chain (first = primary). If set, overrides
      # OpenAI__Model. On 429/402/5xx the next model is tried automatically.
      - OpenAI__Models=${OpenAI__Models:-}
      # OpenRouter attribution (optional; shown in OpenRouter dashboard/rankings).
      - OpenAI__Referer=${OpenAI__Referer:-}
      - OpenAI__Title=${OpenAI__Title:-}
```

- [ ] **Step 2: Create `.env.example` documenting the OpenRouter setup**

```dotenv
# ---- LLM provider (OpenAI-compatible; here: OpenRouter) ----
# Get a key at https://openrouter.ai/keys
OpenAI__ApiKey=sk-or-your-key-here
OpenAI__BaseUrl=https://openrouter.ai/api/v1

# Ordered fallback chain (first = primary). On rate-limit / out-of-credit / 5xx,
# the next model is tried automatically. Overrides OpenAI__Model when set.
OpenAI__Models=openai/gpt-4o-mini,anthropic/claude-3.5-sonnet,meta-llama/llama-3.3-70b-instruct

# Single-model fallback if OpenAI__Models is empty.
OpenAI__Model=openai/gpt-4o-mini

# OpenRouter attribution (optional).
OpenAI__Referer=http://localhost:3000
OpenAI__Title=Meal Planner
```

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "chore(ai): OpenRouter env config + fallback-chain vars"
```

---

## Task 7: Live end-to-end verification against OpenRouter

**Files:** none (config + manual verify).

- [ ] **Step 1: Put real values in `.env`**

The user provides an OpenRouter key. Create/edit `.env` at repo root (gitignored — confirm it is in `.gitignore`; if not, ADD it before writing the key):

```dotenv
OpenAI__ApiKey=sk-or-...            # user-provided
OpenAI__BaseUrl=https://openrouter.ai/api/v1
OpenAI__Models=openai/gpt-4o-mini,meta-llama/llama-3.3-70b-instruct
OpenAI__Referer=http://localhost:3000
OpenAI__Title=Meal Planner
```

- [ ] **Step 2: Rebuild + restart the API**

```bash
docker compose build api
docker compose up -d api
```
Expected: api container Started.

- [ ] **Step 3: Verify recipe generation works via OpenRouter**

```bash
curl -s -X POST "http://localhost:5128/api/recipe/generate" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a quick high-protein breakfast"}' | head -c 600
```
Expected: JSON with a generated recipe (name/ingredients/instructions), `isSuccess:true`. Check `docker compose logs api --tail=20` for the log line "LLM request served by model 'openai/gpt-4o-mini'." confirming the primary model served it.

- [ ] **Step 4: Verify nutrition estimation works via OpenRouter**

Trigger nutrition on an existing recipe:
```bash
curl -s -X POST "http://localhost:5128/api/recipe/1/estimate-nutrition" | head -c 300
```
Then confirm the recipe now has calories:
```bash
docker compose exec -T db mysql -uroot -proot foodfest -e "SELECT Id,Name,Calories,ProteinG FROM Recipes WHERE Id=1;"
```
Expected: `Calories`/`ProteinG` populated (non-null). Log shows which model served it.

- [ ] **Step 5: Verify the fallback path (optional but recommended)**

Temporarily set an INVALID primary model to force a retryable failure and confirm fallback: set `OpenAI__Models=this/does-not-exist,openai/gpt-4o-mini` in `.env`, `docker compose up -d api`, re-run the generate curl. Expected: request still succeeds (served by the second model); logs show model 1 failing retryably then falling back to model 2. Restore the real `.env` afterward. (Note: a non-existent model may return 400 rather than 404/429 — if so, the fallback won't trigger by design. To truly exercise fallback, use a model that returns 402/429, or accept the unit tests as the fallback-correctness evidence and treat this step as best-effort.)

- [ ] **Step 6: Confirm nutrition coverage improves the dashboard**

After estimating nutrition on a few planned recipes, load `/dashboard` (user1) — the "Planned nutrition drift" chart should now render a line instead of the empty state, since `avgCalories` is no longer null. This closes the loop with the dashboard work.

---

## Out of scope

- Proactive balance/credit pre-checking before calls (explicitly rejected: adds latency + a failure point; failure-triggered fallback is more robust).
- OpenRouter's native `models[]` array request (rejected in favor of app-side control + logging).
- Streaming responses, cost tracking, per-user model selection.

## Self-review notes

- Spec coverage: OpenRouter switch (T6/T7 config), attribution headers (T3), ordered model list from env (T1 parser + T6 config), failure-triggered fallback with retryable/non-retryable classification (T2 runner), both services wired (T4, T5), live verification incl. dashboard nutrition loop (T7). All locked decisions map to tasks.
- Placeholder scan: no TBD/"handle errors"/vague steps; every code step has complete code and exact commands.
- Type consistency: `ModelListParser.Parse(string, string) -> List<string>`, `ChatCompletionRunner.IsRetryableStatus(int) -> bool`, `ChatCompletionRunner.RunAsync<T>(List<string>, Func<string,Task<T>>) -> Task<T>`, factory `CreateChatClient(apiKey, model, baseUrl, referer=null, title=null)` — used identically across Tasks 2–5.
- Risk flagged inline: the SDK `PipelinePolicy` API surface (Task 3 Step 2) is the one place to verify-not-guess; a documented no-header fallback exists since headers are optional.
