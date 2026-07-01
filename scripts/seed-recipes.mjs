// Seed ~10 sample recipes into the FoodRecipe API.
//
// Repeatable: registers (or reuses) a seed user, logs in, decodes the JWT to get
// the user id, then POSTs each recipe to POST /api/recipe. Uses public Unsplash
// food image URLs for ImageUrl (just strings — no Cloudinary upload involved).
//
// Usage:  node scripts/seed-recipes.mjs            (defaults to http://localhost:5128)
//         API_BASE=http://localhost:5128 node scripts/seed-recipes.mjs
//
// Requires the API to be running and the DB reachable. Node 18+ (global fetch).

const API = process.env.API_BASE || "http://localhost:5128";
const SEED_USER = { Name: "Seed Chef", Email: "seed@foodrecipe.local", Password: "seed123", Role: "admin" };

function decodeJwtId(token) {
  // token = header.payload.signature ; payload is base64url JSON containing "id"
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
  return payload.id;
}

// Distinct Unsplash food photos (stable photo IDs, sized for cards).
const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=900&q=70&auto=format&fit=crop`;

const RECIPES = [
  { Name: "Classic Beef Rendang", CookingTime: "3 hrs", ServiceSize: "4", img: "1604908176997-125f25cc6f3d",
    Description: "Slow-cooked Indonesian beef in coconut milk and a rich blend of aromatic spices.",
    Ingredient: [{ Name: "Beef chuck", Unit: "kg", Description: "1, cubed" }, { Name: "Coconut milk", Unit: "ml", Description: "800" }, { Name: "Lemongrass", Unit: "stalk", Description: "2, bruised" }],
    Instructions: [{ StepNumber: 1, Description: "Blend the spice paste and saute until fragrant." }, { StepNumber: 2, Description: "Add beef and coconut milk; simmer on low for 3 hours until dark and dry." }] },
  { Name: "Grilled Salmon Fillet", CookingTime: "25 min", ServiceSize: "2", img: "1467003909585-2f8a72700288",
    Description: "Crisp-skinned salmon with lemon and herbs — light and quick.",
    Ingredient: [{ Name: "Salmon fillet", Unit: "pcs", Description: "2" }, { Name: "Lemon", Unit: "pcs", Description: "1" }, { Name: "Dill", Unit: "tbsp", Description: "2, chopped" }],
    Instructions: [{ StepNumber: 1, Description: "Season salmon and rest 10 minutes." }, { StepNumber: 2, Description: "Grill skin-side down 4 min, flip, finish 3 min; squeeze lemon." }] },
  { Name: "Margherita Pizza", CookingTime: "45 min", ServiceSize: "2", img: "1513104890138-7c749659a591",
    Description: "Blistered crust, San Marzano tomato, fresh mozzarella and basil.",
    Ingredient: [{ Name: "Pizza dough", Unit: "ball", Description: "1" }, { Name: "Mozzarella", Unit: "g", Description: "150" }, { Name: "Basil", Unit: "leaves", Description: "8" }],
    Instructions: [{ StepNumber: 1, Description: "Stretch dough and top with sauce and torn mozzarella." }, { StepNumber: 2, Description: "Bake at max heat 8-10 min; finish with basil." }] },
  { Name: "Chocolate Lava Cake", CookingTime: "20 min", ServiceSize: "4", img: "1606313564200-e75d5e30476c",
    Description: "Warm molten-center chocolate cakes for an easy showstopper dessert.",
    Ingredient: [{ Name: "Dark chocolate", Unit: "g", Description: "120" }, { Name: "Butter", Unit: "g", Description: "100" }, { Name: "Eggs", Unit: "pcs", Description: "2" }],
    Instructions: [{ StepNumber: 1, Description: "Melt chocolate and butter; fold in eggs, sugar, flour." }, { StepNumber: 2, Description: "Bake at 220C for 9-11 min so centers stay molten." }] },
  { Name: "Avocado Toast", CookingTime: "10 min", ServiceSize: "1", img: "1541519227354-08fa5d50c44d",
    Description: "Smashed avocado on sourdough with chili flakes and a soft egg.",
    Ingredient: [{ Name: "Sourdough", Unit: "slice", Description: "2" }, { Name: "Avocado", Unit: "pcs", Description: "1" }, { Name: "Egg", Unit: "pcs", Description: "1" }],
    Instructions: [{ StepNumber: 1, Description: "Toast bread; smash avocado with lime and salt." }, { StepNumber: 2, Description: "Top with a soft-poached egg and chili flakes." }] },
  { Name: "Chicken Caesar Salad", CookingTime: "20 min", ServiceSize: "2", img: "1550304943-4f24f54ddde9",
    Description: "Crisp romaine, grilled chicken, parmesan and a creamy Caesar dressing.",
    Ingredient: [{ Name: "Romaine", Unit: "head", Description: "1" }, { Name: "Chicken breast", Unit: "pcs", Description: "1, grilled" }, { Name: "Parmesan", Unit: "g", Description: "30" }],
    Instructions: [{ StepNumber: 1, Description: "Grill and slice the chicken." }, { StepNumber: 2, Description: "Toss romaine with dressing, croutons and parmesan; top with chicken." }] },
  { Name: "Beef Burger", CookingTime: "30 min", ServiceSize: "2", img: "1568901346375-23c9450c58cd",
    Description: "Juicy smashed beef patty with cheese, lettuce and house sauce.",
    Ingredient: [{ Name: "Ground beef", Unit: "g", Description: "300" }, { Name: "Burger buns", Unit: "pcs", Description: "2" }, { Name: "Cheddar", Unit: "slice", Description: "2" }],
    Instructions: [{ StepNumber: 1, Description: "Form patties and smash on a hot skillet." }, { StepNumber: 2, Description: "Melt cheese, build the burger with sauce and toppings." }] },
  { Name: "Vegetable Stir-Fry", CookingTime: "15 min", ServiceSize: "3", img: "1512621776951-a57141f2eefd",
    Description: "Fast, colorful wok vegetables in a garlic-soy glaze.",
    Ingredient: [{ Name: "Mixed vegetables", Unit: "g", Description: "500" }, { Name: "Soy sauce", Unit: "tbsp", Description: "3" }, { Name: "Garlic", Unit: "clove", Description: "3" }],
    Instructions: [{ StepNumber: 1, Description: "Heat wok very hot; add garlic then vegetables." }, { StepNumber: 2, Description: "Toss with soy glaze 3-4 min; keep them crisp." }] },
  { Name: "Pancake Stack", CookingTime: "25 min", ServiceSize: "2", img: "1567620905732-2d1ec7ab7445",
    Description: "Fluffy buttermilk pancakes with maple syrup and berries.",
    Ingredient: [{ Name: "Flour", Unit: "g", Description: "200" }, { Name: "Buttermilk", Unit: "ml", Description: "300" }, { Name: "Egg", Unit: "pcs", Description: "1" }],
    Instructions: [{ StepNumber: 1, Description: "Whisk batter; rest 5 minutes." }, { StepNumber: 2, Description: "Cook on medium until bubbles form, flip; stack and serve with syrup." }] },
  { Name: "Spaghetti Carbonara", CookingTime: "25 min", ServiceSize: "2", img: "1612874742237-6526221588e3",
    Description: "Roman pasta with egg, pecorino, guanciale and black pepper — no cream.",
    Ingredient: [{ Name: "Spaghetti", Unit: "g", Description: "200" }, { Name: "Guanciale", Unit: "g", Description: "100" }, { Name: "Pecorino", Unit: "g", Description: "50" }],
    Instructions: [{ StepNumber: 1, Description: "Crisp guanciale; whisk eggs with pecorino and pepper." }, { StepNumber: 2, Description: "Toss hot pasta off heat with the egg mix and pasta water until creamy." }] },
];

async function post(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

async function main() {
  console.log(`Seeding against ${API}`);

  // 1) Register seed user (ignore "already exists" failures)
  const reg = await post("/api/auth/register", SEED_USER);
  console.log(`register -> ${reg.status}`);

  // 2) Login to get JWT
  const login = await post("/api/auth/login", { Email: SEED_USER.Email, Password: SEED_USER.Password });
  const token = login.json?.result?.token || login.json?.token;
  if (!token) { console.error("Login failed, no token:", login.status, login.json); process.exit(1); }
  const userId = decodeJwtId(token);
  console.log(`login -> ${login.status}, userId=${userId}`);

  // 3) POST each recipe
  let ok = 0;
  for (const r of RECIPES) {
    const body = {
      Name: r.Name, Description: r.Description, CookingTime: r.CookingTime, ServiceSize: r.ServiceSize,
      UserId: userId, ImageUrl: IMG(r.img), VideoUrl: "",
      Ingredient: r.Ingredient, Instructions: r.Instructions,
    };
    const res = await post("/api/recipe", body, token);
    const good = res.status >= 200 && res.status < 300;
    if (good) ok++;
    console.log(`  ${good ? "OK " : "ERR"} ${res.status}  ${r.Name}`);
    if (!good) console.log("     ", JSON.stringify(res.json).slice(0, 300));
  }
  console.log(`Done. ${ok}/${RECIPES.length} recipes seeded.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
