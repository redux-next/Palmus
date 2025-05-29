"use client"

import type React from "react"

import { AnimatePresence, motion } from "framer-motion"
import { X, Play, Pause, Heart, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from "lucide-react"
import Meshbg from "@/components/meshbg"
import { usePlayerStore } from "@/lib/playerStore"
import { formatTime } from "@/components/ui/formatTime"
import { Progress } from "@/components/ui/Progress"
import { Slider } from "@/components/ui/slider"
import { useState, useCallback, useEffect, useRef } from "react"
import Link from "next/link"

interface AudioPlayerInterface {
  seek: (time: number) => void
}

interface FullLyricsProps {
  open: boolean
  onClose: () => void
  imageUrl: string
  fps?: number
}

interface Artist {
  id: string | number
  name: string
}

interface LyricLine {
  text: string
  time?: number
}

const FullLyrics = ({ open, onClose, imageUrl, fps = 30 }: FullLyricsProps) => {
  const currentSong = usePlayerStore((state) => state.currentSong)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const lyrics = usePlayerStore((state) => state.lyrics)
  const currentLyricIndex = usePlayerStore((state) => state.currentLyricIndex)
  const playNextSong = usePlayerStore((state) => state.playNextSong)
  const playPreviousSong = usePlayerStore((state) => state.playPreviousSong)
  const isLiked = usePlayerStore((state) => (currentSong ? state.isLikedSong(currentSong.id) : false))
  const addLikedSong = usePlayerStore((state) => state.addLikedSong)
  const removeLikedSong = usePlayerStore((state) => state.removeLikedSong)
  const volume = usePlayerStore((state) => state.volume)
  const isMuted = usePlayerStore((state) => state.isMuted)
  const setVolume = usePlayerStore((state) => state.setVolume)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const lyricsContainerRef = useRef<HTMLDivElement>(null)
  const lyricsRefs = useRef<(HTMLDivElement | null)[]>([])

  // 計算透明度
  const calculateOpacity = useCallback(
    (index: number) => {
      if (index === currentLyricIndex) return 1
      const distance = Math.abs(index - currentLyricIndex)
      return Math.max(0.15, 1 - distance * 0.15)
    },
    [currentLyricIndex],
  )

  // 計算模糊效果
  const calculateBlur = useCallback(
    (index: number) => {
      if (index === currentLyricIndex) return 0
      const distance = Math.abs(index - currentLyricIndex)
      return Math.min(distance * 2, 10)
    },
    [currentLyricIndex],
  )

  useEffect(() => {
    if (lyricsContainerRef.current && lyrics && lyrics.length > 0 && currentLyricIndex >= 0) {
      const currentLyricElement = lyricsRefs.current[currentLyricIndex]
      if (currentLyricElement) {
        const lyricTop = currentLyricElement.offsetTop
        // Scroll so the current lyric is about 25% from the top of the container
        const containerHeight = lyricsContainerRef.current.clientHeight
        const targetScrollTop = lyricTop - containerHeight * 0.3

        // 平滑滾動到目標位置
        lyricsContainerRef.current.scrollTo({
          top: targetScrollTop,
          behavior: "smooth",
        })
      }
    }
  }, [currentLyricIndex, lyrics])

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentSong) return

    if (isLiked) {
      removeLikedSong(currentSong.id)
    } else {
      addLikedSong({
        id: currentSong.id,
        name: currentSong.name,
        artists: currentSong.artists,
        album: currentSong.album,
      })
    }
  }

  const handleSeek = (time: number) => {
    const audioPlayer = (window as { audioPlayer?: AudioPlayerInterface }).audioPlayer
    if (audioPlayer) {
      audioPlayer.seek(time)
    }
  }

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      setVolume(value[0])
    },
    [setVolume],
  )

  const handleVolumeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowVolumeSlider((prev) => !prev)
  }, [])

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={24} />
    if (volume < 0.5) return <Volume1 size={24} />
    return <Volume2 size={24} />
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="meshbg-fullscreen"
          layoutId="meshbg-fullscreen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="fixed inset-0 z-[999] bg-black/90"
        >
          <motion.div
            layoutId="meshbg-area"
            className="absolute inset-0"
            style={{ borderRadius: 0, overflow: "hidden" }}
          >
            <Meshbg imageUrl={imageUrl} fps={fps} className="brightness-[0.8]" />
          </motion.div>

          <button className="absolute top-6 right-6 z-50" onClick={onClose} title="Close" type="button">
            <X size={28} />
          </button>

          <div className="relative z-10 w-full h-full flex flex-col lg:flex-row">
            {/* 左側：圖片與控制區 (lg螢幕) / 上方：圖片與歌曲資訊 (小螢幕) */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12">
              {/* Mobile layout - Apple Music iOS style */}
              <div className="lg:hidden w-full flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 flex-shrink-0">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt={currentSong?.name || "Album Art"}
                    className="rounded-lg shadow-lg object-cover w-full h-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-white truncate">{currentSong?.name || ""}</h2>
                  <p className="text-sm text-white/70 truncate">
                    {currentSong?.artists?.map?.((artist: Artist, idx: number) => (
                      <span key={artist.id}>
                        {idx > 0 && " / "}
                        <Link href={`/artist/${artist.id}`} className="hover:underline">
                          {artist.name}
                        </Link>
                      </span>
                    ))}
                  </p>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden lg:flex lg:flex-col items-center lg:space-y-8">
                <div className="w-full lg:h-full max-h-[32.5rem] max-w-[32.5rem]">
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt={currentSong?.name || "Album Art"}
                    className="rounded-2xl shadow-2xl object-cover w-full h-full"
                  />
                </div>
                <div className="text-left space-y-2 w-full">
                  <h2 className="text-xl lg:text-xl font-bold text-white">{currentSong?.name || ""}</h2>
                  <p className="text-xl lg:text-xl text-white/70">
                    {currentSong?.artists?.map?.((artist: Artist, idx: number) => (
                      <span key={artist.id}>
                        {idx > 0 && " / "}
                        <Link href={`/artist/${artist.id}`} className="hover:underline">
                          {artist.name}
                        </Link>
                      </span>
                    ))}
                  </p>
                </div>

                {/* 控制按鈕區域 - 只在 lg 螢幕顯示 */}
                <div className="hidden lg:flex flex-col space-y-4 w-full max-w-lg">
                  <div className="space-y-2">
                    <Progress
                      value={currentTime}
                      max={duration}
                      onValueChange={handleSeek}
                      className="w-full"
                      dynamic={false}
                    />
                    <div className="flex justify-between text-sm text-neutral-300">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-6">
                    <div className="relative flex items-center">
                      <button className="p-2 text-white hover:text-neutral-300" onClick={handleVolumeClick}>
                        {getVolumeIcon()}
                      </button>
                      <AnimatePresence>
                        {showVolumeSlider && (
                          <motion.div
                            className="absolute bottom-full left-1/2 bg-background border rounded-lg px-4 py-1 w-32 h-8 shadow-lg flex items-center justify-center"
                            initial={{ opacity: 0, y: 10, x: "-50%", filter: "blur(5px)" }}
                            animate={{ opacity: 1, y: 0, x: "-50%", filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: 10, x: "-50%", filter: "blur(5px)" }}
                            transition={{ duration: 0.2 }}
                          >
                            <Slider
                              defaultValue={[1]}
                              max={1}
                              step={0.01}
                              value={[isMuted ? 0 : volume]}
                              onValueChange={handleVolumeChange}
                              orientation="horizontal"
                              className="w-full"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button className="p-2 text-white hover:text-neutral-300" onClick={playPreviousSong}>
                      <SkipBack size={24} />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="h-14 w-14 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200"
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>

                    <button className="p-2 text-white hover:text-neutral-300" onClick={playNextSong}>
                      <SkipForward size={24} />
                    </button>

                    <button
                      className={`p-2 ${isLiked ? "text-red-500" : "text-white hover:text-neutral-300"}`}
                      onClick={handleLikeToggle}
                    >
                      <Heart fill={isLiked ? "currentColor" : "none"} size={24} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 右側：歌詞區域 */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-4 lg:p-16 lg:pl-0 lg:py-0 relative">
              <div
                ref={lyricsContainerRef}
                className="h-[calc(100dvh-120px)] lg:h-[100dvh] overflow-y-auto relative pr-2 py-32 lg:py-64 scroll-hide"
                style={{
                  maskImage: window.innerWidth < 1024 ? 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 1) 8%, rgba(0, 0, 0, 1) 65%, rgba(0, 0, 0, 0) 100%)' : undefined,
                  WebkitMaskImage: window.innerWidth < 1024 ? 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 1) 8%, rgba(0, 0, 0, 1) 65%, rgba(0, 0, 0, 0) 100%)' : undefined,
                }}
              >
                {lyrics?.length > 0 ? (
                  lyrics.map((line: LyricLine, index: number) => (
                    <div
                      key={`${index}-${line.text}`}
                      ref={(el) => {
                        lyricsRefs.current[index] = el
                      }}
                      className="mb-8 lg:mb-16 px-2 lg:px-4"
                    >
                      <div
                        className={`line-main text-3xl lg:text-4xl xl:text-5xl font-black text-left whitespace-pre-wrap transition-all duration-500 ${
                          index === currentLyricIndex ? "text-white" : "text-white/40"
                        }`}
                        style={{
                          lineHeight: "1.3",
                          filter: `blur(${calculateBlur(index)}px)`,
                          opacity: calculateOpacity(index),
                        }}
                      >
                        {line.text}
                      </div>
                      <div className="line-sub">{/* leave it for now */}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-white/60 text-xl text-center">No lyrics available</div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FullLyrics
