import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "../../components/sub-comp";
import Footer from "../../components/Footer";
import newsData from "../../data/newsData";

function NewsArticle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const article = newsData.find((n) => String(n.id) === id);

  if (!article) {
    return (
      <>
        <Navbar />
        <div className="bm-section" style={{ minHeight: 360 }}>
          <div className="container text-center">
            <div className="bm-label">News</div>
            <h1 className="bm-title">Story not found</h1>
            <p style={{ color: "var(--bm-muted)" }}>This article doesn’t exist or has been moved.</p>
            <button className="bm-btn" onClick={() => navigate("/news")}>← Back to News</button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const paragraphs = article.body ?? [article.excerpt];

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div className="breadcrumb-section" style={{ position: "relative", backgroundImage: `url(${article.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center", minHeight: 340 }}>
        <div className="bm-overlay" />
        <div className="container" style={{ position: "relative" }}>
          <div className="row">
            <div className="col-lg-8 offset-lg-2 text-center">
              <div className="breadcrumb-text">
                <p className="bm-label">News</p>
                <h1 style={{ color: "#fff", fontWeight: 900 }}>{article.title}</h1>
                <p style={{ color: "rgba(255,255,255,.85)" }}>
                  <i className="far fa-calendar"></i> {new Date(article.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} · {article.author}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bm-section">
        <div className="container">
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <p style={{ color: "var(--bm-text)", fontSize: 18, fontWeight: 600, marginBottom: 24 }}>{article.excerpt}</p>
            {paragraphs.map((para: string, i: number) => (
              <p key={i} style={{ color: "var(--bm-muted)", fontSize: 16, lineHeight: 1.8, marginBottom: 18 }}>{para}</p>
            ))}
            <button className="bm-btn bm-btn--outline" style={{ marginTop: 12 }} onClick={() => navigate("/news")}>← Back to News</button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default NewsArticle;
