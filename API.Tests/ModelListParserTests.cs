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
