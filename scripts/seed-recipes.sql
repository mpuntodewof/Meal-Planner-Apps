-- Seed ~10 sample recipes directly into the foodfest DB.
--
-- The API's POST /api/recipe treats ImageUrl as a base64 image and uploads to
-- Cloudinary, so it can't accept plain image URLs for seeding. This script writes
-- real rows straight into MySQL with public Unsplash image URLs instead.
--
-- Repeatable: deletes any prior rows owned by the seed user, then re-inserts.
-- Run:  docker exec -i foodfest-mysql mysql -uroot -proot foodfest < scripts/seed-recipes.sql
--
-- Owner = the seed user created by scripts/seed-recipes.mjs (seed@foodrecipe.local).

SET @uid = (SELECT Id FROM AspNetUsers WHERE UserName = 'seed@foodrecipe.local' LIMIT 1);

-- Clean prior seed data (children first via the recipes owned by the seed user)
DELETE i FROM Ingredients i JOIN Recipes r ON i.RecipeId = r.Id WHERE r.UserId = @uid;
DELETE s FROM Instructions s JOIN Recipes r ON s.RecipeId = r.Id WHERE r.UserId = @uid;
DELETE FROM Recipes WHERE UserId = @uid;

-- Helper note: CategoriesId values map to seeded categories
-- 1 Dessert, 2 Brunch, 3 Breakfast, 4 Dinner, 5 Lunch, 6 Snack

-- 1. Classic Beef Rendang (Dinner)
INSERT INTO Recipes (Name, Description, CookingTime, ServiceSize, CreatedAt, UpdatedAt, UserId, CategoriesId, ImageUrl, VideoUrl)
VALUES ('Classic Beef Rendang','Slow-cooked Indonesian beef in coconut milk and a rich blend of aromatic spices.','3 hrs','4',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@uid,4,'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=900&q=70&auto=format&fit=crop','');
SET @r = LAST_INSERT_ID();
INSERT INTO Ingredients (Name, Description, Unit, CreatedAt, UpdatedAt, RecipeId) VALUES
 ('Beef chuck','1, cubed','kg',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Coconut milk','800','ml',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Lemongrass','2, bruised','stalk',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r);
INSERT INTO Instructions (StepNumber, Description, RecipeId) VALUES
 (1,'Blend the spice paste and saute until fragrant.',@r),
 (2,'Add beef and coconut milk; simmer on low for 3 hours until dark and dry.',@r);

-- 2. Grilled Salmon Fillet (Dinner)
INSERT INTO Recipes (Name, Description, CookingTime, ServiceSize, CreatedAt, UpdatedAt, UserId, CategoriesId, ImageUrl, VideoUrl)
VALUES ('Grilled Salmon Fillet','Crisp-skinned salmon with lemon and herbs — light and quick.','25 min','2',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@uid,4,'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=900&q=70&auto=format&fit=crop','');
SET @r = LAST_INSERT_ID();
INSERT INTO Ingredients (Name, Description, Unit, CreatedAt, UpdatedAt, RecipeId) VALUES
 ('Salmon fillet','2','pcs',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Lemon','1','pcs',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Dill','2, chopped','tbsp',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r);
INSERT INTO Instructions (StepNumber, Description, RecipeId) VALUES
 (1,'Season salmon and rest 10 minutes.',@r),
 (2,'Grill skin-side down 4 min, flip, finish 3 min; squeeze lemon.',@r);

-- 3. Margherita Pizza (Lunch)
INSERT INTO Recipes (Name, Description, CookingTime, ServiceSize, CreatedAt, UpdatedAt, UserId, CategoriesId, ImageUrl, VideoUrl)
VALUES ('Margherita Pizza','Blistered crust, San Marzano tomato, fresh mozzarella and basil.','45 min','2',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@uid,5,'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&q=70&auto=format&fit=crop','');
SET @r = LAST_INSERT_ID();
INSERT INTO Ingredients (Name, Description, Unit, CreatedAt, UpdatedAt, RecipeId) VALUES
 ('Pizza dough','1','ball',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Mozzarella','150','g',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Basil','8','leaves',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r);
INSERT INTO Instructions (StepNumber, Description, RecipeId) VALUES
 (1,'Stretch dough and top with sauce and torn mozzarella.',@r),
 (2,'Bake at max heat 8-10 min; finish with basil.',@r);

-- 4. Chocolate Lava Cake (Dessert)
INSERT INTO Recipes (Name, Description, CookingTime, ServiceSize, CreatedAt, UpdatedAt, UserId, CategoriesId, ImageUrl, VideoUrl)
VALUES ('Chocolate Lava Cake','Warm molten-center chocolate cakes for an easy showstopper dessert.','20 min','4',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@uid,1,'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=900&q=70&auto=format&fit=crop','');
SET @r = LAST_INSERT_ID();
INSERT INTO Ingredients (Name, Description, Unit, CreatedAt, UpdatedAt, RecipeId) VALUES
 ('Dark chocolate','120','g',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Butter','100','g',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Eggs','2','pcs',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r);
INSERT INTO Instructions (StepNumber, Description, RecipeId) VALUES
 (1,'Melt chocolate and butter; fold in eggs, sugar, flour.',@r),
 (2,'Bake at 220C for 9-11 min so centers stay molten.',@r);

-- 5. Avocado Toast (Breakfast)
INSERT INTO Recipes (Name, Description, CookingTime, ServiceSize, CreatedAt, UpdatedAt, UserId, CategoriesId, ImageUrl, VideoUrl)
VALUES ('Avocado Toast','Smashed avocado on sourdough with chili flakes and a soft egg.','10 min','1',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@uid,3,'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=900&q=70&auto=format&fit=crop','');
SET @r = LAST_INSERT_ID();
INSERT INTO Ingredients (Name, Description, Unit, CreatedAt, UpdatedAt, RecipeId) VALUES
 ('Sourdough','2','slice',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Avocado','1','pcs',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Egg','1','pcs',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r);
INSERT INTO Instructions (StepNumber, Description, RecipeId) VALUES
 (1,'Toast bread; smash avocado with lime and salt.',@r),
 (2,'Top with a soft-poached egg and chili flakes.',@r);

-- 6. Chicken Caesar Salad (Lunch)
INSERT INTO Recipes (Name, Description, CookingTime, ServiceSize, CreatedAt, UpdatedAt, UserId, CategoriesId, ImageUrl, VideoUrl)
VALUES ('Chicken Caesar Salad','Crisp romaine, grilled chicken, parmesan and a creamy Caesar dressing.','20 min','2',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@uid,5,'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=900&q=70&auto=format&fit=crop','');
SET @r = LAST_INSERT_ID();
INSERT INTO Ingredients (Name, Description, Unit, CreatedAt, UpdatedAt, RecipeId) VALUES
 ('Romaine','1','head',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Chicken breast','1, grilled','pcs',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Parmesan','30','g',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r);
INSERT INTO Instructions (StepNumber, Description, RecipeId) VALUES
 (1,'Grill and slice the chicken.',@r),
 (2,'Toss romaine with dressing, croutons and parmesan; top with chicken.',@r);

-- 7. Beef Burger (Lunch)
INSERT INTO Recipes (Name, Description, CookingTime, ServiceSize, CreatedAt, UpdatedAt, UserId, CategoriesId, ImageUrl, VideoUrl)
VALUES ('Beef Burger','Juicy smashed beef patty with cheese, lettuce and house sauce.','30 min','2',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@uid,5,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=70&auto=format&fit=crop','');
SET @r = LAST_INSERT_ID();
INSERT INTO Ingredients (Name, Description, Unit, CreatedAt, UpdatedAt, RecipeId) VALUES
 ('Ground beef','300','g',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Burger buns','2','pcs',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Cheddar','2','slice',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r);
INSERT INTO Instructions (StepNumber, Description, RecipeId) VALUES
 (1,'Form patties and smash on a hot skillet.',@r),
 (2,'Melt cheese, build the burger with sauce and toppings.',@r);

-- 8. Vegetable Stir-Fry (Dinner)
INSERT INTO Recipes (Name, Description, CookingTime, ServiceSize, CreatedAt, UpdatedAt, UserId, CategoriesId, ImageUrl, VideoUrl)
VALUES ('Vegetable Stir-Fry','Fast, colorful wok vegetables in a garlic-soy glaze.','15 min','3',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@uid,4,'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=900&q=70&auto=format&fit=crop','');
SET @r = LAST_INSERT_ID();
INSERT INTO Ingredients (Name, Description, Unit, CreatedAt, UpdatedAt, RecipeId) VALUES
 ('Mixed vegetables','500','g',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Soy sauce','3','tbsp',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Garlic','3','clove',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r);
INSERT INTO Instructions (StepNumber, Description, RecipeId) VALUES
 (1,'Heat wok very hot; add garlic then vegetables.',@r),
 (2,'Toss with soy glaze 3-4 min; keep them crisp.',@r);

-- 9. Pancake Stack (Brunch)
INSERT INTO Recipes (Name, Description, CookingTime, ServiceSize, CreatedAt, UpdatedAt, UserId, CategoriesId, ImageUrl, VideoUrl)
VALUES ('Pancake Stack','Fluffy buttermilk pancakes with maple syrup and berries.','25 min','2',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@uid,2,'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=900&q=70&auto=format&fit=crop','');
SET @r = LAST_INSERT_ID();
INSERT INTO Ingredients (Name, Description, Unit, CreatedAt, UpdatedAt, RecipeId) VALUES
 ('Flour','200','g',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Buttermilk','300','ml',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Egg','1','pcs',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r);
INSERT INTO Instructions (StepNumber, Description, RecipeId) VALUES
 (1,'Whisk batter; rest 5 minutes.',@r),
 (2,'Cook on medium until bubbles form, flip; stack and serve with syrup.',@r);

-- 10. Spaghetti Carbonara (Dinner)
INSERT INTO Recipes (Name, Description, CookingTime, ServiceSize, CreatedAt, UpdatedAt, UserId, CategoriesId, ImageUrl, VideoUrl)
VALUES ('Spaghetti Carbonara','Roman pasta with egg, pecorino, guanciale and black pepper — no cream.','25 min','2',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@uid,4,'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=900&q=70&auto=format&fit=crop','');
SET @r = LAST_INSERT_ID();
INSERT INTO Ingredients (Name, Description, Unit, CreatedAt, UpdatedAt, RecipeId) VALUES
 ('Spaghetti','200','g',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Guanciale','100','g',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r),
 ('Pecorino','50','g',UTC_TIMESTAMP(),UTC_TIMESTAMP(),@r);
INSERT INTO Instructions (StepNumber, Description, RecipeId) VALUES
 (1,'Crisp guanciale; whisk eggs with pecorino and pepper.',@r),
 (2,'Toss hot pasta off heat with the egg mix and pasta water until creamy.',@r);

SELECT COUNT(*) AS seeded_recipes FROM Recipes WHERE UserId = @uid;
