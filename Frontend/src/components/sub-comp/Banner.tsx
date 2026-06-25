import React from 'react'

function Banner() {
  

  return (
    <div className="hero-area hero-bg">
        <div className="container">
          <div className="row">
              <div className="col-lg-9 offset-lg-2 text-center">
                <div className="hero-text">
                    <div className="hero-text-tablecell">
                      <p className="subtitle">Cooking Ideas</p>
                      <h1>Food Receipe</h1>
                      <div className="hero-btns">
                          <a href="shop.html" className="boxed-btn">Receipe Catalog</a>
                          <a href="contact.html" className="bordered-btn">Contact Us</a>
                      </div>
                    </div>
                </div>
              </div>
          </div>
        </div>
    </div>
  )
}

export default Banner;