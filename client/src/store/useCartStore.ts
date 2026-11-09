import { create } from 'zustand';
import { api } from '../services/api';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  stock: number;
  imageUrl: string;
  category?: { name: string; slug: string };
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
  isDrawerOpen: boolean;
  isLoading: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  fetchCart: () => Promise<void>;
  addItem: (product: CartProduct, quantity?: number) => Promise<void>;
  updateItemQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  totalAmount: 0,
  totalQuantity: 0,
  isDrawerOpen: false,
  isLoading: false,

  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),

  fetchCart: async () => {
    const token = localStorage.getItem('shopverse_access_token');
    if (!token) return;

    try {
      set({ isLoading: true });
      const data: any = await api.get('/cart');
      set({
        items: data.items || [],
        totalAmount: Number(data.totalAmount) || 0,
        totalQuantity: Number(data.totalQuantity) || 0,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (product, quantity = 1) => {
    const token = localStorage.getItem('shopverse_access_token');

    if (token) {
      // Authenticated: Sync directly with backend API
      await api.post('/cart/items', {
        productId: product.id,
        quantity,
      });
      await get().fetchCart();
      set({ isDrawerOpen: true });
    } else {
      // Unauthenticated: Local store fallback
      const currentItems = [...get().items];
      const existing = currentItems.find((i) => i.productId === product.id);

      if (existing) {
        existing.quantity += quantity;
      } else {
        currentItems.push({
          id: `local-${Date.now()}`,
          productId: product.id,
          quantity,
          product,
        });
      }

      const totalAmount = currentItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      );
      const totalQuantity = currentItems.reduce((sum, item) => sum + item.quantity, 0);

      set({
        items: currentItems,
        totalAmount,
        totalQuantity,
        isDrawerOpen: true,
      });
    }
  },

  updateItemQuantity: async (cartItemId, quantity) => {
    const token = localStorage.getItem('shopverse_access_token');

    if (token && !cartItemId.startsWith('local-')) {
      await api.patch(`/cart/items/${cartItemId}`, { quantity });
      await get().fetchCart();
    } else {
      const items = get().items.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item,
      );
      const totalAmount = items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      );
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      set({ items, totalAmount, totalQuantity });
    }
  },

  removeItem: async (cartItemId) => {
    const token = localStorage.getItem('shopverse_access_token');

    if (token && !cartItemId.startsWith('local-')) {
      await api.delete(`/cart/items/${cartItemId}`);
      await get().fetchCart();
    } else {
      const items = get().items.filter((item) => item.id !== cartItemId);
      const totalAmount = items.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      );
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      set({ items, totalAmount, totalQuantity });
    }
  },

  clearCart: async () => {
    const token = localStorage.getItem('shopverse_access_token');
    if (token) {
      await api.delete('/cart/clear');
    }
    set({ items: [], totalAmount: 0, totalQuantity: 0 });
  },
}));
