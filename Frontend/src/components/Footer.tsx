import React from 'react'

function Footer() {
  return (
    <footer style={{ background: "#16161a", color: "var(--bm-text)", borderTop: "1px solid var(--bm-border)", padding: "60px 0 24px" }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-4 mb-4">
            <div style={{ fontWeight: 900, fontSize: 22 }}>FOOD<span style={{ color: "var(--bm-accent)" }}>.</span></div>
            <p style={{ color: "var(--bm-muted)", marginTop: 8 }}>Curated recipes, meal plans, and food stories.</p>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="bm-label">Explore</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
              <li><a href="#recipes" style={{ color: "var(--bm-muted)", textDecoration: "none" }}>Recipes</a></li>
              <li><a href="#news" style={{ color: "var(--bm-muted)", textDecoration: "none" }}>News</a></li>
              <li><a href="#about" style={{ color: "var(--bm-muted)", textDecoration: "none" }}>About</a></li>
            </ul>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="bm-label">Newsletter</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input className="form-control" placeholder="Your email" style={{ background: "var(--bm-card)", border: "1px solid var(--bm-border)", color: "var(--bm-text)" }} />
              <button className="bm-btn">Join</button>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--bm-border)", paddingTop: 16, color: "var(--bm-faint)", fontSize: 13 }}>
          © {new Date().getFullYear()} FoodRecipe. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
