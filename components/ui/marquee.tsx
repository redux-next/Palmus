"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface MarqueeProps {
  children: React.ReactNode
  className?: string
}

export const Marquee = ({ children, className = "" }: MarqueeProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [needsMarquee, setNeedsMarquee] = useState(false)
  const [key, setKey] = useState(0) // 新增：用於強制重新渲染

  const checkWidth = useCallback(() => {
    if (containerRef.current && contentRef.current) {
      const containerWidth = containerRef.current.offsetWidth
      const contentWidth = contentRef.current.scrollWidth / (needsMarquee ? 3 : 1) // 修改：考慮重複內容
      const shouldAnimate = contentWidth > containerWidth

      if (shouldAnimate !== needsMarquee) {
        setNeedsMarquee(shouldAnimate)
        setKey(prev => prev + 1) // 當狀態改變時強制重新渲染
      }
    }
  }, [needsMarquee])

  useEffect(() => {
    // 初始檢查
    const initialCheck = setTimeout(checkWidth, 50)
    
    // 監聽視窗大小變化
    window.addEventListener('resize', checkWidth)
    
    // ResizeObserver
    const resizeObserver = new ResizeObserver(checkWidth)
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
        key={key} // 新增：強制重新渲染
        ref={contentRef}
        className={`inline-block whitespace-nowrap ${needsMarquee ? 'marquee-content' : ''}`}
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
