import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("toyverse_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("toyverse_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState({ message: "", visible: false });

  useEffect(() => {
    localStorage.setItem("toyverse_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("toyverse_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2400
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message) => setToast({ message, visible: true });

  const addToCart = (product, quantity = 1) => {
    const productId = product._id || product.id;
    setCart((prev) => {
      const existing = prev.find((item) => item._id === productId || item.id === productId);
      if (existing) {
        return prev.map((item) =>
          (item._id === productId || item.id === productId) ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, id: productId, _id: productId, quantity }];
    });
    showToast(`${product.name} added to cart`);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id && item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item._id === id || item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (id) => {
    const added = !wishlist.includes(id);
    setWishlist((prev) =>
      added ? [...prev, id] : prev.filter((wId) => wId !== id)
    );
    showToast(added ? "Added to wishlist ❤️" : "Removed from wishlist");
  };

  const isInWishlist = (id) => wishlist.includes(id);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const deliveryCharge = subtotal > 999 || subtotal === 0 ? 0 : 49;
  const total = subtotal + deliveryCharge;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        wishlist,
        toggleWishlist,
        isInWishlist,
        cartCount,
        subtotal,
        deliveryCharge,
        total,
        toast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
