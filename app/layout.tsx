import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import Sidebar from "@/components/Sidebar"
import BottomNavigation from "@/components/BottomNavigation"
import ThemeProvider from "@/components/ThemeProvider"
import AudioPlayer from "@/components/AudioPlayer"
import { SettingsDropdown } from "@/components/SettingsDropdown"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { NavSearch } from "@/components/NavSearch"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Palmus Music",
  description: "Listen to your favorite music, create playlists, and discover new music all on Palmus Music.",
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AudioPlayer />
          <div className="flex h-dvh bg-background text-foreground">
            <Sidebar />
            <div className="flex flex-col flex-grow">
              <header className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 10v4M6 3v18m4-15v13m4-10v7m4-9v11m4-8v5" />
                  </svg>
                  <h1 className="text-2xl font-bold">Palmus Music</h1>
                </div>
                <div className="flex items-center gap-4">
                  <NavSearch />
                  <SettingsDropdown />
                </div>
              </header>
              <main id="main" className="w-screen md:w-[calc(100vw_-_20rem)] flex-grow overflow-auto p-4 scroll-hide flex flex-col pb-28 md:pb-4">{children}<SpeedInsights /></main>
              <BottomNavigation />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
