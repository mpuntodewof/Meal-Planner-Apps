using FoodFestAPI.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace API.Tests;

// Creates an ApplicationDbContext backed by a fresh Sqlite in-memory database.
// The caller must keep the returned connection open for the DB's lifetime and
// dispose it when done. Sqlite enforces unique indexes (unlike the EF InMemory
// provider), so uniqueness constraints are actually exercised by tests.
public static class TestDbContextFactory
{
    public static (ApplicationDbContext ctx, SqliteConnection conn) Create()
    {
        var conn = new SqliteConnection("DataSource=:memory:");
        conn.Open();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlite(conn)
            .Options;

        var ctx = new ApplicationDbContext(options);
        ctx.Database.EnsureCreated();
        return (ctx, conn);
    }
}
