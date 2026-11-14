import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { formatMoney } from "@shared/money";
export { formatMoney } from "@shared/money";

export type CartItem = {
  key: string;
  id: string;
  name: string;
  kind: "wig" | "custom";
  price: number;
  /** In-app link back to the item (custom builds link to the builder). */
  link?: string;
  image: string;
  variant: string;
  quantity: number;
};

type PromoResult = { code: string; kind: "percent" | "fixed"; value: number; message: string } | null;
type StoreContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  promo: PromoResult;
  promoError: string;
  isCartOpen: boolean;
  wishlist: string[];
  addItem: (item: Omit<CartItem, "key" | "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
  setCartOpen: (open: boolean) => void;
  toggleWishlist: (id: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
// New keys intentionally leave the previous USD demo cart and wishlist out of the Rand storefront.
const CART_KEY = "brathouse-cart-zar-v2";
const WISHLIST_KEY = "brathouse-wishlist-zar-v2";

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readLocal(CART_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() => readLocal(WISHLIST_KEY, []));
  const [promo, setPromo] = useState<PromoResult>(null);
  const [promoError, setPromoError] = useState("");
  const [isCartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    try { window.localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* storage may be disabled */ }
  }, [items]);
  useEffect(() => {
    try { window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); } catch { /* storage may be disabled */ }
  }, [wishlist]);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const subtotal = subtotalCents / 100;
  // Shipping prices were not supplied; keep it out of the amount due and label it for confirmation in the UI.
  const shipping = 0;
  const promoEligible = !(promo?.code === "PACK20" && subtotalCents < 20_000);
  const discountCents = promo && promoEligible
    ? Math.min(promo.kind === "percent" ? Math.round(subtotalCents * promo.value) : Math.round(promo.value * 100), subtotalCents)
    : 0;
  const discount = discountCents / 100;
  const activePromoError = promo?.code === "PACK20" && subtotalCents < 20_000 ? "PACK20 needs a R200 basket, babe." : promoError;
  const total = Math.max(0, subtotalCents - discountCents + Math.round(shipping * 100)) / 100;

  const addItem: StoreContextValue["addItem"] = (item, quantity = 1) => {
    const key = `${item.kind}:${item.id}:${item.variant}`;
    setItems((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) return current.map((line) => line.key === key ? { ...line, quantity: line.quantity + quantity } : line);
      return [...current, { ...item, key, quantity }];
    });
    setCartOpen(true);
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("brathouse:add-to-cart"));
  };
  const setQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) return setItems((current) => current.filter((line) => line.key !== key));
    setItems((current) => current.map((line) => line.key === key ? { ...line, quantity: Math.min(20, quantity) } : line));
  };
  const removeItem = (key: string) => setItems((current) => current.filter((line) => line.key !== key));
  const clearCart = () => { setItems([]); setPromo(null); setPromoError(""); };
  const applyPromo = (raw: string) => {
    const code = raw.trim().toUpperCase();
    const currentSubtotalCents = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
    if (code === "BRAT10") {
      setPromo({ code, kind: "percent", value: 0.1, message: "10% off. Cute choice." });
      setPromoError("");
      return true;
    }
    if (code === "PACK20" && currentSubtotalCents >= 20_000) {
      setPromo({ code, kind: "fixed", value: 20, message: "R20 off your R200+ basket." });
      setPromoError("");
      return true;
    }
    setPromo(null);
    setPromoError(code === "PACK20" ? "PACK20 needs a R200 basket, babe." : "That code is not in the group chat.");
    return false;
  };
  const clearPromo = () => { setPromo(null); setPromoError(""); };
  const toggleWishlist = (id: string) => setWishlist((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  const value = useMemo(() => ({ items, count, subtotal, shipping, discount, total, promo, promoError: activePromoError, isCartOpen, wishlist, addItem, setQuantity, removeItem, clearCart, applyPromo, clearPromo, setCartOpen, toggleWishlist }), [items, count, subtotal, shipping, discount, total, promo, activePromoError, isCartOpen, wishlist]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
