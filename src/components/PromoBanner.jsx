import { Link } from "react-router-dom";

function PromoBanner() {
  return (
    <section className="section">
      <div className="container">
        <div className="promo-banner">
          <div className="promo-emoji promo-emoji-1">🎁</div>
          <div className="promo-emoji promo-emoji-2">🧩</div>
          <div className="promo-emoji promo-emoji-3">🪀</div>
          <div className="promo-emoji promo-emoji-4">🎨</div>

          <h2>Make Playtime Extra Special</h2>
          <p>Free delivery on orders above ₹999</p>
          <Link to="/shop" className="btn">
            Explore Offers
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PromoBanner;
