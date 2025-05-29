"use client"

import Link from "next/link"
import { Home, Search, Library } from 'lucide-react'
import { usePathname } from "next/navigation"
import BottomPlayer from "@/components/BottomPlayer"
import React from "react"

const isIOS = () => {
  if (typeof window === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !((window as unknown) as { MSStream?: unknown }).MSStream
}

const BottomNavigation = () => {
  const pathname = usePathname()
  const [ios, setIOS] = React.useState(false)

  React.useEffect(() => {
    setIOS(isIOS())
  }, [])

  return (
    <nav
      className="md:hidden border-t"
      style={ios ? { paddingBottom: 20 } : undefined}
    >
      <BottomPlayer />
      <ul className="flex justify-around">
        <li className="flex-1">
          <Link href="/" className={`flex flex-col items-center p-2 ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`}>
            <Home />
            <span className="text-xs">Home</span>
          </Link>
        </li>
        <li className="flex-1">
          <Link href="/search" className={`flex flex-col items-center p-2 ${pathname === "/search" ? "text-primary" : "text-muted-foreground"}`}>
            <Search />
            <span className="text-xs">Search</span>
          </Link>
        </li>
        <li className="flex-1">
          <Link href="/library" className={`flex flex-col items-center p-2 ${pathname === "/library" ? "text-primary" : "text-muted-foreground"}`}>
            <Library />
            <span className="text-xs">Library</span>
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default BottomNavigation

