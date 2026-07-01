import React from "react";
import { Navbar } from "../components/sub-comp";
import Footer from "../components/Footer";
import Hero from "./home/sections/Hero";
import TrendingNow from "./home/sections/TrendingNow";
import LocalSpotlight from "./home/sections/LocalSpotlight";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <TrendingNow />
      <LocalSpotlight />
      <Footer />
    </>
  );
}

export default Home;
