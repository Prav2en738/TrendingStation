import { useState, useEffect, useRef } from "react";
import { parallaxProducts } from "../data/products";
import "../styles/products.css";

function ParallaxSection() {
  const [offset, setOffset] = useState(0);
  const sectionRef = useRef(null);
  // Simplify the effect on mobile: plain horizontal scroll, no scroll-jacking
  const isMobile = useRef(
    typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches
  );

  useEffect(() => {
    if (isMobile.current) return;

    let rafId;

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const sectionHeight = rect.height;

        // progress: 0 when section enters viewport, 1 when it leaves
        if (rect.top < windowHeight && rect.bottom > 0) {
          const progress =
            (windowHeight - rect.top) / (windowHeight + sectionHeight);
          setOffset(Math.min(Math.max(progress, 0), 1));
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Track starts off-screen right and crosses to off-screen left
  const itemWidth = 220;
  const gap = 32;
  const trackWidth = parallaxProducts.length * (itemWidth + gap) - gap;
  const translateX = -(offset * (trackWidth + window.innerWidth));

  return (
    <section className="parallax-section" ref={sectionRef}>
      <div className="parallax-bg"></div>

      <div className="parallax-deco" style={{ top: "15%", left: "10%", transform: `translateX(${offset * 50}px)` }}>
        🚗
      </div>
      <div className="parallax-deco" style={{ top: "20%", right: "15%", transform: `translateX(${-offset * 60}px)` }}>
        🧸
      </div>
      <div className="parallax-deco" style={{ bottom: "20%", left: "20%", transform: `translateX(${offset * 40}px)` }}>
        🤖
      </div>

      <div className="parallax-title-wrap">
        <h2 className="parallax-title">A World Full of Play</h2>
        <p className="parallax-subtitle">Scroll to explore the collection</p>
      </div>

      {isMobile.current ? (
        <div className="parallax-track-static scroll-hidden">
          {parallaxProducts.map((p) => (
            <div key={p.id} className="parallax-item">
              <img src={p.image} alt={p.name} loading="lazy" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="parallax-track"
          style={{ transform: `translateX(${translateX}px) translateY(-50%)` }}
        >
          {parallaxProducts.map((p) => (
            <div key={p.id} className="parallax-item">
              <img src={p.image} alt={p.name} loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ParallaxSection;
