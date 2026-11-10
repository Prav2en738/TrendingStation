import { useCart } from "../context/CartContext";

function Toast() {
  const { toast } = useCart();

  if (!toast.visible) return null;

  return (
    <div className="toast show" role="status">
      <span className="check">✓</span>
      {toast.message}
    </div>
  );
}

export default Toast;
