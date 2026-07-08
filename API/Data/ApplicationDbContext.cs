using FoodFestAPI.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;

namespace FoodFestAPI.Data
{
    public class ApplicationDbContext : IdentityDbContext<AppUser>
    {
        public ApplicationDbContext(DbContextOptions optionts) : base(optionts) { }

        public DbSet<AppUser> AppUsers { get; set; }
        public DbSet<Recipe> Recipes { get; set; }
        public DbSet<Ingredient> Ingredients { get; set; }
        public DbSet<Categories> Categories { get; set; }
        public DbSet<Instructions> Instructions { get; set; }
        public DbSet<UserFavorite> UserFavorites { get; set; }
        public DbSet<MealPlans> MealPlans { get; set; }
        public DbSet<MealPlanDays> MealPlanDays { get; set; }
        public DbSet<RecipeRating> RecipeRatings { get; set; }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.Entity<Categories>().HasData(
                new Categories { ID = 1, Name = "Dessert" },
                new Categories { ID = 2, Name = "Brunch" },
                new Categories { ID = 3, Name = "Breakfast" },
                new Categories { ID = 4, Name = "Dinner" },
                new Categories { ID = 5, Name = "Lunch" },
                new Categories { ID = 6, Name = "Snack" }
            );

            builder.Entity<RecipeRating>()
                .HasIndex(r => new { r.UserId, r.RecipeId })
                .IsUnique();

            // MealPlanDays.MealPlanId is the real FK to MealPlans; without this the
            // convention invents an unpopulated shadow FK (MealPlansId) and the
            // MealPlanDays.MealPlans navigation never resolves. Bind it explicitly.
            builder.Entity<MealPlanDays>()
                .HasOne(d => d.MealPlans)
                .WithMany(m => m.MealPlanDays)
                .HasForeignKey(d => d.MealPlanId);
        }
    }
}
