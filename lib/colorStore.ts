import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type PaletteType = {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  border: string;
  input: string;
  ring: string;
  radius: string;
  "chart-1": string;
  "chart-2": string;
  "chart-3": string;
  "chart-4": string;
  "chart-5": string;
}

type ColorState = {
  isDynamicColorEnabled: boolean;
  lightPalette: PaletteType | null;
  darkPalette: PaletteType | null;
  setDynamicColorEnabled: (enabled: boolean) => void;
  setPalette: (
    lightPalette: PaletteType,
    darkPalette: PaletteType
  ) => void;
  resetPalette: () => void;
}

export const useColorStore = create<ColorState>()(
  persist(
    (set) => ({
      isDynamicColorEnabled: true,
      lightPalette: null,
      darkPalette: null,
      setDynamicColorEnabled: (enabled) => set({ isDynamicColorEnabled: enabled }),
      setPalette: (lightPalette, darkPalette) => set({ lightPalette, darkPalette }),
      resetPalette: () => set({ lightPalette: null, darkPalette: null }),
    }),
    {
      name: 'color-storage',
    }
  )
)
