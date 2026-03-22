import { create } from 'zustand';

export interface CartItem {
    id: string; // unique ID for the cart item (since same dish can be added multiple times with different notes)
    dishId: string;
    name: string;
    price: number;
    quantity: number;
    note?: string;
    image?: string | null;
}

interface PosState {
    // Current Table
    selectedTableId: string | null;
    selectedTableName: string | null;
    isTakeaway: boolean;

    // Cart
    cartItems: CartItem[];

    // UI State
    selectedCategoryId: string | 'all';
    searchQuery: string;

    // Actions
    setSelectedTable: (id: string | null, name: string | null) => void;
    setTakeaway: () => void;
    setCategory: (id: string | 'all') => void;
    setSearchQuery: (query: string) => void;

    // Cart Actions
    addToCart: (dish: any) => void;
    updateQuantity: (id: string, delta: number) => void;
    updateNote: (id: string, note: string) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;

    // Selectors
    getTotalPrice: () => number;
    getTotalItems: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
    selectedTableId: null,
    selectedTableName: null,
    isTakeaway: false,

    cartItems: [],

    selectedCategoryId: 'all',
    searchQuery: '',

    setSelectedTable: (id, name) =>
        set({
            selectedTableId: id,
            selectedTableName: name,
            isTakeaway: false,
        }),
    setTakeaway: () =>
        set({
            selectedTableId: null,
            selectedTableName: 'Mang về',
            isTakeaway: true,
        }),
    setCategory: (id) => set({ selectedCategoryId: id }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    addToCart: (dish) =>
        set((state) => {
            // Check if dish already exists in cart without notes
            const existingItemIndex = state.cartItems.findIndex(
                (item) => item.dishId === dish?.id && !item.note,
            );

            if (existingItemIndex >= 0) {
                // Increase quantity if exists
                const newCart = [...state.cartItems];
                const item = newCart[existingItemIndex];
                if (item) {
                    item.quantity += 1;
                }
                return { cartItems: newCart };
            } else {
                // Add new item
                const newItem: CartItem = {
                    id: crypto.randomUUID(),
                    dishId: dish?.id,
                    name: dish?.name || '',
                    price: Number(dish?.basePrice || 0),
                    quantity: 1,
                    image: dish?.images?.[0] ? dish.images[0] : undefined,
                };
                return { cartItems: [...state.cartItems, newItem] };
            }
        }),

    updateQuantity: (id, delta) =>
        set((state) => {
            const newCart = state.cartItems.map((item) => {
                if (item.id === id) {
                    const newQuantity = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            });
            return { cartItems: newCart };
        }),

    updateNote: (id, note) =>
        set((state) => ({
            cartItems: state.cartItems.map((item) =>
                item.id === id ? { ...item, note } : item,
            ),
        })),

    removeFromCart: (id) =>
        set((state) => ({
            cartItems: state.cartItems.filter((item) => item.id !== id),
        })),

    clearCart: () =>
        set({
            cartItems: [],
            selectedTableId: null,
            selectedTableName: null,
            isTakeaway: false,
        }),

    getTotalPrice: () => {
        const { cartItems } = get();
        return cartItems.reduce(
            (total, item) => total + item.price * item.quantity,
            0,
        );
    },

    getTotalItems: () => {
        const { cartItems } = get();
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    },
}));
