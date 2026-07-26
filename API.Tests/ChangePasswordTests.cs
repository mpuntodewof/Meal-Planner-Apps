using FoodFestAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

public class ChangePasswordTests
{
    // Builds a minimal UserManager<AppUser> over an in-memory EF store so we can
    // exercise ChangePasswordAsync exactly as the controller does.
    private static UserManager<AppUser> BuildUserManager()
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddDbContext<FoodFestAPI.Data.ApplicationDbContext>(o =>
            o.UseInMemoryDatabase("change-pwd-" + System.Guid.NewGuid()));
        services.AddIdentityCore<AppUser>(o =>
        {
            o.Password.RequireNonAlphanumeric = false;
            o.Password.RequireUppercase = false;
            o.Password.RequiredLength = 6;
        }).AddEntityFrameworkStores<FoodFestAPI.Data.ApplicationDbContext>();
        return services.BuildServiceProvider().GetRequiredService<UserManager<AppUser>>();
    }

    [Fact]
    public async Task Correct_current_password_changes_it()
    {
        var mgr = BuildUserManager();
        var user = new AppUser { UserName = "a@b.com", Email = "a@b.com", Name = "A" };
        await mgr.CreateAsync(user, "OldPass1");

        var result = await mgr.ChangePasswordAsync(user, "OldPass1", "NewPass1");

        Assert.True(result.Succeeded);
        Assert.True(await mgr.CheckPasswordAsync(user, "NewPass1"));
    }

    [Fact]
    public async Task Wrong_current_password_is_rejected()
    {
        var mgr = BuildUserManager();
        var user = new AppUser { UserName = "a@b.com", Email = "a@b.com", Name = "A" };
        await mgr.CreateAsync(user, "OldPass1");

        var result = await mgr.ChangePasswordAsync(user, "WrongPass", "NewPass1");

        Assert.False(result.Succeeded);
        Assert.True(await mgr.CheckPasswordAsync(user, "OldPass1"));
    }
}
