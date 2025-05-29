"use client"

import { useRef, useEffect, useState } from "react"

interface ProgressProps {
  value: number
  max: number
  onValueChange: (value: number) => void
  className?: string
  dynamic?: boolean
}

export function Progress({ value, max, onValueChange, className = "", dynamic = true }: ProgressProps) {
  const progressRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const updateValue = (clientX: number) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const position = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, position / rect.width))
    onValueChange(percentage * max)
  }

  const handleClick = (e: React.MouseEvent) => {
    updateValue(e.clientX)
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleDrag = (e: MouseEvent) => {
      updateValue(e.clientX)
    }

    const handleDragEnd = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', handleDragEnd)

    return () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', handleDragEnd)
    }
  }, [isDragging, max, onValueChange, updateValue])

  return (
    <div 
      ref={progressRef}
      className={`relative h-1 rounded-full cursor-pointer group ${className}`}
      onClick={handleClick}
    >
      <div className={`absolute inset-0 rounded-full ${dynamic ? 'bg-secondary' : 'bg-white/30'}`} />
      <div 
        className={`absolute inset-0 rounded-full transition-all duration-100 ${dynamic ? 'bg-primary' : 'bg-white'}`}
        style={{ width: `${(value / max) * 100}%` }}
      >
        <div 
          className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${dynamic ? 'bg-primary' : 'bg-white'}`}
          onMouseDown={handleDragStart}
        />
      </div>
    </div>
  )
}
