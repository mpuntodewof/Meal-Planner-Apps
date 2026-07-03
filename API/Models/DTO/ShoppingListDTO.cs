using System.Collections.Generic;

namespace FoodFestAPI.Models.DTO
{
    public class ShoppingListItemDTO
    {
        public string Name { get; set; }              // display name (first-seen casing)
        public List<string> Units { get; set; }       // distinct unit strings across sources
        public List<string> FromRecipes { get; set; } // source recipe names
    }
}
