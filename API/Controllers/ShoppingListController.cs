using FoodFestAPI.Data;
using FoodFestAPI.Helpers;
using FoodFestAPI.Models;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace FoodFestAPI.Controllers
{
    [Route("api/shoppingList")]
    [ApiController]
    public class ShoppingListController : ControllerBase
    {
        private readonly ApplicationDbContext _ctx;
        private ApiResponse _response;
        private readonly ILogger<ShoppingListController> _log;

        public ShoppingListController(ApplicationDbContext ctx, ILogger<ShoppingListController> log)
        {
            _ctx = ctx;
            _response = new ApiResponse();
            _log = log;
        }

        // Grocery list for the recipes a user has scheduled within [start, end].
        [HttpGet]
        public async Task<ActionResult<ApiResponse>> Generate(
            [FromQuery] string userId, [FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(userId))
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessages = new List<string>() { "userId is required." };
                    return BadRequest(_response);
                }

                var list = await ShoppingListLogic.GenerateAsync(_ctx, userId, start, end);

                _response.StatusCode = HttpStatusCode.OK;
                _response.IsSuccess = true;
                _response.Result = list; // empty list when nothing scheduled — honest empty state
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _log.LogError($"Internal server error, {ex.Message}");
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessages = new List<string>() { ex.ToString() };
                return StatusCode(500, _response);
            }
        }
    }
}
