/**
 * Settings store — persisted currency preference.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "@trackifi/currency-symbol";

interface CurrencyState {
  symbol: string;
  setSymbol: (s: string) => void;
}

export const useCurrencyStore = create<CurrencyState>()((set) => {
  // Hydrate on load
  AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
    if (stored) set({ symbol: stored });
  });

  return {
    symbol: "₱",
    setSymbol: (s) => {
      set({ symbol: s });
      AsyncStorage.setItem(STORAGE_KEY, s);
    },
  };
});
