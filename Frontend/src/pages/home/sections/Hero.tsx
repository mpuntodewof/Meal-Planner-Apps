import React from "react";
import { useNavigate } from "react-router-dom";
import heroBg from "../../../img/food-bg-3.webp";

function Hero() {
  const navigate = useNavigate();
  return (
    <div style={{ position: "relative", minHeight: 460, display: "flex", alignItems: "center", backgroundImage: `url(${heroBg})`, backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="bm-overlay" />
      <div className="container" style={{ position: "relative" }}>
        <div className="bm-label">Cooking Ideas</div>
        <h1 className="bm-title" style={{ color: "#fff", maxWidth: 620 }}>Cook bold.<br />Eat better.</h1>
        <p style={{ color: "rgba(255,255,255,.85)", maxWidth: 460, marginBottom: 20 }}>
          Curated recipes, meal plans, and food stories — all in one place.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="bm-btn" onClick={() => navigate("/productCatalog")}>Browse Recipes</button>
          <a className="bm-btn bm-btn--outline" href="#news">Read News</a>
        </div>
      </div>
    </div>
  );
}

export default Hero;
