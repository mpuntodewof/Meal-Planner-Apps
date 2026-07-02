using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FoodFestAPI.Models
{
    public class RecipeRating
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }   // AppUser.Id (ASP.NET Identity string)

        [Required]
        public int RecipeId { get; set; }

        [Required]
        public int Stars { get; set; }        // 1–5, validated in the controller

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("RecipeId")]
        public Recipe Recipe { get; set; }
    }
}
