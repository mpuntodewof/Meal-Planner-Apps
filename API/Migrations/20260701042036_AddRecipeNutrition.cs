using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodFestAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipeNutrition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Calories",
                table: "Recipes",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CarbsG",
                table: "Recipes",
                type: "decimal(6,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FatG",
                table: "Recipes",
                type: "decimal(6,2)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NutritionEstimatedAt",
                table: "Recipes",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ProteinG",
                table: "Recipes",
                type: "decimal(6,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Calories",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "CarbsG",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "FatG",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "NutritionEstimatedAt",
                table: "Recipes");

            migrationBuilder.DropColumn(
                name: "ProteinG",
                table: "Recipes");
        }
    }
}
