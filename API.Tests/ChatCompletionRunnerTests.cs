using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FoodFestAPI.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

public class ChatCompletionRunnerTests
{
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
        Assert.Equal(new List<string> { "m1" }, tried);
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
        await Assert.ThrowsAsync<TestStatusException>(() => runner.RunAsync<string>(
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

// A stand-in exception exposing an int Status property so the runner's status
// extraction can read it in tests (the real path reads ClientResultException.Status).
public class TestStatusException : Exception
{
    public int Status { get; }
    public TestStatusException(int status) : base($"status {status}") { Status = status; }
}
