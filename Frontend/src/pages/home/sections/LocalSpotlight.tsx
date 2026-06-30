import React from "react";
import nusantara from "../../../img/masakan-nusantara.jpg";
import beef from "../../../img/beef-img.jpg";
import dessert from "../../../img/dessert-img.jpg";

function LocalSpotlight() {
  return (
    <div className="bm-section">
      <div className="container">
        <div className="bm-label">🏠 Local Spotlight</div>
        <h2 className="bm-title">Nusantara dish of the week</h2>
        <div className="row">
          <div className="col-lg-8 mb-4">
            <div className="bm-card" style={{ position: "relative", minHeight: 320 }}>
              <img src={nusantara} alt="Dish of the week" style={{ width: "100%", height: 320, objectFit: "cover" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 20, background: "linear-gradient(transparent, rgba(15,15,18,.95))" }}>
                <h3 style={{ color: "#fff", fontWeight: 800 }}>Rendang &amp; Regional Classics</h3>
                <p style={{ color: "var(--bm-muted)", margin: 0 }}>Slow-cooked, spice-forward dishes that define Indonesian home cooking.</p>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="bm-card mb-3" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={beef} alt="" style={{ width: 90, height: 90, objectFit: "cover" }} />
              <div style={{ fontWeight: 700, padding: "0 8px" }}>Beef Specialties</div>
            </div>
            <div className="bm-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={dessert} alt="" style={{ width: 90, height: 90, objectFit: "cover" }} />
              <div style={{ fontWeight: 700, padding: "0 8px" }}>Traditional Desserts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LocalSpotlight;
