import newsModel from "../interfaces/newsModel";
import news1 from "../img/latest-news/news-bg-1.jpg";
import news2 from "../img/latest-news/news-bg-2.jpg";
import news3 from "../img/latest-news/news-bg-3.jpg";
import news4 from "../img/latest-news/news-bg-4.jpg";

const newsData: newsModel[] = [
  { id: 1, title: "5 Pantry Staples Every Home Cook Needs", excerpt: "Build a kitchen that lets you cook anything, any night of the week.", author: "Editorial", date: "2026-06-20", imageUrl: news1 },
  { id: 2, title: "The Rise of Nusantara Flavors", excerpt: "How Indonesian spice blends are winning over global kitchens.", author: "Editorial", date: "2026-06-18", imageUrl: news2 },
  { id: 3, title: "Meal Prep Without the Burnout", excerpt: "A realistic weekly rhythm that keeps weeknight dinners easy.", author: "Editorial", date: "2026-06-15", imageUrl: news3 },
  { id: 4, title: "Seasonal Produce: What to Cook Now", excerpt: "Eat with the season for better flavor and lower cost.", author: "Editorial", date: "2026-06-10", imageUrl: news4 },
];

export default newsData;
