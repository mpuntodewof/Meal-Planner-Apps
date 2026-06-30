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
              <div className="bm-card bm-card--link" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <img src={item.imageUrl} alt={item.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                <div style={{ padding: 16, display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3 className="bm-clamp-2" style={{ fontSize: 16, fontWeight: 700, minHeight: 40 }}>{item.title}</h3>
                  <p className="bm-clamp-2" style={{ color: "var(--bm-muted)", fontSize: 13, flex: 1 }}>{item.excerpt}</p>
                  <a className="bm-link" href="#news">Read more →</a>
                  <div className="bm-meta-row" style={{ color: "var(--bm-faint)", fontSize: 12 }}>
                    <span>{item.author}</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
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
