using FoodFestAPI.Controllers;
using FoodFestAPI.Models;
using FoodFestAPI.Models.DTO;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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

    // Constructs an AuthController wired to the given (real, in-memory) UserManager.
    // The change-password action only touches the 5th ctor arg (_userManager) and
    // _response, so ctx/userMgr/roleMgr/emailSender are passed null!. The ctor itself
    // reads config["ApiSettings:Secret"], so a minimal real IConfiguration is supplied.
    private static AuthController BuildController(UserManager<AppUser> mgr)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new System.Collections.Generic.Dictionary<string, string?>
            {
                ["ApiSettings:Secret"] = "test-secret-key-for-unit-tests-1234567890"
            })
            .Build();
        return new AuthController(null!, config, null!, null!, mgr, null!);
    }

    [Fact]
    public async Task Controller_changes_password_with_correct_current()
    {
        var mgr = BuildUserManager();
        var user = new AppUser { UserName = "a@b.com", Email = "a@b.com", Name = "A" };
        await mgr.CreateAsync(user, "OldPass1");
        var controller = BuildController(mgr);

        var dto = new ChangePasswordDTO
        {
            Email = "a@b.com",
            CurrentPassword = "OldPass1",
            NewPassword = "NewPass1",
            ConfirmPassword = "NewPass1"
        };

        var actionResult = await controller.ChangePassword(dto);

        var ok = Assert.IsType<OkObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse>(ok.Value);
        Assert.True(response.IsSuccess);
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        Assert.True(await mgr.CheckPasswordAsync(user, "NewPass1"));
    }

    [Fact]
    public async Task Controller_rejects_wrong_current_password()
    {
        var mgr = BuildUserManager();
        var user = new AppUser { UserName = "a@b.com", Email = "a@b.com", Name = "A" };
        await mgr.CreateAsync(user, "OldPass1");
        var controller = BuildController(mgr);

        var dto = new ChangePasswordDTO
        {
            Email = "a@b.com",
            CurrentPassword = "WrongPass",
            NewPassword = "NewPass1",
            ConfirmPassword = "NewPass1"
        };

        var actionResult = await controller.ChangePassword(dto);

        var bad = Assert.IsType<BadRequestObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse>(bad.Value);
        Assert.False(response.IsSuccess);
        Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
        Assert.NotEmpty(response.ErrorMessages);
        Assert.True(await mgr.CheckPasswordAsync(user, "OldPass1"));
    }

    [Fact]
    public async Task Controller_returns_user_not_found_for_unknown_email()
    {
        var mgr = BuildUserManager();
        var controller = BuildController(mgr);

        var dto = new ChangePasswordDTO
        {
            Email = "nobody@x.com",
            CurrentPassword = "OldPass1",
            NewPassword = "NewPass1",
            ConfirmPassword = "NewPass1"
        };

        var actionResult = await controller.ChangePassword(dto);

        var bad = Assert.IsType<BadRequestObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse>(bad.Value);
        Assert.False(response.IsSuccess);
        Assert.Contains("User not found.", response.ErrorMessages);
    }
}
