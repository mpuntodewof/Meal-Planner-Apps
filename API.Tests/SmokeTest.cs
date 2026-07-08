using API.Tests;
using Xunit;

public class SmokeTest
{
    [Fact]
    public void Can_create_context_and_seeded_categories_exist()
    {
        var (ctx, conn) = TestDbContextFactory.Create();
        try
        {
            // OnModelCreating seeds 6 categories via HasData.
            Assert.Equal(6, ctx.Categories.Count());
        }
        finally
        {
            conn.Dispose();
        }
    }
}
