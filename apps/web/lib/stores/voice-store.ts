/**
 * Voice Studio state management with Zustand
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Brand {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  industry: string | null;
  personality: string | null;
  tone_attributes: Record<string, any>;
  example_phrases: Record<string, any>;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string | null;
}

interface VoiceStoreState {
  // Selected brand
  selectedBrand: Brand | null;
  setSelectedBrand: (brand: Brand | null) => void;

  // Brands list cache
  brands: Brand[];
  setBrands: (brands: Brand[]) => void;

  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useVoiceStore = create<VoiceStoreState>()(
  persist(
    (set) => ({
      // Initial state
      selectedBrand: null,
      brands: [],
      isLoading: false,

      // Actions
      setSelectedBrand: (brand) => set({ selectedBrand: brand }),
      setBrands: (brands) => set({ brands }),
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "voice-store", // Key in localStorage
      partialize: (state) => ({
        selectedBrand: state.selectedBrand, // Only persist selected brand
      }),
    }
  )
);
