import { Link } from "react-router-dom";
import { heroImages, formatPrice } from "../data/products";
import "../styles/hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="hero-shape hero-shape-1"></div>
      <div className="hero-shape hero-shape-2"></div>
      <div className="hero-shape hero-shape-3"></div>

      <div className="container hero-inner">
        <div className="hero-content">
          <div className="hero-badge animate-fade-up">
            <span className="dot"></span>
            New Collection 2026
          </div>

          <h1 className="hero-title animate-fade-up delay-1">
            Big Smiles Start With <span className="highlight">Small Toys</span>.
          </h1>

          <p className="hero-text animate-fade-up delay-2">
            Discover playful, creative and exciting toys designed to make every moment more fun.
          </p>

          <div className="hero-buttons animate-fade-up delay-3">
            <Link to="/shop" className="btn btn-primary">
              Shop Toys
            </Link>
            <Link to="/shop?sort=rating" className="btn btn-secondary">
              Explore Trending
            </Link>
          </div>

          <div className="hero-stats animate-fade-up delay-4">
            <div className="hero-stat">
              <div className="num">500+</div>
              <div className="label">Toys</div>
            </div>
            <div className="hero-stat">
              <div className="num">10K+</div>
              <div className="label">Happy Kids</div>
            </div>
            <div className="hero-stat">
              <div className="num">4.8★</div>
              <div className="label">Rating</div>
            </div>
          </div>
        </div>

        <div className="hero-visual animate-fade-in delay-2">
          <div className="hero-emoji hero-emoji-1">⭐</div>
          <div className="hero-emoji hero-emoji-2">🎈</div>
          <div className="hero-emoji hero-emoji-3">🪀</div>

          <img
            src={heroImages.main}
            alt="Child playing with colorful toys"
            className="hero-main-img"
            loading="eager"
          />

          <div className="hero-float-card hero-float-1">
            <img src={heroImages.float1} alt="Racing car toy" loading="lazy" />
            <div>
              <div className="fc-name">Turbo Car</div>
              <div className="fc-price">{formatPrice(1299)}</div>
            </div>
          </div>

          <div className="hero-float-card hero-float-2">
            <img src={heroImages.float2} alt="Teddy bear toy" loading="lazy" />
            <div>
              <div className="fc-name">Teddy Bear</div>
              <div className="fc-price">{formatPrice(899)}</div>
            </div>
          </div>

          <div className="hero-float-card hero-float-3">
            <img src={heroImages.float3} alt="Robot toy" loading="lazy" />
            <div>
              <div className="fc-name">Robo X1</div>
              <div className="fc-price">{formatPrice(2499)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
