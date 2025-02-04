"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes"
import { useColorStore } from "@/lib/colorStore"

/* 新增 ThemeUpdater 元件 */
function ThemeUpdater() {
  const { resolvedTheme } = useTheme()
  const { isDynamicColorEnabled, lightPalette, darkPalette } = useColorStore()

  React.useEffect(() => {
    const root = document.documentElement
    if (isDynamicColorEnabled && (lightPalette || darkPalette)) {
      const palette = resolvedTheme === "dark" ? darkPalette : lightPalette
      if (!palette) return
      Object.entries(palette).forEach(([key, value]) => {
        if (key !== "radius") root.style.setProperty(`--${key}`, value)
      })
      root.classList.add("dynamic")
    } else {
      root.classList.remove("dynamic")
      Object.keys(lightPalette || {}).forEach(key => {
        if (key !== "radius") root.style.removeProperty(`--${key}`)
      })
    }
  }, [isDynamicColorEnabled, lightPalette, darkPalette, resolvedTheme])
  return null
}

export default function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {/* 新增 ThemeUpdater */}
      <ThemeUpdater />
      {children}
    </NextThemesProvider>
  )
}

