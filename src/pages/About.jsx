import { Link } from "react-router-dom";
import "../styles/products.css";

function About() {
  return (
    <>
      <div className="page-hero">
        <div className="container">
          <h1>About TrendyStation</h1>
          <p>Play More. Imagine More.</p>
        </div>
      </div>

      <div className="container about-content">
        <div className="about-grid">
          <img
            src="https://images.pexels.com/photos/3661352/pexels-photo-3661352.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
            alt="Child playing with colorful toys"
            className="about-img"
          />
          <div className="about-text">
            <h2>Our Story</h2>
            <p>
              TrendyStation was born from a simple idea: every child deserves toys that
              spark joy, creativity and imagination. We carefully curate products
              that are not just fun, but also safe, educational and built to last.
            </p>
            <p>
              From racing cars to cuddly teddy bears, from brain-teasing puzzles to
              interactive robots — we bring the best toys from around the world
              right to your doorstep.
            </p>
            <p>
              Our mission is to make playtime extra special, because we believe
              that big smiles really do start with small toys.
            </p>
          </div>
        </div>

        <div className="section-head">
          <h2>What We Stand For</h2>
          <p>The values that guide every toy we choose</p>
        </div>

        <div className="about-values">
          <div className="about-value">
            <span className="emoji">🌟</span>
            <h4>Quality First</h4>
            <p>Every toy is tested for safety and durability before it reaches you.</p>
          </div>
          <div className="about-value">
            <span className="emoji">💚</span>
            <h4>Kids at Heart</h4>
            <p>We design experiences that children love and parents trust.</p>
          </div>
          <div className="about-value">
            <span className="emoji">🚀</span>
            <h4>Spark Imagination</h4>
            <p>Toys that inspire creativity, learning and endless fun.</p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link to="/shop" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    </>
  );
}

export default About;
