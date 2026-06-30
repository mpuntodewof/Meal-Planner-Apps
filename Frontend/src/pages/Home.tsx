import React from "react";
import { Navbar } from "../components/sub-comp";
import Footer from "../components/Footer";
import Hero from "./home/sections/Hero";
import TrendingNow from "./home/sections/TrendingNow";
import LocalSpotlight from "./home/sections/LocalSpotlight";
import RecipeGrid from "./home/sections/RecipeGrid";
import NewsSection from "./home/sections/NewsSection";
import AboutSection from "./home/sections/AboutSection";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <TrendingNow />
      <LocalSpotlight />
      <RecipeGrid />
      <NewsSection />
      <AboutSection />
      <Footer />
    </>
  );
}

export default Home;
