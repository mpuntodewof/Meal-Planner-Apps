import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../../components/sub-comp";
import Footer from "../../components/Footer";
import newsData from "../../data/newsData";
import newsModel from "../../interfaces/newsModel";
import newsHero from "../../img/latest-news/news-bg-5.jpg";

function News() {
  const navigate = useNavigate();
  return (
    <>
      <Navbar />

      {/* Banner */}
      <div className="breadcrumb-section" style={{ position: "relative", backgroundImage: `url(${newsHero})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: 300 }}>
        <div className="bm-overlay" />
        <div className="container" style={{ position: "relative" }}>
          <div className="row">
            <div className="col-lg-8 offset-lg-2 text-center">
              <div className="breadcrumb-text">
                <p className="bm-label">News</p>
                <h1 style={{ color: "#fff", fontWeight: 900 }}>Latest Food Stories</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bm-section">
        <div className="container">
          <div className="bm-news-list" style={{ margin: "0 auto" }}>
            {newsData.map((item: newsModel) => (
              <article className="bm-news-row" key={item.id} onClick={() => navigate(`/news/${item.id}`)}>
                <img src={item.imageUrl} alt={item.title} />
                <div className="bm-news-body">
                  <div className="bm-label" style={{ fontSize: 11 }}>{item.author}</div>
                  <h3>{item.title}</h3>
                  <p style={{ color: "var(--bm-muted)", flex: 1 }}>{item.excerpt}</p>
                  <div className="bm-meta-row" style={{ color: "var(--bm-faint)", fontSize: 12, borderTop: "none", marginTop: 4, paddingTop: 0 }}>
                    <span><i className="far fa-calendar"></i> {new Date(item.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
                    <span className="bm-link">Read more →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default News;
