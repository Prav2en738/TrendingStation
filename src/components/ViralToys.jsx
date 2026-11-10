import { Link } from "react-router-dom";
import { viralToys, formatPrice } from "../data/products";
import "../styles/products.css";

function ViralToys() {
  return (
    <section className="section viral-section">
      <div className="container">
        <div className="section-head">
          <h2>Seen It. Loved It. Want It.</h2>
          <p>The toys going viral on social media right now</p>
        </div>

        <div className="viral-scroll scroll-hidden">
          {viralToys.map((v) => (
            <div key={v.id} className="viral-card">
              <div className="viral-card-img-wrap">
                <img
                  src={v.image}
                  alt={v.name}
                  className="viral-card-img"
                  loading="lazy"
                />
                <div className="viral-card-overlay">
                  {v.trending && (
                    <span className="viral-trending-tag">🔥 Trending</span>
                  )}
                  <div className="viral-social">
                    <span>❤️ {v.likes}</span>
                    <span>💬 {v.comments}</span>
                  </div>
                </div>
              </div>
              <div className="viral-card-body">
                <h3 className="viral-card-name">{v.name}</h3>
                <p className="viral-card-desc">{v.description}</p>
                <div className="viral-card-bottom">
                  <span className="viral-card-price">{formatPrice(v.price)}</span>
                  <Link
                    to={`/product/${v.productId}`}
                    className="viral-card-shop"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ViralToys;
