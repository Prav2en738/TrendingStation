import "../styles/hero.css";

const features = [
  {
    emoji: "🚚",
    title: "Fast Delivery",
    desc: "Quick and reliable delivery.",
  },
  {
    emoji: "🛡️",
    title: "Safe & Quality",
    desc: "Products selected with care.",
  },
  {
    emoji: "🎁",
    title: "Perfect Gifts",
    desc: "Toys for every occasion.",
  },
  {
    emoji: "💬",
    title: "Easy Support",
    desc: "Quick customer assistance.",
  },
];

function Features() {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>Why Choose TrendyStation</h2>
          <p>We make playtime better, safer and more fun</p>
        </div>
        <div className="features-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="icon">{f.emoji}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
