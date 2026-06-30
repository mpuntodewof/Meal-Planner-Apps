import React from "react";
import abt from "../../../img/abt.jpg";

function AboutSection() {
  return (
    <div id="about" className="bm-section bm-section--panel">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-7 mb-4">
            <div className="bm-label">About</div>
            <h2 className="bm-title">Who we are</h2>
            <p style={{ color: "var(--bm-muted)", maxWidth: 520 }}>
              FoodRecipe is a home for curated recipes, meal planning, and food stories.
              We help home cooks discover great dishes, plan their week, and cook with confidence.
            </p>
            <div style={{ display: "flex", gap: 32, marginTop: 16 }}>
              <div><div style={{ color: "var(--bm-accent)", fontSize: 28, fontWeight: 900 }}>500+</div><div style={{ color: "var(--bm-faint)" }}>Recipes</div></div>
              <div><div style={{ color: "var(--bm-accent)", fontSize: 28, fontWeight: 900 }}>6</div><div style={{ color: "var(--bm-faint)" }}>Categories</div></div>
              <div><div style={{ color: "var(--bm-accent)", fontSize: 28, fontWeight: 900 }}>1k+</div><div style={{ color: "var(--bm-faint)" }}>Home cooks</div></div>
            </div>
          </div>
          <div className="col-lg-5">
            <img src={abt} alt="About FoodRecipe" className="bm-card" style={{ width: "100%", height: 300, objectFit: "cover" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AboutSection;
