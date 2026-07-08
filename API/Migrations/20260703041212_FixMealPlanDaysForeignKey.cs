using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodFestAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixMealPlanDaysForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MealPlanDays_MealPlans_MealPlansId",
                table: "MealPlanDays");

            migrationBuilder.DropIndex(
                name: "IX_MealPlanDays_MealPlansId",
                table: "MealPlanDays");

            migrationBuilder.DropColumn(
                name: "MealPlansId",
                table: "MealPlanDays");

            migrationBuilder.CreateIndex(
                name: "IX_MealPlanDays_MealPlanId",
                table: "MealPlanDays",
                column: "MealPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_MealPlanDays_MealPlans_MealPlanId",
                table: "MealPlanDays",
                column: "MealPlanId",
                principalTable: "MealPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MealPlanDays_MealPlans_MealPlanId",
                table: "MealPlanDays");

            migrationBuilder.DropIndex(
                name: "IX_MealPlanDays_MealPlanId",
                table: "MealPlanDays");

            migrationBuilder.AddColumn<int>(
                name: "MealPlansId",
                table: "MealPlanDays",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MealPlanDays_MealPlansId",
                table: "MealPlanDays",
                column: "MealPlansId");

            migrationBuilder.AddForeignKey(
                name: "FK_MealPlanDays_MealPlans_MealPlansId",
                table: "MealPlanDays",
                column: "MealPlansId",
                principalTable: "MealPlans",
                principalColumn: "Id");
        }
    }
}
