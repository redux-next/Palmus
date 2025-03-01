"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface MarqueeProps {
  children: React.ReactNode
  className?: string
  speed?: number
}

export const Marquee = ({ children, className = "", speed = 30 }: MarqueeProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [needsMarquee, setNeedsMarquee] = useState(false)
  const [animationDuration, setAnimationDuration] = useState(15)

  const checkWidth = useCallback(() => {
    if (containerRef.current && contentRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const contentWidth = contentRef.current.scrollWidth / (needsMarquee ? 3 : 1)
      const shouldAnimate = contentWidth > containerWidth

      // 計算動畫持續時間 (基於內容寬度和速度)
      if (shouldAnimate && contentWidth > 0) {
        const newDuration = contentWidth / speed
        setAnimationDuration(newDuration)
      }

      if (shouldAnimate !== needsMarquee) {
        setNeedsMarquee(shouldAnimate)
      }
    }
  }, [needsMarquee, speed])

  useEffect(() => {
    // 初始檢查 - 使用較長的延遲確保準確測量
    const initialCheck = setTimeout(checkWidth, 100)
    
    // 監聽視窗大小變化
    window.addEventListener('resize', checkWidth)
    
    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      // 使用 timeout 減少高頻率的重新計算
      setTimeout(checkWidth, 50)
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      clearTimeout(initialCheck)
      window.removeEventListener('resize', checkWidth)
      resizeObserver.disconnect()
    }
  }, [checkWidth, children])

  return (
    <div ref={containerRef} className={`relative w-full overflow-hidden ${className}`}>
      <div
        ref={contentRef}
        className={`inline-block whitespace-nowrap ${
          needsMarquee ? 'marquee-content' : ''
        }`}
        style={
          needsMarquee ? { animationDuration: `${animationDuration * 2}s` } : undefined
        }
      >
        <span className="inline-block">{children}</span>
        {needsMarquee && (
          <>
            <span className="inline-block mx-6">{children}</span>
            <span className="inline-block mx-6">{children}</span>
          </>
        )}
      </div>
    </div>
  )
}
