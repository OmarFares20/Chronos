// Cart utility — localStorage-backed event planning cart

export interface CartItem {
  id: string;              // unique cart item id (cuid-like)
  providerId: string;
  providerName: string;
  packageId: string;
  packageName: string;
  price: number;
  currency: string;
  serviceDuration?: string;
  scheduledTime?: string;  // ISO datetime for when service starts at event
  deliveryNotes?: string;
  category?: string;
}

const CART_KEY = "chronos_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(item: Omit<CartItem, "id">): CartItem {
  const cart = getCart();
  // Replace if same package already added
  const existingIdx = cart.findIndex((c) => c.packageId === item.packageId);
  const newItem: CartItem = {
    ...item,
    id: `ci_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
  if (existingIdx >= 0) {
    cart[existingIdx] = newItem;
  } else {
    cart.push(newItem);
  }
  saveCart(cart);
  return newItem;
}

export function removeFromCart(cartItemId: string) {
  const cart = getCart().filter((c) => c.id !== cartItemId);
  saveCart(cart);
}

export function updateScheduledTime(cartItemId: string, scheduledTime: string) {
  const cart = getCart().map((c) =>
    c.id === cartItemId ? { ...c, scheduledTime } : c
  );
  saveCart(cart);
}

export function updateDeliveryNotes(cartItemId: string, notes: string) {
  const cart = getCart().map((c) =>
    c.id === cartItemId ? { ...c, deliveryNotes: notes } : c
  );
  saveCart(cart);
}

export function clearCart() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CART_KEY);
  }
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price, 0);
}

export function getPlatformFee(total: number): number {
  return Math.round(total * 0.05 * 100) / 100;
}
