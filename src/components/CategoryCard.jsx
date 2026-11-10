import { Link } from "react-router-dom";

function CategoryCard({ category, count }) {
  return (
    <Link to={`/shop?category=${encodeURIComponent(category.name)}`} className="category-card">
      <img
        src={category.image}
        alt={category.name}
        className="category-card-img"
        loading="lazy"
      />
      <div className="category-card-body">
        <span className="emoji">{category.emoji}</span>
        <div className="name">{category.name}</div>
        <div className="count">{count} products</div>
      </div>
    </Link>
  );
}

export default CategoryCard;
