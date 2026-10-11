import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";
type Preferences = { theme: Theme; setTheme: (theme: Theme) => void };

export const usePreferences = create<Preferences>()(
  persist((set) => ({ theme: "light", setTheme: (theme) => set({ theme }) }), { name: "pickletayo-preferences" }),
);
