using FoodFestAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace FoodFestAPI.Data
{
    // Idempotent seeding of sample recipe data so a freshly-migrated database
    // (e.g. a recreated Docker volume) is never empty. Runs on startup after
    // migrations. Does nothing if recipes already exist.
    public static class DbSeeder
    {
        private const string SeedUserEmail = "seed@foodrecipe.local";

        // Category ids seeded by the AlterReceipeColumnAndCategoriesSeed migration:
        // 1 Dessert, 2 Brunch, 3 Breakfast, 4 Dinner, 5 Lunch, 6 Snack
        private static string Img(string id) =>
            $"https://images.unsplash.com/photo-{id}?w=900&q=70&auto=format&fit=crop";

        public static async Task SeedRecipesAsync(
            ApplicationDbContext ctx,
            UserManager<AppUser> userMgr,
            ILogger logger
        )
        {
            // Idempotent: only seed when there are no recipes at all.
            if (await ctx.Recipes.AnyAsync())
            {
                logger.LogInformation("Recipe seed skipped: recipes already present.");
                return;
            }

            // Ensure the seed user exists (owner of the seeded recipes).
            var seedUser = await userMgr.FindByEmailAsync(SeedUserEmail);
            if (seedUser == null)
            {
                seedUser = new AppUser
                {
                    Name = "Seed Chef",
                    UserName = SeedUserEmail,
                    Email = SeedUserEmail,
                    NormalizedEmail = SeedUserEmail.ToUpper(),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                var created = await userMgr.CreateAsync(seedUser, "seed123");
                if (!created.Succeeded)
                {
                    logger.LogError(
                        "Recipe seed aborted: could not create seed user: {Errors}",
                        string.Join("; ", created.Errors.Select(e => e.Description))
                    );
                    return;
                }
            }

            var now = DateTime.UtcNow;
            foreach (var s in Samples)
            {
                var recipe = new Recipe
                {
                    Name = s.Name,
                    Description = s.Description,
                    CookingTime = s.CookingTime,
                    ServiceSize = s.ServiceSize,
                    ImageUrl = Img(s.Img),
                    VideoUrl = "",
                    UserId = seedUser.Id,
                    CategoriesId = s.CategoriesId,
                    CreatedAt = now,
                    UpdatedAt = now,
                };

                foreach (var ing in s.Ingredients)
                {
                    recipe.Ingredients.Add(new Ingredient
                    {
                        Name = ing.Name,
                        Description = ing.Description,
                        Unit = ing.Unit,
                        CreatedAt = now,
                        UpdatedAt = now,
                    });
                }

                foreach (var step in s.Instructions)
                {
                    recipe.Instructions.Add(new Instructions
                    {
                        StepNumber = step.StepNumber,
                        Description = step.Description,
                    });
                }

                ctx.Recipes.Add(recipe);
            }

            await ctx.SaveChangesAsync();
            logger.LogInformation("Recipe seed complete: {Count} recipes inserted.", Samples.Length);
        }

        private record IngSeed(string Name, string Unit, string Description);
        private record StepSeed(int StepNumber, string Description);
        private record RecipeSeed(
            string Name,
            string Description,
            string CookingTime,
            string ServiceSize,
            string Img,
            int CategoriesId,
            IngSeed[] Ingredients,
            StepSeed[] Instructions
        );

        private static readonly RecipeSeed[] Samples =
        {
            new("Classic Beef Rendang",
                "Slow-cooked Indonesian beef in coconut milk and a rich blend of aromatic spices.",
                "3 hrs", "4", "1604908176997-125f25cc6f3d", 4,
                new[] { new IngSeed("Beef chuck", "kg", "1, cubed"), new IngSeed("Coconut milk", "ml", "800"), new IngSeed("Lemongrass", "stalk", "2, bruised") },
                new[] { new StepSeed(1, "Blend the spice paste and saute until fragrant."), new StepSeed(2, "Add beef and coconut milk; simmer on low for 3 hours until dark and dry.") }),
            new("Grilled Salmon Fillet",
                "Crisp-skinned salmon with lemon and herbs — light and quick.",
                "25 min", "2", "1467003909585-2f8a72700288", 4,
                new[] { new IngSeed("Salmon fillet", "pcs", "2"), new IngSeed("Lemon", "pcs", "1"), new IngSeed("Dill", "tbsp", "2, chopped") },
                new[] { new StepSeed(1, "Season salmon and rest 10 minutes."), new StepSeed(2, "Grill skin-side down 4 min, flip, finish 3 min; squeeze lemon.") }),
            new("Margherita Pizza",
                "Blistered crust, San Marzano tomato, fresh mozzarella and basil.",
                "45 min", "2", "1513104890138-7c749659a591", 5,
                new[] { new IngSeed("Pizza dough", "ball", "1"), new IngSeed("Mozzarella", "g", "150"), new IngSeed("Basil", "leaves", "8") },
                new[] { new StepSeed(1, "Stretch dough and top with sauce and torn mozzarella."), new StepSeed(2, "Bake at max heat 8-10 min; finish with basil.") }),
            new("Chocolate Lava Cake",
                "Warm molten-center chocolate cakes for an easy showstopper dessert.",
                "20 min", "4", "1606313564200-e75d5e30476c", 1,
                new[] { new IngSeed("Dark chocolate", "g", "120"), new IngSeed("Butter", "g", "100"), new IngSeed("Eggs", "pcs", "2") },
                new[] { new StepSeed(1, "Melt chocolate and butter; fold in eggs, sugar, flour."), new StepSeed(2, "Bake at 220C for 9-11 min so centers stay molten.") }),
            new("Avocado Toast",
                "Smashed avocado on sourdough with chili flakes and a soft egg.",
                "10 min", "1", "1541519227354-08fa5d50c44d", 3,
                new[] { new IngSeed("Sourdough", "slice", "2"), new IngSeed("Avocado", "pcs", "1"), new IngSeed("Egg", "pcs", "1") },
                new[] { new StepSeed(1, "Toast bread; smash avocado with lime and salt."), new StepSeed(2, "Top with a soft-poached egg and chili flakes.") }),
            new("Chicken Caesar Salad",
                "Crisp romaine, grilled chicken, parmesan and a creamy Caesar dressing.",
                "20 min", "2", "1550304943-4f24f54ddde9", 5,
                new[] { new IngSeed("Romaine", "head", "1"), new IngSeed("Chicken breast", "pcs", "1, grilled"), new IngSeed("Parmesan", "g", "30") },
                new[] { new StepSeed(1, "Grill and slice the chicken."), new StepSeed(2, "Toss romaine with dressing, croutons and parmesan; top with chicken.") }),
            new("Beef Burger",
                "Juicy smashed beef patty with cheese, lettuce and house sauce.",
                "30 min", "2", "1568901346375-23c9450c58cd", 5,
                new[] { new IngSeed("Ground beef", "g", "300"), new IngSeed("Burger buns", "pcs", "2"), new IngSeed("Cheddar", "slice", "2") },
                new[] { new StepSeed(1, "Form patties and smash on a hot skillet."), new StepSeed(2, "Melt cheese, build the burger with sauce and toppings.") }),
            new("Vegetable Stir-Fry",
                "Fast, colorful wok vegetables in a garlic-soy glaze.",
                "15 min", "3", "1512621776951-a57141f2eefd", 4,
                new[] { new IngSeed("Mixed vegetables", "g", "500"), new IngSeed("Soy sauce", "tbsp", "3"), new IngSeed("Garlic", "clove", "3") },
                new[] { new StepSeed(1, "Heat wok very hot; add garlic then vegetables."), new StepSeed(2, "Toss with soy glaze 3-4 min; keep them crisp.") }),
            new("Pancake Stack",
                "Fluffy buttermilk pancakes with maple syrup and berries.",
                "25 min", "2", "1567620905732-2d1ec7ab7445", 3,
                new[] { new IngSeed("Flour", "g", "200"), new IngSeed("Buttermilk", "ml", "300"), new IngSeed("Egg", "pcs", "1") },
                new[] { new StepSeed(1, "Whisk batter; rest 5 minutes."), new StepSeed(2, "Cook on medium until bubbles form, flip; stack and serve with syrup.") }),
            new("Spaghetti Carbonara",
                "Roman pasta with egg, pecorino, guanciale and black pepper — no cream.",
                "25 min", "2", "1612874742237-6526221588e3", 4,
                new[] { new IngSeed("Spaghetti", "g", "200"), new IngSeed("Guanciale", "g", "100"), new IngSeed("Pecorino", "g", "50") },
                new[] { new StepSeed(1, "Crisp guanciale; whisk eggs with pecorino and pepper."), new StepSeed(2, "Toss hot pasta off heat with the egg mix and pasta water until creamy.") }),
        };
    }
}
