import React from "react";
import newsData from "../../../data/newsData";
import newsModel from "../../../interfaces/newsModel";

function NewsSection() {
  return (
    <div id="news" className="bm-section">
      <div className="container">
        <div className="bm-label">News</div>
        <h2 className="bm-title">Latest Food Stories</h2>
        <div className="row">
          {newsData.map((item: newsModel) => (
            <div className="col-lg-3 col-md-6 mb-4" key={item.id}>
              <div className="bm-card" style={{ height: "100%" }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                <div style={{ padding: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{item.title}</h3>
                  <p style={{ color: "var(--bm-muted)", fontSize: 13 }}>{item.excerpt}</p>
                  <div style={{ color: "var(--bm-faint)", fontSize: 12 }}>
                    {new Date(item.date).toLocaleDateString()} · {item.author}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewsSection;
