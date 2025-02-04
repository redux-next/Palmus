"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ScrollAreaProps {
  className?: string
  children: React.ReactNode
}

export function ScrollArea({ className, children }: ScrollAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1) // -1 防止舍入誤差
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const { clientWidth } = container
      
      // 計算單個卡片的寬度（包含間距）
      const cardWidth = 200 + 16 // 卡片寬度 + gap
      
      // 計算當前可見的完整卡片數量
      const visibleCards = Math.floor(clientWidth / cardWidth)
      
      // 計算需要滾動的距離（卡片寬度 * 可見卡片數）
      const scrollDistance = cardWidth * visibleCards
      
      // 計算目標滾動位置
      const currentScroll = container.scrollLeft
      const maxScroll = container.scrollWidth - container.clientWidth
      let targetScroll

      if (direction === 'left') {
        targetScroll = Math.max(0, currentScroll - scrollDistance)
      } else {
        targetScroll = Math.min(maxScroll, currentScroll + scrollDistance)
      }

      // 滾動到最近的卡片邊界
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="relative group">
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="ml-2 absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/60 backdrop-blur-2xl p-2 rounded-full shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <div
        ref={scrollContainerRef}
        className={cn(
          "flex gap-4 overflow-x-auto scroll-smooth scroll-hide",
          className
        )}
        onScroll={checkScroll}
      >
        {children}
      </div>
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="mr-2 absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/60 backdrop-blur-2xl p-2 rounded-full shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
