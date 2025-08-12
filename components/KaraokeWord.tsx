"use client"

import { useMemo, memo, useEffect, useState, useRef } from 'react'

interface WordData {
  start_time: number
  end_time: number
  word: string
}

interface KaraokeWordProps {
  word: WordData
  lineIsActive: boolean
  className?: string
}

// 獨立的狀態計算函數，用於比較和渲染
const calculateWordStatus = (word: WordData, currentTime: number, lineIsActive: boolean) => {
  const startTimeSeconds = word.start_time / 1000
  const endTimeSeconds = word.end_time / 1000
  const duration = (word.end_time - word.start_time) / 1000

  // 快速退出條件
  if (!lineIsActive || (word.start_time === 0 && word.end_time === 0)) {
    return { status: 'upcoming', progress: 0 }
  }
  
  if (currentTime < startTimeSeconds) {
    return { status: 'upcoming', progress: 0 }
  }
  
  if (currentTime >= endTimeSeconds) {
    return { status: 'played', progress: 100 }
  }
  
  // 正在播放中
  if (duration <= 0) {
    return { status: 'played', progress: 100 }
  }
  
  const elapsed = currentTime - startTimeSeconds
  const progressPercent = Math.max(0, Math.min((elapsed / duration) * 100, 100))
  
  return { status: 'playing', progress: progressPercent }
}

// 自定義 hook 用於管理內部時間更新
const useInternalTime = (lineIsActive: boolean) => {
  const [internalTime, setInternalTime] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!lineIsActive) {
      // 清理定時器
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // 每 10ms 更新一次時間，只在該行活躍時
    intervalRef.current = setInterval(() => {
      // 通過查詢 DOM 獲取音頻元素的當前時間，避免依賴 store
      const audioElement = document.querySelector('audio') as HTMLAudioElement
      if (audioElement && !audioElement.paused) {
        setInternalTime(audioElement.currentTime)
      }
    }, 10)

    // 立即同步一次
    const audioElement = document.querySelector('audio') as HTMLAudioElement
    if (audioElement) {
      setInternalTime(audioElement.currentTime)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [lineIsActive])

  return internalTime
}

const KaraokeWord = ({ word, lineIsActive, className = '' }: KaraokeWordProps) => {
  // 使用內部時間管理，避免 store 的高頻更新
  const currentTime = useInternalTime(lineIsActive)
  // 使用獨立函數計算狀態
  const { status, progress } = useMemo(() => 
    calculateWordStatus(word, currentTime, lineIsActive), 
    [word, currentTime, lineIsActive]
  )

  // 創建漸變樣式 - 性能優化版本
  const gradientStyle = useMemo(() => {
    // 快速計算漸變停止點
    const gradientStop = status === 'played' ? 100 : 
                         status === 'playing' ? progress : 0

    return {
      backgroundImage: `linear-gradient(90deg, 
        rgba(255, 255, 255, 1) 0%, 
        rgba(255, 255, 255, 1) ${gradientStop}%, 
        rgba(255, 255, 255, 0.4) ${gradientStop}%, 
        rgba(255, 255, 255, 0.4) 100%)`,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      // 移除過渡動畫以獲得更好的性能，依靠瀏覽器的 RAF 來處理平滑度
      willChange: status === 'playing' ? 'background-image' : 'auto',
    }
  }, [status, progress])

  return (
    <span
      className={`karaoke-word ${className}`}
      style={{
        ...gradientStyle,
        display: 'inline',
        whiteSpace: 'pre-wrap',
        fontWeight: 'inherit',
        fontSize: 'inherit',
        lineHeight: 'inherit',
      }}
    >
      {word.word}
    </span>
  )
}

// 智能比較函數 - 由於現在時間是內部管理的，大幅簡化比較邏輯
const areEqual = (prevProps: KaraokeWordProps, nextProps: KaraokeWordProps) => {
  // 如果單詞內容改變，必須重新渲染
  if (prevProps.word.word !== nextProps.word.word || 
      prevProps.word.start_time !== nextProps.word.start_time ||
      prevProps.word.end_time !== nextProps.word.end_time) {
    return false
  }

  // 如果行活躍狀態改變，必須重新渲染
  if (prevProps.lineIsActive !== nextProps.lineIsActive) {
    return false
  }

  // 如果 className 改變，必須重新渲染
  if (prevProps.className !== nextProps.className) {
    return false
  }

  // 其他情況下，時間更新由內部的 useInternalTime hook 處理
  // 這樣可以避免因為 store 中的 currentTime 頻繁更新導致的重新渲染
  return true
}

export default memo(KaraokeWord, areEqual)
