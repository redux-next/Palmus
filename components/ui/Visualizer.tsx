"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { usePlayerStore } from '@/lib/playerStore'

const BAR_COUNT = 6
const MIN_HEIGHT = 2
const MAX_HEIGHT = 20
const ANIMATION_INTERVAL = 1000 / 20 // 20 FPS
const SMOOTHING_FACTOR = 0.6 // 介於 0 到 1，值越小，變化越平滑

export function Visualizer() {
  const [heights, setHeights] = useState(Array(BAR_COUNT).fill(MIN_HEIGHT))
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const analyserData = usePlayerStore((state) => state.analyserData)
  const lastUpdateTime = useRef(0)

  const frequencyRanges = useMemo(() => [
    { start: 3, end: 4, weight: 0.75 }, 
    { start: 5, end: 6, weight: 1 }, 
    { start: 7, end: 8, weight: 1 }, 
    { start: 9, end: 11, weight: 1 },   
    { start: 12, end: 15, weight: 1 },   
    { start: 15, end: 21, weight: 0.9 } 
  ], [])

  const calculateHeights = useCallback((dataArray: Uint8Array | null) => {
    if (!dataArray || !(dataArray instanceof Uint8Array)) {
      return Array(BAR_COUNT).fill(MIN_HEIGHT)
    }

    return frequencyRanges.map(({ start, end, weight }) => {
      const subArray = dataArray.subarray(start, end)
      const average = subArray.reduce((sum, val) => sum + val, 0) / subArray.length
      const calculatedHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, (average / 255) * (MAX_HEIGHT * weight))
      )
      return isFinite(calculatedHeight) ? calculatedHeight : MIN_HEIGHT
    })
  }, [frequencyRanges])

  const updateHeights = useCallback(() => {
    const now = performance.now()
    if (now - lastUpdateTime.current < ANIMATION_INTERVAL) return

    if (!isPlaying || !analyserData) {
      // 柱狀圖緩慢回落
      setHeights(prev => prev.map(height => Math.max(MIN_HEIGHT, height * 0.95)))
      lastUpdateTime.current = now
      return
    }

    const newHeights = calculateHeights(analyserData)
    // 加入平滑化處理
    setHeights(prev =>
      prev.map((currentHeight, index) =>
        currentHeight + (newHeights[index] - currentHeight) * SMOOTHING_FACTOR
      )
    )
    lastUpdateTime.current = now
  }, [isPlaying, analyserData, calculateHeights])

  useEffect(() => {
    let animationFrame: number

    const animate = () => {
      updateHeights()
      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [updateHeights])

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className="text-muted-foreground"
    >
      {heights.map((height, i) => {
        const x = 2 + (i * 4)
        const y = 12 - (Math.max(0, height) / 2)
        return (
          <rect
            key={i}
            x={x}
            y={Math.max(0, y)}
            width="2"
            height={Math.max(0, height)}
            rx="1"
            fill="currentColor"
          />
        )
      })}
    </svg>
  )
}