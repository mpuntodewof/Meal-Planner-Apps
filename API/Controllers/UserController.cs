using FoodFestAPI.Data;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models;
using FoodFestAPI.Models.DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Data;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace FoodFestAPI.Controllers
{
    [Route("api/user")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private ApiResponse _response;
        private readonly IImageService _imgService;
        private readonly ILogger<UserController> _log;
        public UserController(ApplicationDbContext ctx, IConfiguration config, IImageService imgService, ILogger<UserController> log)
        {
            _ctx = ctx;
            _response = new ApiResponse();
            _imgService = imgService;
            _log = log;
        }

        [HttpGet("{id}", Name = "userById")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var userId = await _ctx.Users.FirstOrDefaultAsync(x => x.Id == id);

            if (userId == null)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.NotFound;
                return NotFound(_response);
            }

            _response.Result = userId;
            _response.IsSuccess = true;
            _response.StatusCode = HttpStatusCode.OK;
            return Ok(_response);
        }

        [HttpGet("get-favorite-byUserId")]
        public async Task<IActionResult> GetFavRecipeByUserId(string userId)
        {
            try
            {
                var favRecipesQuery = await _ctx.Recipes.Join(
                            _ctx.UserFavorites.Where(uf => uf.UserId == userId),
                            r => r.Id,
                            uf => uf.RecipeId,
                            (r, uf) => new { 
                                UserId = userId,
                                FavoriteId = uf.Id,
                                RecipeId = r.Id,
                                RecipeName = r.Name,
                                ImageUrl = r.ImageUrl,
                                Description = r.Description
                            }).OrderBy(x => x.RecipeId).ToListAsync();

                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
                _response.Result = favRecipesQuery;
                return Ok(_response);
            }
            catch(Exception ex)
            {
                _log.LogInformation($"Internal server error, {ex.Message}");
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessages = new List<string>() { ex.ToString() };
                return StatusCode(500, _response);
            }            
        }

        // PUT api/<UserController>/5
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse>> UpdateUser([FromBody] UserUpdateDTO request, string id)
        {
            try
            {
                var user = await _ctx.Users.FirstOrDefaultAsync(u => u.Id == id);

                if (user != null)
                {
                    if (ModelState.IsValid)
                    {
                        byte[] byteImg = Convert.FromBase64String(request.ImageUrl);
                        var stream = new MemoryStream(byteImg);
                        IFormFile fileResult = new FormFile(stream, 0, stream.Length, "name", "fileName");

                        if (user.ImageUrl != null)
                        {
                            var imgDelete = await _imgService.DeleteImageAsync(fileResult.ToString());
                            var imgResult = await _imgService.AddImageAsync(fileResult);
                            user.ImageUrl = imgResult.Url.ToString();
                        }
                        else
                        {
                            var imgResult = await _imgService.AddImageAsync(fileResult);
                            user.ImageUrl = imgResult.Url.ToString();
                        }

                        user.Name        = request.Name;
                        user.Email       = request.Email;
                        user.Country     = request.Country;
                        user.City        = request.City;
                        user.PhoneNumber = request.PhoneNumber;
                        user.SocialMedia = request.SocialMedia;
                        user.Gender      = request.Gender;
                        await _ctx.SaveChangesAsync();

                        _response.IsSuccess = true;
                        _response.StatusCode = HttpStatusCode.OK;
                    }
                    else
                    {
                        _response.Result = request;
                        _response.StatusCode = HttpStatusCode.BadRequest;
                        _response.IsSuccess = false;
                    }
                }
                else
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.InternalServerError;
                }
            }
            catch(Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode= HttpStatusCode.InternalServerError;
                _response.ErrorMessages = new List<string>() { ex.ToString() };
            }

            return _response;
        }
    }
}
