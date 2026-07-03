namespace FoodFestAPI.Models.DTO
{
    public class RatingRequestDTO
    {
        public string UserId { get; set; }
        public int RecipeId { get; set; }
        public int Stars { get; set; }
    }

    public class RatingSummaryDTO
    {
        public int RecipeId { get; set; }
        public double Average { get; set; }
        public int Count { get; set; }
    }
}
