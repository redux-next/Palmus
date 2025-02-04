import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import Sidebar from "@/components/Sidebar"
import BottomNavigation from "@/components/BottomNavigation"
import ThemeProvider from "@/components/ThemeProvider"
import AudioPlayer from "@/components/AudioPlayer"
import { SettingsDropdown } from "@/components/SettingsDropdown"
import HeaderLogo from "@/components/HeaderLogo"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Palmus Music",
  description: "Palmus Music is a music streaming service. Listen to your favorite music, create playlists, and discover new music.",
  manifest: "/manifest.json",
  icons: {
    icon: '/logo500dark.png',
    shortcut: '/logo500dark.png',
    apple: '/logo500dark.png',
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
                <HeaderLogo />
                <SettingsDropdown />
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
