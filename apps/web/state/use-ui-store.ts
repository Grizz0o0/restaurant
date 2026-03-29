import { create } from 'zustand';

interface UIState {
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    setMobileMenuOpen: (isOpen: boolean) => void;

    // Add other UI states here (e.g., active modal)
    activeModal: string | null;
    openModal: (modalId: string) => void;
    closeModal: () => void;

    isCartOpen: boolean;
    toggleCart: () => void;
    setCartOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isMobileMenuOpen: false,
    toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
    setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),

    activeModal: null,
    openModal: (modalId) => set({ activeModal: modalId }),
    closeModal: () => set({ activeModal: null }),

    isCartOpen: false,
    toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
    setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
}));
