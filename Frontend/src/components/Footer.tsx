import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const linkStyle: React.CSSProperties = { color: "var(--bm-muted)", textDecoration: "none", cursor: "pointer" };
  // About is a #about section on Home; scroll there (routing home first if needed).
  const goAbout = () => {
    if (location.pathname === "/") {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };
  return (
    <footer style={{ background: "var(--bm-panel)", color: "var(--bm-text)", borderTop: "1px solid var(--bm-border)", padding: "60px 0 24px" }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-4 mb-4">
            <div style={{ fontWeight: 900, fontSize: 22 }}>FOOD<span style={{ color: "var(--bm-accent)" }}>.</span></div>
            <p style={{ color: "var(--bm-muted)", marginTop: 8 }}>Curated recipes, meal plans, and food stories.</p>
          </div>
          <div className="col-lg-4 mb-4">
            <div className="bm-label">Explore</div>
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
              <li><a style={linkStyle} onClick={() => navigate("/productCatalog")}>Recipes</a></li>
              <li><a style={linkStyle} onClick={() => navigate("/news")}>News</a></li>
              <li><a style={linkStyle} onClick={goAbout}>About</a></li>
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
