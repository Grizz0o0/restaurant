import { create } from 'zustand';

// Store is deprecated in favor of TRPC server state
// Kept for reference or future client-only state if needed
interface CartState {
    // Empty for now
}

export const useCartStore = create<CartState>()((set) => ({}));
