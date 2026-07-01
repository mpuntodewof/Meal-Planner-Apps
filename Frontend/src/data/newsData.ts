import newsModel from "../interfaces/newsModel";
import news1 from "../img/latest-news/news-bg-1.jpg";
import news2 from "../img/latest-news/news-bg-2.jpg";
import news3 from "../img/latest-news/news-bg-3.jpg";
import news4 from "../img/latest-news/news-bg-4.jpg";

const newsData: newsModel[] = [
  {
    id: 1, title: "5 Pantry Staples Every Home Cook Needs",
    excerpt: "Build a kitchen that lets you cook anything, any night of the week.",
    author: "Editorial", date: "2026-06-20", imageUrl: news1,
    body: [
      "A well-stocked pantry is the difference between staring into the fridge and getting dinner on the table in twenty minutes. You don't need fifty ingredients — you need the right handful that combine into dozens of meals.",
      "Start with good salt and a neutral cooking oil. From there, a quality stock or bouillon, a few dried aromatics, and a couple of acids (vinegar, citrus) will carry most weeknight cooking.",
      "Round it out with shelf-stable proteins and grains — canned beans, rice, pasta — and you can improvise a meal from almost anything fresh you happen to have.",
    ],
  },
  {
    id: 2, title: "The Rise of Nusantara Flavors",
    excerpt: "How Indonesian spice blends are winning over global kitchens.",
    author: "Editorial", date: "2026-06-18", imageUrl: news2,
    body: [
      "Indonesian cooking is built on layered spice pastes — bumbu — that balance heat, sweetness, and umami in a single spoonful. As global cooks look for bolder flavor, these blends are finding their way into kitchens far from the archipelago.",
      "Dishes like rendang and sambal showcase a patience-driven technique: slow reductions that concentrate flavor rather than rushing it. The result is depth that's hard to fake.",
      "The best entry point is a jar of good sambal and a willingness to experiment — it transforms eggs, grilled vegetables, and roasted meats alike.",
    ],
  },
  {
    id: 3, title: "Meal Prep Without the Burnout",
    excerpt: "A realistic weekly rhythm that keeps weeknight dinners easy.",
    author: "Editorial", date: "2026-06-15", imageUrl: news3,
    body: [
      "Meal prep fails when it's all-or-nothing. Cooking seven identical containers on Sunday is a recipe for boredom by Wednesday. A lighter rhythm works better.",
      "Prep components, not full meals: a batch of grains, a roasted tray of vegetables, one cooked protein. Mix and match through the week so nothing feels repetitive.",
      "Keep one flexible 'anything' night where leftovers become fried rice, a grain bowl, or a quick soup. It prevents waste and keeps prep sustainable.",
    ],
  },
  {
    id: 4, title: "Seasonal Produce: What to Cook Now",
    excerpt: "Eat with the season for better flavor and lower cost.",
    author: "Editorial", date: "2026-06-10", imageUrl: news4,
    body: [
      "Produce tastes best — and costs least — when it's in season. Cooking with the calendar means brighter flavor with less effort, because peak ingredients need little dressing up.",
      "Right now, look for what's abundant at your local market and let it lead the menu. A simple preparation lets seasonal produce speak for itself.",
      "Buying seasonally also supports shorter supply chains, which usually means fresher arrivals and a smaller footprint.",
    ],
  },
];

export default newsData;
