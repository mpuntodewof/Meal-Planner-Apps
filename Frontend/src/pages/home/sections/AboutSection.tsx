import React from "react";
import { useNavigate } from "react-router-dom";
import abt from "../../../img/abt.jpg";

function AboutSection() {
  const navigate = useNavigate();
  return (
    <div id="about">
      {/* Mission + image */}
      <div className="bm-section">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-7 mb-4">
              <div className="bm-label">About</div>
              <h2 className="bm-title">Cooking, made approachable</h2>
              <p style={{ color: "var(--bm-muted)", maxWidth: 560 }}>
                FoodRecipe is a home for curated recipes, meal planning, and food stories.
                We help home cooks discover great dishes, plan their week, and cook with confidence —
                from quick weeknight meals to spice-forward Nusantara classics.
              </p>
              <div style={{ display: "flex", gap: 32, marginTop: 16, marginBottom: 24, flexWrap: "wrap" }}>
                <div><div style={{ color: "var(--bm-accent)", fontSize: 28, fontWeight: 900 }}>500+</div><div style={{ color: "var(--bm-faint)" }}>Recipes</div></div>
                <div><div style={{ color: "var(--bm-accent)", fontSize: 28, fontWeight: 900 }}>6</div><div style={{ color: "var(--bm-faint)" }}>Categories</div></div>
                <div><div style={{ color: "var(--bm-accent)", fontSize: 28, fontWeight: 900 }}>1k+</div><div style={{ color: "var(--bm-faint)" }}>Home cooks</div></div>
              </div>
              <button className="bm-btn" onClick={() => navigate("/productCatalog")}>Explore Recipes</button>
            </div>
            <div className="col-lg-5">
              <img src={abt} alt="About FoodRecipe" className="bm-card" style={{ width: "100%", height: 340, objectFit: "cover" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="bm-section bm-section--panel">
        <div className="container">
          <div className="bm-label">What we value</div>
          <h2 className="bm-title">Built for everyday cooks</h2>
          <div className="row">
            {[
              { icon: "fa-utensils", title: "Curated recipes", text: "Every dish is structured with clear ingredients and step-by-step instructions." },
              { icon: "fa-calendar-week", title: "Meal planning", text: "Plan your week ahead and take the guesswork out of weeknight dinners." },
              { icon: "fa-heart", title: "Save favorites", text: "Keep the dishes you love one tap away and build your own cookbook." },
            ].map((v) => (
              <div className="col-md-4 mb-4" key={v.title}>
                <div className="bm-card" style={{ padding: 24, height: "100%" }}>
                  <div style={{ color: "var(--bm-accent)", fontSize: 26 }}><i className={`fas ${v.icon}`}></i></div>
                  <h3 style={{ fontWeight: 800, fontSize: 18, marginTop: 12 }}>{v.title}</h3>
                  <p style={{ color: "var(--bm-muted)", margin: 0 }}>{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutSection;
