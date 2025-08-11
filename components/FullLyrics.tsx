import { AnimatePresence, motion } from "framer-motion"
import { X, Play, Pause, Heart, SkipBack, SkipForward, Volume2, Volume1, VolumeX } from "lucide-react"
import Meshbg from "@/components/meshbg"
import { usePlayerStore } from "@/lib/playerStore"
import { formatTime } from "@/components/ui/formatTime"
import { Progress } from "@/components/ui/Progress"
import { Slider } from "@/components/ui/slider"
import { useState, useCallback, useEffect, useRef, useLayoutEffect, useMemo } from "react"
import Link from "next/link"
import React from "react"

interface AudioPlayerInterface {
  seek: (time: number) => void
}

interface FullLyricsProps {
  open: boolean
  onClose: () => void
  imageUrl: string
  fps?: number
}

interface LyricLine {
  start_time: number
  end_time: number
  words: Array<{
    start_time: number
    end_time: number
    word: string
  }>
}

interface Artist {
  id: string | number
  name: string
}

interface DynamicCoverData {
  videoPlayUrl: string
  needTransition: boolean
}

const FullLyrics = ({ open, onClose, imageUrl, fps = 30 }: FullLyricsProps) => {
  const currentSong = usePlayerStore((state) => state.currentSong)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const lrc = usePlayerStore((state) => state.lrc)
  const yrc = usePlayerStore((state) => state.yrc)
  const tlyric = usePlayerStore((state) => state.tlyric)
  const showTranslatedLyrics = usePlayerStore((state) => state.showTranslatedLyrics)
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
  
  // Modified dynamic cover states
  const [dynamicCover, setDynamicCover] = useState<DynamicCoverData | null>(null)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [isLargeScreen, setIsLargeScreen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const lyricsContainerRef = useRef<HTMLDivElement>(null)
  const lyricsRefs = useRef<(HTMLDivElement | null)[]>([])
  const lyricHeightsRef = useRef<{ [key: number]: number }>({})
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const animationFrameRef = useRef<number>(0)
  const lastLyricIndexRef = useRef(currentLyricIndex)

  // Debounce helper
  const debounce = useCallback(<T extends unknown[]>(
    func: (...args: T) => void, 
    wait: number
  ) => {
    let timeout: NodeJS.Timeout
    return (...args: T) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }, [])

  // Memoize expensive calculations
  const getVisibleLyrics = useMemo(() => {
    if (!lrc || lrc.length === 0) return []

    const startIndex = Math.max(0, currentLyricIndex - 5)
    const endIndex = Math.min(lrc.length, currentLyricIndex + 6)

    return lrc.slice(startIndex, endIndex).map((line: import('@/lib/playerStore').LyricLine, index: number) => ({
      ...line,
      originalIndex: startIndex + index
    }))
  }, [lrc, currentLyricIndex])

  // Helper function to get translated lyric for a given index
  const getTranslatedLyric = useCallback((index: number): string => {
    if (!tlyric || tlyric.length === 0) return ''
    
    // Find the corresponding translated lyric by index
    if (index < tlyric.length && tlyric[index]?.words?.[0]?.word) {
      return tlyric[index].words[0].word
    }
    
    return ''
  }, [tlyric])

  // Calculate line offset with proper spacing
  const calculateLineOffset = useCallback((originalIndex: number) => {
    const TARGET_Y = window.innerHeight * 0.25  // 25% from top
    const LINE_GAP = window.innerWidth < 1024 ? 48 : 64
    const direction = originalIndex > currentLyricIndex ? 1 : -1

    if (originalIndex === currentLyricIndex) return TARGET_Y

    let offset = 0
    const start = Math.min(originalIndex, currentLyricIndex)
    const end = Math.max(originalIndex, currentLyricIndex)

    for (let i = start; i < end; i++) {
      const height = lyricHeightsRef.current[i] ||
        (window.innerWidth < 1024 ? 48 : 64)
      offset += height + LINE_GAP
    }

    return TARGET_Y + (offset * direction)
  }, [currentLyricIndex])

  // Calculate opacity
  const calculateOpacity = useCallback((index: number) => {
    if (index === currentLyricIndex) return 1
    const distance = Math.abs(index - currentLyricIndex)
    return Math.max(0.15, 1 - distance * 0.15)
  }, [currentLyricIndex])

  // Calculate blur
  const calculateBlur = useCallback((index: number) => {
    if (index === currentLyricIndex) return 0
    const distance = Math.abs(index - currentLyricIndex)
    return Math.min(distance * 2, 10)
  }, [currentLyricIndex])

  // Measure lyric heights and handle resizing
  useLayoutEffect(() => {
    // Debounced height measurement
    const measureHeights = debounce(() => {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = requestAnimationFrame(() => {
        getVisibleLyrics.forEach((line: LyricLine & { originalIndex: number }) => {
          const element = lyricsRefs.current[line.originalIndex]
          if (element) {
            const height = element.getBoundingClientRect().height
            lyricHeightsRef.current[line.originalIndex] = height
          }
        })
      })
    }, 100)

    measureHeights()

    // Setup resize observer
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(measureHeights)
    }

    if (lyricsContainerRef.current) {
      resizeObserverRef.current.observe(lyricsContainerRef.current)
    }

    return () => {
      resizeObserverRef.current?.disconnect()
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [getVisibleLyrics, currentLyricIndex, debounce])

  // Reset measurements when lyrics change
  useEffect(() => {
    lyricHeightsRef.current = {}
  }, [lrc])

  // Skip animation when rapidly changing lyrics
  const shouldAnimate = useMemo(() => {
    const diff = Math.abs(currentLyricIndex - lastLyricIndexRef.current)
    lastLyricIndexRef.current = currentLyricIndex
    return diff < 10 // Only animate for reasonable jumps
  }, [currentLyricIndex])

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

  const visibleLyricsWithStyles = useMemo(() => {
    return getVisibleLyrics.map((line: LyricLine & { originalIndex: number }) => ({
      ...line,
      offset: calculateLineOffset(line.originalIndex),
      opacity: calculateOpacity(line.originalIndex),
      blur: calculateBlur(line.originalIndex),
    }))
  }, [getVisibleLyrics, calculateLineOffset, calculateOpacity, calculateBlur])

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Fetch dynamic cover
  useEffect(() => {
    if (!open || !currentSong?.id || !isLargeScreen) {
      setDynamicCover(null)
      setIsVideoLoaded(false)
      return
    }

    const fetchDynamicCover = async () => {
      setIsVideoLoaded(false)
      try {
        const response = await fetch(`/api/image/dynamic?id=${currentSong.id}`)
        const data = await response.json()
        
        if (data.code === 200 && data.data?.videoPlayUrl) {
          setDynamicCover({
            videoPlayUrl: data.data.videoPlayUrl,
            needTransition: data.data.needTransition || false
          })
        } else {
          setDynamicCover(null)
        }
      } catch (error) {
        console.error('Failed to fetch dynamic cover:', error)
        setDynamicCover(null)
      }
    }

    fetchDynamicCover()
  }, [open, currentSong?.id, isLargeScreen])

  // Handle video playback sync with audio
  useEffect(() => {
    if (!videoRef.current || !dynamicCover || !isVideoLoaded) return

    if (isPlaying) {
      videoRef.current.play().catch(e => console.error('Video autoplay failed:', e))
    } else {
      videoRef.current.pause()
    }
  }, [isPlaying, dynamicCover, isVideoLoaded])

  // Handle video load event
  const handleVideoLoaded = useCallback(() => {
    setIsVideoLoaded(true)
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(e => console.error('Video play failed:', e))
    }
  }, [isPlaying])

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

          <div className="full-player relative z-10 w-full h-full flex flex-col lg:flex-row">
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

              {/* Desktop layout with dynamic cover */}
              <div className="hidden lg:flex lg:flex-col items-center lg:space-y-8">
                <div className="w-full lg:h-full max-h-[32.5rem] max-w-[32.5rem] relative">
                  {/* Always show static image as base */}
                  <img
                    src={imageUrl || "/placeholder.svg"}
                    alt={currentSong?.name || "Album Art"}
                    className="rounded-2xl shadow-2xl object-cover w-full h-full"
                  />
                  
                  {/* Video overlay when loaded */}
                  {dynamicCover && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                      <video
                        ref={videoRef}
                        src={dynamicCover.videoPlayUrl}
                        loop={dynamicCover.needTransition}
                        muted
                        playsInline
                        preload="auto"
                        className={`w-full h-full object-cover transition-opacity duration-500 ${
                          isVideoLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoadedData={handleVideoLoaded}
                        onError={() => {
                          console.error('Video failed to load')
                          setIsVideoLoaded(false)
                        }}
                      />
                    </div>
                  )}
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
                className="h-[calc(100dvh-120px)] lg:h-[100dvh] overflow-hidden relative"
                style={{
                  maskImage: window.innerWidth < 1024 ? 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 1) 8%, rgba(0, 0, 0, 1) 65%, rgba(0, 0, 0, 0) 100%)' : undefined,
                  WebkitMaskImage: window.innerWidth < 1024 ? 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(0, 0, 0, 1) 8%, rgba(0, 0, 0, 1) 65%, rgba(0, 0, 0, 0) 100%)' : undefined,
                }}
              >
                <AnimatePresence>
                  {visibleLyricsWithStyles.length > 0 ? (
                    visibleLyricsWithStyles.map((line: LyricLine & { originalIndex: number; offset: number; opacity: number; blur: number }) => {
                      const { originalIndex, words, offset, opacity, blur } = line
                      const text = words?.[0]?.word || ''
                      return (
                        <motion.div
                          key={`${originalIndex}-${text}`}
                          ref={(el) => {
                            lyricsRefs.current[originalIndex] = el
                          }}
                          initial={shouldAnimate ? {
                            y: offset,
                            opacity: 0,
                            filter: `blur(${blur}px)`,
                          } : false}
                          animate={{
                            y: offset,
                            opacity,
                            filter: `blur(${blur}px)`,
                          }}
                          transition={shouldAnimate ? {
                            type: "spring",
                            stiffness: 80,
                            damping: 18,
                            mass: 3,
                            delay: Math.abs(originalIndex - currentLyricIndex + 5) * 0.1
                          } : { duration: 0 }}
                          className="line absolute left-0 right-0 px-4"
                          style={{
                            transformOrigin: 'left center',
                          }}
                        >
                          <div
                            className={`line-main text-3xl lg:text-4xl xl:text-5xl font-black text-left whitespace-pre-wrap break-words max-w-full transition-colors duration-500 ${originalIndex === currentLyricIndex
                                ? "text-white"
                                : "text-white/40"
                              }`}
                            style={{ lineHeight: 1.3 }}
                          >
                            {text}
                          </div>
                          <div className="line-sub">
                            {showTranslatedLyrics && getTranslatedLyric(originalIndex) && (
                              <div
                                className={`text-lg lg:text-xl font-medium text-left whitespace-pre-wrap break-words max-w-full transition-colors duration-500 mt-1 ${originalIndex === currentLyricIndex
                                    ? "text-white/80"
                                    : "text-white/30"
                                  }`}
                                style={{ lineHeight: 1.2 }}
                              >
                                {getTranslatedLyric(originalIndex)}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/60 text-xl text-center">
                      No lyrics available
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(FullLyrics)